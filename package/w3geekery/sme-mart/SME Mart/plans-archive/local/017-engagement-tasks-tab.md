# Plan 017: Engagement | Tasks Tab

**Status:** Draft
**Date:** 2026-02-19
**Tab:** Transparency Center → Tasks (replaces "Sub-Tasks Coming Soon" stub)
**Depends on:** Standup discussion re: task parent/child link type

---

## Context

Each engagement has a 1:1 **master ZeroBias Task** (`engagement.zerobias_task_id`). The Tasks tab should display this master task and any sub-tasks linked to it, with the ability to create new sub-tasks.

### Current State of ZB Task Links (researched 2026-02-19)

**Task-to-task link types that exist today:**

| Link Type | `fromType` | `toType` | Direction Labels |
|-----------|-----------|----------|-----------------|
| `relates_to` | task | task | `relates_to` ↔ `relates_to` (symmetric) |

**Task-to-task link types that do NOT exist (but exist for other resource types):**

| Link Type | Exists For | Missing For |
|-----------|-----------|-------------|
| `child_of` / `parent_to` | task→team, task→internal_control | task→task |
| `blocks` / `blocked_by` | countermeasure→cyber_artifact | task→task |

**Key insight:** Link types are per-resource-type-pair. Not all resource types share the same link types. The `child_of` link type exists in the platform schema — it just hasn't been registered for `task → task`. Kevin could add a `taskchildoftask` row to `hydra.link_type` to enable it.

### Standup Action Item (2026-02-20)

Discuss with Kevin/Brian:
1. **Request:** Register `child_of`/`parent_to` link type for `task → task` in the platform
2. **Rationale:** SME Mart needs sub-tasks on engagements; the link infrastructure already exists
3. **Fallback:** If platform change isn't feasible short-term, we can track parent/child in Neon DB and use `relates_to` links as a loose association

---

## Architecture Decision: How to Track Sub-Tasks

### Option A: Platform-native `child_of` links (preferred)

**Requires:** Kevin registers `taskchildoftask` link type with `child_of`/`parent_to` direction.

```
Master Task ←──parent_to──── Sub-Task 1
             ←──parent_to──── Sub-Task 2
             ←──parent_to──── Sub-Task 3
```

- Create sub-task via `TaskApi.createTask(...)` then link via `ResourceApi.linkResources(masterTaskId, { linkType: childOfLinkTypeId, toResource: subTaskId })`
- Query sub-tasks via `ResourceApi.listResourceLinks(masterTaskId, { linkTypes: [childOfLinkTypeId] })`
- Full platform integration — sub-task comments, attachments, status all come from ZB Tasks
- Sub-tasks visible in ZB UI task panel too (bidirectional)

### Option B: Neon DB tracking + `relates_to` links (fallback)

If platform `child_of` isn't available short-term:

- Create sub-tasks as regular ZB Tasks
- Link to master task via existing `relates_to` link type
- Store parent/child relationship in a Neon table: `engagement_subtasks(engagement_id, parent_task_id, child_task_id, sort_order, created_at)`
- Query our Neon table to know which tasks are "sub-tasks" vs just "related"
- Downside: dual source of truth, ZB UI won't show hierarchy

### Option C: Application-only sub-tasks in Neon (no ZB Tasks)

- Sub-tasks live entirely in Neon DB with custom schema
- No ZB Task integration for sub-tasks
- Simplest to build but loses all ZB platform features (comments, attachments, audit trail, etc.)
- **Not recommended** — defeats the purpose of ZB integration

**Recommendation:** Option A if Kevin can add the link type. Option B as interim fallback. Decide after standup.

---

## Data Model

### ZB Platform Types (already in `@zerobias-com/platform-sdk`)

```typescript
// Task (extended view with links)
TaskExtended {
  id: UUID;
  code: string;          // e.g. "TASK-1234"
  name: string;
  description?: string;
  status: string;        // from activity workflow
  priority?: string;
  assignees?: TaskAssignee[];
  links?: TaskExtendedLink[];
  created: Date;
  updated: Date;
  boundaryId: UUID;
  activityId: UUID;
}

TaskExtendedLink {
  id: UUID;              // linked resource ID
  name: string;
  type: string;          // resource type
  linkTypeId: UUID;
  fromLinkType: string;  // e.g. 'child_of', 'relates_to'
  toLinkType?: string;   // e.g. 'parent_to'
}

// For creating tasks
NewTask {
  name: string;
  description?: string;
  boundaryId: UUID;
  activityId: UUID;
  priority?: string;
  assignees?: NewTaskAssignee[];
  links?: NewTaskLink[];
}

NewTaskLink {
  resourceId: UUID;
  linkTypeId?: UUID;     // null = defaults to relates_to
}
```

