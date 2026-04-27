# Plan 090 — Seller Credentials Catalog

## Overview

This plan executes Phases 1–3 of the Seller Credentials Catalog feature (backlog item #090), delivering a complete end-to-end schema + seed data foundation for compliance/cybersecurity credential tracking in SME Mart. Sellers multi-select credentials (CMMC CCA, CISSP, FedRAMP 3PAO, etc.) on their profile; Buyers filter/search Sellers by credentials. The primary objective per Clark is **schema + data landing in the platform** — UI work defers or ships partial. The feature leverages a curated external catalog (130 certs, 19 sources, frozen as XLSX), absorbs it into platform-native entities where possible (Vendors as Issuers, Frameworks), and extends with 3 new GQL classes for the credential link + metadata layer.

**Research docs (read first):**
- [`.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md`](../../.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md) — Phase A codebase audit, data model decision, open questions
- [`.planning/research/internal/2026-04-23-credentials-zb-platform-research.md`](../../.planning/research/internal/2026-04-23-credentials-zb-platform-research.md) — ZB platform exploration: Vendor catalog, Framework catalog (257 items), recommended 3-GQL-class schema, framework-gap list

**Backlog:** [`.planning/BACKLOG.md`](../../.planning/BACKLOG.md) row #090

---

## Constraints & Context

1. **Absorption directive** (memory `project_sme_mart_absorbed_into_platform.md`): prefer platform entities (Vendor, Framework, Role) over custom classes. Only the link + metadata layer (Certification, UserCredential, OrgCredential) is custom.

2. **DataProducer writes broken** (memory `project_dataproducer_write_broken.md`): new entities requiring write paths MUST be GQL classes written via `PipelineWriteService`, NOT Neon tables. Legacy expertise tables (`ProviderSkill`, etc.) use direct Neon writes — that pattern is dead for new work.

3. **Schema workflow** (memory `feedback_schema_repo_workflow.md`):
   - Fork from `upstream/dev` (not main)
   - PR against `zerobias-org/schema:dev` (not main)
   - Dataloader verification required before merge (`npm run verify` → `.dataloader-validated` marker)
   - ~15 min platform reload after merge before classes are queryable

4. **Portal curl fallback** ([`.claude/docs/ZB_PORTAL_CURL_FALLBACK.md`](../docs/ZB_PORTAL_CURL_FALLBACK.md)): ZB MCP does not expose `portal.*` operations. Use curl to query `/api/portal/frameworkSearch` to inventory the ~257 frameworks on the platform.

5. **Deterministic class IDs** (memory `project_gql_class_ids_deterministic.md`): class IDs are UUID v5 from YAML content — same across prod/UAT/CI once merged. Pipeline IDs are per-environment.

6. **Framework tasks filed**: 5 `cerFmkR1` tasks on w3geekery org, SME Marketplace DEV boundary (assigned to Clark) for missing frameworks:
   - `cerFmkR1-1` HITRUST CSF
   - `cerFmkR1-2` DoD 8140.3 / DCWF 612
   - `cerFmkR1-3` CSA STAR Registry
   - `cerFmkR1-4` SCA CODE
   - `cerFmkR1-5` UK Cyber Essentials / Cyber Essentials Plus

   Seed script should handle empty `frameworkIds: []` for certs whose frameworks are not yet in the catalog.

---

## What's Already Done

1. **Research complete** — both research docs above finalized 2026-04-23.
2. **5 cerFmkR1 Tasks filed** — moderation in progress; SME Mart owns seed-catalog short-term, Content migrates v2+.
3. **Backlog row #090** added with full scope breakdown.
4. **Curl fallback documented** for portal API access (Clark authorized, narrow exception).
5. **Vendor repo inspection** — 9 existing vendors (aicpa, csa, dhs, dod, eclipsefoundation, iec, isaca, nist, pci_ssc); ~12-15 new vendors needed (verify in 1.2 — ISACA and NIST already exist; `pci_ssc` has legacy underscore code).

---

## Phase 1 — Vendor PR

**Goal:** Add missing issuer vendors to `zerobias-org/vendor` so the Certification catalog can link `issuerVendorId` to platform Vendor records.

**Candidate vendors** (from research doc "Still need PRs" — note ISACA already exists per MCP search; verify via ls before drafting):

1. **CAICO** — CyberAB Assessor & Instructor Certification Organization (CMMC individual certs)
2. **Cyber AB** — Accreditation body for CMMC ecosystem (org-level: C3PAO, RPO)
3. **(ISC)²** — CISSP, CCSP, CGRC, SSCP, CC, CSSLP
4. **CompTIA** — Security+, CySA+, PenTest+, SecurityX, A+, Network+, Cloud+
5. **GIAC** — SANS GIAC certifications (~62 total)
6. **Offensive Security** — OSCP, OSEP, OSWE, OSED, OSEE, OSCE3
7. **EC-Council** — CEH, CCISO, CHFI, CND
8. **Mile2** — CISSO, CPTE, CDFE
9. **IAPP** — CIPP variants, CIPM, CIPT, AIGP, FIP
10. **HITRUST Alliance** — CCSFP, CHQP
11. **CREST** — CPSA, CRT, CCT, CRIA, CRIS
12. **SCF Council** — SCF Practitioner, SCF Architect, SCF Assessor
13. **SAICO** — SCA Practitioner, SCA Architect
14. **FITSI** — FITSP-A/M/D/O
15. **A2LA** — FedRAMP 3PAO accreditor
16. **ANSI** — Accreditation body for IAPP etc.
17. **IRCA** — ISO Lead Auditor certification

Cross-reference against existing `package/` directory in 1.2 before committing.

**Vendor code regex:** `^[a-z0-9]+$` — lowercase alphanumeric ONLY, no hyphens/underscores/dots (new rule per commit `43acaa21`).

### 1.1 Pre-flight

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor
git status
git fetch upstream
git checkout -b feat/credentials-issuers-phase1 upstream/dev
```

Verify current branch is based on `upstream/dev` not `main`.

### 1.2 Vendor list verification

Cross-reference the candidates against existing `package/` directory. Run:

```bash
for code in caico cyberab isc2 comptia giac offsec eccouncil mile2 iapp hitrust crest scf saico fitsi a2la ansi irca; do
  if [ -d "package/$code" ]; then
    echo "EXISTS: $code"
  else
    echo "MISSING: $code"
  fi
done
```

For any reported as EXISTS, inspect `package/{code}/index.yml` to confirm it's the correct vendor (not a tech vendor with a matching name). Update the final PR list to exclude already-present vendors.

**Proposed vendor metadata** (to be filled into `index.yml` for each missing vendor):

| Code | Name | URL | Description |
|---|---|---|---|
| caico | CAICO | https://cyberab.org/CMMC-Ecosystem/CAICO.html | CyberAB Assessor & Instructor Certification Organization |
| cyberab | Cyber AB | https://cyberab.org/ | Accreditation body for CMMC ecosystem |
| isc2 | (ISC)² | https://www.isc2.org/ | International Information System Security Certification Consortium |
| comptia | CompTIA | https://www.comptia.org/ | Computing Technology Industry Association — IT certifications |
| giac | GIAC | https://www.giac.org/ | Global Information Assurance Certification — SANS Institute |
| offsec | Offensive Security | https://www.offsec.com/ | Penetration testing and offensive security certifications |
| eccouncil | EC-Council | https://www.eccouncil.org/ | International Council of E-Commerce Consultants |
| mile2 | Mile2 | https://mile2.com/ | IT security training and certification |
| iapp | IAPP | https://iapp.org/ | International Association of Privacy Professionals |
| hitrust | HITRUST Alliance | https://hitrustalliance.net/ | Health Information Trust Alliance — HITRUST CSF |
| crest | CREST | https://www.crest-approved.org/ | Council of Registered Ethical Security Testers |
| scf | SCF Council | https://securecontrolsframework.com/ | Secure Controls Framework Council |
| saico | SAICO | https://cyberab.org/SCA-Ecosystem/ | Secure Assurance & Integrity Certification Organization |
| fitsi | FITSI | https://www.fitsi.org/ | Federal IT Security Institute |
| a2la | A2LA | https://a2la.org/ | American Association for Laboratory Accreditation (FedRAMP 3PAO accreditor) |
| ansi | ANSI | https://www.ansi.org/ | American National Standards Institute |
| irca | IRCA | https://www.quality.org/ | International Register of Certificated Auditors (ISO Lead Auditor) |

### 1.3 Logo sourcing — research & strategy

**Challenge:** How do logos get into `cdn.auditmation.io/logos/{code}.svg`?

**Investigation steps:**
1. Inspect an existing vendor's `logo.svg` file — is it committed to the repo, or referenced only by URL?
   ```bash
   file ~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor/package/aicpa/logo.svg
   ls -la ~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor/package/aicpa/
   ```
2. Check `.github/workflows/` for a logo-upload CI job.
3. Check `CONTRIBUTING.md` or skills dir (`.claude/skills/create-vendor.md`) for documented process.

**Likely outcome (Option B per template):** logos are committed locally as `logo.svg` or `logo.png` in each vendor package; CI publishes / CDN uploads are separate.

**Fallback if logos unavailable:**
- Source from vendor's official site (about page, press kit, brand assets)
- If not available, commit a simple placeholder SVG with vendor initials
- Note in PR description that logos may need refreshing post-merge

**Action:** Resolve logo strategy BEFORE Phase 1 commit. If manual CDN upload is required (Option A), flag to Clark and ask who manages the CDN bucket.

### 1.4 Per-vendor creation — templated steps

For each missing vendor:

**1.4.1 Copy template**

```bash
cp -r templates/ package/{code}
```

**1.4.2 Populate `index.yml`** — use existing aicpa as reference:

```yaml
code: {code}
name: {name}
description: {description}
url: {url}
status: active
type: vendor
ownerId: 00000000-0000-0000-0000-000000000000
created: 2026-04-24T00:00:00.000Z
updated: 2026-04-24T00:00:00.000Z
logo: https://cdn.auditmation.io/logos/{code}.svg
imageUrl: https://cdn.auditmation.io/logos/{code}.svg
aliases: []
tags: []
```

**Note:** Do NOT pre-assign a UUID `id` — the dataloader assigns these deterministically on merge.

**1.4.3 Populate `package.json`** — copy from template, substitute `{code}` and `{name}`:

```json
{
  "name": "@zerobias-org/vendor-{code}",
  "version": "1.0.0-rc.1",
  "description": "{name}",
  "author": "team@zerobias.com",
  "license": "ISC",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git@github.com:zerobias-org/vendor.git",
    "directory": "package/{code}/"
  },
  "scripts": {
    "correct:deps": "tsx ../../scripts/correctDeps.ts",
    "validate": "tsx ../../scripts/validate.ts"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  },
  "files": [
    "index.yml",
    "logo.*"
  ],
  "zerobias": {
    "dataloader-version": "1.0.0",
    "import-artifact": "vendor",
    "package": "{code}"
  }
}
```

**1.4.4 Add logo file** — `logo.svg` (preferred) or `logo.png` in `package/{code}/`

**1.4.5 Commit per vendor** — conventional commits:

```bash
git add package/{code}/
git commit -m "feat(vendor-{code}): add {name} vendor"
```

Repeat for each of the ~15 vendors.

### 1.5 Validation

After all vendors are committed locally:

```bash
npm run validate
```

Expected: all packages pass. Fix any errors (YAML format, code regex, missing fields) before pushing.

### 1.6 PR creation

```bash
git push -u origin feat/credentials-issuers-phase1

