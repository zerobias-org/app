# Plan 057: Project View — SmeBoard / SmeActivity / SmeWorkflow (Project Bloom MVP)

**Status:** Actionable — Phase 1 ready
**Created:** 2026-03-16
**Updated:** 2026-03-24 (added entangled task pair support, new activities: Requirement + Satisfaction)
**Priority:** CRITICAL — CEO Brian's highest priority ("like now"). Catalin also requesting project capability urgently (2026-03-24).
**Effort:** 14–18 hours (includes GQL schema YAML + verify)
**Session:** `claude --resume rfp-super-summary-gap-planning`

> **Entangled Task Pairs (Plan 071):** Boards support transparency entangled task pairs — a requirement task on the demand board auto-creates a linked satisfaction task on the supply board. Decision: Option B (two linked tasks + transparency rendering layer). See [evaluation doc](../../notes/entangled-task-pairs-model-evaluation.md). New activities "Requirement" and "Satisfaction" added to the activity catalog.

---

## Overview

Build a **project view** with three structural boards (Buyer / Provider / Shared), reusable task activities with workflows, informational context layers (PRD + Plan), and saved task views for cross-board filtering.

### Two Distinct Concepts

| Concept | Platform analog | Purpose | Relationship to tasks |
|---------|----------------|---------|----------------------|
| **SmeBoard** | `Board` (coming) | Structural container — rank, issue numbering, permissions | Task lives on exactly ONE board |
| **SmeActivity** | `Activity` | Work type blueprint — workflow, RACI, custom fields | Task is created *under* an activity (defines behavior) |

A task has BOTH a `boardId` (where it lives) and an `activityId` (how it behaves). Different boards can use the same activity. Different tasks on the same board can use different activities.

```
Board: "Buyer Requirements"    (structural — rank, issue #: BUY-001, permissions from Boundary A)
  └── Task BUY-001              (lives on this board)
       ├── activityId → Activity: "Security Assessment"   (defines workflow + custom fields)
       └── subtasks via child_of

Board: "Provider Deliverables"  (structural — rank, issue #: PRV-001, permissions from Boundary B)
  └── Task PRV-001
       ├── activityId → Activity: "Gap Assessment"         (same activity, different board)
       └── subtasks
```

### Architecture Principles

1. **SmeBoard = future ZB Board** — structural container with rank, issue numbering, scope, permission inheritance from boundary. Task belongs to exactly one board. Per Kevin (2026-03-16): "Board is the ground a task plugs in to. It has rank, issue number, workflows. It is structural. Not a property of a task."
2. **SmeActivity mirrors platform `Activity`** — work type blueprint with workflow, RACI, custom fields. Reusable across boards. Same prop names for 1:1 migration.
3. **SmeWorkflow mirrors platform `Workflow`** — statuses, transitions, defaults. Each activity references a workflow.
4. **Boards have scopes + permission inheritance** — per Chris: Project has a board, Org has a board, Boundary has a board. Boards inherit permissions from their boundary. Projects map to 1+ boundaries.
5. **Shared board inherits from both boundaries** — with potential per-board permission overrides/customization.
6. **Buyer = Provider is valid** — same org, different roles. Supports internal marketplace (Plan 050).
7. **Saved Task Views (not boards) for cross-board filtering** — criteria-based filters that can span boards. Plan 058 scope.
8. **Engagement and Project are GQL entities** — containers that *hold* boards.

### Full Hierarchy

```
Org
├── SmeBoard (org-level default)
│
├── Boundary A (demand-side — permissions defined here)
│   └── SmeBoard (boundary default — inherits Boundary A permissions)
│
├── Boundary B (supply-side — permissions defined here)
│   └── SmeBoard (boundary default — inherits Boundary B permissions)
│
└── Engagement (GQL entity — buyer_org can == provider_org)
    │
    ├── SmeBoard: "Engagement Setup"                    (scope: engagement)
    │    └── Tasks: D&B check, banking, MSA             (issue #: SETUP-001, ...)
    │         └── activityId → Activity: "Corp Vetting"
    │
    └── Project (GQL entity — maps to Boundary A + B)
         ├── PRD (GQL entity — informational, WHAT)
         ├── Plan (GQL entity — informational, HOW/WHEN)
         │
         ├── SmeBoard: "Buyer Requirements"             (scope: project, inherits: Boundary A)
         │    ├── Task BUY-001 (activity: "Security Assessment")
         │    ├── Task BUY-002 (activity: "Compliance Review")
         │    └── Task BUY-003 (activity: "Policy Review")
         │
         ├── SmeBoard: "Provider Deliverables"          (scope: project, inherits: Boundary B)
         │    ├── Task PRV-001 (activity: "Gap Assessment")
         │    └── Task PRV-002 (activity: "Report Delivery")
         │
         └── SmeBoard: "Shared Milestones"              (scope: project, inherits: both A+B)
              ├── Task SHR-001 (activity: "Milestone Review")
              └── Task SHR-002 (activity: "Payment Gate")
```

---

## Data Models

### SmeBoard — mirrors future ZB `Board`

