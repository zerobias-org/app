---
phase: 19
slug: zbb-local-dev-stacks
reviewed: 2026-04-17
verdict: PASS (after fix-pass)
blocks: 0
flags: 1
notes: 2
sign_off: "2026-04-17 — B1, B2, F-NEW-1, F-NEW-3 all verified landed. F-NEW-2 deferred non-blocking."
---

# Director Review — Phase 19 v2 (Replan after Errata 017)

**Plans reviewed:** 19-01 (Wave 1, 7 tasks), 19-02 (Wave 2, 3 tasks), 19-03 (Wave 2, 3 tasks), 19-04 (Wave 3, 5 tasks)
**Supporting artifacts:** 19-CONTEXT.md (D-01..D-14), 19-RESEARCH.md (819 lines — confirmed zb/ui reference sweep), 19-VALIDATION.md

## Architecture Verification

Plans correctly implement the brief v2 reverse-proxy architecture. Errata 017 root-cause lesson was absorbed:
- ✓ Single unified-origin nginx (cloudfront-sim) at localhost:15002
- ✓ Static buckets (/sme-mart/, /login/) + reverse-proxy (/api/, /dana/, /app/session)
- ✓ `proxy_cookie_domain uat.zerobias.com localhost` + `proxy_cookie_flags ~ nosecure`
- ✓ `environment.stack.ts` with `isLocalDev: false`
- ✓ Login built with `npm run build` (not `--local`)
- ✓ D-01 through D-14 all cross-referenced in tasks
- ✓ Prior review's F1/B2/N2/N3 flags all resolved

## BLOCK Issues

### B1 — Cross-stack `docker exec` uses wrong container name

**Location:** 19-02/setup.sh line 347, 19-03/setup.sh line 361, 19-02/zbb.yaml line 176, 19-03/zbb.yaml `lifecycle.stop`

`${STACK_NAME}` expands to the stack running setup.sh (`sme-mart-spa`/`sme-mart-login`), but the target container belongs to a DIFFERENT stack (`cloudfront-sim`). Per Plan 19-01 compose.yml line 338, the target container's actual name is `cloudfront-sim-nginx`.

Result: `docker exec sme-mart-spa-cloudfront-sim nginx -s reload` returns "No such container" → swallowed by `|| echo` fallback → nginx never reloads → location blocks don't load until cloudfront-sim container restart.

**Fix:** Replace `${STACK_NAME}-cloudfront-sim` with `cloudfront-sim-nginx` (deterministic per D-06) OR import `CLOUDFRONT_SIM_CONTAINER_NAME` from cloudfront-sim's exports and use that.

### B2 — nginx upstream directive has invalid syntax

**Location:** 19-01/nginx.conf.template line 449–450

```nginx
upstream minio {
  server ${AWS_ENDPOINT};   # AWS_ENDPOINT is URL-shaped (http://minio:9000)
}
```

After envsubst: `server http://minio:9000;` — nginx `upstream server` directive expects `host:port` WITHOUT scheme. nginx fails syntax validation and the container won't start.

**Fix:** Entrypoint script (19-01/docker-entrypoint.sh) already extracts `MINIO_PORT` via parameter expansion. Add `MINIO_HOST` extraction (strip scheme + port from `AWS_ENDPOINT`). Update template to `server ${MINIO_HOST}:${MINIO_PORT};`. Add both to envsubst's explicit var list.

Also: Plan 19-01 Task 6 defines `upstream uat_backend` (unused — location blocks use `proxy_pass https://uat.zerobias.com/...` directly). Remove the dead code.

## FLAGs

### F-NEW-1 — Smoke scripts hardcode port 15002 (accept checker's fix)

Port is locked by design (D-10/D-11) but `zbb env set CLOUDFRONT_SIM_PORT <N>` override exists — smoke tests should honor it. Change all 4 smoke.sh scripts + smoke-all.sh to `PORT="${CLOUDFRONT_SIM_PORT:-15002}"` and use `$PORT` in curl invocations.

### F-NEW-2 — STACKS.md troubleshooting gaps (checker's framing confused but point is valid)

Plan 19-04's Real Login Flow documentation is accurate — UAT is the backend, cookies get rewritten, user identity is real. No architectural confusion. But troubleshooting is thin on external failure modes:
- UAT unreachable (VPN down, UAT outage) → `/dana/*` returns 502. Add entry.
- Invalid credentials → UAT 401 — what does the SPA do? Redirect loop? One line to explain expected behavior.

