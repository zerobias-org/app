"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskExtended } from "@zerobias-com/portal-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import {
  RemoteTable,
  type Column,
  type ColumnOptionsMap,
  type FilterState,
  type SortState,
} from "@/components/RemoteTable";
import { CreateTaskDrawer } from "@/components/CreateTaskDrawer";

const PAGE_SIZE = 10;

/**
 * Compliance Tasks — the SECOND consumer of RemoteTable, and the point of building it as a
 * reusable component: this page is almost entirely assembly. Same two-call pattern as
 * Products, against a completely different surface:
 *
 *   portalClient.getTaskApi().searchTasksOptions()  -> per-column sort/filter metadata
 *   portalClient.getTaskApi().search(body, page, size, sort) -> PagedResults<TaskExtended>
 *
 * Reads go through `portalClient` (portal.TaskApi is search/read only). WRITES — create,
 * update, subtasks — live on `platform.TaskApi` instead; that split is its own demo.
 *
 * Note the shape traps this surface shares with Products: the options endpoint keys columns
 * as `status` / `priority`, but SearchTaskBody wants the PLURAL array fields `statuses` /
 * `priorities`. `Column.filterParam` carries that mapping (see RemoteTable). And `priority`
 * is a `TaskPriority` object (`.label`), not a string.
 */

const COLUMNS: Column<TaskExtended>[] = [
  { key: "code", header: "Code", cell: (t) => <code>{t.code}</code>, width: "120px" },
  { key: "name", header: "Name", cell: (t) => t.name },
  {
    key: "activity",
    header: "Activity",
    // Tasks hang off a compliance activity — they do not float. This is that link.
    cell: (t) => t.activity?.name ?? "—",
  },
  {
    key: "status",
    header: "Status",
    filterParam: "statuses", // options say `status`; SearchTaskBody wants `statuses`
    cell: (t) => <span className="chip neutral">{t.status}</span>,
  },
  {
    key: "priority",
    header: "Priority",
    filterParam: "priorities", // options say `priority`; body wants `priorities`
    cell: (t) => t.priority?.label ?? "—",
  },
  {
    key: "nbComments",
    header: "Comments",
    align: "right",
    cell: (t) => t.nbComments ?? 0,
  },
];

export default function TasksPage() {
  const { api, org } = useSession();
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskExtended[]>([]);
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
      .getTaskApi()
      .searchTasksOptions()
      .then((res) => setOptions(res.options as unknown as ColumnOptionsMap))
      .catch((err) => {
        console.warn("searchTasksOptions failed; table falls back to plain list", err);
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
      .getTaskApi()
      .search(
        body as never,
        page,
        PAGE_SIZE,
        sort ? ({ active: sort.active, direction: sort.direction } as never) : undefined,
      )
      .then((results) => {
        setTasks(results.items);
        setError(null);
      })
      .catch((err) => {
        console.error("Task search failed", err);
        setError(toUserMessage(err));
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [api, page, sort, filters, search]);

  useEffect(() => {
    void load();
  }, [load, org?.id]);

  // Query changes reset to page 1 and own the loading state (not the effect).
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
        <h1>Compliance Tasks</h1>
        <button type="button" className="btn-stroked" onClick={() => setCreateOpen(true)}>
          + Create Task
        </button>
      </div>
      <p className="subtitle">
        <code>getTaskApi().searchTasksOptions()</code> drives the table;{" "}
        <code>.search(body, page, size, sort)</code> fills it.
      </p>

      <CreateTaskDrawer open={createOpen} onClose={() => setCreateOpen(false)} />

      <RemoteTable
        columns={COLUMNS}
        rows={tasks}
        rowKey={(t) => t.id.toString()}
        onRowClick={(t) => router.push(`/tasks/detail?id=${t.id}`)}
        loading={loading}
        error={error}
        emptyMessage="No tasks found."
        columnOptions={options}
        sort={sort}
        onSortChange={changeQuery(setSort)}
        filters={filters}
        onFiltersChange={changeQuery(setFilters)}
        search={search}
        onSearchChange={changeQuery(setSearch)}
        searchPlaceholder="Search tasks…"
        page={page}
        pageSize={PAGE_SIZE}
        hasNext={tasks.length === PAGE_SIZE}
        onPageChange={changePage}
      />
    </div>
  );
}
