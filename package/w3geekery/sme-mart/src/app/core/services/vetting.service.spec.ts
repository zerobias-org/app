/**
 * Unit Tests for VettingService (Plan 063 — Corporate Vetting)
 *
 * Tests verify CRUD, default seeding, status transitions, and summary.
 */

import { TestBed } from '@angular/core/testing';
import { VettingService } from './vetting.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeImpersonation } from '../../test-helpers/angular';
import { DEFAULT_VETTING_TEMPLATES } from '../models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// GQL fixture for a vetting item
const VETTING_GQL_FIXTURE = {
  id: 'vi-001',
  name: 'D&B Rating',
  description: 'Dun & Bradstreet financial health rating',
  engagementId: 'eng-001',
  category: 'always',
  vettingType: 'financial',
  evidenceType: 'document',
  status: 'not_started',
  direction: 'buyer_requires',
  conditionTrigger: null,
  documentIds: '[]',
  submittedAt: null,
  verifiedAt: null,
  verifiedBy: null,
  expiresAt: null,
  rejectionReason: null,
  waivedReason: null,
  notes: null,
  dateCreated: '2026-03-26T10:00:00Z',
  dateLastModified: '2026-03-26T10:00:00Z',
};

const VERIFIED_FIXTURE = {
  ...VETTING_GQL_FIXTURE,
  id: 'vi-002',
  name: 'MSA',
  status: 'verified',
  verifiedAt: '2026-03-26T12:00:00Z',
  verifiedBy: 'admin-001',
};

