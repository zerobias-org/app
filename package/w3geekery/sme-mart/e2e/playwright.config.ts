import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';

// Load env vars from e2e/.env (won't override existing shell vars)
loadEnv({ path: resolve(__dirname, '.env'), override: false });

// SME Mart runs standalone on localhost:4200 (ng serve with proxy)
const baseURL = process.env.BASE_URL || 'http://localhost:4200';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker — tests share data, avoid race conditions
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['html', { outputFolder: 'e2e-results', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL,
    channel: 'chrome',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  // No webServer block — dev server runs separately (npm run dev is interactive).
  // Start dev server in Terminal 1, run E2E in Terminal 2.
  projects: [
    {
      name: 'sme-mart',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
