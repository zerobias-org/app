import { Page, Locator } from '@playwright/test';

/**
 * Playwright helpers for `zb-simple-autocomplete` (`@zerobias-org/ngx-library`).
 *
 * ## Why this exists
 *
 * `zb-simple-autocomplete` is a `ControlValueAccessor` wrapping Material
 * autocomplete. Its `(selectionChange)` output does NOT fire reliably when
 * Playwright clicks a `mat-option` — the visual text updates but the parent
 * form's `formControlName` binding stays `null`. Manual user clicks work
 * because they go through the full browser event chain; Playwright's click
 * mechanism doesn't trigger the same internal path.
 *
 * As of `@zerobias-org/ngx-library@0.2.30`, the component exposes a
 * `selectValue(value)` method specifically for E2E tests:
 *
 *     selectValue(value) {
 *       this.formControl.setValue(value, { emitEvent: false });
 *       this.onChange(value);          // propagates to parent form
 *       this.onTouched();
 *       this.selectionChange.emit(value);
 *     }
 *
 * The helpers below call `selectValue()` via Angular's dev-mode debug API
 * (`ng.getComponent()`). This is the **preferred** way to interact with
 * `zb-simple-autocomplete` from Playwright tests — do NOT simulate typing +
 * clicking mat-options.
 *
 * ## Usage
 *
 * ```ts
 * import { selectZbAutocompleteValue, selectZbAutocompleteBySearch } from '../helpers/zb-autocomplete';
 *
 * // Option A: you already have the typed value object
 * await selectZbAutocompleteValue(page, 'zb-simple-autocomplete[formControlName="category"]', categoryObj);
 *
 * // Option B: call the component's searchFn to find the object by display text
 * await selectZbAutocompleteBySearch(
 *   page,
 *   'zb-simple-autocomplete[formControlName="category"]',
 *   'Security',
 *   (opt) => opt.name === 'Security',
 * );
 * ```
 *
 * ## Prerequisites
 *
 * - `@zerobias-org/ngx-library >= 0.2.30`
 * - Dev build (ng serve). Angular strips `ng.getComponent()` in production
 *   builds unless `enableProdMode()` is avoided or `ng.getComponent` is
 *   explicitly exposed. Playwright tests run against `ng serve`, so dev
 *   mode is always on — this works out of the box.
 *
 * ## Gotchas
 *
 * - Pass a CSS selector that uniquely identifies the autocomplete element.
 *   Common choices: `zb-simple-autocomplete[formControlName="xyz"]`, or an
 *   `#id` reference. Avoid `zb-simple-autocomplete` alone when multiple
 *   exist on the page.
 * - `ZbSimpleMultiAutocompleteComponent` does NOT yet expose `selectValue`
 *   in 0.2.30. For multi-select autocompletes, fall back to patching
 *   `onSelectionChange` manually (see learnings doc) or file an upstream
 *   issue requesting the same API.
 * - The value passed to `selectValue()` must be the **typed object** that
 *   `searchFn` returns, not just a display string. Use option B
 *   (`selectZbAutocompleteBySearch`) when you only have the display text.
 */

/**
 * Select a value on a `zb-simple-autocomplete` by passing the typed object
 * directly. Bypasses Playwright click issues via `ng.getComponent().selectValue()`.
 *
 * @param page - Playwright Page
 * @param selector - CSS selector for the `<zb-simple-autocomplete>` element
 * @param value - The typed object to set (must match what searchFn returns)
 * @throws if the element isn't found, `ng.getComponent` returns nothing, or
 *         the component lacks `selectValue` (ngx-library < 0.2.30)
 */
export async function selectZbAutocompleteValue(
  page: Page,
  selector: string,
  value: unknown,
): Promise<void> {
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`[zb-autocomplete] element not found: ${sel}`);
      const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
      if (!ng?.getComponent) {
        throw new Error('[zb-autocomplete] window.ng.getComponent not available — dev build required');
      }
      const comp = ng.getComponent(el) as { selectValue?: (v: unknown) => void } | null;
      if (!comp) throw new Error(`[zb-autocomplete] no component instance for ${sel}`);
      if (typeof comp.selectValue !== 'function') {
        throw new Error(
          '[zb-autocomplete] selectValue() missing — upgrade @zerobias-org/ngx-library to >= 0.2.30',
        );
      }
      comp.selectValue(val);
    },
    { sel: selector, val: value as unknown },
  );
}

