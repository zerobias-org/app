/**
 * Field mappings for FormSubmission entity for Pipeline persistence
 *
 * Maps TypeScript property names to AuditgraphDB field names.
 * Used by FormSubmissionService when pushing data via Pipeline.receive().
 */

export const FORM_SUBMISSION_FIELD_MAPPING = {
  // Core identifiers
  id: 'id',
  projectId: 'projectId',
  bidId: 'bidId',

  // Form data
  submissionData: 'submissionData', // Stored as JSON string in Pipeline

  // Status & lifecycle
  status: 'status',
  submittedAt: 'submittedAt',
  reviewedAt: 'reviewedAt',
  reviewedBy: 'reviewedBy',

  // Audit fields
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
} as const;

export type FormSubmissionFieldKey = keyof typeof FORM_SUBMISSION_FIELD_MAPPING;
