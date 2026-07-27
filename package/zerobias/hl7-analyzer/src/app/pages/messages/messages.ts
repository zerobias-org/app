import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  ZB_TABLE_MODE,
  ZbRemoteTableComponent,
  ZbRemoteTableContainerComponent,
  ZbRemoteTableHeaderComponent,
  ZbRemoteTableService,
  ZbResourceStatusComponent,
  ZbSimplePanelComponent,
  type ZbColumnOptionsDef,
  type ZbRemoteTableConfig,
} from '@zerobias-org/ngx-library';

import { BatchValidator } from '../../core/batch-validate';
import { FACETS, Hl7Api, type FacetKind } from '../../core/hl7-api';
import type { Hl7SearchCriteria } from '../../core/hl7-filter';
import { Hl7TargetService, messageOf } from '../../core/hl7-target.service';
import { DateRange } from '../../shared/date-range/date-range';
import { TargetPicker } from '../../shared/target-picker/target-picker';

/**
 * Message search + batch validation.
 *
 * Filtering is the receiver's own vocabulary end to end: the `by-*` containers supply the distinct
 * values, the filter bar and `zb-remote-table-header` both render them, and the chosen values
 * compile to one RFC4515 filter (see `core/hl7-filter.ts`) sent with the search. Nothing here
 * invents a filterable column, and nothing here filters rows in the browser — the count in the bar
 * is the receiver's, so narrowing a filter changes the total, not just the page.
 *
 * The bar and the column menus are one state, not two. Both write through
 * `tableService.updateParams()` and both read back from the request params via `filterState`, which
 * is refreshed in `onRouteChanges()`. The URL is the state; a second criteria signal would be a
 * second answer to "what is filtered", and the two would drift the first time a chip was dismissed.
 *
 * ROUTE mode (not the example app's COMPONENT mode) because this page is a jumping-off point: you
 * filter down to something interesting, open a message, and come back. With the filter state in the
 * URL, "back" returns you to your search instead of to an unfiltered feed, and a search is a link
 * you can paste to someone.
 *
 * Not `OnPush`: `ZbRemoteTableContainerComponent` keeps its state (`loading`, `displayColumns`) in
 * plain fields it mutates from RxJS callbacks, so an OnPush host would never re-render them. The
 * page's own state is signals, which mark the view dirty regardless of strategy.
 */
