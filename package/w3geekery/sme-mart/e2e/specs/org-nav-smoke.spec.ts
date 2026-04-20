import { test, expect } from '../fixtures/auth.fixture';
import { OrgListPage, CurrentOrgPage, CURRENT_ORG_TABS } from '../page-objects/org-nav.page';

test.describe('@org-nav @smoke — Three-tier org navigation', () => {
  test('should load /orgs with user organizations', async ({ page }) => {
    const orgs = new OrgListPage(page);
    await orgs.goto();
    await orgs.expectLoaded();

    const count = await orgs.getOrgCount();
    if (count === 0) {
      await expect(orgs.emptyState).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should navigate from /orgs to /orgs/:orgId', async ({ page }) => {
    const orgs = new OrgListPage(page);
    await orgs.goto();

    const count = await orgs.getOrgCount();
    test.skip(count === 0, 'No orgs in UAT for current user');

    await orgs.clickFirstOrg();
    await page.waitForURL(/\/orgs\/[^/]+/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/orgs\/[0-9a-f-]+/i);
  });

  test('should load /org with 6 tabs (current org)', async ({ page }) => {
    const currentOrg = new CurrentOrgPage(page);
    await currentOrg.goto();
    await currentOrg.waitForLoad();
    await currentOrg.expectLoaded();

    const labels = await currentOrg.getTabLabels();
    for (const expected of CURRENT_ORG_TABS) {
      expect(labels.some((l) => l.toLowerCase().includes(expected.toLowerCase()))).toBe(true);
    }
  });
});
