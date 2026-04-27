---
status: draft
phase_created: 25
phase_ratified_target: 26
verified: 2026-04-27
schema_correction: 2026-04-27
---

# company_info Convention (Draft)

## Purpose

Canonical shape for all provider and buyer company profiles in SME Mart. Used by:
- Phase 26: Seeding ZeroBias as the first marketplace provider
- Phase 28: Collecting/reviewing buyer company profile on onboarding
- Phase 31: Verification and profile completeness checks

This convention applies to ALL orgs (providers and buyers alike) to ensure consistent marketplace profile representation across both supply and demand sides.

## CRITICAL: storage shape (corrected 2026-04-27)

**`MarketplaceProfileItem` does NOT have structured fields.** It is a generic class with a `(section, data)` discriminator pattern — every "field" of the convention is its own MPI record:
- `id` — deterministic per `(orgId, section)`. Format: `mpi-<orgId>-<section>` (e.g., `mpi-cd7105df-523d-5392-9f9a-3f83d3f30107-legal_name`). Schema accepts `string`, not strict UUID.
- `orgId` — owning org id (scalar, indexed)
- `section` — canonical field name from the table below — this IS the column the convention canonicalizes
- `data` — string value. For plain text fields, plain string. For structured values (multi-part addresses, contact objects), use **flat sub-sections** (e.g., `primary_contact.email`) rather than JSON-encoded objects in one record.
- `status` — `active`, `expired` (use for credentials/insurance), `draft`, `archived`
- `expiresAt` — optional ISO 8601 (used for credentials/certs/insurance items per the class description; not used for profile fields)

**Pipeline.receive replace key is `id` only** (validated 2026-04-27 via UAT experiment — see DECISIONS.md "MarketplaceProfileItem Replace Semantics"). Per-section saves are independent. Class id: `7bcf86a5-91dc-520d-b9bf-e308b1078d46`.

**Read pattern (one query for everything):**

```graphql
{ MarketplaceProfileItem(orgId: ".eq.<currentOrgId>") { id, section, data, status, expiresAt } }
```

Group by `section` client-side, project to form model.

**Write pattern (one batch per save click):**

```
Pipeline.receive(pipelineId, {
  classId: "7bcf86a5-91dc-520d-b9bf-e308b1078d46",
  tagIds: [],
  data: [
    { id: "mpi-<orgId>-legal_name", orgId, section: "legal_name", data: "<value>", status: "active" },
    { id: "mpi-<orgId>-dba",        orgId, section: "dba",        data: "<value>", status: "active" },
    ...
  ]
})
```

Only dirty fields go in the batch. Replace is by id; un-edited records are untouched.

## Canonical Section Catalog

These section strings are the contract. Phase 28 form-schema must match. Constants file (suggested location: `src/app/onboarding/company-info-sections.ts`) imports these.

| Section | Type | Required? | Description | Pre-fill source (priority order) | Validation |
|---|---|---|---|---|---|
| `legal_name` | string | yes | Registered legal business name | (1) MPI section `legal_name`. (2) `danaOld.Org.getOrg.name` fallback | Required; non-empty |
| `dba` | string | no | Doing Business As name | MPI section `dba` only | Optional; ≤ 255 chars |
| `logo_url` | URL string | no | Logo image URL (CDN-hosted) | (1) MPI section `logo_url`. (2) `danaOld.Org.getOrg.avatarUrl` fallback | Optional; valid HTTPS URL |
| `short_blurb` | string | no | One-liner company tagline (Browse Providers card) | MPI section `short_blurb` only | Optional; ≤ 500 chars |
| `long_description` | string | no | Multi-paragraph company overview (markdown allowed) | MPI section `long_description` only | Optional; ≤ 5000 chars |
| `primary_contact.user_id` | UUID string | no | Primary contact's ZB user UUID | MPI section. Phase 28 helper: pick from `hydra.Org.searchOrgMembers` of currentOrg | Optional |
| `primary_contact.name` | string | no | Primary contact full name | MPI section. Phase 28 helper: auto-fill from selected user | Optional |
| `primary_contact.email` | email string | no | Primary contact email | MPI section. Phase 28 helper: auto-fill from `getRequestOrgMember(userId).member.emails[0]` | Optional; valid RFC5322 |
| `website` | URL string | no | Company website | MPI section `website` only | Optional; valid HTTPS URL |
| `hq_location.street` | string | no | HQ street address | MPI section only | Optional |
| `hq_location.city` | string | no | HQ city | MPI section only | Optional |
| `hq_location.state` | string | no | HQ state/region | MPI section only | Optional |
| `hq_location.country` | string | no | HQ country | MPI section only | Optional |
| `hq_location.postal_code` | string | no | HQ postal/zip code | MPI section only | Optional |
| `years_in_business` | number-as-string | no | Years in operation | MPI section only | Optional; integer ≥ 0 |
| `employee_count` | bucket string | no | Employee count bucket (GDPR-friendly) | MPI section only | Optional; one of: `1-10`, `11-50`, `51-200`, `201-500`, `500+` |
| `onboarding_complete` | ISO date string | system | Internal — set by Phase 28 save handler | Set by save | Phase 27 routing reads this section to decide CP-07 |

