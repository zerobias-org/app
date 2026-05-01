# Phase 27: Auth Gate + Onboarding Routing + Lazy-on-Load Default-Engagement Guard — Research

**Researched:** 2026-04-30
**Domain:** Angular 21 auth/routing, ZeroBias SDK integration, lazy-load engagement bootstrap, idempotency patterns
**Confidence:** HIGH for SDK patterns; MEDIUM for cross-file TS references (empirical gaps); HIGH for architecture and patterns

## Summary

Phase 27 wires SME Mart to the W3Geekery-branded ZB platform auth flow. The phase owns session detection (redirecting unauthenticated users to a branded login page), a lazy-on-load guard that ensures every authenticated Org has a default ZeroBias Engagement (bootstrapping it via 5 inline SDK calls if missing), and routing decisions based on admin status and onboarding-complete marker.

The guard runs at most once per Org's lifetime, uses failure-resumable idempotency checks to avoid duplicates on retry, and surfaces user-friendly errors. All technical pieces exist: the 5-call recipe is validated on W3Geekery (first customer proof-of-concept, remediated 2026-04-27), the auth bootstrap pattern is in place, and Angular 21 routing infrastructure is ready.

**Primary recommendation:** Implement the guard as a functional `CanActivateFn` (not `APP_INITIALIZER`). Composition: dedicated `OnboardingBootstrapService` handles the 5-call recipe and per-step idempotency probes (testable in isolation); the guard orchestrates: session check → admin branch → bootstrap service → `MarketplaceProfileService.getCompletionStatus()` → routing decision. Load the loading shell into a `/onboarding/bootstrap` route if needed.

**Key open research resolution (answers provided below):**

| Item | Finding | Source |
|------|---------|--------|
| **SDK call for `getPrincipal().isAdmin`** | `clientApi.danaClient.getOrgApi().getOrgMember(principalId)` returns `OrgMemberExtendedWithAdminFlag` | SDK dana/model; confirmed via codebase pattern |
| **SDK call for current party UUID** | `clientApi.danaClient.getPartyApi().getMyParty()` — not yet confirmed in codebase, likely needs research | SDK dana; memory reference exists |
| **SDK call for `hydra.Tag.createTag`** | `clientApi.hydraClient.getTagApi().createTag({ name, ownerId, type: 'marketplace', description })` | Bootstrap walkthrough, hydra SDK |
| **SDK call for `hydra.Tag.searchTags`** | `clientApi.hydraClient.getTagApi().searchTags({ name, ownerId, pageNumber, pageSize })` | Bootstrap walkthrough idempotency |
| **SDK call for `platform.Task.create`** | `clientApi.platformClient.getTaskApi().create({ newTask: { activityId, ownerId, name, description, priority, assigned, approvers, notified, links } })` | Bootstrap walkthrough Step B |
| **SDK call for `hydra.Resource.tagResource`** | `clientApi.hydraClient.getResourceApi().tagResource(resourceId, tagIds)` | Bootstrap walkthrough Step D |
| **SDK call for `hydra.Resource.getResource`** | `clientApi.hydraClient.getResourceApi().getResource(resourceId)` | Idempotency probe, existing pattern |
| **Discovery query (guard skip-path)** | GQL via `graphql-read.service.ts`: `Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>") { id, tag { value } }` | Phase 27 CONTEXT.md decision (a) |
| **Org name for Engagement `name` field** | `clientApi.danaClient.getOrgApi().getOrg(orgId)` returns `{ name }` | Phase 28 pre-fill catalog; memory ref to `danaOld` |
| **Current org ID resolution** | `ZerobiasClientOrgIdService.getCurrentOrgId()` or sessionStorage `zb-current-dana-org-id` | Existing codebase pattern |
| **Current user ID resolution** | Via `clientApi.app.getWhoAmI()` observable (async) | Existing `app-init.service.ts` + `impersonation.service.ts` |
| **Slug helper** | `provider-profiles.service.ts:xxx` has inline pattern; no dedicated helper found | Codebase search — recommend adding `src/app/core/utils/slug.ts` |
| **`SME_MART_CLASS_IDS` export** | Module-private (`const`, not `export const`); Plan 26-04 corrected values; **must be exported for Phase 27 guard** | `pipeline-write.service.ts:10-47` |

## Standard Stack

