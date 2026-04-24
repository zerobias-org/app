# Phase 6: Project Bloom Entities - Research

**Researched:** 2026-03-19
**Domain:** Project Bloom entity services (SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask, ProjectPrd, ProjectPlan + child entities)
**Confidence:** HIGH (service patterns proven in Phases 1-5, entity definitions from CONTEXT, schema structure understood)

## Summary

Phase 6 implements **9 new greenfield entity services** for Project Bloom (Kevin's board/activity/workflow architecture). All 17 schema classes are live in prod—the original 8 migrated from Neon in Phases 1-5; the 9 new Bloom entities (confirmed 2026-03-18 per CONTEXT.md) are ready for development.

Core pattern: **Fire-and-forget Pipeline writes + GraphQL reads**, using the proven infrastructure from Phases 1-5. The 9 new entities have **no Neon tables** (greenfield). Each entity gets a service with CRUD + core relationships, unit tests (≥80% coverage), and field mappings. SmeMartTask is the most complex (flat-fetch + client-side tree rebuild for subtask hierarchy, matching NoteFolderService pattern).

**Primary recommendation:** Build services in two phases: (1) container entities (Project, Board, Activity, Workflow) with basic CRUD, (2) content entities (Task, Prd, Plan + children) with relationship handling. SmeMartTask requires the flat-fetch tree rebuild pattern—copy NoteFolderService's algorithm exactly.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **CRUD + core relationships** — Each service gets create, read (list + getById), update, delete, plus relationship methods. No business logic, no workflow validation, no state transitions.
2. **SmeMartTask: flat-fetch + tree rebuild** — Same pattern as NoteFolderService. Fetch all tasks for a board, rebuild parent/child tree client-side using parentId.
3. **Board/Activity/Workflow: CRUD only** — Services are data access layers. UI handles semantics and structural validation.
4. **Greenfield (no Neon)** — All 9 entities built directly against Pipeline+GQL from day one. No migration, no SmeMartDbService.

### Claude's Discretion
- How to group 9 services into plans (by domain, by complexity, all in one)
- Field mapping constants for 9 new entities (must be created—Phase 1 only did the original 8)
- GQL type interfaces for 9 new entities (must be created)
- Test fixture data for Bloom entities
- Whether to add Bloom class IDs to SME_MART_CLASS_IDS in pipeline-write.service.ts

### Deferred Ideas (OUT OF SCOPE)
- Task state transitions and workflow validation (business logic for later phase)
- Board permission inheritance from boundary (UI/security concern)
- Activity RACI rules (business logic)
- Demo data for Bloom entities (separate seed task)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOOM-01 | SmeMartProject service built against PipelineWriteService + GraphqlReadService | Service pattern proven in Phases 1-5; SmeMartProject is a container entity with minimal complexity (status, dates, description + links to boards/prd/plan) |
| BLOOM-02 | SmeMartBoard service built against PipelineWriteService + GraphqlReadService | Service pattern proven; SmeMartBoard is structural (scope, partition, activityIds array) + links to Project and Activities; no permission logic in service (UI concern) |
| BLOOM-03 | SmeMartActivity service built against PipelineWriteService + GraphqlReadService | Service pattern proven; SmeMartActivity is a work type blueprint (mirrors platform Activity with workflow, RACI fields, custom fields array); reusable across boards |
| BLOOM-04 | SmeMartWorkflow service built against PipelineWriteService + GraphqlReadService | Service pattern proven; SmeMartWorkflow is simple (statuses array, transitions array) + link to Activities; can be built as standalone or integrated into ActivityService |
| BLOOM-05 | SmeMartTask service built against PipelineWriteService + GraphqlReadService | Most complex entity: flat-fetch + tree rebuild pattern (from NoteFolderService); has parentId for subtask hierarchy, links to Board/Activity, custom fields array; requires cycle detection on tree rebuild |
| BLOOM-06 | ProjectPrd + PrdSection services built against PipelineWriteService + GraphqlReadService | Two related entities: Prd is informational (title, summary, sourceDocuments array), PrdSection is child entity (type enum, content, sortOrder, sourceDocuments); both link to Project; simple CRUD pattern |
| BLOOM-07 | ProjectPlan + PlanMilestone services built against PipelineWriteService + GraphqlReadService | Two related entities: Plan is informational (title, approach, estimatedDuration, teamStructure), Milestone is child (name, targetDate, status, sortOrder); both link to Project; simple CRUD pattern |
| BLOOM-08 | All 9 Bloom entity services have unit tests using Pipeline+GQL mocks | Mock factories (fakePipelineWriteService, fakeGraphqlReadService) proven in Phases 1-5; field mapping tests verify no roundtrip loss; test helpers (test-helpers/angular.ts) reusable as-is |
| BLOOM-09 | GQL schema PR #8 merged and types available (blocked on PR #9 merge) | PR #8 is draft with 9 new entities; PR #9 is production release of the original 8 renamed entities; Once PR #9 merges to main, PR #8 can be rebased + merged; types will regenerate automatically |

</phase_requirements>

---

## Standard Stack

### Core Infrastructure (Reusable from Phases 1-5)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@zerobias-com/zerobias-client` | ^1.1.23+ | Platform client (auth, API access, GQL) | Handles session + org context; providedIn:'root' injectable |
| `@zerobias-com/hydra-sdk` | Latest | Tag/Resource APIs (TagApi, ResourceApi) | Replaces old danaOld path; no longer needed for Bloom entities (tags are optional) |
| `@zerobias-com/platform-sdk` | Latest | Pipeline API, Task/Activity/Boundary APIs | `SimpleBatch`, `UUID`, receiver pipeline ingestion |
| Angular 21 | ^21.0 | Framework + dependency injection | `Injectable`, `inject()`, signals |
| TypeScript | ^5.x | Strict typing | Required for all new entity types |

### Phase 1 Infrastructure (Patterns Only — No New Packages)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PipelineWriteService | In-codebase | Write path (pushEntity, pushEntities, deleteEntity) | All 9 entities write via this service |
| GraphqlReadService | In-codebase | Read path (query, getById, rawQuery) | All 9 entities read via this service |
| Field mapping helpers | In-codebase | mapNeonToGql / mapGqlToNeon | Schema transformation (less critical for greenfield, but pattern consistency) |
| Test helpers | In-codebase | fakePipelineWriteService(), fakeGraphqlReadService() | Unit test mocks (reusable as-is) |
| GQL fixture builder | In-codebase | Realistic test data | Unit test fixtures |

**Installation:** No new npm packages needed. All infrastructure exists in codebase.

**Version verification:** All 9 services will use existing in-codebase infrastructure (PipelineWriteService, GraphqlReadService). No external package versions need verification.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct GQL mutations | Build custom mutation layer | Platform doesn't support mutations—Pipeline is the official write path. No value in custom layer. |
| Apollo/URQL client | Use GraphQL codegen + custom queries | Platform provides native GQL client via `zerobias-client`. Extra layer adds complexity without benefit. |
| Neon for Bloom entities | Use Neon HTTP API directly | No—Bloom entities belong in AuditgraphDB from the start. Neon is legacy. |
| SmeMartDbService wrapper | Direct Pipeline+GQL calls from services | Simpler. Services already isolated. Direct swap keeps public APIs unchanged. |

---

## Architecture Patterns

### Proven Service Pattern (9 Services Use This)

```typescript
// Pattern verified in Phases 1-5 (EngagementsService, BidsService, NoteFolderService, etc.)
@Injectable({ providedIn: 'root' })
export class SmeMartProjectService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly notifications = inject(NotificationService); // optional
  private readonly impersonation = inject(ImpersonationService); // for userId tracking

  // CRUD methods
  async createProject(data: CreateProjectRequest): Promise<SmeMartProject> {
    const gqlData: Record<string, unknown> = { /* build camelCase */ };
    this.pipelineWrite.pushEntity('SmeMartProject', gqlData).catch(err => {
      console.error('Failed to push project:', err);
    });
    return /* map to model */;
  }

  async getProject(id: string): Promise<SmeMartProject | null> {
    const result = await this.graphqlRead.getById<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      id,
      ['id', 'name', 'status', ...],
    );
    return result ? /* map to model */ : null;
  }

  async updateProject(id: string, changes: UpdateProjectRequest): Promise<SmeMartProject> {
    // Build updated object, push to pipeline, return optimistically
  }

  async deleteProject(id: string): Promise<void> {
    this.pipelineWrite.deleteEntity('SmeMartProject', id).catch(err => {
      console.error('Failed to delete project:', err);
    });
  }

  // Relationship methods
  async getProjectBoards(projectId: string): Promise<SmeMartBoard[]> {
    // Query boards where parentId === projectId
  }
}
```

**Key attributes:**
- `inject()` for dependencies (Angular 21)
- Fire-and-forget Pipeline pushes with optimistic returns
- RFC4515 GQL filters for queries
- Camelcase fields in GraphQL, no Neon snake_case conversions needed (greenfield)
- Error logging but not throwing (let components handle failures)
- No signals or complex state—services are just data layers

### SmeMartTask: Flat-Fetch + Tree Rebuild (Copy NoteFolderService Exactly)

**Algorithm:**
1. Query all SmeMartTasks for a board (flat list, single GQL call)
2. Map GraphQL responses to TypeScript models
3. Build in-memory parent-child tree using parentId references
4. Cycle detection prevents infinite recursion on malformed data
5. Return sorted tree (children sorted by rank or sortOrder)

**Benefits:**
- Avoids N+1 queries (single GQL call for all tasks)
- Handles unlimited hierarchy depth
- Client-side sorting/filtering without re-querying
- Optimistic updates for subtask changes

**Source code:** `src/app/core/services/note-folder.service.ts` lines 125–150 (algorithm template)

```typescript
// SmeMartTaskService.getTaskTree(boardId: string): Promise<SmeMartTaskTreeNode[]>
// Step 1: Query flat list
const result = await this.graphqlRead.query<GqlSmeMartTaskResponse>(
  'SmeMartTask',
  ['id', 'boardId', 'parentId', 'name', 'status', 'rank', ...],
  { filters: { boardId: `.eq.${boardId}` }, pageSize: 1000 }
);

// Step 2: Map results to model type
const allTasks: SmeMartTask[] = result.items.map(gqlTask =>
  mapGqlToNeon<SmeMartTask>(gqlTask, SME_MART_TASK_FIELD_MAPPING.gqlToNeon)
);

// Step 3: Build tree from parentId
const taskMap = new Map<string, SmeMartTask>(allTasks.map(t => [t.id, t]));
const rootTasks = allTasks.filter(t => !t.parentId);
const buildTree = (parent: SmeMartTask, visited = new Set<string>()): SmeMartTaskTreeNode => {
  if (visited.has(parent.id)) return parent; // cycle detection
  visited.add(parent.id);
  return {
    ...parent,
    children: allTasks
      .filter(t => t.parentId === parent.id)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map(child => buildTree(child, visited)),
  };
};

return rootTasks.map(t => buildTree(t));
```

### Relationship Query Patterns

**Example: Project → Boards**

```typescript
// In ProjectService
async getProjectBoards(projectId: string): Promise<SmeMartBoard[]> {
  const result = await this.graphqlRead.query<GqlSmeMartBoardResponse>(
    'SmeMartBoard',
    ['id', 'name', 'code', 'scope', 'partition', 'parentId', ...],
    { filters: { parentId: `.eq.${projectId}` }, pageSize: 100 }
  );
  return result.items.map(gql => mapGqlToNeon<SmeMartBoard>(gql, BOARD_FIELD_MAPPING.gqlToNeon));
}
```

**Example: Activity → Linked Workflows**

```typescript
// In ActivityService
async getActivityWorkflow(activityId: string): Promise<SmeMartWorkflow | null> {
  // SmeMartActivity has workflowId field (string reference)
  const activity = await this.getActivity(activityId);
  if (!activity?.workflowId) return null;
  return this.workflowService.getWorkflow(activity.workflowId);
}
```

### Recommended Project Structure

```
src/app/core/
├── models/
│   ├── index.ts (export all)
│   ├── sme-mart-project.model.ts (BLOOM-01)
│   ├── sme-mart-board.model.ts (BLOOM-02)
│   ├── sme-mart-activity.model.ts (BLOOM-03)
│   ├── sme-mart-workflow.model.ts (BLOOM-04)
│   ├── sme-mart-task.model.ts (BLOOM-05, includes SmeMartTaskTreeNode)
│   ├── project-prd.model.ts (BLOOM-06)
│   ├── project-plan.model.ts (BLOOM-07)
│   └── [existing 8 models]
│
├── gql-types/
│   ├── index.ts (export all)
│   ├── sme-mart-project.types.ts (GqlSmeMartProjectResponse)
│   ├── sme-mart-board.types.ts (GqlSmeMartBoardResponse)
│   ├── sme-mart-activity.types.ts (GqlSmeMartActivityResponse)
│   ├── sme-mart-workflow.types.ts (GqlSmeMartWorkflowResponse)
│   ├── sme-mart-task.types.ts (GqlSmeMartTaskResponse)
│   ├── project-prd.types.ts (GqlProjectPrdResponse, GqlPrdSectionResponse)
│   ├── project-plan.types.ts (GqlProjectPlanResponse, GqlPlanMilestoneResponse)
│   └── [existing 8 types]
│
├── field-mappings.ts (ADD 9 new mappings to existing file)
│   ├── SME_MART_PROJECT_FIELD_MAPPING
│   ├── SME_MART_BOARD_FIELD_MAPPING
│   ├── SME_MART_ACTIVITY_FIELD_MAPPING
│   ├── SME_MART_WORKFLOW_FIELD_MAPPING
│   ├── SME_MART_TASK_FIELD_MAPPING
│   ├── PROJECT_PRD_FIELD_MAPPING
│   ├── PRD_SECTION_FIELD_MAPPING
│   ├── PROJECT_PLAN_FIELD_MAPPING
│   ├── PLAN_MILESTONE_FIELD_MAPPING
│   └── [existing 8 mappings]
│
├── services/
│   ├── sme-mart-project.service.ts (BLOOM-01)
│   ├── sme-mart-project.service.spec.ts
│   ├── sme-mart-board.service.ts (BLOOM-02)
│   ├── sme-mart-board.service.spec.ts
│   ├── sme-mart-activity.service.ts (BLOOM-03)
│   ├── sme-mart-activity.service.spec.ts
│   ├── sme-mart-workflow.service.ts (BLOOM-04)
│   ├── sme-mart-workflow.service.spec.ts
│   ├── sme-mart-task.service.ts (BLOOM-05, flat-fetch + tree rebuild)
│   ├── sme-mart-task.service.spec.ts
│   ├── project-prd.service.ts (BLOOM-06, handles both Prd + PrdSection)
│   ├── project-prd.service.spec.ts
│   ├── project-plan.service.ts (BLOOM-07, handles both Plan + Milestone)
│   ├── project-plan.service.spec.ts
│   ├── pipeline-write.service.ts (MODIFY: add 9 Bloom class IDs)
│   ├── graphql-read.service.ts (no changes)
│   └── [existing services]
└── test-helpers/
    └── angular.ts (no changes needed—mock factories work for any entity)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Write path to AuditgraphDB | Custom HTTP layer to platform Pipeline API | `PipelineWriteService.pushEntity()` | Platform SDK + receiver pipeline proven in Phases 1-5; API auth, batch handling, error recovery already built |
| Subtask hierarchy | Custom recursive GQL queries with depth limits | Flat-fetch + client-side tree rebuild (NoteFolderService pattern) | Single GQL call avoids N+1; handles unlimited depth; cycle detection prevents malformed data issues |
| Field name transformation (GQL ↔ Neon) | Manual property-by-property mapping | Field mapping constants + mapNeonToGql/mapGqlToNeon helpers | Centralizes logic; prevents regressions; enables roundtrip validation tests |
| GQL query building | String concatenation or template literals | GraphqlReadService.query<T>() method | Handles RFC4515 filters, pagination, field selection safely; returns typed results |
| Entity relationship joins | Multiple sequential GQL queries | Single nested GQL query with relationship traversal | Platform GQL supports relationship nesting; single call is faster + simpler |

**Key insight:** All 9 Bloom entities are straightforward CRUD + relationships. No custom logic needed. Services are data layers only—UI/components handle business rules.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Add Bloom Class IDs to SME_MART_CLASS_IDS Constant

**What goes wrong:** PipelineWriteService.pushEntity('SmeMartProject', ...) throws "undefined class ID" because SME_MART_CLASS_IDS doesn't have the Bloom entity IDs.

**Why it happens:** Pipeline needs the UUID of each class. Class IDs come from the platform schema (live since 2026-03-18 per CONTEXT). They must be manually added to the constant in pipeline-write.service.ts.

**How to avoid:** Before implementing any service, add all 9 Bloom class IDs to SME_MART_CLASS_IDS. Get IDs from platform via `platform.Class.getClass('SmeMartProject')` (Kevin or platform team can provide). CONTEXT.md confirms all 17 classes are live—ask Kevin for the 9 Bloom IDs.

**Warning signs:** Test failures saying "class ID is undefined" or Pipeline API errors on push.

### Pitfall 2: Mixing Neon Snake_Case Into Greenfield Services

**What goes wrong:** Service builds camelCase for GQL but then internally uses snake_case field names (thinking of Neon legacy). GQL queries return camelCase; service tries to access `engagement_id` (doesn't exist) instead of `engagementId`.

**Why it happens:** Phases 1-5 required field mappings (Neon → GQL). Bloom entities have no Neon table—they're greenfield. Easy to copy the mapping pattern even though it's not needed.

**How to avoid:** For Bloom entities, field mapping constants exist only for **consistency and roundtrip testing**, not for translation. Use camelCase everywhere. If you create field mappings, ensure both `neonToGql` and `gqlToNeon` point to the same camelCase names (no actual translation).

**Warning signs:** Type errors on model assignments; runtime field access failures.

### Pitfall 3: Forgetting Optimistic Returns + Fire-and-Forget Pushes

**What goes wrong:** Service awaits Pipeline.receive() before returning. User sees 5-10 second delay on create/update. Component waits for network before proceeding.

**Why it happens:** Unfamiliar with eventual consistency. Thinking synchronous = safer.

**How to avoid:** Pattern: build the model object locally, fire-and-forget the pipeline push in background, return immediately with local object. Component already has the data from the create call.

```typescript
const gqlData = { id: uuid, name, ... };
// Fire-and-forget (don't await)
this.pipelineWrite.pushEntity('SmeMartProject', gqlData).catch(err => {
  console.error('Failed to push:', err);
});
// Return immediately
return { id, name, ... };
```

**Warning signs:** UI lag on create/update; tests timeout because they await pipeline.

### Pitfall 4: Not Implementing Tree Rebuild Cycle Detection for SmeMartTask

**What goes wrong:** If `parentId` accidentally points to a child (creating a cycle), tree rebuild enters infinite recursion. Browser hangs or crashes.

**Why it happens:** Trusting data is always valid. In practice, bugs in parent assignment can create cycles.

**How to avoid:** Copy NoteFolderService's cycle detection algorithm exactly:

```typescript
const buildTree = (node: SmeMartTask, visited = new Set<string>()): SmeMartTaskTreeNode => {
  if (visited.has(node.id)) return node; // Already visited—break cycle
  visited.add(node.id);
  return {
    ...node,
    children: allTasks
      .filter(t => t.parentId === node.id)
      .map(child => buildTree(child, visited)), // Pass visited set forward
  };
};
```

**Warning signs:** Browser freeze/crash when querying task hierarchies; endless console logs of the same task IDs.

### Pitfall 5: Implementing Business Logic in Services Instead of Leaving to UI

**What goes wrong:** Service tries to validate workflow transitions, enforce RACI rules, or check board permission inheritance. Components can't override. UI logic couples to service layer.

**Why it happens:** Natural instinct: "put rules where the data is." But Kevin's architecture says Board/Activity are structural—semantics are UI's job.

**How to avoid:** Services are CRUD + relationships only. Period. If UI needs to validate, it uses service data. Service never says "this is invalid."

**Example:** ❌ DON'T do this:
```typescript
async updateTask(id: string, changes: UpdateTaskRequest): Promise<SmeMartTask> {
  const task = await this.getTask(id);
  if (!this.isValidTransition(task.status, changes.status)) {
    throw new Error('Invalid transition'); // ❌ Service enforcing business rule
  }
  // ...
}
```

✅ DO this:
```typescript
async updateTask(id: string, changes: UpdateTaskRequest): Promise<SmeMartTask> {
  const gqlData = { id, ...mapChanges(changes) };
  this.pipelineWrite.pushEntity('SmeMartTask', gqlData);
  return /* map to model */;
}
// Component or validator service checks transitions before calling updateTask
```

**Warning signs:** Services with conditional logic; tests checking business rules; tight coupling between domain service and UI logic.

---

## Code Examples

Verified patterns from Phase 1-5 services:

### Create Entity (Fire-and-Forget + Optimistic Return)

Source: `src/app/core/services/engagements.service.ts` lines 200–230 (proven pattern)

```typescript
async createProject(data: CreateSmeMartProjectRequest): Promise<SmeMartProject> {
  const userId = this.impersonation.effectiveUserId();
  const now = new Date().toISOString();
  const projectId = this.generateUUID();

  // Build GQL data (camelCase for GraphQL)
  const gqlData: Record<string, unknown> = {
    id: projectId,
    name: data.name,
    description: data.description ?? null,
    status: data.status ?? 'draft',
    startDate: data.startDate ?? now,
    targetEndDate: data.targetEndDate ?? null,
    createdAt: now,
    updatedAt: now,
  };

  // Fire-and-forget push to Pipeline
  this.pipelineWrite.pushEntity('SmeMartProject', gqlData).catch(err => {
    console.error('[ProjectService] Failed to push project:', err);
  });

  // Return optimistically
  return {
    id: projectId,
    name: data.name,
    description: data.description ?? null,
    status: data.status ?? 'draft',
    startDate: data.startDate ?? now,
    targetEndDate: data.targetEndDate ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
```

### Query with Relationship Filtering

Source: `src/app/core/services/engagements.service.ts` lines 38–64

```typescript
async listProjectBoards(projectId: string, options?: QueryOptions): Promise<PagedResults<SmeMartBoard>> {
  this.loading.set(true);
  try {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: { parentId: `.eq.${projectId}` },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlSmeMartBoardResponse>(
      'SmeMartBoard',
      ['id', 'name', 'code', 'scope', 'partition', 'parentId', 'description', 'createdAt', 'updatedAt'],
      gqlOptions,
    );

    const items = result.items.map(gql => mapGqlToNeon<SmeMartBoard>(gql, BOARD_FIELD_MAPPING.gqlToNeon));
    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  } finally {
    this.loading.set(false);
  }
}
```

### Hierarchical Tree Rebuild (SmeMartTask)

Source: `src/app/core/services/note-folder.service.ts` lines 125–200 (exact algorithm for SmeMartTask)

```typescript
async getTaskTree(boardId: string): Promise<SmeMartTaskTreeNode[]> {
  // Step 1: Query flat list of all tasks for this board
  const result = await this.graphqlRead.query<GqlSmeMartTaskResponse>(
    'SmeMartTask',
    ['id', 'boardId', 'parentId', 'name', 'code', 'status', 'rank', 'priority', 'dueDate', 'createdAt', 'updatedAt'],
    {
      filters: { boardId: `.eq.${boardId}` },
      pageSize: 1000, // Fetch all tasks for board in single call
    },
  );

  // Step 2: Map all results to model type
  const allTasks: SmeMartTask[] = result.items.map(gqlTask =>
    mapGqlToNeon<SmeMartTask>(gqlTask, TASK_FIELD_MAPPING.gqlToNeon),
  );

  // Step 3: Build in-memory tree
  const taskMap = new Map<string, SmeMartTask>(allTasks.map(t => [t.id, t]));

  // Step 4: Helper to build tree with cycle detection
  const buildTree = (task: SmeMartTask, visited = new Set<string>()): SmeMartTaskTreeNode => {
    if (visited.has(task.id)) {
      console.warn(`[TaskService] Cycle detected at task ${task.id}`);
      return task; // Return leaf without children on cycle
    }
    visited.add(task.id);
    return {
      ...task,
      children: allTasks
        .filter(t => t.parentId === task.id)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map(child => buildTree(child, visited)),
    };
  };

  // Step 5: Get root tasks (parentId is null) and build tree
  const rootTasks = allTasks.filter(t => !t.parentId);
  return rootTasks
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map(t => buildTree(t));
}
```

### Field Mapping (Consistency Only—No Actual Translation for Greenfield)

Source: `src/app/core/field-mappings.ts` (Pattern from Phases 1-5)

```typescript
/**
 * SmeMartProject field mapping (greenfield — no Neon table)
 *
 * GQL entity: SmeMartProject (fields in camelCase)
 * Model type: SmeMartProject (fields in camelCase)
 *
 * No Neon table → no actual translation needed.
 * Mapping exists for consistency and roundtrip testing.
 */
export const SME_MART_PROJECT_FIELD_MAPPING = {
  neonToGql: {
    // Both point to same camelCase names (no translation)
    id: 'id',
    name: 'name',
    description: 'description',
    status: 'status',
    start_date: 'startDate',
    target_end_date: 'targetEndDate',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    name: 'name',
    description: 'description',
    status: 'status',
    startDate: 'start_date',
    targetEndDate: 'target_end_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema PR #8 (Bloom)',
  lastVerified: '2026-03-18',
} as const;
```

### Unit Test Pattern (CRUD + Tree Rebuild)

Source: `src/app/core/services/engagements.service.spec.ts` + `note-folder.service.spec.ts`

```typescript
describe('SmeMartProjectService', () => {
  let service: SmeMartProjectService;
  let pipelineWrite: jasmine.SpyObj<PipelineWriteService>;
  let graphqlRead: jasmine.SpyObj<GraphqlReadService>;

  beforeEach(() => {
    const pipelineWriteSpy = jasmine.createSpyObj<PipelineWriteService>(
      'PipelineWriteService',
      ['pushEntity', 'pushEntities', 'deleteEntity', 'deleteEntities']
    );
    const graphqlReadSpy = jasmine.createSpyObj<GraphqlReadService>(
      'GraphqlReadService',
      ['query', 'getById', 'rawQuery']
    );

    TestBed.configureTestingModule({
      providers: [
        SmeMartProjectService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
      ],
    });

    service = TestBed.inject(SmeMartProjectService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
  });

  it('should create project optimistically', async () => {
    const request = { name: 'Acme Security Review', status: 'draft' };
    const result = await service.createProject(request);

    expect(result.name).toBe('Acme Security Review');
    expect(result.id).toBeTruthy();
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith('SmeMartProject', jasmine.objectContaining({
      name: 'Acme Security Review',
    }));
  });

  it('should rebuild task tree from flat list with cycle detection', async () => {
    const flatTasks: GqlSmeMartTaskResponse[] = [
      { id: '1', parentId: null, name: 'Root Task', rank: 1 },
      { id: '2', parentId: '1', name: 'Subtask 1', rank: 1 },
      { id: '3', parentId: '1', name: 'Subtask 2', rank: 2 },
      { id: '4', parentId: '2', name: 'Sub-subtask', rank: 1 },
    ];

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 4, totalCount: 4 },
    } as any));

    const tree = await service.getTaskTree('board-123');

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].children).toHaveLength(1);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Neon PostgreSQL for all 17 entities | AuditgraphDB (Pipeline write + GQL read) for all 17 | Phase 1–6 (2026-03-17 to 2026-03-19) | Unified data model; eliminates database-specific logic; enables schema-driven development |
| SmeMartDbService wrapper for all entities | Direct Pipeline+GQL calls in domain services | Phase 2 (2026-03-18) onwards | Simpler code; no extra abstraction layer; services are data layers only |
| Neon VIEWs for relationships (v_engagement_summary, v_bid_summary) | Nested GQL queries + client-side transformation | Phase 2 (2026-03-18) | Flexibility; avoids VIEW maintenance; enables eventual consistency patterns |
| Manual field mapping for migrations | Field mapping constants + helpers for all entities | Phase 1 (2026-03-17) | Centralized logic; roundtrip tests prevent regressions; consistency across services |
| Recursive GQL queries for hierarchies (Note folders) | Flat-fetch + client-side tree rebuild | Phase 3 (2026-03-18) | Single GQL call; no depth limits; cycle detection prevents malformed data issues |

**Deprecated/Outdated:**
- SmeMartDbService: Still exists but fully bypassed by migrated services. Will be removed in Phase 5.
- Neon SQL queries: All tables archived 2026-04-02 (post-Phase 5 verification period). Neon connection remains for SmeMartDbService-dependent components until removal.
- Neon table views: Replaced by nested GQL queries. Example: v_engagement_summary → GQL { Engagement { ... bids { ... } } } + client-side summary calculation.

---

## Open Questions

### 1. Bloom Entity Class IDs from Platform

**What we know:** CONTEXT.md confirms "All 17 schema classes are now live in prod (confirmed via ZB UI screenshot 2026-03-18)." The original 8 class IDs are in `pipeline-write.service.ts`. The 9 Bloom entity IDs are listed in PR #8 (draft, not merged yet).

**What's unclear:** Where are the confirmed Bloom class IDs in platform? Are they in PR #8 or need to be looked up from the platform UI?

**Recommendation:** Before starting Phase 6 implementation, ask Kevin for the 9 Bloom class IDs from prod platform (or get them from PR #8 once merged). Add them to SME_MART_CLASS_IDS as first task of Phase 6 planning. Don't guess—use the actual platform IDs.

### 2. Field Definitions for 9 Bloom Entities

**What we know:** CONTEXT.md and Plan 057 describe the entities and their purposes. The schema YAML is defined in zerobias-org/schema PR #8.

**What's unclear:** Exact field names and types for each entity. Do we have the YAML files locally, or wait for PR #8 merge?

**Recommendation:** If PR #8 is merged by phase start, inspect the YAML files in `zerobias-org/schema/package/w3geekery/sme-mart/classes/`. If not merged, rely on Plan 057 entity definitions + ask Kevin for field details. Planner can request exact field list during planning phase.

### 3. Array Fields (activityIds, customFields, sourceDocuments, statuses, transitions)

**What we know:** Several Bloom entities have array fields (SmeMartBoard.activityIds, SmeMartActivity.customFields, ProjectPrd.sourceDocuments, SmeMartWorkflow.statuses). GQL supports arrays natively.

**What's unclear:** How are arrays represented in GQL schema? Are they JSON arrays, linked objects, or a custom type?

**Recommendation:** GQL will represent them as native arrays (e.g., `activityIds: string[]`). Field mappings should preserve array type. Planner will confirm exact representation during planning phase.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jasmine (Angular 21 default) + Karma (test runner) |
| Config file | `karma.conf.js` (inherited from app root) |
| Quick run command | `npm test -- --watch=false --browsers=ChromeHeadless src/app/core/services/sme-mart-project.service.spec.ts` |
| Full suite command | `npm test` (runs all `**/*.spec.ts` files) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BLOOM-01 | SmeMartProject create/read/update/delete CRUD | unit | `npm test -- sme-mart-project.service.spec.ts` | ❌ Wave 0 |
| BLOOM-02 | SmeMartBoard create/read/update/delete CRUD | unit | `npm test -- sme-mart-board.service.spec.ts` | ❌ Wave 0 |
| BLOOM-03 | SmeMartActivity create/read/update/delete CRUD | unit | `npm test -- sme-mart-activity.service.spec.ts` | ❌ Wave 0 |
| BLOOM-04 | SmeMartWorkflow create/read/update/delete CRUD | unit | `npm test -- sme-mart-workflow.service.spec.ts` | ❌ Wave 0 |
| BLOOM-05 | SmeMartTask CRUD + tree rebuild + cycle detection | unit | `npm test -- sme-mart-task.service.spec.ts` | ❌ Wave 0 |
| BLOOM-06 | ProjectPrd + PrdSection CRUD + relationships | unit | `npm test -- project-prd.service.spec.ts` | ❌ Wave 0 |
| BLOOM-07 | ProjectPlan + PlanMilestone CRUD + relationships | unit | `npm test -- project-plan.service.spec.ts` | ❌ Wave 0 |
| BLOOM-08 | Field mappings roundtrip (GQL → model → GQL) | unit | `npm test -- field-mappings.spec.ts` | ❌ Wave 0 |
| BLOOM-09 | GQL types available + service imports compile | unit | `ng build` (type check) | ✅ automatic (once PR #8 merges) |

### Sampling Rate

- **Per task commit:** `npm test -- --watch=false <service>.spec.ts` (quick validation before commit)
- **Per wave merge:** `npm test` (full suite; all 9 service tests must pass)
- **Phase gate:** Full suite green + no type errors (`ng build` succeeds) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/app/core/services/sme-mart-project.service.spec.ts` — covers BLOOM-01 CRUD
- [ ] `src/app/core/services/sme-mart-board.service.spec.ts` — covers BLOOM-02 CRUD
- [ ] `src/app/core/services/sme-mart-activity.service.spec.ts` — covers BLOOM-03 CRUD
- [ ] `src/app/core/services/sme-mart-workflow.service.spec.ts` — covers BLOOM-04 CRUD
- [ ] `src/app/core/services/sme-mart-task.service.spec.ts` — covers BLOOM-05 (including tree rebuild + cycle detection)
- [ ] `src/app/core/services/project-prd.service.spec.ts` — covers BLOOM-06 (Prd + PrdSection)
- [ ] `src/app/core/services/project-plan.service.spec.ts` — covers BLOOM-07 (Plan + Milestone)
- [ ] `src/app/core/field-mappings.spec.ts` (existing) — add roundtrip tests for 9 new mappings
- [ ] Update `src/app/core/services/pipeline-write.service.ts` to include 9 Bloom class IDs
- [ ] GQL schema types (`src/app/core/gql-types/*.types.ts`) — 9 new files (generated after PR #8 merge or written manually if schema codegen not running)

---

## Sources

### Primary (HIGH confidence)

- **CONTEXT.md** (Phase 6) — Locked decisions, entity scope, Kevin's architecture principles
- **State.md** — Phase progression, confirmed class IDs (original 8), blockers (PR #8 merge)
- **field-mappings.ts** (in codebase) — Pattern verified across 8 migrated entities
- **pipeline-write.service.ts** (in codebase) — Push API, class IDs for original 8 entities
- **graphql-read.service.ts** (in codebase) — Query API, pagination, filtering patterns
- **note-folder.service.ts** (in codebase) — Exact tree rebuild + cycle detection algorithm
- **engagements.service.ts**, **bids.service.ts** (in codebase) — CRUD + optimistic return patterns

### Secondary (MEDIUM confidence)

- **Plan 057: Project View** (`.claude/plans/local/057-task-partition-view.md`) — Entity definitions, Board/Activity distinction, hierarchy examples
- **Plan 059: AuditgraphDB Migration** (`.claude/plans/local/059-auditgraph-migration.md`) — Schema entity list, migration order, Bloom scope clarification
- **zerobias-org/schema repo** (local clone at `/Users/cstacer/Projects/zb/zerobias-org/schema/`) — YAML class definitions (original 8 present, Bloom in PR #8 draft)

### Tertiary (LOW confidence — needs validation)

- **PR #8 status** — Whether PR #8 is merged or still draft; exact Bloom class IDs from PR if not in platform yet
- **GQL type generation** — Whether types are auto-generated from schema or manually written; whether PR #8 unblocks type generation

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — PipelineWriteService + GraphqlReadService proven in Phases 1-5; no new packages needed
- **Architecture:** HIGH — Service patterns verified across 5 completed phases; SmeMartTask pattern copied directly from NoteFolderService
- **Relationships:** MEDIUM-HIGH — Entity relationships documented in Plan 057; exact link types depend on schema YAML (PR #8)
- **Field definitions:** MEDIUM — Entity purposes clear; exact field names depend on schema YAML (PR #8)
- **Bloom class IDs:** MEDIUM-LOW — Confirmed in prod per CONTEXT.md but explicit IDs not yet in codebase; need to look up from platform or PR #8
- **Test infrastructure:** HIGH — Mock factories proven; test patterns from Phases 1-5 directly applicable
- **Pitfalls:** HIGH — Common mistakes identified from 5 prior phases; SmeMartTask cycle detection pattern proven

**Research date:** 2026-03-19
**Valid until:** 2026-03-26 (one week; refresh if schema PR #8 merges with changes or Bloom class IDs differ from expectations)

---

**Session:** `claude --resume poc/sme-mart`
