/**
 * GQL Response Types for SmeMartActivity entity
 *
 * SmeMartActivity represents a work type blueprint within a SmeMartBoard.
 * Contains workflow references and custom field definitions.
 */

export interface SmeMartCustomField {
  name: string;
  type: string; // Field type: 'string', 'number', 'date', 'select', etc.
  defaultValue?: unknown;
}

export interface GqlSmeMartActivityResponse {
  // Object inherited fields
  id: string;
  name: string;

  // SmeMartActivity-specific fields
  type: string; // Activity type (e.g., 'task', 'milestone', 'deliverable')
  workflowId: string; // Reference to SmeMartWorkflow
  customFields?: SmeMartCustomField[]; // Array of custom field definitions

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  workflow?: any; // Linked SmeMartWorkflow object
  tasks?: any[]; // Linked SmeMartTask objects
}
