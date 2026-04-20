import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Project detail page (/project/:id).
 *
 * Structure (project-detail.component.html):
 *   <h2>{{ projectName }}</h2>
 *   <nav mat-tab-nav-bar>
 *     <a mat-tab-link>Overview</a>
 *     ... + "More" dropdown with Invited Vendors, etc.
 *   </nav>
 */
export class ProjectDetailPage extends BasePage {
  readonly heading: Locator;
  readonly tabNav: Locator;
  readonly tabLinks: Locator;
  readonly backButton: Locator;
  readonly loadingMessage: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('.project-header__title h2');
    this.tabNav = page.locator('nav[mat-tab-nav-bar]');
    this.tabLinks = this.tabNav.locator('a[mat-tab-link]');
    this.backButton = page.locator('.back-btn');
    this.loadingMessage = page.locator('.loading-message');
    this.notFoundMessage = page.locator('text=Project not found');
  }

  async goto(projectId: string): Promise<void> {
    await super.goto(`/project/${projectId}`);
  }

  async waitForLoad(): Promise<void> {
    // Either heading renders, or "Project not found" shows
    await Promise.race([
      this.heading.waitFor({ state: 'visible', timeout: 15_000 }),
      this.notFoundMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
  }

  async isNotFound(): Promise<boolean> {
    return (await this.notFoundMessage.count()) > 0;
  }

  async getTabLabels(): Promise<string[]> {
    const count = await this.tabLinks.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await this.tabLinks.nth(i).textContent()) ?? '').trim();
      out.push(text);
    }
    return out;
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.tabNav).toBeVisible();
  }
}
