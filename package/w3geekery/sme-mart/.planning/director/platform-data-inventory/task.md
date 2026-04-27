---
source: platform.Task.list (operationId listTasks)
surface: SDK
verified: 2026-04-27
uat_tested: true
---

## Signature

**`platform.Task.list(pageNumber?, pageSize?, sort?, search?, status?, priority?, boundaryId?, hasBoundary?, partyId?, resourceIds?): Promise<PagedResults<TaskExtended>>`**
- HTTP: `GET /app/tasks`
- All filters are query params, all optional. Combines list + search behavior — no separate `Task.search` operation exists.
- Filters useful for SME Mart:
  - `boundaryId` — single-boundary scope (Phase 27/31 default-engagement queries)
  - `hasBoundary` — true/false; ignored when `boundaryId` set
  - `partyId` — assigned-party filter
  - `resourceIds` — multi-resource link filter (array of UUIDs)
  - `search` — free-text substring match (name/description)
  - `status` — task status code (e.g., `todo`, `in_progress`, `done`)
  - `priority` — comma-separated priority values (1000=Critical, 500=High, 200=Normal, 100=Low)
- **No `Task.search` op.** Plan 25-02 referenced one but it doesn't exist; `Task.list` covers both.
- Single-task fetch: `platform.Task.get(taskId)` (separate op, not audited here).

## Sample Response (W3Geekery, real values, captured 2026-04-27)

`platform.Task.list(pageSize=5, boundaryId=c15fb2dc-...)` (1st of 2 pages, 10 total tasks):

```json
{
  "count": 10,
  "pageCount": 2,
  "pageNumber": 1,
  "pageSize": 5,
  "paginationMode": "auto",
  "items": [
    {
      "id": "fb45b170-aae7-4991-a6ab-fc33b73d062f",
      "name": "SOC 2 Readiness Assessment",
      "type": "task",
      "ownerId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
      "created": "2026-04-17T01:13:27.513Z",
      "updated": "2026-04-17T01:13:27.513Z",
      "activityId": "e15830c8-4274-4d67-bf9b-c22b60001e32",
      "code": "aha1-1",
      "status": "todo",
      "priority": { "label": "Normal", "value": 200, "ownerId": "00000000-0000-0000-0000-000000000000" },
      "rank": "1776388407495",
      "approvers": [],
      "notified": [],
      "links": [
        { "id": "e15830c8-4274-4d67-bf9b-c22b60001e32", "name": "Ad Hoc Activity - One person", "type": "activity" }
      ],
      "activity": { "id": "e15830c8-4274-4d67-bf9b-c22b60001e32", "name": "Ad Hoc Activity - One person" },
      "workflow": { "id": "0a325072-c881-4f44-ba2c-bb03006f1f6e", "name": "Software Development Lifecycle" },
      "nbComments": 0,
      "nbAttachments": 0,
      "nextTransitions": [
        { "id": "5c32a2bc-e711-52fe-adc9-f3982ff2a0a7", "name": "Start Task" },
        { "id": "9866acb0-f0a5-5e71-b1bf-9c34077407f4", "name": "Open Task" },
        { "id": "9a318597-b18a-5d10-935b-9975ae987530", "name": "Cancel Task" }
      ],
      "owner": { "id": "cd7105df-523d-5392-9f9a-3f83d3f30107", "name": "W3Geekery" },
      "description": "SME Mart demo task: SOC 2 Type I readiness assessment for Pinnacle Corp (crystal-harbor)",
      "imageUrl": "images/resourceType/task.svg",
      "aliases": [],
      "boundaryId": "c15fb2dc-4f8c-48b5-b27a-707bd516b005",
      "assigned": { "id": "f97e6182-6fe2-5f50-aec2-0849694f3d21", "name": "Clark Stacer", "type": "user" },
      "phaseCode": "open",
      "boundary": { "id": "c15fb2dc-4f8c-48b5-b27a-707bd516b005", "name": "SME Marketplace DEV" },
      "statusInfo": {
        "code": "todo",
        "name": "To Do",
        "phase": { "code": "open", "name": "Open", "description": "Open" },
        "description": "Task is ready to be worked on",
        "rank": "2"
      }
    }
  ]
}
```

(4 additional tasks elided — same shape: NIST CSF Gap Analysis, FedRAMP Authorization Support, ISO 27001 Evidence Collection, Compliance Automation Setup, all `status=todo`, all from demo seeder.)

