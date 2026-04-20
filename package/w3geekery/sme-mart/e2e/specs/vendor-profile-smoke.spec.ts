import { test, expect } from '../fixtures/auth.fixture';
import { VendorProfilePage, VENDOR_PROFILE_TABS } from '../page-objects/vendor-profile.page';

test.describe('@vendor-profile @smoke — My Profile', () => {
  test('should load /my-profile with all 6 tabs', async ({ page }) => {
    const profile = new VendorProfilePage(page);
    await profile.goto();
    await profile.expectLoaded();

    const labels = await profile.getTabLabels();
    expect(labels.length).toBeGreaterThanOrEqual(VENDOR_PROFILE_TABS.length);

    for (const expected of VENDOR_PROFILE_TABS) {
      expect(labels.some((l) => l.toLowerCase() === expected.toLowerCase())).toBe(true);
    }
  });

  test('should navigate between profile tabs without error', async ({ page }) => {
    const profile = new VendorProfilePage(page);
    await profile.goto();
    await profile.expectLoaded();

    // Click through first 3 tabs (Overview, Expertise, Services) — validates routing
    for (const label of ['Overview', 'Expertise', 'Services']) {
      const link = profile.tabLinks.filter({ hasText: new RegExp(label, 'i') }).first();
      await link.click();
      await profile.waitForAngular();
      // URL should update to reflect the active tab
      await expect(page).toHaveURL(new RegExp(`/my-profile/${label.toLowerCase()}`, 'i'));
    }
  });
});
