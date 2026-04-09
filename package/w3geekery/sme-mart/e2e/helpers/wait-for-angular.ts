import { Page } from '@playwright/test';

/**
 * Wait for Angular's NgZone to stabilize before interacting with elements.
 *
 * Angular's NgZone manages change detection. Playwright can find elements
 * before Angular's zone has finished processing microtasks, meaning clicks
 * fire but handlers don't execute (change detection hasn't run).
 *
 * Equivalent to Protractor's waitForAngular().
 *
 * Adapted from ~/Projects/zb/ui/e2e/helpers/wait-for-angular.ts
 */
export async function waitForAngular(page: Page, timeout = 10_000): Promise<void> {
  await page.evaluate((timeoutMs) => {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`waitForAngular timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const win = window as unknown as {
        getAllAngularTestabilities?: () => Array<{ whenStable: (cb: () => void) => void }>;
      };

      if (win.getAllAngularTestabilities) {
        const testabilities = win.getAllAngularTestabilities();
        if (testabilities.length > 0) {
          let pending = testabilities.length;
          testabilities.forEach((testability) => {
            testability.whenStable(() => {
              pending--;
              if (pending === 0) {
                clearTimeout(timer);
                resolve();
              }
            });
          });
          return;
        }
      }

      // Fallback: wait for macrotask queue to drain
      clearTimeout(timer);
      setTimeout(resolve, 100);
    });
  }, timeout);
}
