# Post-Mortems — Index

Failure reports from shipped defects or near-misses. Each entry follows `YYYY-MM-DD-<slug>.md`.

**When to read these:**
- Before starting work in a related area (especially schema changes)
- When you see a similar symptom and want to check if it's already been diagnosed
- When planning new guardrails — learn from what's already been proposed

**When to write one:**
- A bug shipped to a merged PR or published artifact
- A defect survived multiple sessions/PRs without being noticed
- CI or local validation claimed pass but the artifact was broken
- Any failure that took >30 min to diagnose after it surfaced

---

## Entries

| Date | Title | Area | Key lessons |
|------|-------|------|-------------|
| 2026-04-14 | [Schema inherited-props drift](2026-04-14-schema-inherited-props-drift.md) | schema / gsd-execute | Commit-claim drift (message claimed a fix that wasn't staged); CI `approved`-label gate silently skipped dataloader; dataloader "fields match" escape hatch hid the bug when field YAMLs were added alongside; Phase 15 author didn't check sibling classes before redefining inherited properties. |

---

## Standard report template

```
# Post-Mortem: <title>

**Date:** YYYY-MM-DD
**Repo:** <affected repo>
**Affected PRs:** <PR numbers>
**Affected versions/artifacts:** <package@version or branch>
**Severity:** <how far it got, how long it lived, who was impacted>

## Timeline
<bullet list of events with UTC timestamps where possible>

## Answers
### How did local tests miss this?
### How did CI miss this?
### How did sessions miss this?
### Root-cause framing for gsd-execute / plan process
### New guardrails to add
### Why did the original author make the mistake?

## Action Items
- [ ] ...
```
