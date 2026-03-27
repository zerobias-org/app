/**
 * SmeMartProject model interfaces
 *
 * SmeMartProject is the top-level container for Project Bloom work.
 * Also serves as the RFP entity (status: draft → published → active → completed).
 */

import type { BudgetType } from './enums';

export interface SmeMartProject {
  id: string;
  name: string;
  description?: string | null;
  status: string; // 'draft', 'published', 'active', 'completed', 'archived'
  engagementId?: string | null; // parent engagement (corp-to-corp agreement)
  projectType?: string | null; // 'rfp' | 'pilot' | 'project' (Plan 077)
  startDate: string; // YYYY-MM-DD
  targetEndDate?: string | null; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // RFP fields (Plan 075 — formerly on Engagement)
  category?: string | null;
  budgetType?: BudgetType | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  timeline?: string | null;
  responseDeadline?: string | null; // ISO 8601
  questionsDeadline?: string | null; // ISO 8601
  evaluationCriteria?: Record<string, unknown> | null; // JSON scoring matrix
  wizardStep?: string | null; // RFP wizard progress
  wizardData?: Record<string, unknown> | null; // RFP wizard draft state
}

export interface CreateSmeMartProjectRequest {
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  targetEndDate?: string;
  // RFP fields
  category?: string;
  budgetType?: BudgetType | null;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  responseDeadline?: string;
  questionsDeadline?: string;
  evaluationCriteria?: Record<string, unknown>;
  wizardStep?: string;
  wizardData?: Record<string, unknown>;
}

export interface UpdateSmeMartProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  targetEndDate?: string;
  // RFP fields
  category?: string;
  budgetType?: BudgetType | null;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  responseDeadline?: string;
  questionsDeadline?: string;
  evaluationCriteria?: Record<string, unknown>;
  wizardStep?: string;
  wizardData?: Record<string, unknown>;
}
