import { Page, Locator } from '@playwright/test';

/**
 * Playwright helpers for `zb-simple-autocomplete` AND `zb-simple-multi-autocomplete`
 * (`@zerobias-org/ngx-library`).
 *
 * ## Why this exists
 *
 * Both autocompletes are `ControlValueAccessor`s wrapping Material autocomplete.
 * Their `(selectionChange)` outputs do NOT fire reliably when Playwright clicks
 * a `mat-option` — the visual text/chip updates but the parent form's
 * `formControlName` binding stays empty. Manual user clicks work because they
 * go through the full browser event chain; Playwright's click mechanism doesn't
 * trigger the same internal path.
 *
 * As of `@zerobias-org/ngx-library@0.2.30`, the **single-select** component
 * exposes `selectValue(value)` for E2E tests. As of **`0.2.32`**, the
 * **multi-select** component exposes `selectValue(values)` (replace) and
 * `addValue(value)` (append, idempotent by `idKey`).
 *
 * The helpers below call those methods via Angular's dev-mode debug API
 * (`ng.getComponent()`). This is the **preferred** way to interact with both
 * components from Playwright tests — do NOT simulate typing + clicking mat-options.
 *
 * ## Usage
 *
 * ```ts
 * import {
 *   // Single-select
 *   selectZbAutocompleteValue,
 *   selectZbAutocompleteBySearch,
 *   selectZbAutocompleteByProperty,
 *   // Multi-select
 *   selectZbMultiAutocompleteValues,
 *   addZbMultiAutocompleteValue,
 * } from '../helpers/zb-autocomplete';
 *
 * // Single-select — replace the value
 * await selectZbAutocompleteValue(page, 'zb-simple-autocomplete[formControlName="category"]', categoryObj);
 *
 * // Single-select — find by display text via the component's own searchFn
 * await selectZbAutocompleteByProperty(
 *   page,
 *   'zb-simple-autocomplete[formControlName="category"]',
 *   'Security',
 *   'name',
 * );
 *
 * // Multi-select — replace entire selection
 * await selectZbMultiAutocompleteValues(
 *   page,
 *   'zb-simple-multi-autocomplete[formControlName="tags"]',
 *   [tag1, tag2, tag3],
 * );
 *
 * // Multi-select — append one (no-op if already selected by idKey)
 * await addZbMultiAutocompleteValue(
 *   page,
 *   'zb-simple-multi-autocomplete[formControlName="tags"]',
 *   newTag,
 * );
 * ```
 *
 * ## Prerequisites
 *
 * - `@zerobias-org/ngx-library >= 0.2.30` for single-select
 * - `@zerobias-org/ngx-library >= 0.2.32` for multi-select
 * - Dev build (ng serve). Angular strips `ng.getComponent()` in production
 *   builds unless `enableProdMode()` is avoided or `ng.getComponent` is
 *   explicitly exposed. Playwright tests run against `ng serve`, so dev
 *   mode is always on — this works out of the box.
 *
 * ## Gotchas
 *
 * - Pass a CSS selector that uniquely identifies the autocomplete element.
 *   Common choices: `zb-simple-autocomplete[formControlName="xyz"]`, an
 *   attribute selector, or an `#id` reference. Avoid bare element selectors
 *   when multiple exist on the page.
 * - The value(s) passed must be the **typed object(s)** that `searchFn`
 *   returns — not display strings. For single-select, use
 *   `selectZbAutocompleteBySearch`/`ByProperty` to resolve the object via
 *   the component's own search pipeline when you only have text.
 * - Multi-select `addValue` is idempotent by `idKey` (default `'id'`). If
 *   your objects lack the configured `idKey`, `isSelected()` won't match
 *   and you'll get duplicates — match the `idKey` your component uses.
 * - To clear a multi-select from a test, call
 *   `selectZbMultiAutocompleteValues(page, selector, [])`.
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

// ---------------------------------------------------------------------------
// Multi-select — `zb-simple-multi-autocomplete` (ngx-library >= 0.2.32)
// ---------------------------------------------------------------------------

/**
 * Replace the entire selection on a `zb-simple-multi-autocomplete` with the
 * given array. Calls `ZbSimpleMultiAutocompleteComponent.selectValue(values)`
 * which sets `selectedValues`, clears the search input, propagates via
 * `ControlValueAccessor`, and emits `selectionChange`.
 *
 * Pass `[]` to clear the selection.
 *
 * @param page - Playwright Page
 * @param selector - CSS selector for the `<zb-simple-multi-autocomplete>` element
 * @param values - Array of typed objects (must match what searchFn returns)
 * @throws if the element isn't found, `ng.getComponent` returns nothing, or
 *         the component lacks `selectValue` (ngx-library < 0.2.32)
 */
export async function selectZbMultiAutocompleteValues(
  page: Page,
  selector: string,
  values: unknown[],
): Promise<void> {
  await page.evaluate(
    ({ sel, vals }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`[zb-multi-autocomplete] element not found: ${sel}`);
      const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
      if (!ng?.getComponent) {
        throw new Error('[zb-multi-autocomplete] window.ng.getComponent not available — dev build required');
      }
      const comp = ng.getComponent(el) as { selectValue?: (v: unknown[]) => void } | null;
      if (!comp) throw new Error(`[zb-multi-autocomplete] no component instance for ${sel}`);
      if (typeof comp.selectValue !== 'function') {
        throw new Error(
          '[zb-multi-autocomplete] selectValue() missing — upgrade @zerobias-org/ngx-library to >= 0.2.32',
        );
      }
      comp.selectValue(vals as unknown[]);
    },
    { sel: selector, vals: values as unknown[] },
  );
}

