import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import type { VettingDirection, CreateVettingItemRequest } from '../../../core/models';

export interface VettingItemDialogData {
  direction: VettingDirection;
}

const VETTING_TYPES = [
  { value: 'corporate_identity', label: 'Corporate Identity' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'financial', label: 'Financial' },
  { value: 'legal', label: 'Legal' },
  { value: 'reference', label: 'Reference' },
  { value: 'certification', label: 'Certification' },
  { value: 'documentation', label: 'Documentation' },
] as const;

const EVIDENCE_TYPES = [
  { value: 'document', label: 'Document Upload' },
  { value: 'form', label: 'Form / Data Entry' },
  { value: 'certification', label: 'Certification' },
  { value: 'attestation', label: 'Attestation / Self-Declaration' },
  { value: 'reference', label: 'Reference Check' },
] as const;

const CATEGORIES = [
  { value: 'always', label: 'Always Required' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'nice_to_have', label: 'Nice to Have' },
] as const;

@Component({
  selector: 'app-vetting-item-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Vetting Requirement</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. HIPAA BAA" cdkFocusInitial>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (c of categories; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Vetting Type</mat-label>
          <mat-select formControlName="vetting_type">
            @for (t of vettingTypes; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Evidence Type</mat-label>
          <mat-select formControlName="evidence_type">
            @for (e of evidenceTypes; track e.value) {
              <mat-option [value]="e.value">{{ e.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        Add
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 4px; }
    mat-dialog-content { min-width: 400px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VettingItemDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<VettingItemDialogComponent>);
  private readonly data = inject<VettingItemDialogData>(MAT_DIALOG_DATA);

  readonly vettingTypes = VETTING_TYPES;
  readonly evidenceTypes = EVIDENCE_TYPES;
  readonly categories = CATEGORIES;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    category: ['conditional' as string, Validators.required],
    vetting_type: ['compliance' as string, Validators.required],
    evidence_type: ['document' as string, Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const result: CreateVettingItemRequest = {
      name: v.name!,
      description: v.description || undefined,
      category: v.category as any,
      vetting_type: v.vetting_type as any,
      evidence_type: v.evidence_type as any,
      direction: this.data.direction,
    };

    this.dialogRef.close(result);
  }
}
