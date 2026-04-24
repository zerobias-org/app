# Seller Credentials Catalog — Research & Phase A Audit

**Status:** Research complete. Feature parked as backlog item #086 for milestone v1.4 or v1.5.
**Source:** Clark + Brian directive. Kevin (Content lead) confirmed 2026-04-23 that Content team will NOT own this short-term — SME Mart owns the seed catalog; Content migrates later.

---

## 1. Problem statement

Sellers (service providers) in SME Mart are subject matter experts in compliance/cybersecurity. Brian wants:

1. Sellers multi-select **credentials** on their profile (e.g., CMMC CCA, CISSP, FedRAMP 3PAO).
2. Buyers filter/search Sellers by specific credentials.
3. Sellers can **submit custom credentials** we didn't anticipate → admin moderation queue → promoted to curated picklist.

This is distinct from the existing 6 Provider taxonomies (Skills, Roles, Products, Frameworks, Segments, ServiceSegments) because credentials carry:
- **Issuer** (CAICO, ISACA, ISC², etc.)
- **Issue date + expiry date** (certs expire; need renewal tracking)
- **Verification status** (unverified / verified / auto-verified via external registry)
- **Scope** (org-level vs individual vs product) — some apply to organizations, some to people

---

## 2. External research (curated catalog — treat as frozen seed data)

Lives in the `zb/ui` repo (scraped 2026-04-23, will go stale):

- `~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx` — 5-sheet catalog: **58 roles, 126 certifications, 33 role→cert requirements, 19 sources**
- `~/Projects/zb/ui/.claude/proposals/sme-mart-cyberab-catalog.md` — 694-line narrative with data-model tradeoffs
- `~/Projects/zb/ui/scripts/scrape-cyberab.sh` — re-runnable wget mirror
- `~/Projects/zb/ui/scripts/extract-cyberab.py` — HTML → JSON
- `~/Projects/zb/ui/scripts/build-compliance-catalog-xlsx.py` — JSON + curated data → XLSX

Sources: cyberab.org (CMMC/SCF/SCA), FedRAMP, HITRUST, PCI SSC, CSA STAR, IAPP, ISO/IEC Lead Auditor, CREST, plus cross-framework individual credentials from ISACA, (ISC)², CompTIA, GIAC, EC-Council, OffSec, Mile2, FITSI.

