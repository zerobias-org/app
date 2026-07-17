"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type {
  ProjectExtended,
  ProjectMemberExtended,
  ProjectTree,
  ProjectTreeNode,
  TaskExtended,
} from "@zerobias-com/portal-sdk";
import type { UUID } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import { Spinner } from "@/components/Spinner";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { CreateProjectDrawer } from "@/components/CreateProjectDrawer";
import { EditProjectDrawer } from "@/components/EditProjectDrawer";
import { CreateBoardDrawer } from "@/components/CreateBoardDrawer";

type CreateParent = { id: UUID; name: string };

const TASK_PREVIEW = 10;

/**
 * Project detail — the containment chain made concrete. All three reads are on the portal client
 * (the read side of the split), same project id:
 *
 *   portalClient.getProjectApi().get(id)                       -> the project + its counts
 *   portalClient.getProjectApi().listMembers(id)               -> who's on it (users/groups/service accounts)
 *   portalClient.getProjectApi().searchTasks(id, body, page…)  -> the project's tasks, scoped by the project
 *
 * `searchTasks` is the chain payoff: the SAME TaskExtended rows the /tasks demo lists, but scoped
 * to one project — each links straight into the existing task detail. Boards sit between project
 * and task (`boardCount`); a boards demo will surface that middle layer.
 */
