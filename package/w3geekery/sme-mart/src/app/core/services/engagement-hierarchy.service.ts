import { Injectable, inject, signal } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SuggestTagBody, TagSearchBody } from '@zerobias-com/platform-sdk';
import type { TagView, TaskExtended } from '@zerobias-com/platform-sdk';
import { UUID, Nmtoken } from '@zerobias-org/types-core-js';

// ---------------------------------------------------------------------------
// Tag naming conventions for the Project → Boundary → Task hierarchy
// ---------------------------------------------------------------------------
//
// Kevin's platform model:
//   Project → Boundary → Task → SubTask
//
// SME Mart tag encoding:
//   ENG-{word}-{word}          = Engagement tag (already exists — maps to Boundary)
//   PROJ-{word}-{word}         = Project wrapper (groups boundaries)
//   TASK-{word}-{word}         = Task-level grouping tag (optional, for categorization)
//
// Tag type: 'service-segment' (existing Nmtoken on the platform)
//
// Hierarchy is encoded by tagging ZB resources:
//   - A Project tag is attached to one or more Tasks (boundaries)
//   - An Engagement tag (ENG-*) identifies the boundary-level relationship
//   - Task/SubTask hierarchy uses relates_to links (existing mechanism)
//
// This service provides:
//   1. Tag CRUD for hierarchy levels
//   2. Tag-to-hierarchy parsing
//   3. Resource tagging operations
//   4. Hierarchy breadcrumb computation
// ---------------------------------------------------------------------------

/** Hierarchy level in the Project → Boundary → Task model */
export type HierarchyLevel = 'project' | 'boundary' | 'task' | 'subtask';

/** Parsed hierarchy tag */
export interface HierarchyTag {
  id: string;
  name: string;
  level: HierarchyLevel;
  description?: string;
}

/** Breadcrumb item for navigation */
export interface HierarchyBreadcrumb {
  label: string;
  level: HierarchyLevel;
  tagId?: string;
  taskId?: string;
  /** True if this is the current/active level */
  active?: boolean;
}

/** Tag prefix → hierarchy level mapping */
const TAG_PREFIX_MAP: Record<string, HierarchyLevel> = {
  'PROJ-': 'project',
  'ENG-': 'boundary',
  'TASK-': 'task',
};

/** BIP39-style word list (shared with engagement-lifecycle.service.ts) */
const WORDS = [
  'tiger', 'falcon', 'otter', 'raven', 'cobra', 'panda', 'eagle', 'shark',
  'bison', 'crane', 'viper', 'finch', 'moose', 'gecko', 'heron', 'manta',
  'amber', 'azure', 'coral', 'ivory', 'onyx', 'ruby', 'slate', 'jade',
  'ocean', 'ridge', 'delta', 'maple', 'storm', 'grove', 'cliff', 'brook',
  'prism', 'vault', 'forge', 'latch', 'nexus', 'relay', 'shard', 'spark',
  'bold', 'keen', 'calm', 'true', 'brave', 'clear', 'prime',
  'pixel', 'sigma', 'theta', 'omega', 'gamma', 'alpha', 'kappa',
  'mesa', 'fjord', 'basin', 'ledge', 'summit', 'strait', 'harbor', 'glade',
  'atlas', 'tempo', 'chord', 'grain', 'lotus', 'plume', 'relic', 'scope',
];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generateTag(prefix: string): string {
  const w1 = randomWord();
  let w2 = randomWord();
  while (w2 === w1) w2 = randomWord();
  return `${prefix}${w1}-${w2}`;
}

