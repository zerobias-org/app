# Phase 28: Company Profile Review/Confirm Form — Research

**Researched:** 2026-04-30
**Domain:** Angular 21 form component + ZeroBias SDK integration + AuditgraphDB write/read patterns
**Confidence:** HIGH

## Summary

Phase 28 implements a structured company-profile review form for the onboarding flow. The form pre-fills from one GQL query reading MarketplaceProfileItem records grouped by section, optionally falls back to Org-level fields (legal_name, logo_url), and on save writes only dirty fields as separate MPI records via Pipeline.receive in a single batch. The locked contracts from Phase 25/26 audits and the DECISIONS.md discovery patterns provide the data shapes; existing `PipelineWriteService` and `GraphqlReadService` primitives are ready to compose. The core challenge is NOT the infrastructure—it exists—but form binding, dirty-diff tracking, and org-id resolution at mount time. ngx-library components cover all field types needed.

**Primary recommendation:** Build a lean `MarketplaceProfileService` that translates between form struct ↔ MPI record array; compose `GraphqlReadService.query()` (read), `PipelineWriteService` batching (write), and Angular's reactive forms for dirty tracking. Use ngx-library form controls (search input for primary contact picker, autocomplete for employee bucket, text areas for descriptions). Model current org ID via `ZerobiasClientApp.getCurrentOrgId()` at mount; query all fields for that org in one call; snapshot the pre-fill and diff on save.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/forms` (reactive) | ^21.1.4 | Form building, control binding, validation | Angular 21 native; FormGroup/FormControl support `input()`/`inject()` patterns |
| `@zerobias-org/ngx-library` | 0.2.25 | UI components (form fields, autocomplete, buttons, panel) | Project standard per CLAUDE.md; form controls available; Material defaults pre-configured via `provideZbDefaults()` |
| `@angular/material` | ^21.1.4 | Underlying form-field, tabs, snackbar, dialog (via ngx-library) | Already in use; ngx-library wraps Material defaults |
| `GraphqlReadService` | local | Read MPI records from AuditgraphDB | Existing primitive; query `MarketplaceProfileItem(orgId: ".eq.<id>")` in one call |
| `PipelineWriteService` | local | Write MPI records via Pipeline.receive | Existing primitive; validates class id, batches data array, handles caching |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@zerobias-com/zerobias-client` | (from app.config.ts) | SDK: `danaOld.Org.getOrg()`, `hydra.Org.searchOrgMembers()` | Pre-fill fallbacks (org name, avatar); primary contact member picker |
| `@angular/material/autocomplete` | ^21.1.4 | Filtered dropdown (primary contact member list) | Included via ngx-library; use for org-member search |
| `@angular/material/dialog` (via ngx-library) | ^21.1.4 | Optional error/confirmation dialogs | Snackbar + re-throw pattern per Phase 20 error model |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ngx-library form components | Angular Material directly | Material raw, no ZB theme tokens; loses built-in defaults (`ZB_FORM_FIELD_DEFAULTS`) |
| Reactive FormGroup | Template-driven forms | Template-driven lacks typed access, harder to dirty-track |
| Separate read + write calls per field | Single `MarketplaceProfileItem(orgId)` GQL query | Single call is standard (Phase 25 audit recommendation); per-field reads are N+1 antipattern |

**Installation:**
```bash
# Already installed as part of app dependencies
npm install  # if needed: validates @zerobias-org/ngx-library@0.2.25 + dependencies
```

**Version verification:**
The versions listed are current as of the dependency tree in the project. ngx-library 0.2.25 is installed (verified `node_modules/@zerobias-org/ngx-library/package.json`). Angular 21.1.4 is the project baseline.

## ngx-library Form Components (mapping the 17 sections)

Mapped all 16 user-facing form sections + system marker against ngx-library + Material components available:

| Section | Type | Required | Form Control Type | ngx-library / Material Component | Notes |
|---------|------|----------|-------------------|---------------------------------|-------|
| `legal_name` | string | yes | text input | `<input matInput>` (Material; ngx-library wraps in `ZbSimplePanelComponent` for layout) | Required validator; non-empty |
| `dba` | string | no | text input | `<input matInput>` | Optional; max 255 chars |
| `logo_url` | URL string | no | text input | `<input matInput>` + `urlValidator` | Optional; validate HTTPS URL pattern via custom validator |
| `short_blurb` | string | no | textarea | `<textarea matInput>` | Optional; max 500 chars; hint text for limit feedback |
| `long_description` | string | no | textarea | `<textarea matInput>` | Optional; max 5000 chars; hint text for limit feedback |
| `primary_contact.user_id` | UUID string | no | autocomplete select | `ZbSimpleAutocompleteComponent` (ngx-library 0.2.25+) or Material `mat-autocomplete` + `hydra.Org.searchOrgMembers` | Fetches org members on focus; user selection auto-fills name + email |
| `primary_contact.name` | string | no | text input (read-only or derived) | `<input matInput readonly>` | Auto-derived from selected user via member lookup |
| `primary_contact.email` | email string | no | text input (read-only or derived) | `<input matInput readonly>` + `emailValidator` | Auto-derived from `hydra.Org.getRequestOrgMember(userId).member.emails[0]` |
| `website` | URL string | no | text input | `<input matInput>` + `urlValidator` | Optional; validate HTTPS URL |
| `hq_location.street` | string | no | text input | `<input matInput>` | Optional; no length constraint per convention |
| `hq_location.city` | string | no | text input | `<input matInput>` | Optional |
| `hq_location.state` | string | no | text input | `<input matInput>` | Optional; hint: "region or state abbreviation" |
| `hq_location.country` | string | no | text input | `<input matInput>` | Optional |
| `hq_location.postal_code` | string | no | text input | `<input matInput>` | Optional |
| `years_in_business` | number-as-string | no | number input | `<input matInput type="number" min="0">` | Optional; integer ≥ 0 |
| `employee_count` | bucket string | no | select / radio group | `<mat-select>` (Material) or `<mat-radio-group>` | Optional; one of: `1-10`, `11-50`, `51-200`, `201-500`, `500+`. Material select is standard in ngx-library stacks |
| `onboarding_complete` | ISO date (system) | — | hidden/computed | N/A | Set by save handler, not user-editable |

**ngx-library availability notes:**
- `ZbSimpleAutocompleteComponent` exists in public API (verified in node_modules type defs); use for primary-contact member picker. Falls back to Material `mat-autocomplete` if ngx-library autocomplete is not suitable.
- No built-in "multi-select address" component; use individual text inputs for address parts per the flat-sub-section pattern.
- `ZbSimplePanelComponent` available for section grouping (optional UX polish, not required).
- `ZbSearchInputComponent` available for autocomplete search prefix matching (primary contact member search).

**Form layout strategy (Claude's discretion per Phase 28 CONTEXT.md):**
- Reactive FormGroup with nested FormGroups for `primary_contact` and `hq_location` (mirrors schema structure).
- Sections grouped visually (e.g., company basics, contact, location, financials).
- Pre-fill annotations: "(pre-filled from platform)" label next to auto-filled fields (optional but recommended per brief).
- Empty fields with no platform fallback: "(please provide)" placeholder or hint.

## Current Org Resolution & SDK Calls

**Current org ID resolution:**
- `ZerobiasClientApp.getCurrentOrgId()` — primary method, used in existing services (`org-switcher.service.ts`, `sme-mart-tag.service.ts`, etc.).
- **Pattern in the codebase:** `const app = inject(ZerobiasClientApp); const orgId = app.getCurrentOrgId();` — synchronous call; returns UUID string or undefined.
- **When available:** After `ZerobiasAppService.init()` completes (part of `app.config.ts` bootstrap via `provideAppInitializer`). Org selection happens in `ZerobiasClientApp.selectOrg()` during init; resolved from `danaOld.Org.listMyOrgs()`.
- **Storage:** Cached in sessionStorage key `zb-current-dana-org-id` by the SDK; persists across page reloads within the same session.

**SDK calls needed for Phase 28:**

| Call | Purpose | Shape | Notes |
|------|---------|-------|-------|
| `danaOld.Org.getOrg(orgId)` | Fetch Org name + avatarUrl for fallback pre-fills | Returns `{ id, name, avatarUrl, ... }` | Used for `legal_name` fallback (Org.name) and `logo_url` fallback (Org.avatarUrl) |
| `graphql.Boundary.boundaryExecuteRawQuery(boundaryId, "{ MarketplaceProfileItem(orgId: ".eq.<id>") { id, section, data, status, expiresAt } }")` | Fetch all MPI records for current org | Returns array of `{ id, section, data, status, expiresAt }` | Grouped client-side by section; one call per form mount |
| `hydra.Org.searchOrgMembers(orgId, { pageNumber: 1, pageSize: 100 })` | Fetch org members for primary-contact picker | Returns `{ items: [{ id, member: { name, emails, ... } }], page: { totalCount } }` | Called when primary-contact-user-id field gets focus (lazy); enables autocomplete search |
| `hydra.Org.getRequestOrgMember(orgId, userId)` | Fetch single member's full email list | Returns `{ member: { name, emails: [{ email, ... }], ... } }` | Called when user selects a member; extracts primary email for `primary_contact.email` |

**How org ID is passed:**
- Form component receives orgId via `inject(ZerobiasClientApp).getCurrentOrgId()` directly in the service.
- No need to pass orgId as a route param or input; it's globally resolved post-auth.
- If orgId is undefined at mount (theoretically impossible if auth gate works), form should show error + retry.

**Type hints:**
- `ZerobiasClientApp` comes from `@zerobias-com/zerobias-client` (injected as `ZerobiasClientApp` via app.config.ts).
- `getCurrentOrgId()` returns `string | undefined`.
- GraphQL boundary query uses existing `GraphqlReadService.query('MarketplaceProfileItem', [...], { filters: { orgId: `.eq.${id}` } })`.

## PipelineWriteService Batch Path & Write Shape

**Current state of PipelineWriteService:**
- `pushEntity(className: SmeMartClassName, gqlData: Record<string, unknown>, tagIds?: UUID[], callSiteTag?: string): Promise<void>`
  - Takes one entity at a time. Pushes to Pipeline.receive internally as a single-item batch.
  - Returns fire-and-forget (Promise resolves after the call, not on ingestion).
  - Has write-through cache (expires 60s).
- No dedicated `pushEntities()` method (batch path doesn't currently exist).
- Source: `src/app/core/services/pipeline-write.service.ts` lines 1–200+ (read limit excerpt; full file is longer).

**What Phase 28 needs:**
- **One `Pipeline.receive` batch per save click**, containing N records (one per dirty field) + the `onboarding_complete` record.
- Current `pushEntity()` loops N times = N separate calls to Pipeline.receive (inefficient, not violating but wasteful).

**Recommended path (best practice):**
Build a `MarketplaceProfileService` that calls `PipelineWriteService` once per save OR calls the underlying SDK client directly:

```typescript
// Option A: Use PipelineWriteService (simpler, leverages caching)
// — Call pushEntity() N times in sequence or parallel (current fire-and-forget model)
// — Each call batches internally but sends separate Pipeline.receive calls
// — Acceptable if Phase 28 serializes writes (one dirty field at a time), which is unlikely

