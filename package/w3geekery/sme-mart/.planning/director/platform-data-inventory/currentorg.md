---
source: danaOld.Org.getOrg
surface: SDK
verified: 2026-04-27
uat_tested: true
---

## Signature

**`danaOld.Org.getOrg(orgId: UUID): Promise<DanaOrg>`**
- HTTP: `GET /orgs/{orgId}`
- Parameters: `orgId` (UUID, required)
- "Current org" is a CLIENT-side concept resolved by `orgIdService.getCurrentOrgId()` (zb/ui) which reads `sessionStorage["zb-current-dana-org-id"]`. There is no MCP `getCurrentOrg` op — call `getOrg(currentOrgId)` after resolving the id client-side.
- Org-scoped: returns the requested org's metadata; admin/visibility filtering applies (callers see only orgs they have access to).

## Sample Response (W3Geekery, real values, captured 2026-04-27)

`danaOld.Org.getOrg(cd7105df-523d-5392-9f9a-3f83d3f30107)`:

```json
{
  "id": "cd7105df-523d-5392-9f9a-3f83d3f30107",
  "ownerId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
  "name": "W3Geekery",
  "type": "ORG",
  "origin": "user",
  "externalId": "w3geekery",
  "hidden": true,
  "selfRegistration": false,
  "invitationsEnabled": true,
  "adminGroupId": "651db3a6-2901-5752-9a57-3262d3b77d8a",
  "memberGroupId": "03d9f093-4411-5441-8b4d-b91e18331775",
  "slug": "w3geekery",
  "visibility": "private",
  "membershipPolicy": "private",
  "avatarUrl": "https://raw.githubusercontent.com/w3geekery/assets/fb4c2a22cd441996670f457c4bbb038efe9e6062/w3geekery-brain.png",
  "defaultApp": "29aad9a6-f051-4962-98db-782e5186d007"
}
```

Note: Auto-slim removed undefined fields. The full spec includes additional fields not populated for W3Geekery on UAT — see Field List below.

## Field List

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| id | UUID | yes | yes | Org id |
| ownerId | UUID | yes | yes | Owning principal id (self-owned for Orgs) |
| name | string | yes | yes | Org display name (e.g., "W3Geekery") |
| type | enum | yes | yes | Always `ORG` for orgs |
| origin | enum | yes | yes | `user` for self-created orgs |
| status | enum | required (spec) | yes | NOT in slim response — verify on next call |
| enabled | boolean | required (spec) | yes | NOT in slim response — verify |
| externalId | string | sometimes | yes | External-system identifier (e.g., `w3geekery`) |
| hidden | boolean | yes | yes | If true, org is not publicly listed |
| selfRegistration | boolean | yes | yes | Whether new users can self-register |
| invitationsEnabled | boolean | yes | yes | Whether invitation flow is allowed |
| adminGroupId | UUID | yes | yes | Group id for org admins |
| memberGroupId | UUID | yes | yes | Group id for org members |
| slug | string | yes | yes | Human-friendly identifier (`nmtoken`) |
| visibility | enum | yes | yes | `private`, `public`, etc. |
| membershipPolicy | enum | yes | yes | `private`, etc. |
| private | boolean | required (spec) | yes | NOT in slim response — verify |
| avatarUrl | URL | sometimes | yes | Org logo URL (W3Geekery has one populated) |
| defaultApp | UUID | yes | yes | Default app for the org |
| domains | string[] | sometimes | yes | Email domains for self-registration matching (not present for W3Geekery) |
| supportEmail | email | sometimes | yes | Support email (not set for W3Geekery on UAT) |
| hostname | string | sometimes | yes | Custom DNS hostname (not set) |
| defaultLoginProvider | string | sometimes | yes | Forces single login provider when set |
| sessionTimeout | duration | sometimes | yes | Org-level session timeout (ISO8601) |
| inactivityTimeout | duration | sometimes | yes | Org-level inactivity timeout (ISO8601) |
| lastScimSync | ISO timestamp | sometimes | yes | Last SCIM sync timestamp |
| isMember | boolean | sometimes | yes | True if requesting principal is a member |
| created | ISO timestamp | sometimes | yes | Creation timestamp (not in slim) |
| updated | ISO timestamp | sometimes | yes | Last update (not in slim) |
| deleted | ISO timestamp | sometimes | yes | Soft-delete timestamp |

## Pre-fill Map Contributions

Phase 28 `company_info` form fields sourced from this call:

- **`legal_name` <- `name`** — fully pre-fillable (always populated)
- **`dba` <- (none)** — DanaOrg has no description field; DBA is NOT sourceable from `getOrg`. Phase 28 must collect manually OR pull from MarketplaceProfileItem if seeded.
- **`logo_url` <- `avatarUrl`** — partial. Populated for W3Geekery on UAT; may be null for other orgs. Map only when present.
- **`short_blurb`, `long_description` <- (none)** — DanaOrg has no description fields.
- **`primary_contact` <- `supportEmail`** — partial. Best-effort fallback when set; primarily sourced from User search per `usersearch.md`.
- **`website` <- (none)** — not on DanaOrg.
- **`hq_location` <- (none)** — not on DanaOrg.
- **`years_in_business`, `employee_count` <- (none)** — not on DanaOrg.

## Known Gaps / Edge Cases

- **No `description`/`shortBlurb`/`longDescription` fields on DanaOrg.** Marketing copy must come from MarketplaceProfileItem (GQL) or user input.
- **`avatarUrl` is the org logo.** Phase 28 form should label the field "Logo URL" not "Avatar URL" to match user expectation.
- **No `getCurrentOrg` MCP op.** Resolve `currentOrgId` client-side first (`orgIdService.getCurrentOrgId()`), then call `getOrg(id)`.
- **Slim auto-removes undefined fields.** A field absent from the response means "not set on UAT for W3Geekery" — don't assume it's gone from the schema.
- **`isMember` is conditionally returned.** Useful for "join org" flows; not relevant to Phase 28 pre-fill.
- **`hostname` (custom DNS) unset on W3Geekery.** ZeroBias org may have a custom hostname; cross-check during Phase 26 ZB seeding.
- **`domains` empty for W3Geekery.** Self-registration domain matching (e.g., `@w3geekery.com`) not configured.

## Write-Path Target (D-12)

Update path exists but not via `dana.Org`. The org profile update endpoints live in `platform.Admin.*`:
- `platform.Admin.updateOrgProfile` (PUT `/app/orgs/{orgId}`) — admin-scoped
- `platform.Admin.createOrgProfile` (POST `/app/orgs`) — admin-scoped

Phase 28 should use `platform.Admin.updateOrgProfile` for committing edits to org-level fields (legal_name -> name, logo_url -> avatarUrl). Verify required permissions during Phase 27 (admin-skip path requires `Organization Admin` role).
