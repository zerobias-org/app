# zbb Local Dev Stacks — SME Mart + Login

> Documentation for operating the unified-origin local development environment.

**Last updated:** 2026-04-17
**Status:** Production-ready for Phase 19

---

## Quick Start

### Prerequisites
- Docker + Docker Compose (required)
- Node.js 18+ + npm (for builds)
- `zbb` CLI installed and in PATH
- `mc` (MinIO Client) or Docker (for bucket ops)

### Bring Up (3 commands)
```bash
# From app/ repo root
zbb stack add ./zbb-stacks/cloudfront-sim
zbb stack add ./zbb-stacks/sme-mart-spa
zbb stack add ./zbb-stacks/sme-mart-login

# Start all stacks
zbb up cloudfront-sim sme-mart-spa sme-mart-login

# Verify everything is up (takes ~30s)
bash zbb-stacks/smoke-all.sh
```

Access:
- **SPA:** http://localhost:15002/sme-mart/
- **Login:** http://localhost:15002/login/
- **API proxy:** http://localhost:15002/api/* → uat.zerobias.com
- **Dana auth:** http://localhost:15002/dana/* → uat.zerobias.com

---

## Architecture

**Unified-origin reverse proxy pattern** (reference: `~/Projects/zb/ui/scripts/gateway.js`)

```
Client (browser)
    ↓
http://localhost:15002
    │
    ├─ /login/*           → minio://sme-mart-login/ (static files)
    ├─ /sme-mart/*        → minio://sme-mart-app/ (static SPA)
    ├─ /api/*             → proxy to uat.zerobias.com/api/ (with cookie rewriting)
    ├─ /dana/*            → proxy to uat.zerobias.com/dana/ (with cookie rewriting)
    └─ /app/session       → proxy to uat.zerobias.com/app/session (WebSocket)

All requests go through single nginx origin (localhost:15002).
Cookies scoped to localhost (not uat.zerobias.com).
Session sharing works — same cookies used for SPA + login.
```

---

## Real Login Flow (End-to-End)

### Step 1: Browser opens SPA
```bash
curl -i http://localhost:15002/sme-mart/
# Response: 200 index.html
# (SPA loads, no auth yet)
```

### Step 2: SPA detects 401, redirects to login
SPA calls `whoAmI()` → gets 401 Unauthorized → SDK calls `redirectLogin()`.

Browser automatically redirected to:
```
http://localhost:15002/login/
  ↓ (rendered by login page)
http://localhost:15002/dana/me/session/login?next=...&cookieDomain=localhost
```

### Step 3: Login endpoint creates session
nginx proxies `/dana/me/session/login` to `uat.zerobias.com/dana/me/session/login?cookieDomain=localhost`.

UAT login endpoint receives `cookieDomain=localhost` and includes it in Set-Cookie header.

nginx `proxy_cookie_domain uat.zerobias.com localhost;` rewrites the Domain attribute.

Browser stores cookie with `Domain=localhost`.

### Step 4: Session persists across SPA navigation
Browser reloads page or navigates to `http://localhost:15002/sme-mart/`.

SPA calls `whoAmI()` → request includes cookie (same domain).

API proxy forwards cookie to uat.zerobias.com → user authenticated.

---

## Manual Verification (Director UAT)

Run these commands to verify the full flow:

```bash
# 1. Containers running
docker ps | grep -E 'cloudfront-sim|minio' | wc -l
# Expected: 2+ containers

# 2. SPA loads
curl -i http://localhost:15002/sme-mart/ | head -5
# Expected: HTTP/1.1 200 OK, <html> in body

# 3. Deep-route fallback works (LS-01)
curl -s http://localhost:15002/sme-mart/rfps/test-route | grep -q 'index.html'
# Expected: index.html content returned (not 404)

# 4. Login page loads
curl -i http://localhost:15002/login/ | head -5
# Expected: HTTP/1.1 200 OK, login-related HTML

# 5. Browser real login (manual, requires UAT credentials)
#    Open http://localhost:15002/login/ in browser
#    Log in with valid uat.zerobias.com credentials
#    Observe: DevTools → Network tab → requests going to localhost:15002
#    Observe: DevTools → Application → Cookies → Domain: localhost (not uat.zerobias.com)

# 6. After login, navigate to SPA
#    Open http://localhost:15002/sme-mart/
#    SPA should load with session (no redirect to login)
#    Network tab shows requests with cookies

# 7. Teardown
zbb stop cloudfront-sim sme-mart-spa sme-mart-login
# Expected: All containers stopped gracefully
```

---

## Iteration Workflow

### Editing SPA Code

```bash
# 1. Edit src/components/...
# 2. Rebuild and upload
zbb build sme-mart-spa

# 3. Browser refresh (full page refresh, Cmd+Shift+R to clear cache)
# 4. New code is live — no restart needed, no container reload

# (minio bucket contents change; nginx picks up new files immediately)
```

### Editing Login Code

```bash
# 1. Edit login/package/w3geekery/src/views/...
# 2. Rebuild and upload
zbb build sme-mart-login

# 3. Browser refresh login page
# 4. New code is live

# (If Metalsmith output path changes, update LOGIN_BUILD_OUTPUT in zbb.yaml)
```

### Editing nginx Config

```bash
# 1. Edit zbb-stacks/cloudfront-sim/nginx.conf.template
# 2. Restart cloudfront-sim to pick up template
zbb stop cloudfront-sim
zbb up cloudfront-sim

# 3. All proxies restart with new config
```

