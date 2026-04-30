---
phase: 28-company-profile-form
plan: 05
type: execute
wave: 3
depends_on:
  - 28-02
  - 28-03
  - 28-04
files_modified:
  - src/app/onboarding/company-profile-form.component.spec.ts
autonomous: true
requirements:
  - CP-07
  - CP-08
user_setup: []

must_haves:
  truths:
    - "If onboarding_complete marker is present in GQL response, form skips (Phase 27 owns the routing decision)"
    - "Service.getCompletionStatus() correctly identifies marker presence"
    - "Test documents assumption: Phase 27 will use this signal to decide routing"
    - "All four flows (pre-fill, save, skip, repeat-login-skip) are covered by unit tests"
  artifacts:
    - path: "src/app/onboarding/company-profile-form.component.spec.ts"
      provides: "Routing integration test (CP-07) + flow coverage (CP-08)"
      contains: ["completion", "repeat-login", "routing"]
  key_links:
    - from: "company-profile-form.component.spec.ts"
      to: "marketplace-profile.service.spec.ts"
      via: "getCompletionStatus() test coverage"
---

<objective>
Add routing-integration test for CP-07 (repeat-login-skip flow) to CompanyProfileFormComponent.spec.ts. This test verifies that if the onboarding_complete marker is present, the form is skipped (Phase 27 guard will make the actual routing decision, but Phase 28 tests the service signal). Also add final CP-08 documentation confirming all four flows are covered.

Purpose: Close Phase 28 test coverage for CP-07 and CP-08; document the Phase 27 integration assumption.
Output: Updated spec file with routing-integration test + CP-08 flow documentation.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/onboarding/company-profile-form.component.spec.ts
@src/app/core/services/marketplace-profile.service.spec.ts
@.planning/phases/28-company-profile-form/28-VALIDATION.md (CP-07, CP-08 descriptions)
@.planning/phases/28-company-profile-form/28-RESEARCH.md (Phase 27 guard assumption)
@.planning/director/phase-27-brief.md (Phase 27 routing contract)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add routing-integration test for CP-07 (repeat-login-skip via completion status)</name>
  <files>src/app/onboarding/company-profile-form.component.spec.ts</files>
  <read_first>
    - src/app/onboarding/company-profile-form.component.spec.ts
    - .planning/phases/28-company-profile-form/28-VALIDATION.md (CP-07 test description)
    - .planning/phases/28-company-profile-form/28-RESEARCH.md (Phase 27 guard stub assumption)
  </read_first>
  <action>
    Add to `src/app/onboarding/company-profile-form.component.spec.ts`:
    
    **New describe block:**
    ```typescript
    describe('routing integration (CP-07: repeat-login-skip)', () => {
      it('getCompletionStatus returns true if onboarding_complete marker exists', async () => {
        // This test documents the assumption: Phase 27 will call marketplaceProfile.getCompletionStatus()
        // to decide routing. If true, route to /projects. If false, route to /onboarding/company-profile.
        //
        // Phase 28 does NOT test the actual Phase 27 guard (not built yet).
        // Phase 28 ONLY tests that the service correctly signals completion status.
        
        const mockGqlRead = {
          query: vi.fn().mockResolvedValue({
            items: [
              { section: 'onboarding_complete', status: 'active', data: '2026-04-30' },
              // ... other sections may be present ...
            ],
            page: { pageNumber: 1, pageSize: 50, totalCount: 17 },
          }),
        };
        
        const service = new MarketplaceProfileService(mockGqlRead as any, mockClientApi as any);
        
        const isComplete = await service.getCompletionStatus(testOrgId);
        
        expect(isComplete).toBe(true);
        expect(mockGqlRead.query).toHaveBeenCalledWith(
          'MarketplaceProfileItem',
          expect.arrayContaining(['section', 'data', 'status']),
          expect.objectContaining({
            filters: { orgId: `.eq.${testOrgId}` },
          }),
        );
      });
      
      it('getCompletionStatus returns false if onboarding_complete marker absent', async () => {
        const mockGqlRead = {
          query: vi.fn().mockResolvedValue({
            items: [
              { section: 'legal_name', status: 'active', data: 'Acme Inc' },
              // ... no onboarding_complete record ...
            ],
            page: { pageNumber: 1, pageSize: 50, totalCount: 16 },
          }),
        };
        
        const service = new MarketplaceProfileService(mockGqlRead as any, mockClientApi as any);
        
        const isComplete = await service.getCompletionStatus(testOrgId);
        
        expect(isComplete).toBe(false);
      });
      
      // NOTE: Actual Phase 27 guard testing (if Phase 27 creates a guard) deferred to Phase 27.
      // This comment documents the contract: the guard will use getCompletionStatus() to decide routing.
    });
    ```
    
    **Comment block documenting Phase 27 assumption (at top of file or in a separate note):**
    ```typescript
    /**
     * PHASE 28 TEST SCOPE: Company Profile Form
     * 
     * Phase 28 owns:
     * - CP-01: Form renders all 16 sections ✅
     * - CP-02: Pre-fill from MPI + org fallback ✅
     * - CP-03: "please provide" hints for empty fields ✅
     * - CP-04: Save writes only dirty fields ✅
     * - CP-05: onboarding_complete marker written on save ✅
     * - CP-06: Skip-for-now routes to /projects ✅
     * - CP-07: Completion status signal (Phase 27 guard uses this to route) ✅
     * - CP-08: All four flows covered (pre-fill, save, skip, repeat-login-skip) ✅
     * 
     * Phase 27 OWNS:
     * - Auth gate (redirect to /login if not authenticated)
     * - Routing decision based on completion status
     * - Guard implementation that uses marketplaceProfile.getCompletionStatus()
     * 
     * PHASE 28 / PHASE 27 INTEGRATION:
     * Phase 28 test stubs Phase 27's routing decision for CP-07.
     * Once Phase 27 is built, a manual or E2E test can verify the full flow:
     * user logs in → completion status checked → routed to /onboarding/company-profile or /projects
     */
    ```
  </action>
  <verify>
    <automated>npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' -t "getCompletionStatus" --watch=false --browsers=ChromeHeadless</automated>
  </verify>
  <done>Routing-integration test added (CP-07), Phase 27 assumption documented, completion status tested in isolation.</done>