## Field List (TaskExtended)

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| id | UUID | yes | yes | Task id |
| name | string | yes | yes | Display name |
| type | string | yes | yes | Always `task` |
| ownerId | UUID | yes | yes | Owning org's principal id |
| activityId | UUID | yes | yes | Required: links task to its Activity blueprint |
| code | string | yes | yes | Short code (e.g., `aha1-1`) — sequential within activity |
| status | string | yes | yes | Status code (`todo`, `in_progress`, `done`, etc.) |
| statusInfo | object | yes | yes | Expanded status: `{code, name, phase, description, rank}` |
| phaseCode | string | yes | yes | Workflow phase (`open`, `in_work`, `closed`) |
| priority | TaskPriority | yes | yes | Object: `{label, value, ownerId}` (NOT scalar) |
| rank | string | yes | yes | Lexicographic ordering rank (oid format) |
| created | ISO timestamp | yes | yes | Creation |
| updated | ISO timestamp | yes | yes | Last update |
| activity | object | yes | yes | Slim Activity ref: `{id, name}` |
| workflow | object | yes | yes | Slim Workflow ref: `{id, name}` |
| owner | object | yes | yes | Slim owner ref: `{id, name}` |
| boundaryId | UUID | sometimes | yes | Boundary id when scoped |
| boundary | object | sometimes | yes | Slim boundary ref: `{id, name}` |
| assigned | TaskAssignment | sometimes | yes | `{id, name, type}` of assignee |
| accountable | TaskAssignment | sometimes | yes | RACI accountable party |
| approvers | TaskAssignment[] | yes | yes | Empty array when none |
| notified | TaskAssignment[] | yes | yes | Empty array when none |
| links | TaskExtendedLink[] | yes | yes | Always includes activity link minimum |
| nextTransitions | array | yes | yes | Available state transitions: `[{id, name}, ...]` |
| nbComments | number | yes | yes | Comment count |
| nbAttachments | number | yes | yes | Attachment count |
| description | string | sometimes | yes | Long description (set in samples) |
| imageUrl | string | sometimes | yes | Default `images/resourceType/task.svg` |
| aliases | string[] | yes | yes | Often empty |
| customFields | object | sometimes | yes | Free-form key/value (not in samples) |
| parentId | UUID | sometimes | yes | Parent-task id for sub-tasks |
| deleted | ISO timestamp | sometimes | yes | Soft-delete |
| url | string | sometimes | yes | External URL (not used) |

## Pre-fill Map Contributions

Phase 28 form fields:
- **None directly.** Tasks are activity tracking; no `company_info` form field maps to task data.

Indirect Phase 27/31 uses:
- `boundaryId` → match the engagement's boundary; verify default engagement is wired
- `activityId` + `activity.name` → identify which activity the task belongs to (e.g., `Ad Hoc Activity - One person`)
- `assigned` / `owner` → engagement participants
- `nbComments`, `nbAttachments` → activity signal for "engagement is active" UI badges (deferred)

## Known Gaps / Edge Cases

- **No `Task.search` op exists.** Plan 25-02 wording was wrong; `Task.list` is the search-capable list endpoint (params: `search`, `status`, `priority`, `boundaryId`, etc.).
- **`priority` is an object, not a scalar.** Comparing `priority.value` (numeric) — don't compare the bare object.
- **W3Geekery boundary has 10 demo tasks** (5 visible per page; all `status=todo`, all from demo seeder script). All assigned to Clark Stacer party id `f97e6182-...`. None have approvers/notified set.
- **`assigned.id` is a Party id, NOT a principal/user id.** Per memory § "Task.create assigned = party ID" — Phase 27 must resolve via `Party.getMyParty` before write.
- **`links[]` always includes the activity link** (every task has a `child_of`-equivalent link to its `activityId`). Other links append on top.
- **`nextTransitions` is server-computed.** Reflects current status + workflow rules; do not cache across status changes.
- **`status` (code) vs `statusInfo` (full)** — keep both. `status` is what writes back to the API; `statusInfo` is what UI renders.
- **`customFields` not present in samples.** Out of scope for SME Mart v1.4.

## Write-Path Target (D-12)

Write paths exist (out of scope for Phase 25):
- `Task.create` — POST `/app/tasks` with `{ newTask: { activityId, name, ... } }`
- `Task.update` — PUT `/app/tasks/{id}` with patch body
- `Task.transition` — moves task between statuses
- `Task.addComment`, `Task.addAttachment`, `Task.addLink` — sub-resource mutations

Required `Task.create` body (per memory § "ZeroBias MCP Parameter Patterns"): `activityId`, `approvers[]`, `notified[]`, `links[]` (array of `{ resourceId, linkTypeId }`).

Phase 25 task access is read-only.
