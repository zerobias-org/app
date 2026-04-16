# Phase 19: zbb Local Dev Stacks - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** Director brief (`.planning/director/phase-19-brief.md`) + Clark's verbal corrections

<domain>
## Phase Boundary

Adopt the `zbb` tool to compose local dev stacks that mirror the published-shape SME Mart deployment (CloudFront -> S3 -> SPA with `try_files` fallback). Two sub-phases share a single custom `cloudfront-sim` nginx stack:

- **19.1** SPA + Hub Module stack (postgres, minio, registry/Verdaccio, hub-server, cloudfront-sim)
- **19.2** Login stack (reuses cloudfront-sim, serves login/ build output, verifies session handoff to SPA)

This is ONE phase with two sub-plans, not two separate phases. The cloudfront-sim stack connects them.

Three repos in scope: `app/` (this repo), `login/` (white-label login), `module/` (unmerged Hub module).

</domain>

<decisions>
## Implementation Decisions

### Serving Model (LOCKED)
- Goal is **published-shape serving** (CloudFront -> S3 -> SPA with `try_files` fallback), NOT hot reload / dev-server mode
- Hot reload is a bonus if it falls out naturally -- do NOT plan around it or over-scope Webpack/nginx dev tricks
- Purpose: reproduce path-specific bugs locally (basePath, asset paths, SPA route fallback, cross-repo interop)

### Wave 0: Hub Module Build Gate (LOCKED)
- Before publishing the Hub module to Verdaccio, verify `module/` repo's current branch builds cleanly and produces a publishable tarball (`npm run build` + `npm pack`)
- If it doesn't build, Wave 0 needs a "fix build" task BEFORE the Verdaccio publish step
- Do NOT assume the unmerged Hub module currently builds

### Repo Branch Verification (LOCKED)
- Planner must verify each repo is current on its respective branch before work starts:
  - `app/` -> `poc/sme-mart`
  - `login/` -> `feat/w3geekery-login-package`
  - `module/` -> `feat/w3geekery-sme-mart`
- No stale clones

### Verdaccio First-Wave (LOCKED)
- Local Verdaccio (registry built-in stack) is the whole point -- it lets us publish the unmerged SME Mart Hub module locally and consume it without waiting for upstream PR review
- `npm publish --registry=<verdaccio>` for the Hub module is a first-wave task
- The SPA stack imports the locally-published Hub module from Verdaccio

### Stack Architecture (LOCKED)
- `cloudfront-sim` is a REUSABLE custom stack (LS-04) -- not SME Mart-specific
- Both SPA (19.1) and login (19.2) use the same cloudfront-sim stack
- Env var import/export between stacks follows zbb conventions (LS-05)

### Sanctioned Approach (LOCKED)
- Kevin confirmed 2026-04-13: "You can make any stack you like that imports/exports env vars and exposes service ports"
- This is not inventing something unsanctioned

### Claude's Discretion
- Exact nginx configuration details for cloudfront-sim
- Stack naming conventions (e.g., `sme-mart-spa`, `sme-mart-login`)
- Docker Compose structure within zbb stack format
- Whether hub-server is a separate stack or composed into sme-mart-spa
- Specific env var names and port assignments

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### zbb Tool Design
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-guide.md` -- How zbb stacks work (read FIRST)
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-spec.md` -- Stack specification format
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/registry-spec.md` -- Verdaccio registry integration

### Director Brief
- `.planning/director/phase-19-brief.md` -- Full phase brief with architecture, requirements, verification

### Memory Reference
- `.claude/projects/*/memory/reference_zbb_local_stack.md` -- zbb local stack context from prior sessions

### Repos in Scope
- `~/Projects/w3geekery/zerobias-org-forks/app/` -- SME Mart SPA (this repo)
- `~/Projects/w3geekery/zerobias-org-forks/login/` -- White-label login
- `~/Projects/w3geekery/zerobias-org-forks/module/` -- Unmerged Hub module

</canonical_refs>

<specifics>
## Specific Ideas

- Stack composition for 19.1: postgres (built-in) + minio (built-in) + registry (built-in/Verdaccio) + hub-server + cloudfront-sim (custom)
- Stack composition for 19.2: cloudfront-sim (reused from 19.1) serving login/ build output + session handoff verification
- Verification: `curl localhost:<port>/<basePath>/` returns SPA index.html; deep-route refresh returns index.html (try_files); Hub module API call succeeds against local hub-server
- The goal is to close the "can't test this locally" gap so Phase 18-scale work can happen locally with debugging, not about prod simulation for its own sake
- "Eventually Portal will handle org switching" is the mental model -- this stack enables local iteration

</specifics>

<deferred>
## Deferred Ideas

- Production `zbb` stack configuration (this is local dev only)
- Full hub-server feature parity with prod (mirroring serving path, not platform)
- CI integration (future)

</deferred>

---

*Phase: 19-zbb-local-dev-stacks*
*Context gathered: 2026-04-16 via Director Brief + Verbal Corrections*
