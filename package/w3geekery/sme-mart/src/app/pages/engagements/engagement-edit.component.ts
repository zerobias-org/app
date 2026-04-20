import { Component, inject, signal, ChangeDetectionStrategy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EngagementForm, type EngagementFormValues } from '../../shared/components/engagement-form/engagement-form.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { SmeMartProject } from '../../core/models';

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
  private readonly projects = inject(SmeMartProjectService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(EngagementForm) formComponent!: EngagementForm;

  readonly engagement = signal<SmeMartProject | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly authorized = signal(true);
  private currentValues: EngagementFormValues | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    try {
      const project = await this.projects.getProject(id);
      if (!project) {
        this.snackBar.open('RFP not found', 'OK', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }

      // Authorization: must be draft or published
      if (project.status !== 'draft' && project.status !== 'published') {
        this.authorized.set(false);
        this.loading.set(false);
        return;
      }

      this.engagement.set(project);
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

    const project = this.engagement();
    if (!project) return;

    this.saving.set(true);
    try {
      await this.projects.updateProject(project.id, {
        name: this.currentValues.title,
        description: this.currentValues.description || undefined,
        category: this.currentValues.category,
        budgetType: (this.currentValues.budget_type || undefined) as SmeMartProject['budgetType'],
        budgetMin: this.currentValues.budget_min ? Number(this.currentValues.budget_min) : undefined,
        budgetMax: this.currentValues.budget_max ? Number(this.currentValues.budget_max) : undefined,
        timeline: this.currentValues.timeline || undefined,
      });
      this.snackBar.open('Changes saved', 'OK', { duration: 3000 });
      this.router.navigate(['/rfps', project.id]);
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    const eng = this.engagement();
    this.router.navigate(eng ? ['/rfps', eng.id] : ['/rfps']);
  }
}
