import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import {
  NewTask, NewTaskLink, UpdateTask,
  type TaskExtended, type ResourceLink, type SchemasLinkType,
} from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';

@Injectable({ providedIn: 'root' })
export class EngagementTasksService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /** Cached relates_to link type ID — discovered once per session */
  private relatesToLinkTypeId: UUID | null = null;

  /** Fetch the master task with full details (links, transitions, etc.) */
  async getTask(taskId: string): Promise<TaskExtended> {
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    return taskApi.get(new UUID(taskId));
  }

  /**
   * List tasks linked to the master task via `relates_to`.
   * 1. Query resource links on the master task filtered to type=task
   * 2. Fetch each linked task by ID
   */
  async listRelatedTasks(masterTaskId: string): Promise<TaskExtended[]> {
    const resourceApi = this.clientApi.auditmationPlatform.getResourceApi();
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    const masterUUID = new UUID(masterTaskId);

    const linksResult = await resourceApi.listResourceLinks(
      masterUUID,
      1,      // pageNumber
      100,    // pageSize
      true,   // inflate
      undefined, // fromType
      undefined, // toType
      ['task'], // types — only task resources
    );

    const links: ResourceLink[] = linksResult.items || [];
    if (links.length === 0) return [];

    // Collect unique linked task IDs (could be fromResource or toResource)
    const taskIds = new Set<string>();
    for (const link of links) {
      const fromId = link.fromResource.toString();
      const toId = link.toResource.toString();
      // The "other" end of the link is the related task
      if (fromId === masterTaskId) {
        taskIds.add(toId);
      } else {
        taskIds.add(fromId);
      }
    }

    // Fetch each task in parallel
    const tasks = await Promise.all(
      Array.from(taskIds).map(id =>
        taskApi.get(new UUID(id)).catch(err => {
          console.warn(`[EngagementTasks] Failed to fetch task ${id}:`, err);
          return null;
        }),
      ),
    );

    return tasks
      .filter((t): t is TaskExtended => t !== null)
      .sort((a, b) => {
        const aTime = a.created instanceof Date ? a.created.getTime() : new Date(a.created).getTime();
        const bTime = b.created instanceof Date ? b.created.getTime() : new Date(b.created).getTime();
        return aTime - bTime;
      });
  }

  /**
   * Create a sub-task and link it to the master task via `relates_to`.
   */
  async createSubTask(masterTaskId: string, opts: {
    name: string;
    description?: string;
    activityId: string;
    boundaryId?: string;
    priority?: number;
  }): Promise<TaskExtended> {
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    const masterUUID = new UUID(masterTaskId);

    // Discover the relates_to link type ID
    const linkTypeId = await this.getRelatesToLinkTypeId(masterTaskId);

    const newTask = new NewTask(
      new UUID(opts.activityId),  // activityId (required)
      [],                          // approvers
      [],                          // notified
      [new NewTaskLink(masterUUID, linkTypeId)], // links — relate to master
      undefined,                   // ownerId
      opts.name,                   // name
      opts.description,            // description
      opts.priority,               // priority
      opts.boundaryId ? new UUID(opts.boundaryId) : undefined, // boundaryId
    );

    return taskApi.create(newTask);
  }

  /** Transition a task to a new status via its workflow */
  async transitionTask(taskId: string, transitionId: string): Promise<TaskExtended> {
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    const updateTask = new UpdateTask(
      undefined,              // name
      undefined,              // description
      new UUID(transitionId), // transitionId
    );
    return taskApi.update(new UUID(taskId), updateTask);
  }

  /**
   * Discover the `relates_to` link type ID for task→task resources.
   * Caches after first call.
   */
  private async getRelatesToLinkTypeId(taskId: string): Promise<UUID> {
    if (this.relatesToLinkTypeId) return this.relatesToLinkTypeId;

    const resourceApi = this.clientApi.auditmationPlatform.getResourceApi();
    const result = await resourceApi.listResourceLinkTypes(new UUID(taskId), 1, 50);
    const linkTypes: SchemasLinkType[] = result.items || [];

    // Find relates_to link type where both sides are 'task'
    const relatesToType = linkTypes.find(lt =>
      lt.fromLinkType?.toString() === 'relates_to' &&
      lt.fromType?.toString() === 'task' &&
      lt.toType?.toString() === 'task',
    );

    if (!relatesToType) {
      // Fallback: find any relates_to link type
      const fallback = linkTypes.find(lt =>
        lt.fromLinkType?.toString() === 'relates_to',
      );
      if (fallback) {
        this.relatesToLinkTypeId = fallback.id;
        return fallback.id;
      }
      throw new Error('No relates_to link type found for tasks. Contact platform admin.');
    }

    this.relatesToLinkTypeId = relatesToType.id;
    return relatesToType.id;
  }
}
