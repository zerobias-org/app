"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ProductExtended } from "@zerobias-com/portal-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import {
  RemoteTable,
  type Column,
  type ColumnOptionsMap,
  type FilterState,
  type SortState,
} from "@/components/RemoteTable";

const PAGE_SIZE = 10;

/**
 * Columns are declarative and static — which of them SORT or FILTER is decided at runtime
 * by the server's `searchProductsOptions()` metadata, not here. Nothing below says
 * `sortable: true`.
 */
const COLUMNS: Column<ProductExtended>[] = [
  {
    key: "imageUrl",
    header: "Logo",
    width: "56px",
    cell: (p) =>
      p.imageUrl ? (
        <Image src={p.imageUrl.toString()} alt={p.name} width={32} height={32} />
      ) : null,
  },
  { key: "name", header: "Name", cell: (p) => p.name },
  { key: "code", header: "Code", cell: (p) => <code>{p.code}</code> },
  {
    key: "description",
    header: "Description",
    cell: (p) => p.description ?? "—",
  },
  {
    key: "status",
    header: "Status",
    // The options endpoint calls this column `status`; SearchProductBody wants `statuses`.
    // Without this mapping the filter is silently ignored server-side. See RemoteTable.
    filterParam: "statuses",
    cell: (p) => (
      <span
        className={`chip ${p.status?.toString() === "published" ? "success" : "neutral"}`}
      >
        {p.status?.toString()}
      </span>
    ),
  },
];

/**
 * Products Catalog — the canonical "remote table" pattern.
 *
 * Two calls work together, and this pairing is the thing to copy:
 *
 *   portalClient.getProductApi().searchProductsOptions()
 *     -> per-column metadata: which columns are sortable / searchable / filterable,
 *        and for filterable ones, the allowed values.
 *
 *   portalClient.getProductApi().search(body, page, size, sort)
 *     -> PagedResults<ProductExtended>; `.items` holds the rows.
 *
 * The UI is DRIVEN by the options call. We never hardcode "status is filterable" or
 * "name is sortable" — the server says so, and `RemoteTable` renders accordingly. Add a
 * filter server-side and it appears here with no client release; remove one and it
 * disappears. Every searchable platform endpoint has this same `*Options` sibling
 * (`searchTasksOptions()`, `taskSearchOptions(boardId)`, ...), so this pattern ports
 * directly to tasks, boards, findings, evidence — anything with a search endpoint.
 *
 * Paging is prev/next rather than a numbered pager: search returns no total count, so
 * there is no last page to compute.
 */
export default function ProductsPage() {
  const { api, org } = useSession();

  const [products, setProducts] = useState<ProductExtended[]>([]);
  const [options, setOptions] = useState<ColumnOptionsMap | undefined>();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Column metadata. Fetched once — it describes the endpoint, not the result set.
  useEffect(() => {
    if (!api) return;
    api.portalClient
      .getProductApi()
      .searchProductsOptions()
      .then((res) => {
        // The wrapper is `{ options: { [columnName]: ResultsColumnOptions } }`.
        setOptions(res.options as unknown as ColumnOptionsMap);
      })
      .catch((err) => {
        // Non-fatal: without options the table still lists rows, just without
        // server-driven sort/filter affordances.
        console.warn("searchProductsOptions failed; table falls back to plain list", err);
      });
  }, [api]);

  // 2. The rows. Re-runs whenever sort/filter/search/page/org changes.
  //
  // NOTE: this does NOT flip `loading` on. Setting state synchronously inside an effect
  // cascades renders (react-hooks/set-state-in-effect). The user actions below own the
  // spinner instead: they set `loading` as they change the query, and the fetch clears it.
  const load = useCallback(() => {
    if (!api) return;

    // Filter keys come from the options metadata, so the body is assembled from whatever
    // the server declared filterable — not from a hardcoded list.
    //
    // The one thing that does NOT come for free: the options endpoint is keyed by COLUMN
    // name, but the search body's field may be named differently. Products declares the
    // column `status`, while SearchProductBody takes `statuses` (a plural array). Sending
    // `status` gets silently ignored and you get unfiltered rows back — a filter that
    // "does nothing" and looks like a UI bug. `Column.filterParam` carries that mapping.
    const body: Record<string, unknown> = {};
    if (search.trim()) body.search = search.trim();
    for (const [key, values] of Object.entries(filters)) {
      if (!values.length) continue;
      const param = COLUMNS.find((c) => c.key === key)?.filterParam ?? key;
      body[param] = values;
    }

    return api.portalClient
      .getProductApi()
      .search(
        body as never,
        page,
        PAGE_SIZE,
        sort ? ({ active: sort.active, direction: sort.direction } as never) : undefined,
      )
      .then((results) => {
        setProducts(results.items);
        setError(null);
      })
      .catch((err) => {
        console.error("Products search failed", err);
        setError(toUserMessage(err));
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [api, page, sort, filters, search]);

  useEffect(() => {
    void load();
  }, [load, org?.id]);

  // Any change to the query resets to page 1 — otherwise you land on an empty page 4 —
  // and shows the loading state. These handlers, not the effect, own `loading`.
  const changeQuery =
    <T,>(setter: (v: T) => void) =>
    (value: T) => {
      setLoading(true);
      setPage(1);
      setter(value);
    };

  const changePage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  return (
    <div>
      <h1>Products Catalog</h1>
      <p className="subtitle">
        <code>getProductApi().searchProductsOptions()</code> drives the table;{" "}
        <code>.search(body, page, size, sort)</code> fills it.
      </p>

      <RemoteTable
        columns={COLUMNS}
        rows={products}
        rowKey={(p) => p.id.toString()}
        loading={loading}
        error={error}
        emptyMessage="No products found."
        columnOptions={options}
        sort={sort}
        onSortChange={changeQuery(setSort)}
        filters={filters}
        onFiltersChange={changeQuery(setFilters)}
        search={search}
        onSearchChange={changeQuery(setSearch)}
        searchPlaceholder="Search products…"
        page={page}
        pageSize={PAGE_SIZE}
        hasNext={products.length === PAGE_SIZE}
        onPageChange={changePage}
      />
    </div>
  );
}