```typescript
// sme-board.model.ts
// Structural container for tasks. Mirrors future ZB Board entity.
// Per Kevin (2026-03-17): Board is the structural anchor for Tasks.
// Board tells the UI the superset of Activities (statuses, phases, transitions).
// Boards don't have their own roles — they use their parent's roles.

/** Board parent scopes — per Kevin: Org, Boundary, Project, User */
export type SmeBoardScope = 'org' | 'boundary' | 'project' | 'user';

/** Board partition — maps to UI tabs (buyer/provider/shared) */
export type SmeBoardPartition = 'buyer' | 'provider' | 'shared' | 'engagement-setup' | 'closeout' | 'audit';

export interface SmeBoard {
  id: string;                              // UUID
  name: string;                            // e.g. "Buyer Requirements"
  code: string;                            // e.g. "sme-mart.board.buyer-reqs"
  scope: SmeBoardScope;                    // parent type (per Kevin: Org, Boundary, Project, User)
  partition: SmeBoardPartition;            // UI grouping (tab assignment)
  parentId: string;                        // FK → the parent resource (org/boundary/project/user)
  activityIds: string[];                   // activities on this board — board exposes superset of their statuses/phases/transitions
  description?: string;
  created: string;
  updated: string;
  // NOTE: No issuePrefix — activity declares prefix (Kevin: "bug-, vendor-, task-")
  // NOTE: No issue counter — counter is org-scoped, not board-scoped (Kevin: "bug-12345 is unique inside org")
  // NOTE: No own roles — uses parent's roles (Kevin: "Boards don't have their own roles")
  // NOTE: No defaultWorkflowId — board aggregates the superset of all its activities' workflows
}

/** Display metadata for board partitions (UI tabs) */
export const BOARD_PARTITION_META: Record<SmeBoardPartition, { label: string; icon: string; description: string }> = {
  'buyer':              { label: 'Buyer',    icon: 'shopping_cart',   description: 'Requirements defined by the buyer' },
  'provider':           { label: 'Provider', icon: 'engineering',     description: 'Deliverables produced by the provider' },
  'shared':             { label: 'Shared',   icon: 'handshake',       description: 'Joint milestones tracked by both parties' },
  'engagement-setup':   { label: 'Setup',    icon: 'verified_user',   description: 'Corp-to-corp vetting and onboarding' },
  'closeout':           { label: 'Closeout', icon: 'task_alt',        description: 'Engagement closure and sign-off' },
  'audit':              { label: 'Audit',    icon: 'policy',          description: 'Third-party assessor tasks' },
};
```

### SmeActivity — mirrors `platform.Activity`

```typescript
// sme-activity.model.ts
// Work type blueprint — defines HOW tasks behave (workflow, RACI, custom fields).
// Reusable across boards. A task references one activity for its behavior.
// Per Kevin: Activity declares issue prefix (bug-, vendor-, task-). Counter is org-scoped.
// Activities can extend other activities.
// Mirrors @zerobias-com/platform-sdk Activity for 1:1 migration.

/** Matches platform ActivityTypeEnum values */
export type SmeActivityType = 'task' | 'escalation' | 'approval' | 'acknowledgement' | 'help_request';

/** Mirrors platform ActivityLink */
export interface SmeActivityLink {
  linkType: string;
  linkTypeId?: string;
  fromType?: string;
  fromLinkType?: string;
  toType?: string;
  toLinkType?: string;
  required?: boolean;
}

/** Mirrors platform ActivityOnTransition */
export interface SmeActivityOnTransition {
  toStatus: string;
  activity: string;   // activity code to trigger
}

/**
 * Mirrors platform Activity — 1:1 prop mapping for migration.
 * See: node_modules/@zerobias-com/platform-sdk/dist/model/Activity.d.ts
 */
export interface SmeActivity {
  id: string;                              // UUID
  name: string;                            // e.g. "Security Assessment", "Gap Assessment"
  type: string;                            // Nmtoken
  ownerId: string;                         // UUID — org that owns this activity
  created: string;                         // ISO datetime
  updated: string;                         // ISO datetime
  workflowId: string;                      // FK → SmeWorkflow
  code: string;                            // e.g. 'sme-mart.security-assessment'
  packageCode: string;                     // 'w3geekery.sme-mart'
  activityType: SmeActivityType;           // maps to ActivityTypeEnum
  issuePrefix: string;                     // Kevin: activity declares prefix (bug-, vendor-, task-)
  extendsActivityId?: string;              // Kevin: activity can extend another activity
  estimatedTime?: string;                  // Duration string (ISO 8601)
  responsible: string[];                   // RACI — who does the work
  accountable: string[];                   // RACI — who's ultimately answerable
  consulted: string[];                     // RACI — who provides input
  informed: string[];                      // RACI — who gets notified
  links: SmeActivityLink[];
  customFields: string[];                  // field names for tasks under this activity
  description?: string;
  parentId?: string;                       // UUID — nested activities
  boundaryId?: string;                     // UUID
  activityGroup?: string;                  // grouping label (optional)
  taskNameTemplate?: string;               // e.g. '{prefix}-{seq}'
  onTransition?: SmeActivityOnTransition[];
}
```

### SmeWorkflow — mirrors `platform.Workflow` + `WorkflowExtended`

