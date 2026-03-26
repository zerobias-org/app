/**
 * Unit Tests for EngagementsService (Plan 075 — corp-to-corp agreements)
 *
 * RFP creation/update moved to SmeMartProjectService.
 * EngagementsService now handles engagement CRUD and status transitions only.
 */

import { TestBed } from '@angular/core/testing';
import { EngagementsService } from '../../core/services/engagements.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ENGAGEMENT_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EngagementsService (Plan 075)', () => {
  let service: EngagementsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
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
      );
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Pinnacle Corp ↔ W3Geekery');
      expect(result.status).toBe('in_progress');
    });
  });

  describe('updateEngagement()', () => {
    it('should fetch, merge, and push updates', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.updateEngagement('eng-001', { status: 'completed' as any });

      expect(pipelineWrite.pushEntity).toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });
  });

  describe('cancelEngagement()', () => {
    it('should set status to cancelled', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.cancelEngagement('eng-001');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('completeEngagement()', () => {
    it('should set status to completed', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.completeEngagement('eng-001');

      expect(result.status).toBe('completed');
    });
  });

  describe('Pipeline integration', () => {
    it('should handle Pipeline errors gracefully (fire-and-forget)', async () => {
      pipelineWrite.pushEntity.mockRejectedValue(new Error('Pipeline error'));

      await expect(
        service.createEngagement({
          buyer_zerobias_user_id: 'user-001',
          title: 'Test',
          engagement_tag: 'sme-mart.eng.test',
        }),
      ).resolves.toBeDefined();
    });
  });
});
