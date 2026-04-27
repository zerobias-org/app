# Plan 070: Project Reviews / Retrospectives

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Project UI)
**Source:** Clark 2026-03-24 — PM retrospectives for continuous improvement

---

## Purpose

Build a Reviews view under SmeMartProject for PM retrospectives — capturing learnings and process improvements as the project proceeds, not just at completion.

## Key Insight

This is NOT a post-mortem-only feature. PMs want to capture learnings **during** the project — "what went well this sprint," "what we'd do differently," "process friction we discovered." It's a living document that grows as the project progresses.

## Proposed UI

### Review Entries (chronological)

A timeline of review entries, each with:
- **Date** — when the review was captured
- **Phase/Sprint** — what period it covers
- **What went well** — successes, smooth processes
- **What to improve** — friction points, bottlenecks, risks
- **Action items** — specific changes to make going forward
- **Author** — who submitted the review

### Review Panel (sidebar or section)

For quick access, a summary panel could appear on the Project Overview showing:
- Latest review entry
- Trending themes (recurring issues across reviews)
- Open action items from past reviews

### Aggregation at Engagement Level

Cross-project learnings could surface at the Engagement level:
- "Across 3 projects with this vendor, recurring theme: slow document turnaround"
- Useful for vendor relationship management

## Data Model

```yaml
SmeMartReview:
  - projectId       # Parent project
  - title           # "Sprint 3 Retrospective" or "Phase 1 Closeout"
  - phase           # Optional: which project phase this covers
  - wentWell        # Markdown content
  - toImprove       # Markdown content
  - actionItems     # Array of { description, assignee, status, dueDate }
  - authorId        # ZB user ID
  - createdAt
  - updatedAt
```

Could be a new GQL entity or could be implemented as structured Notes with a `review` type tag. Notes approach is lighter and reuses existing infrastructure.

## Effort Estimate

4-6 hours (review entry form + chronological display + overview panel)

---

*Session: `claude --resume poc/sme-mart`*
