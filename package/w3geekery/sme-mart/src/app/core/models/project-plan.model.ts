/**
 * ProjectPlan and PlanMilestone domain models
 *
 * ProjectPlan represents a project execution plan container for a SmeMartProject.
 * PlanMilestone represents a milestone within a ProjectPlan.
 * Greenfield entities (no Neon table — AuditgraphDB only).
 */

export interface ProjectPlan {
  id: string;
  name: string;
  projectId: string; // plan.projectId
  title: string;
  approach?: string | null;
  estimatedDuration?: string | null;
  teamStructure?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlanMilestone {
  id: string;
  planId: string; // scalar mirror of the plan link
  name: string;
  targetDate?: string | null;
  status?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request type for creating a new ProjectPlan
 */
export interface CreateProjectPlanRequest {
  parentId: string;
  title: string;
  approach?: string;
  estimatedDuration?: string;
  teamStructure?: Record<string, unknown>;
}

/**
 * Request type for updating an existing ProjectPlan
 */
export interface UpdateProjectPlanRequest {
  title?: string;
  approach?: string;
  estimatedDuration?: string;
  teamStructure?: Record<string, unknown>;
}

/**
 * Request type for creating a new PlanMilestone
 */
export interface CreatePlanMilestoneRequest {
  parentId: string; // Plan ID
  name: string;
  targetDate?: string;
  status?: string;
  sortOrder?: number;
}

/**
 * Request type for updating an existing PlanMilestone
 */
export interface UpdatePlanMilestoneRequest {
  name?: string;
  targetDate?: string;
  status?: string;
  sortOrder?: number;
}
