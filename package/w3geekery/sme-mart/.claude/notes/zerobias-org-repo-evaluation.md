# zerobias-org Repository Evaluation for SME Mart

## Summary

Of the 28 zerobias-org repositories, **SME Mart should evaluate and likely use 5 additional repos** beyond the 5 already integrated. Three of these are **critical dependencies**, two are **optional but valuable**.

## Currently Used by SME Mart (5 repos)

1. **`app`** — Customer Apps (SME Mart Angular app forked)
2. **`login`** — White-label login pages (forked)
3. **`module`** — Hub module API layer (forked)
4. **`ngx-library`** — Angular component library (npm dependency, v0.2.15)
5. **`schema`** — GQL entity definitions (planned, not yet integrated)

---

## Recommended Additional Repos

### TIER 1: CRITICAL (Should Use)

#### 1. **`types`** — @zerobias-org/types monorepo
- **Status:** ✅ CRITICAL
- **Updated:** 2026-02-13
- **Purpose:** Foundation type system providing TypeScript type definitions for ZeroBias/Auditmation platform
- **What it provides:**
  - `@zerobias-org/types-core-js` — Core type implementations (UUID, Email, validation)
  - `@zerobias-org/types-amazon-js` — AWS type definitions
  - `@zerobias-org/types-google-js` — GCP type definitions
  - `@zerobias-org/types-microsoft-js` — Azure type definitions
  - `@zerobias-org/types-atlassian-js` — Atlassian type definitions
  - `@zerobias-org/types-core-typedefs` — OpenAPI schema definitions
  - ESM-compatible with `.js` extensions on all imports

- **Why SME Mart needs it:**
  - Currently using `@zerobias-org/data-utils` (v1.0.22) which likely depends on types
  - Type validation for API responses, user input, resource IDs
  - Consistent error handling (InvalidInputError, NoSuchObjectError)
  - Cloud provider types if SME Mart integrates with AWS/GCP/Azure in future
  - Ensures platform-wide type consistency

- **How to use:**
  ```typescript
  import { UUID, Email, CoreType } from '@zerobias-org/types-core-js';
  import { InvalidInputError } from '@zerobias-org/types-core-js';

  // List all available types
  const types = CoreType.listTypes();

  // Validate UUID
  const id = await UUID.parse(userInput);

  // Handle validation errors
  throw new InvalidInputError('email', value, Email.examples());
  ```

- **Integration effort:** Low — mostly import/replace any manual type definitions with zerobias-org versions

---

#### 2. **`schema`** — GQL schema packages (already planned)
- **Status:** ✅ CRITICAL (on roadmap)
- **Updated:** 2026-02-09
- **Purpose:** GraphQL entity definitions for AuditgraphDB (source of truth for schema)
- **What it provides:**
  - YAML-based schema package definitions (`classes/`, `interfaces/`, `fields/`, `enums/`, `documents/`)
  - Monorepo structure for vendor-specific schemas
  - AuditgraphDB object types loaded by dataloader
  - Examples: `schema-vendor-product`, `schema-github-github`, etc.

- **Why SME Mart needs it:**
  - Already in PLAN.md as critical dependency
  - Required for custom GQL queries on ZeroBias platform
  - SME Mart resource types (engagements, proposals, reviews, service offerings) must be defined here
  - Referenced in [`.claude/notes/zb-graphql-custom-schema-howto.md`](zb-graphql-custom-schema-howto.md) and [`.claude/notes/zb-graphql-schema-extension-guide.md`](zb-graphql-schema-extension-guide.md)

- **How to use:**
  1. Create SME Mart schema package: `package/zerobias/schema-zerobias-sme-mart/`
  2. Define classes for: WorkRequest, ServiceOffering, Proposal, Review, Engagement
  3. Define interfaces for shared properties (timestamps, status, owner)
  4. Define fields with type info and descriptions
  5. Publish to ZeroBias registry
  6. Dataloader loads schema → enables GQL queries

- **Integration effort:** Medium — requires YAML schema design, NPM publishing, ZeroBias dataloader setup

---