```typescript
// sme-workflow.model.ts
// Mirrors @zerobias-com/platform-sdk Workflow / WorkflowExtended.

/** Mirrors platform TransitionRequiredFields */
export interface SmeTransitionRequiredFields {
  fields?: string[];
  customFields?: string[];
  links?: string[];
}

/** Mirrors platform WorkflowTransition */
export interface SmeWorkflowTransition {
  id: string;                              // UUID
  workflowId: string;                      // UUID
  name: string;                            // e.g. 'Start Work'
  status: string;                          // target status
  fromStatus: string[];                    // valid source statuses
  requiredFields: SmeTransitionRequiredFields;
  approval: boolean;
  notification: boolean;
  escalation: boolean;
  description?: string;
  isPrivate?: boolean;
}

/** Mirrors platform WorkflowDefaults */
export interface SmeWorkflowDefaults {
  status?: string;                         // initial status for new tasks
  priority?: { label: string; value: number; ownerId: string };
}

/**
 * Mirrors platform WorkflowExtended — 1:1 prop mapping.
 * See: node_modules/@zerobias-com/platform-sdk/dist/model/WorkflowExtended.d.ts
 */
export interface SmeWorkflow {
  id: string;                              // UUID
  ownerId: string;                         // UUID
  packageCode: string;                     // 'w3geekery.sme-mart'
  code: string;                            // e.g. 'sme-mart.buyer-workflow'
  name: string;
  statuses: string[];                      // e.g. ['todo','in_progress','blocked','done']
  transitions: SmeWorkflowTransition[];
  description?: string;
  defaults?: SmeWorkflowDefaults;
}

// ─── Pre-built Workflow Definitions ───

export const SME_WORKFLOW_BUYER: Omit<SmeWorkflow, 'id' | 'ownerId'> = {
  packageCode: 'w3geekery.sme-mart',
  code: 'sme-mart.buyer-workflow',
  name: 'Buyer Requirements Workflow',
  statuses: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
  defaults: { status: 'backlog', priority: { label: 'Normal', value: 200, ownerId: '' } },
  transitions: [
    { id: '', workflowId: '', name: 'Queue',         status: 'todo',        fromStatus: ['backlog'],                   requiredFields: {}, approval: false, notification: false, escalation: false },
    { id: '', workflowId: '', name: 'Start Work',    status: 'in_progress', fromStatus: ['todo', 'backlog'],           requiredFields: {}, approval: false, notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Submit Review',  status: 'in_review',   fromStatus: ['in_progress'],               requiredFields: {}, approval: true,  notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Approve',        status: 'done',        fromStatus: ['in_review'],                 requiredFields: {}, approval: true,  notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Reopen',         status: 'in_progress', fromStatus: ['in_review', 'done'],         requiredFields: {}, approval: false, notification: true,  escalation: false },
  ],
};

export const SME_WORKFLOW_PROVIDER: Omit<SmeWorkflow, 'id' | 'ownerId'> = {
  packageCode: 'w3geekery.sme-mart',
  code: 'sme-mart.provider-workflow',
  name: 'Provider Deliverables Workflow',
  statuses: ['backlog', 'todo', 'in_progress', 'awaiting_approval', 'done'],
  defaults: { status: 'backlog', priority: { label: 'Normal', value: 200, ownerId: '' } },
  transitions: [
    { id: '', workflowId: '', name: 'Queue',           status: 'todo',              fromStatus: ['backlog'],                          requiredFields: {}, approval: false, notification: false, escalation: false },
    { id: '', workflowId: '', name: 'Start Work',      status: 'in_progress',       fromStatus: ['todo', 'backlog'],                  requiredFields: {}, approval: false, notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Submit',           status: 'awaiting_approval', fromStatus: ['in_progress'],                      requiredFields: {}, approval: false, notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Approve',          status: 'done',              fromStatus: ['awaiting_approval'],                requiredFields: {}, approval: true,  notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Request Changes', status: 'in_progress',       fromStatus: ['awaiting_approval'],                requiredFields: {}, approval: false, notification: true,  escalation: false },
  ],
};

export const SME_WORKFLOW_SHARED: Omit<SmeWorkflow, 'id' | 'ownerId'> = {
  packageCode: 'w3geekery.sme-mart',
  code: 'sme-mart.shared-workflow',
  name: 'Shared Milestones Workflow',
  statuses: ['planned', 'active', 'completed', 'blocked'],
  defaults: { status: 'planned', priority: { label: 'Normal', value: 200, ownerId: '' } },
  transitions: [
    { id: '', workflowId: '', name: 'Activate',  status: 'active',    fromStatus: ['planned'],            requiredFields: {}, approval: false, notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Block',      status: 'blocked',   fromStatus: ['active', 'planned'],  requiredFields: {}, approval: false, notification: true,  escalation: true  },
    { id: '', workflowId: '', name: 'Unblock',    status: 'active',    fromStatus: ['blocked'],            requiredFields: {}, approval: false, notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Complete',   status: 'completed', fromStatus: ['active'],             requiredFields: {}, approval: true,  notification: true,  escalation: false },
    { id: '', workflowId: '', name: 'Reopen',     status: 'active',    fromStatus: ['completed'],          requiredFields: {}, approval: false, notification: true,  escalation: false },
  ],
};
```

### SmeTask — references both Board and Activity

```typescript
// sme-task.model.ts
// Per Kevin (2026-03-17):
// - Task is owned by a board OR another task (subtask model)
// - Every task has an Activity (that can extend another Activity)
// - Rank is OID/arbitrary precision — always space between 2 tasks
// - Rank applies to the board AND the phase
// - Code = activity prefix + org-scoped counter (e.g. "sec-12345")
// - Subtasks not usually shown on board (UI optimization)

export interface SmeTaskAssignment {
  partyType: 'user' | 'team' | 'service_account' | 'external';
  id?: string;
  principalId?: string;
  teamId?: string;
  contactName?: string;
  contactEmails?: string[];
}

export interface SmeTask {
  id: string;                              // UUID
  name: string;
  boardId: string;                         // FK → SmeBoard — WHERE the task lives (structural)
  activityId: string;                      // FK → SmeActivity — HOW the task behaves (workflow)
  code: string;                            // Kevin: activity prefix + org-scoped counter (e.g. "sec-12345")
  rank: string;                            // Kevin: OID/arbitrary precision (not integer) — board + phase scoped
  phaseCode?: string;                      // Kevin: tasks have phases (kanban columns). Rank applies within phase.
  status: string;                          // from SmeWorkflow.statuses (via activity.workflowId)
  priority: { label: string; value: number; ownerId: string };
  parentId?: string;                       // UUID — subtask parent. Kevin: "task owned by board OR another task"
  boundaryId?: string;                     // UUID — inherited from board's parent
  description?: string;
  assigned?: SmeTaskAssignment;
  accountable?: SmeTaskAssignment;
  approvers: SmeTaskAssignment[];
  notified: SmeTaskAssignment[];
  customFields?: Record<string, any>;
  dueDate?: string;                        // ISO date
  sourceDocument?: string;                 // which RFP doc this came from
  created: string;
  updated: string;
}

/** Client-side tree node for rendering */
export interface SmeTaskTreeNode extends SmeTask {
  children: SmeTaskTreeNode[];
  expanded: boolean;
  depth: number;
  /** Resolved from SmeWorkflow via activity */
  nextTransitions: SmeWorkflowTransition[];
}

/** Rollup summary per board */
export interface BoardSummary {
  boardId: string;
  partition: SmeBoardPartition;
  label: string;
  icon: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}
```

