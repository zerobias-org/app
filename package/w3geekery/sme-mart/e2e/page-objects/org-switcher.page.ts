import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for user profile dropdown org switcher.
 *
 * Interactions:
 * - Open user menu from avatar trigger
 * - Open org switcher submenu
 * - Select org and trigger switch
 * - Verify switching dialog appears
 * - Verify dana-org-id header changes post-reload
 */
export class OrgSwitcherPage extends BasePage {
  readonly userMenuTrigger: Locator;
  readonly orgSwitcherTrigger: Locator;
  readonly orgSwitcherSubmenu: Locator;
  readonly orgList: Locator;
  readonly orgItems: Locator;
  readonly switchingDialog: Locator;
  readonly switchingDialogSpinner: Locator;
  readonly switchingDialogTitle: Locator;

  constructor(page: Page) {
    super(page);
    // User profile dropdown trigger (avatar + org name)
    this.userMenuTrigger = page.locator('[data-testid="user-menu-trigger"]');

    // Org switcher button inside user menu
    this.orgSwitcherTrigger = page.locator('[data-testid="org-switcher-trigger"]');

    // Org switcher submenu container
    this.orgSwitcherSubmenu = page.locator('.org-switcher-submenu');

    // Org list container
    this.orgList = page.locator('.org-list');

    // Individual org items
    this.orgItems = page.locator('[data-testid^="org-item-"]');

    // Switching dialog (app-switching-org-dialog)
    this.switchingDialog = page.locator('app-switching-org-dialog');
    this.switchingDialogSpinner = this.switchingDialog.locator('.mat-spinner, mat-spinner');
    this.switchingDialogTitle = this.switchingDialog.locator('h2, .dialog-title');
  }

  /**
   * Navigate to home and wait for app to load.
   */
  async goto(path: string = '/'): Promise<void> {
    await super.goto(path);
  }

