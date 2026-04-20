import type { RfpTaskGroup } from './rfp.model';
import type { BidWizardData } from './bid.model';
import type { ComplianceStatus } from './bid-response.model';

// ---------------------------------------------------------------------------
// Context sent to LLM
// ---------------------------------------------------------------------------

/** All context gathered from RFP + vendor profile for LLM prompt construction. */
export interface BidGenerationContext {
  rfp: {
    title: string;
    description: string;
    category?: string;
    budgetType?: string;
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
    taskGroups: RfpTaskGroup[];
  };
  vendor: {
    displayName: string;
    headline?: string;
    bio?: string;
    skills?: string[];
    frameworks?: string[];
    certifications?: string[];
  };
  orgDocSummaries?: string[]; // Extracted text snippets from vendor org documents
}

// ---------------------------------------------------------------------------
// Request / Response to Edge API route
// ---------------------------------------------------------------------------

export interface BidAiRequest {
  context: BidGenerationContext;
  /** Which section(s) to generate. Omit for full bid draft. */
  sections?: BidAiSectionType[];
}

export type BidAiSectionType =
  | 'executive_summary'
  | 'cover_letter'
  | 'team_description'
  | 'requirement_responses'
  | 'pricing_breakdown';

/** A single generated section streamed from the LLM. */
export interface BidAiSection {
  type: BidAiSectionType;
  content: string; // Raw text/markdown for narrative sections
}

/** Per-requirement AI-generated response. */
export interface BidAiRequirementResponse {
  requirementId: string;
  complianceStatus: ComplianceStatus;
  responseText: string;
  estimatedHours: number;
  estimatedCost: number;
}

/** Complete parsed response from the LLM. */
export interface BidAiResponse {
  wizardData: BidWizardData;
  requirementResponses: BidAiRequirementResponse[];
  model: string;
}

/** Progress update emitted during streaming generation. */
export interface BidAiProgress {
  status: 'gathering' | 'generating' | 'parsing' | 'complete' | 'error';
  section?: string; // Current section being generated
  message: string;
  percent: number; // 0-100
}

export type BidMethod = 'manual' | 'ai';
