"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardExtended } from "@zerobias-com/portal-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import {
  RemoteTable,
  type Column,
  type ColumnOptionsMap,
  type FilterState,
  type SortState,
} from "@/components/RemoteTable";
import { CreateBoardDrawer } from "@/components/CreateBoardDrawer";

const PAGE_SIZE = 10;

/**
 * Boards — the middle layer of the compliance containment chain (project -> board -> task), and
 * the fourth RemoteTable consumer. Same server-driven two-call pattern:
 *
 *   portalClient.getBoardApi().searchOptions()               -> per-column sort/filter metadata
 *   portalClient.getBoardApi().search(body, page, size, sort) -> PagedResults<BoardExtended>
 *
 * Each board belongs to a project (`project`) and carries the tasks that hang off its activities
 * (`taskCount`). The detail links up to the project and down into the board's own tasks.
 *
 * Same plural-filter trap: options key columns as `status` / `boardType`, but SearchBoardBody
 * wants the arrays `statuses` / `boardTypes`. `Column.filterParam` carries the mapping.
 */

const COLUMNS: Column<BoardExtended>[] = [
  { key: "name", header: "Name", cell: (b) => b.name },
  {
    key: "boardType",
    header: "Type",
    filterParam: "boardTypes", // options say `boardType`; body wants `boardTypes`
    cell: (b) => String(b.boardType),
  },
  {
    key: "status",
    header: "Status",
    filterParam: "statuses", // options say `status`; body wants `statuses`
    cell: (b) => <span className="chip neutral">{String(b.status)}</span>,
  },
  {
    key: "project",
    header: "Project",
    cell: (b) => b.project?.name ?? "—",
  },
  {
    key: "taskCount",
    header: "Tasks",
    align: "right",
    cell: (b) => b.taskCount ?? 0,
  },
];

export default function BoardsPage() {
  const { api, org } = useSession();
  const router = useRouter();

  const [boards, setBoards] = useState<BoardExtended[]>([]);
  const [options, setOptions] = useState<ColumnOptionsMap | undefined>();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // 1. Column metadata — describes the endpoint, fetched once.
  useEffect(() => {
    if (!api) return;
    api.portalClient
      .getBoardApi()
      .searchOptions()
      .then((res) => setOptions(res.options as unknown as ColumnOptionsMap))
      .catch((err) => {
        console.warn("Board searchOptions failed; table falls back to plain list", err);
      });
  }, [api]);

  // 2. The rows.
  const load = useCallback(() => {
    if (!api) return;

    const body: Record<string, unknown> = {};
    if (search.trim()) body.search = search.trim();
    for (const [key, values] of Object.entries(filters)) {
      if (!values.length) continue;
      const param = COLUMNS.find((c) => c.key === key)?.filterParam ?? key;
      body[param] = values;
    }

    return api.portalClient
      .getBoardApi()
      .search(
        body as never,
        page,
        PAGE_SIZE,
        sort ? ({ active: sort.active, direction: sort.direction } as never) : undefined,
      )
      .then((results) => {
        setBoards(results.items);
        setError(null);
      })
      .catch((err) => {
        console.error("Board search failed", err);
        setError(toUserMessage(err));
        setBoards([]);
      })
      .finally(() => setLoading(false));
  }, [api, page, sort, filters, search]);

  useEffect(() => {
    void load();
  }, [load, org?.id]);

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
      <div className="page-header">
        <h1>Compliance Boards</h1>
        <button type="button" className="btn-stroked" onClick={() => setCreateOpen(true)}>
          + Create Board
        </button>
      </div>
      <p className="subtitle">
        <code>getBoardApi().searchOptions()</code> drives the table;{" "}
        <code>.search(body, page, size, sort)</code> fills it. Boards sit between a project and its
        tasks.
      </p>

      <CreateBoardDrawer open={createOpen} onClose={() => setCreateOpen(false)} />

      <RemoteTable
        columns={COLUMNS}
        rows={boards}
        rowKey={(b) => b.id.toString()}
        onRowClick={(b) => router.push(`/boards/detail?id=${b.id}`)}
        loading={loading}
        error={error}
        emptyMessage="No boards found."
        columnOptions={options}
        sort={sort}
        onSortChange={changeQuery(setSort)}
        filters={filters}
        onFiltersChange={changeQuery(setFilters)}
        search={search}
        onSearchChange={changeQuery(setSearch)}
        searchPlaceholder="Search boards…"
        page={page}
        pageSize={PAGE_SIZE}
        hasNext={boards.length === PAGE_SIZE}
        onPageChange={changePage}
      />
    </div>
  );
}
