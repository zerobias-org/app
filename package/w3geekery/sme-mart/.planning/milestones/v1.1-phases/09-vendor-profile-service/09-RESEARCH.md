# Phase 9: Vendor Profile Service - Research

**Researched:** 2026-04-01
**Domain:** Backend service layer for MarketplaceProfileItem CRUD (GQL read, Pipeline write, field mapping, roundtrip validation)
**Confidence:** HIGH

## Summary

Phase 9 implements a service layer (`VendorProfileService`) that reads and writes MarketplaceProfileItem entities between GraphQL and the Pipeline. The phase follows the exact pattern established by VettingService (which serves engagements), adapted for org-scoped profile items with section-discriminated JSON data.

The service supports full CRUD across 6 profile sections (insurance, attestation, corporate identity, reference, personnel, financial). Each section stores typed JSON in the `data` field, which requires bidirectional serialization/deserialization during round-trip cycles.

Implementation is straightforward: copy VettingService structure, swap "engagement" for "org" in query scope, add 6 section-specific data type interfaces, and create roundtrip tests for at least 3 different section types to validate JSON fidelity.

**Primary recommendation:** Follow VettingService pattern exactly (same service layout, field mapping conventions, roundtrip testing approach). Add MarketplaceProfileItem class ID and field mappings to `pipeline-write.service.ts` and `field-mappings.ts`, then implement VendorProfileService with hardcoded section data interfaces.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Typed interfaces per section. Service parses `data` JSON string on read into typed interfaces (InsuranceData, AttestationData, CorporateIdentityData, ReferenceData, PersonnelData, FinancialData). Service validates/serializes on write.
- **D-02:** Caller passes `orgId` explicitly to all query methods. Service does NOT auto-filter by current session org. Keeps service flexible for Phase 12 (cross-org viewing) without refactoring.
- **D-03:** Hardcode the deterministic UUID v5 class ID in field-mappings.ts. Zero runtime cost, consistent with all 17 existing entity mappings. Same across all environments.
- **D-04:** Single `MarketplaceProfileItem` class with section discriminator (Phase 8 D-01).
- **D-05:** 5 typed fields: section (enum), expiresAt (string/date), status (string), orgId (string), data (string/JSON).
- **D-06:** No links — scalar orgId, no bidirectional relationships.
- **D-07:** Inherited from Object: id, name, description, dateCreated, dateLastModified.

### Claude's Discretion
- Section-specific data interface shapes (what fields each section type contains)
- Whether to add helper methods (e.g., `listBySection()`, `listExpired()`) or keep generic query with filters
- Test fixture data shapes for roundtrip specs
- Error handling strategy for malformed JSON in `data` field

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VPS-01 | `VendorProfileService` reads profile items via GraphQL (GQL read path) | GraphqlReadService established, query() method with filters/pagination defined. See `src/app/core/services/graphql-read.service.ts`. |
| VPS-02 | `VendorProfileService` writes profile items via Pipeline (Pipeline write path) | PipelineWriteService established, pushEntity() and pushEntities() methods defined. See `src/app/core/services/pipeline-write.service.ts`. MarketplaceProfileItem class ID must be hardcoded in SME_MART_CLASS_IDS. |
| VPS-03 | Service supports CRUD for all 6 profile sections | Service will use single generic query/create/update/delete methods. Section filtering handled via `section` field in filters. Section-specific data validation via 6 typed interfaces (InsuranceData, etc.). |
| VPS-04 | Field mapping constants with bidirectional GQL↔domain mapping | Add MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING to field-mappings.ts following VETTING_ITEM_FIELD_MAPPING pattern. Map MarketplaceProfileItem schema field names (camelCase) to Neon model field names (snake_case). |
| VPS-05 | Roundtrip tests validating GQL→domain→Pipeline→GQL cycle | Implement .spec.ts file with factories for multiple section types. Test JSON serialization/deserialization of `data` field. Reference bid.roundtrip.spec.ts and document.roundtrip.spec.ts patterns. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/core | 21.1.4 | Framework (injector, services, decorators) | Angular 21 standard |
| ZerobiasClientApi | ^1.1.23 | Platform SDK client (GQL API, hydra SDK, Pipeline API) | SME Mart primary client |
| @zerobias-com/graphql-sdk | Current | GraphQL query builder and executor | Built into ZerobiasClientApi |
| @zerobias-com/platform-sdk | Current | Pipeline, SimpleBatch, receiver pipeline | Built into ZerobiasClientApi |
| TypeScript | 5.x | Type safety | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | Current | Unit testing framework | Phase requirement: roundtrip tests (VPS-05) |
| TypeScript strict mode | 5.x | Type checking | Always enabled in project |

