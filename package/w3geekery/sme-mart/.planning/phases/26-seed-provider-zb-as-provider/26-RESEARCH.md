# Phase 26: Seed Provider (ZB-as-Provider) — Research

**Researched:** 2026-04-27
**Domain:** Platform data seeding, MarketplaceProfileItem ingestion, provider UI integration, hydra tag discovery
**Confidence:** HIGH (locked decisions from Phase 25 + DECISIONS.md provide empirically validated foundations)

## Summary

Phase 26 seeds ZeroBias as a first-class marketplace provider on UAT by ingesting MarketplaceProfileItem records via `platform.Pipeline.receive`. The decision architecture centers on one critical fork: **choosing the platform-provider distinguisher mechanism** (hydra tag, section field, or orgId filter) before seeding. All other deliverables have clear, locked paths.

The existing Browse Providers UI currently reads from a Neon VIEW (`v_provider_directory`), not from GQL MarketplaceProfileItem. The planner must decide whether:
1. The seed lives **exclusively in GQL** (Pipeline.receive → MarketplaceProfileItem class → future hydra bulk-export to Neon), or
2. The seed **bridges both** (seeded MPI records + a follow-on Neon table insert).

**Primary recommendation:** Choose the **hydra-tag distinguisher (option a)** for symmetry with existing object-tag patterns; use GQL-exclusive seeding initially (phase 30/31 can coordinate Neon sync if display urgency demands it).

**Pre-fill & test surface:** Phase 28's company-profile form consumes seeded MPI records via `MarketplaceProfileItem(orgId: ".eq.<id>")` GQL query. The seed function produces JSON payloads with deterministic ids (`mpi-57c741cf-...-<section>`), `Object.tag` populated (if tag-based), and `markDeleted` cleanup ids. Existing `provider-card.component.spec.ts` can extend; new `provider-list.component.spec.ts` needed if list test gaps exist.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **MPI storage shape:** Generic `(section, data)` discriminator class; 17-section catalog; class id `7bcf86a5-91dc-520d-b9bf-e308b1078d46`
- **Pipeline.receive replace semantics:** Replace key is `id` only (validated via UAT experiment 2026-04-27); per-section saves are independent
- **Object.tag field shape:** Canonical shape on ingest: `tag: [{ value: "<tag-uuid>" }]` (array of objects, NOT array of strings); immutable post-ingest; set at ingest time only; `tagIds` parameter does NOT tag ingested Objects
- **W3Geekery retroactive tag push:** RESOLVED — both Engagement (`746010b7-...`) and SmeMartProject (`ea4db55f-...`) re-ingested with `Object.tag` populated during Phase 25 close; SP-04 in Phase 26 reduces to "platform-provider distinguisher decided + applied to seeded ZB MPI records"
- **ServiceOffering records:** OUT of v1.4 pending Brian confirmation of tier structure (DECISIONS.md "ServiceOfferings Defer With Brian")
- **TAG-SHAPE-TEST-C residue:** Different class (SmeMartProject); cleanup via separate batch; defer to CLEANUP-25 backlog row or next SmeMartProject ingest — Phase 26 MPI batch must NOT include it

### Claude's Discretion (Research Expected to Recommend)
1. **Platform-provider distinguisher mechanism:** (a) hydra tag `sme-mart.provider.platform`, (b) MPI `provider_type` section with `data: "platform"`, or (c) hardcoded `orgId == ZB_ORG_UUID` filter. Plan 26-01 must lock choice with rationale.
2. **Placeholder copy/branding values** for legal_name, logo_url, short_blurb, long_description (sensible production-grade text; Clark overrides at execute time)
3. **Seed script location & runtime:** One-shot script (`scripts/seed-zb-provider.ts`), CLI command, or MCP-driven runbook. Lean toward repeatable script mirroring Phase 25 pattern.
4. **Test framework:** Karma/Jasmine for component tests (`provider-card.component.spec.ts`, `provider-list.component.spec.ts`); seed-function unit test can be Vitest/Jest if outside Angular tree.
5. **MPI cleanup batch:** Inline with seed batch or separate (brief allows either).

