---
id: "001"
priority: medium
scope: sme-mart
effort: small
found: 2026-04-20
status: open
promoted_to: null
---

# Task Portfolio implementation path — verify post-Nic-Board work

Decide whether "Task Portfolio" (Brian's tier below Workspace in his 2026-04-20 notes) is implemented as:

1. The platform `Board` entity from Nic's in-flight work, OR
2. A saved search / view over tasks (filtered by tag / custom field / status), OR
3. Pure UI group-by projection (Kanban / backlog / sprint views)

Do **not** build a dedicated `TaskPortfolio` schema class preemptively.

**Why now:** 2026-04-20 Slack huddle with Brian (see `.claude/notes/meetings/2026-04-20-slack-huddle-project-hierarchy-qa.md`, question A2). Brian did not explicitly address Task Portfolio during the call; by analogy to his framing of Engagement/Workspace Portfolios as "sorters" / "directories", this is inferred UI-only — but it may overlap with Nic's Board scope. Premature schema work risks duplicating a platform primitive.

**Blocked by:** Nic's Board entity scope must be clear before we commit to an implementation path. Revisit during next Brian + Nic sync, or when Board reaches a reviewable state.
