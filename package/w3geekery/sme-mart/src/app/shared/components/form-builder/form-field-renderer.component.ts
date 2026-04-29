import { Component, input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FormFieldConfig, FormSubmission, FileReference } from '../../../core/models/form-builder.model';

type FormMode = 'preview' | 'fill' | 'review';

@Component({
  selector: 'app-form-field-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './form-field-renderer.component.html',
  styleUrls: ['./form-field-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldRendererComponent implements OnInit {
  field = input.required<FormFieldConfig>();
  mode = input<FormMode>('fill');
  formGroup = input.required<FormGroup>();
  submission = input<Partial<FormSubmission>>({});

  isReadOnly = false;
  control: any;

  ngOnInit(): void {
    this.isReadOnly = this.mode() === 'review';
    this.control = this.formGroup().get(this.field().id);
  }

  getSampleData(): any {
    const type = this.field().type;
    switch (type) {
      case 'text':
        return 'Sample text response';
      case 'textarea':
        return 'Sample long text response with multiple lines...';
      case 'dropdown':
        return this.field().dropdownOptions?.[0]?.value || 'Option 1';
      case 'number':
        return 42;
      case 'checkbox':
        return true;
      case 'file':
        return null; // Files don't have sample data
      default:
        return '';
    }
  }

  getDisplayValue(): any {
    const submissionData = this.submission().submissionData || {};
    const value = submissionData[this.field().id];

    if (this.mode() === 'preview') {
      return this.getSampleData();
    }

    if (this.mode() === 'review') {
      if (this.field().type === 'file' && value) {
        const fileRef = value as FileReference;
        return fileRef.fileName;
      }
      return value;
    }

    return value;
  }

  async handleFileUpload(event: any): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO(v1.2): File upload integration
    // In v1.2, we capture filename/size only. File bytes are NOT uploaded to ZB FileService.
    // See .planning/notes/zb-file-upload-sdk-reference.md for FileService SDK details.
    // v1.3 will integrate the full FileService.create() → FileService.upload() flow.

    const fileRef: FileReference = {
      fileId: crypto.randomUUID() as any,
      fileName: file.name,
      fileSize: file.size,
    };

    this.control.setValue(fileRef);
  }

  getErrorMessage(): string | null {
    if (!this.control?.errors) return null;

    if (this.control.errors['required']) return `${this.field().label} is required`;
    if (this.control.errors['minlength']) {
      return `${this.field().label} must be at least ${this.control.errors['minlength'].requiredLength} characters`;
    }
    if (this.control.errors['maxlength']) {
      return `${this.field().label} must not exceed ${this.control.errors['maxlength'].requiredLength} characters`;
    }
    if (this.control.errors['min']) {
      return `${this.field().label} must be at least ${this.control.errors['min'].min}`;
    }
    if (this.control.errors['max']) {
      return `${this.field().label} must not exceed ${this.control.errors['max'].max}`;
    }
    if (this.control.errors['email']) return `${this.field().label} must be a valid email`;

    return 'Invalid value';
  }
}