@Component({
  selector: 'app-messages',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    ZbRemoteTableComponent,
    ZbRemoteTableHeaderComponent,
    ZbResourceStatusComponent,
    ZbSimplePanelComponent,
    DateRange,
    TargetPicker,
  ],
  providers: [ZbRemoteTableService, BatchValidator],
  template: `
    @if (!target.targetId()) {
      <app-target-picker />
    } @else {
      <section class="bar filters">
        @for (axis of AXES; track axis.key) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="facet">
            <mat-label>{{ axis.label }}</mat-label>
            <mat-select
              [value]="param(axis.key)"
              (valueChange)="setFilter(axis.key, $event)"
              [disabled]="(facetValues()[axis.key] ?? []).length === 0"
            >
              <mat-option [value]="null">Any</mat-option>
              @for (value of facetValues()[axis.key] ?? []; track value) {
                <mat-option [value]="value">{{ value }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="control-id-search">
          <mat-label>Control ID</mat-label>
          <input
            matInput
            type="search"
            placeholder="prefix, e.g. 2228"
            [value]="param('controlId') ?? ''"
            (change)="setControlId($event)"
          />
        </mat-form-field>

        <app-date-range [(from)]="from" [(to)]="to" />
        <button matButton="outlined" (click)="applyDates()">
          <mat-icon>filter_alt</mat-icon> Apply dates
        </button>

        @if (activeFilters() > 0) {
          <button matButton (click)="clearFilters()">
            <mat-icon>filter_alt_off</mat-icon> Clear filters
          </button>
        }

        <span class="spacer"></span>
        <span class="matching">
          @if (activeFilters() > 0) {
            <strong>{{ activeFilters() }}</strong>
            {{ activeFilters() === 1 ? 'filter' : 'filters' }} &middot;
          }
          {{ total() === null ? '…' : total() }} matching
        </span>
      </section>

      <section class="bar">
        <span class="spacer"></span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="cap">
          <mat-label>Validate up to</mat-label>
          <mat-select [value]="cap()" (valueChange)="cap.set($event)">
            @for (n of CAPS; track n) {
              <mat-option [value]="n">{{ n }} messages</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (validator.running) {
          <button matButton="outlined" (click)="validator.cancel()">
            <mat-icon>stop</mat-icon> Stop
          </button>
        } @else {
          <button matButton="filled" (click)="validate()">
            <mat-icon>rule</mat-icon> Validate results
          </button>
        }
      </section>

      @if (validator.phase() !== 'idle') {
        <zb-simple-panel
          title="Validation of this result set"
          mode="header-only"
          [bodyPad]="true"
          class="summary"
        >
          @if (validator.running) {
            <p class="line">
              {{ validator.phase() === 'fetching' ? 'Fetching messages' : 'Validating' }} &mdash;
              {{ validator.done() }}{{ validator.planned() ? ' / ' + validator.planned() : '' }}
            </p>
            <mat-progress-bar
              [mode]="validator.planned() ? 'determinate' : 'indeterminate'"
              [value]="progress()"
            />
          } @else if (validator.phase() === 'error') {
            <p class="line error">{{ validator.error() }}</p>
          } @else {
            <dl class="counts">
              <div>
                <dt>Checked</dt>
                <dd>{{ validator.results().length }}</dd>
              </div>
              <div>
                <dt>Valid</dt>
                <dd class="ok">{{ validCount() }}</dd>
              </div>
              <div>
                <dt>Invalid</dt>
                <dd [class.bad]="invalidCount() > 0">{{ invalidCount() }}</dd>
              </div>
              <div>
                <dt>JSON &ne; ER7</dt>
                <dd [class.bad]="disagreeCount() > 0">{{ disagreeCount() }}</dd>
              </div>
              @if (unparsedCount() > 0) {
                <div>
                  <dt>Not parsed</dt>
                  <dd>{{ unparsedCount() }}</dd>
                </div>
              }
              @if (validator.failed() > 0) {
                <div>
                  <dt>Not checked</dt>
                  <dd class="bad">{{ validator.failed() }}</dd>
                </div>
              }
            </dl>

            @if (unparsedCount() > 0) {
              <p class="line">
                {{ unparsedCount() }} message(s) were stored unparsed — the receiver has no schema
                for their structure, so it kept the ER7 text and its index attributes only. They are
                excluded from the valid/invalid counts; open one to read its wire text.
              </p>
            }

            @if (validator.truncated()) {
              <p class="line note">
                Sampled the {{ validator.results().length }} most recent of
                {{ validator.matching() }} matching messages. Raise the cap or narrow the filter for
                full coverage.
              </p>
            }

            @if (validator.reasons().length === 0) {
              <p class="line ok">Every message checked satisfies its schema.</p>
            } @else {
              <p class="line">
                {{ validator.reasons().length }} distinct
                {{ validator.reasons().length === 1 ? 'defect' : 'defects' }}, most widespread first.
                Array positions are collapsed, so one defect repeated across 60 OBX repeats is one
                row.
              </p>
              <table class="reasons">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Problem</th>
                    <th class="num">Messages</th>
                    <th class="num">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  @for (reason of validator.reasons(); track reason.key) {
                    <tr>
                      <td>
                        <span class="field">{{ reason.resolved?.label ?? '—' }}</span>
                        @if (reason.resolved?.schemaId) {
                          <span class="schema">{{ reason.resolved?.schemaId }}</span>
                        }
                      </td>
                      <td>
                        <span class="reason">{{ reason.resolved?.reason ?? reason.key }}</span>
                        <span class="path">{{ reason.key }}</span>
                      </td>
                      <td class="num">{{ reason.messages }}</td>
                      <td class="num">{{ reason.count }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          }
        </zb-simple-panel>
      }

      @if (error()) {
        <p class="line error">{{ error() }}</p>
      }

      <div class="table-container">
        <zb-remote-table
          [columns]="displayColumns"
          [columnLabels]="displayColumnLabels"
          [loading]="loading"
          [selectableRows]="false"
          checkExistsKey="controlId"
          searchPageKey="controlId"
        >
          <ng-container matColumnDef="receivedAt">
            <th mat-header-cell *matHeaderCellDef>
              <zb-remote-table-header columnKey="receivedAt">
                <span>{{ displayColumnLabels['receivedAt'] }}</span>
              </zb-remote-table-header>
            </th>
            <td mat-cell *matCellDef="let m">{{ m.receivedAt | date: 'medium' }}</td>
          </ng-container>

          <ng-container matColumnDef="controlId">
            <th mat-header-cell *matHeaderCellDef>
              <zb-remote-table-header columnKey="controlId">
                <span>{{ displayColumnLabels['controlId'] }}</span>
              </zb-remote-table-header>
            </th>
            <td mat-cell *matCellDef="let m">
              <a
                class="control-id"
                [routerLink]="['/messages/detail']"
                [queryParams]="{ id: m.controlId }"
                >{{ m.controlId }}</a
              >
            </td>
          </ng-container>

          <ng-container matColumnDef="messageStructure">
            <th mat-header-cell *matHeaderCellDef>
              <zb-remote-table-header columnKey="messageStructure" [useExactKey]="true">
                <span>{{ displayColumnLabels['messageStructure'] }}</span>
              </zb-remote-table-header>
            </th>
            <td mat-cell *matCellDef="let m"><code>{{ m.messageStructure }}</code></td>
          </ng-container>

          <ng-container matColumnDef="hl7Version">
            <th mat-header-cell *matHeaderCellDef>
              <zb-remote-table-header columnKey="hl7Version" [useExactKey]="true">
                <span>{{ displayColumnLabels['hl7Version'] }}</span>
              </zb-remote-table-header>
            </th>
            <td mat-cell *matCellDef="let m">{{ m.hl7Version }}</td>
          </ng-container>

          <ng-container matColumnDef="sourcePort">
            <th mat-header-cell *matHeaderCellDef>
              <zb-remote-table-header columnKey="sourcePort" [useExactKey]="true">
                <span>{{ displayColumnLabels['sourcePort'] }}</span>
              </zb-remote-table-header>
            </th>
            <td mat-cell *matCellDef="let m">{{ m.sourcePort }}</td>
          </ng-container>

          <ng-container matColumnDef="sendingApp">
            <th mat-header-cell *matHeaderCellDef>
              <zb-remote-table-header columnKey="sendingApp" [useExactKey]="true">
                <span>{{ displayColumnLabels['sendingApp'] }}</span>
              </zb-remote-table-header>
            </th>
            <td mat-cell *matCellDef="let m">{{ m.sendingApp || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>{{ displayColumnLabels['status'] }}</th>
            <td mat-cell *matCellDef="let m">
              <zb-resource-status [label]="m.status" [pill]="true" />
            </td>
          </ng-container>

          <ng-container matColumnDef="validity">
            <th mat-header-cell *matHeaderCellDef>{{ displayColumnLabels['validity'] }}</th>
            <td mat-cell *matCellDef="let m">
              @if (verdictOf(m.controlId); as verdict) {
                @if (!verdict.materialized) {
                  <span class="verdict none" title="Stored unparsed — no schema for this structure">
                    <mat-icon>help_outline</mat-icon> not parsed
                  </span>
                } @else if (verdict.valid && verdict.agree) {
                  <span class="verdict ok"><mat-icon>check_circle</mat-icon> valid</span>
                } @else if (verdict.valid) {
                  <span class="verdict warn"><mat-icon>compare_arrows</mat-icon> JSON &ne; ER7</span>
                } @else {
                  <span class="verdict bad">
                    <mat-icon>error</mat-icon>
                    {{ verdict.errors.length }}
                    {{ verdict.errors.length === 1 ? 'error' : 'errors' }}
                  </span>
                }
              } @else {
                <span class="verdict none">—</span>
              }
            </td>
          </ng-container>
        </zb-remote-table>
      </div>
    }
  `,
  styles: `
    :host { display: block; height: 100%; display: flex; flex-direction: column; gap: var(--zb-spacing-md); }
    .bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--zb-spacing-sm); }
    .bar .spacer { flex: 1 1 auto; }
    .filters { padding-bottom: var(--zb-spacing-sm); border-bottom: 1px solid var(--zb-border-color); }
    .filters .facet { width: 168px; }
    .filters .control-id-search { width: 184px; }
    .matching { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); white-space: nowrap; }
    .matching strong { color: var(--zb-primary-text, inherit); }
    .cap { width: 190px; }
    .summary { display: block; }
    .line { margin: 0 0 var(--zb-spacing-sm); color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }
    .line.error { color: var(--zb-warn); }
    .line.ok { color: var(--zb-success, var(--zb-primary)); }
    .line.note { color: var(--zb-warn); }
    .counts { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-lg); margin: 0 0 var(--zb-spacing-md); }
    dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    dd { margin: 2px 0 0; font-size: var(--zb-font-size-lg); font-weight: 600; }
    dd.ok { color: var(--zb-success, var(--zb-primary)); }
    dd.bad { color: var(--zb-warn); }

    table.reasons { width: 100%; border-collapse: collapse; font-size: var(--zb-font-size-sm); }
    table.reasons th { text-align: left; font-weight: 500; color: var(--zb-secondary-text); padding: 4px 8px; border-bottom: 1px solid var(--zb-border-color); }
    table.reasons td { padding: 6px 8px; border-bottom: 1px solid var(--zb-border-color); vertical-align: top; }
    table.reasons .num { text-align: right; width: 96px; }
    .field { font-weight: 600; }
    .schema, .path { display: block; color: var(--zb-secondary-text); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; word-break: break-all; }
    .reason { display: block; }

    .table-container { flex: 1 1 auto; min-height: 420px; }
    code, .control-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .control-id { color: var(--zb-primary); text-decoration: none; }
    .control-id:hover { text-decoration: underline; }
    .verdict { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
    .verdict mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .verdict.ok { color: var(--zb-success, var(--zb-primary)); }
    .verdict.bad { color: var(--zb-warn); }
    .verdict.warn { color: var(--zb-warn); }
    .verdict.none { color: var(--zb-secondary-text); }
  `,
})
export class Messages extends ZbRemoteTableContainerComponent {
  protected readonly target = inject(Hl7TargetService);
  protected readonly validator = inject(BatchValidator);
  private readonly api = inject(Hl7Api);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly CAPS = [50, 200, 1000] as const;
  protected readonly cap = signal<number>(200);
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly error = signal<string | null>(null);

