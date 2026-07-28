# SME Mart Smoke Tests

E2E smoke tests using the **Chrome DevTools MCP server** (locally running, always available in Claude Code).

> **Note:** This uses the `chrome-devtools` MCP server configured in `~/.claude.json`, NOT `claude --chrome` (which is the Claude In Chrome browser extension — a different thing entirely).

## Prerequisites

- `ng serve` running at `http://localhost:4200`
- Chrome open with the app loaded at that URL
- Chrome DevTools MCP server running (check `~/.claude.json` → `mcpServers.chrome-devtools`)

## Running a test

```
Read .claude/smoke-tests/rfp-wizard-create.md and execute it step by step.
```

## Tests

| File | Description |
|------|-------------|
| `rfp-wizard-create.md` | Create RFP wizard: fill basics, skip docs, pass through stubs, save draft |
| `org-document-management.md` | Org documents: upload, verify in Neon, share with engagement, archive |

## Conventions

- Screenshots: `/Users/cstacer/Pictures/Screenshots/smoke-test-{name}-step{N}.png`
- Each test reports a PASS/FAIL summary table at the end
- Tests are non-destructive (save as draft, never publish)
- Draft IDs are reported for manual cleanup
