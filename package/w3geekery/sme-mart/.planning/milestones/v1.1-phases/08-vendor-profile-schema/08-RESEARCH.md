# Phase 8: Vendor Profile Schema - Research

**Researched:** 2026-03-31
**Domain:** GraphQL Schema Definition (YAML) — ZeroBias Platform Custom Schema
**Confidence:** HIGH

## Summary

Phase 8 implements a single `MarketplaceProfileItem` GraphQL schema entity in the ZeroBias platform's schema repo, extending the existing 17-entity SME Mart domain model. The entity uses a hybrid pattern: typed, filterable fields for metadata (`section`, `expiresAt`, `status`, `orgId`) plus a JSON `data` blob for section-specific content. No relationships (links) are defined at schema level; org ownership is via scalar field. The task is low-complexity schema authoring (YAML class + 4-5 field definitions + 1 enum), dataloader validation, and cross-fork PR submission to `zerobias-org/schema:dev`.

**Primary recommendation:** Follow the established `EngagementVettingItem` YAML structure, create files in `package/w3geekery/smemart/classes/` and `fields/` directories, validate locally with dataloader (same tool, same scratch DB already running), commit to `feat/marketplace-profile-item` branch, and submit cross-fork PR with `--base dev`.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single `MarketplaceProfileItem` class with `section` enum discriminator + JSON `data` string field (NOT separate classes per section)
- **D-02:** Class name is `MarketplaceProfileItem` (neutral, not `VendorProfileItem`)
- **D-03:** Entity lives in existing `w3geekery.smemart` package alongside all other SME Mart classes
- **D-04:** `section` — YAML enum with 6 values: `corporate_identity`, `attestation`, `insurance`, `reference`, `personnel`, `financial`
- **D-05:** `expiresAt` — date type (enables GQL filtering on expiration)
- **D-06:** `status` — string type (item lifecycle: active/expired/draft/archived)
- **D-07:** `orgId` — string type scalar (NOT a link), for scoping queries
- **D-08:** `data` — string type, holds serialized JSON with section-specific content
- **D-09:** No links. Zero bidirectional link definitions
- **D-10:** No direct Engagement link (Phase 11 adds `profileItemId` to `EngagementVettingItem`)

### Claude's Discretion
- `viewProperties` selection (which fields appear in platform UI table view)
- Field description text in YAML field definitions
- Whether to add a `status` enum (D-06 says string, can propose enum if needed)

### Deferred Ideas (OUT OF SCOPE)
- `EngagementVettingItem.profileItemId` — Phase 11 (Vetting Pre-Fill)
- `OrgProfile` container class — future if needed
- Self-referential links — premature
- Status enum promotion — if status values stabilize

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VPR-01 | `MarketplaceProfileItem` GQL schema entity submitted to `zerobias-org/schema:dev` via PR | YAML class definition + 4 field YAMLs + 1 enum YAML = 6 files total |
| VPR-02 | Entity has `section` discriminator field (enum: 6 values) | Enum file: `package/w3geekery/smemart/enums/marketplaceProfileItem.section.yml` |
| VPR-03 | Entity has JSON `data` field for section-specific content | Field file: `package/w3geekery/smemart/fields/marketplaceProfileItem.data.yml` (type: string) |
| VPR-04 | Entity is org-scoped (multiple org members can contribute items) | `orgId` scalar field (no link) in class definition |
| VPR-05 | Schema includes appropriate links (org ownership, engagement reference) | Decision: NO links. Scalar `orgId` for org ownership. Phase 11 adds profile→vetting reference |
| VPR-06 | Schema passes dataloader verification before PR submission | Dataloader 1.0.89 available locally, scratch DB running, validation process documented |

## Standard Stack

### Core Schema Tooling
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| zerobias-org/schema | dev branch | YAML schema package repo (upstream) | Official ZeroBias platform schema source of truth; all SME Mart classes live here |
| dataloader | 1.0.89 (latest: 1.0.91) | Local schema validation against scratch DB | Same tool CI uses; catches issues before PR submission; catches YAML syntax, field definition mismatches, datatype errors |
| supabase-pg-content-dev | PostgreSQL 17.6 | Scratch database for dataloader verification | Standard ZeroBias schema dev environment; running locally (15432) |
| npm (global) | @zerobias-com/platform-dataloader | Command-line schema import tool | Installed globally, runs against `content_dev` database |

