# Phase 6: Project Bloom Entities - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build 9 new entity services directly on Pipeline+GQL (no Neon, no SmeMartDbService). These are greenfield services for the Project Bloom feature set: SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask, ProjectPrd, PrdSection, ProjectPlan, PlanMilestone. All schema classes are live in prod (confirmed 2026-03-18, @zerobias-org/schema-w3geekery-smemart@1.0.1).

</domain>

<decisions>
## Implementation Decisions

### Service Scope
- **CRUD + core relationships** — Each service gets create, read (list + getById), update, delete, plus relationship methods (e.g., getTasksByBoard, getActivitiesByProject, getMilestonesByPlan). No business logic, no workflow validation, no state transitions. Just the data access layer.

### Entity Relationships
- **SmeMartTask subtask hierarchy: flat-fetch + tree rebuild** — Same pattern as NoteFolderService. Fetch all tasks for a board, rebuild parent/child tree client-side using parentId.
- Other relationships (Project→Board, Board→Task, Activity→Workflow, PRD→PrdSection, Plan→Milestone) use standard GQL relationship queries.

### Board/Activity/Workflow Semantics
- **CRUD only, UI handles semantics** — Services are data access layers. The Board/Activity/Workflow distinction (Kevin's architecture) is a UI concern. Services just store and retrieve. No structural validation in services.

### Claude's Discretion
- How to group 9 services into plans (by domain? by complexity? all in one?)
- Field mapping constants for 9 new entities (need to be created — Phase 1 only did the original 8)
- GQL type interfaces for 9 new entities (need to be created)
- Test fixture data for Bloom entities
- Whether to add Bloom class IDs to SME_MART_CLASS_IDS in pipeline-write.service.ts

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema definitions (9 Bloom entities)
- `.claude/plans/local/059-auditgraph-migration.md` — Entity list with class names and domain services
- `.claude/plans/local/034-gql-schema-migration.md` — Schema YAML reference (original 8 — Bloom entities follow same YAML patterns)

### Schema class IDs (from prod UI — confirmed 2026-03-18)
- SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask
- ProjectPrd, PrdSection, ProjectPlan, PlanMilestone
- Class IDs need to be looked up from platform (not in code yet)

### Phase 1 infrastructure (pattern reference)
- `src/app/core/field-mappings.ts` — Existing field mapping constants (8 entities). Bloom entities need new mappings added.
- `src/app/core/gql-types/` — Existing GQL type interfaces. Bloom entities need new types.
- `src/app/core/services/pipeline-write.service.ts` — SME_MART_CLASS_IDS needs Bloom entity IDs added.
- `src/app/test-helpers/angular.ts` — Mock factories (reusable as-is)

### Prior service patterns
- `src/app/core/services/engagements.service.ts` — Standard CRUD service pattern
- `src/app/core/services/note-folder.service.ts` — Flat-fetch + tree rebuild pattern (for SmeMartTask)

### Plan 057 reference (what these services enable)
- `.claude/plans/local/057-task-partition-view.md` — Project Bloom MVP spec (boards, activities, workflows)

### Board vs Activity distinction
- Board = structural container (rank, issue #, permission inheritance from boundary)
- Activity = work type blueprint (workflow, RACI, issue prefix)
- Workflow = statuses + transitions
- Per Kevin 2026-03-16

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- PipelineWriteService + GraphqlReadService — proven across 5 phases
- Field mapping helpers (mapNeonToGql / mapGqlToNeon) — reusable for new entities
- Mock factories — reusable as-is
- NoteFolderService tree rebuild pattern — reusable for SmeMartTask hierarchy

### What needs to be created
- 9 field mapping constants (one per Bloom entity)
- 9 GQL type interfaces
- 9 service classes with CRUD + relationship methods
- 9 test specs
- Bloom class IDs added to SME_MART_CLASS_IDS

### Established Patterns
- `inject()` for dependencies
- Angular signals for reactive state
- Fire-and-forget Pipeline pushes with optimistic returns
- RFC4515 GQL filters
- Flat-fetch + tree rebuild for hierarchies

</code_context>

<specifics>
## Specific Ideas

- All 17 schema classes are now live in prod (confirmed via ZB UI screenshot 2026-03-18)
- These are greenfield services — no migration, no backward compatibility concerns
- Field naming should match GQL schema exactly (camelCase throughout, no snake_case legacy)
- SmeMartTask is the most complex entity (subtask hierarchy, board/activity references)
- PrdSection and PlanMilestone are the simplest (child entities of PRD and Plan)

</specifics>

<deferred>
## Deferred Ideas

- Task state transitions and workflow validation (business logic for later phase)
- Board permission inheritance from boundary (UI/security concern)
- Activity RACI rules (business logic)
- Demo data for Bloom entities (separate seed task)

</deferred>

---

*Phase: 06-project-bloom-entities*
*Context gathered: 2026-03-19*
