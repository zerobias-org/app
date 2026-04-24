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
| Documentation gaps | 3 |
| Tooling gaps / ergonomics / CLI design | 5 |
| Conflicts with 3rd-party tooling | 1 |

Total: 12 findings.

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

### 002 — zbb could ship a `@zerobias-com/hub-server` built-in stack

**Category:** Missing reference architecture (zbb slice)
**Date:** 2026-04-16
**Phase:** 19 (original plan)

Running a local hub-server to load a custom module from a local registry is an obvious 3rd-party workflow that has no zbb on-ramp today. Consumers would benefit from a `hub-server` built-in stack (similar to `@zerobias-com/registry`) that accepts a module coordinate and just works. The broader "how does hub-server load modules at runtime" opacity is a `zerobias-org/hub` docs issue, not zbb — filed separately. Phase 19 descoped this (LS-02 deferred to backlog 089).

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

### 006 — No static port-conflict detection at `zbb stack add`

**Category:** Tooling ergonomics
**Date:** 2026-04-17
**Phase:** 19 (replan)

Port collisions (minio 9000 vs reverse-proxy 9000 was the specific case, but any pair of built-in stacks with overlapping defaults hits this) surface at `zbb up` time when containers fail to bind — not at `zbb stack add` time when declared ports could be compared statically. A pre-flight check at `stack add` (and/or a reference table of built-in stack default ports) would let consumers plan ports ahead of bring-up instead of debugging bind failures.

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

### 008 — No canonical way for one stack to refer to another stack's container by name

**Category:** Tooling gap
**Date:** 2026-04-17
**Phase:** 19 v2 (review BLOCK B1)

