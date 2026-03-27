/**
 * GraphQL Response Fixtures for SME Mart Entities
 *
 * Realistic test data matching actual GQL response structures from AuditgraphDB.
 * Used by roundtrip tests to mock GraphQL API responses without real HTTP calls.
 *
 * Generated: 2026-03-18
 */

import type {
  GqlEngagementResponse,
  GqlBidResponse,
  GqlBidResponseResponse,
  GqlNoteResponse,
  GqlNoteFolderResponse,
  GqlServiceOfferingResponse,
  GqlReviewResponse,
  GqlDocumentResponse,
  ComplianceStatus,
} from '../core/gql-types';

// ─────────────────────────────────────────────────────────────────────────────
// Engagement Fixture (with nested Bids)
// ─────────────────────────────────────────────────────────────────────────────

export const ENGAGEMENT_GQL_FIXTURE: GqlEngagementResponse = {
  id: 'eng-001-uuid-hipaa-assessment',
  name: 'HIPAA Compliance Assessment for Regional Healthcare Provider',
  description: 'Comprehensive HIPAA compliance review including audit, documentation, and remediation plan.',
  buyerZerobiasUserId: 'user-buyer-001-uuid',
  buyerZerobiasOrgId: '28efd6b5-fd17-5b56-a45e-fe3263189666',
  status: 'in_progress',
  engagementTag: 'sme-mart.eng.hipaa-assessment-2026',
  zerobiasTagId: 'tag-uuid-001',
  zerobiasTaskId: 'task-uuid-001',
  createdAt: '2026-03-18T10:00:00Z',
  updatedAt: '2026-03-18T14:30:00Z',
};

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
// Note and NoteFolder Fixtures
// ─────────────────────────────────────────────────────────────────────────────

export const NOTE_FOLDER_GQL_FIXTURE: GqlNoteFolderResponse = {
  id: 'folder-001-uuid-assessment-phase',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  parentId: null,
  name: 'Assessment Phase',
  description: 'Notes from initial compliance assessment period',
  createdByZerobiasUserId: 'user-buyer-001-uuid',
  accessLevel: 'boundary',
  sortOrder: 1,
  color: '#3F51B5',
  createdAt: '2026-03-18T10:30:00Z',
  updatedAt: '2026-03-18T10:30:00Z',
};

export const NOTE_GQL_FIXTURE: GqlNoteResponse = {
  id: 'note-001-uuid-kickoff-call',
  name: 'Kickoff Call Notes',
  content: '**Attendees:** Buyer team, Provider team lead\n\n**Key Findings:**\n- Organization has 250+ employees\n- Current systems: Epic EHR, MEDIDATA clinical trial management\n- Previous audits: SOC2 Type 2 in 2024\n\n**Next Steps:**\n1. Schedule technical deep-dives with IT team\n2. Collect documentation on data handling procedures\n3. Review current security policies',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  folderId: 'folder-001-uuid-assessment-phase',
  authorZerobiasUserId: 'user-buyer-001-uuid',
  updatedByZerobiasUserId: 'user-buyer-001-uuid',
  createdAt: '2026-03-18T10:35:00Z',
  updatedAt: '2026-03-18T10:35:00Z',
  archived: false,
  accessLevel: 'boundary',
  isMeetingMinutes: true,
  meetingDate: '2026-03-18T09:00:00Z',
  meetingDurationMinutes: 45,
  backingTaskId: null,
  injectedToTaskId: null,
  injectedCommentId: null,
  injectedAt: null,
  boundaryId: '2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2',
  projectId: null,
};

