import {
  Component, Input, Output, EventEmitter, inject, OnInit, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import type { RfpData, EvaluationCriterion } from '../../../../core/models';

@Component({
  selector: 'app-rfp-step-terms',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
  ],
  template: `
    <div class="step-content">
      <h3>Terms & Conditions</h3>
      <p class="step-description">
        Define response deadlines, evaluation criteria, and confidentiality requirements.
      </p>

      <form [formGroup]="form" class="terms-form">
        <div class="date-row">
          <mat-form-field appearance="outline">
            <mat-label>Response Deadline</mat-label>
            <input matInput type="date" formControlName="responseDeadline">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Questions Deadline</mat-label>
            <input matInput type="date" formControlName="questionsDeadline">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Confidentiality Requirements</mat-label>
          <textarea matInput formControlName="confidentialityRequirements"
            rows="3"
            placeholder="NDA requirements, data handling expectations...">
          </textarea>
        </mat-form-field>

        <!-- Evaluation Criteria -->
        <div class="criteria-section">
          <div class="criteria-header">
            <h4>Evaluation Criteria</h4>
            <button mat-stroked-button type="button" (click)="addCriterion()">
              <mat-icon>add</mat-icon> Add Criterion
            </button>
          </div>

          @if (criteriaWeightTotal() !== 100 && criteriaArray.length > 0) {
            <p class="weight-warning">
              Weights total {{ criteriaWeightTotal() }}% — should sum to 100%
            </p>
          }

          <div formArrayName="criteria" class="criteria-list">
            @for (ctrl of criteriaArray.controls; track $index; let i = $index) {
              <div class="criterion-row" [formGroupName]="i">
                <mat-form-field appearance="outline" class="criterion-name">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g., Technical Approach">
                </mat-form-field>
                <mat-form-field appearance="outline" class="criterion-weight">
                  <mat-label>Weight %</mat-label>
                  <input matInput type="number" formControlName="weight" min="0" max="100">
                </mat-form-field>
                <mat-form-field appearance="outline" class="criterion-desc">
                  <mat-label>Description</mat-label>
                  <input matInput formControlName="description">
                </mat-form-field>
                <button mat-icon-button color="warn" type="button" (click)="removeCriterion(i)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>

          @if (criteriaArray.length === 0) {
            <p class="hint">No evaluation criteria defined. Vendors won't know how bids are scored.</p>
          }
        </div>
      </form>

      <div class="step-actions">
        <button mat-button matStepperPrevious>Back</button>
        <button mat-flat-button (click)="save()">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .step-content { max-width: 720px; }
    .step-description { color: var(--mat-sys-on-surface-variant, #666); margin-bottom: 16px; }
    .terms-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .date-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .criteria-section { margin-top: 8px; }
    .criteria-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .criteria-header h4 { margin: 0; font-weight: 500; }
    .weight-warning {
      color: var(--mat-sys-error, #d32f2f);
      font-size: 13px;
      margin: 0 0 8px;
    }
    .criterion-row {
      display: grid;
      grid-template-columns: 1fr 80px 1fr 40px;
      gap: 8px;
      align-items: start;
    }
    .hint { color: var(--mat-sys-on-surface-variant, #999); font-style: italic; font-size: 13px; }
    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      gap: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpStepTerms implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly wizard = inject(RfpWizardService);

  @Input() set rfpData(data: RfpData | undefined) {
    if (data) {
      this.form.patchValue({
        responseDeadline: data.responseDeadline || '',
        questionsDeadline: data.questionsDeadline || '',
        confidentialityRequirements: data.confidentialityRequirements || '',
      }, { emitEvent: false });

      // Rebuild criteria FormArray
      this.criteriaArray.clear({ emitEvent: false });
      for (const c of data.evaluationCriteria || []) {
        this.criteriaArray.push(this.buildCriterionGroup(c), { emitEvent: false });
      }
    }
  }

  @Output() next = new EventEmitter<void>();

  readonly form = this.fb.group({
    responseDeadline: [''],
    questionsDeadline: [''],
    confidentialityRequirements: [''],
    criteria: this.fb.array<FormGroup>([]),
  });

  readonly criteriaWeightTotal = signal(0);

  get criteriaArray(): FormArray<FormGroup> {
    return this.form.get('criteria') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.syncToWizard());
  }

  addCriterion(): void {
    this.criteriaArray.push(this.buildCriterionGroup({ name: '', weight: 0 }));
  }

  removeCriterion(index: number): void {
    this.criteriaArray.removeAt(index);
  }

  save(): void {
    this.syncToWizard();
    this.next.emit();
  }

  private buildCriterionGroup(c: Partial<EvaluationCriterion>): FormGroup {
    return this.fb.group({
      name: [c.name || '', Validators.required],
      weight: [c.weight ?? 0],
      description: [c.description || ''],
    });
  }

  private syncToWizard(): void {
    const v = this.form.getRawValue();
    const criteria: EvaluationCriterion[] = v.criteria.map((c: any) => ({
      name: c.name,
      weight: Number(c.weight) || 0,
      description: c.description || undefined,
    }));
    this.criteriaWeightTotal.set(criteria.reduce((s, c) => s + c.weight, 0));
    this.wizard.updateTerms({
      responseDeadline: v.responseDeadline || undefined,
      questionsDeadline: v.questionsDeadline || undefined,
      evaluationCriteria: criteria,
      confidentialityRequirements: v.confidentialityRequirements || undefined,
    });
  }
}
