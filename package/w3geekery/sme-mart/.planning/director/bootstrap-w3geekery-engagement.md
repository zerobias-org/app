# Walkthrough: Default ZB Engagement Creation Recipe (W3Geekery as proof-of-concept, then batched)

**Status:** **VALIDATED 2026-04-23.** W3Geekery case completed successfully on UAT. All 5 steps produced materialized records. Canonical UUIDs captured in `DECISIONS.md` ("Default ZB Engagement Bootstrap — W3Geekery"). 18 refinements surfaced during execution and have been folded into this text. Recipe is ready for (a) a second-case manual walkthrough (HIS recommended) and/or (b) encoding as the batch script `.planning/director/batch-prime-engagements-for-existing-orgs.md`.

**Environment:** UAT. Will promote to prod after ZB rebuilds the dev server (separate brief at that time).

**Execution mode:** Director-authored walkthrough. NOT a GSD phase. Executed manually by Clark — Director assists, no agent/executor handoff. Agents will fabricate fields, hallucinate UUIDs, and skip verification — exactly the failure modes the walkthrough exists to prevent. After each step: STOP, verify result, capture UUID, refine this text if anything was off, then proceed.

## Purpose

Establish + validate the **recipe** for creating a customer's default ZeroBias engagement (3PO=Buyer, ZB=Provider) along with their default platform project. Per the auto-onboarding directive: every ZB platform customer always has at least one engagement with ZeroBias as a side-effect of being a customer (compliance requirement). Until ZB platform itself owns this responsibility, SME Mart maintains the invariant via batch backfill (existing orgs) + lazy-on-load reconciliation (new orgs).

**Use this walkthrough to:**
1. Manually run the steps for **W3Geekery as the first proof-of-concept Org**. Validate every step lands cleanly on UAT. **(DONE 2026-04-23.)**
2. Refine the recipe based on real-world friction (wrong field names, missing required fields, link-type mismatches, etc.). **(DONE — 18 refinements folded.)**
3. Now that the recipe is green for W3Geekery, this walkthrough BECOMES the basis for:
   - The batch operation brief (`.planning/director/batch-prime-engagements-for-existing-orgs.md`) that runs against every existing platform Org
   - The lazy-on-load reconciliation guard in SME Mart's auth/routing layer (Phase 27 scope) for orgs added after the batch runs
   - The eventual ZB platform-side feature (long-term) when SME Mart absorbs into platform

W3Geekery is just one of N orgs — the recipe doesn't change for the others.

## Conceptual model — read this twice

This creates the **default ZeroBias engagement** for an org: Org is the Buyer (customer of ZB platform services); ZeroBias is the Provider. The engagement is distinguished from marketplace engagements via `engagementTag = "default-project"` (string field on the Engagement class — the sole default-vs-marketplace discriminator).

**This is NOT a "Buyer-org as dev-services provider" engagement.** That would be a SECOND engagement (Buyer-org=Provider, ZB=Buyer) modeling a contractor relationship. Out of scope for this walkthrough and v1.4. Customers can create as many additional marketplace engagements as their business requires (with vendors, auditors, other 3POs) via the existing Create Engagement UI; that is a separate concern. The default ZB engagement is the only one created automatically/invariantly.

**Schema note:** The `Engagement` class (`schema/package/w3geekery/smemart/classes/Engagement.yml`) has NO provider field. It only models `buyerZerobiasOrgId` + `buyerZerobiasUserId`. Per Plan 075 migration (2026-04), the class no longer has `category`, `budgetType`, `budgetMin`, `budgetMax`, or `timeline` either — those moved to `SmeMartProject`. The "ZeroBias as provider" relationship is encoded indirectly via `engagementTag` + `name`. **Naming convention (locked 2026-04-23, see DECISIONS.md):** `"<Buyer> <- <Provider>"` ASCII reverse-arrow, buyer-first positional. Buyer is the 1st-class citizen — owner of the engagement and projects, the Demand side. Supplier exists to satisfy Buyer; supply flows toward buyer; arrow points toward the buyer. For this walkthrough: `"W3Geekery <- ZeroBias"` (W3Geekery is the buyer/Demand; ZeroBias is the supplier of platform services).

