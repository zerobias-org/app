# Director Decisions

## Phase 20 Telemetry `callSiteTag` Uses Post-Edit `await` Line Number
**Date:** 2026-04-29
**Decision:** The `callSiteTag` parameter passed to `pipelineWrite.pushEntity` / `pushEntities` / `deleteEntity` uses the line number where the `await` call lands AFTER the try/catch wrap, not the original pre-edit line number from AUDIT.md. Format remains `<service>.service:<line>`. Going forward, future audit-and-remediate phases that introduce telemetry tags follow the same convention: post-edit line, not audit-row anchor.
**Why:** The earlier Director handoff for Wave 2 said "explicit `callSiteTag` matching `<service>.service:<original-line>`" intending audit-row anchors for telemetry stability. In practice, the first three Wave 2 services committed (`reviews.service:193/228`, `engagements.service:205`, etc.) already drifted from the AUDIT row references — the executor used post-edit lines because that's the line you actually see in the file when investigating a CloudWatch hit. The Wave 2 finish batch (`org-document`, `sme-mart-board`, `note-hierarchy`, `sme-mart-workflow`) continued the post-edit convention. Amending 4 of those 6 commits to backfill audit-row lines would (a) fight the established pattern across the rest of Wave 2, (b) cost churn for marginal benefit since the tag's job is uniqueness + searchability + roughly-locating-the-source — not byte-perfect AUDIT-row anchoring. The AUDIT row stays as the immutable design-time reference; the telemetry tag is a runtime locator pinned to whatever the file currently looks like. They serve different jobs and don't need to match.
**Anti-pattern:** (a) Amending merged Wave 2 commits to "make the tags match AUDIT.md rows" — churn for no functional benefit. (b) Future agents seeing this drift in deployed code and "fixing" the tags to match AUDIT row references — that's backwards: the tag should reflect the current file state. (c) Demanding AUDIT-row line stability in future remediation phases — write the brief with "post-edit line" or just "the line of the await call" instead.

## Marketplace Monetization Is a 3% Transactional Toll Only (current model)
**Date:** 2026-04-28 (Brian meeting)
**Decision:** SME Mart's monetization is a single-digit (~3%) "toll-booth" cut on every marketplace transaction — AWS / Apple App Store / Shopify pattern. Sellers publish their own pricing/charge models into SME Mart; buyers transact through the marketplace. Selling outside the marketplace is **banned + large fines** for participants. SME Mart itself charges no listing fees, no tier fees, no per-seat fees right now. **Tier-based listing fees are a possible future** ("e.g., ~$100/mo to post an app, possibly favoring smaller businesses") but explicitly out of scope until "obvious when we get there." There are no SME-Mart-internal pricing tiers (Free/Pro/Enterprise). Sellers define their own pricing on each ServiceOffering.
**Why:** Brian directive 2026-04-28. The earlier brian-content-brief sections 1, 2, and 5 (tier structure, tier pricing, tier marketing copy) were premised on SME Mart having internal tiers — wrong premise. The toll-booth model means the platform is invisible to pricing; sellers price their offerings, the platform takes 3%, done.
**Anti-pattern:** (a) Director or Claude reintroducing "SME Mart Free / Pro / Enterprise tiers" in any planning artifact — they don't exist. (b) Building a tier-display banner on the engagement/project board (Phase 29's old scope) — there's nothing to display. (c) Treating the ServiceOffering pricing field as a SME-Mart-imposed tier instead of seller-defined. (d) Conflating "ZB platform per-app pricing" (yes, exists per the ToS architecture decision) with "SME Mart marketplace tiers" (no, doesn't exist). Different things.

## Per-App ToS Architecture — Two-Layer (Engagement MSA + Per-App ToS)
**Date:** 2026-04-28 (Brian meeting)
**Decision:** ZeroBias platform terms-of-service follows AWS's two-layer pattern:
- **Engagement-level MSA** — required to have a ZB account at all. Analog: AWS account-level ToS. One MSA per ZeroBias-org relationship.
- **Per-app/product ToS + consumption model + price model** — every ZB platform offering (Value Manager, Governance, **SME Mart itself**, etc.) is its own packaged product with its own ToS, consumption rules, and chargeback model. ZB will end up with ~30 declarative product packages.

**SME Mart's ToS is one of those per-app ToS records.** It is NOT an SME-Mart-internal feature; it's an architectural concern for the entire ZB platform. SME Mart consumes the per-app ToS layer once it exists at the platform level.

**Where the ToS content / EULA / MSA actually gets authored:** in the **W3Geekery↔ZeroBias engagement project notes** — not in SME Mart code or planning. Specifically, when the W3Geekery↔ZB engagement is stood up (W3Geekery as provider of dev services, ZB as buyer), Clark creates a dedicated workspace inside that engagement for "supporting all ZeroBias apps — content/assets gathering." The per-app ToS / EULA / MSA requirement-tasks for SME Mart, Value Manager, Governance, etc. all live in that one workspace. Brian responds to those tasks (eventually via his own Claude). One workspace covers content for all ZB apps.

**Open meta-question (unresolved):** Does the requirement-task carry the content (Brian writes the ToS into the task body), or does the task point to an API that Brian writes to? Brian leans toward "task is a guide that *includes* the API for satisfaction." Worth resolving before building the requirement-task UI for this workflow. Tracked in BACKLOG / brian-content-brief follow-ups.
**Why:** Brian directive 2026-04-28. The earlier brian-content-brief Section 3 ("Terms of Service / Privacy / EULA") presumed SME Mart owns its own ToS — wrong scope. ToS lives at the platform-app layer, with content authored in the W3Geekery↔ZB engagement workspace, dogfooding the construct.
**Anti-pattern:** (a) Adding a ToS-link surface or ToS upload UI to SME Mart in v1.4 or v1.5 — that's the platform's job, not SME Mart's. (b) Authoring SME Mart's own ToS in the SME Mart repo or planning directory — write it as a requirement-task in the W3Geekery↔ZB engagement workspace (when stood up). (c) Treating the engagement-MSA as the same thing as the per-app ToS — they are two layers, both required. (d) Trying to ship Phase 29's "ToS link surface" in v1.5 without the platform-side per-app ToS layer existing first — the surface has nothing to surface yet.

## Pilot vs Production Project Type Is a Type Flip on the Same Project
**Date:** 2026-04-28 (Brian meeting)
**Decision:** New ZeroBias signups land in a **pilot project** with thinner engagement requirements (no banking, lighter MSA). When the pilot graduates — additional details collected (banking, fuller MSA), Buyer commits to permanent — the **same project entity transitions from "pilot" type to "production" type**. The project is preserved across the transition. ID stays. History stays. Subprojects, tasks, workspaces, transparency entanglements — all stay. Only the `projectType` discriminator flips, and the additional engagement-level data fields populate.

**Eventually onboarding adopts SME Mart's engagement→project flow** — replaces the current website-CRM-trial → manual-setup path. Every signup gets an org ("nobody will not have an org"), and every org gets a default pilot project. Graduation is a SINGLE action that flips type + collects fuller data.
**Why:** Brian directive 2026-04-28. The natural alternative — create a new "production" project at graduation, archive the pilot — would lose history, break links, and require migration plumbing. Type-flip preserves everything.
**Anti-pattern:** (a) Modeling pilot vs production as different `Project` schema CLASSES — they must be the same class with a `projectType` discriminator. (b) Creating a new project record at graduation — destroys continuity. (c) Building a "promote pilot to production" wizard that copies data into a new entity — wrong shape. The wizard should just collect the additional fields and flip the type. (d) Forgetting that demo-org seed engagements (W3Geekery, HIS, Work Worlds, etc.) need to model the pilot type explicitly — most demo data should ship as type=pilot until the org has gone through the graduation flow.

