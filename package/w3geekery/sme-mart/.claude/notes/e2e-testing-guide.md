# SME Mart E2E Testing Guide (Playwright)

> **Audience:** Future Claude sessions picking up E2E test work with zero prior context.
> **Last updated:** 2026-04-09 (Plan 052 Phases 1-3 complete)
> **Status:** 7 specs / 15 tests, single-worker, runs in ~4.3 min against local dev server

This guide is a self-contained handoff. Read it before writing or modifying any
Playwright spec in this repo. It captures decisions, gotchas, and conventions
that are not obvious from the code alone.

---

## Stack at a Glance

| What | Value |
|---|---|
| Runner | `@playwright/test` 1.59+ |
| Browser | System Chrome via `channel: 'chrome'` (no Chromium download) |
| Framework | Angular 21 standalone components, Material, ngx-library |
| Target | `http://localhost:4200` (ng serve with proxy-uat) |
| Workers | 1 (serial — tests share data state) |
| Auth | Proxy-based API key + `dana-org-id` cookie injection |
| Config | `e2e/playwright.config.ts` |
| NPM scripts | `npm run e2e`, `npm run e2e:debug`, `npm run e2e:report` |

---

## File Layout

```
package/w3geekery/sme-mart/
├── e2e/
│   ├── playwright.config.ts     # Runner config
│   ├── .env.example             # Committed template
│   ├── .env                     # Gitignored — real ZEROBIAS_UAT_ORG_ID
│   ├── README.md                # Quick start (less detailed than this guide)
│   ├── fixtures/
│   │   ├── auth.fixture.ts      # Cookie injection fixture
│   │   └── api.fixture.ts       # REST helpers (list/get/delete)
│   ├── helpers/
│   │   ├── wait-for-angular.ts  # Waits for NgZone stabilization
│   │   └── zb-autocomplete.ts   # REQUIRED helper for zb-simple-autocomplete forms
│   ├── page-objects/            # One page object per page/flow
│   └── specs/                   # One spec per feature area
├── .claude/
│   ├── notes/
│   │   ├── e2e-testing-guide.md            # THIS FILE
│   │   └── playwright-e2e-learnings-from-zb-ui.md  # Original learnings dump
│   └── smoke-tests/
│       ├── README.md
│       ├── rfp-wizard-create.md      # Manual MCP-based smoke doc (source of truth for flows)
│       ├── rfp-invitations.md
│       └── org-document-management.md
```

---

## Two Kinds of Smoke Tests — Keep Both

**This project intentionally has two parallel smoke test systems.** Don't collapse them.

1. **Playwright specs** (`e2e/specs/`) — deterministic automated regression gates. Fast, repeatable, CI-capable, strict. Scope: "page loads, key structures render, no errors."
2. **Chrome DevTools MCP smoke docs** (`.claude/smoke-tests/*.md`) — exploratory, ad-hoc Claude+MCP validation. Multi-step flows with screenshot capture and Neon DB verification. Scope: "does this full user journey still work end-to-end?"

**Rule:** Before writing a new Playwright spec for a feature that already has an MCP smoke doc, **read the `.md` file first**. It has pre-validated selectors, field names, and expected state transitions. Codify a *subset* as a Playwright gate — don't try to automate the whole multi-persona flow. Complex flows (invite/accept/decline, upload/share/archive, multi-step wizards with autocomplete) stay in the `.md` docs.

Mapping:

| MCP smoke doc | Playwright spec |
|---|---|
| `rfp-wizard-create.md` | `rfp-smoke.spec.ts` (chooser gate only) |
| `rfp-invitations.md` | `invitations-smoke.spec.ts` (page load + chips only) |
| `org-document-management.md` | `org-docs-smoke.spec.ts` (toolbar + upload button only) |

---

## Authentication — How Auth Actually Works

**There is no login flow.** Understand the three layers:

1. **Angular dev server proxy** (`proxy-uat.conf.js`, `proxy-common.js`):
   - Runs at `localhost:4200`
   - Proxies `/api/*` → `https://uat.zerobias.com/api/*`
   - Injects `Authorization: APIKey <ZEROBIAS_UAT_API_KEY>` header on proxy requests
   - Also injects a `dana-org-id` cookie on the *server-side* proxy request
   - Env vars come from `.env.local`