gh pr create \
  --repo zerobias-org/vendor \
  --base dev \
  --head w3geekery:feat/credentials-issuers-phase1 \
  --title "feat: add credential issuer vendors for SME Mart credentials catalog" \
  --body "$(cat <<'EOF'
## Summary

Add credential issuer vendors to support SME Mart Seller Credentials Catalog (backlog item #090).

These vendors will host compliance/cybersecurity certifications that Sellers on SME Mart can claim. The Certification GQL class (in a separate zerobias-org/schema PR) will reference these via `issuerVendorId`.

### Vendors added

- CAICO (CyberAB Assessor & Instructor Certification Organization)
- Cyber AB (CMMC ecosystem accreditation body)
- (ISC)² — CISSP, CCSP, CGRC, SSCP, CC, CSSLP
- CompTIA — Security+, CySA+, PenTest+, SecurityX, etc.
- GIAC — SANS Institute (GSEC, GCIH, GPEN, 62+ certs)
- Offensive Security — OSCP, OSEP, OSWE, OSED, OSEE, OSCE3
- EC-Council — CEH, CCISO, CHFI, CND
- Mile2 — CISSO, CPTE, CDFE
- IAPP — CIPP, CIPM, CIPT, AIGP, FIP
- HITRUST Alliance — CCSFP, CHQP (HITRUST CSF framework)
- CREST — CPSA, CRT, CCT, CRIA, CRIS
- SCF Council — SCF Practitioner, SCF Architect, SCF Assessor
- SAICO — SCA Practitioner, SCA Architect
- FITSI — FITSP-A/M/D/O
- A2LA — FedRAMP 3PAO accreditor (ISO/IEC 17020)
- ANSI — ISO/IEC 17024 accreditation
- IRCA — ISO Lead Auditor certification

Each vendor follows standard package structure: `index.yml`, `package.json`, `logo.svg`, `CHANGELOG.md` (auto-generated by Lerna).

All vendor codes comply with `^[a-z0-9]+$` (new rule per commit `43acaa21`).

Validation: `npm run validate` passed on all packages.

Relates to: SME Mart backlog item #090 (Seller Credentials Catalog)

Session: claude --resume gsd-plan
EOF
)"
```

### 1.7 Acceptance criteria

Phase 1 is **complete** when:
1. PR is merged into `zerobias-org/vendor:dev`
2. All vendor packages are present in the dev branch
3. `npm run validate` passes for all new vendors
4. Vendor codes (for use in Phase 3 cross-map) are noted

**Blockers to watch:**
- Logo sourcing delays (1-2 hrs if manual sourcing required)
- Template structure differs from expectations (inspect aicpa first)
- Validate script failures → fix and re-commit

---

## Phase 2 — Schema PR

**Goal:** Define 3 new GQL classes in `zerobias-org/schema` for the credential link + metadata layer. These classes link to platform entities (Vendor as Issuer, Framework, Role) via opaque UUID foreign keys (no schema-level `linkTo`, since those entities are platform-native and not schema classes).

### 2.1 Pre-flight

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema
git status
git fetch upstream
git checkout -b feat/credentials-catalog upstream/dev
```

