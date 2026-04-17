# Director Session State
**Last updated:** 2026-04-17T19:00:00-07:00
**Session name:** `Director Parks`
**Milestone:** v1.3 — **Phase 19 live-running; final UAT paused mid-stream.**

## FIRST — Read This on Resume

**Next session: no heavy skill-drift risk.** We parked at a CLEAN point — the SPA is running against UAT through the local zbb stack, and the only remaining work is one rebuild + browser UAT + phase-close. Resume plan at the end of this file.

## Mental Model

Phase 19 v2 (post-errata-017 replan) went through full execution + most of UAT today. Architecture is sound — **unified-origin reverse proxy with cookie-domain rewriting works end-to-end**. Browser loaded the SPA at `http://localhost:15100/sme-mart/` with valid session cookies auto-rewriting from `uat.zerobias.com` → `localhost`. API calls (`/api/dana/me`, `/api/dana/orgs`, `/api/platform/*`, `/api/hydra/tags`) all returning 200 against UAT.

**The core architectural thesis is proven.** Errata 017 was the right call — this WOULD NOT have worked under the original "two static-serving stacks" design. Clark's UAT session is transparently flowing through to localhost via `proxy_cookie_domain`.

**Phase 19 is NOT closed.** One more build + redeploy + final browser check remaining. See "What to Do on Resume."

## Open Items

### Phase 19 — pending ONE rebuild cycle before close

**Last config change was in-flight when we paused:**
- `environment.stack.ts`: `dbMode: 'neon'` restored (Generic SQL Hub Module not working in platform per Clark; Neon-direct is the only path today)
- `neonConnectionString: NEON_DATABASE_URL` imported from `environment.neon` (same pattern as `environment.ts`)
- `package.json`: added `prebuild:stack` hook (runs `gen-neon-env.mjs`)

