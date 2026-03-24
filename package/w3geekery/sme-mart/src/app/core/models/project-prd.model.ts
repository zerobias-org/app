/**
 * ProjectPrd and PrdSection domain models
 *
 * ProjectPrd represents a Product Requirements Document container for a SmeMartProject.
 * PrdSection represents a subsection within a ProjectPrd.
 * Greenfield entities (no Neon table — AuditgraphDB only).
 */

export interface ProjectPrd {
  id: string;
  parentId: string; // SmeMartProject reference
  title: string;
  summary?: string | null;
  sourceDocuments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PrdSection {
  id: string;
  parentId: string; // ProjectPrd reference
  type: string;
  content?: string | null;
  sortOrder?: number;
  sourceDocuments?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Request type for creating a new ProjectPrd
 */
export interface CreateProjectPrdRequest {
  parentId: string;
  title: string;
  summary?: string;
  sourceDocuments?: string[];
}

/**
 * Request type for updating an existing ProjectPrd
 */
export interface UpdateProjectPrdRequest {
  title?: string;
  summary?: string;
  sourceDocuments?: string[];
}

/**
 * Request type for creating a new PrdSection
 */
export interface CreatePrdSectionRequest {
  parentId: string; // Prd ID
  type: string;
  content?: string;
  sortOrder?: number;
  sourceDocuments?: string[];
}

/**
 * Request type for updating an existing PrdSection
 */
export interface UpdatePrdSectionRequest {
  type?: string;
  content?: string;
  sortOrder?: number;
  sourceDocuments?: string[];
}
