import { test, expect } from '../fixtures/auth.fixture';
import { InvitationsPage, INVITATION_FILTER_LABELS } from '../page-objects/invitations.page';

test.describe('@invitations @smoke — My Invitations (Phase 14)', () => {
  // Informed by .claude/smoke-tests/rfp-invitations.md steps 1-2.
  // Multi-persona flows (accept/decline/request) are out of scope for smoke.

  test('should load /my/invitations with heading and 4 filter chips', async ({ page }) => {
    const invitations = new InvitationsPage(page);
    await invitations.goto();
    await invitations.waitForLoad();
    await invitations.expectLoaded();

    const labels = await invitations.getFilterLabels();
    expect(labels.length).toBe(INVITATION_FILTER_LABELS.length);
    for (const expected of INVITATION_FILTER_LABELS) {
      expect(labels.some((l) => l.toLowerCase() === expected.toLowerCase())).toBe(true);
    }
  });

  test('should show either invitation cards or empty state', async ({ page }) => {
    const invitations = new InvitationsPage(page);
    await invitations.goto();
    await invitations.waitForLoad();

    const cardCount = await invitations.getCardCount();
    if (cardCount === 0) {
      await expect(invitations.emptyState).toBeVisible();
      await expect(invitations.emptyHeading).toBeVisible();
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }
  });
});
