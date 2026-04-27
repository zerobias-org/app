# Plan 065: Message Center (Engagement + Project)

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Engagement UI restructuring)
**Source:** Clark UI design 2026-03-24, Kevin Project spec (chatrooms/message boards as project children)

---

## Purpose

Build a Message Center that operates at two levels:
1. **Engagement-level** — cross-project message hub with project filtering. Important messages from small/hidden projects bubble up.
2. **Project-level** — project-scoped threads for day-to-day communication.

## Key Design Decisions

### Engagement Messages = Aggregate View

The Engagement message center is NOT a separate message store — it aggregates messages from all projects under the engagement, plus engagement-level threads (e.g., "MSA renewal discussion").

Filtering:
- By project (dropdown or chip filter)
- By priority/importance (pinned, flagged)
- By participant
- By date range

This ensures important messages from smaller projects are visible at the engagement level without requiring users to drill into each project.

### Project Messages = Scoped Thread

Each project has its own message space. Messages here are:
- Visible in the project's `/messages` tab
- Also visible in the engagement's `/messages` tab (with project label)
- Scoped by boundary membership (buyer_only / provider_only / all visibility)

### Platform Alignment

Kevin's Project spec lists "chatrooms / message boards" as project children. If/when the platform ships a messaging primitive, we migrate to it. Until then, build lightweight in AuditgraphDB or Neon.

## Proposed Data Model

```yaml
SmeMartMessage:
  - content        # Markdown text
  - authorId       # ZB user ID
  - projectId      # SmeMartProject (optional — null = engagement-level)
  - engagementId   # Parent engagement
  - threadId       # For reply threading (self-referencing)
  - visibility     # buyer_only | provider_only | all
  - priority       # normal | important | urgent
  - pinned         # Boolean — pinned to top
  - createdAt
  - updatedAt
```

## UI Components

- `MessageCenterComponent` — engagement-level aggregate view with filters
- `ProjectMessagesComponent` — project-scoped thread view
- `MessageComposer` — Milkdown-based editor (reuse existing markdown components)
- `MessageCard` — individual message display with reply/pin/flag actions
- `MessageThreadView` — threaded conversation display

## Effort Estimate

8-12 hours (data model + composer + thread view + engagement aggregate)

---

*Session: `claude --resume poc/sme-mart`*