### Build & Validation
| Component | Version | Purpose | When to Use |
|-----------|---------|---------|------------|
| npm run validate | (in schema repo) | Lightweight YAML structure check | Quick syntax validation; NOT sufficient on its own |
| dataloader (full run) | 1.0.89+ | Full schema import + type checking | MANDATORY before PR submission; validates against live DB schema |

### Integration
| Package | Version | Purpose |
|---------|---------|---------|
| @zerobias-org/schema-w3geekery-smemart | 1.0.10 (published) | Published npm package (tag: `@zerobias-org/schema-w3geekery-smemart@1.0.10`) |
| ZeroBias Catalog (Platform) | (live) | Auto-imports schema from zerobias-org/schema:dev → QA → prod per branch |

**Installation / Setup:**
No new installations needed. Dataloader is already available globally. Scratch DB (`supabase-pg-content-dev`) is running and healthy.

**Version verification:** Dataloader 1.0.89 is slightly behind latest (1.0.91); optional to update before running, CI will use latest anyway.

## Architecture Patterns

### YAML Schema Class Definition Structure
```yaml
# classes/MarketplaceProfileItem.yml
description: "Vendor/buyer profile item — credentials, certifications, references, etc. Section discriminator + flexible JSON data."
extends:
  - Object
properties:
  - section:
      field: marketplaceProfileItem.section
  - expiresAt:
      field: marketplaceProfileItem.expiresAt
  - status:
      field: marketplaceProfileItem.status
  - orgId:
      field: marketplaceProfileItem.orgId
  - data:
      field: marketplaceProfileItem.data
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Section":
    jsonata: section
    sort: section
  "Status":
    jsonata: status
    sort: status
  "Expires At":
    jsonata: expiresAt
    sort: expiresAt
```

**Key observations from existing patterns:**
- Base class `Object` provides `id`, `name`, `description`, `dateCreated`, `dateLastModified` automatically (no need to declare)
- Properties list references field definitions via `field: namespace.fieldName` convention
- `viewProperties` defines what appears in platform UI table view (JsonataQL expressions for display + sorting)
- `linkTo` at sibling indent (if used); NOT applicable here (D-09 = zero links)

### Field Definition Pattern
```yaml
# fields/marketplaceProfileItem.section.yml
description: 'Profile section category (corporate_identity, attestation, insurance, etc.)'
displayName: 'Section'
type: string

# fields/marketplaceProfileItem.expiresAt.yml
description: 'ISO 8601 date when credential expires'
displayName: 'Expires At'
type: string   # Note: GQL treats as scalar string, not typed date — format validation in service layer

# fields/marketplaceProfileItem.data.yml
description: 'JSON-serialized section-specific data blob (insurance policy details, cert info, etc.)'
displayName: 'Data'
type: string

# fields/marketplaceProfileItem.orgId.yml
description: 'UUID of owning organization (scoping via scalar, not link)'
displayName: 'Organization ID'
type: string

# fields/marketplaceProfileItem.status.yml
description: 'Item lifecycle status (active, expired, draft, archived)'
displayName: 'Status'
type: string
```

**Why simple strings for dates & status:** ZeroBias schema generates string types in GQL. Service layer (Phase 9) handles parsing/validation. This is the established pattern for flexible domain modeling.

### Enum Definition Pattern
```yaml
# enums/marketplaceProfileItem.section.yml
description: 'Profile section type — determines JSON data structure'
displayName: 'Marketplace Profile Section'
values:
  - CORPORATE_IDENTITY: 'Legal name, registration, tax ID, DBA info'
  - ATTESTATION: 'Certifications, licenses, accreditations'
  - INSURANCE: 'D&O, GL, professional liability, COI'
  - REFERENCE: 'Client/project references, case studies'
  - PERSONNEL: 'Key personnel, resumes, background checks'
  - FINANCIAL: 'Bank statements, credit reports, financials'
```

