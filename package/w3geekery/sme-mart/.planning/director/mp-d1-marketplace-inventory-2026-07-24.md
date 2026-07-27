# MP-D1 Evidence Base — Current-State Marketplace Inventory (SME Mart)

**Author:** zb-org-app (app-lane director) · **For:** Director Parks, to decompose **MP-001 / task-87** into buildable units (MP-D1 / task-77)
**Date:** 2026-07-24 · **Scope:** READ-ONLY inventory of `package/w3geekery/sme-mart` at **`origin/uat` @ `432b19e`** (the live sme-mart; `main` has none, `poc/sme-mart` is a stale different-stack POC).
**Method / trust:** Every row below was read from source in an isolated worktree off `origin/uat`. Two parallel reader agents produced first drafts; **their claims were then re-verified file-by-file** and corrected where wrong (divergences called out in §4). Nothing here is taken on an agent's word. Where this doc **contradicts** `_coord/marketplace-schema-manifest.md` or the MP-001/task-155 tickets, the contradiction is flagged explicitly — those are the highest-value inputs to decomposition.

> **This is evidence, not decomposition.** I did not break MP-001 into units (that is Parks'). I inventoried what exists, mapped it to the MODEL primitive + R1–R16, and isolated the gaps.

---

## 0. TL;DR — the five findings that should shape decomposition

1. **The matching loop is UI-complete but execution is stubbed.** Discovery → RFP → Bid → Engagement/Vetting are all shipped screens; the `project/*` execution surface is **12 of 15 tabs `ComingSoon`** (only overview/parties/invited-vendors real), pending the Phase-30/31 board.
2. **The "typed seller cluster" (task-155's 9 classes) is NOT wired for write in the app.** The 6 `Provider*` expertise junctions exist only as **TS interfaces + read VIEWs**; **every** create/update/delete throws `"not yet implemented for GQL-backed providers"` (`provider-profiles.service.ts:203–256`). Cluster A (`OrgProfile`/`Address`/`OrgSegment`) has **no app code at all**.
3. **The seller-profile data actually flowing today is the legacy `MarketplaceProfileItem` blob** (Cluster C, marked SUPERSEDE) + the `ProviderProfile` directory VIEWs — **not** the typed classes the adoption BFR is about.
4. **Two manifest claims are wrong against code** (verified): (a) the Cluster A/B class UUIDs are **not** in `SME_MART_CLASS_IDS` (nor anywhere in `src`); (b) provenance is **not** universal — only `ProviderSkill` has a bare `verified` boolean, and **no class has `verificationSource`**. This qualifies task-155's "all carry verified/verificationSource" and BFR-3's premise.
5. **MP-001 (task-87) still has zero subtasks** and still lists **cancelled SC-002** (`dana.OrgProfile`) as a dependency — so there is no platform org-profile primitive today; task-155's `OrgProfile` is meant to fill that hole but is itself un-wired in-app.

---

## 1. UI Surface Inventory (source: `app.routes.ts` + all 8 lazy/nested route files, verified)

Grouped by the buyer↔seller matching loop. **Status:** shipped = real component; stub = `ComingSoon`/`ProjectComingSoonTab`; redirect = legacy alias.

### (a) Provider / seller discovery — SHIPPED
| Route | Component | Purpose |
|---|---|---|
| `/` | `Home` | Landing / discovery entry |
| `/providers` | `ProviderList` | Provider directory (reads `v_provider_directory`) |
| `/providers/:id` | `ProviderDetail` | One provider's public profile |
| `/services` | `ServiceCatalog` | Browse `ServiceOffering`s by category |
| `/orgs`, `/orgs/:orgId` | `OrgListComponent`/`OrgDetailComponent` | Org directory + public org profile |

### (b) RFP authoring — SHIPPED
| Route | Component | Purpose |
|---|---|---|
| `/rfps` | `RfpList` | Buyer's RFP list |
| `/rfps/new`, `/rfps/:id/edit` | `RfpWizard` | Multi-step RFP authoring |
| `/rfps/:id` | `RfpDetail` | RFP overview + received bids |
| `/templates/:id` | `TemplateEditorComponent` (lazy) | RFP document template editor |

### (c) Bid / proposal — SHIPPED
| Route | Component | Purpose |
|---|---|---|
| `/rfps/:id/bid`, `/rfps/:id/bid/:bidId` | `BidWizard` | Multi-step bid authoring (AI-assist field `ai_assisted` exists) |
| `/rfps/:id/compare` | `BidComparisonPage` | Side-by-side bid comparison |
| `/my/invitations` | `MyInvitationsComponent` | Vendor's inbound RFP invitations |

### (d) Engagement / vetting execution — SHIPPED (8 tabs)
`/engagements/:id` (`EngagementDetail`) + `/my/engagements/:id` (provider view) + `/my/engagements/:id/edit`.
Tabs (`engagement.routes.ts`): **overview · projects · documents · details · tasks · vetting · timeline · notes** — all real components. `VettingTab` is the compliance-gate surface (R7).

### (e) Onboarding / provisioning — SHIPPED (partial)
| Route | Component | Purpose |
|---|---|---|
| `/onboarding/company-profile` | `CompanyProfileFormComponent` | Collect org profile (`CompanyInfoStruct`) on first login |
| `/onboarding/platform-engagement` | `PlatformEngagementSetupComponent` | Guard error-handler / explicit provisioning destination |

Guarded by `onboardingGuard` (`core/guards/onboarding.guard.ts`).

### (f) Profile / org management — SHIPPED
- **`/my-profile`** (`MyProfile`) — **6 tabs** (`my-profile.routes.ts`): overview · expertise · services · reviews · moderate-reviews · settings. *(The UI-reader agent said 7 — wrong; source shows 6.)*
- **`/org`** (`OrgPage`) — **7 tabs** (`org.routes.ts`): documents · templates · engagements · projects · members · settings · **profile** (`VendorProfileTab`, backed by MPI).

### (g) Project execution — MOSTLY STUB (Phase 30/31)
- `/projects` → `ComingSoon` (placeholder).
- `/project/:projId` (`ProjectDetail`) — **15 tab route entries, 3 real / 12 stub** (`project.routes.ts`). *(Agent said "13 tabs, 11 stubbed" — wrong; source shows 15 entries, 12 `ProjectComingSoonTab`.)*
  - **Real:** overview · parties · invited-vendors.
  - **Stub (`ProjectComingSoonTab`):** boards · boards/:boardId · prd · plan · notes · documents · timeline · messages · dashboard · financials · compliance · reviews.
- `/my/projects` (`MyProjectList`), `/org/projects` — list surfaces (real).

### (h) Admin & misc
- `/admin` → `AdminDashboard` (single surface, real).
- Stubs: `/catalog`, `/request-assistance`, `/feedback` (all `ComingSoon`).
- Redirect: `/engagements` → `/rfps`.

**Matching-loop completeness:** discovery / RFP / bid / engagement-vetting = **built**; project *execution* (boards/tasks/docs/timeline inside a project) = **stubbed**, waiting on the platform-board migration (Phase 30/31, the tree gsd-plan is in now).

---

## 2. Data Model Inventory (source: `pipeline-write.service.ts` `SME_MART_CLASS_IDS` + `core/models/*.ts`, verified)

### 2.1 Registered classes — 23 in `SME_MART_CLASS_IDS` (`pipeline-write.service.ts:10-47`)
All have TS models. Disposition per `_coord/marketplace-schema-manifest.md`.

| Class | UUID | Disposition | Note |
|---|---|---|---|
| Engagement | `7711aa41-…` | PLATFORM-NATIVE | GQL sidecar; replaced by `platform.Project` (do NOT re-mint) |
| Bid | `ccddd2e5-…` | KEEP | proposed_price, status, pricing_breakdown[], `pricing_model`(fixed/hourly/milestone/nrc_arc), `ai_assisted`, `bid_valid_until`; `request_id`→`project_id` migration (Plan 075) |
| BidResponse | `a024a0b5-…` | KEEP | per-requirement compliance_status |
| ServiceOffering | `ff689173-…` | KEEP | title, category, `pricing_type`, price, includes[] — **services donor for `MarketplaceItem`** |
| Note / NoteFolder | `fe7c58a9-…` / `4d50975e-…` | KEEP | hierarchical; injects to `platform.Task` comments (R10) |
| Review | `ef5d821a-…` | KEEP | rating + approval workflow (R11) |
| SmeMartDocument | `e1497ca8-…` | KEEP | FileService refs (R9) |
| SmeMartProject | `c66114a2-…` | SUPERSEDE→`platform.Project` | `projectType: rfp/pilot/project` — **RFP donor** |
| SmeMartBoard/Activity/Workflow/Task | `20be589b`/`36405d75`/`295938d2`/`e15f1e0a` | SUPERSEDE→platform primitives | `SmeMartTask.transparencyConfig` = the per-task transparency seam (R8) |
| ProjectPrd/PrdSection/ProjectPlan/PlanMilestone | `920fca70`/`d30445f3`/`bc6159da`/`ac1a1cc8` | KEEP | RFP planning artifacts |
| EngagementVettingItem | `21f5841f-…` | SUPERSEDE→platform Board+Task vetting | category/type/status/direction + `profile_item_id`→MPI (R7) |
| MarketplaceProfileItem | `7bcf86a5-…` | **SUPERSEDE** | **the live seller-attestation blob** (see 2.3) |
| RfpInvitation | `941cf01b-…` | KEEP | invite/request controls (R4) |
| DocumentTemplate/Instance | `d2493bf7`/`3e1d232f` | KEEP | template→instance with variable substitution |
| FormSubmission | `179bd4b1-…` | KEEP | custom RFP submission forms |

### 2.2 Seller-expertise classes — TS interfaces that are NOT registered and NOT written
`provider.model.ts` defines **`ProviderProfile`** (lines 3-21) + **6 junctions** (`ProviderSkill/Role/Product/Framework/Segment/ServiceSegment`, lines 23-85). **None appear in `SME_MART_CLASS_IDS`**; their manifest UUIDs (`OrgProfile 8001e339`, `ProviderSkill 91a32787`, …) **do not appear anywhere in `src`** (grep-verified).
- **Reads work** via DB VIEWs: `ProviderDirectoryRow`/`ProviderDetailRow` (lines 87-114) flatten skills/roles/products/etc. into JSON-string columns from `v_provider_directory`/`v_provider_detail`.
- **Writes are all stubbed:** `provider-profiles.service.ts:203-256` — `updateProfile`, `add/deleteSkill`, `addRole`, `addProduct`, `addFramework`, `addSegment`, `addServiceSegment` each `throw new Error('… not yet implemented for GQL-backed providers')`.
- **`ProviderProfile` itself is in neither the registry nor the manifest** — an undocumented but load-bearing class (it IS the directory row).

### 2.3 Cluster A (org profile + credentials) — mostly no standalone code
| Manifest class | Reality in code |
|---|---|
| OrgProfile | **No standalone model.** Org-profile fields live in `onboarding/company-info.model.ts` `CompanyInfoStruct`. `employeeCount` has **5 bands** (`1-10,11-50,51-200,201-500,500+`), **not** the manifest's D-57 7-band set — the manifest's own noted reconciliation gap, confirmed. |
| Address, OrgSegment | **No app code** (no model, not registered). |
| InsuranceCoverage, ClientReference, Personnel, FinancialProfile | **Not standalone classes — embedded as JSON sections of `MarketplaceProfileItem`.** `marketplace-profile-item.model.ts` defines `SectionType` = corporate_identity/attestation/insurance/reference/personnel/financial, with typed `InsuranceData`/`ReferenceData`/`PersonnelData`/`FinancialData` serialized into MPI's `data: string`. (This matches the manifest's "impl-incomplete, live inside the blob" note.) |

### 2.4 `MarketplaceItem` primitive — donor availability (per MODEL.md §1/§4)
| MODEL concept | Donor in code | Present? |
|---|---|---|
| `MarketplaceItem` (unified listing) | none — no unified class exists | ❌ (services & goods are separate: `ServiceOffering` vs `ProviderProduct`) |
| services family | `ServiceOffering` | ✅ registered |
| licensed-good / productized family | `ProviderProduct` (goods) | ⚠ interface only, unregistered, write-stubbed |
| `ProviderProfile`/`ExpertiseClaim` (R3) | `ProviderProfile` + 6 junctions | ⚠ read-only VIEWs, writes stubbed |
| RFP (R4) | `SmeMartProject{projectType:rfp}` | ✅ |
| Bid (R5) | `Bid`/`BidResponse` | ✅ |
| Engagement (R6) | `Engagement` GQL (DEPRECATED) → `platform.Project` | ✅ (do not re-mint sidecar) |
| VettingItem (R7) | `EngagementVettingItem` | ✅ |
| OfferRef → Ledger (R12) | none | ❌ (no offer/order-intent concept in code) |

**Reconciling "~37 classes":** app-side there are **23 registered + `ProviderProfile` + 6 junctions = 30 TS interfaces** (plus VIEW/sub-interfaces like `BidSummaryRow`, `TaskTypePricing`, the MPI section types). The manifest's ~37 counts platform-registered classes incl. Cluster A/B, which are registered **platform-side** (via pipeline/MCP) but **absent from app code** — the source of the registry gap above.

---

## 3. Gap Map — current state vs MP-001 / MODEL / R1–R16 (raw material for decomposition)

### 3.1 The two open tickets
- **MP-001 / task-87** (`4bf63ce0-…`) — the epic seed (listing + discovery + origination). **ZERO subtasks** (verified in the audit doc via `Task.listSubtasks`). Still lists dependencies **LG-001** (Ledger), **SC-008/task-74** (Project species — blocks `rfp`+`engagement`), **RL-001/task-13** (governs/engages link types), and **SC-002** (`dana.OrgProfile`, **CANCELLED**). MP-D1's job is to break this into ~5–8 buildable units.
- **MP-001-adopt / task-155** (`38fb3a3f-…`) — platform adopts **9 complete** seller classes = `OrgProfile`, `Address`, `OrgSegment` + the 6 `Provider*` junctions. **The "9" reconciles cleanly:** manifest's 13 ADOPT (Cluster A 7 + Cluster B 6) **minus the 4 impl-incomplete credential classes** (deferred to follow-up BFR / UAT MP-S1 task-85) = 9. *Caveat from §2:* these 9 are "complete + live" **platform-side**, but in the **app** they are un-wired (Cluster A no code, junctions write-stubbed).

### 3.2 R1–R16 coverage against current code
| Req | Need | Current state |
|---|---|---|
| R1 Items/listings | unified `MarketplaceItem` | ❌ no unified class; `ServiceOffering`(✅) + `ProviderProduct`(⚠) split |
| R2 Discovery/browse | search/filter by capability/verification | ✅ UI shipped; served by `boundaryExecuteRawQuery` + VIEWs (no native discovery query — BFR-2) |
| R3 Provider profiles/expertise | org profile + expertise + attestations | ⚠ **split & partial**: `ProviderProfile` VIEW (read-only) + 6 junctions (write-stubbed) + MPI blob (live). No `OrgProfile` primitive. |
| R4 RFP lifecycle | `platform.Project` species `rfp` | ✅ UI + `SmeMartProject{rfp}`; species blocked on SC-008 |
| R5 Bids | structured priced bids | ✅ `Bid`/`BidResponse`, wizard |
| R6 Engagement | `platform.Project` species `engagement` | ✅ donor exists; sidecar deprecated; blocked on SC-008 |
| R7 Vetting | continuous gate | ✅ `EngagementVettingItem` + VettingTab; "continuous assessment engine" = open (platform service?) |
| R8 Execution (boards/tasks) | consume `platform.Project` | ⚠ **stubbed** — `project/*` = 12/15 ComingSoon; SmeMart* board classes SUPERSEDE, migration in-flight (Phase 30/31) |
| R9 Documents | FileService vault + sharing | ✅ `SmeMartDocument`/`DocumentTemplate/Instance` |
| R10 Notes | notes → Task comments | ✅ `Note`/`NoteFolder` (injects to platform Task) |
| R11 Reviews | rating + moderation | ✅ `Review` + moderate-reviews tab |
| R12 Commerce → Ledger | offer/order-intent | ❌ **nothing in code** — no `OfferRef`, no order-intent; whole origination→Ledger seam unbuilt |
| R13 Catalog refs | `catalogRef` junctions | ⚠ junctions FK to catalog (`zerobias_*_id`) but write-stubbed |
| R14 Onboarding | platform-native provisioning | ⚠ `CompanyProfileForm` + `platform-engagement-setup` shipped; provisioning still app-mediated |
| R15 Admin | provisioning/moderation | ⚠ single `AdminDashboard` only |
| R16 Cross-cutting primitives | Tags/Boundaries/FileService/PKV/Tasks/Catalog/Ledger/Projects | mixed — Tasks/Boundaries/Tags used; Ledger absent (R12) |

### 3.3 The five primitives that live only in MP-001 prose (per the build-vs-smemart audit)
`MarketplaceItem`, expertise-junctions, `RFP`, `Bid`, `VettingItem`, `Review` are named inside MP-001 but have **no dedicated platform ticket** — they exist only as SME Mart donors. **SC-002 (`dana.OrgProfile`) is CANCELLED**, so R3's org profile has no platform home and no open ticket besides task-155's `OrgProfile`.

---

## 4. Verification ledger (where I corrected the sources)

**Manifest (`marketplace-schema-manifest.md`) corrections (verified against code):**
1. Cluster A/B UUIDs are **not** in `SME_MART_CLASS_IDS:10-64` as the manifest states — they are absent from all of `src`.
2. Provenance is **not** universal: only `ProviderSkill.verified` (bare boolean) exists; **no `verificationSource` field anywhere**; Role/Segment/ServiceSegment/Framework/ProviderProfile carry no provenance. Qualifies task-155 + BFR-3.
3. `employeeCount` is **5 bands** in code (`company-info.model.ts`), not the D-57 7-band set (manifest already flagged this as an open reconciliation — confirmed).
4. `ProviderProfile` (the actual directory class) is **absent from the manifest**.

**Reader-agent corrections (both agents' claims re-verified):**
- UI agent: `my-profile` = **6** tabs, not 7; `project` = **15** route entries / **12** stubs, not "13 tabs / 11 stubbed." Route rows otherwise matched source. Purpose blurbs de-embellished (dropped unverified "rate card", etc.).
- Data agent: correctly caught the registry gap + MPI embedding + `ProviderProfile`; its provenance claim ("only ProviderSkill has verified, no verificationSource") was **confirmed** against source (and it overrides the manifest). Field lists spot-checked on `bid.model.ts`, `service-offering.model.ts`, `marketplace-profile-item.model.ts` — accurate.

---

## 5. Biggest gaps, ranked (for MP-D1 decomposition)

1. **Commerce origination → Ledger (R12) is 100% unbuilt** — no `MarketplaceItem`, `OfferRef`, or order-intent anywhere. This is the single largest greenfield unit.
2. **No unified `MarketplaceItem`** — services (`ServiceOffering`) and goods (`ProviderProduct`) are separate; the primitive that MODEL.md centers on does not exist yet.
3. **Seller expertise is read-only** — the 6 junctions + `ProviderProfile` have no write path; adopting them (task-155) also needs the app write layer built or the platform to own it.
4. **Org profile has no primitive** — SC-002 cancelled; `OrgProfile`/`Address`/`OrgSegment` have no app code; data sits in `CompanyInfoStruct` + the MPI blob.
5. **Project execution is stubbed** — R8 depends on the `platform.Project` board migration (Phase 30/31, in-flight in this tree).
6. **Verification-provenance primitive (BFR-3) rests on a thinner base than documented** — only one boolean today; if "continuous assessment" (R7/Brian) is real, this is a design unit, not a field add.

---

*Sources: `origin/uat@432b19e` sme-mart tree (routes, `core/models/`, `pipeline-write.service.ts`, `provider-profiles.service.ts`, `onboarding/`); `~/Projects/zb-mesh/marketplace/{MODEL,REQUIREMENTS}.md`; `_coord/marketplace-schema-manifest.md`; `_coord/tickets/backend-feature-requests.md` (MP-001/task-87 §1533, task-155 §1612); `_coord/marketplace-build-vs-smemart-audit.md`; DECISIONS D-58.*
