import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import { ImpersonationService } from './impersonation.service';
import type { NoteFolder, NoteFolderWithCounts, Note } from '../models';

/** A folder node with children for tree rendering. */
export interface FolderTreeNode {
  folder: NoteFolderWithCounts;
  children: FolderTreeNode[];
  level: number;
  expanded: boolean;
}

@Injectable({ providedIn: 'root' })
export class NoteHierarchyService {
  private readonly db = inject(SmeMartDbService);
  private readonly impersonation = inject(ImpersonationService);

  // ── Folder CRUD ──

  async createFolder(
    engagementId: string,
    name: string,
    parentId: string | null = null,
    description?: string,
    color?: string | null,
  ): Promise<NoteFolder> {
    const userId = this.impersonation.effectiveUserId();
    return this.db.createRow<NoteFolder>('note_folders', {
      engagement_id: engagementId,
      parent_id: parentId,
      name,
      description: description || null,
      color: color ?? null,
      created_by_zerobias_user_id: userId,
    });
  }

  async updateFolder(folderId: string, data: { name?: string; description?: string; color?: string | null }): Promise<NoteFolder> {
    return this.db.updateRow<NoteFolder>('note_folders', folderId, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.db.deleteRow('note_folders', folderId);
  }

  /**
   * Ensures a notebook has at least one child folder.
   * Creates a "General" folder if the notebook has no children.
   * Returns the created folder or null if one already exists.
   */
  async ensureDefaultFolder(engagementId: string, notebookId: string): Promise<NoteFolder | null> {
    const result = await this.db.searchRows<NoteFolderWithCounts>(
      'v_note_folders_with_counts',
      `(&(engagement_id=${engagementId})(parent_id=${notebookId}))`,
      { pageNumber: 1, pageSize: 1 },
    );
    if (result.items && result.items.length > 0) return null;
    return this.createFolder(engagementId, 'General', notebookId);
  }

  // ── Tree building ──

  async getFolderTree(engagementId: string): Promise<FolderTreeNode[]> {
    const result = await this.db.searchRows<NoteFolderWithCounts>(
      'v_note_folders_with_counts',
      `(engagement_id=${engagementId})`,
      { pageNumber: 1, pageSize: 200 },
    );
    const folders = result.items || [];
    return this.buildTree(folders);
  }

  private buildTree(folders: NoteFolderWithCounts[], parentId: string | null = null, level = 0): FolderTreeNode[] {
    return folders
      .filter(f => f.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map(folder => ({
        folder,
        children: this.buildTree(folders, folder.id, level + 1),
        level,
        expanded: level === 0,
      }));
  }

  // ── Move operations ──

  async moveNote(noteId: string, newFolderId: string | null): Promise<Note> {
    return this.db.updateRow<Note>('notes', noteId, {
      folder_id: newFolderId,
      updated_at: new Date().toISOString(),
    });
  }

  async moveFolder(folderId: string, newParentId: string | null): Promise<NoteFolder> {
    return this.db.updateRow<NoteFolder>('note_folders', folderId, {
      parent_id: newParentId,
      updated_at: new Date().toISOString(),
    });
  }

  // ── Cross-notebook helpers ──

  /** Check if candidateDescendantId is a descendant of ancestorId in the tree. */
  isDescendant(tree: FolderTreeNode[], ancestorId: string, candidateDescendantId: string): boolean {
    const findNode = (nodes: FolderTreeNode[], id: string): FolderTreeNode | null => {
      for (const n of nodes) {
        if (n.folder.id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
      }
      return null;
    };

    const ancestor = findNode(tree, ancestorId);
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

    const findNode = (nodes: FolderTreeNode[], id: string): FolderTreeNode | null => {
      for (const n of nodes) {
        if (n.folder.id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
      }
      return null;
    };

    const sourceNode = findNode(tree, sourceFolderId);
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
    const result = await this.db.searchRows<Note>(
      'notes',
      `(&(engagement_id=${engagementId})(folder_id=${fromFolderId}))`,
      { pageNumber: 1, pageSize: 500 },
    );
    const notes = result.items || [];
    for (const note of notes) {
      await this.moveNote(note.id, toFolderId);
    }
  }
}
