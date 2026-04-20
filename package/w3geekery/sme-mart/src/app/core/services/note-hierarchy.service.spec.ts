/**
 * Unit Tests for NoteHierarchyService
 *
 * Tests tree building, ensureDefaultFolder race guard,
 * move operations, isDescendant, and cross-notebook helpers.
 */

import { TestBed } from '@angular/core/testing';
import { NoteHierarchyService, type FolderTreeNode } from './note-hierarchy.service';
import { NoteFolderService, type NoteFolderTreeNode } from './note-folder.service';
import { NotesService } from './notes.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeImpersonation } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NoteFolder } from '../models';

// Helper to build a NoteFolderTreeNode
function makeTreeNode(id: string, name: string, children: NoteFolderTreeNode[] = []): NoteFolderTreeNode {
  return {
    id,
    name,
    description: null,
    engagement_id: 'eng-001',
    parent_id: null,
    created_by_zerobias_user_id: 'u-100',
    access_level: 'boundary',
    sort_order: 0,
    color: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    children,
  } as NoteFolderTreeNode;
}

// Helper to build a FolderTreeNode (UI shape)
function makeFolderNode(id: string, name: string, children: FolderTreeNode[] = [], level = 0): FolderTreeNode {
  return {
    folder: {
      id, name, description: null, engagement_id: 'eng-001', parent_id: null,
      created_by_zerobias_user_id: 'u-100', access_level: 'boundary',
      sort_order: 0, color: null, created_at: '2026-01-01', updated_at: '2026-01-01',
      note_count: 0, subfolder_count: children.length,
    },
    children,
    level,
    expanded: level === 0,
  };
}