### Project — GQL schema entity

```typescript
// sme-project.model.ts
// Per Kevin (2026-03-17): Project is a Resource that creates a chain of sub-resources
// and provides a RoleScope. Owned by Org or Boundary. Children: Plans, Files, Boards,
// Timelines, Notes, Chatrooms, Whiteboards. Permissions cascade to children.

export type SmeProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'cancelled';
export type SmeProjectOwnerType = 'org' | 'boundary';

export interface SmeProject {
  id: string;
  name: string;
  status: SmeProjectStatus;
  ownerType: SmeProjectOwnerType;          // Kevin: owned by Org or Boundary
  ownerId: string;                         // FK → Org or Boundary
  engagementId?: string;                   // SME Mart concept — links project to engagement
  boundaryIds: string[];                   // maps to 1+ ZB Boundaries
  boundaryNames: string[];                 // denormalized for display
  description?: string;
  startDate?: string;
  targetEndDate?: string;
  created: string;
  updated: string;
  // Kevin: Project provides RoleScope — principals mapped to roles (Member, Leader, Owner)
  // per project, driving permissions for project + sub-resources.
  // Implementation: use SmeProjectRole[] when scoped roles are built.
}
```

### PRD + Plan — GQL schema entities

```typescript
// project-context.model.ts

export type PrdSectionType = 'overview' | 'objectives' | 'requirements' | 'constraints'
  | 'assumptions' | 'acceptance_criteria' | 'out_of_scope';

export interface PrdSection {
  id: string;
  type: PrdSectionType;
  title: string;
  content: string;           // markdown
  sourceDocuments: string[];
  sortOrder: number;
}

export interface ProjectPrd {
  id: string;
  projectId: string;
  title: string;
  summary: string;           // markdown
  sections: PrdSection[];
  created: string;
  updated: string;
}

export type PlanPhaseStatus = 'planned' | 'active' | 'completed';

export interface PlanMilestone {
  id: string;
  name: string;
  targetDate: string | null;
  status: PlanPhaseStatus;
  deliverables: string[];
  sortOrder: number;
}

export interface ProjectPlan {
  id: string;
  projectId: string;
  title: string;
  approach: string;          // markdown
  milestones: PlanMilestone[];
  estimatedDuration: string;
  teamStructure: string;     // markdown
  created: string;
  updated: string;
}

export interface ProjectContext {
  project: SmeProject;
  boards: SmeBoard[];
  prd: ProjectPrd | null;
  plan: ProjectPlan | null;
  boardSummaries: BoardSummary[];
}
```

---

## Neon Tables

### SmeBoards

```sql
CREATE TABLE sme_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('org','boundary','project','user')),
  partition TEXT NOT NULL CHECK (partition IN ('buyer','provider','shared','engagement-setup','closeout','audit')),
  parent_id UUID NOT NULL,                     -- FK → org/boundary/project/user (polymorphic)
  activity_ids UUID[] NOT NULL DEFAULT '{}',    -- activities on this board (superset for UI)
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No issue_prefix: activity declares prefix
  -- No issue counter: org-scoped per activity prefix
  -- No roles: uses parent's roles
);

CREATE INDEX idx_sb_parent ON sme_boards(parent_id);
CREATE INDEX idx_sb_partition ON sme_boards(partition);
```

### SmeWorkflows

```sql
CREATE TABLE sme_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  package_code TEXT NOT NULL DEFAULT 'w3geekery.sme-mart',
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  statuses TEXT[] NOT NULL,
  transitions JSONB NOT NULL DEFAULT '[]',
  defaults JSONB,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### SmeActivities

```sql
CREATE TABLE sme_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sme-activity',
  owner_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES sme_workflows(id),
  code TEXT NOT NULL UNIQUE,
  package_code TEXT NOT NULL DEFAULT 'w3geekery.sme-mart',
  activity_type TEXT NOT NULL DEFAULT 'task',
  issue_prefix TEXT NOT NULL,                   -- Kevin: activity declares prefix (sec-, gap-, mst-)
  extends_activity_id UUID REFERENCES sme_activities(id),  -- Kevin: activity can extend another
  estimated_time TEXT,
  responsible TEXT[] NOT NULL DEFAULT '{}',
  accountable TEXT[] NOT NULL DEFAULT '{}',
  consulted TEXT[] NOT NULL DEFAULT '{}',
  informed TEXT[] NOT NULL DEFAULT '{}',
  links JSONB NOT NULL DEFAULT '[]',
  custom_fields TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  parent_id UUID REFERENCES sme_activities(id),
  boundary_id UUID,
  activity_group TEXT,
  task_name_template TEXT,
  on_transition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### SmeTasks

