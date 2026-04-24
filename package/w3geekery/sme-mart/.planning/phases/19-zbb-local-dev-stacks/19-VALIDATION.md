---
phase: 19
slug: zbb-local-dev-stacks
status: planning-complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-17
updated: 2026-04-17
---

# Phase 19 — Validation Strategy

> Infrastructure phase: validation is integration-level (curl probes, docker inspect, smoke scripts), not unit-test framework. No existing JS/TS test suite applies to stack manifests.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | shell smoke tests (`bash` + `curl` + `docker`) |
| **Config file** | none — Wave 3 ships smoke scripts into each stack dir |
| **Quick run command** | `bash zbb-stacks/<stack>/smoke.sh` |
| **Full suite command** | `bash zbb-stacks/smoke-all.sh` |
| **Estimated runtime** | ~30–60 seconds (stacks must be up) |

Unit-level validation = `grep`/`yq` assertions on committed files (see Per-Task Verification Map). Integration-level = `curl` against running stacks. E2E = manual browser login trace (documented in STACKS.md).

---

## Sampling Rate

- **After every task commit:** Run `grep`/`yq`/`docker inspect` assertions named in that task's `acceptance_criteria`
- **After every plan wave:** Run `bash zbb-stacks/smoke-all.sh`
- **Before `/gsd:verify-work`:** Manual browser login trace (brief Verification steps 5–7) + full smoke suite green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

**Populated by gsd-planner during Phase 19 plan creation (2026-04-17).**

Each task's `<acceptance_criteria>` section includes automated command(s). Executor runs these after each task to verify completion.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 19-01-T1 | 01 | 1 | LS-04 | file | `grep -q "isLocalDev: false" src/environments/environment.stack.ts` | ⬜ pending |
| 19-01-T2 | 01 | 1 | LS-04 | yaml | `yq '.projects.sme-mart.architect.build.configurations.stack' angular.json \| grep -q fileReplacements` | ⬜ pending |
| 19-01-T3 | 01 | 1 | LS-04 | json | `grep -q '"build:stack".*"ng build --configuration stack' package.json` | ⬜ pending |
| 19-01-T4 | 01 | 1 | LS-01, LS-04 | yaml | `yq '.name' zbb-stacks/cloudfront-sim/zbb.yaml \| grep -q cloudfront-sim && yq '.env.CLOUDFRONT_SIM_PORT.value' zbb-stacks/cloudfront-sim/zbb.yaml \| grep -q '15002'` | ⬜ pending |
| 19-01-T5 | 01 | 1 | LS-04, LS-05 | yaml | `yq '.services.nginx.image' zbb-stacks/cloudfront-sim/compose.yml \| grep -q nginx && yq '.volumes.cloudfront-sim-conf' zbb-stacks/cloudfront-sim/compose.yml` | ⬜ pending |
| 19-01-T6 | 01 | 1 | LS-01, LS-04 | nginx | `grep -q 'proxy_cookie_domain uat.zerobias.com localhost' zbb-stacks/cloudfront-sim/nginx.conf.template && grep -q 'include /etc/nginx/conf.d/apps/\*\.conf' zbb-stacks/cloudfront-sim/nginx.conf.template` | ⬜ pending |
| 19-01-T7 | 01 | 1 | LS-04, LS-05 | bash | `grep -q "envsubst '\${CLOUDFRONT_SIM_PORT},\${MINIO_PORT},\${AWS_ENDPOINT},\${UAT_ORIGIN}'" zbb-stacks/cloudfront-sim/docker-entrypoint.sh && test -x zbb-stacks/cloudfront-sim/docker-entrypoint.sh` | ⬜ pending |
| 19-02-T1 | 02 | 2 | LS-01, LS-04, LS-05 | yaml | `yq '.name' zbb-stacks/sme-mart-spa/zbb.yaml \| grep -q 'sme-mart-spa' && yq '.lifecycle.build' zbb-stacks/sme-mart-spa/zbb.yaml \| grep -q 'bash setup.sh build'` | ⬜ pending |
| 19-02-T2 | 02 | 2 | LS-01 | bash | `grep -q 'npm run build:stack' zbb-stacks/sme-mart-spa/setup.sh && grep -q 'mc mb --ignore-existing' zbb-stacks/sme-mart-spa/setup.sh && test -x zbb-stacks/sme-mart-spa/setup.sh` | ⬜ pending |
| 19-02-T3 | 02 | 2 | LS-01, LS-04 | nginx | `grep -q 'location /sme-mart/' zbb-stacks/sme-mart-spa/sme-mart-spa.conf && grep -q 'error_page 404 =200 /sme-mart/index.html' zbb-stacks/sme-mart-spa/sme-mart-spa.conf` | ⬜ pending |
| 19-03-T1 | 03 | 2 | LS-03, LS-04, LS-05 | yaml | `yq '.name' zbb-stacks/sme-mart-login/zbb.yaml \| grep -q 'sme-mart-login' && yq '.lifecycle.build' zbb-stacks/sme-mart-login/zbb.yaml \| grep -q 'npm run build'` | ⬜ pending |
| 19-03-T2 | 03 | 2 | LS-03 | bash | `grep -q 'npm run build --prefix package/w3geekery' zbb-stacks/sme-mart-login/setup.sh && grep -q 'docker exec.*nginx -s reload' zbb-stacks/sme-mart-login/setup.sh && test -x zbb-stacks/sme-mart-login/setup.sh` | ⬜ pending |
| 19-03-T3 | 03 | 2 | LS-03, LS-04 | nginx | `grep -q 'location /login/' zbb-stacks/sme-mart-login/sme-mart-login.conf && grep -q 'proxy_pass http://minio/sme-mart-login/' zbb-stacks/sme-mart-login/sme-mart-login.conf` | ⬜ pending |
| 19-04-T1 | 04 | 3 | LS-06 | markdown | `grep -q 'Real Login Flow' zbb-stacks/STACKS.md && grep -q 'troubleshooting' zbb-stacks/STACKS.md && wc -l zbb-stacks/STACKS.md \| awk '{print \$1}' \| grep -qE '^[0-9]{2,3}\$'` | ⬜ pending |
| 19-04-T2 | 04 | 3 | LS-01, LS-03 | bash | `grep -q 'STACKS_TO_TEST' zbb-stacks/smoke-all.sh && grep -q 'smoke.sh' zbb-stacks/smoke-all.sh && test -x zbb-stacks/smoke-all.sh` | ⬜ pending |
| 19-04-T3 | 04 | 3 | LS-01 | bash | `grep -q 'cloudfront-sim-nginx' zbb-stacks/cloudfront-sim/smoke.sh && grep -q 'curl -sf http://localhost:15002' zbb-stacks/cloudfront-sim/smoke.sh && test -x zbb-stacks/cloudfront-sim/smoke.sh` | ⬜ pending |
| 19-04-T4 | 04 | 3 | LS-01 | bash | `grep -q '/sme-mart/' zbb-stacks/sme-mart-spa/smoke.sh && grep -q 'rfps/test-route' zbb-stacks/sme-mart-spa/smoke.sh && test -x zbb-stacks/sme-mart-spa/smoke.sh` | ⬜ pending |
| 19-04-T5 | 04 | 3 | LS-03, LS-06 | bash | `grep -q '/login/' zbb-stacks/sme-mart-login/smoke.sh && test -x zbb-stacks/sme-mart-login/smoke.sh` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

