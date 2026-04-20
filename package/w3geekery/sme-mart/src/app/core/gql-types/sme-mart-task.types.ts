/**
 * GQL Response Types for SmeMartTask entity
 *
 * SmeMartTask represents a work item within a Board with optional subtask hierarchy.
 * Greenfield entity (no Neon migration — AuditgraphDB only).
 */

export interface GqlSmeMartTaskResponse {
  id: string;
  boardId: string;
  parentId?: string | null;
  name: string;
  code: string;
  status: string;
  rank?: number;
  priority?: string;
  description?: string | null;
  dueDate?: string | null;
  activityId?: string | null;
  customFields?: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}