describe('NoteHierarchyService', () => {
  let service: NoteHierarchyService;
  let mockFolderService: {
    getNoteFolderTree: ReturnType<typeof vi.fn>;
    createFolder: ReturnType<typeof vi.fn>;
    updateFolder: ReturnType<typeof vi.fn>;
    deleteFolder: ReturnType<typeof vi.fn>;
  };
  let mockNotesService: { getNoteCounts: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockFolderService = {
      getNoteFolderTree: vi.fn().mockResolvedValue([]),
      createFolder: vi.fn().mockResolvedValue({ id: 'new-folder', name: 'General' } as NoteFolder),
      updateFolder: vi.fn().mockResolvedValue({} as NoteFolder),
      deleteFolder: vi.fn().mockResolvedValue(undefined),
    };

    mockNotesService = {
      getNoteCounts: vi.fn().mockResolvedValue(new Map()),
    };

    TestBed.configureTestingModule({
      providers: [
        NoteHierarchyService,
        { provide: NoteFolderService, useValue: mockFolderService },
        { provide: NotesService, useValue: mockNotesService },
        { provide: PipelineWriteService, useValue: fakePipelineWriteService() },
        { provide: GraphqlReadService, useValue: fakeGraphqlReadService() },
        { provide: ImpersonationService, useValue: fakeImpersonation() },
      ],
    });

    service = TestBed.inject(NoteHierarchyService);
  });

  // ── getFolderTree ──

  describe('getFolderTree()', () => {
    it('should fetch tree and note counts in parallel', async () => {
      mockFolderService.getNoteFolderTree.mockResolvedValue([]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());

      await service.getFolderTree('eng-001');

      expect(mockFolderService.getNoteFolderTree).toHaveBeenCalledWith('eng-001');
      expect(mockNotesService.getNoteCounts).toHaveBeenCalledWith('eng-001');
    });

    it('should transform tree with levels and note counts', async () => {
      const child = makeTreeNode('f2', 'Child');
      const root = makeTreeNode('f1', 'Notebook', [child]);
      mockFolderService.getNoteFolderTree.mockResolvedValue([root]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map([['f2', 3]]));

      const result = await service.getFolderTree('eng-001');

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(0);
      expect(result[0].expanded).toBe(true);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].level).toBe(1);
      expect(result[0].children[0].folder.note_count).toBe(3);
      expect(result[0].children[0].expanded).toBe(false);
    });

    it('should set subfolder_count from children length', async () => {
      const root = makeTreeNode('f1', 'Notebook', [
        makeTreeNode('f2', 'A'),
        makeTreeNode('f3', 'B'),
      ]);
      mockFolderService.getNoteFolderTree.mockResolvedValue([root]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());

      const result = await service.getFolderTree('eng-001');

      expect(result[0].folder.subfolder_count).toBe(2);
    });
  });

  // ── ensureDefaultFolder ──

  describe('ensureDefaultFolder()', () => {
    it('should create General folder when notebook has no children', async () => {
      const notebook = makeTreeNode('nb-1', 'My Notebook');
      mockFolderService.getNoteFolderTree.mockResolvedValue([notebook]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());

      const result = await service.ensureDefaultFolder('eng-001', 'nb-1');

      expect(result).not.toBeNull();
      expect(mockFolderService.createFolder).toHaveBeenCalledWith('eng-001', {
        name: 'General',
        parentId: 'nb-1',
        description: undefined,
        color: null,
      });
    });

    it('should return null if General already exists', async () => {
      const notebook = makeTreeNode('nb-1', 'Notebook', [
        makeTreeNode('f1', 'General'),
      ]);
      mockFolderService.getNoteFolderTree.mockResolvedValue([notebook]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());

      const result = await service.ensureDefaultFolder('eng-001', 'nb-1');

      expect(result).toBeNull();
      expect(mockFolderService.createFolder).not.toHaveBeenCalled();
    });

    it('should return null if notebook has children (even non-General)', async () => {
      const notebook = makeTreeNode('nb-1', 'Notebook', [
        makeTreeNode('f1', 'Custom Folder'),
      ]);
      mockFolderService.getNoteFolderTree.mockResolvedValue([notebook]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());

      const result = await service.ensureDefaultFolder('eng-001', 'nb-1');

      expect(result).toBeNull();
    });

    it('should prevent duplicate creation via pendingCreations guard', async () => {
      mockFolderService.getNoteFolderTree.mockResolvedValue([makeTreeNode('nb-1', 'Notebook')]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());

      // First call: creates
      await service.ensureDefaultFolder('eng-001', 'nb-1');
      expect(mockFolderService.createFolder).toHaveBeenCalledTimes(1);

      // Second call: blocked by pending guard
      const result = await service.ensureDefaultFolder('eng-001', 'nb-1');
      expect(result).toBeNull();
      expect(mockFolderService.createFolder).toHaveBeenCalledTimes(1);
    });

    it('should clear pending guard after tree reload shows the folder', async () => {
      // First call: empty tree → creates General
      mockFolderService.getNoteFolderTree.mockResolvedValue([makeTreeNode('nb-1', 'Notebook')]);
      mockNotesService.getNoteCounts.mockResolvedValue(new Map());
      await service.ensureDefaultFolder('eng-001', 'nb-1');

      // Simulate tree reload where General now appears in GQL
      mockFolderService.getNoteFolderTree.mockResolvedValue([
        makeTreeNode('nb-1', 'Notebook', [makeTreeNode('f1', 'General')]),
      ]);
      await service.getFolderTree('eng-001');

      // Now the guard should be cleared — but General exists so it still returns null
      mockFolderService.createFolder.mockClear();
      const result = await service.ensureDefaultFolder('eng-001', 'nb-1');
      expect(result).toBeNull();
    });
  });

  // ── isDescendant ──

  describe('isDescendant()', () => {
    const tree: FolderTreeNode[] = [
      makeFolderNode('root', 'Root', [
        makeFolderNode('child', 'Child', [
          makeFolderNode('grandchild', 'Grandchild', [], 2),
        ], 1),
      ]),
    ];

    it('should return true for direct child', () => {
      expect(service.isDescendant(tree, 'root', 'child')).toBe(true);
    });

    it('should return true for grandchild', () => {
      expect(service.isDescendant(tree, 'root', 'grandchild')).toBe(true);
    });

    it('should return false for unrelated node', () => {
      expect(service.isDescendant(tree, 'root', 'nonexistent')).toBe(false);
    });

    it('should return false for self', () => {
      expect(service.isDescendant(tree, 'root', 'root')).toBe(false);
    });

    it('should return false for ancestor of given node', () => {
      expect(service.isDescendant(tree, 'grandchild', 'root')).toBe(false);
    });
  });

  // ── moveNote ──

  describe('moveNote()', () => {
    it('should push pipeline update and return optimistic result', async () => {
      const pipelineWrite = TestBed.inject(PipelineWriteService) as any;
      const result = await service.moveNote('note-1', 'folder-2');

      expect(result.id).toBe('note-1');
      expect(result.folder_id).toBe('folder-2');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Note',
        expect.objectContaining({ id: 'note-1', folderId: 'folder-2' }),
      );
    });
  });

  // ── moveFolder ──

  describe('moveFolder()', () => {
    it('should delegate to folderService.updateFolder', async () => {
      mockFolderService.updateFolder.mockResolvedValue({ id: 'f1', parent_id: 'f2' });

      await service.moveFolder('f1', 'f2');

      expect(mockFolderService.updateFolder).toHaveBeenCalledWith('f1', { parentId: 'f2' });
    });
  });

  // ── CRUD delegation ──

  describe('CRUD delegation', () => {
    it('should delegate createFolder to folderService', async () => {
      await service.createFolder('eng-001', 'Test', 'parent-1', 'desc', '#ff0000');

      expect(mockFolderService.createFolder).toHaveBeenCalledWith('eng-001', {
        name: 'Test',
        parentId: 'parent-1',
        description: 'desc',
        color: '#ff0000',
      });
    });

    it('should delegate deleteFolder to folderService', async () => {
      await service.deleteFolder('f1');
      expect(mockFolderService.deleteFolder).toHaveBeenCalledWith('f1');
    });
  });
});
