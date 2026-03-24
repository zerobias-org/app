/**
 * Demo Data Seeder — Reusable Fixtures and Builder Functions
 *
 * Provides demo data for all 8 migrated SME Mart entity types:
 * Engagement, Bid, BidResponse, Note, NoteFolder, SmeMartDocument, ServiceOffering, Review.
 *
 * Data sources: .claude/notes/demo-data-guide.md
 * Field naming: All fields use camelCase (matches GQL schema).
 *
 * Phase 5 Migration: Migrated from Neon SQL inserts to Pipeline writes.
 */

import type {
  DemoEngagement,
  DemoBid,
  DemoBidResponse,
  DemoNote,
  DemoNoteFolder,
  DemoSmeMartDocument,
  DemoServiceOffering,
  DemoReview,
} from '../core/models';

// ─────────────────────────────────────────────────────────────────────────────
// Engagement Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Engagements (5 active from demo-data-guide.md)
 * All are in 'in_progress' status with associated ZB Tasks.
 */
export const DEMO_ENGAGEMENTS: DemoEngagement[] = [
  {
    id: 'eng-001-crystal-harbor',
    name: 'SOC 2 Type I Fast-Track Assessment',
    description: 'Fast-track SOC 2 Type I assessment for healthcare startup',
    category: 'Assessors',
    buyerZerobiasUserId: 'demo-buyer-pinnacle',
    buyerZerobiasOrgId: 'org-pinnacle-corp',
    budgetType: 'fixed',
    budgetMin: 6000,
    budgetMax: 9000,
    timeline: '4 weeks',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.crystal-harbor',
    zerobiasTagId: 'e1864514-af28-4397-93a5-f05e443b05cb',
    zerobiasTaskId: 'abc5d715-b97d-4c76-a24b-95c643b68795',
    createdAt: new Date(2026, 2, 1).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
  },
  {
    id: 'eng-002-velvet-summit',
    name: 'NIST CSF Implementation Advisor',
    description: 'Advisory engagement for NIST CSF implementation',
    category: 'Advisors',
    buyerZerobiasUserId: 'buyer-fintech-002',
    buyerZerobiasOrgId: 'org-fintech-inc',
    budgetType: 'hourly',
    budgetMin: 150,
    budgetMax: 250,
    timeline: '3 months',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.velvet-summit',
    zerobiasTagId: '355a0e23-e22b-4622-b186-08e860513de6',
    zerobiasTaskId: 'c3b5fc15-2cf3-406d-961b-570f78689821',
    createdAt: new Date(2026, 2, 2).toISOString(),
    updatedAt: new Date(2026, 2, 11).toISOString(),
  },
  {
    id: 'eng-003-amber-circuit',
    name: 'AI Agent for Compliance Evidence Collection',
    description: 'Agentic solution for automating compliance evidence gathering',
    category: 'Agentic',
    buyerZerobiasUserId: 'buyer-startup-003',
    buyerZerobiasOrgId: 'org-startup-xyz',
    budgetType: 'negotiable',
    budgetMin: 10000,
    budgetMax: 20000,
    timeline: '8-12 weeks',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.amber-circuit',
    zerobiasTagId: '49e67643-85da-44b0-a47a-c67c56a4d2d7',
    zerobiasTaskId: '3a6799c6-65ea-4833-9cf9-3f739f0fe587',
    createdAt: new Date(2026, 2, 3).toISOString(),
    updatedAt: new Date(2026, 2, 12).toISOString(),
  },
  {
    id: 'eng-004-silver-bridge',
    name: 'HIPAA Security Awareness Training',
    description: 'Healthcare compliance training program for staff',
    category: 'Training',
    buyerZerobiasUserId: 'demo-buyer-lakewood',
    buyerZerobiasOrgId: 'org-lakewood-health',
    budgetType: 'fixed',
    budgetMin: 8000,
    budgetMax: 12000,
    timeline: '6 weeks',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.silver-bridge',
    zerobiasTagId: 'ba599b51-6d87-4c46-9c98-05244a928cc9',
    zerobiasTaskId: '900dfe93-ad93-4c02-996c-a8c13700e8ab',
    createdAt: new Date(2026, 2, 4).toISOString(),
    updatedAt: new Date(2026, 2, 13).toISOString(),
  },
  {
    id: 'eng-005-coral-meadow',
    name: 'ISO 27001 Gap Assessment',
    description: 'Cross-framework gap analysis for ISO 27001 compliance',
    category: 'Assessors',
    buyerZerobiasUserId: 'buyer-health-004',
    buyerZerobiasOrgId: 'org-healthtech',
    budgetType: 'fixed',
    budgetMin: 5000,
    budgetMax: 7500,
    timeline: '4 weeks',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.coral-meadow',
    zerobiasTagId: '3b2e84a6-52bc-41d7-8e8c-5e78e65a033c',
    zerobiasTaskId: 'd9895a40-38a4-4dad-9e8a-6ee588104cf0',
    createdAt: new Date(2026, 2, 5).toISOString(),
    updatedAt: new Date(2026, 2, 14).toISOString(),
  },
];

