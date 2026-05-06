---
phase: 28-company-profile-form
plan: 04
subsystem: onboarding
tags: [routing, configuration]
type: routing
status: complete
duration: 8m
completed_date: 2026-04-30
key_files:
  - modified: src/app/app.routes.ts
commits:
  - hash: b9e78bb
    message: "feat(28-04): add /onboarding/company-profile route to app.routes.ts"
requirements_delivered:
  - CP-06
---

# Phase 28 Plan 04: Routing Integration Summary

**Wave 4 Routing Layer: Register the company profile form component at /onboarding/company-profile.**

## One-Liner

Added the `/onboarding` route with `company-profile` child to app.routes.ts, wiring CompanyProfileFormComponent into the authenticated routing tree under AppShell.

## Deliverables

### 1. Route Registration (src/app/app.routes.ts)

**Import added:**
```typescript
import { CompanyProfileFormComponent } from './onboarding/company-profile-form.component';
```

**Route structure added (before legacy redirects):**
```typescript
{
  path: 'onboarding',
  children: [
    { path: 'company-profile', component: CompanyProfileFormComponent },
  ],
},
```

**Placement:** Route inserted at line 40-45, immediately before the "Legacy redirects" comment, ensuring it's evaluated before catch-all redirects.

**Route context:** Component mounted under AppShell (authenticated context). Route `/onboarding/company-profile` is now accessible as `/onboarding/company-profile` from the app shell's perspective (full URL: `https://uat.zerobias.com/sme-mart/onboarding/company-profile`).

## Contract Integrity

✓ Route `/onboarding/company-profile` is registered in the routing tree
✓ CompanyProfileFormComponent is imported and assigned to the route
✓ Route is wired under AppShell (authenticated context)
✓ No guard added yet (Phase 27 responsibility)
✓ Route placed before legacy redirects to avoid priority issues
✓ Component export matches import statement
✓ TypeScript compilation passes (`tsc --noEmit` clean)
✓ Build succeeds (`npm run build` without errors)
✓ Route syntax matches existing conventions in app.routes.ts

## Verification

✓ grep finds 'onboarding' path in app.routes.ts
✓ grep finds 'company-profile' path in app.routes.ts
✓ grep finds CompanyProfileFormComponent import in app.routes.ts
✓ `tsc --noEmit -p tsconfig.json` — 0 errors
✓ `npm run build` — success (dist generated, warnings are pre-existing)
✓ Commit hash: b9e78bb

## Testing

No unit tests needed for routing registration (task type: auto, minimal logic).

Phase 05 (routing-integration-test) will cover:
- E2E routing decisions (Phase 27 guard stub → form component)
- Skip flow testing (form component → /projects navigation)
- Repeat-login-skip testing (onboarding_complete marker present → bypass form)

## Downstream Integration

**Phase 27 (Auth Gate + Onboarding Routing + Lazy Guard):**
- Will add `canActivate: [onboardingGuard]` to this route
- Guard will check `onboarding_complete` marker and route accordingly
- Route structure is now ready to accept the guard

**Phase 05 (Routing Integration Test):**
- Will test that Phase 27 guard routes first-time users to this component
- Will verify skip flow from form component to /projects
- Will test onboarding_complete marker presence skips the form on repeat logins

## Deviations from Plan

**None — plan executed exactly as written.**

All requirements met:
1. ✓ Route `/onboarding/company-profile` registered
2. ✓ CompanyProfileFormComponent imported and assigned
3. ✓ Route under AppShell (authenticated context)
4. ✓ No guard added (Phase 27 responsibility)
5. ✓ TypeScript compilation clean
6. ✓ Build succeeds

## Self-Check

**Files modified:**
- ✓ `src/app/app.routes.ts` (16 → 23 lines in children array; net +7 lines)

**Commits verified:**
- ✓ b9e78bb — feat(28-04): add /onboarding/company-profile route to app.routes.ts

**Build state:**
- ✓ `tsc --noEmit -p tsconfig.json` — no errors
- ✓ `npm run build` — success, output: dist/

**Requirements delivered:**
- ✓ CP-06: Skip-for-now route destination (/projects) is available; Phase 30 owns the skip destination; Phase 04 only wires the form route

---

*Phase: 28-company-profile-form | Plan: 04 | Wave: 4 Routing Layer*
*Completed: 2026-04-30 14:17 UTC | Duration: 8m | Commits: 1*