N/A — No Wave 0 build gate. Plans 19-01 through 19-04 all autonomous.

Wave 1 builds Angular environment and cloudfront-sim stack manifest.
Wave 2 builds SPA and login stacks in parallel.
Wave 3 creates documentation and smoke test infrastructure.

---

## Integration-Level Smoke Tests (Wave 3)

After Wave 2 completes, run the full smoke suite:

```bash
bash zbb-stacks/smoke-all.sh
```

**Expected output:**
```
>>> Testing: cloudfront-sim
  [1/2] Checking containers...
    ✓ cloudfront-sim-nginx running
  [2/2] Checking nginx endpoint...
    ✓ nginx responding
✓ PASSED: cloudfront-sim

>>> Testing: sme-mart-spa
  [1/2] Checking /sme-mart/...
    ✓ /sme-mart/ returns index.html
  [2/2] Checking deep-route fallback...
    ✓ /sme-mart/rfps/test-route returns index.html (fallback working)
✓ PASSED: sme-mart-spa

>>> Testing: sme-mart-login
  [1/1] Checking /login/...
    ✓ /login/ returns login page
✓ PASSED: sme-mart-login

===========================================
✓ All smoke tests PASSED
```

---

## Manual-Only Verifications (E2E, before phase close)

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real UAT login cookie lands on `localhost` | LS-03 | Browser cookie jar inspection; cannot be asserted via curl reliably | Brief Verification steps 5–7: browser to `http://localhost:15002/login/`, log in with UAT creds, DevTools → Application → Cookies → confirm `Domain: localhost` (not `uat.zerobias.com`) |
| SPA picks up session after login redirect | LS-03 | Requires live browser redirect chain | Brief Verification step 7: after login, navigate to `http://localhost:15002/sme-mart/`; confirm SPA loads with whoAmI populated |
| WebSocket upgrade on `/app/session` | LS-03 (adjacent) | Live ws handshake during authenticated session | DevTools → Network → WS filter; confirm 101 Switching Protocols on `/app/session` URL |

---

## Validation Sign-Off Checklist

- [x] Every plan task has automated `acceptance_criteria` (grep/yq/curl/docker) in PLAN.md `<verify>` section
- [x] Per-Task Verification Map populated with 17 tasks across 4 plans
- [x] Sampling continuity: smoke tests after each wave (no 3 consecutive tasks without verify)
- [x] Wave 3 covers smoke-all.sh + per-stack smoke.sh scripts + STACKS.md documentation
- [x] No watch-mode flags in commands (all one-shot curl/grep/yq/bash)
- [x] Feedback latency < 60s (smoke tests run in ~30–60s; unit checks instant)
- [x] `nyquist_compliant: true` — all requirements mapped, all tests documented

**Approval status:** ✅ READY FOR EXECUTION

---

**Last updated:** 2026-04-17 (Phase 19 planning complete)
**Next review:** After execute-phase completes (Wave 1–3 verification)
