# Demo Seed & Cleanup Scripts

Standalone Node + TypeScript CLI that creates a realistic RFP marketplace flow
for Friday demos with Brian, and tears it down safely afterwards.

## What gets created (seed)

1. **RFP** — `SmeMartProject` with `projectType='rfp'`, budget range, timeline,
   published status
2. **2 Documents** — `SmeMartDocument` attachments on the RFP
3. **Invitation** — `RfpInvitation` to a vendor org (defaults to the connected
   org — self-bid is fine for demo purposes)
4. **Bid** — submitted `Bid` with cover letter, price, timeline, pricing model
5. **Form Submission** — `FormSubmission` with sample responses linked to the
   Bid
6. **Pilot Project** — `SmeMartProject` with `projectType='pilot'`, linked back
   to the RFP via `promotedProjectId`

Every write goes through `platform.Pipeline.receive` against the SME Mart
Receiver Pipeline for the target environment.

## What gets torn down (cleanup)

Every entity a seed run created is deleted (via pipeline `markDeleted`),
scoped to the current environment. Other environments' demo data in the same
state file is left alone.

Cleanup is driven by `scripts/demo/.demo-state.json`, which accumulates the
ids every seed run pushes. The marker tag (`w3geekery.sme-mart.demo-seed`) is
still applied as a best-effort label, but **not** used as the cleanup source
of truth — pipeline-created AuditgraphDB objects do not materialize as hydra
`Resource` rows, so hydra's `listTaggedResources` can't see them (verified on
UAT 2026-04-15).

## Prerequisites

- Node.js `>= 18.19.1`
- ZB platform credentials — either env vars or a profile in
  `~/.config/mcp-zb/credentials.json`

## Credentials

Two resolution paths, tried in order:

1. **Env vars — all three required:** `ZB_API_URL`, `ZB_API_KEY`, `ZB_ORG_ID`
2. **`~/.config/mcp-zb/credentials.json`** — uses the `active` profile, or
   set `ZB_PROFILE=<name>` to pick a specific one

Env overrides are **all-or-nothing** to prevent cross-wiring (e.g. UAT url with
a CI api-key + CI org-id).

Optional overrides:

| Var | Purpose |
|-----|---------|
| `ZB_PIPELINE_ID` | Override the default per-environment pipeline id |
| `ZB_PROFILE` | Pick a non-active profile from the credentials file |
| `DEMO_VENDOR_ORG_ID` | Vendor org id (otherwise defaults to the connected org) |

## Usage

```bash
# Seed (writes .demo-state.json so cleanup can reverse it)
npm run demo:seed

# Seed + dump full output JSON
npm run demo:seed -- --verbose

# Tear down everything recorded in .demo-state.json for this environment
npm run demo:cleanup
```

`--allow-prod` is required to seed prod. Without it the script exits with
an error if the URL looks like prod.

## Exit codes

- `0` — success (including "nothing to clean")
- `1` — any API failure, config error, or validation error

The seed script is intentionally strict — unlike the Angular app's
fire-and-forget `pushEntity` pattern, every pipeline write is awaited and its
error is thrown. This lets `demo:seed` double as an integration test in CI.

## Environment defaults

| Env | URL | Pipeline id |
|-----|-----|-------------|
| UAT | `https://uat.zerobias.com` | `f6d1f579-fe02-4158-b99e-a55113fd70cb` |
| CI / QA / Prod | — | set `ZB_PIPELINE_ID` explicitly |

Keep these in sync with `src/environments/environment.*.ts`.

## Partial-failure recovery

If seed fails midway, the partial resources still exist on the server AND are
already recorded in `.demo-state.json` (state is only persisted if all steps
succeed). To clean up after a failure, re-run the seed to completion OR
manually add the partial ids to `.demo-state.json` and run cleanup.

## Schema-related gotchas

Encountered during Plan 17-01 wiring (documented so you don't hit them again):

- **Date fields are mixed format**. `SmeMartProject.startDate` /
  `targetEndDate` / `dateCreated` / `dateLastModified` are `YYYY-MM-DD` only.
  `responseDeadline` and `FormSubmission.createdAt`/`updatedAt` are full ISO
  timestamps. Helpers use `dateOnly()` and `isoNow()` accordingly.
- **`SmeMartDocument` requires `fileVersionId` and `size`** from its File base
  class in addition to Neon-style `zbFileVersionId` / `fileSizeBytes`. The
  demo synthesizes a placeholder version id (the doc id itself).
- **`Pipeline.receive` rejects empty `data`** even when `markDeleted` is
  populated — so `deleteEntities` sends a stub object per id alongside the
  `markDeleted` array. The server treats `markDeleted` as authoritative.
- **`tagIds` on `SimpleBatch` is best-effort** for pipeline classes — it does
  not create the hydra `Resource` row needed for `hydra.Resource.tagResource`
  / `listTaggedResources` to find them later.

## Files

| File | Purpose |
|------|---------|
| `seed.ts` | Entry point — creates the demo flow |
| `cleanup.ts` | Entry point — deletes everything in `.demo-state.json` |
| `helpers.ts` | Config + SDK wiring + entity helpers + state file I/O |
| `types.ts` | Shared interfaces |
| `tsconfig.json` | TypeScript config for ts-node execution |
