---
source: hydra.Org.searchOrgMembers / hydra.Org.listOrgMembers
surface: SDK
verified: 2026-04-27
uat_tested: true
---

## Signature

**`hydra.Org.searchOrgMembers(orgId, body, pageNumber?, pageSize?, sort?): Promise<PagedResults<OrgMemberExtended>>`** (preferred)
- HTTP: `POST /orgs/{orgId}/memberSearch`
- Body fields (`OrgMemberSearchBody`):
  - `boundaryId?` (UUID) — filter by boundary
  - `name?` (string) — exact name match
  - `search?` (string) — keyword search across name/email
  - `types?` (PrincipalType[]) — e.g., `["USER"]`, `["ORG"]`, `["GROUP"]`
  - `status?` (PrincipalStatus) — e.g., `active`
  - `roles?` (string[]) — role-id filter
- Returns extended objects (member + groups + roles + counts), same shape as `getRequestOrgMember` but slimmer member sub-object.

**`hydra.Org.listOrgMembers(orgId, pageNumber?, pageSize?, principalType?, filter?): Promise<PagedResults<GroupMember>>`** (deprecated)
- HTTP: `GET /orgs/{orgId}/members`
- `filter` query is name-or-email substring match
- Returns flat `GroupMember` objects (no groups/roles bundled)
- zb/ui's `DanaUsersService.list()` is marked `@deprecated please use searchOrgMembers()`.

**Migration note:** these ops moved from `dana.*` to `hydra.*` during the hydra absorption (per memory § "ZeroBias Hydra Migration"). They live in the `@zerobias-com/hydra-sdk` package now.

## Sample Response (W3Geekery, real values, captured 2026-04-27)

`hydra.Org.searchOrgMembers(orgId=cd7105df-..., body={types:["USER"]}, pageSize=5)`:

```json
{
  "count": 4,
  "pageCount": 1,
  "pageNumber": 1,
  "pageSize": 5,
  "paginationMode": "auto",
  "items": [
    {
      "member": {
        "id": "3da9385a-5d15-4d19-84ab-e1c9ce8d84ed",
        "name": "Clark Stacer",
        "type": "USER"
      },
      "groups": [
        { "id": "934f40f3-3f45-4e2c-a164-2213e3c254d9", "name": "SME Marketplace DEV Boundary Admins" },
        { "id": "673b06d5-7e09-447e-93cb-6642f740ba28", "name": "SME Marketplace DEV Boundary Members" },
        { "id": "651db3a6-2901-5752-9a57-3262d3b77d8a", "name": "W3Geekery Admins" },
        { "id": "03d9f093-4411-5441-8b4d-b91e18331775", "name": "W3Geekery Members" }
      ],
      "roles": [
        { "id": "b47a65cf-e474-4081-ab88-2dd2e5480e85", "name": "Boundary Admin" },
        { "id": "a70a45d3-fa76-405c-95f2-912a6f42c77f", "name": "Boundary Admin Org access" },
        { "id": "18fbe31f-18fa-4d65-9b7f-ed4e6da379e2", "name": "Boundary Read-Only" },
        { "id": "d94dc1df-0a9c-4a45-92b0-49dbb50986b3", "name": "Organization Admin" },
        { "id": "862d9449-fb48-4177-9f83-8e38a18b2579", "name": "Organization Read-Only" }
      ],
      "groupsCount": 6,
      "members": [],
      "membersCount": 0,
      "rolesCount": 5
    },
    {
      "member": {
        "id": "07b2f592-6857-4497-8f64-c3c077d032d9",
        "name": "Daniel Rojas",
        "type": "USER"
      },
      "groups": [
        { "id": "becb992f-cf7d-47ce-9a89-ef944f0e6a72", "name": "Platform Boundary Admins" },
        { "id": "d44c8aee-6a84-4e31-8d48-5c5686564659", "name": "Platform Boundary Members" },
        { "id": "934f40f3-3f45-4e2c-a164-2213e3c254d9", "name": "SME Marketplace DEV Boundary Admins" },
        { "id": "673b06d5-7e09-447e-93cb-6642f740ba28", "name": "SME Marketplace DEV Boundary Members" },
        { "id": "03d9f093-4411-5441-8b4d-b91e18331775", "name": "W3Geekery Members" }
      ],
      "roles": [
        { "id": "b47a65cf-e474-4081-ab88-2dd2e5480e85", "name": "Boundary Admin" },
        { "id": "a70a45d3-fa76-405c-95f2-912a6f42c77f", "name": "Boundary Admin Org access" },
        { "id": "18fbe31f-18fa-4d65-9b7f-ed4e6da379e2", "name": "Boundary Read-Only" },
        { "id": "862d9449-fb48-4177-9f83-8e38a18b2579", "name": "Organization Read-Only" }
      ],
      "groupsCount": 9,
      "members": [],
      "membersCount": 0,
      "rolesCount": 4
    }
  ]
}
```

