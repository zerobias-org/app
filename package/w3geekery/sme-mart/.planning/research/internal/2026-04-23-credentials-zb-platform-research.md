# Seller Credentials — ZB Platform Research & Minimal-Custom Schema

**Researched 2026-04-23** via ZB MCP (UAT profile).
**Companion to** [`2026-04-23-seller-credentials-catalog-research.md`](2026-04-23-seller-credentials-catalog-research.md). This one answers "what does the ZB platform already have, and what do we actually need to add?"

---

## TL;DR

**No credential/certification primitive exists on the platform today.** But the building blocks for an absorption-friendly design are all there:

- **Issuers** map cleanly to `Vendor` (moderated via `createSuggestedVendor`)
- **Ecosystems** map cleanly to `Framework` (moderated via Activity `cerFmkR1`)
- **Role qualifications** map to `CatalogRole` (no extension path needed — already rich)
- **Resource relationships** can use `hydra.Resource.linkResources` IF Certification becomes a hydra Resource — which requires a platform-side new `certification` resource type.

**Recommended minimum custom schema: 3 GQL classes** — `Certification`, `UserCredential`, `OrgCredential` — all linking out to platform entities by ID.

**Not recommended:** 0 or 1 custom classes. The platform lacks a credential concept; shoehorning into `standard` or `kb` resource types loses critical metadata (issue/expiry dates, scope, issuer). A net-new platform `certification` resource type is the "right" absorption target but requires Kevin.

---

## Findings

### 1. What I searched for and what exists

| Search term | Result |
|---|---|
| `certification` | **0 operations** |
| `credential` | **0 operations** |
| `badge` | **0 operations** |
| `accreditation` | **0 operations** |
| `license` | **0 operations** |
| `qualification` | **1 operation** — `platform.CatalogRole.listRoleQualifications` |
| `framework` | 20 operations (rich API) |
| `vendor` | 14 operations |
| `role` | 46 operations |
| `resource` | 44 operations (hydra + platform + store + danaOld) |
| `suggested` | 9 operations |
| `activity` | 13 operations |

**No existing certification/credential concept.**

### 2. Qualification type enum is not extensible

`platform.CatalogRole.listRoleQualifications` returns `Qualification` records. Full type enum:
```
qualificationType: 'knowledge' | 'skill'
```
No `certification` type. Adding one = platform schema change.

### 3. Vendor catalog is rich and the right fit for Issuers

`platform.Vendor.listVendors` returned **435 vendors** (paginated at 100; 5 pages). The list mixes:
- Tech vendors: Slack, Atlassian, Crowdstrike, Fortinet, Jamf, Snyk, JFrog, etc.
- **Standards bodies:** NIST, DoD, DHS, IEC, CNCF, OASIS Open, CIS, SLSA, TISAX
- Government jurisdictions: US, DoD, DHS, Hong Kong, France, Slovak Republic, Alaska(!)
- Marketplaces/platforms: RapidAPI, Chainguard

**CAICO, ISACA, ISC², CompTIA, GIAC, OffSec, EC-Council — not present yet.** Submission path is `platform.Vendor.createSuggestedVendor` (payload: `{ name, description, url, imageUrl? }`) → creates a `SuggestedVendor` awaiting moderation.

The Vendor record already has image, URL, description. Every credential issuer in our catalog fits the Vendor shape.

### 4. Framework catalog has a moderated extension path

`platform.Activity.list` (142 activities) revealed the **catalog-extension request pattern** via Activity codes:

| Activity code | Name |
|---|---|
| `cerFmkR1` | **Review Framework Catalog Extension Request** |
| `cerPrdR1` / `cerPrdR2` | Review Product Catalog Extension Request |
| `cerEtyR1` / `cerEtyR2` | Review Evidence Type Catalog Extension Request |
| `suggestion` | **Moderate Suggestion** (generic) |
| `rCompFeat`, `rProduct`, `rSegment` | Discuss/Review Version activities |
| `orgRequestVendor`, `orgClaimVendor` | Organization Vendor workflow |
| `crosswalkSugg`, `linkSuggestion`, `deleteLinkS`, `rTagSuggestion`, `tagSuggestion`, `opSuggestion` | Various moderated suggestion activities |