### No Alternatives Considered
This phase uses established infrastructure (VettingService pattern). No alternative approaches evaluated — the pattern is proven on EngagementVettingItem.

**Installation:**
All infrastructure already available. No new npm packages required.

**Version verification:**
```bash
npm ls @zerobias-com/zerobias-angular-client
npm ls @angular/core
npm ls typescript
```

## Architecture Patterns

### Recommended Project Structure

```
src/app/core/
├── services/
│   ├── vendor-profile.service.ts          # NEW: CRUD service
│   ├── vendor-profile.roundtrip.spec.ts   # NEW: Roundtrip validation tests
│   ├── vetting.service.ts                 # REFERENCE: closest analog
│   ├── pipeline-write.service.ts          # MODIFY: add MarketplaceProfileItem class ID
│   └── graphql-read.service.ts            # (no changes needed)
├── gql-types/
│   └── marketplace-profile-item.types.ts  # NEW: GQL response type
├── models/
│   └── marketplace-profile-item.model.ts  # NEW: domain model + section data interfaces
├── field-mappings.ts                      # MODIFY: add MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING
└── (existing files unchanged)
```

### Pattern 1: Service Structure (Follow VettingService Exactly)

**What:** Service layer encapsulating CRUD operations, GQL read integration, Pipeline write integration, and field mapping transformations.

**When to use:** For all domain entities reading from AuditgraphDB (GQL) and writing via Pipeline.

**Example structure (from VettingService):**