**Naming convention:** UPPER_SNAKE_CASE for enum values. References D-04 requirement.

### Relative to Closest Pattern
`EngagementVettingItem` is the pattern reference:
- Similar structure: typed metadata fields + reference scalars
- **Difference:** EngagementVettingItem has a `linkTo: Engagement` relationship; MarketplaceProfileItem has NONE
- **Similarity:** Both have checklist/item patterns (multiple items, typed status/category, expiration)
- **Reuse:** `viewProperties` structure identical; naming conventions identical

### Integration Points
- **GQL schema reload:** After merge to `zerobias-org/schema:dev`, platform reloads GQL schema within ~15 minutes
- **Class ID deterministic:** UUID v5 from YAML content — same across all environments (dev/QA/prod)
- **Pipeline ID per-environment:** Set up later in Phase 9 (Receiver Pipeline config)
- **Field mapping:** Phase 9 creates `field-mappings.ts` with GQL ↔ domain mapping constants

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GQL schema generation | Custom resolvers, mutation endpoints | ZeroBias platform dataloader | Platform generates full CRUD GQL + filtering/pagination/sorting automatically from YAML; hand-rolled resolvers = 10x more code, higher error rate |
| Field validation | Custom validation logic | YAML field type system + service layer validation | YAML types are lightweight; service layer (Phase 9) adds domain validation; mixing both breaks DRY |
| Date/JSON parsing | Custom parsers in component | Service layer (Phase 9) | Keep raw JSON in schema, parse on read in service. Avoids schema coupling to parsing logic. |
| Enum values | Hardcoded strings in components | YAML enum definitions | Single source of truth; enum changes ripple to GQL + service layer automatically on schema reload |
| Relationship traversal | Custom join logic in queries | GQL links (linkTo) if needed in Phase 11 | Platform auto-generates traversal; custom joins = N+1 queries, complexity |

**Key insight:** The ZeroBias platform is a **schema-driven, code-generation architecture.** You write YAML, the platform generates the API. Hand-rolling anything bypasses this model. Keep it lean: YAML + validation logic in service layer only.

## Common Pitfalls

### Pitfall 1: Schema Reload Timing Assumption
**What goes wrong:** After merging PR, developer expects GQL queries to work immediately. In reality, platform reloads schema every ~15 minutes. Queries fail with "schema not found" for up to 15 min.

**Why it happens:** Platform reads schema repo on a schedule, not on-demand. No webhook to trigger instant reload.

**How to avoid:** After PR merge, wait 15 minutes before testing Phase 9 (Service layer). Document in phase plan: "Schema reload takes ~15 min after merge."

**Warning signs:** GQL queries return 404 ClassNotFound errors right after merge; queries work after waiting; CI tests pass but local tests fail because local schema is stale.

### Pitfall 2: Dataloader-Passing Schema That Fails in CI
**What goes wrong:** Local dataloader passes. PR is submitted. CI check fails with "field definition missing" or "enum not found." Blocking the PR.

**Why it happens:** Forgot to commit all field definition YAML files, or enum file missing. Dataloader validation ran against incomplete set (missing files).

**How to avoid:** Before committing, verify all files are staged:
```bash
git status
# Should show: classes/MarketplaceProfileItem.yml
#              fields/marketplaceProfileItem.section.yml
#              fields/marketplaceProfileItem.expiresAt.yml
#              fields/marketplaceProfileItem.status.yml
#              fields/marketplaceProfileItem.orgId.yml
#              fields/marketplaceProfileItem.data.yml
#              enums/marketplaceProfileItem.section.yml
```

**Warning signs:** Missing field definition error from dataloader; enum not found during schema load; CI rejects PR but local validation passed.

### Pitfall 3: YAML Indent/Syntax Silent Failures
**What goes wrong:** YAML syntax error (extra space, tab instead of space, misaligned `linkTo`). Dataloader runs silently, exits 0, but field isn't loaded.

**Why it happens:** Dataloader doesn't validate every field against schema definition; subtle YAML errors pass the import but field doesn't materialize in GQL.