2. **Browser cookie** (`dana-org-id`):
   - The in-browser ZeroBias SDK reads this cookie to resolve the org context
   - The proxy's server-side cookie injection does NOT set cookies in the browser
   - Playwright's browser context starts with no cookies
   - **The auth fixture fixes this** by injecting `dana-org-id` via `addCookies()` before each test

3. **Env vars**:
   - `.env.local` — used by `ng serve` / proxy (API key + org ID)
   - `e2e/.env` — used by Playwright (only needs `ZEROBIAS_UAT_ORG_ID` — the API key is handled by the proxy, not the browser)
   - `e2e/.env.example` — committed template; copy to `e2e/.env`

**The auth fixture will throw `[auth.fixture] No org ID found` if `e2e/.env` is missing `ZEROBIAS_UAT_ORG_ID`.** To fix: `cp e2e/.env.example e2e/.env` and paste the value from `.env.local`.

**For tests that authenticate as a different user/org:** override the cookie in the test's `beforeEach` via `page.context().clearCookies()` + `addCookies()`. Impersonation is handled by the `ImpersonationService` — see `src/app/core/services/impersonation.service.ts`.

---

## Running Tests

```bash
# Terminal 1 — dev server (must be running)
npm run dev

# Terminal 2 — E2E tests
npm run e2e                                           # Full suite
npm run e2e -- e2e/specs/engagement-smoke.spec.ts     # Single spec
npm run e2e -- -g "should load My Engagements"       # Grep by test name
npm run e2e:debug                                     # Playwright Inspector
npm run e2e:report                                    # Open HTML report after a run

# View a failed test trace
npx playwright show-trace e2e/test-results/<test-dir>/trace.zip
```

**Don't run `npx playwright install`** — we use system Chrome via `channel: 'chrome'`. Running it just wastes 170MB of disk on an unused Chromium binary.

**Dev server check:** the global config has no `webServer` block — if `localhost:4200` is down, tests fail with navigation errors. Check with `curl -o /dev/null -w "%{http_code}" http://localhost:4200` before debugging test failures.

---

## Known Gotchas — Read Before Touching Anything

### 1. `zb-simple-autocomplete` has THREE layered race conditions — read this before writing any form spec

`@zerobias-org/ngx-library`'s autocomplete component has multi-layer race conditions under Playwright. Understand all three layers before trying to automate a form that uses it. Source: the zb/ui Claude session that debugged this into the ground.

#### Layer 1 — `(optionSelected)` doesn't propagate to the parent form
Playwright's `mat-option` click sets the autocomplete's internal `formControl` but `(optionSelected)` doesn't fire consistently. The parent form bound via `formControlName` stays `null`, causing action handlers to crash with `TypeError: Cannot read properties of null (reading 'id')`.

**Fix:** Use `selectValue()` (added in `@zerobias-org/ngx-library@0.2.30`) via our helper `e2e/helpers/zb-autocomplete.ts`:

```ts
import {
  selectZbAutocompleteValue,
  selectZbAutocompleteBySearch,
  selectZbAutocompleteByProperty,
} from '../helpers/zb-autocomplete';

// If you already have the typed object
await selectZbAutocompleteValue(page, 'zb-simple-autocomplete[formControlName="category"]', categoryObj);

// If you only have display text — uses the component's searchFn to resolve
await selectZbAutocompleteByProperty(
  page,
  'zb-simple-autocomplete[formControlName="category"]',
  'Security',
  'name',  // match option.name === 'Security'
);

// Custom predicate for more complex matching
await selectZbAutocompleteBySearch(
  page,
  '#my-autocomplete',
  'search-term',
  'return option.tags?.includes("priority");',
);
```

`selectValue()` sets the internal `formControl` AND calls `onChange(value)` which propagates through `ControlValueAccessor` to the parent form. Read `e2e/helpers/zb-autocomplete.ts` for full API, prerequisites, and caveats.

#### Layer 2 — `valueChanges` cascades wipe test state
Many dialogs subscribe to form `valueChanges` and do destructive things on each emission: clear tree data, reset selections, fire dependent API calls. Example from zb/ui's boundary-standard dialog:

