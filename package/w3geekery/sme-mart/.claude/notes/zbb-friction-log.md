# zbb Friction Log — SME Mart Local Dev Adoption

**Purpose:** Running log of pain points, gotchas, and improvement ideas encountered while adopting `zbb` to compose SME Mart local dev stacks (Phase 19, v1.3 milestone). Hand to Kevin McCarthy at end of rollout so he can prioritize zbb tool + docs improvements.

**Scope:** 3rd-party developer perspective (W3Geekery fork of zerobias-org). Not Kevin's team building zbb — the consumer side.

**Update cadence:** Append as items surface during Phase 19 execution. Each entry: category, date, what happened, impact, suggested improvement.

**Related:**
- [`~/Projects/zb/zerobias-org/zb-dx`](~/Projects/zb/zerobias-org/zb-dx) — shared knowledge base; high-impact items should also be filed via `/friction` once confirmed
- `.planning/director/errata/017-phase19-missed-reverse-proxy-pattern.md` — the event that triggered this log

---

## Summary by Category (for Kevin's scan)

| Category | Count |
|---|---|
| Missing reference architecture / recipes | 3 |
| Documentation gaps | 2 |
| Tooling gaps / ergonomics | 2 |
| Conflicts with 3rd-party tooling | 1 |

---

## Findings

### 001 — No reference implementation for "SPA + API-proxy + real-auth" local dev

**Category:** Missing reference architecture
**Date:** 2026-04-17
**Phase:** 19 (revert + replan)

**What happened:**
Phase 19 goal is "bring SME Mart SPA + login online locally, serving from a CloudFront-shaped URL, with session handoff verified." Planner, researcher, and director all read `~/Projects/zb/zerobias-org/util/packages/zbb/design/{stacks-guide,stacks-spec,registry-spec}.md` and concluded: two independent static-serving stacks + reusable nginx (`cloudfront-sim`). Shipped 12 files. During execution verification, gsd-execute discovered `~/Projects/zb/ui/scripts/gateway.js` — a node/http-proxy that unifies ALL zb/ui apps under one origin with cookie-domain rewriting for real auth. That pattern is the actual correct answer. Phase 19 reverted; replan underway.

**Impact:**
- ~1 day of planning + execution work reverted.
- Director brief rewritten from scratch (phase est. revised from 7–10 hr to 10–14 hr).
- Errata 017 filed.
- Confidence in the design → research → plan → review chain took a hit — no one in the chain thought to read the reference `zb/ui` implementation, only the zbb design docs.

**Suggested improvement:**
- Add a "Common Patterns" or "Integration Recipes" directory to zbb design docs, with worked examples: "Unified-origin local dev for an SPA + API backend," "Consuming a local npm registry from a service," "Cookie-rewriting reverse proxy," etc.
- `zb/ui/scripts/gateway.js` should become the reference template for the first one. A `zbb-stack-templates` package (or similar) with ready-to-copy `cloudfront-sim`-style recipes would save every future 3rd-party adoption from this same miss.
- Cross-link zbb design docs to the `zb/ui` gateway implementation explicitly — "For SPA + API local dev, see [zb/ui gateway pattern]."

---

### 002 — Hub-server opacity for 3rd-party consumers

**Category:** Missing reference architecture / Documentation gap
**Date:** 2026-04-16
**Phase:** 19 (original plan)

**What happened:**
Phase 19 original scope included running a local `hub-server` that loads the SME Mart Hub module from a local Verdaccio registry (`@zerobias-com/registry` built-in stack). Plan required writing a `Dockerfile` for hub-server. Planner couldn't determine: (a) runtime (Java? Node?), (b) whether `zerobias-org/hub` publishes a Docker image, (c) how hub-server discovers/loads modules at startup (env vars? CLI flags? `npm install` from registry URL?). No design doc explains this. Had to escalate to Kevin. Ultimately descoped the hub-server piece and deferred to backlog 089 to avoid blocking Phase 19 on the unknown.

**Impact:**
- One ~full-session blocker that required human escalation to Kevin.
- Backlog item 089 created to preserve the work when hub-server is understood.
- LS-02 requirement deferred.

**Suggested improvement:**
- zbb should either ship a `@zerobias-com/hub-server` built-in stack (so consumers just add it and specify the module), or the `zerobias-org/hub` repo should have a top-level README: "Running hub-server locally: Docker image location, module loading model, required env vars."
- The "run a local Hub module against a local registry" workflow is exactly the kind of thing 3rd-party devs will want, and it's opaque today.

---

### 003 — Cookie-domain rewriting pattern not documented

**Category:** Missing reference architecture
**Date:** 2026-04-17
**Phase:** 19 (replan)

**What happened:**
To get real UAT auth working locally (single-user or multi-user), the non-obvious trick is: reverse-proxy `/api/*` + `/dana/*` to `uat.zerobias.com` with `proxy_cookie_domain uat.zerobias.com localhost` + `proxy_cookie_flags ~ nosecure` + Angular `environment.stack.ts` with `isLocalDev: false`, and the SDK auto-routes through the real login flow with the `cookieDomain` param. This is all findable by grep across `zb/ui` + `zerobias-client`, but it's not documented as a recipe anywhere. A 3rd-party dev would default to "inject API key via proxy middleware" (the `zb/ui` proxy-dev pattern) which has a single-user limitation.

