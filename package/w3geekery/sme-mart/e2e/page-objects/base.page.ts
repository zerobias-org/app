import { Page, Locator, expect } from '@playwright/test';
import { waitForAngular } from '../helpers/wait-for-angular';

/**
 * Base page object. Common helpers for Material/CDK-based pages.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a relative path and wait for Angular zone to stabilize. */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
    await waitForAngular(this.page);
  }

  /** Wait for Angular's NgZone to stabilize. */
  async waitForAngular(timeout = 10_000): Promise<void> {
    await waitForAngular(this.page, timeout);
  }

  /**
   * Remove CDK overlay remnants that can permanently cover dialog content
   * after programmatic setValue calls. Also blur any dialog inputs so
   * autocomplete panels close.
   */
  async cleanupCdkOverlays(): Promise<void> {
    await this.page.evaluate(() => {
      document
        .querySelectorAll<HTMLElement>('mat-dialog-container input')
        .forEach((inp) => inp.blur());
      document
        .querySelectorAll('.cdk-overlay-connected-position-bounding-box')
        .forEach((p) => p.remove());
    });
  }

  /** Click a button by its visible role+name (Material buttons). */
  async clickButton(name: string | RegExp): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  /** Assert a locator is visible within the expect timeout. */
  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Click via a direct DOM call — bypasses CDK overlay pointer interception.
   * Use this when a Playwright click is intercepted by a lingering overlay.
   */
  async forceClick(locator: Locator): Promise<void> {
    await locator.evaluate((el: HTMLElement) => el.click());
  }

  /** Get the current URL pathname. */
  async currentPath(): Promise<string> {
    return this.page.evaluate(() => window.location.pathname);
  }
}
