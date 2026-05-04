/**
 * Demo Data Seeder — Reusable Fixtures and Builder Functions
 *
 * Provides demo data for all 8 migrated SME Mart entity types:
 * Engagement, Bid, BidResponse, Note, NoteFolder, SmeMartDocument, ServiceOffering, Review.
 *
 * Data sources: .planning/notes/demo-data-guide.md
 * Field naming: All fields use camelCase (matches GQL schema).
 *
 * Phase 5 Migration: Migrated from Neon SQL inserts to Pipeline writes.
 */

import type {
  DemoEngagement,
  DemoSmeMartProject,
  DemoBid,
  DemoBidResponse,
  DemoNote,
  DemoNoteFolder,
  DemoSmeMartDocument,
  DemoServiceOffering,
  DemoReview,
} from '../core/models';
import { DEMO_TAG_UUIDS } from '../core/constants/demo-tags';

// ─────────────────────────────────────────────────────────────────────────────
// Engagement Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Engagements — Corp-to-Corp Agreements (new model, 2026-03-24)
 *
 * An Engagement is the agreement between two orgs — NOT where work lives.
 * Work lives in SmeMartProjects under each engagement.
 * Pinnacle Corp has 2 projects to demonstrate 1:many.
 */
export const DEMO_ENGAGEMENTS: DemoEngagement[] = [
  {
    id: 'eng-001-pinnacle',
    name: 'Pinnacle Corp ↔ W3Geekery',
    description: 'Master service agreement for compliance and security services. Pinnacle Corp (Series B SaaS) engaged W3Geekery for SOC 2 assessment and ongoing monitoring.',
    category: 'Assessors',
    buyerZerobiasUserId: 'demo-buyer-pinnacle',
    buyerZerobiasOrgId: 'org-pinnacle-corp',
    budgetType: 'negotiable',
    budgetMin: 0,
    budgetMax: 0,
    timeline: 'Ongoing',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.pinnacle',
    zerobiasTagId: 'e1864514-af28-4397-93a5-f05e443b05cb',
    zerobiasTaskId: 'fb45b170-aae7-4991-a6ab-fc33b73d062f',
    createdAt: new Date(2026, 1, 15).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'eng-002-fintech',
    name: 'FinTech Inc ↔ W3Geekery',
    description: 'GRC advisory engagement. FinTech Inc engaged W3Geekery for NIST CSF implementation guidance.',
    category: 'Advisors',
    buyerZerobiasUserId: 'buyer-fintech-002',
    buyerZerobiasOrgId: 'org-fintech-inc',
    budgetType: 'negotiable',
    budgetMin: 0,
    budgetMax: 0,
    timeline: 'Ongoing',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.fintech',
    zerobiasTagId: '355a0e23-e22b-4622-b186-08e860513de6',
    zerobiasTaskId: '43ce8d38-6335-4ee7-a782-01b4257d7239',
    createdAt: new Date(2026, 1, 20).toISOString(),
    updatedAt: new Date(2026, 2, 11).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'eng-003-startup-xyz',
    name: 'Startup XYZ ↔ W3Geekery',
    description: 'Agentic services engagement. Startup XYZ engaged W3Geekery for AI-driven compliance automation.',
    category: 'Agentic',
    buyerZerobiasUserId: 'buyer-startup-003',
    buyerZerobiasOrgId: 'org-startup-xyz',
    budgetType: 'negotiable',
    budgetMin: 0,
    budgetMax: 0,
    timeline: 'Ongoing',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.startup-xyz',
    zerobiasTagId: '49e67643-85da-44b0-a47a-c67c56a4d2d7',
    zerobiasTaskId: '371abdc5-1d31-479d-98e4-d83462592b46',
    createdAt: new Date(2026, 1, 25).toISOString(),
    updatedAt: new Date(2026, 2, 12).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'eng-004-lakewood',
    name: 'Lakewood Health ↔ W3Geekery',
    description: 'Healthcare compliance engagement. Lakewood Health engaged W3Geekery for HIPAA training and security awareness.',
    category: 'Training',
    buyerZerobiasUserId: 'demo-buyer-lakewood',
    buyerZerobiasOrgId: 'org-lakewood-health',
    budgetType: 'negotiable',
    budgetMin: 0,
    budgetMax: 0,
    timeline: 'Ongoing',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.lakewood',
    zerobiasTagId: 'ba599b51-6d87-4c46-9c98-05244a928cc9',
    zerobiasTaskId: '3ec47264-7ec0-46ce-bf24-6c4d087f89de',
    createdAt: new Date(2026, 2, 1).toISOString(),
    updatedAt: new Date(2026, 2, 13).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'eng-005-healthtech',
    name: 'HealthTech Co ↔ W3Geekery',
    description: 'ISO 27001 compliance engagement. HealthTech Co engaged W3Geekery for gap assessment and remediation planning.',
    category: 'Assessors',
    buyerZerobiasUserId: 'buyer-health-004',
    buyerZerobiasOrgId: 'org-healthtech',
    budgetType: 'negotiable',
    budgetMin: 0,
    budgetMax: 0,
    timeline: 'Ongoing',
    status: 'in_progress',
    engagementTag: 'sme-mart.eng.healthtech',
    zerobiasTagId: '3b2e84a6-52bc-41d7-8e8c-5e78e65a033c',
    zerobiasTaskId: 'ff4f20f0-61d3-4723-9a35-c0d3eeb3d16c',
    createdAt: new Date(2026, 2, 2).toISOString(),
    updatedAt: new Date(2026, 2, 14).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
];

/**
 * Builder function: Generate demo engagements.
 */
export function seedDemoEngagements(): DemoEngagement[] {
  return DEMO_ENGAGEMENTS.map(eng => ({ ...eng }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SmeMartProject Fixtures (scoped work under engagements)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Projects — Scoped work items under engagements.
 *
 * These are the former "engagements" (crystal-harbor, velvet-summit, etc.)
 * now properly modeled as projects. Pinnacle gets 2 projects to demo 1:many.
 *
 * Note: Downstream entities (bids, notes, docs) still reference engagementId
 * using the OLD engagement IDs (eng-001-crystal-harbor, etc.) which are now
 * project IDs. This is intentional — the GQL schema field is still called
 * engagementId and will be aliased/migrated when the schema catches up.
 */
export const DEMO_PROJECTS: DemoSmeMartProject[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // Active projects (linked to engagements, with RFP fields for history)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Pinnacle Corp: 2 projects ──
  {
    id: 'proj-001-crystal-harbor',
    name: 'SOC 2 Type I Fast-Track Assessment',
    description: 'Fast-track SOC 2 Type I assessment. 4-week engagement with Gina Auditor. Controls: access logging, availability, change management.',
    status: 'active',
    engagement: 'eng-001-pinnacle',
    startDate: '2026-03-01',
    targetEndDate: '2026-03-29',
    category: 'Assessors',
    budgetType: 'fixed',
    budgetMin: 6000,
    budgetMax: 9000,
    timeline: '4 weeks',
    buyerZerobiasUserId: 'demo-buyer-pinnacle',
    buyerZerobiasOrgId: 'org-pinnacle-corp',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'proj-002-pinnacle-type2',
    name: 'SOC 2 Type II Continuous Monitoring',
    description: 'Follow-on to crystal-harbor Type I. 6-month continuous monitoring engagement for SOC 2 Type II readiness.',
    status: 'draft',
    engagement: 'eng-001-pinnacle',
    startDate: '2026-04-01',
    targetEndDate: '2026-09-30',
    category: 'Assessors',
    budgetType: 'negotiable',
    timeline: '6 months',
    buyerZerobiasUserId: 'demo-buyer-pinnacle',
    buyerZerobiasOrgId: 'org-pinnacle-corp',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  // ── FinTech Inc: 1 project ──
  {
    id: 'proj-003-velvet-summit',
    name: 'NIST CSF Implementation Advisor',
    description: 'Advisory project for NIST CSF implementation. 3-month phased rollout: Identify, Protect, Detect functions.',
    status: 'active',
    engagement: 'eng-002-fintech',
    startDate: '2026-03-02',
    targetEndDate: '2026-06-02',
    category: 'Advisors',
    budgetType: 'hourly',
    budgetMin: 150,
    budgetMax: 250,
    timeline: '3 months',
    buyerZerobiasUserId: 'buyer-fintech-002',
    buyerZerobiasOrgId: 'org-fintech-inc',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  // ── Startup XYZ: 1 project ──
  {
    id: 'proj-004-amber-circuit',
    name: 'AI Agent for Compliance Evidence Collection',
    description: 'Agentic solution for automating compliance evidence gathering. 10-12 week build with Bob IT.',
    status: 'active',
    engagement: 'eng-003-startup-xyz',
    startDate: '2026-03-03',
    targetEndDate: '2026-05-28',
    category: 'Agentic',
    budgetType: 'negotiable',
    budgetMin: 10000,
    budgetMax: 20000,
    timeline: '10-12 weeks',
    buyerZerobiasUserId: 'buyer-startup-003',
    buyerZerobiasOrgId: 'org-startup-xyz',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  // ── Lakewood Health: 1 project ──
  {
    id: 'proj-005-silver-bridge',
    name: 'HIPAA Security Awareness Training',
    description: 'Healthcare compliance training program. 3 modules (60 min each): privacy, security, breach notification.',
    status: 'active',
    engagement: 'eng-004-lakewood',
    startDate: '2026-03-04',
    targetEndDate: '2026-04-15',
    category: 'Training',
    budgetType: 'fixed',
    budgetMin: 8000,
    budgetMax: 12000,
    timeline: '6 weeks',
    buyerZerobiasUserId: 'demo-buyer-lakewood',
    buyerZerobiasOrgId: 'org-lakewood-health',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  // ── HealthTech Co: 1 project ──
  {
    id: 'proj-006-coral-meadow',
    name: 'ISO 27001 Gap Assessment',
    description: 'Cross-framework gap analysis for ISO 27001 compliance. 12 gaps identified, 8 critical.',
    status: 'active',
    engagement: 'eng-005-healthtech',
    startDate: '2026-03-05',
    targetEndDate: '2026-04-02',
    category: 'Assessors',
    budgetType: 'fixed',
    budgetMin: 5000,
    budgetMax: 7500,
    timeline: '4 weeks',
    buyerZerobiasUserId: 'buyer-health-004',
    buyerZerobiasOrgId: 'org-healthtech',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Published RFPs (marketplace listings — no engagement yet)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'rfp-001-pentest',
    name: 'Penetration Testing for Healthcare Portal',
    description: 'Full-stack penetration test of patient portal. OWASP Top 10, API testing, social engineering assessment.',
    status: 'published',
    startDate: '2026-03-20',
    category: 'Assessors',
    budgetType: 'fixed',
    budgetMin: 12000,
    budgetMax: 18000,
    timeline: '3-4 weeks',
    responseDeadline: '2026-04-15',
    questionsDeadline: '2026-04-08',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-002-cloud-security',
    name: 'Cloud Security Posture Review',
    description: 'Comprehensive review of AWS/Azure cloud security posture. Identity management, network segmentation, encryption at rest/transit.',
    status: 'published',
    startDate: '2026-03-18',
    category: 'Advisors',
    budgetType: 'fixed',
    budgetMin: 8000,
    budgetMax: 15000,
    timeline: '4-6 weeks',
    responseDeadline: '2026-04-10',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-003-ai-vuln-triage',
    name: 'AI-Powered Vulnerability Triage Agent',
    description: 'Build an AI agent that triages vulnerability scan results, prioritizes remediation, and generates executive summaries.',
    status: 'published',
    startDate: '2026-03-15',
    category: 'Agentic',
    budgetType: 'negotiable',
    budgetMin: 25000,
    budgetMax: 40000,
    timeline: '8-12 weeks',
    responseDeadline: '2026-04-20',
    questionsDeadline: '2026-04-10',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-004-fedramp',
    name: 'FedRAMP Readiness Assessment',
    description: 'FedRAMP Moderate readiness assessment with gap analysis, POA&M development, and 3P assessor preparation.',
    status: 'draft',
    startDate: '2026-03-22',
    category: 'Assessors',
    budgetType: 'fixed',
    budgetMin: 30000,
    budgetMax: 50000,
    timeline: '12-16 weeks',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-005-soc2-acme',
    name: 'SOC 2 Type II Assessment Support',
    description: 'SOC 2 Type II assessment support for SaaS platform. Evidence collection, control testing, report preparation.',
    status: 'published',
    startDate: '2026-03-19',
    category: 'Assessors',
    budgetType: 'fixed',
    budgetMin: 8000,
    budgetMax: 12000,
    timeline: '6-8 weeks',
    responseDeadline: '2026-04-12',
    buyerZerobiasUserId: 'buyer-acme-001',
    buyerZerobiasOrgId: 'org-acme-corp',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-006-hipaa-risk',
    name: 'HIPAA Risk Assessment & Remediation Plan',
    description: 'Comprehensive HIPAA risk assessment with remediation roadmap for healthcare organization.',
    status: 'published',
    startDate: '2026-03-21',
    category: 'Advisors',
    budgetType: 'fixed',
    budgetMin: 10000,
    budgetMax: 15000,
    timeline: '4-6 weeks',
    responseDeadline: '2026-04-14',
    buyerZerobiasUserId: 'demo-buyer-lakewood',
    buyerZerobiasOrgId: 'org-lakewood-health',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-007-phi-monitoring',
    name: 'Automated PHI Access Monitoring Agent',
    description: 'AI agent for real-time PHI access monitoring, anomaly detection, and automated audit trail generation.',
    status: 'published',
    startDate: '2026-03-20',
    category: 'Agentic',
    budgetType: 'negotiable',
    budgetMin: 12000,
    budgetMax: 25000,
    timeline: '8-10 weeks',
    responseDeadline: '2026-04-18',
    buyerZerobiasUserId: 'demo-buyer-lakewood',
    buyerZerobiasOrgId: 'org-lakewood-health',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-008-soc-monitoring',
    name: 'SOC Monitoring Setup for Healthcare Cloud',
    description: 'Security operations center setup for healthcare cloud environment. SIEM deployment, alert tuning, runbook development.',
    status: 'published',
    startDate: '2026-03-19',
    category: 'SecOps',
    budgetType: 'fixed',
    budgetMin: 18000,
    budgetMax: 25000,
    timeline: '6-8 weeks',
    responseDeadline: '2026-04-16',
    buyerZerobiasUserId: 'demo-buyer-lakewood',
    buyerZerobiasOrgId: 'org-lakewood-health',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-009-security-training',
    name: 'Security Training Program Development',
    description: 'Enterprise-wide security awareness training program. Role-based modules, phishing simulations, compliance tracking.',
    status: 'published',
    startDate: '2026-03-18',
    category: 'Training',
    budgetType: 'fixed',
    budgetMin: 15000,
    budgetMax: 20000,
    timeline: '8-10 weeks',
    responseDeadline: '2026-04-15',
    buyerZerobiasUserId: 'buyer-enterprise-005',
    buyerZerobiasOrgId: 'org-enterprise-co',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-010-devsecops',
    name: 'DevSecOps Pipeline Hardening',
    description: 'Harden CI/CD pipelines with SAST, DAST, SCA, secret scanning. GitHub Actions + container security.',
    status: 'published',
    startDate: '2026-03-17',
    category: 'DevSecOps',
    budgetType: 'hourly',
    budgetMin: 150,
    budgetMax: 200,
    timeline: '3-6 months',
    responseDeadline: '2026-04-14',
    buyerZerobiasUserId: 'demo-buyer-pinnacle',
    buyerZerobiasOrgId: 'org-pinnacle-corp',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'rfp-011-evidence-prep',
    name: 'Compliance Evidence Package Preparation',
    description: 'Prepare evidence packages for SOC 2, ISO 27001 audits. Data collection, formatting, reviewer-ready bundles.',
    status: 'published',
    startDate: '2026-03-16',
    category: 'Data Services',
    budgetType: 'fixed',
    budgetMin: 3500,
    budgetMax: 5000,
    timeline: '2-3 weeks',
    responseDeadline: '2026-04-10',
    buyerZerobiasUserId: 'demo-buyer-pinnacle',
    buyerZerobiasOrgId: 'org-pinnacle-corp',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
];

/**
 * Builder function: Generate demo projects.
 */
export function seedDemoProjects(engagementIds?: string[]): DemoSmeMartProject[] {
  if (!engagementIds || engagementIds.length === 0) {
    return DEMO_PROJECTS.map(proj => ({ ...proj }));
  }
  return DEMO_PROJECTS.filter(proj => proj.engagement && engagementIds.includes(proj.engagement)).map(proj => ({ ...proj }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Bid Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demo Bids (linked to demo engagements)
 */
export const DEMO_BIDS: DemoBid[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // Bids on active projects (accepted/rejected — historical)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bid-001-gina-crystal',
    name: 'Gina Auditor - SOC 2 Type I Bid',
    project: 'proj-001-crystal-harbor',
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-002-marcus-crystal',
    name: 'Marcus Webb - SOC 2 Evidence Bid',
    project: 'proj-001-crystal-harbor',
    providerId: 'marcus-webb',
    coverLetter: 'Evidence-focused SOC 2 assessment approach',
    proposedPrice: 4000,
    proposedTimeline: '3 weeks',
    executiveSummary: 'Compliance evidence specialist',
    status: 'rejected',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 8).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-003-james-velvet',
    name: 'James Okafor - NIST CSF Bid',
    project: 'proj-003-velvet-summit',
    providerId: 'james-okafor',
    coverLetter: 'NIST CSF implementation with GRC strategy focus',
    proposedPrice: 200,
    proposedTimeline: '3 months',
    executiveSummary: 'GRC Consultant with NIST CSF expertise',
    teamDescription: 'James Okafor and advisory team',
    status: 'accepted',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 9).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-004-bob-amber',
    name: 'Bob IT - AI Agent Bid',
    project: 'proj-004-amber-circuit',
    providerId: 'a1-bob-it',
    coverLetter: 'AI Agent for compliance automation',
    proposedPrice: 15000,
    proposedTimeline: '10 weeks',
    executiveSummary: 'AI Agent Builder with compliance automation focus',
    status: 'pending',
    createdAt: new Date(2026, 2, 8).toISOString(),
    updatedAt: new Date(2026, 2, 8).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-005-carlos-amber',
    name: 'Carlos Rivera - SecOps Automation Bid',
    project: 'proj-004-amber-circuit',
    providerId: 'carlos-rivera',
    coverLetter: 'Security operations and compliance automation',
    proposedPrice: 18000,
    proposedTimeline: '12 weeks',
    executiveSummary: 'SecOps specialist with automation experience',
    status: 'withdrawn',
    createdAt: new Date(2026, 2, 8).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-006-alex-silver',
    name: 'Alex Nguyen - HIPAA Training Bid',
    project: 'proj-005-silver-bridge',
    providerId: 'alex-nguyen',
    coverLetter: 'HIPAA compliance training program',
    proposedPrice: 10000,
    proposedTimeline: '6 weeks',
    executiveSummary: 'Compliance training specialist',
    status: 'accepted',
    createdAt: new Date(2026, 2, 9).toISOString(),
    updatedAt: new Date(2026, 2, 11).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-007-gina-coral',
    name: 'Gina Auditor - ISO 27001 Bid',
    project: 'proj-006-coral-meadow',
    providerId: 'a3-gina-auditor',
    coverLetter: 'ISO 27001 gap assessment with remediation roadmap',
    proposedPrice: 6500,
    proposedTimeline: '4 weeks',
    executiveSummary: 'ISO 27001 Lead Assessor',
    status: 'accepted',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 12).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Bids on published RFPs (pending — marketplace activity)
  // ═══════════════════════════════════════════════════════════════════════════

  // Cloud Security Posture Review (rfp-002)
  {
    id: 'bid-008-gina-cloud',
    name: 'Gina Auditor - Cloud Security Bid',
    project: 'rfp-002-cloud-security',
    providerId: 'a3-gina-auditor',
    coverLetter: 'Cloud security posture review with multi-cloud expertise',
    proposedPrice: 11000,
    proposedTimeline: '5 weeks',
    executiveSummary: 'AWS/Azure certified security assessor',
    status: 'pending',
    createdAt: new Date(2026, 2, 20).toISOString(),
    updatedAt: new Date(2026, 2, 20).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-009-carlos-cloud',
    name: 'Carlos Rivera - Cloud SecOps Bid',
    project: 'rfp-002-cloud-security',
    providerId: 'carlos-rivera',
    coverLetter: 'Security operations perspective on cloud posture',
    proposedPrice: 9500,
    proposedTimeline: '4 weeks',
    executiveSummary: 'SecOps specialist with cloud infrastructure expertise',
    status: 'pending',
    createdAt: new Date(2026, 2, 21).toISOString(),
    updatedAt: new Date(2026, 2, 21).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },

  // AI Vulnerability Triage Agent (rfp-003)
  {
    id: 'bid-010-bob-vuln',
    name: 'Bob IT - AI Vuln Triage Bid',
    project: 'rfp-003-ai-vuln-triage',
    providerId: 'a1-bob-it',
    coverLetter: 'AI-powered vulnerability triage with LLM integration',
    proposedPrice: 35000,
    proposedTimeline: '10 weeks',
    executiveSummary: 'AI Agent Builder — built 3 similar triage agents',
    status: 'pending',
    createdAt: new Date(2026, 2, 18).toISOString(),
    updatedAt: new Date(2026, 2, 18).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-011-sarah-vuln',
    name: 'Sarah Chen - DevSecOps Triage Bid',
    project: 'rfp-003-ai-vuln-triage',
    providerId: 'sarah-chen',
    coverLetter: 'DevSecOps-integrated vulnerability management agent',
    proposedPrice: 28000,
    proposedTimeline: '8 weeks',
    executiveSummary: 'DevSecOps lead with CI/CD security automation',
    status: 'pending',
    createdAt: new Date(2026, 2, 19).toISOString(),
    updatedAt: new Date(2026, 2, 19).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-012-clark-vuln',
    name: 'Clark Stacer - Platform Triage Bid',
    project: 'rfp-003-ai-vuln-triage',
    providerId: 'clark-stacer',
    coverLetter: 'Platform-native triage agent with ZeroBias integration',
    proposedPrice: 38000,
    proposedTimeline: '12 weeks',
    executiveSummary: 'Platform architect with compliance automation expertise',
    status: 'pending',
    createdAt: new Date(2026, 2, 20).toISOString(),
    updatedAt: new Date(2026, 2, 20).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },

  // SOC 2 Type II - Acme Corp (rfp-005)
  {
    id: 'bid-013-gina-acme',
    name: 'Gina Auditor - Acme SOC 2 Bid',
    project: 'rfp-005-soc2-acme',
    providerId: 'a3-gina-auditor',
    coverLetter: 'SOC 2 Type II assessment with continuous monitoring setup',
    proposedPrice: 10000,
    proposedTimeline: '8 weeks',
    executiveSummary: 'SOC 2 specialist — 50+ assessments completed',
    status: 'pending',
    createdAt: new Date(2026, 2, 22).toISOString(),
    updatedAt: new Date(2026, 2, 22).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'bid-014-james-acme',
    name: 'James Okafor - Acme GRC Bid',
    project: 'rfp-005-soc2-acme',
    providerId: 'james-okafor',
    coverLetter: 'GRC-integrated SOC 2 approach with framework alignment',
    proposedPrice: 11500,
    proposedTimeline: '6 weeks',
    executiveSummary: 'GRC consultant with SOC 2 experience',
    status: 'pending',
    createdAt: new Date(2026, 2, 23).toISOString(),
    updatedAt: new Date(2026, 2, 23).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },

  // SOC Monitoring Healthcare (rfp-008)
  {
    id: 'bid-015-carlos-soc',
    name: 'Carlos Rivera - SOC Monitoring Bid',
    project: 'rfp-008-soc-monitoring',
    providerId: 'carlos-rivera',
    coverLetter: 'SIEM deployment with healthcare-specific detection rules',
    proposedPrice: 22000,
    proposedTimeline: '7 weeks',
    executiveSummary: 'SecOps specialist — 5 healthcare SOC deployments',
    status: 'pending',
    createdAt: new Date(2026, 2, 22).toISOString(),
    updatedAt: new Date(2026, 2, 22).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
];

/**
 * Builder function: Generate demo bids linked to specific engagements.
 */
export function seedDemoBids(projectIds?: string[]): DemoBid[] {
  if (!projectIds || projectIds.length === 0) {
    return DEMO_BIDS.map(bid => ({ ...bid }));
  }
  return DEMO_BIDS.filter(bid => projectIds.includes(bid.project)).map(bid => ({ ...bid }));
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    engagementId: 'proj-001-crystal-harbor',
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'note-002-crystal-progress',
    name: 'Progress Update - Week 2',
    engagementId: 'proj-001-crystal-harbor',
    folderId: 'folder-001-crystal-general', // General subfolder, NOT notebook root
    title: 'Progress Update - Week 2',
    body: 'Completed access logging audit. Found 2 non-compliant systems. Remediation plan drafted.',
    authorZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 3, 6).toISOString(),
    updatedAt: new Date(2026, 3, 6).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: false,
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'note-003-velvet-strategy',
    name: 'NIST CSF Strategy Session',
    engagementId: 'proj-003-velvet-summit',
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'note-004-silver-agenda',
    name: 'Training Module Outline',
    engagementId: 'proj-005-silver-bridge',
    title: 'Training Module Outline',
    body: 'HIPAA training: 3 modules (60 min each) covering privacy, security, breach notification.',
    authorZerobiasUserId: 'alex-nguyen',
    createdAt: new Date(2026, 2, 9).toISOString(),
    updatedAt: new Date(2026, 2, 9).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: false,
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'note-005-coral-findings',
    name: 'ISO 27001 Gap Analysis Findings',
    engagementId: 'proj-006-coral-meadow',
    folderId: 'folder-005-coral-general', // General subfolder, NOT notebook root
    title: 'ISO 27001 Gap Analysis Findings',
    body: 'Identified 12 gaps across Control objectives. 8 critical, 4 medium. Roadmap created.',
    authorZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    archived: false,
    accessLevel: 'boundary',
    isMeetingMinutes: false,
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    engagementId: 'proj-001-crystal-harbor',
    name: 'Crystal Harbor Assessment',
    description: 'SOC 2 Type I assessment notes and documentation',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 6).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 1,
    color: '#1976d2',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'folder-001-crystal-general',
    engagementId: 'proj-001-crystal-harbor',
    parentId: 'folder-001-crystal',
    name: 'General',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 6).toISOString(),
    updatedAt: new Date(2026, 2, 6).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 0,
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  // ── Velvet Summit notebook + subfolders ──
  {
    id: 'folder-002-velvet',
    engagementId: 'proj-003-velvet-summit',
    name: 'NIST CSF Implementation',
    description: 'Implementation roadmap and strategy notes',
    createdByZerobiasUserId: 'james-okafor',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 7).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 1,
    color: '#388e3c',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'folder-002-velvet-general',
    engagementId: 'proj-003-velvet-summit',
    parentId: 'folder-002-velvet',
    name: 'General',
    createdByZerobiasUserId: 'james-okafor',
    createdAt: new Date(2026, 2, 7).toISOString(),
    updatedAt: new Date(2026, 2, 7).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 0,
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  // ── Coral Meadow notebook + subfolders ──
  {
    id: 'folder-005-coral',
    engagementId: 'proj-006-coral-meadow',
    name: 'ISO 27001 Gap Assessment',
    description: 'Gap analysis findings and remediation planning',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 1,
    color: '#d32f2f',
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'folder-005-coral-general',
    engagementId: 'proj-006-coral-meadow',
    parentId: 'folder-005-coral',
    name: 'General',
    createdByZerobiasUserId: 'a3-gina-auditor',
    createdAt: new Date(2026, 2, 10).toISOString(),
    updatedAt: new Date(2026, 2, 10).toISOString(),
    accessLevel: 'boundary',
    sortOrder: 0,
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    engagementId: 'proj-001-crystal-harbor',
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'doc-002-crystal-wip',
    name: 'Access Control Audit WIP',
    engagementId: 'proj-001-crystal-harbor',
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'doc-003-velvet-plan',
    name: 'NIST CSF 3-Month Roadmap',
    engagementId: 'proj-003-velvet-summit',
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
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
    engagementId: 'proj-001-crystal-harbor',
    rating: 5,
    reviewText: 'Exceptional SOC 2 expertise. Fast-tracked without compromising quality. Highly recommended.',
    approved: false,
    createdAt: new Date(2026, 3, 7).toISOString(),
    updatedAt: new Date(2026, 3, 7).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
  {
    id: 'review-002-james-by-fintech',
    name: 'Review of James Okafor - Velvet Summit',
    providerId: 'james-okafor',
    reviewerZerobiasUserId: 'buyer-fintech-002',
    engagementId: 'proj-003-velvet-summit',
    rating: 5,
    reviewText: 'Outstanding GRC consultant. Developed comprehensive NIST CSF roadmap. Strategic insights valuable.',
    approved: false,
    createdAt: new Date(2026, 5, 8).toISOString(),
    updatedAt: new Date(2026, 5, 8).toISOString(),
    tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }],
  },
];

/**
 * Builder function: Generate demo reviews.
 */
export function seedDemoReviews(): DemoReview[] {
  return DEMO_REVIEWS.map(review => ({ ...review }));
}
