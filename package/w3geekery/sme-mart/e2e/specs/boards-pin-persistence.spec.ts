import { test, expect } from '../fixtures/auth.fixture';
import { EngagementListPage } from '../page-objects/engagement-list.page';
import { EngagementDetailPage } from '../page-objects/engagement-detail.page';

/**
 * @boards @pin — Board pin persistence (Phase 32-05).
 *
 * Verifies the localStorage-backed PinStorage flow end-to-end: navigate to an
 * engagement's Boards tab, pin a board, confirm it persists to localStorage and
 * survives a reload. Empty-state tolerant — if the engagement has no boards the
 * test passes without asserting pin behavior (mirrors the repo's smoke-test style).
 *
 * Requires a live dev server + authenticated session (auth.fixture). Not runnable
 * in CI-less/offline contexts.
 */
test.describe('@boards @pin — Board pin persistence', () => {
  async function openFirstEngagementBoards(page: import('@playwright/test').Page) {
    const list = new EngagementListPage(page);
    await list.goto();
    await list.waitForLoad();
    if ((await list.getCardCount()) === 0) {
      return null;
    }
    await list.clickFirstCard();

    const detail = new EngagementDetailPage(page);
    await detail.waitForLoad();
    await detail.clickTab('Boards');
    await detail.expectTabActive('Boards');
    await page.waitForLoadState('networkidle');
    return detail;
  }

  test('pins a board and persists the pin across reload', async ({ page }) => {
    const detail = await openFirstEngagementBoards(page);
    if (!detail) {
      test.skip(true, 'No engagements available to test board pinning');
      return;
    }

    const cards = page.locator('[data-testid="board-card"]');
    if ((await cards.count()) === 0) {
      test.skip(true, 'Engagement has no boards to pin');
      return;
    }

    const firstCard = cards.first();
    const boardId = await firstCard.getAttribute('data-board-id');
    expect(boardId).toBeTruthy();

    const pinButton = firstCard.locator('[data-testid="pin-button"]');
    await expect(pinButton).toHaveClass(/unpinned/);
    await pinButton.click();
    await expect(pinButton).toHaveClass(/pinned/);

    // Pin persisted to localStorage under the SME Mart key.
    const stored = await page.evaluate(() => localStorage.getItem('sme-mart.pins'));
    expect(JSON.parse(stored ?? '{}')[boardId as string]).toBe(true);

    // Survives a reload.
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reopened = await openFirstEngagementBoards(page);
    expect(reopened).not.toBeNull();
    const reloadedPin = page
      .locator(`[data-testid="board-card"][data-board-id="${boardId}"]`)
      .locator('[data-testid="pin-button"]');
    await expect(reloadedPin).toHaveClass(/pinned/);
  });

  test('unpinning clears the persisted pin', async ({ page }) => {
    const detail = await openFirstEngagementBoards(page);
    if (!detail) {
      test.skip(true, 'No engagements available to test board pinning');
      return;
    }
    const cards = page.locator('[data-testid="board-card"]');
    if ((await cards.count()) === 0) {
      test.skip(true, 'Engagement has no boards to pin');
      return;
    }

    const card = cards.first();
    const boardId = await card.getAttribute('data-board-id');
    const pinButton = card.locator('[data-testid="pin-button"]');

    // Ensure pinned, then unpin.
    if (!(await pinButton.evaluate((el) => el.classList.contains('pinned')))) {
      await pinButton.click();
    }
    await pinButton.click();
    await expect(pinButton).toHaveClass(/unpinned/);

    const stored = await page.evaluate(() => localStorage.getItem('sme-mart.pins'));
    expect((boardId as string) in JSON.parse(stored ?? '{}')).toBe(false);
  });
});
