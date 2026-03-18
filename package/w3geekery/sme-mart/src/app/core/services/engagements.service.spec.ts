/**
 * Unit Tests for EngagementsService (Pipeline + GraphQL Migration)
 *
 * Tests verify service works with mocked PipelineWriteService and GraphqlReadService.
 * All service methods should return data immediately (optimistic updates) without
 * waiting for GQL indexing.
 */

import { TestBed } from '@angular/core/testing';
import { EngagementsService } from '../../core/services/engagements.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { ENGAGEMENT_GQL_FIXTURE } from '../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EngagementsService (Pipeline + GraphQL)', () => {
  let service: EngagementsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let notificationSpy: any;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    notificationSpy = { create: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });

    service = TestBed.inject(EngagementsService);
  });

  describe('listEngagements()', () => {
    it('should query GQL for published engagements', async () => {
      const mockResult = {
        items: [ENGAGEMENT_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };
      graphqlRead.query.mockResolvedValue(mockResult);

      await service.listEngagements({ pageNumber: 1, pageSize: 50 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Engagement',
        expect.any(Array),
        expect.objectContaining({ filters: { status: '.eq.published' } }),
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

  describe('searchEngagements()', () => {
    it('should apply ILIKE filter to search term', async () => {
      graphqlRead.query.mockResolvedValue({ items: [], page: { pageNumber: 1, pageSize: 50, totalCount: 0 } });

      await service.searchEngagements('HIPAA');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Engagement',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({ name: '.ilike.%HIPAA%' }),
        }),
      );
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

  describe('getWorkRequest()', () => {
    it('should fetch and transform to WorkRequest', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.getWorkRequest('eng-001');

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('status');
    });
  });

  describe('createRfp()', () => {
    it('should push to Pipeline and return optimistic WorkRequest', async () => {
      const result = await service.createRfp({
        buyer_zerobias_user_id: 'user-001',
        title: 'Test RFP',
        category: 'compliance',
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Engagement',
        expect.objectContaining({ title: 'Test RFP' }),
      );
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test RFP');
    });

    it('should create notification when status is open', async () => {
      await service.createRfp({
        buyer_zerobias_user_id: 'user-001',
        title: 'Test',
        category: 'compliance',
        status: 'open',
      });

      expect(notificationSpy.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'rfp_published' }),
      );
    });
  });

  describe('updateRfp()', () => {
    it('should fetch, merge, and push updates', async () => {
      graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

      const result = await service.updateRfp('eng-001', { status: 'in_progress' as any });

      expect(pipelineWrite.pushEntity).toHaveBeenCalled();
      expect(result.status).toBe('in_progress');
    });
  });

  describe('Pipeline integration', () => {
    it('should handle Pipeline errors gracefully (fire-and-forget)', async () => {
      pipelineWrite.pushEntity.mockRejectedValue(new Error('Pipeline error'));

      await expect(
        service.createRfp({
          buyer_zerobias_user_id: 'user-001',
          title: 'Test',
          category: 'compliance',
        }),
      ).resolves.toBeDefined();
    });
  });
});