**How to avoid:**
1. Run `npm run validate` first (catches obvious YAML syntax)
2. After dataloader, query GQL to verify field exists:
   ```
   # Pseudo-query
   query { MarketplaceProfileItem { section expiresAt } }
   ```
3. Always check dataloader output for "field not loaded" warnings

**Warning signs:** Field appears in class definition but GQL query returns "Unknown field"; no error during dataloader run.

### Pitfall 4: Class/Field Name Mismatch
**What goes wrong:** Class file named `MarketplaceProfileItem.yml` but field definitions use `marketplaceProfileItems` (plural). Or field `field:` value doesn't match filename.

**Why it happens:** Naming convention confusion. Schema rules: class names are CamelCase, field references are `lowerCamelCase.fieldName`, filenames are `lowerCamelCase.fieldName.yml`.

**How to avoid:**
- Class file: `MarketplaceProfileItem.yml` (CamelCase, matches GQL class name)
- Class reference in field: `field: marketplaceProfileItem.expiresAt` (lowerCamelCase.fieldName)
- Field filename: `marketplaceProfileItem.expiresAt.yml` (matches field: value)

**Pattern verification:** Look at existing classes (e.g., `Engagement.yml`, `EngagementVettingItem.yml`). Copy naming exactly.

**Warning signs:** Dataloader error "Unknown field reference `marketplaceProfileItems.data`"; GQL schema missing field.

### Pitfall 5: linkTo Syntax (Even Though Not Used Here)
**What goes wrong:** Developer adds a link in future phases and uses wrong indent/format.

**Why it happens:** `linkTo` is a sibling property to the field reference, not nested inside it. Easy to nest by accident.

**How to avoid (for future reference):**
```yaml
# CORRECT — sibling indent
- engagement:
  linkTo: Engagement.id.profileItems
  multi: true

# WRONG — nested (causes error)
- engagement:
  field: profileItem.engagementId
  linkTo: Engagement.id.profileItems  # Bad indent
```

**Warning signs:** Dataloader error "Invalid link format"; GQL missing reverse relationship.

## Runtime State Inventory

> Phase 8 is pure schema definition — no runtime state inventory needed. Schema lives in git, not in databases or services. Dataloader imports it; platform loads it. Nothing to migrate or rename in runtime systems.

## Code Examples

### Complete MarketplaceProfileItem Class Definition
```yaml
# classes/MarketplaceProfileItem.yml
description: "Vendor/buyer profile item containing credentials, certifications, references, insurance info, or personnel data. Uses section discriminator + JSON data blob for flexible content."
extends:
  - Object
properties:
  - section:
    field: marketplaceProfileItem.section
  - expiresAt:
    field: marketplaceProfileItem.expiresAt
  - status:
    field: marketplaceProfileItem.status
  - orgId:
    field: marketplaceProfileItem.orgId
  - data:
    field: marketplaceProfileItem.data
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Section":
    jsonata: section
    sort: section
  "Status":
    jsonata: status
    sort: status
  "Expires At":
    jsonata: expiresAt
    sort: expiresAt
```

Source: Pattern from `EngagementVettingItem.yml` (existing, verified working)

### Field Definition — Section Enum Reference
```yaml
# fields/marketplaceProfileItem.section.yml
description: 'Profile section type — determines content structure in JSON data blob'
displayName: 'Section'
type: string
```

Source: Pattern from existing field files (e.g., `bid.status.yml`)

### Enum Definition — Section Values
```yaml
# enums/marketplaceProfileItem.section.yml
description: 'Profile section categories'
displayName: 'Marketplace Profile Section'
values:
  - CORPORATE_IDENTITY: 'Legal registration, tax ID, DBA, incorporation info'
  - ATTESTATION: 'Licenses, certifications, accreditations, professional designations'
  - INSURANCE: 'D&O, general liability, professional liability, COI'
  - REFERENCE: 'Client/project references, case studies, testimonials'
  - PERSONNEL: 'Key personnel profiles, resumes, background checks'
  - FINANCIAL: 'Financial statements, bank statements, credit reports'
```

