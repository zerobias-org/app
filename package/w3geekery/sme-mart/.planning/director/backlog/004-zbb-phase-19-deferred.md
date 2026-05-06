---
id: "004"
priority: medium
scope: sme-mart
effort: small
found: 2026-04-21
status: open
promoted_to: null
---

# Phase 19 (zbb-local-dev-stacks) — deferred UAT + WIP polish

Phase 19 shipped all code and passed automated verification (see `.planning/phases/19-zbb-local-dev-stacks/19-VERIFICATION.md` — PASSED). A handful of live-system verifications and polish items were never completed before the phase was closed out. Capturing them here so they aren't lost when the next GSD plan starts.

## Deferred — human UAT (5 steps)

Source: `.planning/phases/19-zbb-local-dev-stacks/19-HUMAN-UAT.md`

1. **Stack bring-up** — `zbb up cloudfront-sim sme-mart-spa sme-mart-login` brings all 3 containers healthy; `curl -sI http://localhost:15100/` returns 200; `/sme-mart/` returns 200 HTML; `/login/` returns 200. (Note: actual port is 15100, not 15002 — see STACKS.md port note.)
2. **Real login flow (browser)** — Fresh profile → `http://localhost:15100/sme-mart/` → redirect to `/login` → real UAT credentials → redirect back authenticated. whoAmI succeeds, org selector populates.
3. **Deep-route fallback (LS-01)** — Direct nav to `http://localhost:15100/sme-mart/rfps/any-id` loads SPA (no 404). `curl -sI .../sme-mart/deep/nonexistent` returns 200 with index.html.
4. **Cookie inspection (LS-03)** — DevTools → session cookie has `Domain=localhost`, `Secure=false`, `SameSite=Lax` (not `uat.zerobias.com`). Persists across reloads; logout clears.
5. **Teardown** — `zbb stop sme-mart-spa sme-mart-login cloudfront-sim` removes containers and location blocks cleanly. Re-running `zbb up` is idempotent. **Note:** `zbb stop` currently fails outside a Gradle project (friction-log finding 014); workaround is `docker stop / rm` directly.

## Deferred — zbb friction findings (not yet escalated to zb-dx)

`.planning/notes/zbb-friction-log.md` accumulated 14 findings during Phase 19. None have been promoted to `/friction` entries in `zb-dx` yet. Worth a pass to pick the top 2-3 and escalate to Kevin/Daniel so zbb improvements land before the next round of stack work.

Top candidates for escalation:
- **011** — `zbb build` is Gradle-only, ignores `lifecycle.build:` from stack manifests.
- **013** — `${STACK_NAME}` substitutes the slot name (not the stack alias), breaking cross-stack `docker exec` wiring. Cost Phase 19 a re-verification cycle.
- **014** — `zbb stop` (and other lifecycle commands) also require a Gradle project. Companion to 011. Consumer apps have no zbb-native teardown path.

## Known pre-existing issue (not Phase 19's bug, but adjacent)

- `src/environments/environment.neon.ts` is gitignored but still tracked — was added to `.gitignore` after being committed. Needs a one-time `git rm --cached` + stub restore to stop diffs leaking the regenerated live password every time someone runs `npm start`. Related to backlog 003 (move UAT off direct Neon onto the Hub module).

## Decision needed before picking this up

- Is the zbb local stack still the intended long-term dev path, or are we accepting that UAT-backed dev is "good enough" for most work and the local stack is a niche tool?
  - If niche: mark UAT steps won't-do and retire the stacks when they bit-rot.
  - If mainline: schedule the 5 UAT steps as a small phase 19.x and commit to the teardown-bypass workaround until zbb fixes lifecycle-vs-Gradle coupling.

## Artifacts already in repo (from this close-out)

- `zbb-stacks/STACKS.md`, `zbb-stacks/cloudfront-sim/*`, `zbb-stacks/sme-mart-spa/*`, `zbb-stacks/sme-mart-login/*` — stack definitions and setup scripts.
- `src/environments/environment.stack.ts` — Angular env for the stack-mode build.
- `.planning/notes/zbb-friction-log.md` — 14 findings, ready for escalation.
