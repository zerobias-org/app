/**
 * DocumentInstance Model (Wave 0: Schema & Models - Phase 15 Plan 01)
 *
 * Represents an instantiation of a DocumentTemplate into a specific engagement.
 * When a buyer instantiates a template, custom variables are substituted and
 * the resolved content is stored as the instance.
 *
 * Instances are editable post-instantiation (D-03 requirement).
 * Per D-04, duplicate instantiation is allowed but warned to the buyer.
 *
 * Status progression:
 *   - draft: Instance created, editable
 *   - finalized: Instance locked, used in RFP package
 *   - archived: Instance hidden but preserved
 *   - deleted: Soft delete marker
 *
 * Schema class ID: (deterministic UUID v5 from YAML schema — populated after dataloader verification)
 */

export type DocumentInstanceStatus = 'draft' | 'finalized' | 'archived' | 'deleted';

export interface DocumentInstance {
  id: string; // UUID assigned by Platform on creation
  name: string; // Inherited from template at instantiation time
  description?: string | null; // Inherited from template
  documentType: 'msa' | 'nda' | 'sow' | 'compliance' | 'other'; // Inherited from template
  content: string; // Resolved content after variable substitution
  originalContent: string; // Content as generated from template (for diff tracking — D-03)
  templateId: string; // Reference to source DocumentTemplate
  templateVersion: number; // Version of template at instantiation time (for audit trail)
  variableValues: string; // JSON string of Record<string, string> (custom variables used)
  engagementId: string; // Engagement this instance belongs to
  projectId?: string | null; // Optional project reference (if created for a specific project)
  status: DocumentInstanceStatus; // draft, finalized, archived, deleted
  createdAt: Date | string; // ISO 8601 timestamp
  updatedAt: Date | string; // ISO 8601 timestamp
}

export interface InstantiateTemplateDto {
  templateId: string;
  engagementId: string;
  projectId?: string;
  customVariables: Record<string, string>; // Filled custom variable values from form
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingInstance?: DocumentInstance;
}