**Meta-tracker is per-engagement scaffolding, NOT a Req↔Sat entangled task.** Step B creates a single-party platform Task that anchors the engagement. This pattern exists for **every** engagement (every customer Org's default ZB engagement gets one — auto-created by the batch / lazy reconciliation / future platform feature). It lives on the engagement-OWNER side.

The meta-tracker is **NOT** an instance of the Req↔Sat (Demand/Supply) twin pattern that is the canonical opt-in cross-party transparency seam (memory `project_sme_mart_transparency_invariant.md`, BACKLOG CE4). Req↔Sat tasks are explicitly twinned cross-org with independent RAG status per party-role and party-scoped visibility. The meta-tracker has none of that — it's internal coordination scaffolding for the engagement-owner side. If specific cross-org coordination later needs formal Req↔Sat treatment, that twin gets created separately under the engagement — it does NOT replace or absorb the meta-tracker.

**Sub-tasks under the meta-tracker:** Initially **none.** Brian-ask items (pricing, ToS, opt-in vs auto, gate-vs-delete) are product-wide v1.4 concerns that belong in the v1.4 phase briefs, NOT in any specific engagement. Sub-tasks get added later as actual Buyer↔ZeroBias coordination items arise.

**Two Engagement identifiers exist on the platform** (refinement #16):
- **Class-schema external UUID** — what Pipeline.receive writes and what our recipe uses for GQL queries and cross-references.
- **Internal Object UUID** — platform-internal bookkeeping; visible via `boundaryObjectSearch`; do NOT use in the recipe except for diagnosis.
Batch idempotency check: GQL filter on `engagementTag = "default-project"` AND `buyerZerobiasOrgId = <orgUUID>` to see if the default engagement already exists for an org. NEVER use hydra `getResource` on class-schema entities — they aren't in the hydra Resource table.

## Pre-execution checks (do all before any MCP write)

### 1. Profile and lock
- **MCP profile:** `uat-clark@w3geekery` (per `.planning/phases/neon-via-hub-wireup.md`). Verify via `meta.listProfiles`.
- **Profile lock:** `~/.claude/scripts/zb-mcp-profile-lock.sh check uat-clark@w3geekery`. If safe: `acquire uat-clark@w3geekery <purpose-slug>`. Release at end with `release`.
- **Profile switch (only if check shows different active):** `meta.switchProfile`.

### 2. Org IDs — verified consistent across prod and UAT (refinement #1)
Org UUIDs match prod for both W3Geekery + ZeroBias. No UAT-specific lookup needed beyond confirmation.
- **W3Geekery org ID:** `cd7105df-523d-5392-9f9a-3f83d3f30107` (same on prod and UAT).
- **Clark's W3Geekery user UUID:** `3da9385a-5d15-4d19-84ab-e1c9ce8d84ed` (buyer-side user — Clark's user record on the W3Geekery org, NOT a ZB-org user).
- **ZeroBias org UUID on UAT:** `57c741cf-a58e-5efc-bf2f-93c4f6cf76ec` (provider — not stored on Engagement since schema has no provider field; used only for the `name` field in the `<Buyer> <- ZeroBias` convention).
- For OTHER orgs in the batch run, look up the buyer org's UUID via `dana.Org.search` or similar and the buyer-user UUID via `dana.User.search` filtered to the buyer org. Do NOT assume.

### 3. Pipeline ID
- **Current SME Mart receiver pipeline (UAT):** `43f08afd-7ab9-4e99-a93c-619c46adaabe` (refinement #2). The older `f6d1f579-fe02-4158-b99e-a55113fd70cb` was the v1.2 carry-forward; it was recreated at the 2026-03-30 cutover.
- No throwaway health-check push is needed (refinement #3) — Step C is the real test. If Step C fails to materialize, the pipeline is unhealthy or the class ID is wrong; diagnose then.
- If running on prod or a future UAT rebuild, re-verify via `platform.Pipeline.list` (filter by name containing "sme-mart" or "smemart").

### 4. Class IDs (UAT class UUIDs)
- `Engagement` class UUID — from memory `project_sme_mart_schema_live.md`. Class IDs are deterministic across environments per memory `project_gql_class_ids_deterministic.md`, so prod and UAT share the same ID for each class.
- `SmeMartProject` class UUID — same source.
- Confirm both via `mcp__zerobias__zerobias_describe` on the Pipeline.receive payload schema before the first push. Do NOT trust stale memory for schema field lists — Plan 075 moved fields; always cross-check via `platform.Class.getClass`.

### 5. Activity ID for ZB platform Tasks — use global catalog (refinement #8)
- `Task.create` requires `activityId` (per memory `ZeroBias MCP Parameter Patterns`).
- No W3Geekery-owned development activity exists on UAT (checked during walkthrough). Use the global catalog activity: **`aha1` — "Ad Hoc - One person"**, UUID `e15830c8-4274-4d67-bf9b-c22b60001e32`.
- Same global activity applies to all other orgs in the batch run — don't create per-org activities unless a specific use case needs one.

### 6. Party ID for task assignment
- Tasks need `assigned` = a party UUID, NOT a principal UUID (memory `feedback_task_assigned_party_id.md`).
- Get Clark's party via `Party.getMyParty` while connected to the W3Geekery profile.
- For the batch run against other orgs: requires a party UUID from the buyer-org side for each engagement. Strategy TBD in the batch brief — may use a ZB-side service-account party if no buyer-side admin is reachable, or leave `assigned` unset where platform allows.

## Resources to create (in order)

### Step A — Create ZB platform tag for the engagement
Engagement records reference a `zerobiasTagId`. Create the tag first.

**Call:** `hydra.Tag.createTag`

**Fields:**
- `name`: `sme-mart.eng.<buyer-org-slug>-default-zb` (e.g., `sme-mart.eng.w3geekery-default-zb`). Per-buyer-org slug + `default-zb` suffix; follows the per-engagement-tag pattern from demo seeder.
- `ownerId`: buyer org UUID (org-scope tag, per memory `ZeroBias Tag API`).
- `description`: `"Tag for <Buyer>'s default ZeroBias platform-services engagement. Auto/invariant compliance-driven engagement that every ZB platform customer Org has by default."`

**Note on `type`:** Hydra Tag `type` defaults to `"other"` (refinement #9). Fine — SME Mart filters on `engagementTag` (string) + `zerobiasTagId` (UUID reference), not on Tag `type`.

**Capture:** `zerobiasTagId` UUID. Used in Step C and Step D.

**Verify:** `hydra.Tag.getTag(<id>)` returns the created tag with the expected name and owner.

### Step B — Create ZB platform "engagement coordination" Task (the per-engagement meta-tracker)
This task IS the conceptual meta-tracker AND the engagement's `zerobiasTaskId`. There is no separate "Task 1" — the engagement task IS Task 1.

**Pattern note:** Every engagement has one of these, owned by the engagement-owner side. The meta-tracker is **permanent** (outlives any milestone) — naming must not include v1.4 or other transient scope (refinement #4). This is NOT a Req↔Sat entangled task — it's single-party engagement-side scaffolding.

**Call:** `platform.Task.create` with body nested under `newTask`.

**Fields:**
- `activityId`: `e15830c8-4274-4d67-bf9b-c22b60001e32` (global `aha1`; see pre-check 5).
- `ownerId`: buyer org UUID (per memory `feedback_w3geekery_task_ownerid.md`).
- `name`: `"Engagement coordination — <Buyer> <- ZeroBias"` (e.g., `"Engagement coordination — W3Geekery <- ZeroBias"`). Generalized, no milestone hardcoding.
- `description`: `"Parent task for all <Buyer>↔ZeroBias coordination on the default ZB platform-services engagement. Permanent scaffolding — outlives any specific milestone. Sub-tasks get added as actual coordination items arise (paid deliverables, escalations, ZB-side asks). This task is linked to the Engagement Resource via the engagement's zerobiasTagId (see Step D)."`
- `priority`: 500 (High).
- `assigned`: buyer-side party UUID from pre-check 6.
- `approvers`: `[<same party UUID>]`.
- `notified`: `[<same party UUID>]`.
- `links`: `[]` (no resource links at create time; tag-linkage happens in Step D).

**Note on status:** Task default status is `todo` (refinement #10). No `transitionId` needed for first transition.

**Capture:** Task UUID (and its human-readable `code`, e.g., `aha1-6`). Used as `zerobiasTaskId` on the Engagement (Step C).

**Verify:** `platform.Task.get` (or `zerobias_execute` equivalent) confirms the task exists with the expected fields.

### Step C — Create the Engagement record
**Class:** `Engagement` (UAT class UUID from pre-check 4).

**Push via:** `platform.Pipeline.receive` against the pipeline from pre-check 3. Pipeline.receive is FULL-REPLACE — push the complete record, never a partial.

**Fields (canonical set after Plan 075 migration — refinement #6):**
- `id`: generate a UUID (e.g., `crypto.randomUUID()`).
- `name`: `"<Buyer> <- ZeroBias"` (e.g., `"W3Geekery <- ZeroBias"`). Per naming convention.
- `description`: `"Default ZeroBias platform-services engagement for <Buyer>. <Buyer> is the customer (Buyer/Demand); ZeroBias is the platform-services provider (Supplier). Compliance-driven invariant — every ZB platform customer has at least one engagement with ZeroBias by default."`
- `buyerZerobiasUserId`: buyer-side user UUID from pre-check 2.
- `buyerZerobiasOrgId`: buyer org UUID from pre-check 2.
- `status`: `"in_progress"`.
- `engagementTag`: `"default-project"` (the STRING tag — Brian's directive term; the sole default-vs-marketplace discriminator at query time. Distinct from `zerobiasTagId` which is the hydra Tag UUID created in Step A.)
- `zerobiasTagId`: UUID from Step A.
- `zerobiasTaskId`: UUID from Step B.
- `dateCreated`: YYYY-MM-DD (date type, NOT datetime — refinement #11). Today's date.
- `dateLastModified`: YYYY-MM-DD. Today's date.

**Fields REMOVED per Plan 075 (do NOT include — will be rejected or ignored):** `category`, `budgetType`, `budgetMin`, `budgetMax`, `timeline`, `createdAt`, `updatedAt`. These moved to `SmeMartProject` or were dropped entirely. The earlier "Platform" category proposal is moot — no category field exists on Engagement (refinement #7).

**Note on Pipeline.receive `tagIds` param:** Does NOT tag the ingested Object (refinements #15, #17). Semantics still unclear; possibly tags the batch-job record only. Do NOT rely on `tagIds` for Object discovery. See "Tag-at-ingest" section below for Kevin's clarification on how Object tagging actually works.

**Verify:** GQL query using RFC4515 filter syntax (refinement #12): `Engagement(id: ".eq.<uuid>")`. NOT GraphQL `filter: { id: { EQ: ... } }`. Confirm record materialized within 30s with all fields. If GQL doesn't return the record, the pipeline is unhealthy or the class ID is wrong — STOP and diagnose before proceeding.

### Step D — Link the Engagement Task to the Engagement via shared tag (refinement #13)
**FULL REWRITE from earlier drafts.** Previous draft proposed `Task.update(links=)` or `hydra.Resource.linkResources` — both wrong. Tasks are hydra Resources; Engagement-class records live in the AuditgraphDB Class Objects table, NOT the hydra Resource table. Cross-realm `linkResources` fails on FK validation (refinement #13).

**Correct mechanism:** Tag the task with the same hydra Tag that the Engagement references via `zerobiasTagId`. SME Mart queries tie them together via the shared tag.

**Call:** `hydra.Resource.tagResource(<Engagement Task UUID from Step B>, [<zerobiasTagId from Step A>])`.

**Note:** One `tagResource` call achieves bidirectional discoverability (refinement #14). The tag is queryable from either direction: from the tag you can list tagged resources; from the task you can list its tags. Memory `feedback_task_links_bidirectional.md` (which says links must be created on both sides) does NOT apply to tag-based linkage — that memory is about explicit hydra link types, not tags.

**Verify:** `hydra.Resource.getResource(<taskId>)` returns the task with the engagement Tag present in its tag list.

### Step E — Create the SmeMartProject record (default project for the engagement)
**Class:** `SmeMartProject` (UAT class UUID from pre-check 4).

**Important:** `SmeMartProject` is overloaded — same class is used for RFPs, pilots, and real projects. Distinguish via `projectType`. Valid values: `'rfp' | 'pilot' | 'project'`. For the default-ZB platform-services project, use `'project'`.

**Push via:** `platform.Pipeline.receive`.

**Fields (adapted from demo seeder `scripts/demo/helpers.ts` for non-RFP):**
- `id`: generate a UUID.
- `name`: `"SME Mart Platform Development"` (for W3Geekery). For other orgs, choose a name that describes "default platform project for <buyer>".
- `description`: `"Default project for <Buyer>'s ZeroBias platform-services engagement. Catch-all project where <Buyer>↔ZeroBias platform-related work, support requests, and coordination items live. Linked to the default-ZB engagement (id=<Engagement UUID from Step C>). Per Brian's directive (3P plan), this is the canonical 'project-zerobias-platform' that every customer has."`
- `status`: `"active"`.
- `projectType`: `'project'`.
- `engagementId`: Engagement external UUID from Step C.
- `isInvitationOnly`: `false`.
- `wizardStep`: `999` (sentinel for "complete" — used by demo seeder for non-wizard records).
- `dateCreated`: YYYY-MM-DD (date type).
- `dateLastModified`: YYYY-MM-DD (date type).

**Fields to consider (refinement #5):** `category`, `budgetType`, `budgetMin`, `budgetMax`, `timeline` now live on SmeMartProject (moved from Engagement per Plan 075 — resolves the earlier Step E/C category-mismatch concern by moot). Values for the default-ZB project are TBD by the Phase 26 brief (ZB-as-provider seed with placeholder tiers). For the W3Geekery walkthrough these were left unset; Phase 26 will define the canonical values.

**Verify:** GQL query with RFC4515 filter: `SmeMartProject(id: ".eq.<uuid>")`. Confirm `engagementId` is set and `projectType === 'project'`.

## Tag-at-ingest — Kevin's clarification (2026-04-23, re-frames backlog 005)

**Context:** During the walkthrough, Step G investigation concluded `platform.Object.tag` was a write-only stub (refinement #18) because the post-ingest tag call appeared to be silently rejected with no read API to confirm. Kevin (CIO) clarified via Slack same day:

- **Tags are immutable once the Object is in AuditGraph.** The post-ingest `platform.Object.tag` call was rejected silently — that's why nothing was visible.
- **Tags must be set AT INGEST TIME** in the Pipeline.receive data payload, populating the inherited `Object.tag` field on each record.
- **Three tagging axes:** (1) tag-the-pipeline, (2) tag-the-connection, (3) tag-the-object. Option 3 is what SME Mart wants for discovery by tag.

**Implications:**
- **No schema PR needed for backlog 005.** The `Object` base class already exposes the `tag` field (`propertyId: 65aadece-...`, fieldName `zerobias.zerobias.platform.schema.tag`, dataTypeName `tag`, `multi: true`). Just USE it at ingest time.
- **W3Geekery walkthrough records have NO tags applied** (we passed batch-level `tagIds` to Pipeline.receive, which doesn't tag Objects; we never populated `data[i].tag`). Lean: accept for the proof-of-concept. Task↔Engagement bridging via shared `zerobiasTagId` + Step D's `tagResource` call still works.
- **Open — field shape experiment (~30 min, fresh MCP session):** Push a throwaway Engagement-class record with various `tag` payload shapes (UUID array? tag-resource refs? tag objects with name/ownerId?); query back; document the recipe for the batch script. This runs against a disposable test record, not a real customer engagement.
- **Open — READ endpoint:** Pending Kevin's reply on the read-side API name for Object tags. Without a read API, tags-as-data-discovery doesn't actually help us.

**Once the field shape is known,** update Step C to include the correct `tag: [...]` value in the Pipeline.receive payload. Then the batch script gets tag-at-ingest for free on every new engagement it creates.

## Completion status

**W3Geekery walkthrough complete 2026-04-23.** Canonical artifacts:

| Artifact | UUID | Notes |
|---|---|---|
| Hydra Tag (`zerobiasTagId`) | `a81cd320-243e-44eb-bdd9-9824019ef3dd` | Name: `sme-mart.eng.w3geekery-default-zb` |
| Engagement Task (`zerobiasTaskId`) | `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` | Code: `aha1-6`. Tagged with engagement Tag. |
| Engagement (external UUID) | `746010b7-dc99-436b-9142-8c4b85c5e623` | Use this for GQL queries and cross-refs |
| Engagement (internal Object UUID) | `f5361821-4beb-4e1b-8d92-04bc243fa63a` | Platform-internal; diagnosis only |
| SmeMartProject | `ea4db55f-2c57-4567-a1be-6e7fd1a210bf` | Name: "SME Mart Platform Development" |

See DECISIONS.md "Default ZB Engagement Bootstrap — W3Geekery" for the full rationale, pipeline ID, boundary UUID, and 18-refinement log.

## Next actions (post-W3Geekery)

1. **Object.tag field shape experiment** (~30 min, fresh MCP session, `uat-clark@w3geekery` profile lock) — validate what shape the `tag` field expects in Pipeline.receive payload. Documents the recipe for batch script.
2. **Walk HIS as a second proof-of-concept** (~45 min, manual) — confirms recipe generalizes beyond W3Geekery before automation. Recommended at least once before encoding batch.
3. **Encode batch script** (`.planning/director/batch-prime-engagements-for-existing-orgs.md`) — after HIS validation + Object.tag experiment. Script loops over existing platform Orgs, performs Steps A-E plus the validated tag-at-ingest payload.
4. **Release MCP profile lock:** `~/.claude/scripts/zb-mcp-profile-lock.sh release uat-clark@w3geekery <purpose-slug>`.

## Failure handling and rollback

- **Step A (tag creation) fails:** STOP. Tag must exist before Engagement. Diagnose hydra.Tag error; common causes: missing/wrong `ownerId`, name conflict.
- **Step B (engagement task) fails:** STOP. Task is needed for the Engagement's `zerobiasTaskId`. Diagnose `Task.create` error; commonly the `activityId` is wrong or the `assigned` party UUID is wrong.
- **Step C (Engagement) fails:** Tag and Task exist orphaned. Either re-attempt Step C with corrected fields, OR leave the orphans (they're low-harm). If Step C fails with an unknown-field error, cross-check via `platform.Class.getClass` — Plan 075 removed fields and stale memory may be misleading.
- **Step D (tag the task) fails:** Tag and Task exist but not linked. Re-attempt is safe — `tagResource` is idempotent. If it keeps failing, diagnose via `hydra.Resource.getResource(<taskId>)` to see current tag state.
- **Step E (SmeMartProject) fails:** Engagement exists. Diagnose Project field error; common cause is wrong `projectType` value or required-field omission. Re-attempt is safe. If you want to fully revert, push the Engagement again with `markDeleted: true`, then delete tag and task.

## Out of scope for this brief

- Andrey subdomain provisioning (Clark direction: not a phase, will happen via informal nag).
- Synthetic ACME demo seeder (deferred to v1.5 backlog).
- Any v1.5+ Linked Project / multi-3PAO concerns (CE1+ in BACKLOG.md).
- Buyer-as-dev-services-provider engagements (W3Geekery=Provider, ZB=Buyer, or similar) — separate engagements, separate briefs if/when created.
- Promoting this engagement to prod — happens after ZB rebuilds the dev server. Separate brief at that time.
- Object.tag field-shape experiment — its own ~30-min side task; feeds back into Step C when done.
- HIS second-case walkthrough — if done, would be a sibling brief (not an edit to this one). This brief stays W3Geekery-focused; the batch brief is where the general recipe lives.
