import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ZbRemoteTableComponent, ZbSnakeToSpacesPipe } from '@zerobias-org/ngx-library';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { BoardExtended, TaskExtended } from '@zerobias-com/platform-sdk';
import { ProjectContextService } from '../../core/services/project-context.service';
import { BoardSwitcherComponent, type BoardSwitcherScope } from './board-switcher.component';

interface BreadcrumbItem {
  readonly label: string;
  readonly url: string | null;
}

/**
 * Board-detail page (`/boards/:boardId`, L-2). Header + breadcrumb (derived from the
 * board.projectId -> project -> project.parentId chain), read-only tasks list via
 * zb-remote-table (L-7/L-8), sibling board switcher (L-13), and a cog config-panel
 * SURFACE (mat-sidenav end-drawer; content deferred to Phase 33 per D-Q9).
 *
 * Admin "Open in ZB Platform" link is gated by ProjectContextService.isAdmin (L-9
 * intent; mechanism is the authoritative org-member admin flag, not getPrincipal()).
 * Party UUID (board.ownerId) is read through for Holon projection scoping (C-4).
 */
@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ZbRemoteTableComponent,
    ZbSnakeToSpacesPipe,
    BoardSwitcherComponent,
  ],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly projectContext = inject(ProjectContextService);

  readonly board = signal<BoardExtended | null>(null);
  readonly breadcrumb = signal<BreadcrumbItem[]>([]);
  readonly tasks = signal<TaskExtended[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly configPanelOpen = signal(false);
  /** C-4: party scoping for the future Holon projection (read-through only). */
  readonly partyUUID = signal<string | null>(null);

  readonly isAdmin = this.projectContext.isAdmin;

  readonly currentBoardId = computed<string | null>(() => {
    const b = this.board();
    return b ? String(b.id) : null;
  });

  readonly boardScope = computed<BoardSwitcherScope | null>(() => {
    const b = this.board();
    return b?.projectId ? { type: 'project', id: String(b.projectId) } : null;
  });

  readonly displayColumns = ['priority', 'activities', 'name', 'status', 'assigned'];
  readonly columnLabels: Record<string, string> = {
    priority: 'Priority',
    activities: 'Activity',
    name: 'Name',
    status: 'Status',
    assigned: 'Assigned',
  };

  async ngOnInit(): Promise<void> {
    const boardId = this.route.snapshot.params['boardId'] as string | undefined;
    if (!boardId) {
      this.error.set('No board specified.');
      this.loading.set(false);
      return;
    }
    try {
      const board = await this.clientApi.platformClient.getBoardApi().get(new UUID(boardId));
      this.board.set(board);
      this.partyUUID.set(board.ownerId ? String(board.ownerId) : null);
      await this.buildBreadcrumb(board);

      const tasksResult = await this.clientApi.platformClient
        .getBoardApi()
        .listTasks(new UUID(boardId), 1, 25);
      this.tasks.set(tasksResult?.items ?? []);
    } catch (err) {
      console.error('[BoardDetail] Failed to load board:', err);
      this.error.set('Failed to load board.');
    } finally {
      this.loading.set(false);
    }
  }

  onBoardSelected(newBoardId: string): void {
    this.router.navigate(['/boards', newBoardId]);
  }

  onTaskClick(task: TaskExtended): void {
    // Read-only in Foundation; task-detail navigation is wired in Phase 33.
    console.log('[BoardDetail] task clicked:', String(task.id));
  }

  openInZbPlatform(): void {
    const b = this.board();
    if (b) {
      window.open(`https://app.zerobias.com/app/boards/${String(b.id)}`, '_blank');
    }
  }

  toggleConfigPanel(): void {
    this.configPanelOpen.update((v) => !v);
  }

  goBack(): void {
    this.router.navigate(['/engagements']);
  }

  private async buildBreadcrumb(board: BoardExtended): Promise<void> {
    const items: BreadcrumbItem[] = [];
    if (board.projectId) {
      const project = await this.clientApi.platformClient
        .getProjectApi()
        .get(new UUID(String(board.projectId)));
      if (project.parentId) {
        try {
          const engagement = await this.clientApi.platformClient
            .getProjectApi()
            .get(new UUID(String(project.parentId)));
          items.push({ label: engagement.name, url: `/engagements/${String(engagement.id)}` });
        } catch (err) {
          console.warn('[BoardDetail] parent engagement fetch failed:', err);
        }
      }
      items.push({ label: project.name, url: null });
    }
    items.push({ label: board.name, url: null });
    this.breadcrumb.set(items);
  }
}
