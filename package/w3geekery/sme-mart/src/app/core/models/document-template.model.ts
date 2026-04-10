/**
 * DocumentTemplate Model (Wave 0: Schema & Models - Phase 15 Plan 01)
 *
 * Represents a reusable document template with variable substitution support.
 * Org admins create templates at the org level; templates are instantiated
 * into engagements by buyers with custom variable values.
 *
 * Variable support:
 * - Built-in variables: buyerOrgName, vendorOrgName, engagementTitle, engagementId, etc.
 * - Custom variables: Defined in variableSchema JSON with optional defaults and required flags
 * - Escaping: \{{ renders as literal {{, \}} renders as literal }}
 *
 * Status transitions:
 *   - draft: Template in progress, not yet available for instantiation
 *   - published: Template ready for instantiation by buyers
 *   - archived: Template hidden from instantiation pickers but preserved for existing instances
 *
 * Schema class ID: (deterministic UUID v5 from YAML schema — populated after dataloader verification)
 */

export type TemplateDocumentType = 'msa' | 'nda' | 'sow' | 'compliance' | 'other';
export type DocumentTemplateStatus = 'draft' | 'published' | 'archived';

/**
 * CustomVariable — Schema definition for a template variable.
 * Used in variableSchema JSON to define custom variable names, defaults, and validation.
 */
export interface CustomVariable {
  name: string; // Variable name (must match {{name}} pattern in content)
  label: string; // Human-readable label for UI
  defaultValue?: string; // Optional default value if not provided at instantiation time
  required?: boolean; // If true, instantiation fails if not provided
  description?: string; // Optional help text for users
}

export interface DocumentTemplate {
  id: string; // UUID assigned by Platform on creation
  name: string; // Template name (e.g., "MSA - Standard SOC2")
  description?: string | null; // Optional template description
  documentType: TemplateDocumentType; // Classification: msa, nda, sow, compliance, other
  content: string; // Markdown with {{variableName}} placeholders
  variableSchema?: string | null; // JSON string of CustomVariable[] (null if no custom vars)
  version: number; // Increments on content/schema changes (starts at 1)
  status: DocumentTemplateStatus; // draft, published, or archived
  orgId: string; // Owner org UUID (determines who can edit)
  createdBy: string; // User ID who created (optional, may be empty initially)
  createdAt: Date | string; // ISO 8601 timestamp
  updatedAt: Date | string; // ISO 8601 timestamp
}

export interface CreateDocumentTemplateDto {
  name: string;
  description?: string;
  documentType: TemplateDocumentType;
  content: string;
  variableSchema?: CustomVariable[]; // Will be JSON-stringified for storage
  orgId: string; // Owner org UUID
}

export interface UpdateDocumentTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  variableSchema?: CustomVariable[];
  status?: DocumentTemplateStatus;
}