  /**
   * The axes the filter bar offers, and nothing else.
   *
   * These are exactly the four attributes the receiver publishes a `by-*` container for, so every
   * option shown is a value that exists in this target's data. `status`, `messageCode`,
   * `triggerEvent` and `sendingFacility` are filterable columns on the module but have no container
   * to enumerate them from — a free-text box over a vocabulary the user can't see returns zero rows
   * for a typo, which reads as "no data" rather than "no match", so they are left out.
   *
   * There is no segment filter: the receiver's buffer has no segment column and exposes no
   * `by-segment` container, so segment can only be filtered by reading each message — i.e. in the
   * browser, over the current page. That would silently mean "segment, among the 50 rows you can
   * already see", which is not the question anyone is asking. See the note in `core/hl7-filter.ts`.
   */
  protected readonly AXES = [
    { key: 'messageStructure', label: 'Structure' },
    { key: 'sourcePort', label: 'Receiving port' },
    { key: 'sendingApp', label: 'Sending app' },
    { key: 'hl7Version', label: 'HL7 version' },
  ] as const satisfies readonly { key: FacetKind; label: string }[];

  /** Distinct values per axis, straight from the `by-*` containers — shared with the column menus. */
  protected readonly facetValues = signal<Partial<Record<FacetKind, readonly string[]>>>({});

