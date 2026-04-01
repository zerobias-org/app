import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ProjectContextService } from '../../core/services/project-context.service';
import { ImpersonationService } from '../../core/services/impersonation.service';

interface TabDef {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

interface TabGroup {
  readonly heading: string;
  readonly tabs: readonly TabDef[];
}

/** Primary tabs — always visible in the top bar */
const PRIMARY_TABS: readonly TabDef[] = [
  { path: 'overview', label: 'Overview', icon: 'dashboard' },
  { path: 'boards', label: 'Boards', icon: 'view_kanban' },
  { path: 'notes', label: 'Notes', icon: 'sticky_note_2' },
  { path: 'documents', label: 'Documents', icon: 'folder_open' },
];

/** Grouped tabs — live in the "More" dropdown */
const MORE_TAB_GROUPS: readonly TabGroup[] = [
  {
    heading: 'Work',
    tabs: [
      { path: 'prd', label: 'PRD', icon: 'description' },
      { path: 'plan', label: 'Plan', icon: 'timeline' },
    ],
  },
  {
    heading: 'Tracking',
    tabs: [
      { path: 'timeline', label: 'Timeline', icon: 'history' },
      { path: 'dashboard', label: 'Dashboard', icon: 'widgets' },
      { path: 'financials', label: 'Financials', icon: 'payments' },
    ],
  },
  {
    heading: 'Collaboration',
    tabs: [
      { path: 'messages', label: 'Messages', icon: 'forum' },
    ],
  },
  {
    heading: 'Governance',
    tabs: [
      { path: 'parties', label: 'Parties', icon: 'group' },
      { path: 'compliance', label: 'Compliance', icon: 'verified_user' },
      { path: 'reviews', label: 'Reviews', icon: 'rate_review' },
    ],
  },
];

/** All tabs flat (for checking active state in More button) */
const ALL_MORE_TABS: readonly TabDef[] = MORE_TAB_GROUPS.flatMap(g => g.tabs);

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    TitleCasePipe,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly impersonation = inject(ImpersonationService);
  private readonly projectService = inject(SmeMartProjectService);
  readonly ctx = inject(ProjectContextService);

  private refreshSub?: Subscription;

  readonly loading = signal(true);
  readonly primaryTabs = PRIMARY_TABS;
  readonly moreTabGroups = MORE_TAB_GROUPS;

  /** Check if the currently active route is inside the "More" dropdown */
  isMoreActive(): boolean {
    const currentPath = this.route.firstChild?.snapshot.url[0]?.path;
    return ALL_MORE_TABS.some(t => t.path === currentPath);
  }

  /** Get the label of the active "More" tab (for the button text) */
  activeMoreLabel(): string | null {
    const currentPath = this.route.firstChild?.snapshot.url[0]?.path;
    const match = ALL_MORE_TABS.find(t => t.path === currentPath);
    return match?.label ?? null;
  }

  async ngOnInit(): Promise<void> {
    this.refreshSub = this.ctx.refresh$.subscribe(() => this.refresh());

    const projId = this.route.snapshot.params['projId'];
    try {
      const project = await this.projectService.getProject(projId);

      if (!project) {
        this.snackBar.open('Project not found', 'OK', { duration: 3000 });
        this.router.navigate(['/my/engagements']);
        return;
      }

      this.ctx.setProject(project);

      const userId = this.impersonation.effectiveUserId();
      this.ctx.setCurrentUserId(userId || null);

      // TODO: Load engagement name from project's engagementId for breadcrumb
      // TODO: Check boundary membership for access control (Plan 022 access guard)
    } catch (err: any) {
      this.snackBar.open(`Failed to load project: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.ctx.clear();
  }

  goToEngagement(): void {
    const engId = this.ctx.engagementId();
    if (engId) {
      this.router.navigate(['/engagements', engId]);
    } else {
      this.router.navigate(['/my/engagements']);
    }
  }

  private async refresh(): Promise<void> {
    const projId = this.route.snapshot.params['projId'];
    const project = await this.projectService.getProject(projId);
    if (project) this.ctx.setProject(project);
  }
}
