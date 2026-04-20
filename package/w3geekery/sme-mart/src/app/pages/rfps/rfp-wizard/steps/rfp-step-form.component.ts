import {
  Component, Input, Output, EventEmitter, inject, signal, computed,
  ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import { FormSubmissionService } from '../../../../core/services/form-submission.service';
import { FormBuilderComponent } from '../../../../shared/components/form-builder/form-builder.component';
import { DynamicFormRendererComponent } from '../../../../shared/components/form-builder/dynamic-form-renderer.component';
import type { SmeMartProject } from '../../../../core/models';
import type { FormBuilderConfig } from '../../../../core/models/form-builder.model';

/**
 * RfpStepFormComponent — Plan 16 Task 1
 *
 * Wizard step for buyer to define submission form.
 * - Toggle to enable/disable form definition
 * - FormBuilderComponent for field definition with draft persistence
 * - Preview tab showing DynamicFormRenderer in preview mode
 * - Form lock gate: disables editing when submissions exist
 *
 * Inputs:
 * - projectId: SmeMartProject ID for form lock gate check
 *
 * Outputs:
 * - formConfigSaved: emitted when form config is saved
 *
 * Signals:
 * - formEnabled: toggle for form builder visibility
 * - formConfig: current form configuration
 * - isFormLocked: true if submissions exist (form is locked)
 */
@Component({
  selector: 'app-rfp-step-form',
  standalone: true,
  imports: [
    MatTabsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    FormBuilderComponent,
    DynamicFormRendererComponent,
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <div>
          <h3>Submission Form (Optional)</h3>
          <p class="step-description">
            Define a structured form for vendors to complete when submitting bids
          </p>
        </div>
      </div>

      <div class="form-toggle">
        <mat-checkbox
          [checked]="formEnabled()"
          (change)="formEnabled.set($event.checked)"
        >
          Enable Submission Form for this RFP
        </mat-checkbox>
      </div>

      @if (formEnabled()) {
        <mat-tab-group class="form-tabs">
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>edit</mat-icon>
              <span>Define Fields</span>
            </ng-template>

            @if (isFormLocked()) {
              <div class="lock-banner">
                <mat-icon>lock</mat-icon>
                <span>Form is locked. Vendors have already submitted responses. You cannot edit the form definition.</span>
              </div>
            }

            @if (formConfig()) {
              <app-form-builder
                [formConfig]="formConfig()!"
                [isLocked]="isFormLocked()"
                (formConfigChange)="onFormConfigChange($event)"
              ></app-form-builder>
            } @else {
              <div class="empty-builder">
                <mat-icon>note_add</mat-icon>
                <p>No fields yet. Click "Add Field" below to get started.</p>
              </div>
            }
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>visibility</mat-icon>
              <span>Preview</span>
            </ng-template>

            <div class="preview-content">
              @if (formConfig()) {
                <p class="preview-description">
                  This is how the form will appear to vendors when they submit bids:
                </p>
                <app-dynamic-form-renderer
                  [config]="formConfig()!"
                  mode="preview"
                  [submission]="{ submissionData: {} }"
                ></app-dynamic-form-renderer>
              } @else {
                <div class="empty-preview">
                  <mat-icon>description</mat-icon>
                  <p>No form defined yet. Add fields in the "Define Fields" tab to see a preview.</p>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }

      <div class="step-actions">
        <button mat-button matStepperPrevious>Back</button>
        <button mat-flat-button matStepperNext>Next</button>
      </div>
    </div>
  `,
  styles: [`
    .step-content {
      max-width: 960px;
    }

    .step-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .step-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .step-description {
      color: var(--mat-sys-on-surface-variant, #666);
      margin: 4px 0 0;
      font-size: 14px;
    }

    .form-toggle {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--mat-sys-surface-dim, #f5f5f5);
      border-radius: 8px;
    }

    .form-tabs {
      margin: 24px 0;
    }

    .lock-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      color: #856404;
      font-size: 14px;
    }

    .lock-banner mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .preview-content {
      padding: 24px 0;
    }

    .preview-description {
      color: var(--mat-sys-on-surface-variant, #666);
      margin-bottom: 16px;
      font-size: 14px;
    }

    .empty-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--mat-sys-on-surface-variant, #999);
      text-align: center;
    }

    .empty-preview mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.4;
      margin-bottom: 12px;
    }

    .empty-builder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--mat-sys-on-surface-variant, #999);
      text-align: center;
      padding: 24px;
    }

    .empty-builder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.4;
      margin-bottom: 12px;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      gap: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpStepFormComponent implements OnInit {
  private readonly wizard = inject(RfpWizardService);
  private readonly formSubmission = inject(FormSubmissionService);

  readonly formEnabled = signal(false);
  readonly formConfig = signal<FormBuilderConfig | null>(null);
  readonly isFormLocked = signal(false);

  async ngOnInit(): Promise<void> {
    // Load existing form config from wizard state
    const rfpData = this.wizard.rfpData();
    if (rfpData.formConfig) {
      try {
        // Config is already a FormBuilderConfig object (stored in memory, not JSON string)
        const config = rfpData.formConfig;
        this.formConfig.set(config);
        this.formEnabled.set(true);
      } catch (err) {
        console.error('[RfpStepForm] Failed to parse formConfig:', err);
        this.formConfig.set(this.getDefaultFormConfig());
      }
    } else {
      // Initialize with default config
      this.formConfig.set(this.getDefaultFormConfig());
    }

    // Check if form is locked (submissions exist)
    const draftId = this.wizard.draftId();
    if (draftId) {
      const isLocked = await this.formSubmission.getFormSubmissionLock(draftId as any);
      this.isFormLocked.set(isLocked);
    }
  }

  private getDefaultFormConfig(): FormBuilderConfig {
    return {
      version: 1,
      sections: [],
      fields: [],
    };
  }

  onFormConfigChange(config: FormBuilderConfig): void {
    this.formConfig.set(config);
    // Persist to wizard state immediately via rfpData update
    this.wizard.rfpData.update(d => ({ ...d, formConfig: config }));
  }
}