  /**
   * A reactive mirror of `tableService.getRequestParams()`, kept in step in `onRouteChanges()`.
   *
   * A mirror, not a second source of truth: the bar reads it and writes through `updateParams()`,
   * the same door the column header menus use. Holding filter state twice is how a filter bar and a
   * column menu end up showing different things.
   */
  protected readonly filterState = signal<Record<string, unknown>>({});

  /** Total matching on the server for the current filter — the number a filter control changes. */
  protected readonly total = signal<number | null>(null);

  protected readonly activeFilters = computed(() => {
    const params = this.filterState();
    return FILTER_KEYS.filter((key) => str(params[key]) !== undefined).length;
  });

  protected readonly progress = computed(() => {
    const planned = this.validator.planned();
    return planned > 0 ? (this.validator.done() / planned) * 100 : 0;
  });
  // Every count here is over materialized messages only. A message the receiver never parsed was
  // checked against the receipt envelope, so calling it valid *or* invalid would be a claim about
  // HL7 conformance that nothing checked — it gets its own count instead.
  protected readonly validCount = computed(
    () => this.validator.results().filter((r) => r.materialized && r.valid).length,
  );
  protected readonly invalidCount = computed(
    () => this.validator.results().filter((r) => r.materialized && !r.valid).length,
  );
  protected readonly disagreeCount = computed(
    () => this.validator.results().filter((r) => r.materialized && !r.agree).length,
  );
  protected readonly unparsedCount = computed(
    () => this.validator.results().filter((r) => !r.materialized).length,
  );

  override mode = ZB_TABLE_MODE.ROUTE;

