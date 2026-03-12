import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementContextService } from '../../core/services/engagement-context.service';
import { EngagementHierarchyService, type HierarchyBreadcrumb } from '../../core/services/engagement-hierarchy.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { HierarchyBreadcrumbsComponent } from '../../shared/components/hierarchy-breadcrumbs/hierarchy-breadcrumbs.component';

interface TabDef {
  readonly path: string;
  readonly label: string;
}

const TABS: readonly TabDef[] = [
  { path: 'overview', label: 'Overview' },
  { path: 'documents', label: 'Documents' },
  { path: 'details', label: 'Details' },
  { path: 'tasks', label: 'Tasks' },
  { path: 'timeline', label: 'Timeline' },
  { path: 'notes', label: 'Notes' },
] as const;

@Component({
  selector: 'app-engagement-detail',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    TitleCasePipe,
    HierarchyBreadcrumbsComponent,
  ],
  templateUrl: './engagement-detail.component.html',
  styleUrl: './engagement-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementDetail implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly hierarchy = inject(EngagementHierarchyService);
  readonly ctx = inject(EngagementContextService);

  private refreshSub?: Subscription;

  readonly loading = signal(true);
  readonly breadcrumbs = signal<HierarchyBreadcrumb[]>([]);
  readonly tabs = TABS;

  async ngOnInit(): Promise<void> {
    this.refreshSub = this.ctx.refresh$.subscribe(() => this.refresh());

    const id = this.route.snapshot.params['id'];
    try {
      const eng = await this.workRequests.getEngagement(id);

      if (!eng) {
        this.snackBar.open('Engagement not found', 'OK', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }

      // If this is actually an RFP (no tag), redirect to RFP route
      if (!eng.engagement_tag) {
        this.router.navigate(['/rfps', eng.id], { replaceUrl: true });
        return;
      }

      // Push data to shared context
      this.ctx.setEngagement(eng);

      const userId = this.impersonation.effectiveUserId();
      this.ctx.setCurrentUserId(userId || null);

      if (userId) {
        const provider = await this.providerProfiles.getProviderByUserId(userId);
        if (provider) {
          this.ctx.setCurrentProviderId(provider.id);
        }
      }

      // Build hierarchy breadcrumbs (non-blocking)
      this.loadBreadcrumbs(eng);
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.ctx.clear();
  }

  // ===========================================================================
  // Navigation
  // ===========================================================================

  goBack(): void {
    this.router.navigate(['/my/engagements']);
  }

  onBreadcrumbNavigate(crumb: HierarchyBreadcrumb): void {
    if (crumb.active) return;
    if (crumb.level === 'boundary' || crumb.level === 'project') {
      this.router.navigate(['/my/engagements']);
    }
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  private async loadBreadcrumbs(eng: { engagement_tag?: string | null; zerobias_tag_id?: string | null; zerobias_task_id?: string | null; title: string }): Promise<void> {
    try {
      const crumbs = await this.hierarchy.buildBreadcrumbs({
        engagementTag: eng.engagement_tag,
        zerobiasTagId: eng.zerobias_tag_id,
        zerobiasTaskId: eng.zerobias_task_id,
        title: eng.title,
      });
      this.breadcrumbs.set(crumbs);
    } catch (err) {
      console.warn('[EngagementDetail] Failed to load breadcrumbs:', err);
    }
  }

  private async refresh(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    const eng = await this.workRequests.getEngagement(id);
    if (eng) this.ctx.setEngagement(eng);
  }
}
