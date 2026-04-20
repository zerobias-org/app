import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Three-tier org navigation:
 *   /orgs          — list of orgs the user belongs to (org-list.component)
 *   /orgs/:orgId   — org detail (org-detail.component)
 *   /org           — current org (OrgPage with tabs: Documents, Engagements,
 *                    Projects, Members, Settings, Corporate Profile)
 */

export const CURRENT_ORG_TABS = [
  'Documents',
  'Engagements',
  'Projects',
  'Members',
  'Settings',
  'Corporate Profile',
];

export class OrgListPage extends BasePage {
  readonly heading: Locator;
  readonly orgCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^My Organizations$/i, level: 1 });
    this.orgCards = page.locator('.org-cards-grid .org-card');
    this.emptyState = page.locator('zb-empty-state-container');
  }

  async goto(): Promise<void> {
    await super.goto('/orgs');
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getOrgCount(): Promise<number> {
    return this.orgCards.count();
  }

  async clickFirstOrg(): Promise<void> {
    await this.orgCards.first().click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}

export class CurrentOrgPage extends BasePage {
  readonly orgHeader: Locator;
  readonly tabNav: Locator;
  readonly tabLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.orgHeader = page.locator('.org-header h1');
    this.tabNav = page.locator('nav[mat-tab-nav-bar]');
    this.tabLinks = this.tabNav.locator('a[mat-tab-link]');
  }

  async goto(): Promise<void> {
    await super.goto('/org');
  }

  async waitForLoad(): Promise<void> {
    await this.orgHeader.waitFor({ state: 'visible', timeout: 15_000 });
    await this.tabLinks.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getTabLabels(): Promise<string[]> {
    const count = await this.tabLinks.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await this.tabLinks.nth(i).textContent()) ?? '').trim();
      // Strip trailing/leading icon text if any
      out.push(text);
    }
    return out;
  }

  async expectLoaded(): Promise<void> {
    await expect(this.orgHeader).toBeVisible();
    await expect(this.tabNav).toBeVisible();
  }
}
