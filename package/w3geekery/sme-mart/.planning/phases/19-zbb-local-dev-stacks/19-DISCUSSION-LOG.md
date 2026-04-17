# Phase 19: zbb Local Dev Stacks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 19-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 19-zbb-local-dev-stacks
**Areas discussed:** Stack composition, Build/upload split, Port strategy, cloudfront-sim parameterization

Context: Phase 19 v1 reverted per errata 017 (missed reverse-proxy pattern). Brief v2 locks reverse-proxy architecture; discussion focused only on unresolved implementation choices.

---

## A. Stack Composition

| Option | Description | Selected |
|--------|-------------|----------|
| A1 Hub-spoke | Shared minio + shared cloudfront-sim; two thin app stacks (`sme-mart-spa`, `sme-mart-login`) each create their own bucket and contribute nginx location conf | ✓ |
| A2 Monolith | Single `sme-mart-local` stack bundles nginx + minio + both buckets | |
| A3 Per-app nginx | Two nginx instances on different ports | |

**User's choice:** A1 — matches zbb dependency model; preserves LS-04 reusability of cloudfront-sim.
**Notes:** Director-approved without adjustment.

---

## B. Build vs Upload Integration

| Option | Description | Selected |
|--------|-------------|----------|
| B1 setup.sh shells out to build + upload | On `zbb up`, auto `npm --prefix $REPO run build && mc cp …` | (adjusted) |
| B2 Manual pre-build, stack uploads only | User runs `npm run build`; stack's start hook copies pre-built dist | |
| B3 Volume-mount dist/ directly | Skip minio for login | |

**User's choice:** B1, **adjusted** — split build from upload. `lifecycle.build` runs `npm run build`. `lifecycle.start` (or setup.sh) only does `mc cp`. Build is user-invoked via `zbb build <stack>`, NOT auto on `zbb up` (Angular builds take 30–90s). Same pattern for SPA and login.
**Notes:** Rationale: keep `zbb up` fast; explicit builds.

---

## C. Port Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| C1 Fixed default 9000 | Mirror `zb/ui/gateway.js` | (adjusted) |
| C2 zbb-allocated dynamic | Follow zbb convention | |

**User's choice:** C1, **adjusted** — default **15002** (9000 collides with minio default). Env override remains. Matches prior VALIDATION.md smoke tests.
**Notes:** Director correction.

---

## D. cloudfront-sim Parameterization

| Option | Description | Selected |
|--------|-------------|----------|
| D1 nginx.conf.d drop-in files | App stacks write location confs to shared path; cloudfront-sim `include`s them | ✓ (clarified) |
| D2 Fixed env-var slots | `BASE_PATH_1`, `BUCKET_1`, etc. | |
| D3 JSON env var | Parsed by entrypoint | |

**User's choice:** D1, **clarified** — shared mechanism must be explicit in the plan: named docker volume (or zbb slot-dir bind mount) for `.conf` files; nginx `include /etc/nginx/conf.d/*.conf`; reload trigger = app stack start runs `docker exec <cloudfront-sim> nginx -s reload`. Planner verifies `-s reload` is sufficient with bind-mount changes.
**Notes:** Resolves prior REVIEW-19 F2 flag.

## Claude's Discretion

- Exact envsubst invocation and nginx container entrypoint layout
- SPA/login repo-path env var defaults (realpath traversal vs explicit)
- Stack directory layout inside the app repo (`zbb-stacks/` vs alternative)
- mc alias setup in setup scripts

## Deferred Ideas

None mentioned during discussion (all out-of-scope items already captured in brief's "Out of scope" section and backlog 089).
