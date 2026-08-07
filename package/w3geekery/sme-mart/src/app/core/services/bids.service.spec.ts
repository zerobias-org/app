/**
 * Unit Tests for BidsService Invitation Controls (Plan 14 Wave 1)
 *
 * Tests verify submitBid() access control gate logic for invitation-only projects.
 * Integration with RfpInvitationService is tested through pure logic validation.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BidsService } from './bids.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ProjectContextService } from './project-context.service';
import { NotificationService } from './notification.service';
import { BID_FIELD_MAPPING } from '../field-mappings';
import { fakeProjectContextService } from '../../test-helpers/angular';

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

    // Verify project mapping — scalar projectId, not a GQL link
    expect(mapping.projectId).toBe('project_id');

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

    // Verify project mapping — scalar projectId, not a GQL link
    expect(mapping.project_id).toBe('projectId');

    // Verify legacy engagement mapping
    expect(mapping.request_id).toBe('engagementId');
  });
});

describe('BidsService CRUD with Error Handling', () => {
  let service: BidsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPipeline: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGql: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotifications: any;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    mockPipeline = {
      pushEntity: vi.fn().mockResolvedValue(undefined),
      getCached: vi.fn().mockReturnValue(null),
      seedCache: vi.fn(),
    };
    mockGql = {
      query: vi.fn().mockResolvedValue({ items: [], page: { totalCount: 0 } }),
      getById: vi.fn().mockResolvedValue(null),
      rawQuery: vi.fn().mockResolvedValue({ Bid: [] }),
    };
    mockNotifications = { create: vi.fn().mockResolvedValue(undefined) };
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false); // non-admin by default

    TestBed.configureTestingModule({
      providers: [
        BidsService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGql },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(BidsService);
  });

  describe('submitBid error handling', () => {
    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network failure');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.submitBid({
          project_id: 'proj-1',
          provider_id: 'vendor-1',
          cover_letter: 'Test bid',
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save bid'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });
});

// The Plan 14 Wave 1 invitation-controls suite was removed with the gate it tested.
// submitBid no longer reads SmeMartProject.isInvitationOnly — that class is retired and
// the field has no platform.Project equivalent, so the gate could not be ported. These
// tests come back when the RFP surface re-establishes invitation-only bidding.
