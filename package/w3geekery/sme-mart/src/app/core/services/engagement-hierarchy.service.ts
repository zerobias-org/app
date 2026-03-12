import { Injectable, inject, signal } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { TagView } from '@zerobias-com/hydra-sdk';
import type { TaskExtended } from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';
import { SmeMartTagService } from './sme-mart-tag.service';
import {
  isProtectedTag,
  parseHierarchyLevel,
  stripPrefix,
} from '../utils/tag-prefix.util';

// ---------------------------------------------------------------------------
// Tag naming conventions for the Project → Boundary → Task hierarchy
// ---------------------------------------------------------------------------
//
// New convention (Plan 029/039):
//   sme-mart.eng.{word}-{word}    = Engagement tag (maps to Boundary)
//   sme-mart.proj.{word}-{word}   = Project wrapper (groups boundaries)
//   sme-mart.task.{word}-{word}   = Task-level grouping tag
//
// Old convention (deprecated):
//   ENG-{word}-{word}             = Engagement tag
//   PROJ-{word}-{word}            = Project wrapper
//   TASK-{word}-{word}            = Task-level grouping tag
//
// Both conventions are recognized for parsing. Only new convention is used
// for creation (via SmeMartTagService / danaOld.Tag.createTag).
// ---------------------------------------------------------------------------

/** Hierarchy level in the Project → Boundary → Task model */
export type HierarchyLevel = 'project' | 'boundary' | 'task' | 'subtask';

/** Parsed hierarchy tag */
export interface HierarchyTag {
  id: string;
  name: string;
  level: HierarchyLevel;
  displayName: string;
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

@Injectable({ providedIn: 'root' })
export class EngagementHierarchyService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly tagService = inject(SmeMartTagService);

  /** Cache of known tags by ID */
  private readonly tagCache = new Map<string, TagView>();

  // ---------------------------------------------------------------------------
  // Tag name parsing (supports both old and new conventions)
  // ---------------------------------------------------------------------------

  /** Determine hierarchy level from a tag name */
  parseLevel(tagName: string): HierarchyLevel | null {
    return parseHierarchyLevel(tagName) as HierarchyLevel | null;
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
      displayName: stripPrefix(name),
      description: tag.description?.toString(),
    };
  }

  /** Check if a tag name is a project-level tag */
  isProjectTag(name: string): boolean {
    return name.toLowerCase().startsWith('sme-mart.proj.') || name.startsWith('PROJ-');
  }

  /** Check if a tag name is a boundary/engagement tag */
  isBoundaryTag(name: string): boolean {
    return name.toLowerCase().startsWith('sme-mart.eng.') || name.startsWith('ENG-');
  }

  // ---------------------------------------------------------------------------
  // Tag generation (new convention only)
  // ---------------------------------------------------------------------------

  /** Generate a project tag name: sme-mart.proj.word-word */
  generateProjectTag(): string {
    return this.tagService.generateProjectTag();
  }

  /** Generate a task-level tag name: sme-mart.task.word-word */
  generateTaskTag(): string {
    return this.tagService.generateTaskTag();
  }

  // ---------------------------------------------------------------------------
  // Tag CRUD via SmeMartTagService (danaOld.Tag.createTag — direct creation)
  // ---------------------------------------------------------------------------

  /** Create a new hierarchy tag on the platform */
  async createTag(name: string, description: string, resourceId?: string): Promise<TagView | null> {
    const tag = await this.tagService.createTag(name, description);
    if (!tag) return null;

    // Tag the resource if provided
    if (resourceId && tag.id) {
      try {
        await this.tagResource(resourceId, [tag.id.toString()]);
      } catch (err) {
        console.warn(`[Hierarchy] Created tag but failed to assign to resource:`, err);
      }
    }

    return tag;
  }

  /** Create a project tag and optionally tag a resource with it */
  async createProjectTag(title: string, resourceId?: string): Promise<TagView | null> {
    const tagName = this.generateProjectTag();
    return this.createTag(tagName, `SME Mart project: ${title}`, resourceId);
  }

  /** Search tags by partial name (for autocomplete). Uses searchTags POST for better filtering. */
  async searchTagsByName(search: string, limit = 20): Promise<TagView[]> {
    const results = await this.tagService.searchTags(search, limit);
    return results as unknown as TagView[];
  }

  /** Find a tag by exact name */
  async findTagByName(name: string): Promise<TagView | null> {
    const tag = await this.tagService.findTagByName(name);
    if (tag) this.tagCache.set(tag.id?.toString() || '', tag);
    return tag;
  }

  /** Get a tag by ID (cached). Uses hydra.Tag.getTag for direct lookup. */
  async getTag(tagId: string): Promise<TagView | null> {
    const cached = this.tagCache.get(tagId);
    if (cached) return cached;
    try {
      const tag = await this.clientApi.hydraClient
        .getTagApi()
        .getTag(new UUID(tagId));
      if (tag) this.tagCache.set(tagId, tag as TagView);
      return tag as TagView || null;
    } catch (err) {
      console.warn(`[Hierarchy] Failed to get tag ${tagId}:`, err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Resource tagging (delegates to SmeMartTagService)
  // ---------------------------------------------------------------------------

  /** Tag a ZB resource (task, boundary, etc.) with one or more tags */
  async tagResource(resourceId: string, tagIds: string[]): Promise<void> {
    await this.tagService.assignTag(resourceId, tagIds);
  }

  /** Remove a tag from a ZB resource */
  async untagResource(resourceId: string, tagId: string): Promise<void> {
    await this.tagService.removeTag(resourceId, tagId);
  }

  /** Get all tags on a ZB resource */
  async getResourceTags(resourceId: string): Promise<TagView[]> {
    return this.tagService.getResourceTags(resourceId);
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
          label: projectTag.displayName,
          level: 'project',
          tagId: projectTag.id,
        });
      }
    }

    // Boundary level = the engagement itself
    if (opts.engagementTag) {
      crumbs.push({
        label: stripPrefix(opts.engagementTag),
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
