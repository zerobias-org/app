---
phase: 27
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/core/services/onboarding-bootstrap.service.ts
  - src/app/core/services/onboarding-bootstrap.service.spec.ts
  - src/app/core/services/pipeline-write.service.ts
  - src/app/core/utils/slug.ts
autonomous: true
requirements_addressed: [AR-03, AR-06, AR-07, AR-08, AR-10]
must_haves:
  truths:
    - Guard queries for existing default engagement; if found, skips all 5 bootstrap calls
    - If no engagement found, runs all 5 calls in order with correct SDKs and field shapes
    - Each step has an idempotency probe BEFORE the create call (no duplicate creates on retry)
    - New hydra tags use `tagType: "marketplace"` (not `other`)
    - Engagement and SmeMartProject have Object.tag set AT INGEST TIME
    - Class IDs come from SME_MART_CLASS_IDS const (no hardcoded UUIDs)
    - Non-Pipeline failures (tag, task, resource) follow Phase 20 error pattern (console.warn + snackbar + re-throw)
  artifacts:
    - path: "src/app/core/services/onboarding-bootstrap.service.ts"
      provides: "5-call recipe (A-E) with per-step idempotency probes, error handling per Phase 20 pattern"
      exports: "OnboardingBootstrapService, ensureDefaultEngagement(orgId, userId, partyId)"
    - path: "src/app/core/services/onboarding-bootstrap.service.spec.ts"
      provides: "5 specs covering guard-fires, guard-skips, idempotent-resume, error handling, class-ID imports"
    - path: "src/app/core/utils/slug.ts"
      provides: "slugify(name: string): string utility (if no existing helper found)"
    - path: "src/app/core/services/pipeline-write.service.ts"
      provides: "Export SME_MART_CLASS_IDS const (one-line change: add export keyword)"
  key_links:
    - from: "onboarding-bootstrap.service.ts"
      to: "pipeline-write.service.ts"
      via: "import SME_MART_CLASS_IDS (Engagement + SmeMartProject)"
    - from: "onboarding-bootstrap.service.ts"
      to: "graphql-read.service.ts"
      via: "GQL query Engagement(buyerZerobiasOrgId) for discovery"
    - from: "onboarding-bootstrap.service.ts"
      to: "hydra SDK (clientApi.hydraClient)"
      via: "Step A (createTag) + Step D (tagResource)"
    - from: "onboarding-bootstrap.service.ts"
      to: "platform SDK (clientApi.platformClient)"
      via: "Step B (Task.create)"
    - from: "onboarding-bootstrap.service.ts"
      to: "MatSnackBar"
      via: "error notifications (Phase 20 pattern)"
---

<objective>
Implement OnboardingBootstrapService: the 5-call recipe (Steps A–E from bootstrap-w3geekery-engagement.md) with per-step idempotency probes, error handling, and Object.tag at ingest time.

Purpose: Comply with AR-03 (lazy-on-load guard creates missing default engagement), AR-06 (Object.tag at ingest), AR-07 (tagType marketplace), AR-08 (class IDs from const), AR-10 (failure-resumable).

Output: Testable service that encapsulates all 5 calls, handles idempotency, follows Phase 20 error pattern, and produces correct Engagement + SmeMartProject records with Object.tag populated.
</objective>

<director_sign_off>
**DECISION REQUIRED: Discovery Filter Shape**

Plan 02 implements discovery query (Step 0 idempotency check) before bootstrap Steps A–E. The discovery query finds existing default Engagement to skip bootstrap if already created. Three options exist for the query filter:

**Option (a) — Default (selected):** Filter by `buyerZerobiasOrgId` only
```graphql
Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>") { id, tag { value } }
```
**Assumption:** ≤1 engagement per org (org-level scope). Simplest, no tag lookup overhead.
**Constraint:** Fails if org has >1 engagement (violation of invariant).

