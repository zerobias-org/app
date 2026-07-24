import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { Subscription } from 'rxjs';
import { EngagementsService } from '../../core/services/engagements.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementContextService } from '../../core/services/engagement-context.service';
import { EngagementHierarchyService, type HierarchyBreadcrumb } from '../../core/services/engagement-hierarchy.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { HierarchyBreadcrumbsComponent } from '../../shared/components/hierarchy-breadcrumbs/hierarchy-breadcrumbs.component';
import { PageBreadcrumbComponent, type PageBreadcrumbItem } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';

interface TabDef {
  readonly path: string;
  readonly label: string;
}

const TABS: readonly TabDef[] = [
  { path: 'overview', label: 'Overview' },
  { path: 'projects', label: 'Projects' },
  { path: 'documents', label: 'Documents' },
  { path: 'boards', label: 'Boards' },
  { path: 'vetting', label: 'Vetting' },
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
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    HierarchyBreadcrumbsComponent,
    PageBreadcrumbComponent,
    ZbResourceStatusComponent,
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
  private readonly engagements = inject(EngagementsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly hierarchy = inject(EngagementHierarchyService);
  readonly ctx = inject(EngagementContextService);

  private refreshSub?: Subscription;

  readonly loading = signal(true);
  readonly breadcrumbs = signal<HierarchyBreadcrumb[]>([]);
  readonly tabs = TABS;

  /** Page-level breadcrumb: Engagements > <Current Engagement Name>. */
  readonly pageBreadcrumb = computed<PageBreadcrumbItem[]>(() => {
    const eng = this.ctx.engagement();
    return [
      { label: 'Engagements', link: '/engagements' },
      { label: eng?.title ?? 'Engagement' },
    ];
  });

  async ngOnInit(): Promise<void> {
    this.refreshSub = this.ctx.refresh$.subscribe(() => this.refresh());

    const id = this.route.snapshot.params['id'];
    try {
      const eng = await this.engagements.getEngagement(id);

      if (!eng) {
        this.snackBar.open('Engagement not found', 'OK', { duration: 3000 });
        this.router.navigate(['/engagements']);
        return;
      }

      // Note: the legacy "no engagement_tag -> /rfps" redirect was removed
      // 2026-05-14. The new platform.Project data path does not populate
      // engagement_tag on the transform; trust the route the user chose.

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

      // Non-blocking async loads
      this.loadBreadcrumbs(eng);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.snackBar.open(`Failed to load: ${msg}`, 'Dismiss', { duration: 5000 });
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

  onBreadcrumbNavigate(crumb: HierarchyBreadcrumb): void {
    if (crumb.active) return;
    if (crumb.level === 'boundary' || crumb.level === 'project') {
      this.router.navigate(['/engagements']);
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
    const eng = await this.engagements.getEngagement(id);
    if (eng) {
      this.ctx.setEngagement(eng);
    }
  }
}
