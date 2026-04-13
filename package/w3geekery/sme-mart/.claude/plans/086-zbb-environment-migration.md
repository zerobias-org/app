# Plan 086: SME Mart zbb Slot-Based Environment Migration

**Status:** Draft
**Estimated effort:** 6-8 hours (1 day)
**Backlog item:** New (086)
**Dependencies:** `@zerobias-org/zbb` v0.3.42+, Node.js >=22

---

## Overview

Replace SME Mart's current env var source (`.env.local` + `dotenv-cli`) with `@zerobias-org/zbb` slots. Each environment (UAT, QA, Prod, CI) becomes a named slot holding that environment's credentials. The Angular dev server proxy configs **stay exactly as they are** — they're dev server middleware that injects `Authorization: APIKey` headers and `dana-org-id` cookies. zbb only changes **where the env vars come from**.

**Impact:** Dev-only tooling change. No production deployment impact (Vercel builds don't use zbb). Backwards-compatible during migration.

---

## What Changes vs. What Stays

### What zbb replaces

| Current | Replacement |
|---------|-------------|
| `.env.local` holding creds for 4 environments mixed together | zbb slots — one slot per environment, isolated creds |
| `dotenv -e .env.local --` prefix on every npm script | `zbb --slot sme-mart-uat npm run <script>` |
| Manual `.env.local` copy-paste for new devs | `zbb slot create sme-mart-uat && zbb env set ...` |

### What stays exactly as-is

| File | Why it stays |
|------|--------------|
| `proxy-uat.conf.js`, `proxy-qa.conf.js`, `proxy-dev.conf.js`, `proxy-prod.conf.js` | These are Angular CLI dev server proxies. They inject `Authorization: APIKey` headers and `dana-org-id` cookies so you don't have to login through the external auth flow. They read env vars (`ZEROBIAS_UAT_API_KEY`, etc.) and forward `/api` requests to the right backend. **This is Angular infrastructure, not env management.** |
| `proxy-common.js` | Shared proxy factory. Reads API_KEY_ENV_VAR and ORG_ID_ENV_VAR. Untouched. |
| `scripts/gen-neon-env.mjs` | Reads `NEON_DATABASE_URL` from `process.env`. Works identically whether that var comes from dotenv or zbb. Zero changes. |
| Angular environment files (`environment.ts`, `environment.uat.ts`, etc.) | Build-time configs baked into bundles for Vercel deployments. Unrelated to local dev env switching. |
| Per-environment npm scripts (`dev:uat`, `dev:qa`, `dev:prod`) | Still exist, still pick the right proxy config. Only the env-var-loading mechanism changes. |

**The key insight:** The proxy configs already read env vars via `process.env[envVar]`. They don't care whether those vars come from `dotenv-cli` loading `.env.local` or from `zbb --slot` loading a slot manifest. zbb is a drop-in replacement for dotenv-cli.

---

## Key Design Decisions

### Where does `zbb.yaml` go?

**SME Mart root** (`sme-mart/zbb.yaml`). Declares expected env vars. Each developer's slots hold the actual values.

### What happens to `.env.local`?

**Kept as fallback during transition.** Old workflow (`dotenv -e .env.local -- ng serve`) still works via renamed `dev:legacy` scripts. Removed in Phase 4 cleanup.

### New developer setup flow

```bash
# 1. Install zbb globally (one-time)
npm install -g @zerobias-org/zbb

# 2. Create a slot for each environment you use
zbb slot create sme-mart-uat
zbb env set ZEROBIAS_UAT_API_KEY=<your-uat-key>
zbb env set ZEROBIAS_UAT_ORG_ID=<your-uat-org-id>
zbb env set NEON_DATABASE_URL=<your-neon-url>

# 3. Start dev server (zbb --slot loads env vars, then runs npm script)
zbb --slot sme-mart-uat npm run dev
```

### Rollback plan

Revert `package.json` scripts to `dotenv -e .env.local --` prefix, revert engines to `>=18.19.1`, keep `.env.local`. Slot env vars can be exported back to `.env.local` format via `zbb env list`.

---

## Phase 1: Foundation — zbb.yaml & Node 22 Upgrade

**Goal:** Declare env schema, upgrade Node, verify zbb installs cleanly.
**Effort:** 3-4 hours
**Shippable independently:** Yes (no runtime changes)

### 1.1 Create `zbb.yaml`

Declare the env vars the proxy configs already read:

```yaml
# zbb.yaml — SME Mart environment declarations
name: sme-mart
description: SME Mart Angular development environment

env:
  # UAT — default dev target (used by proxy-uat.conf.js)
  ZEROBIAS_UAT_API_KEY:
    type: string
    sensitive: true
    description: UAT API key (read by proxy-uat.conf.js)
    required: false

  ZEROBIAS_UAT_ORG_ID:
    type: string
    description: UAT org ID (injected as dana-org-id cookie)
    required: false

  # QA (used by proxy-qa.conf.js)
  ZEROBIAS_QA_API_KEY:
    type: string
    sensitive: true
    required: false

  ZEROBIAS_QA_ORG_ID:
    type: string
    required: false

  # Prod (used by proxy-prod.conf.js)
  ZEROBIAS_PROD_API_KEY:
    type: string
    sensitive: true
    required: false

  ZEROBIAS_PROD_ORG_ID:
    type: string
    required: false

  # Legacy CI/dev (used by proxy-dev.conf.js)
  API_KEY:
    type: string
    sensitive: true
    description: Legacy CI API key (proxy-dev.conf.js)
    required: false

  ZB_ORG_ID:
    type: string
    description: Legacy CI org ID (proxy-dev.conf.js)
    required: false

  # Neon database (read by scripts/gen-neon-env.mjs)
  NEON_DATABASE_URL:
    type: string
    sensitive: true
    description: Neon serverless Postgres connection string
    required: false

preflight:
  tools:
    - name: node
      version: ">=22.0.0"
      command: "node --version"
    - name: npm
      version: ">=10.2.4"
      command: "npm --version"
```

**File:** `sme-mart/zbb.yaml` (new)

**Note:** The env var names match exactly what the existing proxy configs read. Nothing in the proxy configs needs to change.

### 1.2 Update `package.json` engines

```diff
  "engines": {
-   "node": ">=18.19.1",
+   "node": ">=22.0.0",
    "npm": ">=10.2.4"
  },
```

### 1.3 Add `@zerobias-org/zbb` as devDependency

```bash
npm install -D @zerobias-org/zbb@^0.3.42
```

### 1.4 Verify Node 22 compatibility

- `npm install` on Node 22
- `npm run build` — Angular CLI + deps work
- `npm run test` — vitest passes
- `npm run e2e` — Playwright passes

**Risk:** Some native deps may need rebuild. Check for warnings.

### Phase 1 Success Criteria

- [ ] `zbb.yaml` exists at sme-mart root
- [ ] `package.json` engines require Node >=22
- [ ] `@zerobias-org/zbb` in devDependencies
- [ ] `npm install && npm run build` passes on Node 22
- [ ] Existing `.env.local` + dotenv workflow still works unchanged

---

## Phase 2: Parallel Slot-Based Dev Scripts

**Goal:** Add `slot:*` scripts alongside existing dotenv scripts. Both workflows work.
**Effort:** 1-2 hours
**Shippable independently:** Yes (purely additive)
**Depends on:** Phase 1

### 2.1 Add slot-powered npm scripts

Keep all existing scripts intact. Add parallel scripts that use zbb instead of dotenv-cli:

```json
{
  "scripts": {
    "predev": "dotenv -e .env.local -- node scripts/gen-neon-env.mjs",
    "dev": "dotenv -e .env.local -- ng serve --proxy-config proxy-uat.conf.js",

    "preslot:dev": "node scripts/gen-neon-env.mjs",
    "slot:dev": "ng serve --proxy-config proxy-uat.conf.js",

    "preslot:dev:uat": "node scripts/gen-neon-env.mjs",
    "slot:dev:uat": "ng serve --proxy-config proxy-uat.conf.js",

    "preslot:dev:qa": "node scripts/gen-neon-env.mjs",
    "slot:dev:qa": "ng serve --proxy-config proxy-qa.conf.js",

    "preslot:dev:ci": "node scripts/gen-neon-env.mjs",
    "slot:dev:ci": "ng serve --proxy-config proxy-dev.conf.js",

    "preslot:dev:prod": "node scripts/gen-neon-env.mjs",
    "slot:dev:prod": "ng serve --proxy-config proxy-prod.conf.js"
  }
}
```

**Usage:** `zbb --slot sme-mart-uat npm run slot:dev:uat`

The `slot:*` scripts are identical to existing scripts **minus the `dotenv -e .env.local --` prefix**. zbb loads env vars into the shell before running, so dotenv-cli isn't needed.

**File:** `sme-mart/package.json`

### 2.2 Document slot creation in SETUP.md

```bash
# UAT slot (default)
zbb slot create sme-mart-uat
zbb env set ZEROBIAS_UAT_API_KEY=<your-uat-key>
zbb env set ZEROBIAS_UAT_ORG_ID=<your-uat-org-id>
zbb env set NEON_DATABASE_URL=<your-neon-url>

# QA slot
zbb slot create sme-mart-qa
zbb env set ZEROBIAS_QA_API_KEY=<your-qa-key>
zbb env set ZEROBIAS_QA_ORG_ID=<your-qa-org-id>

# Prod slot
zbb slot create sme-mart-prod
zbb env set ZEROBIAS_PROD_API_KEY=<your-prod-key>
zbb env set ZEROBIAS_PROD_ORG_ID=<your-prod-org-id>

# Legacy CI slot
zbb slot create sme-mart-ci
zbb env set API_KEY=<your-ci-key>
zbb env set ZB_ORG_ID=<your-ci-org-id>
```

**File:** `sme-mart/SETUP.md` (new)

### Phase 2 Success Criteria

- [ ] `zbb --slot sme-mart-uat npm run slot:dev:uat` starts the app
- [ ] API calls include correct `Authorization` header (proxy-uat.conf.js read the slot's env var)
- [ ] `dana-org-id` cookie injected correctly
- [ ] `environment.neon.ts` generated correctly from slot's NEON_DATABASE_URL
- [ ] Old `npm run dev` with `.env.local` still works unchanged (backwards compat)

---

## Phase 3: Cutover — Make Slots the Default

**Goal:** Swap default scripts to use slots. Move dotenv-based scripts to `dev:legacy:*`.
**Effort:** 1-2 hours
**Shippable independently:** Yes (but Phase 2 should be stable first)
**Depends on:** Phase 2 validated

### 3.1 Swap default npm scripts

```json
{
  "scripts": {
    "predev": "node scripts/gen-neon-env.mjs",
    "dev": "ng serve --proxy-config proxy-uat.conf.js",
    "dev:uat": "ng serve --proxy-config proxy-uat.conf.js",
    "dev:qa": "ng serve --proxy-config proxy-qa.conf.js",
    "dev:ci": "ng serve --proxy-config proxy-dev.conf.js",
    "dev:prod": "ng serve --proxy-config proxy-prod.conf.js",

    "dev:legacy": "dotenv -e .env.local -- ng serve --proxy-config proxy-uat.conf.js",
    "dev:legacy:qa": "dotenv -e .env.local -- ng serve --proxy-config proxy-qa.conf.js"
  }
}
```

Now the default `dev` script expects a zbb slot loaded. Old workflow moves to `dev:legacy`.

**Usage:** `zbb --slot sme-mart-uat npm run dev`

**File:** `sme-mart/package.json`

### 3.2 Update `.env.local.example` with deprecation notice

```
# DEPRECATED — Use zbb slots instead. See SETUP.md.
# This file is kept for backwards compatibility with `npm run dev:legacy`.
#
# Migration:
#   zbb slot create sme-mart-uat
#   zbb env set ZEROBIAS_UAT_API_KEY=<your-key>
#   zbb env set ZEROBIAS_UAT_ORG_ID=<your-org-id>
#   zbb --slot sme-mart-uat npm run dev
```

**File:** `sme-mart/.env.local.example`

### 3.3 Add slot check to predev (optional)

Warn if `npm run dev` is called without a slot and without `.env.local`:

```javascript
// scripts/check-env.mjs
const hasSlot = !!process.env.ZB_SLOT;
const hasApiKey = !!process.env.ZEROBIAS_UAT_API_KEY;

if (!hasSlot && !hasApiKey) {
  console.warn('\n⚠️  No zbb slot loaded and no API key in environment.');
  console.warn('   Load slot: zbb --slot sme-mart-uat npm run dev');
  console.warn('   Or fallback: npm run dev:legacy\n');
}
```

Wire into predev: `"predev": "node scripts/check-env.mjs && node scripts/gen-neon-env.mjs"`

**File:** `sme-mart/scripts/check-env.mjs` (new)

### Phase 3 Success Criteria

- [ ] `zbb --slot sme-mart-uat npm run dev` is the documented default
- [ ] `npm run dev:legacy` still works with `.env.local` (fallback)
- [ ] Warning shown if neither slot nor `.env.local` detected
- [ ] All team members have created their slots

---

## Phase 4: Cleanup (Future — After Full Team Adoption)

**Goal:** Remove dotenv-cli and legacy scripts.
**Effort:** 30 min
**Depends on:** 2-4 weeks after Phase 3, team confirmed migrated

### Tasks

- Remove `dev:legacy*` scripts from `package.json`
- Remove `dotenv` and `dotenv-cli` from devDependencies
- Delete `.env.local.example` (or leave as historical reference)
- Remove `scripts/check-env.mjs` if no longer needed

### What stays (explicitly)

- **All proxy-*.conf.js files** — these are Angular dev server infrastructure, not env management
- **proxy-common.js**
- **scripts/gen-neon-env.mjs**
- **Angular environment.*.ts files**

### Phase 4 Success Criteria

- [ ] `dotenv-cli` removed from devDependencies
- [ ] No `dev:legacy*` scripts remain
- [ ] All 4 proxy configs still present and working

---

## Files Affected (All Phases)

| File | Phase | Change |
|------|-------|--------|
| `zbb.yaml` | 1 | **NEW** — env var declarations |
| `package.json` | 1, 2, 3, 4 | engines, devDeps, scripts |
| `SETUP.md` | 2 | **NEW** — developer setup guide |
| `scripts/check-env.mjs` | 3 | **NEW** (optional) — predev slot warning |
| `.env.local.example` | 3 | MODIFIED — deprecation notice |
| `proxy-*.conf.js` (all 4) | — | **NO CHANGES** — Angular dev server infrastructure |
| `proxy-common.js` | — | NO CHANGES |
| `scripts/gen-neon-env.mjs` | — | NO CHANGES |
| Angular environment files | — | NO CHANGES |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Node 22 breaks Angular build | High — blocks all dev | Test in Phase 1 before any script changes. Revert engines if needed. |
| Slot env var names don't match what proxy configs expect | High — 401 from backend | zbb.yaml uses exact names from proxy-*.conf.js (`ZEROBIAS_UAT_API_KEY`, etc.) |
| zbb CLI not installed | Medium — slot scripts fail | Phase 1 devDep install; document `npm install -g @zerobias-org/zbb` |
| Team resists new tool | Low — parallel support | `dev:legacy*` scripts preserved until Phase 4 |
| Secrets leak via slot files | Medium — security risk | zbb stores slots outside repo (`~/.zbb/slots/`); `.gitignore` already covers `.env*` |
| gen-neon-env.mjs can't read NEON_DATABASE_URL | Low — Neon mode broken | Script reads from `process.env` — works identically whether source is dotenv or zbb |

---

## Developer Cheat Sheet

```
FIRST-TIME SETUP
  npm install -g @zerobias-org/zbb
  zbb slot create sme-mart-uat
  zbb env set ZEROBIAS_UAT_API_KEY=<key>
  zbb env set ZEROBIAS_UAT_ORG_ID=<org-id>
  zbb env set NEON_DATABASE_URL=<neon-url>

DAILY WORKFLOW
  zbb --slot sme-mart-uat npm run dev      # UAT (default)
  zbb --slot sme-mart-qa  npm run dev:qa   # QA
  zbb --slot sme-mart-prod npm run dev:prod # Prod (read-only dev)

CHECK CURRENT ENV
  zbb env list              # all vars in current slot
  zbb env get ZEROBIAS_UAT_API_KEY    # specific var (masked if sensitive)
  zbb slot list             # all slots

FALLBACK (if zbb broken)
  npm run dev:legacy        # uses .env.local + dotenv-cli

WHAT DIDN'T CHANGE
  - All proxy configs work exactly as before
  - Angular environment.ts files work exactly as before
  - gen-neon-env.mjs works exactly as before
  - Vercel production builds unaffected
```
