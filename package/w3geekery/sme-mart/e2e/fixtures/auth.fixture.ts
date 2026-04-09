import { test as base, expect } from '@playwright/test';

/**
 * Auth fixture for SME Mart E2E tests.
 *
 * SME Mart local dev auth is proxy-based: the Angular dev server proxy
 * (proxy-uat.conf.js) injects an `Authorization: APIKey ...` header on
 * /api/* requests using ZEROBIAS_UAT_API_KEY from .env.local.
 *
 * The browser also needs the `dana-org-id` cookie so the in-browser SDK
 * resolves org context — the proxy sets it server-side, but Playwright's
 * browser context starts with no cookies. This fixture injects it from
 * the same env var the proxy uses.
 *
 * Adapted from ~/Projects/zb/ui/e2e/fixtures/auth.fixture.ts
 */
function getOrgId(): string | undefined {
  return process.env.ZEROBIAS_UAT_ORG_ID || process.env.ZB_ORG_ID;
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const orgId = getOrgId();
    if (!orgId) {
      throw new Error(
        '[auth.fixture] No org ID found. Set ZEROBIAS_UAT_ORG_ID in e2e/.env ' +
        '(copy from e2e/.env.example and fill in the value from .env.local).',
      );
    }
    await page.context().addCookies([
      {
        name: 'dana-org-id',
        value: orgId,
        domain: 'localhost',
        path: '/',
      },
    ]);
    await use(page);
  },
});

export { expect };