---

## Cookie Inspection (DevTools)

**Browser DevTools → Application → Cookies**

### Expected state after login
| Property | Value | Notes |
|----------|-------|-------|
| **Domain** | localhost | NOT uat.zerobias.com (rewritten by nginx) |
| **Path** | / | LS-03 requirement: domain=localhost |
| **Expires** | (varies) | Depends on UAT login endpoint |
| **HttpOnly** | ✓ | Should be set (secure) |
| **Secure** | ✗ | NOT set (localhost is http, not https) |
| **SameSite** | Lax/Strict | Depends on UAT config |

**If you see `Domain=uat.zerobias.com`:** nginx `proxy_cookie_domain` directive is missing or incorrect. Check `docker logs <container> | grep proxy_cookie`.

---

## Troubleshooting

### Issue: `curl http://localhost:15002/sme-mart/` returns 502 Bad Gateway
**Cause:** minio not running or cloudfront-sim can't reach it.
**Fix:**
```bash
docker ps | grep minio
# If missing, start minio stack
zbb up @zerobias-com/minio

# Check nginx logs
docker logs <cloudfront-sim-container>
```

### Issue: SPA deep route returns 404 (not index.html)
**Cause:** nginx `error_page 404 =200 /sme-mart/index.html;` not working.
**Fix:**
```bash
docker exec <cloudfront-sim> cat /etc/nginx/conf.d/apps/sme-mart-spa.conf
# Verify error_page directive present
# Verify proxy_pass to minio correct

# If missing, run setup.sh start manually
bash zbb-stacks/sme-mart-spa/setup.sh start
```

### Issue: Browser shows login page, but cookies aren't being saved
**Cause:** Either SameSite=Strict policy OR cookie domain mismatch.
**Fix:**
1. DevTools → Cookies → verify Domain=localhost
2. If Domain=uat.zerobias.com, nginx isn't rewriting cookies
3. Check `docker logs <cloudfront-sim>` for proxy errors
4. Restart cloudfront-sim: `zbb stop cloudfront-sim && zbb up cloudfront-sim`

### Issue: `zbb build sme-mart-spa` fails with "npm run build:stack not found"
**Cause:** angular.json missing `stack` configuration or package.json missing script.
**Fix:**
```bash
# Verify angular.json has stack config
yq '.projects.sme-mart.architect.build.configurations.stack' angular.json

# Verify package.json has build:stack script
grep build:stack package.json

# If missing, check Plan 19-01 Task 2-3 for what to add
```

### Issue: `zbb build sme-mart-login` fails with "Login repo not found"
**Cause:** LOGIN_REPO_PATH is wrong.
**Fix:**
```bash
# Check where login/ actually is
ls -la ../../login/package/w3geekery/package.json

# Override env var
zbb env set LOGIN_REPO_PATH /absolute/path/to/login

# Or fix the zbb.yaml default (if repo was moved)
# edit zbb-stacks/sme-mart-login/zbb.yaml
```

---

## Teardown

```bash
# Stop all stacks
zbb stop cloudfront-sim sme-mart-spa sme-mart-login

# Remove docker volumes (if needed, clears minio data)
docker volume rm cloudfront-sim-conf sme-mart-spa sme-mart-login

# Or just restart from fresh
zbb stack remove cloudfront-sim sme-mart-spa sme-mart-login
zbb stack add ./zbb-stacks/cloudfront-sim
zbb stack add ./zbb-stacks/sme-mart-spa
zbb stack add ./zbb-stacks/sme-mart-login
```

---

## Environment Variables Reference

| Var | Default | Where Set | Override |
|-----|---------|-----------|----------|
| `CLOUDFRONT_SIM_PORT` | 15002 (fixed) | zbb.yaml | `zbb env set CLOUDFRONT_SIM_PORT 15003` |
| `SPA_REPO_PATH` | `../../../` (app root) | zbb.yaml | `zbb env set SPA_REPO_PATH /abs/path` |
| `LOGIN_REPO_PATH` | `../../../login` | zbb.yaml | `zbb env set LOGIN_REPO_PATH /abs/path` |
| `AWS_ENDPOINT` | (from minio) | imported | Set via minio stack |
| `AWS_ACCESS_KEY_ID` | (from minio) | imported | Set via minio stack |

---

## Smoke Test Suite

**Run all tests:**
```bash
bash zbb-stacks/smoke-all.sh
```

**Run individual stack test:**
```bash
bash zbb-stacks/cloudfront-sim/smoke.sh
bash zbb-stacks/sme-mart-spa/smoke.sh
bash zbb-stacks/sme-mart-login/smoke.sh
```

**Expected output:** All tests PASS ✓

---

## Performance

- **Bring-up time:** ~30–60 seconds (minio + cloudfront-sim + bucket creation)
- **Build time:** ~45–90 seconds (Angular), ~5 seconds (login Metalsmith)
- **Iteration (edit → build → refresh):** ~60–120 seconds total
- **Smoke tests:** ~30 seconds

---

## References

- **Architecture pattern:** `~/Projects/zb/ui/scripts/gateway.js` (canonical unified-origin proxy)
- **zerobias-client auth flow:** `~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts` (redirectLogin, getCookieDomain)
- **zbb design docs:** `~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-*.md`
- **Phase 19 brief:** `.planning/director/phase-19-brief.md`

---

**Last tested:** 2026-04-17 (Phase 19 planning)
**Next review:** When Hub module support (backlog 089) is added