**Option (b) — Per-Org Tag Lookup:**
1. Query org's hydra tag: `Tag.searchTags({ ownerId: currentOrgId, name: 'sme-mart.eng.*' })`
2. Filter by tag UUID: `Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>", tag: { value: ".eq.<tagUUID>" })`
**Assumption:** Each org has a single designated tag for default engagement.
**Benefit:** Handles multiple engagements per org.
**Cost:** Additional tag lookup before discovery.

**Option (c) — Global Sentinel Tag:**
Use a single global tag (e.g., `sme-mart.default-engagement`) registered once per platform:
```graphql
Engagement(tag: { value: ".eq.<sentinelTagId>" }) { id, ... }
```
**Benefit:** Works across all orgs.
**Cost:** One-time retag of all existing engagements (migration).

**Please confirm:** Option (a) is implemented in this plan. Confirm acceptance or select option (b) or (c) for revision.

</director_sign_off>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@.planning/phases/27-auth-onboarding-guard/27-CONTEXT.md — locked decisions (all 5 steps, idempotency probes, error pattern, Object.tag shape)
@.planning/phases/27-auth-onboarding-guard/27-RESEARCH.md — SDK call shapes, standard stack, common pitfalls
@.planning/director/bootstrap-w3geekery-engagement.md — Steps A–E canonical recipe with field shapes, pre-checks 1–6
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/director/phase-27-brief.md — Requirements AR-03..AR-10
@.planning/director/DECISIONS.md "Object.tag Field Shape", "Marketplace tagType Is Preferred", "Platform-Assigned Class IDs"
@.planning/docs/MODERNIZATION_GUIDE.md — Angular 21 patterns
@src/app/core/services/pipeline-write.service.ts — pushEntities() wrapper (lines 133) + SME_MART_CLASS_IDS const (lines 10–47)
@src/app/core/services/graphql-read.service.ts — boundaryExecuteRawQuery() for discovery query
@src/app/core/services/vendor-profile.service.ts:153-159 — error pattern (try/catch + snackbar + re-throw)
@src/app/core/services/project-context.service.ts — setIsAdmin() method (called by guard post-bootstrap)
</context>

<interfaces>
<!-- Key SDK types and call shapes for executor reference -->

From bootstrap-w3geekery-engagement.md Steps A–E and 27-RESEARCH.md:

**Step A — hydra.Tag.createTag:**
```typescript
interface CreateTagRequest {
  name: string;                  // 'sme-mart.eng.<org-slug>-default-zb'
  ownerId: string;               // currentOrgId (org-scope tag)
  type?: 'marketplace' | 'other'; // NEW: use 'marketplace' per DECISIONS.md
  description?: string;
}
// Returns: Tag { id: string; name: string; ... }
```

**Step B — platform.Task.create:**
```typescript
interface CreateTaskRequest {
  newTask: {
    activityId: string;           // 'e15830c8-4274-4d67-bf9b-c22b60001e32' (global aha1)
    ownerId: string;              // currentOrgId (per memory feedback_w3geekery_task_ownerid)
    name: string;                 // 'Engagement coordination — <Buyer> <- ZeroBias'
    description?: string;
    priority: number;             // 500
    assigned: string;             // party UUID (NOT principal UUID)
    approvers: string[];          // [party UUID]
    notified: string[];           // [party UUID]
    links: any[];                 // []
  };
}
// Returns: Task { id: string; code: string; ... }
```

**Step C — Pipeline.receive (Engagement):**
```typescript
interface EngagementPayload {
  id: string;                                 // UUID (generated)
  name: string;                               // '<Buyer> <- ZeroBias' (literal reverse-arrow)
  description: string;
  buyerZerobiasUserId: string;
  buyerZerobiasOrgId: string;
  status: 'in_progress';
  engagementTag: 'default-project';           // STRING field
  zerobiasTagId: string;                      // UUID from Step A
  zerobiasTaskId: string;                     // UUID from Step B
  dateCreated: string;                        // YYYY-MM-DD
  dateLastModified: string;                   // YYYY-MM-DD
  tag: Array<{ value: string }>;              // REQUIRED: [{ value: zerobiasTagId }]
}
// Via: pipelineWrite.pushEntities('Engagement', [payload], [], 'onboarding-bootstrap:create-engagement')
```