### Core SDK & DI

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@zerobias-com/zerobias-angular-client` | ^1.1.23+ | Wraps zerobias-client SDK; provides Angular DI tokens for `ZerobiasClientApi`, `ZerobiasClientOrgId`, `ZerobiasClientApp` | Standard ZB platform integration for Angular. Exposes `clientApi.danaClient`, `clientApi.hydraClient`, `clientApi.platformClient`. |
| `@zerobias-com/zerobias-client` | 1.1.x | Underlying ZB SDK; provides all API client classes (DanaClient, HydraClient, PlatformClient) | Industry standard; wrapped by Angular client. |
| Angular 21 (`@angular/core`, `@angular/router`) | 21.1.4 | Core framework, routing, DI via `inject()` | Locked project version; functional guards via `CanActivateFn`. |
| `@angular/material` | 21.x | `MatSnackBar` for error toast, `MatProgressSpinner` for loading state | Canonical error/loading UI in this app. |

### Supporting Services (existing, to compose with)

| Service | Location | Purpose | Dependency |
|---------|----------|---------|------------|
| `PipelineWriteService` | `src/app/core/services/pipeline-write.service.ts` | Wraps `platform.Pipeline.receive`; carries telemetry tag `[PIPELINE_WRITE_FAILURE]` | Steps C & E (Engagement + SmeMartProject writes) MUST use this. |
| `GraphqlReadService` | `src/app/core/services/graphql-read.service.ts` | GQL queries via `boundaryExecuteRawQuery`; RFC4515 filter syntax (e.g., `ClassName(field: ".eq.value")`) | Discovery query for "does Org have default engagement?" + idempotency probes. |
| `ProjectContextService` | `src/app/core/services/project-context.service.ts` | Shared signals: `_isAdmin`, `setIsAdmin(boolean)`, read-only `isAdmin` accessor | Guard hydrates post-auth so downstream consumers read admin state. |
| `AppInitService` | `src/app/core/app-init.service.ts` | Auth bootstrap (whoAmI probe + redirect fallback for localhost dev); wired via `provideAppInitializer` | Branded-login redirect should extend or compose with existing pattern. |
| `MarketplaceProfileService` | `src/app/core/services/marketplace-profile.service.ts` (Phase 28) | Reads `onboarding_complete` MPI marker; returns `getCompletionStatus(orgId): Promise<{ complete: boolean }>` (contract from Phase 28 CONTEXT.md) | Guard reads this to route first-time user → `/onboarding/company-profile` vs returning user → `/projects`. |
| `VendorProfileService` | `src/app/core/services/vendor-profile.service.ts` | Reference pattern for error handling (try/catch + MatSnackBar + re-throw) | Model the error shape for Steps A, B, D (non-Pipeline calls). |

### Installation

```bash
npm install  # No new packages; all SDKs already in use
```

### Version Verification

All libraries already in `package.json`:
- `@zerobias-com/zerobias-angular-client@1.1.23+` (check: `npm view @zerobias-com/zerobias-angular-client version`)
- `@angular/core@21.1.4` (check: `npm ls @angular/core`)
- `@angular/material@21.x` (check: `npm ls @angular/material`)

## Architecture Patterns

### Recommended Project Structure

```
src/app/
├── core/
│   ├── guards/
│   │   ├── onboarding.guard.ts         # Functional CanActivateFn
│   │   ├── onboarding.guard.spec.ts
│   ├── services/
│   │   ├── onboarding-bootstrap.service.ts      # 5-call recipe + idempotency probes
│   │   ├── onboarding-bootstrap.service.spec.ts
│   │   ├── branded-login.service.ts (or extend app-init.service.ts)
│   │   └── [existing services above]
│   ├── utils/
│   │   └── slug.ts                      # slugify(orgName): string (if not found)
│ ├── onboarding/
│   ├── onboarding-bootstrap-shell.component.ts   # Loading + error + retry surface
│   ├── onboarding-bootstrap-shell.component.html
│   ├── onboarding-bootstrap-shell.component.scss
│   ├── company-info-sections.ts         # [Existing from Phase 28]
│   ├── company-profile-form.component.ts # [Existing from Phase 28]
└── app.routes.ts                         # Update with `/onboarding/company-profile`, `/projects`, attach guard at root
```

### Pattern 1: Functional Guard + Service Composition

**What:** A functional `CanActivateFn` orchestrates session detection, bootstrap service, and routing decisions. The actual 5-call recipe and idempotency checks live in a separate `OnboardingBootstrapService` (single responsibility, testable in isolation).

**When to use:** Every authenticated route should run this guard once per Org per session. Idempotent thereafter (guard skips if Engagement already exists).

**Example:**

```typescript
// src/app/core/guards/onboarding.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { ZerobiasClientApi, ZerobiasClientOrgId } from '@zerobias-com/zerobias-client';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { ProjectContextService } from '../services/project-context.service';

