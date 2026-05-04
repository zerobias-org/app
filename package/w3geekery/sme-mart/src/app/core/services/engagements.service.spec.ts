/**
 * Unit Tests for EngagementsService (Plan 075 — corp-to-corp agreements)
 *
 * RFP creation/update moved to SmeMartProjectService.
 * EngagementsService now handles engagement CRUD and status transitions only.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EngagementsService } from '../../core/services/engagements.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { ENGAGEMENT_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import type { RequestStatus } from '../models/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EngagementsService (Plan 075)', () => {
  let service: EngagementsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false); // non-admin by default

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(EngagementsService);
  });

  describe('listEngagements()', () => {
    it('should query GQL for engagements', async () => {
      const mockResult = {
        items: [ENGAGEMENT_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };
      graphqlRead.query.mockResolvedValue(mockResult);

      await service.listEngagements({ pageNumber: 1, pageSize: 50 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Engagement',
        expect.any(Array),
        expect.any(Object),
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
    const mockGqlReturn = [
      { ...ENGAGEMENT_GQL_FIXTURE, id: '1', name: 'Real', tag: null },
      { ...ENGAGEMENT_GQL_FIXTURE, id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...ENGAGEMENT_GQL_FIXTURE, id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...ENGAGEMENT_GQL_FIXTURE, id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listEngagements();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listEngagements();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listEngagements();

      const callArgs = graphqlRead.query.mock.calls[0];
      const filters = callArgs[2]?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
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

});