**There is NO public "suggestFramework" endpoint.** Framework additions go through a Task created against activity `cerFmkR1` — that's the moderated path. I'd need to confirm with Kevin whether we create those Tasks ourselves (when a Seller flags a missing cert) or file them manually per missing framework.

**Framework list returned 0 items** on my UAT profile — likely auth scope issue. I need the actual inventory to match our 130 certs. Can be resolved by having a Kevin-accessible profile query it, or reading from prod MCP. **Follow-up.**

### 5. CatalogRole supports org-scoped creation

`platform.CatalogRole.create` accepts `newRole` with `{ name, code, description, roleType, orgTypes, roleCategory, scalable, qualifications? }` and returns a record with `ownerId` (orgId). Roles are **org-creatable** — the SME Mart org (or w3geekery org) can add custom roles like "CMMC Certified Assessor" without platform-team involvement.

**But** — `qualificationType` on Qualifications is hardcoded to `knowledge | skill`. So we can't add certifications *as qualifications on a Role* without a platform change. We can only *link* (Certification "qualifies for" Role via our own join field).

### 6. Hydra Resource/Tag/Link — sufficient but needs a resource type

Resource types enumerated via `hydra.Resource.getResourceTypes` (109 types). Relevant existing types:

- `role`, `vendor`, `framework`, `framework_element`, `framework_version` — existing platform catalog types
- `standard`, `benchmark`, `control`, `baseline` — compliance primitives
- `kb` (Knowledge Base Article), `catalog_request`, `catalog_operation`
- `party`, `team`, `activity`, `task`, `finding`

**No `certification` or `credential` resource type exists.** Closest approximations:
- `standard` — ISO/NIST documents, not personal certs
- `role` — a work role, not a credential

**Implication:** to model Certification purely as hydra Resource (to get free tagging, linking, search), we'd need a new platform resource type. This IS the clean absorption target long-term but requires Kevin + a platform schema change. Not v1.4-feasible.

**`hydra.Resource.linkResources`** is the generic relationship primitive — if we had a Certification resource type, linking a `party` (user) to a `certification` via a link type like `holds_credential` would give us the join without a custom class. Future migration target.

### 7. Other observations

- `hydra.Tag.addResourceTypesToTagType` — tags can be scoped to specific resource types. Our credential taxonomy could live as tags on Certification resources (if we had them).
- `platform.Resource.suggestResourceLink` / `suggestResourceTag` — moderated resource-level suggestions, if we go the hydra-Resource route.
- `catalog_request` resource type exists — suggests there's a generic "request to add to catalog" flow worth Kevin-confirming.

---

## Recommended schema (3 custom classes)

Given absorption directive + platform gaps, this is the **minimum** custom surface area while maximizing links to platform entities.

```yaml
# ──────────────────────────────────────────────
# Certification — catalog master
# ──────────────────────────────────────────────
Certification:
  id: uuid
  code: string                     # e.g. "CMMC.CCA", "ISC2.CISSP" (namespaced by ecosystem)
  name: string                     # e.g. "Certified CMMC Assessor"
  description: string

  # Links to PLATFORM entities (no custom Issuer/Ecosystem classes)
  issuerVendorId: uuid             # -> platform Vendor (CAICO, ISACA, ISC², ...)
  frameworkIds: [uuid]             # -> platform Framework (CMMC, FedRAMP, ISO 27001, ...)
  qualifiesForRoleIds: [uuid]      # -> platform Role (Assessor, Auditor, Architect)

  # SME Mart-specific metadata (no platform analogue)
  scope: enum(individual, org, product)
  proficiency: enum(foundational, intermediate, advanced)?
  sourceUrl: string?
  sourceSnapshotDate: date?        # for cyberab.org Sept 2025 snapshot staleness warnings

  # Moderation
  status: enum(curated, submitted, rejected)
  submittedByUserId: uuid?         # -> platform User (nullable for curated)

# ──────────────────────────────────────────────
# UserCredential — User holds an individual cert
# ──────────────────────────────────────────────
UserCredential:
  id: uuid
  userId: uuid                     # -> platform User (opaque link for now)
  certificationId: uuid            # -> SME Mart Certification
  issuedAt: date?
  expiresAt: date?
  verified: boolean
  verificationSource: string?      # e.g. "cyber-ab-marketplace-api" (for future auto-verify)
  credentialNumber: string?
  notes: string?

# ──────────────────────────────────────────────
# OrgCredential — Org holds an org-scope cert
# ──────────────────────────────────────────────
OrgCredential:
  id: uuid
  orgId: uuid                      # -> platform Org (opaque link)
  certificationId: uuid            # -> SME Mart Certification
  issuedAt: date?
  expiresAt: date?
  verified: boolean
  verificationSource: string?
  credentialNumber: string?
  notes: string?
```