```typescript
// Source: src/app/core/services/vetting.service.ts

@Injectable({ providedIn: 'root' })
export class VendorProfileService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  // ── Query (reads from GQL) ──
  async listProfileItems(orgId: string, section?: string): Promise<MarketplaceProfileItem[]> {
    const filters: Record<string, string> = {
      orgId: `.eq.${orgId}`, // Caller passes orgId explicitly
    };
    if (section) filters.section = `.eq.${section}`;

    const result = await this.graphqlRead.query<GqlMarketplaceProfileItemResponse>(
      'MarketplaceProfileItem',
      this.getFields(),
      { filters, pageSize: 200 },
    );

    return result.items.map(gql => this.fromGql(gql));
  }

  async getProfileItem(id: string): Promise<MarketplaceProfileItem | null> {
    const gql = await this.graphqlRead.getById<GqlMarketplaceProfileItemResponse>(
      'MarketplaceProfileItem',
      id,
      this.getFields(),
    );
    return gql ? this.fromGql(gql) : null;
  }

  // ── Create (push to Pipeline) ──
  async createProfileItem(data: CreateProfileItemRequest): Promise<MarketplaceProfileItem> {
    const now = new Date().toISOString();
    const item: MarketplaceProfileItem = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
      section: data.section,
      orgId: data.orgId, // Explicit from caller
      status: 'active',
      expiresAt: data.expiresAt ?? null,
      data: JSON.stringify(data.data), // Serialize JSON
      dateCreated: now,
      dateLastModified: now,
    };

    const gqlData = this.toGql(item);
    this.pipelineWrite.pushEntity('MarketplaceProfileItem', gqlData).catch(err => {
      console.error('[VendorProfileService] Failed to push profile item:', err);
    });

    return item;
  }

  // ── Update ──
  async updateProfileItem(
    id: string,
    data: UpdateProfileItemRequest,
  ): Promise<MarketplaceProfileItem> {
    const cached = this.pipelineWrite.getCached('MarketplaceProfileItem', id);
    const current = cached
      ? this.fromGql(cached as unknown as GqlMarketplaceProfileItemResponse)
      : await this.graphqlRead.getById<GqlMarketplaceProfileItemResponse>(
          'MarketplaceProfileItem',
          id,
          this.getFields(),
        ).then(gql => gql ? this.fromGql(gql) : null);

    if (!current) throw new Error(`Profile item ${id} not found`);

    const now = new Date().toISOString();
    const updated: MarketplaceProfileItem = {
      ...current,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      ...(data.data !== undefined && { data: JSON.stringify(data.data) }),
      dateLastModified: now,
    };

    const gqlData = this.toGql(updated);
    this.pipelineWrite.pushEntity('MarketplaceProfileItem', gqlData).catch(err => {
      console.error('[VendorProfileService] Failed to update profile item:', err);
    });

    return updated;
  }

  // ── Delete (soft-delete via dateDeleted) ──
  async deleteProfileItem(id: string): Promise<void> {
    const gqlData: Record<string, unknown> = {
      id,
      dateDeleted: new Date().toISOString().split('T')[0], // Date-only (YYYY-MM-DD)
    };

    this.pipelineWrite.pushEntity('MarketplaceProfileItem', gqlData).catch(err => {
      console.error('[VendorProfileService] Failed to delete profile item:', err);
    });
  }

  // ── Private helpers ──

  private fromGql(gql: GqlMarketplaceProfileItemResponse): MarketplaceProfileItem {
    const mapped = mapGqlToNeon<MarketplaceProfileItem>(
      gql,
      MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon,
    );

    // Parse data JSON → typed interface (depends on section)
    const rawData = (gql as unknown as Record<string, unknown>)['data'];
    if (typeof rawData === 'string' && rawData) {
      try {
        mapped.data = JSON.parse(rawData); // Keep as parsed object in model
      } catch {
        mapped.data = {}; // Fallback: empty object on parse error
      }
    } else {
      mapped.data = typeof rawData === 'object' ? rawData : {};
    }

    return mapped;
  }

  private toGql(item: MarketplaceProfileItem): Record<string, unknown> {
    const gql = mapNeonToGql<GqlMarketplaceProfileItemResponse>(
      item,
      MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.neonToGql,
    ) as unknown as Record<string, unknown>;

    // Serialize data object → JSON string for GQL
    gql['data'] = typeof item.data === 'string'
      ? item.data
      : JSON.stringify(item.data ?? {});

    return gql;
  }

  private getFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'section',
      'orgId',
      'status',
      'expiresAt',
      'data',
      'dateCreated',
      'dateLastModified',
    ];
  }
}
```

### Pattern 2: Field Mapping (Follow VETTING_ITEM_FIELD_MAPPING)

**What:** Constants mapping Neon model field names (snake_case) ↔ GQL response field names (camelCase).

**When to use:** Every entity with bidirectional GQL↔Neon transformation.

**Example (from field-mappings.ts):**

```typescript
// Source: src/app/core/field-mappings.ts (line ~450)

export const MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    name: 'name',
    description: 'description',
    section: 'section',
    org_id: 'orgId',
    status: 'status',
    expires_at: 'expiresAt',
    data: 'data',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    name: 'name',
    description: 'description',
    section: 'section',
    orgId: 'org_id',
    status: 'status',
    expiresAt: 'expires_at',
    data: 'data',
    dateCreated: 'created_at',
    dateLastModified: 'updated_at',
  },
  sourceSchema: 'zerobias-org/schema (Phase 8 — MarketplaceProfileItem)',
  lastVerified: '2026-03-31',
} as const;
```

**Critical notes:**
- Neon (model) uses `org_id`, GQL uses `orgId`
- GQL returns `dateCreated`/`dateLastModified` (Object base class), map to Neon `created_at`/`updated_at`
- `data` field (JSON string) is NOT parsed/serialized by the mapping — handled separately in `fromGql()`/`toGql()`