/**
 * Builder function: Generate demo engagements with unique IDs.
 * Used for testing and fixture generation.
 */
export function seedDemoEngagements(): DemoEngagement[] {
  return DEMO_ENGAGEMENTS.map(eng => ({
    ...eng,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Bid Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Bids (linked to demo engagements)
 */
export const DEMO_BIDS: DemoBid[] = [
  {
    id: 'bid-001-gina-crystal',
    name: 'Gina Auditor - SOC 2 Type I Bid',
    engagementId: 'eng-001-crystal-harbor',
    providerId: 'a3-gina-auditor',
    coverLetter: 'SOC 2 Type I assessment with fast-track methodology',
    proposedPrice: 7500,
    proposedTimeline: '4 weeks',
    executiveSummary: 'Proven SOC 2 lead assessor with 15+ years experience',
    teamDescription: 'Gina Auditor and 2 junior assessors',
    totalEstimatedHours: 80,
    status: 'accepted',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 8).toISOString(),
  },
  {
    id: 'bid-002-marcus-crystal',
    name: 'Marcus Webb - SOC 2 Evidence Bid',
    engagementId: 'eng-001-crystal-harbor',
    providerId: 'marcus-webb',
    coverLetter: 'Evidence-focused SOC 2 assessment approach',
    proposedPrice: 4000,
    proposedTimeline: '3 weeks',
    executiveSummary: 'Compliance evidence specialist',
    status: 'rejected',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 8).toISOString(),
  },
  {
    id: 'bid-003-james-velvet',
    name: 'James Okafor - NIST CSF Bid',
    engagementId: 'eng-002-velvet-summit',
    providerId: 'james-okafor',
    coverLetter: 'NIST CSF implementation with GRC strategy focus',
    proposedPrice: 200,
    proposedTimeline: '3 months',
    executiveSummary: 'GRC Consultant with NIST CSF expertise',
    teamDescription: 'James Okafor and advisory team',
    status: 'accepted',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 9).toISOString(),
  },
  {
    id: 'bid-004-bob-amber',
    name: 'Bob IT - AI Agent Bid',
    engagementId: 'eng-003-amber-circuit',
    providerId: 'a1-bob-it',
    coverLetter: 'AI Agent for compliance automation',
    proposedPrice: 15000,
    proposedTimeline: '10 weeks',
    executiveSummary: 'AI Agent Builder with compliance automation focus',
    status: 'pending',
    createdAt: new Date(2026, 2, 8).toISOString(),
    updatedAt: new Date(2026, 2, 8).toISOString(),
  },
  {
    id: 'bid-005-carlos-amber',
    name: 'Carlos Rivera - SecOps Automation Bid',
    engagementId: 'eng-003-amber-circuit',
    providerId: 'carlos-rivera',
    coverLetter: 'Security operations and compliance automation',
    proposedPrice: 18000,
    proposedTimeline: '12 weeks',
    executiveSummary: 'SecOps specialist with automation experience',
    status: 'withdrawn',
    createdAt: new Date(2026, 2, 8).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
  },
  {
    id: 'bid-006-alex-silver',
    name: 'Alex Nguyen - HIPAA Training Bid',
    engagementId: 'eng-004-silver-bridge',
    providerId: 'alex-nguyen',
    coverLetter: 'HIPAA compliance training program',
    proposedPrice: 10000,
    proposedTimeline: '6 weeks',
    executiveSummary: 'Compliance training specialist',
    status: 'accepted',
    createdAt: new Date(2026, 2, 9).toISOString(),
    updatedAt: new Date(2026, 2, 11).toISOString(),
  },
  {
    id: 'bid-007-gina-coral',
    name: 'Gina Auditor - ISO 27001 Bid',
    engagementId: 'eng-005-coral-meadow',
    providerId: 'a3-gina-auditor',
    coverLetter: 'ISO 27001 gap assessment with remediation roadmap',
    proposedPrice: 6500,
    proposedTimeline: '4 weeks',
    executiveSummary: 'ISO 27001 Lead Assessor',
    status: 'accepted',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 12).toISOString(),
  },
];

