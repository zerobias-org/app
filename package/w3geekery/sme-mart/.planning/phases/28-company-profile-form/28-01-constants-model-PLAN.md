---
phase: 28-company-profile-form
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/onboarding/company-info-sections.ts
  - src/app/onboarding/company-info.model.ts
autonomous: true
requirements:
  - CP-01
user_setup: []

must_haves:
  truths:
    - "All 17 section names from COMPANY-INFO-CONVENTION.md are exported as constants"
    - "Form model struct matches the 17 sections with proper TypeScript typing"
    - "Flat sub-sections (primary_contact.email, hq_location.city) resolve to dot-notation strings"
  artifacts:
    - path: "src/app/onboarding/company-info-sections.ts"
      provides: "17 exported constants for section names"
      exports: ["SECTION_LEGAL_NAME", "SECTION_DBA", "SECTION_LOGO_URL", "SECTION_SHORT_BLURB", "SECTION_LONG_DESCRIPTION", "SECTION_PRIMARY_CONTACT_USER_ID", "SECTION_PRIMARY_CONTACT_NAME", "SECTION_PRIMARY_CONTACT_EMAIL", "SECTION_WEBSITE", "SECTION_HQ_LOCATION_STREET", "SECTION_HQ_LOCATION_CITY", "SECTION_HQ_LOCATION_STATE", "SECTION_HQ_LOCATION_COUNTRY", "SECTION_HQ_LOCATION_POSTAL_CODE", "SECTION_YEARS_IN_BUSINESS", "SECTION_EMPLOYEE_COUNT", "SECTION_ONBOARDING_COMPLETE"]
    - path: "src/app/onboarding/company-info.model.ts"
      provides: "CompanyInfoStruct interface + dirty-diff helper types"
      exports: ["CompanyInfoStruct", "DirtyDiffSnapshot", "DirtyFields"]
  key_links:
    - from: "company-info-sections.ts"
      to: "company-profile-form.component.ts"
      via: "constant imports for form layout"
    - from: "company-info-sections.ts"
      to: "marketplace-profile.service.ts"
      via: "constant section names for MPI record mapping"
    - from: "company-info.model.ts"
      to: "marketplace-profile.service.ts"
      via: "struct typing for pre-fill/save operations"
---

<objective>
Define the constants and TypeScript models for Phase 28's company-profile form. This is Wave 0 infrastructure: section names, validation rules, and form struct types that all downstream components depend on.

Purpose: Establish the contract between the form component, the marketplace-profile service, and the MPI data model.
Output: Two files, zero dependencies, immediately usable by Plans 02-05.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/28-company-profile-form/28-CONTEXT.md
@.planning/phases/28-company-profile-form/28-RESEARCH.md
@.planning/director/COMPANY-INFO-CONVENTION.md
@./CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create company-info-sections.ts constants module</name>
  <files>src/app/onboarding/company-info-sections.ts</files>
  <read_first>
    - .planning/director/COMPANY-INFO-CONVENTION.md
    - .planning/phases/28-company-profile-form/28-CONTEXT.md
    - ./CLAUDE.md (Angular 21 patterns: no suffix for constants modules)
  </read_first>
  <action>
    Create `src/app/onboarding/company-info-sections.ts` exporting 17 constants (16 user-facing + 1 system-only):
    
    ```typescript
    export const SECTION_LEGAL_NAME = 'legal_name';
    export const SECTION_DBA = 'dba';
    export const SECTION_LOGO_URL = 'logo_url';
    export const SECTION_SHORT_BLURB = 'short_blurb';
    export const SECTION_LONG_DESCRIPTION = 'long_description';
    export const SECTION_PRIMARY_CONTACT_USER_ID = 'primary_contact.user_id';
    export const SECTION_PRIMARY_CONTACT_NAME = 'primary_contact.name';
    export const SECTION_PRIMARY_CONTACT_EMAIL = 'primary_contact.email';
    export const SECTION_WEBSITE = 'website';
    export const SECTION_HQ_LOCATION_STREET = 'hq_location.street';
    export const SECTION_HQ_LOCATION_CITY = 'hq_location.city';
    export const SECTION_HQ_LOCATION_STATE = 'hq_location.state';
    export const SECTION_HQ_LOCATION_COUNTRY = 'hq_location.country';
    export const SECTION_HQ_LOCATION_POSTAL_CODE = 'hq_location.postal_code';
    export const SECTION_YEARS_IN_BUSINESS = 'years_in_business';
    export const SECTION_EMPLOYEE_COUNT = 'employee_count';
    
    // System section — written by Phase 28 save handler, read by Phase 27 routing guard
    export const SECTION_ONBOARDING_COMPLETE = 'onboarding_complete';
    
    // Convenience array for iteration
    export const USER_FACING_SECTIONS = [
      SECTION_LEGAL_NAME,
      SECTION_DBA,
      SECTION_LOGO_URL,
      SECTION_SHORT_BLURB,
      SECTION_LONG_DESCRIPTION,
      SECTION_PRIMARY_CONTACT_USER_ID,
      SECTION_PRIMARY_CONTACT_NAME,
      SECTION_PRIMARY_CONTACT_EMAIL,
      SECTION_WEBSITE,
      SECTION_HQ_LOCATION_STREET,
      SECTION_HQ_LOCATION_CITY,
      SECTION_HQ_LOCATION_STATE,
      SECTION_HQ_LOCATION_COUNTRY,
      SECTION_HQ_LOCATION_POSTAL_CODE,
      SECTION_YEARS_IN_BUSINESS,
      SECTION_EMPLOYEE_COUNT,
    ] as const;
    ```
    
    Per CLAUDE.md, constants modules do NOT use the `.service` suffix. File name is bare `company-info-sections.ts`.
  </action>
  <verify>
    <automated>grep -c "^export const SECTION_" src/app/onboarding/company-info-sections.ts | grep -q "^18$"</automated>
  </verify>
  <done>File exists, 18 constants exported (16 user-facing + 1 onboarding-complete + 1 array convenience), all section names match COMPANY-INFO-CONVENTION.md exactly.</done>
