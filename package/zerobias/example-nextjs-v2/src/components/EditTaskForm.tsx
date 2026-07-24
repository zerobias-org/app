"use client";

import { useMemo, useState } from "react";
import { UpdateTask } from "@zerobias-com/platform-sdk";
import type { TaskExtended } from "@zerobias-com/portal-sdk";
import type { UUID } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { CallReveal, objectLiteral } from "@/components/CallReveal";
import { exampleUpdatedTask } from "@/lib/fixtures";

/**
 * EditTaskForm — the code-reveal EDIT demo, and the money shot of the whole task surface: you do
 * NOT set `status = "done"`. Status is a WORKFLOW move. The task carries `nextTransitions` (the
 * moves available from its current status); you pick one and send its id as `UpdateTask.transitionId`.
 * The server runs the transition and returns the task in its new status.
 *
 * Like every edit demo this builds a DELTA — `UpdateTask` is partial, so only changed fields are
 * assigned (the rest stay absent and `objectLiteral` drops them). A plain object typed as
 * `UpdateTask` typechecks the shape; `null` (unassign a party) survives to the wire. Nothing is sent.
 */
export function EditTaskForm({ task }: { task: TaskExtended }) {
  const { api } = useSession();
  const [transitionId, setTransitionId] = useState("");
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority?.value?.toString() ?? "");
  const [assigned, setAssigned] = useState(task.assigned?.principalId?.toString() ?? "");
  const [accountable, setAccountable] = useState(task.accountable?.principalId?.toString() ?? "");

  const transitions = task.nextTransitions ?? [];

  // The REAL delta, rebuilt from live input. A plain object typed as `UpdateTask`: only changed
  // fields are assigned; the rest stay absent. `assigned`/`accountable` cleared => null (unassign),
  // which survives to the wire because nothing round-trips through a serializer.
  const request = useMemo<UpdateTask | null>(() => {
    if (!api) return null;
    const toU = (s: string): UUID | undefined => {
      try {
        return api.toUUID(s.trim());
      } catch {
        return undefined;
      }
    };
    const delta: UpdateTask = {};

    if (transitionId) {
      const t = toU(transitionId);
      if (t) delta.transitionId = t; // the workflow move — this is how status changes
    }

    const nn = name.trim();
    if (nn && nn !== task.name) delta.name = nn;

    const nd = description.trim();
    if (nd !== (task.description ?? "")) delta.description = nd;

    const origP = task.priority?.value;
    if (priority.trim() !== "") {
      const np = Number(priority);
      if (!Number.isNaN(np) && np !== origP) delta.priority = np;
    }

    // Nullable party ids: changed-to-blank => null (unassign); changed-to-valid => the new id;
    // mid-typing invalid => left out (unchanged).
    const applyParty = (
      cur: string,
      orig: UUID | undefined,
      set: (v: UUID | null) => void,
    ) => {
      const origStr = orig?.toString() ?? "";
      const curTrim = cur.trim();
      if (curTrim === origStr) return;
      if (!curTrim) set(null);
      else {
        const u = toU(curTrim);
        if (u) set(u);
      }
    };
    applyParty(assigned, task.assigned?.principalId, (v) => (delta.assigned = v));
    applyParty(accountable, task.accountable?.principalId, (v) => (delta.accountable = v));

    return delta;
  }, [api, transitionId, name, description, priority, assigned, accountable, task]);

  const changedCount = useMemo(
    () => (request ? Object.values(request).filter((v) => v !== undefined).length : 0),
    [request],
  );

  // The call WITH its live delta inline — one panel. `transitionId` shows up here the moment you
  // pick a move (it must be one of task.nextTransitions), never a status string.
  const call = [
    `// Status is a workflow transition, not a status string — transitionId is one of task.nextTransitions.`,
    `const changes: UpdateTask = ${objectLiteral(request ?? undefined)};`,
    `const updated = await platformClient.getTaskApi().update(taskId, changes);`,
  ].join("\n");

  return (
    <form className="create-form" onSubmit={(e) => e.preventDefault()}>
      <div className="create-form-fields">
        <p className="create-form-note">
          Editing sends a <strong>delta</strong> — only the fields you change appear in the request.
          {changedCount === 0 ? (
            <> Nothing changed yet, so the payload is empty <code>{"{}"}</code>.</>
          ) : (
            <>
              {" "}
              {changedCount} field{changedCount === 1 ? "" : "s"} changed.
            </>
          )}
        </p>

        <div className="field">
          <label htmlFor="et-transition">
            Status <span className="field-opt">workflow transition</span>
          </label>
          <select
            id="et-transition"
            value={transitionId}
            onChange={(e) => setTransitionId(e.target.value)}
            disabled={transitions.length === 0}
          >
            <option value="">
              {transitions.length === 0
                ? `no transitions from "${task.status}"`
                : `— keep "${task.status}" —`}
            </option>
            {transitions.map((tr) => (
              <option key={tr.id.toString()} value={tr.id.toString()}>
                {tr.name} (→ {tr.status})
              </option>
            ))}
          </select>
          <p className="field-hint">
            Current status is <code>{task.status}</code>. Moving it means picking a transition — the
            payload carries <code>transitionId</code>, never a status string.
          </p>
        </div>

        <div className="field">
          <label htmlFor="et-name">Name</label>
          <input
            id="et-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="et-desc">Description</label>
          <textarea
            id="et-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Markdown supported"
          />
        </div>

        <div className="field">
          <label htmlFor="et-priority">
            Priority <span className="field-opt">numeric</span>
          </label>
          <input
            id="et-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="et-assigned">
            Assigned (R) <span className="field-opt">party id</span>
          </label>
          <input
            id="et-assigned"
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            placeholder="responsible party UUID (blank to unassign)"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="et-accountable">
            Accountable (A) <span className="field-opt">party id</span>
          </label>
          <input
            id="et-accountable"
            value={accountable}
            onChange={(e) => setAccountable(e.target.value)}
            placeholder="accountable party UUID (blank to unassign)"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="create-form-code">
        <CallReveal call={call} response={exampleUpdatedTask} responseType="TaskExtended" />
      </div>
    </form>
  );
}
