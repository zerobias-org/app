import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import {
  ZB_TABLE_MODE,
  ZbRemoteTableComponent,
  ZbRemoteTableContainerComponent,
  ZbRemoteTableHeaderComponent,
  ZbRemoteTableService,
  ZbResourceStatusComponent,
  type ZbRemoteTableConfig,
} from '@zerobias-org/ngx-library';
import { SearchBoardBody, type BoardExtended } from '@zerobias-com/portal-sdk';

import { SessionService } from '../../core/session.service';
import { Drawer } from '../../shared/drawer/drawer';
import type { RemoteTableColumnOptions } from '../../shared/remote-table-column-options';
import { CreateBoardForm } from './create-board-form';

/**
 * Boards — the third `zb-remote-table` read demo (twin of the React app's Boards page). Same
 * two-call shape as Products/Projects:
 *
 *   portalClient.getBoardApi().searchOptions()               -> per-column sort/filter metadata
 *   portalClient.getBoardApi().search(body, page, size, sort) -> PagedResults<BoardExtended>
 *
 * A board belongs to a project and carries the activities that tasks hang off.
 *
 * Shape trap (same family): the options endpoint keys columns `status` / `boardType`, but
 * `SearchBoardBody` wants the PLURAL arrays `statuses` / `boardTypes`. `filterParams` /
 * `arrayParams` below carry that mapping so the filters aren't silently dropped server-side.
 */
@Component({
  selector: 'app-boards',
  imports: [
    MatTableModule,
    ZbRemoteTableComponent,
    ZbRemoteTableHeaderComponent,
    ZbResourceStatusComponent,
    Drawer,
    CreateBoardForm,
  ],
  providers: [ZbRemoteTableService],
  template: `
    <section class="intro">
      <div class="intro-head">
        <h1>Boards</h1>
        <button type="button" class="btn-stroked" (click)="createOpen.set(true)">+ Create Board</button>
      </div>
      <p class="lead">
        <code>getBoardApi().searchOptions()</code> drives the columns;
        <code>.search(body, page, size, sort)</code> fills them. A board belongs to a project and
        carries the activities tasks hang off. Click a row to drill into its detail.
      </p>
    </section>

    <app-drawer [open]="createOpen()" title="Create board" (close)="createOpen.set(false)">
      @if (createOpen()) {
        <app-create-board-form />
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
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="name">
            <span>{{ displayColumnLabels['name'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let b">{{ b.name }}</td>
      </ng-container>

      <ng-container matColumnDef="boardType">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="boardType">
            <span>{{ displayColumnLabels['boardType'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let b">
          <span class="zb-chip square generic">{{ b.boardType }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="status">
            <span>{{ displayColumnLabels['status'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let b">
          <zb-resource-status [label]="b.status" [pill]="true"></zb-resource-status>
        </td>
      </ng-container>

      <ng-container matColumnDef="project">
        <th mat-header-cell *matHeaderCellDef>{{ displayColumnLabels['project'] }}</th>
        <td mat-cell *matCellDef="let b">{{ b.project?.name ?? '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="taskCount">
        <th mat-header-cell *matHeaderCellDef class="num">{{ displayColumnLabels['taskCount'] }}</th>
        <td mat-cell *matCellDef="let b" class="num">{{ b.taskCount ?? 0 }}</td>
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
    .num { text-align: right; }
  `,
})
export class Boards extends ZbRemoteTableContainerComponent {
  private readonly session = inject(SessionService);

  /** Create-board drawer (code-reveal write demo). */
  protected readonly createOpen = signal(false);

  /** Drill into a board's detail. `this.router` is the base class's protected Router. */
  protected openDetail(board: BoardExtended): void {
    this.router.navigate(['/boards/detail'], { queryParams: { id: board.id.toString() } });
  }

  // COMPONENT mode: the base drives list() on init + on every table interaction (no URL sync).
  override mode = ZB_TABLE_MODE.COMPONENT;

  override config: ZbRemoteTableConfig = {
    // Large page so the first load overflows the bounded scroll container; paging is scroll-driven
    // (the endpoint returns no total count, so there's no numbered paginator).
    pageSize: 50,
    searchParams: ['search'],
    // status -> statuses, boardType -> boardTypes (see class doc).
    filterParams: ['statuses', 'boardTypes'],
    arrayParams: ['statuses', 'boardTypes'],
  };

  override displayColumns = ['name', 'boardType', 'status', 'project', 'taskCount'];
  override displayColumnLabels: Record<string, string> = {
    name: 'Name',
    boardType: 'Type',
    status: 'Status',
    project: 'Project',
    taskCount: 'Tasks',
  };

  // The base requires these three via super() — they can't move to inject(). session is injected above.
  constructor(activatedRoute: ActivatedRoute, router: Router, tableService: ZbRemoteTableService) {
    super(activatedRoute, router, tableService);
  }

  override list(): void {
    const api = this.session.api();
    if (!api) return;

    const params = this.tableService.getRequestParams();
    const body: SearchBoardBody = {};
    if (params['search']) body.search = params['search'];
    if (params['statuses']) body.statuses = params['statuses'];
    if (params['boardTypes']) body.boardTypes = params['boardTypes'];

    this.loading = true;
    const boardApi = api.portalClient.getBoardApi();
    boardApi
      .search(body, params['pageNumber'], params['pageSize'], params['sort'])
      .then((results) => {
        this.tableService.setData({
          items: results.items,
          count: results.count ?? results.items.length,
          // Server-declared sort/filter metadata — fetched lazily, only when the table asks.
          getColumnOptions: () =>
            boardApi
              .searchOptions()
              .then((w) => w.options as unknown as Record<string, RemoteTableColumnOptions>),
        });
      })
      .catch((err) => {
        console.error('Board search failed', err);
        this.tableService.setData({ items: [], count: 0 });
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