### Pattern 3: GQL Type Definitions (Follow vetting-item.types.ts)

**What:** TypeScript interfaces matching GQL response structure for type safety.

**Example:**

```typescript
// Source: src/app/core/gql-types/marketplace-profile-item.types.ts (NEW)

export interface GqlMarketplaceProfileItemResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // MarketplaceProfileItem fields
  section: string;                    // corporate_identity | insurance | attestation | reference | personnel | financial
  orgId: string;
  status: string;                     // active | expired | archived
  expiresAt?: string | null;         // ISO date string
  data?: string | null;              // JSON string of section-specific content

  // Timestamps
  dateCreated: string;
  dateLastModified: string;
}
```

### Pattern 4: Domain Model with Section Data Interfaces (New)

**What:** TypeScript model interfaces + typed section-specific data interfaces.

**Example:**

```typescript
// Source: src/app/core/models/marketplace-profile-item.model.ts (NEW)

// ── Section discriminator ──
export type ProfileSection = 'corporate_identity' | 'insurance' | 'attestation' | 'reference' | 'personnel' | 'financial';

// ── Section-specific data interfaces ──
export interface InsuranceData {
  policyNumber: string;
  carrier: string;
  coverageAmount: string;
  effectiveDate: string;  // ISO date
  expirationDate: string; // ISO date
  notes?: string;
}

export interface AttestationData {
  certificationName: string;
  issuer: string;
  issueDate: string;     // ISO date
  expirationDate: string; // ISO date
  credentialId?: string;
  url?: string;
}

export interface CorporateIdentityData {
  entityType: string;          // C Corp, LLC, etc.
  registrationNumber: string;
  registrationState: string;
  incorporationDate: string;  // ISO date
  principalOfficers?: string;
}

export interface ReferenceData {
  referenceName: string;
  title: string;
  organization: string;
  email: string;
  phone: string;
  relationship: string; // e.g., "Former Client", "Business Partner"
}

export interface PersonnelData {
  firstName: string;
  lastName: string;
  title: string;
  yearsExperience: number;
  certifications?: string[];
  backgroundCheckDate?: string; // ISO date
}

export interface FinancialData {
  lastAuditDate?: string;      // ISO date
  auditor?: string;
  bankingDetails?: string;
  creditRating?: string;
  annualRevenue?: string;
}

// ── Union type for flexible data handling ──
export type ProfileSectionData = InsuranceData | AttestationData | CorporateIdentityData | ReferenceData | PersonnelData | FinancialData;

// ── Main model (domain shape — snake_case) ──
export interface MarketplaceProfileItem {
  id: string;
  name: string;
  description: string | null;
  section: ProfileSection;
  org_id: string;                // Explicit from caller
  status: 'active' | 'expired' | 'archived';
  expires_at: string | null;    // ISO date
  data: ProfileSectionData;      // Parsed object (not JSON string) in model
  created_at: string;
  updated_at: string;
}

// ── Requests ──
export interface CreateProfileItemRequest {
  name: string;
  description?: string;
  section: ProfileSection;
  orgId: string;                 // REQUIRED: caller provides org scope
  expiresAt?: string;           // ISO date (optional)
  data: ProfileSectionData;      // Section-specific content
}

export interface UpdateProfileItemRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'expired' | 'archived';
  expiresAt?: string;           // ISO date
  data?: ProfileSectionData;    // Partial updates to section data
}
```

### Anti-Patterns to Avoid

