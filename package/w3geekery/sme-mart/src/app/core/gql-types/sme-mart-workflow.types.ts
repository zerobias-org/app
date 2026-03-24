/**
 * GQL Response Types for SmeMartWorkflow entity
 *
 * SmeMartWorkflow defines statuses and transitions for SmeMartActivity items.
 * Pure data layer—no state machine logic in service.
 */

export interface SmeMartWorkflowStatus {
  name: string; // Status name (e.g., 'todo', 'in_progress', 'done')
  color?: string; // Optional hex color for UI display
}

export interface SmeMartWorkflowTransition {
  from: string; // Source status name
  to: string; // Target status name
  label?: string; // Optional transition label
}

export interface GqlSmeMartWorkflowResponse {
  // Object inherited fields
  id: string;
  name: string;

  // SmeMartWorkflow-specific fields
  statuses?: SmeMartWorkflowStatus[]; // Array of valid statuses
  transitions?: SmeMartWorkflowTransition[]; // Array of valid transitions

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  activities?: any[]; // Linked SmeMartActivity objects using this workflow
}
