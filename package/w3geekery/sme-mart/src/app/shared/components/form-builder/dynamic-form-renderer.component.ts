import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { FormBuilderConfig, FormSubmission, FormFieldConfig } from '../../../core/models/form-builder.model';
import { FormFieldRendererComponent } from './form-field-renderer.component';
import { Subject } from 'rxjs';

type FormMode = 'preview' | 'fill' | 'review';

@Component({
  selector: 'app-dynamic-form-renderer',
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
    MatProgressSpinnerModule,
    MatExpansionModule,
    DragDropModule,
    FormFieldRendererComponent,
  ],
  templateUrl: './dynamic-form-renderer.component.html',
  styleUrls: ['./dynamic-form-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormRendererComponent implements OnInit, OnDestroy {
  config = input.required<FormBuilderConfig>();
  mode = input<FormMode>('fill');
  submission = input<Partial<FormSubmission>>({});

  submit = output<Record<string, unknown>>();
  draftSave = output<Record<string, unknown>>();

  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  formGroup!: FormGroup;
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  ngOnInit(): void {
    const cfg = this.config();
    const sub = this.submission();

    // Build form group with validators for fill mode
    const group: any = {};
    (cfg.fields || []).forEach((field) => {
      const value = sub.submissionData?.[field.id] ?? '';
      const validators = this.getValidatorsForField(field);
      group[field.id] = [value, validators];
    });

    this.formGroup = this.fb.group(group);

    // Disable form in preview/review mode
    if (this.mode() !== 'fill') {
      this.formGroup.disable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onSubmit(): Promise<void> {
    if (this.mode() !== 'fill' || !this.formGroup.valid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      // Server-side validation happens here (FormSubmissionService.update)
      // If validation fails, exception is thrown and caught below
      const data = this.formGroup.value;
      this.submit.emit(data);
    } catch (err: any) {
      this.submitError.set(err?.message || 'Failed to submit form');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onSaveDraft(): Promise<void> {
    if (this.mode() !== 'fill') return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const data = this.formGroup.value;
      this.draftSave.emit(data);
    } catch (err: any) {
      this.submitError.set(err?.message || 'Failed to save draft');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private getValidatorsForField(field: FormFieldConfig): any[] {
    if (this.mode() !== 'fill') return [];

    const validators = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.type === 'text' || field.type === 'textarea') {
      if (field.textValidation?.minLength) {
        validators.push(Validators.minLength(field.textValidation.minLength));
      }
      if (field.textValidation?.maxLength) {
        validators.push(Validators.maxLength(field.textValidation.maxLength));
      }
      if (field.textValidation?.pattern === 'email') {
        validators.push(Validators.email);
      }
      // Add custom pattern if needed
    }

    if (field.type === 'number') {
      if (field.numberValidation?.min !== undefined) {
        validators.push(Validators.min(field.numberValidation.min));
      }
      if (field.numberValidation?.max !== undefined) {
        validators.push(Validators.max(field.numberValidation.max));
      }
    }

    return validators;
  }

  protected readonly FormMode = 'fill';
}
