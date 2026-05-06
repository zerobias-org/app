---
phase: 28
plan: 01
subsystem: onboarding
tags: [constants, types, models]
type: infrastructure-wave-0
status: complete
duration: 0h45m
completed_date: 2026-04-30
key_files:
  - created: src/app/onboarding/company-info-sections.ts
  - created: src/app/onboarding/company-info.model.ts
commits:
  - hash: 081921f
    message: "feat(28-01): create company-info-sections.ts with 17 section constants + USER_FACING_SECTIONS array"
  - hash: 318801b
    message: "feat(28-01): create company-info.model.ts with 4 TypeScript types"
requirements_delivered:
  - CP-01
---

# Phase 28 Plan 01: Constants & Model Summary

**Wave 0 Infrastructure: Establish the contract between form component, marketplace-profile service, and MPI data model.**

## One-Liner

Define 17 section name constants and 4 TypeScript types (struct, record DTO, snapshot, dirty-fields) that all downstream Phase 28-31 components depend on.

## Deliverables

### 1. company-info-sections.ts (18 exports)

- **16 user-facing sections**: SECTION_LEGAL_NAME, SECTION_DBA, SECTION_LOGO_URL, SECTION_SHORT_BLURB, SECTION_LONG_DESCRIPTION, SECTION_PRIMARY_CONTACT_USER_ID, SECTION_PRIMARY_CONTACT_NAME, SECTION_PRIMARY_CONTACT_EMAIL, SECTION_WEBSITE, SECTION_HQ_LOCATION_STREET, SECTION_HQ_LOCATION_CITY, SECTION_HQ_LOCATION_STATE, SECTION_HQ_LOCATION_COUNTRY, SECTION_HQ_LOCATION_POSTAL_CODE, SECTION_YEARS_IN_BUSINESS, SECTION_EMPLOYEE_COUNT
- **1 system section**: SECTION_ONBOARDING_COMPLETE (written by Phase 28 save handler, read by Phase 27 routing guard)
- **1 convenience array**: USER_FACING_SECTIONS (const array for iteration)
- **All section names match COMPANY-INFO-CONVENTION.md exactly (case-sensitive)**

### 2. company-info.model.ts (4 exports)

#### CompanyInfoStruct
Form's data model (camelCase for TypeScript/binding convenience):
- `legalName` (required, string)
- `dba`, `logoUrl`, `shortBlurb`, `longDescription` (optional)
- `primaryContact?` { `userId?`, `name?`, `email?` }
- `website` (optional URL)
- `hqLocation?` { `street?`, `city?`, `state?`, `country?`, `postalCode?` }
- `yearsInBusiness?` (optional, number)
- `employeeCount?` (optional, one of '1-10', '11-50', '51-200', '201-500', '500+')

#### MarketplaceProfileItemRecord
MPI record DTO for Pipeline.receive (flat plain-string data, no JSON-encoded objects):
- `id` (deterministic: 'mpi-<orgId>-<section>')
- `orgId` (scalar, indexed)
- `section` (literal string from company-info-sections.ts)
- `data` (plain string, no JSON encoding)
- `status` ('active' | 'archived')

#### DirtyDiffSnapshot
Snapshot for dirty-field tracking:
- `original` (Partial<CompanyInfoStruct>) — original pre-fill state
- `current` (Partial<CompanyInfoStruct>) — current form state

#### DirtyFields
Helper type for section-to-value mapping during save:
- `Record<string, string | number | undefined>`

## Contract Integrity

✓ All 17 section names match COMPANY-INFO-CONVENTION.md exactly
✓ No JSON-encoded data field — flat sub-sections per convention
✓ Flat sub-sections use dot-notation strings (e.g., 'primary_contact.email')
✓ Form struct uses camelCase (legalName, not legal_name)
✓ MPI record uses snake_case in section field (per convention)
✓ Struct-shaped form binding mirrors MPI read projection (client-side grouping by section)
✓ TypeScript compiles with no errors (`tsc --noEmit`)

## Downstream Dependencies

**Immediately usable by:**
- Plan 02: MarketplaceProfileService (reads constants, uses struct + record types)
- Plan 03: Company-profile-form component (reads constants, binds struct)
- Plan 04: Routing (reads SECTION_ONBOARDING_COMPLETE constant)

**Contract boundary:**
- Form component imports `SECTION_*` constants for section name strings
- Service imports `CompanyInfoStruct`, `MarketplaceProfileItemRecord`, `DirtyDiffSnapshot`, `DirtyFields` for pre-fill/save logic
- Routing guard imports `SECTION_ONBOARDING_COMPLETE` to check for marker presence

## Deviations from Plan

None — plan executed exactly as written.

## Verification Passed

- ✓ 18 constants exported (17 sections + 1 convenience array)
- ✓ 4 TypeScript types exported (struct, record, snapshot, helper)
- ✓ All section name values match COMPANY-INFO-CONVENTION.md
- ✓ CompanyInfoStruct uses camelCase (legalName, not legal_name)
- ✓ MarketplaceProfileItemRecord has plain-string data field (no JSON)
- ✓ TypeScript compilation clean (`tsc --noEmit`)

## Next Steps

**Phase 28 Plan 02** (MarketplaceProfileService): Read both files, build the service adapter for pre-fill/save/skip logic.
