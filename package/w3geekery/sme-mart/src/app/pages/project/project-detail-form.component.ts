import { Component, input, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import { DynamicFormRendererComponent } from '../../shared/components/form-builder/dynamic-form-renderer.component';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

/**
 * Embedded component for project detail's Submission Form tab.
 * Handles vendor form submission with role-aware mode (fill vs review).
 */
@Component({
  selector: 'app-project-detail-form',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DynamicFormRendererComponent],
  template: `
    @if (formConfig()) {
      <app-dynamic-form-renderer
        [config]="formConfig()!"
        [mode]="isVendor() ? 'fill' : 'review'"
        [submission]="currentSubmission() || { submissionData: {} }"
        (submit)="onFormSubmit($event)"
        (draftSave)="onDraftSave($event)"
      ></app-dynamic-form-renderer>
    } @else {
      <p class="no-form">No submission form configured for this project.</p>
    }
  `,
  styles: [`
    .no-form {
      color: var(--mat-sys-on-surface-variant, #999);
      padding: 24px;
      text-align: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailFormComponent {
  private readonly formSubmission = inject(FormSubmissionService);

  readonly project = input.required<SmeMartProject>();
  readonly currentUserId = input<string | null>(null);
  readonly isVendor = input(false); // True if user is vendor (different org from project owner)

  readonly formConfig = computed(() => {
    const proj = this.project();
    if (!proj.formConfig) return null;
    try {
      return typeof proj.formConfig === 'string'
        ? JSON.parse(proj.formConfig)
        : proj.formConfig;
    } catch {
      return null;
    }
  });

  readonly currentSubmission = signal<FormSubmission | null>(null);

  async onFormSubmit(data: Record<string, unknown>): Promise<void> {
    // TODO: Implement form submission
    // 1. Create or update FormSubmission with status='submitted'
    // 2. Emit event to parent for snackbar feedback
  }

  async onDraftSave(data: Record<string, unknown>): Promise<void> {
    // TODO: Implement draft save
    // 1. Create or update FormSubmission with status='draft'
  }
}
