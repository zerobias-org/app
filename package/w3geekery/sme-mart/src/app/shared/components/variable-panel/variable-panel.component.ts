import {
  Component, input, output, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatFormField, MatLabel, MatError,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { CustomVariable } from '@/core/models';

@Component({
  selector: 'app-variable-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatIcon,
  ],
  templateUrl: './variable-panel.component.html',
  styleUrl: './variable-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariablePanelComponent {
  private readonly fb = inject(FormBuilder);

  readonly customVariables = input<CustomVariable[]>([]);
  readonly addVariable = output<CustomVariable>();
  readonly updateVariable = output<{ index: number; variable: CustomVariable }>();
  readonly removeVariable = output<number>();

  readonly showAddForm = signal(false);
  readonly editingIndex = signal<number | null>(null);
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
    label: ['', [Validators.required]],
    description: [''],
  });

  toggleAddForm(): void {
    this.showAddForm.set(!this.showAddForm());
    if (!this.showAddForm()) {
      this.form.reset();
    }
  }

  startEditVariable(index: number, variable: CustomVariable): void {
    this.editingIndex.set(index);
    this.showAddForm.set(true);
    this.form.patchValue({
      name: variable.name,
      label: variable.label,
      description: variable.description,
    });
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
    this.showAddForm.set(false);
    this.form.reset();
  }

  submitVariable(): void {
    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const variable: CustomVariable = {
      name: formValue.name!,
      label: formValue.label!,
      description: formValue.description || undefined,
    };

    const index = this.editingIndex();
    if (index !== null) {
      this.updateVariable.emit({ index, variable });
    } else {
      this.addVariable.emit(variable);
    }

    this.form.reset();
    this.showAddForm.set(false);
    this.editingIndex.set(null);
  }

  deleteVariable(index: number): void {
    this.removeVariable.emit(index);
  }
}