</task>

<task type="auto">
  <name>Task 2: Add CP-08 flow coverage documentation to test file</name>
  <files>src/app/onboarding/company-profile-form.component.spec.ts</files>
  <read_first>
    - src/app/onboarding/company-profile-form.component.spec.ts
    - src/app/core/services/marketplace-profile.service.spec.ts
    - .planning/phases/28-company-profile-form/28-VALIDATION.md (CP-08 definition)
  </read_first>
  <action>
    Add to the top of `src/app/onboarding/company-profile-form.component.spec.ts` (after import statements):
    
    ```typescript
    /**
     * CP-08: All Four Flows Covered
     * 
     * Phase 28 unit tests cover the following flows:
     * 
     * 1. PRE-FILL FLOW (CP-02, tested in marketplace-profile.service.spec.ts)
     *    - User loads form for the first time
     *    - Service queries GQL for MPI records + org fallbacks
     *    - Form binds struct-shaped CompanyInfoStruct
     *    - Pre-fill is rendered with "(pre-filled from platform)" annotation
     *    - User can edit pre-filled values
     * 
     * 2. SAVE FLOW (CP-04, CP-05, tested in marketplace-profile.service.spec.ts + this file)
     *    - User edits some fields
     *    - User clicks Save
     *    - Form validates
     *    - Service computes dirty-diff against original snapshot
     *    - Service batches dirty records + onboarding_complete marker
     *    - Pipeline.receive ingests batch (or pushEntity called N+1 times)
     *    - On success: snackbar "Profile saved!", navigate to /projects
     *    - On error: snackbar with error message, offer retry
     *    - Org-fallback pre-fills (legal_name, logo_url) NOT written if unchanged
     * 
     * 3. SKIP-FOR-NOW FLOW (CP-06, tested in this file)
     *    - User clicks Skip for Now
     *    - Router navigates to /projects immediately
     *    - Service.save() is NOT called
     *    - onboarding_complete marker is NOT written
     *    - Subsequent login will route back to /onboarding/company-profile (Phase 27 reads marker)
     * 
     * 4. REPEAT-LOGIN-SKIP FLOW (CP-07, tested in this file + marketplace-profile.service.spec.ts)
     *    - User completes form and saves (or skips)
     *    - onboarding_complete marker written (or not)
     *    - User navigates away, logs out
     *    - User logs back in
     *    - Phase 27 guard queries completion status
     *    - If complete: routes to /projects (skips /onboarding/company-profile)
     *    - If incomplete: routes to /onboarding/company-profile (form shown again)
     * 
     * TEST COVERAGE:
     * - Flow 1: marketplace-profile.service.spec.ts describe('readProfileForOrg')
     * - Flow 2: marketplace-profile.service.spec.ts describe('save') + company-profile-form.component.spec.ts (user interaction)
     * - Flow 3: company-profile-form.component.spec.ts describe('skip-for-now flow')
     * - Flow 4: company-profile-form.component.spec.ts describe('routing integration') + marketplace-profile.service.spec.ts describe('getCompletionStatus')
     */
    ```
  </action>
  <verify>
    <automated>grep -q "CP-08" src/app/onboarding/company-profile-form.component.spec.ts && grep -q "Four Flows" src/app/onboarding/company-profile-form.component.spec.ts</automated>
  </verify>
  <done>CP-08 flow documentation added, all four flows listed with test-file references.</done>
</task>

</tasks>

<verification>
- [ ] `npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' --watch=false --browsers=ChromeHeadless` passes (all tests including new routing-integration test)
- [ ] `npm test -- --include='src/app/core/services/marketplace-profile.service.spec.ts' --watch=false --browsers=ChromeHeadless` passes (pre-fill, save, completion tests)
- [ ] Routing-integration test for CP-07 verifies getCompletionStatus() returns correct boolean
- [ ] CP-08 documentation lists all four flows and test-file locations
- [ ] Phase 27 integration assumption documented (guard will use getCompletionStatus to route)
</verification>

<success_criteria>
- Routing-integration test added for CP-07 (completion status check)
- CP-08 flow documentation in test file with references to all four flows
- Phase 27 assumption documented (not a test failure point, just a note for future phases)
- All Phase 28 unit tests passing (CP-01 through CP-08)
- Ready for Phase 27 to wire the guard and Phase 30 to build the landing page
</success_criteria>

<output>
After completion, create `.planning/phases/28-company-profile-form/28-05-SUMMARY.md`
</output>