**Why split UserCredential and OrgCredential** (not one polymorphic join):
- GQL filter queries stay clean: "find Orgs with CCA" vs "find Users with CCA" are different queries with different result types
- Aligns with GQL idiom (concrete link classes per edge)
- Mirrors the `scope` split on Certification
- Cost is negligible (one extra class definition)

**Why no `Issuer` class:** Vendor covers it. `platform.Vendor.createSuggestedVendor` is the intake; every cert issuer (CAICO, ISACA, etc.) becomes a SuggestedVendor and gets moderated into the Vendor catalog.

**Why no `RoleRequirement` class (the "CCA requires one of [CASP+, CGRC, ...]" structure):** Deferred to v2. `Certification.qualifiesForRoleIds[]` gives us the forward direction (what role this cert enables); the "cert requires cert" dependency is a richer concept that can be added later without schema churn on the current 3 classes.

---

## What needs to happen upstream of our schema PR

1. **Inventory Framework catalog** (I couldn't on UAT profile — scope issue). Either Kevin runs `platform.Framework.listFrameworks` from his profile and shares results, or we query prod MCP. Without this we don't know which of our ~15 ecosystems (CMMC, SCF, SCA, FedRAMP, HITRUST, PCI, CSA STAR, ISO 27001, SOC 2, HIPAA, NIST CSF, etc.) already have Framework entries vs need `cerFmkR1` submissions.

2. **Submit missing Frameworks** via activity `cerFmkR1` (moderated Task). Can run in parallel with schema PR — Content team will process over time. Our `Certification.frameworkIds[]` is `[]` until a matching Framework exists; filter works opportunistically.

3. **Submit Issuer Vendors** via `createSuggestedVendor` for the ~20 issuers in our catalog. Can run in parallel.

4. **Confirm with Kevin:**
   - Is `cerFmkR1` the right activity for framework-addition requests? Or is there a newer flow?
   - Long-term: is there appetite to add a platform `certification` resource type, so v2 can deprecate our custom classes?
   - Any objection to linking `UserCredential.userId` / `OrgCredential.orgId` as opaque platform UUIDs (rather than going through hydra.Resource link types)?

---

## Updated phasing (rolled back into the backlog item)

**Pre-schema (parallelizable, ~1-2 hrs total):**
- Inventory Framework catalog (Kevin/prod MCP)
- Draft issuer-Vendor submissions (~20 suggestions)
- Draft framework-addition Task payloads for `cerFmkR1` (for missing ecosystems)

**Schema PR (1-2 hrs + platform reload):**
- 3 classes: `Certification`, `UserCredential`, `OrgCredential`
- Dataloader verify
- PR to `zerobias-org/schema:dev`

**Parallel while schema deploys (3-4 hrs):**
- XLSX → PipelineWrite seed script (for Certification records)
- TypeScript client models
- Fire the Vendor suggestions + Framework extension Tasks

**Post-deploy v1:**
- UI (profile picker + buyer filter + admin moderation tab) — deferrable, can be partial

**Outstanding decisions** (need Clark input to finalize):

1. **3 classes (my recommendation) vs 1 polymorphic `SubjectCredential`?** I vote 3 for GQL idiom clarity; either works.
2. **Do I send the Kevin ping now to unblock framework inventory?** Short ask; probably unblocks everything.
3. **Should we prepare the platform-side `certification` resource-type proposal** as a companion ticket for Kevin to shepherd — so v2 absorption has a target?