export function ProjectDetail() {
  const { api } = useSession();
  // Query-param route (`/projects/detail?id=…`) for the same reason as task detail: static export
  // can't prerender a runtime id as a path. See tasks/detail/TaskDetail.tsx.
  const id = useSearchParams().get("id");

  // Data is tagged with the id it belongs to, so `loading` is DERIVED (stale when loadedId !== id)
  // and every setState stays inside async callbacks (no synchronous setState in the effect).
  const [data, setData] = useState<{
    id: string;
    project: ProjectExtended;
    members: ProjectMemberExtended[];
    tasks: TaskExtended[];
    tree: ProjectTree;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createParent, setCreateParent] = useState<CreateParent | null>(null);
  const [editing, setEditing] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  useEffect(() => {
    if (!api || !id) return;
    let cancelled = false;
    const toUuid = api.toUUID(id);

    Promise.all([
      api.portalClient.getProjectApi().get(toUuid),
      api.portalClient.getProjectApi().listMembers(toUuid),
      // Empty search body = all of the project's tasks, first page.
      api.portalClient.getProjectApi().searchTasks(toUuid, {} as never, 1, TASK_PREVIEW),
      // The whole hierarchy this project sits in — ancestry down through descendants.
      api.portalClient.getProjectApi().getTree(toUuid, true),
    ])
      .then(([project, members, tasks, tree]) => {
        if (cancelled) return;
        setData({ id, project, members, tasks: tasks.items, tree });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Project detail load failed", err);
        setError(toUserMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [api, id]);

  const loading = !error && data?.id !== id;

  if (loading) {
    return (
      <p className="state loading-line">
        <Spinner diameter={18} /> Loading project…
      </p>
    );
  }

  if (error) {
    return (
      <div>
        <p className="state error" role="alert">
          Error: {error}
        </p>
        <Link href="/projects">← Back to projects</Link>
      </div>
    );
  }

  if (!data) return null;
  const { project, members, tasks, tree } = data;
  const currentId = tree.requestedProjectId.toString();
  const standalone = tree.root.id.toString() === currentId && !tree.root.hasChildren;

  return (
    <div className="project-detail">
      <Link href="/projects" className="project-detail-back">
        ← Projects
      </Link>

      <div className="project-detail-head">
        <div className="project-detail-head-main">
          <div>
            {project.code && <span className="project-detail-code">{project.code}</span>}
            <h1>{project.name}</h1>
          </div>
          <span className="chip neutral">{String(project.status)}</span>
        </div>
        <div className="project-detail-head-actions">
          <button type="button" className="btn-stroked" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            className="btn-stroked"
            onClick={() => setCreateBoardOpen(true)}
          >
            + Create Board
          </button>
          <button
            type="button"
            className="btn-stroked"
            onClick={() => setCreateParent({ id: project.id, name: project.name })}
          >
            + Create Sub-Project
          </button>
        </div>
      </div>

      <EditProjectDrawer project={project} open={editing} onClose={() => setEditing(false)} />

      <CreateBoardDrawer
        open={createBoardOpen}
        onClose={() => setCreateBoardOpen(false)}
        project={{ id: project.id, name: project.name }}
      />

      <CreateProjectDrawer
        open={!!createParent}
        onClose={() => setCreateParent(null)}
        parent={createParent ?? undefined}
      />

      {project.description && (
        <div className="project-detail-desc">
          <MarkdownViewer content={project.description} />
        </div>
      )}

      <dl className="project-detail-meta">
        <div>
          <dt>Type</dt>
          <dd>{project.projectType?.name ?? project.type}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>{String(project.visibility)}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{project.owner?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Boards</dt>
          <dd>{project.boardCount ?? 0}</dd>
        </div>
      </dl>

      <section className="project-detail-section">
        <h2>Structure</h2>
        <p className="subtitle">
          <code>getProjectApi().getTree(id, true)</code> — walks the project&apos;s full ancestry
          and descendants in one call.
        </p>
        {standalone ? (
          <div className="project-tree-standalone">
            <p className="state">This project is standalone — no parent, no children.</p>
            <p className="project-detail-hint">
              Projects nest into a hierarchy; <code>getTree</code> returns the whole tree from the
              topmost ancestor down. For example:
            </p>
            <ul className="project-tree project-tree-example" aria-label="Example project hierarchy">
              <li>
                <div className="project-tree-node">
                  <span className="project-tree-name">Enterprise Compliance</span>
                  <span className="project-tree-type">Portfolio</span>
                </div>
                <ul className="project-tree-children">
                  <li>
                    <div className="project-tree-node">
                      <span className="project-tree-name">SOC 2 Program</span>
                      <span className="project-tree-type">Program</span>
                    </div>
                    <ul className="project-tree-children">
                      <li>
                        <div className="project-tree-node current">
                          <span className="project-tree-name">Q1 Evidence Collection</span>
                          <span className="project-tree-type">Project</span>
                        </div>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        ) : (
          <ul className="project-tree">
            <TreeNode node={tree.root} currentId={currentId} onAddChild={setCreateParent} />
          </ul>
        )}
      </section>

      <section className="project-detail-section">
        <h2>
          Tasks <span className="count">{tasks.length}</span>
        </h2>
        <p className="subtitle">
          <code>getProjectApi().searchTasks(id, body, page, size)</code> — the project&apos;s own
          tasks.
        </p>
        {tasks.length === 0 ? (
          <p className="state">No tasks in this project.</p>
        ) : (
          <ul className="project-detail-tasks">
            {tasks.map((t) => (
              <li key={t.id.toString()}>
                <Link href={`/tasks/detail?id=${t.id}`}>
                  <span className="project-detail-code">{t.code}</span>
                  {t.name}
                </Link>
                <span className="chip neutral">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="project-detail-section">
        <h2>
          Members <span className="count">{members.length}</span>
        </h2>
        <p className="subtitle">
          <code>getProjectApi().listMembers(id)</code>
        </p>
        {members.length === 0 ? (
          <p className="state">No members.</p>
        ) : (
          <ul className="project-detail-members">
            {members.map((m, i) => (
              <li key={i}>
                <strong>{memberLabel(m.member)}</strong>
                <span className="project-detail-roles">
                  {m.roles?.map((r) => r.name).join(", ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// A project member is a user, group, or service account (a union). All carry a display name;
// fall back to email/id for the odd shape rather than rendering "[object Object]".
function memberLabel(member: unknown): string {
  const m = member as { name?: string; email?: string; id?: string };
  return m.name ?? m.email ?? m.id ?? "Unknown";
}

/**
 * Renders a ProjectTree node and its descendants. The node matching `currentId` (the project being
 * viewed) is highlighted and not linked; every other node links to its own detail, so the tree
 * doubles as navigation up the ancestry and down the descendants.
 */
function TreeNode({
  node,
  currentId,
  onAddChild,
}: {
  node: ProjectTreeNode;
  currentId: string;
  onAddChild: (parent: CreateParent) => void;
}) {
  const isCurrent = node.id.toString() === currentId;
  const children = node.children ?? [];
  return (
    <li>
      <div className={`project-tree-node${isCurrent ? " current" : ""}`}>
        {isCurrent ? (
          <span className="project-tree-name">{node.name}</span>
        ) : (
          <Link href={`/projects/detail?id=${node.id}`} className="project-tree-name">
            {node.name}
          </Link>
        )}
        {node.projectType?.name && (
          <span className="project-tree-type">{node.projectType.name}</span>
        )}
        {typeof node.memberCount === "number" && (
          <span className="project-tree-count">{node.memberCount} members</span>
        )}
        <button
          type="button"
          className="project-tree-add"
          aria-label={`Create sub-project of ${node.name}`}
          title={`Create sub-project of ${node.name}`}
          onClick={() => onAddChild({ id: node.id, name: node.name })}
        >
          <span className="material-symbols-outlined" aria-hidden>
            add
          </span>
        </button>
      </div>
      {children.length > 0 && (
        <ul className="project-tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id.toString()}
              node={child}
              currentId={currentId}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
