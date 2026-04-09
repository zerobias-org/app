import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * My Profile page (/my-profile) — vendor self-service profile.
 *
 * Structure (my-profile.component.ts):
 *   <h2>My Profile</h2>
 *   <nav mat-tab-nav-bar>
 *     <a>Overview</a>
 *     <a>Expertise</a>
 *     <a>Services</a>
 *     <a>Reviews</a>
 *     <a>Moderate</a>
 *     <a>Settings</a>
 *   </nav>
 */
export const VENDOR_PROFILE_TABS = [
  'Overview',
  'Expertise',
  'Services',
  'Reviews',
  'Moderate',
  'Settings',
];

export class VendorProfilePage extends BasePage {
  readonly heading: Locator;
  readonly tabNav: Locator;
  readonly tabLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^My Profile$/i, level: 2 });
    this.tabNav = page.locator('nav[mat-tab-nav-bar]');
    this.tabLinks = this.tabNav.locator('a[mat-tab-link]');
  }

  async goto(): Promise<void> {
    await super.goto('/my-profile');
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
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
    await expect(this.tabLinks.first()).toBeVisible();
  }
}