**Step D — hydra.Resource.tagResource:**
```typescript
// Signature: tagResource(resourceId: string, tagIds: string[]): Promise<void>
// Call: tagResource(zerobiasTaskId, [zerobiasTagId])
```

**Step E — Pipeline.receive (SmeMartProject):**
```typescript
interface SmeMartProjectPayload {
  id: string;                                 // UUID (generated)
  name: string;                               // 'SME Mart Platform Development'
  description: string;
  status: 'active';
  projectType: 'project';                     // (not 'rfp' or 'pilot')
  engagementId: string;                       // Engagement external UUID from Step C
  isInvitationOnly: false;
  wizardStep: 999;                            // sentinel for "complete"
  dateCreated: string;                        // YYYY-MM-DD
  dateLastModified: string;                   // YYYY-MM-DD
  tag: Array<{ value: string }>;              // REQUIRED: [{ value: zerobiasTagId }]
}
// Via: pipelineWrite.pushEntities('SmeMartProject', [payload], [], 'onboarding-bootstrap:create-project')
```

**Discovery query (skip-path idempotency check — Step 0):**
```typescript
// GQL via graphql-read.service.ts
// Filter: Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>") { id, tag { value } }
// Returns: Array<{ id: string; tag: Array<{ value: string }> }>
// Assert: length <= 1
```

**Idempotency probes:**

Step A (Tag) probe:
```typescript
// hydra.Tag.searchTags({ name: tagName, ownerId: currentOrgId, pageNumber: 1, pageSize: 1 })
// If exists: return existing.id; else: create and return created.id
```

Step B (Task) probe:
```typescript
// List tasks tagged with the recovered zerobiasTagId
// Search pattern: task name contains "Engagement coordination" AND tagged with zerobiasTagId
// If found: return existing task.id; else: create
```

Step C (Engagement) probe:
```typescript
// Same as Step 0: GQL query Engagement(buyerZerobiasOrgId)
// If exists: return existing engagement.id; else: create
```

Step D (tagResource) probe:
```typescript
// hydra.Resource.getResource(zerobiasTaskId)
// Returns: Resource { tags: Array<Tag> }
// If zerobiasTagId already in tags: skip D; else: call tagResource
```

Step E (SmeMartProject) probe:
```typescript
// GQL query SmeMartProject(engagementId: ".eq.<engagementId>", projectType: ".eq.project")
// If found (>= 1): skip E; else: create
```

**Error pattern (Phase 20, from vendor-profile.service.ts:153–159):**
```typescript
try {
  // ... SDK or Pipeline call ...
} catch (err) {
  // For non-Pipeline calls (A, B, D):
  console.warn('[ONBOARDING_GUARD_FAILURE]', {
    callSiteTag: 'onboarding-bootstrap:ensure-tag',  // or other step
    step: 'A',  // or B, D, etc.
    error: err
  });
  // For Pipeline calls (C, E): pushEntities already logs [PIPELINE_WRITE_FAILURE]
  
  this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
  throw err;  // MUST re-throw
}
```

**SME_MART_CLASS_IDS (from pipeline-write.service.ts, must be exported):**
```typescript
export const SME_MART_CLASS_IDS = {
  Engagement: '7711aa41-e55b-5cda-9b7a-35844a2006a1',
  SmeMartProject: 'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03',
  // ... other classes ...
} as const;
```

</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Export SME_MART_CLASS_IDS from pipeline-write.service.ts</name>
  <files>src/app/core/services/pipeline-write.service.ts</files>
  <read_first>
    src/app/core/services/pipeline-write.service.ts lines 10–47 (SME_MART_CLASS_IDS const definition)
    27-CONTEXT.md "Class IDs are read from the codebase const" — mandatory export requirement
  </read_first>
  <action>
On line 10 of pipeline-write.service.ts, change:
```typescript
const SME_MART_CLASS_IDS = {
```
to:
```typescript
export const SME_MART_CLASS_IDS = {
```

