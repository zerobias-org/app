/**
 * Unit Tests for EngagementsService (Plan 075 — corp-to-corp agreements)
 *
 * RFP creation/update moved to SmeMartProjectService.
 * EngagementsService now handles engagement CRUD and status transitions only.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi, ZerobiasClientSessionId } from '@zerobias-com/zerobias-client';
import type { ProjectExtended } from '@zerobias-com/platform-sdk';
import { EngagementsService } from '../../core/services/engagements.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { ENGAGEMENT_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService, fakeClientApi } from '../../test-helpers/angular';
import type { RequestStatus } from '../models/enums';
import { PROJECT_TYPE_ID } from '../constants/project-types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EngagementsService (Plan 075)', () => {
  let service: EngagementsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;
  let mockClientApi: ReturnType<typeof fakeClientApi>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false); // non-admin by default
    mockClientApi = fakeClientApi();

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: ZerobiasClientSessionId, useValue: { getCurrentSessionId: () => null } },
      ],
    });

    service = TestBed.inject(EngagementsService);
  });

  describe('listEngagements()', () => {
    it('should query platform.Project.list for engagements (primary path)', async () => {
      // D-15: Dual-read window: primary path tries platform.Project.list first
      const mockPlatformResult = {
        items: [],
        pageSize: 50,
        pageNumber: 1,
      };

      // Set up the platform mock to succeed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      await service.listEngagements({ pageNumber: 1, pageSize: 50 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((mockClientApi as any).platformClient['getProjectApi']() as any).list).toHaveBeenCalledWith(
        1,
        50,
        undefined,
        undefined
      );
    });

    it('should set loading signal during query', async () => {
      graphqlRead.query.mockResolvedValue({ items: [], page: { pageNumber: 1, pageSize: 50, totalCount: 0 } });

      const promise = service.listEngagements();
      expect(service.loading()).toBe(true);
      await promise;
      expect(service.loading()).toBe(false);
    });
  });

  describe('getEngagement()', () => {
    it('should fetch single engagement by ID', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      await service.getEngagement('eng-001');

      expect(graphqlRead.getById).toHaveBeenCalledWith('Engagement', 'eng-001', expect.any(Array));
    });

    it('should return null when not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      const result = await service.getEngagement('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('createEngagement()', () => {
    it('should push to Pipeline and return optimistic Engagement', async () => {
      const result = await service.createEngagement({
        buyer_zerobias_user_id: 'user-001',
        title: 'Pinnacle Corp ↔ W3Geekery',
        engagement_tag: 'sme-mart.eng.pinnacle',
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Engagement',
        expect.objectContaining({ name: 'Pinnacle Corp ↔ W3Geekery' }),
        [],
        'engagements.service:172',
      );
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Pinnacle Corp ↔ W3Geekery');
      expect(result.status).toBe('in_progress');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network failure');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createEngagement({
          buyer_zerobias_user_id: 'user-001',
          title: 'Test',
          engagement_tag: 'sme-mart.eng.test',
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create engagement'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('updateEngagement()', () => {
    it('should fetch, merge, and push updates', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.updateEngagement('eng-001', { status: 'completed' as unknown as RequestStatus });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Engagement',
        expect.any(Object),
        [],
        'engagements.service:205',
      );
      expect(result.status).toBe('completed');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);
      const mockError = new Error('Save failed');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.updateEngagement('eng-001', { status: 'completed' as unknown as RequestStatus })).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update engagement'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('cancelEngagement()', () => {
    it('should set status to cancelled', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.cancelEngagement('eng-001');

      expect((result as { status: string }).status).toBe('cancelled');
    });
  });

  describe('completeEngagement()', () => {
    it('should set status to completed', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.completeEngagement('eng-001');

      expect((result as { status: string }).status).toBe('completed');
    });
  });

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    // Mock platform-returned Engagement records with tag field (polymorphic post-filter support)
    const mockPlatformReturn = [
      { id: '1', name: 'Real', tag: null },
      { id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      // D-15: Platform path returns success, post-filter strips demo tags
      const mockPlatformResult = {
        items: mockPlatformReturn,
        pageSize: 50,
        pageNumber: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      const result = await service.listEngagements();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      const mockPlatformResult = {
        items: mockPlatformReturn,
        pageSize: 50,
        pageNumber: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      const result = await service.listEngagements();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      // D-15: With platform path primary, fallback GQL is not called.
      // Demo filtering is post-filter only (client-side). Assert the platform call
      // does not include tag negation in params (platform API has no such filter concept).
      const mockPlatformResult = {
        items: [],
        pageSize: 50,
        pageNumber: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockPlatformResult);

      await service.listEngagements();

      // Platform API call args: pageNumber, pageSize, undefined, undefined (no filters)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((mockClientApi as any).platformClient['getProjectApi']() as any).list).toHaveBeenCalledWith(
        1,
        50,
        undefined,
        undefined
      );
    });

    it('requests tag field in GQL query (fallback path only)', async () => {
      // D-15: Primary platform path doesn't request fields explicitly (API returns full ProjectExtended).
      // Tag field is present in platform response. This test verifies the fallback (GQL) path
      // would request the tag field if platform failed. Force platform to fail and verify GQL.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockRejectedValue(
        new Error('platform timeout')
      );
      graphqlRead.query.mockResolvedValue({
        items: mockPlatformReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listEngagements();

      const callArgs = graphqlRead.query.mock.calls[0];
      const fields = callArgs[1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...ENGAGEMENT_GQL_FIXTURE, id: '3', name: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      graphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getEngagement('3');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultEngagement', () => {
    it('should return the root (depth-1) project when projects exist', async () => {
      const mockProjects = {
        items: [
          {
            id: 'eng-uuid-1',
            name: 'Acme Corp <- ZeroBias',
            parentId: null,
            tagId: 'some-uuid',
            ownerId: 'org-uuid',
            status: 'active',
            created: new Date(),
            updated: new Date(),
          } as unknown as ProjectExtended,
          {
            id: 'proj-uuid-1',
            name: 'ZeroBias Platform',
            parentId: 'eng-uuid-1',
            tagId: 'tier-project-uuid',
            ownerId: 'org-uuid',
            status: 'active',
            created: new Date(),
            updated: new Date(),
          } as unknown as ProjectExtended,
        ],
        totalCount: 2,
        pageNumber: 1,
        pageSize: 100,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockProjects);

      const result = await service.getDefaultEngagement('org-uuid');

      expect(result).toBeDefined();
      expect(result?.id).toBe('eng-uuid-1');
      expect(result?.parentId).toBeNull();
    });

    it('should return null when no root project found', async () => {
      const mockProjects = {
        items: [
          {
            id: 'child-uuid-1',
            name: 'Some Project',
            parentId: 'parent-uuid',
            tagId: 'some-uuid',
            ownerId: 'org-uuid',
            status: 'active',
            created: new Date(),
            updated: new Date(),
          } as unknown as ProjectExtended,
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 100,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockProjects);

      const result = await service.getDefaultEngagement('org-uuid');

      expect(result).toBeNull();
    });

    it('should return null and log when list() times out', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockReturnValue(
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), 100)
        )
      );
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const result = await service.getDefaultEngagement('org-uuid');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT_ERROR]',
        expect.objectContaining({ orgId: 'org-uuid' })
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getProjectTierProject', () => {
    it('should return the project-tier child with matching tagId', async () => {
      const tierTypeId = PROJECT_TYPE_ID.project; // SDK 2.x: tier = projectType, not marketplace tag
      const mockProjects = {
        items: [
          {
            id: 'proj-uuid-1',
            name: 'ZeroBias Platform',
            parentId: 'eng-uuid-1',
            projectTypeId: tierTypeId,
            ownerId: 'org-uuid',
            status: 'active',
            created: new Date(),
            updated: new Date(),
          } as unknown as ProjectExtended,
          {
            id: 'proj-uuid-2',
            name: 'Some Other Project',
            parentId: 'eng-uuid-1',
            projectTypeId: 'different-uuid',
            ownerId: 'org-uuid',
            status: 'active',
            created: new Date(),
            updated: new Date(),
          } as unknown as ProjectExtended,
        ],
        totalCount: 2,
        pageNumber: 1,
        pageSize: 100,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockProjects);

      const result = await service.getProjectTierProject('eng-uuid-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('proj-uuid-1');
      expect(result?.projectTypeId).toBe(tierTypeId);
      expect(result?.parentId).toBe('eng-uuid-1');
    });

    it('should return null when no matching project-tier found', async () => {
      const mockProjects = {
        items: [
          {
            id: 'proj-uuid-2',
            name: 'Some Other Project',
            parentId: 'eng-uuid-1',
            projectTypeId: 'different-uuid',
            ownerId: 'org-uuid',
            status: 'active',
            created: new Date(),
            updated: new Date(),
          } as unknown as ProjectExtended,
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 100,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockResolvedValue(mockProjects);

      const result = await service.getProjectTierProject('eng-uuid-1');

      expect(result).toBeNull();
    });

    it('should return null and log when list() times out', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((mockClientApi as any).platformClient['getProjectApi']() as any).list.mockReturnValue(
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), 100)
        )
      );
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const result = await service.getProjectTierProject('eng-uuid-1');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT_ERROR]',
        expect.objectContaining({ engagementId: 'eng-uuid-1' })
      );
      consoleWarnSpy.mockRestore();
    });
  });

});