/**
 * Builder function: Generate demo bids linked to specific engagements.
 */
export function seedDemoBids(engagementIds?: string[]): DemoBid[] {
  if (!engagementIds || engagementIds.length === 0) {
    return DEMO_BIDS.map(bid => ({ ...bid }));
  }
  return DEMO_BIDS.filter(bid => engagementIds.includes(bid.engagementId)).map(bid => ({ ...bid }));
}

// ─────────────────────────────────────────────────────────────────────────────
// BidResponse Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo BidResponses (linked to demo bids)
 */
export const DEMO_BID_RESPONSES: DemoBidResponse[] = [
  {
    id: 'bidr-001-gina-crystal-req1',
    name: 'CC6.1 Access Logging Response',
    bidId: 'bid-001-gina-crystal',
    requirementId: 'req-soc2-control-1',
    complianceStatus: 'met',
    responseText: 'Control CC6.1 implemented via access logging',
    estimatedHours: 8,
    estimatedCost: 600,
    certificationRef: 'SOC 2 CC6.1',
    readyDate: '2026-05-01',
    updatedAt: new Date(2026, 2, 8).toISOString(),
  },
  {
    id: 'bidr-002-gina-crystal-req2',
    name: 'A1.1 Availability Response',
    bidId: 'bid-001-gina-crystal',
    requirementId: 'req-soc2-control-2',
    complianceStatus: 'partially_met',
    responseText: 'Control A1.1 partially implemented, remediation plan included',
    estimatedHours: 12,
    estimatedCost: 900,
    certificationRef: 'SOC 2 A1.1',
    readyDate: '2026-05-15',
    updatedAt: new Date(2026, 2, 8).toISOString(),
  },
  {
    id: 'bidr-003-james-velvet-req1',
    name: 'NIST Identify Function Response',
    bidId: 'bid-003-james-velvet',
    requirementId: 'req-nist-identify',
    complianceStatus: 'planned',
    responseText: 'NIST Identify function implementation plan: 3-month phased rollout',
    estimatedHours: 40,
    estimatedCost: 8000,
    certificationRef: 'NIST CSF Identify',
    readyDate: '2026-06-01',
    updatedAt: new Date(2026, 2, 9).toISOString(),
  },
];

/**
 * Builder function: Generate demo bid responses linked to specific bids.
 */