  /**
   * Click user menu trigger to open the dropdown.
   */
  async openUserMenu(): Promise<void> {
    await this.userMenuTrigger.click();
    await this.waitForAngular();
    // Wait for mat-menu to render
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify org switcher button is visible in the menu.
   */
  async expectOrgSwitcherButtonVisible(): Promise<void> {
    await expect(this.orgSwitcherTrigger).toBeVisible();
  }

  /**
   * Click org switcher button to open the submenu.
   */
  async openOrgSwitcherSubmenu(): Promise<void> {
    await this.orgSwitcherTrigger.click();
    await this.waitForAngular();
    // Wait for submenu animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the count of switchable orgs displayed.
   */
  async getOrgCount(): Promise<number> {
    return this.orgItems.count();
  }

  /**
   * Get the current org ID from the org header text/context.
   */
  async getCurrentOrgId(): Promise<string> {
    // The currentOrgId signal is set in the component but not directly visible in the DOM.
    // Extract from the data-testid of the org item marked as current (has .current-org class).
    const currentItem = this.page.locator('[data-testid^="org-item-"].current-org').first();
    const testId = await currentItem.getAttribute('data-testid');
    if (!testId) {
      throw new Error('Could not find current org item');
    }
    // Extract org ID from "org-item-{id}"
    const match = testId.match(/org-item-(.+)/);
    if (!match || !match[1]) {
      throw new Error(`Could not parse org ID from data-testid: ${testId}`);
    }
    return match[1];
  }

  /**
   * Get the current org name from the header or component state.
   */
  async getCurrentOrgName(): Promise<string> {
    // Org name is displayed in the user menu header (avatar label subText)
    // For E2E purposes, we can extract it from the visible org name in the header
    // or look for the org item with .current-org class and read its text
    const currentItem = this.page.locator('[data-testid^="org-item-"].current-org').first();
    const text = await currentItem.textContent();
    if (!text) {
      throw new Error('Could not find current org name');
    }
    return text.trim();
  }

  /**
   * Verify the org list is empty (no switchable orgs).
   */
  async expectEmptyOrgList(): Promise<void> {
    const count = await this.orgItems.count();
    expect(count).toBe(0);
  }

  /**
   * Get the org item locator for the current org.
   */
  async getCurrentOrgItem(): Promise<Locator> {
    return this.page.locator('[data-testid^="org-item-"].current-org').first();
  }

  /**
   * Check if an org item's text is bold (font-weight-bold class).
   */
  async isOrgBold(orgItem: Locator): Promise<boolean> {
    const span = orgItem.locator('span.font-weight-bold');
    const count = await span.count();
    return count > 0;
  }

  /**
   * Check if an org item has the current marker (circle icon).
   */
  async hasCurrentMarker(orgItem: Locator): Promise<boolean> {
    const marker = orgItem.locator('mat-icon.current-marker');
    const count = await marker.count();
    return count > 0;
  }

  /**
   * Get the org ID at a specific index (0-based).
   */
  async getOrgIdAt(index: number): Promise<string> {
    const item = this.orgItems.nth(index);
    const testId = await item.getAttribute('data-testid');
    if (!testId) {
      throw new Error(`Could not find org item at index ${index}`);
    }
    const match = testId.match(/org-item-(.+)/);
    if (!match || !match[1]) {
      throw new Error(`Could not parse org ID from data-testid: ${testId}`);
    }
    return match[1];
  }

  /**
   * Get the org name at a specific index (0-based).
   */
  async getOrgNameAt(index: number): Promise<string> {
    const item = this.orgItems.nth(index);
    const text = await item.textContent();
    if (!text) {
      throw new Error(`Could not find org name at index ${index}`);
    }
    return text.trim();
  }

  /**
   * Click the org at a specific index to select it.
   */
  async selectOrgAt(index: number): Promise<void> {
    const item = this.orgItems.nth(index);
    await item.click();
    await this.waitForAngular();
  }

  /**
   * Click the current org (should no-op in the service, no dialog).
   */
  async selectCurrentOrg(): Promise<void> {
    const currentItem = this.page.locator('[data-testid^="org-item-"].current-org').first();
    await currentItem.click();
    await this.waitForAngular();
  }

  /**
   * Check if switching dialog is visible.
   */
  async isSwitchingDialogVisible(): Promise<boolean> {
    try {
      await expect(this.switchingDialog).toBeVisible({ timeout: 1_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for switching dialog to appear.
   */
  async expectSwitchingDialogVisible(options?: { timeout?: number }): Promise<void> {
    await expect(this.switchingDialog).toBeVisible(options);
  }

  /**
   * Wait for switching dialog to disappear (page reload).
   */
  async expectSwitchingDialogHidden(options?: { timeout?: number }): Promise<void> {
    await expect(this.switchingDialog).not.toBeVisible(options);
  }

  /**
   * Assert that the org switcher trigger appears above My Organizations in DOM source order.
   * This verifies the placement fix for errata 013.
   */
  async assertSubmenuAboveMyOrganizations(): Promise<void> {
    const triggerElement = await this.page.locator('[data-testid="org-switcher-trigger"]').elementHandle();
    const myOrgsElement = await this.page.locator('a[routerLink="/orgs"]').elementHandle();

    if (!triggerElement || !myOrgsElement) {
      throw new Error('Could not find org switcher trigger or My Organizations element');
    }

    // Get the position of both elements in the DOM
    const triggerInfo = await triggerElement.boundingBox();
    const myOrgsInfo = await myOrgsElement.boundingBox();

    // The trigger should appear before My Organizations in the menu
    // We verify this by checking the visual Y position (trigger Y < myOrgs Y)
    if (!triggerInfo || !myOrgsInfo) {
      throw new Error('Could not get bounding box for elements');
    }

    expect(triggerInfo.y).toBeLessThan(myOrgsInfo.y);
  }

  /**
   * Verify that the submenu contains at least N visible orgs (regression test for empty-array bug).
   */
  async expectSubmenuPopulated(minOrgCount: number = 1): Promise<void> {
    const count = await this.getOrgCount();
    expect(count).toBeGreaterThanOrEqual(minOrgCount);
  }
}