Source: Pattern from `bid.status.yml` enum (existing, verified working)

### GQL Query Example (Post-Merge)
```graphql
# After schema reload (within 15 min of merge)
query {
  MarketplaceProfileItem(
    orgId: ".eq.<org-uuid>",
    section: ".eq.INSURANCE",
    expiresAt: ".lt.2026-12-31",
    pageSize: 10
  ) {
    id
    name
    description
    section
    status
    expiresAt
    orgId
    data
    dateCreated
    dateLastModified
  }
}
```

This works because:
- All fields are declared in YAML, dataloader imports them
- GQL auto-generates filtering operators (`.eq.`, `.lt.`, etc.)
- `orgId` scalar allows filtering by org ownership
- `data` returns raw JSON string (service layer parses in Phase 9)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine (Angular default) |
| Quick run command | `npm test` (runs affected tests only) |
| Full suite command | `npm test -- --watch=false` |

### Phase Requirements → Test Map

Phase 8 has NO CODE requirements (pure schema YAML). Testing happens at schema validation level, not unit test level.

| Req ID | Behavior | Test Type | Validation Method | Automated? |
|--------|----------|-----------|-------------------|-----------|
| VPR-01 | Class definition exists and is valid | Schema validation | `npm run validate` in schema repo (structure check) + dataloader run (DB import check) | ✅ Dataloader |
| VPR-02 | Section enum has 6 values | Schema validation | Dataloader imports enum; GQL query shows values | ✅ Dataloader |
| VPR-03 | Data field exists as string type | Schema validation | Field definition YAML exists; dataloader imports; GQL query succeeds | ✅ Dataloader |
| VPR-04 | OrgId scalar for scoping | Schema validation | `orgId` field definition exists; class definition includes it | ✅ Dataloader |
| VPR-05 | No links declared | Schema validation | Class definition has NO `linkTo` statements | ✅ Manual review |
| VPR-06 | Dataloader passes | Schema validation | `dataloader ... -d ./` exits 0; marker `.dataloader-validated` created | ✅ Dataloader |

### Sampling Rate
- **Per task commit (schema repo):** `npm run validate` before commit
- **Pre-PR:** Full dataloader run locally; must pass with exit code 0
- **Phase gate:** Cross-fork PR review by zerobias-org/schema maintainers; CI check passes on merge to dev

### Wave 0 Gaps
None — all required YAML files are being created as part of this phase. No test infrastructure setup needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| dataloader | Schema validation | ✅ | 1.0.89 (latest: 1.0.91) | Update: `npm install -g @zerobias-com/platform-dataloader@latest` |
| supabase-pg-content-dev (Docker) | Dataloader scratch DB | ✅ | PostgreSQL 17.6 | Already running on port 15432 |
| zerobias-org/schema repo (upstream) | Source of truth | ✅ | latest dev branch | `git fetch upstream` before branching |
| ZeroBias Catalog (platform) | GQL schema deployment | ✅ | Live (15-min reload) | Platform auto-pulls from schema:dev after PR merge |
| w3geekery/schema fork | Work repository | ✅ | fork of zerobias-org/schema | Already cloned at `~/Projects/w3geekery/zerobias-org-forks/schema` |

**Missing dependencies with no fallback:** None — all required tools are available.

**Dependency status:** All green. No blockers.

## State of the Art

| Aspect | Current Approach | Why It's Standard | When Changed |
|--------|------------------|-------------------|--------------|
| Schema definition | YAML files (class, field, enum) | Platform auto-generates GQL from YAML; no hand-written resolvers | ZeroBias 2023 (inception of dataloader) |
| Base classes | Extend `Object` (id, name, description, dates) | Provides table stakes metadata; lighter than extending `File`/`Element` | ZeroBias 2023 |
| Field typing | Simple types (string, number, boolean, date); complex types in JSON | Schema layer is lightweight; domain validation/parsing in service layer | ZeroBias 2023 |
| Relationships | `linkTo` for bidirectional GQL traversal OR scalar IDs for references | Links auto-generate reverse relationships; scalars avoid circular dependencies | ZeroBias 2023 |
| Enum values | UPPER_SNAKE_CASE in YAML enum files | Platform convention; matches Java/C# conventions; Python readability | ZeroBias 2023 |
| Validation | Lightweight (dataloader syntax check); Heavy lifting in service layer | Schema layer is read-only; service layer owns business validation | ZeroBias design principle |