### Deferred Ideas (Out of Scope)
- ServiceOffering records (deferred until Brian confirms tier structure)
- Real ZeroBias logo + final blurb copy (placeholders ship; copy-layer Brian ask)
- Extending `company_info` to non-provider Orgs (Phase 28 buyer profile problem)
- TAG-SHAPE-TEST-C SmeMartProject cleanup (different class; backlog row)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SP-01 | `COMPANY-INFO-CONVENTION.md` exists (renamed from `-DRAFT`), ratified for Phase 26 + Phase 28 + Phase 22 consumption | ✅ Convention finalized in Phase 25 with validated MPI shape; ready for ratification in Phase 26 (drop `-DRAFT` suffix) |
| SP-02 | ZeroBias appears as a provider in SME Mart UI (Browse Providers view lists it) | ✅ Existing `provider-list.component.ts` loads from `v_provider_directory` VIEW; seed must decide: GQL-only vs. Neon sync; recommendation: initial GQL-only, verify in Phase 30/31 |
| SP-04 | Platform-provider distinguisher decided + applied to seeded ZB MPI records | ✅ Three options researched; recommendation provided (hydra tag, option a); exact MCP call shape confirmed; Tag name constraints documented |
| SP-05 | MPI cleanup residue (`mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`) `markDeleted` in seed batch | ✅ Pipeline.receive `markDeleted` parameter accepts array of ids; example: `markDeleted: ["mpi-test-a-cd7105df", "mpi-test-b-cd7105df"]` |
| SP-06 | Unit tests for seed function + Browse Providers rendering ZB-as-provider | ✅ `provider-card.component.spec.ts` exists; extend with ZB-shaped data test; new `provider-list.component.spec.ts` spec for list rendering; seed-function unit test confirms valid Pipeline.receive payload shape |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@zerobias-com/zerobias-client` | ^1.1.23+ | SDK for ZeroBias API/GQL access (hydra, platform, danaOld namespaces) | Validated 2026-04-23; includes hydraClient |
| `@zerobias-com/zerobias-angular-client` | ^1.1.23+ | Angular wrapper for zerobias-client; dependency injection support | Provides ZerobiasAppService singleton; used in all SME Mart services |
| `@angular/core` | 21.1.4 | Component framework | SME Mart standardized stack |
| `@angular/common` | 21.1.4 | Common directives/pipes | Angular default |

### Supporting (Seed Function)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@zerobias-com/platform-dataloader` | 1.0.71+ | Reference implementation for batch ingestion via Pipeline.receive | Seed batch construction (alternative: hand-code JSON if payload is simple) |
| `ts-node` | Latest in project | Runtime TypeScript execution for `scripts/seed-*.ts` | Seed script location patterns (mirrors Phase 25) |
| `dotenv` | Latest in project | Environment variable loading | `.env.local` credentials (ZB_ORG_ID, ZB_API_KEY, etc.) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hydra tag (option a) | MPI section (option b) | Option b avoids tag plumbing, but pollutes company_info catalog with non-profile field; Phase 28 form has to skip it; less discoverable |
| Hydra tag (option a) | orgId filter (option c) | Option c is simplest to code, but hardcoded UUID in app; doesn't generalize to future platform-providers; breaks on org-rename edge cases |
| GQL-exclusive seed | Immediate Neon sync | GQL-exclusive is cleaner initially; Neon sync can happen post-Phase-26 when hydra bulk-export story matures. Current path: seed MPI via Pipeline.receive → GQL read in Phase 28 form. Display from Neon VIEW remains unchanged until explicit sync milestone |

---

## Architecture Patterns

### Seeding Pattern (Locked from Phase 25)

**What:** One-shot or repeatable `Pipeline.receive` batch pushing N `MarketplaceProfileItem` records (one per section) with deterministic ids, `Object.tag` populated per chosen distinguisher, and optional `markDeleted` cleanup ids.

**Shape (confirmed via DECISIONS.md validation):**
```typescript
{
  pipelineId: "43f08afd-7ab9-4e99-a93c-619c46adaabe",  // UAT receiver
  classId: "7bcf86a5-91dc-520d-b9bf-e308b1078d46",    // MarketplaceProfileItem
  tagIds: [],                                          // Empty — does NOT tag Objects
  data: [
    {
      id: "mpi-57c741cf-a58e-5efc-bf2f-93c4f6cf76ec-legal_name",  // Deterministic
      orgId: "57c741cf-a58e-5efc-bf2f-93c4f6cf76ec",              // ZB org UUID
      section: "legal_name",
      data: "ZeroBias",
      status: "active",
      tag: [{ value: "<platform-provider-tag-uuid>" }]  // If option (a)
    },
    // ... one per section
  ],
  markDeleted: ["mpi-test-a-cd7105df", "mpi-test-b-cd7105df"]
}
```

**When to use:** One-time initial seed for ZeroBias; future providers follow same pattern.

**Example:**
- Source: Phase 25's `COMPANY-INFO-CONVENTION-DRAFT.md`; ZeroBias org metadata
- Outputs: UAT GQL query returns `MarketplaceProfileItem(orgId: ".eq.57c741cf-...") { id, section, data, tag }` with N records

### Platform-Provider Distinguisher Decision Tree

**Decision 1: Which mechanism?**

| Option | Mechanism | Pros | Cons | Recommendation |
|--------|-----------|------|------|---|
| **(a) Hydra tag** | Create `hydra.Tag` `sme-mart.provider.platform`; push as `tag: [{ value: "<uuid>" }]` on every ZB MPI record | Discoverable via uniform `MarketplaceProfileItem(tag: {value: ".eq.<id>"})` query; matches tagging pattern for engagements/projects; future-provider friendly | Requires hydra Tag.create call (one-time) + tag-uuid in seed code; adds 1 extra field to payload | ✅ **CHOOSE THIS** — symmetry + generalizability |
| **(b) MPI section** | Add `provider_type` section with `data: "platform"` per ZB record | Stays inside MPI shape; no platform-tag plumbing; one less external dependency | Pollutes company_info catalog with non-profile field; Phase 28 form must skip it; not queryable via tag filter | ⚠️ Acceptable, but less elegant |
| **(c) orgId filter** | Hardcode `MarketplaceProfileItem.orgId == ZB_ORG_UUID` in Browse Providers service | Zero data plumbing; trivial to implement | Hardcoded UUID in code; doesn't generalize to future platform-providers; ugly to test; breaks on org-rename | ❌ Avoid — anti-pattern |

**Recommendation:** **Option (a) — hydra tag** for the following reasons:
1. Aligns with existing phase-25-validated `Object.tag` ingest pattern (already used for W3Geekery Engagement + SmeMartProject)
2. Enables GQL-level discovery: `MarketplaceProfileItem(tag: {value: ".eq.<id>"})` returns platform-providers uniformly
3. Generalizes to future providers: add new provider → create org → seed MPI records with same tag UUID
4. Test-friendly: can mock/filter by tag in unit tests without hardcoding UUIDs

