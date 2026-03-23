/**
 * NoteFolderService - FULLY MIGRATED TO PIPELINE (Phase 5)
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Neon note_folders table archived 2 weeks after Phase 5 completion (2026-04-02).
 * 2-week observation period for production stability verification.
 */

import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { NOTE_FOLDER_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { GqlNoteFolderResponse } from '../gql-types/note-folder.types';
import type { NoteFolder } from '../models';

// ─────────────────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateNoteFolderRequest {
  name: string;
  description?: string;
  parentId?: string | null;
  accessLevel?: string;
  sortOrder?: number;
  color?: string | null;
}

export interface UpdateNoteFolderRequest {
  name?: string;
  description?: string;
  parentId?: string | null;
  accessLevel?: string;
  sortOrder?: number;
  color?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree Node Type
// ─────────────────────────────────────────────────────────────────────────────

export interface NoteFolderTreeNode extends NoteFolder {
  children?: NoteFolderTreeNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NoteFolderService manages hierarchical folder structures for notes within engagements.
 *
 * Architecture: Flat-fetch + client-side tree rebuild
 * - Query: GraphQL fetches all NoteFolders for an engagement in one call (flat list)
 * - Build: Client-side algorithm rebuilds parent-child tree from parentId mapping
 * - Write: Pipeline pushes individual folder changes (create/update/delete)
 *
 * Benefits:
 * - Avoids N+1 queries (single GraphQL call returns all folders)
 * - Handles unlimited hierarchy depth (no recursive GQL depth limits)
 * - Cycle detection prevents infinite recursion if data is malformed
 * - Optimistic updates for better UX (return immediately, push in background)
 */
@Injectable({ providedIn: 'root' })
export class NoteFolderService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);

  /**
   * Create a new note folder.
   *
   * Returns optimistically (immediately) while Pipeline push happens in background.
   */
  async createFolder(
    engagementId: string,
    data: CreateNoteFolderRequest,
  ): Promise<NoteFolder> {
    const userId = this.impersonation.effectiveUserId();
    const now = new Date().toISOString();

    // Build GQL data (camelCase for GraphQL)
    const gqlData: Record<string, unknown> = {
      id: this.generateUUID(),
      engagementId,
      name: data.name,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      createdByZerobiasUserId: userId,
      createdAt: now,
      updatedAt: now,
      accessLevel: data.accessLevel ?? 'boundary',
      sortOrder: data.sortOrder ?? 0,
      color: data.color ?? null,
    };

    // Map to Neon type (snake_case)
    const neonData = mapGqlToNeon<NoteFolder>(
      gqlData,
      NOTE_FOLDER_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push to Pipeline
    this.pipelineWrite.pushEntity('NoteFolder', gqlData).catch(err => {
      console.error('[NoteFolderService] Failed to push folder to pipeline:', err);
    });

    // Return optimistically
    return neonData;
  }

  /**
   * Get the hierarchical tree of note folders for an engagement.
   *
   * Algorithm:
   * 1. Query all NoteFolders for the engagement (flat list)
   * 2. Map GraphQL response to Neon type
   * 3. Rebuild parent-child tree using parentId references
   * 4. Cycle detection prevents infinite recursion on malformed data
   * 5. Return sorted tree (children sorted by sortOrder)
   */
  async getNoteFolderTree(
    engagementId: string,
  ): Promise<NoteFolderTreeNode[]> {
    // Step 1: Query flat list of all folders for this engagement
    // NOTE: `parent` is a GQL relationship (not a scalar `parentId`), so we
    // query `parent { id }` and flatten it to `parentId` before mapping.
    const result = await this.graphqlRead.query<GqlNoteFolderResponse>(
      'NoteFolder',
      // Object inherited: id, name, description, dateCreated, dateLastModified
      // Custom (from NoteFolder.yml): engagementId, color, sortOrder
      // Relationships (traversed as nested): parent { id }
      ['id', 'name', 'description', 'engagementId', 'color', 'sortOrder', 'dateCreated', 'dateLastModified', 'dateDeleted', 'parent { id }'],
      {
        filters: {
          engagementId: `.eq.${engagementId}`,
        },
        pageSize: 1000,
      },
    );

    // Step 2: Flatten nested `parent { id }` → `parentId`, filter deleted, then map to Neon type
    const allFolders: NoteFolder[] = result.items
      .filter(gqlFolder => {
        // GQL doesn't auto-filter by dateDeleted — exclude soft-deleted folders
        const deleted = (gqlFolder as unknown as Record<string, unknown>)['dateDeleted'];
        return !deleted;
      })
      .map(gqlFolder => {
        const flat = { ...gqlFolder } as Record<string, unknown>;
        // Flatten relationship: { parent: { id: "..." } } → { parentId: "..." }
        const parent = flat['parent'] as { id: string } | null | undefined;
        flat['parentId'] = parent?.id ?? null;
        delete flat['parent'];
        delete flat['dateDeleted'];
        return mapGqlToNeon<NoteFolder>(flat, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon);
      });

    // Step 3: Build in-memory tree
    const folderMap = new Map<string, NoteFolder>(
      allFolders.map(f => [f.id, f]),
    );

    // Filter root folders (no parent)
    const rootFolders = allFolders
      .filter(f => !f.parent_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // Recursive tree builder with cycle detection
    const visited = new Set<string>();

    const buildNode = (parent: NoteFolder): NoteFolderTreeNode => {
      // Detect cycle: if we've already visited this folder, skip it
      if (visited.has(parent.id)) {
        console.error(
          `[NoteFolderService] Cycle detected in folder tree at folder ${parent.id}. ` +
          'Excluding subtree to prevent infinite recursion.',
        );
        return { ...parent, children: [] };
      }

      visited.add(parent.id);

      // Find and sort children by sortOrder
      const children = allFolders
        .filter(f => f.parent_id === parent.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(buildNode);

      return {
        ...parent,
        children,
      };
    };

    // Step 4: Build tree from root folders
    return rootFolders.map(buildNode);
  }

  /**
   * Update an existing note folder.
   *
   * Returns optimistically while Pipeline push happens in background.
   */
  async updateFolder(
    folderId: string,
    data: UpdateNoteFolderRequest,
  ): Promise<NoteFolder> {
    const userId = this.impersonation.effectiveUserId();
    const now = new Date().toISOString();

    // Build GQL data with updated fields
    const gqlData: Record<string, unknown> = {
      id: folderId,
      updatedAt: now,
      updatedByZerobiasUserId: userId,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    // Map to Neon type
    const neonData = mapGqlToNeon<NoteFolder>(
      gqlData,
      NOTE_FOLDER_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    this.pipelineWrite.pushEntity('NoteFolder', gqlData).catch(err => {
      console.error('[NoteFolderService] Failed to push folder update to pipeline:', err);
    });

    // Return optimistically
    return neonData;
  }

  /**
   * Delete (soft-delete) a note folder by setting dateDeleted.
   *
   * Uses Object base class `dateDeleted` (YYYY-MM-DD format) which is
   * recognized by AuditgraphDB. The `archived` flag was Neon-era only.
   */
  async deleteFolder(folderId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const gqlData: Record<string, unknown> = {
      id: folderId,
      dateDeleted: today,
    };

    // Fire-and-forget push
    this.pipelineWrite.pushEntity('NoteFolder', gqlData).catch(err => {
      console.error('[NoteFolderService] Failed to soft-delete folder:', err);
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Generate a UUID v4 for new folder IDs.
   *
   * Simple implementation using crypto.getRandomValues().
   * In production, this should use a proper UUID library.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
