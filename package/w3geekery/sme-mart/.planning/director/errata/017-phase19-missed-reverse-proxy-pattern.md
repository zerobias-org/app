---
id: "017"
severity: high
phase: 19
found: 2026-04-17
status: open
---

# Phase 19 Missed Reverse-Proxy Architecture Pattern

Phase 19's design, research, plan, and director review all missed the reverse-proxy pattern that enables real session handoff (LS-03). gsd-execute discovered the pattern during execution via `zb/ui/scripts/gateway.js` reference architecture. Result: 12 files shipped that don't actually satisfy LS-01 (published-shape serving with real API flow) or LS-03 (session handoff verified locally).

**Root cause:**
- **Design phase** (Director brief): Mentioned "session handoff" as a requirement without tracing the mechanism. Cross-origin cookie problem never surfaced.
- **Research phase** (19-RESEARCH.md): Documented cloudfront-sim as "nginx → minio proxy" only. Never searched `zb/ui/` for the gateway pattern, despite it being a canonical-refs target.
- **Plan phase** (19-01/19-02): Treated SPA + login as two independent static-serving stacks with separate buckets. Architecture didn't account for unified origin, API proxy, or cookie handling.
- **Director review** (REVIEW-19.md): Flagged F3 "session handoff may not be testable locally" as FLAG not BLOCK. Correct call was BLOCK — "LS-03 is unverifiable without same-origin solution; design must resolve before plans lock."

**Impact:**
- 12 files shipped (zbb.yaml, docker-compose.yml, nginx.conf.template, setup.sh × 3 stacks + STACKS.md) that don't match the actual architecture needed.
- Wave 0 work (Hub module build-gate verification, deferred to backlog 089) is still valid.
- STACKS.md documentation describes the wrong flow — needs rewrite against real auth model.

**Fix:**
1. `git revert` or `git reset` Phase 19 commits on `poc/sme-mart` (Clark's call on mechanism).
2. Update `.planning/director/phase-19-brief.md` with reverse-proxy pattern as locked architecture:
   - Single cloudfront-sim nginx at `localhost:<port>` unifying all origins
   - Multi-location: `/login/*` → minio `sme-mart-login` bucket, `/sme-mart/*` → minio `sme-mart-app` bucket, `/api/*` + `/dana/*` + `/app/session` → reverse-proxy to `uat.zerobias.com` with `proxy_cookie_domain uat.zerobias.com localhost`
   - Angular `environment.stack.ts` with `isLocalDev: false`, `apiHostname: 'http://localhost:<port>'`
   - Login built with `npm run build` (not `--local`) so paths are `/login/assets/*`
   - Reference: `~/Projects/zb/ui/scripts/gateway.js` + `zerobias-client-app.ts` auth flow
3. Re-run `/gsd:discuss-phase 19` with new understanding.
4. Replan: likely 4-5 sub-plans (cloudfront-sim + SPA upload/env + login upload/build + Angular env + STACKS.md rewrite).

**Director self-discipline improvements (WATCH-LIST candidates):**
- When a requirement names a cross-origin browser interaction (session, cookies, iframe, BroadcastChannel), BLOCK the plan until the design traces the same-origin mechanism.
- When the phase mentions a reference implementation exists (`zb/ui/`, portal, etc.), verify the research phase actually read the reference code — not just the design docs.
- "Session handoff locally" is a BLOCK-worthy phrase. Localhost ports are different origins by default. Always.

**Lesson for v1.3 retro:**
The design → research → plan → review chain has a single-point-of-failure if no one in the chain thinks to read the reference implementation. Research phase should always include a `grep -r` or subagent sweep of the named reference repos for pattern names adjacent to the requirement (proxy, gateway, session, origin, iframe).
