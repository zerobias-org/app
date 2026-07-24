"use client";

import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { RESPONSE_SHAPES } from "@/lib/response-shapes.generated";

/**
 * TypeShapePopover — a small "TS" badge shown next to a response's type name. Hover (or click to
 * pin) reveals a popover with the REAL class shape, extracted from the installed SDK at build time
 * (`src/lib/response-shapes.generated.ts`, via `npm run extract:shapes`) so it can never drift. The
 * shape renders in a `CodeBlock`, whose built-in copy button (forced visible here) lets a dev paste
 * the type into their own code as a reference.
 */
export function TypeShapePopover({ typeName }: { typeName: string }) {
  // Hover reveals the popover; clicking the badge PINS it (so it survives moving the cursor away,
  // e.g. to select/copy the shape). Click again to unpin. `open` is either condition.
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const shape = RESPONSE_SHAPES[typeName];

  // Close on a short delay so the cursor has time to travel from the badge across the gap into the
  // popover without it vanishing first; re-entering (badge OR popover) cancels the pending close.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setHovered(false), 250);
  };
  useEffect(() => cancelClose, []);

  if (!shape) return null;

  return (
    <span
      className="type-popover-wrap"
      onMouseEnter={() => {
        cancelClose();
        setHovered(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="type-badge"
        aria-expanded={open}
        aria-pressed={pinned}
        aria-label={`Show the ${typeName} type shape`}
        onClick={() => setPinned((p) => !p)}
      >
        TS
      </button>
      {open && (
        <div className="type-popover" role="dialog" aria-label={`${typeName} type shape`}>
          <div className="type-popover-head">
            <code>{typeName}</code>
            <span className="type-popover-hint">@zerobias-com/platform-sdk</span>
          </div>
          <CodeBlock value={shape} lang="typescript" />
        </div>
      )}
    </span>
  );
}
