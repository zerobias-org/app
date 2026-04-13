import { FormFieldType } from '../../../core/models/form-builder.model';

export const FORM_FIELD_TYPES: FormFieldType[] = [
  'text',
  'textarea',
  'dropdown',
  'number',
  'file',
  'checkbox',
];

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  dropdown: 'Dropdown Select',
  number: 'Number',
  file: 'File Upload',
  checkbox: 'Checkbox',
};

// Default validators per type
export const DEFAULT_FIELD_VALIDATORS = {
  text: { minLength: 0, maxLength: 255 },
  textarea: { minLength: 0, maxLength: 5000 },
  number: { min: 0, max: 1000 },
  dropdown: { options: [] },
  file: { maxFileSizeBytes: 10 * 1024 * 1024, maxFiles: 1 },
  checkbox: {},
};