@Injectable({ providedIn: 'root' })
export class EngagementHierarchyService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /** Cache of known tags by ID */
  private readonly tagCache = new Map<string, TagView>();

  // ---------------------------------------------------------------------------
  // Tag name parsing
  // ---------------------------------------------------------------------------

  /** Determine hierarchy level from a tag name */
  parseLevel(tagName: string): HierarchyLevel | null {
    for (const [prefix, level] of Object.entries(TAG_PREFIX_MAP)) {
      if (tagName.startsWith(prefix)) return level;
    }
    return null;
  }

  /** Parse a tag into a HierarchyTag (or null if not a recognized hierarchy tag) */
  parseTag(tag: TagView): HierarchyTag | null {
    const name = tag.name?.toString() || '';
    const level = this.parseLevel(name);
    if (!level) return null;
    return {
      id: tag.id?.toString() || '',
      name,
      level,
      description: tag.description?.toString(),
    };
  }

  /** Check if a tag name is a project-level tag */
  isProjectTag(name: string): boolean {
    return name.startsWith('PROJ-');
  }

  /** Check if a tag name is a boundary/engagement tag */
  isBoundaryTag(name: string): boolean {
    return name.startsWith('ENG-');
  }

  // ---------------------------------------------------------------------------
  // Tag generation
  // ---------------------------------------------------------------------------

  /** Generate a project tag name: PROJ-word-word */
  generateProjectTag(): string {
    return generateTag('PROJ-');
  }

  /** Generate a task-level tag name: TASK-word-word */
  generateTaskTag(): string {
    return generateTag('TASK-');
  }

  // ---------------------------------------------------------------------------
  // Tag CRUD via ZB Platform
  // ---------------------------------------------------------------------------

  /** Create a new hierarchy tag on the platform */
  async createTag(name: string, description: string, resourceId?: string): Promise<TagView | null> {
    try {
      const tagBody = new SuggestTagBody(
        name,
        description,
        new Nmtoken('service-segment'),
        resourceId ? new UUID(resourceId) : undefined,
      );
      const result = await this.clientApi.auditmationPlatform
        .getTagApi()
        .suggestTag(tagBody);
      // suggestTag returns a Task (async operation). The tag is created inline.
      // We need to look it up by name after creation.
      return this.findTagByName(name);
    } catch (err) {
      console.warn(`[Hierarchy] Failed to create tag "${name}":`, err);
      return null;
    }
  }

  /** Create a project tag and optionally tag a resource with it */
  async createProjectTag(title: string, resourceId?: string): Promise<TagView | null> {
    const tagName = this.generateProjectTag();
    return this.createTag(
      tagName,
      `SME Mart project: ${title}`,
      resourceId,
    );
  }

  /** Find a tag by exact name */
  async findTagByName(name: string): Promise<TagView | null> {
    try {
      const result = await this.clientApi.auditmationPlatform
        .getTagApi()
        .listTags(1, 10, [new Nmtoken('service-segment')] as any, name);
      const tags = result.items || [];
      const match = tags.find((t: any) => t.name === name);
      if (match) {
        this.tagCache.set(match.id?.toString() || '', match);
      }
      return match || null;
    } catch (err) {
      console.warn(`[Hierarchy] Failed to find tag "${name}":`, err);
      return null;
    }
  }

  /** Get a tag by ID (cached). Uses searchTags since TagApi has no getById. */
  async getTag(tagId: string): Promise<TagView | null> {
    const cached = this.tagCache.get(tagId);
    if (cached) return cached;
    try {
      const body = new TagSearchBody();
      (body as any).ids = [new UUID(tagId)];
      const result = await this.clientApi.auditmationPlatform
        .getTagApi()
        .searchTags(1, 1, undefined, body);
      const tag = result.items?.[0] || null;
      if (tag) this.tagCache.set(tagId, tag as any);
      return tag as any;
    } catch (err) {
      console.warn(`[Hierarchy] Failed to get tag ${tagId}:`, err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Resource tagging
  // ---------------------------------------------------------------------------

  /** Tag a ZB resource (task, boundary, etc.) with one or more tags */
  async tagResource(resourceId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    try {
      await this.clientApi.auditmationPlatform
        .getResourceApi()
        .tagResource(
          new UUID(resourceId),
          tagIds.map(id => new UUID(id)),
        );
    } catch (err) {
      console.warn(`[Hierarchy] Failed to tag resource ${resourceId}:`, err);
      throw err;
    }
  }

  /** Remove a tag from a ZB resource */
  async untagResource(resourceId: string, tagId: string): Promise<void> {
    try {
      await this.clientApi.auditmationPlatform
        .getResourceApi()
        .untagResource(new UUID(resourceId), new UUID(tagId));
    } catch (err) {
      console.warn(`[Hierarchy] Failed to untag resource ${resourceId}:`, err);
      throw err;
    }
  }

  /** Get all tags on a ZB resource */
  async getResourceTags(resourceId: string): Promise<TagView[]> {
    try {
      return await this.clientApi.auditmationPlatform
        .getResourceApi()
        .getTagsForResource(new UUID(resourceId));
    } catch (err) {
      console.warn(`[Hierarchy] Failed to get tags for resource ${resourceId}:`, err);
      return [];
    }
  }

  /** Get hierarchy tags on a resource (filtered to recognized hierarchy prefixes) */
  async getResourceHierarchyTags(resourceId: string): Promise<HierarchyTag[]> {
    const tags = await this.getResourceTags(resourceId);
    return tags
      .map(t => this.parseTag(t))
      .filter((ht): ht is HierarchyTag => ht !== null);
  }

  // ---------------------------------------------------------------------------
  // Hierarchy breadcrumbs
  // ---------------------------------------------------------------------------

  /**
   * Build breadcrumbs for an engagement from its work request data + ZB tags.
   *
   * The breadcrumb trail shows: Project → Boundary → Task → SubTask
   * Not all levels will be present — we show what we have.
   */
  async buildBreadcrumbs(opts: {
    engagementTag?: string | null;
    zerobiasTagId?: string | null;
    zerobiasTaskId?: string | null;
    title?: string;
  }): Promise<HierarchyBreadcrumb[]> {
    const crumbs: HierarchyBreadcrumb[] = [];

    // If we have a ZB task, check its tags for project-level grouping
    if (opts.zerobiasTaskId) {
      const hierarchyTags = await this.getResourceHierarchyTags(opts.zerobiasTaskId);

      // Add project-level breadcrumb if present
      const projectTag = hierarchyTags.find(ht => ht.level === 'project');
      if (projectTag) {
        crumbs.push({
          label: projectTag.name,
          level: 'project',
          tagId: projectTag.id,
        });
      }
    }

    // Boundary level = the engagement itself
    if (opts.engagementTag) {
      crumbs.push({
        label: opts.engagementTag,
        level: 'boundary',
        tagId: opts.zerobiasTagId || undefined,
        active: !opts.zerobiasTaskId, // Active if no task drill-down
      });
    }

    // Task level = the master ZB task
    if (opts.zerobiasTaskId) {
      crumbs.push({
        label: opts.title || 'Task',
        level: 'task',
        taskId: opts.zerobiasTaskId,
        active: true,
      });
    }

    return crumbs;
  }

  /**
   * Build breadcrumbs for a subtask view (when drilling into a subtask from
   * the task list). Adds the subtask as a 4th crumb level.
   */
  buildSubtaskBreadcrumbs(
    parentCrumbs: HierarchyBreadcrumb[],
    subtask: TaskExtended,
  ): HierarchyBreadcrumb[] {
    // Deactivate all parent crumbs
    const crumbs = parentCrumbs.map(c => ({ ...c, active: false }));

    crumbs.push({
      label: subtask.name?.toString() || 'Subtask',
      level: 'subtask',
      taskId: subtask.id?.toString(),
      active: true,
    });

    return crumbs;
  }

  // ---------------------------------------------------------------------------
  // Hierarchy level display helpers
  // ---------------------------------------------------------------------------

  /** Human-readable label for a hierarchy level */
  levelLabel(level: HierarchyLevel): string {
    switch (level) {
      case 'project': return 'Project';
      case 'boundary': return 'Boundary';
      case 'task': return 'Task';
      case 'subtask': return 'SubTask';
    }
  }

  /** Material icon for a hierarchy level */
  levelIcon(level: HierarchyLevel): string {
    switch (level) {
      case 'project': return 'folder_special';
      case 'boundary': return 'handshake';
      case 'task': return 'task_alt';
      case 'subtask': return 'subdirectory_arrow_right';
    }
  }
}
