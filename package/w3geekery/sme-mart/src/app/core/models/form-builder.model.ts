import { UUID } from '@zerobias-org/types-core-js';

// Field type enumeration
export type FormFieldType = 'text' | 'textarea' | 'dropdown' | 'number' | 'file' | 'checkbox';

// Validation configurations for different field types
export interface TextValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: 'email' | 'phone' | 'url' | 'custom';
  patternValue?: string; // Custom regex if pattern='custom'
}

export interface NumberValidation {
  min?: number;
  max?: number;
  step?: number;
}

export interface FileUploadConfig {
  allowedMimeTypes?: string[]; // e.g., ['application/pdf', 'image/*']
  maxFileSizeBytes?: number; // e.g., 10 * 1024 * 1024 for 10 MB
  maxFiles?: number; // Per field (usually 1)
}

export interface DropdownOption {
  value: string;
  label: string;
}

// Single form field configuration
export interface FormFieldConfig {
  id: string; // Unique within form (UUID or auto-generated)
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string; // Helper text
  // Type-specific validation
  textValidation?: TextValidation;
  dropdownOptions?: DropdownOption[];
  numberValidation?: NumberValidation;
  fileUploadConfig?: FileUploadConfig;
  sectionId?: string; // Optional section grouping
}

// Named section for grouping fields
export interface FormSection {
  id: string;
  label: string;
  fields: FormFieldConfig[];
}

// Complete form builder configuration stored as JSON on SmeMartProject
export interface FormBuilderConfig {
  version: 1; // Schema version for future migrations
  sections?: FormSection[]; // Optional grouped sections
  fields: FormFieldConfig[]; // Top-level ungrouped fields
  lockedAt?: Date; // Locked on first submission
}

// File reference stored in FormSubmission.submissionData for file fields
export interface FileReference {
  fileId: UUID;
  fileName: string;
  fileSize: number;
}

// Form submission response from vendor
export interface FormSubmission {
  id: UUID;
  projectId: UUID; // Link to SmeMartProject
  bidId: UUID; // Link to Bid
  submissionData: Record<string, unknown>; // fieldId => value map
  status: 'draft' | 'submitted' | 'revised' | 'reviewed';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: UUID; // Party ID of reviewer
  createdAt: Date;
  updatedAt: Date;
}