### Hydra Tag Setup (if option a)

**Prerequisites (checked via `hydra.Tag.searchTags`):**
- Tag namespace `sme-mart.provider.*` may already exist (Phase 25 seeding touched `sme-mart.eng.*` tags)
- If not, create via `hydra.Tag.createTag { name: "sme-mart.provider.platform", scope: "org", ownerId: <ZB_ORG_UUID> }`
- Tag name constraints: nmtoken domain (`A-Z 0-9 . _ - :`), case insensitive, no max length. Slashes NOT allowed.

**MCP Call Shape (confirmed via DECISIONS.md):**
```typescript
// Create tag (one-time, if namespace doesn't exist)
hydra.Tag.createTag({
  name: "sme-mart.provider.platform",
  scope: "org",  // or "system" for platform-wide scope
  ownerId: "57c741cf-a58e-5efc-bf2f-93c4f6cf76ec"  // ZB org UUID
})
// Returns: { id: "<tag-uuid>", name, scope, ownerId, ... }

// Seed MPI records with tag (in Pipeline.receive data array)
{
  id: "mpi-57c741cf-...-legal_name",
  orgId: "57c741cf-...",
  section: "legal_name",
  data: "ZeroBias",
  status: "active",
  tag: [{ value: "<tag-uuid-from-createTag>" }]
}

// Query by tag (in Phase 28 or Browse Providers)
platform.Boundary.boundaryExecuteRawQuery({
  query: `
    query {
      MarketplaceProfileItem(tag: { value: ".eq.<platform-provider-tag-uuid>" }) {
        id section data orgId tag
      }
    }
  `
})
```

### Browse Providers Display Integration (No Code Change if GQL-Only)

**Current state:** `provider-list.component.ts` loads from `v_provider_directory` VIEW (Neon). Seeded MPI records land in GQL only.

**Decision point:** 
1. **GQL-only path (recommended):** Phase 26 seeds MPI → Phase 28 form queries MPI via GQL. Browse Providers remains Neon-backed. No change to provider-list.component. Phase 30/31 verification queries via GQL to confirm seed exists; Browse Providers doesn't display it until Neon sync happens (future).
2. **Dual-path:** Seed MPI → hand-insert into provider_profiles + v_provider_directory VIEW. Adds Neon maintenance burden early. Skip for Phase 26.

**Recommendation:** **GQL-only initial path.** Rationale:
- Keeps Phase 26 focused on data layer (MPI seeding) not display layer
- Phase 27/28 use GQL for auth guard + company-profile form
- Phase 30/31 verification uses GQL queries
- Neon sync can be a separate phase/hotfix if Browse Providers display urgency arises