Inspect existing SME Mart classes for YAML conventions:

```bash
ls package/w3geekery/smemart/classes/
cat package/w3geekery/smemart/classes/Review.yml  # reference template
cat package/w3geekery/smemart/classes/Engagement.yml  # reference for linkTo patterns
```

### 2.2 Class YAML drafts

**File 1:** `package/w3geekery/smemart/classes/Certification.yml`

```yaml
description: "Curated credential catalog entry. Links to platform Vendor (issuer), Framework(s), and Role(s). Carries issue/expiry metadata, scope (individual/org/product), and moderation state. Used by SME Mart Seller Credentials feature to let Sellers claim certifications and Buyers filter by them."
extends:
  - Object
properties:
  - code:
      field: certification.code
      # Namespaced identifier, e.g. "CMMC.CCA", "ISC2.CISSP", "8140-612.CISA"
  - issuerVendorId:
      field: certification.issuerVendorId
      # UUID of platform Vendor (CAICO, ISACA, ISC², etc.)
      # Nullable if issuer not yet in Vendor catalog (will be backfilled)
  - frameworkIds:
      field: certification.frameworkIds
      # Array of platform Framework UUIDs (CMMC, FedRAMP, ISO 27001, etc.)
      # Empty array OK while frameworks are pending moderation (cerFmkR1 tasks)
  - qualifiesForRoleIds:
      field: certification.qualifiesForRoleIds
      # Array of platform Role UUIDs (Assessor, Auditor, Architect, etc.)
      # Forward direction: holding this cert qualifies the holder for these roles
      # Empty in v1; populated in v1.1
  - scope:
      field: certification.scope
      # Enum: "individual" | "org" | "product"
  - proficiency:
      field: certification.proficiency
      # Optional enum: "foundational" | "intermediate" | "advanced"
  - ecosystemCode:
      field: certification.ecosystemCode
      # Free-form organizing identifier (e.g., "CMMC", "SCF", "FedRAMP")
      # Stopgap for ecosystems lacking a Framework catalog entry
  - sourceUrl:
      field: certification.sourceUrl
      # URL to authoritative source or cyberab.org snapshot
  - sourceSnapshotDate:
      field: certification.sourceSnapshotDate
      # ISO date for external source staleness tracking
  - status:
      field: certification.status
      # Enum: "curated" (seed) | "submitted" (user-proposed) | "rejected"
  - submittedByUserId:
      field: certification.submittedByUserId
      # UUID of platform User who submitted (nullable for curated certs)
viewProperties:
  Code:
    jsonata: code
    sort: code
  Name:
    jsonata: name
    sort: name
  Scope:
    jsonata: scope
    sort: scope
  Ecosystem:
    jsonata: ecosystemCode
    sort: ecosystemCode
  Status:
    jsonata: status
    sort: status
```

