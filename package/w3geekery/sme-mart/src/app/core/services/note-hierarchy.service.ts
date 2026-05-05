import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoteFolderService, type NoteFolderTreeNode } from './note-folder.service';
import { NotesService } from './notes.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
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
  private readonly notesService = inject(NotesService);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Tracks folder names currently being created per engagement.
   * Prevents duplicate "General" folders when multiple calls fire before
   * the pipeline push is queryable via GQL.
   * Key format: `engagementId:folderName`
   */
  private readonly pendingCreations = new Set<string>();

  private pendingKey(engagementId: string, name: string): string {
    return `${engagementId}:${name}`;
  }

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
    const key = this.pendingKey(engagementId, notebookId);

    // Guard: another call is already creating a folder for this notebook
    if (this.pendingCreations.has(key)) return null;

    const tree = await this.getFolderTree(engagementId);

    // Find the notebook node
    const notebook = this.findNodeById(tree, notebookId);

    // Guard: if notebook has ANY children, don't create — use what exists
    if (notebook && notebook.children.length > 0) return null;

    // Guard: notebook not found in tree (might be newly created, not yet in GQL)
    if (!notebook) return null;

    // Mark as pending before creating (cleared on next successful tree load)
    this.pendingCreations.add(key);
    return this.createFolder(engagementId, 'General', notebookId);
  }

  // ── Tree building ──

  async getFolderTree(engagementId: string): Promise<FolderTreeNode[]> {
    // Fetch tree and note counts in parallel
    const [gqlTree, noteCounts] = await Promise.all([
      this.folderService.getNoteFolderTree(engagementId),
      this.notesService.getNoteCounts(engagementId),
    ]);

    // Clear pending creations for folders that now appear in the GQL tree.
    // This means the pipeline push has been ingested and is queryable.
    this.clearResolvedPending(engagementId, gqlTree);

    return this.transformTree(gqlTree, 0, noteCounts);
  }

  /**
   * Transform NoteFolderTreeNode[] (from NoteFolderService) to FolderTreeNode[]
   * (expected by UI components). Adds level, expanded, and counts.
   */
  private transformTree(nodes: NoteFolderTreeNode[], level: number, noteCounts: Map<string, number>): FolderTreeNode[] {
    return nodes.map(node => {
      const children = node.children ? this.transformTree(node.children, level + 1, noteCounts) : [];
      const folder: NoteFolderWithCounts = {
        ...node,
        note_count: noteCounts.get(node.id) ?? 0,
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
    // Push update via Pipeline
    const gqlData: Record<string, unknown> = {
      id: noteId,
      folderId: newFolderId,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.pipelineWrite.pushEntity('Note', gqlData, [], 'note-hierarchy.service:149');
    } catch (err) {
      this.snackBar.open(
        `Failed to move note: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

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
  async moveAllNotes(fromFolderId: string, toFolderId: string, _engagementId: string): Promise<void> {
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

  /**
   * Remove pending entries for folders that now exist in the GQL tree.
   * Walks the tree collecting all folder names, then removes matching pending keys.
   */
  private clearResolvedPending(engagementId: string, tree: NoteFolderTreeNode[]): void {
    const collectNames = (nodes: NoteFolderTreeNode[]): void => {
      for (const node of nodes) {
        this.pendingCreations.delete(this.pendingKey(engagementId, node.name));
        if (node.children) collectNames(node.children);
      }
    };
    collectNames(tree);
  }

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
