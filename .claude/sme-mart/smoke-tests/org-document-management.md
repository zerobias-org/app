# Smoke Test: Org Document Management

Verifies the org document CRUD pipeline via Chrome DevTools MCP against a running dev server.

## Prerequisites

- `ng serve` running at `http://localhost:4200`
- Chrome open with the app loaded
- Chrome DevTools MCP server running

## Steps

### Step 1: Navigate to Org Documents page

1. `mcp__chrome-devtools__navigate_page` → `http://localhost:4200/org/documents`
2. `mcp__chrome-devtools__wait_for` → selector `[data-qa="org-doc-list"]` or fallback 3s
3. `mcp__chrome-devtools__take_screenshot` → save as `smoke-test-org-doc-step1.png`

**PASS if:** Page loads without errors; document list or empty state is visible.

### Step 2: Upload a test document

1. `mcp__chrome-devtools__take_snapshot` → find the upload trigger button
2. Click the upload/add button
3. `mcp__chrome-devtools__wait_for` → upload form visible (2s)
4. `mcp__chrome-devtools__upload_file` → use any small test file (e.g., a `.txt` or `.pdf` under 1MB)
5. Set document type to "Other" if a selector is available
6. Click "Upload"
7. `mcp__chrome-devtools__wait_for` → upload progress completes or list refreshes (5s)
8. `mcp__chrome-devtools__take_screenshot` → save as `smoke-test-org-doc-step2.png`

**PASS if:** Document appears in the list after upload. No console errors.

### Step 3: Verify document appears in Neon

Run via Neon MCP:

```
mcp__Neon__run_sql
  projectId: "square-meadow-76427985"
  databaseName: "neondb"
  sql: "SELECT id, filename, display_name, document_type, archived FROM org_documents ORDER BY created_at DESC LIMIT 5"
```

**PASS if:** The uploaded file appears in the result set with `archived = false`.

### Step 4: Share document with an engagement

1. Find the document row in the list
2. Click the share/more menu on the document
3. Select "Share" option
4. `mcp__chrome-devtools__wait_for` → share dialog opens (2s)
5. `mcp__chrome-devtools__take_snapshot` → verify engagement list loads
6. Select an engagement, click "Share"
7. `mcp__chrome-devtools__take_screenshot` → save as `smoke-test-org-doc-step4.png`

**PASS if:** Share dialog shows engagements; share completes with snackbar confirmation.

### Step 5: Verify share in Neon

```
mcp__Neon__run_sql
  projectId: "square-meadow-76427985"
  databaseName: "neondb"
  sql: "SELECT ods.id, ods.shared_with_type, ods.shared_with_id, ods.visibility FROM org_document_shares ods ORDER BY ods.granted_at DESC LIMIT 5"
```

**PASS if:** A share row exists linking the document to the selected engagement.

### Step 6: Archive the test document

1. Click the document's more menu → "Archive"
2. `mcp__chrome-devtools__wait_for` → snackbar confirmation (2s)
3. `mcp__chrome-devtools__take_screenshot` → save as `smoke-test-org-doc-step6.png`

**PASS if:** Document disappears from the active list. Snackbar shows "Document archived".

### Step 7: Verify archive in Neon

```
mcp__Neon__run_sql
  projectId: "square-meadow-76427985"
  databaseName: "neondb"
  sql: "SELECT id, filename, archived FROM org_documents WHERE archived = true ORDER BY updated_at DESC LIMIT 5"
```

**PASS if:** The test document shows `archived = true`.

## Cleanup

Delete the test document and its shares:

```
mcp__Neon__run_sql_transaction
  projectId: "square-meadow-76427985"
  databaseName: "neondb"
  sql:
    - "DELETE FROM org_document_shares WHERE document_id = '<doc_id>'"
    - "DELETE FROM org_documents WHERE id = '<doc_id>'"
```

## Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | Navigate to Org Documents | |
| 2 | Upload test document | |
| 3 | Verify in Neon | |
| 4 | Share with engagement | |
| 5 | Verify share in Neon | |
| 6 | Archive document | |
| 7 | Verify archive in Neon | |