// Option B: Call underlying SDK client for true batching (recommended)
// — Access this.clientApi.platformClient.getPipelineApi().receive(pipelineId, { classId, tagIds, data: [N records] })
// — Single call, N-item data array, one batch on wire
// — Requires direct SDK knowledge but matches the brief's intent
```

**Preferred approach (Option B — direct SDK call):**
```typescript
import { SimpleBatch } from '@zerobias-com/platform-sdk';

// In MarketplaceProfileService.save()
const batch: SimpleBatch = {
  classId: MPI_CLASS_ID,
  tagIds: [], // no cross-cutting tags for MPI
  data: [
    { id: 'mpi-<orgId>-legal_name', orgId, section: 'legal_name', data: 'value', status: 'active' },
    { id: 'mpi-<orgId>-dba', orgId, section: 'dba', data: 'value', status: 'active' },
    // ... per dirty field
    { id: 'mpi-<orgId>-onboarding_complete', orgId, section: 'onboarding_complete', data: isoDate, status: 'active' },
  ],
};
await this.clientApi.platformClient.getPipelineApi()
  .receive(PIPELINE_ID, batch, false); // false = no includeRawData
```

**MPI class ID verification (CRITICAL):**
- Canonical: **`7bcf86a5-91dc-520d-b9bf-e308b1078d46`** (verified via `platform.Class.getClass()` 2026-04-28).
- Currently in `pipeline-write.service.ts` line 36: `MarketplaceProfileItem: '7bcf86a5-91dc-520d-b9bf-e308b1078d46',` ✅ **CORRECT as of Plan 26-04**.
- Plan 26-04 fixed the codebase const from fictional `ee1e68b7-...` to canonical value.
- Phase 28 must reference the const, not hardcode.

**Record shape contract (locked):**
```typescript
interface MpiRecord {
  id: string;                    // deterministic: 'mpi-<orgId>-<section>'
  orgId: string;                 // owning org UUID
  section: string;               // canonical section name from COMPANY-INFO-CONVENTION.md
  data: string;                  // plain string value (never JSON-encoded)
  status: 'active' | 'archived'; // always 'active' for new company_info records
}
```

No `name` field, no `description` field (those belong to vendor-profile.service, which JSON-encodes differently).

## GraphqlReadService Usage Pattern

**Existing service shape:**
```typescript
query<T>(
  className: SmeMartClassName,
  fields: string[],
  options: GqlQueryOptions = {},
): Promise<GqlQueryResult<T>>
```

**Example from vendor-profile.service (similar pattern, different class):**
```typescript
const result = await this.graphqlRead.query<GqlMarketplaceProfileItemResponse>(
  'MarketplaceProfileItem',
  ['id', 'section', 'data', 'status', 'expiresAt'],
  {
    filters: { orgId: `.eq.${orgId}` },
    pageSize: 200,  // high pageSize to fetch all records for the org in one call
  },
);
```

**Phase 28 query shape:**
```typescript
const allRecords = await this.gqlRead.query<MpiRecord>(
  'MarketplaceProfileItem',
  ['id', 'section', 'data', 'status', 'expiresAt'],
  {
    filters: { orgId: `.eq.${this.currentOrgId}` },
    pageSize: 999, // no pagination needed for company_info (≤16 sections per org)
  },
);
// Group client-side
const bySection = new Map<string, MpiRecord>();
allRecords.items
  .filter(r => r.status === 'active')
  .forEach(r => bySection.set(r.section, r));