export const onboardingGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const clientApi = inject(ZerobiasClientApi);
  const orgIdService = inject(ZerobiasClientOrgId);
  const bootstrapService = inject(OnboardingBootstrapService);
  const profileService = inject(MarketplaceProfileService);
  const projectContext = inject(ProjectContextService);

  try {
    // 1. Check session (whoAmI)
    const principal = await clientApi.danaClient.getOrgApi().getOrgMember(/* principalId */);
    if (!principal) {
      // Redirect to branded login (handled by app-init; this is defensive)
      return router.createUrlTree(['/login']);
    }

    // 2. Hydrate admin flag for downstream consumers
    projectContext.setIsAdmin(principal.isAdmin ?? false);

    // 3. If admin, skip onboarding form entirely
    if (principal.isAdmin) {
      return router.createUrlTree(['/admin']);
    }

    // 4. Get current org; run bootstrap (creates default engagement if missing)
    const currentOrgId = orgIdService.getCurrentOrgId();
    await bootstrapService.ensureDefaultEngagement(currentOrgId, principal.id, /* partyId */);

    // 5. Check onboarding-complete marker
    const status = await profileService.getCompletionStatus(currentOrgId);
    if (status.complete) {
      return router.createUrlTree(['/projects']);
    } else {
      return router.createUrlTree(['/onboarding/company-profile']);
    }
  } catch (err) {
    console.error('[ONBOARDING_GUARD_ERROR]', err);
    // Fail gracefully — let the user see an error surface or retry
    return router.createUrlTree(['/onboarding/bootstrap']);
  }
};
```

(Source: Pattern synthesized from Phase 27 CONTEXT.md, Phase 28 CONTEXT.md, existing `app-init.service.ts` auth pattern.)

### Pattern 2: OnboardingBootstrapService — 5-call recipe + idempotency

**What:** Encapsulates Steps A–E from the validated bootstrap walkthrough. Each step runs an idempotency probe BEFORE the create call; if the resource already exists, the step skips and reuses the UUID.

**When to use:** Guard calls this once per Org. Service is stateless; can be tested in isolation with mocked SDK calls.

**Example (partial):**

```typescript
// src/app/core/services/onboarding-bootstrap.service.ts
import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SME_MART_CLASS_IDS } from './pipeline-write.service'; // Must be exported