```sql
CREATE TABLE sme_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  board_id UUID NOT NULL REFERENCES sme_boards(id),
  activity_id UUID NOT NULL REFERENCES sme_activities(id),
  code TEXT NOT NULL,                              -- activity prefix + org counter (e.g. "sec-12345")
  rank TEXT NOT NULL DEFAULT '1',                   -- Kevin: OID/arbitrary precision (not integer)
  phase_code TEXT,                                  -- Kevin: kanban column. Rank applies within phase.
  status TEXT NOT NULL,
  priority JSONB NOT NULL DEFAULT '{"label":"Normal","value":200}',
  parent_id UUID REFERENCES sme_tasks(id),         -- Kevin: "task owned by board OR another task"
  boundary_id UUID,
  description TEXT,
  assigned JSONB,
  accountable JSONB,
  approvers JSONB NOT NULL DEFAULT '[]',
  notified JSONB NOT NULL DEFAULT '[]',
  custom_fields JSONB,
  due_date DATE,
  source_document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_st_board ON sme_tasks(board_id);
CREATE INDEX idx_st_activity ON sme_tasks(activity_id);
CREATE INDEX idx_st_parent ON sme_tasks(parent_id);
CREATE INDEX idx_st_status ON sme_tasks(board_id, status);
CREATE INDEX idx_st_phase ON sme_tasks(board_id, phase_code);
```

### SmeProjects

```sql
CREATE TABLE sme_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','review','completed','cancelled')),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('org','boundary')),  -- Kevin: owned by Org or Boundary
  owner_id UUID NOT NULL,                                            -- FK → org or boundary
  engagement_id UUID,                                                -- SME Mart link to engagement (optional)
  boundary_ids UUID[] NOT NULL DEFAULT '{}',
  boundary_names TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  start_date DATE,
  target_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sp_owner ON sme_projects(owner_id);
CREATE INDEX idx_sp_engagement ON sme_projects(engagement_id);
```

### PRD + Plan

```sql
CREATE TABLE project_prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES sme_projects(id),
  title TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prd_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID NOT NULL REFERENCES project_prds(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('overview','objectives','requirements','constraints','assumptions','acceptance_criteria','out_of_scope')),
  title TEXT NOT NULL,
  content TEXT,
  source_documents TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE project_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES sme_projects(id),
  title TEXT NOT NULL,
  approach TEXT,
  estimated_duration TEXT,
  team_structure TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES project_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed')),
  deliverables TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_prds_project ON project_prds(project_id);
CREATE INDEX idx_plans_project ON project_plans(project_id);
```

### VIEW (consolidated task read)

```sql
CREATE OR REPLACE VIEW v_sme_tasks AS
SELECT
  t.*,
  b.partition AS board_partition,
  b.name AS board_name,
  a.name AS activity_name,
  a.issue_prefix AS activity_prefix,
  a.workflow_id,
  p.name AS parent_name,
  (SELECT COUNT(*) FROM sme_tasks c WHERE c.parent_id = t.id) AS child_count
FROM sme_tasks t
JOIN sme_boards b ON t.board_id = b.id
JOIN sme_activities a ON t.activity_id = a.id
LEFT JOIN sme_tasks p ON t.parent_id = p.id;
```

---

## Services

```
SmeBoardService
├── getBoards(projectId): Observable<SmeBoard[]>
├── getBoard(id): Observable<SmeBoard>
├── getBoardsByPartition(projectId, partition): Observable<SmeBoard[]>
├── createBoard(board): Observable<SmeBoard>
├── nextIssueCode(boardId): Observable<string>     // auto-increment + prefix
└── getBoardSummaries(projectId): Observable<BoardSummary[]>

SmeActivityService
├── getActivities(): Observable<SmeActivity[]>     // all available activity types
├── getActivity(id): Observable<SmeActivity>
├── createActivity(activity): Observable<SmeActivity>
└── getWorkflow(workflowId): Observable<SmeWorkflow>

SmeTaskService
├── getTasks(boardId): Observable<SmeTask[]>        // all tasks on a board
├── getTask(id): Observable<SmeTask>
├── getChildTasks(parentId): Observable<SmeTask[]>
├── createTask(task): Observable<SmeTask>           // auto-assigns code from board
├── updateStatus(taskId, status): Observable<SmeTask>
├── updateRank(taskId, newRank): Observable<void>
├── buildTree(tasks: SmeTask[], workflow: SmeWorkflow): SmeTaskTreeNode[]
└── resolveTransitions(task: SmeTask, workflow: SmeWorkflow): SmeWorkflowTransition[]

SmeProjectService
├── getProject(id): Observable<Project>
├── getProjectByEngagement(engagementId): Observable<Project | null>
├── createProject(project): Observable<Project>
├── getPrd(projectId): Observable<ProjectPrd | null>
└── getPlan(projectId): Observable<ProjectPlan | null>
```

All use `SmeMartDbService` (Neon HTTP mode).

---

## Components

