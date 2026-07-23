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
import { CallReveal } from "@/components/CallReveal";
import { exampleProject } from "@/lib/fixtures";

/**
 * CreateProjectForm — a code-reveal create demo (see docs/write-demos.md). It builds a REAL
 * `NewProject` from live input (so the payload is accurate and the shape is typechecked against
 * the installed SDK) and reveals the call + payload + an obfuscated response. It never calls
 * `create`.
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

  // The REAL request object, rebuilt from live input. Constructing NewProject here is what
  // typechecks the call shape against the installed platform-sdk. Nothing is sent.
  const request = useMemo(() => {
    let typeUuid: UUID | undefined;
    const trimmed = projectTypeId.trim();
    if (trimmed && api) {
      try {
        typeUuid = api.toUUID(trimmed);
      } catch {
        typeUuid = undefined; // not a UUID yet — omit rather than break the payload
      }
    }
    return new NewProject(
      name.trim() || "Untitled project",
      status,
      visibility,
      policy,
      description.trim() || undefined,
      undefined, // boundaryId
      parentId, // set => this is a sub-project
      typeUuid,
    );
  }, [name, status, visibility, policy, description, projectTypeId, parentId, api]);

  const call = [
    `const project = new NewProject(`,
    `  name, status, visibility, membershipPolicy,`,
    `  description, /* boundaryId */ undefined,${parentId ? " parentId," : ""}`,
    `);`,
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
        <CallReveal call={call} request={request} response={exampleProject} />
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
