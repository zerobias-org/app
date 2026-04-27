---
source: danaOld.Me.whoAmI / danaOld.Org.getRequestOrgMember
surface: SDK
verified: 2026-04-27
uat_tested: true
---

## Signature

**`danaOld.Me.whoAmI()`**
- HTTP: `GET /me`
- Returns: User-shaped object with session metadata
- Parameters: none
- Spec response type is `WhoAmI` (`{ expires, inactivityTimeout, environment }`) but the live UAT response is enriched with the User identity payload (id, name, emails, etc.). Treat the live shape below as authoritative.

**`danaOld.Org.getRequestOrgMember(orgMemberId: UUID)`**
- HTTP: `GET /orgMembers/{orgMemberId}`
- Returns: `OrgMemberExtendedWithAdminFlag`
- Parameters: `orgMemberId` (UUID, required) — the principal/user id from whoAmI
- Org-scoped: returns the org-member record for the request's current org (set by `dana-org-id` header)
- Source of `admin: boolean` — used by zb/ui `DanaPrincipalsService.getPrincipal()` SDK method to populate `OrgMemberExtendedWithAdminFlag` BehaviorSubject. There is no MCP op named `getPrincipal`; the client SDK method composes this exact call.

## Sample Response (W3Geekery, real values, captured 2026-04-27)

### `danaOld.Me.whoAmI` response

```json
{
  "id": "3da9385a-5d15-4d19-84ab-e1c9ce8d84ed",
  "ownerId": "3da9385a-5d15-4d19-84ab-e1c9ce8d84ed",
  "name": "Clark Stacer",
  "type": "USER",
  "status": "active",
  "enabled": true,
  "origin": "user",
  "emails": ["clark@w3geekery.com"],
  "social": true,
  "inactivityTimeout": "PT0S",
  "environment": "uat",
  "created": "2026-04-16T16:27:53.548Z",
  "updated": "2026-04-24T21:38:37.469Z",
  "avatarUrl": "https://avatars.githubusercontent.com/u/567477?v=4",
  "connection": "github",
  "provider": "github",
  "subjects": ["github|567477"]
}
```

### `danaOld.Org.getRequestOrgMember(3da9385a-...)` response

```json
{
  "member": {
    "id": "3da9385a-5d15-4d19-84ab-e1c9ce8d84ed",
    "ownerId": "3da9385a-5d15-4d19-84ab-e1c9ce8d84ed",
    "name": "Clark Stacer",
    "type": "USER",
    "status": "active",
    "enabled": true,
    "origin": "user",
    "emails": ["clark@w3geekery.com"],
    "social": true,
    "avatarUrl": "https://avatars.githubusercontent.com/u/567477?v=4",
    "connection": "github",
    "provider": "github",
    "subjects": ["github|567477"]
  },
  "groups": [
    { "id": "934f40f3-3f45-4e2c-a164-2213e3c254d9", "name": "SME Marketplace DEV Boundary Admins" },
    { "id": "673b06d5-7e09-447e-93cb-6642f740ba28", "name": "SME Marketplace DEV Boundary Members" },
    { "id": "651db3a6-2901-5752-9a57-3262d3b77d8a", "name": "W3Geekery Admins" },
    { "id": "03d9f093-4411-5441-8b4d-b91e18331775", "name": "W3Geekery Members" }
  ],
  "roles": [
    { "id": "b47a65cf-e474-4081-ab88-2dd2e5480e85", "name": "Boundary Admin",
      "boundaryIds": ["c15fb2dc-4f8c-48b5-b27a-707bd516b005"] },
    { "id": "a70a45d3-fa76-405c-95f2-912a6f42c77f", "name": "Boundary Admin Org access",
      "boundaryIds": ["c15fb2dc-4f8c-48b5-b27a-707bd516b005", null] },
    { "id": "18fbe31f-18fa-4d65-9b7f-ed4e6da379e2", "name": "Boundary Read-Only",
      "boundaryIds": ["c15fb2dc-4f8c-48b5-b27a-707bd516b005"] },
    { "id": "d94dc1df-0a9c-4a45-92b0-49dbb50986b3", "name": "Organization Admin",
      "boundaryIds": [null] },
    { "id": "862d9449-fb48-4177-9f83-8e38a18b2579", "name": "Organization Read-Only",
      "boundaryIds": [null] }
  ],
  "admin": true,
  "groupsCount": 4,
  "members": [],
  "membersCount": 0,
  "rolesCount": 5
}
```