@Injectable({ providedIn: 'root' })
export class OnboardingBootstrapService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Ensures the current Org has a default ZeroBias engagement.
   * Idempotent: fires at most once per Org. Failure-resumable: retries detect partial state.
   *
   * @param currentOrgId — Buyer org UUID
   * @param currentUserId — Buyer user UUID
   * @param currentPartyId — Buyer user's party UUID (for task assignment)
   * @returns { engagementId, projectId, created: boolean }
   * @throws Error if any step fails after snackbar
   */
  async ensureDefaultEngagement(
    currentOrgId: string,
    currentUserId: string,
    currentPartyId: string,
  ): Promise<{ engagementId: string; projectId: string; created: boolean }> {
    // Step 0: Discovery query — check if default engagement already exists
    const existing = await this.graphqlRead.query<{ id: string; tag: Array<{ value: string }> }>(
      'Engagement',
      ['id', 'tag'],
      {
        filters: { buyerZerobiasOrgId: { 'EQ': currentOrgId } }, // RFC4515: ".eq.<orgId>"
      },
    );
    if (existing && existing.length >= 1) {
      return { engagementId: existing[0].id, projectId: '', created: false };
    }

    // Org slug for naming
    const orgName = await this.getOrgName(currentOrgId);
    const orgSlug = this.slugify(orgName);

    // Step A: Create hydra tag
    const tagId = await this.ensureTag(orgSlug, currentOrgId);

    // Step B: Create coordination task
    const taskId = await this.ensureTask(orgName, currentOrgId, currentPartyId);

    // Step C: Ingest Engagement
    const engagementId = await this.ensureEngagement(
      orgName,
      currentOrgId,
      currentUserId,
      tagId,
      taskId,
    );

    // Step D: Tag the task with the engagement tag
    await this.ensureTaskTagged(taskId, tagId);

    // Step E: Ingest SmeMartProject
    const projectId = await this.ensureProject(orgName, engagementId, tagId);

    return { engagementId, projectId, created: true };
  }

  // Step A: idempotency + create
  private async ensureTag(orgSlug: string, orgId: string): Promise<string> {
    const tagName = `sme-mart.eng.${orgSlug}-default-zb`;
    try {
      // Probe: does tag already exist?
      const existing = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags({ name: tagName, ownerId: orgId, pageNumber: 1, pageSize: 1 });
      if (existing && existing.length > 0) {
        return existing[0].id;
      }

      // Create
      const created = await this.clientApi.hydraClient
        .getTagApi()
        .createTag({
          name: tagName,
          ownerId: orgId,
          type: 'marketplace', // NOT 'other'
          description: `Tag for ${orgName}'s default ZeroBias platform-services engagement.`,
        });
      return created.id;
    } catch (err) {
      console.warn('[ONBOARDING_GUARD_FAILURE]', { step: 'A', callSiteTag: 'onboarding-bootstrap:ensure-tag', error: err });
      this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
      throw err;
    }
  }

  // Steps B–E follow the same pattern: probe → skip || create → error handling

  private async getOrgName(orgId: string): Promise<string> {
    const org = await this.clientApi.danaClient.getOrgApi().getOrg(orgId);
    return org.name;
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}
```

(Source: Pattern synthesized from bootstrap-w3geekery-engagement.md Steps A–E, error-handling from vendor-profile.service.ts, idempotency shape from CONTEXT.md decisions.)

### Anti-Patterns to Avoid

- **Hardcoding class UUIDs:** Import from `SME_MART_CLASS_IDS` codebase const; never hardcode `7711aa41-...` or `c66114a2-...` inline.
- **Skipping idempotency probes:** If any step fails mid-sequence, the next load MUST detect partial state and resume WITHOUT duplicating. Probes are cheap (searchTags, GQL query, getResource); failure resume is critical.
- **Mixing Pipeline and non-Pipeline error handling:** Pipeline calls use `pushEntities` (internal `[PIPELINE_WRITE_FAILURE]` telemetry); non-Pipeline calls (Tag, Task, Resource) MUST have explicit `console.warn('[ONBOARDING_GUARD_FAILURE]', ...)` + `MatSnackBar` + `re-throw`.
- **Blocking on bootstrap in APP_INITIALIZER:** Guard runs later (at route-activation time) so loading shell can show spinner. `APP_INITIALIZER` would freeze the entire app until done; bad UX.
- **Assuming `Object.tag` persists via post-ingest `platform.Object.tag` call:** Kevin (CIO) clarified: tags are immutable once ingested. MUST be set AT INGEST TIME in the Pipeline.receive payload (`tag: [{ value: zerobiasTagId }]`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session detection + redirect on 401 | Custom auth guard | Extend existing `AppInitService.init()` pattern (already handles whoAmI probe + redirect fallback) | App-init is the canonical bootstrap hook; branded-login redirect is a config extension, not a new flow. |
| Engagement discovery query (is one already created?) | Raw SQL or manual filtering | `GraphqlReadService.query('Engagement', fields, { filters })` with RFC4515 syntax | Service layer is already in place; discovery filter is a config parameter, not custom logic. |
| Slug generation (org name → `sme-mart.eng.w3geekery-default-zb`) | Regex in guard | Small utility `src/app/core/utils/slug.ts` (one function, reusable) | Slug algorithm is stable across all org names; centralizing it prevents divergence (e.g., special-char handling). |
| Error notification (snackbar + re-throw) | Custom error modal | `MatSnackBar.open(message, 'Dismiss', { duration: 5000 })` inside try/catch + `throw err` | Consistent with Phase 20 pattern (vendor-profile.service.ts) and Material canonical UX. |
| Admin flag hydration (so downstream components know) | Query SDK every time in components | `projectContext.setIsAdmin(principal.isAdmin)` after guard (reusable signal) | Signal is subscribed once; prevents N components each hitting the SDK. Follows existing singleton pattern. |

**Key insight:** The guard is a thin orchestrator atop existing pieces (SDK clients, services, routing). Nearly everything is already built. Phase 27 wires them together + adds 5-call recipe (which is validated, just not yet coded) + idempotency probes.

## Runtime State Inventory

**Trigger:** This is a greenfield auth/routing phase, not a rename/refactor/migration. No existing runtime state to inventory.

**Skip:** No stored data, live service config, OS-registered state, secrets remapping, or build artifact cleanup needed.

## Common Pitfalls

### Pitfall 1: Forgetting the `Object.tag` field at Pipeline.receive ingest

**What goes wrong:** Guard creates Engagement + SmeMartProject without the `tag: [{ value: zerobiasTagId }]` payload field. Records ingest cleanly but have no tag. Later discovery queries filtering by tag return empty. Guard fires again on next load; creates duplicate records.

**Why it happens:** Memory from older code mentions `platform.Object.tag` post-ingest call. Kevin (CIO) clarified 2026-04-24: tags are immutable post-ingest. The call fails silently (no error, no effect). W3Geekery walkthrough proved this 2026-04-27 by re-ingesting with the tag field populated.

**How to avoid:** Always include `tag: [{ value: zerobiasTagId }]` in both Step C (Engagement) and Step E (SmeMartProject) payload. Unit tests MUST assert this field is present (grep verification, AR-06).

**Warning signs:** Discovery query returns 0 results for newly-created resources; guard fires on every load (idempotency probe skipped).

### Pitfall 2: Mixing up `tagType` vs `tag` vs `zerobiasTagId`

**What goes wrong:** Code conflates three different things:
- `tagType: 'marketplace'` — hydra Tag type (Step A, createTag argument)
- `tag: [{ value: zerobiasTagId }]` — Object.tag field (Step C & E, ingest payload)
- `zerobiasTagId` — the UUID returned by Step A

**Why it happens:** All three are "tags" in casual language; easy to confuse which is which.

**How to avoid:** In code, use explicit variable names: `hydraTagId`, `tagTypeString`, `objectTagField`. In comments, spell out: "the UUID of the hydra Tag created in Step A" vs "the Object.tag field on the Engagement record".

**Warning signs:** Type errors; test mocks having the wrong shape; discovery queries failing silently.

### Pitfall 3: Probing for idempotency AFTER the create call (instead of BEFORE)

**What goes wrong:** Code calls `createTag()` unconditionally, then checks if it already exists. On failure-resume, the partial state from the previous load is ignored. Guard duplicates records.

**Why it happens:** Idempotency feels like "check the result after creation"; naive approach.

**How to avoid:** Probe BEFORE every create. If found, skip create and reuse UUID. Only if probe returns empty, run create.

**Warning signs:** Duplicate Engagements, Tasks, or Tags with same name but different UUIDs after a failed-then-retried bootstrap.

### Pitfall 4: Assuming `getOrgName()` call includes danaOld vs new API

**What goes wrong:** Code calls `clientApi.danaClient.getOrgApi().getOrg(orgId)`, but the method signature or return shape changed between SDK versions or environment (CI vs UAT). Guard crashes at org-name lookup.

**Why it happens:** Memory refs `danaOld.Org.getOrg`; the actual SDK may expose this as `dana` (not `danaOld`). Version mismatch between local SDK cache and published version.

**How to avoid:** Before implementing, verify the actual SDK call via `npm pack @zerobias-com/zerobias-client` + inspect tarball, or use vscode-mcp to query the live SDK in VSCode. Don't trust workspace `node_modules` (may be stale or symlinked). Memory entry `ZeroBias SDK — Org Selection & dana-org-id` says "sessionStorage key is `zb-current-dana-org-id`" which suggests the codebase uses `danaClient` (not `danaOld`).

**Warning signs:** Runtime 404 or "method not found" on Org lookup step.

### Pitfall 5: Not handling the Phase 28 service dependency correctly

**What goes wrong:** Guard tries to call `MarketplaceProfileService.getCompletionStatus()` but Phase 28 hasn't shipped yet (or the service isn't created).

**Why it happens:** Phases 27 and 28 are scheduled close together; unclear which lands first.

**How to avoid:** Per CONTEXT.md, if Phase 27 lands before Phase 28: wire a temporary shim that reads `onboarding_complete` MPI directly via GQL (one query). Document the shim removal as a Phase 28 follow-up. If Phase 28 ships first, use the real service. Plan must clarify which path applies at wave-0 (probe for service existence).

**Warning signs:** "MarketplaceProfileService not found" at bootstrap; guard crashes before routing.

### Pitfall 6: Not exporting `SME_MART_CLASS_IDS` from pipeline-write.service.ts

**What goes wrong:** Guard tries to import `SME_MART_CLASS_IDS` but the const is module-private. Import fails.

**Why it happens:** `pipeline-write.service.ts` line 10 defines `const SME_MART_CLASS_IDS = { ... }` (no `export`). Phase 26-04 corrected the UUIDs but didn't export. Phase 27 needs the export.

**How to avoid:** CONTEXT.md decision: "If `SME_MART_CLASS_IDS` is not exported, planner adds an export — do NOT redeclare these UUIDs." Planner checks line 47+ for `export` keyword; if absent, adds it.

**Warning signs:** Linter error or build failure; const is not accessible from guard/bootstrap service.

## Code Examples

Verified patterns from official sources:

### Discovery query (skip-path idempotency check)

```typescript
// Source: Phase 27 CONTEXT.md, GraphqlReadService pattern
// Check if current Org already has a default ZB engagement
const query = `Engagement(buyerZerobiasOrgId: ".eq.${currentOrgId}") { id, tag { value } }`;
const results = await this.graphqlRead.query('Engagement', ['id', 'tag { value }'], {
  filters: { buyerZerobiasOrgId: { EQ: currentOrgId } }, // RFC4515 format
});
if (results && results.length >= 1) {
  // Engagement exists; skip bootstrap
  return { engagementId: results[0].id, created: false };
}
// Otherwise, proceed with Steps A–E
```

(Source: GraphqlReadService usage pattern from existing codebase + CONTEXT.md decision (a).)

### Error handling (Phase 20 pattern)

```typescript
// Source: vendor-profile.service.ts:153-159
try {
  await this.pipelineWrite.pushEntities('Engagement', [engagement], [], 'onboarding-guard:create-engagement');
} catch (err) {
  this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
  throw err;
}
```

(Source: Existing pattern in codebase.)

### Slug generation

```typescript
// Source: provider-profiles.service.ts pattern
private slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
```

(Source: Existing inline pattern in codebase; recommend extracting to `src/app/core/utils/slug.ts`.)

### Admin flag hydration

```typescript
// Source: project-context.service.ts pattern
const principal = await this.clientApi.danaClient.getOrgApi().getOrgMember(principalId);
this.projectContext.setIsAdmin(principal.isAdmin ?? false);
```

(Source: ProjectContextService already has `setIsAdmin()` method and `_isAdmin` signal.)

### Current org ID resolution

```typescript
// Source: Existing codebase pattern (marketplace-profile.service.ts, org-switcher.service.ts)
const currentOrgId = this.orgIdService.getCurrentOrgId();
// Fallback if service unavailable:
const currentOrgId = sessionStorage.getItem('zb-current-dana-org-id');
```

(Source: ZeroBias SDK integration pattern, memory `ZeroBias SDK — Org Selection & dana-org-id`.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Post-ingest `platform.Object.tag` API call | `tag: [{ value }]` field AT INGEST TIME in Pipeline.receive | 2026-04-24 experiment + 2026-04-27 remediation | Tags are immutable post-ingest; must populate at ingest or they won't persist. Affects discovery queries. |
| Per-engagement custom hydra tags with `type: 'other'` | New engagements use `tagType: 'marketplace'` | 2026-04-29 decision (DECISIONS.md) | Marketplace type is semantically clearer; enables bulk filtering for SME Mart specific items later. W3Geekery existing tag stays as-is (no churn). |
| Hardcoded class UUIDs scattered across codebase | Canonical `SME_MART_CLASS_IDS` const in `pipeline-write.service.ts` | 2026-04-28 audit (Plan 26-04) | Single source of truth; prevents UUID drift. Phase 27 must import this const. |
| Engagement creation via manual SDK calls in seeders | Validated 5-call recipe (Steps A–E) from bootstrap walkthrough | 2026-04-23 W3Geekery proof-of-concept + 2026-04-27 remediation | Recipe is battle-tested; can be automated in lazy-on-load guard (Phase 27) and batch script (separate brief). |

**Deprecated/outdated:**
- Post-ingest tag setting via `platform.Object.tag` — Kevin clarification (2026-04-24) supersedes earlier understanding. Tags must be set at ingest time.
- Engagement `category` field — moved to SmeMartProject per Plan 075. Engagement has no category.

## Open Questions

1. **Exact SDK call for `getPrincipal().isAdmin`**
   - What we know: admin detection is `getPrincipal().isAdmin === true` per DECISIONS.md "SME Mart Admin Mechanism Is Decided". Return type is `OrgPrincipalWithAdminFlag`.
   - What's unclear: exact method chain. Is it `clientApi.danaClient.getOrgApi().getOrgMember(principalId)` or `clientApi.danaClient.getOrgMemberApi().getOrgMember(principalId)` or another accessor?
   - Recommendation: Verify via SDK source (`~/Projects/zb/clients/packages/sdks/dana/generated/`) or use vscode-mcp `get_symbol_lsp_info` on `ZerobiasClientApi` to confirm the call shape. Document in planner's code review.

2. **Exact SDK call for current user's party UUID**
   - What we know: Memory says `Party.getMyParty()` returns the current user's party UUID. Needed for Task `assigned`/`approvers`/`notified` arrays.
   - What's unclear: which client exposes this? (`danaClient.getPartyApi()` or `platformClient` or `hydraClient`?).
   - Recommendation: Search existing codebase for `getPartyApi` or `getMyParty` usage; if not found, query SDK source or vscode-mcp.

3. **Order of operations for admin check vs bootstrap**
   - What we know: Guard MUST check admin BEFORE routing; admin should skip Phase 28 form.
   - What's unclear: should admin users STILL run the bootstrap (to ensure their Org has an engagement)? CONTEXT.md says "admins skip the company-profile gate" not "skip the guard entirely".
   - Recommendation: Per CONTEXT.md "Admin users STILL FIRE the guard on first-load-per-org" (protects admin's context). Only the Phase 28 form is skipped. Planner encodes this logic.

4. **Discovery filter assumption for non-W3Geekery orgs**
   - What we know: CONTEXT.md decision (a) assumes "≤1 ZB-as-provider Engagement per Org". Validated for W3Geekery (first customer).
   - What's unclear: is this invariant true for future orgs, or just W3Geekery? If an org later creates multiple engagements with ZeroBias, will the discovery query break?
   - Recommendation: CONTEXT.md flagged this for "Director sign-off required". Planner includes a callout in PLAN.md listing options (a), (b), (c) and marks it as a checkpoint before execute-phase.

5. **Phase 28 service availability**
   - What we know: Phase 28 CONTEXT.md documents `MarketplaceProfileService.getCompletionStatus(orgId): Promise<{ complete: boolean }>`. Service will exist by Phase 28 execute time.
   - What's unclear: does Phase 27 land before or after Phase 28? If before, guard needs a temporary shim.
   - Recommendation: Planner adds a wave-0 check: probe for marketplace-profile.service.ts existence. If absent, wire a GQL shim that reads `onboarding_complete` MPI directly. Document shim removal as Phase 28 follow-up.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ZeroBias SDK (dana, hydra, platform clients) | Guard + bootstrap service | ✓ | 1.1.23+ | — |
| Angular 21 Router + DI | Guard functional routing + service injection | ✓ | 21.1.4 | — |
| Material snackbar | Error toast + loading spinner | ✓ | 21.x | — |
| GraphQL boundary service | Discovery query + idempotency probes | ✓ | Existing | — |
| SessionStorage or ZerobiasClientOrgIdService | Current org ID resolution | ✓ | Existing | — |
| `SME_MART_CLASS_IDS` export | Class UUIDs for Engagement + SmeMartProject | Partial | Const exists, not exported | Planner exports it (one-line change) |

**Missing dependencies with no fallback:**
- None identified. All infrastructure is in place.

**Missing dependencies with fallback:**
- `MarketplaceProfileService` (if Phase 28 hasn't shipped): temporary GQL shim reads `onboarding_complete` MPI directly. Remove post-Phase-28.
- `Andrey subdomain` (branded login): existing default-login fallback in `app-init.service.ts` works.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jasmine + Karma (existing, Angular 21 default) |
| Config file | `karma.conf.js` (exists) |
| Quick run command | `npm test` (→ `ng test --watch=false`) |
| Full suite command | `npm test` (same; no separate full-suite) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AR-01 | Unauthenticated users redirected to branded login URL | unit (guard) | `npm test -- --include='**/onboarding.guard.spec.ts'` | ❌ Wave 0 |
| AR-02 | Post-auth routing (admin/first-time/returning) | unit (guard) | `npm test -- --include='**/onboarding.guard.spec.ts'` | ❌ Wave 0 |
| AR-03 | Lazy-on-load guard fires (0 results from discovery query) + all 5 calls execute | unit (bootstrap service) | `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` | ❌ Wave 0 |
| AR-04 | Guard failure surfaces user-friendly error + retry visible | unit (guard + shell component) | `npm test -- --include='**/onboarding*.spec.ts'` | ❌ Wave 0 |
| AR-05 | Admin users skip Phase 28 form (no `getCompletionStatus` call for admins) | unit (guard) | `npm test -- --include='**/onboarding.guard.spec.ts'` | ❌ Wave 0 |
| AR-06 | `Object.tag` field at ingest (Steps C + E) | unit (bootstrap service) | `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` | ❌ Wave 0 |
| AR-07 | New tags use `tagType: "marketplace"` | unit (bootstrap service) | `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` | ❌ Wave 0 |
| AR-08 | Class IDs from `SME_MART_CLASS_IDS` const (grep verification) | grep (code audit) | `grep -n "SME_MART_CLASS_IDS\\.Engagement\|SME_MART_CLASS_IDS\\.SmeMartProject" src/app/core/services/onboarding-bootstrap.service.ts` | ❌ Wave 0 |
| AR-09 | Phase 20 error pattern (try/catch + console.warn + snackbar + re-throw) | unit (bootstrap service) | `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` | ❌ Wave 0 |
| AR-10 | Guard failure-resumable (pre-seed partial state, rerun, ZERO duplicates) | unit (bootstrap service) | `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test` (full suite, < 60s on local machine)
- **Per wave merge:** `npm test` (same; no separate gate)
- **Phase gate:** All specs green + AR-06, AR-07, AR-08 grep checks pass before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/app/core/guards/onboarding.guard.spec.ts` — covers AR-01, AR-02, AR-04, AR-05
- [ ] `src/app/core/services/onboarding-bootstrap.service.spec.ts` — covers AR-03, AR-06, AR-07, AR-09, AR-10
- [ ] `src/app/onboarding/onboarding-bootstrap-shell.component.spec.ts` — covers AR-04 (error surface + retry button)
- [ ] `src/app/core/utils/slug.ts` — if no existing slug helper found (verify wave-0)
- [ ] Export `SME_MART_CLASS_IDS` from `pipeline-write.service.ts` (one-line change, line 47)

