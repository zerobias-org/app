---
id: "011"
severity: high
phase: "*"
found: 2026-04-15
status: open
---

# App's fire-and-forget `pushEntity` may be masking schema-validation failures in production

From Phase 17 SUMMARY (line 104-106):

> App's fire-and-forget `pushEntity` almost certainly masks some of these failures in production — this CLI's strict `await` discipline is how they surfaced.

The schema gotchas caught by the Phase 17 CLI (date-only vs full ISO, `fileVersionId` / `size` required on `SmeMartDocument`, empty-data `markDeleted` rejection) only became visible because the demo script `await`s every `Pipeline.receive` call and rethrows on failure. The Angular app's `PipelineWriteService.pushEntity` is fire-and-forget with a `.catch()` that logs but never surfaces to the UI or halts a flow. That means:

- Schema validation failures land in `console.error` and are invisible to users
- Malformed entities may be silently dropped (returned error, never persisted)
- Round-trip read-your-own-write wouldn't catch it because the write failed silently
- Any field shape that's wrong on a write path currently used by the app has been hiding the entire time

**Root cause:**
- `pushEntity` was designed for optimistic UI updates (v1.0 AuditgraphDB migration pattern)
- The `.catch()` was added for "don't crash the app" ergonomics
- No error budget or user-surfacing path was built in
- Unit tests use a fake service that never errors, so no spec ever observed a real failure

**Impact:**
- Unknown. Could be zero real-world impact if every write path happens to be schema-correct. Could be silent partial data loss today in prod.
- Higher-severity if form submissions, bids, or RFP drafts are hitting validation errors that users never see as errors.

**Fix (investigation phase first):**

1. **Audit:** Grep for every `pushEntity` call site. For each, answer: "If this write silently fails, does the user know?"
2. **Instrument:** Add telemetry — count `.catch()` invocations per call site for 1 week on UAT/prod. If any are > 0, we have a silent-failure problem.
3. **Remediate:** For call sites where silent failure is unsafe (bids, form submissions, RFP drafts, profile saves), replace fire-and-forget with `await` + surfaced error state. Keep fire-and-forget only for non-critical telemetry/logging writes.

**Scope for milestone planning:** This is v1.3+ work. Not urgent enough to block Phase 17 close, but urgent enough that it should be the first thing on the v1.3 docket or a tech-debt plan in the backlog. Suggested backlog entry: *"Audit pipeline-write fire-and-forget for silent failures."*

**Watch pattern for WATCH-LIST:** "Service method uses fire-and-forget `.catch()` without user-visible error state — silent failure risk."
