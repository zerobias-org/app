"use client";

import { useMemo, useState } from "react";
import {
  MembershipPolicy,
  NewProject,
  ProjectStatus,
  ProjectVisibility,
} from "@zerobias-com/platform-sdk";
import type { EnumValue } from "@zerobias-org/types-core-js";
import type { UUID } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { CallReveal, objectLiteral } from "@/components/CallReveal";
import { exampleProject } from "@/lib/fixtures";

/**
 * CreateProjectForm — a code-reveal create demo (see docs/write-demos.md). It builds a REAL
 * `NewProject` from live input (so the payload is accurate and the shape is typechecked against
 * the installed SDK) and reveals the call — payload inline — plus an obfuscated response. It never
 * calls `create`.
 *
 * `parentId`, when set, comes from the project you opened the drawer from — creating a sub-project
 * is just a `NewProject` with `parentId`. That's the whole "how do I nest a project" lesson.
 */

const STATUSES = ProjectStatus.values;
const VISIBILITIES = ProjectVisibility.values;
const POLICIES = MembershipPolicy.values;

export function CreateProjectForm({ parentId }: { parentId?: UUID }) {
  const { api } = useSession();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<EnumValue>(ProjectStatus.Draft);
  const [visibility, setVisibility] = useState<EnumValue>(ProjectVisibility.Private);
  const [policy, setPolicy] = useState<EnumValue>(MembershipPolicy.Private);
  const [description, setDescription] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");

  // The REAL request object, rebuilt from live input. A plain object typed as `NewProject` — the
  // compiler enforces the model's required fields (a missing one is a build error, which
  // `NewProject.newInstance(obj: any)` would NOT catch). Values are the real SDK types (enum
  // members, UUID), so nothing is coerced or serialized here. Nothing is sent.
  const request = useMemo<NewProject>(() => {
    let typeUuid: UUID | undefined;
    const trimmed = projectTypeId.trim();
    if (trimmed && api) {
      try {
        typeUuid = api.toUUID(trimmed);
      } catch {
        typeUuid = undefined; // not a UUID yet — omit rather than break the payload
      }
    }
    return {
      name: name.trim() || "Untitled project",
      status,
      visibility,
      membershipPolicy: policy,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(parentId ? { parentId } : {}), // set => this is a sub-project
      ...(typeUuid ? { projectTypeId: typeUuid } : {}),
    };
  }, [name, status, visibility, policy, description, projectTypeId, parentId, api]);

  // The call WITH its payload inline — one panel, not a signature plus a separate JSON blob. The
  // literal is rendered from the real `NewProject` above, so what is shown is exactly what was built.
  const call = [
    `const project: NewProject = ${objectLiteral(request)};`,
    `const created = await platformClient.getProjectApi().create(project);`,
  ].join("\n");

  return (
    <form className="create-form" onSubmit={(e) => e.preventDefault()}>
      <div className="create-form-fields">
      {parentId && (
        <p className="create-form-note">
          Creating a <strong>sub-project</strong> — <code>parentId</code> is set from the project
          you opened this from.
        </p>
      )}

      <div className="field">
        <label htmlFor="cp-name">Name</label>
        <input
          id="cp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Q1 Evidence Collection"
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="cp-visibility">
          Visibility <span className="field-req">required</span>
        </label>
        <select
          id="cp-visibility"
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
        <label htmlFor="cp-status">
          Status <span className="field-req">required</span>
        </label>
        <select
          id="cp-status"
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
        <label htmlFor="cp-policy">
          Membership policy <span className="field-req">required</span>
        </label>
        <select
          id="cp-policy"
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
        <label htmlFor="cp-desc">Description</label>
        <textarea
          id="cp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Markdown supported"
        />
      </div>

      <div className="field">
        <label htmlFor="cp-type">
          Project type id <span className="field-opt">optional</span>
        </label>
        <input
          id="cp-type"
          value={projectTypeId}
          onChange={(e) => setProjectTypeId(e.target.value)}
          placeholder="a project-type UUID from your org"
          autoComplete="off"
        />
      </div>

      </div>

      <div className="create-form-code">
        <CallReveal call={call} response={exampleProject} responseType="ProjectExtended" />
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