**To complete Phase 19:**
1. `npm run build:stack && zbb stack stop sme-mart-spa && zbb stack start sme-mart-spa`
2. Browser hard-refresh `http://localhost:15100/sme-mart/` — SPA should load with Neon-backed features working (notes hierarchy, other 7 Neon-only tables)
3. Spot-check: cookies on localhost (already confirmed working via MCP browser), deep-route refresh, login flow in Incognito (optional — we already verified the machinery)
4. If green → Director flips `REVIEW-19-v2.md` to full close, mark phase complete in ROADMAP (GSD's job)

### Uncommitted session state (to clean up on resume, or leave for gsd-execute)

**Code changes (valuable, keep):**
- `package.json` — added `prebuild:stack` hook
- `environment.stack.ts` — dbMode:neon + NEON_DATABASE_URL import + apiHostname:15100 (zbb allocated, not locked 15002)
- `environment.ts` — (need to verify what's modified)
- `zbb-stacks/cloudfront-sim/compose.yml` — MINIO_PORT/HOST removed from env (entrypoint extracts), depends_on:minio removed
- `zbb-stacks/sme-mart-spa/setup.sh` — single-mc-container pattern, browser/ subdir upload, correct container name, correct volume name, exact-match /sme-mart/ location
- `zbb-stacks/sme-mart-spa/sme-mart-spa.conf` — (verify)
- `zbb-stacks/sme-mart-spa/zbb.yaml` — lifecycle.stop + health.command fixed
- `zbb-stacks/sme-mart-login/setup.sh` — same fixes + redirect to /login/en_us/login.html
- `zbb-stacks/sme-mart-login/sme-mart-login.conf` — redirect to en_us/login.html
- `zbb-stacks/sme-mart-login/zbb.yaml` — health.command + lifecycle.stop fixed
- `.claude/notes/zbb-friction-log.md` — findings 010-012 added

**Debris (can clean up):**
- `zbb-stacks/sme-mart-spa/setup.log`
- `zbb-stacks/sme-mart-login/setup.log`

**Plan files have stale content vs reality:**
- `19-01-PLAN.md` / `19-02-PLAN.md` / `19-03-PLAN.md` / `19-04-PLAN.md` — show the ORIGINAL planned content; the actual shipped code diverged significantly due to the 10+ execution bugs we fixed. These plan modifications from the B1/B2/F-NEW-1/F-NEW-3 fix pass aren't committed. Either commit them as "plan updated during execution" OR accept that the committed plans don't match reality and lean on SUMMARY.md for what actually shipped.

### Active errata (5 open across milestones)

- **006** — UAT vendor/buyer accounts (v1.2 carry)
- **010** — gsd-executor MCP allowlist gap (v1.2 carry, harness-level)
- **011** — fire-and-forget `pushEntity` audit (THIS IS Phase 20 — still pending)
- **012** — pipeline → hydra Resource FK gap (Kevin escalation)
- **015** — environment.neon.ts credential leak (remediated; Neon password rotation still owed, credential `npg_NjsYRTy2U6re` was on origin ~7 weeks)
- **017** — Phase 19 missed reverse-proxy pattern (filed during v1 → v2 revert)
- **018** — Plan 19-03 path drift + latent path-default bugs (filed during execution)

### Phase 19 execution bugs NOT yet written up as errata

Worth consolidating into a single errata or a follow-up plan-quality review entry at v1.3 retro:
- Nested `env.<var>.imports` silently ignored by zbb (not an errata — documented in friction log 010)
- `dependencies:` vs `depends:` key name
- Angular `--base-href=/sme-mart` needs trailing slash
- Angular 17+ outputs to `browser/` subdir (plan assumed flat dist/)
- `process.env` in Angular environment (doesn't work in browser)
- Port allocation doesn't honor `value:` in `type: port` env declarations
- Port overrides get wiped across `stack stop/start`
- docker-compose can't do bash `${VAR##*:}` expansion
- Login repo is Lerna legacy (not npm workspaces) — `npm install` at root doesn't recurse
- Login `.npmrc` was missing `@zerobias-com` scope mapping
- `minio/minio:latest mc` vs `minio/mc:latest` image confusion
- mc container needs `--network` + volume mount for uploads
- `mc policy set` → `mc anonymous set` deprecation
- Stale slot containers fool zbb health checks on shared ports

## Recent Decisions (details in DECISIONS.md — not all captured there yet)

- **2026-04-17**: Phase 19 v2 replanned + executed against UAT backend with unified-origin reverse proxy. Architecture validated in live browser.
- **2026-04-17**: `dbMode: 'neon'` is load-bearing for now — Generic SQL Hub Module doesn't work in platform yet (per Clark). Neon URL is visible in client bundle; accepted trade-off until the Hub path actually works.
- **2026-04-17**: Backlog 089 (custom Hub Module local hosting) analyzed and likely unnecessary given Pipeline+GQL direction. 089 stays in backlog with "re-evaluate need first" framing.
- **2026-04-17**: Port override pattern didn't work reliably across `zbb stack stop/start` — surrendered to zbb's allocated port (15100) and updated `environment.stack.ts` to match. Fighting zbb allocation was a dead end.

## Friction Patterns New This Session

1. **Nested schema directives silently ignored.** zbb saw `env.<var>.imports:` and auto-allocated; the intended import was dropped. No warning. Logged as friction 010.
2. **CLI command renames break muscle memory.** `zbb up` → `zbb stack start`. Friction 012.
3. **Build system assumes Gradle.** `zbb build <stack>` hardcoded to `./gradlew`, ignores `lifecycle.build:` from manifest. Friction 011.
4. **Cascade of plan bugs exposed incrementally at runtime.** Each fix revealed the next one. 10+ execution bugs caught by Director + fixed in-place. Root cause for most: plans were authored from canonical docs without a working reference app to copy from.
5. **zbb example library absence is expensive.** A single working reference app (Angular SPA + login + API proxy) in `zbb/stacks/examples/` would have compressed Phase 19 execution by ~70%. Logged as friction meta-finding.

## What to Do on Resume

### Immediate (5 min)
1. Skill refresh: re-read `~/.claude/commands/meta/director.md` — the usual required-reading pass.
2. Read this SESSION-STATE fully before doing anything else.
3. Verify stacks are still up: `docker ps | grep -E 'sme-mart-local|nginx|minio'`. If they're down, bring back up: `zbb slot load sme-mart-local && zbb stack start minio && zbb stack start cloudfront-sim && zbb stack start sme-mart-spa && zbb stack start sme-mart-login`.

### Close Phase 19 (30–60 min)
1. Finish the in-flight rebuild:
   ```
   npm run build:stack && zbb stack stop sme-mart-spa && zbb stack start sme-mart-spa
   ```
2. Browser UAT: Clark opens `http://localhost:15100/sme-mart/`. Verifies:
   - SPA loads with session (or redirects through `/login/` → Microsoft OAuth → back)
   - Notes hierarchy and other Neon-backed features work (proves `dbMode: 'neon'` path)
   - Cookies at `Domain=localhost` in DevTools
   - Deep-route refresh (`/sme-mart/rfps/test-route`) returns index.html
3. If green: update REVIEW-19-v2.md sign-off to "UAT PASSED", tell gsd-execute to mark phase complete + close in ROADMAP.
4. Commit the uncommitted stack/setup.sh fixes under a single commit: `fix(phase-19): resolve 10+ execution bugs from UAT` with the friction-log findings linked.

### Housekeeping
5. Clean up `setup.log` files (gitignore or just delete).
6. Consider: should the updated plan files be committed too (plans-match-reality) or should a post-execution SUMMARY.md be the record of truth? Director default: keep plans as-planned, rely on SUMMARY.md for actual.

### Before v1.3 retrospective
7. Consolidate the 10+ execution bugs into a single process-level errata — there's a pattern here (planner can't know what it can't see; zbb example library absence) that's worth a first-class retro finding, not scattered across the friction log.

## Session housekeeping (non-Director context)

- Docker Swarm is initialized on Clark's machine (`docker swarm init` ran today). Persistent.
- zbb slot `sme-mart-local` is created and currently loaded in his terminal. All 4 stacks registered: minio, cloudfront-sim, sme-mart-spa, sme-mart-login.
- Old orphan slot `sme-mart-dev` was deleted (had stale containers from Phase 19 v1 run).
- Pane layout on tmux: I (Director) got moved to be immediately-left of Clark's bash terminal. Not relevant for tmux on resume but noted.
- `.env.local` at project root has `NEON_DATABASE_URL`. `environment.neon.ts` is gitignored.
- Errata 015 Neon credential rotation still owed.