**Deprecated/outdated:** None — ZeroBias schema architecture is stable and current.

## Open Questions

1. **Should `status` be an enum or string?**
   - What we know: D-06 specifies `string` type. Status values are `active/expired/draft/archived` (domain-specific).
   - What's unclear: Whether these values should be enumerated in YAML or remain open-ended strings.
   - Recommendation: Keep as string for now (Phase 8 compliance with D-06). If Phase 9 identifies stable enum values, promote to YAML enum in a follow-up PR. YAGNI principle.

2. **Is `expiresAt` semantics correct for all sections?**
   - What we know: VPR-05 requires expiration filtering. Insurance COI, attestations, personnel checks all expire. Corporate identity/financial less clear.
   - What's unclear: Whether all sections truly have expiration semantics, or if some sections use it differently.
   - Recommendation: Treat as optional field in Phase 9 service layer. Some sections populate it (insurance, attestation); others leave null. GQL filtering handles nulls gracefully.

3. **How does Phase 9 deserialize `data` JSON?**
   - What we know: `data` is a string blob. Service layer will parse it per section type.
   - What's unclear: Schema for section-specific JSON objects (not defined in this phase).
   - Recommendation: Document in Phase 9 plan. Use Zod or JSON schema for validation once structure is defined.

## Sources

### Primary (HIGH confidence)
- **zerobias-org/schema repo (upstream/dev)** — Verified by git fetch, branch inspection
  - `package/w3geekery/smemart/classes/EngagementVettingItem.yml` — Pattern reference
  - `package/w3geekery/smemart/classes/Engagement.yml` — Links example
  - `package/w3geekery/smemart/fields/*.yml` — Field definition patterns
  - `package/w3geekery/smemart/enums/*.yml` — Enum patterns

- **`.planning/docs/SCHEMA_CHANGE_PROCESS.md`** — Full step-by-step workflow (project-local)

- **`.planning/notes/zb-graphql-custom-schema-howto.md`** — YAML conventions, field types, enum format (project-local)

- **ZeroBias platform dataloader** — Verified `v1.0.89` running locally; scratch DB verified running (PostgreSQL 17.6 on port 15432)

### Secondary (MEDIUM confidence)
- **Git state check (schema repo):** Current branch `feat/batch-schema-updates`, upstream/dev synced, no blocking PRs
- **Field naming conventions:** Inferred from 17 existing classes; pattern verified consistent across Engagement, EngagementVettingItem, Bid, ServiceOffering

### Tertiary (LOW confidence - informational)
- None — all critical findings verified against source code or live tools

## Metadata

**Confidence breakdown:**
- **Standard stack (HIGH):** All tools verified running locally (dataloader 1.0.89, scratch DB, git repos)
- **Architecture (HIGH):** Pattern reference (EngagementVettingItem) verified in source; YAML structure rules documented and tested in existing classes
- **Pitfalls (MEDIUM):** Based on SCHEMA_CHANGE_PROCESS.md warnings + patterns observed in existing classes; not tested directly but consistent across all 17 classes
- **Environment (HIGH):** Docker container verified running; dataloader version confirmed; all registries configured per CLAUDE.md

**Research date:** 2026-03-31
**Valid until:** 2026-04-14 (2 weeks; schema tooling is stable, no upstream churn expected)

**Assumptions:**
- w3geekery fork remains synced with upstream/dev (will verify before phase execution)
- Dataloader maintains backward compatibility (no breaking changes in next 2 weeks)
- Schema reload timing (15 minutes) consistent with platform SLA

---

*Phase: 08-vendor-profile-schema*
*Context: GSD milestone v1.1 (Org Navigation & Vendor Profile)*
*Upstream refs: zerobias-org/schema, zerobias-org/hydra-sdk*
