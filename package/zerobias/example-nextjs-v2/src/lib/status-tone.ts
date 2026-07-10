/**
 * Pure mapping from a resource's operational status to how its `StatusDot`
 * should render: a color `tone`, whether it's `outlined` (a transitional state),
 * and the display `label`. Grouped after ngx-library's `zb-resource-status`
 * buckets. Kept pure + separate from the component so it's unit-testable with no
 * DOM (see `status-tone.test.ts`), mirroring `listbox-nav`.
 */

export type StatusTone = "up" | "down" | "warn" | "info" | "neutral";

// Operational status -> color tone. Unmapped statuses fall through to `neutral`.
const TONE: Record<string, StatusTone> = {
  // green — healthy / usable
  up: "up",
  ok: "up",
  on: "up",
  ready: "up",
  active: "up",
  done: "up",
  success: "up",
  complete: "up",
  completed: "up",
  standby: "up",
  starting: "up",
  running: "up",
  processing: "up",
  connected: "up",
  configuring: "up",
  installing: "up",
  downloading: "up",
  verifying: "up",
  verified: "up",
  // red — down / failed
  down: "down",
  error: "down",
  failed: "down",
  failure: "down",
  invalid: "down",
  stopping: "down",
  deleting: "down",
  deleted: "down",
  rejected: "down",
  // amber — degraded / waiting
  degraded: "warn",
  warning: "warn",
  pending: "warn",
  suspended: "warn",
  on_hold: "warn",
  not_ready: "warn",
  // blue — provisioning / review
  created: "info",
  enabled: "info",
  draft: "info",
  in_progress: "info",
  under_review: "info",
  awaiting_review: "info",
};

// Transitional statuses render as an OUTLINED (hollow) dot — same color as their
// solid counterpart, ring only. Mirrors ngx-library's `background:transparent`
// dot for standby/starting/running/etc (vs the solid dot for terminal states).
const OUTLINED = new Set([
  "standby",
  "starting",
  "running",
  "processing",
  "connected",
  "configuring",
  "installing",
  "downloading",
  "verifying",
  "in_progress",
  "under_review",
  "suspended",
]);

export function statusTone(status?: string): {
  tone: StatusTone;
  outlined: boolean;
  label: string;
} {
  const raw = (status ?? "unknown").toString();
  const key = raw.toLowerCase();
  return {
    tone: TONE[key] ?? "neutral",
    outlined: OUTLINED.has(key),
    label: raw.replace(/_/g, " ").toUpperCase(),
  };
}
