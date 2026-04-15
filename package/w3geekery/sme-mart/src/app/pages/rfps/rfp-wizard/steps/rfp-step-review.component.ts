import {
  Component, Input, Output, EventEmitter, inject,
  ChangeDetectionStrategy, computed,
} from '@angular/core';
import { TitleCasePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import { DynamicFormRendererComponent } from '../../../../shared/components/form-builder/dynamic-form-renderer.component';
import type { RfpData, EngagementDocument } from '../../../../core/models';
import type { FormBuilderConfig } from '../../../../core/models/form-builder.model';

@Component({
  selector: 'app-rfp-step-review',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDividerModule, MatChipsModule, TitleCasePipe, DecimalPipe, DynamicFormRendererComponent],
  template: `
    <div class="step-content">
      <h3>Review & Publish</h3>

      @if (rfpData) {
        <!-- Basics -->
        <section class="review-section">
          <h4>Basics</h4>
          <div class="review-field">
            <span class="label">Title</span>
            <span class="value">{{ rfpData.title }}</span>
          </div>
          <div class="review-field">
            <span class="label">Category</span>
            <span class="value">{{ rfpData.category }}</span>
          </div>
          <div class="review-field">
            <span class="label">RFP Tag</span>
            <span class="value tag-value">sme-mart.rfp.{{ rfpData.rfpTagIdentifier }}</span>
          </div>
          @if (rfpData.description) {
            <div class="review-field">
              <span class="label">Description</span>
              <span class="value">{{ rfpData.description }}</span>
            </div>
          }
          @if (rfpData.budgetType) {
            <div class="review-field">
              <span class="label">Budget</span>
              <span class="value">
                {{ rfpData.budgetType | titlecase }}
                @if (rfpData.budgetMin || rfpData.budgetMax) {
                  — \${{ rfpData.budgetMin | number:'1.0-0' }} – \${{ rfpData.budgetMax | number:'1.0-0' }}
                }
              </span>
            </div>
          }
        </section>

        <mat-divider />

        <!-- Submission Form -->
        @if (parsedFormConfig(); as formConfig) {
          <section class="review-section">
            <h4>Submission Form Preview</h4>
            <p class="section-description">Vendors will see this form when submitting bids</p>
            <app-dynamic-form-renderer
              [config]="formConfig"
              mode="preview"
              [submission]="{ submissionData: {} }"
            ></app-dynamic-form-renderer>
          </section>
          <mat-divider />
        }

        <!-- Documents -->
        <section class="review-section">
          <h4>Documents ({{ documents.length }})</h4>
          @for (doc of documents; track doc.id) {
            <div class="review-field">
              <mat-icon class="doc-icon">description</mat-icon>
              <span class="value">{{ doc.display_name || doc.filename }}</span>
              <span class="doc-type">{{ doc.document_type }}</span>
            </div>
          } @empty {
            <p class="empty-hint">No documents uploaded</p>
          }
        </section>

        <mat-divider />

        <!-- Requirements -->
        <section class="review-section">
          <h4>Requirements ({{ totalRequirements }} across {{ rfpData.taskGroups.length }} groups)</h4>
          @for (group of rfpData.taskGroups; track group.taskType) {
            <div class="group-summary">
              <div class="group-header-row">
                <mat-icon class="group-icon">folder</mat-icon>
                <strong>{{ group.displayName }}</strong>
                <span class="req-count">{{ group.requirements.length }} requirements</span>
              </div>
              @for (req of group.requirements; track req.id) {
                <div class="req-row">
                  <mat-chip-set>
                    <mat-chip [class]="'priority-' + req.priority" disabled>
                      {{ priorityLabel(req.priority) }}
                    </mat-chip>
                  </mat-chip-set>
                  <span class="req-title">{{ req.title || '(untitled)' }}</span>
                  @if (req.standardReference) {
                    <span class="req-ref">{{ req.standardReference }}</span>
                  }
                </div>
              }
            </div>
          } @empty {
            <p class="empty-hint">No requirements defined</p>
          }
        </section>

        <mat-divider />

        <!-- Terms -->
        <section class="review-section">
          <h4>Terms</h4>
          @if (rfpData.responseDeadline) {
            <div class="review-field">
              <span class="label">Response Deadline</span>
              <span class="value">{{ rfpData.responseDeadline }}</span>
            </div>
          }
          @if (rfpData.questionsDeadline) {
            <div class="review-field">
              <span class="label">Questions Deadline</span>
              <span class="value">{{ rfpData.questionsDeadline }}</span>
            </div>
          }
          @if (rfpData.confidentialityRequirements) {
            <div class="review-field">
              <span class="label">Confidentiality</span>
              <span class="value">{{ rfpData.confidentialityRequirements }}</span>
            </div>
          }

          @if (rfpData.evaluationCriteria.length > 0) {
            <div class="criteria-review">
              <span class="label">Evaluation Criteria</span>
              @for (c of rfpData.evaluationCriteria; track c.name) {
                <div class="criterion-row">
                  <span class="criterion-name">{{ c.name }}</span>
                  <span class="criterion-weight">{{ c.weight }}%</span>
                </div>
              }
            </div>
          }

          @if (!rfpData.responseDeadline && !rfpData.questionsDeadline && rfpData.evaluationCriteria.length === 0) {
            <p class="empty-hint">No terms specified</p>
          }
        </section>
      }

      <div class="step-actions">
        <button mat-button matStepperPrevious>Back</button>
        <button mat-stroked-button [disabled]="wizard.saving()" (click)="saveDraft.emit()">
          Save as Draft
        </button>
        <button mat-flat-button color="primary" [disabled]="wizard.saving()" (click)="publish.emit()">
          Publish RFP
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-content { max-width: 720px; }
    .review-section { padding: 16px 0; }
    h4 { margin: 0 0 12px; font-weight: 500; }
    .section-description { color: var(--mat-sys-on-surface-variant, #666); font-size: 13px; margin: 0 0 12px; }
    .review-field {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 14px;
    }
    .label {
      font-weight: 500;
      min-width: 140px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .value { flex: 1; }
    .doc-icon { font-size: 18px; width: 18px; height: 18px; color: var(--mat-sys-on-surface-variant, #999); }
    .doc-type { font-size: 12px; color: var(--mat-sys-on-surface-variant, #999); }
    .tag-value { font-family: monospace; font-size: 13px; color: var(--mat-sys-primary, #1976d2); }
    .empty-hint { color: var(--mat-sys-on-surface-variant, #999); font-style: italic; font-size: 13px; }

    /* Requirements tree */
    .group-summary { margin-bottom: 12px; }
    .group-header-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .group-icon { font-size: 20px; width: 20px; height: 20px; color: var(--mat-sys-primary, #1976d2); }
    .req-count { color: var(--mat-sys-on-surface-variant, #999); font-size: 13px; }
    .req-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0 4px 28px;
      font-size: 13px;
    }
    .req-title { flex: 1; }
    .req-ref { color: var(--mat-sys-on-surface-variant, #999); font-size: 12px; font-family: monospace; }

    /* Criteria */
    .criteria-review { margin-top: 8px; }
    .criterion-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0 4px 16px;
      font-size: 13px;
    }
    .criterion-weight { font-weight: 500; }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      gap: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpStepReview {
  readonly wizard = inject(RfpWizardService);

  @Input() rfpData: RfpData | undefined;
  @Input() documents: EngagementDocument[] = [];
  @Output() publish = new EventEmitter<void>();
  @Output() saveDraft = new EventEmitter<void>();

  readonly parsedFormConfig = computed(() => {
    if (!this.rfpData?.formConfig) return null;
    try {
      // formConfig is already a FormBuilderConfig object
      return this.rfpData.formConfig as FormBuilderConfig;
    } catch {
      return null;
    }
  });

  get totalRequirements(): number {
    return this.rfpData?.taskGroups.reduce((sum, g) => sum + g.requirements.length, 0) ?? 0;
  }

  priorityLabel(priority: number): string {
    switch (priority) {
      case 1000: return 'Critical';
      case 500: return 'High';
      case 200: return 'Normal';
      case 100: return 'Low';
      default: return 'Normal';
    }
  }
}
