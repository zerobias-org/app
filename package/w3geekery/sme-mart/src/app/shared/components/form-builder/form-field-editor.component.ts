import {
  Component, input, output, signal, inject,
  ChangeDetectionStrategy, OnInit, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormFieldConfig, FormFieldType } from '../../../core/models/form-builder.model';
import { FORM_FIELD_TYPES } from './form.constants';

@Component({
  selector: 'app-form-field-editor',
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
    MatChipsModule,
  ],
  templateUrl: './form-field-editor.component.html',
  styleUrls: ['./form-field-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldEditorComponent implements OnInit {
  field = input.required<FormFieldConfig>();
  isLocked = input<boolean>(false);

  fieldChange = output<FormFieldConfig>();
  fieldDelete = output<void>();

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  formGroup!: FormGroup;
  selectedType = signal<FormFieldType>('text');

  ngOnInit(): void {
    const f = this.field();
    this.selectedType.set(f.type);

    this.formGroup = this.fb.group({
      label: [f.label, Validators.required],
      description: [f.description],
      placeholder: [f.placeholder],
      required: [f.required],
      type: [f.type, Validators.required],

      // Text validation
      minLength: [f.textValidation?.minLength],
      maxLength: [f.textValidation?.maxLength],
      pattern: [f.textValidation?.pattern],

      // Number validation
      min: [f.numberValidation?.min],
      max: [f.numberValidation?.max],
      step: [f.numberValidation?.step],

      // Dropdown options (one per line)
      dropdownOptionsText: [
        f.dropdownOptions?.map(opt => `${opt.value}|${opt.label}`).join('\n') || ''
      ],

      // File upload
      allowedMimeTypes: [f.fileUploadConfig?.allowedMimeTypes?.join(',') || ''],
      maxFileSizeBytes: [f.fileUploadConfig?.maxFileSizeBytes],
      maxFiles: [f.fileUploadConfig?.maxFiles],
    });

    // Listen to type changes with proper cleanup
    this.formGroup.get('type')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(type => {
        this.selectedType.set(type);
      });

    // Listen to all changes with proper cleanup
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.emitChange();
      });
  }

  deleteField(): void {
    this.fieldDelete.emit();
  }

  private emitChange(): void {
    const value = this.formGroup.value;
    const type = value.type as FormFieldType;

    const updated: FormFieldConfig = {
      id: this.field().id,
      type,
      label: value.label,
      required: value.required,
      description: value.description,
      placeholder: value.placeholder,
      sectionId: this.field().sectionId,

      // Type-specific
      ...(type === 'text' || type === 'textarea') && {
        textValidation: {
          minLength: value.minLength,
          maxLength: value.maxLength,
          pattern: value.pattern,
        }
      },

      ...(type === 'number') && {
        numberValidation: {
          min: value.min,
          max: value.max,
          step: value.step,
        }
      },

      ...(type === 'dropdown') && {
        dropdownOptions: this.parseDropdownOptions(value.dropdownOptionsText),
      },

      ...(type === 'file') && {
        fileUploadConfig: {
          allowedMimeTypes: value.allowedMimeTypes
            ? value.allowedMimeTypes.split(',').map((s: string) => s.trim())
            : undefined,
          maxFileSizeBytes: value.maxFileSizeBytes,
          maxFiles: value.maxFiles,
        }
      },
    };

    this.fieldChange.emit(updated);
  }

  private parseDropdownOptions(text: string) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const [value, label] = line.includes('|')
          ? line.split('|').map(s => s.trim())
          : [line, line];
        return { value, label };
      });
  }

  protected readonly FORM_FIELD_TYPES = FORM_FIELD_TYPES;
}