export function seedDemoBidResponses(bidIds?: string[]): DemoBidResponse[] {
  if (!bidIds || bidIds.length === 0) {
    return DEMO_BID_RESPONSES.map(resp => ({ ...resp }));
  }
  return DEMO_BID_RESPONSES.filter(resp => bidIds.includes(resp.bidId)).map(resp => ({ ...resp }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Note Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Notes (linked to engagements)
 *
 * IMPORTANT: folderId must point to a LEAF folder, not the notebook root.
 * Notebook roots (e.g., folder-001-crystal) are "notebooks" in the UI —
 * notes belong to subfolders within them (e.g., General, Alpha, Beta).
 * If folderId points to the notebook root, the note won't appear when
 * clicking any subfolder in the UI.
 */
export const DEMO_NOTES: DemoNote[] = [
  {
    id: 'note-001-crystal-kickoff',
    name: 'Kickoff Meeting - Crystal Harbor',
    engagementId: 'eng-001-crystal-harbor',
    folderId: 'folder-001-crystal-general', // General subfolder, NOT notebook root
    title: 'Kickoff Meeting - Crystal Harbor',
    body: 'Initial SOC 2 scoping with Pinnacle Corp. Identified 3 control gaps in access management.',
    authorZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 6).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: true,
    meetingDate: new Date(2026, 2, 6).toISOString(),
    meetingDurationMinutes: 60,
  },
  {
    id: 'note-002-crystal-progress',
    name: 'Progress Update - Week 2',
    engagementId: 'eng-001-crystal-harbor',
    folderId: 'folder-001-crystal-general', // General subfolder, NOT notebook root
    title: 'Progress Update - Week 2',
    body: 'Completed access logging audit. Found 2 non-compliant systems. Remediation plan drafted.',
    authorZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 3, 6).toISOString(),
    updatedAt: new Date(2026, 3, 6).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: false,
  },
  {
    id: 'note-003-velvet-strategy',
    name: 'NIST CSF Strategy Session',
    engagementId: 'eng-002-velvet-summit',
    folderId: 'folder-002-velvet-general', // General subfolder, NOT notebook root
    title: 'NIST CSF Strategy Session',
    body: 'Outlined 3-month implementation roadmap. Prioritized Identify and Protect functions.',
    authorZerobiasUserId: 'james-okafor',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 7).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: true,
    meetingDate: new Date(2026, 2, 7).toISOString(),
    meetingDurationMinutes: 90,
  },
  {
    id: 'note-004-silver-agenda',
    name: 'Training Module Outline',
    engagementId: 'eng-004-silver-bridge',
    title: 'Training Module Outline',
    body: 'HIPAA training: 3 modules (60 min each) covering privacy, security, breach notification.',
    authorZerobiasUserId: 'alex-nguyen',
    createdAt: new Date(2026, 2, 9).toISOString(),
    updatedAt: new Date(2026, 2, 9).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: false,
  },
  {
    id: 'note-005-coral-findings',
    name: 'ISO 27001 Gap Analysis Findings',
    engagementId: 'eng-005-coral-meadow',
    folderId: 'folder-005-coral-general', // General subfolder, NOT notebook root
    title: 'ISO 27001 Gap Analysis Findings',
    body: 'Identified 12 gaps across Control objectives. 8 critical, 4 medium. Roadmap created.',
    authorZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: false,
  },
];

/**
 * Builder function: Generate demo notes linked to specific engagements.
 */
export function seedDemoNotes(engagementIds?: string[]): DemoNote[] {
  if (!engagementIds || engagementIds.length === 0) {
    return DEMO_NOTES.map(note => ({ ...note }));
  }
  return DEMO_NOTES.filter(note => engagementIds.includes(note.engagementId)).map(note => ({ ...note }));
}

// ─────────────────────────────────────────────────────────────────────────────
// NoteFolder Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo NoteFolders (linked to engagements)
 *
 * Folder hierarchy: Notebook (root, parentId=null) → subfolders (parentId=notebook)
 * Notes must point to SUBFOLDER IDs, not notebook root IDs.
 * The app's "Notebooks" column shows root folders; "Folders" column shows children.
 * `ensureDefaultFolder` auto-creates a "General" subfolder if a notebook has none.
 */
