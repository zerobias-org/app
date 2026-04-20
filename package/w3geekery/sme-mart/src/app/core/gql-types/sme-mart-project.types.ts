/**
 * GQL Response Types for SmeMartProject entity
 *
 * SmeMartProject represents a top-level project container in Project Bloom.
 * Extends Object base class (inherited fields: id, name, description, tags, links, dates)
 */

export interface GqlSmeMartProjectResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // SmeMartProject-specific fields
  status: string; // Enum: 'draft', 'active', 'completed', 'archived', etc.
  startDate: string; // ISO 8601
  targetEndDate?: string | null; // ISO 8601

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  boards?: any[]; // Linked SmeMartBoard objects
  prd?: any; // Linked ProjectPrd object
  plan?: any; // Linked ProjectPlan object
}
