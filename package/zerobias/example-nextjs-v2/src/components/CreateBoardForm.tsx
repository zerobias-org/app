"use client";

import { useMemo, useState } from "react";
import { BoardStatus, BoardType, NewBoard } from "@zerobias-com/platform-sdk";
import type { EnumValue } from "@zerobias-org/types-core-js";
import type { UUID } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { CallReveal, objectLiteral } from "@/components/CallReveal";
import { exampleBoard } from "@/lib/fixtures";

/**
 * CreateBoardForm — the board sibling of CreateProjectForm, and the same code-reveal create demo
 * (see docs/write-demos.md). It builds a REAL `NewBoard` from live input (typechecking the shape
 * against the installed SDK = anti-rot) and reveals the call + payload + an obfuscated response. It
 * never calls `create`.
 *
 * `projectId`, when set, comes from the project you opened the drawer from — a board is placed in
 * the containment chain by giving `NewBoard` a `projectId`. Opened standalone (from the boards
 * list), it's an optional text field instead. Boards live on the WRITE surface: `platformClient`.
 */

const STATUSES = BoardStatus.values;
const TYPES = BoardType.values;

export function CreateBoardForm({ projectId }: { projectId?: UUID }) {
  const { api } = useSession();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<EnumValue>(BoardStatus.Active);
  const [boardType, setBoardType] = useState<EnumValue>(BoardType.Kanban);
  const [description, setDescription] = useState("");
  const [projectIdInput, setProjectIdInput] = useState("");

  // The REAL request object, rebuilt from live input. A plain object typed as `NewBoard` — the
  // compiler enforces the model's required fields (a missing one is a build error). Values are the
  // real SDK types (enum members, UUID); nothing is coerced here. Nothing is sent.
  const request = useMemo<NewBoard>(() => {
    let projUuid: UUID | undefined = projectId;
    if (!projUuid) {
      const trimmed = projectIdInput.trim();
      if (trimmed && api) {
        try {
          projUuid = api.toUUID(trimmed);
        } catch {
          projUuid = undefined; // not a UUID yet — omit rather than break the payload
        }
      }
    }
    return {
      name: name.trim() || "Untitled board",
      status,
      boardType,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(projUuid ? { projectId: projUuid } : {}), // the board's containing project
    };
  }, [name, status, boardType, description, projectIdInput, projectId, api]);

  // The call WITH its payload inline — one panel. The literal is rendered from the real `NewBoard`
  // above, so what is shown is exactly what was built.
  const call = [
    `const board: NewBoard = ${objectLiteral(request)};`,
    `const created = await platformClient.getBoardApi().create(board);`,
  ].join("\n");

  return (
    <form className="create-form" onSubmit={(e) => e.preventDefault()}>
      <div className="create-form-fields">
        {projectId && (
          <p className="create-form-note">
            Placing this board in a <strong>project</strong> — <code>projectId</code> is set from the
            project you opened this from.
          </p>
        )}

        <div className="field">
          <label htmlFor="cb-name">Name</label>
          <input
            id="cb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q1 Controls Kanban"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="cb-type">
            Board type <span className="field-req">required</span>
          </label>
          <select
            id="cb-type"
            value={String(boardType)}
            onChange={(e) => setBoardType(pick(TYPES, e.target.value))}
          >
            {TYPES.map((v) => (
              <option key={String(v)} value={String(v)}>
                {cap(String(v))}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cb-status">
            Status <span className="field-req">required</span>
          </label>
          <select
            id="cb-status"
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
          <label htmlFor="cb-desc">Description</label>
          <textarea
            id="cb-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Markdown supported"
          />
        </div>

        {!projectId && (
          <div className="field">
            <label htmlFor="cb-project">
              Project id <span className="field-opt">optional</span>
            </label>
            <input
              id="cb-project"
              value={projectIdInput}
              onChange={(e) => setProjectIdInput(e.target.value)}
              placeholder="a project UUID to place the board in"
              autoComplete="off"
            />
          </div>
        )}
      </div>

      <div className="create-form-code">
        <CallReveal call={call} response={exampleBoard} responseType="BoardExtended" />
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
