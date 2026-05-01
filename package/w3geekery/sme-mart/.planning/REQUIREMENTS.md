# Requirements: SME Mart

**Defined:** 2026-04-24
**Core Value:** A transparent, task-gated marketplace where every boundary API operation requires task/subtask approval -- demand/supply/transparency partitions at every level of the hierarchy.

## v1.4 Requirements

Requirements for v1.4 "3P Onboarding & Default Engagement". Each maps to roadmap phases.

### Demo Data Visibility (Phase 24)

- [ ] **DG-01**: Demo seeder populates Object.tag with demo-seed tag UUID on every class-Object Pipeline.receive push
- [ ] **DG-02**: Core listing/search services filter OUT demo-tagged records for non-admin users via GQL `.ne.` filter on the tag field
- [ ] **DG-03**: Admin (`getPrincipal().isAdmin === true`) retains full visibility -- no filter applied
- [ ] **DG-04**: Admin delete-demo action bulk-`markDeleted`s all demo-tagged records via Pipeline.receive and clears hydra Resources tagged `w3geekery.sme-mart.demo-seed`
- [ ] **DG-05**: Unit tests cover the three gate scenarios (admin-sees-demo, non-admin-filtered, admin-delete)

### Platform Data Audit (Phase 25)

- [ ] **PDA-01**: `PLATFORM-DATA-INVENTORY.md` exists at `.planning/director/PLATFORM-DATA-INVENTORY.md` with structured SDK inventory
- [ ] **PDA-02**: Minimum 9 data-source sections (whoAmI, getPrincipal, getCurrentOrg, Org.*, User.*, MarketplaceProfileItem, Boundary, hydra.Tag, hydra.Resource), each with sample response + field list
- [ ] **PDA-03**: Pre-fill map table covers every field in the Phase 28 company-profile form
- [ ] **PDA-04**: Known-unknown list highlights fields that will need user input or LLM enrichment
- [ ] **PDA-05**: Pipeline health check confirms current pipeline (`43f08afd-...`) is live on UAT

### Seed Provider (Phase 26)

- [x] **SP-01**: `COMPANY-INFO-CONVENTION.md` exists and is referenced by Phase 28 brief
- [x] **SP-02**: ZeroBias appears as a provider in SME Mart UI (Browse Providers view lists it)
- [x] **SP-04**: Every seeded record carries appropriate Object.tag (`platform-provider` for ZB-as-provider, `sme-mart.eng.w3geekery-default-zb` for W3Geekery default-engagement records)
- [x] **SP-05**: Walkthrough residue `TAG-SHAPE-TEST-C` (schema id `64047b6c-...`) cleaned up via `markDeleted`
- [x] **SP-06**: Unit tests for seed function + Browse Providers rendering ZB-as-provider

### Auth & Routing (Phase 27)

- [x] **AR-01**: Unauthenticated users are redirected to the branded login URL on any SME Mart route
- [x] **AR-02**: Post-auth routing: unconfirmed profile -> Phase 28 form, confirmed profile -> Phase 30 board
- [x] **AR-03**: Lazy-on-load guard queries for the default ZB engagement; creates it via the full bootstrap recipe if missing; idempotent on retry
- [x] **AR-04**: Guard failure surfaces a user-friendly error + retry, not a crash
- [x] **AR-05**: Admin users (`getPrincipal().isAdmin`) skip onboarding form, go to admin dashboard
- [x] **AR-06**: Guard populates Object.tag at ingest time for both new Engagement and new SmeMartProject (validated `[{ value }]` shape)

### Company Profile (Phase 28)

- [x] **CP-01**: Form renders every field in the `company_info` convention
- [x] **CP-02**: Pre-fillable fields populated on form mount from the correct SDK/GQL source per Phase 25 map
- [x] **CP-03**: Known-unknown fields show a "please provide" indicator + optional hint text
- [x] **CP-04**: Save writes all confirmed values to the platform via Phase 25-mapped endpoint(s)
- [x] **CP-05**: Post-save, onboarding-complete marker is set for the current user+org
- [x] **CP-06**: Skip-for-now escape exists; routes to Phase 30 WITHOUT setting the complete marker
- [x] **CP-07**: Subsequent logins with complete marker set -> Phase 27 routes directly to Phase 30
- [x] **CP-08**: Unit tests cover pre-fill, save, skip, repeat-login-skip flows

### Project Board (Phase 30)

