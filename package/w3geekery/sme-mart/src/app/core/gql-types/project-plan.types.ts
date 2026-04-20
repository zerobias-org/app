/**
 * GQL Response Types for ProjectPlan and PlanMilestone entities
 *
 * ProjectPlan represents a project execution plan container for a SmeMartProject.
 * PlanMilestone represents a milestone within a ProjectPlan.
 * Greenfield entities (no Neon migration — AuditgraphDB only).
 */

export interface GqlProjectPlanResponse {
  id: string;
  parentId: string; // SmeMartProject reference
  title: string;
  approach?: string | null;
  estimatedDuration?: string | null;
  teamStructure?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GqlPlanMilestoneResponse {
  id: string;
  parentId: string; // ProjectPlan reference
  name: string;
  targetDate?: string | null;
  status?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}
