import { Component, inject, signal, ChangeDetectionStrategy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EngagementForm, type EngagementFormValues } from '../../shared/components/engagement-form/engagement-form.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { EngagementDetailRow, WorkRequest } from '../../core/models';

@Component({
  selector: 'app-engagement-edit',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule, EngagementForm],
  templateUrl: './engagement-edit.component.html',
  styleUrl: './engagement-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementEdit implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(EngagementForm) formComponent!: EngagementForm;

  readonly engagement = signal<EngagementDetailRow | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly authorized = signal(true);
  private currentValues: EngagementFormValues | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    try {
      const eng = await this.workRequests.getEngagement(id);
      if (!eng) {
        this.snackBar.open('Engagement not found', 'OK', { duration: 3000 });
        this.router.navigate(['/engagements']);
        return;
      }

      // Authorization: must be draft or open
      if (eng.status !== 'draft' && eng.status !== 'open') {
        this.authorized.set(false);
        this.loading.set(false);
        return;
      }

      // Authorization: must be buyer
      if (eng.buyer_zerobias_user_id !== this.impersonation.effectiveUserId()) {
        this.authorized.set(false);
        this.loading.set(false);
        return;
      }

      this.engagement.set(eng);
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  onValuesChange(values: EngagementFormValues): void {
    this.currentValues = values;
  }

  async save(): Promise<void> {
    if (!this.formComponent.isValid()) {
      this.snackBar.open('Please fill in required fields', 'OK', { duration: 3000 });
      return;
    }
    if (!this.currentValues) return;

    const eng = this.engagement();
    if (!eng) return;

    this.saving.set(true);
    try {
      await this.workRequests.updateRfp(eng.id, {
        title: this.currentValues.title,
        description: this.currentValues.description || null,
        category: this.currentValues.category,
        budget_type: this.currentValues.budget_type,
        budget_min: this.currentValues.budget_min,
        budget_max: this.currentValues.budget_max,
        timeline: this.currentValues.timeline,
      } as Partial<WorkRequest>);
      this.snackBar.open('Changes saved', 'OK', { duration: 3000 });
      this.router.navigate(['/engagements', eng.id]);
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    const eng = this.engagement();
    this.router.navigate(eng ? ['/engagements', eng.id] : ['/engagements']);
  }
}
