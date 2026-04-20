# Plan 052: Playwright E2E Smoke Tests for SME Mart

> **Source:** Planner agent output, 2026-04-08
> **Estimate:** ~15 hours (Phases 1-3 MVP), Phase 4 deferred
> **Reference:** `.claude/notes/playwright-e2e-learnings-from-zb-ui.md`
> **Backlog:** Plan 052 in `.planning/BACKLOG.md`

## Overview

Add Playwright-based E2E smoke tests to SME Mart Angular 21 app. Tests cover critical user flows (engagements, RFPs, projects, vendor profiles, org navigation, invitations). Run against localhost:4200 or UAT with API key-based auth (no login flow). Standalone components, Material UI, proper handling of Angular-specific quirks (zb-simple-autocomplete, CDK overlays).

## Existing Smoke Test Assets (IMPORTANT — Flow Source Material)

Three existing smoke test documents in `.claude/smoke-tests/` describe user flows in step-by-step form. These are **Chrome DevTools MCP-based** (Claude reads the .md and walks through the steps manually) — NOT Playwright automation. They are **complementary**, not replaced by Plan 052:

- **`.claude/smoke-tests/README.md`** — explains the Claude+MCP smoke test approach
- **`.claude/smoke-tests/rfp-wizard-create.md`** — 5-step RFP wizard flow (Basics → Documents → Requirements → Terms → Review), draft save
- **`.claude/smoke-tests/org-document-management.md`** — Upload, verify in Neon, share with engagement, archive
- **`.claude/smoke-tests/rfp-invitations.md`** — Phase 14 full flow: My Invitations page, lock badges, Invited Vendors tab, invite → accept → view RFP

### How to Use These Files

**READ the corresponding .md file BEFORE writing each Playwright spec.** They contain the exact selectors, wait conditions, field names, expected state transitions, and PASS/FAIL criteria already validated against the running app. This saves hours of discovery work and ensures the Playwright specs cover the same flows the team has been manually validating.

Mapping:

| Existing .md | Feeds into Playwright spec |
|-------------|-----|
| `rfp-wizard-create.md` | `rfp-smoke.spec.ts` — RFP creation flow portion |
| `org-document-management.md` | `org-docs-smoke.spec.ts` — upload/share/archive |
| `rfp-invitations.md` | `invitations-smoke.spec.ts` — Phase 14 invitation flow |

### Why Both Exist

- **Claude+MCP smoke tests** = exploratory, ad-hoc validation, screenshot capture, "does this flow still work when I ask Claude to check it." Flexible, high-level, Claude-driven.
- **Playwright smoke tests** = deterministic regression gate, repeatable, fast, no AI in the loop. Strict, automated, CI-capable.

Keep both. The .md files stay as living documentation of intended flows. The Playwright specs codify a subset of those flows as automated checks.

## Target Filesystem Structure

```
e2e/
├── playwright.config.ts
├── tsconfig.json
├── .env.example
├── README.md
├── fixtures/
│   ├── auth.fixture.ts
│   └── api.fixture.ts
├── page-objects/
│   ├── base.page.ts
│   ├── engagement-list.page.ts
│   ├── engagement-detail.page.ts
│   ├── rfp-list.page.ts
│   ├── rfp-detail.page.ts
│   ├── project-list.page.ts
│   ├── project-detail.page.ts
│   ├── vendor-profile.page.ts
│   ├── org-nav.page.ts
│   └── invitations.page.ts
└── specs/
    ├── engagement-smoke.spec.ts
    ├── rfp-smoke.spec.ts
    ├── project-smoke.spec.ts
    ├── vendor-profile-smoke.spec.ts
    ├── invitations-smoke.spec.ts
    ├── org-docs-smoke.spec.ts
    └── org-nav-smoke.spec.ts
```

---

## Phase 1: Setup & Configuration (2-3 hours)

### Steps

