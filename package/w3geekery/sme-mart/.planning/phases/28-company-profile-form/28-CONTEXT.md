# Phase 28: Company Profile Review/Confirm Form — Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Director brief (`.planning/director/phase-28-brief.md`) + companion docs (canonical contracts)

<domain>
## Phase Boundary

On first authenticated load (post Phase 27 routing), present the user a form pre-populated with everything ZB platform already knows about their Org's company profile. They review, edit, confirm. Save writes only DIRTY fields to MarketplaceProfileItem (MPI) via Pipeline.receive. Skip-for-now bypasses to Phase 30 without writing the onboarding-complete marker. Subsequent logins with the marker present route directly to Phase 30 (Phase 27 reads the marker — Phase 28 only writes it).

**Pure user-facing data review.** No engagement creation in scope (Phase 27's lazy guard already ran). No LLM enrichment (deferred). No document upload. No banking/insurance/compliance attestation (v1.5+).

</domain>

<decisions>
## Implementation Decisions (LOCKED — do NOT redesign)

### MPI storage shape (canonical, verified 2026-04-27)
- `MarketplaceProfileItem` is a **generic `(section, data)` discriminator class** — NOT a struct. Each form field is its own MPI record.
- Class id: **`7bcf86a5-91dc-520d-b9bf-e308b1078d46`** (platform-assigned, verified via `platform.Class.getClass` 2026-04-28; 21/23 SME_MART_CLASS_IDS audit complete; the codebase const for MPI was previously fictional — see DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5"). Plan 26-04 corrected the const to the canonical value.
- Record id format: **`mpi-<orgId>-<section>`** — schema accepts `string`, not strict UUID.
- Per-record fields: `{ id, orgId, section, data, status: 'active' }`. `expiresAt` unused for company-info sections (reserved for credentials/insurance/cert items).
- For nested values (`primary_contact.*`, `hq_location.*`), use **flat sub-sections** — one MPI record per leaf. `data` stays a plain string. NO JSON-encoded objects.

### Pipeline.receive semantics (validated 2026-04-27 UAT experiment)
- **Replace key is `id` only.** Per-section saves are independent; ingesting one MPI record does NOT clobber other MPI records of the same class with different ids. (See DECISIONS.md "MarketplaceProfileItem Replace Semantics".)
- One `Pipeline.receive` batch per save click. `data` array contains ONE record per dirty field. Un-edited records are simply omitted (no-op).

### Read pattern — ONE GQL query per form mount
```graphql
{ MarketplaceProfileItem(orgId: ".eq.<currentOrgId>") { id, section, data, status, expiresAt } }
```
Group results client-side by `section` to project into the form model. No per-field round-trips.

### Onboarding-complete marker is its own MPI record
- Section: `onboarding_complete`. Data: ISO date string (e.g., `2026-04-30`). Written via the SAME save path as every other field.
- Phase 27 routing reads this section to decide CP-07. Phase 28 only writes it.
- Skip-for-now does NOT write this marker.

### Default ZB engagement is OUT OF Phase 28 scope
- Phase 27's lazy-on-load guard creates the default engagement (DECISIONS.md "Default ZB Engagement is Auto, Invariant"). Phase 28 must NOT touch engagement creation.
- Phase 28 depends on Phase 27 routing being in place. Phase 27 has not started yet — plan against the documented contract; execution will either follow Phase 27 or stub the routing integration point.

### Canonical company_info section catalog (Phase 26 ratified 2026-04-28)

| Section | Type | Required? | Pre-fill source / fallback |
|---|---|---|---|
| `legal_name` | string | yes | (1) MPI `legal_name`. (2) `danaOld.Org.getOrg.name` |
| `dba` | string | no | MPI `dba` only |
| `logo_url` | URL string | no | (1) MPI `logo_url`. (2) `danaOld.Org.getOrg.avatarUrl` |
| `short_blurb` | string | no | MPI only (≤ 500 chars) |
| `long_description` | string | no | MPI only (≤ 5000 chars) |
| `primary_contact.user_id` | UUID string | no | MPI; helper: pick from `hydra.Org.searchOrgMembers` |
| `primary_contact.name` | string | no | MPI; helper: derived from selected user |
| `primary_contact.email` | email | no | MPI; helper: `getRequestOrgMember(userId).member.emails[0]` |
| `website` | URL string | no | MPI only |
| `hq_location.street` | string | no | MPI only |
| `hq_location.city` | string | no | MPI only |
| `hq_location.state` | string | no | MPI only |
| `hq_location.country` | string | no | MPI only |
| `hq_location.postal_code` | string | no | MPI only |
| `years_in_business` | number-as-string | no | MPI only (integer ≥ 0) |
| `employee_count` | bucket | no | MPI only (one of `1-10`, `11-50`, `51-200`, `201-500`, `500+`) |
| `onboarding_complete` | ISO date string | system | Set by Phase 28 save |

### Save handler = dirty-only writes
- On mount, snapshot the projected form model after pre-fill resolution (the "original snapshot").
- Diff form state against this snapshot at submit time. Only fields where `current !== original` are dirty.
- Build dirty records as `{ id: 'mpi-<orgId>-<section>', orgId, section, data, status: 'active' }`. Push in ONE `Pipeline.receive` batch. Append the `onboarding_complete` record on top.

### Architecture: MarketplaceProfileService adapter
- New service: `src/app/core/services/marketplace-profile.service.ts`. Distinct from existing `vendor-profile.service.ts` (which uses `corporate_identity / attestation / insurance / reference / personnel / financial` sections with JSON-encoded `data`).
- Form binds a struct-shaped model (e.g., `{ legalName, dba, primaryContact: { userId, name, email }, hqLocation: { street, city, state, country, postalCode }, ... }`).
- Service translates between struct ↔ MPI record array. Reuses `PipelineWriteService` for writes and `GraphqlReadService` for reads.

### Pre-fill UX
- Auto-filled fields show "(pre-filled from platform)" annotation.
- Empty fields with NO platform fallback show "please provide" hint + optional helper text.
- Both kinds remain editable.

### Skip-for-now flow
- Visible "Skip for now" button. Routes to `/projects` (Phase 30 surface) without writing the `onboarding_complete` marker.
- Phase 30 separately owns the persistent "complete your profile" nudge — Phase 28 does NOT add a banner there.

### Test scope (per Clark)
- **Unit tests scoped to the four flows in CP-08**: pre-fill, save, skip, repeat-login-skip.
- Touched-component tests only. Do NOT bolt test-infra work onto this milestone (separate future milestone).
- Integration / E2E coverage is NOT in Phase 28 scope.

### Claude's Discretion
- Component file layout under `src/app/onboarding/` (e.g., `company-profile-form.component.ts/.html/.scss`, helper `company-info-sections.ts` constants module).
- Form-control choice: prefer ngx-library form components / Angular Material primitives where the suffix-naming + standalone-component conventions allow. Use `inject()` and `input()`/`output()` per Angular 21 modernization rules.
- Reactive forms structure (FormGroup with nested FormGroup for `primary_contact` and `hq_location`).
- Validators per the catalog (URL for `logo_url`/`website`, RFC5322 email for `primary_contact.email`, integer ≥ 0 for `years_in_business`, allowlist for `employee_count`).
- Snackbar / inline error placement on save failure.
- Whether to also surface a "view-only edit later" path from Phase 30 (out-of-scope for must-haves but acceptable as a discretionary nicety; do not let it expand the surface area).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract & companion conventions
- `.planning/director/phase-28-brief.md` — the contract (CP-01..CP-08 + 7 deliverables + scope boundaries).
- `.planning/director/COMPANY-INFO-CONVENTION.md` — canonical 17-section catalog (form schema, pre-fill sources, validation rules).
- `.planning/director/PLATFORM-DATA-INVENTORY.md` — Phase 25 pre-fill map (field → source → fallback) + UAT data state ("0 production MPI records on W3Geekery; first user will see Org-level fallbacks for `legal_name`/`logo_url` only").
- `.planning/director/phase-27-brief.md` — routing contract (delivers first-time users to Phase 28; reads `onboarding_complete` for CP-07).

### Locked decisions
- `.planning/director/DECISIONS.md` "MarketplaceProfileItem Replace Semantics" (id-only replace, per-section independence, validated UAT experiment).
- `.planning/director/DECISIONS.md` "Default ZB Engagement is Auto, Invariant, Compliance-Driven" (why Phase 28 is decoupled from engagement creation).
- `.planning/director/DECISIONS.md` "Platform-Assigned Class IDs Are Not Deterministic UUID v5" (canonical MPI class id is `7bcf86a5-...`; old `ee1e68b7-...` const is fictional and was corrected by Plan 26-04).

### Project rules
- `package/w3geekery/sme-mart/CLAUDE.md` — no Nx, standalone components, ngx-library first, generic-SQL/DataProducer for Neon, suffix-style file naming (`*.component.ts`, `*.service.ts`, `*.spec.ts`).
- `.planning/docs/MODERNIZATION_GUIDE.md` — Angular 21 patterns: `input()`/`output()`/`inject()`, no constructor injection, no decorators on inputs/outputs.

### Existing infrastructure to compose with (NOT reuse for company_info)
- `src/app/core/services/pipeline-write.service.ts` — `pushEntity(className, gqlData, tagIds, callsite)` is the write primitive. Class const for MPI was corrected by Plan 26-04; verify the const equals `7bcf86a5-91dc-520d-b9bf-e308b1078d46` before using.
- `src/app/core/services/graphql-read.service.ts` — `query(className, fields, { filters, pageSize })` is the read primitive.
- `src/app/core/services/vendor-profile.service.ts` — DIFFERENT use of MPI (vendor profile sections with JSON-encoded `data`). Phase 28 must NOT reuse — its sections do not match company_info; its `name`-required validation does not apply. Read it only to understand the pattern; build a new service.
- `src/app/core/models/marketplace-profile-item.model.ts` — domain model used by vendor-profile.service. Phase 28's adapter likely needs its own narrower model (struct shape) plus a record DTO matching the convention.
- `src/app/core/field-mappings.ts` — `MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon` / `neonToGql`. Phase 28's adapter can reuse mapNeonToGql/mapGqlToNeon if it needs the field-name translation; otherwise read by `section` directly.
- `src/app/app.routes.ts` — onboarding routes will land here. Phase 27 will own the guard; Phase 28 owns the form route (recommended path: `/onboarding/company-profile`).

### SDK references
- `@zerobias-com/zerobias-angular-client` — wraps `zerobias-client` → `zerobias-sdk`. `danaOld.Org.getOrg(orgId)` returns `{ name, avatarUrl, ... }`. `hydra.Org.searchOrgMembers` for primary-contact picker. Current org id resolves via `ZerobiasAppService` / sessionStorage `zb-current-dana-org-id`.
- ZB SDK whoAmI → currentOrgId pattern lives in `ZerobiasAppService` (already present in the app shell from earlier phases).

</canonical_refs>

<specifics>
## Specific Ideas

### File targets (suggested)
- `src/app/onboarding/company-profile-form.component.ts` (+ `.html`, `.scss`) — standalone component, route `/onboarding/company-profile`.
- `src/app/onboarding/company-info-sections.ts` — exported constants for every section name (`SECTION_LEGAL_NAME = 'legal_name'`, …). Importable by both the service and any future Phase 26 seeder consumer.
- `src/app/onboarding/company-info.model.ts` — TypeScript interface for the struct-shaped form model and the dirty-diff helper types.
- `src/app/core/services/marketplace-profile.service.ts` — read (one GQL query → group by section → project to struct), write (struct + snapshot → diff → record array → one Pipeline.receive batch), set-onboarding-complete helper.
- `*.spec.ts` siblings for the four flows — pre-fill (with and without pre-existing MPI records), dirty-only save (assert exact record array shape passed to PipelineWriteService), skip-for-now (assert no `onboarding_complete` written), repeat-login-skip (assert routing skips form once marker present — exercised at the routing-integration seam, may stub the Phase 27 guard).

### Concrete contracts the planner must encode
- Save handler MUST emit records in shape `{ id: 'mpi-<orgId>-<section>', orgId, section, data, status: 'active' }`. No `name` field, no `description` field — those belong to the vendor-profile use of MPI, not company_info.
- ID generator MUST be deterministic given `(orgId, section)`. No `crypto.randomUUID()` for company_info sections.
- For nested fields (`primary_contact.email` etc.), section name is the dotted leaf; section name in the record is the literal string (e.g., `'primary_contact.email'`).
- Dirty diff MUST treat empty pre-fills (no MPI record + no Org-level fallback) as "not dirty unless user typed". Original snapshot for these is "empty"; if user submits empty, no record is written.
- "Skip for now" MUST navigate to the Phase 30 surface (Router.navigate to `/projects` or whatever Phase 30 settles on; document the assumed path and let Phase 27/30 wire-up adjust if it diverges).
- The `onboarding_complete` MPI record's `data` is the ISO date string at save time (`new Date().toISOString().split('T')[0]`). Status `active`.

### Verification path (goal-backward sketch covering CP-01..CP-08)
- **CP-01:** Read the rendered template; assert it renders one form-control bound to each of the 17 catalog sections (excluding `onboarding_complete` which is system-only).
- **CP-02:** Pre-fill spec — given mocked GQL response with N MPI records + mocked `Org.getOrg` returning name/avatarUrl, the form initializes to those values; no override of MPI-present sections by Org-level fallback.
- **CP-03:** Spec — fields with no MPI record AND no Org-level fallback render the "please provide" hint (assert hint text + the data-attr / class the component uses).
- **CP-04:** Save spec — modify N fields, click save; assert PipelineWriteService.pushEntity (or the batched `receive` equivalent) is called once with a record array containing exactly the dirty N fields, each with deterministic id.
- **CP-05:** Same save spec; assert the array also includes the `onboarding_complete` record with today's ISO date.
- **CP-06:** Skip spec — click skip; assert Router.navigate('/projects') called and PipelineWriteService is NEVER called.
- **CP-07:** Routing-integration test — given the GQL response includes `onboarding_complete` for the user's org, Phase 27's guard (or its stub for now) routes the user past `/onboarding/company-profile` directly to `/projects`. If Phase 27 is unimplemented, this test stubs the guard and only validates the routing decision the Phase 28 surface relies on. Document the stub in the test.
- **CP-08:** All four flows (`pre-fill`, `save`, `skip`, `repeat-login-skip`) covered by `*.spec.ts` files committed alongside the component/service.

</specifics>

<deferred>
## Deferred Ideas

- LLM-assisted enrichment of known-unknowns (separate future director brief consumes Phase 28's known-unknown surface).
- Document upload / attachment UI (v1.5+).
- Non-profile company-info fields (banking, insurance, compliance attestation, certificates) — different sections, different lifecycle (uses `expiresAt`).
- Multi-org currentOrg switcher within this form (single currentOrg assumed; user changes via the existing org-switcher elsewhere).
- Fully mocking pre-fill SDKs in unit tests (integration-level harness handles end-to-end pre-fill from real GQL/SDK; specs use unit-level mocks of the service layer).
- Validating the `company_info` convention covers every conceivable future field — convention is extensible per Phase 26 ratification; Phase 28 codifies the v1.4 baseline.
- Phase 30 "complete your profile" nudge — Phase 30 owns it.
- The "edit later" entry path from Phase 30 → company-profile form — discretionary; do not let it expand Phase 28 surface area.

</deferred>

---

*Phase: 28-company-profile-form*
*Context gathered: 2026-04-30 from director brief + companion conventions + DECISIONS.md*
