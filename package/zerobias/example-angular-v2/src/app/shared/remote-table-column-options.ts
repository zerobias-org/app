/**
 * ngx-library's `ZbRemoteTableService.setData({ getColumnOptions })` expects
 * `Record<string, ZbColumnOptionsDef>`, but ngx does **not** export `ZbColumnOptionsDef`. The
 * ZeroBias `search*Options` endpoints return `ResultsColumnOptionsWrapper.options` — the same wire
 * data under a different SDK type. This interface mirrors the structural shape ngx consumes, so the
 * single boundary cast (`w.options as unknown as Record<string, RemoteTableColumnOptions>`) is
 * type-checked against a real shape instead of being silenced with `as never`.
 */
export interface RemoteTableColumnOptions {
  filterable?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  optionSearchable?: boolean;
}
