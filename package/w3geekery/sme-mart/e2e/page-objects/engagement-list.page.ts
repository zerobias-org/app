import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * My Engagements page (/my/engagements).
 *
 * Structure (my-engagement-list.component.html):
 *   <h2>My Engagements</h2>
 *   <div class="engagement-grid">
 *     <app-engagement-card />  (mat-card.engagement-card, clickable)
 *   </div>
 *
 * Engagement cards are also used on /rfps — reused via app-engagement-card.
 */
export class EngagementListPage extends BasePage {
  readonly grid: Locator;
  readonly cards: Locator;
  readonly heading: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.grid = page.locator('.engagement-grid');
    this.cards = page.locator('.engagement-grid mat-card.engagement-card');
    this.heading = page.getByRole('heading', { name: 'My Engagements', level: 2 });
    this.emptyState = page.locator('zb-empty-state-container');
  }

  async goto(): Promise<void> {
    await super.goto('/my/engagements');
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Wait until either cards or the empty state is present. */
  async waitForLoad(): Promise<void> {
    await this.page.waitForFunction(() => {
      const grid = document.querySelector('.engagement-grid');
      const empty = document.querySelector('zb-empty-state-container');
      return (grid && grid.querySelectorAll('mat-card.engagement-card').length > 0) || !!empty;
    }, { timeout: 15_000 });
  }

  async getCardCount(): Promise<number> {
    return this.cards.count();
  }

  async getFirstCard(): Promise<Locator> {
    return this.cards.first();
  }

  async clickFirstCard(): Promise<void> {
    await this.cards.first().click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}