- [ ] **PB-01**: Authenticated onboarded users land on default project board route per Phase 27 routing
- [ ] **PB-02**: Default project content (name, description, SmeMartProject widgets) renders for the seeded default project
- [ ] **PB-03**: 3 "Coming Soon" surfaces exist as components + routes (Org Documents 046, Engagement Dashboard 066, Message Center 065)
- [ ] **PB-04**: Coming Soon surfaces reachable from board AND deep-linkable
- [ ] **PB-06**: No half-built functional UI in the 3 Coming Soon surfaces -- honest placeholders only
- [ ] **PB-07**: Unit tests for board + each placeholder component rendering

### Verification (Phase 31)

- [ ] **V14-01**: UAT smoke walkthrough executed end-to-end; `v1.4-smoke-test-report.md` exists
- [ ] **V14-02**: All 6 active phases (24, 25, 26, 27, 28, 30) have a pass/fail verdict in the report
- [ ] **V14-03**: Any blockers have errata filed + hotfix phase queued
- [ ] **V14-04**: Production promotion checklist exists as a separate director brief
- [ ] **V14-05**: Friction log populated honestly -- not a "everything's fine" whitewash

## Future Requirements (v1.5)

Deferred from v1.3 and v1.4. Tracked but not in current roadmap.

### Hardening & Productivity (deferred v1.3 phases 20-23)

#### Fire-and-Forget Audit (Phase 20) — ✅ VALIDATED 2026-04-29

Phase 20 was executed interleaved with v1.4 work and closed at HEAD `89e7c13` + Wave 3 (this commit). All FF-* requirements are validated.

- **FF-01**: ✅ Validated — `.planning/phases/20-fire-and-forget-audit/AUDIT.md` 60-row call-site table (44 fire-and-forget + 16 awaited). Each row carries file:line, className, criticality, complexity, user-action, error-surface citation.
- **FF-02**: ✅ Validated — AUDIT.md "Class-ID Verification Table" verified all 23 `SME_MART_CLASS_IDS` entries against `platform.Class.getClass` on UAT 2026-04-29. 23/23 canonical, no fictional/drifted consts.
- **FF-03**: ✅ Validated — `pipeline-write.service.ts` `pushEntities`/`pushEntity`/`deleteEntities`/`deleteEntity` rejection paths emit `[PIPELINE_WRITE_FAILURE] {className, callSite, errorMessage, timestamp}` structured event via `console.warn`, then re-throw. 8 specs in `pipeline-write.service.spec.ts` describe('Telemetry Instrumentation (FF-03)') verify the contract.
- **FF-04**: ✅ Validated — Wave 2 across 33 CRITICAL+SIMPLE sites: replaced fire-and-forget with `await` + `try/catch` + `MatSnackBar` toast + explicit `callSiteTag` + re-throw. Each remediated service has a rejection-path spec; note-folder coverage gap closed by Wave 3 specs (`describe('Pipeline rejection error surface (Phase 20 Wave 3)')`).
- **FF-05**: ✅ Validated — `.planning/BACKLOG.md` "Fire-and-Forget Remediation Polish (v1.5)" contains FF-POLISH-1/2/3 covering bid-submit retry UX, vetting batch per-item handling, and submit-button-disable sweep across forms. The 9 MEDIUM collaboration sites also got the SIMPLE remediation in Wave 2 (Brian-acknowledged scope expansion).
- **FF-06**: ✅ Validated — AUDIT.md AWAITED rows 45-60 (16 sites) carry concrete `<file>.ts:NN — surfaces via <mechanism>` citations after Wave 3 prose cleanup. Honest tally: 5 sites with proper user-visible surface, 2 with no UI consumer wired today, 2 with NgZone-only fallthrough (captured in FF-POLISH-3), 9 with admin-only `console.error` swallow (acceptable).
- **FF-07**: ✅ Validated — Pattern is documented in AUDIT.md "Wave 2 Remediation Grouping" and codified in `pipeline-write.service.ts` itself (the `callSiteTag` parameter shape forces callers into the await + try/catch contract). Future fire-and-forget regressions are caught at code review time and at unit-test time (every Wave-2 service has a rejection-path spec gated on the new pattern).
- **FF-08**: ✅ Validated — `pipeline-write.service.spec.ts` `describe('Class-id round-trip for all 23 SME_MART_CLASS_IDS (Phase 20 Wave 3)')` parameterized `it.each` block enforces each className → canonical UUID mapping at unit-test time. Belt-and-suspenders length and uniqueness assertions catch silent drift if a new class is added without updating the test table or a copy-paste duplicates a UUID/name. See `.planning/phases/20-fire-and-forget-audit/ROUND-TRIP-RESULTS.md`.