**What happened:**
The Phase 19 architecture has app stacks (sme-mart-spa, sme-mart-login) invoking `docker exec <cloudfront-sim-container> nginx -s reload` during their `lifecycle.start` to pick up newly-written location blocks. But there's no canonical zbb mechanism for one stack to refer to another stack's container by name. Planner attempted `${STACK_NAME}-cloudfront-sim` (which expands to the CURRENT stack's name prefix, not the target) — a runtime bug that silently swallowed via `|| echo` fallback, leaving nginx never actually reloading.

**Impact:**
- BLOCK-level bug during Director review.
- Easy to miss in testing because the `|| echo` fallback makes the failure silent.
- Forces a brittle convention (each stack "knows" `cloudfront-sim-nginx` is the target name) or external env var injection.

**Suggested improvement:**
- zbb could provide `zbb exec <stack> <command>` as a first-class interface that resolves the container name from the stack registry. App stacks would call `zbb exec cloudfront-sim nginx -s reload` — readable, decoupled from docker naming conventions.
- Alternatively, a stack could export `CONTAINER_NAME` in its env exports so dependents can import it by name.
- Or: a `zbb.yaml` directive `on_dependency_start: <command>` that fires when a downstream stack starts.

---

### 009 — nginx upstream + envsubst interaction breaks silently with URL-shaped env vars

**Category:** Tooling gap
**Date:** 2026-04-17
**Phase:** 19 v2 (review BLOCK B2)

**What happened:**
nginx.conf.template used `upstream minio { server ${AWS_ENDPOINT}; }` where `AWS_ENDPOINT` is `http://minio:9000` (URL-shaped). After envsubst, nginx sees `server http://minio:9000;` which is invalid syntax (upstream `server` directive expects `host:port` WITHOUT scheme). nginx fails to start with an unhelpful error, and debugging requires pulling up nginx logs inside the container.

**Impact:**
- BLOCK-level bug caught in review. Would have been a runtime start failure for the cloudfront-sim container.
- The shape of `AWS_ENDPOINT` (scheme-included) is reasonable for most consumers (curl, aws-cli, most SDKs) but wrong for nginx upstream directives.
- Every nginx-based stack that proxies to minio will re-solve this parsing problem.

**Suggested improvement:**
- `@zerobias-com/nginx-base` stack providing a documented envsubst helper that parses URL-shaped env vars into `${*_HOST}` / `${*_PORT}` components before template substitution.
- Alternative: minio stack exports BOTH `AWS_ENDPOINT` (URL form) AND `MINIO_HOST` + `MINIO_PORT` (parsed components) so consumers can pick the right shape for their tool.
- Document the gotcha in zbb stacks-guide.md under "Common nginx integration mistakes."

---

### 010 — `zbb env` imports directive silently ignored when nested inside `env.<var>.imports`

**Category:** Tooling ergonomics / docs gap
**Date:** 2026-04-17
**Phase:** 19 v2 execution

**What happened:**
Plans wrote the following pattern to express "this stack's `CLOUDFRONT_SIM_PORT` should be inherited from cloudfront-sim":

```yaml
env:
  CLOUDFRONT_SIM_PORT:
    type: port
    imports: ["cloudfront-sim.CLOUDFRONT_SIM_PORT"]
```

zbb saw `type: port` and auto-allocated a fresh port (15101) for each consuming stack, **silently ignoring the nested `imports:` directive**. The correct pattern is a top-level `imports:` block (as shown in `zb/hub/zbb.yaml`):

```yaml
imports:
  cloudfront-sim:
    - CLOUDFRONT_SIM_PORT
    - CLOUDFRONT_SIM_URL
```

**Impact:**
- All three Phase 19 stacks ended up with independent port allocations for a var meant to be shared.
- Workaround: `zbb env set CLOUDFRONT_SIM_PORT 15002 --stack <name>` on every consuming stack (repetitive, error-prone).
- Director + planner both missed the pattern — not obvious from docs that the two forms aren't interchangeable.

**Suggested improvement:**
- `zbb stack add` should **warn** when `env.<var>.imports:` appears inside the env block (unsupported schema; user probably meant top-level `imports:`).
- stacks-spec.md should explicitly document: "`imports:` is a top-level directive only. Do NOT nest it inside `env.<var>`." Include a bad-vs-good example.
- Consider honoring the nested form as syntactic sugar (either is valid) — would remove the ambiguity entirely.

---

### 011 — zbb CLI commands (`build`, `stop`, and likely others) require a Gradle project

**Category:** Tooling gap / CLI design
**Date:** 2026-04-17 (build), 2026-04-21 (stop)
**Phase:** 19 v2 execution; re-surfaced at close-out

**What happened:**
Multiple zbb CLI commands fail outside a Gradle-backed repo with:

```
zbb: requires a Gradle project. Run from a directory with gradlew
```

Two confirmed instances, same root cause:
- **`zbb build <stack>`** — hardcoded to `./gradlew monorepoBuild`. Ignores `lifecycle.build:` from the stack manifest (`bash setup.sh build`, `npm run build:stack`, etc.). Forced consumers to bypass zbb entirely and invoke their own toolchain from the app root.
- **`zbb stop <stack>`** — fails from the same app directory where `zbb up` worked minutes before. Consumer apps that `zbb stack add` + `zbb up` have no zbb-native teardown path; must fall back to `docker stop` / `docker rm` with manually-discovered container names (compounds finding 013).

Presumably `restart`, `status`, `logs`, etc. fail the same way — not tested, but the pattern is "zbb shells through Gradle regardless of what the command is or whether it needs Gradle."

**Impact:**
- Inconsistent CLI surface: `zbb up` works from a non-Gradle directory; `zbb build` / `zbb stop` don't.
- Stack manifests' `lifecycle.*` declarations become documentation-only, not invocable.
- Breaks the "zbb manages stacks end-to-end" mental model — it manages bring-up but not build or teardown for non-Gradle consumers.
- Affects any 3rd-party dev building an app (Angular, React, Next.js, etc.) as a zbb stack. The module-authoring path is Gradle-centric; the consumer-app path isn't, but zbb doesn't know the difference.
- Error message is misleading — "requires a Gradle project" suggests the user is in the wrong directory, when actually the command itself is coupled to Gradle.

**Suggested improvement (feature request):**
- Decouple lifecycle commands (`up`, `stop`, `restart`, `status`, `logs`) from the Gradle-project requirement. These operate on docker compose and don't need Gradle.
- `zbb build` should honor `lifecycle.build:` from the stack manifest when present, falling back to Gradle only if no lifecycle hook is defined. Alternative: rename the Gradle-only command (`zbb gradle-build`) and make `zbb build` the lifecycle-driven entrypoint.
- Gradle-coupling should be limited to module/build-toolchain commands (`zbb publish`, etc.) where it's actually needed.
- Error message should distinguish "this command needs Gradle" vs. "zbb needs *some* context" — current message is misleading because `zbb up` worked from the exact same directory.

**Workaround:** For build, invoke the app's toolchain directly (`npm run build:stack`). For stop, use docker directly:
```bash
docker stop sme-mart-local-nginx sme-mart-local-minio
docker rm sme-mart-local-nginx sme-mart-local-minio
```

---

### 013 — `${STACK_NAME}` substitution is the slot name, not the stack alias

**Category:** Documentation gaps / Tooling gaps
**Date:** 2026-04-20
**Phase:** 19 (UAT re-verification)

**What happened:**
`zbb-stacks/cloudfront-sim/compose.yml` declares `container_name: "${STACK_NAME}-nginx"`. Phase 19 planners (and I) assumed `${STACK_NAME}` would be substituted with the stack's own name — `cloudfront-sim` — producing a container named `cloudfront-sim-nginx`. Both `sme-mart-spa/setup.sh` and `sme-mart-login/setup.sh` hardcoded that expectation in their `docker exec cloudfront-sim-nginx nginx -s reload` step, with a comment literally saying *"B1 FIX: use cloudfront-sim-nginx (actual container name)"*.

In practice `${STACK_NAME}` is substituted with the **slot** name (e.g. `sme-mart-local`), so the real container is `sme-mart-local-nginx`. The setup script's `docker exec` fails with `No such container: cloudfront-sim-nginx`, blocking the entire SPA/login deploy step.

Verified via `docker inspect`:
```
com.docker.compose.project: sme-mart-local
com.docker.compose.service: nginx
zerobias.slot:              sme-mart-local
```

**Impact:**
- Setup-script bug that survived Phase 19 review.
- Any dev who re-runs `zbb stack start` after the initial `zbb up` is guaranteed to hit this, because the SPA/login `start` lifecycle goes through setup.sh but the cloudfront-sim container isn't newly created (just the nginx reload).
- Confusing because the `container_name` line *looks* parameterized by the stack's own identity, not the enclosing slot.

**Suggested improvement (zbb docs / ergonomics):**
- `stacks-spec.md` should explicitly document what `${STACK_NAME}` resolves to and when. The current naming implies "the stack" but it's really "the slot (which is the docker-compose project)". Either rename the variable (`${SLOT_NAME}` would be honest) or call it out loudly in the spec.
- Better: expose a `${STACK_ALIAS}` or `${STACK_SELF}` variable so stacks that truly want per-stack container names can get them.
- `stacks-guide.md` recipe for "stack A talks to stack B's container" should recommend **looking up the container by compose service label**, not by guessing a name string. Something like:
  ```bash
  docker ps --filter "label=com.docker.compose.project=${STACK_NAME}" \
            --filter "label=com.docker.compose.service=nginx" \
            --format '{{.Names}}'
  ```
- Cross-stack plumbing that assumes a hardcoded peer-container name needs a smoke test that exercises the exact `docker exec` path.

**Workaround in this repo:** Patched both setup.sh files to resolve the cloudfront-sim nginx container by label (`com.docker.compose.service=nginx` + `zerobias.slot`). Fix is local; the underlying docs/tooling confusion remains.

---

## Open Invitations

If any of these findings feel ready to escalate as `/friction` entries in `zb-dx`, Clark can promote them individually. This doc is the working scratchpad; `zb-dx` is the shared knowledge base.