**Verification path (Phase 26 acceptance criteria):**
```graphql
{
  MarketplaceProfileItem(orgId: ".eq.57c741cf-a58e-5efc-bf2f-93c4f6cf76ec") {
    id section data tag
  }
}
// Returns N records, one per seeded section, with tag populated (if option a)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Object.tag payload shape** | Custom JSON constructors | `tag: [{ value: "<uuid>" }]` — validated via DECISIONS.md experiment | Kevin clarified (2026-04-23): shape must be exact or schema validation fails; guessing costs 15+ minutes of failed re-pushes |
| **Deterministic MPI id generation** | Custom UUID logic | `"mpi-" + orgId + "-" + section` (string, not UUID) — locked in DECISIONS.md | MPI `id` field is `string` type; deterministic pattern enables idempotent re-runs; randomizing breaks replace-key semantics |
| **GQL filter syntax** | Manual RFC4515 string construction | ZeroBias SDK's structured input types | `tag: { value: ".eq.<uuid>" }` is dot-prefix RFC4515; using untyped strings invites syntax errors |
| **Tag creation & scope logic** | Custom org/system scope inference | `hydra.Tag.createTag` with explicit `scope: "org"` | Scope semantics are platform-specific; let Kevin's API enforce correctness |
| **Pipeline.receive payload validation** | Ad-hoc shape checking | `platform.Pipeline.receive` MCP operation (handles validation on the server) | Server's schema validator tells you immediately if shape is wrong; client-side validation is incomplete |

**Key insight:** The `Object.tag` shape (`[{ value }]` not `[{ id }]` or bare strings) was only discovered by pushing a test record and letting the validator fail. Hand-rolling assumptions costs hours of re-pushes on UAT.

---

## Runtime State Inventory

**Trigger:** Seed script will read/write MPI records on ZB org. No rename/refactor involved, but script must be idempotent (re-running should not duplicate records or change state unexpectedly).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | MPI cleanup residues: `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df` (MarketplaceProfileItem table via Pipeline). TAG-SHAPE-TEST-C (`64047b6c-...`, SmeMartProject class) also present but NOT touched in Phase 26. | Cleanup via `markDeleted: ["mpi-test-a-cd7105df", "mpi-test-b-cd7105df"]` in seed batch (same Pipeline.receive call); TAG-SHAPE-TEST-C goes to separate batch or CLEANUP-25 backlog |
| **Live service config** | Pipeline UUID (UAT): `43f08afd-7ab9-4e99-a93c-619c46adaabe` configured in `environment.uat.ts`. Hydra tag (if option a) created fresh or pre-existing; searched first. | Script reads from config; tag creation (one-time) via MCP; no manual registration needed |
| **OS-registered state** | None — seed is data-only, no registered tasks/processes/env-vars | N/A |
| **Secrets/env vars** | ZB_API_KEY, ZB_ORG_ID (W3Geekery, used for MCP auth), ZB_TOKEN (used for NPM registry if dataloader is installed) | Scripts read from `.env.local`; seed runs under W3Geekery credentials (owns the Platform pipeline on UAT); no secret name changes needed |
| **Build artifacts** | Node scripts compiled via `ts-node`; no persistent artifacts | Delete `/tmp` on re-run if needed; ts-node handles incremental compilation |

---

## Common Pitfalls

### Pitfall 1: Object.tag Shape Mismatch
**What goes wrong:** Push `tag: [{ id: "..." }]` or bare string array `tag: ["..."]` instead of `[{ value: "..." }]`; schema validation fails with leaked error message; re-push with corrected shape succeeds.

**Why it happens:** The `Object.tag` field description in schema is sparse; developers guess a plausible shape from the `multi: true` and `dataTypeName: "tag"` hints. Three of four guesses fail at server time.

**How to avoid:** Reference DECISIONS.md "Object.tag Field Shape" section; test shape on a throwaway record first (Phase 25 did this); commit exact shape to code.

**Warning signs:** Pipeline.receive returns 400/422 with "invalid shape" or leaked schema path; `object.tag` read-back shows null/empty post-ingest despite passing non-empty `tag` parameter.

### Pitfall 2: Hardcoded UUID for Platform Org in Browse Providers
**What goes wrong:** Implement option (c) with `if (org.id === "57c741cf-...")`, ship to production, then later a new platform provider (or org rename) breaks the assumption. Code review catches it too late.

**Why it happens:** Option (c) seems "simplest" at first; developers skip the generalization logic to stay on deadline.

**How to avoid:** Use the decision framework above; require option (a) or (b) in plan reviews; flag option (c) as anti-pattern in architecture docs.

**Warning signs:** UUID appearing in component code without a named constant; option (c) in initial plan without trade-off discussion.

### Pitfall 3: Missing `markDeleted` in Seed Batch
**What goes wrong:** Run seed batch, forget `markDeleted` cleanup ids, then Phase 31 verification query returns stale `mpi-test-a/b-...` records, and cleanup requires a follow-on batch.

**Why it happens:** `markDeleted` is a separate array parameter in Pipeline.receive; easy to forget if not in the initial template.

**How to avoid:** Seed function always includes `markDeleted` in the payload template; unit test asserts the ids are present.

**Warning signs:** Pipeline.receive payload construction missing the `markDeleted` key; cleanup marked as "future batch" instead of inline with seed.

### Pitfall 4: Forgetting `status: "active"` on Seeded Records
**What goes wrong:** Seed records with default/null `status` field; Phase 28 form pre-fill filters by `status: "active"` and skips the records; developer debugs why pre-fill is empty.

**Why it happens:** `status` field is optional with a default (on the server), but the convention specifies `active` as the canonical value for live records.

**How to avoid:** Seed function always sets `status: "active"` explicitly; unit test asserts it.

**Warning signs:** MPI records query returns records but `status` is null/missing; Phase 28 pre-fill logic includes a filter like `.filter(r => r.status === 'active')`.

### Pitfall 5: Assuming `tagIds` Parameter Tags Ingested Objects
**What goes wrong:** Push `tagIds: [<tag-uuid>]` in Pipeline.receive, expect ingested Objects to have `tag` field populated, then find `tag` is null post-ingest.

**Why it happens:** `tagIds` parameter is for tagging the Pipeline batch-job record itself, not the ingested Objects. Confusion with `Object.tag` field ingest parameter.

**How to avoid:** DECISIONS.md "Object.tag Field Shape" explicitly states: "`Pipeline.receive(..., tagIds: [])` parameter does NOT tag ingested Objects — leave empty." Keep `tagIds: []` in seed payload; tags go in per-record `tag: [{ value }]` field.

**Warning signs:** GQL query `{ MarketplaceProfileItem { tag } }` returns empty array even though `tagIds` was populated in ingest.

---

## Code Examples

All examples verified against DECISIONS.md and Phase 25 empirical findings.

### Seed Function: Construct Pipeline.receive Payload
```typescript
// Source: DECISIONS.md "MarketplaceProfileItem Replace Semantics" + validated shape
// Location: scripts/seed-zb-provider.ts (mirrors Phase 25 pattern)

import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';

const ZEROBIAS_ORG_ID = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec'; // UAT
const MPI_CLASS_ID = '7bcf86a5-91dc-520d-b9bf-e308b1078d46';
const PIPELINE_ID = '43f08afd-7ab9-4e99-a93c-619c46adaabe'; // UAT receiver
const PROVIDER_TAG_UUID = '...'; // Resolved by `hydra.Tag.createTag` or looked up

interface SeedSection {
  section: string;
  data: string;
}

function buildMPIRecord(section: SeedSection, platformProviderTagId?: string) {
  const id = `mpi-${ZEROBIAS_ORG_ID}-${section.section}`;
  const record: any = {
    id,
    orgId: ZEROBIAS_ORG_ID,
    section: section.section,
    data: section.data,
    status: 'active'
  };
  
  // Add Object.tag only if platform-provider distinguisher is chosen (option a)
  if (platformProviderTagId) {
    record.tag = [{ value: platformProviderTagId }];
  }
  
  return record;
}