/**
 * Select a value on a `zb-simple-autocomplete` by calling its `searchFn` to
 * find the object matching a predicate. Use this when you only have display
 * text (not the typed object) and need to resolve the object via the
 * component's own search pipeline.
 *
 * @param page - Playwright Page
 * @param selector - CSS selector for the `<zb-simple-autocomplete>` element
 * @param searchTerm - Passed to the component's `searchFn`
 * @param matchBody - Body of a function that accepts an option and returns
 *                    `true` for the match. Passed as a STRING because it's
 *                    serialized into `page.evaluate`. Default: first result.
 */
export async function selectZbAutocompleteBySearch(
  page: Page,
  selector: string,
  searchTerm: string,
  matchBody: string = 'return true;',
): Promise<void> {
  await page.evaluate(
    async ({ sel, term, matchFnBody }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`[zb-autocomplete] element not found: ${sel}`);
      const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
      if (!ng?.getComponent) {
        throw new Error('[zb-autocomplete] window.ng.getComponent not available — dev build required');
      }
      const comp = ng.getComponent(el) as
        | {
            searchFn?: (term: string) => { subscribe: (obs: { next: (r: unknown[]) => void; error: (e: unknown) => void }) => void };
            selectValue?: (v: unknown) => void;
          }
        | null;
      if (!comp) throw new Error(`[zb-autocomplete] no component instance for ${sel}`);
      if (typeof comp.searchFn !== 'function') {
        throw new Error('[zb-autocomplete] component has no searchFn');
      }
      if (typeof comp.selectValue !== 'function') {
        throw new Error(
          '[zb-autocomplete] selectValue() missing — upgrade @zerobias-org/ngx-library to >= 0.2.30',
        );
      }
      // eslint-disable-next-line no-new-func
      const matchFn = new Function('option', matchFnBody) as (opt: unknown) => boolean;
      const results = await new Promise<unknown[]>((resolve, reject) => {
        comp.searchFn!(term).subscribe({
          next: (r) => resolve(r),
          error: (e) => reject(e),
        });
      });
      const match = (results as unknown[]).find((opt) => matchFn(opt));
      if (!match) {
        throw new Error(
          `[zb-autocomplete] no option matched predicate for term "${term}" (${results.length} results)`,
        );
      }
      comp.selectValue(match);
    },
    { sel: selector, term: searchTerm, matchFnBody: matchBody },
  );
}

/**
 * Convenience: select by a property equality. Wraps `selectZbAutocompleteBySearch`
 * with a generated matcher.
 *
 * Example:
 *   await selectZbAutocompleteByProperty(page, '[formControlName="category"]', 'Security', 'name');
 */
export async function selectZbAutocompleteByProperty(
  page: Page,
  selector: string,
  searchTerm: string,
  propertyKey: string,
): Promise<void> {
  // Generate a matcher body that compares `option[propertyKey] === searchTerm`.
  // JSON-stringify both values for injection safety.
  const matchBody = `return option && option[${JSON.stringify(propertyKey)}] === ${JSON.stringify(searchTerm)};`;
  await selectZbAutocompleteBySearch(page, selector, searchTerm, matchBody);
}

/**
 * Returns `true` if the page's `zb-simple-autocomplete` instances have the
 * `selectValue` method (i.e., ngx-library >= 0.2.30). Use as a sanity check
 * in a suite-level `beforeAll` hook if you want a friendly error rather than
 * the per-test stack trace.
 */
export async function assertZbAutocompleteSupported(page: Page, selector = 'zb-simple-autocomplete'): Promise<void> {
  const supported = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'missing';
    const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
    if (!ng?.getComponent) return 'no-ng-debug';
    const comp = ng.getComponent(el) as { selectValue?: unknown } | null;
    if (!comp) return 'no-component';
    if (typeof comp.selectValue !== 'function') return 'no-select-value';
    return 'ok';
  }, selector);
  if (supported !== 'ok') {
    throw new Error(
      `[zb-autocomplete] not supported on this page: ${supported}. ` +
        'Ensure @zerobias-org/ngx-library >= 0.2.30 and dev build.',
    );
  }
}