## Field List

### `whoAmI` fields

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| id | UUID | yes | no | User principal id; same value used as `orgMemberId` for `getRequestOrgMember` |
| ownerId | UUID | yes | no | Self-owned for USER type (== id) |
| name | string | yes | no | Display name |
| type | string | yes | no | `USER` for human users |
| status | string | yes | no | `active`, etc. |
| enabled | boolean | yes | no | Account-level enable flag |
| origin | string | yes | no | `user` for user-created |
| emails | string[] | yes | no | Array — first entry treated as primary |
| social | boolean | yes | no | True if logged in via social provider |
| inactivityTimeout | duration | yes | yes | ISO8601 (`PT0S` = no timeout) |
| environment | enum | yes | no | `uat`, `qa`, `prod`, etc. |
| created | ISO timestamp | yes | no | Account creation |
| updated | ISO timestamp | yes | no | Last profile update |
| avatarUrl | string | sometimes | no | Pulled from social connection |
| connection | string | sometimes | no | e.g. `github` |
| provider | string | sometimes | no | e.g. `github` |
| subjects | string[] | sometimes | no | Provider subject claims (e.g., `github\|567477`) |

### `getRequestOrgMember` fields

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| member | object | yes | yes | Full user object (same shape as whoAmI subset above) |
| groups | array | yes | yes | Group memberships within current org |
| groupsCount | number | yes | yes | Count of groups |
| roles | array | yes | yes | Role assignments with boundary-scoped IDs |
| rolesCount | number | yes | yes | Count of roles |
| members | array | yes | yes | Empty for USER type, populated for GROUP type principals |
| membersCount | number | yes | yes | Count of members (0 for USER) |
| via | array | conditional | yes | Groups through which access flows (not present in this sample) |
| **admin** | boolean | yes | yes | **CANONICAL admin flag** — true if user is Org Admin role-holder in current org |

## Pre-fill Map Contributions

Phase 28 form fields sourced from this call:
- **None directly** for company_info (this is user/principal data, not org data)
- Indirectly: `member.id` → primary identifier for the requesting user, used to anchor every other source call
- Indirectly: `admin` boolean → gates the admin-skip path in Phase 27 routing (per CLAUDE.md "SME Mart Admin Detection" memory). Not stored in form.
- Indirectly: `roles[].boundaryIds` → identifies which boundaries the user can access (Phase 27/31 verification)

## Known Gaps / Edge Cases

- **No `getPrincipal` MCP op exists.** `DanaPrincipalsService.getPrincipal()` (zb/ui) is a CLIENT-side BehaviorSubject getter. The wire call is `getRequestOrgMember(principalId)` against `danaOld.Org`. Documenting under "whoami" because that's how this audit grouped them.
- **Spec response shape is incomplete.** `dana.yml` declares `whoAmI` returns `{ expires, inactivityTimeout, environment }`, but the live UAT response is the full User object. Code generators that follow the spec strictly will miss most of the data.
- **`emails` is an array, not a single email.** Always read `emails[0]` for primary; never `email`.
- **`admin` flag is org-scoped.** Re-call `getRequestOrgMember` after any org switch; cached value is invalid for new org context.
- **No "company primary contact" field on member.** Phase 28 must source primary contact from a separate User search + manual selection.
- **`via` field appears only when access is inherited.** Sample above has direct memberships, so `via` is omitted by the slim filter.
- **Admin via role vs flag:** the response includes `roles[].name === "Organization Admin"` AND `admin: true`. Both are present today; `admin` is the documented canonical boolean.

## Write-Path Target (D-12)

No write path. Both operations are read-only queries:
- `whoAmI` — session/identity introspection only.
- `getRequestOrgMember` — org-membership lookup only. Membership grants are managed through invitation/group-assignment endpoints (out of scope for Phase 28).
