# Plan 066: Configurable Engagement Dashboard

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Engagement UI restructuring), Plan 057 (boards/tasks)
**Source:** Clark UI design 2026-03-24

---

## Purpose

Build a configurable dashboard view at the Engagement level. Users add/remove/arrange widgets to create a personalized overview of all projects under this engagement.

## Widget Types

| Widget | Data Source | Purpose |
|--------|-----------|---------|
| **Board Snapshot** | SmeMartBoard | Mini Kanban showing task counts by status for a specific board |
| **Task Query Panel** | SmeMartTask (GQL) | Custom filter — e.g., "overdue tasks", "my assigned tasks", "blocked items" |
| **Pinned Notes** | Notes (project/engagement) | Quick-access notes pinned by user |
| **Budget Summary** | Financials (Plan 068) | Budget vs actual spend across projects, burn rate |
| **Milestone Timeline** | PlanMilestone | Upcoming milestones across all projects, color-coded by status |
| **Progress Rollup** | Tasks aggregate | Domain-level rollups — "Security: 78%, Compliance: 92%" |
| **Recent Activity** | Timeline events | Last N events across all projects |
| **Budget Overage Alerts** | Financials | Projects over budget or approaching threshold |
| **Message Highlights** | Messages (Plan 065) | Unread/urgent messages across projects |

## Configuration Model

Dashboard layout is per-user, per-engagement. Stored in user preferences (localStorage or Neon user_preferences table).

```typescript
interface DashboardConfig {
  engagementId: string;
  widgets: DashboardWidget[];
}

interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: { row: number; col: number; width: number; height: number };
  config: Record<string, unknown>; // widget-specific config (boardId, filter criteria, etc.)
}
```

## UI

- Grid layout (CSS Grid or a lightweight dashboard library)
- "Add Widget" button → picker dialog showing available widget types
- Drag to reposition, resize handles
- Per-widget settings (which board, which filter, etc.)
- Default layout for new engagements (preset widgets)

## Effort Estimate

12-16 hours (widget framework + 4-5 initial widget types + configuration persistence)

---

*Session: `claude --resume poc/sme-mart`*