### Why flat sub-sections over JSON-encoded objects

`primary_contact` and `hq_location` are conceptually structured. Two encoding options were considered:

**Option A (rejected):** JSON-encode in `data`. One MPI record per logical field. Reads need parse step.

**Option B (chosen):** Flatten into multiple sections (`primary_contact.email`, `hq_location.city`, etc.). N MPI records per logical field. Plain string everywhere.

Option B wins because:
- `data` stays a plain string — no parse/serialize round-trip on every read
- Adding/renaming a sub-field doesn't require touching JSON parsers across pre-fill, form binding, save
- Search/filter by sub-field works without server-side JSON path support
- Section names get longer but that's a non-issue

Cost: more MPI records per org (one per leaf field). Read is still one query — `MarketplaceProfileItem(orgId: ".eq.<id>")` returns everything.

## Phase 28 Save / Pre-fill Strategy

- **Pre-fill (form mount):** ONE GQL query — `MarketplaceProfileItem(orgId: ".eq.<currentOrgId>") { section, data, status }`. Group client-side by `section`. For each form field, look up its section in the map; if present and `status: "active"`, use `data` as the pre-fill value. If absent, apply the per-field fallback (Org-level scalars for `legal_name` and `logo_url`; otherwise blank with "(please provide)" hint).

- **Save (form submit):** Diff form state against the original pre-fill snapshot. For each dirty field, build an MPI record `{id: "mpi-<orgId>-<section>", orgId, section, data, status: "active"}`. Push all dirty records in one `Pipeline.receive` batch. Replace is by id, so un-edited fields are not in the batch and are not touched.

- **Onboarding-complete marker:** After successful save, append one more MPI record with `section: "onboarding_complete"`, `data: <ISO date>`. Phase 27 routing reads this section's presence to decide CP-07.

- **Skip flow:** Skip-for-now does NOT write the `onboarding_complete` marker. Subsequent logins re-route to Phase 28 until the marker is written.

## Notes for Phase 26 (ZB-as-Provider Seeding)

Phase 26 will seed the ZeroBias org's marketplace profile by writing MPI records for `legal_name`, `logo_url`, `short_blurb`, `long_description`, etc. — all targeting the ZeroBias `orgId` (`57c741cf-a58e-5efc-bf2f-93c4f6cf76ec` on UAT). Same shape as buyer profiles. The seeder is one Pipeline.receive batch with N records, ids `mpi-57c741cf-...-<section>`.

## Future Extensibility

This convention is not final. Additional sections may be added (compliance certs, service-area coverage, pricing tiers, etc.). Conventions:
- Sub-section flattening continues for any nested structured value (e.g., `compliance.soc2_status`, `compliance.iso27001_expires_at`).
- Credentials/certs/insurance use `expiresAt` and `status: "expired"` for lifecycle.
- New sections must be added to the constants file and to this catalog in lockstep.

## Known Unknowns (Sparse on UAT)

W3Geekery currently has 0 production MPI records (only the two `mpi-test-a/b-...` replace-test residues — cleanup queue). Initial Phase 28 form for W3Geekery user will use Org-level fallbacks for `legal_name` + `logo_url`; everything else blank. Once Phase 28 ships and Clark uses the form, the catalog gets populated for the first real org.

## Phase 26 Ratification

Phase 26 will:
1. Review this draft convention against ZeroBias org's data shape
2. Confirm section names + flat-sub-section pattern
3. Finalize as `.planning/director/COMPANY-INFO-CONVENTION.md` (drop `-DRAFT` suffix)
4. Use the finalized convention to seed ZeroBias's marketplace profile

Phase 28 then consumes the finalized convention as the form schema.

---

**Status:** Draft — corrected 2026-04-27 to reflect MPI section/data shape; ready for Phase 26 ratification.
**Created by:** Phase 25 (Platform Data Audit)
**Schema correction:** Phase 25 GQL audit + replace-semantics test (2026-04-27)
**Ratified by:** Phase 26 (Seed ZB-as-Provider) — TBD
