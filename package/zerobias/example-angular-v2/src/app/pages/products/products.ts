import { Component, inject } from '@angular/core';
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
import { SearchProductBody } from '@zerobias-com/portal-sdk';

import { SessionService } from '../../core/session.service';
import type { RemoteTableColumnOptions } from '../../shared/remote-table-column-options';

/**
 * Products Catalog — the canonical `zb-remote-table` read demo, the Angular counterpart of the
 * React app's Products page. Two portal calls work together:
 *
 *   portalClient.getProductApi().searchProductsOptions()
 *     -> per-column metadata (which columns are sortable / filterable + allowed values). Passed to
 *        the table via `setData({ getColumnOptions })`; `zb-remote-table-header` renders the sort /
 *        filter affordances the SERVER declares — nothing here hardcodes "status is filterable".
 *
 *   portalClient.getProductApi().search(body, pageNumber, pageSize, sort)
 *     -> PagedResults<ProductExtended>; `.items` are the rows.
 *
 * Mechanics come from ngx-library: extend `ZbRemoteTableContainerComponent`, provide
 * `ZbRemoteTableService` per-component. In COMPONENT mode the base calls `list()` on init and again
 * on every sort/filter/search/page change; we only implement `list()`: read `getRequestParams()`,
 * call the SDK, hand the result to `setData()`.
 *
 * Note the one non-obvious mapping: the options endpoint keys the column `status`, but
 * `SearchProductBody` wants `statuses` (a plural array) — `filterParams`/`arrayParams` below carry
 * that so the filter isn't silently dropped server-side.
 */
@Component({
  selector: 'app-products',
  imports: [
    MatTableModule,
    ZbRemoteTableComponent,
    ZbRemoteTableHeaderComponent,
    ZbResourceStatusComponent,
  ],
  providers: [ZbRemoteTableService],
  template: `
    <section class="intro">
      <h1>Products Catalog</h1>
      <p class="lead">
        <code>getProductApi().searchProductsOptions()</code> drives the columns;
        <code>.search(body, page, size, sort)</code> fills them.
      </p>
    </section>

    <div class="table-container">
    <zb-remote-table
      [columns]="displayColumns"
      [columnLabels]="displayColumnLabels"
      [loading]="loading"
      [selectableRows]="false"
      [rowClickEnabled]="false"
      searchPageKey="search"
    >
      <ng-container matColumnDef="imageUrl">
        <th mat-header-cell *matHeaderCellDef class="logo-col">{{ displayColumnLabels['imageUrl'] }}</th>
        <td mat-cell *matCellDef="let p">
          @if (p.imageUrl) {
            <img class="logo" [src]="p.imageUrl.toString()" [alt]="p.name" width="28" height="28" />
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="name">
            <span>{{ displayColumnLabels['name'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let p">{{ p.name }}</td>
      </ng-container>

      <ng-container matColumnDef="code">
        <th mat-header-cell *matHeaderCellDef>{{ displayColumnLabels['code'] }}</th>
        <td mat-cell *matCellDef="let p"><code>{{ p.code }}</code></td>
      </ng-container>

      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>{{ displayColumnLabels['description'] }}</th>
        <td mat-cell *matCellDef="let p">{{ p.description ?? '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>
          <zb-remote-table-header columnKey="status">
            <span>{{ displayColumnLabels['status'] }}</span>
          </zb-remote-table-header>
        </th>
        <td mat-cell *matCellDef="let p">
          <zb-resource-status [label]="p.status" [pill]="true"></zb-resource-status>
        </td>
      </ng-container>
    </zb-remote-table>
    </div>
  `,
  styles: `
    /* Fill the shell's content height and let the table flex into the remaining space.
       zb-remote-table is :host{height:100%} + an inner .zb-remote-table-table-container
       {flex:1;overflow:auto} that owns infinite scroll ([scrollWindow]=false). That inner
       container only scrolls if it gets a BOUNDED height — i.e. this host must be bounded and
       the table must flex, not grow with content. Without this the whole page scrolls instead,
       the scroll event never reaches the table, and infinite scroll never loads page 2. */
    :host { display: block; }
    /* The table lives in its own fixed-height box (NOT tied to the shell height), so only its
       inner scroll container overflows — no second page scrollbar. Don't set display/height on
       zb-remote-table: it already styles itself display:flex; height:100% (ViewEncapsulation.None),
       and its 100% resolves against this 600px box. Overriding display:block collapses its internal
       flex column and kills the scroll. */
    .table-container { height: 600px; }
    .intro h1 { margin: 0 0 var(--zb-spacing-xs); }
    .lead { color: var(--zb-secondary-text); margin: 0 0 var(--zb-spacing-md); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
    .logo-col { width: 56px; }
    .logo { border-radius: 4px; object-fit: contain; }
  `,
})
export class Products extends ZbRemoteTableContainerComponent {
  private readonly session = inject(SessionService);

  // COMPONENT mode: the base drives list() on init + on every table interaction (no URL sync).
  override mode = ZB_TABLE_MODE.COMPONENT;

  override config: ZbRemoteTableConfig = {
    // Large page so the first load overflows the bounded scroll container and shows a scrollbar —
    // that's what lets infinite scroll fire (onScrollDown) to fetch the next page. The endpoint
    // returns no total count, so there's no numbered paginator; paging is scroll-driven.
    pageSize: 50,
    searchParams: ['search'],
    // The `status` column filters into the body's `statuses` array (see class doc).
    filterParams: ['statuses'],
    arrayParams: ['statuses'],
  };

  override displayColumns = ['imageUrl', 'name', 'code', 'description', 'status'];
  override displayColumnLabels: Record<string, string> = {
    imageUrl: 'Logo',
    name: 'Name',
    code: 'Code',
    description: 'Description',
    status: 'Status',
  };

  // The base requires these three via super() — they can't move to inject() (super() needs them
  // before field initializers run). Everything else (session) is injected.
  constructor(activatedRoute: ActivatedRoute, router: Router, tableService: ZbRemoteTableService) {
    super(activatedRoute, router, tableService);
  }

  override list(): void {
    const api = this.session.api();
    if (!api) return;

    const params = this.tableService.getRequestParams();
    const body: SearchProductBody = {};
    if (params['search']) body.search = params['search'];
    if (params['statuses']) body.statuses = params['statuses'];

    this.loading = true;
    const productApi = api.portalClient.getProductApi();
    productApi
      .search(body, params['pageNumber'], params['pageSize'], params['sort'])
      .then((results) => {
        this.tableService.setData({
          items: results.items,
          count: results.count ?? results.items.length,
          // Server-declared sort/filter metadata — fetched lazily, only when the table asks.
          getColumnOptions: () =>
            productApi
              .searchProductsOptions()
              .then((w) => w.options as unknown as Record<string, RemoteTableColumnOptions>),
        });
      })
      .catch((err) => {
        console.error('Products search failed', err);
        this.tableService.setData({ items: [], count: 0 });
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
