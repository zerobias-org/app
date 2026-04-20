import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Org Documents tab (/org/documents) — document management for the current org.
 *
 * Structure (documents-tab.component.ts):
 *   Toolbar: search input, type filter, view toggle, sort menu, Upload button
 *   Grid or list of documents, or empty state "Drag & drop files here..."
 *
 * See `.claude/smoke-tests/org-document-management.md` for the full
 * upload → share → archive flow with Neon verification. This page object
 * only covers the smoke-level "page loads with toolbar and upload button"
 * check. Upload/share/archive are out of scope for Phase 3 smoke.
 */
export class OrgDocumentsPage extends BasePage {
  readonly searchInput: Locator;
  readonly typeFilter: Locator;
  readonly uploadButton: Locator;
  readonly emptyState: Locator;
  readonly documentsContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[placeholder="Search documents..."]');
    this.typeFilter = page.locator('mat-select[placeholder="All Types"]');
    this.uploadButton = page.getByRole('button', { name: /^Upload$/i });
    this.emptyState = page.locator('.empty-icon').first();
    this.documentsContainer = page.locator('.documents-tab');
  }

  async goto(): Promise<void> {
    await super.goto('/org/documents');
    // Documents tab lives inside OrgPage → wait for the tab's container
    await this.documentsContainer.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.documentsContainer).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }
}
