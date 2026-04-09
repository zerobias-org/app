import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Engagement detail page (/my/engagements/:id or /rfps/:id).
 *
 * Structure (engagement-detail.component.html):
 *   <nav mat-tab-nav-bar>
 *     <a mat-tab-link>Overview</a>
 *     ... etc
 *   </nav>
 *   <mat-tab-nav-panel>
 *     <router-outlet />
 *   </mat-tab-nav-panel>
 *
 * Tabs defined in engagement-detail.component.ts (tabs array) and
 * engagement.routes.ts. Expected tab labels match routes.
 */

export const EXPECTED_ENGAGEMENT_TABS = [
  'Overview',
  'Projects',
  'Documents',
  'Details',
  'Tasks',
  'Vetting',
  'Timeline',
  'Notes',
];

export class EngagementDetailPage extends BasePage {
  readonly tabNav: Locator;
  readonly tabLinks: Locator;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly loadingMessage: Locator;
  readonly tabPanelOutlet: Locator;

  constructor(page: Page) {
    super(page);
    this.tabNav = page.locator('nav[mat-tab-nav-bar]');
    this.tabLinks = this.tabNav.locator('a[mat-tab-link]');
    this.heading = page.locator('.tc-header h2');
    this.backButton = page.getByRole('button', { name: /Back to Engagements/i });
    this.loadingMessage = page.locator('.loading-message');
    this.tabPanelOutlet = page.locator('mat-tab-nav-panel');
  }

  async waitForLoad(): Promise<void> {
    // Wait for loading message to disappear and heading to appear
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.waitForAngular();
  }

  async getTabLabels(): Promise<string[]> {
    const count = await this.tabLinks.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await this.tabLinks.nth(i).textContent()) ?? '';
      labels.push(text.trim());
    }
    return labels;
  }

  /**
   * Find a tab link by exact label (trimmed).
   *
   * Can't use `filter({ hasText })` with an anchored regex because the Angular
   * template renders `{{ tab.label }}` with surrounding whitespace. We locate
   * by iterating and matching trimmed textContent.
   */
  private async getTabLinkByLabel(label: string): Promise<Locator> {
    const count = await this.tabLinks.count();
    for (let i = 0; i < count; i++) {
      const link = this.tabLinks.nth(i);
      const text = ((await link.textContent()) ?? '').trim();
      if (text.toLowerCase() === label.toLowerCase()) {
        return link;
      }
    }
    throw new Error(`Tab with label "${label}" not found. Available tabs: ${await this.getTabLabels().then((l) => l.join(', '))}`);
  }

  async clickTab(label: string): Promise<void> {
    const link = await this.getTabLinkByLabel(label);
    await link.click();
    await this.waitForAngular();
  }

  async expectTabActive(label: string): Promise<void> {
    const link = await this.getTabLinkByLabel(label);
    await expect(link).toHaveClass(/mdc-tab--active|mat-mdc-tab-link-active|mat-mdc-tab-link--active/);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.tabNav).toBeVisible();
  }
}
