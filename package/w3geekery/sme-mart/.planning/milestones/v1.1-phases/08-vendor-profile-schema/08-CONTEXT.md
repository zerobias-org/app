# Phase 8: Vendor Profile Schema - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Submit a `MarketplaceProfileItem` GQL schema entity to `zerobias-org/schema:dev` via PR. The entity uses a section discriminator + JSON data blob pattern for flexible per-section content, with typed fields for filterable metadata. Pass dataloader validation, merge to dev, confirm schema reload.

</domain>

<decisions>
## Implementation Decisions

### Entity Design (Hybrid Approach)
- **D-01:** Single `MarketplaceProfileItem` class with `section` enum discriminator + JSON `data` string field. NOT separate classes per section type.
- **D-02:** Class name is `MarketplaceProfileItem` (neutral to buyer/vendor — both org sides use profiles). NOT `VendorProfileItem` or `OrgProfileItem`.
- **D-03:** Entity lives in existing `w3geekery.smemart` package alongside all other SME Mart classes.

### Typed Fields (GQL-Filterable)
- **D-04:** `section` — YAML enum (`marketplaceProfileItem.section`) with 6 values: `corporate_identity`, `attestation`, `insurance`, `reference`, `personnel`, `financial`
- **D-05:** `expiresAt` — date type. Enables GQL filtering on expired items (VPU-06 requirement).
- **D-06:** `status` — string type. Item lifecycle state (active/expired/draft/archived).
- **D-07:** `orgId` — string type (scalar, NOT a link). Org ownership for scoping queries.
- **D-08:** `data` — string type. Holds serialized JSON blob with section-specific content. Clean separation: `name` = display label, `description` = human summary, `data` = structured JSON.

### Links
- **D-09:** No links. Zero bidirectional link definitions. `orgId` is a scalar field, not a `linkTo`.
- **D-10:** No direct Engagement link. The vetting→profile linkage will be handled in Phase 11 by adding `profileItemId` scalar to `EngagementVettingItem`.

### Inherited from Object Base Class
- `id`, `name`, `description`, `dateCreated`, `dateLastModified` — all inherited automatically.

### Claude's Discretion
- `viewProperties` selection (which fields appear in platform UI table view)
- Field description text in YAML field definitions
- Whether to add a `status` enum or keep it as a plain string (decision D-06 says string — Claude can propose an enum if it makes sense during implementation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema Change Process
- `.planning/docs/SCHEMA_CHANGE_PROCESS.md` — Full step-by-step: branch from upstream/dev, YAML rules, dataloader validation, cross-fork PR, post-merge reload timing

### Schema Repo & Package
- `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/` — Existing schema package (classes/, fields/, enums/ subdirectories)
- `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/catalog.yml` — Package metadata

### Pattern References (existing classes)
- `EngagementVettingItem.yml` on `upstream/dev` — Closest pattern: checklist item with category, status, expiresAt, engagementId scalar, engagement link. Use as structural template.
- `Engagement.yml` on `upstream/dev` — Example of class with multiple `linkTo` relationships and scalar fields.

### GQL Schema Howto
- `.planning/notes/zb-graphql-custom-schema-howto.md` — YAML class/field/enum definitions, linkTo format, dataloader verification
- `.planning/notes/zb-graphql-schema-extension-guide.md` — Platform internals (SchemaBuilder, catalog tables)

### Field Mappings (downstream — Phase 9 will need these)
- `src/app/core/field-mappings.ts` — Existing field mapping constants for 17 entities. MarketplaceProfileItem mapping will be added in Phase 9.

### Dataloader Validation
- `.planning/docs/SCHEMA_CHANGE_PROCESS.md` §3 — Scratch DB setup, dataloader command, `.dataloader-validated` marker

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Schema repo has 17 existing SME Mart classes as pattern reference
- `EngagementVettingItem` is the closest analog (checklist item with typed metadata + engagement reference)
- Existing enum definitions (e.g., `engagement.status.yml`, `bid.status.yml`) serve as templates for the section enum

### Established Patterns
- YAML class definition: `extends: [Object]`, properties with `field:` references, `viewProperties` for platform UI
- Field definitions: separate `fields/className.fieldName.yml` files with `description`, `displayName`, `type`
- Enum definitions: separate `enums/className.fieldName.yml` files with value lists
- Links: `linkTo: OtherClass.id.reverseProperty` at sibling indent level — but NOT used for this entity (D-09)

### Integration Points
- Schema PR merges to `zerobias-org/schema:dev` → platform reloads GQL schema within ~15 minutes
- Class ID is deterministic (UUID v5 from YAML content) — same across all environments
- Pipeline ID is per-environment (NOT deterministic) — will be set up in Phase 9

</code_context>

<specifics>
## Specific Ideas

- `EngagementVettingItem` is the structural template — follow its YAML pattern but without any `linkTo` relationships
- The `data` field holds section-specific JSON (insurance policy details, attestation cert info, etc.) — the Angular service layer (Phase 9) will handle serialization/deserialization
- `expiresAt` is critical as a typed field because the UI needs to filter/sort by expiration status without parsing JSON blobs
- Class name `MarketplaceProfileItem` chosen to be neutral — both buyer and supplier orgs maintain profiles

</specifics>

<deferred>
## Deferred Ideas

- **EngagementVettingItem.profileItemId** — Adding the pointer field from vetting items to profile items. Belongs in Phase 11 (Vetting Pre-Fill), not this schema PR.
- **OrgProfile container class** — A parent container for profile items was considered but rejected. If needed later, can be added without breaking MarketplaceProfileItem.
- **Self-referential links** — Profile items referencing other profile items (e.g., insurance cert → corporate identity). Premature for now.
- **Status enum** — D-06 uses plain string. If status values stabilize, could be promoted to an enum in a future schema PR.

</deferred>

---

*Phase: 08-vendor-profile-schema*
*Context gathered: 2026-03-31*