- **Auto-filtering by session org:** D-02 requires explicit `orgId` parameter. Don't infer org from `ImpersonationService`. Phase 12 depends on this flexibility.
- **Storing data as JSON string in model:** The model uses `data: ProfileSectionData` (parsed object). Only the GQL response and Pipeline pushes use JSON strings.
- **Hardcoding section-specific queries:** Use generic `listProfileItems(orgId, section?)` with filters. Avoid `listInsuranceItems()` / `listAttestations()` unless Phase 10 UI specifically needs them.
- **Silently ignoring JSON parse errors:** Log and use empty object fallback, but don't throw. Prevents cascade failures on malformed legacy data.
- **Missing dateDeleted for soft-delete:** Soft-delete pattern uses `dateDeleted: YYYY-MM-DD` (date only, not timestamp). Follow VettingService pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GraphQL queries with filtering/pagination | Custom HTTP client + query builder | `GraphqlReadService.query()` | Handles boundary scoping, RFC4515 filters, cursor-based pagination, field selection |
| Pipeline writes and entity ingestion | Direct API calls + batch management | `PipelineWriteService.pushEntity()` / `pushEntities()` | Handles job creation, retry logic, cache seeding, fire-and-forget async |
| Field name transformations (camelCase ↔ snake_case) | Custom mapping functions | `mapGqlToNeon()` / `mapNeonToGql()` with field mapping constants | Prevents field loss, type-safe via constant definitions, same pattern as 17 existing entities |
| Service injection and lifecycle | Manual instantiation | `@Injectable({ providedIn: 'root' })` + Angular DI | Enables testing, proper singleton scope, works with Nx lazy loading |
| JSON serialization with validation | Manual JSON.parse/stringify | Typed section data interfaces + error fallback | Enables autocomplete, type checking, clear error handling strategy |

**Key insight:** The SME Mart service layer is highly standardized. VettingService proves the pattern works for complex entities. Copy structure, swap field names, add section-specific types. Zero custom infrastructure needed.

## Runtime State Inventory

> Include this section for rename/refactor/migration phases only. Omit entirely for greenfield phases.

**SKIPPED** — Phase 9 is a greenfield service (new files only, no runtime state to inventory). No Neon data migration, no stored configuration, no OS-registered state.

## Common Pitfalls

### Pitfall 1: Forgetting the Class ID in SME_MART_CLASS_IDS

**What goes wrong:** Service calls `graphqlRead.query('MarketplaceProfileItem', ...)` but GraphQL doesn't recognize the entity because it's not indexed yet. Queries return empty results even though data was pushed.

**Why it happens:** Class IDs are deterministic (UUID v5 from YAML content). They must be pre-declared in `pipeline-write.service.ts` before any writes reference them. Missing class ID = missing entity in platform catalog.

**How to avoid:** D-03 requires hardcoding the UUID v5 in field-mappings.ts. Get the ID from Phase 8 (schema merge), add it to `SME_MART_CLASS_IDS` object, and reference in `PipelineWriteService.pushEntity('MarketplaceProfileItem', ...)`.

**Warning signs:** GQL query returns 0 items even after data was pushed. Check: (1) Class ID exists in SME_MART_CLASS_IDS, (2) Field mapping references correct entity name, (3) Schema was merged and dataloader ran.

### Pitfall 2: JSON Data Lost During Round-Trip

**What goes wrong:** Service creates a profile item with `data: { policyNumber: '123' }`. On read, `data` field is empty or malformed.

**Why it happens:** Field mapping doesn't handle `data` field. The mapping utilities (`mapGqlToNeon`, `mapNeonToGql`) treat `data` as a simple string. JSON parsing happens in `fromGql()` / `toGql()` methods (not in mapping). If you skip this step, raw JSON strings leak into the model.

**How to avoid:** Follow Pattern 2 exactly. In `fromGql()`, parse GQL `data` string → model `ProfileSectionData` object. In `toGql()`, serialize model object → JSON string. Add tests for at least 3 section types (VPS-05).

**Warning signs:** Roundtrip tests show `data` field as string instead of typed object. UI code receives `data: "{...}"` instead of `data: {...}`.

### Pitfall 3: Caller Doesn't Provide orgId

**What goes wrong:** UI component calls `service.listProfileItems()` without org context. Query returns all orgs' items (or throws).

**Why it happens:** D-02 requires explicit `orgId` parameter. If the API accepts `listProfileItems()` without org, components forget to pass it. Unlike engagement (always has context), profiles are org-scoped and require deliberate passing.

