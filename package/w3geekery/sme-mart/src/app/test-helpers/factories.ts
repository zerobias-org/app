/**
 * Shared test data factories for SME Mart domain models.
 *
 * Each factory returns a valid object with sensible defaults.
 * Pass `overrides` to customize individual fields.
 */

import type {
  Bid,
  BidSummaryRow,
  Engagement,
  EngagementSummaryRow,
  EngagementDetailRow,
  SmeMartProject,
  Note,
  NoteWithTags,
  Notification,
  RfpTaskGroup,
} from '../core/models';
import type { OrgDocument, OrgDocumentDetail, OrgDocumentShare } from '../core/models/org-document.model';
import type { EngagementDocument } from '../core/models/document.model';

import type { BidCardData } from '../shared/components/bid-card/bid-card.component';
import type { ComparisonBid } from '../shared/components/bid-comparison/bid-comparison.component';
import type { TagView } from '@zerobias-com/platform-sdk';

import {
  TEST_WR_ID,
  TEST_BID_ID,
  TEST_USER_ID,
  TEST_PROVIDER_USER_ID,
  TEST_NOTE_ID,
  TEST_DOC_ID,
  TEST_ORG_ID,
  TEST_TAG_ID,
  TEST_ENG_ID,
  TEST_CREATED_AT,
  TEST_UPDATED_AT,
  TEST_NOTIFICATION_ID,
} from './constants';

// ---------------------------------------------------------------------------
// Work Requests & Engagements
// ---------------------------------------------------------------------------

export function makeEngagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: TEST_WR_ID,
    title: 'HIPAA Assessment',
    status: 'open',
    category: 'compliance',
    buyer_zerobias_user_id: TEST_USER_ID,
    created_at: TEST_CREATED_AT,
    ...overrides,
  } as Engagement;
}

export function makeEngagementSummaryRow(overrides: Partial<EngagementSummaryRow> = {}): EngagementSummaryRow {
  return {
    id: TEST_WR_ID,
    title: 'HIPAA Assessment',
    description: 'Full compliance review',
    status: 'open',
    category: 'compliance',
    buyer_zerobias_user_id: TEST_USER_ID,
    created_at: TEST_CREATED_AT,
    budget_max: '15000',
    engagement_tag: null,
    accepted_provider_id: null,
    ...overrides,
  } as EngagementSummaryRow;
}

export function makeEngagementDetailRow(overrides: Partial<EngagementDetailRow> = {}): EngagementDetailRow {
  return {
    id: TEST_WR_ID,
    title: 'HIPAA Assessment',
    description: 'Full review',
    status: 'open',
    category: 'compliance',
    buyer_zerobias_user_id: TEST_USER_ID,
    engagement_tag: null,
    created_at: TEST_CREATED_AT,
    ...overrides,
  } as EngagementDetailRow;
}

// ---------------------------------------------------------------------------
// SmeMartProject (Plan 075 — RFP + Project container)
// ---------------------------------------------------------------------------

export function makeSmeMartProject(overrides: Partial<SmeMartProject> = {}): SmeMartProject {
  return {
    id: TEST_ENG_ID,
    name: 'HIPAA Assessment',
    description: 'Full compliance review',
    status: 'draft',
    startDate: TEST_CREATED_AT,
    targetEndDate: TEST_UPDATED_AT,
    createdAt: TEST_CREATED_AT,
    updatedAt: TEST_UPDATED_AT,
    category: 'compliance',
    budgetType: 'fixed',
    budgetMin: 5000,
    budgetMax: 15000,
    timeline: '4 weeks',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Bids
// ---------------------------------------------------------------------------

export function makeBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: TEST_BID_ID,
    request_id: TEST_WR_ID,
    provider_id: TEST_PROVIDER_USER_ID,
    status: 'pending',
    cover_letter: 'We can help.',
    proposed_price: '5000',
    proposed_timeline: '2 weeks',
    created_at: TEST_CREATED_AT,
    updated_at: TEST_UPDATED_AT,
    ...overrides,
  } as Bid;
}

export function makeBidCardData(overrides: Partial<BidCardData> = {}): BidCardData {
  return {
    id: TEST_BID_ID,
    provider_id: TEST_PROVIDER_USER_ID,
    provider_display_name: 'Jane Smith',
    provider_headline: 'Security Consultant',
    provider_rating: 4.5,
    cover_letter: 'We are well positioned.',
    proposed_price: '7500',
    proposed_timeline: '3 weeks',
    status: 'pending',
    created_at: TEST_CREATED_AT,
    ...overrides,
  };
}

export function makeBidSummaryRow(overrides: Partial<BidSummaryRow> = {}): BidSummaryRow {
  return {
    id: TEST_BID_ID,
    request_id: TEST_WR_ID,
    provider_id: TEST_PROVIDER_USER_ID,
    cover_letter: 'Our approach covers all requirements.',
    proposed_price: '12000',
    proposed_timeline: '6 weeks',
    status: 'pending',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-02T08:00:00Z',
    executive_summary: 'We propose a phased approach.',
    team_description: '3 senior consultants.',
    total_estimated_hours: 120,
    pricing_breakdown: [
      { taskType: 'Assessment', estimatedHours: 40, estimatedCost: 4000 },
      { taskType: 'Remediation', estimatedHours: 80, estimatedCost: 8000 },
    ],
    rfp_title: 'SOC2 Compliance',
    category: 'compliance',
    budget_type: 'fixed',
    budget_min: '10000',
    budget_max: '15000',
    total_responses: 10,
    met_count: 7,
    partial_count: 2,
    not_met_count: 0,
    na_count: 0,
    planned_count: 1,
    sum_estimated_hours: 120,
    sum_estimated_cost: 12000,
    provider_display_name: 'Jane Smith',
    provider_headline: 'Security Expert',
    provider_rating: 4.8,
    ...overrides,
  } as BidSummaryRow;
}

