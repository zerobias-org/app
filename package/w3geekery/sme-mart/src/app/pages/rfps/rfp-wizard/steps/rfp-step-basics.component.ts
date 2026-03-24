import {
  Component, Input, Output, EventEmitter, ViewChild, inject, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EngagementForm, type EngagementFormValues } from '../../../../shared/components/engagement-form/engagement-form.component';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import { SmeMartTagService } from '../../../../core/services/sme-mart-tag.service';
import type { RfpData, WorkRequest } from '../../../../core/models';

@Component({
  selector: 'app-rfp-step-basics',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatTooltipModule, EngagementForm,
  ],
  template: `
    <div class="step-content">
      <app-engagement-form
        [initialValues]="initialWorkRequest"
        (valuesChange)="onFormChange($event)">
      </app-engagement-form>

      <!-- RFP Tag Identifier -->
      <div class="tag-field">
        <mat-form-field appearance="outline" class="tag-input">
          <mat-label>RFP Tag</mat-label>
          <span matTextPrefix class="tag-prefix">sme-mart.rfp.</span>
          <input matInput
            [ngModel]="tagIdentifier()"
            (ngModelChange)="onTagChange($event)"
            pattern="[a-z0-9]+(\\-[a-z0-9]+)*"
            placeholder="word-word">
          <mat-hint>Used to identify this RFP across the platform. Becomes the engagement tag if a bid is accepted.</mat-hint>
        </mat-form-field>
        <button mat-icon-button
          matTooltip="Generate new suggestion"
          (click)="regenerateTag()">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <div class="step-actions">
        <button mat-flat-button
          [disabled]="!formValid || wizard.saving()"
          (click)="save()">
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-content { max-width: 640px; }
    .tag-field {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      margin-top: 8px;
    }
    .tag-input { flex: 1; }
    .tag-prefix {
      color: var(--mat-sys-on-surface-variant, #666);
      font-family: monospace;
      font-size: 14px;
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
export class RfpStepBasics {
  readonly wizard = inject(RfpWizardService);
  private readonly tagService = inject(SmeMartTagService);

  @Input() set initialData(data: RfpData | undefined) {
    if (data) {
      if (data.rfpTagIdentifier) {
        this.tagIdentifier.set(data.rfpTagIdentifier);
      }
      if (data.title) {
        this.initialWorkRequest = {
          title: data.title,
          description: data.description,
          category: data.category,
          budget_type: data.budgetType,
          budget_min: data.budgetMin?.toString() ?? null,
          budget_max: data.budgetMax?.toString() ?? null,
          timeline: data.timeline ?? null,
        } as Partial<WorkRequest>;
      }
    }
  }

  @Output() saved = new EventEmitter<void>();

  @ViewChild(EngagementForm) formComponent!: EngagementForm;

  initialWorkRequest: Partial<WorkRequest> | undefined;
  formValid = false;
  readonly tagIdentifier = signal('');

  private currentValues: EngagementFormValues | null = null;

  ngOnInit(): void {
    // Set initial tag from wizard state
    const current = this.wizard.rfpData().rfpTagIdentifier;
    if (current) {
      this.tagIdentifier.set(current);
    }
  }

  onFormChange(values: EngagementFormValues): void {
    this.currentValues = values;
    this.formValid = !!values.title && !!values.category;
  }

  onTagChange(value: string): void {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.tagIdentifier.set(sanitized);
    this.wizard.updateTagIdentifier(sanitized);
  }

  regenerateTag(): void {
    const id = this.tagService.generateIdentifier();
    this.tagIdentifier.set(id);
    this.wizard.updateTagIdentifier(id);
  }

  async save(): Promise<void> {
    if (!this.currentValues) return;
    await this.wizard.saveBasics(this.currentValues);
    this.saved.emit();
  }
}