1. **Install dependencies** (`package.json`)
   - Add `@playwright/test@^1.45.0`, `dotenv@^16.0.0` to devDependencies
   - **DO NOT run `npx playwright install`** — we're using `channel: 'chrome'` so we use system Chrome, no Chromium download needed
   - Production build (`ng build`) is unaffected — Playwright is dev-only tooling

2. **Create Playwright config** (`e2e/playwright.config.ts`)
   - Target localhost:4200, single worker (no race conditions on shared data)
   - **Use `channel: 'chrome'`** — uses system-installed Chrome, NOT Chromium (no 170MB download, matches zb/ui pattern)
   - Combine with `...devices['Desktop Chrome']` in projects block (same as zb/ui — compatible)
   - `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`
   - `reporter: [['html', { outputFolder: 'e2e-results' }], ['list']]`
   - No webServer block (dev server always running separately)
   - Reference: `~/Projects/zb/ui/e2e/playwright.config.ts` for exact pattern

3. **Create env template** (`e2e/.env.example`)
   - `ZEROBIAS_UAT_API_KEY`, `ZEROBIAS_UAT_ORG_ID`, `BASE_URL=http://localhost:4200`

4. **Create auth fixture** (`e2e/fixtures/auth.fixture.ts`)
   - Extend `test as base`; inject `dana-org-id` cookie before each test
   - Load env vars from `e2e/.env` via dotenv
   - Reference: `~/Projects/zb/ui/e2e/fixtures/auth.fixture.ts`

5. **Create API helper fixture** (`e2e/fixtures/api.fixture.ts`)
   - `getResource(path)`, `deleteResource(path)`, `listResources(path, pageSize)`
   - Cleanup pattern: beforeEach cleans created data

6. **Update package.json scripts**
   - `"e2e": "playwright test --config e2e/playwright.config.ts"`
   - `"e2e:debug": "playwright test --config e2e/playwright.config.ts --debug"`

7. **Update .gitignore**
   - `/e2e/.env`, `/e2e/test-results/`, `/e2e/playwright/`, `/e2e-results/`

8. **Create E2E README** (`e2e/README.md`)
   - Setup, env config, known issues (autocomplete, CDK overlays), debugging

### Checkpoint
```bash
npm install && npx playwright --version  # Verify install
cp e2e/.env.example e2e/.env             # Edit with real keys
```

---

## Phase 2: Base Infrastructure & First Smoke Test (3-4 hours)

### Steps

1. **Base page object** (`e2e/page-objects/base.page.ts`)
   - `goto(path)`, `waitForNavigation()`, `expectVisible(selector)`, `cleanupCdkOverlays()`
   - Common Material selectors (buttons by role, inputs by placeholder)

2. **Engagement list page object** (`e2e/page-objects/engagement-list.page.ts`)
   - `goto()`, `waitForTableLoad()`, `getFirstEngagementRow()`, `clickEngagement(id)`, `getEngagementCount()`

3. **Engagement detail page object** (`e2e/page-objects/engagement-detail.page.ts`)
   - `goto(engagementId)`, `selectTab(tabName)`, `waitForTabContent()`, `getTabNames()`, `expectTabsVisible(expectedTabs)`

4. **First smoke test** (`e2e/specs/engagement-smoke.spec.ts`)
   - Test 1: "should load engagement list and display rows" — goto list, expect table, row count > 0
   - Test 2: "should navigate to engagement detail" — click first row, expect detail page, verify URL
   - Test 3: "should load all engagement detail tabs" — goto detail, click each tab, verify content loads

### Checkpoint
```bash
npm run dev                                      # Terminal 1
npm run e2e -- e2e/specs/engagement-smoke.spec.ts  # Terminal 2
# All 3 tests pass
```

---

## Phase 3: Expand Coverage (6-8 hours)