export function makeComparisonBid(overrides: Partial<ComparisonBid> = {}): ComparisonBid {
  return {
    id: TEST_BID_ID,
    provider_display_name: 'Alice Jones',
    provider_headline: 'GRC Expert',
    proposed_price: '10000',
    proposed_timeline: '4 weeks',
    total_estimated_hours: 80,
    status: 'pending',
    compliance: { met: 8, partially_met: 1, not_met: 1, not_applicable: 0, planned: 0, total: 10, responded: 10 },
    categoryCompliance: [
      { category: 'Security', met: 5, total: 6 },
      { category: 'Privacy', met: 3, total: 4 },
    ],
    sum_estimated_cost: 10000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: TEST_NOTE_ID,
    engagement_id: TEST_WR_ID,
    author_zerobias_user_id: TEST_USER_ID,
    title: 'Meeting Notes',
    body: '# Notes\n\nDiscussed scope.',
    folder_id: null,
    access_level: 'boundary',
    is_meeting_minutes: false,
    archived: false,
    created_at: TEST_CREATED_AT,
    updated_at: TEST_UPDATED_AT,
    ...overrides,
  } as Note;
}

export function makeNoteWithTags(overrides: Partial<NoteWithTags> = {}): NoteWithTags {
  return { ...makeNote(), tags: [], ...overrides } as NoteWithTags;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function makeOrgDocument(overrides: Partial<OrgDocument> = {}): OrgDocument {
  return {
    id: TEST_DOC_ID,
    org_id: TEST_ORG_ID,
    zb_file_id: 'file-001',
    zb_file_version_id: 'ver-001',
    filename: 'exhibit-f.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 102400,
    document_type: 'security_requirements',
    display_name: 'Exhibit F',
    description: 'Security requirements document',
    uploaded_by_zerobias_user_id: TEST_USER_ID,
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived: false,
    ...overrides,
  };
}

export function makeOrgDocumentDetail(overrides: Partial<OrgDocumentDetail> = {}): OrgDocumentDetail {
  return {
    ...makeOrgDocument(),
    project_share_count: 0,
    engagement_share_count: 1,
    task_share_count: 0,
    has_restricted_shares: false,
    ...overrides,
  };
}

export function makeOrgDocumentShare(overrides: Partial<OrgDocumentShare> = {}): OrgDocumentShare {
  return {
    id: TEST_TAG_ID,
    document_id: TEST_DOC_ID,
    shared_with_type: 'engagement',
    shared_with_id: TEST_ENG_ID,
    visibility: 'all',
    granted_at: '2026-03-10T00:00:00Z',
    granted_by: TEST_USER_ID,
    ...overrides,
  };
}

export function makeEngagementDocument(overrides: Partial<EngagementDocument> = {}): EngagementDocument {
  return {
    id: 'doc-001',
    org_id: TEST_ORG_ID,
    engagement_id: TEST_WR_ID,
    zb_file_id: 'file-001',
    zb_file_version_id: 'ver-001',
    zb_task_id: null,
    zb_task_attachment_id: null,
    filename: 'exhibit-f.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 102400,
    document_type: 'security_requirements',
    display_name: 'Exhibit F',
    description: null,
    uploaded_by_zerobias_user_id: TEST_USER_ID,
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived: false,
    ...overrides,
  } as EngagementDocument;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function makeTag(name: string, id = 'tag-001'): TagView {
  return { id, name, description: `Tag: ${name}` } as any;
}

// ---------------------------------------------------------------------------
// RFP Wizard
// ---------------------------------------------------------------------------

export function makeTaskGroups(): RfpTaskGroup[] {
  return [
    {
      taskType: 'security_requirements',
      taskTypeTagId: 'tag-sec',
      taskTypeTagName: 'SECURITY',
      displayName: 'Security Requirements',
      requirements: [
        {
          id: 'req-1',
          taskType: 'security_requirements',
          title: 'Workforce Confidentiality',
          description: 'All personnel must sign NDAs',
          evidenceType: 'document',
          priority: 500,
          sortOrder: 0,
        },
        {
          id: 'req-2',
          taskType: 'security_requirements',
          title: 'Access Authorization',
          evidenceType: 'certification',
          priority: 1000,
          sortOrder: 1,
        },
      ],
    },
    {
      taskType: 'compliance',
      taskTypeTagId: 'tag-comp',
      taskTypeTagName: 'COMPLIANCE',
      displayName: 'Compliance Requirements',
      requirements: [
        {
          id: 'req-3',
          taskType: 'compliance',
          title: 'HIPAA Compliance',
          evidenceType: 'certification',
          priority: 1000,
          sortOrder: 0,
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: TEST_NOTIFICATION_ID,
    recipient_id: TEST_USER_ID,
    type: 'bid_received',
    card_type: 'notification',
    severity: 'info',
    title: 'New bid received',
    description: 'Jane Smith submitted a bid on HIPAA Assessment',
    image_url: null,
    resource_id: TEST_BID_ID,
    resource_type: 'bid',
    source: [],
    payload: {},
    read_at: null,
    dismissed_at: null,
    created_at: TEST_CREATED_AT,
    updated_at: TEST_UPDATED_AT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DOM / File
// ---------------------------------------------------------------------------

/** Create a File object for upload testing. */
export function makeFile(name: string, size = 1024, type = 'application/pdf'): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Create a paged result wrapper (matching DataProducer list format). */
export function makeListResult<T>(items: T[] = []) {
  return { items, totalCount: items.length };
}