```

**Error handling:**
- If query returns 0 items: all fields should render as empty with "(please provide)" hints (except `legal_name`, which has Org fallback).
- Empty result is NOT an error; it's the initial state.
- GQL errors (network, boundary mismatch) should surface a snackbar + allow retry.

## Routing & Auth Integration Seam

**Current routing state:**
- `src/app/app.routes.ts` defines the root route tree. Currently has `/providers`, `/services`, `/rfps`, `/engagements`, etc.
- No `/onboarding/*` routes exist yet (Phase 28 adds them; Phase 27 hasn't run yet).
- Auth is handled by `AppInitService.init()` (part of `app.config.ts` bootstrap). Phase 27 will add the session check + lazy-load default-engagement guard there.

**Phase 27 contract (per phase-27-brief.md):**
- Phase 27 wires the auth gate and onboarding routing DECISION logic.
- Phase 27 reads the `onboarding_complete` MPI section to decide: route to Phase 28 form (if missing) or Phase 30 board (if present).
- Phase 28 DOES NOT own this routing decision; Phase 27 owns it.

**Phase 28's routing task (scoped):**
- Assume Phase 27 wires a guard that delivers authenticated, first-time users to `/onboarding/company-profile`.
- Phase 28 owns the component at that route and the form save flow.
- On successful save: navigate to Phase 30 surface (assumed path: `/projects` or `/my/projects` per existing routes; confirm exact path with Phase 27 planner).
- On skip-for-now: same navigation to Phase 30 WITHOUT writing `onboarding_complete`.
- On repeat login with `onboarding_complete` marker present: Phase 27 guard bypasses the form and routes to Phase 30 directly (Phase 28 does NOT implement this; Phase 27 owns the skip logic).

**Assumed Phase 28 route definition (to be added to app.routes.ts):**
```typescript
{
  path: 'onboarding',
  canActivate: [/* Phase 27 guard — TBD */],
  children: [
    { path: 'company-profile', component: CompanyProfileFormComponent },
    // Phase 28 may add edit-later route here post-MVP (out of Phase 28 scope per brief)
  ],
}
```

**Navigation on success/skip:**
```typescript
// Phase 28 form component
constructor(private router = inject(Router)) {}

