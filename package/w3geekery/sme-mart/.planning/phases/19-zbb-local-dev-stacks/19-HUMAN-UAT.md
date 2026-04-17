---
status: partial
phase: 19-zbb-local-dev-stacks
source: [19-VERIFICATION.md]
started: 2026-04-17T21:50:00Z
updated: 2026-04-17T21:50:00Z
---

## Current Test

[awaiting human testing — Director UAT gate per REVIEW-19-v2.md]

## Tests

### 1. Stack bring-up
expected: `zbb up cloudfront-sim sme-mart-spa sme-mart-login` brings all 3 containers healthy; `curl -sI http://localhost:15002/` returns 200; `curl -sI http://localhost:15002/sme-mart/` returns 200 with HTML; `curl -sI http://localhost:15002/login/` returns 200
result: [pending]

### 2. Real login flow (browser)
expected: Open http://localhost:15002/sme-mart/ in a fresh browser profile — redirect to /login → enter real UAT credentials → redirect back to /sme-mart/ with authenticated session. SME Mart app loads, whoAmI succeeds, org selector populates.
result: [pending]

### 3. Deep-route fallback (LS-01)
expected: Navigate directly to http://localhost:15002/sme-mart/rfps/any-id — SPA loads (no 404), Angular router resolves the route; `curl -sI http://localhost:15002/sme-mart/deep/nonexistent/path` returns 200 with index.html body (not 404 from minio).
result: [pending]

### 4. Cookie inspection (LS-03)
expected: DevTools → Application → Cookies → localhost:15002 shows session cookie rewritten to `Domain=localhost`, `Secure=false`, `SameSite=Lax` (not `Domain=uat.zerobias.com`). Cookie persists across page reloads; logout clears it.
result: [pending]

### 5. Teardown
expected: `zbb stop sme-mart-spa sme-mart-login cloudfront-sim` removes containers and location blocks; subsequent `curl http://localhost:15002/sme-mart/` returns connection refused or 502 (not stale 200); re-running `zbb up` is idempotent and succeeds.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
