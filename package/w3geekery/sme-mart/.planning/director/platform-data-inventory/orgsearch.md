---
source: danaOld.Org.listOrgs / danaOld.Org.getOrg
surface: SDK
verified: 2026-04-27
uat_tested: true
---

## Signature

**`danaOld.Org.listOrgs(pageNumber?, pageSize?, visibility?, isMember?, membershipPolicy?): Promise<PagedResults<DanaOrg>>`**
- HTTP: `GET /orgs`
- Lists orgs the caller is a member of OR could join (self-registration / invitation). Superuser callers see all orgs.
- Filter params (all query, all optional):
  - `visibility` — `public` | `private`
  - `isMember` — `true` (only my orgs) | `false` (only orgs I'm not in)
  - `membershipPolicy` — `private` | `public` | `moderated`
- **No name/keyword filter.** Cannot search by org name; must paginate or look up by id.

**`danaOld.Org.getOrg(orgId: UUID): Promise<DanaOrg>`** — see `currentorg.md` for full signature/sample.

## Sample Response (W3Geekery, real values, captured 2026-04-27)

`danaOld.Org.listOrgs(pageNumber=1, pageSize=10, isMember=true)`:

```json
{
  "count": 1,
  "pageCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "paginationMode": "auto",
  "items": [
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
      "defaultApp": "29aad9a6-f051-4962-98db-782e5186d007",
      "isMember": true
    }
  ]
}
```

The Clark@W3Geekery profile only sees one org via `isMember=true` (W3Geekery). The ZeroBias org is NOT returned because Clark is not a member on UAT. To pre-fill from ZeroBias org metadata for Phase 26 ZB-as-provider seeding, a different profile or an admin caller is needed.

## Field List

Each `items[]` element follows the same `DanaOrg` shape as `currentorg.md`. Notable differences when listing vs getting:
- `isMember` is reliably populated when called with the `isMember` filter
- All required `DanaOrg` fields populated; optional fields auto-slimmed when undefined

See `currentorg.md` for the full DanaOrg field table.

## Pre-fill Map Contributions

Phase 28 form fields:
- Same as `currentorg.md` for whichever org is targeted.
- Use case 1 (current-user pre-fill): always prefer `getOrg(currentOrgId)` over filtering listOrgs — direct lookup is faster.
- Use case 2 (Phase 26 ZB-as-provider seeding): `getOrg(ZB_ORG_UUID)` — ZeroBias org metadata for the canonical provider record. Requires the caller to have read access to ZeroBias org.

## Known Gaps / Edge Cases

- **No name search.** `listOrgs` has no `q`, `name`, or `nameFilter` parameter. Phase 26 cannot search "find org named ZeroBias" — it must use a known id.
- **`isMember=true` is the practical default for current-user flows.** Without that filter, public orgs are also returned.
- **Profile-scoped visibility.** `uat-clark@w3geekery` profile sees only W3Geekery (1 org). Different profiles see different orgs. Do NOT hardcode the assumption that listOrgs returns "all orgs in the system" unless calling as superuser.
- **`hidden: true` orgs (like W3Geekery)** are still returned to members. The hidden flag affects discoverability for non-members, not member visibility.
- **Pagination is 1-indexed** with `paginationMode: "auto"` (driven by `pageSize` param).
- **No bulk org lookup by ids.** `getOrg` is single-fetch; for multiple ids, parallelize calls.

## Write-Path Target (D-12)

No direct write path on `dana.Org`. Org create/update flows through `platform.Admin.*`:
- `platform.Admin.createOrgProfile` — create new org profile
- `platform.Admin.updateOrgProfile` — update existing org

Out of scope for Phase 25 audit; documented for Phase 28 follow-up.
