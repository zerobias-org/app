# Phase 17: Demo Seed Scripts - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning
**Source:** Direct brief from Clark (self-contained, no discuss-phase round-trip)

<domain>
## Phase Boundary

Build a **Node + TypeScript CLI** (no Angular, no UI) that exercises the SME Mart marketplace end-to-end via ZB MCP/Platform/SDK APIs to create a realistic RFP package flow for Friday demos with Brian.

The script set must:
1. **Seed** — create a complete RFP lifecycle: RFP (with documents) → invited vendor → submitted bid (with form responses) → pilot project.
2. **Cleanup** — tear down all demo-created data without touching non-demo data (safe, idempotent).
3. **Integration-smoke double duty** — seed script exits non-zero on any failure so it functions as an integration test.

**Secondary use (bonus):** seeded data should be usable to manually exercise errata 006 — deferred UAT flows 5–8 that need real vendor/buyer accounts. Design tagging, identifiers, and output so UAT operators can locate and operate on seeded entities.

Covers requirements **DEMO-01, DEMO-02, DEMO-03**.

</domain>

<decisions>
## Implementation Decisions

### Stack & Structure
- **Node.js + TypeScript**, run via `ts-node` or compiled. No Angular. No browser runtime.
- Live under a clear CLI directory (e.g., `scripts/demo/` or `tools/demo/`). Picker's discretion — follow existing repo conventions if any CLI already exists.
- Two entry points: `seed` and `cleanup` (single CLI with subcommands, or two scripts — planner picks based on ergonomics).
- Load credentials from existing env conventions (`.env`, env vars) — do NOT hardcode API keys. Reuse `ZB_API_KEY`, `ZB_ORG_ID`, `ZB_TOKEN` where relevant.

### API Surface
- Use **ZB MCP / SDK / Platform APIs** — same paths the app uses.
  - `hydra.*` for tags and resources (tagging every demo-created resource with a demo marker tag is the cleanup strategy).
  - `platform.Pipeline.receive` for class instances (SME Mart schema entities: RFP, Bid, Document, etc.).
  - `store.*` for production resource ops where hydra 404s (see `feedback_prod_resource_tagging`).
- **NEVER curl/fetch ZB APIs directly** — MCP/SDK only. This is a compliance rule.
- Reference existing services in `src/app/core/services/` for call patterns (RFP service, bid service, document service, pilot service, form submission service). Do NOT import them (Angular code); mirror their patterns in Node.

### Demo Marker Tag (cleanup strategy)
- Every demo-created resource MUST be tagged with a single well-known marker tag (e.g., `w3geekery.sme-mart.demo-seed`) so cleanup can find and tear down exclusively demo data.
- Marker tag is a `org` scope tag on the W3Geekery / SME Mart test org.
- Cleanup queries by tag, collects resource IDs, deletes in correct dependency order (leaves first — bid responses → bid → documents → RFP → pilot).

### Data Model (what seed creates)
- **1 RFP** (with title, description, category, etc. per current RFP schema)
- **N documents** attached to the RFP (≥2 to exercise attachments)
- **1 invited vendor** (existing vendor party or seeded party — planner decides; prefer existing UAT fixture parties to avoid vendor lifecycle complexity)
- **1 submitted bid** from that vendor against the RFP
- **Form responses** on the bid (populated form submission per Phase 16 schema)
- **1 pilot project** linked to the winning/submitted bid

All entities tagged with demo marker.

### Failure Semantics
- Seed script: `process.exit(1)` on ANY API failure, validation failure, or partial-state failure. Log which step failed and what was created before the failure so cleanup can still run.
- On partial failure, seed should NOT attempt auto-cleanup — leave state and let operator run `cleanup` explicitly. This preserves diagnostic info.
- Cleanup script: idempotent — safe to run multiple times, safe to run when nothing exists.

### Idempotency / Re-runnability
- Seed may be run repeatedly for demos. Default behavior: create fresh resources each run (unique names/timestamps). Planner MAY add an optional `--reuse` flag if trivial, but not required.
- Cleanup before re-seed is the standard flow.

### Environment Targeting
- Must work against **UAT** (primary dev env per CLAUDE.md). Planner should consider prod-safety: refuse to run against prod unless an explicit `--allow-prod` flag is passed (guardrail — not core scope but low-cost to add).

### Logging / Output
- Human-readable stdout progress (step-by-step: "Creating RFP... ✓", "Attaching document 1/3... ✓").
- On completion, print a summary block with created resource IDs (so UAT operators can use them for flows 5–8).
- On failure, print the step that failed + the API error.

### UAT Bonus Design
- Output summary should include vendor/buyer identifiers and URLs (or paths) usable for manual UAT of errata 006 flows 5–8.
- Consider a `--verbose` flag that emits a JSON artifact (e.g., `demo-seed-output.json`) with all created IDs for programmatic follow-up.

### Claude's Discretion
- Exact CLI ergonomics (commander vs yargs vs raw argv).
- File layout within `scripts/demo/` (one file vs per-entity modules).
- How to resolve existing vendor parties (lookup by tag, env var, or config file).
- Whether seed and cleanup are one binary with subcommands or two separate scripts.
- Output JSON schema for `--verbose` mode.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` — Phase 17 scope, success criteria
- `.planning/REQUIREMENTS.md` — DEMO-01, DEMO-02, DEMO-03 definitions

### Project & SDK Patterns
- `CLAUDE.md` (project) — UAT env, ZB MCP rules, ngx-library, task/subtask conventions
- `src/app/core/services/` — existing RFP, bid, document, pilot, form-submission services (reference patterns, do NOT import)
- `.planning/notes/zb-graphql-custom-schema-howto.md` — SME Mart schema querying
- `.planning/notes/demo-data-guide.md` — existing demo data conventions

### ZB MCP / Hydra / Pipeline
- Memory: `project_sme_mart_prod_pipeline.md` — Pipeline.receive patterns
- Memory: `project_sme_mart_prod_schema.md` — class IDs, links
- Memory: `feedback_mcp_is_sanctioned_path.md` — NEVER curl
- Memory: `feedback_prod_resource_tagging.md` — `store.Resource.tagResource` for prod
- Memory: `feedback_pipeline_full_replace.md` — receive is full-replace, always include all fields

### Errata / UAT
- `.planning/errata/006-*` (if present) — deferred UAT flows 5–8 needing accounts

</canonical_refs>

<specifics>
## Specific Ideas

- **Tag name convention (proposed):** `w3geekery.sme-mart.demo-seed` — scope `org`, owned by the W3Geekery SME Mart org. Planner may refine (e.g., include run timestamp as a second tag per run for granular cleanup).
- **Dependency order for cleanup:** BidResponse → Bid → RFP documents → RFP → Pilot. Links/tags purged as resources drop.
- **Test double-duty:** because seed exits non-zero on failure, it can be wired to `npm run demo:seed` or an npm script and invoked in CI as a light smoke test. Not required in this phase to actually add to CI, just keep the exit-code discipline.

</specifics>

<deferred>
## Deferred Ideas

- Angular UI to trigger seed/cleanup — out of scope.
- Fixture JSON files / generators — out of scope unless the planner finds them necessary.
- Playwright E2E tests — out of scope.
- CI integration of the smoke test — out of scope for this phase (exit-code discipline only).
- Auto-cleanup on seed failure — explicitly deferred (preserves diagnostic state).

</deferred>

---

*Phase: 17-demo-seed-scripts*
*Context gathered: 2026-04-14 — direct brief, no discuss-phase*