```
ProjectView (NEW — top-level project container)
  ├── ProjectHeader (boundary badges, project status, dates)
  ├── ProjectContextBar (collapsible PRD + Plan)
  │   ├── PrdPanel (accordion sections, markdown)
  │   └── PlanPanel (milestones stepper, approach)
  │
  └── BoardPartitionTabs (mat-tab-group: role-filtered)
      │   Buyer role  → shows: Buyer board + Shared board tabs
      │   Provider role → shows: Provider board + Shared board tabs
      │   Both role → shows: all 3 (admin/demo only)
      │   Driven by UserPreferencesService.userRole signal
      ├── BoardSummaryBar (progress per visible board)
      ├── TaskFilterChipBar (static quick-filters: All, Critical, Overdue, Blocked)
      └── per tab:
          └── SmeTaskList (tasks on this board)
              └── SmeTaskRow (recursive, expandable)
                  ├── Issue code (e.g. BUY-001) with board prefix
                  ├── Status chip (workflow-aware, color-coded)
                  ├── Transition menu (from SmeWorkflow.transitions via activity)
                  ├── Activity type badge
                  ├── Priority badge
                  ├── Assigned-to
                  ├── Due date
                  └── Children (recursive SmeTaskRow)
```

### File Locations

```
src/app/core/models/sme-board.model.ts
src/app/core/models/sme-activity.model.ts
src/app/core/models/sme-workflow.model.ts
src/app/core/models/sme-task.model.ts
src/app/core/models/sme-project.model.ts
src/app/core/models/project-context.model.ts    (PRD + Plan)
src/app/core/services/sme-board.service.ts
src/app/core/services/sme-board.service.spec.ts
src/app/core/services/sme-activity.service.ts
src/app/core/services/sme-activity.service.spec.ts
src/app/core/services/sme-task.service.ts
src/app/core/services/sme-task.service.spec.ts
src/app/core/services/sme-project.service.ts
src/app/core/services/project.service.spec.ts
src/app/shared/components/project-view/
src/app/shared/components/project-context-bar/
src/app/shared/components/board-partition-tabs/
src/app/shared/components/sme-task-list/
src/app/shared/components/sme-task-row/
src/app/shared/components/board-summary-bar/
src/app/shared/components/task-filter-chip-bar/
```

---

## GQL Schema Entities (extend PR #3)

New classes to add to `zerobias-org/schema/package/w3geekery/sme-mart/`:

| Entity | GQL Base | Key Fields | Links |
|--------|----------|------------|-------|
| **SmeMartProject** | `Object` | status, startDate, targetEndDate, description | → Engagement (existing), boundaryIds (string[]) |
| **SmeMartBoard** | `Object` | scope, partition, issuePrefix, nextIssueNumber, description | → SmeMartProject, boundaryIds (string[]), defaultWorkflowId (string) |
| **SmeMartActivity** | `Object` | activityType, estimatedTime, responsible[], accountable[], consulted[], informed[], customFields[], taskNameTemplate | → SmeMartWorkflow (via workflowId string) |
| **SmeMartWorkflow** | `Object` | statuses[], transitions (JSONB), defaults (JSONB) | standalone |
| **SmeMartTask** | `Object` | code, rank, status, priority (JSONB), dueDate, sourceDocument | → SmeMartBoard, → SmeMartActivity, parentId (self-ref for subtasks) |
| **ProjectPrd** | `Object` | title, summary | → SmeMartProject |
| **PrdSection** | `Object` | type (enum), title, content, sourceDocuments[], sortOrder | → ProjectPrd |
| **ProjectPlan** | `Object` | title, approach, estimatedDuration, teamStructure | → SmeMartProject |
| **PlanMilestone** | `Object` | name, targetDate, status (enum), deliverables[], sortOrder | → ProjectPlan |

New enums:

| Enum | Values |
|------|--------|
| `project.status` | `PLANNING`, `ACTIVE`, `REVIEW`, `COMPLETED`, `CANCELLED` |
| `board.scope` | `ORG`, `BOUNDARY`, `PROJECT`, `USER` |
| `board.partition` | `BUYER`, `PROVIDER`, `SHARED`, `ENGAGEMENT_SETUP`, `CLOSEOUT`, `AUDIT` |
| `prd.sectionType` | `OVERVIEW`, `OBJECTIVES`, `REQUIREMENTS`, `CONSTRAINTS`, `ASSUMPTIONS`, `ACCEPTANCE_CRITERIA`, `OUT_OF_SCOPE` |
| `planMilestone.status` | `PLANNED`, `ACTIVE`, `COMPLETED` |

