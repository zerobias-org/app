/**
 * Shared test data factories for SME Mart domain models.
 *
 * Each factory returns a valid object with sensible defaults.
 * Pass `overrides` to customize individual fields.
 */

import type {
  Bid,
  BidSummaryRow,
  Notification,
} from '../core/models';
import type { TagView } from '@zerobias-com/platform-sdk';

import {
  TEST_WR_ID,
  TEST_BID_ID,
  TEST_USER_ID,
  TEST_VENDOR_USER_ID,
  TEST_CREATED_AT,
  TEST_UPDATED_AT,
  TEST_NOTIFICATION_ID,
} from './constants';

// ---------------------------------------------------------------------------
// Bids
// ---------------------------------------------------------------------------

export function makeBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: TEST_BID_ID,
    request_id: TEST_WR_ID,
    provider_id: TEST_VENDOR_USER_ID,
    status: 'pending',
    cover_letter: 'We can help.',
    proposed_price: '5000',
    proposed_timeline: '2 weeks',
    created_at: TEST_CREATED_AT,
    updated_at: TEST_UPDATED_AT,
    ...overrides,
  } as Bid;
}

export function makeBidSummaryRow(overrides: Partial<BidSummaryRow> = {}): BidSummaryRow {
  return {
    id: TEST_BID_ID,
    request_id: TEST_WR_ID,
    provider_id: TEST_VENDOR_USER_ID,
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

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function makeTag(name: string, id = 'tag-001'): TagView {
  return { id, name, description: `Tag: ${name}` } as unknown as TagView;
}

// ---------------------------------------------------------------------------
// RFP Wizard
// ---------------------------------------------------------------------------


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