**Impact:**
- Solution lives in two separate codebases that have to be cross-referenced.
- Easy to miss entirely (we did, on first Phase 19 attempt).

**Suggested improvement:**
- Document the cookie-rewriting recipe in zbb design docs under a "Real auth for local dev" section.
- Include: the nginx directives, the Angular `environment.stack.ts` pattern, the SDK code path (`ZerobiasClientApp.redirectLogin()` with `cookieDomain`), and the multi-user implication.

---

### 004 — nginx env var substitution needs DIY `envsubst` entrypoint every time

**Category:** Tooling gap
**Date:** 2026-04-16 (flagged in review), 2026-04-17 (re-surfaces in replan)
**Phase:** 19

**What happened:**
Any nginx-based stack that needs runtime env var injection (`${BASE_PATH}`, `${UAT_ORIGIN}`, `${MINIO_BUCKET}`, etc.) has to implement its own `docker-entrypoint.sh` that runs `envsubst < template > nginx.conf` before `nginx -g 'daemon off;'`. Nginx doesn't do env var substitution natively. Every consumer of the cloudfront-sim pattern re-solves this.

**Impact:**
- Planner initially proposed 3 options (envsubst, template, docker run -e) without picking one — Director had to BLOCK and force a single prescribed approach.
- Easy source of bugs: mis-scoped var lists (clobbering nginx's own `$host`, `$remote_addr` with `envsubst`), missing vars, wrong escaping.

**Suggested improvement:**
- Provide a `@zerobias-com/nginx-base` built-in stack with envsubst entrypoint, explicit safe-var-list pattern, and a documented conventions for template file naming.
- Alternative: document the canonical pattern in stacks-guide.md with a worked example, so consumers don't each reinvent it.

---

### 005 — Build-vs-start lifecycle separation not obvious from defaults

**Category:** Documentation gap / ergonomics
**Date:** 2026-04-17
**Phase:** 19 (replan planning decisions)

**What happened:**
First gsd-plan iteration put `npm run build` inside `setup.sh` (which runs on every `zbb up`). For the Angular SPA, this means 30–90s build on every stack bring-up. Correct pattern (per zbb stacks-guide.md) is `lifecycle.build` hook separate from `lifecycle.start`. But the default "run setup.sh from start hook" flow led the planner directly to the wrong place. Director caught it during decision review.

**Impact:**
- If shipped, would have made `zbb up` feel painfully slow for SPA stacks.
- Would have taught users that `zbb up` is expensive, discouraging quick iterate-restart cycles.

**Suggested improvement:**
- Make `lifecycle.build` more prominent in stacks-guide.md (e.g., "Every stack with a compile step MUST separate build from start").
- Consider a stack template scaffold (`zbb new-stack <name>`) that pre-populates both lifecycle hooks with the idiomatic split.

---

### 006 — Port collision: minio default (9000) vs common reverse-proxy port (9000)

**Category:** Conflicts with 3rd-party tooling
**Date:** 2026-04-17
**Phase:** 19 (replan)

**What happened:**
`zb/ui/scripts/gateway.js` uses port 9000 by default. Minio also uses port 9000 by default. A cloudfront-sim stack fronting a minio stack on the same slot can't use port 9000 — they collide. Requires changing the default on one side.

**Impact:**
- Not a blocker, but a gotcha that needs explicit handling in every stack that composes nginx + minio.
- Planner's initial recommendation (use 9000 to mirror gateway.js) was wrong for SME Mart's context and required Director correction to 15002.

**Suggested improvement:**
- `zbb` could detect port conflicts at `zbb stack add` time (not just at `zbb up` time) by statically inspecting declared ports in composed stacks.
- Built-in stacks should document their default ports in a single reference table so consumers can plan around them.
- Consider: minio uses a less-contested port (9000 is a popular default for many tools — Portainer, PHP-FPM via some configs, etc.).

---

### 007 — No linter / validator warning on modern-vs-legacy `compose.yml` naming

**Category:** Documentation gap (minor)
**Date:** 2026-04-17
**Phase:** 19 (review notes)

**What happened:**
Docker supports both `docker-compose.yml` (legacy) and `compose.yml` (modern spec). `zbb` design docs show `compose.yml` in examples, but the planner defaulted to `docker-compose.yml`. Functionally identical, but inconsistent file naming across zbb-authored stacks vs 3rd-party ones creates grep-ability friction.

**Impact:**
- Cosmetic only. NOTE-level, not BLOCK or FLAG.
- But 3rd-party devs default to what they already know (`docker-compose.yml` from older docs).

**Suggested improvement:**
- Explicit convention statement in stacks-spec.md: "Use `compose.yml` (Compose Specification v1+)." Add to the stack scaffold template if one exists.

---

## Open Invitations

If any of these findings feel ready to escalate as `/friction` entries in `zb-dx`, Clark can promote them individually. This doc is the working scratchpad; `zb-dx` is the shared knowledge base.
