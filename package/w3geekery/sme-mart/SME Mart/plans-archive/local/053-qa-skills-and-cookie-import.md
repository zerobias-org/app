# Plan 053: QA Skills & Cookie Import

**Status:** Draft
**Created:** 2026-03-13
**Related:** Plan 052 (Playwright E2E — separate CI concern)
**Inspired by:** [garrytan/gstack](https://github.com/garrytan/gstack) `/qa`, `/browse`, `/setup-browser-cookies`

## Summary

Two generic Claude Code skills that use Chrome DevTools MCP (already installed) for browser-based QA testing. Skills live in `~/.claude/skills/` and work with any project via per-project config files.

1. **`/setup-cookies`** — Import authenticated sessions from real browsers (Chrome, Arc, Brave) into Chrome DevTools MCP
2. **`/qa`** — Systematic QA crawl with health scoring, screenshots, and regression tracking

## Decision: Generic vs Specialized

| Concern | Generic? | Rationale |
|---------|----------|-----------|
| Cookie import/decryption | Yes | Browser-level, no project awareness needed |
| QA crawl orchestration | Yes | Same pattern: navigate, screenshot, check console, score |
| Scoring rubric weights | Yes (configurable) | Default weights work for most apps; override in project config |
| Page inventory | No — per-project config | Each app has different routes |
| Auth setup | No — per-project config | SME Mart uses API key + sessionStorage; zb/ui may differ |
| Report output dir | Per-project | `.qa-reports/` in each project root |

**Decision:** Generic skills in `~/.claude/skills/` + per-project config in `.claude/qa/qa-config.json`.

## Architecture

### File Structure

```
~/.claude/skills/
├── setup-cookies.md              # Skill: cookie import
├── qa.md                         # Skill: QA orchestrator
└── qa/
    ├── lib/
    │   └── cookie-decrypt.mjs    # Node.js cookie decryption script
    ├── templates/
    │   └── qa-report-template.md # Report template
    └── references/
        └── issue-taxonomy.md     # Severity + category definitions

# Per-project (SME Mart example):
sme-mart/.claude/qa/
├── qa-config.json                # Page inventory, auth, weights
├── baseline.json                 # Last-known-good scores
└── .qa-reports/                  # Generated output (gitignored)
    ├── qa-report-sme-mart-2026-03-13.md
    └── screenshots/

# Per-project (zb/ui example):
~/Projects/zb/ui/.claude/qa/
├── qa-config.json
├── baseline.json
└── .qa-reports/
```

### Chrome DevTools MCP Command Mapping

| gstack `/browse` | Chrome DevTools MCP | Notes |
|------------------|---------------------|-------|
| `goto <url>` | `navigate_page` | |
| `snapshot -i` | `take_snapshot` | Element inspection |
| `click @e3` | `click` | Selector-based |
| `fill @e4 "text"` | `fill` | |
| `console --errors` | `list_console_messages` | Filter for errors |
| `screenshot path` | `take_screenshot` | |
| `network` | `list_network_requests` | |
| `viewport 375x812` | `resize_page` / `emulate` | |
| `links` | `evaluate_script` | Extract all `<a>` hrefs |
| `cookies` | `evaluate_script` | `document.cookie` |

### Cookie Decryption Pipeline

Same as gstack, ported from Bun to Node.js:

```
macOS Keychain (security CLI)
  → base64 password
  → PBKDF2(password, "saltysalt", 1003 iterations, 16 bytes, SHA1)
  → AES-128-CBC key
  → For each cookie: decrypt(ciphertext[3:], key, iv=0x20×16)
  → Remove PKCS7 padding, skip 32-byte HMAC prefix
  → Playwright-compatible cookie object
```

**Dependencies:** `better-sqlite3` (read Chrome Cookies DB), Node `crypto` (PBKDF2 + AES). No new runtimes.

### QA Config Schema

```jsonc
// .claude/qa/qa-config.json
{
  "project": "sme-mart",
  "baseUrl": "http://localhost:4200",
  "environments": {
    "local": "http://localhost:4200",
    "uat": "https://uat.zerobias.com/sme-mart/"
  },
  "auth": {
    "strategy": "cookie-import",        // or "api-key", "manual"
    "browser": "arc",                   // for cookie-import
    "domains": [".zerobias.com"],       // which cookie domains to import
    "sessionStorageKeys": {             // inject after cookie import
      "zb-current-dana-org-id": "${ZB_ORG_ID}"
    }
  },
  "pages": [
    { "path": "/", "name": "Home", "critical": true },
    { "path": "/marketplace", "name": "Marketplace", "critical": true },
    { "path": "/rfps", "name": "RFP List", "critical": true },
    { "path": "/engagements", "name": "Engagements", "critical": true },
    { "path": "/my-profile", "name": "My Profile", "critical": false },
    { "path": "/org/documents", "name": "Org Documents", "critical": false },
    { "path": "/org/members", "name": "Org Members", "critical": false }
  ],
  "scoreWeights": {
    "console": 15,
    "links": 10,
    "visual": 10,
    "functional": 20,
    "ux": 15,
    "performance": 10,
    "content": 5,
    "accessibility": 15
  },
  "thresholds": {
    "pass": 75,
    "regressionTolerance": 5
  }
}
```

## Phases

### Phase 1: Cookie Import Script + Skill (3–4 hrs)

**Goal:** Decrypt cookies from real browsers, inject into Chrome DevTools MCP session.

**Files created:**
- `~/.claude/skills/qa/lib/cookie-decrypt.mjs` — Standalone Node.js script
  - Uses `better-sqlite3` to read `~/Library/Application Support/{Browser}/Default/Cookies`
  - Handles locked DB (copy to /tmp, include WAL/SHM)
  - `security find-generic-password -s "<service>" -w` for Keychain access
  - PBKDF2 + AES-128-CBC decryption
  - Outputs JSON array of `{ name, value, domain, path, expires, secure, httpOnly, sameSite }`
- `~/.claude/skills/setup-cookies.md` — Claude Code skill
  - Runs `cookie-decrypt.mjs` with browser name + domain filter
  - Iterates cookies, injects via `evaluate_script` (`document.cookie = ...`)
  - Or uses `navigate_page` to target domain first, then inject
  - Verifies by reading back `document.cookie`

**Browsers supported:** Chrome, Arc, Brave, Edge (same as gstack registry)

**Testing:**
- Manual: run script, verify decrypted cookies match browser session
- Verify Chrome DevTools MCP receives cookies and auth works on UAT

### Phase 2: QA Skill — Crawl & Screenshot (4–5 hrs)

**Goal:** Navigate page inventory, capture screenshots + console + network state per page.

**Files created:**
- `~/.claude/skills/qa.md` — Claude Code skill (the orchestrator)
  - Reads project's `.claude/qa/qa-config.json`
  - Three modes: `full` (all pages), `quick` (critical pages only), `regression` (full + baseline diff)
  - Per-page workflow:
    1. `navigate_page` to URL
    2. `wait_for` page load / network idle
    3. `take_screenshot` → save to `.qa-reports/screenshots/`
    4. `list_console_messages` → collect errors/warnings
    5. `list_network_requests` → collect failed requests (4xx/5xx)
    6. `evaluate_script` → extract all links, check for dead hrefs
    7. `evaluate_script` → check for placeholder text, missing images
  - Writes running issue list to report file

**SPA-specific handling:**
- Angular apps: client-side routing means `navigate_page` may need to go to base URL first, then use `click`/`evaluate_script` to navigate
- Alternative: navigate directly to `baseUrl + path` (Angular router handles it if `useHash: false`)
- Check `list_console_messages` after each navigation for hydration/routing errors

### Phase 3: Scoring Engine (3–4 hrs)

**Goal:** Compute per-category and overall health scores from collected data.

**Scoring logic (in skill prompt, no external code needed):**

| Category | Scoring Method |
|----------|---------------|
| Console (15%) | 0 errors=100, 1-3=70, 4-10=40, 10+=10 |
| Links (10%) | Each broken link = -15 (min 0) |
| Visual (10%) | Missing images = -20 each, layout overflow detected = -15 |
| Functional (20%) | Dead buttons/links found = -15 each, form failures = -25 each |
| UX (15%) | No loading indicator = -10, slow load >3s = -15, dead ends = -10 |
| Performance (10%) | >50 requests = -20, >5MB total = -15, >3s load = -20 |
| Content (5%) | Placeholder text = -20, truncated text = -10, missing labels = -5 |
| Accessibility (15%) | Missing alt text = -5 each, no ARIA labels = -10, contrast issues = -10 |

**Overall score:** Weighted average. PASS ≥ 75, WARN 60-74, FAIL < 60.

### Phase 4: Report Generation + Regression (3–4 hrs)

**Goal:** Structured markdown report, regression detection vs baseline.

**Files created:**
- `~/.claude/skills/qa/templates/qa-report-template.md` — Report template (adapted from gstack)
- `~/.claude/skills/qa/references/issue-taxonomy.md` — Severity/category definitions (adapted from gstack)

**Report includes:**
- Metadata: date, URL, mode, duration, page count, screenshot count
- Health score table (per-category + overall)
- Top 3 issues to fix
- Console health summary
- Issue details with screenshots + repro steps
- Regression section (if baseline exists): score delta, fixed issues, new issues

**Baseline management:**
- After each full run, write `baseline.json` with scores + issue list
- Regression mode loads baseline, diffs, flags >5% score drops

### Phase 5: SME Mart Config (1–2 hrs)

**Goal:** Project-specific config for SME Mart.

**Files created:**
- `sme-mart/.claude/qa/qa-config.json` — Page inventory + auth config
- `sme-mart/.gitignore` addition — `.claude/qa/.qa-reports/`

**Page inventory (critical):**
- `/` (Home/Dashboard)
- `/marketplace` (Browse providers)
- `/rfps` (RFP list)
- `/rfps/:id` (RFP detail — use a known ID from demo data)
- `/engagements` (Engagement list)
- `/engagements/:id/tasks` (Engagement tasks tab)
- `/engagements/:id/timeline` (Engagement timeline)
- `/engagements/:id/documents` (Engagement documents)
- `/engagements/:id/notes` (Engagement notes)

**Page inventory (secondary):**
- `/my-profile`
- `/org/documents`
- `/org/members`
- `/notifications`

### Phase 6: zb/ui Config (1 hr, validates genericity)

**Goal:** Prove the generic skill works for a second project.

**Files created:**
- `~/Projects/zb/ui/.claude/qa/qa-config.json` — zb/ui page inventory

If the skill requires SME Mart-specific logic to work, that's a design bug — fix it.

### Phase 7: Documentation (1 hr)

**Files created/updated:**
- `~/.claude/skills/qa.md` — Usage section with examples
- `~/.claude/skills/setup-cookies.md` — Usage section with examples
- PLAN.md link (this file)

## File Inventory

### New Files

| File | Type | Location |
|------|------|----------|
| `setup-cookies.md` | Skill | `~/.claude/skills/` |
| `qa.md` | Skill | `~/.claude/skills/` |
| `cookie-decrypt.mjs` | Script | `~/.claude/skills/qa/lib/` |
| `qa-report-template.md` | Template | `~/.claude/skills/qa/templates/` |
| `issue-taxonomy.md` | Reference | `~/.claude/skills/qa/references/` |
| `qa-config.json` | Config | `sme-mart/.claude/qa/` |
| `qa-config.json` | Config | `~/Projects/zb/ui/.claude/qa/` |

### Modified Files

| File | Change |
|------|--------|
| `sme-mart/.gitignore` | Add `.claude/qa/.qa-reports/` |
| This plan file | Status updates |
| `PLAN.md` | Link to this plan |

## Dependencies

- `better-sqlite3` — npm package for reading Chrome Cookies SQLite DB (install globally or in skill lib)
- Chrome DevTools MCP — already installed
- macOS Keychain access — `security` CLI (already available)
- Chrome/Arc/Brave installed — at least one Chromium browser

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Keychain prompt blocks automation | Medium | Blocks Phase 1 | Click "Always Allow" on first run; document this |
| Cookie DB locked while browser running | Medium | Low | Copy DB to /tmp (gstack pattern, already proven) |
| Chrome DevTools MCP can't set cookies | Low | High | Test in Phase 1; fallback: manual login then QA |
| SPA routing breaks direct navigation | Medium | Medium | Navigate to base URL, then use evaluate_script for routing |
| Scoring too noisy (false positives) | Medium | Low | Tune thresholds in qa-config.json per project |

## Open Questions

1. **Visual regression (pixel diff)?** — Add `pixelmatch` for screenshot diffing? Or keep screenshots as visual-inspection-only? Recommend: skip for v1, add later if needed.
2. **Report storage** — Gitignore `.qa-reports/` (recommended) or commit? Screenshots grow fast.
3. **CI integration** — Should `/qa` be runnable in GitHub Actions? Or keep it developer-local and leave CI to Plan 052 (Playwright)?
4. **Score weight customization** — Allow per-project overrides in `qa-config.json`? (Already in schema above, just confirming.)
5. **`better-sqlite3` install location** — Global npm install? Or vendor in skill lib dir?

## Estimated Hours

| Phase | Hours | Running Total |
|-------|-------|---------------|
| 1 — Cookie Import | 3–4 | 3–4 |
| 2 — QA Crawl & Screenshot | 4–5 | 7–9 |
| 3 — Scoring Engine | 3–4 | 10–13 |
| 4 — Report + Regression | 3–4 | 13–17 |
| 5 — SME Mart Config | 1–2 | 14–19 |
| 6 — zb/ui Config | 1 | 15–20 |
| 7 — Documentation | 1 | 16–21 |
| **Total** | **16–21** | |

At 15 hrs/week: ~1.5 weeks. Can be spread across 2-3 weeks alongside other work.
