---
source: hydra.Tag (listTags, searchTags, getTag)
surface: hydra API
verified: 2026-04-27
uat_tested: true
---

## Signature

**`hydra.Tag.listTags(pageNumber?, pageSize?, tagTypes?: Nmtoken[], nameFilter?: string): Promise<PagedResults<TagView>>`**
- HTTP: `GET /tags`
- `tagTypes[]` filter is OR'd internally; combined with `nameFilter` via OR (per spec — but this contradicts UAT behavior; treat as AND in practice).
- `nameFilter` is case-insensitive substring on `name`.
- Returns `TagView` (slim shape).

**`hydra.Tag.searchTags(pageNumber?, pageSize?, sort?, tagSearchBody?): Promise<PagedResults<TagExtended>>`**
- HTTP: `POST /searchTags`
- Body filters (all AND'd):
  - `name` (string)
  - `description` (string)
  - `types[]` (string array)
  - `ownerIds[]` (string array)
  - `resources[]` (string array — find tags applied to specific resource ids)
  - `scope` (TagScopeEnum: `user` | `org`)
- Returns `TagExtended` (richer shape with `color`, `scope`, `owner` object).

**`hydra.Tag.getTag(id: UUID): Promise<TagExtended>`**
- HTTP: `GET /tags/{id}`
- Direct lookup by UUID. Returns same shape as `searchTags` items.

## Sample Responses (W3Geekery, real values, captured 2026-04-27)

### `hydra.Tag.listTags(pageSize=5)` — first page of 85 total tags

```json
{
  "count": 85,
  "pageCount": 17,
  "pageNumber": 1,
  "pageSize": 5,
  "items": [
    {
      "id": "2bbc06a9-5ba5-4f22-8776-175cd3cb9b86",
      "name": "ads",
      "ownerId": "00000000-0000-0000-0000-000000000000",
      "type": "product-segment",
      "description": "Advertising",
      "created": "2026-03-13T21:29:08.742Z",
      "updated": "2026-03-18T14:57:02.671Z"
    },
    {
      "id": "e3d76f92-3118-4805-8962-f2589822c426",
      "name": "aiml",
      "ownerId": "00000000-0000-0000-0000-000000000000",
      "type": "product-segment",
      "description": "Artificial Intelligence",
      "created": "2026-03-13T21:29:08.742Z",
      "updated": "2026-03-18T14:57:02.671Z"
    }
  ]
}
```

(System Org owns most listed tags — UUID `00000000-0000-0000-0000-000000000000`. These are platform-level taxonomy tags. W3Geekery-specific tags appear under our org id.)

### `hydra.Tag.searchTags(name="w3geekery")` — exact name match

```json
{
  "count": 1,
  "pageCount": 1,
  "pageNumber": 1,
  "pageSize": 5,
  "items": [
    {
      "id": "a81cd320-243e-44eb-bdd9-9824019ef3dd",
      "name": "sme-mart.eng.w3geekery-default-zb",
      "ownerId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
      "type": "other",
      "description": "Tag for W3Geekery's default ZeroBias platform-services engagement. Auto/invariant compliance-driven engagement that every ZB platform customer Org has by default. W3Geekery is the first proof-of-concept run of the recipe; recipe will be batched across all existing platform Orgs after validation.",
      "created": "2026-04-23T23:31:12.262Z",
      "updated": "2026-04-23T23:31:12.262Z",
      "color": "#CFD8DC",
      "owner": { "id": "cd7105df-523d-5392-9f9a-3f83d3f30107", "name": "W3Geekery" },
      "scope": "org"
    }
  ]
}
```

`searchTags(name="w3geekery")` does substring match — found the canonical engagement tag (`sme-mart.eng.w3geekery-default-zb`).

### `hydra.Tag.getTag(a81cd320-...)` — direct lookup

Returns the same `TagExtended` payload shown above (single record, not wrapped in PagedResults).

## Field List

### `TagView` (returned by `listTags`)

| Field | Type | Always Populated? | Notes |
|---|---|---|---|
| id | UUID | yes | Tag id |
| name | string | yes | Tag name (`nmtoken` domain: `A-Z 0-9 . _ - :` only) |
| ownerId | UUID | yes | Owning org id (`00000000-0000-0000-0000-000000000000` = System Org) |
| type | string | yes | Tag type (`product-segment`, `other`, etc.) |
| description | string | sometimes | Free text |
| created | ISO timestamp | yes | |
| updated | ISO timestamp | yes | |

### `TagExtended` (returned by `searchTags`, `getTag`)

| Field | Type | Always Populated? | Notes |
|---|---|---|---|
| (all `TagView` fields above) | | | |
| color | string | sometimes | Hex color (e.g., `#CFD8DC`) |
| scope | enum | yes | `user` (no ownerId) or `org` (ownerId set) |
| owner | object | yes | `{ id, name }` — full owner reference |

## Pre-fill Map Contributions

Phase 28 form fields:
- **None directly.** Tags are metadata/discovery; no `company_info` field maps to tag data.

Indirect uses (Phase 24/26/27):
- Phase 24 demo gate filter: `tagTypes=["sme-mart.demo"]` (TBD if used)
- Phase 26 ZB-as-provider seeding: discover platform-provider tag for default engagement bootstrap
- Phase 27 default-engagement guard: lookup engagement tag by name (`sme-mart.eng.<orgSlug>-default-zb` pattern)
- Phase 31 verification: confirm engagement-tag exists per org

Discovery patterns:
- **By name (substring):** `searchTags({ name: "w3geekery" })` — case-insensitive
- **By owner (org-scope):** `searchTags({ ownerIds: ["<orgId>"], scope: "org" })`
- **By tag type:** `listTags(tagTypes: ["product-segment"])` — for taxonomy lookups
- **By UUID (direct):** `getTag(id)` — fastest when id is known
- **By resources tagged:** `searchTags({ resources: ["<resourceId>"] })` — reverse lookup ("what tags are on this resource")

## Known Gaps / Edge Cases

- **`listTags` and `searchTags` return different shapes.** `listTags` returns `TagView` (no color/scope/owner); `searchTags`/`getTag` return `TagExtended`. Use `searchTags` when full data is needed.
- **`name` constraint:** `nmtoken` — only `A-Z 0-9 . _ - :` (case-insensitive). Slashes, spaces, special chars NOT allowed. SME Mart convention: dot-separated namespaces (`sme-mart.eng.w3geekery-default-zb`).
- **Scope is `user` vs `org`.** When creating tags, omit `ownerId` for user-scope, pass org id for org-scope. Default behavior in W3Geekery: org-scoped tags via `ownerId` = `cd7105df-...`.
- **System Org tags (`ownerId = 00000000-...`)** are platform-managed taxonomy (product segments, etc.). Don't try to create/modify these from app code.
- **`searchTags` body filter `description`** is substring match. Tested for `name`; assume same for description.
- **`searchTags` body filter `resources[]`** is the reverse-tag-of pattern: pass resource ids to discover what tags are applied. Distinct from `Resource.searchResources(tags=[...])` which is forward direction.
- **No `tagId` filter on the body.** Use `getTag(id)` for direct lookup.
- **Tag deletion not exposed in this audit.** `Tag.deleteTag` exists in the API surface but not enumerated for Phase 25.
- **Sort param accepts object, not string.** Same caveat as `Task.list` sort — silent ignore unless the spec format is exact (untested for tags).

## Write-Path Target (D-12)

Tag write paths (out of scope for Phase 25):
- **`hydra.Tag.createTag`** — direct creation. Returns immediately. Use this for SME Mart-controlled tags.
- **`platform.Tag.suggestTag`** — moderated path. Creates a ZB Task for admin approval. Use only when user-suggested tags need review (out of scope for v1.4).
- `hydra.Tag.updateTag` — patch existing tag (color, description, etc.)
- `hydra.Tag.deleteTag` — soft delete

Phase 27 tag-creation flow uses `createTag` directly (not moderated). Tag scope: pass `ownerId` = current org id for org-scoped tags.
