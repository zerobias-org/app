import { test, expect } from '../fixtures/auth.fixture';
import { EngagementListPage } from '../page-objects/engagement-list.page';
import { EngagementDetailPage } from '../page-objects/engagement-detail.page';

test.describe('@project @smoke — Projects', () => {
  // Projects live under engagements. Path:
  //   /my/engagements → click card → EngagementDetail → Projects tab → ProjectList
  // There is no standalone projects list page.

  test('should reach Projects tab from engagement detail', async ({ page }) => {
    const list = new EngagementListPage(page);
    await list.goto();
    await list.waitForLoad();

    const count = await list.getCardCount();
    test.skip(count === 0, 'No engagements in UAT — cannot test project navigation');

    await list.clickFirstCard();
    await page.waitForURL(/\/(my\/engagements|rfps)\/[^/]+/, { timeout: 15_000 });

    // Engagement-detail is only reached when the card routes to /my/engagements/:id.
    // RFP cards route to /rfps/:id which has no tabs — skip in that case.
    if (!/\/my\/engagements\//.test(page.url())) {
      test.skip(true, 'First card routed to /rfps/:id (no Projects tab) — skip');
      return;
    }

    const detail = new EngagementDetailPage(page);
    await detail.waitForLoad();

    const labels = await detail.getTabLabels();
    const hasProjectsTab = labels.some((l) => l.toLowerCase().includes('projects'));
    test.skip(!hasProjectsTab, 'Projects tab not rendered for this engagement');

    await detail.clickTab('Projects');

    // ProjectList template has <h3>Projects</h3> as its header
    await expect(page.getByRole('heading', { name: /^Projects$/, level: 3 })).toBeVisible({ timeout: 15_000 });
  });
});