**Closure deliverables:** [AUDIT.md](phases/20-fire-and-forget-audit/AUDIT.md), [PHASE-20-SUMMARY.md](phases/20-fire-and-forget-audit/PHASE-20-SUMMARY.md), [ROUND-TRIP-RESULTS.md](phases/20-fire-and-forget-audit/ROUND-TRIP-RESULTS.md), [UAT-SOAK-READY.md](phases/20-fire-and-forget-audit/UAT-SOAK-READY.md).

**UAT 1-week soak runs post-merge, NOT phase-close blocking** — Director reviews Day 7.

#### Other Hardening & Productivity (deferred)

- **OD-01..05**: Org Documents Center completion -- folders, color/tag, template surfacing, preview (Phase 21)
- **FT-01..09**: Form Template Library -- save/reuse/fork, `FormTemplate` schema class (Phase 22)
- **TC-01..05**: Transparency Controls UI-SPEC lock + opportunistic implementation (Phase 23)

### Display Layer (deferred Phase 29)

- **TierDisplay**: Pricing tier display on default project board
- **ToS**: Terms of Service / Privacy / legal-doc link surfaces
- **Branding**: ZB branding (logo, tier-specific styling) -- Brian-ask content

### Cross-Milestone (deferred)

- Task/subtask partitioning into demand/supply/transparency (CEO P0)
- Tasks as runtime access control -- boundary API gating via task approval
- Transparency Center (aggregated rollups from subtask -> project)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auth flow / login implementation | ZeroBias platform handles this; SME Mart piggybacks on session |
| ServiceOffering records in v1.4 | No tier display in v1.4; deferred to v1.5 Phase 29 |
| LLM-assisted bid generation | Separate initiative |
| Scoring app | Separate ZB platform app |
| Billing app | Separate ZB platform app |
| E2E Playwright tests | Separate test-infra milestone |
| Internal Marketplace (BU-to-BU) | Future concept |
| Reverse Bid Flow | Future concept |
| Synthetic ACME demo seeder | Deferred to v1.5 backlog |
| Test infrastructure (data-testid, Playwright CI, QA skills) | Dedicated test-infra milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DG-01 | Phase 24 | Pending |
| DG-02 | Phase 24 | Pending |
| DG-03 | Phase 24 | Pending |
| DG-04 | Phase 24 | Pending |
| DG-05 | Phase 24 | Pending |
| PDA-01 | Phase 25 | Pending |
| PDA-02 | Phase 25 | Pending |
| PDA-03 | Phase 25 | Pending |
| PDA-04 | Phase 25 | Pending |
| PDA-05 | Phase 25 | Pending |
| SP-01 | Phase 26 | Complete |
| SP-02 | Phase 26 | Complete |
| SP-04 | Phase 26 | Complete |
| SP-05 | Phase 26 | Complete |
| SP-06 | Phase 26 | Complete |
| AR-01 | Phase 27 | Complete |
| AR-02 | Phase 27 | Complete |
| AR-03 | Phase 27 | Complete |
| AR-04 | Phase 27 | Complete |
| AR-05 | Phase 27 | Complete |
| AR-06 | Phase 27 | Complete |
| CP-01 | Phase 28 | Complete |
| CP-02 | Phase 28 | Complete |
| CP-03 | Phase 28 | Complete |
| CP-04 | Phase 28 | Complete |
| CP-05 | Phase 28 | Complete |
| CP-06 | Phase 28 | Complete |
| CP-07 | Phase 28 | Complete |
| CP-08 | Phase 28 | Complete |
| PB-01 | Phase 30 | Pending |
| PB-02 | Phase 30 | Pending |
| PB-03 | Phase 30 | Pending |
| PB-04 | Phase 30 | Pending |
| PB-06 | Phase 30 | Pending |
| PB-07 | Phase 30 | Pending |
| V14-01 | Phase 31 | Pending |
| V14-02 | Phase 31 | Pending |
| V14-03 | Phase 31 | Pending |
| V14-04 | Phase 31 | Pending |
| V14-05 | Phase 31 | Pending |

**Coverage:**
- v1.4 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-04-24*
*Last updated: 2026-04-24 after initial definition*