</task>

<task type="auto">
  <name>Task 2: Create company-info.model.ts TypeScript types for form struct and dirty-diff</name>
  <files>src/app/onboarding/company-info.model.ts</files>
  <read_first>
    - .planning/director/COMPANY-INFO-CONVENTION.md (validation rules per field)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (Reactive FormGroup + nested FormGroups pattern)
    - src/app/onboarding/company-info-sections.ts (just created; import section constants)
  </read_first>
  <action>
    Create `src/app/onboarding/company-info.model.ts` with three primary exports:
    
    **1. `CompanyInfoStruct`** — the form's data model (struct-shaped, mirrors form bindings):
    ```typescript
    export interface CompanyInfoStruct {
      legalName: string;           // required
      dba?: string;                // optional
      logoUrl?: string;            // optional, URL
      shortBlurb?: string;         // optional, ≤ 500 chars
      longDescription?: string;    // optional, ≤ 5000 chars
      primaryContact?: {
        userId?: string;           // UUID
        name?: string;
        email?: string;            // RFC5322
      };
      website?: string;            // optional, URL
      hqLocation?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      };
      yearsInBusiness?: number;    // optional, integer ≥ 0
      employeeCount?: string;      // optional, one of: '1-10', '11-50', '51-200', '201-500', '500+'
    }
    ```
    
    **2. `MarketplaceProfileItemRecord`** — the MPI record DTO for Pipeline.receive:
    ```typescript
    export interface MarketplaceProfileItemRecord {
      id: string;                  // deterministic: 'mpi-<orgId>-<section>'
      orgId: string;
      section: string;             // from company-info-sections.ts
      data: string;                // always plain string
      status: 'active' | 'archived'; // typically 'active'
    }
    ```
    
    **3. `DirtyDiffSnapshot`** — snapshot for dirty-field tracking:
    ```typescript
    export interface DirtyDiffSnapshot {
      original: Partial<CompanyInfoStruct>;
      current: Partial<CompanyInfoStruct>;
    }
    ```
    
    **4. Helper type `DirtyFields`** for save:
    ```typescript
    export type DirtyFields = Record<string, string | number | undefined>;
    ```
    
    Do NOT use JSON-encoded `data` — all MPI records have plain-string `data` fields (flat sub-sections, per COMPANY-INFO-CONVENTION.md).
  </action>
  <verify>
    <automated>grep -E "^export (interface|type) " src/app/onboarding/company-info.model.ts | wc -l | grep -q "^4$"</automated>
  </verify>
  <done>File exists, 4 types exported (CompanyInfoStruct, MarketplaceProfileItemRecord, DirtyDiffSnapshot, DirtyFields), no JSON-encoded data field pattern.</done>
</task>

</tasks>

<verification>
- [ ] `tsc --noEmit -p tsconfig.json` succeeds with no errors
- [ ] `src/app/onboarding/company-info-sections.ts` has 18 exports (16 sections + onboarding-complete + USER_FACING_SECTIONS array)
- [ ] `src/app/onboarding/company-info.model.ts` has 4 exports (CompanyInfoStruct, MarketplaceProfileItemRecord, DirtyDiffSnapshot, DirtyFields)
- [ ] All section name constants match COMPANY-INFO-CONVENTION.md exactly (case-sensitive)
- [ ] CompanyInfoStruct uses camelCase field names (legalName not legal_name)
- [ ] No constructor injection, no decorators, no @Input/@Output (constants-only file)
</verification>

<success_criteria>
- Constants file: 18 constants, all section names matching canonical convention
- Model file: 4 TypeScript types, no JSON-encoded data field, struct-shaped interface for form binding
- No Neon/SmeMartDbService dependencies (pure TypeScript types, no services)
- Ready for Plan 02 (MarketplaceProfileService) to import and use
</success_criteria>

<output>
After completion, create `.planning/phases/28-company-profile-form/28-01-SUMMARY.md`
</output>
