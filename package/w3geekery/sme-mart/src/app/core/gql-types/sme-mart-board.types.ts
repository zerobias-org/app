/**
 * GQL Response Types for SmeMartBoard entity
 *
 * SmeMartBoard is a structural container within a SmeMartProject.
 * Represents board/column in project view.
 */

export interface GqlSmeMartBoardResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // SmeMartBoard-specific fields
  code: string; // Board code identifier
  scope: string; // Scope classification (e.g., 'demand', 'supply', 'execution')
  partition: string; // Partition identifier
  parentId: string; // Reference to parent SmeMartProject

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  activities?: any[]; // Linked SmeMartActivity objects
}