export const DEMO_NOTE_FOLDERS: DemoNoteFolder[] = [
  // ── Crystal Harbor notebook + subfolders ──
  {
    id: 'folder-001-crystal',
    engagementId: 'eng-001-crystal-harbor',
    name: 'Crystal Harbor Assessment',
    description: 'SOC 2 Type I assessment notes and documentation',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 6).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 1,
    color: '#1976d2',
  },
  {
    id: 'folder-001-crystal-general',
    engagementId: 'eng-001-crystal-harbor',
    parentId: 'folder-001-crystal',
    name: 'General',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 6).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 0,
  },
  // ── Velvet Summit notebook + subfolders ──
  {
    id: 'folder-002-velvet',
    engagementId: 'eng-002-velvet-summit',
    name: 'NIST CSF Implementation',
    description: 'Implementation roadmap and strategy notes',
    createdByZerobiasUserId: 'james-okafor',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 7).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 1,
    color: '#388e3c',
  },
  {
    id: 'folder-002-velvet-general',
    engagementId: 'eng-002-velvet-summit',
    parentId: 'folder-002-velvet',
    name: 'General',
    createdByZerobiasUserId: 'james-okafor',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 7).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 0,
  },
  // ── Coral Meadow notebook + subfolders ──
  {
    id: 'folder-005-coral',
    engagementId: 'eng-005-coral-meadow',
    name: 'ISO 27001 Gap Assessment',
    description: 'Gap analysis findings and remediation planning',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 1,
    color: '#d32f2f',
  },
  {
    id: 'folder-005-coral-general',
    engagementId: 'eng-005-coral-meadow',
    parentId: 'folder-005-coral',
    name: 'General',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 0,
  },
];

/**
 * Builder function: Generate demo note folders linked to specific engagements.
 */
export function seedDemoNoteFolders(engagementIds?: string[]): DemoNoteFolder[] {
  if (!engagementIds || engagementIds.length === 0) {
    return DEMO_NOTE_FOLDERS.map(folder => ({ ...folder }));
  }
  return DEMO_NOTE_FOLDERS.filter(folder => engagementIds.includes(folder.engagementId)).map(folder => ({ ...folder }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SmeMartDocument Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo SmeMartDocuments (linked to engagements)
 */
export const DEMO_DOCUMENTS: DemoSmeMartDocument[] = [
  {
    id: 'doc-001-crystal-scope',
    name: 'SOC 2 Scope Statement',
    engagementId: 'eng-001-crystal-harbor',
    filename: 'soc2-scope-statement.pdf',
    mimeType: 'application/pdf',
    size: 245000,
    fileVersionId: '00000000-0000-4000-a000-000000000001',
    fileSizeBytes: 245000,
    documentType: 'scope',
    displayName: 'SOC 2 Scope Statement',
    description: 'Controls within scope for assessment',
    uploadedByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 6).toISOString(),
    archived: false,
  },
  {
    id: 'doc-002-crystal-wip',
    name: 'Access Control Audit WIP',
    engagementId: 'eng-001-crystal-harbor',
    filename: 'access-control-audit.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 125000,
    fileVersionId: '00000000-0000-4000-a000-000000000002',
    fileSizeBytes: 125000,
    documentType: 'workingpaper',
    displayName: 'Access Control Audit WIP',
    description: 'Work in progress - access logging audit results',
    uploadedByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 3, 1).toISOString(),
    updatedAt: new Date(2026, 3, 6).toISOString(),
    archived: false,
  },
  {
    id: 'doc-003-velvet-plan',
    name: 'NIST CSF 3-Month Roadmap',
    engagementId: 'eng-002-velvet-summit',
    filename: 'nist-csf-roadmap.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 89000,
    fileVersionId: '00000000-0000-4000-a000-000000000003',
    fileSizeBytes: 89000,
    documentType: 'plan',
    displayName: 'NIST CSF 3-Month Roadmap',
    description: 'Implementation roadmap and timeline',
    uploadedByZerobiasUserId: 'james-okafor',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 7).toISOString(),
    archived: false,
  },
];

/**
 * Builder function: Generate demo documents linked to specific engagements.
 */
