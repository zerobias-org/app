---
phase: 25-platform-data-audit
plan: 02
subsystem: Platform Data Audit — SDK Sources
tags: [research, pre-fill-mapping, phase-28-dependency, sdk-inventory, mcp-live]
completed: 2026-04-24
re_executed_live: 2026-04-27
duration_minutes: 240
dependency_graph:
  requires: [25-01]
  provides: [25-03, 25-04, 25-05, 28-01]
  affects: [phase-28-company-profile-form, phase-27-auth-routing]
tech_stack:
  - ZeroBias SDK (danaOld.*, hydra.*, platform.*)
  - W3Geekery test org (live UAT calls via MCP 1.0.41)
  - Pre-fill mapping (Phase 28 form fields)
key_files:
  created:
    - .planning/director/platform-data-inventory/whoami.md
    - .planning/director/platform-data-inventory/currentorg.md
    - .planning/director/platform-data-inventory/orgsearch.md
    - .planning/director/platform-data-inventory/usersearch.md
    - .planning/director/platform-data-inventory/boundary.md
    - .planning/director/platform-data-inventory/task.md
  modified:
    - .planning/director/PLATFORM-DATA-INVENTORY.md (index updated, pre-fill map populated)
decisions: []
---

# Phase 25 Plan 02: SDK Sources Audit Summary

**One-liner:** Audited 6 core ZeroBias SDK data sources against live UAT (whoami, currentorg, orgsearch, usersearch, boundary, task) and mapped Phase 28 company-profile form fields. **Original execution (2026-04-24) synthesized content from prior context; re-executed live 2026-04-27 with corrected MCP after fix-PR landed.**

---

## Re-execution context (2026-04-27)

The original Plan 25-02 was executed without live MCP access (the ZB MCP service registry had stale `yamlFile` paths breaking dana/hydra/cardservice/scim/graphql resolution). Sub-files were synthesized from prior conversation context — operation names and response shapes did not match reality.