(2 of 4 items shown — the other 2 are duplicate "Clark Stacer" USER principals at ids `9f7f021e-...` and `e7fa4f5f-...`, evidence of multi-account history on UAT.)

## Field List

### Per `items[]` element (OrgMemberExtended)

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| member | object | yes | yes | Slim user shape: `{id, name, type}` (NOT full User; no emails/status/avatarUrl in search results) |
| groups | array | yes | yes | Group memberships within the org |
| groupsCount | number | yes | yes | Total groups |
| roles | array | yes | yes | Role assignments (id + name; no boundaryIds in slim search response) |
| rolesCount | number | yes | yes | Total roles |
| members | array | yes | yes | Empty for USER; populated for GROUP principals |
| membersCount | number | yes | yes | 0 for USER |
| via | array | conditional | yes | Inherited-access groups (absent in this sample) |

### Per `member` sub-object (GroupMember slim shape)

| Field | Type | Always Populated? | Notes |
|-------|------|-------------------|-------|
| id | UUID | yes | Principal id |
| name | string | yes | Display name |
| type | enum | yes | `USER`, `ORG`, `GROUP`, etc. |

For full User details (emails, avatarUrl, status, created, etc.), follow up with `danaOld.Org.getRequestOrgMember(memberId)` per `whoami.md`.

## Pre-fill Map Contributions

Phase 28 form fields:
- **`primary_contact` <- `member.name` + `getRequestOrgMember(member.id).member.emails[0]`** — TWO-step lookup. Search returns slim shape; full email requires the per-member fetch.
- Phase 28 UI flow: search returns the candidate list; user selects one; selection triggers `getRequestOrgMember` to fetch email + avatar for the chosen contact.

## Known Gaps / Edge Cases

- **Search response is slim.** No emails returned by `searchOrgMembers` — only id/name/type. Use `getRequestOrgMember(id)` for emails.
- **No "primary contact" designation** on org members. Phase 28 must prompt the user to choose, OR default to `getRequestOrgMember(currentUser.id)` (self).
- **Duplicate principal records.** W3Geekery has 3 different "Clark Stacer" USER ids on UAT — historical/migration artifacts. Phase 28 should handle ambiguity (display id-suffix or email when names collide).
- **`status` filter requires single value (not array)** per the body schema (`PrincipalStatus`, not array).
- **`boundaryId` filter on body** scopes search to members of a specific boundary — useful for Phase 27 boundary-aware flows.
- **`listOrgMembers` (deprecated) returns flat list.** Avoid for new work; use `searchOrgMembers` with empty body if you need "all org members".
- **No external-user search.** Both ops are scoped to `/orgs/{orgId}` — cannot search across orgs without a separate `searchOrgs` workflow.

## Write-Path Target (D-12)

No write path on these search/list ops. To add/remove org members:
- `hydra.Org.addOrgMember` (TBD — verify)
- `hydra.Org.removeOrgMember` (TBD)
- Invitation flow via `platform.Admin.createOrgInvitation` for new users

Out of scope for Phase 25; documented for Phase 28 follow-up.
