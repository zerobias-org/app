import { test, expect } from '../fixtures/auth.fixture';
import { OrgDocumentsPage } from '../page-objects/org-documents.page';

test.describe('@org-docs @smoke — Org Documents', () => {
  // Informed by .claude/smoke-tests/org-document-management.md step 1.
  // Upload/share/archive flows (steps 2-7) are out of scope for smoke —
  // they write to Neon and would require cleanup. Those remain covered
  // by the Chrome DevTools MCP smoke test doc.

  test('should load /org/documents with toolbar and upload button', async ({ page }) => {
    const docs = new OrgDocumentsPage(page);
    await docs.goto();
    await docs.expectLoaded();

    // Search and type filter visible
    await expect(docs.searchInput).toBeVisible();
    await expect(docs.uploadButton).toBeEnabled();
  });
});