onSave() {
  // ... write via service ...
  await this.service.save(dirtyFields);
  this.router.navigate(['/projects']); // assumed Phase 30 entry; confirm with Phase 27 planner
}

onSkip() {
  // Do NOT write onboarding_complete
  this.router.navigate(['/projects']);
}
```

**Phase 27 guard stub for Phase 28 routing-integration tests:**
- Phase 28 unit tests for routing integration (CP-07) will need to stub or mock the Phase 27 guard.
- Recommendation: Create a test-only route guard that reads the `onboarding_complete` MPI record and makes the routing decision in-test.
- Actual Phase 27 guard will be more complex (with bootstrap logic); Phase 28 tests can use a simplified version.

## Gotchas, Anti-Patterns, Open Questions

### Gotcha 1: Accidental Reuse of vendor-profile.service.ts Patterns
**What goes wrong:** Phase 28 form's save handler accidentally reuses `vendor-profile.service.ts` sections (corporate_identity, attestation, insurance, reference, personnel, financial) or its JSON-encoding pattern for `data` field.
**Why it happens:** Both services use `MarketplaceProfileItem` class; similar names (`section`, `data`) suggest copy-paste reuse.
**How to avoid:** Build a new `MarketplaceProfileService` with its own section constants (from COMPANY-INFO-CONVENTION.md constants file). company_info sections are flat strings; vendor sections use JSON-encoded objects. Keep them separate.
**Warning signs:** Form pre-fill returns JSON-encoded data for `short_blurb` or `primary_contact` (should be plain strings or sub-sections). Section names include JSON keys like `"attestation"` when they should be `"legal_name"`, `"dba"`, etc.

### Gotcha 2: Crypto.randomUUID() for MPI IDs
**What goes wrong:** Form save generates record ids using `crypto.randomUUID()` or `UUID.randomUUID()`, resulting in non-deterministic ids each save.
**Why it happens:** Developer assumes "id must be UUID-shaped" and generates fresh UUIDs per record.
**How to avoid:** Ids are deterministic based on `(orgId, section)`. Format: `mpi-<orgId>-<section>`. Pre-compute once at mount; reuse on save.
**Warning signs:** Form saves successfully but GQL query on next load shows multiple records per section (duplicate ids with different values). Pipeline.receive replace key is `id`; non-deterministic ids defeat the replace contract.

### Gotcha 3: Field-Mappings Utilities Misapplied
**What goes wrong:** Form uses `mapNeonToGql()` or `mapGqlToNeon()` from `field-mappings.ts`, expecting field-name translation (e.g., `legalName` → `legal_name`).
**Why it happens:** `field-mappings.ts` exists and has those functions; developer assumes they're general-purpose.
**How to avoid:** `field-mappings.ts` is for Neon ↔ GQL schema translation (used by vendor-profile, vetting, etc.). Company_info uses plain section names (no camelCase ↔ snake_case translation). Read by `section` directly from GQL.
**Warning signs:** Form queries for `legalName` field and gets 0 results (should query for `legal_name` field via `filters: { section: ".eq.legal_name" }`). Or, record ids use camelCase (`mpi-orgId-legalName`) instead of snake_case.

### Gotcha 4: Dirty-Diff Behavior for Org-Fallback Pre-Fills
**What goes wrong:** Form saves an unchanged Org-fallback pre-fill (e.g., `legal_name` came from `Org.name`, user did not edit it, but form still writes a new MPI record on save).
**Why it happens:** Brief says "un-edited pre-fills from EXISTING MPI records are no-ops" (replace is by id, omit them from the batch). But Org-fallback pre-fills are NOT from existing MPI records; they're computed on the fly from the Org SDK call.
**How to avoid:** Clarify and document the dirty-diff semantics:
   - **Pre-fills from existing MPI records:** Omit from save if unchanged (no-op via id-replace).
   - **Pre-fills from Org fallback:** Write a NEW MPI record on save (first-time persistence of "we derived this from Org name, now we own the data").
   - **Empty pre-fills (no MPI, no Org fallback):** Write only if user typed something (normal dirty-check).

**Recommendation:** The brief's intent is "save only user-edited values." For Org fallbacks, interpret as: "On first save, if user did not edit the Org-fallback field, skip it (don't write a new record); if user edited it, write it (now it's user-owned data, not derived)." This preserves the single-source-of-truth principle: if the MPI record doesn't exist, the Org field is authoritative and doesn't need to be copied.

**Warning signs:** Form saves and creates MPI records for `legal_name` and `logo_url` even though user never edited them. Subsequent logins show the same values pre-filled again. No harm, but wasteful and violates the spirit of "only dirty fields."

### Gotcha 5: Forgot to Snapshot Original Form State for Dirty Tracking
**What goes wrong:** Dirty diff only compares against empty/default state, not the actual pre-fill values. Form saves unchanged pre-fill fields.
**Why it happens:** FormControl dirty flag is built-in but only tracks "ever touched," not "value changed." Developer forgets to snapshot the pre-fill state.
**How to avoid:** On form mount (after pre-fill resolves), capture the form state: `const originalState = this.form.value;`. On save, compare `form.value` against `originalState`, field by field. Only include fields where `current !== original`.
**Warning signs:** Form saves many fields even though user only edited one. Or, form doesn't save fields that user DID edit (reversed logic).

## Validation Architecture (Nyquist)

**Validation framework status:**
- Project uses **Jest** (verified `package.json` with `test` script: `ng test`).
- Test configuration: `ng test` runs Vitest/Jest via Angular CLI.
- Existing test files in project: `*.spec.ts` alongside components/services (e.g., `org-switcher.service.spec.ts`).

### Test Scope

Phase 28 test scope (per CP-08 in the brief):
- **Unit tests only** — form component, service, dirty-diff logic.
- **Four flows** covered: pre-fill (with existing MPI + with fallback), save (correct record shape, only dirty fields), skip (no onboarding_complete written), repeat-login-skip (form routing skipped if marker present).
- **No integration/E2E** — Phase 28 scope does not include full browser test stack (separate future test-infra milestone).
- **No test-infra work** — Phase 28 does NOT upgrade Jest, add fixtures, or build a shared test-data factory (separate P4 work).
- **Touched-component tests only** — if form component or service is modified, the `.spec.ts` file for that component/service must be present and passing.

### Per-Criterion Validation Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CP-01 | Form renders 16 user-facing sections (legal_name, dba, logo_url, short_blurb, long_description, primary_contact.user_id/name/email, website, hq_location.street/city/state/country/postal_code, years_in_business, employee_count) | unit | `npm test -- src/app/onboarding/company-profile-form.component.spec.ts -t "renders all 16 form sections"` | ❌ Wave 0 |
| CP-02 | Pre-fill: GQL query returns N MPI records for currentOrgId; service groups by section; form binds struct-shaped model with those values | unit | `npm test -- src/app/core/services/marketplace-profile.service.spec.ts -t "pre-fill from MPI records"` | ❌ Wave 0 |
| CP-03 | Pre-fill without MPI record: form renders "(please provide)" hint; empty fields are editable | unit | `npm test -- src/app/onboarding/company-profile-form.component.spec.ts -t "renders please-provide hint for empty fields"` | ❌ Wave 0 |
| CP-04 | Save: modify N fields, click save; PipelineWriteService (or underlying SDK batch) called with array of N records, each with deterministic id, section, data, status | unit | `npm test -- src/app/core/services/marketplace-profile.service.spec.ts -t "save writes only dirty fields with correct record shape"` | ❌ Wave 0 |
| CP-05 | Post-save, onboarding_complete MPI record written (section='onboarding_complete', data=ISO date, status='active') | unit | `npm test -- src/app/core/services/marketplace-profile.service.spec.ts -t "save includes onboarding_complete marker"` | ❌ Wave 0 |
| CP-06 | Skip-for-now button navigates to /projects; no PipelineWriteService call made | unit | `npm test -- src/app/onboarding/company-profile-form.component.spec.ts -t "skip routes to projects without writing"` | ❌ Wave 0 |
| CP-07 | Routing integration: if GQL response includes onboarding_complete section, Phase 27 guard (or test stub) routes user past /onboarding/company-profile to /projects | unit (routing integration stub) | `npm test -- src/app/onboarding/company-profile-form.component.spec.ts -t "routing skips form if onboarding_complete present"` | ❌ Wave 0 |
| CP-08 | All four flows (pre-fill, save, skip, repeat-login-skip) covered by *.spec.ts tests | unit | `npm test -- src/app/` (runs all specs; verify `*.spec.ts` files exist and pass) | ❌ Wave 0 |

### Stubs / Mocks / Spies

**Mock setup (per test):**

```typescript
// Mock GraphqlReadService
const mockGqlRead = {
  query: vi.fn().mockResolvedValue({
    items: [
      { id: 'mpi-<orgId>-legal_name', section: 'legal_name', data: 'Acme Inc', status: 'active', expiresAt: null },
      { id: 'mpi-<orgId>-dba', section: 'dba', data: 'Acme Trading', status: 'active', expiresAt: null },
      // ... other fields
    ],
    page: { pageNumber: 1, pageSize: 50, totalCount: 8 },
  }),
};

