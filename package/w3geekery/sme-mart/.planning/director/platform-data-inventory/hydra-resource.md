---
source: hydra.Resource (resourceSearch, getResource; searchResources deprecated)
surface: hydra API
verified: 2026-04-27
uat_tested: true
---

## Signature

**`hydra.Resource.resourceSearch(pageNumber?, pageSize?, resourceSearchFilter?): Promise<PagedResults<ResourceView>>`** *(canonical)*
- HTTP: `POST /resources`
- Body (`resourceSearchFilter`):
  - `types[]` — resource type filter (`task`, `boundary`, etc.) — OR'd
  - `keywords[]` — substring across name/description — OR'd
  - `tags[]` — tag NAMES (not UUIDs) — OR'd
  - `inflate` — boolean; required `true` when using `conditions`
  - `conditions[]` — `Condition` objects matched against the inflated resource payload (combined OR; requires `inflate=true`)
  - `alerts` — `AlertFilter` for alert-resource subset
  - `boundaryId[]` — *(not implemented per spec; do not rely on)*
- Returns `PagedResults<ResourceView>`. Use this for any new code.

**`hydra.Resource.searchResources(pageNumber?, pageSize?, keywords?, tags?, types?, inflate?): Promise<PagedResults<ResourceView>>`** *(DEPRECATED)*
- HTTP: `GET /resources`
- Query-param-based version with the same `keywords/tags/types/inflate` semantics. Spec marks deprecated; backend recommends migrating to `resourceSearch` (POST). Functionally equivalent for the basic filters.

**`hydra.Resource.getResource(id: UUID, inflate?: boolean): Promise<ResourceView>`**
- HTTP: `GET /resources/{id}`
- Single-resource lookup by UUID.

**Note:** `hydra.Resource.listResources` does NOT exist (Plan 25-03 named it but no such MCP op). Use `resourceSearch` with empty body to list-all.

## Sample Responses (W3Geekery, real values, captured 2026-04-27)

### `hydra.Resource.resourceSearch({tags: ["sme-mart.eng.w3geekery-default-zb"]}, pageSize=3)`

```json
{
  "count": -1,
  "pageCount": -1,
  "pageNumber": 1,
  "pageSize": 3,
  "items": [
    {
      "id": "2c95bc18-a978-4766-a7d3-f7ceb8a9cff5",
      "name": "Engagement coordination — W3Geekery <- ZeroBias",
      "type": "task",
      "ownerId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
      "created": "2026-04-23T23:41:36.605Z",
      "updated": "2026-04-23T23:41:36.605Z",
      "tags": [
        {
          "id": "a81cd320-243e-44eb-bdd9-9824019ef3dd",
          "name": "sme-mart.eng.w3geekery-default-zb",
          "type": "other"
        }
      ],
      "description": "Permanent coordination/anchor task for the default ZeroBias platform-services engagement between W3Geekery (Buyer/Demand) and ZeroBias (Supplier). Per the per-engagement meta-tracker pattern (single-party, engagement-owner-side scaffolding — NOT a Req↔Sat entangled task; see DECISIONS.md).",
      "imageUrl": "images/resourceType/task.svg",
      "aliases": []
    }
  ]
}
```

Confirms the meta-tracker pattern: exactly **one Task** is tagged with the engagement tag — the engagement coordination task (id `2c95bc18-...`), referenced by `Engagement.zerobiasTaskId`.

The deprecated `searchResources(tags=["sme-mart.eng.w3geekery-default-zb"])` returns identical output for this filter set.

## Field List (`ResourceView`)

| Field | Type | Always Populated? | Notes |
|---|---|---|---|
| id | UUID | yes | Resource id |
| name | string | yes | Display name |
| type | string | yes | Resource type (`task`, `boundary`, `tag`, etc. — `nmtoken`) |
| ownerId | UUID | yes | Owning principal (org id for org-owned, user id for user-owned) |
| description | string | sometimes | Free text |
| created | ISO timestamp | yes | |
| updated | ISO timestamp | yes | |
| deleted | ISO timestamp | sometimes | Soft-delete |
| tags | array | sometimes | `[{id, name, type}]` — tags applied to this resource |
| imageUrl | string | sometimes | Default per-type icon |
| aliases | string[] | sometimes | Often empty |
| parentId | UUID | sometimes | Parent resource (for hierarchies) |
| boundaryId | UUID | sometimes | Boundary container |
| url | string | sometimes | External URL |
| ... | | | (additional fields based on type-specific subclass — Task fields, Boundary fields, etc.) |

`inflate=true` adds expanded references (linked resources, full owner objects) AND enables `conditions[]` matching against the inflated payload.

## Pre-fill Map Contributions

Phase 28 form fields:
- **None directly.** Resources are activity/work items, not org-profile data.

Indirect uses:
- Phase 27 default-engagement guard: `resourceSearch({ tags: [engagementTagName], types: ["task"] })` to confirm meta-tracker task exists for current org's engagement.
- Phase 31 verification: enumerate all tagged resources per engagement for E2E validation.
- General activity feed: combine with `platform.Task.list` for richer per-engagement views (resources tagged + tasks under boundary).

## Known Gaps / Edge Cases

- **`searchResources` (GET) is deprecated.** Use `resourceSearch` (POST) for all new code. The deprecated GET still returns identical results for the basic filters tested here, but new filter capabilities (`conditions[]`, `alerts`) are POST-only.
- **`tags` filter takes NAMES, not UUIDs.** Pass tag `name` strings (e.g., `"sme-mart.eng.w3geekery-default-zb"`), not UUIDs. Different from GQL Object.tag filter which takes UUIDs inside the dot-prefix `.eq.` syntax.
- **`count: -1` / `pageCount: -1`** indicates deferred counting. Don't trust totals from page 1.
- **Resource shape varies by type.** A `task` resource has different sub-fields than a `boundary` or `tag`. Use `inflate=true` or follow up with type-specific GET ops (`platform.Task.get`, `platform.Boundary.getBoundary`) for full shape.
- **`conditions[]` requires `inflate=true`.** Body-time payload matching is unique to the POST endpoint. Untested in this audit; document a real condition example when first used.
- **`boundaryId[]` is documented but "not implemented"** per the spec — do not pass it expecting filtering. Use `keywords` or rely on the boundary-scoped ops (`platform.Boundary.boundaryObjectSearch`) instead.
- **Filter values within an array OR; arrays are AND'd against each other.** E.g., `{ types: ["task", "boundary"], tags: ["x"] }` = `(type IN [task,boundary]) AND (has tag x)`.
- **Cross-tag/cross-type discovery is limited.** For complex GQL-style queries, prefer GQL with RFC4515 directly.
- **No `tagResource`/`linkResources` exposed in this audit** but `hydra.Resource` exposes these write ops (out of scope here).

## Write-Path Target (D-12)

Resource write paths (out of scope for Phase 25):
- **`hydra.Resource.tagResource`** — apply a tag to a resource. Used by Object.tag at ingestion time per memory.
- **`hydra.Resource.linkResources`** — create directional links between resources (parent/child, blocks, relates-to, etc. via link-type IDs from MEMORY).
- **`hydra.Resource.updateResource`** — mutate name/description/etc. on a resource (where allowed by type).
- Production note: per memory, prod tagging uses `store.Resource.tagResource` (hydra returns 404 on prod). Confirm before write-path lands.

For SME Mart class-object data (Engagement, SmeMartProject, etc.) — DO NOT use Resource write paths. Those classes write through `Pipeline.receive` at GQL ingest, not via the hydra Resource API.