After the MCP fix shipped (PR #27 in `zerobias-com/clients`, published as `@zerobias-com/zerobias-mcp@1.0.41`), all 6 sub-files were re-executed against live UAT on `uat-clark@w3geekery` profile and rewritten with real responses.

---

## Real MCP findings (vs synthesized originals)

| Sub-file | Original assumed op | **Real MCP op** | Major correction |
|---|---|---|---|
| whoami.md | `dana.User.getWhoAmI` + `dana.Org.getPrincipal` | `danaOld.Me.whoAmI` + `danaOld.Org.getRequestOrgMember` | **No `getPrincipal` MCP op exists.** It's a client-side BehaviorSubject in zb/ui's `DanaPrincipalsService`; the wire call is `getRequestOrgMember(principalId)` returning `OrgMemberExtendedWithAdminFlag`. Field is `admin: boolean`, not `isAdmin`. |
| currentorg.md | `dana.Org.getCurrentOrg` | `danaOld.Org.getOrg(orgId)` | **No `getCurrentOrg` op.** "Current org" is a client-side concept (`orgIdService.getCurrentOrgId()` reads sessionStorage). Resolve id client-side, call `getOrg(id)`. |
| orgsearch.md | `dana.Org.search` | `danaOld.Org.listOrgs(...)` | **No name-search filter.** `listOrgs` filters: `visibility`, `isMember`, `membershipPolicy`. No `name`/`q` parameter. Cannot search "find org named X". |
| usersearch.md | `dana.User.search` | `hydra.Org.searchOrgMembers` (preferred) / `hydra.Org.listOrgMembers` (deprecated) | **Org-member ops moved from dana to hydra** in the hydra migration. Search returns slim `member: {id, name, type}` — emails require follow-up `getRequestOrgMember(id)` call. |
| boundary.md | `platform.Boundary.list` / `.get` | `platform.Boundary.listBoundaries` / `getBoundary` | Op names corrected. `listBoundaries` has rich filters: `name`, `status`, `type`, `visibility`, `isMember`, `membershipPolicy`, `sort`. |
| task.md | `platform.Task.list` + `.search` | `platform.Task.list` only | **No `Task.search` op exists.** `Task.list` IS the search-capable list endpoint. **Sort param is silently ignored** — server returns empty `sortBy/sortDir` regardless of valid sort objects. Default order is `rank desc` (oid pseudo-timestamp). |

---

## Pre-fill map (Phase 28 form-field coverage) — corrected

Phase 28 storage shape was also corrected per Plan 25-03 findings: `MarketplaceProfileItem` is a `(section, data)` generic class, not structured. Form fields map to MPI sections, NOT to struct fields. See COMPANY-INFO-CONVENTION-DRAFT.md.

| Form field | Primary source (MPI section) | Pre-fill fallback (when MPI section absent) | Pre-fillable? |
|---|---|---|---|
| `legal_name` | MPI `legal_name` | `danaOld.Org.getOrg.name` | ✅ always (Org fallback) |
| `dba` | MPI `dba` | none | only if user previously filled |
| `logo_url` | MPI `logo_url` | `danaOld.Org.getOrg.avatarUrl` | ⚠️ partial (W3Geekery has avatarUrl; many orgs don't) |
| `short_blurb` | MPI `short_blurb` | none | only if user previously filled |
| `long_description` | MPI `long_description` | none | only if user previously filled |
| `primary_contact.user_id` | MPI section | none | requires user selection from `hydra.Org.searchOrgMembers` |
| `primary_contact.name` | MPI section | auto-fill from selected user | derived |
| `primary_contact.email` | MPI section | `getRequestOrgMember(userId).member.emails[0]` | ✅ once user selected |
| `website` | MPI `website` | none | only if user previously filled |
| `hq_location.*` (5 sub-sections) | MPI sections | none | only if user previously filled |
| `years_in_business` | MPI section | none | only if user previously filled |
| `employee_count` | MPI section | none | only if user previously filled |

**On UAT for W3Geekery:** 0 production MPI records exist (only 2 replace-test residues). First Phase 28 form for any W3Geekery user uses Org-level fallbacks for `legal_name` + `logo_url`; everything else blank with "(please provide)" hint.

---

## Known gaps + edge cases

Per-source gaps (full detail in each sub-file's "Known Gaps" section):

- **whoami:** spec response shape (`{expires, inactivityTimeout, environment}`) is incomplete vs live response (full User object with `id, name, emails[], avatarUrl, ...`). Code generators following the spec strictly miss most data. Email is `emails[0]`, never `email` singular.
- **currentorg:** DanaOrg has no description/website/HQ/contact fields. Marketing copy can ONLY come from MPI sections.
- **orgsearch:** No name-search. Phase 26 ZB-as-provider seed must use known UUID, not name lookup.
- **usersearch:** Slim search response — no emails. Phase 28 primary-contact selector must do search → user picks → fetch full member.
- **boundary:** `count: -1` / `pageCount: -1` indicates deferred counting. Multiple tag-related fields (`tagId` on boundary itself vs Object.tag).
- **task:** Sort broken. `partyId` matches across assigned/approvers/notified/accountable; can't filter "I'm assigned" separately. No `Task.search` for richer queries (date ranges, multi-status, etc.).

---

## Index file updated

`.planning/director/PLATFORM-DATA-INVENTORY.md` updated with:
1. Status column: sources 1-6 ✅ complete with `live_tested: 2026-04-27`
2. Pre-fill map: corrected to MPI section/data shape
3. Known unknowns: documented + per-source gaps captured
4. Source file count: 6 of 9

---

## Metrics

| Metric | Value |
|---|---|
| Tasks completed | 6/6 |
| Sub-files created (live MCP) | 6 |
| SDK sources audited | 6/9 (GQL + hydra in Plan 03) |
| Original synthesized → live re-execution corrections | 6/6 |
| Phase 28 form fields documented | 17 (incl. flat sub-sections) |
| Fields pre-fillable from MPI alone | 0 on UAT (no production records yet) |
| Fields pre-fillable from Org fallback | 2 (`legal_name`, `logo_url`) |
| Fields requiring user input on first run | rest |

---

## Next steps

- **Plan 25-03:** GQL + hydra sources (Engagement, SmeMartProject, MarketplaceProfileItem, hydra.Tag, hydra.Resource) — done with live MCP 2026-04-27.
- **Plan 25-04:** Pre-fill map synthesis + write-path catalog — REQUIRES UPDATE for the MPI section/data correction.
- **Plan 25-05:** Pipeline health check + env-file fix — done.
- **Phase 28 consumption:** form-schema work uses `COMPANY-INFO-CONVENTION-DRAFT.md` canonical sections.

---

**Originally completed:** 2026-04-24 (synthesized)
**Live re-execution:** 2026-04-27 (MCP 1.0.41)
**Status:** Plan 25-02 complete with corrected live data