  override config: ZbRemoteTableConfig = {
    pageSize: 50,
    // Singular keys throughout: the receiver's filter takes one value per attribute, so the header
    // menus use `useExactKey` and nothing pluralizes.
    filterParams: ['sourcePort', 'messageStructure', 'hl7Version', 'sendingApp'],
    searchParams: ['controlId'],
    // The date window has its own controls in the bar; a chip for it would be a second, divergent
    // place to remove it from.
    excludeFromChips: ['from', 'to'],
  };

  override displayColumns = [
    'receivedAt',
    'controlId',
    'messageStructure',
    'hl7Version',
    'sourcePort',
    'sendingApp',
    'status',
    'validity',
  ];
  override displayColumnLabels: Record<string, string> = {
    receivedAt: 'Received',
    controlId: 'Control ID',
    messageStructure: 'Structure',
    hl7Version: 'Version',
    sourcePort: 'Port',
    sendingApp: 'Sender',
    status: 'Status',
    validity: 'Validity',
  };

  /** Facet values, fetched once per target — the module's distinct values, not a hardcoded list. */
  private facetOptions: Promise<Record<string, ZbColumnOptionsDef>> | null = null;

  constructor(activatedRoute: ActivatedRoute, router: Router, tableService: ZbRemoteTableService) {
    super(activatedRoute, router, tableService);

    // ngx-library's table components are Default-strategy and assign plain fields from RxJS
    // subscriptions. Under this app's zoneless change detection nothing schedules a render when
    // those subjects fire, and the column header filter menus were dead because of it: the facet
    // values arrive ~3s after the last render, `ZbRemoteTableHeaderComponent` stores them and sets
    // its `showMoreButton`, and the DOM is never refreshed again. Verified live — the header
    // instances held 22 options and `filterable: true` while rendering zero buttons, and a single
    // forced pass materialised the menus. Marking this view dirty is enough: the headers are
    // Default-strategy descendants, so they are checked whenever this view is. The service is
    // provided by this component, so the subscription dies with it.
    this.tableService.columnOptionChanges().subscribe(() => this.cdr.markForCheck());

    // The first route event usually arrives before a target is connected, so that list() is a no-op.
    // Re-run it the moment a target exists — and drop cached facet values, which belong to the old
    // target's data.
    effect(() => {
      const targetId = this.target.targetId();
      untracked(() => {
        this.facetOptions = null;
        this.facetValues.set({});
        this.validator.reset();
        if (targetId) {
          void this.loadFacets();
          this.refreshList();
        }
      });
    });
  }

  override onRouteChanges(): void {
    super.onRouteChanges();
    // The URL is the filter state, so this is the one place the bar's view of it is refreshed —
    // whether the change came from the bar, a column menu, a chip's X, or the back button.
    this.filterState.set({ ...this.tableService.getRequestParams() });
    // Reflect a deep-linked / restored window back into the date inputs.
    this.from.set(String(this.getRequestParam('from') ?? ''));
    this.to.set(String(this.getRequestParam('to') ?? ''));
  }

  override list(): void {
    if (!this.target.targetId()) {
      this.loading = false;
      return;
    }
    const params = this.tableService.getRequestParams();
    const sort = parseSort(params['sort']);
    this.filterState.set({ ...params });

    this.loading = this.tableService.pageIndex === 0;
    this.error.set(null);
    this.api
      .search(
        this.criteriaOf(params),
        params['pageNumber'],
        params['pageSize'],
        sort.by,
        sort.descending,
      )
      .then((page) => {
        this.total.set(page.count);
        this.tableService.setData({
          items: [...page.rows],
          count: page.count,
          getColumnOptions: () => this.columnOptions_(),
        });
      })
      .catch((err) => {
        this.error.set(messageOf(err));
        this.total.set(null);
        this.tableService.setData({ items: [], count: 0 });
      })
      .finally(() => {
        this.loading = false;
      });
  }

  /** Current value of one filter param, so a control can be bound back to the shared state. */
  protected param(key: string): string | null {
    return str(this.filterState()[key]) ?? null;
  }

  /**
   * Every filter control writes here, and `updateParams` is the same door the column header menus
   * use: it replaces the value, resets to page 1, pushes the params into the URL and re-runs the
   * query server-side. Nothing in this page filters rows in the browser — the count in the bar is
   * the receiver's count, not a length.
   */
  protected setFilter(key: string, value: string | null): void {
    this.tableService.updateParams({ [key]: value || null });
  }

  /** Control ID is a prefix search; `criteriaOf` appends the `*` the receiver's glob needs. */
  protected setControlId(event: Event): void {
    this.setFilter('controlId', (event.target as HTMLInputElement).value.trim());
  }