async function seedZBProvider(client: ZerobiasClientApp) {
  // Define sections (17-section catalog from COMPANY-INFO-CONVENTION-DRAFT.md)
  const sections: SeedSection[] = [
    { section: 'legal_name', data: 'ZeroBias' },
    { section: 'dba', data: '' },
    { section: 'logo_url', data: 'https://zerobias.com/logo.png' },
    { section: 'short_blurb', data: 'Cybersecurity & compliance automation platform' },
    { section: 'long_description', data: 'ZeroBias is a platform for...' },
    { section: 'primary_contact.user_id', data: '' },
    { section: 'primary_contact.name', data: '' },
    { section: 'primary_contact.email', data: '' },
    { section: 'website', data: 'https://zerobias.com' },
    { section: 'hq_location.street', data: '' },
    { section: 'hq_location.city', data: '' },
    { section: 'hq_location.state', data: '' },
    { section: 'hq_location.country', data: '' },
    { section: 'hq_location.postal_code', data: '' },
    { section: 'years_in_business', data: '10' },
    { section: 'employee_count', data: '201-500' },
    { section: 'onboarding_complete', data: '' },
  ];

  // Build MPI records
  const records = sections
    .filter(s => s.data) // Skip empty fields (optional fields)
    .map(s => buildMPIRecord(s, PROVIDER_TAG_UUID));

  // Construct payload
  const payload = {
    pipelineId: PIPELINE_ID,
    classId: MPI_CLASS_ID,
    tagIds: [], // Empty — does NOT tag Objects (DECISIONS.md)
    data: records,
    markDeleted: [
      'mpi-test-a-cd7105df',
      'mpi-test-b-cd7105df'
    ]
  };

  // Call MCP
  const result = await client.platformClient().getPipelineApi().receive(payload);
  console.log('[SEED] Result:', result);
  return result;
}
```

### Hydra Tag Creation (if option a)
```typescript
// Source: DECISIONS.md "Object.tag Field Shape" + hydra API
// One-time call; idempotent (search first, create only if missing)

async function ensurePlatformProviderTag(client: ZerobiasClientApp): Promise<string> {
  const tagName = 'sme-mart.provider.platform';
  
  // Search for existing tag
  const existing = await client.hydraClient().getTagApi().searchTags({
    name: tagName
  });
  
  if (existing.items && existing.items.length > 0) {
    console.log(`[TAG] Found existing tag: ${existing.items[0].id}`);
    return existing.items[0].id;
  }

  // Create tag if not found
  // Tag name constraints (nmtoken): A-Z 0-9 . _ - : (no slashes)
  const newTag = await client.hydraClient().getTagApi().createTag({
    name: tagName,
    scope: 'org', // or 'system' for platform-wide scope
    ownerId: '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec' // ZB org UUID
  });
  
  console.log(`[TAG] Created new tag: ${newTag.id}`);
  return newTag.id;
}
```

### Browse Providers Pre-fill via GQL (Phase 28 usage)
```typescript
// Source: COMPANY-INFO-CONVENTION-DRAFT.md "Read pattern"
// Read-only query for form pre-fill; GQL-backed

async function getCompanyProfile(client: ZerobiasClientApp, orgId: string) {
  const query = `
    query {
      MarketplaceProfileItem(orgId: ".eq.${orgId}") {
        id
        section
        data
        status
        expiresAt
      }
    }
  `;
  
  const result = await client.boundaryClient().getGraphQLApi().executeQuery(query);
  
  // Group by section client-side
  const grouped: Record<string, string> = {};
  (result.items || []).forEach((item: any) => {
    if (item.status === 'active') {
      grouped[item.section] = item.data;
    }
  });
  
  return grouped;
}
```

### Unit Test: Seed Payload Validation
```typescript
// Source: Mock Phase 25 pattern; verify seed function produces valid payload
// File: scripts/seed-zb-provider.spec.ts (or use Karma/Jasmine if inside Angular)

import { describe, it, expect } from 'vitest';
import { buildMPIRecord, seedZBProvider } from './seed-zb-provider';

describe('seedZBProvider', () => {
  it('should construct deterministic ids for each section', () => {
    const section = { section: 'legal_name', data: 'ZeroBias' };
    const record = buildMPIRecord(section, 'tag-uuid');
    
    expect(record.id).toBe('mpi-57c741cf-a58e-5efc-bf2f-93c4f6cf76ec-legal_name');
    expect(record.orgId).toBe('57c741cf-a58e-5efc-bf2f-93c4f6cf76ec');
    expect(record.section).toBe('legal_name');
    expect(record.data).toBe('ZeroBias');
    expect(record.status).toBe('active');
  });

  it('should populate Object.tag with [{ value }] shape when platform-provider tag is provided', () => {
    const section = { section: 'legal_name', data: 'ZeroBias' };
    const tagId = 'a81cd320-243e-44eb-bdd9-9824019ef3dd';
    const record = buildMPIRecord(section, tagId);
    
    expect(record.tag).toEqual([{ value: tagId }]);
  });

  it('should omit Object.tag when platform-provider tag is undefined', () => {
    const section = { section: 'legal_name', data: 'ZeroBias' };
    const record = buildMPIRecord(section);
    
    expect(record.tag).toBeUndefined();
  });

  it('should include markDeleted cleanup ids in payload', async () => {
    const mockClient = {
      platformClient: () => ({
        getPipelineApi: () => ({
          receive: async (payload: any) => {
            expect(payload.markDeleted).toContain('mpi-test-a-cd7105df');
            expect(payload.markDeleted).toContain('mpi-test-b-cd7105df');
            return { success: true };
          }
        })
      })
    };

    await seedZBProvider(mockClient as any);
  });
});
```

### Unit Test: Provider Card ZB Data Rendering
```typescript
// Source: Extend existing provider-card.component.spec.ts
// Add test case for ZB-shaped data (corporate profile, not individual provider)

