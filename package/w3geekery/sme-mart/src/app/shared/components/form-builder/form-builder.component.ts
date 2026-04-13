import {
  Component, input, output, signal, computed, inject,
  ChangeDetectionStrategy, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

import { FormBuilderConfig, FormFieldConfig } from '../../../core/models/form-builder.model';
import { FormFieldEditorComponent } from './form-field-editor.component';
import { FORM_FIELD_TYPES } from './form.constants';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DragDropModule,
    FormFieldEditorComponent,
  ],
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilderComponent implements OnInit {
  formConfig = input.required<FormBuilderConfig>();
  isLocked = input<boolean>(false);

  formConfigChange = output<FormBuilderConfig>();

  private fb = inject(FormBuilder);

  formGroup!: FormGroup;
  fields = signal<FormFieldConfig[]>([]);
  fieldWarning = computed(() => {
    const count = this.fields().length;
    return count >= 25 ? 'Forms with many fields may reduce vendor response rates' : null;
  });

  ngOnInit(): void {
    const config = this.formConfig();
    this.fields.set(config.fields || []);

    this.formGroup = this.fb.group({
      fields: this.fb.array(
        (config.fields || []).map(field => this.fb.group({
          id: [field.id],
          type: [field.type],
          label: [field.label, Validators.required],
          required: [field.required],
        }))
      ),
    });
  }

  addField(): void {
    if (this.isLocked()) return;

    const newField: FormFieldConfig = {
      id: crypto.randomUUID(),
      type: 'text',
      label: '',
      required: false,
    };

    this.fields.update(f => [...f, newField]);
    this.emitChange();
  }

  onFieldChange(index: number, updatedField: FormFieldConfig): void {
    if (this.isLocked()) return;

    this.fields.update(f => {
      const updated = [...f];
      updated[index] = updatedField;
      return updated;
    });
    this.emitChange();
  }

  onFieldDelete(index: number): void {
    if (this.isLocked()) return;

    this.fields.update(f => f.filter((_, i) => i !== index));
    this.emitChange();
  }

  onFieldsReordered(event: CdkDragDrop<FormFieldConfig[]>): void {
    if (this.isLocked()) return;

    if (event.previousIndex !== event.currentIndex) {
      this.fields.update(f => {
        const updated = [...f];
        const [removed] = updated.splice(event.previousIndex, 1);
        updated.splice(event.currentIndex, 0, removed);
        return updated;
      });
      this.emitChange();
    }
  }

  private emitChange(): void {
    const updated: FormBuilderConfig = {
      version: 1,
      fields: this.fields(),
      lockedAt: this.formConfig().lockedAt,
    };
    this.formConfigChange.emit(updated);
  }

  protected readonly FORM_FIELD_TYPES = FORM_FIELD_TYPES;
}