## Brian-W3Geekery Collaborative Spec Lives in Project Notes (Dogfooding Directive)
**Date:** 2026-04-28 (Brian meeting)
**Decision:** Once the W3Geekery↔ZeroBias engagement + first project are live, **the project's notes app is the canonical place** where collaborative specification between Brian Hierholzer Inc. and W3Geekery happens. NOT Slack, NOT Director artifacts under `.planning/director/`, NOT brian-content-brief docs. Brian quote: "Let's try to use the construct that we're building so we can jump into the construct to build the construct." Brian going Claude-enabled soon — his Claude will respond to tasks/notes in the project, dogfooding the engagement-task-flow as the collab channel itself.
**Why:** Brian directive 2026-04-28. Builds confidence in the construct by USING the construct for the most important conversation (CEO ↔ contractor on platform direction). Also forces the construct to actually work — if the project-notes flow can't carry Brian's design conversations, that's a real bug to surface, not a theoretical UX concern.
**Anti-pattern:** (a) Continuing to file Brian-questions in `.planning/director/brian-content-brief-*.md` after the W3Geekery↔ZB project is live — those should migrate to the project-notes app. (b) Asking Brian for design input via Slack DM when the project-notes flow exists. (c) Treating Director artifacts as the system of record for Brian↔W3Geekery decisions — they're the system of record for SME Mart milestone state, not for cross-org spec conversation. (d) Carrying the brian-content-brief pattern forward into v1.5+ without migrating to project-notes. **Transitional rule:** until the W3Geekery↔ZB engagement+project is live (target: end of week 2026-04 per Action Item #3), keep using the existing brief; AFTER it's live, new Brian asks file as project-notes tasks, not brief sections.

## Platform-Assigned Class IDs Are Not Deterministic UUID v5
**Date:** 2026-04-28
**Decision:** SME Mart class IDs are assigned by the platform's class-registration pipeline (dataloader / catalog publish), **not** derived as `uuidv5(schema-namespace, className)`. Any const in `pipeline-write.service.ts` carrying the comment `(deterministic UUID v5 from schema)` is suspect and must be verified against `platform.Class.getClass(<name>)` before being trusted.

**Why:** 2026-04-28 audit of all 23 entries in `SME_MART_CLASS_IDS` against UAT (`platform.Class.getClass`) found 21 matches and **2 fictional consts** that do not correspond to any registered class:
- `MarketplaceProfileItem`: codebase `ee1e68b7-...` is fictional; canonical platform-assigned ID is `7bcf86a5-91dc-520d-b9bf-e308b1078d46`.
- `EngagementVettingItem`: codebase `66fa174f-...` is fictional; canonical is `21f5841f-dd27-53ef-a0f5-6a816ec7f7e1`.

Both bug consts are commented as `(deterministic UUID v5 from schema)`. The UUID v5 derivations the original Plan 041 / Plan 063 authors computed do not match what the platform actually assigned at registration time. Pipeline.receive returns `"No such Class"` for both fictional values. Silent-failure pathways (fire-and-forget `.catch` in `vendor-profile.service` and `vetting.service`) hid this for the entire life of those plans — ZERO MPI writes and ZERO vetting-item writes through `PipelineWriteService` have ever landed on UAT.

**How to apply:**
- **Immediate:** Plan 26-04 (handed to gsd-plan 2026-04-28) corrects both consts in `pipeline-write.service.ts:33,36`, drops the misleading UUID-v5 comments, adds tests bound to canonical IDs, and verifies live writes via `vendor-profile.create` + `vetting.initializeVetting`.
- **Systemic:** Phase 20 (Fire-and-Forget Audit, in v1.3 roadmap as TBD) is now confirmed-needed, not theoretical — its watch pattern (errata 011) has two real confirmed instances. Phase 20 should be planned and executed before Phase 27 (which adds the auth gate + onboarding routing whose lazy-engagement-guard will rely on round-trip writes succeeding).
- **Verification rule for new entity types:** When adding a new class to `SME_MART_CLASS_IDS`, the plan's verification step MUST include `platform.Class.getClass(<name>)` and assert `classInfo.id === <const>`. Don't trust schema-derivation assumptions.
- **Comment hygiene:** When fixing or adding consts, drop any "deterministic UUID v5" framing. Use "platform-assigned (verified via platform.Class.getClass)" with the verification date.

**Audit results (kept for reference, all verified 2026-04-28 via platform.Class.getClass):**

| Class | Codebase const | Platform-assigned | Match |
|---|---|---|---|
| Engagement | `7711aa41-...` | `7711aa41-...` | ✅ |
| Bid | `ccddd2e5-...` | `ccddd2e5-...` | ✅ |
| BidResponse | `a024a0b5-...` | `a024a0b5-...` | ✅ |
| ServiceOffering | `ff689173-...` | `ff689173-...` | ✅ |
| Note | `fe7c58a9-...` | `fe7c58a9-...` | ✅ |
| NoteFolder | `4d50975e-...` | `4d50975e-...` | ✅ |
| Review | `ef5d821a-...` | `ef5d821a-...` | ✅ |
| SmeMartDocument | `e1497ca8-...` | `e1497ca8-...` | ✅ |
| SmeMartProject | `c66114a2-...` | `c66114a2-...` | ✅ |
| SmeMartBoard | `20be589b-...` | `20be589b-...` | ✅ |
| SmeMartActivity | `36405d75-...` | `36405d75-...` | ✅ |
| SmeMartWorkflow | `295938d2-...` | `295938d2-...` | ✅ |
| SmeMartTask | `e15f1e0a-...` | `e15f1e0a-...` | ✅ |
| ProjectPrd | `920fca70-...` | `920fca70-...` | ✅ |
| PrdSection | `d30445f3-...` | `d30445f3-...` | ✅ |
| ProjectPlan | `bc6159da-...` | `bc6159da-...` | ✅ |
| PlanMilestone | `ac1a1cc8-...` | `ac1a1cc8-...` | ✅ |
| **EngagementVettingItem** | **`66fa174f-...`** | **`21f5841f-...`** | ❌ FICTIONAL |
| **MarketplaceProfileItem** | **`ee1e68b7-...`** | **`7bcf86a5-...`** | ❌ FICTIONAL |
| RfpInvitation | `941cf01b-...` | `941cf01b-...` | ✅ |
| DocumentTemplate | `d2493bf7-...` | `d2493bf7-...` | ✅ |
| DocumentInstance | `3e1d232f-...` | `3e1d232f-...` | ✅ |
| FormSubmission | `179bd4b1-...` | `179bd4b1-...` | ✅ |

**Related:**
- Errata 023 — full root-cause + fix-path narrative
- Errata 011 — fire-and-forget masks errors (the parent watch pattern)
- Phase 20 brief — fire-and-forget audit (now urgent, not theoretical)

---

## MarketplaceProfileItem Replace Semantics + Cleanup Residue
**Date:** 2026-04-27
**Decision:** Pipeline.receive replace key for `MarketplaceProfileItem` (class `7bcf86a5-91dc-520d-b9bf-e308b1078d46`) is **`id` only**. Per-section saves are safe — ingesting one MPI record does NOT clobber other MPI records of the same class with different ids.

**Why:** Phase 28 form save flow needs to write per-field MPI records keyed by `(orgId, section)` without read-modify-write fan-out. This was the gating empirical question for Phase 28 design. Validated via UAT experiment 2026-04-27: ingested two records (`mpi-test-a-cd7105df` / section=test_a / data=A and `mpi-test-b-cd7105df` / section=test_b / data=B), both visible. Then ingested only `test_a` with data=A2; `test_a` updated, `test_b` survived.

**How to apply:**
- Phase 28 save flow: one `Pipeline.receive` batch per save click; data array contains one record per dirty form field; each record has a deterministic id derived from `(orgId, section)`.
- Recommended id format: `mpi-<orgId>-<section>` (id field is `string`, not strict UUID). Example: `mpi-cd7105df-523d-5392-9f9a-3f83d3f30107-legal_name`.
- Pre-fill flow: one GQL query — `MarketplaceProfileItem(orgId: ".eq.<id>") { section, data }` — group client-side by `section`, project to form model.

**Test residue on UAT (cleanup queue):**
- `mpi-test-a-cd7105df` (section=test_a, data=A2)
- `mpi-test-b-cd7105df` (section=test_b, data=B)
- Plus the pre-existing TAG-SHAPE-TEST-C SmeMartProject (`64047b6c-...`)
- Cleanup path: include all three in `markDeleted` of a future Pipeline.receive batch (one batch per class). Pipeline.receive requires non-empty `data`, so cleanup goes alongside the next real ingest.

