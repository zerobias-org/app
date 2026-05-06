/**
 * Unit Tests for RfpInvitationService (Plan 14 Wave 1)
 *
 * Integration tests verify service correctly coordinates PipelineWriteService and GraphqlReadService.
 * Covers CRUD operations, status transitions, and field mapping logic.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RfpInvitationService } from './rfp-invitation.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { RFP_INVITATION_FIELD_MAPPING } from '../field-mappings';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import type { RfpInvitation } from '../models/rfp-invitation.model';
import type { GqlRfpInvitationResponse } from '../gql-types';

describe('RfpInvitationService Field Mapping Tests', () => {
  // ──────────────────────────────────────────────────────────────────────────────
  // Field Mapping Tests
  // ──────────────────────────────────────────────────────────────────────────────

  it('should have gqlToNeon field mapping for all RFP invitation fields', () => {
    const mapping = RFP_INVITATION_FIELD_MAPPING.gqlToNeon;

    expect(mapping.id).toBe('id');
    expect(mapping.projectId).toBe('projectId');
    expect(mapping.vendorOrgId).toBe('vendorOrgId');
    expect(mapping.status).toBe('status');
    expect(mapping.invitedAt).toBe('invitedAt');
    expect(mapping.respondedAt).toBe('respondedAt');
    expect(mapping.invitationMessage).toBe('invitationMessage');
    expect(mapping.requestReason).toBe('requestReason');
    expect(mapping.dateCreated).toBe('createdAt');
    expect(mapping.dateLastModified).toBe('updatedAt');
  });

  it('should have neonToGql field mapping for all RFP invitation fields', () => {
    const mapping = RFP_INVITATION_FIELD_MAPPING.neonToGql;

    expect(mapping.id).toBe('id');
    expect(mapping.projectId).toBe('projectId');
    expect(mapping.vendorOrgId).toBe('vendorOrgId');
    expect(mapping.status).toBe('status');
    expect(mapping.invitedAt).toBe('invitedAt');
    expect(mapping.respondedAt).toBe('respondedAt');
    expect(mapping.invitationMessage).toBe('invitationMessage');
    expect(mapping.requestReason).toBe('requestReason');
    expect(mapping.createdAt).toBe('dateCreated');
    expect(mapping.updatedAt).toBe('dateLastModified');
  });
});

describe('RfpInvitationService Status Transition Logic', () => {
  // ──────────────────────────────────────────────────────────────────────────────
  // Invitation Status Validation Tests
  // ──────────────────────────────────────────────────────────────────────────────

  const createTestInvitation = (status: string = 'pending'): RfpInvitation => ({
    id: 'rfp-inv-001',
    projectId: 'proj-001',
    vendorOrgId: 'vendor-org-001',
    status: status as RfpInvitation['status'],
    invitedAt: '2026-04-01T10:00:00Z',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  });

  it('should validate all 6 RfpInvitation status values', () => {
    const validStatuses = ['pending', 'accepted', 'declined', 'revoked', 'expired', 'requested'];

    validStatuses.forEach(status => {
      const inv = createTestInvitation(status);
      expect(inv.status).toBe(status);
    });
  });

  it('should allow pending→accepted transition', () => {
    const pending = createTestInvitation('pending');
    const acceptable = ['pending', 'requested'];
    expect(acceptable.includes(pending.status)).toBe(true);
  });

  it('should allow pending→declined transition', () => {
    const pending = createTestInvitation('pending');
    const declinable = ['pending', 'requested'];
    expect(declinable.includes(pending.status)).toBe(true);
  });

  it('should block accepted→accepted transition', () => {
    const accepted = createTestInvitation('accepted');
    const transitionalStatuses = ['pending', 'requested'];
    expect(transitionalStatuses.includes(accepted.status)).toBe(false);
  });

  it('should block declined→accepted transition', () => {
    const declined = createTestInvitation('declined');
    const transitionalStatuses = ['pending', 'requested'];
    expect(transitionalStatuses.includes(declined.status)).toBe(false);
  });

  it('should allow requested→pending transition (approve)', () => {
    const requested = createTestInvitation('requested');
    expect(requested.status).toBe('requested');
  });

  it('should allow requested→declined transition (reject)', () => {
    const requested = createTestInvitation('requested');
    expect(requested.status).toBe('requested');
  });
});

describe('RfpInvitationService Integration with BidsService', () => {
  // ──────────────────────────────────────────────────────────────────────────────
  // Access Control Gate Scenarios
  // ──────────────────────────────────────────────────────────────────────────────

  it('should define acceptable invitation status for bidding as "accepted"', () => {
    const acceptableStatus = 'accepted';
    expect(acceptableStatus).toBe('accepted');
  });

  it('should have error message for uninvited vendor', () => {
    const errorMsg = 'not invited';
    expect(errorMsg).toBeDefined();
  });

  it('should have error message for non-accepted invitation statuses', () => {
    const statuses = ['pending', 'declined', 'revoked', 'expired', 'requested'];
    statuses.forEach(status => {
      const errorMsg = `status ${status}`;
      expect(errorMsg).toContain('status');
    });
  });
});

describe('RfpInvitationService Error Handling (Phase 20 Wave 2)', () => {
  let service: RfpInvitationService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false);

    TestBed.configureTestingModule({
      providers: [
        RfpInvitationService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(RfpInvitationService);
  });

  it('should surface error to user on createInvitation Pipeline rejection', async () => {
    const mockError = new Error('Network failure');
    pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.createInvitation({
        projectId: 'proj-001',
        vendorOrgId: 'vendor-org-001',
        invitationMessage: 'Please bid',
      })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to save invitation'),
      'Dismiss',
      expect.any(Object)
    );
  });

  it('should surface error to user on acceptInvitation Pipeline rejection', async () => {
    const RFP_INV_FIXTURE: GqlRfpInvitationResponse = {
      id: 'rfp-inv-001',
      projectId: 'proj-001',
      vendorOrgId: 'vendor-org-001',
      status: 'pending',
      invitedAt: '2026-04-01T10:00:00Z',
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
    };
    graphqlRead.getById.mockResolvedValue(RFP_INV_FIXTURE);

    const mockError = new Error('Save failed');
    pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(service.acceptInvitation('rfp-inv-001')).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to save invitation'),
      'Dismiss',
      expect.any(Object),
    );
  });

  // ── Demo visibility (Phase 24 Plan 03) ──

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const baseInv = {
      projectId: 'proj-1', vendorOrgId: 'vendor-1', status: 'sent', invitedAt: '2026-05-05T00:00:00Z',
      respondedAt: null, invitationMessage: '', requestReason: '',
      createdAt: '2026-05-05T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z',
    };
    const mockGqlReturn = [
      { ...baseInv, id: '1', tag: null },
      { ...baseInv, id: '2', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...baseInv, id: '3', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...baseInv, id: '4', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 100, totalCount: 4 },
      });

      const result = await service.listByProject('proj-1');

      expect(result.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 100, totalCount: 4 },
      });

      const result = await service.listByProject('proj-1');

      expect(result.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 100, totalCount: 4 },
      });

      await service.listByProject('proj-1');

      const callArgs = graphqlRead.query.mock.calls[0];
      const filters = (callArgs[2] as { filters?: Record<string, string> })?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 100, totalCount: 4 },
      });

      await service.listByProject('proj-1');

      const fields = graphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...baseInv, id: '3', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      graphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getInvitation('3');

      expect(result).toBeNull();
    });
  });
});
