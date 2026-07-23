"use client";

import { CodeBlock } from "./CodeBlock";

/**
 * CallReveal — the write-demo primitive. It shows the code a consumer would write to perform a
 * write, WITHOUT issuing it (see docs/write-demos.md). Three panels, stacked:
 *
 *   1. The call     — the invocation, as TypeScript (stable).
 *   2. Request      — the actual request object serialized. Pass the REAL SDK object (e.g.
 *                     `new NewProject(...)`) so the payload reflects live input and the
 *                     construction is typechecked at the call site — that's the anti-rot guarantee.
 *   3. Response     — an obfuscated fixture showing the return shape. Labeled as a fixture, never
 *                     presented as a live result.
 *
 * Real UUIDs are truncated for display (`9b2e6f14…`): the request payload is built from real ids
 * (e.g. a `parentId`), but the pattern reads fine without the full value, and truncating avoids
 * putting real identifiers on screen and saves space. Nothing here calls the platform.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Truncate any full UUID to its first segment + an ellipsis, for display only. */
function truncateUuids(text: string): string {
  return text.replace(UUID_RE, (id) => `${id.slice(0, 8)}…`);
}

export function CallReveal({
  call,
  request,
  response,
}: {
  /** The invocation, shown as TypeScript. */
  call: string;
  /** The real request object — serialized to show the payload. Omit for calls with no body. */
  request?: unknown;
  /** An obfuscated example response fixture. Omit to show only the call. */
  response?: unknown;
}) {
  return (
    <div className="call-reveal">
      <div className="call-reveal-block">
        <div className="call-reveal-label">The call</div>
        <CodeBlock value={truncateUuids(call)} lang="typescript" />
      </div>

      {request !== undefined && (
        <div className="call-reveal-block">
          <div className="call-reveal-label">Request payload</div>
          <CodeBlock value={truncateUuids(JSON.stringify(request, null, 2))} lang="json" />
        </div>
      )}

      {response !== undefined && (
        <div className="call-reveal-block">
          <div className="call-reveal-label">
            Example response
            <span className="call-reveal-note">obfuscated fixture — no call is made</span>
          </div>
          <CodeBlock value={truncateUuids(JSON.stringify(response, null, 2))} lang="json" />
        </div>
      )}
    </div>
  );
}
