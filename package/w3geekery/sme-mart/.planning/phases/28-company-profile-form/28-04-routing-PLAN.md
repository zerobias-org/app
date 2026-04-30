---
phase: 28-company-profile-form
plan: 04
type: execute
wave: 2
depends_on:
  - 28-03
files_modified:
  - src/app/app.routes.ts
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "Route /onboarding/company-profile is registered in the routing tree"
    - "CompanyProfileFormComponent is loaded at that route"
    - "Route is wired under AppShell (authenticated context)"
  artifacts:
    - path: "src/app/app.routes.ts"
      provides: "Route registration for onboarding path"
      contains: ["onboarding", "company-profile", "CompanyProfileFormComponent"]
  key_links:
    - from: "app.routes.ts"
      to: "company-profile-form.component.ts"
      via: "route component assignment"
---

<objective>
Wire the CompanyProfileFormComponent into the application routing tree at `/onboarding/company-profile`. This is a lightweight routing task — the component is ready, just needs to be added to the route definition.

Purpose: Make the form accessible via the routing system; enables Phase 27 guard to direct first-time users to this route.
Output: Updated app.routes.ts with the onboarding route child.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/app.routes.ts
@src/app/onboarding/company-profile-form.component.ts
@.planning/phases/28-company-profile-form/28-RESEARCH.md (assumed phase 28 route definition)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add /onboarding route with company-profile child to app.routes.ts</name>
  <files>src/app/app.routes.ts</files>
  <read_first>
    - src/app/app.routes.ts
    - src/app/onboarding/company-profile-form.component.ts
    - .planning/phases/28-company-profile-form/28-RESEARCH.md
  </read_first>
  <action>
    Update `src/app/app.routes.ts` to add the onboarding route:
    
    In the AppShell children array, add:
    ```typescript
    {
      path: 'onboarding',
      // Phase 27 will add canActivate guard here: canActivate: [onboardingGuard],
      children: [
        { path: 'company-profile', component: CompanyProfileFormComponent },
      ],
    },
    ```
    
    Place this BEFORE the legacy redirects (before `{ path: 'engagements', redirectTo: 'rfps', ...}`).
    
    Do NOT add the Phase 27 guard here yet — Phase 27 hasn't been planned. Just the route structure.
    
    Import `CompanyProfileFormComponent` at the top of app.routes.ts.
  </action>
  <verify>
    <automated>grep -q "path: 'onboarding'" src/app/app.routes.ts && grep -q "path: 'company-profile'" src/app/app.routes.ts && grep -q "CompanyProfileFormComponent" src/app/app.routes.ts</automated>
  </verify>
  <done>Route added to app.routes.ts at /onboarding/company-profile, component wired, no guard yet (Phase 27 scope).</done>
</task>

</tasks>

<verification>
- [ ] `tsc --noEmit -p tsconfig.json` succeeds
- [ ] `npm run build` succeeds
- [ ] Route path `/onboarding/company-profile` is registered in routing tree
- [ ] CompanyProfileFormComponent is imported and assigned to the route
- [ ] No guard added (Phase 27 responsibility)
</verification>

<success_criteria>
- app.routes.ts updated with /onboarding path and company-profile child route
- Component import added
- No TypeScript errors
- Ready for Phase 27 to add the auth/routing guard
</success_criteria>

<output>
After completion, create `.planning/phases/28-company-profile-form/28-04-SUMMARY.md`
</output>