Add as follow-up tasks to Plan 19-04, not a BLOCK.

### F-NEW-3 — `lifecycle.stop` doesn't clean up location block

**Location:** 19-02/zbb.yaml line 176, 19-03/zbb.yaml

Current stop reloads nginx but leaves the `.conf` file in the shared volume. Result: after `zbb stop sme-mart-spa`, `curl localhost:15002/sme-mart/` still routes there via nginx → returns 502 or stale content because bucket is gone.

**Fix:** `lifecycle.stop` should remove `/etc/nginx/conf.d/apps/<stack-name>.conf` from the volume (via same docker-volume-copy pattern used in setup.sh) before reload.

## NOTES

### N-NEW-1 — minio bucket public policy

setup.sh sets bucket policy to `public` for nginx to proxy without auth. Fine for local dev. One sentence in STACKS.md clarifying "local dev only; production uses signed URLs" would prevent a reader from thinking this is a secure pattern.

### N-NEW-2 — Dead code: `upstream uat_backend`

See B2 fix — remove or use.

## Pre-approval Checklist

- [x] Every requirement ID (LS-01, LS-03, LS-04, LS-05, LS-06) appears in tasks (LS-02 formally deferred to backlog 089)
- [x] Cross-repo data flow traced end-to-end (cookie rewriting, real auth path documented in 19-04)
- [x] Automated verify on every task (17 tasks across 4 plans, per 19-VALIDATION.md)
- [x] Prior phase docs + errata 017 + reference architecture all in canonical_refs
- [x] No spec decisions left unpersisted (D-01..D-14 captured)
- [ ] BLOCKs resolved in plan revision — B1 and B2 pending

## Verdict

**CONDITIONAL PASS.** Architecture is correct — the hard part (errata 017 correction) landed fully. The 2 BLOCKs are execution-detail bugs: wrong container name in one cross-stack call, and URL-vs-host-port confusion in the nginx upstream directive. Both are ~5-line fixes.

Execution can dispatch after B1 + B2 fixes in Plans 19-01/19-02/19-03. FLAGs and NOTES can ride along as polish during execution or go to a follow-up pass.

**One more Director-discipline note:** these BLOCKs are exactly the kind of "runtime path tracing" errors my review process should catch every time. The architectural review bar (errata 017 lesson) is met; the execution-bug bar also needs attention. Keeping it on the radar for v1.3 retro.

---

## Sign-off (2026-04-17, iteration 2/3)

Re-verified all 4 Director-required fixes landed correctly in the plan files:

| Fix | Verified at | Evidence |
|-----|-------------|----------|
| **B1** — literal `cloudfront-sim-nginx` | 19-02-PLAN.md L176, L350; 19-03-PLAN.md L174, L365 | `docker exec cloudfront-sim-nginx nginx -s reload` (no `${STACK_NAME}-*`); silent `\|\| echo` replaced with `exit 1` on reload failure in setup.sh |
| **B2** — nginx upstream host:port | 19-01-PLAN.md L452 (template), L561-568 (entrypoint) | Two-step extraction `MINIO_HOST="${AWS_ENDPOINT#*://}"` then `"${MINIO_HOST%%:*}"` → just `minio`/`localhost`; `MINIO_PORT` extracted separately; `upstream minio { server ${MINIO_HOST}:${MINIO_PORT}; }` → valid host:port form. Dead `upstream uat_backend` removed. |
| **F-NEW-1** — dynamic PORT | 19-04-PLAN.md L455, L556, L604, L654 | `PORT="${CLOUDFRONT_SIM_PORT:-15002}"` in smoke-all.sh; `PORT="${PORT:-15002}"` in each per-stack smoke.sh; propagation via `PORT="$PORT" bash "$SMOKE_SCRIPT"` |
| **F-NEW-3** — remove .conf before reload | 19-02-PLAN.md L176; 19-03-PLAN.md L174 | `docker run --rm -v cloudfront-sim-conf:/mnt alpine:latest rm -f /mnt/<stack>.conf && docker exec cloudfront-sim-nginx nginx -s reload \|\| true` — ordering preserved (`&&`) |

**Verdict: PASS.** F-NEW-2 (STACKS.md troubleshooting gaps) and N-NEW-1/N-NEW-2 remain as deferred polish — non-blocking. Ready for `/gsd:execute-phase 19`.
