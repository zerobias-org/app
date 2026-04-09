# Playwright E2E Learnings from zb/ui

> Source: Claude instance working on Boundary Manager E2E tests in `~/Projects/zb/ui`
> Date: 2026-04-08
> Purpose: Foundation for SME Mart Plan 052 (Playwright E2E Smoke Tests)

## Critical: zb-simple-autocomplete is broken for Playwright

The `zb-simple-autocomplete` component (from `@zerobias-org/ngx-library`) doesn't fire its `(selectionChange)` output when Playwright clicks a `mat-option`. The `mat-option` click updates the visual text but the parent form's `formControlName` binding stays `null`. This causes `TypeError: Cannot read properties of null (reading 'id')` when any dialog's action handler tries to read form data.

**Root cause:** The component uses a `ControlValueAccessor` that doesn't properly bridge `mat-autocomplete`'s `optionSelected` event to the parent form. Manual user clicks work because they go through the full browser event chain; Playwright's click mechanism doesn't trigger the same internal path.

### ✅ FIXED UPSTREAM in `@zerobias-org/ngx-library@0.2.30`

As of 0.2.30, `ZbSimpleAutocompleteComponent` exposes a `selectValue(value)` method specifically for E2E tests:

```ts
selectValue(value) {
  this.formControl.setValue(value, { emitEvent: false });
  this.onChange(value);          // propagates via ControlValueAccessor
  this.onTouched();
  this.selectionChange.emit(value);
}
```

**SME Mart uses the helper at `e2e/helpers/zb-autocomplete.ts`** — call that, don't patch `onAction` manually. See `.claude/notes/e2e-testing-guide.md` § "Form Interactions — Required Helpers" for usage.

**Multi-select (`ZbSimpleMultiAutocompleteComponent`) is NOT yet fixed as of 0.2.30** — no `selectValue` method. For multi-selects, the patching workaround below still applies. File an upstream issue if you hit this in SME Mart.

### Legacy workaround (pre-0.2.30, or for multi-select)

Use `ng.getComponent()` (Angular's dev-mode debug API) to:
1. Call the component's `searchFn` directly to get the typed object
2. Store captured objects on a DOM element
3. Patch the dialog's `onAction` method to read from the stored objects

**Reference files (zb/ui):**
- Page object: `~/Projects/zb/ui/e2e/page-objects/boundary-manager.page.ts` — `selectStandard()` method (~line 258)
- Spec: `~/Projects/zb/ui/e2e/boundary-manager/boundary-add-standard.spec.ts`

This is the pattern the SME Mart helper was modeled on, but the helper uses the newer `selectValue()` API so it's dramatically simpler.

## CDK Overlay Gotchas

- CDK overlays render inside `iframe.contentDocument`, not in the portal's document. Use `this.iframe.locator('mat-option', { hasText: name })` to find them.
- CDK overlay panels can permanently cover dialog content after programmatic `setValue` calls. After any evaluate that sets form values, clean up with:
  ```ts
  dialogEl.querySelectorAll('input').forEach((inp: HTMLElement) => inp.blur());
  document.querySelectorAll('.cdk-overlay-connected-position-bounding-box').forEach(p => p.remove());
  ```
- Use `{ force: true }` on checkbox clicks if CDK overlay remnants intercept pointer events.

## Gateway / Iframe Architecture

- zb/ui tests run through gateway at `http://localhost:9000` (same-origin for all iframed apps)
- Iframe locator pattern: `page.frameLocator('iframe[src*="boundary-manager-app"]')` (substitute app name)
- `FrameLocator` doesn't have `evaluate` — use `this.iframe.locator('selector').evaluate(...)` instead
- Dialog locator: `this.iframe.locator('mat-dialog-container')`

**SME Mart difference:** SME Mart runs standalone (not iframed in gateway) during local dev. May not need frameLocator unless testing embedded-in-portal mode. But CDK overlay issues still apply.

## API Cleanup for Repeatable Tests

Platform API is 1-indexed. Cleanup pattern:
```ts
test.beforeEach(async ({ request }) => {
  const resp = await request.get(`${BASE_URL}/api/platform/app/boundaries/${BOUNDARY_ID}/standardBaselines?pageNumber=1&pageSize=100`);
  if (resp.ok()) {
    const items = await resp.json(); // Returns array directly, NOT { items: [] }
    const match = items.find((i: any) => i?.standard?.name === standardName);
    if (match) {
      await request.delete(`${BASE_URL}/api/platform/app/boundaries/${BOUNDARY_ID}/standardBaselines/${match.id}`);
    }
  }
});
```

## Auth Pattern

- Auth via env vars/API keys (not login flow)
- `dana-org-id` cookie injection
- Auth fixture at: `~/Projects/zb/ui/e2e/fixtures/auth.fixture.ts`

## Playwright Config

- Config: `~/Projects/zb/ui/e2e/playwright.config.ts`
- Run: `npx playwright test --config=e2e/playwright.config.ts <spec-path> --project=<project-name> --reporter=list`

## Working Patterns

- Page objects in `~/Projects/zb/ui/e2e/page-objects/` — read for patterns
- `getByTestId` for custom ZB components with `data-testid` attributes
- `getByRole` for standard Material components (buttons, comboboxes, checkboxes)
- `toBeChecked`/`toBeEnabled` for state assertions before clicking
- `addBtn.evaluate((el: HTMLElement) => el.click())` when Playwright's native click is intercepted by CDK overlays

## Filesystem Structure (zb/ui)

```
e2e/
├── playwright.config.ts
├── fixtures/
│   └── auth.fixture.ts
├── page-objects/
│   └── boundary-manager.page.ts
└── boundary-manager/
    └── boundary-add-standard.spec.ts
```
