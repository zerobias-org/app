# Plan 058: Saved Task Views & Board Management

**Status:** Stub — blocked on Plan 057 (core project view with boards)
**Created:** 2026-03-17
**Priority:** High — extends 057's static TaskFilterChipBar into full saved-query system
**Effort:** 8–12 hours
**Session:** `claude --resume rfp-super-summary-gap-planning`
**Depends on:** Plan 057 (SmeBoard/SmeActivity/SmeWorkflow)

---

## Overview

Two features in one plan:

1. **Saved Task Views** — criteria-based cross-board task filters. Like Jira saved filters or GitHub saved queries. These are NOT boards. Boards are structural containers (per Kevin: "board is the ground a task plugs in to"). Views are lenses that filter across boards.

2. **Board Management** — create/rename/delete custom boards, configure permission overrides, manage board-level settings.

### Key Distinction

| Concept | What it is | Structural? | Task belongs to... |
|---------|-----------|-------------|-------------------|
| **Board** (Plan 057) | Container with rank, issue #, workflow, permissions | Yes | Exactly one board |
| **Saved View** (this plan) | Criteria-based filter/query across boards | No | N/A — view shows tasks from any board |

---

## Part 1: Saved Task Views

### Two types

**Default Views** — baked into every board, not user-editable:
- All Tasks (no filter)
- Critical Path (priority = critical/high)
- Overdue (due_date < today AND status ≠ done)
- Blocked (status = blocked)

**Custom Views** — user-created via criteria builder:
- Saved query + name
- Can span multiple boards (cross-board)
- Auto-refresh: on view open, re-run criteria, show new matches
- Shareable (per project or per user)

### Data Model

```typescript
export type TaskViewType = 'default' | 'custom';
export type TaskViewScope = 'project' | 'user';

export interface TaskViewCriteria {
  boardIds?: string[];              // filter to specific boards (empty = all visible boards)
  statuses?: string[];              // from workflow statuses
  priorities?: string[];            // critical, high, normal, low
  activityIds?: string[];           // filter by activity type
  assignedTo?: string[];            // user/team IDs
  dueDateRange?: { from?: string; to?: string };
  overdue?: boolean;
  sourceDocuments?: string[];
  textSearch?: string;              // name/description contains
  customFields?: Record<string, any>;
  tags?: string[];                  // must also have these hydra tags
}

export interface SavedTaskView {
  id: string;
  name: string;
  type: TaskViewType;
  scope: TaskViewScope;
  criteria: TaskViewCriteria;
  projectId: string;
  createdBy: string;
  matchCount: number;               // cached count from last run
  lastRefreshed?: string;
  created: string;
  updated: string;
}
```

### Default views per board partition

**Buyer board:**
| View | Criteria |
|------|----------|
| Critical Path | `{ priorities: ['critical','high'] }` |
| Overdue | `{ overdue: true }` |
| In Review | `{ statuses: ['in_review'] }` |
| By Activity: Security Assessment | `{ activityIds: [securityAssessmentId] }` |

**Provider board:**
| View | Criteria |
|------|----------|
| My Deliverables | `{ assignedTo: [currentUserId] }` |
| Awaiting Approval | `{ statuses: ['awaiting_approval'] }` |
| Overdue | `{ overdue: true }` |

**Shared board:**
| View | Criteria |
|------|----------|
| Active Milestones | `{ statuses: ['active'] }` |
| Upcoming (2 weeks) | `{ dueDateRange: { to: '+14d' } }` |
| Payment Gates | `{ activityIds: [paymentGateActivityId] }` |

**Cross-board:**
| View | Criteria |
|------|----------|
| All Blocked | `{ statuses: ['blocked'] }` |
| This Week | `{ dueDateRange: { from: 'monday', to: 'friday' } }` |
| My Tasks (all boards) | `{ assignedTo: [currentUserId] }` |

### Components

```
TaskFilterChipBar (upgrade from 057 static version)
  ├── mat-chip-listbox (horizontal scroll)
  │   ├── Default view chips (All, Critical, Overdue, Blocked)
  │   ├── Custom saved view chips (with match count badges)
  │   └── "+ New View" chip → opens CriteriaViewDialog
  │
  └── Active view: criteria summary + "Refresh" + "Edit" + "Delete"

CriteriaViewDialog (mat-dialog)
  ├── View name input
  ├── Board filter (multi-select — which boards to search)
  ├── Status multi-select (from workflows)
  ├── Priority multi-select
  ├── Activity type multi-select
  ├── Assigned to (autocomplete)
  ├── Due date range picker
  ├── Overdue toggle
  ├── Text search
  ├── Tag filter (autocomplete)
  ├── Preview panel: "X tasks match" + scrollable list
  └── Actions: "Preview" | "Save View" | "Cancel"
```

---

## Part 2: Board Management

### Features

- **Create board** — name, partition, issue prefix, default workflow, boundary association
- **Rename board** — update name/description
- **Delete board** — only if empty (no tasks), with confirmation
- **Permission overrides** — board-level visibility/access customization beyond boundary inheritance
- **Default workflow** — set which workflow new tasks on this board use by default
- **Reorder boards** — drag to reorder tabs

### Components

```
BoardManagementDialog (mat-dialog)
  ├── Board list with edit/delete actions
  ├── Create board form
  │   ├── Name, description
  │   ├── Partition (buyer/provider/shared/custom)
  │   ├── Issue prefix (e.g. "BUY", "PRV")
  │   ├── Default workflow (select from SmeWorkflows)
  │   └── Boundary association (multi-select)
  └── Permission overrides panel (future)
```

---

## Phases

### Phase 1 — Backend (2 hrs)
1. Create `saved_task_views` Neon table
2. Write `SavedTaskView` model
3. Write `SavedTaskViewService` — CRUD + criteria matching
4. Unit tests for criteria evaluation

### Phase 2 — Upgrade TaskFilterChipBar (3 hrs)
1. Replace 057's static chips with saved-view-backed chips
2. Match count badges
3. "+ New View" opens CriteriaViewDialog
4. View selection filters task list across boards

### Phase 3 — Criteria Builder Dialog (3 hrs)
1. `CriteriaViewDialog` with all filter fields
2. Live preview panel
3. "Save View" flow
4. "Edit View" for existing views

### Phase 4 — Board Management (2 hrs)
1. `BoardManagementDialog`
2. Create/rename/delete boards
3. Default workflow assignment
4. Tests

---

## What's NOT in scope
- Board permission override UI (future — needs platform Board API)
- Cross-project views
- View sharing between users
- Kanban visualization (drag between status columns)
- View notifications (alert on new matches)
