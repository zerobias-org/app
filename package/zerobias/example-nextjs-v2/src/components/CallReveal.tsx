"use client";

import { CodeBlock } from "./CodeBlock";
import { TypeShapePopover } from "./TypeShapePopover";

/**
 * CallReveal — the code-reveal write-demo primitive (twin of example-angular-v2's `call-reveal.ts`).
 * It shows the code a consumer would write to perform a write, WITHOUT issuing it
 * (see docs/write-demos.md). Two stacked panels:
 *
 *   1. The call     — the invocation INCLUDING its payload, as TypeScript. Callers build the text
 *                     from the REAL SDK request object via {@link objectLiteral}, e.g.
 *                     `const project: NewProject = { name: "…", status: "draft" }`, so the code
 *                     shown cannot drift from what was actually constructed — that's the anti-rot
 *                     guarantee. (There used to be a separate "Request payload" JSON panel; it was
 *                     folded into this one so a reader sees the shape and the values together
 *                     instead of zipping a signature against a JSON blob below it.)
 *   2. Response     — an obfuscated fixture showing the return shape, labeled as a fixture; never
 *                     presented as a live result.
 *
 * Real UUIDs are truncated for display (`9b2e6f14…`). Nothing here calls the platform.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Truncate any full UUID to its first segment + an ellipsis, for display only. */
export function truncateUuids(text: string): string {
  return text.replace(UUID_RE, (id) => `${id.slice(0, 8)}…`);
}

/**
 * One value as it would appear in source. Arrays render as real `[...]` literals and nested plain
 * objects as `{ k: v }` literals (so e.g. `links: [{ resourceId: "…" }]` reads as code, not a
 * comma-joined string). SDK value types (UUID / enum / DateFormat) have a meaningful `toString` and
 * render as their wire string.
 */
function literalOf(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.length ? `[${value.map(literalOf).join(", ")}]` : "[]";
  }
  if (typeof value === "object") {
    // A plain object renders as a nested `{ k: v }` literal; an SDK value type (UUID / enum /
    // DateTime) stringifies to "[object Object]" only if plain, otherwise to its wire value.
    return String(value) === "[object Object]"
      ? inlineObjectLiteral(value)
      : JSON.stringify(String(value));
  }
  return JSON.stringify(String(value));
}

/** A nested object on one line — `{ key: value, ... }`; `undefined`-valued keys are dropped. */
function inlineObjectLiteral(value: unknown): string {
  const entries = Object.entries((value ?? {}) as Record<string, unknown>).filter(
    ([, v]) => v !== undefined,
  );
  return entries.length
    ? `{ ${entries.map(([k, v]) => `${k}: ${literalOf(v)}`).join(", ")} }`
    : "{}";
}

/**
 * Render a live SDK request object as the object literal a consumer assigns to a typed const, e.g.
 * `const project: NewProject = { … }`. Typing the const is what makes the compiler enforce the
 * model's required fields at the call site.
 *
 * This is what lets the demo show the call and its payload in ONE panel: rather than printing a
 * generic signature beside a separate JSON blob, the reader sees the actual construction with the
 * actual values, which is also exactly what the app runs. Keys whose value is `undefined` are
 * dropped — an optional field you did not set should not appear as noise.
 */
export function objectLiteral(value: unknown, indent = 2): string {
  const pad = " ".repeat(indent);
  const entries = Object.entries((value ?? {}) as Record<string, unknown>).filter(
    ([, v]) => v !== undefined,
  );
  if (!entries.length) return "{}";
  return `{\n${entries.map(([k, v]) => `${pad}${k}: ${literalOf(v)},`).join("\n")}\n}`;
}

export function CallReveal({
  call,
  response,
  responseType,
}: {
  /** The invocation INCLUDING its payload, shown as TypeScript. Build it with {@link objectLiteral}. */
  call: string;
  /** An obfuscated example response fixture. Omit to show only the call. */
  response?: unknown;
  /**
   * The SDK class the call returns (e.g. `ProjectExtended`). When set, the response panel names the
   * type and shows a "TS" badge whose popover reveals the real class shape (see TypeShapePopover).
   */
  responseType?: string;
}) {
  return (
    <div className="call-reveal">
      <div className="call-reveal-block">
        <div className="call-reveal-label">The call</div>
        <CodeBlock value={truncateUuids(call)} lang="typescript" />
      </div>

      {response !== undefined && (
        <div className="call-reveal-block">
          <div className="call-reveal-label">
            Example response
            {responseType && (
              <>
                <span className="call-reveal-type">· {responseType}</span>
                <TypeShapePopover typeName={responseType} />
              </>
            )}
            <span className="call-reveal-note">obfuscated fixture — no call is made</span>
          </div>
          <CodeBlock value={truncateUuids(JSON.stringify(response, null, 2))} lang="json" fold />
        </div>
      )}
    </div>
  );
}
