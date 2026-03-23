import { Injectable, inject } from '@angular/core';
import { NoteFolderService, type NoteFolderTreeNode } from './note-folder.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { NOTE_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { NoteFolder, NoteFolderWithCounts, Note } from '../models';
import type { GqlNoteResponse } from '../gql-types/note.types';

/** A folder node with children for tree rendering. */
export interface FolderTreeNode {
  folder: NoteFolderWithCounts;
  children: FolderTreeNode[];
  level: number;
  expanded: boolean;
}

/**
 * NoteHierarchyService — MIGRATED TO GQL/PIPELINE
 *
 * Delegates folder CRUD to NoteFolderService (GQL reads, Pipeline writes).
 * No longer uses SmeMartDbService (Neon direct).
 */
@Injectable({ providedIn: 'root' })
export class NoteHierarchyService {
  private readonly folderService = inject(NoteFolderService);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);

  // ── Folder CRUD ──

  async createFolder(
    engagementId: string,
    name: string,
    parentId: string | null = null,
    description?: string,
    color?: string | null,
  ): Promise<NoteFolder> {
    return this.folderService.createFolder(engagementId, {
      name,
      parentId,
      description,
      color: color ?? null,
    });
  }

  async updateFolder(folderId: string, data: { name?: string; description?: string; color?: string | null }): Promise<NoteFolder> {
    return this.folderService.updateFolder(folderId, data);
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.folderService.deleteFolder(folderId);
  }

  /**
   * Ensures a notebook has at least one child folder.
   * Creates a "General" folder if the notebook has no children.
   * Returns the created folder or null if one already exists.
   *
   * Guard: If any folder named "General" already exists for this engagement,
   * skip creation. This prevents duplicates when the parentId link isn't
   * working yet (schema PR pending).
   */
  async ensureDefaultFolder(engagementId: string, notebookId: string): Promise<NoteFolder | null> {
    const tree = await this.getFolderTree(engagementId);

    // Guard: don't create if a "General" folder already exists anywhere in the tree
    const hasGeneral = this.findNodeByName(tree, 'General');
    if (hasGeneral) return null;

    // Find the notebook node and check if it has children
    const notebook = this.findNodeById(tree, notebookId);
    if (notebook && notebook.children.length > 0) return null;
    return this.createFolder(engagementId, 'General', notebookId);
  }

  // ── Tree building ──

  async getFolderTree(engagementId: string): Promise<FolderTreeNode[]> {
    const gqlTree = await this.folderService.getNoteFolderTree(engagementId);
    return this.transformTree(gqlTree, 0);
  }

  /**
   * Transform NoteFolderTreeNode[] (from NoteFolderService) to FolderTreeNode[]
   * (expected by UI components). Adds level, expanded, and count defaults.
   */
  private transformTree(nodes: NoteFolderTreeNode[], level: number): FolderTreeNode[] {
    return nodes.map(node => {
      const children = node.children ? this.transformTree(node.children, level + 1) : [];
      const folder: NoteFolderWithCounts = {
        ...node,
        // Counts not available from GQL (were from Neon VIEW) — default to 0
        note_count: 0,
        subfolder_count: children.length,
      };
      return {
        folder,
        children,
        level,
        expanded: level === 0,
      };
    });
  }

  // ── Move operations ──

  async moveNote(noteId: string, newFolderId: string | null): Promise<Note> {
    // Push update via Pipeline (fire-and-forget)
    const gqlData: Record<string, unknown> = {
      id: noteId,
      folderId: newFolderId,
      updatedAt: new Date().toISOString(),
    };
    this.pipelineWrite.pushEntity('Note', gqlData).catch(err => {
      console.error('[NoteHierarchyService] Failed to move note:', err);
    });

    // Return optimistically with minimal data
    return { id: noteId, folder_id: newFolderId } as Note;
  }

  async moveFolder(folderId: string, newParentId: string | null): Promise<NoteFolder> {
    return this.folderService.updateFolder(folderId, { parentId: newParentId });
  }

  // ── Cross-notebook helpers ──

  /** Check if candidateDescendantId is a descendant of ancestorId in the tree. */
  isDescendant(tree: FolderTreeNode[], ancestorId: string, candidateDescendantId: string): boolean {
    const ancestor = this.findNodeById(tree, ancestorId);
    if (!ancestor) return false;

    const checkDescendants = (nodes: FolderTreeNode[]): boolean => {
      for (const n of nodes) {
        if (n.folder.id === candidateDescendantId) return true;
        if (checkDescendants(n.children)) return true;
      }
      return false;
    };
    return checkDescendants(ancestor.children);
  }

  /**
   * Recreate a folder's subfolder structure under a new parent.
   * Returns a map of oldFolderId → newFolderId for note migration.
   */
  async recreateFolderStructure(
    engagementId: string,
    sourceFolderId: string,
    targetParentId: string,
  ): Promise<Map<string, string>> {
    const tree = await this.getFolderTree(engagementId);
    const idMap = new Map<string, string>();

    const sourceNode = this.findNodeById(tree, sourceFolderId);
    if (!sourceNode) return idMap;

    // Recursively create folder structure
    const recreate = async (node: FolderTreeNode, newParentId: string): Promise<void> => {
      const created = await this.createFolder(
        engagementId,
        node.folder.name,
        newParentId,
        node.folder.description ?? undefined,
        null, // No color inheritance
      );
      idMap.set(node.folder.id, created.id);

      for (const child of node.children) {
        await recreate(child, created.id);
      }
    };

    await recreate(sourceNode, targetParentId);
    return idMap;
  }

  /**
   * Move all notes from one folder to another.
   */
  async moveAllNotes(fromFolderId: string, toFolderId: string, engagementId: string): Promise<void> {
    // Query notes in the source folder via GQL
    const result = await this.graphqlRead.query<GqlNoteResponse>(
      'Note',
      ['id'],
      {
        filters: {
          folderId: `.eq.${fromFolderId}`,
        },
        pageSize: 500,
      },
    );

    const notes = result.items || [];
    for (const note of notes) {
      await this.moveNote((note as { id: string }).id, toFolderId);
    }
  }

  // ── Private helpers ──

  private findNodeByName(nodes: FolderTreeNode[], name: string): FolderTreeNode | null {
    for (const n of nodes) {
      if (n.folder.name === name) return n;
      const found = this.findNodeByName(n.children, name);
      if (found) return found;
    }
    return null;
  }

  private findNodeById(nodes: FolderTreeNode[], id: string): FolderTreeNode | null {
    for (const n of nodes) {
      if (n.folder.id === id) return n;
      const found = this.findNodeById(n.children, id);
      if (found) return found;
    }
    return null;
  }
}
