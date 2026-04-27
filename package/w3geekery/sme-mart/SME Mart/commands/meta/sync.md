---
name: meta:sync
description: Sync meta-harness upstream and analyze adapter for needed updates
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
---

Sync the meta-harness director from upstream `zerobias-org/meta-harness` and analyze
the project-level SME Mart adapter for any updates that need to be applied.

## Steps

1. **Fetch upstream original:**
   ```
   gh api repos/zerobias-org/meta-harness/contents/commands/meta/director.md --jq '.content' | base64 -d
   ```
   Save to a temp variable — do NOT overwrite the global pristine yet.

2. **Diff against current global pristine:**
   Compare fetched content against `~/.claude/commands/meta/director.md`.
   If identical: report "upstream unchanged" and stop.

3. **If upstream changed, show the user:**
   - Summary of what changed (new sections, modified steps, added checks)
   - Whether any changes touch areas near `<!-- SME-MART -->` markers in the adapter

4. **Analyze the project adapter:**
   Read `.claude/commands/meta/director.md` (project-level).
   For each upstream change, classify:
   - **Auto-merge:** Change is in a section we didn't modify (no `SME-MART` markers nearby). Safe to apply.
   - **Review needed:** Change is in or adjacent to a `SME-MART`-marked section. Show both versions.
   - **Conflict:** Upstream removed/rewrote something our adapter depends on. Needs manual decision.

5. **Present a plan:** List each change with its classification and proposed action. Wait for approval.

6. **On approval:**
   - Update `~/.claude/commands/meta/director.md` (global pristine) with the fetched version
   - Apply approved changes to `.claude/commands/meta/director.md` (project adapter)
   - Preserve all `<!-- SME-MART -->` marked sections unless explicitly told to change them

7. **Also check for new command files** in upstream `commands/meta/` that we don't have yet.
   Offer to install them globally.

## Output

Report format:
```
meta:sync — zerobias-org/meta-harness

Upstream: [unchanged | N changes detected]
Global pristine: [up to date | updated]
Adapter status: [no changes needed | N auto-merged | N need review]

Changes:
  [auto] Section X: added new check for Y
  [review] Design mode: upstream rewrote step 2, our SME-MART block is adjacent
  ...
```
