import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoteFolderService, type NoteFolderTreeNode } from './note-folder.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import type { GqlNoteFolderResponse } from '../gql-types/note-folder.types';
import type { NoteFolder } from '../models';

describe('NoteFolderService', () => {
  let service: NoteFolderService;
  let mockPipeline: any;
  let mockGraphql: any;
  let mockImpersonation: any;

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGraphql = fakeGraphqlReadService();
    mockImpersonation = { effectiveUserId: vi.fn().mockReturnValue('user-123') };

    TestBed.configureTestingModule({
      providers: [
        NoteFolderService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGraphql },
        { provide: ImpersonationService, useValue: mockImpersonation },
      ],
    });

    service = TestBed.inject(NoteFolderService);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: createFolder writes via Pipeline with camelCase data
  // ──────────────────────────────────────────────────────────────────────────────

  it('should create a folder and push to Pipeline', async () => {
    const engagementId = 'eng-001';
    const folderData = {
      name: 'Test Folder',
      description: 'A test folder',
      parentId: null,
      accessLevel: 'boundary',
      sortOrder: 0,
      color: '#ff0000',
    };

    const result = await service.createFolder(engagementId, folderData);

    // Verify Pipeline was called
    expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
      'NoteFolder',
      expect.objectContaining({
        engagementId,
        name: 'Test Folder',
        description: 'A test folder',
        parentId: null,
        accessLevel: 'boundary',
        sortOrder: 0,
        color: '#ff0000',
      }),
      [],
      expect.any(String), // callSiteTag
    );

    // Verify returned data has Neon field names (snake_case)
    expect(result).toMatchObject({
      engagement_id: engagementId,
      name: 'Test Folder',
      parent_id: null,
      sort_order: 0,
      color: '#ff0000',
    });

    // Verify return is immediate (not awaiting pipeline)
    expect(result.id).toBeDefined();
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: getNoteFolderTree returns flat query result
  // ──────────────────────────────────────────────────────────────────────────────

  it('should query GraphQL with correct filters and pageSize', async () => {
    const engagementId = 'eng-001';

    const gqlFolders: GqlNoteFolderResponse[] = [
      {
        id: 'folder-1',
        engagementId,
        parentId: null,
        name: 'Root',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
    ];

    mockGraphql.query.mockResolvedValue({
      items: gqlFolders,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 1 },
    });

    await service.getNoteFolderTree(engagementId);

    // Verify GraphQL query was called with correct parameters
    expect(mockGraphql.query).toHaveBeenCalledWith(
      'NoteFolder',
      expect.arrayContaining(['id', 'engagementId', 'parentId', 'name', 'sortOrder']),
      expect.objectContaining({
        filters: { engagementId: `.eq.${engagementId}` },
        pageSize: 1000,
      }),
    );
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: getNoteFolderTree rebuilds hierarchical tree from flat query
  // ──────────────────────────────────────────────────────────────────────────────

  it('should rebuild hierarchical tree from flat folder list', async () => {
    const engagementId = 'eng-001';

    const gqlFolders: GqlNoteFolderResponse[] = [
      {
        id: 'folder-1',
        engagementId,
        parentId: null,
        name: 'Root 1',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 1,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-2',
        engagementId,
        parentId: null,
        name: 'Root 2',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 2,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-1-1',
        engagementId,
        parentId: 'folder-1',
        name: 'Child of Root 1',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-1-2',
        engagementId,
        parentId: 'folder-1',
        name: 'Another child',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 1,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
    ];

    mockGraphql.query.mockResolvedValue({
      items: gqlFolders,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
    });

    const tree = await service.getNoteFolderTree(engagementId);

    // Verify structure: 2 root folders
    expect(tree).toHaveLength(2);

    // Verify root folders are at top level (sorted by sortOrder)
    expect(tree[0].id).toBe('folder-1');
    expect(tree[1].id).toBe('folder-2');

    // Verify children are nested
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].id).toBe('folder-1-1');
    expect(tree[0].children![1].id).toBe('folder-1-2');

    // Verify Root 2 has no children
    expect(tree[1].children).toHaveLength(0);

    // Verify children are sorted by sortOrder
    expect(tree[0].children![0].sort_order).toBe(0);
    expect(tree[0].children![1].sort_order).toBe(1);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: updateFolder writes via Pipeline with new parentId
  // ──────────────────────────────────────────────────────────────────────────────

  it('should update folder and push to Pipeline', async () => {
    const folderId = 'folder-1';
    const updateData = {
      name: 'Renamed Folder',
      parentId: 'folder-2',
    };

    const result = await service.updateFolder(folderId, updateData);

    // Verify Pipeline was called
    expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
      'NoteFolder',
      expect.objectContaining({
        id: folderId,
        name: 'Renamed Folder',
        parentId: 'folder-2',
      }),
      [],
      expect.any(String), // callSiteTag
    );

    // Verify returned data has Neon field names
    expect(result).toMatchObject({
      id: folderId,
      name: 'Renamed Folder',
      parent_id: 'folder-2',
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: deleteFolder soft-deletes (archived: true)
  // ──────────────────────────────────────────────────────────────────────────────

  it('should soft-delete folder by setting archived: true', async () => {
    const folderId = 'folder-1';

    await service.deleteFolder(folderId);

    // Verify Pipeline was called with dateDeleted set
    expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
      'NoteFolder',
      expect.objectContaining({
        id: folderId,
        dateDeleted: expect.any(String),
      }),
      [],
      expect.any(String), // callSiteTag
    );
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: tree rebuild handles cycles gracefully
  // ──────────────────────────────────────────────────────────────────────────────

  it('should handle cycles gracefully without stack overflow', async () => {
    const engagementId = 'eng-001';

    // Create circular reference: A.parentId = B, B.parentId = A
    const gqlFolders: GqlNoteFolderResponse[] = [
      {
        id: 'folder-a',
        engagementId,
        parentId: 'folder-b',
        name: 'Folder A',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-b',
        engagementId,
        parentId: 'folder-a',
        name: 'Folder B',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
    ];

    mockGraphql.query.mockResolvedValue({
      items: gqlFolders,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    });

    // This should not throw — cycle detection prevents stack overflow
    const tree = await service.getNoteFolderTree(engagementId);

    // Verify tree is built (may be empty if all folders are in cycle)
    expect(tree).toBeDefined();
    expect(Array.isArray(tree)).toBe(true);

    // Cycle detected, so no root folders returned (both have parents)
    expect(tree).toHaveLength(0);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: empty folder list returns empty tree
  // ──────────────────────────────────────────────────────────────────────────────

  it('should return empty tree when no folders exist', async () => {
    const engagementId = 'eng-001';

    mockGraphql.query.mockResolvedValue({
      items: [],
      page: { pageNumber: 1, pageSize: 1000, totalCount: 0 },
    });

    const tree = await service.getNoteFolderTree(engagementId);

    expect(tree).toHaveLength(0);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Test: deep nesting is preserved
  // ──────────────────────────────────────────────────────────────────────────────

  it('should preserve deep hierarchy (unrestricted depth)', async () => {
    const engagementId = 'eng-001';

    const gqlFolders: GqlNoteFolderResponse[] = [
      {
        id: 'folder-1',
        engagementId,
        parentId: null,
        name: 'Level 1',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-2',
        engagementId,
        parentId: 'folder-1',
        name: 'Level 2',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-3',
        engagementId,
        parentId: 'folder-2',
        name: 'Level 3',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
      {
        id: 'folder-4',
        engagementId,
        parentId: 'folder-3',
        name: 'Level 4',
        createdByZerobiasUserId: 'user-123',
        accessLevel: 'boundary',
        sortOrder: 0,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
    ];

    mockGraphql.query.mockResolvedValue({
      items: gqlFolders,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
    });

    const tree = await service.getNoteFolderTree(engagementId);

    // Navigate deep tree
    expect(tree[0].id).toBe('folder-1');
    expect(tree[0].children![0].id).toBe('folder-2');
    expect(tree[0].children![0].children![0].id).toBe('folder-3');
    expect(tree[0].children![0].children![0].children![0].id).toBe('folder-4');
  });
});