/**
 * Append a single value to a `zb-simple-multi-autocomplete`'s current
 * selection. Calls `ZbSimpleMultiAutocompleteComponent.addValue(value)`
 * which is idempotent: no-op if the value is already selected (matched
 * by the component's configured `idKey`, default `'id'`).
 *
 * Use this when you want to mirror the real user flow of adding tags one
 * at a time, or when you don't want to read the current `selectedValues`
 * just to append.
 *
 * @param page - Playwright Page
 * @param selector - CSS selector for the `<zb-simple-multi-autocomplete>` element
 * @param value - A typed object (must match what searchFn returns, including `idKey`)
 * @throws if the element isn't found, `ng.getComponent` returns nothing, or
 *         the component lacks `addValue` (ngx-library < 0.2.32)
 */
export async function addZbMultiAutocompleteValue(
  page: Page,
  selector: string,
  value: unknown,
): Promise<void> {
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`[zb-multi-autocomplete] element not found: ${sel}`);
      const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
      if (!ng?.getComponent) {
        throw new Error('[zb-multi-autocomplete] window.ng.getComponent not available — dev build required');
      }
      const comp = ng.getComponent(el) as { addValue?: (v: unknown) => void } | null;
      if (!comp) throw new Error(`[zb-multi-autocomplete] no component instance for ${sel}`);
      if (typeof comp.addValue !== 'function') {
        throw new Error(
          '[zb-multi-autocomplete] addValue() missing — upgrade @zerobias-org/ngx-library to >= 0.2.32',
        );
      }
      comp.addValue(val);
    },
    { sel: selector, val: value as unknown },
  );
}

/**
 * Append a value to a `zb-simple-multi-autocomplete` by calling the component's
 * `searchFn` to resolve the typed object from a search term + predicate. Use
 * this when you only have display text (not the typed object).
 *
 * @param page - Playwright Page
 * @param selector - CSS selector for the `<zb-simple-multi-autocomplete>` element
 * @param searchTerm - Passed to the component's `searchFn`
 * @param matchBody - Body of a function that accepts an option and returns
 *                    `true` for the match. Passed as a STRING because it's
 *                    serialized into `page.evaluate`. Default: first result.
 */
export async function addZbMultiAutocompleteBySearch(
  page: Page,
  selector: string,
  searchTerm: string,
  matchBody: string = 'return true;',
): Promise<void> {
  await page.evaluate(
    async ({ sel, term, matchFnBody }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`[zb-multi-autocomplete] element not found: ${sel}`);
      const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
      if (!ng?.getComponent) {
        throw new Error('[zb-multi-autocomplete] window.ng.getComponent not available — dev build required');
      }
      const comp = ng.getComponent(el) as
        | {
            searchFn?: (term: string) => { subscribe: (obs: { next: (r: unknown[]) => void; error: (e: unknown) => void }) => void };
            addValue?: (v: unknown) => void;
          }
        | null;
      if (!comp) throw new Error(`[zb-multi-autocomplete] no component instance for ${sel}`);
      if (typeof comp.searchFn !== 'function') {
        throw new Error('[zb-multi-autocomplete] component has no searchFn');
      }
      if (typeof comp.addValue !== 'function') {
        throw new Error(
          '[zb-multi-autocomplete] addValue() missing — upgrade @zerobias-org/ngx-library to >= 0.2.32',
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
          `[zb-multi-autocomplete] no option matched predicate for term "${term}" (${results.length} results)`,
        );
      }
      comp.addValue(match);
    },
    { sel: selector, term: searchTerm, matchFnBody: matchBody },
  );
}

/**
 * Convenience: append a multi-select value by a property equality match.
 * Wraps `addZbMultiAutocompleteBySearch` with a generated matcher.
 *
 * Example:
 *   await addZbMultiAutocompleteByProperty(page, '[formControlName="tags"]', 'security', 'name');
 */
export async function addZbMultiAutocompleteByProperty(
  page: Page,
  selector: string,
  searchTerm: string,
  propertyKey: string,
): Promise<void> {
  const matchBody = `return option && option[${JSON.stringify(propertyKey)}] === ${JSON.stringify(searchTerm)};`;
  await addZbMultiAutocompleteBySearch(page, selector, searchTerm, matchBody);
}

/**
 * Returns OK iff the page's `zb-simple-multi-autocomplete` instances have
 * `selectValue` AND `addValue` (ngx-library >= 0.2.32). Use as a sanity
 * check in a suite-level `beforeAll` hook.
 */
export async function assertZbMultiAutocompleteSupported(
  page: Page,
  selector = 'zb-simple-multi-autocomplete',
): Promise<void> {
  const supported = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'missing';
    const ng = (window as unknown as { ng?: { getComponent: (el: Element) => unknown } }).ng;
    if (!ng?.getComponent) return 'no-ng-debug';
    const comp = ng.getComponent(el) as { selectValue?: unknown; addValue?: unknown } | null;
    if (!comp) return 'no-component';
    if (typeof comp.selectValue !== 'function') return 'no-select-value';
    if (typeof comp.addValue !== 'function') return 'no-add-value';
    return 'ok';
  }, selector);
  if (supported !== 'ok') {
    throw new Error(
      `[zb-multi-autocomplete] not supported on this page: ${supported}. ` +
        'Ensure @zerobias-org/ngx-library >= 0.2.32 and dev build.',
    );
  }
}
