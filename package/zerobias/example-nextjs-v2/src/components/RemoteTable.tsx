"use client";

import type { ReactNode } from "react";
import { Spinner } from "./Spinner";
import { TableSkeleton } from "./TableSkeleton";
import { MultiSelect } from "./MultiSelect";

/**
 * RemoteTable — a table REMOTE-CONTROLLED by its API's `search` + `*Options` endpoints.
 *
 * The name is the point, and it mirrors ngx-library's split:
 *
 *   RemoteTable       (ngx: `zb-remote-table`)       — the SERVER drives the table. Which
 *     columns sort, which filter, and what the filter choices are all come from the
 *     endpoint's `*Options` sibling. Sorting/filtering/paging/searching are round-trips.
 *     Use this whenever the API has a `search` + `*Options` pair.
 *
 *   CustomizableTable (ngx: `zb-customizable-table`) — NOT BUILT YET. The local-first
 *     counterpart, for endpoints that return a plain array with no options metadata:
 *     the client owns sorting and paging (ngx exposes this as its `localSort` input).
 *     Build it when the first such demo needs it — do not bend RemoteTable into it.
 *
 * Demos supply columns and rows; they do not hand-roll `<table>` markup, so
 * paging/sorting/empty/loading behave identically everywhere.
 *
 * Mirrors ngx-library's `zb-remote-table` where it makes sense (class names on the portable
 * core — `zb-remote-table-toolbar`, `zb-remote-table-table-container`, `no-data`, `no-hover`),
 * but NOT its Angular Material internals (`.mat-mdc-*`, `.mdc-*`): those are Material's own
 * skins, and copying them would import Material's DOM contract without Material.
 * See docs/component-strategy.md.
 *
 * Sorting follows ngx's `matSortDisableClear`: a sortable header toggles asc <-> desc and
 * never returns to an unsorted third state. `SortState` is shaped to drop straight into the
 * SDK's `SortObject(active, direction)` with no translation.
 *
 * Paging is server-driven prev/next rather than a numbered paginator, because the platform's
 * search endpoints do not return a total count — so there is no last page to compute.
 */

export type SortDirection = "asc" | "desc";

/** Mirrors the SDK's `SortObject(active, direction)`. */
export type SortState = {
  /** Column key being sorted — the SDK calls this `active`. */
  active: string;
  direction: SortDirection;
};

export type Column<T> = {
  /** Stable key. Doubles as the sort/filter field sent to the API, so it MUST match the
   *  column name the API's `*Options` endpoint returns. */
  key: string;
  header: ReactNode;
  /** Render the cell. Keep rendering here, not in the demo's row loop. */
  cell: (row: T) => ReactNode;
  /** Force sortable. Normally you leave this off and let column options decide (see below). */
  sortable?: boolean;
  /**
   * The search-body field this column's filter maps to, when it differs from `key`.
   *
   * The `*Options` endpoint is keyed by COLUMN name, but the search body's field is often
   * named differently — Products exposes the column `status` while `SearchProductBody`
   * takes `statuses` (a plural array). Send the wrong one and the API silently ignores the
   * filter and returns unfiltered rows, which looks like a UI bug and isn't one.
   *
   * ngx-library solves the same problem with `ZbRemoteTableConfig` (`arrayParams`,
   * `filterParams`, `useExactKeys`). This is the React equivalent, kept on the column so
   * the mapping is visible where the column is declared.
   */
  filterParam?: string;
  /** Optional fixed width, e.g. "48px". */
  width?: string;
  align?: "left" | "right";
};

/**
 * The platform's column-options contract, structurally typed.
 *
 * Every searchable platform endpoint has a sibling `*Options` call — `searchProductsOptions()`,
 * `searchTasksOptions()`, `taskSearchOptions(boardId)` — that returns, per column, whether it is
 * sortable / searchable / filterable and (for filterable columns) the allowed filter values.
 *
 * That metadata is meant to DRIVE the UI: the server decides which headers sort and which
 * filters exist, so the table stays correct when the API changes without a client release.
 * This is the contract ngx-library's `zb-remote-table` consumes, and it is why this table takes
 * options rather than hardcoding `sortable: true` per column.
 *
 * Typed structurally (not imported from an SDK) so DataTable stays decoupled from any one
 * service — the shape is identical across portal/platform.
 */
