---
phase: 28-company-profile-form
plan: 02
type: execute
wave: 1
depends_on:
  - 28-01
files_modified:
  - src/app/core/services/marketplace-profile.service.ts
  - src/app/core/services/marketplace-profile.service.spec.ts
autonomous: true
requirements:
  - CP-02
  - CP-04
  - CP-05
  - CP-08
user_setup: []

must_haves:
  truths:
    - "Single GQL query on form mount returns all MPI records for currentOrgId, grouped by section client-side"
    - "Save writes only dirty fields as separate MPI records in one Pipeline.receive batch"
    - "onboarding_complete marker is auto-appended to every save batch with ISO date"
    - "Org-fallback pre-fills (legal_name from Org.name, logo_url from Org.avatarUrl) work correctly"
    - "Dirty-diff respects the intent: Org-fallback pre-fills are NOT written on save if user did not edit them"
  artifacts:
    - path: "src/app/core/services/marketplace-profile.service.ts"
      provides: "MarketplaceProfileService CRUD (read, save, getCompletionStatus)"
      exports: ["MarketplaceProfileService"]
    - path: "src/app/core/services/marketplace-profile.service.spec.ts"
      provides: "Unit tests for pre-fill, save, skip, repeat-login flows"
      exports: ["(test suite)"]
  key_links:
    - from: "marketplace-profile.service.ts"
      to: "graphql-read.service.ts"
      via: "query() for MPI record reads"
    - from: "marketplace-profile.service.ts"
      to: "pipeline-write.service.ts"
      via: "pushEntity() calls or direct SDK batch"
    - from: "marketplace-profile.service.ts"
      to: "company-info-sections.ts + company-info.model.ts"
      via: "section constant imports + type usage"
---

<objective>
Build the MarketplaceProfileService adapter that translates between form struct ↔ MPI record array. This service owns the pre-fill logic (one GQL query, group by section, apply org fallbacks), the save logic (dirty-diff, record batching, onboarding-complete marker), and the completion-status check (for Phase 27 routing).

