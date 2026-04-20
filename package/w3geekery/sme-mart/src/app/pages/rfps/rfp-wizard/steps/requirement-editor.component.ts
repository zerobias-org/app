import {
  Component, Input, Output, EventEmitter, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import type { RfpRequirement, EvidenceType } from '../../../../core/models';
import type { DocumentType } from '../../../../core/models/document.model';

const PRIORITY_OPTIONS = [
  { value: 1000, label: 'Critical' },
  { value: 500, label: 'High' },
  { value: 200, label: 'Normal' },
  { value: 100, label: 'Low' },
];

const EVIDENCE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'certification', label: 'Certification' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'demo', label: 'Demo / Walkthrough' },
  { value: 'na', label: 'Not Applicable' },
];

@Component({
  selector: 'app-requirement-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatExpansionModule,
  ],
  template: `
    <mat-expansion-panel [expanded]="expanded" (opened)="expanded = true" (closed)="expanded = false">
      <mat-expansion-panel-header>
        <mat-panel-title>
          @if (requirement.title) {
            {{ requirement.title }}
          } @else {
            <em>New Requirement</em>
          }
        </mat-panel-title>
        <mat-panel-description>
          {{ priorityLabel(requirement.priority) }}
          @if (requirement.standardReference) {
            &middot; {{ requirement.standardReference }}
          }
        </mat-panel-description>
      </mat-expansion-panel-header>

      <form [formGroup]="form" class="req-form">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Multi-factor authentication required">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
            placeholder="Detailed requirement description..."></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Standard Reference</mat-label>
            <input matInput formControlName="standardReference"
              placeholder="e.g., NIST SP800-53 AC-2">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Evidence Type</mat-label>
            <mat-select formControlName="evidenceType">
              @for (opt of evidenceOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              @for (opt of priorityOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </form>

      <mat-action-row>
        <button mat-button color="warn" (click)="remove.emit(requirement.id)">
          <mat-icon>delete</mat-icon> Remove
        </button>
      </mat-action-row>
    </mat-expansion-panel>
  `,
  styles: [`
    .req-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequirementEditorComponent {
  private readonly fb = inject(FormBuilder);

  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly evidenceOptions = EVIDENCE_OPTIONS;
  expanded = false;

  @Input() requirement!: RfpRequirement;
  @Output() updated = new EventEmitter<RfpRequirement>();
  @Output() remove = new EventEmitter<string>();

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    standardReference: [''],
    evidenceType: ['document' as EvidenceType],
    priority: [200],
  });

  ngOnInit(): void {
    this.form.patchValue({
      title: this.requirement.title,
      description: this.requirement.description || '',
      standardReference: this.requirement.standardReference || '',
      evidenceType: this.requirement.evidenceType,
      priority: this.requirement.priority,
    }, { emitEvent: false });

    this.form.valueChanges.subscribe(v => {
      this.updated.emit({
        ...this.requirement,
        title: v.title || '',
        description: v.description || undefined,
        standardReference: v.standardReference || undefined,
        evidenceType: v.evidenceType || 'document',
        priority: v.priority || 200,
      });
    });
  }

  priorityLabel(priority: number): string {
    return PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? 'Normal';
  }
}