export function seedDemoDocuments(engagementIds?: string[]): DemoSmeMartDocument[] {
  if (!engagementIds || engagementIds.length === 0) {
    return DEMO_DOCUMENTS.map(doc => ({ ...doc }));
  }
  return DEMO_DOCUMENTS.filter(doc => engagementIds.includes(doc.engagementId)).map(doc => ({ ...doc }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceOffering Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo ServiceOfferings (provider catalog listings)
 */
export const DEMO_SERVICE_OFFERINGS: DemoServiceOffering[] = [
  {
    id: 'offering-001-gina-soc2',
    providerId: 'a3-gina-auditor',
    name: 'SOC 2 Type I Assessment',
    description: 'Fast-track SOC 2 Type I assessment with comprehensive control review',
    category: 'Assessors',
    subcategory: 'SOC 2',
    pricingType: 'fixed',
    price: 7500,
    deliveryTime: '4 weeks',
    includes: ['Control assessment', 'Gap analysis', 'Remediation roadmap', 'Executive report'],
    isActive: true,
    createdAt: new Date(2026, 1, 1).toISOString(),
    updatedAt: new Date(2026, 3, 1).toISOString(),
  },
  {
    id: 'offering-002-james-grc',
    providerId: 'james-okafor',
    name: 'GRC Strategy & Advisory',
    description: 'Strategic GRC consulting for compliance frameworks (NIST, SOC 2, ISO 27001)',
    category: 'Advisors',
    subcategory: 'GRC Consulting',
    pricingType: 'hourly',
    price: 175,
    deliveryTime: 'Ongoing',
    includes: ['Strategy assessment', 'Roadmap development', 'Implementation guidance', 'Monthly reviews'],
    requirements: 'Minimum 20 hours/month engagement',
    isActive: true,
    createdAt: new Date(2026, 1, 1).toISOString(),
    updatedAt: new Date(2026, 3, 1).toISOString(),
  },
  {
    id: 'offering-003-bob-agentic',
    providerId: 'a1-bob-it',
    name: 'AI Agent for Compliance Automation',
    description: 'Custom AI agent development for automating compliance evidence collection',
    category: 'Agentic',
    subcategory: 'AI Agent Builders',
    pricingType: 'fixed',
    price: 15000,
    deliveryTime: '10-12 weeks',
    includes: ['Requirements gathering', 'Agent design & development', 'Testing & deployment', 'Training'],
    isActive: true,
    createdAt: new Date(2026, 1, 15).toISOString(),
    updatedAt: new Date(2026, 3, 1).toISOString(),
  },
];

/**
 * Builder function: Generate demo service offerings.
 */
export function seedDemoServiceOfferings(): DemoServiceOffering[] {
  return DEMO_SERVICE_OFFERINGS.map(offering => ({ ...offering }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Reviews (provider ratings from buyers)
 */
export const DEMO_REVIEWS: DemoReview[] = [
  {
    id: 'review-001-gina-by-pinnacle',
    name: 'Review of Gina Auditor - Crystal Harbor',
    providerId: 'a3-gina-auditor',
    reviewerZerobiasUserId: 'demo-buyer-pinnacle',
    engagementId: 'eng-001-crystal-harbor',
    rating: 5,
    reviewText: 'Exceptional SOC 2 expertise. Fast-tracked without compromising quality. Highly recommended.',
    approved: false,
    createdAt: new Date(2026, 3, 7).toISOString(),
    updatedAt: new Date(2026, 3, 7).toISOString(),
  },
  {
    id: 'review-002-james-by-fintech',
    name: 'Review of James Okafor - Velvet Summit',
    providerId: 'james-okafor',
    reviewerZerobiasUserId: 'buyer-fintech-002',
    engagementId: 'eng-002-velvet-summit',
    rating: 5,
    reviewText: 'Outstanding GRC consultant. Developed comprehensive NIST CSF roadmap. Strategic insights valuable.',
    approved: false,
    createdAt: new Date(2026, 5, 8).toISOString(),
    updatedAt: new Date(2026, 5, 8).toISOString(),
  },
];

/**
 * Builder function: Generate demo reviews.
 */
export function seedDemoReviews(): DemoReview[] {
  return DEMO_REVIEWS.map(review => ({ ...review }));
}