### SME Mart Engagement Model (existing)

```typescript
// From work-request.model.ts
WorkRequest {
  zerobias_task_id: string | null;    // master task UUID
  zerobias_tag_id: string | null;
  zerobias_boundary_id: string | null;
  engagement_tag: string | null;
}
```

---

## New Files

| File | Type | Purpose |
|------|------|---------|
| `core/services/zb-tasks.service.ts` | Service | ZB Task CRUD, link management, sub-task queries |
| `shared/components/task-list-panel/task-list-panel.component.ts` | Component | Displays master task + sub-tasks list |
| `shared/components/task-list-panel/task-list-panel.component.html` | Template | |
| `shared/components/task-list-panel/task-list-panel.component.scss` | Styles | |
| `shared/components/task-card/task-card.component.ts` | Component | Single task card (status, assignees, code, actions) |
| `shared/components/task-card/task-card.component.html` | Template | |
| `shared/components/task-card/task-card.component.scss` | Styles | |
| `shared/components/create-subtask-dialog/create-subtask-dialog.component.ts` | Dialog | Form to create a new sub-task |
| `shared/components/create-subtask-dialog/create-subtask-dialog.component.html` | Template | |
| `shared/components/create-subtask-dialog/create-subtask-dialog.component.scss` | Styles | |

## Modified Files

| File | Change |
|------|--------|
| `engagement-detail.component.html` | Replace Tasks tab stub with `<app-task-list-panel>` |
| `engagement-detail.component.ts` | Add task loading logic, lazy-load on tab select |
| `core/models/index.ts` | Export any new task-related interfaces if needed |

---

## Step-by-Step Implementation

### Step 1: ZbTasksService

Create `core/services/zb-tasks.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class ZbTasksService {
  private readonly clientApi = inject(ZerobiasClientApiService);

  /** Fetch the master task with extended details (links, assignees) */
  async getTask(taskId: string): Promise<TaskExtended> { ... }

  /** List sub-tasks linked to a parent task via child_of link type */
  async listSubTasks(parentTaskId: string): Promise<TaskExtended[]> {
    // Option A: query resource links with child_of link type
    //   → get linked resource IDs where fromLinkType = 'parent_to'
    //   → fetch each as TaskExtended
    // Option B (fallback): query Neon engagement_subtasks table
  }

  /** Create a new sub-task and link it to the parent */
  async createSubTask(
    parentTaskId: string,
    newTask: { name: string; description?: string; boundaryId: string; activityId: string }
  ): Promise<TaskExtended> {
    // 1. Create the task via TaskApi.createTask()
    // 2. Link to parent via ResourceApi.linkResources() with child_of link type
    // 3. Return the created task
  }

  /** Update task status (e.g. mark complete) */
  async updateTaskStatus(taskId: string, status: string): Promise<void> { ... }

  /** List available statuses for a task (from its activity workflow) */
  async getAvailableStatuses(taskId: string): Promise<string[]> { ... }
}
```

**Dependencies to investigate:**
- `TaskApi` — `getTask()`, `createTask()`, `updateTask()`, `searchTasks()`
- `ResourceApi` — `listResourceLinks()`, `linkResources()`, `listResourceLinkTypes()`
- Need to discover the `child_of` link type UUID at runtime (or cache it)

### Step 2: TaskCard Component

A compact card displaying a single task's key info.

**Inputs:**
- `task: TaskExtended`
- `isMaster: boolean` — visual distinction (larger, no delete action)
- `isOwner: boolean` — show/hide edit actions

**Display:**
- Task code badge (e.g. `TASK-1234`) — small chip
- Task name (title)
- Status chip (color-coded by workflow state)
- Priority indicator (if set)
- Assignee avatars (from `task.assignees`)
- Created date
- **Actions (owner only):** Edit status, view in ZB platform (external link)

**No inline editing** — status changes go through ZB task workflow. Keep it simple: display + link to full ZB UI for advanced management.

### Step 3: TaskListPanel Component

Container that renders the master task and sub-task list.

**Inputs:**
- `masterTaskId: string`
- `boundaryId: string` — for creating sub-tasks in the same boundary
- `isOwner: boolean`

**Behavior:**
1. On init, call `zbTasksService.getTask(masterTaskId)` → render as master task card
2. Call `zbTasksService.listSubTasks(masterTaskId)` → render as list of sub-task cards
3. Show "+ Add Sub-Task" button (owner only)
4. Handle empty state: "No sub-tasks yet"

