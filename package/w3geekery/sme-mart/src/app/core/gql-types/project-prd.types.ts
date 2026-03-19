/**
 * GQL Response Types for ProjectPrd and PrdSection entities
 *
 * ProjectPrd represents a Product Requirements Document container for a SmeMartProject.
 * PrdSection represents a subsection within a ProjectPrd.
 * Greenfield entities (no Neon migration — AuditgraphDB only).
 */

export interface GqlProjectPrdResponse {
  id: string;
  parentId: string; // SmeMartProject reference
  title: string;
  summary?: string | null;
  sourceDocuments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GqlPrdSectionResponse {
  id: string;
  parentId: string; // ProjectPrd reference
  type: string;
  content?: string | null;
  sortOrder?: number;
  sourceDocuments?: string[];
  createdAt: string;
  updatedAt: string;
}
