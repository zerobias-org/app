# Boundary & Resource API Reference for Engagements

**Last Updated:** 2026-02-09
**Environment:** CI (`api.ci.zerobias.com`)
**Org:** Roughnecks (`ea998b93-d05a-5743-8fe4-0e8d383f2b0c`)
**Boundary:** Roughnecks Boundary (`dd9e4608-9fda-4d8b-97cb-480967a2edcc`)

## Engagement-Relevant Resource Types

From `platform.Resource.getResourceTypes`, these are the types relevant to SME Mart engagements:

| Resource Type | Searchable | Engagement Use |
|---------------|-----------|----------------|
| **`task`** | yes | Core engagement tracking — work items, hours, deliverables |
| **`boundary`** | yes | Engagement scope — all work happens within a boundary |
| **`team`** | yes | Buyer/provider teams assigned to engagement |
| **`party`** | no | User/org/vendor/person identity within boundary context |
| **`activity`** | yes | Activity templates that tasks are created from |
| **`approval`** | yes | Approval workflows for deliverables, milestones |
| **`component`** | yes | System components relevant to engagement scope |
| **`internal_control`** | yes | Controls being assessed/implemented |
| **`implementation_statement`** | yes | Control implementation statements |
| **`evidence_definition`** | yes | Evidence requirements for compliance work |
| **`evidence_bot`** | yes | Automated evidence collection bots |
| **`pipeline`** | yes | Automated workflows triggered by engagement work |
| **`finding`** | yes | Audit findings discovered during engagement |
| **`boundary_role`** | yes | Roles within boundary (assessor, advisor, etc.) |
| **`boundary_control`** | yes | Controls scoped to the boundary |
| **`kb`** | yes | Knowledge base articles for engagement context |

### Not Directly Engagement-Related (but present)

- `product`, `vendor`, `suite` — catalog items
- `standard`, `framework`, `element`, `baseline` — compliance frameworks
- `vulnerability`, `weakness`, `attack_pattern` — security artifacts
- `alert`, `alert_bot` — monitoring

## Working APIs

### platform.Boundary.getBoundary
```
GET /boundaries/{boundaryId}
```
Returns full boundary details. Works.

### platform.Boundary.listBoundaries
```
GET /boundaries
```
Returns all boundaries for the org. Works.

### platform.Boundary.boundarySearch
```
POST /boundaries/{boundaryId}/search
Body: { searchType: "nav" | "auditgraph", kind?: [], keywords?: [], tags?: [] }
```
Searches across objects, resources, and tags within a boundary. **18,486 items** in Roughnecks.
Requires MCP 1.0.23+ (path param bug in 1.0.20).

### platform.Task.list (with boundaryId filter)
```
GET /app/tasks?boundaryId={uuid}&status={code}&search={text}
```
Lists tasks filtered by boundary. **26 tasks** in Roughnecks boundary. Works.

Filter params: `boundaryId`, `hasBoundary`, `status`, `priority`, `search`, `partyId`, `resourceIds`

### platform.Task.create
```
POST /app/tasks
Body: NewTask { activityId (required), approvers[] (required), notified[] (required), links[] (required),
               name?, description?, boundaryId?, customFields?, assigned?, accountable?, priority?, rank? }
```

**Key activity for engagements:**
- **"Task" activity:** `5583de55-e303-49fb-a671-2591e6d8ced5` (workflow: Software Development Lifecycle)
- **"Context Development" activity:** `ba4989ca-9fd6-47e9-8628-5a174c8326d0` (workflow: Context Development)

### platform.Task.addComment / listComments
```
POST /app/tasks/{taskId}/comments  — add comment
GET  /app/tasks/{taskId}/comments  — list comments
```
For engagement dialog, negotiations, updates, LLM prompt/output logging.

### platform.Task.addAttachment / listAttachments
```
POST /app/tasks/{taskId}/attachments  — add attachment
GET  /app/tasks/{taskId}/attachments  — list attachments
```
For SOWs, deliverables, evidence files.

### platform.Resource.resourceSearch
```
POST /resources
Body: ResourceSearchFilter { types?: string[], keywords?: string[], tags?: string[],
                              inflate?: boolean, conditions?: [], alerts?: {}, boundaryId?: UUID[] }
```
Works with `types` + `keywords`. **BUG: `boundaryId` array causes SQL error** (platform-side, not MCP).

### platform.Resource.getResourceTypes
```
GET /resources/types
```
Returns all resource types with `searchable` flag. Works.

### platform.Tag.searchTags / listTags
For engagement tag management (BIP39 tags like `ENG-ocean-tiger`).

## Known Bugs

### platform.Resource.resourceSearch — boundaryId SQL error
- Passing `boundaryId: ["uuid"]` causes: `syntax error at or near "array"`
- Platform-side SQL bug — the query isn't handling UUID arrays correctly
- **Workaround:** Use `platform.Task.list` with `boundaryId` param, or `boundarySearch`

### MCP 1.0.20 — boundarySearch path param not resolved (FIXED in 1.0.23)
- `boundaryId` was not substituted into URL path for POST operations
- Fixed in MCP 1.0.23

### MCP describe — body schemas not expanded
- `zerobias_describe` does not show request body schema fields for POST operations
- Only shows path/query params
- Schema name is visible in the signature (e.g., `ResourceSearchFilter`) but fields are not listed
- **Enhancement opportunity:** Add a method to MCP that resolves body schema types by name

## Task Data Model (from live data)

Tasks returned from `Task.list` include:

```typescript
interface TaskExtended {
  id: UUID;
  name: string;
  type: "task";
  description?: string;
  ownerId: UUID;                    // org that owns the task
  boundaryId?: UUID;                // boundary scope
  activityId: UUID;                 // activity template
  code: string;                     // e.g. "task-6", "contextDev-2"
  status: string;                   // e.g. "todo", "incoming", "awaiting_approval"
  priority: { label: string, value: number };
  customFields: Record<string, any>; // engagement tags, rates, etc.
  assigned?: Party;                 // responsible party (provider)
  accountable?: Party;              // accountable party (buyer)
  approvers: Party[];
  notified: Party[];
  links: ResourceLink[];
  activity: { id: UUID, name: string };
  workflow: { id: UUID, name: string };
  boundary?: { id: UUID, name: string };
  statusInfo: { code: string, name: string, phase: { code: string, name: string } };
  nextTransitions: Transition[];    // available state changes
  nbComments: number;
  nbAttachments: number;
  created: string;
  updated: string;
}

interface Party {
  id: UUID;
  partyType: "user" | "team" | "org" | "vendor" | "suggested_vendor" | "person";
  principalId?: UUID;
  teamId?: UUID;
  contactName?: string;
  contactEmails?: string[];
}
```

## Engagement Flow Mapping

```
SME Mart Concept        → ZeroBias API
─────────────────────────────────────────
Engagement              → Task (with customFields for engagement metadata)
Engagement Scope        → Boundary (boundaryId on task)
Engagement Tag          → Tag (BIP39: ENG-ocean-tiger) applied to boundary
Provider                → Party (assigned, partyType: "user")
Buyer                   → Party (accountable, partyType: "user")
Dialog/Negotiation      → Task Comments
SOW/Deliverables        → Task Attachments
Engagement Status       → Task Status (via workflow transitions)
Sub-tasks               → Child Tasks (parentId)
Rate/Hours/Payment      → Task customFields
```