export type ColumnFilterOption =
  | string
  | { id: string; name: string; description?: string };

export type ColumnOptions = {
  sortable: boolean;
  searchable: boolean;
  filterable: boolean;
  optionSearchable?: boolean;
  filter?: {
    /** "string" | "resource" | "tag" | "custom" */
    type: string;
    multi: boolean;
    options?: ColumnFilterOption[];
  };
};

/** Keyed by column name, exactly as the `*Options` endpoint returns it. */
export type ColumnOptionsMap = Record<string, ColumnOptions>;

/** Selected filter values, keyed by column name. Values are ids (or raw strings). */
export type FilterState = Record<string, string[]>;

const optionId = (o: ColumnFilterOption) => (typeof o === "string" ? o : o.id);
const optionLabel = (o: ColumnFilterOption) =>
  typeof o === "string" ? o : o.name;

export type RemoteTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;

  loading?: boolean;
  /** Rendered in place of rows. Pre-formatted by the caller (see lib/errors.ts). */
  error?: string | null;
  emptyMessage?: string;

  /**
   * Column metadata from the API's `*Options` endpoint. When supplied, it DRIVES the table:
   * which headers sort, which columns filter, and what the filter choices are. A column is
   * sortable if the SERVER says so (`options[key].sortable`), not because we hardcoded it.
   */
  columnOptions?: ColumnOptionsMap;

  /** Controlled sort. Omit `onSortChange` to disable sorting entirely. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;

  /** Controlled column filters, keyed by column name. Rendered only for `filterable` columns. */
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;

  /** Free-text search. Rendered only if at least one column is `searchable`. */
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;

  /** Controlled paging. Omit `onPageChange` to hide the pager. */
  page?: number;
  pageSize?: number;
  /** Whether a next page exists. Callers usually pass `rows.length === pageSize`. */
  hasNext?: boolean;
  onPageChange?: (page: number) => void;

  onRowClick?: (row: T) => void;

  /** Toolbar slots — ngx's `leftActions` / `rightActions` content projection. */
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;

  /** Tighter row height (ngx's `dense`). */
  dense?: boolean;
  /** Row hover highlight. On by default; ngx expresses the opposite as `no-hover`. */
  hoverable?: boolean;
};