### 3a. RFP Flow
- **Page objects:** `rfp-list.page.ts`, `rfp-detail.page.ts`
- **Smoke test:** `rfp-smoke.spec.ts` — load list, navigate to detail, display bid section, bid comparison

### 3b. Project Flow
- **Page objects:** `project-list.page.ts`, `project-detail.page.ts`
- **Smoke test:** `project-smoke.spec.ts` — load list (cards), navigate to detail, load tabs

### 3c. Vendor Profile
- **Page object:** `vendor-profile.page.ts`
- **Smoke test:** `vendor-profile-smoke.spec.ts` — load profile, verify 6 sections render (corporate, insurance, compliance, financial, legal, certs)

### 3d. Org Navigation
- **Page object:** `org-nav.page.ts`
- **Smoke test:** `org-nav-smoke.spec.ts` — three-tier navigation (/orgs → /orgs/:orgId → /org)

### 3e. My Invitations (Phase 14)
- **Page object:** `invitations.page.ts`
- **Smoke test:** `invitations-smoke.spec.ts` — load page, filter chips, invitation cards

### 3f. Org Documents
- **Smoke test:** `org-docs-smoke.spec.ts` — load document list, verify folder tree, upload button visible

### Checkpoint
```bash
npm run e2e  # Full suite — all 7 specs pass, ~48 test cases, < 2 min
```

---

## Phase 4: CI Integration (2-3 hours) — DEFERRED

- `.github/workflows/e2e.yml` — Run on push to poc/sme-mart
- `e2e/tsconfig.json` — Separate TypeScript config for E2E
- JUnit reporter for CI, HTML report for local debugging
- **Defer until Phase 3 passes consistently for 1 week locally**

---

## Known Gotchas (from zb/ui learnings)

### zb-simple-autocomplete BROKEN for Playwright
- **Symptom:** Form field stays null after clicking mat-option
- **Fix:** Use `ng.getComponent()` workaround — call `searchFn` directly, patch `onAction`
- **Where:** Any page object that touches autocomplete forms (vendor profile, engagement forms)
- **Reference:** `playwright-e2e-learnings-from-zb-ui.md` section 1

### CDK Overlay Remnants
- **Symptom:** Dialog content covered after programmatic setValue
- **Fix:** `cleanupCdkOverlays()` helper in base.page.ts removes `.cdk-overlay-connected-position-bounding-box` elements
- **When:** After any dialog interaction with form controls

### SME Mart is Standalone
- **No frameLocator needed** — SME Mart runs standalone, not iframed in gateway
- CDK overlay issues still apply
- Auth via cookie injection (not gateway proxy)

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Auth fails (missing env vars) | High | `.env.example` + fixture logs org ID on startup |
| zb-simple-autocomplete doesn't update form | Medium | `ng.getComponent()` workaround in page objects |
| CDK overlay covers dialog content | Medium | `cleanupCdkOverlays()` helper in base.page.ts |
| Async data loading race conditions | Medium | `waitForLoadState('networkidle')`, avoid `sleep()` |
| Test data conflicts (duplicate IDs) | Medium | beforeEach cleanup via api.fixture.ts |
| Flaky selectors | Low | Prefer `data-testid`, `getByRole`, `getByText` over CSS selectors |

---

## Success Criteria

- [ ] Playwright installed and configured
- [ ] Auth fixture injects cookie + API key correctly
- [ ] 7 smoke test specs covering all critical flows
- [ ] All tests pass 3x consecutively on local dev
- [ ] Suite completes in < 2 minutes
- [ ] Page objects follow DRY principle (< 400 lines each)
- [ ] e2e/README.md documents setup, debugging, known issues
- [ ] No flaky tests on 5 consecutive runs

---

## Out of Scope

- Full integration tests (form validation, error cases, edge cases)
- Performance/Lighthouse testing
- Visual regression testing (screenshot baselines)
- Accessibility testing (Axe/Pa11y)
- Complex autocomplete dialog flows (defer to Phase 3b if time allows)
