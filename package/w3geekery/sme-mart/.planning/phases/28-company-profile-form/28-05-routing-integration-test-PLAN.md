---
phase: 28-company-profile-form
plan: 05
type: execute
wave: 5
depends_on:
  - 28-02
  - 28-03
  - 28-04
files_modified:
  - src/app/onboarding/company-profile-form.component.spec.ts
  - .planning/phases/28-company-profile-form/28-VALIDATION.md
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
    
    Do NOT add a multi-line block comment summarizing CP-01..CP-08 to the spec file. The spec file's describe() block names + 28-VALIDATION.md's `## CP-08 Flow Coverage Map` (added by Task 2) are sufficient. Spec files should be free of essay-length narrative comments.

    A single one-line `// Phase 27 owns the guard; this test verifies the service signal only.` comment inside the new describe() block is acceptable.
  </action>
  <verify>
    <automated>npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' -t "getCompletionStatus" --watch=false --browsers=ChromeHeadless</automated>
  </verify>
  <done>Routing-integration test added (CP-07), Phase 27 assumption documented, completion status tested in isolation.</done>
</task>

<task type="auto">
  <name>Task 2: Append CP-08 Flow Coverage Map to 28-VALIDATION.md</name>
  <files>.planning/phases/28-company-profile-form/28-VALIDATION.md</files>
  <read_first>
    - .planning/phases/28-company-profile-form/28-VALIDATION.md
    - src/app/onboarding/company-profile-form.component.spec.ts (to read describe() block names)
    - src/app/core/services/marketplace-profile.service.spec.ts (to read describe() block names)
  </read_first>
  <action>
    Append a new section `## CP-08 Flow Coverage Map` to `.planning/phases/28-company-profile-form/28-VALIDATION.md` (place it just before `## Validation Sign-Off`). The four-flow narrative belongs in the validation artifact, NOT in the spec file. Spec files do not carry essay-length comments — describe() block names + the per-task verification map are sufficient on their own. (CP-08 only requires "all four flows are covered by *.spec.ts files"; the artifact itself is verified by the spec files passing, not by a comment.)

    Section to append verbatim:

    ```markdown
    ---

    ## CP-08 Flow Coverage Map

    Phase 28 covers the four CP-08 flows across two spec files. This map is the single source of truth — do NOT duplicate it inside spec files.

    | # | Flow | Owning describe() block | Spec file |
    |---|------|------------------------|-----------|
    | 1 | Pre-fill (MPI + org fallback + please-provide) | `describe('readProfileForOrg ...')` + `describe('pre-fill annotations (CP-03)')` | marketplace-profile.service.spec.ts + company-profile-form.component.spec.ts |
    | 2 | Save (dirty-diff + batched pushEntities + onboarding_complete marker) | `describe('save (CP-04, CP-05)')` | marketplace-profile.service.spec.ts |
    | 3 | Skip-for-now (router navigate, no write) | `describe('skip-for-now flow (CP-06)')` | company-profile-form.component.spec.ts |
    | 4 | Repeat-login-skip (completion status signal Phase 27 will consume) | `describe('routing integration (CP-07: repeat-login-skip)')` + `describe('getCompletionStatus (CP-07)')` | company-profile-form.component.spec.ts + marketplace-profile.service.spec.ts |

    Phase 27 owns the actual guard implementation that consumes `getCompletionStatus()` to decide routing. Phase 28 owns the signal contract + the unit tests that verify the signal returns the right boolean given input MPI records.
    ```
  </action>
  <verify>
    <automated>grep -q "## CP-08 Flow Coverage Map" .planning/phases/28-company-profile-form/28-VALIDATION.md && grep -q "Phase 27 owns the actual guard" .planning/phases/28-company-profile-form/28-VALIDATION.md</automated>
  </verify>
  <done>CP-08 Flow Coverage Map section added to 28-VALIDATION.md. No essay-length comment added to any spec file.</done>
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
