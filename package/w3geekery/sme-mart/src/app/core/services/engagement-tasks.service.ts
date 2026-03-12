import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import {
  NewTask, NewTaskLink, UpdateTask,
  type TaskExtended,
} from '@zerobias-com/platform-sdk';
import type { ResourceLink, LinkType } from '@zerobias-com/hydra-sdk';
import { UUID } from '@zerobias-org/types-core-js';

// ---------------------------------------------------------------------------
// Task→Task link types discovered from ZeroBias platform (CI environment)
// ---------------------------------------------------------------------------
// child_of / parent_to:   cf72be7c-1403-11f1-845f-dff3645d0fe7
//   - fromLinkInherit: true — child tasks inherit parent's resource links
//     (boundary membership, tags, etc.), eliminating manual tagging
// blocked_by / blocks:    cf73b304-1403-11f1-845f-8b0a517a3fa6
//   - Task dependency tracking
// relates_to:             2694788c-721e-11ef-a886-5357e9e8bc3b
//   - Generic association (still available but not used for parent/child)
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class EngagementTasksService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /** Cached child_of link type ID — discovered once per session */
  private childOfLinkTypeId: UUID | null = null;

  /** Cached blocked_by link type ID — discovered once per session */
  private blockedByLinkTypeId: UUID | null = null;

  /** All link types — cached after first discovery */
  private linkTypesCache: LinkType[] | null = null;

  /** Fetch the master task with full details (links, transitions, etc.) */
  async getTask(taskId: string): Promise<TaskExtended> {
    const taskApi = this.clientApi.platformClient.getTaskApi();
    return taskApi.get(new UUID(taskId));
  }

  /**
   * List child tasks linked to the parent task via `child_of`.
   * 1. Discover the child_of link type
   * 2. Query resource links on the parent task filtered to type=task
   * 3. Filter to only child_of / parent_to links
   * 4. Fetch each linked task by ID
   */
  async listChildTasks(parentTaskId: string): Promise<TaskExtended[]> {
    const resourceApi = this.clientApi.hydraClient.getResourceApi();
    const taskApi = this.clientApi.platformClient.getTaskApi();
    const parentUUID = new UUID(parentTaskId);

    // Ensure link types are discovered so we can filter
    await this.discoverLinkTypes(parentTaskId);
    const childOfId = this.childOfLinkTypeId?.toString();

    const linksResult = await resourceApi.listResourceLinks(
      parentUUID,
      1,      // pageNumber
      100,    // pageSize
      true,   // inflate
      undefined, // fromType
      undefined, // toType
      ['task'], // types — only task resources
    );

    const links: ResourceLink[] = linksResult.items || [];
    if (links.length === 0) return [];

    // Filter to child_of / parent_to links only
    const childLinks = childOfId
      ? links.filter(link => link.linkType?.toString() === childOfId)
      : links; // fallback: show all task links if link type not found

    if (childLinks.length === 0) return [];

    // Collect unique child task IDs — only where this task is the parent (fromResource)
    // child_of links: fromResource=parent, toResource=child
    const taskIds = new Set<string>();
    for (const link of childLinks) {
      const fromId = link.fromResource.toString();
      const toId = link.toResource.toString();
      if (fromId === parentTaskId) {
        taskIds.add(toId);
      }
      // Skip links where this task is the child (toResource) — that's the parent, not a child
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
   * Create a sub-task and link it to the parent task via `child_of`.
   * The child_of link has fromLinkInherit: true, so the subtask automatically
   * inherits the parent's resource links (boundary, tags, etc.).
   */
  async createSubTask(parentTaskId: string, opts: {
    name: string;
    description?: string;
    activityId: string;
    boundaryId?: string;
    priority?: number;
  }): Promise<TaskExtended> {
    const taskApi = this.clientApi.platformClient.getTaskApi();
    const parentUUID = new UUID(parentTaskId);

    // Discover the child_of link type ID
    const linkTypeId = await this.getChildOfLinkTypeId(parentTaskId);

    const newTask = new NewTask(
      new UUID(opts.activityId),  // activityId (required)
      [],                          // approvers
      [],                          // notified
      [new NewTaskLink(parentUUID, linkTypeId)], // links — child_of parent
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
    const taskApi = this.clientApi.platformClient.getTaskApi();
    const updateTask = new UpdateTask(
      undefined,              // name
      undefined,              // description
      new UUID(transitionId), // transitionId
    );
    return taskApi.update(new UUID(taskId), updateTask);
  }

  // ---------------------------------------------------------------------------
  // Link type discovery
  // ---------------------------------------------------------------------------

  /**
   * Discover and cache all task→task link types.
   * Called once per session; subsequent calls are no-ops.
   */
  private async discoverLinkTypes(taskId: string): Promise<void> {
    if (this.linkTypesCache) return;

    const resourceApi = this.clientApi.hydraClient.getResourceApi();
    const result = await resourceApi.listResourceLinkTypes(new UUID(taskId), 1, 50);
    this.linkTypesCache = result.items || [];

    // Cache child_of link type
    const childOf = this.linkTypesCache.find(lt =>
      lt.fromLinkType?.toString() === 'child_of' &&
      lt.fromType?.toString() === 'task' &&
      lt.toType?.toString() === 'task',
    );
    if (childOf) this.childOfLinkTypeId = childOf.id;

    // Cache blocked_by link type
    const blockedBy = this.linkTypesCache.find(lt =>
      lt.fromLinkType?.toString() === 'blocked_by' &&
      lt.fromType?.toString() === 'task' &&
      lt.toType?.toString() === 'task',
    );
    if (blockedBy) this.blockedByLinkTypeId = blockedBy.id;
  }

  /**
   * Get the `child_of` link type ID for task→task resources.
   * Falls back to `relates_to` if child_of is not available.
   */
  private async getChildOfLinkTypeId(taskId: string): Promise<UUID> {
    await this.discoverLinkTypes(taskId);

    if (this.childOfLinkTypeId) return this.childOfLinkTypeId;

    // Fallback: try relates_to (older platform versions)
    const relatesToType = this.linkTypesCache?.find(lt =>
      lt.fromLinkType?.toString() === 'relates_to' &&
      lt.fromType?.toString() === 'task' &&
      lt.toType?.toString() === 'task',
    );

    if (relatesToType) {
      console.warn('[EngagementTasks] child_of link type not found, falling back to relates_to');
      return relatesToType.id;
    }

    throw new Error('No child_of or relates_to link type found for tasks. Contact platform admin.');
  }

  /**
   * Get the `blocked_by` link type ID for task→task resources.
   * Returns null if not available on this platform version.
   */
  async getBlockedByLinkTypeId(taskId: string): Promise<UUID | null> {
    await this.discoverLinkTypes(taskId);
    return this.blockedByLinkTypeId;
  }
}