// Mock PipelineWriteService (or underlying SDK platformClient)
const mockPipelineWrite = {
  pushEntity: vi.fn().mockResolvedValue(void 0),
  // OR spy on platformClient.getPipelineApi().receive() directly if using Option B
};

// Mock ZerobiasClientApp for org ID + SDK calls
const mockZbApp = {
  getCurrentOrgId: vi.fn().mockReturnValue('cd7105df-523d-5392-9f9a-3f83d3f30107'),
  // ... other methods
};

// Mock Router for navigation
const mockRouter = {
  navigate: vi.fn().mockResolvedValue(true),
};
```

**Spy assertions (CP-04 example):**

```typescript
// After calling form.save()
expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
  'MarketplaceProfileItem',
  expect.objectContaining({
    id: 'mpi-cd7105df-523d-5392-9f9a-3f83d3f30107-legal_name',
    orgId: 'cd7105df-523d-5392-9f9a-3f83d3f30107',
    section: 'legal_name',
    data: 'Edited Name',
    status: 'active',
  }),
  [],
  expect.any(String), // callSiteTag
);
// Verify N calls total (one per dirty field)
expect(mockPipelineWrite.pushEntity).toHaveBeenCalledTimes(3); // e.g., 3 dirty fields + 1 onboarding_complete = 4 calls... OR
// If using batch: expect ONE call to platformClient.getPipelineApi().receive() with data array of length 4
```

### Routing-Integration Test Treatment for Phase 27 Guard (Not Yet Built)

**Challenge:** Phase 28's CP-07 test (repeat-login-skip) depends on Phase 27's routing decision logic. Phase 27 has not started yet; the actual guard does not exist.

**Recommended solution (for Phase 28 unit tests):**

1. **Stub the Phase 27 guard in Phase 28 tests only** (do NOT commit the stub to the routing tree).
   ```typescript
   // Test setup only (not in app.routes.ts yet)
   const stubOnboardingGuard = (): boolean | Observable<boolean> => {
     return this.marketplaceProfile.getCompletionStatus()
       .then(completed => completed ? true : '/onboarding/company-profile');
   };
   ```

2. **Test what Phase 28 owns:** If `onboarding_complete` section is present in GQL response, Phase 28 service's `getCompletionStatus()` returns `true`.

3. **Test what Phase 27 owns (as a comment/documentation):** The guard uses the service to decide routing. Phase 28 doesn't test the actual guard; Phase 28 tests that the service's completion status is observable.

4. **Document the assumption:** In the test file, add a comment:
   ```typescript
   // Phase 28 test assumes Phase 27 implements a guard that:
   // 1. Calls marketplaceProfile.getCompletionStatus()
   // 2. Routes to /projects if true (completed)
   // 3. Routes to /onboarding/company-profile if false (incomplete)
   //
   // This test verifies the service's behavior. The actual guard
   // is owned and tested by Phase 27.
   ```

5. **Verify the integration later:** Once Phase 27 is complete, a manual test or E2E test can verify the full guard → form routing flow (out of Phase 28 scope).

### Wave 0 Gaps

- [ ] `src/app/onboarding/company-profile-form.component.ts` — standalone component, renders form fields
- [ ] `src/app/onboarding/company-profile-form.component.html` — template, form bindings
- [ ] `src/app/onboarding/company-profile-form.component.scss` — styling (ngx-library defaults + minimal custom)
- [ ] `src/app/onboarding/company-profile-form.component.spec.ts` — unit tests for CP-01, CP-03, CP-06, CP-07
- [ ] `src/app/onboarding/company-info-sections.ts` — constants for all section names (`SECTION_LEGAL_NAME = 'legal_name'`, etc.)
- [ ] `src/app/onboarding/company-info.model.ts` — TypeScript interface for form struct and dirty-diff types
- [ ] `src/app/core/services/marketplace-profile.service.ts` — read (GQL query → group → project), write (struct → diff → batch), completion-status check
- [ ] `src/app/core/services/marketplace-profile.service.spec.ts` — unit tests for CP-02, CP-04, CP-05, CP-08
- [ ] `src/app/app.routes.ts` — add `/onboarding/company-profile` route (wired by Phase 27 guard, populated by Phase 28 component)

*(If gaps exist: "None — existing test infrastructure covers all phase requirements" — but it doesn't; Wave 0 gaps are real.)*

## Sources

### Primary (HIGH confidence)
- **COMPANY-INFO-CONVENTION.md** — canonical 17-section catalog, flat sub-section pattern, validation rules (verified Phase 26 ratification 2026-04-28)
- **PLATFORM-DATA-INVENTORY.md** — Phase 25 pre-fill map, known unknowns, GQL query shape (live-verified 2026-04-27)
- **phase-28-brief.md** — requirements CP-01..CP-08, deliverables, dependencies
- **phase-27-brief.md** — routing contract, guard responsibility, integration seam
- **DECISIONS.md** — MarketplaceProfileItem replace semantics (validated UAT experiment), Platform-Assigned Class IDs (corrected const), W3Geekery Object.tag remediation
- **pipeline-write.service.ts** (in codebase) — class id const verified `7bcf86a5-91dc-520d-b9bf-e308b1078d46`, batch path shape
- **graphql-read.service.ts** (in codebase) — query shape, filter syntax, pagination
- **vendor-profile.service.ts** (in codebase) — anti-pattern reference (JSON-encoding, different sections)
- **app.config.ts** (in codebase) — auth bootstrap, ZerobiasClientApp DI, environment setup
- **ngx-library types** (node_modules/@zerobias-org/ngx-library/types/zerobias-org-ngx-library.d.ts) — component inventory (0.2.25)

### Secondary (MEDIUM confidence)
- **MODERNIZATION_GUIDE.md** — Angular 21 patterns (`input()`/`output()`/`inject()`, no constructor injection)
- **app.routes.ts** (in codebase) — current routing tree, loading strategy, reserved paths
- Existing services using `inject(ZerobiasClientApp).getCurrentOrgId()` (org-switcher.service.ts, impersonation.service.ts) — established pattern for org resolution

### Tertiary (LOW confidence, flagged for validation)
- None — research is narrowly scoped to locked contracts and existing code patterns.

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — all components verified present in node_modules or SDK; class IDs canonicalized; pipeline semantics empirically validated
- **Architecture:** HIGH — org-id resolution pattern established in codebase; dirty-diff logic standard Angular; service composition pattern mirrors vendor-profile
- **Pitfalls:** HIGH — documented in context briefs; anti-patterns specific to Phase 28's use of MPI
- **Validation Architecture:** MEDIUM — test scope is clear, but test-infra harness (Jest setup, shared fixtures) is deferred; Wave 0 assumes developers write tests alongside components per standard practice

**Research date:** 2026-04-30
**Valid until:** 2026-05-07 (7 days; spec locked, infra stable)

## RESEARCH COMPLETE
