import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoteFolderService } from './note-folder.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlNoteFolderResponse } from '../gql-types/note-folder.types';

describe('NoteFolderService', () => {
  let service: NoteFolderService;
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGraphql: ReturnType<typeof fakeGraphqlReadService>;
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGraphql = fakeGraphqlReadService();
    mockImpersonation = { effectiveUserId: vi.fn().mockReturnValue('user-123') };
    mockSnackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        NoteFolderService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGraphql },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: MatSnackBar, useValue: mockSnackBar },
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

  // ──────────────────────────────────────────────────────────────────────────────
  // Phase 20 Wave 3: Kill-network rejection paths
  //
  // For each remediated callSite (note-folder.service:107, :230, :260) verify
  // that a Pipeline rejection (a) surfaces a MatSnackBar to the user and
  // (b) re-throws so the caller observes the failure. This is the
  // "snackbar reflects actual outcome" property — the Wave 2 contract.
  // ──────────────────────────────────────────────────────────────────────────────

  describe('Pipeline rejection error surface (Phase 20 Wave 3)', () => {
    it('createFolder: surfaces snackbar and re-throws on Pipeline rejection (note-folder.service:107)', async () => {
      const networkErr = new Error('Network unreachable');
      mockPipeline.pushEntity.mockRejectedValueOnce(networkErr);

      await expect(
        service.createFolder('eng-001', { name: 'Folder X' }),
      ).rejects.toThrow(networkErr);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save folder'),
        'Dismiss',
        expect.objectContaining({ duration: 5000 }),
      );
    });

    it('updateFolder: surfaces snackbar and re-throws on Pipeline rejection (note-folder.service:230)', async () => {
      const networkErr = new Error('Network unreachable');
      // updateFolder reads via GraphQL first (no cache), then pushes
      mockGraphql.getById.mockResolvedValue({
        id: 'folder-1',
        engagementId: 'eng-001',
        name: 'Original',
        parentId: null,
        accessLevel: 'boundary',
        sortOrder: 0,
      });
      mockPipeline.pushEntity.mockRejectedValueOnce(networkErr);

      await expect(
        service.updateFolder('folder-1', { name: 'Renamed' }),
      ).rejects.toThrow(networkErr);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update folder'),
        'Dismiss',
        expect.objectContaining({ duration: 5000 }),
      );
    });

    it('deleteFolder: surfaces snackbar and re-throws on Pipeline rejection (note-folder.service:260)', async () => {
      const networkErr = new Error('Network unreachable');
      mockGraphql.getById.mockResolvedValue({
        id: 'folder-1',
        engagementId: 'eng-001',
        name: 'Original',
        parentId: null,
        accessLevel: 'boundary',
        sortOrder: 0,
      });
      mockPipeline.pushEntity.mockRejectedValueOnce(networkErr);

      await expect(service.deleteFolder('folder-1')).rejects.toThrow(networkErr);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete folder'),
        'Dismiss',
        expect.objectContaining({ duration: 5000 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Demo Visibility (Phase 24 Plan 03)
  // ---------------------------------------------------------------------------

  describe('demo visibility (Phase 24 Plan 03)', () => {
    let mockProjectContextDV: ReturnType<typeof fakeProjectContextService>;
    let mockGqlReadDV: ReturnType<typeof fakeGraphqlReadService>;

    const mockGqlReturn = [
      { id: '1', name: 'Real', tag: null, engagementId: 'eng-1', parentId: null, dateDeleted: null } as unknown as GqlNoteFolderResponse,
      { id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }], engagementId: 'eng-1', parentId: null, dateDeleted: null } as unknown as GqlNoteFolderResponse,
      { id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }], engagementId: 'eng-1', parentId: null, dateDeleted: null } as unknown as GqlNoteFolderResponse,
      { id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }], engagementId: 'eng-1', parentId: null, dateDeleted: null } as unknown as GqlNoteFolderResponse,
    ];

    beforeEach(() => {
      mockProjectContextDV = fakeProjectContextService(false);
      mockGqlReadDV = fakeGraphqlReadService();

      TestBed.configureTestingModule({
        providers: [
          NoteFolderService,
          DemoVisibilityService,
          { provide: ProjectContextService, useValue: mockProjectContextDV },
          { provide: PipelineWriteService, useValue: fakePipelineWriteService() },
          { provide: GraphqlReadService, useValue: mockGqlReadDV },
          { provide: ImpersonationService, useValue: { effectiveUserId: vi.fn().mockReturnValue('user-123') } },
          { provide: MatSnackBar, useValue: { open: vi.fn() } },
        ],
      });
      service = TestBed.inject(NoteFolderService);
    });

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
      });
      const result = await service.getNoteFolderTree('eng-1');
      expect(result.map(r => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContextDV.setIsAdmin(true);
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
      });
      const result = await service.getNoteFolderTree('eng-1');
      expect(result.map(r => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
      });
      await service.getNoteFolderTree('eng-1');
      const callArgs = mockGqlReadDV.query.mock.calls[0];
      const filters = callArgs[2]?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
      });
      await service.getNoteFolderTree('eng-1');
      const callArgs = mockGqlReadDV.query.mock.calls[0];
      const fields = callArgs[1] as string[];
      expect(fields).toContain('tag');
    });
  });
});