**File 2:** `package/w3geekery/smemart/classes/UserCredential.yml`

```yaml
description: "Individual user holds a credential. Links a platform User to an SME Mart Certification with issue/expiry dates, verification status, and credential number. Used by Seller profile to claim individual-scope certifications (CISSP, CCA, OSCP, etc.)."
extends:
  - Object
properties:
  - userId:
      field: userCredential.userId
      # UUID of platform User (opaque link; no schema-level linkTo)
  - certificationId:
      field: userCredential.certificationId
      # UUID of SME Mart Certification
  - issuedAt:
      field: userCredential.issuedAt
      # ISO date when credential was issued (nullable)
  - expiresAt:
      field: userCredential.expiresAt
      # ISO date when credential expires (nullable if no expiry)
  - verified:
      field: userCredential.verified
      # Boolean: has credential been verified
  - verificationSource:
      field: userCredential.verificationSource
      # e.g. "cyber-ab-marketplace-api", "isaca-registry", "manual", nullable
  - credentialNumber:
      field: userCredential.credentialNumber
      # Cert serial number / ID from issuer (nullable)
  - notes:
      field: userCredential.notes
      # Free text: user notes or verification context
viewProperties:
  User:
    jsonata: userId
    sort: userId
  Credential:
    jsonata: certificationId
    sort: certificationId
  Verified:
    jsonata: verified
    sort: verified
  Expires:
    jsonata: expiresAt
    sort: expiresAt
```

**File 3:** `package/w3geekery/smemart/classes/OrgCredential.yml`

```yaml
description: "Organization holds a credential (org-scope certs like C3PAO authorization, FedRAMP authorization, SOC 2). Links a platform Org to an SME Mart Certification with dates and verification. Used by Seller company profiles to claim org-level certifications."
extends:
  - Object
properties:
  - orgId:
      field: orgCredential.orgId
      # UUID of platform Org (opaque link)
  - certificationId:
      field: orgCredential.certificationId
      # UUID of SME Mart Certification
  - issuedAt:
      field: orgCredential.issuedAt
  - expiresAt:
      field: orgCredential.expiresAt
  - verified:
      field: orgCredential.verified
  - verificationSource:
      field: orgCredential.verificationSource
  - credentialNumber:
      field: orgCredential.credentialNumber
  - notes:
      field: orgCredential.notes
viewProperties:
  Org:
    jsonata: orgId
    sort: orgId
  Credential:
    jsonata: certificationId
    sort: certificationId
  Verified:
    jsonata: verified
    sort: verified
  Expires:
    jsonata: expiresAt
    sort: expiresAt
```

### 2.3 Dataloader validation

Per memory `feedback_schema_dataloader_validation.md`, NEVER commit schema changes without running dataloader first.

**Steps:**

1. **Set up scratch database** (per `.claude/notes/zb-graphql-custom-schema-howto.md` section 6):
   ```bash
   # Uses Supabase PG17 on port 15432
   npx @zerobias-org/util-content-dev-schema
   ```

2. **Run dataloader verification:**
   ```bash
   cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/sme-mart
   npm run verify
   ```

   Expected: `0 errors` for new classes. Note the dataloader version from output (e.g., `Dataloader 1.0.71`).

3. **Create marker file** (required by commit hook):
   ```bash
   touch package/w3geekery/sme-mart/.dataloader-validated
   ```

   Marker must be < 30 min old when commit is made (per hook rule).

**If verify fails:** Fix YAML (check indentation, missing fields, duplicate codes). Re-run until clean. Marker must be regenerated after any YAML change — cherry-picks, rebases, or amends invalidate prior validation (incident 2026-04-06).

### 2.4 PR

```bash
git add package/w3geekery/smemart/classes/Certification.yml
git add package/w3geekery/smemart/classes/UserCredential.yml
git add package/w3geekery/smemart/classes/OrgCredential.yml
git add package/w3geekery/sme-mart/.dataloader-validated

git commit -m "feat(schema): add Certification, UserCredential, OrgCredential classes

Three new GQL classes to support SME Mart Seller Credentials Catalog
(backlog item #090):

- Certification: curated catalog master linking to platform Vendor,
  Framework(s), and Role(s) via opaque UUID foreign keys
- UserCredential: individual user → certification link with dates,
  verification, credential number
- OrgCredential: organization → certification link with same fields

Dataloader 1.0.71 — passed, exit code 0.

Session: claude --resume gsd-plan"

git push -u origin feat/credentials-catalog

gh pr create \
  --repo zerobias-org/schema \
  --base dev \
  --head w3geekery:feat/credentials-catalog \
  --title "feat: add credential catalog classes (Certification, UserCredential, OrgCredential)" \
  --body "$(cat <<'EOF'
## Summary

Add 3 new GQL classes to support SME Mart Seller Credentials Catalog (backlog item #090).

### Classes

1. **Certification** — Curated credential catalog entry. Links to platform Vendor (issuer), Framework(s), and Role(s). Metadata: issue/expiry dates, scope (individual/org/product), ecosystemCode (fallback), status (curated/submitted/rejected), sourceSnapshotDate for staleness tracking.

2. **UserCredential** — Individual user holds a credential. Links User → Certification with issuedAt, expiresAt, verified, verificationSource, credentialNumber, notes.

3. **OrgCredential** — Organization holds an org-scope credential (C3PAO, FedRAMP auth, SOC 2). Same fields as UserCredential.

### Design notes

- **All cross-references are opaque UUIDs** pointing at platform entities (issuerVendorId → Vendor, frameworkIds[] → Framework[], qualifiesForRoleIds[] → Role[]). No schema-level `linkTo` — those are platform-native entities, not schema classes, so the cross-package linkTo doesn't apply.
- **Moderation-ready**: Certification.status = "submitted" allows Sellers to propose custom credentials pending admin review (future UI).
- **frameworkIds[] is empty-friendly** — certs can be seeded before their Framework records exist (5 pending cerFmkR1 tasks: HITRUST, 8140.3, CSA STAR, SCA CODE, Cyber Essentials). Phase 3 seed script handles empty arrays.
- **UserCredential and OrgCredential are split** (not polymorphic) to keep GQL filter queries clean: "find users with CCA" vs "find orgs with C3PAO" stay distinct and type-safe.
- **ecosystemCode** is a stopgap free-form field for ecosystems not yet in Framework catalog; removable post v1.1 once Framework catalog catches up.

### Dataloader verification

Dataloader 1.0.71 — passed, exit code 0.
Marker file: `.dataloader-validated` ✓

Relates to: SME Mart backlog item #090

Session: claude --resume gsd-plan
EOF
)"
```

