import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * RFP list page (/rfps).
 *
 * Structure (rfp-list.component.html):
 *   <app-list-page title="RFPs">
 *     ... header actions: "Create RFP", "Quick Post"
 *     <div class="rfp-grid" listPageResults>
 *       <app-engagement-card />
 *     </div>
 *   </app-list-page>
 */
export class RfpListPage extends BasePage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly grid: Locator;
  readonly cards: Locator;
  readonly emptyState: Locator;
  readonly statusFilter: Locator;

  constructor(page: Page) {
    super(page);
    // app-list-page template renders title as <h2>
    this.heading = page.getByRole('heading', { name: /^RFPs$/i, level: 2 });
    this.createButton = page.getByRole('button', { name: /Create RFP/i });
    this.grid = page.locator('.rfp-grid');
    this.cards = this.grid.locator('mat-card.engagement-card');
    this.emptyState = page.locator('zb-empty-state-container');
    this.statusFilter = page.locator('mat-form-field').filter({ hasText: 'Status' });
  }

  async goto(): Promise<void> {
    await super.goto('/rfps');
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForFunction(() => {
      const grid = document.querySelector('.rfp-grid');
      const empty = document.querySelector('zb-empty-state-container');
      return (grid && grid.querySelectorAll('mat-card.engagement-card').length > 0) || !!empty;
    }, { timeout: 15_000 });
  }

  async getCardCount(): Promise<number> {
    return this.cards.count();
  }

  async clickFirstCard(): Promise<void> {
    await this.cards.first().click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.createButton).toBeVisible();
  }
}