## W3Geekery Object.tag Remediation
**Date:** 2026-04-27
**Decision:** Re-ingest the W3Geekery default-engagement records (`Engagement` `746010b7-...` and `SmeMartProject` `ea4db55f-...`) via Pipeline.receive with the validated Object.tag payload `tag: [{value: "a81cd320-..."}]`. Closes the gap accepted at walkthrough time (refinement #18 / line 188 of bootstrap brief).

**Why:** The Phase 25 GQL audit confirmed `Engagement.tag = null` and the default SmeMartProject's `tag = null` — leftover from the original walkthrough's use of batch-level `tagIds` (which doesn't populate Object.tag) instead of per-record `data[i].tag`. The recipe was amended for future runs but W3Geekery records were never re-ingested. Three tag-related fields existed in three different states: `engagementTag` (string discriminator, set), `zerobiasTagId` (UUID scalar, set), `tag` (Object.tag array, NULL). This inconsistency would surprise any Phase 27 lazy-guard or batch reconciliation logic that uses `ClassName(tag: {value: ".eq.<id>"})` for discovery — works on freshly-recipe-correct orgs, silently fails on W3Geekery.

**How to apply:** Verified via GQL re-query — both records now show `tag: [{value: "a81cd320-..."}]`. Tag-filter discovery returns 1 Engagement + 2 SmeMartProjects (TAG-SHAPE-TEST-C + the default project). Phase 27 lazy guard can rely on Object.tag being present uniformly. Bootstrap walkthrough updated with remediation note. No backlog row needed; one-shot fix complete.

**Class IDs captured for batch use:**
- Engagement class: `7711aa41-e55b-5cda-9b7a-35844a2006a1`
- SmeMartProject class: `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`
- Pipeline (UAT receiver): `43f08afd-7ab9-4e99-a93c-619c46adaabe`

## ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't
**Date:** 2026-04-24
**Decision:** `ServiceOffering` records are NOT seeded in v1.4. All ServiceOffering work — including the previously-planned placeholder tier values (Free / Growth $99/mo / Enterprise $999/mo) — defers until Brian confirms the pricing structure. This supersedes the "placeholder tier values ship in Phase 26" clause from the "v1.4 Phase 29 Deferred to v1.5" decision below.

**Refinement of the broader "Brian Asks Are Placeholders" rule:** the rule applies to **copy/branding-layer Brian asks** (logos, ToS URLs, marketing blurbs, final tier names) — those ship with sensible defaults regardless. The rule does NOT apply to **data-model Brian asks** (what tiers exist, what they cost, how the hierarchy is structured, which compliance gates exist) — those block because downstream schemas, pricing calculations, and access-control logic depend on the decision and will need rework if the data model changes later.

ServiceOffering tier structure is a data-model decision: it fixes the records we'd have to backfill or migrate if the tier scheme changes. Shipping placeholder $99/$999 values creates an implicit commitment that is harder to walk back than missing data.

**Phase 26 scope after this decision:**
- KEEP: ZB-as-provider identity record (`MarketplaceProfileItem` or equivalent)
- KEEP: `company_info` convention doc (`COMPANY-INFO-CONVENTION.md`) — applies to ALL providers, not tier-specific
- KEEP: Retroactive `Object.tag` push for W3Geekery walkthrough records (Engagement + SmeMartProject)
- KEEP: TAG-SHAPE-TEST-C residue cleanup via `markDeleted`
- REMOVE: Three ServiceOffering records (SP-03 in the original brief)
- REMOVE: Unit tests for ServiceOffering rendering (SP-06's tier portion)

**Phase 30 scope after this decision:**
- KEEP: Default project board rendering the seeded SmeMartProject
- KEEP: Three "Coming Soon" placeholder surfaces (Org Documents 046, Engagement Dashboard 066, Message Center 065)
- REMOVE: Tier placeholder banner ("you're on the Free tier...") — PB-05 in the original brief

**Why:** Clark direction 2026-04-24. The original "placeholder values ship, Brian refines later" framing conflated data-model with display-layer decisions. When Brian hasn't confirmed the tier structure, shipping $99/$999 ServiceOffering records isn't a placeholder — it's a guess at Brian's decision that bakes into the data model and costs more to undo than to defer.

**How to apply:** When a future decision surfaces a Brian-dependency, classify it:
- If the decision shapes schemas, records, pricing calculations, access-control logic, or other structural commitments → BLOCK until Brian confirms
- If the decision only affects copy, URLs, branding assets, or display text → SHIP PLACEHOLDERS

**Anti-pattern:** Treating all Brian asks uniformly under the "placeholders ship" rule without asking whether the placeholder is display-layer (cheap to update) or data-model (costly to migrate).

**Triggers for revisit:** Brian confirms tier structure (via meeting, Slack, or platform-task in the default ZB engagement). At that point, a follow-up phase or hotfix creates the ServiceOffering records and the tier-display surface.

## Platform-Provider Distinguisher (Phase 26 Plan 01)
**Date:** 2026-04-28
**Decision:** Option B — MPI `provider_type` section with `data: "platform"` for ZeroBias org records.

**Mechanism:** Add a section called `provider_type` to ZeroBias's MarketplaceProfileItem records with `data: "platform"`. Browse Providers + any future filter discovers platform providers via GQL `MarketplaceProfileItem(orgId: ".eq.<orgId>", section: ".eq.provider_type") { data }` or by filtering all-MPI-by-org for the section.

**Why option-a was rejected:**
- Option-a (hydra global tag `marketplace.platform_provider`) requires a new TagType `marketplace` to exist in `hydra.tag_type`.
- Empirically verified 2026-04-27 that `platform.Tag.suggestTag` rejects unregistered types: API error: `type 'marketplace' is not valid - {boundary|client|environment|env-type|framework|module-deployment|other|product-segment|query-folder|region|service-segment}`.
- Only way to register a new TagType is a PR to `zerobias-com/tag` adding a folder. That PR was opened 2026-04-27 as `zerobias-com/tag#1` (first PR ever on the repo) but cycle time is unknown — likely Daniel Rojas territory and could be days-to-weeks.

**Why option-c was rejected:** Hardcoded `orgId === ZB_ORG_UUID` is env-fragile (UAT and prod ZB org UUIDs differ in non-aligned envs; brittle in tests).

**Forward path:** `zerobias-com/tag#1` PR introduces `marketplace` type with `platform_provider` global tag; if/when merged + published, v1.5 can migrate via a one-shot `Pipeline.receive` batch (add `Object.tag`, drop section). Not blocking v1.4.

**Anti-pattern note:** Introducing `provider_type` as a fully generic provider taxonomy (auditor / consultant / vendor / SME-individual / platform). For now the section ONLY distinguishes platform-provider from everything else; broader taxonomy is a v1.5+ design decision.

**How to apply:**
- Plan 26-02 seed batch includes one additional MPI record per ZB org: `{ section: "provider_type", data: "platform", ... }`
- Phase 28 form schema must explicitly skip the `provider_type` section (one-line filter: `section !== 'provider_type'`)
- Browse Providers (Plan 26-03): platform providers identified by presence of `provider_type` section in their MPI records

**Test coverage:** Unit tests in 26-02 assert seed payload includes `provider_type` section; 26-03 tests assert Browse Providers correctly filters/displays based on the section.

**Update 2026-04-29:** `zerobias-com/tag` PR #1 was merged by Daniel Rojas. `marketplace` tagType is now live, plus `platform_provider` and `demo` global tags. Option-a (tag-based platform-provider distinguisher) is now technically available. **Phase 26 keeps option-b as shipped** — no rework. The MPI section was deployed to UAT (PR #51/#52), verified, and works. Migrating now is pure churn. Tag-based path remains an option for v1.5 unification work or Phase 27+ if onboarding routing benefits from the platform-level tag. See companion entry "Marketplace tagType Is Preferred for New Tags" for forward-looking guidance on tagType selection.

## Marketplace tagType Is Preferred for New Tags
**Date:** 2026-04-29
**Decision:** All NEW SME Mart tags going forward use `tagType: "marketplace"`. Existing tags created with `tagType: "other"` stay as-is — no migration. Tag NAMES retain the `sme-mart.` prefix for now. Tag-filter components in the app must accept BOTH `other` and `marketplace` types during the coexistence period.

**Why now:** `zerobias-com/tag` PR #1 (Daniel Rojas merged 2026-04-29) registered `marketplace` as a valid tagType in `hydra.tag_type`, alongside two global tags (`platform_provider` and `demo`). Pre-PR, the only valid type for SME Mart's domain tags was `other` — generic, indistinguishable from any other use of `other` on the platform. Now there's a semantically correct type.

**Why not migrate existing tags:** Tags are immutable post-ingest. "Renaming" or "retyping" requires creating a NEW tag (new UUID), re-ingesting every Object whose `Object.tag: [{value: <oldUuid>}]` references it, then deprecating the old tag. For SME Mart that's hundreds of records on UAT alone (engagements, projects, MPI rows, documents, etc.). Cost is high, benefit is purely cosmetic — a tag's UUID is what matters at query time, not its type or name. Skip the migration; let coexistence handle it.

**Why keep the `sme-mart.` prefix:** `marketplace` tagType is platform-shared — any future marketplace product on ZB would also use it (vendor onboarding marketplace, credentialing marketplace, advisory marketplace). Until a second tenant emerges, the prefix is empty calories, but dropping it now would force a re-prefix migration if a tenant ever shows up. Cheaper to keep it. Revisit if/when multi-tenancy materializes.

**How to apply:**
- New tag creation (e.g., engagement tags, project tags, demo-data tags): `tagType: "marketplace"`, `name: "sme-mart.<scope>.<slug>"` (prefix retained).
- Tag-filter code (services, components that look up tags by type): allow both `tagType in ("other", "marketplace")` during the transition. Filter UI may need to render unified.
- Phase 24 (Demo Data Visibility Gate): use the new `demo` global tag (created by Daniel's PR) as the implementation primitive. Tag demo records at ingest with the `demo` global tag UUID; non-admin views filter on `tag.eq.<demo-uuid>`.
- BACKLOG entry filed for v1.5 hygiene: refactor tag-filter components to canonicalize on `marketplace` once existing-tag remediation is feasible.

**Anti-pattern:** Plans creating new tags with `tagType: "other"` going forward — that ignores the available semantically-correct type. Equally: trying to "fix" all old tags in a one-shot migration. Don't.

## Object.tag Field Shape — Validated via UAT Experiment
**Date:** 2026-04-24
**Decision:** The `Object.tag` field (inherited property on every class, `propertyId` `65aadece-c352-4d59-8137-6ae03b98506d`, `dataTypeName: "tag"`, `dataTypeType: "object"`, `multi: true`) accepts at Pipeline.receive ingest time in this canonical shape:

```
"tag": [ { "value": "<hydra-tag-UUID>" } ]
```

- Array of objects (matching `multi: true`).
- Each object has a required `value` property holding the tag UUID.
- Server stores the value literally — no auto-enrichment with tag name/ownerId/type.
- Schema validator accepts `oneOf`: single object (`{ value: ... }`) OR the array form. Prefer the array form to match `multi: true` semantics and handle the multi-tag case.

**Evidence:** Pushed a throwaway `SmeMartProject` record on UAT via `platform.Pipeline.receive` with `tag: [{ value: "a81cd320-243e-44eb-bdd9-9824019ef3dd" }]`. First attempt with `[{ id: "..." }]` failed schema validation with a leaked error that specified the required `value` property; corrected attempt succeeded. Verified via `platform.Object.getVersionByObjectIdOrVersionId` that the tag materialized on the stored object exactly as pushed.

**Test artifacts (residue on UAT — clean up in a future batch):**
- Record: `TAG-SHAPE-TEST-C`
- Schema id: `64047b6c-52e7-4592-ac1d-27f5020d1e01`
- Internal Object id: `ae2f6996-665f-4b97-86b0-66e5afded26f`
- Cleanup path: include `markDeleted: ["64047b6c-52e7-4592-ac1d-27f5020d1e01"]` in a future Pipeline.receive batch targeting class `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03` (SmeMartProject). Pipeline.receive requires `data` to be non-empty so it cannot be a delete-only batch.

**Why:** Refinement #18 of the W3Geekery walkthrough noted `platform.Object.tag` (post-ingest call) was a write-only stub. Kevin (CIO) clarified 2026-04-23 that tags are immutable post-ingest and must be set at ingest time via the inherited `Object.tag` field. This experiment validates the exact payload shape needed — unblocking (a) the batch-prime engagement script, and (b) any future code path that wants Object-level tags for discovery.

**Anti-pattern:** Guessing the shape from the class description (`multi: true`, `dataTypeName: "tag"`) instead of pushing a test record and letting the validator tell us. Three of four plausible shapes (UUID string, `{id: ...}` ref, full `{id, name, ownerId}` ref) would have been accepted-at-lint but rejected-at-ingest; only `{ value: ... }` was correct. Validator-driven discovery via a throwaway push is cheaper than reading the whole dataType schema tree.

**Implications for bootstrap brief + batch script:**
- Step C (Engagement) and Step E (SmeMartProject) of `bootstrap-w3geekery-engagement.md` now include `tag: [{ value: "<zerobiasTagId>" }]` in the Pipeline.receive payload. Folded in 2026-04-24.
- Step D (`hydra.Resource.tagResource` on the Engagement Task) remains necessary. The Task is a hydra Resource, NOT a Pipeline-ingested class-Object. The tag-at-ingest mechanism only applies to the latter.
- Backlog 005 no longer has open questions. Status moves from "open experiment" to "validated recipe in bootstrap brief".

**READ paths also validated 2026-04-24 (no Kevin-ask needed):**
- **Read-by-id:** `platform.Object.getVersionByObjectIdOrVersionId(<internal-object-uuid>)` returns the full record including the `tag` array — verified during the write experiment.
- **Read-by-tag (discovery):** GQL via `graphql.Boundary.boundaryExecuteRawQuery` with structured Input filter — `ClassName(tag: { value: ".eq.<tag-uuid>" }) { ... }`. Verified: returned exactly the `TAG-SHAPE-TEST-C` record when filtered by its tag UUID; returned empty when filtered by unrelated tags; returned all 19 `SmeMartProject` records when unfiltered.
- Filter syntax: `zerobias.*.schemaInput` types accept `.eq.` dot-prefix RFC4515 inside property values. For the tag field: `{ value: ".eq.<uuid>" }`. Other operators (`.sw.`, `.in.`, etc.) presumably work — untested.

No separate tag-discovery endpoint needed; the existing GQL path is sufficient. The open question for Kevin is closed.



## Default ZB Engagement Bootstrap — W3Geekery (proof-of-concept run, UAT)
**Date:** 2026-04-23 (walkthrough completed end-of-day)
**Decision:** Manual walkthrough of the default-ZB engagement creation recipe completed successfully on UAT. W3Geekery is the first proof-of-concept Org. Recipe is validated for batch generalization to all other existing platform Orgs.

**Created artifacts (canonical UUIDs):**

| Artifact | UUID | Notes |
|---|---|---|
| Hydra Tag (`zerobiasTagId`) | `a81cd320-243e-44eb-bdd9-9824019ef3dd` | Name: `sme-mart.eng.w3geekery-default-zb` |
| Engagement Task (meta-tracker, `zerobiasTaskId`) | `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` | Code: `aha1-6`. Activity: aha1 (Ad Hoc - One person, `e15830c8-4274-4d67-bf9b-c22b60001e32`). Tagged with engagement Tag. |
| Engagement (class-schema external UUID) | `746010b7-dc99-436b-9142-8c4b85c5e623` | Use this for GQL queries and cross-references in our recipe |
| Engagement (internal Object UUID) | `f5361821-4beb-4e1b-8d92-04bc243fa63a` | Platform-internal bookkeeping; visible via `boundaryObjectSearch`; do NOT use in our recipe except for diagnosis |
| SmeMartProject | `ea4db55f-2c57-4567-a1be-6e7fd1a210bf` | Name: "SME Mart Platform Development"; status `active`; projectType `project`; `engagementId` set to the Engagement external UUID |

**Pipeline used:** `43f08afd-7ab9-4e99-a93c-619c46adaabe` (current SME Mart receiver, NOT the v1.2 carry-forward `f6d1f579-...`).
**Boundary:** `c15fb2dc-4f8c-48b5-b27a-707bd516b005` (W3Geekery SME Marketplace DEV).
**Buyer org/user:** `cd7105df-523d-5392-9f9a-3f83d3f30107` (W3Geekery — same UUID as prod) / `3da9385a-5d15-4d19-84ab-e1c9ce8d84ed` (Clark).
**ZeroBias org UAT:** `57c741cf-a58e-5efc-bf2f-93c4f6cf76ec` (provider; not stored on Engagement since schema has no provider field).

**18 refinements surfaced during walkthrough** (folded into bootstrap brief at session end):

1. Brief L43–44 "UAT differs from prod" caveat wrong — org UUIDs match prod for both W3Geekery + ZeroBias
2. L48 stale pipeline ID `f6d1f579-...` — replace with current `43f08afd-...`
3. L50 "throwaway push health-check" skipped — Step C is the real test
4. Step B name generalized to `"Engagement coordination — <Buyer> <- ZeroBias"` (v1.4 hardcoding removed; meta-tracker is permanent, outlives milestone)
5. Step E category mismatch moot — Engagement no longer has `category` field per Plan 075
6. Step C field list trimmed per Plan 075 migration: removed `category`, `budgetType`, `budgetMin`, `budgetMax`, `timeline`; renamed `createdAt`/`updatedAt` → `dateCreated`/`dateLastModified`
7. "Platform" category idea dies for Engagement — `engagementTag = "default-project"` is the sole default-vs-marketplace distinguisher
8. No W3Geekery-owned activity exists — use global catalog `aha1` (Ad Hoc - One person, `e15830c8-...`)
9. Hydra Tag `type` defaulted to "other" — fine; engagementTag string field is what app filters on
10. Task default status `todo` — no `transitionId` needed for first transition
11. **CRITICAL:** Engagement `dateCreated`/`dateLastModified` are date type (YYYY-MM-DD), NOT datetime. Demo seeder at `src/app/test-helpers/demo-data-seeder.ts:52` uses `.toISOString()` — production bug. Audit + fix demo seeder.
12. GQL reads use RFC4515 filters in args (`Engagement(id: ".eq.<uuid>")`), NOT GraphQL `filter: { id: { EQ: ... } }` syntax
13. Step D mechanism: `hydra.Resource.tagResource(taskId, [zerobiasTagId])` — NOT `Task.update(links=)` or `linkResources` (FK-fail cross-realm; AuditgraphDB Class Objects aren't in hydra Resource table). Brief L129–136 full rewrite.
14. Memory `feedback_task_links_bidirectional.md` does NOT apply to tag-based linkage — one `tagResource` call achieves bidirectional discoverability
15. Pipeline.receive `tagIds` parameter does NOT tag ingested Objects (semantics still unclear, possibly tags batch-job record only)
16. Engagement has TWO identifiers: class-schema external ID (we push + cross-ref) + internal Object UUID (platform-internal). Batch idempotency check: GQL filter on `engagementTag = "default-project"` AND `buyerZerobiasOrgId = <orgUUID>`. NEVER use hydra `getResource` on class entities.
17. Pipeline.receive `tagIds` confirmed unclear/non-useful for class-Object discovery (Step G Front 1 verified)
18. `platform.Object.tag` exists as a write-only stub (no matching read API). Untested path: populate inherited `Object.tag` field via Pipeline.receive payload — shape TBD; ~30 min experiment to validate.

**Why:** Validated the recipe end-to-end with human supervision on every MCP call (Clark direction: no agent handoff for this kind of work). Recipe is now ready to either: (a) walk a second case (e.g., HIS) for additional generalization confidence, OR (b) encode as the batch script for all remaining orgs.
**Anti-pattern:** Trusting any prior memory note about engagement schema fields without re-verifying — Plan 075 migration moved fields from Engagement to SmeMartProject and our memory was 36+ days stale (`project_sme_mart_prod_schema.md`). Always cross-check via `platform.Class.getClass` for live schema before constructing Pipeline.receive payloads.



## v1.4 Milestone Shape — Brian Asks Are Placeholders, Not Blockers
**Date:** 2026-04-22
**Decision:** For v1.4 (3P Onboarding & Default Engagement) and going forward, requirements that depend on Brian input (pricing tiers, ToS/legal URLs, branding, opt-in vs auto behaviors, guild-tier rules) ship with sensible default placeholder values. Brian input is NOT a planning blocker. If he provides input later, the placeholders get refined; if not, the placeholders ship.
**Why:** Clark told me 2026-04-22 that Brian asks "come in drips and spurts and/or not at all" and explicitly does not consider those phases blocked. Treating Brian as a planning gate produces stalled milestones and wasted Director cycles. The CEO communication channel is Tue/Fri meetings + future ZB-platform-tasks via the W3Geekery↔ZB engagement; it is not a synchronous decision pipeline.
**Anti-pattern:** Director will want to mark phases as "soft-blocked on Brian" with "ask at next meeting" notes. Don't. Mark them unblocked, list the placeholder defaults explicitly in the phase brief, file an informational task in the W3Geekery↔ZB engagement so Brian can refine if/when he chooses.

## v1.4 Test-Infra Deferral and Unit-Test Default
**Date:** 2026-04-22
**Decision:** v1.4 contains zero test-infrastructure backlog items (082 data-testid, 052 P4 Playwright CI, 053 QA skills, etc.). Those wait for a dedicated test-infrastructure milestone. Unit tests for components touched by v1.4 phases are mandatory and baked into each plan as default tasks.
**Why:** Clark direction 2026-04-22. Bolting test-infra onto feature milestones produces split-focus milestones with no thematic coherence. Better to let test-infra accumulate as a backlog cluster and ship as one milestone whose theme IS testing. The unit-test-on-touch rule keeps coverage from rotting between infra milestones.
**Anti-pattern:** Director will be tempted to add "small wins" like data-testid sweeps because they "support Phase 31 verification." Resist — those rationales are how feature milestones become 30% test-infra by mass.

## v1.4 Backlog Adds — 046/066/065 as "Coming Soon" Placeholders
**Date:** 2026-04-22
**Decision:** Org Documents (046 remaining), Engagement Dashboard (066), Message Center (065) are NOT real-build items in v1.4. They render as "Coming Soon" placeholder UI surfaces in the Default Project Board (likely 3 disabled tab/card surfaces with placeholder copy) so the product feels complete to a 3PO landing on it. Real implementations soft-launch in v1.5+ after the initial onboarding ships.
**Why:** Clark direction 2026-04-22. v1.4 is about getting 3POs through the front door cleanly. Building 30+ hrs of supporting features before validating the front door risks shipping the wrong supporting features. The placeholder pattern lets us learn what real 3PO behavior calls for before committing implementation effort.
**Anti-pattern:** Director will want to "just slice in the small parts of 046/066/065 that fit" to make the dashboard feel real. Don't — that creates ambiguous shipped state where users wonder if the half-built thing is functional. Disabled-with-coming-soon-copy is honest; partial-functional is deceptive.

## SME Mart Admin Mechanism Is Decided — `getPrincipal().isAdmin`
**Date:** 2026-04-22 (memory landed; decision predates by months per Clark)
**Decision:** Admin detection uses `getPrincipal()` returning `OrgPrincipalWithAdminFlag` with `isAdmin` boolean. No alternative architecture will be proposed. Granular per-org admin scoping is a future enhancement of the same flag, not a different mechanism.
**Why:** Clark told me four times across sessions before I retained it. Persisted to project memory `project_sme_mart_admin_detection.md` and indexed in MEMORY.md so future sessions know.
**Anti-pattern:** Proposing `@zerobias.com` email convention, custom platform-role mapping, group-membership inference, or "ask Brian for admin role definition" as an open question. All wrong. Use the SDK call.

## Engagement Naming Convention: `<Buyer> <- <Provider>` (ASCII reverse-arrow, buyer-first, supply-flow direction)
**Date:** 2026-04-23 (revised same day after considering Demand/Supply vocabulary alignment)
**Decision:** Engagement records use the `name` field as the human-readable identifier of the buyer/provider direction since the schema has only `buyerZerobiasOrgId` (no provider field). Convention: `"<Buyer Org Name> <- <Provider Org Name>"`. ASCII reverse-arrow `<-` (not Unicode `↔` `→` `⇐`). Buyer named first (positional convention preserved from existing demo data); arrow points TOWARD the buyer indicating supply/satisfaction flowing from Provider to Buyer.

Rationale for arrow direction: Buyer is the 1st-class citizen — owner of the engagement and its projects, the Demand-side party. The Supplier exists to satisfy Buyer's demand. In the project's Demand/Supply vocabulary (memory `project_sme_mart_transparency_invariant.md`, BACKLOG CE4 Demand/Supply twin pattern), supply flows from Supplier to Demand. The arrow encodes that direction explicitly.

Examples:
- Default ZB engagement (W3Geekery's): `"W3Geekery <- ZeroBias"` (W3Geekery is buyer of ZB platform services)
- Marketplace engagement (W3Geekery hires HIS as auditor): `"W3Geekery <- HIS"` (W3Geekery is buyer of HIS auditor services)
- ZB as customer of W3Geekery dev services (hypothetical future): `"ZeroBias <- W3Geekery"` (ZB is buyer of W3Geekery dev services)

Existing demo engagement records use the older `↔` bidirectional convention (`"Pinnacle Corp ↔ W3Geekery"` etc.). Those are NOT being backfilled — Phase 24 (demo data visibility gate) will gate or delete them anyway. Apply the new convention to all NEW engagements going forward only.

ASCII over Unicode is per Clark's global preferences (`~/.claude/CLAUDE.md` ambiguous-width chars section): `<>`, `<->`, `->`, `<-`, `=>` over `↔`, `→`, `←`, `⇒`, `⇔`. Terminal display reliability + grep-ability.
**Why:** Clark direction 2026-04-23. Bidirectional `↔` was misleading — engagement relationships are asymmetric. Directional arrow needed. Director's first proposal was `Buyer -> Provider` (buyer-engages-provider reading); Clark countered with the supply-flow framing (`Buyer <- Provider`, supply flows toward buyer-as-Demand-owner). The supply-flow framing aligns with the project's own Demand/Supply vocabulary used throughout the transparency invariant and CE4 entanglement model — preferring the framing the project already uses for cross-party data relationships is more coherent than a separate engage/pay metaphor.
**Anti-pattern:** (a) Using `↔` in new engagement names "because that's what the demo data does." (b) Using `->` (forward arrow, buyer-first) — that was the Director's first instinct but loses the Demand/Supply alignment. (c) Backfilling existing demo records — they're being phased out by Phase 24. (d) Putting Provider first (e.g., `"ZeroBias -> W3Geekery"`) — loses the buyer-as-1st-class-citizen positional convention.

## Default ZB Engagement is Auto, Invariant, Compliance-Driven — NOT a Product UI Concern
**Date:** 2026-04-23
**Decision:** Every existing ZeroBias platform Org always has at least one engagement with ZeroBias (3PO=Buyer, ZB=Provider) by default. This is a side-effect of being a ZB platform customer and a ZB compliance requirement. The default ZB engagement is created automatically via org-detection, NOT via any user UI action. SME Mart maintains this invariant via (a) one-shot batch backfill for all existing platform orgs and (b) lazy-on-load reconciliation in the auth/routing layer for orgs added after the batch runs. Long-term, ZB platform itself will own this responsibility (likely at platform-onboarding time); SME Mart fills the gap until then.

Customers can additionally create as many marketplace engagements as their business requires (with vendors, auditors, other 3POs) via the existing Create Engagement UI. The Create Engagement UI stays — but it is for those marketplace engagements, NOT for the default ZB engagement. The default ZB engagement has no UI surface for creation; it just exists.
**Why:** Clark direction 2026-04-23. The earlier framing — "user opts in to creating their first engagement after company-info save" — was wrong on two axes: (a) the engagement is invariant, not optional; (b) the trigger is org-detection, not company-info-save (those are decoupled).
**Anti-pattern:** Adding a "Create Engagement" button or ToS gate or tier-picker step into the v1.4 onboarding flow specifically for the default ZB engagement. None of those belong in the default-engagement-creation path. They may live elsewhere (informational tier display on the project board, ToS in the platform sign-up flow that happens upstream) but NOT as gates on the default engagement.

## v1.4 Phase 29 Deferred to v1.5; Lazy-on-Load Guard Added to Phase 27 (v1.4)
**Date:** 2026-04-23
**Decision:** The v1.4 phase originally framed as "ZB offerings + first engagement creation" (Phase 29) loses its CREATION scope under the auto/invariant default-engagement directive (creation moves to batch + lazy-on-load). What remains is the human-facing CONTENT layer that goes WITH the default engagement once it exists:
- Pricing tier display on the default project board (informational — "you're on Free / Growth / Enterprise")
- ToS / Privacy / legal-doc link surfaces
- ZB branding (logo, tier-specific styling)

These remaining concerns ARE Brian-ask placeholders — pricing tiers, ToS URLs, branding assets — that he may or may not provide. Per Clark direction 2026-04-23, **Phase 29 (with its scope narrowed to display-layer placeholders) defers to v1.5.** v1.4 ships with a minimal default project board (Phase 30) that does NOT need the tier display / ToS / branding to function. v1.5 adds the human-facing content layer in a refocused Phase 29.

Pricing tier placeholder values that ARE needed in v1.4: the seeded `ServiceOffering` records created by Phase 26 (ZB-as-provider seed) need real numeric tiers. Defaults: Free / Growth $99/mo / Enterprise $999/mo. Those values live in the Phase 26 brief and ship even if Brian never confirms — they're data, not display.

The OTHER part of Phase 29's old scope — actual default-engagement-creation logic — moves out entirely:
- `.planning/director/batch-prime-engagements-for-existing-orgs.md` (one-shot brief, written after the W3Geekery walkthrough validates the recipe)
- A **lazy-on-load guard** in SME Mart's auth/routing layer — added to Phase 27 (v1.4) scope. Guard logic: on authed-user load, check if currentOrg has its default ZB engagement; if not, create it inline via the validated recipe; then proceed to engagement board. Idempotent — fires at most once per org's lifetime.

**Net v1.4 milestone shape: 7 phases (24, 25, 26, 27, 28, 30, 31).** Phase 29 deferred to v1.5.
**Why:** Direct consequence of the auto/invariant default-engagement decision above (creation logic disappears from UI), combined with Clark's "Brian asks come in drips, ship placeholders, prolly v1.5 is fine for the display-layer Brian-ask content."
**Anti-pattern:** (a) Trying to ship the tier-display / ToS / branding in v1.4 just because they were originally scoped there — they are display-layer polish that v1.4 doesn't need. (b) Forgetting the pricing-tier placeholder values that DO need to ship in v1.4 (data layer, lives in Phase 26's seeded ServiceOffering records).

## Data-Migration Work Goes in Director Briefs, Not GSD Phases
**Date:** 2026-04-22
**Decision:** One-shot data migrations and hand-executed MCP scripts (e.g., bootstrap engagement creation, batch pre-creation across all platform orgs, per-org LLM-prompt generation) belong in director-authored briefs at `.planning/director/{slug}.md`, NOT as `/gsd:add-phase` items. Briefs are runnable in a fresh Claude session by Clark or a gsd-executor with clean context, get traceability via DECISIONS.md updates after execution, but skip the ROADMAP/REQUIREMENTS/PLAN ceremony that GSD imposes.
**Why:** Clark direction 2026-04-22. GSD phase ceremony assumes UI/feature work where requirements, plans, and verification matter. Pure data-migration work has no user flow, no acceptance criteria beyond "records created", and benefits from being a self-contained brief that a fresh session can execute without loading milestone context. Padding milestones with migration phases dilutes their thematic coherence.
**Anti-pattern:** Director will be tempted to "make it official" by adding migrations as Phase 26.5 / 28.5 / etc. Don't — that creates fake phases with no real plan dependencies. Use briefs.

## Bootstrap-Recursion Collapses by Manual Engagement Creation
**Date:** 2026-04-22
**Decision:** Before v1.4 onboarding flow ships, the W3Geekery↔ZeroBias dev-services Engagement + default Project will be created manually via MCP / Pipeline.receive on UAT (later promoted to prod when ZB rebuilds the dev server). This opens the dogfood communication channel TODAY, not when Phase 31 ships. All v1.4 cross-org communication (Brian asks, Kevin escalations, Andrey nags) flows through ZB-platform-tasks in this engagement immediately.
**Why:** Clark observation 2026-04-22 — if we're building the channel, we should be using the channel (or its manual equivalent) to coordinate building it. Eliminates the "no channel until Phase 31" caveat and provides a real artifact to dogfood through every subsequent v1.4 phase. Buyer = ZeroBias; Provider = W3Geekery (dev services). NOT the same engagement as the eventual ZB-as-platform-tenant default-engagement that Brian's directive describes for paying customers — those are two different engagement concepts.
**Anti-pattern:** Confusing this dev-services engagement with the "default-project" engagement Brian directed for ZB-as-platform-tenant onboarding. Different tags (`w3geekery-services` or similar vs `default-project`), different buyer/provider direction (W3Geekery=provider here vs W3Geekery=buyer there).



## Phase 17 Wired via Parent-Session MCP (Option B over A)
**Date:** 2026-04-15
**Decision:** When gsd-executor returned Phase 17 code with stubbed MCP calls, chose Option B (rewrite helpers to use real ZeroBias SDK, standalone CLI) over Option A (execute seed one-shot via parent-session MCP, leave CLI as scaffolding).
**Why:** Plan 17-01's must-haves say `npm run demo:seed` exits non-zero on API failure — that's a standalone-CLI promise. Option A would close Phase 17 with an inert CLI + commit message claiming it works. Same commit-claim drift pattern as today's schema post-mortem. Time cost 1-2hr was acceptable; the reproducibility and future reusability made it cheaper than reopening Phase 17 later.
**Anti-pattern:** Agent may be tempted to take Option A "just for the demo data" when the schedule feels tight. Resist — the CLI existence is the long-term artifact, the demo data is incidental.

## Separate Code and Closeout Commits for Phase 16/17
**Date:** 2026-04-15
**Decision:** Phase 16 closeout (`da8867e`) and Phase 17 closeout (pending, owned by gsd-execute) split the "code works" fix commit from the "ROADMAP/STATE marked complete" commit. Each phase gets two commits, not one.
**Why:** Today's schema post-mortem documented a failure mode where a commit message claimed work was done but the actual edits weren't staged (9c81a4e in schema repo). If code and closeout are in one commit and the code gets reverted, the closeout lies. Separating them lets a revert of just the code leave the closeout's "complete" claim as a false positive that's easy to audit. Separation is cheap insurance.
**Anti-pattern:** Agent will want to bundle everything into one commit for conciseness. That saves 30 seconds and adds real audit risk.

## Plans 087 (Template Library) and 088 (Split-screen Builder) as Separate v1.3 Phases
**Date:** 2026-04-14
**Decision:** Form Template Library (save → reuse → fork-on-edit) and Split-screen Form Builder (+ 'info' field type) are both new phases, not inline extensions of Phase 16. Added to `.planning/BACKLOG.md` with `/gsd:plan-phase` prompts ready.
**Why:** Phase 16 is already 5 plans / 18-22 hrs. Adding template library (20-30 hrs — schema + service + library page + wizard integration + Org Documents integration) or split-screen redesign (18-24 hrs — two-pane layout + new field type + preview simplification + split-button add-field) would double the phase. Separate phases also allow template library to ship before split-screen redesign, or vice versa, based on business priority.
**Anti-pattern:** Agent may want to cram "small UX improvements" into Phase 16 post-ship. The post-UAT walkthrough surfaced 5+ ideas; each must stand alone or go into a new phase, not backfill the closed one.

## Director Does Not Edit GSD Artifacts (Skill Boundary Enforcement)
**Date:** 2026-04-15
**Decision:** Reaffirmed: director MUST NOT write to ROADMAP.md, STATE.md, PLAN.md, SUMMARY.md, REQUIREMENTS.md, PROJECT.md, VERIFICATION.md. Skill line 164-167 is explicit. Channel for communicating state changes is `.planning/director/errata/` + briefs to `/gsd:add-phase` + clear instructions to the user.
**Why:** The boundary protects GSD's state machine. If the director edits ROADMAP, gsd-verify/gsd-next/gsd-check may disagree and overwrite, causing lost work or inconsistent state that blocks commands. Also: the director's lack of GSD context (e.g., how gsd-verifier formats VERIFICATION.md) means director edits risk breaking downstream GSD parsing.
**Anti-pattern:** Director slips into "just fix the stale text" task-mode and edits directly. Errata 009 documents this session's two violations (c6fbb6b ROADMAP, da8867e VERIFICATION). Fix: always file errata, tell user the GSD command, never touch the file.

## v1.2 Milestone Scope: RFP Packages + Document Templates + Pilot Projects
**Date:** 2026-04-02
**Decision:** v1.2 focuses on three items: (1) Plan 054 MVP — closed/invitation-only RFPs + multi-document packages (D1, D2). Form builder (D3) and destruction attestation (S2) deferred to v1.3. (2) Plan 046 partial — cherry-pick document templates + preview from remaining phases to enable 054's template→instance workflow. (3) Plan 077 — Pilot Projects (Brian asked 2026-03-27). LLM-assisted bid generation (033 P5) deferred to v1.3 as it builds on 054.
**Why:** 054 is the highest business value unblocked feature — transforms RFPs from Craigslist-style postings into structured packages. 046 partial provides the template infrastructure 054 needs. 077 is a quick Brian-requested win. Total ~32–36 hrs (~2.5 weeks at 15 hrs/week). The platform mapping work (Brian→platform construct alignment) is a design deliverable, not code.
**Anti-pattern:** Agent may try to build the full form builder (D3) or destruction attestation workflow (S2) — those are explicitly out of scope for v1.2 MVP. Agent may try to build custom document storage — documents use existing org document infrastructure from Plan 046.

## Form Builder is a Reusable Component (Not RFP-Specific)
**Date:** 2026-04-02
**Decision:** The form builder (D3) must be built as a reusable, context-agnostic component. It's not "RFP form builder" — it's a generic dynamic form builder/renderer that takes a JSON field config and renders Angular Material form fields. First use: buyer defines submission requirements on an RFP. Future uses: vendor defines resource requirements during engagement (S3 access, API credentials, VPN, schedule), vetting checklists, any structured data collection in the marketplace.
**Why:** Supply side also has requirements. Brian's transparency entangled task pairs (3/24 meeting) will need structured forms on both sides. Building it RFP-specific would mean rebuilding it when vendor requirements come.
**Anti-pattern:** Agent may put the form builder inside the RFP module/folder. It should be a shared component (`src/app/shared/` or `src/app/components/form-builder/`) that RFP imports, not owned by RFP.

## Demo Seed Scripts for Friday UI Demos
**Date:** 2026-04-02
**Decision:** Every milestone ships with runnable demo seed/cleanup scripts. For v1.2: a CLI script (node/ts) that creates a realistic RFP package (compliance engagement, documents attached, vendor invited, bid submitted) via ZB MCP/Platform APIs. Cleanup script deletes everything. Clark walks Brian through the UI showing the seeded state, then demos vendor flow manually.
**Why:** Brian needs to see features in action on Fridays. Manual setup before each demo is error-prone and slow. Scripts also double as integration testing — if the seed script breaks, something is wrong.
**Anti-pattern:** Agent may try to build Playwright UI automation for the demo. That's brittle and slow to maintain. Seed scripts create state via API; the demo is a manual UI walkthrough of that state.

## Map Brian's Vision to Existing Platform (Cross-Milestone)
**Date:** 2026-04-02
**Decision:** Brian's boundary/permission vision maps onto existing ZeroBias platform constructs. No platform changes needed. SME Mart builds UI that surfaces what's already there.
**Why:** Brian describes the right outcomes (boundary-scoped permissions, cross-org collaboration via projects, external parties interacting through boundaries) but incorrectly believes the platform needs to change. Kevin confirmed (2026-04-02): boundaries control operational permissions (tasks, collected data, hub module operations) — not a general policy engine, but sufficient for SME Mart. Platform Security Guide (kb9) documents the full Resource Authorization model. All boundary party/role/team APIs already exist.
**Anti-pattern:** Agent may try to design custom permission systems, propose platform feature requests, or build workarounds for "missing" APIs. Always verify via `zerobias_search` before concluding an API doesn't exist. See ORG-07 lesson.

## VendorProfileItem: Single Entity with Section Discriminator
**Date:** 2026-03-30
**Decision:** Use one `VendorProfileItem` GQL entity with `section` discriminator + JSON `data`, rather than separate entity types per section.
**Why:** 6 sections with different shapes (corporate_identity, attestation, insurance, reference, personnel, financial) but 16-hour budget. Separate entities give typed fields and better querying but cost 4-6 new schema classes + services + tests. Single entity with JSON is buildable in budget.
**Anti-pattern:** Agent may try to create separate models/services per section. Keep it as one service with section-aware logic.

## Org-Scoped Profiles, Not User-Scoped
**Date:** 2026-03-30
**Decision:** Vendor profiles belong to the org. Multiple users contribute. Profile items keyed by `org_id`.
**Why:** Corporate docs (insurance, D&B, entity verification) are org-level by nature. Brian's vision: "load my vendor stuff one time" means the org loads once, not each user. Different org members handle different sections (compliance officer, CFO, HR).
**Anti-pattern:** Agent may default to user-scoped data (current My Profile pattern). Profile items must be org-scoped.

## Pointer-Based Engagement References
**Date:** 2026-03-30
**Decision:** Engagement vetting items reference org profile items via `profile_item_id`. No document copies.
**Why:** When org updates a cert (renewal), all active engagements referencing it see the current version. Copies would go stale. Expired items flagged everywhere simultaneously.
**Anti-pattern:** Agent may copy `document_ids` from profile to vetting item (current pattern). Must use indirection through `profile_item_id`.

## Engagement-Specific Docs Stay Engagement-Scoped
**Date:** 2026-03-30
**Decision:** Executed MSAs, SOWs, NDAs are engagement-scoped. Not profile items. Template→Instance workflow deferred to Plan 054.
**Why:** These documents don't exist until the engagement exists. They may start from org-level templates but the executed/signed version is unique to the engagement.
**Anti-pattern:** Agent may try to put everything in the org profile. Only reusable corporate docs go there.

## My Organizations Refactor is Prereq for 041
**Date:** 2026-03-30
**Decision:** Plan 079 must ship before Plan 041. Current My Orgs page only shows single org.
**Why:** 041's profile management UI lives under My Orgs → [org] → Corporate Profile. Need multi-org navigation first. ZB users belong to many orgs with different roles.
**Anti-pattern:** Agent may try to put profile management under current single-org page or under My Profile (user-level).

## Three-Tier Org Navigation
**Date:** 2026-03-30
**Decision:** `/orgs` (list all), `/orgs/:orgId` (read-only overview), `/org` (current org full profile). The `/org` route is preserved, not replaced.
**Why:** `/org` is the management page for the active org — full tabs, editable, where 041's Corporate Profile lives. `/orgs/:orgId` is a lightweight read-only view that works for any org the user belongs to. Separating them means viewing another org doesn't accidentally switch context.
**Anti-pattern:** Agent may try to merge `/org` and `/orgs/:orgId` into one route with conditional editing. Keep them separate — different purposes, different permission models.

## Org Switching is Placeholder Until Platform Auth
**Date:** 2026-03-30
**Decision:** "Switch to this Org" button exists in UI but is disabled/stubbed. `danaOld.Org.selectOrg` is the real endpoint. Current local dev is locked to one API key = one org/user.
**Why:** Can't test org switching without session-based auth. API key auth hardcodes the org. Publishing to ZeroBias platform (session auth) is the prereq.
**Anti-pattern:** Agent may try to implement switching by changing sessionStorage `zb-current-dana-org-id` directly. That would desync from the server session. Must use `selectOrg` when available.

## Org List Filtering Rules
**Date:** 2026-03-30
**Decision:** Hide `hidden: true` orgs, System Org (all-zeros UUID), and ops orgs (slug/name contains "operations"). Show all other orgs the user is a member of.
**Why:** System Org and Ops orgs are platform internals, not SME Mart user-facing. `hidden: true` is the platform's own visibility flag. SME Mart users shouldn't see infrastructure orgs.
**Anti-pattern:** Agent may show all orgs from `listMyOrgs` unfiltered. Must apply these filters.

**Update 2026-04-15:** As of Phase 18 Plan 18-03, **no filtering is applied** in SME Mart. Platform `hidden: true` flag is effectively useless (universal `true` on UAT orgs), System Org and ops-org exclusions are not worth the code for admin-only marketplace usage. `OrgSwitcherService.orgs$` and `org-list.component.ts` both surface the full `listMyOrgs()` result (alphabetical). Revisit when Kevin/Chris clarify platform `hidden` semantics — tracking **errata 014** + Chris Slack thread.

## Internal vs External Org Membership (Plan 080)
**Date:** 2026-04-01
**Decision:** `whoAmI().ownerId === org.id` → internal member. `whoAmI().ownerId !== org.id` → external party (invited via boundary/project). Display as badge on org cards.
**Why:** Brian edict (2026-03-31): org = strictly legal entity (same email domain + IDP/2FA). Anyone outside that domain is external. The platform already models this — `ownerId` on the user principal is their home org.
**Anti-pattern:** Agent may try to check email domains or group membership to determine internal/external. Just compare `ownerId` to `org.id`.

## Project Members → Parties (Plan 080)
**Date:** 2026-04-01
**Decision:** Rename project `members` route to `parties`. Replace `ProjectComingSoonTab` stub with read-only boundary party view. Show parties, roles, teams from boundary APIs.
**Why:** Brian: boundaries are the security construct, not orgs. "Members" implies org membership. "Parties" matches ZB platform nomenclature (`listBoundaryParties`, `createBoundaryParty`).
**Anti-pattern:** Agent may create a custom members service or try to list org members for the project. Must use boundary party APIs (`platform.Boundary.listBoundaryParties`, etc.) keyed off `SmeMartProject.boundaryIds`.

## Boundary Admin Stays in ZB Platform (Plan 080)
**Date:** 2026-04-01
**Decision:** SME Mart only surfaces read-only boundary info. All boundary CRUD (creating parties, assigning roles, managing teams) happens in the ZB platform Governance app.
**Why:** Boundary management is a platform capability, not a marketplace feature. Building admin UI in SME Mart would duplicate Governance app functionality and create sync issues. Clark and Brian agreed to keep it read-only.
**Anti-pattern:** Agent may try to build party invitation or role assignment UI in SME Mart. Must be read-only — no create/update/delete boundary operations.

## Project Context Switcher Deferred (Plan 080)
**Date:** 2026-04-01
**Decision:** The org switcher will eventually become a project switcher (grouped by engagement). Deferred — needs more UX design work.
**Why:** Every project has an owner org (even private projects), so project→org context is always derivable. But the UX for private vs shared vs multi-org projects in a dropdown needs thought. Brian wants this but it's not blocking the boundary party work.
**Anti-pattern:** Agent may try to build an org switcher or project switcher as part of this phase. Out of scope.
