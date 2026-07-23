import { Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import {
  ZB_TABLE_MODE,
  ZbRemoteTableComponent,
  ZbRemoteTableContainerComponent,
  ZbRemoteTableHeaderComponent,
  ZbRemoteTableService,
  ZbSnakeToSpacesPipe,
  type ZbRemoteTableConfig,
} from '@zerobias-org/ngx-library';
import { SearchTaskBody, type TaskExtended } from '@zerobias-com/portal-sdk';

import { SessionService } from '../../core/session.service';
import { Drawer } from '../../shared/drawer/drawer';
import type { RemoteTableColumnOptions } from '../../shared/remote-table-column-options';
import { CreateTaskForm } from './create-task-form';

/**
 * Tasks — the fourth `zb-remote-table` read demo (twin of the React app's Tasks page). Same
 * two-call shape as the rest of the surface:
 *
 *   portalClient.getTaskApi().searchTasksOptions()          -> per-column sort/filter metadata
 *   portalClient.getTaskApi().search(body, page, size, sort) -> PagedResults<TaskExtended>
 *
 * Tasks are the leaves of the containment chain (project -> board -> activity -> task).
 *
 * Shape traps: the options endpoint keys columns `status` / `priority`, but `SearchTaskBody` wants
 * the PLURAL arrays `statuses` / `priorities` (carried by filterParams/arrayParams below). And
 * `priority` is a `TaskPriority` object (`.label`), not a string — its label matches the ngx
 * `.priority` chip value classes (Critical / High / Normal / Medium / Low).
 */
@Component({
  selector: 'app-tasks',
  imports: [
    NgClass,
    MatTableModule,
    ZbRemoteTableComponent,
    ZbRemoteTableHeaderComponent,
    ZbSnakeToSpacesPipe,
    Drawer,
    CreateTaskForm,
  ],
  providers: [ZbRemoteTableService],
  template: `
    <section class="intro">
      <div class="intro-head">
        <h1>Tasks</h1>
        <button type="button" class="btn-stroked" (click)="createOpen.set(true)">+ Create Task</button>
      </div>
      <p class="lead">
        <code>getTaskApi().searchTasksOptions()</code> drives the columns;
        <code>.search(body, page, size, sort)</code> fills them. Tasks are the leaves of the
        project -> board -> activity -> task chain. Click a row to drill into its detail.
      </p>
    </section>

    <app-drawer [open]="createOpen()" title="Create task" (close)="createOpen.set(false)">
      @if (createOpen()) {
        <app-create-task-form />
      }
    </app-drawer>

    <div class="table-container">
    <zb-remote-table
      [columns]="displayColumns"
      [columnLabels]="displayColumnLabels"
      [loading]="loading"
      [selectableRows]="false"
      [rowClickEnabled]="true"
      (rowClick)="openDetail($event)"
      searchPageKey="search"
    >
      <ng-container matColumnDef="code">
        <th mat-header-cell *matHeaderCellDef class="code-col">{{ displayColumnLabels['code'] }}</th>
        <td mat-cell *matCellDef="let t"><code>{{ t.code }}</code></td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="name">
            <span>{{ displayColumnLabels['name'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let t">{{ t.name }}</td>
      </ng-container>

      <ng-container matColumnDef="activity">
        <th mat-header-cell *matHeaderCellDef>{{ displayColumnLabels['activity'] }}</th>
        <td mat-cell *matCellDef="let t">{{ t.activity?.name ?? '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="status">
            <span>{{ displayColumnLabels['status'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let t">
          <span class="zb-chip square task-status" [ngClass]="t.status">
            {{ t.status | snakeToSpaces: 'everyFirst' }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="priority">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="priority">
            <span>{{ displayColumnLabels['priority'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let t">
          @if (t.priority?.label) {
            <span class="zb-chip priority" [ngClass]="t.priority.label">{{ t.priority.label }}</span>
          } @else {
            —
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="nbComments">
        <th mat-header-cell *matHeaderCellDef class="num">{{ displayColumnLabels['nbComments'] }}</th>
        <td mat-cell *matCellDef="let t" class="num">{{ t.nbComments ?? 0 }}</td>
      </ng-container>
    </zb-remote-table>
    </div>
  `,
  styles: `
    :host { display: block; }
    .intro-head { display: flex; align-items: center; justify-content: space-between; gap: var(--zb-spacing-md); }
    .intro h1 { margin: 0 0 var(--zb-spacing-xs); }
    .btn-stroked {
      height: 38px; padding: 0 var(--zb-spacing-md);
      border: 1px solid var(--zb-primary); border-radius: 6px;
      background: transparent; color: var(--zb-primary);
      font-size: var(--zb-font-size-md); cursor: pointer; white-space: nowrap;
    }
    .btn-stroked:hover { background: var(--zb-table-row-hover); }
    .lead { color: var(--zb-secondary-text); margin: 0 0 var(--zb-spacing-md); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
    /* Fixed-height box so only the table's inner container scrolls (see products.ts for the why). */
    .table-container { height: 600px; }
    .code-col { width: 120px; }
    .num { text-align: right; }
  `,
})
export class Tasks extends ZbRemoteTableContainerComponent {
  private readonly session = inject(SessionService);

  /** Create-task drawer (code-reveal write demo). */
  protected readonly createOpen = signal(false);

  /** Drill into a task's detail. `this.router` is the base class's protected Router. */
  protected openDetail(task: TaskExtended): void {
    this.router.navigate(['/tasks/detail'], { queryParams: { id: task.id.toString() } });
  }

  // COMPONENT mode: the base drives list() on init + on every table interaction (no URL sync).
  override mode = ZB_TABLE_MODE.COMPONENT;

  override config: ZbRemoteTableConfig = {
    // Large page so the first load overflows the bounded scroll container; paging is scroll-driven
    // (the endpoint returns no total count, so there's no numbered paginator).
    pageSize: 50,
    searchParams: ['search'],
    // status -> statuses, priority -> priorities (see class doc).
    filterParams: ['statuses', 'priorities'],
    arrayParams: ['statuses', 'priorities'],
  };

  override displayColumns = ['code', 'name', 'activity', 'status', 'priority', 'nbComments'];
  override displayColumnLabels: Record<string, string> = {
    code: 'Code',
    name: 'Name',
    activity: 'Activity',
    status: 'Status',
    priority: 'Priority',
    nbComments: 'Comments',
  };

  // The base requires these three via super() — they can't move to inject(). session is injected above.
  constructor(activatedRoute: ActivatedRoute, router: Router, tableService: ZbRemoteTableService) {
    super(activatedRoute, router, tableService);
  }

  override list(): void {
    const api = this.session.api();
    if (!api) return;

    const params = this.tableService.getRequestParams();
    const body: SearchTaskBody = {};
    if (params['search']) body.search = params['search'];
    if (params['statuses']) body.statuses = params['statuses'];
    if (params['priorities']) body.priorities = params['priorities'];

    this.loading = true;
    const taskApi = api.portalClient.getTaskApi();
    taskApi
      .search(body, params['pageNumber'], params['pageSize'], params['sort'])
      .then((results) => {
        this.tableService.setData({
          items: results.items,
          count: results.count ?? results.items.length,
          // Server-declared sort/filter metadata — fetched lazily, only when the table asks.
          getColumnOptions: () =>
            taskApi
              .searchTasksOptions()
              .then((w) => w.options as unknown as Record<string, RemoteTableColumnOptions>),
        });
      })
      .catch((err) => {
        console.error('Task search failed', err);
        this.tableService.setData({ items: [], count: 0 });
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