Purpose: Decouple form component from data-access details; reusable for Phase 30 "edit later" and other future consumers.
Output: Service + comprehensive unit tests covering CP-02, CP-04, CP-05, CP-08 flows.
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
@.planning/phases/28-company-profile-form/28-VALIDATION.md
@.planning/director/COMPANY-INFO-CONVENTION.md
@.planning/director/PLATFORM-DATA-INVENTORY.md
@src/app/core/services/graphql-read.service.ts
@src/app/core/services/pipeline-write.service.ts
@src/app/core/services/vendor-profile.service.ts (anti-pattern reference only)
@src/app/app.config.ts (auth/ZerobiasClientApp DI)
@./CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create MarketplaceProfileService with read (pre-fill) logic</name>
  <files>src/app/core/services/marketplace-profile.service.ts</files>
  <read_first>
    - src/app/core/services/graphql-read.service.ts
    - src/app/core/services/vendor-profile.service.ts (anti-pattern: JSON-encoded data, different sections)
    - .planning/director/COMPANY-INFO-CONVENTION.md
    - .planning/director/PLATFORM-DATA-INVENTORY.md (pre-fill sources)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (SDK calls, org-id resolution)
    - src/app/onboarding/company-info-sections.ts
    - src/app/onboarding/company-info.model.ts
  </read_first>
  <action>
    Create `src/app/core/services/marketplace-profile.service.ts` with three primary methods:
    
    **1. `readProfileForOrg(orgId: string): Promise<CompanyInfoStruct>`**
    
    One GQL query → group by section → project to struct:
    
    - Call `graphqlRead.query<MpiRecord>('MarketplaceProfileItem', ['id', 'section', 'data', 'status', 'expiresAt'], { filters: { orgId: `.eq.${orgId}` }, pageSize: 999 })`
    - Build a `Map<string, MpiRecord>` grouped by section
    - For each user-facing section from COMPANY_INFO_CONVENTION.md:
      - If section exists and status='active', use `record.data` as the pre-fill value
      - If absent, apply org-level fallback:
        - `legal_name`: call `danaOld.Org.getOrg(orgId).name`
        - `logo_url`: call `danaOld.Org.getOrg(orgId).avatarUrl`
        - All others: blank/undefined
    - Return struct-shaped CompanyInfoStruct
    
    **Org-fallback semantics (CRITICAL per 28-RESEARCH.md Gotcha 4):**
    - If MPI record exists for a section, use it (ignore org fallback)
    - If MPI record does NOT exist but org fallback available (legal_name, logo_url), use org fallback
    - Org fallback values are NOT written to MPI on save unless user explicitly edits them
    
    **Error handling:**
    - GQL error: catch, return snackbar message, throw (let caller handle retry)
    - Empty result (0 records): return struct with all org fallbacks for legal_name/logo_url, everything else blank
    - Undefined currentOrgId: throw with user-friendly message
    
    **2. `save(orgId: string, current: Partial<CompanyInfoStruct>, original: Partial<CompanyInfoStruct>): Promise<void>`**
    
    Dirty-diff → batch write:
    
    - Iterate over all USER_FACING_SECTIONS (16 sections)
    - For each section, resolve the struct field name and compare: current[field] !== original[field]
    - If dirty, build an MpiRecord: `{ id: \`mpi-${orgId}-${section}\`, orgId, section, data: String(current[field] || ''), status: 'active' }`
    - Special case: empty/undefined user input on empty pre-fill = not dirty (user didn't type anything)
    - Special case: Org-fallback pre-fill + no user edit = NOT dirty (don't write a new MPI to shadow the org field)
    - Append `{ id: \`mpi-${orgId}-onboarding_complete\`, orgId, section: 'onboarding_complete', data: new Date().toISOString().split('T')[0], status: 'active' }`
    - Call Pipeline.receive with the batch (Option B from 28-RESEARCH.md: `this.clientApi.platformClient.getPipelineApi().receive(PIPELINE_ID, { classId: MPI_CLASS_ID, tagIds: [], data: records }, false)`)
    
    **Dirty-diff detail:**
    - Snapshot the original state on form mount (caller passes it)
    - Compare field-by-field at save time
    - For primary_contact: if user_id changed, also consider name/email dirty (derived from selected user)
    - For nested fields (hq_location): compare sub-fields independently (one dirty sub-field = dirty hq_location.city, others may be clean)
    
    **3. `getCompletionStatus(orgId: string): Promise<boolean>`**
    
    Check if onboarding_complete marker exists:
    
    - Query GQL for MPI records with section=onboarding_complete
    - Return true if at least one record exists with status='active', false otherwise
    - Used by Phase 27 routing guard (CP-07) — Phase 28 tests this in isolation
    
    **Constructor + DI:**
    ```typescript
    constructor(
      private graphqlRead: GraphqlReadService,
      private clientApi: ZerobiasClientApi,
    ) {}
    ```
    
    Per Angular 21 patterns (CLAUDE.md), use `inject()` in callers, not constructor injection.
  </action>
  <verify>
    <automated>grep -E "^\s*(readProfileForOrg|save|getCompletionStatus)" src/app/core/services/marketplace-profile.service.ts | wc -l | grep -q "^3$"</automated>
  </verify>
  <done>Service file exists, three public methods defined (readProfileForOrg, save, getCompletionStatus), proper DI, no constructor injection, full org-fallback semantics encoded.</done>
</task>

<task type="auto">
  <name>Task 2: Write unit tests for MarketplaceProfileService (CP-02, CP-04, CP-05, CP-08)</name>
  <files>src/app/core/services/marketplace-profile.service.spec.ts</files>
  <read_first>
    - src/app/core/services/marketplace-profile.service.ts (just created)
    - .planning/phases/28-company-profile-form/28-VALIDATION.md (test map, per-task automated commands)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (mock setup, stubs, spies)
  </read_first>
  <action>
    Create `src/app/core/services/marketplace-profile.service.spec.ts` with four describe blocks:
    
    **1. describe('readProfileForOrg (CP-02, CP-03, CP-04 pre-fill leg)')**
    
    Three test cases:
    - `it('pre-fill from existing MPI records')` — GQL returns 5 MPI records for currentOrgId; form struct binds correctly
      - Mock graphqlRead.query() → return mocked MPI records (legal_name, dba, logo_url, website, years_in_business)
      - Call readProfileForOrg(testOrgId)
      - Assert struct has those values, no org fallbacks applied
    
    - `it('pre-fill with org fallback for legal_name + logo_url')` — GQL returns 3 records (dba, website, employee_count); legal_name + logo_url absent
      - Mock graphqlRead.query() → return 3 records
      - Mock danaOld.Org.getOrg() → return { name: 'Acme Inc', avatarUrl: 'https://...' }
      - Call readProfileForOrg(testOrgId)
      - Assert struct.legalName = 'Acme Inc' (org fallback), struct.logoUrl = 'https://...' (org fallback), other pre-fills from MPI
    
    - `it('pre-fill with please-provide for empty fields')` — GQL returns 0 records, org fallback also missing
      - Mock graphqlRead.query() → return empty array
      - Mock danaOld.Org.getOrg() → return minimal org { name: null, avatarUrl: null }
      - Call readProfileForOrg(testOrgId)
      - Assert all form fields are undefined/empty (caller will render "(please provide)" hints)
    
    **2. describe('save (CP-04, CP-05)')**
    
    Three test cases:
    - `it('save writes only dirty fields with correct record shape')` — user edits 3 fields
      - Set up original snapshot: { legalName: 'Acme', dba: '', website: '' }
      - Set up current state: { legalName: 'Acme Revised', dba: 'Acme LLC', website: 'https://acme.com' }
      - Mock pipeline.receive (or spy on clientApi.platformClient.getPipelineApi().receive())
      - Call save(testOrgId, current, original)
      - Assert exactly 4 calls to pushEntity (3 dirty + 1 onboarding_complete) OR one batch call with 4 records
      - Assert records have correct id format: `mpi-<orgId>-<section>`, section, data, status='active'
    
    - `it('save skips org-fallback pre-fills if user did not edit')` — legal_name came from Org.name, user did not edit
      - Set up original snapshot: { legalName: 'Acme' } (pre-filled from org fallback)
      - Set up current state: { legalName: 'Acme' } (unchanged)
      - Call save(testOrgId, current, original)
      - Assert NO record written for legal_name (Org.name remains authoritative)
      - Assert onboarding_complete record still written
    
    - `it('save includes onboarding_complete marker with ISO date')` — successful save
      - Call save(testOrgId, any current/original)
      - Assert batch includes record: { id: 'mpi-<orgId>-onboarding_complete', section: 'onboarding_complete', data: /^\d{4}-\d{2}-\d{2}$/, status: 'active' }
    
    **3. describe('getCompletionStatus (CP-07)')**
    
    Two test cases:
    - `it('returns true if onboarding_complete marker exists')` — GQL finds active onboarding_complete record
      - Mock graphqlRead.query() → return [{ section: 'onboarding_complete', status: 'active', ... }]
      - Call getCompletionStatus(testOrgId)
      - Assert result === true
    
    - `it('returns false if onboarding_complete marker absent')` — GQL returns empty or no matching record
      - Mock graphqlRead.query() → return []
      - Call getCompletionStatus(testOrgId)
      - Assert result === false
    
    **4. describe('dirty-diff edge cases (CP-08)')**
    
    Three test cases:
    - `it('treats empty pre-fill + empty user input as not dirty')` — user skips a field with no pre-fill
      - original.shortBlurb = undefined, current.shortBlurb = undefined
      - Assert no record written for short_blurb
    
    - `it('treats nested primary_contact.email as derived from selected user')` — user picks a member
      - original.primaryContact.email = undefined
      - current.primaryContact.userId = '<newUserId>'
      - current.primaryContact.email = auto-derived from member lookup
      - Assert email record is written (marked dirty by the userId change)
    
    - `it('handles empty/undefined vs empty string consistently')` — edge case
      - original.dba = '', current.dba = ''
      - Assert not dirty
    
    **Mock setup (from 28-RESEARCH.md):**
    ```typescript
    const mockGqlRead = {
      query: vi.fn().mockResolvedValue({
        items: [...],
        page: { pageNumber: 1, pageSize: 50, totalCount: N },
      }),
    };
    
    const mockClientApi = {
      platformClient: {
        getPipelineApi: () => ({
          receive: vi.fn().mockResolvedValue(void 0),
        }),
      },
      danaOld: {
        Org: {
          getOrg: vi.fn().mockResolvedValue({ name: '...', avatarUrl: '...' }),
        },
      },
    };
    ```
    
    Assertion example (CP-04):
    ```typescript
    expect(pipelineReceiveSpy).toHaveBeenCalledWith(
      PIPELINE_ID,
      expect.objectContaining({
        classId: MPI_CLASS_ID,
        tagIds: [],
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^mpi-[0-9a-f-]+-legal_name$/),
            section: 'legal_name',
            data: 'Acme Revised',
            status: 'active',
          }),
          // ... 3 more dirty + 1 onboarding_complete
        ]),
      }),
      false,
    );
    ```
  </action>
  <verify>
    <automated>npm test -- --include='src/app/core/services/marketplace-profile.service.spec.ts' --watch=false --browsers=ChromeHeadless</automated>
  </verify>
  <done>Test file exists, 10+ test cases covering CP-02, CP-04, CP-05, CP-07, CP-08, all passing (or ready to be fixed by implementing Plan 02 Task 1).</done>
</task>

</tasks>

<verification>
- [ ] `npm test -- --include='src/app/core/services/marketplace-profile.service.spec.ts' --watch=false --browsers=ChromeHeadless` passes
- [ ] `tsc --noEmit -p tsconfig.json` shows no type errors in marketplace-profile.service.ts
- [ ] readProfileForOrg returns CompanyInfoStruct with correct org-fallback semantics
- [ ] save method builds records with deterministic ids (mpi-<orgId>-<section>)
- [ ] onboarding_complete record always appended on save with ISO date
- [ ] Org-fallback pre-fills (legal_name, logo_url) NOT written on save if unchanged
- [ ] getCompletionStatus correctly identifies onboarding_complete marker
</verification>

<success_criteria>
- Service file: 3 public methods (readProfileForOrg, save, getCompletionStatus) with full implementation
- Test file: 10+ test cases covering all four flows (pre-fill with MPI, pre-fill with org fallback, save dirty-diff, completion status)
- All CP-02, CP-04, CP-05, CP-08 test scenarios from 28-VALIDATION.md covered
- No JSON-encoded data, no reuse of vendor-profile patterns
- Ready for Plan 03 (form component) to consume
</success_criteria>

<output>
After completion, create `.planning/phases/28-company-profile-form/28-02-SUMMARY.md`
</output>
