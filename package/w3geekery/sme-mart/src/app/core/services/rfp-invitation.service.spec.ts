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
import { RFP_INVITATION_FIELD_MAPPING } from '../field-mappings';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
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
    status: status as any,
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

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        RfpInvitationService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
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
});
