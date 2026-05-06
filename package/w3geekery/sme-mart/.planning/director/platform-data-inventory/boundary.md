---
source: platform.Boundary.listBoundaries / platform.Boundary.getBoundary
surface: SDK
verified: 2026-04-27
uat_tested: true
---

## Signature

**`platform.Boundary.listBoundaries(pageNumber?, pageSize?, name?, status?, type?, visibility?, isMember?, membershipPolicy?, sort?): Promise<PagedResults<BoundaryExtended>>`**
- HTTP: `GET /boundaries`
- All filters are query params, all optional. Returns boundaries the caller has visibility to.
- Useful filters for SME Mart:
  - `isMember=true` — only boundaries the caller is a member of (Phase 27 default-engagement lookup)
  - `status` — `draft`, `published`, etc. (BoundaryStatusEnum)
  - `name` — substring match on boundary name

**`platform.Boundary.getBoundary(boundaryId: UUID): Promise<BoundaryExtended>`**
- HTTP: `GET /boundaries/{boundaryId}`
- Single-boundary lookup by id; returns same `BoundaryExtended` shape as list items.

## Sample Response (W3Geekery, real values, captured 2026-04-27)

`platform.Boundary.listBoundaries(pageSize=10, isMember=true)`:

```json
{
  "count": -1,
  "pageCount": -1,
  "pageNumber": 1,
  "pageSize": 10,
  "paginationMode": "auto",
  "items": [
    {
      "id": "c15fb2dc-4f8c-48b5-b27a-707bd516b005",
      "name": "SME Marketplace DEV",
      "type": "boundary",
      "ownerId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
      "created": "2026-04-16T16:23:04.235Z",
      "updated": "2026-04-16T16:23:04.235Z",
      "status": "draft",
      "boundaryType": "lab",
      "tagId": "8529baa4-96a4-487f-b54a-60ef502b9eef",
      "createdBy": "e7fa4f5f-35e1-4134-a879-9bdb3210d1db",
      "factoryTypes": ["software"],
      "hostingTypes": ["saas"],
      "managedTypes": [],
      "visibility": "public",
      "membershipPolicy": "moderated",
      "productCount": 3,
      "createdByUsername": "Clark Stacer",
      "description": "Boundary for SME Marketplace development",
      "imageUrl": "images/resourceType/boundary.svg",
      "aliases": []
    },
    {
      "id": "386a59a9-3691-471a-8899-0da02c1c9efc",
      "name": "Platform",
      "type": "boundary",
      "ownerId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
      "created": "2026-04-24T15:43:27.602Z",
      "updated": "2026-04-24T15:43:27.602Z",
      "status": "draft",
      "boundaryType": "lab",
      "tagId": "464cd9c4-c9f2-48f6-b48b-8106c6a71a89",
      "createdBy": "e7fa4f5f-35e1-4134-a879-9bdb3210d1db",
      "factoryTypes": ["software"],
      "hostingTypes": ["saas"],
      "managedTypes": [],
      "visibility": "private",
      "membershipPolicy": "private",
      "productCount": 1,
      "createdByUsername": "Clark Stacer",
      "description": "Zerobias Platform boundary",
      "imageUrl": "images/resourceType/boundary.svg",
      "aliases": []
    }
  ]
}
```

`platform.Boundary.getBoundary(c15fb2dc-...)` returns the SME Marketplace DEV boundary item shown above. The boundary id matches the canonical W3Geekery boundary documented in DECISIONS.md and `bootstrap-w3geekery-engagement.md`.

## Field List (BoundaryExtended)

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| id | UUID | yes | yes | Boundary id |
| name | string | yes | yes | Display name |
| type | string | yes | yes | Always `boundary` (resource type) |
| ownerId | UUID | yes | yes | Owning org's principal id (W3Geekery: `cd7105df-...`) |
| boundaryType | enum | yes | yes | `lab`, `production`, etc. (BoundaryTypeEnum) |
| status | enum | yes | yes | `draft`, `published`, etc. (BoundaryStatusEnum) |
| tagId | UUID | yes | yes | Hydra tag id associated with this boundary (used in Object.tag during ingestion) |
| createdBy | UUID | yes | yes | Principal id of creator (e.g., a Clark account) |
| createdByUsername | string | yes | yes | Display name of creator |
| created | ISO timestamp | yes | yes | Creation timestamp |
| updated | ISO timestamp | yes | yes | Last update |
| factoryTypes | array | yes | yes | e.g., `["software"]` |
| hostingTypes | array | yes | yes | e.g., `["saas"]` |
| managedTypes | array | yes | yes | Often empty array |
| visibility | enum | yes | yes | `public`, `private` |
| membershipPolicy | enum | yes | yes | `moderated`, `private`, etc. |
| productCount | number | yes | yes | Count of associated products |
| description | string | sometimes | yes | Free-text description |
| imageUrl | string | sometimes | yes | Default `images/resourceType/boundary.svg` |
| aliases | string[] | yes | yes | Often empty |
| parentId | UUID | sometimes | yes | Parent boundary if hierarchical (not in samples) |
| deleted | ISO timestamp | sometimes | yes | Soft-delete timestamp |
| url | string | sometimes | yes | External URL (not used) |
| boundaryId | UUID | sometimes | yes | Self-reference; may equal `id` |

## Pre-fill Map Contributions

Phase 28 form fields:
- **None directly.** No `company_info` form field maps to boundary metadata.

Indirect Phase 27/31 uses:
- `boundaryId` → resolves the default engagement's working scope; required for Pipeline.receive ingestion targeting and `boundaryExecuteRawQuery` filters
- `tagId` → tag UUID for `Object.tag` at ingestion time (per DECISIONS.md "Object.tag shape validation")
- `productCount` → presence-check for whether default engagement has products linked (Phase 26 ZB-as-provider seeding)

## Known Gaps / Edge Cases

- **`count: -1` and `pageCount: -1`** in list responses indicate deferred/lazy counting. Don't rely on totals from the first page.
- **Two boundaries visible to W3Geekery on UAT:**
  - `SME Marketplace DEV` (`c15fb2dc-...`) — public/moderated, 3 products
  - `Platform` (`386a59a9-...`) — private/private, 1 product
- **`isMember=true`** returns boundaries the caller has membership to via roles (regardless of org). Some boundaries may belong to other orgs (e.g., ZeroBias platform boundary visible because Clark has Boundary Read-Only there).
- **Boundary `tagId` vs SME Mart entity tags.** Boundary's own `tagId` is the boundary-scope hydra tag. Distinct from `w3geekery.sme-mart.*` content tags applied to ingested objects.
- **Status `draft` is normal on UAT.** Both W3Geekery boundaries are in `draft`; doesn't block usage.
- **`boundaryId` field on the Boundary itself** is confusing — when present it self-references. Not in this sample but allowed by schema.
- **Search by name** uses substring match on `name` query param. Phase 26 ZB-seeding can use `name="ZeroBias"` to discover canonical platform boundaries.

## Write-Path Target (D-12)

Write paths exist (out of scope for Phase 25):
- `platform.Boundary.createBoundary` — POST `/boundaries`
- `platform.Boundary.deleteBoundary` — DELETE `/boundaries/{boundaryId}`
- `platform.Boundary.createBoundaryProduct`, `createBoundaryParty`, `createBoundaryTeam` — for boundary composition
- No direct `updateBoundary` op surfaced in search; updates likely go through party/role/product sub-endpoints.

Phase 25 boundary access is read-only (list/get + tag-based ingestion).
