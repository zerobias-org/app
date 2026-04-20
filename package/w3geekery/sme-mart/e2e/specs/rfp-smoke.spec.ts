import { test, expect } from '../fixtures/auth.fixture';
import { RfpListPage } from '../page-objects/rfp-list.page';
import { RfpWizardPage } from '../page-objects/rfp-wizard.page';
import { RfpDetailPage } from '../page-objects/rfp-detail.page';

test.describe('@rfp @smoke — RFPs', () => {
  test('should load /rfps with Create button and cards or empty state', async ({ page }) => {
    const rfps = new RfpListPage(page);
    await rfps.goto();
    await rfps.waitForLoad();
    await rfps.expectLoaded();

    const count = await rfps.getCardCount();
    if (count === 0) {
      await expect(rfps.emptyState).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should navigate from RFP card to detail page', async ({ page }) => {
    const rfps = new RfpListPage(page);
    await rfps.goto();
    await rfps.waitForLoad();

    const count = await rfps.getCardCount();
    test.skip(count === 0, 'No RFPs in UAT for current org — cannot test card navigation');

    await rfps.clickFirstCard();
    await page.waitForURL(/\/rfps\/[^/]+/, { timeout: 15_000 });

    // RFP detail page — could be loaded OR "RFP not found" (stale card data).
    // Smoke-level: the component mounted and one of the two terminal states is
    // reached. We don't block on data quality here.
    const detail = new RfpDetailPage(page);
    await detail.expectMounted();
    await detail.waitForLoad();
  });

  test('should load RFP wizard at /rfps/new with method chooser', async ({ page }) => {
    // Informed by .claude/smoke-tests/rfp-wizard-create.md — the wizard now
    // shows a method chooser (AI-extract vs step-by-step) before the
    // mat-stepper. Smoke coverage: heading + chooser render.
    const wizard = new RfpWizardPage(page);
    await wizard.goto();
    await wizard.waitForLoad();
    await wizard.expectLoaded();
    await expect(wizard.methodChooserHeading).toBeVisible();
  });
});
