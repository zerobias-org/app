"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectExtended } from "@zerobias-com/portal-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import {
  RemoteTable,
  type Column,
  type ColumnOptionsMap,
  type FilterState,
  type SortState,
} from "@/components/RemoteTable";
import { CreateProjectDrawer } from "@/components/CreateProjectDrawer";

const PAGE_SIZE = 10;

/**
 * Projects — the top of the containment chain, and the THIRD consumer of RemoteTable
 * (after Products and Tasks). Same server-driven two-call pattern:
 *
 *   portalClient.getProjectApi().searchOptions()               -> per-column sort/filter metadata
 *   portalClient.getProjectApi().search(body, page, size, sort) -> PagedResults<ProjectExtended>
 *
 * A project contains boards; boards carry activities; tasks hang off activities. The detail view
 * drills that chain down to the project's own tasks. Reads live on `portalClient`; writes (create
 * project / manage members) live on `platformClient` — that split is consistent across the surface.
 *
 * Same shape trap as Tasks: the options endpoint keys columns as `status` / `visibility`, but
 * SearchProjectBody wants the PLURAL arrays `statuses` / `visibilities`. `Column.filterParam`
 * carries that mapping.
 */

const COLUMNS: Column<ProjectExtended>[] = [
  { key: "name", header: "Name", cell: (p) => p.name },
  {
    key: "projectType",
    header: "Type",
    cell: (p) => p.projectType?.name ?? p.type,
  },
  {
    key: "status",
    header: "Status",
    filterParam: "statuses", // options say `status`; SearchProjectBody wants `statuses`
    cell: (p) => <span className="chip neutral">{String(p.status)}</span>,
  },
  {
    key: "visibility",
    header: "Visibility",
    filterParam: "visibilities", // options say `visibility`; body wants `visibilities`
    cell: (p) => String(p.visibility),
  },
  {
    key: "boardCount",
    header: "Boards",
    align: "right",
    cell: (p) => p.boardCount ?? 0,
  },
  {
    key: "memberCount",
    header: "Members",
    align: "right",
    cell: (p) => p.memberCount ?? 0,
  },
];

export default function ProjectsPage() {
  const { api, org } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectExtended[]>([]);
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
      .getProjectApi()
      .searchOptions()
      .then((res) => setOptions(res.options as unknown as ColumnOptionsMap))
      .catch((err) => {
        console.warn("Project searchOptions failed; table falls back to plain list", err);
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
      .getProjectApi()
      .search(
        body as never,
        page,
        PAGE_SIZE,
        sort ? ({ active: sort.active, direction: sort.direction } as never) : undefined,
      )
      .then((results) => {
        setProjects(results.items);
        setError(null);
      })
      .catch((err) => {
        console.error("Project search failed", err);
        setError(toUserMessage(err));
        setProjects([]);
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
        <h1>Projects</h1>
        <button type="button" className="btn-stroked" onClick={() => setCreateOpen(true)}>
          + Create Project
        </button>
      </div>
      <p className="subtitle">
        <code>getProjectApi().searchOptions()</code> drives the table;{" "}
        <code>.search(body, page, size, sort)</code> fills it. A project contains boards, which
        carry the activities tasks hang off.
      </p>

      <CreateProjectDrawer open={createOpen} onClose={() => setCreateOpen(false)} />

      <RemoteTable
        columns={COLUMNS}
        rows={projects}
        rowKey={(p) => p.id.toString()}
        onRowClick={(p) => router.push(`/projects/detail?id=${p.id}`)}
        loading={loading}
        error={error}
        emptyMessage="No projects found."
        columnOptions={options}
        sort={sort}
        onSortChange={changeQuery(setSort)}
        filters={filters}
        onFiltersChange={changeQuery(setFilters)}
        search={search}
        onSearchChange={changeQuery(setSearch)}
        searchPlaceholder="Search projects…"
        page={page}
        pageSize={PAGE_SIZE}
        hasNext={projects.length === PAGE_SIZE}
        onPageChange={changePage}
      />
    </div>
  );
}