#### 3. **`util`** — @zerobias-org/util monorepo
- **Status:** ✅ HIGHLY RECOMMENDED
- **Updated:** 2026-03-03 (most recent)
- **Purpose:** Utility packages for ZeroBias projects
- **What it provides:**
  - `@zerobias-org/util-codegen` — OpenAPI code generator for Hub modules
  - Supports `hub-module` generator, `hub-client` generator
  - Generates ESM-compatible TypeScript with `.js` extensions
  - Requires Java 8+ for codegen, Node.js 22+

- **Why SME Mart needs it:**
  - SME Mart module (`module/` repo) uses OpenAPI as source of truth (`api.yml`)
  - Codegen transforms `api.yml` → TypeScript Hub module client code
  - Prevents manual sync between API spec and generated types
  - Ensures type safety across module-app boundary
  - Hub module versioning/publishing depends on generated code

- **How to use:**
  ```bash
  # In module/ repo
  cd packages/sme-mart
  # Edit api.yml with new endpoints/schemas
  npm run generate:code  # Runs util-codegen to regenerate TypeScript
  npm run build
  npm run publish
  ```

- **Integration effort:** Low — already integrated in module build pipeline if correctly set up

---

### TIER 2: OPTIONAL BUT VALUABLE (Should Consider)

#### 4. **`product`** — Community-driven products monorepo
- **Status:** ⭐ VALUABLE BUT OPTIONAL
- **Updated:** 2026-02-17
- **Purpose:** Product catalog defining integrations (vendors like GitHub, Slack, Jira)
- **What it provides:**
  - Monorepo with vendor products: `@zerobias-org/product-github`, `@zerobias-org/product-atlassian`, etc.
  - 50+ vendor products (Addigy, ADP, Aiven, Allgress, Amazon, Anchore, Apptio, Aquasec, Asana, Atlassian, Auvik, Avigilon, BambooHR, BeyondTrust, Box, Certn, Chainguard, Checkov, Checkr, ...)
  - Product metadata, versions, versions history
  - Lerna-managed versioning

- **Why SME Mart might want it:**
  - If SME Mart integrates external tools (Slack notifications, Jira task creation, GitHub integration for credentials)
  - Define custom "SME Mart" product if it becomes a discoverable module
  - Use existing vendor products to create cross-platform workflows
  - Example: Module that connects SME Mart engagements to Jira tasks, GitHub issues, Slack channels

- **When to use:**
  - Only if SME Mart launches vendor integrations (e.g., "notify on Slack", "create Jira ticket for engagement")
  - Not critical for MVP

- **Integration effort:** Medium-High — requires forking, creating `product-w3geekery-sme-mart/`, publishing to registry

---

#### 5. **`tag`** — ZeroBias open-source tag artifacts
- **Status:** ⭐ VALUABLE FOR TAGGING STRATEGY
- **Updated:** 2026-02-18
- **Purpose:** Community-driven tag definitions
- **What it provides:**
  - Pre-defined tag taxonomies (compliance frameworks, vendors, service types, etc.)
  - YAML-based tag catalogs
  - Prevents tag duplication across platform

- **Why SME Mart might want it:**
  - SME Mart uses ZB tags heavily (skills, certifications, service categories, compliance frameworks)
  - Repo provides canonical tag definitions to avoid naming conflicts
  - Ensures tags are reusable across SME Mart, other apps, and ZB platform
  - Example tags: `nist-800-53`, `cybersecurity`, `compliance`, `aws-certified`, `iso-27001`, etc.

- **How to use:**
  - Reference pre-defined tags from repo in SmeMartTagService
  - Add SME Mart-specific tags if they don't exist
  - Use `platform.Tag.suggestTag()` for community tags, `danaOld.Tag.createTag()` for internal tags

- **When to use:**
  - When designing tag taxonomy for engagements, providers, service offerings
  - Before creating tags programmatically (check if they already exist)

- **Integration effort:** Low — mostly reference/read, optional tag creation

---

### TIER 3: NOT RECOMMENDED (Context only)

#### 6. **`claude-marketplace`** — Claude Code plugins
- **Status:** ❌ NOT RELEVANT
- **Reason:** Tools for Claude development in other repos, not SME Mart code
- **Use case:** If SME Mart team wants to create Claude skills (e.g., `/sme-mart:analyze-engagement`)