That's it. One word, one line. The const is already `as const` so the type is properly narrowed. No other changes needed.

Verify: The export statement should appear on line 10 after the change. The closing `} as const;` should still be on line 47.
  </action>
  <acceptance_criteria>
    - Line 10 of pipeline-write.service.ts reads: `export const SME_MART_CLASS_IDS = {`
    - `npx tsc --noEmit` exits 0
    - No lint errors
  </acceptance_criteria>
  <verify>
    <automated>grep -n "^export const SME_MART_CLASS_IDS" src/app/core/services/pipeline-write.service.ts</automated>
  </verify>
  <done>
    SME_MART_CLASS_IDS is exported from pipeline-write.service.ts. TypeScript compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create slug utility (if no existing helper found)</name>
  <files>src/app/core/utils/slug.ts</files>
  <read_first>
    27-RESEARCH.md "Slug helper" — research finding that no dedicated helper was found in codebase
    27-CONTEXT.md "Slug derivation" — specification of the slugify function
  </read_first>
  <action>
Create `src/app/core/utils/slug.ts` with the `slugify` function:

```typescript
/**
 * Convert an org name to a URL-safe slug for use in tag names and identifiers.
 * Lowercase, replace whitespace with hyphens, remove non-alphanumeric except hyphens.
 * 
 * Example: "W3Geekery Inc." -> "w3geekery-inc"
 * 
 * @param name — Org name
 * @returns — slugified name (lowercase, hyphens, alphanumeric only)
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')            // whitespace → hyphen
    .replace(/[^a-z0-9-]/g, '');     // remove non-alphanumeric except hyphen
}
```

This matches the pattern from the RESEARCH.md code example and the bootstrap walkthrough.
  </action>
  <acceptance_criteria>
    - File exists at `src/app/core/utils/slug.ts`
    - Function signature: `slugify(name: string): string`
    - Handles: lowercase, whitespace → hyphen, non-alphanumeric removal
    - Examples work: "W3Geekery Inc." → "w3geekery-inc", "Test Org" → "test-org"
    - TypeScript compiles
  </acceptance_criteria>
  <verify>
    <automated>grep -n "export function slugify" src/app/core/utils/slug.ts && npx tsc --noEmit</automated>
  </verify>
  <done>
    `src/app/core/utils/slug.ts` contains the `slugify(name: string): string` function. TypeScript compiles.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement OnboardingBootstrapService with 5-call recipe + idempotency probes</name>
  <files>
    src/app/core/services/onboarding-bootstrap.service.ts
    src/app/core/services/onboarding-bootstrap.service.spec.ts
  </files>
  <read_first>
    27-CONTEXT.md entire "decisions" section — ALL locked decisions about the 5 calls, idempotency, error handling, Object.tag shape
    27-CONTEXT.md "Concrete contracts" — exact field shapes for Steps A–E
    bootstrap-w3geekery-engagement.md Steps A–E with all field specs and pre-checks
    27-RESEARCH.md "Architecture Patterns" section "Pattern 2: OnboardingBootstrapService" — complete pattern example
    vendor-profile.service.ts:153-159 — error handling pattern (try/catch + snackbar + re-throw)
    pipeline-write.service.ts — pushEntities() signature and telemetry pattern ([PIPELINE_WRITE_FAILURE])
  </read_first>
  <action>
Create `src/app/core/services/onboarding-bootstrap.service.ts` implementing the 5-call recipe:

**Main public method:**
```typescript
async ensureDefaultEngagement(
  currentOrgId: string,
  currentUserId: string,
  currentPartyId: string
): Promise<{ engagementId: string; projectId: string; created: boolean }>
```

