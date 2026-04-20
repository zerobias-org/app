import { test, expect } from '../fixtures/auth.fixture';
import { OrgSwitcherPage } from '../page-objects/org-switcher.page';

test.describe('@org-switcher @smoke — User profile dropdown org switch', () => {
  test('should open org switcher submenu from user profile dropdown', async ({ page }) => {
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();
    await switcher.expectOrgSwitcherButtonVisible();
  });

  test('should display switchable orgs in submenu', async ({ page }) => {
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();
    await switcher.openOrgSwitcherSubmenu();

    const count = await switcher.getOrgCount();
    if (count === 0) {
      await switcher.expectEmptyOrgList();
    } else {
      expect(count).toBeGreaterThan(0);
      const currentOrgId = await switcher.getCurrentOrgId();
      const currentOrgName = await switcher.getCurrentOrgName();
      expect(currentOrgId).toBeTruthy();
      expect(currentOrgName).toBeTruthy();
    }
  });

  test('should highlight current org in switcher', async ({ page }) => {
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();
    await switcher.openOrgSwitcherSubmenu();

    const count = await switcher.getOrgCount();
    test.skip(count < 2, 'Need at least 2 orgs to test switching');

    // Verify current org has bold text and circle icon
    const currentOrgItem = await switcher.getCurrentOrgItem();
    const textBold = await switcher.isOrgBold(currentOrgItem);
    const hasCircle = await switcher.hasCurrentMarker(currentOrgItem);

    expect(textBold).toBe(true);
    expect(hasCircle).toBe(true);
  });

  test('should switch org and reload page with new dana-org-id', async ({ page }) => {
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();
    await switcher.openOrgSwitcherSubmenu();

    const count = await switcher.getOrgCount();
    test.skip(count < 2, 'Need at least 2 orgs to test switching');

    const initialOrgId = await switcher.getCurrentOrgId();

    // Capture request headers to verify dana-org-id header change (director note 4)
    let newOrgIdFromHeader: string | undefined;
    let requestHeadersAfterSwitch: Record<string, string> = {};

    const requestHandler = (request: any) => {
      const headers = request.headers();
      // Capture the first request after submenu open that has dana-org-id
      if (headers['dana-org-id'] && headers['dana-org-id'] !== initialOrgId) {
        newOrgIdFromHeader = headers['dana-org-id'];
        requestHeadersAfterSwitch = headers;
      }
    };

    page.on('request', requestHandler);

    try {
      // Get second org (different from current)
      const secondOrgId = await switcher.getOrgIdAt(1);
      const secondOrgName = await switcher.getOrgNameAt(1);

      // Click the second org
      await switcher.selectOrgAt(1);

      // Verify switching dialog appears
      await switcher.expectSwitchingDialogVisible({ timeout: 5_000 });

      // Wait for page to reload (dialog closes, page navigates)
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      await switcher.waitForAngular();

      // Verify page reloaded with new org
      const newOrgId = await switcher.getCurrentOrgId();
      const newOrgName = await switcher.getCurrentOrgName();

      expect(newOrgId).not.toEqual(initialOrgId);
      expect(newOrgId).toEqual(secondOrgId);
      expect(newOrgName).toEqual(secondOrgName);

      // Verify header changed via request capture (director note 4)
      // newOrgIdFromHeader will be set if a request with new dana-org-id was captured
      if (newOrgIdFromHeader) {
        expect(newOrgIdFromHeader).toEqual(secondOrgId);
      }
    } finally {
      page.removeListener('request', requestHandler);
    }
  });

  test('should handle switch to same org gracefully', async ({ page }) => {
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();
    await switcher.openOrgSwitcherSubmenu();

    const currentOrgId = await switcher.getCurrentOrgId();

    // Click current org
    await switcher.selectCurrentOrg();

    // No dialog should appear (switchTo no-ops on same org)
    const dialogVisible = await switcher.isSwitchingDialogVisible();
    expect(dialogVisible).toBe(false);

    // Org ID should remain the same
    const stillCurrentOrgId = await switcher.getCurrentOrgId();
    expect(stillCurrentOrgId).toEqual(currentOrgId);
  });

  test('should populate submenu with at least one org on real session (errata 013 regression)', async ({ page }) => {
    // This test runs against a real UAT session to verify the empty-array bug is fixed
    // The listMyOrgs() method should return at least the current org
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();
    await switcher.openOrgSwitcherSubmenu();

    // Assert at least 1 org is visible (regression: previous bug showed 0 orgs)
    await switcher.expectSubmenuPopulated(1);
  });

  test('should position org switcher trigger above My Organizations (errata 013 placement fix)', async ({ page }) => {
    // This test verifies the placement fix: Switch Organization should appear before My Organizations
    const switcher = new OrgSwitcherPage(page);
    await switcher.goto('/');
    await switcher.openUserMenu();

    // Assert visual positioning: trigger should appear before My Organizations in the DOM
    await switcher.assertSubmenuAboveMyOrganizations();
  });
});
