/**
 * SmeMartTask domain model
 *
 * Represents a work item (task) within a Board with optional subtask hierarchy.
 * Greenfield entity (no Neon table — AuditgraphDB only).
 */

export interface SmeMartTask {
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

/**
 * Tree node for hierarchy representation
 * Used by getTaskTree() to represent parent-child relationships
 */
export interface SmeMartTaskTreeNode extends SmeMartTask {
  children?: SmeMartTaskTreeNode[];
}

/**
 * Request type for creating a new SmeMartTask
 */
export interface CreateSmeMartTaskRequest {
  boardId: string;
  name: string;
  code: string;
  status?: string;
  parentId?: string;
  rank?: number;
  priority?: string;
  description?: string;
  dueDate?: string;
  activityId?: string;
  customFields?: Record<string, unknown>[];
}

/**
 * Request type for updating an existing SmeMartTask
 */
export interface UpdateSmeMartTaskRequest {
  name?: string;
  code?: string;
  status?: string;
  parentId?: string;
  rank?: number;
  priority?: string;
  description?: string;
  dueDate?: string;
  activityId?: string;
  customFields?: Record<string, unknown>[];
}
