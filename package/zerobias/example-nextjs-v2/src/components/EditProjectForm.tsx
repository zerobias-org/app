"use client";

import { useMemo, useState } from "react";
import {
  MembershipPolicy,
  ProjectStatus,
  ProjectVisibility,
  UpdateProject,
} from "@zerobias-com/platform-sdk";
import type { ProjectExtended } from "@zerobias-com/portal-sdk";
import type { EnumValue } from "@zerobias-org/types-core-js";
import { CallReveal, objectLiteral } from "@/components/CallReveal";
import { exampleUpdatedProject } from "@/lib/fixtures";

/**
 * EditProjectForm — the code-reveal EDIT companion to CreateProjectForm (see docs/write-demos.md).
 * Where create builds a full `NewProject`, edit builds a DELTA: `UpdateProject` is partial (every
 * field optional), so you send ONLY what changed. That's the whole lesson here.
 *
 * The form is seeded from the record you're viewing. On each keystroke it rebuilds a real
 * `UpdateProject`, assigning only fields whose value differs from the original — unchanged fields
 * stay absent and `objectLiteral` (in the call panel) drops them, so the call shows the exact delta
 * the server would receive. A plain object typed as `UpdateProject` is what typechecks the shape
 * against the installed SDK (anti-rot). `null` (clear a field) survives to the wire because nothing
 * round-trips through a serializer. Nothing is sent.
 */

const STATUSES = ProjectStatus.values;
const VISIBILITIES = ProjectVisibility.values;
const POLICIES = MembershipPolicy.values;

export function EditProjectForm({ project }: { project: ProjectExtended }) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<EnumValue>(pick(STATUSES, String(project.status)));
  const [visibility, setVisibility] = useState<EnumValue>(
    pick(VISIBILITIES, String(project.visibility)),
  );
  const [policy, setPolicy] = useState<EnumValue>(
    pick(POLICIES, String(project.membershipPolicy)),
  );
  const [description, setDescription] = useState(project.description ?? "");

  // The REAL delta, rebuilt from live input. A plain object typed as `UpdateProject`: only changed
  // fields are assigned, so an untouched field stays absent. `description` cleared to empty => null,
  // which is how UpdateProject expresses "clear this field" (vs. absent = "leave unchanged") — and
  // null survives to the wire because nothing round-trips through a serializer.
  const request = useMemo<UpdateProject>(() => {
    const delta: UpdateProject = {};
    const nextName = name.trim();
    if (nextName && nextName !== project.name) delta.name = nextName;
    if (String(status) !== String(project.status)) delta.status = status;
    if (String(visibility) !== String(project.visibility)) delta.visibility = visibility;
    if (String(policy) !== String(project.membershipPolicy)) delta.membershipPolicy = policy;
    const nextDesc = description.trim();
    if (nextDesc !== (project.description ?? "")) delta.description = nextDesc || null;
    return delta;
  }, [name, status, visibility, policy, description, project]);

  const changedCount = useMemo(
    () => Object.values(request).filter((v) => v !== undefined).length,
    [request],
  );

  // The call WITH its live delta inline — one panel. The literal is rendered from the real
  // `UpdateProject` above, so what is shown is exactly the delta that would be sent.
  const call = [
    `// UpdateProject is partial — send ONLY the fields that changed.`,
    `const changes: UpdateProject = ${objectLiteral(request)};`,
    `const updated = await platformClient.getProjectApi().update(projectId, changes);`,
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
          <label htmlFor="ep-name">Name</label>
          <input
            id="ep-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q1 Evidence Collection"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ep-visibility">Visibility</label>
          <select
            id="ep-visibility"
            value={String(visibility)}
            onChange={(e) => setVisibility(pick(VISIBILITIES, e.target.value))}
          >
            {VISIBILITIES.map((v) => (
              <option key={String(v)} value={String(v)}>
                {cap(String(v))}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="ep-status">Status</label>
          <select
            id="ep-status"
            value={String(status)}
            onChange={(e) => setStatus(pick(STATUSES, e.target.value))}
          >
            {STATUSES.map((v) => (
              <option key={String(v)} value={String(v)}>
                {cap(String(v))}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="ep-policy">Membership policy</label>
          <select
            id="ep-policy"
            value={String(policy)}
            onChange={(e) => setPolicy(pick(POLICIES, e.target.value))}
          >
            {POLICIES.map((v) => (
              <option key={String(v)} value={String(v)}>
                {cap(String(v))}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="ep-desc">Description</label>
          <textarea
            id="ep-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Markdown supported"
          />
        </div>
      </div>

      <div className="create-form-code">
        <CallReveal call={call} response={exampleUpdatedProject} responseType="ProjectExtended" />
      </div>
    </form>
  );
}

function pick(values: readonly EnumValue[], selected: string): EnumValue {
  return values.find((v) => String(v) === selected) ?? values[0];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