import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProviderCard } from './provider-card.component';
import type { ProviderDirectoryRow } from '../../../core/models';

function makeZBProviderData(): ProviderDirectoryRow {
  return {
    id: 'zb-provider-mpi',
    display_name: 'ZeroBias',
    headline: 'Cybersecurity & compliance automation platform',
    avatar_url: 'https://zerobias.com/logo.png',
    hourly_rate: null,
    rating_average: null,
    total_jobs_completed: 0,
    availability: 'available',
    skills: '[]',
    role_count: 0,
    review_count: 0,
  } as ProviderDirectoryRow;
}

describe('ProviderCard — Platform Provider (ZB)', () => {
  let component: ProviderCard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProviderCard],
    });
    const fixture = TestBed.createComponent(ProviderCard);
    component = fixture.componentInstance;
    component.provider = makeZBProviderData();
  });

  it('should render ZeroBias platform provider card', () => {
    expect(component.displayName()).toBe('ZeroBias');
    expect(component.initials()).toBe('ZB');
  });

  it('should render short_blurb as headline', () => {
    expect(component.provider.headline).toBe('Cybersecurity & compliance automation platform');
    // In real usage, provider-card.component.html binds headline to template
  });

  it('should handle platform provider with no rating/skills', () => {
    expect(component.rating()).toBeNull();
    expect(component.topSkills()).toEqual([]);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual UUID string construction in seed payloads | Deterministic `"mpi-" + orgId + "-" + section` pattern (string, not UUID) | Phase 25 DECISIONS.md (2026-04-27) | Enables idempotent re-runs; replace-by-id works correctly; no UUID collisions |
| `tagIds` parameter in Pipeline.receive for Object tagging | Per-record `tag: [{ value }]` field at ingest time | Phase 25 empirical validation (2026-04-23) | Tags are immutable post-ingest; must be set at ingest time; `tagIds` is for batch-record tagging only |
| Guessing Object.tag shape from schema description | Exact validation via throwaway record push | Phase 25 (2026-04-24) | Three of four plausible shapes fail at server time; pushing a test record is faster than reading schema tree |
| Browse Providers reading from custom provider_profiles table | Proposed: Neon VIEW (v_provider_directory) remains legacy; GQL reads from MarketplaceProfileItem (future) | Phase 26 planning | Decouples display layer from data layer; allows GQL-first seeding; Neon sync can happen post-Phase-26 |

**Deprecated/outdated:**
- `platform.Object.tag` (post-ingest write): Kevin clarified (2026-04-23) that this is a read-only stub; tags must be set at ingest time via `Object.tag` field in Pipeline.receive payload

---

## Open Questions

1. **GQL Read-Back Availability:** Seeded MPI records pushed via `platform.Pipeline.receive` — when are they visible via `platform.Boundary.boundaryExecuteRawQuery` GQL query? Immediate or eventual-consistency delay? (Likely immediate based on Phase 25 testing, but not explicitly confirmed in notes.)
   - **What we know:** Phase 25 seeded test records and immediately read them back via GQL; no mention of delays
   - **What's unclear:** Explicit latency SLA or eventual-consistency semantics
   - **Recommendation:** Phase 26 seed, then immediately query GQL to confirm visibility; if 404, retry with backoff (5-10 seconds). This is part of the acceptance criteria.

2. **Hydra Tag Ownership & Scope:** If option (a) chosen, should the platform-provider tag be `scope: "org"` (owned by ZB org) or `scope: "system"` (platform-wide)? 
   - **What we know:** Tag creation accepts both scopes; no guidance in DECISIONS.md
   - **What's unclear:** Which scope enables discovery by other orgs? Can a W3Geekery user query for `tag: { value: ".eq.<platform-provider-tag>" }` if the tag is `scope: "org"`?
   - **Recommendation:** Propose `scope: "org"` (owned by ZB org) for Phase 26; if access control blocks discovery, escalate to Kevin. Alternatively, use `scope: "system"` if global discovery is required.

3. **Neon Sync Timeline:** When should seeded MPI records sync to Neon's `v_provider_directory` VIEW for Browse Providers display?
   - **What we know:** Phase 26 is GQL-only seeding; Neon remains unchanged
   - **What's unclear:** Should this happen in Phase 30 (verification), or later, or never (if hydra bulk-export replaces Neon)?
   - **Recommendation:** Phase 26 defers to Phase 30/31 verification. If Browse Providers must display ZB in Phase 30, a quick follow-on task inserts seeded records into provider_profiles table. Otherwise, defer to post-v1.4.

4. **Placeholder Copy Language:** What should the exact `legal_name`, `short_blurb`, `long_description`, and `website` values be for ZeroBias?
   - **What we know:** Clark will override at execute time; placeholders must be sensible production-grade text
   - **Recommendation:** Propose values in Phase 26 plan (e.g., `legal_name: "ZeroBias"`, `short_blurb: "Cybersecurity and compliance automation platform"`, `website: "https://zerobias.com"`, `logo_url: "https://zerobias.com/assets/logo.png"`); Clark overrides if needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ZeroBias MCP (platform.*, hydra.*, danaOld.*) | Seed script, all data ops | ✓ | Configured in `~/.config/mcp-zb/credentials.json` | —  (blocking) |
| Node.js | `ts-node` script execution | ✓ | 22.21.1 | — |
| TypeScript | `ts-node` compilation | ✓ | 5.x (in project deps) | — |
| Angular CLI | Component test runner (`ng test`) | ✓ | 21.1.4 | — |
| Karma + Jasmine | Unit test runner | ✓ | Configured in angular.json | —  (blocking for component tests) |
| ZB_ORG_ID, ZB_API_KEY, ZB_TOKEN env vars | MCP auth (seed script) | ✓ | `.env.local` | — (blocking if missing) |
| UAT environment network access | API calls to `uat.zerobias.com` | ✓ | Verified in Phase 25 | — |

**Missing dependencies with no fallback:** None detected. All required tools are present.

**Missing dependencies with fallback:** None detected.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine (via `ng test`); Vitest for standalone seed-function tests |
| Config file | `angular.json` test target; `vitest.config.ts` (if added for seed tests) |
| Quick run command | `npm test -- --watch=false --browsers=ChromeHeadless --include='**/provider*.spec.ts'` (targeted component tests) |
| Full suite command | `npm test` (all specs in project) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SP-01 | `COMPANY-INFO-CONVENTION.md` exists (file presence + readability) | Manual / doc-check | `test -f .planning/director/COMPANY-INFO-CONVENTION.md` (shell) | ❌ Wave 0 — creates file during ratification |
| SP-02 | ZeroBias appears in Browse Providers UI (renders seeded data) | Integration (mock GQL response) | `npm test -- --include='provider-list.component.spec.ts'` | ❌ Wave 0 — new `provider-list.component.spec.ts` needed |
| SP-04 | Platform-provider distinguisher tag created + applied to MPI records | Unit (seed function) | `npm test -- --include='seed-zb-provider.spec.ts'` or `vitest run scripts/seed-zb-provider.spec.ts` | ❌ Wave 0 — seed-function unit test |
| SP-05 | Cleanup residue ids included in markDeleted array | Unit (seed function) | `npm test -- --include='seed-zb-provider.spec.ts'` | ❌ Wave 0 — seed-function unit test (sub-test: markDeleted assertion) |
| SP-06 | Unit tests for seed function + Browse Providers rendering | Unit + Integration | Combined: `npm test -- --include='**/provider*.spec.ts,seed-zb-provider.spec.ts'` | ⚠️ Partial — `provider-card.component.spec.ts` exists; extend + add `provider-list.component.spec.ts` + `seed-zb-provider.spec.ts` |

### Sampling Rate
- **Per task commit:** `npm test -- --include='**/provider*.spec.ts'` (quick check on component changes)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + GQL verification query confirms seeded records visible (Phase 26 acceptance criteria)

### Wave 0 Gaps
- [ ] `src/app/pages/providers/provider-list.component.spec.ts` — covers SP-02 (Browse Providers list rendering ZB record)
- [ ] `scripts/seed-zb-provider.spec.ts` — covers SP-04, SP-05 (deterministic ids, Object.tag shape, markDeleted cleanup)
- [ ] Extend `src/app/shared/components/provider-card/provider-card.component.spec.ts` — add test case for ZB-shaped data (corporate provider, not individual; no rating/skills)
- [ ] `scripts/seed-zb-provider.ts` — seed function implementation (may be included in plan 26-02, so marked as Wave 0 only if test-first discipline requires pre-implementation test)
- [ ] Framework setup: If seed tests use Vitest (non-Angular), verify `vitest.config.ts` exists and is configured. If tests use Jasmine, place `.spec.ts` file in `scripts/` directory or inline tests in component module.

*(If test-first workflow: write specs before implementation. If traditional: mark test files as Wave 1 after implementation.)*

---

## Sources

### Primary (HIGH confidence)

- **CONTEXT.md** (Phase 26) — Locked decisions, requirements, verification queries, rationale for platform-provider distinguisher decision tree
- **DECISIONS.md (Phase 25 close)** — MarketplaceProfileItem Replace Semantics, Object.tag Field Shape (validated empirically), W3Geekery Object.tag Remediation, ServiceOfferings Defer decision
- **COMPANY-INFO-CONVENTION-DRAFT.md (Phase 25)** — 17-section catalog, MPI shape (section + data discriminator), flat sub-section pattern, read/write patterns
- **Phase 25 RESEARCH.md** — Empirical findings on Pipeline.receive shape, replace semantics validation, test residue cleanup patterns
- **Phase 25-02 PLAN.md / SUMMARY.md** — MPI replace-semantics experiment walkthrough, exact payloads and results
- **ZeroBias platform documentation (memory — DECISIONS.md, CONTEXT.md)** — Object.tag immutability, `tagIds` vs. per-record `tag` field, hydra Tag.createTag scope semantics

### Secondary (MEDIUM confidence)

- **COMPANY-INFO-CONVENTION-DRAFT.md sections on Phase 28 Save/Pre-fill Strategy** — GQL query patterns for form integration (not yet implemented, but documented for Phase 28 planning)
- **project memory (SME Mart) — ZeroBias MCP Parameter Patterns, hydra Tag API** — Body param nesting, tag creation/search API shapes (not directly tested in Phase 25, but referenced in memory)
- **Phase 26 brief (director notes)** — Deliverables, dependencies, out-of-scope items (well-articulated but not yet executed)

### Tertiary (LOW confidence)

- **Phase 25 bootstrap brief (W3Geekery engagement)** — Retroactive tag remediation notes; template for Engagement/SmeMartProject re-ingest (not tested on MPI records specifically, but same Object.tag shape)
- **General ZeroBias/Hydra knowledge (memory, training data)** — Hydra tag scope semantics (`org` vs. `system`), GQL tag filter syntax (not explicitly validated for Phase 26; may need Kevin clarification)

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — zerobias-client and Angular versions locked in codebase; validated in Phase 25
- **Architecture (MPI/Pipeline/tag shapes):** HIGH — empirically validated in Phase 25 via UAT experiments; DECISIONS.md canonical
- **Platform-provider distinguisher options (a/b/c):** HIGH — options articulated in CONTEXT.md; recommendations based on locked Phase 25 decisions; option (a) consistency argument is sound
- **Browse Providers integration:** MEDIUM — current state is Neon-based; GQL-only path is proposed but not yet tested; Neon sync timeline is TBD
- **Seed script location & runtime:** MEDIUM — mirrors Phase 25 pattern, but exact script location/structure deferred to Phase 26 planning
- **Validation/test surface:** MEDIUM — existing test patterns (provider-card.component.spec.ts) can extend; new test files (provider-list, seed-function) are standard Angular/Node patterns, but specific test coverage targets deferred to Phase 26 plan

**Research date:** 2026-04-27
**Valid until:** 2026-05-04 (one week) — if no Phase 26 plan created by then, re-validate decision tree and locked decisions

---

## RESEARCH COMPLETE

**Phase:** 26 - Seed Provider (ZB-as-Provider)
**Confidence:** HIGH

### Key Findings

1. **Platform-provider distinguisher decision is the critical fork** — Three options (a: hydra tag, b: MPI section, c: orgId filter) trade off discoverability vs. simplicity. Option (a) hydra tag is **RECOMMENDED** for symmetry with Phase 25's validated Object.tag pattern and future generalizability.

2. **Object.tag shape is locked to `[{ value: "<uuid>" }]`** — Validated empirically in Phase 25; any other shape (id refs, bare strings) fails schema validation. Phase 26 must not deviate.

3. **Pipeline.receive replace-by-id pattern enables idempotent seeding** — Deterministic ids (`mpi-57c741cf-...-<section>`) allow re-running the seed without duplicates. Cleanup residues (`mpi-test-a/b-...`) ride alongside in same batch via `markDeleted`.

4. **Browse Providers is Neon-backed; seeding is GQL-only** — Current provider-list.component reads from `v_provider_directory` VIEW. Seeded MPI records land in platform's AuditgraphDB (Pipeline sink) → visible via GQL. Neon sync is a separate Phase 30/31 concern or future work.

5. **Seed script follows Phase 25 pattern** — Standalone `scripts/seed-zb-provider.ts` using `ts-node`, MCP for operations, deterministic payload construction, idempotent re-runs. One-time creation of platform-provider tag (if option a); idempotent MPI records.

6. **Test surface is well-defined** — Extend provider-card.component.spec.ts for ZB data; new provider-list.component.spec.ts for list rendering; seed-function unit test for payload shape validation. All tests are standard Angular/Node patterns.

7. **No schema PR required** — Phase 26 is app-only (seeding + tests). COMPANY-INFO-CONVENTION-DRAFT.md ratification (file rename) is administrative; Phase 25 already defined the canonical shape.

### File Created
`.planning/phases/26-seed-provider-zb-as-provider/26-RESEARCH.md` (this file)

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Versions locked; zerobias-client ^1.1.23+ validated in Phase 25 |
| Architecture (MPI/Pipeline/tags) | HIGH | DECISIONS.md canonical; empirically validated via Phase 25 UAT experiments |
| Platform-provider distinguisher options | HIGH | CONTEXT.md articulates all three; rationale for option (a) derived from locked Phase 25 decisions |
| Browse Providers integration path | MEDIUM | Current state (Neon) understood; GQL path clear but not yet tested on MPI data; Neon sync timing TBD |
| Seed script pattern | MEDIUM | Mirrors Phase 25 pattern; exact implementation details deferred to Phase 26 planning |
| Validation/test framework | MEDIUM | Angular CLI + Karma/Jasmine confirmed; existing test patterns can extend; new test files are standard patterns |

### Open Questions / Risks
1. **GQL read-back latency:** Phase 26 must confirm seeded MPI records visible via GQL immediately post-seed (or with known backoff). If eventual-consistency delay exists, acceptance criteria must account for polling/retry.
2. **Hydra tag scope semantics:** Option (a) proposes `scope: "org"`; unclear if this allows discovery by other orgs. May need Kevin clarification or experimental validation during Plan 26-01.
3. **Neon sync timeline:** GQL-only seeding leaves Browse Providers unchanged. Phase 30/31 must verify: does ZB appear in Browse Providers? If yes, when did Neon sync happen? If no, is this acceptable for v1.4 (defer to v1.5)?
4. **Placeholder copy values:** Research recommends sensible defaults; Clark overrides at execute time. Exact values TBD in Plan 26 phase brief.

### Ready for Planning
Phase 26 planning can now proceed with:
- Locked decision: Option (a) hydra-tag platform-provider distinguisher (or planner can revisit a/b/c with rationale)
- Exact payload shapes: Pipeline.receive format, Object.tag shape, deterministic id pattern
- Test locations & patterns: Component specs + standalone seed-function test
- Acceptance criteria: GQL verification queries, cleanup residue `markDeleted` assertion, provider-card rendering of ZB data
- Risk mitigation: MCP profile lock before ops, GQL read-back polling on seeded records, Neon sync decision (Phase 30 or later)

Planner should coordinate with `/meta:director` on the platform-provider distinguisher decision if option (a) introduces risk or requires Kevin validation on tag scope semantics.