#### 7. **`devops`** — Infrastructure/deployment workflows
- **Status:** ❌ NOT RECOMMENDED NOW
- **Reason:** Platform infrastructure (Kubernetes, Helm, Debezium). SME Mart deploys via GitHub Actions in main app/ repo
- **Use case:** Only if building custom deployment pipelines (likely handled by Kevin/platform team)

#### 8. **`pipeline`** — Community Pipeline Configurations
- **Status:** ❌ NOT RELEVANT
- **Reason:** Empty repo (just README header). No clear schema/examples
- **Use case:** Once populated, could define SME Mart data pipelines (collector bots, workflows)

#### 9. **`segment`** — Catalog for categorizing products/services
- **Status:** ⭐ OPTIONAL (lower priority than types/schema)
- **Updated:** 2026-01-24
- **Purpose:** Pre-defined segmentation taxonomies
- **What it provides:**
  - `@zerobias-org/segment-zerobias` — ZeroBias domain/category/tool segments
  - Hierarchical categorization (domains → categories → tools → features)

- **Why SME Mart might want it:**
  - Could use to categorize service offerings by domain (compliance, cybersecurity, risk, etc.)
  - Prevents reinventing categorization
  - Enables cross-repo resource linking

- **When to use:**
  - If SME Mart marketplace needs hierarchical service categorization
  - Can defer until service discovery/filtering is needed

#### 10. **`framework`** — Compliance frameworks monorepo
- **Status:** ⭐ OPTIONAL (lower priority)
- **Updated:** 2026-02-17
- **Purpose:** NIST, ISO, CIS, and other compliance framework definitions
- **What it provides:**
  - Vendor-specific frameworks (NIST 800-53, ISO 27001, CIS, etc.)
  - Controls, baselines, element hierarchies
  - Lerna-managed versioning

- **Why SME Mart might want it:**
  - SME Mart targets compliance experts
  - Could use frameworks for skill/service matching (e.g., "find experts in NIST 800-53")
  - Or define which frameworks each service offering covers

- **When to use:**
  - Not critical for MVP (can use ZB framework search API instead)
  - Consider post-MVP for advanced filtering by framework coverage

#### Others (Not Recommended)
- **`compliance_feature`**, **`compliance_context`**, **`standard`**, **`benchmark`**, **`crosswalk`**, **`kb`**, **`oauth`**, **`vendor`**, **`zerobias-workspace`** — Domain-specific artifacts, not dependencies for SME Mart frontend

---

## Implementation Priority

### Phase 1 (Now - Immediate)
1. ✅ **`schema`** — Critical for GQL integration (already planned)
2. ✅ **`types`** — Replace any manual type definitions with `@zerobias-org/types-*`
3. ✅ **`util`** — Ensure codegen in module/ is properly configured

### Phase 2 (Short-term)
4. ⭐ **`tag`** — Before large-scale tag creation for engagements/providers

### Phase 3 (Post-MVP)
5. ⭐ **`product`** — If building vendor integrations
6. ⭐ **`segment`** — If adding hierarchical service categorization

---

## Dependency Chain

```
SME Mart Angular App
├── @zerobias-com/zerobias-angular-client (SDK)
├── @zerobias-org/ngx-library (UI components, themes) ✅ 0.2.15
├── @zerobias-org/data-utils (data utilities)
├── @zerobias-org/types-* (type definitions) ← ADD THIS
└── zerobias-org/schema (GQL entity definitions) ← ADD THIS

SME Mart Hub Module
├── @zerobias-org/util-codegen (code generation) ← ENSURE ACTIVE
└── API types (generated from api.yml)
```

---

## Next Steps

1. **Review PLAN.md** — Verify schema integration approach aligns with roadmap
2. **Audit type usage** — Check if `@zerobias-org/types-*` should replace manual definitions
3. **Verify codegen** — Ensure module/ build includes util-codegen step
4. **Plan tag taxonomy** — Reference `tag` repo before creating engagement/provider tags
5. **Defer optional repos** — `product`, `segment`, `framework` for Phase 2+

---

## References

- zerobias-org: https://github.com/zerobias-org/
- PLAN.md: `.claude/plans/public/PLAN.md`
- Type definitions: https://github.com/zerobias-org/types
- Schema packages: https://github.com/zerobias-org/schema
- Codegen: https://github.com/zerobias-org/util (packages/codegen)
