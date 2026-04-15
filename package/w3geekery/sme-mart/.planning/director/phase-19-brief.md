# Phase 19 — Adopt zbb Tool for SME Mart Local Dev Stacks

**Milestone:** v1.3
**Est:** 7–10 hrs (SPA stack 4–6h + login stack 3–4h)
**Repos:** `app/` (SME Mart), `login/` (white-label login), `module/` (Hub module, indirectly via registry)

## Goal

Compose `zbb` stacks that mirror the production SME Mart deployment locally, so we can iterate on Hub module + published-shape SPA + login issues (basePath, asset paths, SPA route fallback, cross-repo interop) without waiting on upstream PR review queues. This is a stack + env management tool adoption, not a one-shot local setup.

## Architecture

The phase has two sub-phases (sub-plans), both using `zbb`'s stack model:

### Sub-phase 19.1 — SPA + Hub Module Local Stack

**Stack composition:**
- `postgres` built-in — Neon stand-in for SME Mart entities
- `minio` built-in — S3 stand-in for the published SPA bucket
- `registry` built-in (Verdaccio) — hosts the unmerged SME Mart Hub module locally, bypassing upstream PR queue
- `hub-server` — local Hub server loading the SME Mart Hub module from the local registry
- **NEW custom stack** `cloudfront-sim` — nginx in front of MinIO with SPA fallback (`try_files $uri /index.html`) to mirror CloudFront → S3 published SPA serving

### Sub-phase 19.2 — Login Local Stack

**Stack composition:**
- Reuses the `cloudfront-sim` custom stack from 19.1
- Serves `login/` build output from MinIO with same `try_files` fallback
- Login hands session off to the SPA stack — verify end-to-end handoff locally
- Kevin McCarthy confirmed feasibility 2026-04-13: "you can make any stack you like that imports/exports env vars and exposes service ports"

## Requirements

- **LS-01:** `zbb up <stack>` brings SME Mart SPA + Hub module online locally with Neon/S3/Registry stand-ins, serving from a CloudFront-shaped URL (path fallback, basePath-aware).
- **LS-02:** Unmerged SME Mart Hub module builds + publishes to local Verdaccio; local `hub-server` consumes it — no upstream PR dependency for iteration.
- **LS-03:** `login/` repo can be served alongside the SPA via the same `cloudfront-sim` stack; session handoff from login → SPA verified locally.
- **LS-04:** Custom `cloudfront-sim` stack is reusable (not SME Mart-specific — both SPA and login use it).
- **LS-05:** Env var import/export between stacks works per zbb conventions (e.g., SPA stack imports `HUB_URL` from hub-server stack).
- **LS-06:** README documents how to bring the stack up, tear it down, and iterate (change Hub module → rebuild → SPA picks it up).

## Dependencies

- `zbb` tool itself is already available (`~/Projects/zb/zerobias-org/util/packages/zbb/`)
- No platform/schema dependencies
- Unmerged SME Mart Hub module exists in `module/` repo

## Verification

- `zbb up sme-mart-spa` (or whatever the stack is named) brings up all services; `curl localhost:<cloudfront-sim-port>/<basePath>/` returns the SPA index.html
- Navigate to a deep route (`/rfps/abc123`), refresh — `try_files` fallback serves index.html without 404
- Hub module API call from SPA succeeds against local hub-server
- `zbb up sme-mart-login` serves login/; login → SPA session handoff works locally

## Out of scope

- Production `zbb` stack configuration (this is local dev only)
- Full hub-server feature parity with prod (we're mirroring the serving path, not the platform)
- CI integration (future)

## References

- `.claude/projects/*/memory/reference_zbb_local_stack.md`
- zbb design docs: `~/Projects/zb/zerobias-org/util/packages/zbb/design/{stacks-guide.md, stacks-spec.md, registry-spec.md}`
- Slack discussion w/ Kevin 2026-04-13 (BACKLOG.md entry 086)