  protected clearFilters(): void {
    this.from.set('');
    this.to.set('');
    this.tableService.updateParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])));
  }

  /** Apply the date inputs — they aren't table params, so they go through the service by hand. */
  protected applyDates(): void {
    this.tableService.updateParams({ from: this.from() || null, to: this.to() || null });
  }

  protected validate(): void {
    void this.validator.run(this.criteriaOf(this.tableService.getRequestParams()), this.cap());
  }

  protected verdictOf(controlId: string) {
    return this.validator.verdicts().get(controlId);
  }

  private getRequestParam(key: string): unknown {
    return this.tableService.getRequestParams()[key];
  }

  /** Table params -> receiver criteria. A control-id search is a prefix match (see app.config). */
  private criteriaOf(params: Record<string, unknown>): Hl7SearchCriteria {
    const controlId = params['controlId'] ? String(params['controlId']) : undefined;
    return {
      sourcePort: str(params['sourcePort']),
      messageStructure: str(params['messageStructure']),
      hl7Version: str(params['hl7Version']),
      sendingApp: str(params['sendingApp']),
      controlId: controlId ? (controlId.endsWith('*') ? controlId : `${controlId}*`) : undefined,
      from: str(params['from']),
      to: str(params['to']),
    };
  }

  /**
   * Publish the facet vocabularies to both things that render them — the bar's selects and the
   * table service's column options, which is what the header menus read.
   *
   * Pushing them ourselves rather than only answering `setData`'s `getColumnOptions` callback
   * matters on a target switch: the library asks for column options exactly once per table and
   * would otherwise keep offering the previous target's values.
   */
  private async loadFacets(): Promise<void> {
    try {
      this.tableService.setColumnOptions(await this.columnOptions_());
    } catch {
      // Facets are a convenience over the filter, not the filter itself — the table still lists.
    }
  }

  /**
   * Column metadata for the header menus. Filterable columns and their allowed values come from the
   * receiver's own `by-*` containers, so the menus can only ever offer values that exist in the data.
   */
  private columnOptions_(): Promise<Record<string, ZbColumnOptionsDef>> {
    this.facetOptions ??= (async () => {
      const kinds: FacetKind[] = Object.keys(FACETS) as FacetKind[];
      const loaded = await Promise.all(
        kinds.map(async (kind) => {
          try {
            return [kind, (await this.api.facet(kind)).map((f) => f.value)] as const;
          } catch {
            // A facet container we can't read costs that one menu, not the page.
            return [kind, [] as string[]] as const;
          }
        }),
      );
      // Also drives the filter bar's selects — one fetch, both renderings of the same vocabulary.
      this.facetValues.set(Object.fromEntries(loaded) as Partial<Record<FacetKind, string[]>>);

      // No column is sortable. The receiver accepts `sortBy`/`sortDir` and discards them:
      // `BufferStore.search` hardcodes `ORDER BY received_at DESC, id DESC`. Offering a sort arrow
      // that reorders nothing is worse than offering none, so the menus don't claim it. `receivedAt`
      // descending is what you always get, which is what `parseSort` asks for.
      const options: Record<string, ZbColumnOptionsDef> = {
        receivedAt: {},
        controlId: { searchable: true },
        status: {},
        validity: {},
      };
      for (const [kind, values] of loaded) {
        options[kind] = {
          filterable: values.length > 0,
          filter: { type: 'string', options: values, multi: false },
        };
      }
      return options;
    })();
    return this.facetOptions;
  }
}

/**
 * Every request param that narrows the result set — what "Clear filters" clears and what the active
 * count counts. Paging and sort are excluded: they change the page you're looking at, not the set.
 */
const FILTER_KEYS = [
  'messageStructure',
  'sourcePort',
  'sendingApp',
  'hl7Version',
  'controlId',
  'from',
  'to',
] as const;

function str(value: unknown): string | undefined {
  const text = value === null || value === undefined ? '' : String(value);
  return text.length > 0 ? text : undefined;
}

/** The table stores sort as `{"active":"receivedAt","direction":"desc"}`. Newest-first by default. */
function parseSort(raw: unknown): { by: string[]; descending: boolean } {
  if (typeof raw === 'string' && raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as { active?: string; direction?: string };
      if (parsed.active) {
        return { by: [parsed.active], descending: parsed.direction !== 'asc' };
      }
    } catch {
      // Fall through to the default.
    }
  }
  return { by: ['receivedAt'], descending: true };
}
