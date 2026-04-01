/**
 * EngagementVettingItem — corporate compliance checklist items for engagements.
 *
 * Each engagement tracks org-to-org vetting requirements (D&B, MSA, insurance, etc.).
 * Bidirectional: buyer and provider each have requirements of the other.
 *
 * Plan 063: Corporate Vetting Flow
 */

// ── Types ──

export type VettingCategory = 'always' | 'conditional' | 'nice_to_have';

export type VettingType =
  | 'corporate_identity'
  | 'insurance'
  | 'compliance'
  | 'financial'
  | 'legal'
  | 'reference'
  | 'certification'
  | 'documentation';

export type VettingStatus =
  | 'not_started'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'waived';

export type VettingEvidenceType = 'document' | 'form' | 'certification' | 'attestation' | 'reference';

export type VettingDirection = 'buyer_requires' | 'provider_requires';

// ── Model (snake_case — Neon shape used by UI components) ──

export interface EngagementVettingItem {
  id: string;
  engagement_id: string;
  name: string;
  description: string | null;
  category: VettingCategory;
  vetting_type: VettingType;
  evidence_type: VettingEvidenceType;
  status: VettingStatus;
  direction: VettingDirection;
  condition_trigger: string | null;
  document_ids: string[];
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  waived_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile_item_id?: string | null;
}

// ── Requests ──

export interface CreateVettingItemRequest {
  name: string;
  description?: string;
  category: VettingCategory;
  vetting_type: VettingType;
  evidence_type: VettingEvidenceType;
  direction: VettingDirection;
  condition_trigger?: string;
}

export interface UpdateVettingItemRequest {
  name?: string;
  description?: string;
  status?: VettingStatus;
  document_ids?: string[];
  notes?: string;
  verified_by?: string;
  expires_at?: string;
  rejection_reason?: string;
  waived_reason?: string;
  profile_item_id?: string | null;
}

// ── Summary (for tab badge) ──

export interface VettingSummary {
  total: number;
  verified: number;
  waived: number;
  pending: number;       // not_started + submitted + under_review
  rejected: number;
  expired: number;
  requiredRemaining: number; // "always" items not yet verified/waived
  gateStatus: VettingGateStatus; // overall vetting gate
}

/** Vetting gate status — drives the engagement header chip and tab banner. */
export type VettingGateStatus = 'not_started' | 'in_progress' | 'blocked' | 'verified';

// ── Valid status transitions ──

export const VETTING_STATUS_TRANSITIONS: Record<VettingStatus, VettingStatus[]> = {
  not_started:  ['submitted', 'waived'],
  submitted:    ['under_review', 'rejected', 'waived'],
  under_review: ['verified', 'rejected'],
  verified:     ['expired'],
  rejected:     ['submitted', 'waived'],
  expired:      ['submitted'],
  waived:       ['not_started'],
};

// ── Default templates (Brian's 6 "always required" items) ──

export interface VettingTemplate {
  name: string;
  description: string;
  category: VettingCategory;
  vetting_type: VettingType;
  evidence_type: VettingEvidenceType;
  direction: VettingDirection;
}

export const DEFAULT_VETTING_TEMPLATES: VettingTemplate[] = [
  {
    name: 'D&B Rating',
    description: 'Dun & Bradstreet financial health rating and credit report',
    category: 'always',
    vetting_type: 'financial',
    evidence_type: 'document',
    direction: 'buyer_requires',
  },
  {
    name: 'MSA (Master Service Agreement)',
    description: 'Signed Master Service Agreement governing the engagement terms',
    category: 'always',
    vetting_type: 'legal',
    evidence_type: 'document',
    direction: 'buyer_requires',
  },
  {
    name: 'Banking Information',
    description: 'Wire transfer details, payment terms, and banking references',
    category: 'always',
    vetting_type: 'financial',
    evidence_type: 'document',
    direction: 'buyer_requires',
  },
  {
    name: 'Officer Background Checks',
    description: 'Background verification for company principals and executives',
    category: 'always',
    vetting_type: 'compliance',
    evidence_type: 'certification',
    direction: 'buyer_requires',
  },
  {
    name: 'Corporate Entity Verification',
    description: 'Articles of incorporation, business license, entity type (C Corp, LLC, etc.)',
    category: 'always',
    vetting_type: 'corporate_identity',
    evidence_type: 'document',
    direction: 'buyer_requires',
  },
  {
    name: 'Financial Statements',
    description: 'Audited financial statements, bank letter of good standing',
    category: 'always',
    vetting_type: 'financial',
    evidence_type: 'document',
    direction: 'buyer_requires',
  },
];
