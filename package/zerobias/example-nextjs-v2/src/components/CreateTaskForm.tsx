"use client";

import { useMemo, useState } from "react";
import { NewTask, NewTaskLink } from "@zerobias-com/platform-sdk";
import type { UUID } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { CallReveal, objectLiteral } from "@/components/CallReveal";
import { splitUuidList } from "@/lib/uuid-list";
import { exampleTask } from "@/lib/fixtures";

/**
 * CreateTaskForm — the code-reveal create demo for the richest write on the surface (see
 * docs/write-demos.md). `NewTask` has FOUR required fields, and that's the lesson:
 *
 *   activityId  — a task hangs off an activity; it does not float.
 *   approvers[] — RACI is first-class; these are party ids (may be empty, but must be present).
 *   notified[]  — same.
 *   links[]     — links to resources (each a NewTaskLink); may be empty.
 *
 * Everything else (name, description, priority, boardId, assigned, accountable) is optional and set
 * as a property after construction. Building a REAL `NewTask` typechecks the whole shape against the
 * installed SDK (anti-rot). Nothing is sent — this is `platformClient.getTaskApi().create`, revealed.
 *
 * The party/link ids are entered by hand here. A real app would resolve them with a user/resource
 * picker (e.g. `UserApi.search()`); that autocomplete is deferred — manual UUID entry keeps this
 * demo about the CALL shape, not the picker.
 */

// Stand-in shown until a real activityId is entered, so the payload always constructs (activityId
// is required and non-optional). Obviously fake — all zeros.
const PLACEHOLDER_ACTIVITY = "00000000-0000-0000-0000-000000000000";

export function CreateTaskForm({
  boardId,
  activityId: activityIdProp,
}: {
  boardId?: UUID;
  activityId?: UUID;
}) {
  const { api } = useSession();
  const [activityId, setActivityId] = useState(activityIdProp?.toString() ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [assigned, setAssigned] = useState("");
  const [accountable, setAccountable] = useState("");
  const [approversRaw, setApproversRaw] = useState("");
  const [notifiedRaw, setNotifiedRaw] = useState("");
  const [linksRaw, setLinksRaw] = useState("");

  // The REAL request object, rebuilt from live input. A plain object typed as `NewTask` — the
  // compiler enforces the four required fields (activityId + the three arrays); an optional the user
  // did not fill simply never appears. Values are the real SDK types (each link a `NewTaskLink`
  // literal), so nothing is coerced here. Nothing is sent.
  const request = useMemo<NewTask | null>(() => {
    if (!api) return null;
    const toU = (s: string): UUID | undefined => {
      try {
        return api.toUUID(s.trim());
      } catch {
        return undefined; // not a UUID yet — omit rather than break the payload
      }
    };
    const toList = (raw: string): UUID[] =>
      splitUuidList(raw).flatMap((s) => {
        const u = toU(s);
        return u ? [u] : [];
      });

    const p = Number(priority);
    const asg = toU(assigned);
    const acc = toU(accountable);
    const task: NewTask = {
      activityId: toU(activityId) ?? api.toUUID(PLACEHOLDER_ACTIVITY), // required — hangs off an activity
      approvers: toList(approversRaw), // required (may be empty)
      notified: toList(notifiedRaw), // required (may be empty)
      links: toList(linksRaw).map((resourceId): NewTaskLink => ({ resourceId })), // required (may be empty)
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(priority.trim() && !Number.isNaN(p) ? { priority: p } : {}),
      ...(boardId ? { boardId } : {}),
      ...(asg ? { assigned: asg } : {}),
      ...(acc ? { accountable: acc } : {}),
    };
    return task;
  }, [api, activityId, approversRaw, notifiedRaw, linksRaw, name, description, priority, boardId, assigned, accountable]);

  // The call WITH its payload inline — one panel. The literal is rendered from the real `NewTask`
  // above, so what is shown is exactly what was built (and would be sent).
  const call = [
    `const task: NewTask = ${objectLiteral(request ?? undefined)};`,
    `const created = await platformClient.getTaskApi().create(task);`,
  ].join("\n");

  return (
    <form className="create-form" onSubmit={(e) => e.preventDefault()}>
      <div className="create-form-fields">
        <p className="create-form-note">
          <code>NewTask</code> requires four fields: <code>activityId</code> and the arrays{" "}
          <code>approvers</code>, <code>notified</code>, <code>links</code> (which may be empty). Ids
          are entered by hand here — a real app would resolve them with a user/resource picker.
        </p>

        {boardId && (
          <p className="create-form-note">
            Creating on a <strong>board</strong> — <code>boardId</code> is set from the board you
            opened this from.
          </p>
        )}

        <div className="field">
          <label htmlFor="ct-activity">
            Activity id <span className="field-req">required</span>
          </label>
          <input
            id="ct-activity"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            placeholder="the activity this task hangs off"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-name">Name</label>
          <input
            id="ct-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collect SOC 2 access-review evidence"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-desc">Description</label>
          <textarea
            id="ct-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Markdown supported"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-priority">
            Priority <span className="field-opt">numeric</span>
          </label>
          <input
            id="ct-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="a priority value, e.g. 1"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-assigned">
            Assigned (R) <span className="field-opt">party id</span>
          </label>
          <input
            id="ct-assigned"
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            placeholder="responsible party UUID"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-accountable">
            Accountable (A) <span className="field-opt">party id</span>
          </label>
          <input
            id="ct-accountable"
            value={accountable}
            onChange={(e) => setAccountable(e.target.value)}
            placeholder="accountable party UUID"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-approvers">
            Approvers <span className="field-req">required</span>
          </label>
          <input
            id="ct-approvers"
            value={approversRaw}
            onChange={(e) => setApproversRaw(e.target.value)}
            placeholder="party UUIDs, comma-separated (may be empty)"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-notified">
            Notified <span className="field-req">required</span>
          </label>
          <input
            id="ct-notified"
            value={notifiedRaw}
            onChange={(e) => setNotifiedRaw(e.target.value)}
            placeholder="party UUIDs, comma-separated (may be empty)"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ct-links">
            Links <span className="field-req">required</span>
          </label>
          <input
            id="ct-links"
            value={linksRaw}
            onChange={(e) => setLinksRaw(e.target.value)}
            placeholder="resource UUIDs, comma-separated (may be empty)"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="create-form-code">
        <CallReveal call={call} response={exampleTask} responseType="TaskExtended" />
      </div>
    </form>
  );
}