### 2.5 Post-merge acceptance

Once PR is merged to `zerobias-org/schema:dev`:

1. **Wait ~15 minutes** for platform schema reload.
2. **Verify classes appear** via a GQL query or via schema inspection tool.
3. **Note the class IDs** — UUID v5 derived deterministically from YAML content. Extract and add as constants to `src/app/core/services/pipeline-write.service.ts`:
   ```typescript
   export const SME_MART_CLASS_IDS = {
     // ...existing entries
     Certification: "<uuid-from-platform>",
     UserCredential: "<uuid-from-platform>",
     OrgCredential: "<uuid-from-platform>",
   };
   ```

**Phase 2 complete** when 3 classes are queryable on the platform.

---

## Phase 3 — Seed Script

**Goal:** Consume the frozen XLSX seed data and write ~130 `Certification` records into the platform via `PipelineWriteService`. This involves:
1. Cross-mapping XLSX issuers → platform Vendor IDs (post-Phase 1)
2. Cross-mapping XLSX ecosystems → platform Framework IDs (existing 257 + 5 pending)
3. Writing Certification objects via PipelineWrite
4. (UserCredential / OrgCredential records come later with Seller UI)

### 3.1 Cross-map generation

**Input:** `~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx`

**XLSX structure** (frozen snapshot, validated 2026-04-23):
- Sheet "Roles" (58 entries): role names, codes, descriptions
- Sheet "Certifications" (126 entries): cert name, code, issuer, ecosystem, scope, proficiency, description, source URL
- Sheet "RoleCertifications" (33 entries): role ↔ cert mappings
- Sheet "Issuers" (19 entries): issuer names
- Sheet "References" (sources): source URLs, dates

**Script file:** `scripts/generate-credentials-crossmap.ts` (new, in SME Mart app)

**Responsibilities:**

1. **Query platform Vendor catalog** (via MCP):
   ```typescript
   // Via zerobias-sdk — requires valid API key/org ID from env
   const vendors = await platformClient.getVendorApi().listVendors(1, 500);
   const vendorMap = new Map<string, string>(); // lowercase name → UUID
   vendors.items.forEach(v => {
     vendorMap.set(v.code.toLowerCase(), v.id);
     vendorMap.set(v.name.toLowerCase(), v.id);
   });
   ```

2. **Query platform Framework catalog** via curl (per `ZB_PORTAL_CURL_FALLBACK.md`):
   ```bash
   # Script shells out to curl, parses JSON array response
   curl -s -X POST "$base/api/portal/frameworkSearch?pageSize=500" \
     -H "Authorization: APIKey $apikey" \
     -H "Dana-Org-Id: $orgid" \
     -H "Content-Type: application/json" \
     -d '{}' > /tmp/frameworks.json
   ```

   Build frameworkMap: `{code: uuid, name: uuid}` keyed lowercase.

3. **Load XLSX** using `exceljs` (already a pattern — check existing import scripts):
   ```typescript
   import ExcelJS from 'exceljs';
   const workbook = new ExcelJS.Workbook();
   await workbook.xlsx.readFile(xlsxPath);
   const certSheet = workbook.getWorksheet('Certifications');
   // Iterate rows; extract name, code, issuer, ecosystem, scope, proficiency, sourceUrl
   ```

4. **Match XLSX issuers → Vendor IDs:**
   - Primary: exact match `issuer` name → vendorMap lookup (normalize: lowercase, strip parens/punctuation)
   - Fallback: fuzzy match (Levenshtein distance < 3) for minor variations
   - Explicit aliases: `"ISC²" → "isc2"`, `"EC-Council" → "eccouncil"`, `"(ISC)²" → "isc2"`
   - On no match: set `issuerVendorId: null`, add flag `issuer_unmatched` with original name

5. **Match XLSX ecosystems → Framework IDs:**
   - Primary match against frameworkMap
   - Known aliases:
     - `"CMMC"` → `dod_cmmc_v2_0`
     - `"FedRAMP"` → `gsa_fedramp_rev4`
     - `"ISO 27001"` → `iso_27001_2022_scf`
     - `"SOC 2"` → `aicpa_soc2_2022`
     - `"NIST CSF"` → `nist_csf_v2`
     - `"HIPAA"` → `us_hipaa_v2_scf`
     - `"PCI DSS"` → `pci-ssc_dss_v4.0.1_scf`
   - Known-missing (pending cerFmkR1): `"HITRUST"`, `"DoD 8140.3"`, `"CSA STAR"`, `"SCA"`, `"Cyber Essentials"` — set `frameworkIds: []` + flag `framework_pending_cerFmkR1_{code}`
   - Multiple frameworks per cert allowed — e.g., CISSP could link to NIST CSF, ISO 27001, SOC 2 via `frameworkIds: [uuid1, uuid2, uuid3]`

