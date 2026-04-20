import { Component, inject, signal, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EngagementForm, type EngagementFormValues } from '../../shared/components/engagement-form/engagement-form.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ImpersonationService } from '../../core/services/impersonation.service';

@Component({
  selector: 'app-engagement-new',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule, EngagementForm],
  templateUrl: './engagement-new.component.html',
  styleUrl: './engagement-new.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementNew {
  private readonly router = inject(Router);
  private readonly impersonation = inject(ImpersonationService);
  private readonly projects = inject(SmeMartProjectService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(EngagementForm) formComponent!: EngagementForm;

  readonly saving = signal(false);
  private currentValues: EngagementFormValues | null = null;

  onValuesChange(values: EngagementFormValues): void {
    this.currentValues = values;
  }

  async save(asDraft: boolean): Promise<void> {
    if (!this.formComponent.isValid()) {
      this.snackBar.open('Please fill in required fields (Title, Category)', 'OK', { duration: 3000 });
      return;
    }
    if (!this.currentValues) return;

    this.saving.set(true);
    try {
      const project = await this.projects.createAsRfp({
        name: this.currentValues.title,
        description: this.currentValues.description || undefined,
        category: this.currentValues.category,
        budgetType: this.currentValues.budget_type || undefined,
        budgetMin: this.currentValues.budget_min ? Number(this.currentValues.budget_min) : undefined,
        budgetMax: this.currentValues.budget_max ? Number(this.currentValues.budget_max) : undefined,
        timeline: this.currentValues.timeline || undefined,
      });
      if (!asDraft) {
        await this.projects.publishRfp(project.id);
      }
      this.snackBar.open(asDraft ? 'Draft saved' : 'RFP posted', 'OK', { duration: 3000 });
      this.router.navigate(['/rfps', project.id]);
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/engagements']);
  }
}