export const NOTE_GQL_FIXTURE_PERSONAL: GqlNoteResponse = {
  id: 'note-002-uuid-provider-questions',
  name: 'Questions for Provider',
  content: '**Review Comments from Ben:**\n- Need clarification on incident response procedures (page 3)\n- Encryption key management - ask about HSM implementation\n- Backup testing frequency and documentation\n\n**Follow-up Items:**\n1. Schedule call with provider security team\n2. Request additional documentation on disaster recovery',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  folderId: 'folder-001-uuid-assessment-phase',
  authorZerobiasUserId: 'user-buyer-001-uuid',
  updatedByZerobiasUserId: 'user-buyer-001-uuid',
  createdAt: '2026-03-18T11:00:00Z',
  updatedAt: '2026-03-18T11:00:00Z',
  archived: false,
  accessLevel: 'personal', // Personal note, not shared
  isMeetingMinutes: false,
  meetingDate: null,
  meetingDurationMinutes: null,
  backingTaskId: null,
  injectedToTaskId: null,
  injectedCommentId: null,
  injectedAt: null,
  boundaryId: '2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2',
  projectId: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// ServiceOffering Fixture
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICE_OFFERING_GQL_FIXTURE: GqlServiceOfferingResponse = {
  id: 'svc-001-uuid-hipaa-audit',
  name: 'HIPAA Compliance Audit and Documentation',
  description:
    'Complete HIPAA compliance audit with gap analysis, policy documentation, and remediation roadmap for healthcare organizations.',
  providerId: 'provider-001-uuid',
  category: 'compliance',
  subcategory: 'healthcare',
  pricingType: 'fixed',
  price: '15000',
  deliveryTime: '30 days',
  includes: [
    'On-site assessment (2-3 days)',
    'Gap analysis report',
    'Documentation templates',
    'Remediation roadmap',
    'Executive briefing',
  ],
  requirements: 'Organization must have 20+ employees and existing healthcare systems',
  isActive: true,
  createdAt: '2026-02-01T09:00:00Z',
  updatedAt: '2026-03-15T14:00:00Z',
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

// ─────────────────────────────────────────────────────────────────────────────
// Document Fixture
// ─────────────────────────────────────────────────────────────────────────────

export const DOCUMENT_GQL_FIXTURE: GqlDocumentResponse = {
  id: 'doc-001-uuid-hipaa-audit-report',
  name: 'HIPAA_Audit_Report_Final.pdf',
  description: 'Final audit report with findings and recommendations',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  zbFileId: 'file-uuid-001',
  zbFileVersionId: 'file-version-uuid-001',
  filename: 'HIPAA_Audit_Report_Final.pdf',
  fileSizeBytes: 2457600, // 2.4 MB
  mimeType: 'application/pdf',
  documentType: 'compliance',
  displayName: 'Final Audit Report',
  zbTaskId: 'task-uuid-001',
  zbTaskAttachmentId: 'attachment-uuid-001',
  archived: false,
  uploadedByZerobiasUserId: 'user-provider-001-uuid',
  createdAt: '2026-03-18T14:30:00Z',
  updatedAt: '2026-03-18T14:30:00Z',
};

export const DOCUMENT_GQL_FIXTURE_SOW: GqlDocumentResponse = {
  id: 'doc-002-uuid-statement-of-work',
  name: 'SOW_HIPAA_Audit.pdf',
  description: 'Statement of Work for HIPAA compliance audit engagement',
  engagementId: 'eng-001-uuid-hipaa-assessment',
  zbFileId: 'file-uuid-002',
  zbFileVersionId: 'file-version-uuid-002',
  filename: 'SOW_HIPAA_Audit.pdf',
  fileSizeBytes: 156800, // 150 KB
  mimeType: 'application/pdf',
  documentType: 'sow',
  displayName: 'Statement of Work',
  zbTaskId: 'task-uuid-002',
  zbTaskAttachmentId: 'attachment-uuid-002',
  archived: false,
  uploadedByZerobiasUserId: 'user-buyer-001-uuid',
  createdAt: '2026-03-18T09:30:00Z',
  updatedAt: '2026-03-18T09:30:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Composite Fixtures (with nested relationships)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Engagement with nested relationships (bids moved to SmeMartProject in Plan 075)
 */
export const ENGAGEMENT_WITH_NOTES_GQL_FIXTURE: GqlEngagementResponse = {
  ...ENGAGEMENT_GQL_FIXTURE,
  notes: [NOTE_GQL_FIXTURE, NOTE_GQL_FIXTURE_PERSONAL],
};

/**
 * NoteFolder with nested notes array and hierarchical folder structure
 */
export const NOTE_FOLDER_WITH_NOTES_GQL_FIXTURE: GqlNoteFolderResponse = {
  ...NOTE_FOLDER_GQL_FIXTURE,
  notes: [NOTE_GQL_FIXTURE, NOTE_GQL_FIXTURE_PERSONAL],
  children: [],
};