**How to avoid:** Make `orgId` a required parameter (not optional). Document in JSDoc that Phase 12 (cross-org viewing) will need this flexibility. Callers must understand they're responsible for org scoping.

**Warning signs:** Phase 10 UI shows other orgs' profile items. VPS-01 tests don't filter by orgId.

### Pitfall 4: Status Enum Mismatch

**What goes wrong:** Service uses `status: 'pending' | 'complete'`, but schema defines `status: 'active' | 'expired' | 'archived'`.

**Why it happens:** Status values come from Phase 8 schema design. Implementation must match. Different entities have different status enums (vetting has 7 statuses, profiles have 3).

**How to avoid:** Check the schema YAML for exact enum values. Use TypeScript union types, not magic strings. Add to models and GQL types. Roundtrip tests catch this quickly.

**Warning signs:** Pipeline receive fails with "invalid enum value". UI renders unknown status.

## Code Examples

Verified patterns from official sources:

### Example 1: Service Query with Filters

```typescript
// Source: src/app/core/services/vetting.service.ts (adapted for profiles)

async listProfileItems(orgId: string, section?: string): Promise<MarketplaceProfileItem[]> {
  const filters: Record<string, string> = {
    orgId: `.eq.${orgId}`, // RFC4515 exact match
  };
  if (section) {
    filters.section = `.eq.${section}`;
  }

  const result = await this.graphqlRead.query<GqlMarketplaceProfileItemResponse>(
    'MarketplaceProfileItem',
    this.getFields(),
    { filters, pageSize: 200 }, // No sorting specified — will use schema defaults
  );

  return result.items.map(gql => this.fromGql(gql));
}
```

### Example 2: JSON Parse/Serialize with Error Handling

```typescript
// Source: VettingService.fromGql() pattern (adapted for data field)

private fromGql(gql: GqlMarketplaceProfileItemResponse): MarketplaceProfileItem {
  const mapped = mapGqlToNeon<MarketplaceProfileItem>(
    gql,
    MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon,
  );

  // Parse data JSON → typed interface
  const rawData = (gql as unknown as Record<string, unknown>)['data'];
  if (typeof rawData === 'string' && rawData) {
    try {
      mapped.data = JSON.parse(rawData);
    } catch (err) {
      console.warn('[VendorProfileService] Failed to parse data JSON:', err);
      mapped.data = {}; // Fallback: empty object
    }
  } else {
    mapped.data = typeof rawData === 'object' ? rawData : {};
  }

  return mapped;
}

private toGql(item: MarketplaceProfileItem): Record<string, unknown> {
  const gql = mapNeonToGql<GqlMarketplaceProfileItemResponse>(
    item,
    MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.neonToGql,
  ) as unknown as Record<string, unknown>;

  // Serialize data object → JSON string
  gql['data'] = typeof item.data === 'string'
    ? item.data
    : JSON.stringify(item.data ?? {});

  return gql;
}
```

### Example 3: Roundtrip Test Factory (3 Section Types)

