import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * My Invitations page (/my/invitations) — Phase 14.
 *
 * Structure (my-invitations.component.html):
 *   <h2>My Invitations</h2>
 *   <div class="filter-chips">
 *     <button mat-chip>All</button>
 *     <button mat-chip>Pending</button>
 *     <button mat-chip>Accepted</button>
 *     <button mat-chip>Requested</button>
 *   </div>
 *   Either invitation-card grid OR empty-state ("No Invitations").
 *
 * See `.claude/smoke-tests/rfp-invitations.md` for the full multi-persona
 * flow. This page object only covers the smoke-level view (page loads,
 * filter chips render, grid or empty state present). Multi-persona flows
 * (accept/decline/request/revoke) require test data seeding + user switching
 * and are out of scope for Phase 3 smoke.
 */
export const INVITATION_FILTER_LABELS = ['All', 'Pending', 'Accepted', 'Requested'];

export class InvitationsPage extends BasePage {
  readonly heading: Locator;
  readonly filterChips: Locator;
  readonly cards: Locator;
  readonly emptyState: Locator;
  readonly emptyHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^My Invitations$/i, level: 2 });
    this.filterChips = page.locator('.filter-chips button[mat-chip]');
    this.cards = page.locator('.invitations-grid mat-card.invitation-card');
    this.emptyState = page.locator('.empty-state');
    this.emptyHeading = page.getByRole('heading', { name: /^No Invitations$/i, level: 3 });
  }

  async goto(): Promise<void> {
    await super.goto('/my/invitations');
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async waitForLoad(): Promise<void> {
    // Either cards render or empty state
    await this.page.waitForFunction(() => {
      const cards = document.querySelectorAll('.invitations-grid mat-card.invitation-card');
      const empty = document.querySelector('.empty-state');
      return cards.length > 0 || !!empty;
    }, { timeout: 15_000 });
  }

  async getFilterLabels(): Promise<string[]> {
    const count = await this.filterChips.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await this.filterChips.nth(i).textContent()) ?? '').trim();
      out.push(text);
    }
    return out;
  }

  async getCardCount(): Promise<number> {
    return this.cards.count();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    // Filter chips always render regardless of data
    await expect(this.filterChips.first()).toBeVisible();
  }
}
