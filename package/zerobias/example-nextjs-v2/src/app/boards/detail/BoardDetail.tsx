"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { BoardExtended, TaskExtended } from "@zerobias-com/portal-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import { Spinner } from "@/components/Spinner";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { EditBoardDrawer } from "@/components/EditBoardDrawer";
import { CreateTaskDrawer } from "@/components/CreateTaskDrawer";

const TASK_PREVIEW = 10;

/**
 * Board detail — the middle of the chain, linked both ways. Reads on the portal client:
 *
 *   portalClient.getBoardApi().get(id)                       -> the board + its project link + counts
 *   portalClient.getBoardApi().searchTasks(id, body, page…)  -> the board's own tasks
 *
 * Up: the board's `project` links to the project detail. Down: `searchTasks` lists the board's
 * tasks, each linking into the task detail. That is project -> board -> task, navigable.
 */
export function BoardDetail() {
  const { api } = useSession();
  // Query-param route for the static-export reason documented in tasks/detail/TaskDetail.tsx.
  const id = useSearchParams().get("id");

  const [data, setData] = useState<{
    id: string;
    board: BoardExtended;
    tasks: TaskExtended[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  useEffect(() => {
    if (!api || !id) return;
    let cancelled = false;
    const toUuid = api.toUUID(id);

    Promise.all([
      api.portalClient.getBoardApi().get(toUuid),
      api.portalClient.getBoardApi().searchTasks(toUuid, {} as never, 1, TASK_PREVIEW),
    ])
      .then(([board, tasks]) => {
        if (cancelled) return;
        setData({ id, board, tasks: tasks.items });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Board detail load failed", err);
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
        <Spinner diameter={18} /> Loading board…
      </p>
    );
  }

  if (error) {
    return (
      <div>
        <p className="state error" role="alert">
          Error: {error}
        </p>
        <Link href="/boards">← Back to boards</Link>
      </div>
    );
  }

  if (!data) return null;
  const { board, tasks } = data;

  return (
    <div className="project-detail">
      <Link href="/boards" className="project-detail-back">
        ← Boards
      </Link>

      <div className="project-detail-head">
        <div className="project-detail-head-main">
          <h1>{board.name}</h1>
          <span className="chip neutral">{String(board.status)}</span>
        </div>
        <div className="project-detail-head-actions">
          <button type="button" className="btn-stroked" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn-stroked" onClick={() => setCreateTaskOpen(true)}>
            + Create Task
          </button>
        </div>
      </div>

      <EditBoardDrawer board={board} open={editing} onClose={() => setEditing(false)} />

      <CreateTaskDrawer
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        board={{ id: board.id, name: board.name }}
        activityId={tasks[0]?.activityId}
      />

      {board.description && (
        <div className="project-detail-desc">
          <MarkdownViewer content={board.description} />
        </div>
      )}

      <dl className="project-detail-meta">
        <div>
          <dt>Type</dt>
          <dd>{String(board.boardType)}</dd>
        </div>
        <div>
          <dt>Project</dt>
          <dd>
            {board.project && board.projectId ? (
              <Link href={`/projects/detail?id=${board.projectId}`}>{board.project.name}</Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{board.owner?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Tasks</dt>
          <dd>{board.taskCount ?? 0}</dd>
        </div>
      </dl>

      <section className="project-detail-section">
        <h2>
          Tasks <span className="count">{tasks.length}</span>
        </h2>
        <p className="subtitle">
          <code>getBoardApi().searchTasks(id, body, page, size)</code> — the board&apos;s own tasks.
        </p>
        {tasks.length === 0 ? (
          <p className="state">No tasks on this board.</p>
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
    </div>
  );
}