export function RemoteTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyMessage = "No results found.",
  columnOptions,
  sort = null,
  onSortChange,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  page,
  pageSize,
  hasNext,
  onPageChange,
  onRowClick,
  toolbarLeft,
  toolbarRight,
  dense = false,
  hoverable = true,
}: RemoteTableProps<T>) {
  // A column sorts if the SERVER says it sorts. `col.sortable` is only a fallback for
  // endpoints that have no *Options sibling.
  const canSortColumn = (col: Column<T>) =>
    Boolean(onSortChange) &&
    (columnOptions ? Boolean(columnOptions[col.key]?.sortable) : Boolean(col.sortable));

  // Same for filters: the server decides which columns filter, and with what choices.
  const filterableColumns = columnOptions
    ? columns.filter((c) => columnOptions[c.key]?.filterable && columnOptions[c.key]?.filter)
    : [];

  const searchEnabled =
    Boolean(onSearchChange) &&
    (!columnOptions || Object.values(columnOptions).some((o) => o.searchable));

  // ngx's matSortDisableClear: toggle asc <-> desc, never clear back to unsorted.
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    const direction: SortDirection =
      sort?.active === key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ active: key, direction });
  };

  const setFilter = (key: string, values: string[]) => {
    if (!onFiltersChange) return;
    const next = { ...(filters ?? {}) };
    if (values.length === 0) delete next[key];
    else next[key] = values;
    onFiltersChange(next);
  };

  const clearFilter = (key: string, value: string) => {
    const remaining = (filters?.[key] ?? []).filter((v) => v !== value);
    setFilter(key, remaining);
  };

  // Active filters render as removable chips — ngx's `zb-remote-table-chips` row.
  const activeChips = Object.entries(filters ?? {}).flatMap(([key, values]) =>
    values.map((value) => {
      const opts = columnOptions?.[key]?.filter?.options ?? [];
      const match = opts.find((o) => optionId(o) === value);
      const col = columns.find((c) => c.key === key);
      return {
        key,
        value,
        label: `${typeof col?.header === "string" ? col.header : key}: ${match ? optionLabel(match) : value}`,
      };
    }),
  );

  const ariaSort = (key: string): "ascending" | "descending" | "none" =>
    sort?.active !== key
      ? "none"
      : sort.direction === "asc"
        ? "ascending"
        : "descending";

  const showToolbar = Boolean(
    toolbarLeft || toolbarRight || searchEnabled || filterableColumns.length,
  );
  const showPager = Boolean(onPageChange && page !== undefined);

  return (
    <div className="remote-table">
      {showToolbar && (
        <div className="zb-remote-table-toolbar">
          <div className="zb-remote-table-toolbar-row leftActions">
            {searchEnabled && (
              <div className="zb-remote-table-search">
                <span className="material-symbols-outlined" aria-hidden>
                  search
                </span>
                <input
                  type="search"
                  value={search ?? ""}
                  placeholder={searchPlaceholder}
                  aria-label="Search"
                  onChange={(e) => onSearchChange!(e.target.value)}
                />
              </div>
            )}

            {/* One control per column the SERVER declared filterable. Nothing here is
                hardcoded — remove a filter server-side and it disappears from the UI. */}
            {filterableColumns.map((col) => {
              const opt = columnOptions![col.key];
              const choices = opt.filter?.options ?? [];
              const selected = filters?.[col.key] ?? [];
              const headerText =
                typeof col.header === "string" ? col.header : col.key;

              // Multi-value filters get the checkbox popover (ngx's mat-select multiple);
              // single-value filters stay a plain native select.
              return (
                <div key={col.key} className="dt-filter">
                  <span className="dt-filter-label">{headerText}</span>
                  {opt.filter?.multi ? (
                    <MultiSelect
                      label={headerText}
                      placeholder="Any"
                      options={choices.map((c) => ({
                        id: optionId(c),
                        label: optionLabel(c),
                      }))}
                      value={selected}
                      onChange={(next) => setFilter(col.key, next)}
                    />
                  ) : (
                    <select
                      aria-label={headerText}
                      value={selected[0] ?? ""}
                      onChange={(e) =>
                        setFilter(col.key, e.target.value ? [e.target.value] : [])
                      }
                    >
                      <option value="">All</option>
                      {choices.map((c) => (
                        <option key={optionId(c)} value={optionId(c)}>
                          {optionLabel(c)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          <div className="zb-remote-table-toolbar-row rightActions">
            {toolbarLeft}
            {toolbarRight}
          </div>
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="zb-remote-table-chips">
          {activeChips.map((chip) => (
            <button
              key={`${chip.key}:${chip.value}`}
              type="button"
              className="chip removable"
              onClick={() => clearFilter(chip.key, chip.value)}
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="state error" role="alert">
          Error: {error}
        </p>
      )}

      {loading && (
        <p className="state loading-line">
          <Spinner diameter={18} /> Loading…
        </p>
      )}

      <div className="zb-remote-table-table-container table-scroll">
        <table
          className={`table${dense ? " dense" : ""}${hoverable ? "" : " no-hover"}`}
        >
          <thead>
            <tr>
              {columns.map((col) => {
                const canSort = canSortColumn(col);
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={col.align === "right" ? "align-right" : undefined}
                    aria-sort={canSort ? ariaSort(col.key) : undefined}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        className="th-sort"
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.header}
                        <span className="th-sort-arrow" aria-hidden>
                          {sort?.active === col.key
                            ? sort.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton
                rows={pageSize ?? 10}
                columns={columns.length}
                firstColIcon
              />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="state no-data">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "clickable" : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        col.align === "right" ? "align-right" : undefined
                      }
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPager && (
        <div className="toolbar">
          <button
            className="btn-ghost"
            disabled={loading || (page ?? 1) <= 1}
            onClick={() => onPageChange!(Math.max(1, (page ?? 1) - 1))}
          >
            ← Prev
          </button>
          <span className="state">Page {page}</span>
          <button
            className="btn-ghost"
            disabled={loading || !hasNext}
            onClick={() => onPageChange!((page ?? 1) + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
