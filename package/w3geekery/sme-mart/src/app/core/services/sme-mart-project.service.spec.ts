import { TestBed } from '@angular/core/testing';
import { ZerobiasClientApi, ZerobiasClientSessionId } from '@zerobias-com/zerobias-client';
import { ZerobiasClientOrgIdService } from '@zerobias-com/zerobias-angular-client';

const TEST_ORG_ID = 'aaaa1111-bbbb-2222-cccc-333344445555';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmeMartProjectService } from './sme-mart-project.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { SmeMartResourceService } from './sme-mart-resource.service';
import { fakeProjectContextService, fakeClientApi } from '../../test-helpers/angular';
import type { GqlSmeMartProjectResponse } from '../gql-types';

type MockFn = ReturnType<typeof vi.fn>;

interface MockPipelineWrite {
  pushEntity: MockFn;
  pushEntities: MockFn;
  deleteEntity: MockFn;
  deleteEntities: MockFn;
  getCached: MockFn;
  seedCache: MockFn;
}

interface MockGraphqlRead {
  query: MockFn;
  getById: MockFn;
  rawQuery: MockFn;
}

describe('SmeMartProjectService', () => {
  let service: SmeMartProjectService;
  let mockPipelineWrite: MockPipelineWrite;
  let mockGraphqlRead: MockGraphqlRead;
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;
  let mockClientApi: ReturnType<typeof fakeClientApi>;

  beforeEach(() => {
    mockPipelineWrite = {
      pushEntity: vi.fn().mockResolvedValue(undefined),
      pushEntities: vi.fn().mockResolvedValue(undefined),
      deleteEntity: vi.fn().mockResolvedValue(undefined),
      deleteEntities: vi.fn().mockResolvedValue(undefined),
      getCached: vi.fn().mockReturnValue(null),
      seedCache: vi.fn(),
    };
    mockGraphqlRead = {
      query: vi.fn().mockResolvedValue({ items: [] }),
      getById: vi.fn().mockResolvedValue(null),
      rawQuery: vi.fn().mockResolvedValue(null),
    };
    mockProjectContext = fakeProjectContextService(false);
    mockClientApi = fakeClientApi();

    TestBed.configureTestingModule({
      providers: [
        SmeMartProjectService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: SmeMartTagService, useValue: { generateRfpTag: vi.fn(), createTag: vi.fn().mockResolvedValue(null) } },
        { provide: SmeMartResourceService, useValue: { linkResources: vi.fn().mockResolvedValue(undefined) } },
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: ZerobiasClientSessionId, useValue: { getCurrentSessionId: () => null } },
        { provide: ZerobiasClientOrgIdService, useValue: { getCurrentOrgId: () => TEST_ORG_ID } },
      ],
    });

    service = TestBed.inject(SmeMartProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createProject', () => {
    it('should create project optimistically without waiting for pipeline', async () => {
      const request = { name: 'Acme Security Review' };
      const result = await service.createProject(request);

      expect(result.name).toBe('Acme Security Review');
      expect(result.id).toBeTruthy();
      expect(result.status).toBe('draft');
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartProject',
        expect.objectContaining({ name: 'Acme Security Review' }),
        [],
        expect.any(String), // callSiteTag
      );
    });

    it('should use provided status in creation', async () => {
      const request = { name: 'Active Project', status: 'active' };
      const result = await service.createProject(request);

      expect(result.status).toBe('active');
    });

    it('should set default start date if not provided', async () => {
      const request = { name: 'Test Project' };
      const result = await service.createProject(request);

      expect(result.startDate).toBeTruthy();
      expect(typeof result.startDate).toBe('string');
    });
  });

  describe('getProject', () => {
    it('should query project by ID and return mapped model', async () => {
      const mockResponse: GqlSmeMartProjectResponse = {
        id: 'proj-123',
        name: 'Test Project',
        description: 'Test description',
        status: 'active',
        startDate: '2026-03-19',
        targetEndDate: '2026-06-19',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(mockResponse);

      const result = await service.getProject('proj-123');

      expect(result?.name).toBe('Test Project');
      expect(result?.status).toBe('active');
      expect(mockGraphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartProject',
        'proj-123',
        expect.any(Array),
      );
    });

    it('should return null if project not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

      const result = await service.getProject('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should query projects with default pagination (primary platform path)', async () => {
      // D-15: Dual-read window: primary path tries platform.Project.list first
      const mockPlatformResponse = {
        items: [
          {
            id: 'proj-1',
            name: 'Project 1',
            status: 'draft',
            startDate: '2026-03-19',
            tag: null,
            tagId: '420b0753-e72c-4b81-8929-70508a119bf0',
          },
        ],
        pageSize: 50,
        pageNumber: 1,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResponse);

      const result = await service.listProjects();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Project 1');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((mockClientApi as any).platformClient['getProjectApi']() as any).list).toHaveBeenCalledWith(1, 50, undefined, TEST_ORG_ID);
    });

    it('should respect pagination options (primary platform path)', async () => {
      // Create 25 items for page 2 (items 26-50)
      const pageItems = Array.from({ length: 25 }, (_, i) => ({
        id: `proj-${26 + i}`,
        name: `Project ${26 + i}`,
        status: 'active',
        startDate: '2026-03-19',
        tag: null,
        tagId: '420b0753-e72c-4b81-8929-70508a119bf0',
      }));

      const mockPlatformResponse = {
        items: pageItems,
        pageSize: 25,
        pageNumber: 2,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResponse);

      await service.listProjects({ pageNumber: 2, pageSize: 25 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((mockClientApi as any).platformClient['getProjectApi']() as any).list).toHaveBeenCalledWith(2, 25, undefined, TEST_ORG_ID);
    });

    it('filters out non-Project-tier rows (errata 039 cross-contamination fix)', async () => {
      // Mixed bag: depth-1 engagement, untagged, foreign tag, and the real
      // Project-tier row. Only the last should pass the client-side tier filter.
      const PROJECT_TIER_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0';
      const mockPlatformResponse = {
        items: [
          { id: 'eng-1', name: 'Engagement (depth-1)', status: 'active', tag: null, parentId: null },
          { id: 'untagged', name: 'Untagged Project', status: 'active', tag: null },
          { id: 'foreign', name: 'Foreign-tag Project', status: 'active', tag: null, tagId: '00000000-0000-0000-0000-000000000099' },
          { id: 'project-tier', name: 'Project Tier Row', status: 'active', tag: null, tagId: PROJECT_TIER_TAG_ID },
        ],
        pageSize: 50,
        pageNumber: 1,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResponse);

      const result = await service.listProjects();

      expect(result.items.map(r => r.id)).toEqual(['project-tier']);
    });
  });

  describe('updateProject', () => {
    it('should update project and push changes optimistically', async () => {
      const existing: GqlSmeMartProjectResponse = {
        id: 'proj-123',
        name: 'Original Name',
        status: 'draft',
        startDate: '2026-03-19',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(existing);

      const result = await service.updateProject('proj-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.id).toBe('proj-123');
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartProject',
        expect.objectContaining({ name: 'Updated Name', id: 'proj-123' }),
        [],
        expect.any(String), // callSiteTag
      );
    });

    it('should throw if project not found on update', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

      await expect(
        service.updateProject('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(/not found/);
    });

    it('should merge update changes with existing data', async () => {
      const existing: GqlSmeMartProjectResponse = {
        id: 'proj-merge-test',
        name: 'Original Name',
        status: 'draft',
        startDate: '2026-03-19',
        targetEndDate: '2026-06-19',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(existing);

      const result = await service.updateProject('proj-merge-test', {
        status: 'active',
        // name should remain unchanged
      });

      expect(result.name).toBe('Original Name');
      expect(result.status).toBe('active');
    });
  });

  describe('deleteProject', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteProject('proj-123');

      expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartProject', 'proj-123');
    });
  });

  describe('demo visibility (Phase 24 Plan 03)', () => {
    // All four mocks carry the Project-tier tagId so they survive the
    // tier filter; the demo-visibility post-filter is what's under test here.
    const PROJECT_TIER_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0';
    const mockPlatformReturn = [
      { id: '1', name: 'Real', tag: null, status: 'draft', tagId: PROJECT_TIER_TAG_ID },
      { id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }], status: 'draft', tagId: PROJECT_TIER_TAG_ID },
      { id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }], status: 'draft', tagId: PROJECT_TIER_TAG_ID },
      { id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }], status: 'draft', tagId: PROJECT_TIER_TAG_ID },
    ];
    const mockGqlReturn = mockPlatformReturn as unknown as GqlSmeMartProjectResponse[];

    it('[DG-02] strips demo records for non-admin in listProjects', async () => {
      // D-15: Platform path returns success, post-filter strips demo tags
      const mockPlatformResult = {
        items: mockPlatformReturn,
        pageSize: 50,
        pageNumber: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      const result = await service.listProjects();

      expect(result.items.map(r => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo in listProjects', async () => {
      mockProjectContext.setIsAdmin(true);
      const mockPlatformResult = {
        items: mockPlatformReturn,
        pageSize: 50,
        pageNumber: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      const result = await service.listProjects();

      expect(result.items.map(r => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter in listProjects', async () => {
      // D-15: With platform path primary, demo filtering is post-filter only (client-side).
      // Platform API has no tag-negation filter concept.
      const mockPlatformResult = {
        items: [],
        pageSize: 50,
        pageNumber: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      await service.listProjects();

      // Platform API call args: pageNumber, pageSize (no filters)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((mockClientApi as any).platformClient['getProjectApi']() as any).list).toHaveBeenCalledWith(1, 50, undefined, TEST_ORG_ID);
    });

    it('requests tag field in GQL query for listProjects (fallback path only)', async () => {
      // D-15: Primary platform path doesn't request fields explicitly.
      // Tag field is present in platform response. This test verifies the fallback (GQL) path
      // would request the tag field if platform failed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockRejectedValue(
        new Error('platform timeout')
      );
      mockGraphqlRead.query.mockResolvedValueOnce({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listProjects();

      const callArgs = mockGraphqlRead.query.mock.calls[0];
      const fields = callArgs[1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] strips demo records for non-admin in listProjectsByEngagement', async () => {
      mockGraphqlRead.query.mockResolvedValueOnce({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listProjectsByEngagement('eng-123');

      expect(result.items.map(r => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo in listProjectsByEngagement', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGraphqlRead.query.mockResolvedValueOnce({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listProjectsByEngagement('eng-123');

      expect(result.items.map(r => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter in listProjectsByEngagement', async () => {
      mockGraphqlRead.query.mockResolvedValueOnce({
        items: [],
        page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
      });

      await service.listProjectsByEngagement('eng-123');

      const callArgs = mockGraphqlRead.query.mock.calls[0];
      const filters = callArgs[2]?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query for listProjectsByEngagement', async () => {
      mockGraphqlRead.query.mockResolvedValueOnce({
        items: [],
        page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
      });

      await service.listProjectsByEngagement('eng-123');

      const callArgs = mockGraphqlRead.query.mock.calls[0];
      const fields = callArgs[1] as string[];
      expect(fields).toContain('tag');
    });
  });

  describe('getProjectBoards', () => {
    it('should query boards with parentId filter', async () => {
      const mockResponse = {
        items: [
          {
            id: 'board-1',
            code: 'B1',
            name: 'Board 1',
            scope: 'demand',
            partition: 'P1',
            parentId: 'proj-123',
            createdAt: '2026-03-19T00:00:00Z',
            updatedAt: '2026-03-19T00:00:00Z',
          },
        ] as unknown as GqlSmeMartProjectResponse[],
        page: { pageNumber: 1, pageSize: 1000, totalCount: 1 },
      };

      mockGraphqlRead.query.mockResolvedValue(mockResponse);

      const result = await service.getProjectBoards('proj-123');

      expect(result).toHaveLength(1);
      expect(mockGraphqlRead.query).toHaveBeenCalledWith(
        'SmeMartBoard',
        expect.any(Array),
        expect.objectContaining({
          filters: { parentId: '.eq.proj-123' },
        }),
      );
    });
  });
});
