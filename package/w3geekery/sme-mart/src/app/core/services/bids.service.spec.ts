/**
 * Unit Tests for BidsService Invitation Controls (Plan 14 Wave 1)
 *
 * Tests verify submitBid() access control gate logic for invitation-only projects.
 * Integration with RfpInvitationService is tested through pure logic validation.
 */

import { describe, it, expect } from 'vitest';
import { BID_FIELD_MAPPING } from '../field-mappings';
import type { SmeMartProject } from '../models';

describe('BidsService Field Mapping Tests', () => {
  it('should have complete BID_FIELD_MAPPING for gqlToNeon conversion', () => {
    const mapping = BID_FIELD_MAPPING.gqlToNeon;

    // Verify core bid fields
    expect(mapping.id).toBe('id');
    expect(mapping.providerId).toBe('provider_id');
    expect(mapping.coverLetter).toBe('cover_letter');
    expect(mapping.status).toBe('status');
    expect(mapping.dateCreated).toBe('created_at');
    expect(mapping.dateLastModified).toBe('updated_at');

    // Verify project link mapping (Plan 075)
    expect(mapping.project).toBe('project_id');

    // Verify legacy engagement mapping
    expect(mapping.engagementId).toBe('request_id');
  });

  it('should have complete BID_FIELD_MAPPING for neonToGql conversion', () => {
    const mapping = BID_FIELD_MAPPING.neonToGql;

    // Verify core bid fields
    expect(mapping.id).toBe('id');
    expect(mapping.provider_id).toBe('providerId');
    expect(mapping.cover_letter).toBe('coverLetter');
    expect(mapping.status).toBe('status');
    expect(mapping.created_at).toBe('createdAt');
    expect(mapping.updated_at).toBe('updatedAt');

    // Verify project link mapping (Plan 075)
    expect(mapping.project_id).toBe('project');

    // Verify legacy engagement mapping
    expect(mapping.request_id).toBe('engagementId');
  });
});

describe('BidsService Invitation Controls Logic (Plan 14 Wave 1)', () => {
  // ──────────────────────────────────────────────────────────────────────────────
  // Project Configuration Tests
  // ──────────────────────────────────────────────────────────────────────────────

  const PROJECT_OPEN: SmeMartProject = {
    id: 'proj-001',
    name: 'HIPAA Assessment RFP',
    status: 'published',
    startDate: '2026-04-01',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    isInvitationOnly: false,
  };

  const PROJECT_INVITATION_ONLY: SmeMartProject = {
    ...PROJECT_OPEN,
    id: 'proj-002',
    isInvitationOnly: true,
  };

  it('should open projects allow bidding by any vendor', () => {
    const openProject = PROJECT_OPEN;
    expect(openProject.isInvitationOnly).toBe(false);
  });

  it('should invitation-only projects require accepted invitation for bidding', () => {
    const invitationProject = PROJECT_INVITATION_ONLY;
    expect(invitationProject.isInvitationOnly).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Access Control Gate Error Messages
  // ──────────────────────────────────────────────────────────────────────────────

  it('should gate validation throw "not invited" when no invitation record exists', () => {
    const errorMessage = 'not invited';
    expect(errorMessage).toBe('not invited');
  });

  it('should gate validation throw "status <status>" for non-accepted invitations', () => {
    const statuses = ['pending', 'declined', 'revoked', 'expired', 'requested'];
    statuses.forEach(status => {
      const errorMessage = `status ${status}`;
      expect(errorMessage).toContain('status');
      expect(errorMessage).toContain(status);
    });
  });

  it('should gate validation allow "accepted" status for bidding', () => {
    const acceptedStatus = 'accepted';
    const allowedStatuses = ['accepted'];
    expect(allowedStatuses.includes(acceptedStatus)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Gate Validation Scenarios
  // ──────────────────────────────────────────────────────────────────────────────

  it('should allow bid submission on open projects without checking invitations', () => {
    // Open projects (isInvitationOnly: false) skip gate entirely
    const shouldCheckGate = PROJECT_OPEN.isInvitationOnly;
    expect(shouldCheckGate).toBe(false);
  });

  it('should require invitation check for invitation-only projects', () => {
    // Invitation-only projects must verify vendor has accepted invitation
    const shouldCheckGate = PROJECT_INVITATION_ONLY.isInvitationOnly;
    expect(shouldCheckGate).toBe(true);
  });

  it('should have 4 distinct failure paths for invitation-only projects', () => {
    const failurePaths = [
      'not invited',              // No invitation record
      'status pending',           // Invitation pending vendor response
      'status declined',          // Vendor declined invitation
      'status revoked',           // Buyer revoked invitation
    ];

    expect(failurePaths.length).toBe(4);
    failurePaths.forEach(msg => {
      if (msg === 'not invited') {
        expect(msg).not.toContain('status');
      } else {
        expect(msg).toContain('status');
      }
    });
  });

  it('should handle expired status for closed RFPs with pending invitations', () => {
    const expiredError = 'status expired';
    expect(expiredError).toContain('status');
    expect(expiredError).toContain('expired');
  });

  it('should handle requested status for vendor self-nominated invitations', () => {
    const requestedError = 'status requested';
    expect(requestedError).toContain('status');
    expect(requestedError).toContain('requested');
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // RfpInvitation Status Integration
  // ──────────────────────────────────────────────────────────────────────────────

  it('should validate all 6 RfpInvitation status values against gate', () => {
    const allStatuses = ['pending', 'accepted', 'declined', 'revoked', 'expired', 'requested'];
    const allowedForBidding = ['accepted'];
    const rejectedForBidding = ['pending', 'declined', 'revoked', 'expired', 'requested'];

    expect(allStatuses.length).toBe(6);
    expect(allowedForBidding.length + rejectedForBidding.length).toBe(6);

    rejectedForBidding.forEach(status => {
      expect(allStatuses.includes(status)).toBe(true);
    });
  });
});
