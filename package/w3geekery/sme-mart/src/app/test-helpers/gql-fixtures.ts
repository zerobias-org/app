/**
 * GraphQL Response Fixtures for SME Mart Entities
 *
 * Realistic test data matching actual GQL response structures from AuditgraphDB.
 * Used by roundtrip tests to mock GraphQL API responses without real HTTP calls.
 *
 * Generated: 2026-03-18
 */

import type {
  GqlBidResponse,
  GqlBidResponseResponse,
  GqlReviewResponse,
  ComplianceStatus,
} from '../core/gql-types';
import type { GqlVendorListingResponse } from '../core/gql-types/vendor-listing.types';

// ─────────────────────────────────────────────────────────────────────────────
// Bid Fixtures
// ─────────────────────────────────────────────────────────────────────────────

export const BID_GQL_FIXTURE: GqlBidResponse = {
  id: 'bid-001-uuid-compliance-experts',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  providerId: 'provider-001-uuid',
  coverLetter:
    'Our firm specializes in healthcare compliance with 15+ years of HIPAA audit experience. We have assisted over 50 healthcare providers in achieving and maintaining HIPAA compliance.',
  proposedPrice: '18000',
  proposedTimeline: '4 weeks',
  executiveSummary: 'Complete HIPAA audit including gap analysis, documentation review, and remediation roadmap.',
  teamDescription: '5-person team: 1 HIPAA compliance specialist, 2 security architects, 2 project coordinators',
  totalEstimatedHours: 160,
  pricingBreakdown: [
    {
      taskType: 'audit',
      estimatedHours: 80,
      estimatedCost: 8000,
      notes: 'Initial assessment and documentation review',
    },
    {
      taskType: 'documentation',
      estimatedHours: 60,
      estimatedCost: 6000,
      notes: 'Policy development and procedure documentation',
    },
    {
      taskType: 'remediation_plan',
      estimatedHours: 20,
      estimatedCost: 4000,
      notes: 'Detailed action plan for identified gaps',
    },
  ],
  status: 'PENDING',
  wizardData: {
    approach: {
      executiveSummary: 'Complete HIPAA audit including gap analysis...',
      coverLetter: 'Our firm specializes in healthcare compliance...',
    },
    team: {
      teamDescription: '5-person team...',
    },
    pricing: {
      proposedPrice: '18000',
      proposedTimeline: '4 weeks',
      totalEstimatedHours: 160,
      pricingBreakdown: [
        { taskType: 'audit', estimatedHours: 80, estimatedCost: 8000 },
      ],
    },
  },
  wizardStep: 5, // Completed all steps
  aiAssisted: false,
  aiModel: 'claude-3.5-sonnet',
  aiGeneratedAt: '2026-03-18T11:00:00Z',
  createdAt: '2026-03-18T11:00:00Z',
  updatedAt: '2026-03-18T14:15:00Z',
};

export const BID_GQL_FIXTURE_DRAFT: GqlBidResponse = {
  id: 'bid-002-uuid-draft',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  providerId: 'provider-002-uuid',
  coverLetter: 'We have cybersecurity expertise...',
  status: 'DRAFT',
  wizardData: {
    approach: {
      coverLetter: 'We have cybersecurity expertise...',
    },
  },
  wizardStep: 1, // Only completed approach step
  aiAssisted: false,
  createdAt: '2026-03-18T12:00:00Z',
  updatedAt: '2026-03-18T12:05:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// BidResponse Fixture (compliance response to requirement)
// ─────────────────────────────────────────────────────────────────────────────

export const BID_RESPONSE_GQL_FIXTURE: GqlBidResponseResponse = {
  id: 'bid-resp-001-uuid',
  bidId: 'bid-001-uuid-compliance-experts',
  requirementId: 'req-001-uuid-data-encryption',
  complianceStatus: 'met' as ComplianceStatus,
  responseText: 'Encryption is implemented using AES-256 for all data at rest and TLS 1.2 for data in transit.',
  estimatedHours: 0,
  estimatedCost: 0,
  certificationRef: 'SOC2_Type2_2025',
  readyDate: '2026-03-18',
  respondedAt: '2026-03-18T11:30:00Z',
  createdAt: '2026-03-18T11:30:00Z',
  updatedAt: '2026-03-18T11:30:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// VendorListing Fixture (was ServiceOffering, retired in smemart 2.0.8)
//
// Note the two shape changes this fixture demonstrates: the old `includes` string[]
// is now the free-text `includesSummary`, and price/pricingType have NO successor -
// the listing stores no money, so `offers` carries a Ledger pointer instead.
// ─────────────────────────────────────────────────────────────────────────────

export const VENDOR_LISTING_GQL_FIXTURE: GqlVendorListingResponse = {
  id: 'svc-001-uuid-hipaa-audit',
  name: 'HIPAA Compliance Audit and Documentation',
  title: 'HIPAA Compliance Audit and Documentation',
  summary:
    'Complete HIPAA compliance audit with gap analysis, policy documentation, and remediation roadmap for healthcare organizations.',
  ownerId: 'provider-001-uuid',
  family: 'SERVICE',
  kind: 'BESPOKE_SERVICE',
  fulfillment: 'ENGAGEMENT',
  lifecycle: 'LISTED',
  catalogRef: null,
  active: true,
  offers: [{ offerId: 'offer-001-uuid', label: 'Fixed price' }],
  terms: null,
  deliveryTime: '30 days',
  includesSummary:
    'On-site assessment (2-3 days); Gap analysis report; Documentation templates; Remediation roadmap; Executive briefing',
  prerequisitesSummary:
    'Organization must have 20+ employees and existing healthcare systems',
  version: 1,
  publishedAt: '2026-02-01T09:00:00Z',
  dateCreated: '2026-02-01T09:00:00Z',
  dateLastModified: '2026-03-15T14:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Review Fixture
// ─────────────────────────────────────────────────────────────────────────────

export const REVIEW_GQL_FIXTURE: GqlReviewResponse = {
  id: 'review-001-uuid',
  name: 'Excellent HIPAA Audit by Compliance Experts',
  providerId: 'provider-001-uuid',
  reviewerZerobiasUserId: 'user-buyer-001-uuid',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  rating: 5,
  reviewText:
    'Outstanding work from the compliance team. They were thorough, professional, and provided clear actionable recommendations. Highly recommend for any healthcare organization.',
  approved: true,
  approvedAt: '2026-03-18T16:00:00Z',
  approvedBy: 'user-admin-uuid',
  createdAt: '2026-03-18T15:30:00Z',
  updatedAt: '2026-03-18T16:00:00Z',
};
