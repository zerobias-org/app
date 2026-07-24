"use client";

import { useMemo, useState } from "react";
import { BoardStatus, BoardType, UpdateBoard } from "@zerobias-com/platform-sdk";
import type { BoardExtended } from "@zerobias-com/portal-sdk";
import type { EnumValue } from "@zerobias-org/types-core-js";
import { CallReveal, objectLiteral } from "@/components/CallReveal";
import { exampleUpdatedBoard } from "@/lib/fixtures";

/**
 * EditBoardForm — the board sibling of EditProjectForm. Like every edit demo it builds a DELTA:
 * `UpdateBoard` is partial (name/description/status/boardType, all optional), so you send ONLY what
 * changed. The form is seeded from the record you're viewing; on each keystroke it rebuilds a real
 * `UpdateBoard`, assigning only changed fields — the rest stay absent and `objectLiteral` drops
 * them, so the call panel shows the exact delta. `null` (clear a field) survives to the wire.
 * Nothing is sent.
 */

const STATUSES = BoardStatus.values;
const TYPES = BoardType.values;

export function EditBoardForm({ board }: { board: BoardExtended }) {
  const [name, setName] = useState(board.name);
  const [status, setStatus] = useState<EnumValue>(pick(STATUSES, String(board.status)));
  const [boardType, setBoardType] = useState<EnumValue>(pick(TYPES, String(board.boardType)));
  const [description, setDescription] = useState(board.description ?? "");

  // The REAL delta, rebuilt from live input. A plain object typed as `UpdateBoard`: only changed
  // fields are assigned. `description` cleared to empty => null (partial semantics: null = clear,
  // absent = leave unchanged) — and null survives to the wire (no serializer round-trip).
  const request = useMemo<UpdateBoard>(() => {
    const delta: UpdateBoard = {};
    const nextName = name.trim();
    if (nextName && nextName !== board.name) delta.name = nextName;
    if (String(status) !== String(board.status)) delta.status = status;
    if (String(boardType) !== String(board.boardType)) delta.boardType = boardType;
    const nextDesc = description.trim();
    if (nextDesc !== (board.description ?? "")) delta.description = nextDesc || null;
    return delta;
  }, [name, status, boardType, description, board]);

  const changedCount = useMemo(
    () => Object.values(request).filter((v) => v !== undefined).length,
    [request],
  );

  // The call WITH its live delta inline — one panel. Rendered from the real `UpdateBoard` above.
  const call = [
    `// UpdateBoard is partial — send ONLY the fields that changed.`,
    `const changes: UpdateBoard = ${objectLiteral(request)};`,
    `const updated = await platformClient.getBoardApi().update(boardId, changes);`,
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
          <label htmlFor="eb-name">Name</label>
          <input
            id="eb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q1 Controls Kanban"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="eb-type">Board type</label>
          <select
            id="eb-type"
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
          <label htmlFor="eb-status">Status</label>
          <select
            id="eb-status"
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
          <label htmlFor="eb-desc">Description</label>
          <textarea
            id="eb-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Markdown supported"
          />
        </div>
      </div>

      <div className="create-form-code">
        <CallReveal call={call} response={exampleUpdatedBoard} responseType="BoardExtended" />
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