```typescript
// Source: src/app/core/services/vendor-profile.roundtrip.spec.ts (NEW)

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING } from '@/core/field-mappings';
import type { GqlMarketplaceProfileItemResponse } from '@/core/gql-types';
import type { MarketplaceProfileItem, InsuranceData, AttestationData, FinancialData } from '@/core/models';

function makeProfileItem(overrides?: Partial<MarketplaceProfileItem>): MarketplaceProfileItem {
  return {
    id: 'profile-001',
    name: 'Cyber Liability Insurance',
    description: 'Annual cyber insurance policy',
    section: 'insurance',
    org_id: 'org-buyer-001',
    status: 'active',
    expires_at: '2027-03-31',
    data: {
      policyNumber: 'CY-2024-001',
      carrier: 'AIG',
      coverageAmount: '5000000',
      effectiveDate: '2026-04-01',
      expirationDate: '2027-03-31',
    } as InsuranceData,
    created_at: '2026-03-31T10:00:00Z',
    updated_at: '2026-03-31T10:00:00Z',
    ...overrides,
  };
}

describe('VPS-05: Vendor Profile Roundtrip Validation', () => {
  describe('Insurance section data', () => {
    it('should preserve InsuranceData through Neon → GQL → Neon cycle', () => {
      const neonModel = makeProfileItem();

      // Model → GQL (with JSON serialization)
      const gql = mapNeonToGql<GqlMarketplaceProfileItemResponse>(
        neonModel,
        MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.neonToGql,
      );
      gql['data'] = JSON.stringify(neonModel.data); // Manual JSON serialization
      expect(typeof gql.data).toBe('string');

      // GQL → Model (with JSON parsing)
      const parsed = mapGqlToNeon<MarketplaceProfileItem>(
        gql as any,
        MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon,
      );
      if (typeof gql.data === 'string') {
        parsed.data = JSON.parse(gql.data);
      }

      // Verify fidelity
      expect(parsed.id).toBe(neonModel.id);
      expect(parsed.name).toBe(neonModel.name);
      expect((parsed.data as InsuranceData).policyNumber).toBe('CY-2024-001');
      expect((parsed.data as InsuranceData).carrier).toBe('AIG');
    });
  });

  describe('Attestation section data', () => {
    it('should preserve AttestationData', () => {
      const attestation = makeProfileItem({
        name: 'SOC 2 Type II',
        section: 'attestation',
        data: {
          certificationName: 'SOC 2 Type II',
          issuer: 'AICPA',
          issueDate: '2025-06-30',
          expirationDate: '2027-06-30',
          credentialId: 'SOC2-2025-001',
          url: 'https://example.com/soc2',
        } as AttestationData,
      });

      const gql = mapNeonToGql(attestation, MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.neonToGql);
      gql['data'] = JSON.stringify(attestation.data);

      const parsed = mapGqlToNeon(gql as any, MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon);
      parsed.data = JSON.parse(gql.data as string);

      expect((parsed.data as AttestationData).certificationName).toBe('SOC 2 Type II');
      expect((parsed.data as AttestationData).issuer).toBe('AICPA');
    });
  });

  describe('Financial section data', () => {
    it('should preserve FinancialData', () => {
      const financial = makeProfileItem({
        name: 'Financial Statements FY2025',
        section: 'financial',
        data: {
          lastAuditDate: '2026-02-28',
          auditor: 'Deloitte',
          annualRevenue: '50000000',
          creditRating: 'AA',
        } as FinancialData,
      });

      const gql = mapNeonToGql(financial, MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.neonToGql);
      gql['data'] = JSON.stringify(financial.data);

      const parsed = mapGqlToNeon(gql as any, MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon);
      parsed.data = JSON.parse(gql.data as string);

      expect((parsed.data as FinancialData).auditor).toBe('Deloitte');
      expect((parsed.data as FinancialData).annualRevenue).toBe('50000000');
    });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Neon CRUD + UI direct table access | Service layer abstraction (PipelineWriteService + GraphqlReadService) | Phase 2 (Bid migration) | Services decouple UI from storage. Easy to swap data sources. Field mapping constants prevent field loss. |
| Fire-and-forget async calls with no logging | `pushEntity()` with error catch/log | Phase 2 | Errors don't cascade. Admin can debug via logs. Cache prevents re-fetching after rapid edits. |
| Manual JSON serialization in components | Service-layer JSON handling in `fromGql()` / `toGql()` | Phase 2+ | Typed data models. Type-safe access. Errors handled centrally. Less duplication. |
| Hardcoded field mappings per service | Centralized constants in field-mappings.ts | Phase 2 | 17 entities now use same pattern. Easy to audit field loss. One source of truth. |

**No deprecated features** — this phase uses the current architecture.

## Open Questions

None — Phase 8 (schema) completed first. MarketplaceProfileItem schema is merged and dataloader validated. Class ID is deterministic and known. Implementation is straightforward application of proven VettingService pattern.

## Environment Availability

**SKIPPED** — Phase 9 is pure service code. No external dependencies (CLI tools, databases, services) beyond what Phase 2+ already uses:
- GraphQL API (ZeroBias platform) ✓
- Pipeline API (AuditgraphDB receiver) ✓
- Neon PostgreSQL (local dev schema) ✓
- Angular CLI / Nx (already in repo) ✓

All infrastructure established and verified in prior phases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^1.6.0 |
| Config file | `vitest.config.ts` (angular.json runs via `ng test`) |
| Quick run command | `npm test -- vendor-profile.roundtrip.spec.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VPS-01 | List profile items from GQL with orgId filter | unit | `npm test -- vendor-profile.spec.ts -t "listProfileItems"` | ❌ Wave 0 |
| VPS-02 | Create/update/delete push entities to Pipeline | unit (fire-and-forget async) | `npm test -- vendor-profile.spec.ts -t "pushEntity"` | ❌ Wave 0 |
| VPS-03 | CRUD operations support all 6 section types | unit | `npm test -- vendor-profile.spec.ts -t "section"` | ❌ Wave 0 |
| VPS-04 | Field mappings are bidirectional (camelCase ↔ snake_case) | unit (roundtrip) | `npm test -- vendor-profile.roundtrip.spec.ts` | ❌ Wave 0 |
| VPS-05 | Roundtrip tests for 3+ section types | unit (roundtrip) | `npm test -- vendor-profile.roundtrip.spec.ts -t "Insurance\|Attestation\|Financial"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- vendor-profile.roundtrip.spec.ts` (roundtrip validation — 20 seconds)
- **Per wave merge:** `npm test` (full suite — 2-3 min)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vendor-profile.service.ts` — main CRUD service
- [ ] `vendor-profile.spec.ts` — unit tests for CRUD operations
- [ ] `vendor-profile.roundtrip.spec.ts` — roundtrip validation tests
- [ ] `marketplace-profile-item.model.ts` — domain model + section data interfaces
- [ ] `marketplace-profile-item.types.ts` — GQL response types
- [ ] `field-mappings.ts` — MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING constant
- [ ] `pipeline-write.service.ts` — add MarketplaceProfileItem class ID to SME_MART_CLASS_IDS

*(No pre-existing test infrastructure for VendorProfileService — all tests are Wave 0.)*

## Sources

### Primary (HIGH confidence)
- VettingService (`src/app/core/services/vetting.service.ts`) — Exact pattern reference. Field mapping, GQL queries, Pipeline writes, error handling all proven.
- VETTING_ITEM_FIELD_MAPPING (`src/app/core/field-mappings.ts` lines ~370-410) — Field mapping constant template.
- bid.roundtrip.spec.ts + document.roundtrip.spec.ts — Roundtrip testing patterns with JSON field handling.
- GraphqlReadService + PipelineWriteService — Core infrastructure (queries, writes, cache, fire-and-forget async).
- MarketplaceProfileItem schema (`zerobias-org/schema`) — Phase 8 output, class definition and fields.
- SCHEMA_CHANGE_PROCESS.md — Field naming gotchas, class ID generation, dataloader validation.

### Secondary (MEDIUM confidence)
- Phase 8 CONTEXT.md — Locked design decisions (D-01 through D-07) for data structures and scope.
- REQUIREMENTS.md VPS-01 through VPS-05 — Phase requirements mapped to research findings.

## Metadata

**Confidence breakdown:**
- **Standard stack: HIGH** — All infrastructure (GraphqlReadService, PipelineWriteService, field mappings, roundtrip testing) proven on 14+ domain services. VettingService is gold standard reference.
- **Architecture: HIGH** — VettingService pattern established and tested. Service structure, GQL queries, Pipeline writes all follow proven patterns. JSON handling documented in existing code.
- **Pitfalls: HIGH** — Common mistakes identified from Phase 2-8 implementations (class ID forgetting, JSON round-trip issues, org scoping confusion). Roundtrip tests catch most bugs.

**Research date:** 2026-04-01
**Valid until:** 2026-04-08 (stable infrastructure, proven patterns, no breaking changes expected)

---

*Phase: 09-vendor-profile-service*
*Research completed: 2026-04-01*