This method:
1. **Step 0:** Runs discovery query `Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>")`. If 1+ result found, returns `{ engagementId: existing[0].id, projectId: '', created: false }` (skip-path, ZERO bootstrap calls).
2. **If zero results:** Proceeds to Steps A–E in order:
   - **Step A:** `ensureTag(orgSlug, currentOrgId)` — probe via `searchTags`, create if missing, return UUID
   - **Step B:** `ensureTask(orgName, currentOrgId, currentPartyId)` — probe for task with engagement-coordination name, create if missing, return UUID
   - **Step C:** `ensureEngagement(orgName, currentOrgId, currentUserId, tagId, taskId)` — probe via GQL query (same as Step 0 but scoped), create via pushEntities if missing, return UUID
   - **Step D:** `ensureTaskTagged(taskId, tagId)` — probe via `getResource`, call `tagResource` if tag not present
   - **Step E:** `ensureProject(orgName, engagementId, tagId)` — probe via GQL query `SmeMartProject(engagementId: ".eq.<engagementId>")`, create via pushEntities if missing, return UUID
3. Returns `{ engagementId, projectId, created: true }` on success

**Field values (copy LITERAL from bootstrap walkthrough):**

Step A (Tag):
- `name = 'sme-mart.eng.<org-slug>-default-zb'` (use `slugify(orgName)`)
- `ownerId = currentOrgId`
- `type = 'marketplace'` (NOT 'other' — new per 2026-04-29 DECISIONS.md)
- `description = 'Tag for ' + orgName + '...'`

Step B (Task):
- `activityId = 'e15830c8-4274-4d67-bf9b-c22b60001e32'` (global aha1 — do NOT hardcode, preferably import from a constants file or bootstrap brief reference)
- `ownerId = currentOrgId`
- `name = 'Engagement coordination — ' + orgName + ' <- ZeroBias'` (literal reverse-arrow `<-`, buyer-first)
- `assigned = currentPartyId` (party UUID, not principal UUID — per memory feedback_task_assigned_party_id.md)
- `approvers = [currentPartyId]`
- `notified = [currentPartyId]`
- `priority = 500`
- `links = []`