```ts
this.formGroup.get('standardBaseline').valueChanges.subscribe((value) => {
  this.dataSource.data = null;            // clears the tree
  this.baselineElementsSelection.clear();  // clears selections
  if (value) this.getStandardBaselineFilterTree();
});
```

With Playwright's timing, these subscriptions can fire AFTER your test has set up follow-on state, wiping it out.

**Fix:** Wait explicitly for the downstream API response, not for the UI element:

```ts
const [response] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('filterTree') && r.status() === 200),
  pageObject.selectCategory('Security'),
]);
await page.waitForTimeout(1000); // buffer for Angular to process the response
// Now the tree is populated and safe to interact with
```

`waitFor` on the tree element alone is NOT sufficient — the element can be visible while the cascade is still mid-flight.

#### Layer 3 — Synchronous form reads can return different values between lines
The weirdest one. Even after fixing layers 1 and 2, there are cases where:

```ts
if (comp.formGroup.value.standard?.id) {    // truthy here
  const id = comp.formGroup.value.standard.id;  // throws null-reference on the very next line
}
```

Some microtask fires between property accesses and clears the form value mid-read.

**Fix:** There isn't a clean one. Pragmatic escape hatch: **stop driving the dialog through Playwright and use the REST API directly** (see next section).

---

### 2. REST API bypass — the default strategy for action dialogs

When an action dialog uses `zb-simple-autocomplete` or any complex form, and your test's goal is to verify the **end state** (a record appears, a status changes, a badge updates) rather than the dialog UX itself, use the REST API bypass:

```ts
test('should create X via bulk-create dialog', async ({ page, request }) => {
  // 1. Open the dialog to exercise button wiring + dialog mount
  await myPage.clickOpenBulkCreate();
  await myPage.dialog.waitFor({ state: 'visible' });

  // 2. Cancel — avoid the flaky autocomplete interaction
  await page.getByRole('button', { name: /^Cancel$/ }).click();

  // 3. Do the actual work via API
  const resp = await request.post(`${BASE_URL}/api/sme-mart/bulk-create`, {
    data: { category: 'Security', items: [...] },
  });
  expect(resp.status()).toBe(200);

  // 4. Reload and verify UI reflects the change
  await page.reload();
  await expect(page.getByText('new thing')).toBeVisible();
});
```

This gives you coverage of:
- Button/testid wiring ✓
- Dialog can open ✓
- API works ✓
- UI displays new data ✓

**What you skip:** the actual dialog form filling. That's a reasonable tradeoff when the alternative is a 2/8 flake rate. **Default to this approach for action dialogs.**

#### When to drive the full dialog instead

Only when the dialog interaction itself is the thing you're testing — scope tree selection logic, form validation errors, field-level interactions, autocomplete search behavior. In those cases:
1. Use `selectZbAutocompleteValue()` via the helper (fixes Layer 1)
2. Use `Promise.all([waitForResponse, action])` + `waitForTimeout(1000)` (fixes Layer 2)
3. Expect some investigation time for Layer 3 surprises
4. Budget at least 2-3x the time you'd budget for a native Material form

**Multi-select (`zb-simple-multi-autocomplete`):** does NOT yet expose `selectValue` as of 0.2.30. The REST API bypass is your only reliable option until the multi-select component gets the same API. See `.claude/notes/playwright-e2e-learnings-from-zb-ui.md` for the legacy `onSelectionChange` patching pattern if you absolutely must.

---

### Related bugs