**Note:** `SmeMartBoard` and `SmeMartActivity` use the `SmeMart` prefix to avoid collision with future platform Board/Activity entities. When platform ships these, the GQL entities stay (they're our custom schema) but can reference or wrap the platform equivalents.

**Schema repo:** `~/Projects/zb/zerobias-org/schema/package/w3geekery/sme-mart/`
**Existing classes:** Engagement, Bid, BidResponse, ServiceOffering, Review, Note, NoteFolder, SmeMartDocument

---

## Migration Path

| Now (Neon) | GQL Schema | Then (Platform) | Migration |
|---|---|---|---|
| `sme_boards` table | `SmeMartBoard` class | `Board` from platform | GQL entity wraps/references platform Board |
| `sme_activities` table | `SmeMartActivity` class | `Activity` from platform-sdk | Swap service to `ActivityApi`, GQL entity references platform Activity |
| `sme_workflows` table | `SmeMartWorkflow` class | `WorkflowExtended` from platform-sdk | Swap service to `WorkflowApi` |
| `sme_tasks` table | `SmeMartTask` class | `TaskExtended` from platform-sdk | Swap service to `TaskApi` with board + activity refs |
| `sme_projects` table | `SmeMartProject` class | Platform Project entity | GQL entity wraps/references platform Project |
| `project_prds` table | `ProjectPrd` class | stays in GQL | SME Mart concept, no platform equivalent |
| `project_plans` table | `ProjectPlan` class | stays in GQL | SME Mart concept, no platform equivalent |

**Dual-write strategy:** Neon for fast reads (MVP), GQL for platform integration (receiver pipeline). Services write to Neon first, then push to GQL via batch pipeline when ready.

---

## Phases

### Phase 1 — Backend + Models + GQL Schema (3.5 hrs)

1. Create all Neon tables via MCP `run_sql_transaction` (sme_boards, sme_workflows, sme_activities, sme_tasks, sme_projects, project_prds, prd_sections, project_plans, plan_milestones, v_sme_tasks view)
2. Write model files: `sme-board.model.ts`, `sme-activity.model.ts`, `sme-workflow.model.ts`, `sme-task.model.ts`, `sme-sme-project.model.ts`, `project-context.model.ts`
3. Write services: `SmeBoardService`, `SmeActivityService`, `SmeTaskService`, `SmeSmeProjectService`
4. Unit tests for tree builder, transition resolver, board summaries, issue code generation
5. GQL schema YAML: add 9 new classes + 5 new enums to `zerobias-org/schema/package/w3geekery/sme-mart/` (SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask, ProjectPrd, PrdSection, ProjectPlan, PlanMilestone). Verify with `npm run verify`.

### Phase 2 — Task UI + Demo Data (4.5 hrs)

1. `SmeTaskRow` — recursive row with issue code, expand/collapse, workflow-aware status chip + transition menu, activity badge, priority, assigned, due date
2. `BoardSummaryBar` — progress bars (visible boards only, role-filtered)
3. `BoardPartitionTabs` — mat-tab-group, role-filtered (buyer→Buyer+Shared, provider→Provider+Shared, both→all 3), renders SmeTaskList per board tab
4. `TaskFilterChipBar` — static quick-filter chips: "All", "Critical Path", "Overdue", "Blocked". Client-side filter. (Full saved task views = Plan 058)
5. Seed demo data: crystal-harbor SOC 2 → project → 3 boards + 3 workflows + activities → 39 tasks + ~156 subtasks
6. Wire into engagement detail

### Phase 3 — PRD + Plan + ProjectView (2.5 hrs)

1. `PrdPanel` — collapsible accordion sections with markdown rendering
2. `PlanPanel` — milestones list with status badges, approach markdown
3. `ProjectContextBar` — collapsible container for PRD + Plan
4. `ProjectView` — combines ProjectHeader + ProjectContextBar + BoardPartitionTabs
5. Seed demo PRD (7 sections) + Plan (6 milestones)

### Phase 4 — Integration + Polish (2 hrs)

1. Wire ProjectView into engagement detail route
2. Status transition click → Neon update → optimistic UI using SmeWorkflow transitions
3. Empty states (no project yet, no PRD, no tasks)
4. Loading skeletons
5. Screenshot for Brian

### Phase 5 — Tests (1.5 hrs)

1. Spec files for all new components + services
2. Update PLAN.md

---

## Demo Data: crystal-harbor (SOC 2 Assessment)

### 3 Workflows

- **Buyer Requirements Workflow:** backlog → todo → in_progress → in_review → done
- **Provider Deliverables Workflow:** backlog → todo → in_progress → awaiting_approval → done
- **Shared Milestones Workflow:** planned → active → blocked → completed

### Reusable Activities (work type blueprints — each declares issue prefix)

| Activity | Code | Issue Prefix | Workflow | Used by boards |
|----------|------|-------------|----------|---------------|
| Security Assessment | `sme-mart.security-assessment` | `sec-` | buyer-workflow | Buyer |
| Compliance Review | `sme-mart.compliance-review` | `cmp-` | buyer-workflow | Buyer |
| Policy Review | `sme-mart.policy-review` | `pol-` | buyer-workflow | Buyer |
| Gap Assessment | `sme-mart.gap-assessment` | `gap-` | provider-workflow | Provider |
| Report Delivery | `sme-mart.report-delivery` | `rpt-` | provider-workflow | Provider |
| Evidence Collection | `sme-mart.evidence-collection` | `evi-` | provider-workflow | Provider |
| Milestone Review | `sme-mart.milestone-review` | `mst-` | shared-workflow | Shared |
| Payment Gate | `sme-mart.payment-gate` | `pay-` | shared-workflow | Shared |

**Issue code = activity prefix + org-scoped counter** (e.g. `sec-12345` is unique across the entire org, not just one board).

### 3 Boards (structural containers under Project)

| Board | Partition | Parent | Activities |
|-------|-----------|--------|-----------|
| Buyer Requirements | buyer | Project (inherits Boundary A perms) | sec-, cmp-, pol- |
| Provider Deliverables | provider | Project (inherits Boundary B perms) | gap-, rpt-, evi- |
| Shared Milestones | shared | Project (inherits both A+B perms) | mst-, pay- |

### Buyer Board (13 tasks, ~53 subtasks)
- sec-1: SOC 2 Type II Readiness Assessment (activity: Security Assessment, 4 subtasks)
- pol-2: Access Control Policy Review (activity: Policy Review, 5 subtasks)
- cmp-3: Change Management Evaluation (activity: Compliance Review, 4 subtasks)
- sec-4: Incident Response Testing (activity: Security Assessment, 3 subtasks)
- sec-5: Risk Assessment (activity: Security Assessment, 5 subtasks)
- cmp-6: Business Continuity Review (activity: Compliance Review, 4 subtasks)
- cmp-7: Vendor Management Assessment (activity: Compliance Review, 3 subtasks)
- sec-8: Data Classification Audit (activity: Security Assessment, 4 subtasks)
- sec-9: Network Security Review (activity: Security Assessment, 5 subtasks)
- sec-10: Physical Security Inspection (activity: Security Assessment, 3 subtasks)
- pol-11: HR Security Controls (activity: Policy Review, 4 subtasks)
- sec-12: Encryption Standards Review (activity: Security Assessment, 3 subtasks)
- sec-13: Logging & Monitoring Evaluation (activity: Security Assessment, 4 subtasks)

### Provider Board (13 tasks, ~57 subtasks)
- gap-14: Gap Analysis Report (activity: Gap Assessment, 5 subtasks)
- gap-15: Control Mapping Document (activity: Gap Assessment, 6 subtasks)
- gap-16: Risk Register (activity: Gap Assessment, 4 subtasks)
- rpt-17: Remediation Roadmap (activity: Report Delivery, 5 subtasks)
- evi-18: Evidence Collection Package (activity: Evidence Collection, 6 subtasks)
- rpt-19: Policy Template Drafts (activity: Report Delivery, 5 subtasks)
- rpt-20: Technical Configuration Guide (activity: Report Delivery, 4 subtasks)
- rpt-21: Training Materials (activity: Report Delivery, 3 subtasks)
- evi-22: Penetration Test Coordination (activity: Evidence Collection, 4 subtasks)
- evi-23: Audit Prep Checklist (activity: Evidence Collection, 5 subtasks)
- rpt-24: Executive Summary Deck (activity: Report Delivery, 3 subtasks)
- rpt-25: Compliance Dashboard Setup (activity: Report Delivery, 4 subtasks)
- rpt-26: Knowledge Transfer Package (activity: Report Delivery, 3 subtasks)

### Shared Board (13 tasks, ~46 subtasks)
- mst-27: Kickoff Meeting (activity: Milestone Review, 3 subtasks)
- mst-28: Stakeholder Identification (activity: Milestone Review, 3 subtasks)
- mst-29: Project Schedule Approval (activity: Milestone Review, 4 subtasks)
- mst-30: Weekly Status Reviews (activity: Milestone Review, 3 subtasks)
- mst-31: Milestone 1 — Discovery Complete (activity: Milestone Review, 4 subtasks)
- mst-32: Milestone 2 — Assessment Complete (activity: Milestone Review, 4 subtasks)
- mst-33: Milestone 3 — Remediation Plan Approved (activity: Milestone Review, 3 subtasks)
- mst-34: UAT / Evidence Review (activity: Milestone Review, 5 subtasks)
- rpt-35: Final Report Delivery (activity: Report Delivery, 3 subtasks)
- mst-36: Client Sign-off (activity: Milestone Review, 2 subtasks)
- pay-37: Payment Gate — 80% Milestone (activity: Payment Gate, 3 subtasks)
- pay-38: Payment Gate — Final 20% (activity: Payment Gate, 2 subtasks)
- mst-39: Engagement Closeout (activity: Milestone Review, 4 subtasks)

**Total: 39 tasks, ~156 subtasks across 3 boards, using 8 reusable activities with org-scoped issue codes**

### PRD + Plan
*(SOC 2 PRD with 7 sections, Plan with 6 milestones — unchanged from prior draft)*

---

## Boundary & Access Model (Brian + Kevin + Chris directives 2026-03-16)

Projects map to **1+ Boundaries**. Each Board inherits permissions from its associated boundary(ies). Shared board inherits from both with potential overrides.

```
Project.boundaryIds → SmeBoard.boundaryIds → permissions inherited
                                              (shared board: both boundaries + overrides)
```

- **Buyer board** → inherits Boundary A (demand-side) → defines WHAT gets accessed
- **Provider board** → inherits Boundary B (supply-side) → operates WITHIN access perimeter
- **Shared board** → inherits both A+B (transparency) → joint visibility, customizable

MVP: boundary association displayed on ProjectView header. Permission enforcement deferred to platform Board API.

---

## What's NOT in MVP

- AI RFP decomposition into tasks (Plan 040 Phase 2+)
- AI-generated PRDs from meeting transcripts (future — Claude Agent SDK)
- Platform Board/Activity/Workflow API integration (blocked on Kevin/Chris)
- Boundary permission enforcement (platform feature)
- Per-agent least-privilege enforcement (agentic governance Phase 2)
- PRD/Plan editing (read-only in MVP)
- Saved Task Views with criteria builder (Plan 058)
- Board management UI — create/rename/delete custom boards (Plan 058)
- Board permission override UI (Plan 058)
- Drag-and-drop rank reorder
- Bulk status updates
- Mobile responsive layout

---

## Success Criteria

- [ ] SmeBoard/SmeActivity/SmeWorkflow as distinct models with correct separation
- [ ] Tasks reference both boardId (structural) and activityId (behavioral)
- [ ] Issue codes auto-generated from activity prefix + org-scoped counter (sec-1, gap-14, mst-27)
- [ ] 3 workflows with distinct status sets and transitions
- [ ] Activities reusable across boards
- [ ] ProjectView shows PRD panel (collapsible) with sections
- [ ] ProjectView shows Plan panel (collapsible) with milestones
- [ ] Boundary associations displayed on project header
- [ ] Role-filtered tabs: buyer sees Buyer+Shared, provider sees Provider+Shared
- [ ] ~39 top-level tasks populate correctly across board tabs
- [ ] Expandable rows show nested subtasks
- [ ] Status chips with color coding (workflow-aware via activity)
- [ ] Transition menu shows valid next transitions per workflow
- [ ] Status click updates Neon and UI optimistically
- [ ] Progress bar per board shows completion %
- [ ] TaskFilterChipBar with quick-filters (All, Critical, Overdue, Blocked)
- [ ] Zero console errors
- [ ] Demo walkthrough < 2 minutes