**Layout:**
```
┌─ Tasks ────────────────────────────────────────────────┐
│                                                         │
│  ┌─ Master Task ───────────────────────────────────┐   │
│  │ TASK-1001  Engagement: Cloud Security Audit     │   │
│  │ Status: In Progress  ·  Priority: High          │   │
│  │ 👤 Clark  👤 Provider                            │   │
│  │ Created: Feb 11, 2026                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Sub-Tasks (3)                        [+ Add Sub-Task] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ TASK-1002  Phase 1: Gap Assessment              │   │
│  │ Status: Completed  ·  👤 Provider                │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ TASK-1003  Phase 2: Remediation Plan            │   │
│  │ Status: In Progress  ·  👤 Provider              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ TASK-1004  Phase 3: Final Report                │   │
│  │ Status: Not Started  ·  Unassigned               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 4: CreateSubTaskDialog

A `MatDialog` form for creating a new sub-task.

**Fields:**
- **Name** (required) — text input
- **Description** (optional) — textarea (markdown support later)
- **Priority** (optional) — select: Low, Medium, High, Critical
- **Assignee** (optional, future) — would need people search; skip for v1

**On submit:**
- Calls `zbTasksService.createSubTask(masterTaskId, formData)`
- Uses the engagement's `boundaryId` and the master task's `activityId`
- Closes dialog, parent refreshes sub-task list
- Snackbar on success/error

### Step 5: Wire into Engagement Detail

In `engagement-detail.component.ts`:
- Add signals: `masterTask`, `subTasks`, `tasksLoading`, `tasksLoaded`
- Lazy-load tasks when Tasks tab is selected (same pattern as Messages tab)

In `engagement-detail.component.html`:
```html
<!-- Tasks Tab -->
<mat-tab label="Tasks">
  <div class="tab-content">
    @if (!engagement()!.zerobias_task_id) {
      <zb-empty-state-container icon="task_alt" title="No Task Linked"
        description="This engagement does not have a linked ZeroBias Task." />
    } @else if (tasksLoading()) {
      <mat-spinner diameter="40" />
    } @else {
      <app-task-list-panel
        [masterTaskId]="engagement()!.zerobias_task_id!"
        [boundaryId]="engagement()!.zerobias_boundary_id!"
        [isOwner]="isOwner()"
        (subTaskCreated)="onSubTaskCreated()" />
    }
  </div>
</mat-tab>
```

---

## Cross-reference: Plan 016 (Messages Tab)

The Messages tab (Plan 016) aggregates comments across master + sub-tasks. Once sub-tasks exist:
- `TaskCommentsService.listAllComments(masterTaskId, subTaskIds[])` fetches comments from all linked tasks
- Each comment bubble in the message timeline shows a task code badge indicating which task it belongs to
- The message composer's task selector dropdown lists master task + all sub-tasks

This creates a unified communication view across the entire engagement's task tree.

---

## Dependencies & Blockers

| Item | Status | Notes |
|------|--------|-------|
| `child_of` link type for task→task | **BLOCKED** — discuss in standup 2026-02-20 | Kevin needs to register `taskchildoftask` in `hydra.link_type` |
| `TaskApi` in Angular SDK | Available | Via `ZerobiasClientApiService.auditmationPlatform.getTaskApi()` |
| `ResourceApi` in Angular SDK | Needs verification | For `listResourceLinks()`, `linkResources()` |
| Task activity ID | Needs discovery | What `activityId` do engagement tasks use? Check existing master tasks. |
| Task workflow states | Needs discovery | What statuses are available? Depends on the activity. |

---

## Phased Delivery

### Phase 1: Read-only master task display (~2 hrs)
- ZbTasksService with `getTask()`
- TaskCard component
- TaskListPanel showing master task only
- Wire into engagement-detail Tasks tab
- No sub-task functionality yet (show "Sub-tasks require platform update" note)

### Phase 2: Sub-task support (~3 hrs, after Kevin adds link type)
- `listSubTasks()` and `createSubTask()` in ZbTasksService
- CreateSubTaskDialog
- Sub-task list rendering in TaskListPanel
- "+ Add Sub-Task" button

### Phase 3: Enhanced task management (~2 hrs)
- Status transitions (workflow-aware dropdowns)
- Assignee display with avatar
- Link to full ZB UI task view (external)
- Integration with Messages tab (Plan 016) for cross-task comment aggregation

---

## Open Questions for Standup

1. **Can Kevin register `taskchildoftask` link type?** — `child_of`/`parent_to` for `task → task`. The infrastructure exists; it's just a new row in `hydra.link_type`.
2. **What activity are engagement tasks created under?** — Need the `activityId` to create sub-tasks with the correct workflow.
3. **Should sub-tasks inherit boundary from master task?** — Probably yes, but confirm.
4. **Task status workflow** — What states are available for engagement tasks? (e.g. Not Started → In Progress → Completed → Cancelled)
5. **Future: `blocks`/`blocked_by` for tasks?** — Would enable dependency tracking between sub-tasks. Not urgent, but worth planting the seed.