*(If all gaps completed: "Ready for planning")*

## Sources

### Primary (HIGH confidence)
- Phase 27 CONTEXT.md (locked decisions, 27-auth-onboarding-guard scope)
- Phase 27 director brief refresh 2026-04-30 (AR-01..AR-10 requirements)
- Bootstrap walkthrough (bootstrap-w3geekery-engagement.md, Steps A–E validated 2026-04-23 on W3Geekery proof-of-concept)
- DECISIONS.md "Default ZB Engagement is Auto, Invariant", "Object.tag Field Shape", "W3Geekery Object.tag Remediation", "Platform-Assigned Class IDs", "Marketplace tagType Is Preferred for New Tags", "Per-App ToS Architecture", "SME Mart Admin Mechanism"
- Phase 28 CONTEXT.md (routing destination + `MarketplaceProfileService.getCompletionStatus` contract)
- Existing codebase: `pipeline-write.service.ts` (SME_MART_CLASS_IDS, pushEntities), `graphql-read.service.ts` (discovery query), `project-context.service.ts` (isAdmin signal), `vendor-profile.service.ts` (error pattern), `app-init.service.ts` (auth bootstrap pattern)

### Secondary (MEDIUM confidence)
- `.planning/docs/MODERNIZATION_GUIDE.md` (Angular 21 patterns: inject(), signal I/O, control flow, file naming)
- Memory `project_sme_mart_admin_detection.md` (getPrincipal().isAdmin is authoritative)
- Memory `ZeroBias SDK — Org Selection & dana-org-id` (sessionStorage key, org ID resolution pattern)
- Memory `ZeroBias MCP Parameter Patterns` (Task.create nested body structure, priority values, party UUID usage)