6. **Output: `scripts/crossmap.json`** (committed for reproducibility):
   ```json
   {
     "generatedAt": "2026-04-24T00:00:00Z",
     "vendorCount": 450,
     "frameworkCount": 257,
     "certifications": [
       {
         "xlsxCode": "CMMC.CCA",
         "xlsxName": "Certified CMMC Assessor",
         "xlsxIssuer": "CAICO",
         "issuerVendorId": "uuid-caico",
         "xlsxEcosystem": "CMMC",
         "ecosystemCode": "CMMC",
         "frameworkIds": ["uuid-cmmc-v2"],
         "qualifiesForRoleIds": [],
         "scope": "individual",
         "proficiency": null,
         "sourceUrl": "https://cyberab.org/...",
         "sourceSnapshotDate": "2025-09-01",
         "status": "curated",
         "flags": []
       },
       {
         "xlsxCode": "HITRUST.CCSFP",
         "xlsxName": "Certified CSF Practitioner",
         "xlsxIssuer": "HITRUST Alliance",
         "issuerVendorId": "uuid-hitrust",
         "xlsxEcosystem": "HITRUST",
         "ecosystemCode": "HITRUST",
         "frameworkIds": [],
         "scope": "individual",
         "proficiency": null,
         "sourceUrl": "https://hitrustalliance.net/...",
         "sourceSnapshotDate": "2025-09-01",
         "status": "curated",
         "flags": ["framework_pending_cerFmkR1_hitrust"]
       }
     ],
     "unmatched": {
       "issuers": [],
       "frameworks": ["HITRUST", "DoD 8140.3", "CSA STAR", "SCA", "Cyber Essentials"]
     }
   }
   ```

**Invocation:**
```bash
cd ~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart
npx ts-node scripts/generate-credentials-crossmap.ts \
  --xlsx ~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx \
  --output scripts/crossmap.json
```

**Commit `scripts/crossmap.json`** for reproducibility (can be regenerated anytime with updated platform catalog).

### 3.2 Seed runner

**Script file:** `scripts/seed-credentials-catalog.ts`

**Responsibilities:**

1. Load `scripts/crossmap.json`
2. Load SME Mart class IDs from `pipeline-write.service.ts` constants (post Phase 2)
3. Query existing Certifications via GQL to deduplicate by `code`:
   ```typescript
   // Use GraphqlReadService pattern
   const existing = await graphqlRead.query({
     classId: SME_MART_CLASS_IDS.Certification,
     filter: { codeIn: crossmap.certifications.map(c => c.xlsxCode) },
     pageSize: 500
   });
   const existingCodes = new Set(existing.map(c => c.code));
   ```
4. Build Certification objects for non-existing certs:
   ```typescript
   const newCerts = crossmap.certifications
     .filter(c => !existingCodes.has(c.xlsxCode))
     .map(c => ({
       name: c.xlsxName,
       code: c.xlsxCode,
       issuerVendorId: c.issuerVendorId,
       frameworkIds: c.frameworkIds,
       qualifiesForRoleIds: c.qualifiesForRoleIds,
       scope: c.scope,
       proficiency: c.proficiency,
       ecosystemCode: c.ecosystemCode,
       sourceUrl: c.sourceUrl,
       sourceSnapshotDate: c.sourceSnapshotDate,
       status: c.status,
       submittedByUserId: null
     }));
   ```
5. Batch-write via PipelineWriteService (follow Phase-5 migration pattern):
   ```typescript
   const batches = chunk(newCerts, 50); // 50 per batch
   for (const batch of batches) {
     await pipelineWrite.writeBatch({
       classId: SME_MART_CLASS_IDS.Certification,
       items: batch
     });
     console.log(`Wrote ${batch.length} certifications`);
   }
   ```
6. Error handling:
   - On 5xx: retry 3× with exponential backoff
   - On 4xx: log and skip that batch; continue
   - Partial-failure aggregated summary at the end
7. Dry-run mode: log what would be written without calling PipelineWrite

**Invocation:**
```bash
# Dry run
npx ts-node scripts/seed-credentials-catalog.ts --dry-run

# Real run
npx ts-node scripts/seed-credentials-catalog.ts --confirm
```

Add npm script alias in `package.json`:
```json
{
  "scripts": {
    "seed:credentials": "ts-node scripts/seed-credentials-catalog.ts",
    "seed:credentials:crossmap": "ts-node scripts/generate-credentials-crossmap.ts --xlsx ~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx --output scripts/crossmap.json"
  }
}
```

### 3.3 Execution

**Prerequisites:**
- Phase 1 merged (Vendors available)
- Phase 2 merged + 15-min reload elapsed (Certification class available)
- `.env.local` has valid credentials
- `scripts/crossmap.json` generated (3.1)

**Steps:**

1. Regenerate cross-map to pick up latest platform vendors:
   ```bash
   npm run seed:credentials:crossmap
   ```
2. Review `crossmap.json`:
   - Check `unmatched.issuers` — should be empty or minimal
   - Check `unmatched.frameworks` — expect 5 pending (HITRUST etc.)
   - Spot-check 5 random certs for correct mapping
3. Dry run:
   ```bash
   npm run seed:credentials -- --dry-run
   ```
   Verify: counts look right, no unexpected errors.