**Known gaps:**
- GIAC has 62 certs; we captured 12 (WebFetch couldn't enumerate) — v1 can accept free-form `G*` entries or enumerate later.
- DoD 8140.3 authoritative list is CAC-gated (`public.cyber.mil`); cyberab.org snapshot (Sept 2025) is our fallback — schema needs a `source_snapshot_date` field.
- "SCF APP" and "CMMC APP" are different roles sharing an acronym — namespace by ecosystem in the data model.

---

## 3. Phase A audit — SME Mart codebase state

### 3.1 Seller identity — `ProviderProfile`
- **Defined:** `src/app/core/models/provider.model.ts:3-21`
- **Individual vs company: NOT distinguished.** `zerobias_org_id` is nullable; no `type` / `accountType` field. **This is a prerequisite gap** — C3PAO is org-level, CCA is individual; we need to model both before credentials can ship cleanly.

### 3.2 Existing Provider taxonomies (the template)
6 sibling tables with matching chip-picker UI on the `expertise` tab:
`ProviderSkill`, `ProviderRole`, `ProviderProduct`, `ProviderFramework`, `ProviderSegment`, `ProviderServiceSegment` — all in `provider.model.ts:23-85`.

**None of them carry issuer/issue-date/expiry/verification-source.** The closest fields are `ProviderProduct.certified` + `certification_details` (free-text), and `ProviderFramework.assessor_certified` (boolean). Not sufficient — we need a proper `Certification` catalog and a `ProviderCredential` join.

### 3.3 Profile editor
- Route: `/my-profile`, component `MyProfile` (`src/app/pages/my-profile/my-profile.component.ts`)
- 6 tabs: `overview`, `expertise`, `services`, `reviews`, `moderate-reviews`, `settings`
- **`expertise` tab is the reusable pattern** — `ZbSimpleAutocompleteComponent` + chip display + add/remove against `ProviderProfilesService`. Credentials land here as a 7th section OR get their own tab if we want to elevate the UX.

### 3.4 Buyer-side Seller search/filter
- Route: `/providers`, component `ProviderList` (`src/app/pages/providers/provider-list.component.ts`)
- Reads `v_provider_directory` VIEW via `SmeMartDbService` (DataProducer read path)
- Filter UI: `shared/components/catalog-filters/catalog-filters.component.ts` already wraps the 6 taxonomies with enable/disable + persistence. **A 7th filter row for credentials is minimal glue.**
- Currently all client-side filtering (100-row load). Will need server-side filter support when catalog grows.

### 3.5 Tag infrastructure
- Hydra Tag API is in use (`sme-mart-tag.service.ts`) but only for Engagements / Projects / RFPs / Tasks — the workflow side.
- `ServiceSegment` catalog is the only Seller-adjacent thing that touches tags, read-only.
- **Credentials should NOT be tag-based** — tags flatten away issuer/expiry metadata we need.

### 3.6 Moderation pattern — already proven
- Review moderation: `my-profile-moderate-reviews.component.ts` + admin dashboard Reviews tab
- Fields: `approved: boolean`, `approved_at`, `approved_by`
- Richer template: `VettingStatus` enum in `vetting-item.model.ts:24-31` — `submitted | under_review | verified | rejected | expired | waived`. Use this for credential submissions.

### 3.7 Expiry tracking — pattern established
- `expires_at: string | null` convention in `marketplace-profile-item.model.ts:133`, `vetting-item.model.ts:54`, `InsuranceData.expirationDate`. Credentials follow the same pattern.

### 3.8 Admin UI
- Route: `/admin`, gated by `isAdmin` signal on `ProjectContextService`.
- 5 tabs: `stats`, `users`, `categories`, `reviews`, `settings`. **No catalog-management tab.**
- The 6 existing Provider taxonomies are READ-ONLY from the ZeroBias platform (`CatalogService` pulls on init). Admins cannot add a new Skill or Framework today.
- **A SME Mart-owned credentials catalog is a new concept** — needs a new admin tab for catalog CRUD + moderation queue.

### 3.9 Data layer — the load-bearing constraint
- **DataProducer reads work. DataProducer writes do NOT work in practice** (Hub module write path has unresolved issues — platform-side, not SME Mart).
- **Legacy Provider expertise tables use `SmeMartDbService.createRow/updateRow/deleteRow`** — this pattern is effectively dead for new work.
- **Phase-5 migrated entities** (Engagement, Bid, BidResponse, Note, NoteFolder, Review, SmeMartDocument, ServiceOffering) write via `PipelineWriteService` against GQL classes in `zerobias-org/schema`.
- **This forces the storage choice:** credentials must be GQL classes, not new Neon tables.

---

## 4. Data model decision

**Three new GQL classes in `zerobias-org/schema`:**

```
Issuer {
  id, code (e.g. "ISACA", "CAICO"), name,
  website_url, accreditation (e.g. "ANSI-ISO-17024"),
  active: boolean
}

Certification {
  id, code (e.g. "CMMC.CCA", "8140-612.CISSP", "ISC2.CISSP"),
  name, issuer_id (link to Issuer),
  ecosystem (enum: CMMC | SCF | SCA | FedRAMP | HITRUST | PCI | CSA | ISO | privacy | general),
  scope (enum: org | individual | product),
  proficiency (nullable enum: foundational | intermediate | advanced),
  standard_ref (URL to authoritative standard),
  source_url, source_snapshot_date (for stale-snapshot warnings),
  status (enum: curated | submitted | rejected),  // moderation state
  submitted_by (nullable — user who proposed it, for user-submitted)
}

ProviderCredential {
  id, provider_id (link — see open question),
  certification_id (link to Certification),
  issued_at, expires_at (nullable),
  verified (boolean),
  verification_source (nullable — e.g. "cyber-ab-marketplace-api"),
  credential_number (nullable — e.g. cert serial),
  notes (free text)
}
```

**Optional `RoleRequirement` class** (phase 2) — join Role↔Certification to express "CMMC.CCA requires one of [CASP+, CGRC, CISSO, CISA, CISM, CISSP, ...]". Useful for Buyer-UX ("show me Sellers who are CCA-eligible") but not needed for v1.

---

## 5. Open questions (surface before Phase B plan)

1. **Provider-as-GQL-class?** Current `ProviderProfile` is Neon-only. `ProviderCredential` needs to link to a Provider. Three options:
   - (a) Introduce a GQL `Provider` class — cleanest, but migration work for existing data.
   - (b) Store `ProviderCredential.provider_id` as an opaque UUID string pointing to the Neon row — works but loses GQL relationship integrity.
   - (c) Partial — read-through Provider view backed by Neon until Phase-X migration. **Ask Kevin.**
2. **Individual vs company scope on Seller profile** — prerequisite work. Needs a Provider `type` field (`individual | company`) before credentials can honor `scope`.
3. **GIAC enumeration** — free-form entry with `G*` validation (v1), or complete the 62-cert catalog (deferred content task)?
4. **Auto-verification roadmap** — any API contracts we should negotiate now (Cyber AB Marketplace, ISACA cert registry, ANSI directory)? `verification_source` field reserves the shape; wiring is v1.1+.
5. **DoD 8140.3 refresh cadence** — quarterly diff via cyberab.org snapshot is acceptable for v1. Who owns the diff review? (Recommend: SME Mart admin task, surfaced via admin dashboard banner when `source_snapshot_date > 90 days`.)
6. **Ecosystem filter granularity** — Buyer UI shows all 130 certs flat, or hierarchical (Ecosystem → Framework → Cert)? Impacts the catalog-filters.component.ts extension.

---

## 6. Feature scope estimate (rough, for backlog sizing)

| Work | Rough estimate |
|---|---|
| 3 GQL classes + dataloader validation + PR to `zerobias-org/schema:dev` | 4-6 hrs |
| Seed script: XLSX → GQL class instances (PipelineWrite) | 4-6 hrs |
| Seller profile — add "Credentials" section (reuse expertise chip pattern, extend for issuer/dates/verified display) | 6-8 hrs |
| Buyer search — 7th filter row in `catalog-filters.component.ts` | 2-3 hrs |
| Admin UI — new "Catalog" tab with credential CRUD + moderation queue | 8-10 hrs |
| "Submit custom credential" form (Seller-side) + moderation wiring | 4-6 hrs |
| Tests + QA | 4-6 hrs |
| **Total (v1)** | **32-45 hrs** |

**Not in v1:** auto-verification integrations, `RoleRequirement` join class + Buyer "eligible for role X" queries, GIAC enumeration refresh, DoD 8140.3 CAC-gated refresh automation.

**Prerequisite (separate work):** Provider individual-vs-company type field.

---

## 7. Related backlog / plans

- **Backlog #086** — Seller Credentials Catalog (this research doc)
- **Gap analysis (if any new):** — TBD when milestone 1.4/1.5 is scoped

## 8. Cross-references

- External catalog + data-model proposal: `~/Projects/zb/ui/.claude/proposals/sme-mart-cyberab-catalog.md`
- XLSX seed data: `~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx`
- Phase-5 GQL write pattern (reference implementation): `src/app/core/services/pipeline-write.service.ts`
- Existing expertise UI to clone: `src/app/pages/my-profile/my-profile-expertise.component.ts`
- Existing catalog filter UI to extend: `src/app/shared/components/catalog-filters/catalog-filters.component.ts`
- Review moderation pattern to template from: `src/app/pages/my-profile/my-profile-moderate-reviews.component.ts`
- SME Mart prod schema classes (for naming/style consistency): memory `project_sme_mart_prod_schema.md`
