"use client";

import { useMemo, useState } from "react";
import { NewTask, NewTaskLink } from "@zerobias-com/platform-sdk";
import type { UUID } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { CallReveal } from "@/components/CallReveal";
import { splitUuidList } from "@/lib/uuid-list";
import { exampleTask } from "@/lib/fixtures";

/**
 * CreateTaskForm — the code-reveal create demo for the richest write on the surface (see
 * docs/write-demos.md). `NewTask` has FOUR required fields, and that's the lesson:
 *
 *   activityId  — a task hangs off a compliance activity; it does not float.
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

  // The REAL request object, rebuilt from live input. Constructing NewTask + NewTaskLink here is
  // what typechecks the call shape against the installed platform-sdk. Nothing is sent.
  const request = useMemo(() => {
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

    const task = new NewTask(
      toU(activityId) ?? api.toUUID(PLACEHOLDER_ACTIVITY), // required
      toList(approversRaw), // required (may be empty)
      toList(notifiedRaw), // required (may be empty)
      toList(linksRaw).map((resourceId) => new NewTaskLink(resourceId)), // required (may be empty)
    );
    if (name.trim()) task.name = name.trim();
    if (description.trim()) task.description = description.trim();
    const p = Number(priority);
    if (priority.trim() && !Number.isNaN(p)) task.priority = p;
    if (boardId) task.boardId = boardId;
    const asg = toU(assigned);
    if (asg) task.assigned = asg;
    const acc = toU(accountable);
    if (acc) task.accountable = acc;
    return task;
  }, [api, activityId, approversRaw, notifiedRaw, linksRaw, name, description, priority, boardId, assigned, accountable]);

  const call = [
    `const task = new NewTask(`,
    `  activityId,                 // required — a task hangs off an activity`,
    `  approvers, notified, links, // required arrays (may be empty)`,
    `);`,
    `task.name = name;             // everything else is optional`,
    `task.priority = priority;${boardId ? "\ntask.boardId = boardId;" : ""}`,
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
            placeholder="the compliance activity this task hangs off"
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
        <CallReveal call={call} request={request ?? undefined} response={exampleTask} />
      </div>
    </form>
  );
}