describe('VettingService', () => {
  let service: VettingService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        VettingService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ImpersonationService, useValue: fakeImpersonation() },
      ],
    });

    service = TestBed.inject(VettingService);
  });

  // ── initializeVetting ──

  describe('initializeVetting()', () => {
    it('should seed default templates when no items exist', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 200, totalCount: 0 },
      });

      const result = await service.initializeVetting('eng-001');

      expect(result).toHaveLength(DEFAULT_VETTING_TEMPLATES.length);
      expect(result[0]).toHaveProperty('name', 'D&B Rating');
      expect(result[0]).toHaveProperty('status', 'not_started');
      expect(result[0]).toHaveProperty('direction', 'buyer_requires');
      expect(pipelineWrite.pushEntities).toHaveBeenCalledWith(
        'EngagementVettingItem',
        expect.any(Array),
      );
    });

    it('should return existing items without re-seeding', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VETTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.initializeVetting('eng-001');

      expect(result).toHaveLength(1);
      expect(pipelineWrite.pushEntities).not.toHaveBeenCalled();
    });
  });

  // ── listVettingItems ──

  describe('listVettingItems()', () => {
    it('should query GQL with engagementId filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VETTING_GQL_FIXTURE, VERIFIED_FIXTURE],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const result = await service.listVettingItems('eng-001');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'EngagementVettingItem',
        expect.any(Array),
        expect.objectContaining({
          filters: { engagementId: '.eq.eng-001' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should transform GQL to Neon shape', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VETTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.listVettingItems('eng-001');

      expect(result[0]).toHaveProperty('engagement_id', 'eng-001');
      expect(result[0]).toHaveProperty('vetting_type', 'financial');
      expect(result[0]).toHaveProperty('evidence_type', 'document');
      expect(result[0]).not.toHaveProperty('engagementId');
    });

    it('should parse documentIds JSON string into array', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [{ ...VETTING_GQL_FIXTURE, documentIds: '["doc-1","doc-2"]' }],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.listVettingItems('eng-001');

      expect(result[0].document_ids).toEqual(['doc-1', 'doc-2']);
    });

    it('should filter out soft-deleted items', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          VETTING_GQL_FIXTURE,
          { ...VERIFIED_FIXTURE, dateDeleted: '2026-03-26' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const result = await service.listVettingItems('eng-001');

      expect(result).toHaveLength(1);
    });

    it('should sort by category (always first) then name', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: 'vi-3', name: 'Zebra', category: 'conditional' },
          { ...VETTING_GQL_FIXTURE, id: 'vi-1', name: 'Alpha', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: 'vi-2', name: 'Beta', category: 'always' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 3 },
      });

      const result = await service.listVettingItems('eng-001');

      expect(result.map(i => i.name)).toEqual(['Alpha', 'Beta', 'Zebra']);
    });
  });

  // ── addVettingItem ──

  describe('addVettingItem()', () => {
    it('should create item and push to pipeline', async () => {
      const result = await service.addVettingItem('eng-001', {
        name: 'HIPAA BAA',
        category: 'conditional',
        vetting_type: 'compliance',
        evidence_type: 'document',
        direction: 'buyer_requires',
        condition_trigger: 'Healthcare / PHI',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'HIPAA BAA');
      expect(result).toHaveProperty('status', 'not_started');
      expect(result).toHaveProperty('condition_trigger', 'Healthcare / PHI');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'EngagementVettingItem',
        expect.objectContaining({ name: 'HIPAA BAA' }),
      );
    });
  });

  // ── updateVettingItem ──

  describe('updateVettingItem()', () => {
    it('should fetch, merge, and push updates', async () => {
      graphqlRead.getById.mockResolvedValue(VETTING_GQL_FIXTURE);

      const result = await service.updateVettingItem('vi-001', {
        status: 'submitted',
        notes: 'Uploaded D&B report',
      });

      expect(result).toHaveProperty('status', 'submitted');
      expect(result).toHaveProperty('notes', 'Uploaded D&B report');
      expect(result.submitted_at).toBeTruthy();
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'EngagementVettingItem',
        expect.objectContaining({ status: 'submitted' }),
      );
    });

    it('should auto-set verified_at and verified_by on verification', async () => {
      const submittedFixture = { ...VETTING_GQL_FIXTURE, status: 'under_review' };
      graphqlRead.getById.mockResolvedValue(submittedFixture);

      const result = await service.updateVettingItem('vi-001', { status: 'verified' });

      expect(result.verified_at).toBeTruthy();
      expect(result.verified_by).toBeTruthy();
    });

    it('should reject invalid status transitions', async () => {
      graphqlRead.getById.mockResolvedValue(VETTING_GQL_FIXTURE); // status: not_started

      await expect(
        service.updateVettingItem('vi-001', { status: 'verified' }),
      ).rejects.toThrow('Invalid status transition: not_started → verified');
    });

    it('should allow valid transition not_started → submitted', async () => {
      graphqlRead.getById.mockResolvedValue(VETTING_GQL_FIXTURE);

      const result = await service.updateVettingItem('vi-001', { status: 'submitted' });

      expect(result).toHaveProperty('status', 'submitted');
    });

    it('should allow valid transition not_started → waived', async () => {
      graphqlRead.getById.mockResolvedValue(VETTING_GQL_FIXTURE);

      const result = await service.updateVettingItem('vi-001', { status: 'waived' });

      expect(result).toHaveProperty('status', 'waived');
    });

    it('should use cache when available', async () => {
      pipelineWrite.getCached.mockReturnValue({
        ...VETTING_GQL_FIXTURE,
        status: 'submitted',
      });

      const result = await service.updateVettingItem('vi-001', { status: 'under_review' });

      expect(graphqlRead.getById).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 'under_review');
    });

    it('should throw if item not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      await expect(
        service.updateVettingItem('nonexistent', { status: 'submitted' }),
      ).rejects.toThrow('Vetting item nonexistent not found');
    });
  });

  // ── deleteVettingItem ──

  describe('deleteVettingItem()', () => {
    it('should push soft-delete with dateDeleted', async () => {
      graphqlRead.getById.mockResolvedValue(VETTING_GQL_FIXTURE);

      await service.deleteVettingItem('vi-001');

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'EngagementVettingItem',
        expect.objectContaining({ dateDeleted: expect.any(String) }),
      );
    });
  });

  // ── getVettingSummary ──

  describe('getVettingSummary()', () => {
    it('should calculate summary counts correctly', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: '1', status: 'verified', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '2', status: 'not_started', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '3', status: 'waived', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '4', status: 'rejected', category: 'conditional' },
          { ...VETTING_GQL_FIXTURE, id: '5', status: 'submitted', category: 'conditional' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 5 },
      });

      const summary = await service.getVettingSummary('eng-001');

      expect(summary.total).toBe(5);
      expect(summary.verified).toBe(1);
      expect(summary.waived).toBe(1);
      expect(summary.rejected).toBe(1);
      expect(summary.pending).toBe(2); // not_started + submitted
      expect(summary.requiredRemaining).toBe(1); // only always + not verified/waived
    });

    it('should return zeros for empty engagement', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 200, totalCount: 0 },
      });

      const summary = await service.getVettingSummary('eng-001');

      expect(summary.total).toBe(0);
      expect(summary.requiredRemaining).toBe(0);
    });
  });

  // ── Gate status ──

  describe('gateStatus computation', () => {
    it('should be "verified" when all required items resolved', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: '1', status: 'verified', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '2', status: 'waived', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '3', status: 'not_started', category: 'conditional' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 3 },
      });

      const summary = await service.getVettingSummary('eng-001');
      expect(summary.gateStatus).toBe('verified');
    });

    it('should be "blocked" when any item is rejected', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: '1', status: 'verified', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '2', status: 'rejected', category: 'always' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const summary = await service.getVettingSummary('eng-001');
      expect(summary.gateStatus).toBe('blocked');
    });

    it('should be "in_progress" when some items resolved, some pending', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: '1', status: 'verified', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '2', status: 'not_started', category: 'always' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const summary = await service.getVettingSummary('eng-001');
      expect(summary.gateStatus).toBe('in_progress');
    });

    it('should be "not_started" when all items are not_started', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: '1', status: 'not_started', category: 'always' },
          { ...VETTING_GQL_FIXTURE, id: '2', status: 'not_started', category: 'always' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const summary = await service.getVettingSummary('eng-001');
      expect(summary.gateStatus).toBe('not_started');
    });

    it('should be "verified" when no required items exist', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          { ...VETTING_GQL_FIXTURE, id: '1', status: 'not_started', category: 'nice_to_have' },
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const summary = await service.getVettingSummary('eng-001');
      expect(summary.gateStatus).toBe('verified');
    });
  });

  describe('Pilot Completion Suggestion Signal (Plan 077)', () => {
    it('should initialize pilotCompletionSuggestion as null', () => {
      expect(service.pilotCompletionSuggestion()).toBe(null);
    });

    it('should set pilot completion suggestion via setPilotCompletionSuggestion', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: new Date().toISOString(),
        completionNotes: 'Completed successfully',
        engagementId: 'eng-123',
        summary: 'Pilot completed. Ready for vetting.',
      };

      service.setPilotCompletionSuggestion(suggestion);

      expect(service.pilotCompletionSuggestion()).toEqual(suggestion);
    });

    it('should clear pilot completion suggestion via clearPilotCompletionSuggestion', () => {
      const suggestion = {
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        completionDate: new Date().toISOString(),
        completionNotes: '',
        engagementId: 'eng-123',
        summary: 'Pilot completed.',
      };

      service.setPilotCompletionSuggestion(suggestion);
      expect(service.pilotCompletionSuggestion()).toBeTruthy();

      service.clearPilotCompletionSuggestion();

      expect(service.pilotCompletionSuggestion()).toBe(null);
    });

    it('should allow updating suggestion multiple times', () => {
      const suggestion1 = {
        pilotId: 'pilot-1',
        pilotName: 'Pilot One',
        completionDate: '2026-04-01T10:00:00Z',
        completionNotes: 'First pilot',
        engagementId: 'eng-123',
        summary: 'First',
      };

      const suggestion2 = {
        pilotId: 'pilot-2',
        pilotName: 'Pilot Two',
        completionDate: '2026-04-02T10:00:00Z',
        completionNotes: 'Second pilot',
        engagementId: 'eng-124',
        summary: 'Second',
      };

      service.setPilotCompletionSuggestion(suggestion1);
      expect(service.pilotCompletionSuggestion()?.pilotName).toBe('Pilot One');

      service.setPilotCompletionSuggestion(suggestion2);
      expect(service.pilotCompletionSuggestion()?.pilotName).toBe('Pilot Two');
    });
  });
});
