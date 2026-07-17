"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TaskExtended } from "@zerobias-com/portal-sdk";
import type { TaskComment } from "@zerobias-com/platform-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";
import { Spinner } from "@/components/Spinner";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { CommentComposer } from "@/components/CommentComposer";
import { EditTaskDrawer } from "@/components/EditTaskDrawer";

/**
 * Task detail — the demo that shows BOTH task clients working together, because the platform
 * splits the surface and a consumer has to know which client owns what:
 *
 *   portalClient.getTaskApi().get(id)          -> the task itself (read/search side)
 *   platformClient.getTaskApi().listSubtasks(id) -> child tasks (PagedResults<TaskExtended>)
 *   platformClient.getTaskApi().listComments(id) -> the comment thread (PagedResults<TaskComment>)
 *
 * Reads that "search" live on portal; the richer per-task reads (subtasks, comments,
 * attachments) and every WRITE live on platform. Same task id, two clients.
 *
 * The task also carries `nextTransitions` — the workflow moves available from its current
 * status. That is how status changes happen (a transition, not a status string); we surface
 * them read-only here, and the create/update demo will act on them.
 */
export function TaskDetail() {
  const { api } = useSession();
  // Task detail is a query-param route (`/tasks/detail?id=…`), not a `[id]` path segment: the
  // app is a static export served straight from S3 with no server and no deep-link fallback, so
  // a runtime-only task id can't be a prerendered path. A single static page reading `?id`
  // works for both in-app navigation and hard refresh.
  const id = useSearchParams().get("id");

  // Data is tagged with the id it belongs to, so `loading` can be DERIVED (data is stale
  // whenever `loadedId !== id`). That keeps all setState inside async callbacks — no
  // synchronous setState in the effect (react-hooks/set-state-in-effect) — and it also
  // prevents the previous task's detail from flashing while a new one loads.
  const [data, setData] = useState<{
    id: string;
    task: TaskExtended;
    subtasks: TaskExtended[];
    comments: TaskComment[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!api || !id) return;
    let cancelled = false;
    const toUuid = api.toUUID(id);

    Promise.all([
      // portal owns the task read...
      api.portalClient.getTaskApi().get(toUuid),
      // ...platform owns subtasks + comments.
      api.platformClient.getTaskApi().listSubtasks(toUuid),
      api.platformClient.getTaskApi().listComments(toUuid),
    ])
      .then(([task, subs, cmts]) => {
        if (cancelled) return;
        setData({ id, task, subtasks: subs.items, comments: cmts.items });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Task detail load failed", err);
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
        <Spinner diameter={18} /> Loading task…
      </p>
    );
  }

  if (error) {
    return (
      <div>
        <p className="state error" role="alert">
          Error: {error}
        </p>
        <Link href="/tasks">← Back to tasks</Link>
      </div>
    );
  }

  if (!data) return null;
  const { task, subtasks, comments } = data;

  return (
    <div className="task-detail">
      <Link href="/tasks" className="task-detail-back">
        ← Tasks
      </Link>

      <div className="task-detail-head">
        <div>
          <span className="task-detail-code">{task.code}</span>
          <h1>{task.name}</h1>
        </div>
        <div className="project-detail-head-actions">
          <span className="chip neutral">{task.status}</span>
          <button type="button" className="btn-stroked" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
      </div>

      <EditTaskDrawer task={task} open={editing} onClose={() => setEditing(false)} />

      {task.description && (
        <div className="task-detail-desc">
          <MarkdownViewer content={task.description} />
        </div>
      )}

      {/* The compliance context every task hangs in. `get()` inflates all of it. */}
      <dl className="task-detail-meta">
        <div>
          <dt>Activity</dt>
          <dd>{task.activity?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Workflow</dt>
          <dd>{task.workflow?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{task.priority?.label ?? "—"}</dd>
        </div>
        <div>
          <dt>Board</dt>
          <dd>{task.board?.name ?? "—"}</dd>
        </div>
      </dl>

      {/* Available workflow moves from the current status — read-only here; the
          create/update demo will call these transitions. */}
      {task.nextTransitions?.length > 0 && (
        <section className="task-detail-section">
          <h2>Available transitions</h2>
          <div className="task-detail-transitions">
            {task.nextTransitions.map((tr) => (
              <span key={tr.id.toString()} className="chip neutral" title={`→ ${tr.status}`}>
                {tr.name}
              </span>
            ))}
          </div>
          <p className="task-detail-hint">
            <code>platformClient.getTaskApi().update(id, {"{ transitionId }"})</code> moves the
            task — status is a workflow transition, not a free-text field.
          </p>
        </section>
      )}

      <section className="task-detail-section">
        <h2>
          Subtasks <span className="count">{subtasks.length}</span>
        </h2>
        <p className="subtitle">
          <code>platformClient.getTaskApi().listSubtasks(id)</code>
        </p>
        {subtasks.length === 0 ? (
          <p className="state">No subtasks.</p>
        ) : (
          <ul className="task-detail-subtasks">
            {subtasks.map((s) => (
              <li key={s.id.toString()}>
                <Link href={`/tasks/detail?id=${s.id}`}>
                  <span className="task-detail-code">{s.code}</span>
                  {s.name}
                </Link>
                <span className="chip neutral">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="task-detail-section">
        <h2>
          Comments <span className="count">{comments.length}</span>
        </h2>
        <p className="subtitle">
          <code>platformClient.getTaskApi().listComments(id)</code>
        </p>
        {comments.length === 0 ? (
          <p className="state">No comments.</p>
        ) : (
          <ul className="task-detail-comments">
            {comments.map((c) => (
              <li key={c.id.toString()}>
                <div className="task-detail-comment-head">
                  <strong>{c.person?.name ?? c.party?.name ?? "Unknown"}</strong>
                  <time>{new Date(c.created.toString()).toLocaleString()}</time>
                </div>
                <MarkdownViewer content={c.commentMarkdown ?? c.commentTxt} />
              </li>
            ))}
          </ul>
        )}

        {/* The write side, code-reveal style: compose a Markdown comment and see the exact
            platform.addComment call + payload + example response. Nothing is posted. */}
        <CommentComposer taskId={task.id} />
      </section>
    </div>
  );
}
