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
  projectType?: 'rfp' | 'pilot' | 'project' | null; // Plan 077: type discriminator
  promotedProjectId?: string | null; // Plan 77: linked project when pilot→project (inverse of promotedFromProjectId)
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

  // Invitation controls (Plan 14 Wave 1)
  isInvitationOnly?: boolean | null; // If true, only invited vendors can bid
}

export interface CreateSmeMartProjectRequest {
  name: string;
  description?: string;
  engagementId?: string;
  status?: string;
  projectType?: 'rfp' | 'pilot' | 'project';
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
  // Invitation controls (Plan 14 Wave 1)
  isInvitationOnly?: boolean;
}

export interface UpdateSmeMartProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  projectType?: 'rfp' | 'pilot' | 'project';
  targetEndDate?: string;
  promotedProjectId?: string;
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
  // Invitation controls (Plan 14 Wave 1)
  isInvitationOnly?: boolean;
}