- Angular CDK overlay click bug: [angular/components#25238](https://github.com/angular/components/issues/25238) (fixed in later CDK)
- CDK overlay inside iframe bug: [angular/components#21482](https://github.com/angular/components/issues/21482) (closed without fix)
- ngx-library PR adding `selectValue()`: [zerobias-org/ngx-library#5](https://github.com/zerobias-org/ngx-library/pull/5) (merged, released in 0.2.30)

### 3. CDK overlay remnants
After a programmatic `setValue` call, CDK overlay panels can permanently cover dialog content. Use `BasePage.cleanupCdkOverlays()` after any form interaction. If you still get intercepted pointer events, use `BasePage.forceClick(locator)` which calls `el.click()` directly via `evaluate`.

### 4. Angular template whitespace in tab labels
`<a mat-tab-link>{{ tab.label }}</a>` renders `textContent` with surrounding whitespace. This breaks `filter({ hasText: /^Overview$/ })` because the anchored regex doesn't match `"\n          Overview\n        "`. **Solution:** iterate the locator, compare trimmed `textContent`. See `EngagementDetailPage.getTabLinkByLabel()` for the pattern.

### 5. App pages may render their heading at `<h2>`, not `<h1>`
`app-list-page` (the shared wrapper used by `/rfps`, provider list, etc.) renders the title inside `<h2>`. Don't assume `level: 1` for page headings — check the actual DOM with a page snapshot.

**To inspect a page's DOM during test failure:** read `test-results/<test-dir>/error-context.md`. It contains a YAML snapshot of all visible elements with their roles and hierarchy. Vastly faster than opening the screenshot.

### 6. `/rfps/:id` vs `/my/engagements/:id` are different components
- `/rfps/:id` → `RfpDetail` — **no tab nav**, shows bid cards + back-to-RFPs button
- `/my/engagements/:id` → `EngagementDetail` — **has tab nav** (Overview, Projects, Documents, Details, Tasks, Vetting, Timeline, Notes)

The same `<app-engagement-card>` is used on both `/rfps` and `/my/engagements`. The card's `navigate()` method picks the destination based on `isRfp()`:
```ts
const path = this.isRfp() ? '/rfps' : '/my/engagements';
```
**Don't use `EngagementDetailPage` after clicking cards on `/rfps`** — use `RfpDetailPage` instead.

### 7. `/rfps/new` shows a method chooser before the stepper
The `rfp-wizard-create.md` smoke doc describes a 5-step `mat-stepper` flow. That stepper is now gated behind an `<app-rfp-method-chooser>` (AI-extract vs step-by-step) that renders first for new drafts. Loading `/rfps/new` directly shows the chooser, not the stepper. To reach the stepper you'd need to click through the chooser.

### 8. Stale card data → "not found" on detail pages
The RFP/engagement list pages show cards from cached summaries that may not match live platform records. Clicking the first card sometimes lands on a detail page that renders "RFP not found" or "Engagement not found" because the lookup returns nothing. **Your tests must tolerate both terminal states** (loaded OR not-found) via `Promise.race()` on two `waitFor`s. See `RfpDetailPage.waitForLoad()` and `ProjectDetailPage.waitForLoad()` for the pattern.

### 9. `/project/:projId` with invalid UUIDs redirects silently
The project detail component appears to redirect back to `/my/engagements` when the project can't be loaded. Don't write "handles not found" tests with fake UUIDs — the redirect makes them non-deterministic. Instead, navigate to real projects via the engagement-detail → Projects tab path.

### 10. No `data-testid` attributes in the app (yet)
SME Mart doesn't have any `data-testid` attributes. All selectors must use:
1. `getByRole('heading' | 'button' | 'link', { name })` for Material components
2. `getByText()` for unique labels
3. Semantic CSS classes (e.g., `.engagement-grid`, `.rfp-grid`, `.filter-chips`)
4. Structural selectors as last resort

**Follow-up improvement:** when adding new components, add `data-testid` to key landing elements. Until then, prefer role + text.

### 11. First-run HMR flakes on Angular dev server
Tests occasionally fail on the first run after a dev server restart and pass immediately on retry. This is a known Angular HMR/first-load timing issue, not a test bug. If you see a one-off failure that doesn't reproduce, retry the run before touching the test.

### 12. Tests share state (single worker)
`workers: 1` + no browser context isolation beyond Playwright defaults. Tests run serially in ID order. If test N leaves app state that breaks test N+1, it's an inter-test pollution issue — don't chase it in the spec, fix the upstream cleanup. Dev-server sessionStorage persists across tests in some edge cases.

### 13. The `zb/ui` repo also runs Playwright
`~/Projects/zb/ui/e2e/` has its own Playwright suite for the portal + iframed apps (boundary-manager, catalog, etc.). Clark sometimes runs both concurrently. They don't conflict (separate user-data-dirs) but the `ps aux` output will show unrelated Playwright processes. Don't confuse them with SME Mart's suite.

---

## Page Object Conventions

Every page object extends `BasePage` (`e2e/page-objects/base.page.ts`) which provides:
- `goto(path)` — navigate + wait for `networkidle` + `waitForAngular()`
- `waitForAngular(timeout?)` — waits for NgZone to stabilize
- `cleanupCdkOverlays()` — removes overlay remnants
- `clickButton(name)` — shortcut for `getByRole('button', { name })`
- `forceClick(locator)` — `el.click()` via evaluate (bypass pointer interception)
- `currentPath()` — returns `window.location.pathname`

**Structure template:**

```ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page description + URL.
 *
 * Structure (component.html):
 *   <h2>Title</h2>
 *   ... key structural elements
 *
 * Notes on quirks (e.g., "heading is <h2> from app-list-page wrapper")
 */
export class MyFeaturePage extends BasePage {
  readonly heading: Locator;
  readonly primaryAction: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^My Feature$/i, level: 2 });
    this.primaryAction = page.getByRole('button', { name: /Do Thing/i });
  }

  async goto(): Promise<void> {
    await super.goto('/my-feature');
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async waitForLoad(): Promise<void> {
    // Tolerate both data and empty states
    await this.page.waitForFunction(() => {
      const data = document.querySelector('.my-grid');
      const empty = document.querySelector('.empty-state');
      return (data && data.children.length > 0) || !!empty;
    }, { timeout: 15_000 });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.primaryAction).toBeVisible();
  }
}
```

**Rules:**
- Expose locators as `readonly` properties so specs can assert on them directly
- `goto()` navigates + waits for the heading
- `waitForLoad()` waits for *either* data or empty state (both are valid)
- `expectLoaded()` is the minimal "page mounted correctly" assertion
- Keep page objects under 400 lines — extract sub-areas if they grow

---

## Spec Conventions

```ts
import { test, expect } from '../fixtures/auth.fixture';  // NOT @playwright/test
import { MyFeaturePage } from '../page-objects/my-feature.page';

test.describe('@my-feature @smoke — Feature Name', () => {
  test('should load /my-feature with heading and grid/empty state', async ({ page }) => {
    const feature = new MyFeaturePage(page);
    await feature.goto();
    await feature.waitForLoad();
    await feature.expectLoaded();

    // Tolerate empty data (UAT org may have no records)
    const count = await feature.getCardCount();
    if (count === 0) {
      await expect(feature.emptyState).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should navigate from card to detail page', async ({ page }) => {
    const feature = new MyFeaturePage(page);
    await feature.goto();
    await feature.waitForLoad();

    const count = await feature.getCardCount();
    test.skip(count === 0, 'No records in UAT — cannot test card navigation');

    await feature.clickFirstCard();
    await page.waitForURL(/\/my-feature\/[^/]+/, { timeout: 15_000 });
    // ... detail-page assertions, tolerating not-found
  });
});
```

**Rules:**
- Import `test` and `expect` from `'../fixtures/auth.fixture'` — NOT from `@playwright/test`. The auth fixture does not take effect otherwise.
- Tag tests with `@<feature> @smoke` in the describe string for grep filtering
- **Skip gracefully when data is missing** via `test.skip(count === 0, 'reason')`. UAT orgs may have no RFPs, no invitations, etc.
- **Tolerate both loaded and not-found terminal states** on detail pages
- Don't `Promise.all` multiple card clicks — tests are single-worker, serialize everything
- Don't rely on `waitForLoadState('networkidle')` alone — Angular can emit late microtasks. Combine with `waitForAngular()`.

---

## Form Interactions — Decision Table

**Before writing ANY form-touching test, answer this question:** is the dialog UX itself the thing you're testing, or are you just using the dialog to create test data so you can verify the end state?

- **Testing the UX** → drive the form through the helpers below. Budget extra time for race conditions.
- **Just creating data** → use the **REST API bypass** (gotcha § 2). Open dialog, cancel, POST to API, reload, verify. This is the default strategy for action dialogs with autocompletes.

When you do drive the form, use the right tool per control:

| Component | Spec interaction |
|---|---|
| Native `<input>` (Material `<input matInput>`) | `locator.fill('text')` works normally |
| Material `<mat-select>` | `locator.click()` then click `mat-option` — works normally |
| Material `<mat-checkbox>` | `locator.check()` works; use `{ force: true }` if intercepted |
| Material `<mat-datepicker>` | Fill the native input directly or use `evaluate_script` to set the value |
| **`<zb-simple-autocomplete>`** | **Use `selectZbAutocompleteValue/BySearch/ByProperty` from `e2e/helpers/zb-autocomplete.ts`** — never click `mat-option` (Layer 1 fix) |
| **`<zb-simple-multi-autocomplete>`** | Not yet supported by `selectValue`. **Use REST API bypass.** Manual `onSelectionChange` patching is possible but fragile — see learnings doc |
| `<zb-search-input>` | Emits via RxJS debounce — fill the inner input, wait for the debounce window (~300ms) |

**After any `zb-simple-autocomplete` interaction that triggers downstream API calls** (cascaded dropdowns, dependent tree loads, etc.), wait for the response explicitly, not for the UI element:

```ts
const [response] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('filterTree') && r.status() === 200),
  pageObject.setCategory('Security'),
]);
await page.waitForTimeout(1000); // buffer for Angular to process
```

This avoids Layer 2 cascades silently wiping your test state. See gotcha § 1 (Layer 2) for the full explanation.

### Where to put form helpers

When your page object needs to fill a form with `zb-simple-autocomplete`, import the shared helper at the top:

```ts
import { selectZbAutocompleteByProperty } from '../helpers/zb-autocomplete';

export class RfpBasicsFormPage extends BasePage {
  async setCategory(categoryName: string): Promise<void> {
    await selectZbAutocompleteByProperty(
      this.page,
      'zb-simple-autocomplete[formControlName="category"]',
      categoryName,
      'name',
    );
  }
}
```

**This helper will be reused across dozens of future specs** (any RFP/bid/engagement/profile form with typed dropdowns). Always go through the helper — don't copy-paste the `ng.getComponent()` evaluate block inline. Centralize the workaround so when ngx-library evolves (e.g., adds multi-select `selectValue`, or changes the API), we update one file instead of N specs.

---

## Writing a New Spec — Step-by-Step Recipe

1. **Read the corresponding `.claude/smoke-tests/*.md` if one exists.** Take the selectors, field names, and expected states from the MCP smoke doc — don't rediscover them.

2. **Inspect the actual page HTML** — open `src/app/pages/<feature>/` and read the `.html`. Note:
   - What level is the heading (`<h1>` / `<h2>`)?
   - What selectors identify the primary grid/list container?
   - Is there a loading state and empty state? What classes?
   - Are there CSS classes like `.status-*` that indicate state?

3. **Run the page manually in dev server** to confirm it renders. Watch the browser's Elements panel.

4. **Write the page object** under `e2e/page-objects/<feature>.page.ts`. Extend `BasePage`. Keep it minimal — just what the smoke test needs.

5. **Write the spec** under `e2e/specs/<feature>-smoke.spec.ts`. Aim for 2-4 tests max:
   - One "page loads" test
   - Optional "navigate to detail" test
   - Optional "key sub-flow" test (tab click, filter change, etc.)

6. **Run the spec in isolation:** `npm run e2e -- e2e/specs/<feature>-smoke.spec.ts --reporter=list`

7. **If tests fail, read `test-results/<dir>/error-context.md`** — it has a YAML page snapshot that's faster to diagnose from than the screenshot.

8. **Run the full suite at the end** to catch inter-test pollution: `npm run e2e`

9. **Commit atomically** with a message like `test(e2e): add <feature> smoke spec`.

---

## Data Setup Strategy

**Current approach:** read-only smoke tests against UAT data. No test data creation.

**When you need to add a test that requires specific data:**

Option A — **Use API cleanup (current pattern for zb/ui):**
```ts
test.beforeEach(async ({ request }) => {
  // Delete any stale test data matching a known name/tag
  const resp = await request.get(`${BASE_URL}/api/...?pageNumber=1&pageSize=100`);
  if (resp.ok()) {
    const items = await resp.json();  // Platform API returns arrays directly
    const match = items.find((i) => i.name === 'e2e-test-item');
    if (match) {
      await request.delete(`${BASE_URL}/api/.../${match.id}`);
    }
  }
});
```
**Note:** platform list endpoints return arrays directly, NOT `{ items: [] }`. The API helper (`e2e/fixtures/api.fixture.ts`) handles both.

Option B — **Push test data via Pipeline** (SME Mart entities live in AuditgraphDB):
- Use the platform Pipeline receive API via the dev server proxy
- See `src/app/core/services/pipeline-write.service.ts` for class IDs
- Test data should be clearly tagged (e.g., name starting with `e2e-`) for cleanup
- **Pipeline receive is full-replace** — include ALL fields or they get nulled

Option C — **Neon direct** (for org_documents and similar Neon-only entities):
- Use `mcp__Neon__run_sql` via MCP for setup/cleanup
- Project ID: `square-meadow-76427985`, database `neondb`
- Example in `.claude/smoke-tests/org-document-management.md`

---

## Debugging Playbook

1. **Test fails with "element not found":**
   - Read `test-results/<dir>/error-context.md` for the page snapshot
   - Check if the heading level or selector assumption is wrong
   - Check if the page requires data that the UAT org doesn't have

2. **Test times out on `waitForLoad`:**
   - Is the dev server actually running? `curl -o /dev/null -w "%{http_code}" http://localhost:4200`
   - Is the org ID correct in `e2e/.env`? Mismatch = no data returns
   - Did the component route redirect? Check `page.url()` in the test.

3. **Test passes in isolation, fails in full suite:**
   - Inter-test pollution. Check sessionStorage / app state leaks.
   - Run both tests in order and inspect: `npm run e2e -- <spec> -g "test1|test2"`

4. **Flaky on first run, passes on re-run:**
   - Angular HMR first-load timing. Not a bug. Retry.

5. **All tests fail with auth errors:**
   - `e2e/.env` missing? `auth.fixture` throws a specific error.
   - `.env.local` missing `ZEROBIAS_UAT_API_KEY`? Dev server proxy silently skips auth header.
   - `dana-org-id` cookie not matching the org in `.env.local`? SDK resolves wrong org.

---

## Phase 4 (Deferred) — CI Integration

Plan 052 deferred CI integration. Future work:
- `.github/workflows/e2e.yml` — run on push to `poc/sme-mart`
- `e2e/tsconfig.json` — separate TS config for E2E if strict-mode conflicts arise
- JUnit reporter for CI
- Build a static bundle and serve it (avoid HMR flakes in CI)
- Consider `workers > 1` with proper test isolation to hit the original <2 min target
- Only attempt after the suite runs clean 5x in a row locally

---

## Reference — Existing Specs Summary

| Spec | Route | Test Count | Notes |
|---|---|---|---|
| `engagement-smoke.spec.ts` | `/my/engagements` → detail → tabs | 3 | Tab-label whitespace handled in page object |
| `rfp-smoke.spec.ts` | `/rfps`, `/rfps/:id`, `/rfps/new` | 3 | Wizard test targets method chooser, not stepper |
| `project-smoke.spec.ts` | `/my/engagements/:id` → Projects tab | 1 | Skips if first card is an RFP |
| `vendor-profile-smoke.spec.ts` | `/my-profile` | 2 | 6 tabs, tab navigation |
| `org-nav-smoke.spec.ts` | `/orgs`, `/orgs/:id`, `/org` | 3 | Three-tier navigation |
| `invitations-smoke.spec.ts` | `/my/invitations` | 2 | Phase 14, filter chips + empty state |
| `org-docs-smoke.spec.ts` | `/org/documents` | 1 | Toolbar + upload button only |

**Suite runtime:** ~4.3 min serial (15 tests × ~17s avg). Not < 2 min — acceptable for now.

---

## Further Reading

- `.claude/notes/playwright-e2e-learnings-from-zb-ui.md` — original learnings dump from `zb/ui` (autocomplete workaround details, CDK overlay cleanup)
- `~/Projects/zb/ui/e2e/` — reference implementation, different stack (iframed gateway) but same Angular/Material patterns
- `e2e/README.md` — user-facing quick start
