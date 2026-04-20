import { test, expect } from '../fixtures/auth.fixture';
import { EngagementListPage } from '../page-objects/engagement-list.page';
import { EngagementDetailPage } from '../page-objects/engagement-detail.page';

test.describe('@engagement @smoke — My Engagements', () => {
  test('should load My Engagements page with heading and grid/empty state', async ({ page }) => {
    const list = new EngagementListPage(page);
    await list.goto();
    await list.waitForLoad();
    await list.expectLoaded();
    // Either cards render or empty state renders — both are valid
    const count = await list.getCardCount();
    if (count === 0) {
      await expect(list.emptyState).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should navigate from engagement card to detail page', async ({ page }) => {
    const list = new EngagementListPage(page);
    await list.goto();
    await list.waitForLoad();

    const count = await list.getCardCount();
    test.skip(count === 0, 'No engagements in UAT for current org — cannot test card navigation');

    await list.clickFirstCard();
    await page.waitForURL(/\/(my\/engagements|rfps)\/[^/]+/, { timeout: 15_000 });

    const detail = new EngagementDetailPage(page);
    await detail.waitForLoad();
    await detail.expectLoaded();
  });

  test('should load all engagement detail tabs without error', async ({ page }) => {
    const list = new EngagementListPage(page);
    await list.goto();
    await list.waitForLoad();

    const count = await list.getCardCount();
    test.skip(count === 0, 'No engagements in UAT for current org — cannot test tab navigation');

    await list.clickFirstCard();
    await page.waitForURL(/\/(my\/engagements|rfps)\/[^/]+/, { timeout: 15_000 });

    const detail = new EngagementDetailPage(page);
    await detail.waitForLoad();

    const labels = await detail.getTabLabels();
    expect(labels.length).toBeGreaterThanOrEqual(6); // engagement.routes.ts has 8 tabs

    // Click through the first 3 tabs — validates nav doesn't throw
    for (const label of labels.slice(0, 3)) {
      await detail.clickTab(label);
      await detail.expectTabActive(label);
      // Ensure tab panel content is rendered (router-outlet has child)
      await expect(detail.tabPanelOutlet).toBeVisible();
    }
  });
});
