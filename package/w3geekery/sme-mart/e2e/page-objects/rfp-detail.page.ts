import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * RFP detail page (/rfps/:id).
 *
 * Structure (rfp-detail.component.html):
 *   Loading: <p class="loading-message">Loading RFP...</p>
 *   Not found: <p>RFP not found.</p>
 *   Loaded: back button, bid cards, invitation teaser (if applicable)
 *
 * Distinct from EngagementDetail — no tab nav here.
 */
export class RfpDetailPage extends BasePage {
  readonly container: Locator;
  readonly backButton: Locator;
  readonly loadingMessage: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.locator('.rfp-detail-page');
    this.backButton = page.getByRole('button', { name: /Back to RFPs/i });
    this.loadingMessage = page.locator('.loading-message');
    this.notFoundMessage = page.locator('text=RFP not found');
  }

  async waitForLoad(): Promise<void> {
    // Either back button (loaded) or not-found message appears
    await Promise.race([
      this.backButton.waitFor({ state: 'visible', timeout: 15_000 }),
      this.notFoundMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
  }

  async isNotFound(): Promise<boolean> {
    return (await this.notFoundMessage.count()) > 0;
  }

  async expectMounted(): Promise<void> {
    // Component mounted if container is present — tolerates loading/loaded/not-found
    await expect(this.container).toBeVisible();
  }
}
