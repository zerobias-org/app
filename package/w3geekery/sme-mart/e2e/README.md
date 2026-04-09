# SME Mart E2E Tests

Playwright-based smoke tests for the SME Mart Angular 21 app.

## Quick Start

```bash
# 1. Copy env template and fill in values from .env.local
cp e2e/.env.example e2e/.env
# Edit e2e/.env — set ZEROBIAS_UAT_ORG_ID to match .env.local

# 2. Start the dev server (Terminal 1)
npm run dev

# 3. Run E2E tests (Terminal 2)
npm run e2e                    # Full suite
npm run e2e -- e2e/specs/engagement-smoke.spec.ts  # Single spec
npm run e2e:debug              # Debug mode (Playwright Inspector)
```

## Architecture

```
e2e/
├── playwright.config.ts   # Playwright runner config
├── .env.example           # Env var template (committed)
├── .env                   # Real env vars (gitignored)
├── fixtures/
│   ├── auth.fixture.ts    # Injects dana-org-id cookie before each test
│   └── api.fixture.ts     # REST API helpers (list/get/delete) for cleanup
├── helpers/
│   └── wait-for-angular.ts  # Waits for Angular NgZone to stabilize
├── page-objects/          # One page object per major page/flow
└── specs/                 # Test specs — one per feature area
```

## Auth

SME Mart uses proxy-based auth in local dev:

- The Angular dev server proxy (`proxy-uat.conf.js`) injects an
  `Authorization: APIKey ...` header on `/api/*` requests using
  `ZEROBIAS_UAT_API_KEY` from `.env.local`.
- The browser also needs `dana-org-id` cookie for the in-browser SDK.
  The auth fixture injects it from `ZEROBIAS_UAT_ORG_ID` in `e2e/.env`.
- **No login flow** — tests assume proxy-based auth is already configured.

## Known Issues

### `zb-simple-autocomplete` is broken for Playwright

The `zb-simple-autocomplete` component (from `@zerobias-org/ngx-library`) does
not fire `(selectionChange)` when Playwright clicks a `mat-option`. The visual
text updates but the parent form's `formControlName` binding stays `null`.

**Workaround:** Use `ng.getComponent()` (Angular's dev-mode debug API) to
call the component's `searchFn` directly, store captured objects on the DOM,
and patch the dialog's `onAction` method. See
`~/Projects/zb/ui/e2e/page-objects/boundary-manager.page.ts` method
`selectStandard()` for the full pattern.

### CDK Overlay Remnants

After programmatic `setValue` calls, CDK overlay panels can permanently cover
dialog content. Clean up with:

```ts
dialogEl.querySelectorAll('input').forEach((inp) => inp.blur());
document.querySelectorAll('.cdk-overlay-connected-position-bounding-box')
  .forEach((p) => p.remove());
```

Helper: `BasePage.cleanupCdkOverlays()`.

### Playwright click intercepted by CDK overlays

Use `locator.evaluate((el: HTMLElement) => el.click())` to bypass the pointer
interaction when native Playwright clicks are intercepted.

## Selector Priority

1. `data-testid` attributes (most stable)
2. `getByRole('button', { name: 'Save' })` for Material components
3. `getByText()` for unique labels
4. CSS selectors (last resort, brittle)

## Debugging

```bash
# Run single test in headed mode with Inspector
npm run e2e:debug -- e2e/specs/engagement-smoke.spec.ts

# View HTML report after a failed run
npx playwright show-report e2e/e2e-results

# Trace viewer for a failed test
npx playwright show-trace e2e/test-results/<test-dir>/trace.zip
```

## References

- `.claude/notes/playwright-e2e-learnings-from-zb-ui.md` — full learnings
  from the `zb/ui` Boundary Manager E2E work
- `~/Projects/zb/ui/e2e/` — reference implementation (Angular 21, same stack)
