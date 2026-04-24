---
phase: 17
plan: 01
name: Demo Seed Scripts
subsystem: CLI
tags: [demo, seed, cleanup, integration-test, UAT]
type: feature
status: completed
completed_date: "2026-04-15"
key_files:
  - scripts/demo/seed.ts
  - scripts/demo/cleanup.ts
  - scripts/demo/helpers.ts
  - scripts/demo/types.ts
  - scripts/demo/README.md
  - scripts/demo/tsconfig.json
  - package.json
requirements:
  - DEMO-01
  - DEMO-02
  - DEMO-03
---

# Phase 17 Plan 01 — Demo Seed Scripts

**One-liner:** Node + TypeScript CLI that seeds and tears down a realistic
RFP package flow on UAT via the ZeroBias SDK (`platform.Pipeline.receive` +
`hydra.Tag`). Verified end-to-end against UAT 2026-04-15.

## Requirements satisfied

| Req | Evidence |
|-----|----------|
| **DEMO-01** — `npm run demo:seed` creates a realistic RFP flow | 7 real entities land on UAT per run: `SmeMartProject` (RFP), 2 × `SmeMartDocument`, `RfpInvitation`, `Bid`, `FormSubmission`, `SmeMartProject` (Pilot). Ids verified by round-trip cleanup. |
| **DEMO-02** — `npm run demo:cleanup` removes demo-created data safely | Reads `scripts/demo/.demo-state.json`, calls `Pipeline.receive` with `markDeleted` per class in reverse-dependency order, scoped to current environment's URL (other envs untouched). Idempotent — exits 0 with "nothing to clean" when state is empty. |
| **DEMO-03** — Seed doubles as integration smoke test | Every helper `await`s its pipeline call and rethrows — unlike the Angular app's fire-and-forget `pushEntity`. Seed exits 1 on any failure (config, validation, network). Verified: intentional schema violations during iteration surfaced as non-zero exits with full error context. |

## Verified on UAT

Final clean run 2026-04-15 18:14–18:15Z:

- **Seed:** 7 entities created, `.demo-state.json` written.
- **Cleanup:** 7 entities deleted (1 FormSubmission, 1 Bid, 1 RfpInvitation,
  2 SmeMartDocument, 2 SmeMartProject), `.demo-state.json` removed.
- **Idempotent cleanup re-run:** "ℹ No demo state file — nothing to clean."

## What changed from the initial executor draft

The subagent that ran plan 17-01 left stub TODO markers instead of wiring
the real SDK calls (the `gsd-executor` agent definition allowlists
`Read, Write, Edit, Bash, Grep, Glob` — no MCP access, no explicit escalation
rule, so it silently fabricated mock UUIDs). All six source files were
rewritten in the parent session to use the real `@zerobias-com/zerobias-sdk`
surface. Artefacts and npm scripts are unchanged; behaviour is no longer
stubbed.

## Implementation notes

### Auth resolution

Two paths, tried in order:

1. **Env vars — all-or-nothing triple:** `ZB_API_URL`, `ZB_API_KEY`,
   `ZB_ORG_ID`. Partial env is **not** used (avoids cross-wiring UAT url with
   CI org-id — encountered this on first smoke test).
2. **`~/.config/mcp-zb/credentials.json`** — uses `active` profile unless
   `ZB_PROFILE=<name>` overrides.

### State-file-driven cleanup (not tag-driven)

The plan's original assumption was that `hydra.Tag.searchTags` +
`Resource.listTaggedResources` would drive cleanup. In practice, pipeline-
created AuditgraphDB objects do **not** materialize as hydra `Resource`
rows, so `tagResource` fails with a FK violation and
`listTaggedResources(tagId)` returns zero items even after a successful
seed (verified with a probe script, 2026-04-15 18:10Z).

Replaced with a local state file (`scripts/demo/.demo-state.json`,
gitignored) that each seed run appends to. Cleanup reads the file, filters
to entries matching the current environment's URL, deletes in
reverse-dependency order, and removes the file on success. This is simpler
than tag-based cleanup and more reliable for the demo use-case.

The marker tag (`w3geekery.sme-mart.demo-seed`) still rides along on each
`SimpleBatch.tagIds` as a best-effort label — may surface if pipeline-class
auto-resource-creation is ever enabled.

### Schema gotchas discovered during wiring

- **Date fields are mixed format.** `SmeMartProject.startDate`,
  `targetEndDate`, and `dateCreated` / `dateLastModified` (for Project,
  Document, Invitation, Bid, Pilot) all validate against
  `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` — date-only, no time component. Full ISO
  timestamps are used for `responseDeadline` and `FormSubmission.createdAt`/
  `updatedAt`. Helpers expose `dateOnly()` and `isoNow()` accordingly.
- **`SmeMartDocument` requires `fileVersionId` and `size`** (File base class
  fields), not just the Neon-mapped `zbFileVersionId` / `fileSizeBytes`.
  Demo synthesises a placeholder version id (the doc id itself).
- **`Pipeline.receive` rejects empty `data`** even when `markDeleted` is
  populated ("Simple batch must have at least one item"). Fix:
  `deleteEntities` sends a per-id `{id, name}` stub alongside `markDeleted`.
  For `SmeMartDocument` the stub also includes `fileVersionId`, `size`,
  `filename` to pass schema validation on the way in.
- **App's fire-and-forget `pushEntity`** almost certainly masks some of
  these failures in production — this CLI's strict `await` discipline is
  how they surfaced.

## Deliverables

| File | Role |
|------|------|
| `scripts/demo/seed.ts` | Entry — orchestrates full seed, persists state on success, prints summary |
| `scripts/demo/cleanup.ts` | Entry — reads state, deletes, clears state |
| `scripts/demo/helpers.ts` | SDK wiring, config resolution, entity helpers, state I/O, cleanup |
| `scripts/demo/types.ts` | Shared interfaces including `DemoStateEntry` |
| `scripts/demo/README.md` | User-facing docs + gotcha notes |
| `scripts/demo/tsconfig.json` | ts-node commonjs config |
| `package.json` | `demo:seed` + `demo:cleanup` scripts, `ts-node` dev dep |
| `.gitignore` | Ignores `.demo-state.json` + `demo-seed-output.json` |

## Partial-failure recovery

Seed persists to the state file only **after** all 10 steps succeed. If seed
fails midway, the already-created ids are printed to stderr; the operator
must either re-run seed to completion OR manually append those ids to
`.demo-state.json` and run cleanup. (The Pipeline has no transaction
semantics, so there's no atomic rollback.)

## Commits

This plan's work is split across the original executor's stub commits and
the parent session's rewrite. See git log for the full sequence — the latest
commit on `poc/sme-mart` carries the working implementation.

## Next steps

- **For Friday demo with Brian:** run `npm run demo:seed` against UAT,
  demonstrate the RFP package flow in the Angular app, `npm run demo:cleanup`
  afterwards.
- **For errata 006 (deferred UAT flows 5–8):** seeded ids are available in
  `demo-seed-output.json` (with `--verbose`) for manual buyer/vendor flow
  exercise once account-gating is resolved.
- **Consider escalating to Kevin:** the pipeline→hydra resource auto-creation
  gap (no `Resource` row per AuditgraphDB object) may be a platform config
  issue — worth a note.
