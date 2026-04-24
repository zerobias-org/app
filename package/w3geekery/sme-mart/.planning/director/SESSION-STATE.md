# Director Session State
**Last updated:** 2026-04-23
**Session name:** `Director Parks`
**Milestone:** v1.3 idle (Phase 19 closed 2026-04-21); v1.4 design in progress (NOT yet committed via `/gsd:new-milestone`)

## FIRST — Read This on Resume

**State:** v1.4 "3P Onboarding & Default Engagement" design is fully resolved. Several mid-design corrections from Clark (4 assumptions + admin/testing/Brian-asks/auto-engagement/naming-convention) reshaped the milestone substantially from the original 3P plan. All persisted to errata 019–022 (committed `7b3fab9` `25b35cf` `85d2c47` `6ec624f`), to DECISIONS.md (multiple new entries), and to project memory files.

**Decisions ALL RESOLVED 2026-04-23 — milestone setup ready to execute on resume:**

1. ✅ Milestone shape: v1.4 NEW milestone "3P Onboarding & Default Engagement"
2. ✅ v1.3 disposition: PAUSE + defer phases 20–23 to v1.5
3. ✅ Phase count: **7 phases (24, 25, 26, 27, 28, 30, 31)** — Phase 29 deferred to v1.5 (display-layer Brian-ask placeholders for tier display / ToS / branding)
4. ✅ First `/gsd:discuss-phase` target: **Phase 25 (Platform Data Audit)**
5. ✅ Errata 019–022: COMMITTED 2026-04-23
6. ✅ Backlog adds: NONE — 046/066/065 as Coming Soon UI; 078 back-burner; test-infra deferred
7. ✅ Default ZB engagement is auto/invariant (not opt-in); created via batch (existing orgs) + lazy-on-load guard in Phase 27 (new orgs); marketplace Create Engagement UI stays for non-default cases
8. ✅ Engagement naming convention: `<Buyer> <- <Provider>` ASCII reverse-arrow, buyer-first, supply-flow direction (buyer is 1st-class Demand-owner; supply flows toward buyer; aligns with project's Demand/Supply vocabulary)
9. ✅ Bootstrap brief repurposed as **manual walkthrough** for the default ZB engagement creation recipe; W3Geekery is the first proof-of-concept run; NO agent handoff (Clark direction: agents will fabricate)

**Walkthrough disposition:** `.planning/director/bootstrap-w3geekery-engagement.md` is now framed as a manual walkthrough that Clark and Director step through together. Output of a successful walkthrough → captured UUIDs in DECISIONS, refined recipe text, then either run a second case manually or encode as the batch script.

## Mental Model (v1.4 — current understanding)

**Default ZB engagement is invariant.** Every existing ZB platform Org always has at least one engagement with ZeroBias (3PO=Buyer, ZB=Provider) by default. Compliance-driven, not opt-in. SME Mart maintains the invariant via batch backfill (existing orgs) + lazy-on-load guard in the auth/routing layer (Phase 27, for new orgs that show up after the batch). Until ZB platform itself owns this responsibility (likely at platform-onboarding time, long-term), SME Mart fills the gap.

**Marketplace engagements stay user-driven.** Customers can create N additional engagements with N other parties via the existing Create Engagement UI. That UI is unaffected by v1.4 work; it's for marketplace cases (3PO↔Vendor, 3PO↔Auditor, etc.), not for the default ZB engagement.

**Brian asks are placeholders, not blockers.** Pricing tiers, ToS URLs, branding assets — Brian may or may not provide. Phases ship with sensible defaults (e.g., Free / Growth $99 / Enterprise $999 ServiceOffering placeholders in Phase 26). The display-layer concerns (tier display banner, ToS link surface, branding) defer to v1.5 Phase 29.

**Auth model:** SME Mart never authenticates anyone. The W3Geekery-branded login package handles OAuth → ZB platform session. SME Mart piggy-backs on the resulting session. Phase 27 = session detection + redirect to branded login URL + lazy-on-load default-engagement guard + onboarding-state routing.

**Pre-population is first-class.** Authenticated users already have org / boundaries / tasks / role assignments / possibly MarketplaceProfileItem records on platform. Phase 25 (Platform Data Audit, NEW) inventories the SDK reads available; Phase 28 (Company profile review form) consumes that inventory. Onboarding is review/confirm, not fresh entry.

**Admin mechanism is decided.** `getPrincipal().isAdmin` from `OrgPrincipalWithAdminFlag`. Phase 24 reduces to just gate-vs-delete (Director call, recommend gate-with-delete-escape-hatch).

**W3Geekery's posture:** 3rd-party developer building on ZB platform SDK. Brian retains direct meeting access (Tue/Fri, business sponsor); Kevin is platform-side and not the SME Mart owner — escalations go via the W3Geekery↔ZB engagement once it exists, but most "Brian asks" don't actually go anywhere — placeholders ship anyway.

**v1.4 phase shape (7 phases — locked):**
- 24: Demo Data Visibility Gate (admin via `getPrincipal().isAdmin`; gate-vs-delete = Director call)
- 25: Platform Data Audit (NEW — SDK inventory)
- 26: Seed ZB-as-provider + `company_info` convention + ServiceOffering placeholder pricing tiers
- 27: Auth gate + onboarding routing + **lazy-on-load default-engagement guard** (new scope)
- 28: Company profile review/confirm form (pre-populated from Phase 25 inventory)
- 30: Default Project board (+ "Coming Soon" placeholder surfaces for 046/066/065)
- 31: W3Geekery as first customer + production smoke test
- ~~29~~: **DEFERRED to v1.5** — tier display / ToS / branding (display-layer placeholders, Brian-ask content)

Synthetic ACME demo seeder (was a planned phase) demoted to v1.5 backlog — Phase 31 IS the real verification.

**Director briefs (NOT v1.4 phases):**
- **Walkthrough: Default ZB Engagement Creation Recipe.** At `.planning/director/bootstrap-w3geekery-engagement.md`. Manual execution with Clark; W3Geekery as first proof-of-concept; refine the recipe; basis for the batch script after.
- **Brief: Batch pre-create default Engagement+Project for all existing platform orgs.** Written AFTER the walkthrough validates the recipe (not after Phase 26 as previously thought — the walkthrough validates earlier than that).
- **Brief: Per-org LLM-prompt generation for un-pre-populatable profile fields.** Prereq: Phase 25 audit + Phase 28 form design complete.

**Backlog items for v1.4: NONE accepted.** 046/066/065 render as "Coming Soon" placeholder UI in default project board only (Phase 30 sub-task, ~1–2 hrs total). 078 back-burner. Test-infra (082, 052 P4, 053) defer to dedicated milestone.

## Failure Patterns Seen This Session

- **Pre-correction failure mode (4-time repeat):** Director kept asking Clark for the SME Mart admin mechanism even though he had told me each prior session. Fix landed: `project_sme_mart_admin_detection.md` + MEMORY.md index entry.
- **Stakeholder mis-attribution:** Director (and the 3P plan) framed Kevin as operational owner of SME Mart-side concerns. Errata 021. Recast.
- **Treating Brian asks as planning blockers:** Director's first proposal listed phases as "soft-blocked on Brian." Clark's correction: placeholders ship without his input.
- **Mid-conversation context bleed:** Director burned 13% context window before reaching the bootstrap-action commitment. Lesson: passivate to disk before getting deep into structural detail.
- **Bootstrap "communication channel" rhetorical framing was thin:** Brian/Kevin don't read ZB platform tasks — bootstrap doesn't actually open a real comm channel. Reframed as a recipe-validation walkthrough instead.
- **Conflating two engagement classes:** Director loaded W3Geekery's specific engagement with product-wide v1.4 concerns (Brian asks). Clark corrected: those are product-wide, not specific to any engagement; they belong in phase briefs.
- **Misframing default-engagement creation as user opt-in UI:** It's invariant, org-detection-triggered, not user-action-triggered. Phase 29 lost most of its scope.
- **Agent fabrication risk:** Director was about to hand the walkthrough to a general-purpose agent for execution. Clark vetoed — agents fabricate fields, hallucinate UUIDs, skip verification. Walkthrough is now manual-only.

## Recent Decisions (see DECISIONS.md for detail)

- Director scope confirmed: pre-GSD bootstrap actions (creating real ZB resources) are director-scope, not gsd-executor scope. But Clark/Director run MCP calls together MANUALLY — director does not delegate to agents.
- Engagement naming: `<Buyer> -> <Provider>` ASCII directional. Default ZB engagement: `"W3Geekery -> ZeroBias"`.
- Default ZB engagement is auto/invariant; Phase 29 deferred to v1.5; lazy-on-load guard added to Phase 27.

## What to Do on Resume

All decisions are LOCKED. Sequence:

1. **Manual walkthrough (W3Geekery default ZB engagement creation)** — Director and Clark step through `.planning/director/bootstrap-w3geekery-engagement.md` together. NO agent handoff. Each MCP call: Director shows the call shape, Clark approves or runs, both verify result, capture UUID, refine walkthrough text if anything was off, proceed. Output: 4 UUIDs (Tag, Engagement Task, Engagement, Project) plus a refined recipe ready for batch scripting.
2. **Capture walkthrough results in DECISIONS.md** — new entry with UUIDs + any field-name corrections / schema gotchas / timing observations encountered.
3. **Decide next:** walk a second case manually (e.g., HIS) to confirm generalization, OR encode as batch script + write `.planning/director/batch-prime-engagements-for-existing-orgs.md` and execute.
4. **Clark runs:** `/gsd:new-milestone v1.4 "3P Onboarding & Default Engagement"` — creates the milestone scaffold. Director does NOT run this. Can happen before, during, or after the walkthrough — independent.
5. **Director writes 7 phase briefs** to `.planning/director/phase-{24..28,30,31}-brief.md` (NOT phase-29 — that's deferred to v1.5). Brief content per the phase shape in Mental Model section. ~30–60 min of director work. Walkthrough findings inform the briefs (especially Phase 27 lazy-on-load guard and Phase 26 placeholder tier values).
6. **Clark runs:** `/gsd:add-phase {n} .planning/director/phase-{n}-brief.md` for each brief, OR jumps directly to `/gsd:discuss-phase 25` since that's the agreed first target.
7. **Optional commit pass:** uncommitted director-side work (SESSION-STATE.md, DECISIONS.md, walkthrough refinements, memory updates `project_sme_mart_admin_detection.md` + `feedback_unit_tests_default_test_infra_deferred.md`) — Clark to authorize.

## Errata Filed This Session

- 019: 3p-plan-assumes-external-signup-flow — COMMITTED 2026-04-23 (`7b3fab9`)
- 020: 3p-plan-missing-platform-data-audit-phase — COMMITTED 2026-04-23 (`25b35cf`)
- 021: kevin-mis-attribution-as-sme-mart-owner — COMMITTED 2026-04-23 (`85d2c47`)
- 022: 3p-plan-missing-w3geekery-as-first-customer-dogfood — COMMITTED 2026-04-23 (`6ec624f`)

## Memory Updates Landed This Session

- `project_sme_mart_admin_detection.md` — `getPrincipal().isAdmin`, authoritative
- `feedback_unit_tests_default_test_infra_deferred.md` — unit tests default on component touch; defer test-infra to its own milestone