Step C (Engagement):
- `id = crypto.randomUUID()` (generate fresh UUID each time; used in GQL queries + SmeMartProject's engagementId)
- `name = orgName + ' <- ZeroBias'` (same as Task, buyer-first)
- `description = 'Default ZeroBias platform-services engagement...'`
- `buyerZerobiasUserId = currentUserId`
- `buyerZerobiasOrgId = currentOrgId`
- `status = 'in_progress'`
- `engagementTag = 'default-project'` (STRING, not UUID)
- `zerobiasTagId = tagId` (from Step A)
- `zerobiasTaskId = taskId` (from Step B)
- `dateCreated = new Date().toISOString().split('T')[0]` (YYYY-MM-DD date type)
- `dateLastModified = same as dateCreated`
- **`tag = [{ value: tagId }]`** — CRITICAL per AR-06 / Object.tag Field Shape decision

Step D (tagResource):
- Call: `hydra.Resource.tagResource(taskId, [tagId])`

Step E (SmeMartProject):
- `id = crypto.randomUUID()`
- `name = 'SME Mart Platform Development'`
- `description = 'Default project for ' + orgName + '...'`
- `status = 'active'`
- `projectType = 'project'` (NOT 'rfp' or 'pilot')
- `engagementId = engagementId` (from Step C)
- `isInvitationOnly = false`
- `wizardStep = 999`
- `dateCreated = same date as Engagement`
- `dateLastModified = same date as Engagement`
- **`tag = [{ value: tagId }]`** — CRITICAL per AR-06

**Error handling (Phase 20 pattern):**

For Steps A, B, D (non-Pipeline calls):
```typescript
try {
  // ... SDK call ...
} catch (err) {
  console.warn('[ONBOARDING_GUARD_FAILURE]', {
    callSiteTag: 'onboarding-bootstrap:ensure-tag',  // or other step name
    step: 'A',  // or B, D
    error: err
  });
  this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
  throw err;  // MUST re-throw
}
```

For Steps C, E (Pipeline calls via pushEntities):
```typescript
try {
  await this.pipelineWrite.pushEntities('Engagement', [engagement], [], 'onboarding-bootstrap:create-engagement');
} catch (err) {
  // pushEntities already logged [PIPELINE_WRITE_FAILURE]; just handle presentation
  this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
  throw err;
}
```

**DI (Angular 21 modernization):**
```typescript
@Injectable({ providedIn: 'root' })
export class OnboardingBootstrapService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);
  // ... other deps as needed
}
```

No constructor params. Use `inject()` field-level only.

**Helper methods:**
- `private async getOrgName(orgId: string): Promise<string>` — fetch Org name via SDK
- `private slugify(name: string): string` — import from `slug.ts` util, or inline if preferred
- `private async ensureTag(...)`: probe + create Step A
- `private async ensureTask(...)`: probe + create Step B
- `private async ensureEngagement(...)`: probe + create Step C
- `private async ensureTaskTagged(...)`: probe + call Step D
- `private async ensureProject(...)`: probe + create Step E

Each private helper returns `{ created: boolean; id: string }` to make test assertions explicit about what fired vs skipped.

**TestScope** (per 27-CONTEXT.md "Test scope"):

Specs to cover (4 required):
1. **Guard fires** — given 0 results from discovery query, all 5 calls execute in order with correct args, return `{ created: true }`
2. **Guard skips** — given 1 result from discovery query, ZERO bootstrap calls fire, return `{ created: false, engagementId: existing }`
3. **Guard idempotent resume** — simulate partial state from prior crash (e.g., Tag + Task exist, Engagement NOT), rerun. Assert Step A and B probes find existing, SKIP their creates. Assert Step C fires. Assert D and E fire. ZERO duplicate creates.
4. **Error handling** — simulate Step A failure (e.g., hydra.Tag.createTag rejects). Assert `console.warn('[ONBOARDING_GUARD_FAILURE]')` called with correct `callSiteTag`, AND `MatSnackBar.open` called with 'Dismiss' + 5000ms, AND error re-thrown. Also test Step C failure (Pipeline call), assert snackbar fires and error re-thrown.

Mock shapes derive from real SDK types. Use `jasmine.createSpyObj` for SDK clients, GraphQL service, snackbar. For async mocks, return `Promise.resolve()` or `Promise.reject()` as appropriate.

**Do NOT:** Invent mock shapes. Use real SDK types or sibling specs (vendor-profile.service.spec.ts) as reference. Memory `feedback_tests_passing_against_wrong_shape_mocks.md`.
  </action>
  <behavior>
    - Test 1 (Guard fires): 0 engagement results → all 5 calls executed → returns created: true
    - Test 2 (Guard skips): 1 engagement result → zero calls fired → returns created: false
    - Test 3 (Idempotent resume): Pre-seed Tag + Task exist, Engagement missing → Tag/Task probes hit, create not called; Engagement/Project creates fire; zero duplicates
    - Test 4 (Error handling): Step A fails → console.warn + snackbar + re-throw; Step C fails → snackbar + re-throw
  </behavior>
  <acceptance_criteria>
    - Service imported: `import { OnboardingBootstrapService } from './onboarding-bootstrap.service'`
    - Public method: `async ensureDefaultEngagement(currentOrgId, currentUserId, currentPartyId): Promise<{ engagementId, projectId, created }>`
    - Steps A–E implemented with exact field shapes from bootstrap brief (copy literal values)
    - Object.tag field set in Step C and E: `tag: [{ value: tagId }]`
    - Class IDs: `SME_MART_CLASS_IDS.Engagement` and `SME_MART_CLASS_IDS.SmeMartProject` referenced (no hardcoded UUIDs `7711aa41-` or `c66114a2-` outside pipeline-write.service.ts)
    - Discovery query (Step 0): `Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>") { id, tag { value } }`
    - Idempotency probes run BEFORE each create (Step A probe via searchTags, Step B probe by name, Step C probe via GQL, Step D probe via getResource, Step E probe via GQL)
    - Error handling: Phase 20 pattern — try/catch + console.warn + snackbar + re-throw
    - Snackbar text: 'Onboarding in progress — please retry in a moment.' with 'Dismiss' button and duration 5000
    - All 4 test specs pass: `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` exits 0
    - grep: `grep -n "tagType: 'marketplace'\|tagType: \"marketplace\"" src/app/core/services/onboarding-bootstrap.service.ts` returns ≥1 (Step A)
    - grep: `grep -n "tag: \[{ value:" src/app/core/services/onboarding-bootstrap.service.ts` returns ≥2 (Step C + E)
    - grep: `grep -nE "SME_MART_CLASS_IDS\.(Engagement\|SmeMartProject)" src/app/core/services/onboarding-bootstrap.service.ts` returns ≥2 (no raw UUIDs hardcoded)
    - Negative grep: `grep -n "7711aa41\|c66114a2" src/app/core/services/onboarding-bootstrap.service.ts` returns 0 (class IDs from const only)
    - TypeScript compiles: `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <verify>
    <automated>npm test -- --include='**/onboarding-bootstrap.service.spec.ts' && grep -nE "SME_MART_CLASS_IDS\.(Engagement\|SmeMartProject)" src/app/core/services/onboarding-bootstrap.service.ts</automated>
  </verify>
  <done>
    OnboardingBootstrapService implements the full 5-call recipe (Steps A–E) with per-step idempotency probes, Object.tag at ingest, tagType marketplace, class IDs from const, Phase 20 error pattern. All 4 required test specs pass. Zero hardcoded class UUIDs outside pipeline-write.service.ts.
  </done>
</task>

</tasks>

<verification>
AR-03, AR-06, AR-07, AR-08, AR-10 verification:

| Requirement | Evidence |
|---|---|
| AR-03: Lazy-on-load guard fires | Unit test: 0 engagement results → all 5 calls executed in order with correct args → returns `created: true` |
| AR-06: Object.tag at ingest | grep: `tag: [{ value:` in both Step C and E payloads (≥2 matches). Spec: assert exact shape in test |
| AR-07: tagType marketplace | grep: `tagType: 'marketplace'` in Step A payload. Spec: assert in test |
| AR-08: Class IDs from const | grep: `SME_MART_CLASS_IDS.Engagement` and `SME_MART_CLASS_IDS.SmeMartProject` referenced. Negative grep: no raw `7711aa41-` or `c66114a2-` outside pipeline-write.service.ts |
| AR-10: Failure-resumable | Unit test: pre-seed partial state (Tag + Task exist, Engagement missing) → rerun → tag/task probes hit, creates skipped; Engagement/Project creates fire; zero duplicates |

All 4 test specs required by 27-CONTEXT.md "Test scope" must pass.
</verification>

<success_criteria>
1. `src/app/core/services/onboarding-bootstrap.service.ts` implements all 5 calls (A–E) with idempotency probes.
2. `src/app/core/services/pipeline-write.service.ts` exports `SME_MART_CLASS_IDS`.
3. `src/app/core/utils/slug.ts` contains `slugify(name: string): string`.
4. Object.tag set at ingest time in Steps C and E: `tag: [{ value: tagId }]`.
5. New tags use `tagType: 'marketplace'` (Step A).
6. Class IDs from `SME_MART_CLASS_IDS` const (no hardcoded UUIDs).
7. Error handling per Phase 20 pattern: try/catch + console.warn + snackbar + re-throw.
8. All 4 unit test specs pass: guard-fires, guard-skips, idempotent-resume, error-handling.
9. TypeScript compiles cleanly.
</success_criteria>

<output>
After completion, create `.planning/phases/27-auth-onboarding-guard/27-02-bootstrap-service-SUMMARY.md` with:
- Service public API: `ensureDefaultEngagement(orgId, userId, partyId)`
- 5 steps summary (A–E with key field values)
- Idempotency probes per step
- Error handling (Phase 20 pattern + snackbar text)
- Test coverage: 4 specs (fires, skips, resume, errors)
- AR-06 verification: grep results for `tag: [{ value:` (≥2)
- AR-07 verification: grep results for `tagType: 'marketplace'` (≥1)
- AR-08 verification: grep results for `SME_MART_CLASS_IDS.*Engagement` (≥2), negative grep for raw UUIDs (0)
- No open issues
</output>