4. Real run:
   ```bash
   npm run seed:credentials -- --confirm
   ```
5. Verify via GQL query:
   ```typescript
   const certs = await graphqlRead.query({
     classId: SME_MART_CLASS_IDS.Certification,
     pageSize: 500
   });
   console.log(`Total: ${certs.length}`);  // expect ~130
   ```

### 3.4 Acceptance

Phase 3 is **complete** when:

1. `scripts/crossmap.json` is committed
2. `scripts/seed-credentials-catalog.ts` runs successfully (real mode)
3. Platform reports ~130 Certification records queryable via GQL
4. Spot-check 10 random certs:
   - name + code populated ✓
   - issuerVendorId points to valid Vendor ✓
   - frameworkIds populated where possible, empty for pending ✓
   - scope populated (individual | org | product) ✓
   - status = "curated" ✓
5. Unmatched issuers/frameworks documented for v1.1 follow-up

**Blockers to watch:**
- Vendor query returns 0 → Phase 1 merge stalled
- Framework query returns 0 → portal endpoint broken or creds expired
- PipelineWrite fails with "unknown class" → Phase 2 class IDs not yet propagated; wait for reload
- Batch size too large → chunk smaller (25 instead of 50)

---

## Phase 4 — UI (STUB — DEFERRED)

Deferred per Clark's direction: ship schema + data in v1.4; UI defers to v1.5.

**Components that would be touched when activated:**

1. **Seller Profile — Credentials Section**
   - File: `src/app/pages/my-profile/my-profile-expertise.component.ts` (extend as 7th section) OR new `my-profile-credentials.component.ts`
   - UI: reuse `ZbSimpleAutocompleteComponent` chip-picker pattern
   - Display chips with issuer + cert name; click expands to dates + verified badge

2. **Seller Profile — Submit Custom Credential**
   - New component: `src/app/shared/components/submit-credential-dialog/`
   - Form: name, issuer (Vendor dropdown), scope radio, sourceUrl
   - Submits Certification with `status: "submitted"` (admin moderation queue)

3. **Buyer Search — Credentials Filter Row**
   - File: `src/app/shared/components/catalog-filters/catalog-filters.component.ts`
   - Add 7th filter: multi-select Certification (hierarchical: Issuer → Cert, or flat)
   - Backend: filter SmeMartProvider via UserCredential / OrgCredential joins

4. **Admin Dashboard — Credentials Catalog Tab**
   - File: `src/app/pages/admin/admin-dashboard.component.ts`
   - Sub-tabs: Catalog (list), Moderation Queue (submitted certs), Issuers (Vendor management), Frameworks (pending cerFmkR1 status), Audit Log
   - Actions: CRUD on Certification, approve/reject submitted certs

5. **Expiry Warnings on Seller Profile**
   - Banner when `expiresAt < now + 30d`
   - Toast on login if expired credentials

6. **Data Layer Wiring**
   - File: `src/app/core/services/catalog.service.ts` — add `certifications` signal + loader

**Prerequisites blocking full UI:**

1. **Provider `type` field** (individual | company) — currently absent from `ProviderProfile`. Needed to honor `scope` enum correctly.
2. **UserProfile vs OrgProfile split** — Seller profile conflates user + org identity. Needs decoupling for full credentials UX.

**Estimate if activated:** 18–25 hrs (excluding prerequisites).

**v1.4 ships:** Schema + data landing only. Catalog is queryable via GQL but UI-less. v1.5 activates UI post-prerequisites.

---

## Risks & Open Questions

1. **Logo sourcing** (Phase 1.3) — if `cdn.auditmation.io` doesn't auto-upload from the repo, a manual upload step is needed. **Action:** verify during 1.3 before committing vendors.

2. **Cross-map coverage** (Phase 3.1) — XLSX issuer names may not match vendor codes cleanly. Fuzzy matching helps, explicit aliases table covers known cases; unmatched rows get flagged and seeded with `issuerVendorId: null`.

3. **Framework tasks landing late** (Phase 3.2) — 5 `cerFmkR1` tasks pending. Seed with empty `frameworkIds` is OK; v1.1 re-enrichment script can backfill.

4. **`qualifiesForRoleIds`** (Phase 2.2) — Role IDs not yet inventoried. Leaving empty in v1; populate in v1.1 once platform Role catalog is mapped.

5. **Auto-verification** — `verificationSource` field reserves the shape; no wiring in v1. v1.5+ when Seller UI can trigger flows (Cyber AB Marketplace API, ISACA cert registry).

6. **Provider-as-GQL-class** (Phase 4 blocker) — Kevin decision pending. Current design assumes opaque UUID link to platform User/Org. If Kevin wants a GQL Provider class, larger refactor triggered.

7. **PipelineWrite cost/throughput** — 130 records in batches of 50 = 3 batches. Should complete in < 1 min on UAT. Monitor during Phase 3 execution.

---

## Execution Order & Checkpoints

```
Phase 1 (Vendor PR)
  ↓ merge + wait
Phase 2 (Schema PR)
  ↓ merge + 15-min reload
Phase 3 (Seed Script)
  └─ Can re-run after Framework tasks land to enrich frameworkIds

Phase 4 (UI) — DEFERRED
  ├─ Blocks on: Provider type field, UserProfile/OrgProfile split
  └─ Can develop in parallel once prerequisites resolved
```

**Checkpoints:**
- ✅ After Phase 1 merge: vendor codes noted, update crossmap script aliases if needed
- ✅ After Phase 2 merge + 15 min: class IDs extracted, added to pipeline-write.service.ts
- ✅ After Phase 3 dry-run: review crossmap.json flags, address any pre-flight issues
- ✅ After Phase 3 real run: spot-check 10 certs, commit crossmap.json + scripts, update docs

