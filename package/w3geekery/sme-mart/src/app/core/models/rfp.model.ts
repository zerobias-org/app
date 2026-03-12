/**
 * RFP (Request for Proposal) models for the multi-step wizard.
 *
 * The wizard produces an RfpData object persisted to work_requests.rfp_wizard_data
 * as JSON. On publish, the data is used to create ZB Tasks, tags, and attachments.
 */

import type { BudgetType } from './enums';
import type { DocumentType } from './document.model';

// ---------------------------------------------------------------------------
// Evidence & evaluation types
// ---------------------------------------------------------------------------

export type EvidenceType = 'document' | 'certification' | 'attestation' | 'demo' | 'na';

export interface EvaluationCriterion {
  name: string;
  weight: number; // 0–100, all criteria should sum to 100
  description?: string;
}

// ---------------------------------------------------------------------------
// Requirement (becomes a ZB SubTask)
// ---------------------------------------------------------------------------

export interface RfpRequirement {
  id: string;                       // Client-generated UUID
  taskType: DocumentType;           // Maps to parent task group
  title: string;
  description?: string;
  standardReference?: string;       // e.g., "NIST SP800-53 AC-2"
  evidenceType: EvidenceType;
  priority: number;                 // 1000=Critical, 500=High, 200=Normal, 100=Low
  sortOrder: number;
  sourceDocumentId?: string;        // Links to uploaded EngagementDocument
}

// ---------------------------------------------------------------------------
// Task group (becomes a typed ZB Task)
// ---------------------------------------------------------------------------

export interface RfpTaskGroup {
  taskType: DocumentType;
  taskTypeTagId?: string;           // Global ZB tag ID (resolved on publish)
  taskTypeTagName: string;          // e.g., 'SECURITY'
  displayName: string;              // e.g., 'Security Requirements'
  requirements: RfpRequirement[];
}

// ---------------------------------------------------------------------------
// Full wizard data (persisted as JSON in work_requests.rfp_wizard_data)
// ---------------------------------------------------------------------------

export interface RfpData {
  // Step 1 — Basics
  title: string;
  description: string;
  category: string;
  budgetType: BudgetType | null;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;

  /** The word-word identifier for this RFP (e.g., "amber-circuit").
   *  Used as: sme-mart.rfp.{identifier} now, sme-mart.eng.{identifier} after bid acceptance. */
  rfpTagIdentifier: string;

  // Step 2 — Documents (IDs only; full docs loaded separately)
  documentIds: string[];

  // Step 3 — Requirements
  taskGroups: RfpTaskGroup[];

  // Step 4 — Terms
  responseDeadline?: string;
  questionsDeadline?: string;
  evaluationCriteria: EvaluationCriterion[];
  confidentialityRequirements?: string;
}

// ---------------------------------------------------------------------------
// Publish result
// ---------------------------------------------------------------------------

export interface RfpPublishResult {
  engagementTag: string;
  zerobiasTagId: string;
  masterTaskId: string;
  childTaskIds: string[];
  subtaskCount: number;
}

// ---------------------------------------------------------------------------
// Import schema (Tier 1: LLM-generated JSON → wizard hydration)
// ---------------------------------------------------------------------------

export interface SmeMartRfpImport {
  schemaVersion: '1.0';

  source?: {
    filename?: string;
    documentType?: string;
    organization?: string;
    dateExtracted?: string;
    parserTier?: 'llm-prompt' | 'in-app' | 'mcp-task';
  };

  basics?: {
    title?: string;
    description?: string;
    category?: string;
    budgetType?: 'fixed' | 'hourly' | 'negotiable';
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
  };

  taskGroups: SmeMartRfpTaskGroupImport[];
}

export interface SmeMartRfpTaskGroupImport {
  taskType: 'SECURITY' | 'COMPLIANCE' | 'LEGAL' | 'FUNCTIONAL' | 'FINANCIAL';
  displayName: string;
  requirements: SmeMartRfpRequirementImport[];
}

export interface SmeMartRfpRequirementImport {
  title: string;
  description?: string;
  standardReference?: string;
  evidenceType?: 'document' | 'certification' | 'attestation' | 'demo' | 'na';
  priority?: 'critical' | 'high' | 'normal' | 'low';
}
