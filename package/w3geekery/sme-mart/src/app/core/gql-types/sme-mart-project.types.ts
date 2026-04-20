/**
 * GQL Response Types for SmeMartProject entity
 *
 * SmeMartProject represents a top-level project container in Project Bloom.
 * Also serves as the RFP entity (status: draft → published → active → completed).
 * Extends Object base class (inherited fields: id, name, description, tags, links, dates)
 */

export interface GqlSmeMartProjectResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // SmeMartProject-specific fields
  status: string; // Enum: 'draft', 'published', 'active', 'completed', 'archived'
  startDate: string; // ISO 8601
  targetEndDate?: string | null; // ISO 8601

  // RFP fields (Plan 075 — formerly on Engagement)
  category?: string | null;
  budgetType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  timeline?: string | null;
  responseDeadline?: string | null; // ISO 8601
  questionsDeadline?: string | null; // ISO 8601
  evaluationCriteria?: unknown | null; // JSON scoring matrix
  wizardStep?: string | null;
  wizardData?: unknown | null; // JSON wizard draft state

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  bids?: any[]; // Linked Bid objects (bidirectional: Bid.project)
  boards?: any[]; // Linked SmeMartBoard objects
  prd?: any; // Linked ProjectPrd object
  plan?: any; // Linked ProjectPlan object
}