---

## Rollback Strategy

**Phase 1 rollback:**
- Pre-merge: revert PR or close it.
- Post-merge: revert commit on dev. Other apps don't yet consume these vendors.

**Phase 2 rollback:**
- Pre-reload (within 15 min of merge): revert commit on dev.
- Post-reload: classes are live; reverting removes them from future loads but existing data unaffected (additive). Full cleanup requires Kevin (admin tool to drop class from AuditgraphDB).

**Phase 3 rollback:**
- Soft-delete via status update: write a script that sets `status: "deleted"` on all certs with `submittedByUserId: null` and `sourceSnapshotDate: "2026-04-23"`.
- Do NOT hard-delete (audit trail).

**Phase 4 rollback:**
- Feature-flag components.
- Revert component files and route registrations.

---

## Commit Sequence Summary

### Phase 1 — zerobias-org/vendor

| # | Message | Files |
|---|---|---|
| 1-N | `feat(vendor-{code}): add {name} vendor` | `package/{code}/{index.yml,package.json,logo.svg,CHANGELOG.md}` |

One commit per vendor. Estimated ~12-15 commits (depending on how many already exist after 1.2 verification).

### Phase 2 — zerobias-org/schema

| # | Message | Files |
|---|---|---|
| 1 | `feat(schema): add Certification, UserCredential, OrgCredential classes` | `package/w3geekery/smemart/classes/{Certification,UserCredential,OrgCredential}.yml` + `.dataloader-validated` |

Single commit (all 3 classes + marker).

### Phase 3 — SME Mart app (w3geekery fork)

| # | Message | Files |
|---|---|---|
| 1 | `feat(credentials): add cross-map and seed scripts` | `scripts/generate-credentials-crossmap.ts`, `scripts/seed-credentials-catalog.ts`, `package.json` (new npm scripts) |
| 2 | `chore(credentials): seed catalog cross-map reference` | `scripts/crossmap.json` |

Two commits: tooling + generated data snapshot.

---

## Key Dependencies & Assumptions

| Item | Status | Risk |
|---|---|---|
| Phase 1 vendor template structure | Likely confirmed (aicpa exists) | Low |
| Phase 2 schema w3geekery/smemart namespace exists | Confirmed via memory | Low |
| Dataloader 1.0.71 works | Assumed | Low |
| platform.Vendor.listVendors returns all issuers | Confirmed via MCP | Low |
| portal /api/portal/frameworkSearch accessible | Confirmed (curl recipe) | Low |
| Framework cerFmkR1 tasks land before Phase 3 | NOT assumed; OK if delayed | Medium |
| Provider type field for Phase 4 UI | NOT assumed | High (Phase 4 blocker) |
| PipelineWriteService works for our batch sizes | Assumed from Phase-5 pattern | Low |

---

## Effort Estimate

| Phase | Subtask | Hours |
|---|---|---|
| 1 | Pre-flight + verify existing vendors | 0.5 |
| 1 | Resolve logo sourcing strategy | 0.5-2 |
| 1 | Create ~12-15 vendor packages | 3 |
| 1 | Validate + commit + PR | 1 |
| **Phase 1 total** | | **5-7 hrs** |
| 2 | Class YAML drafting | 1.5 |
| 2 | Dataloader validation (incl. scratch DB) | 1 |
| 2 | PR + post-merge verification | 1 |
| **Phase 2 total** | | **3.5 hrs** |
| 3 | Cross-map script dev | 3 |
| 3 | Seed runner dev | 2 |
| 3 | Testing (dry-run + real) | 1 |
| 3 | Documentation | 0.5 |
| **Phase 3 total** | | **6.5 hrs** |
| **Phases 1–3** | | **~15-17 hrs** |
| Phase 4 (deferred) | UI components | 18-25 hrs |

---

## Critical Files for Implementation

**Templates / references to read first:**
- `~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor/package/aicpa/` — Vendor package reference
- `~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor/templates/` — Template dir (if present)
- `~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor/CLAUDE.md` — Vendor repo instructions
- `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/Review.yml` — Class YAML template
- `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/src/app/core/services/pipeline-write.service.ts` — PipelineWrite integration + class ID constants
- `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/src/app/core/services/graphql-read.service.ts` — GQL read pattern for dedup

**Inputs:**
- `~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx` — Frozen seed data
- `~/Projects/zb/ui/.claude/proposals/sme-mart-cyberab-catalog.md` — Narrative context

**New files created by this plan:**
- `~/Projects/w3geekery/zerobias-org-forks/zb-org-vendor/package/{code}/` × ~15 (Phase 1)
- `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/{Certification,UserCredential,OrgCredential}.yml` (Phase 2)
- `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/scripts/generate-credentials-crossmap.ts` (Phase 3)
- `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/scripts/seed-credentials-catalog.ts` (Phase 3)
- `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/scripts/crossmap.json` (Phase 3, committed output)

---

## Cross-links

- Research (Phase A audit): [`.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md`](../../.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md)
- Research (ZB platform): [`.planning/research/internal/2026-04-23-credentials-zb-platform-research.md`](../../.planning/research/internal/2026-04-23-credentials-zb-platform-research.md)
- Backlog row: [`.planning/BACKLOG.md`](../../.planning/BACKLOG.md) #090
- Curl recipe: [`.claude/docs/ZB_PORTAL_CURL_FALLBACK.md`](../docs/ZB_PORTAL_CURL_FALLBACK.md)
- cerFmkR1 tasks: codes `cerFmkR1-1` through `cerFmkR1-5` (on w3geekery org, SME Marketplace DEV boundary)

Session: `claude --resume gsd-plan`