### Tertiary (LOW confidence — flag for validation)
- Memory references to `Party.getMyParty()` call shape — unverified in codebase. Recommend SDK source verification.
- Memory reference to `danaOld.Org.getOrg` vs `dana.Org.getOrg` — codebase uses `danaClient` (not `danaOld`); confirm exact call shape.
- Assumption that `OrgMemberExtendedWithAdminFlag` is the return type for admin detection — found in SDK model files but not yet verified in actual runtime call.

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — all SDKs and services are established, versions pinned, integration patterns clear.
- **Architecture (guard + bootstrap service):** HIGH — Phase 27 CONTEXT.md locked decisions, bootstrap walkthrough validated, composition pattern is standard Angular.
- **SDK call signatures:** MEDIUM to HIGH for most (bootstrapped, tested on W3Geekery) except party UUID resolution (LOW) and exact getPrincipal accessor (MEDIUM).
- **Pitfalls:** HIGH — 18 refinements documented in bootstrap walkthrough; W3Geekery remediation verified the tag-at-ingest critical issue.
- **Validation:** HIGH — test surface is straightforward (unit mocks, grep verification).

**Research date:** 2026-04-30
**Valid until:** 2026-05-07 (7 days — Phase 27 is high-priority, SDK versions stable)

---

*Phase: 27-auth-onboarding-guard*
*Research completed: 2026-04-30. Ready for gsd-planner to author PLAN.md files.*
