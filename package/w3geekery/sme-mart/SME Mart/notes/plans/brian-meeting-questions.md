# Questions for Brian — SME Mart onboarding + hierarchy

**For:** 2026-04-20 / 2026-04-21 meeting
**Context:** Finalizing scope before Phase 1 build. Publishing pipeline is parked on AWS infra fix (Andrey). Everything below is unblocked by the deploy — answers here move code forward immediately.

---

## A. Hierarchy model (blocks schema work)

**A1. Workspace Portfolio — real entity or UI view?**
Your 2026-04-20 notes list it at the same level as Project Portfolio ("Engagement Portfolio / Engagement / Project Portfolio / Project / Workspace Portfolio / Workspace / Task Portfolio / Task"). Does a Workspace Portfolio need its own distinct boundary scope, its own transparency partition, and its own persistent identity separate from the parent Project?
- **If yes:** becomes a schema entity (`WorkspacePortfolio` class), joins the CE12 subset chain
- **If no:** becomes a UI view that groups workspaces by focus tag within a project — no schema cost
> **Recommended answer:** UI view, unless you have a concrete transparency or boundary scenario that distinguishes "all Encryption workspaces" from just "all workspaces tagged encryption inside this project"

**A2. Task Portfolio — real entity or UI view?**
Same question. Tasks already group by Workspace natively. Does "Task Portfolio" need its own boundary / transparency / identity, or is it a view/filter (Kanban, backlog, sprint grouping, etc.)?
> **Recommended answer:** UI view

**A3. Engagement Portfolio — nav only, or promoted to entity?**
On 2026-04-15 you said "just a directory structure." On 2026-04-20 you listed it alongside structural Portfolios. Confirm: nav only, or does it carry its own boundary/permissions?
> **Recommended answer:** nav only — consistent with 2026-04-15

**A4. Sub-Project — where does it sit?**
Your 2026-04-20 12:23 PM note: "the only other piece I see potentially is a sub project above workspace." Clarify:
- (a) Use existing `Project.parentProjectId` (CE7) — sub-project is just a Project with a parent
- (b) Promote Sub-Project to its own class with distinct boundary / transparency
- (c) Sub-Project sits between Project and Workspace Portfolio as a new tier

**A5. Multi-3PAO scenario confirmation (for the brief)**
Sanity check: Buyer has **N separate Engagements** (one per auditor), and all N auditors collaborate inside **one shared Project 1** via CE1 linked engagements. Each auditor works in their own Workspace. ✓ or ✗?

**A6. Transparency Partition at every level — implementation**
"Transparency entangled at each nesting level" — how deep does this actually need to go? Is each DATA tier its own partition, or can some tiers inherit from parent? (Affects CE11 ActivityLog rollup depth and CE12 subset enforcement.)

---

## B. ZeroBias as a provider (blocks Phase 1 seed)

**B1. Pricing SKUs / tiers**
How many tiers? Names? Monthly price each? What's the entry (free?) tier?
- Placeholder draft: Free / Growth ($99/mo) / Enterprise ($999/mo) — confirm or replace

**B2. Features per tier**
Each tier needs a feature list. What distinguishes tiers? (Seat count? API rate limits? Feature gates? Guild certifications? Support SLA?)

**B3. Billing cycle**
Monthly / annual / both? Who handles the invoicing — ZB direct, Stripe, platform integration?

**B4. Banking / payment info**
For the `ServiceOffering` record — do we include payment routing info, or just a "Contact sales" placeholder for MVP?

---

## C. Guild licensing (blocks profile form)

**C1. Exact guild tier rules**
Given a customer's `company_info` (for-profit, nonprofit, PE-funded, government, company size), map to ZB Guild tier. Possible inputs:
- forProfit + size 1–10 → ?
- forProfit + size 11–50 → ?
- forProfit + size 51–250 → ?
- forProfit + size 250+ → ?
- nonprofit (any size) → ?
- PE-funded → ?
- government entity → ?

**C2. Tier enforcement — display-only vs gated**
Does guild tier GATE anything in the app (feature flags, rate limits, visible SKUs)? Or is it informational only for MVP?
> **Recommended answer for MVP:** display-only; enforcement is a later phase

**C3. Override / manual assignment**
Can a customer's tier be overridden manually by ZB staff, or is it purely derived from profile fields?

---

## D. Legal / branding (blocks Phase 4)

**D1. ToS / Privacy / MSA document URLs**
Where do the actual legal docs live? (File Service in the platform? External URLs? Google Drive? GitHub?) We need clickable links on the engagement-confirm screen.

**D2. Brand assets**
- ZB logo URL (for provider display component)
- Primary color / accent color
- Any other brand elements to render on the onboarding screens

---

## E. Onboarding UX decisions (blocks flow design)

**E1. Sign-up auto-creates org or separate step?**
When a new user signs up via ZB, does the platform auto-create an Organization for them, or does the user pick / create an org as a separate step? (Impacts whether SME Mart needs its own "create org" screen or relies on platform signup flow.)

**E2. First engagement — auto-create on signup, or opt-in confirmation?**
After the user fills in company profile, do we:
- (a) Automatically create the "Default Project 1" engagement with ZB, or
- (b) Show a confirmation screen ("You're about to start an engagement with ZeroBias — here's what you'll get, click to confirm")

> **Recommended answer:** (b) opt-in with ToS acknowledgment — lower risk, more transparent

**E3. "Default Project 1" naming**
Permanent global name, or customer-specific (e.g., "ACME Corp's Account with ZeroBias")? What string should appear in their engagement list?

**E4. What happens if a returning user hasn't completed onboarding?**
They sign in, their profile is incomplete — do we redirect them back to `/onboarding`, or show the dashboard with a banner / prompt?

---

## F. Nice-to-have (not blocking)

**F1. Who owns the ZB company profile going forward?**
Once ZB is a provider in the marketplace, someone (ZB staff) needs to update pricing, legal, branding over time. Admin UI later — for MVP we seed it. Who's the eventual owner / editor?

**F2. Will other teams (beyond SME Mart) land at `uat.zerobias.com/sme-mart`?**
Or is this our dedicated URL forever?

**F3. Demo/test orgs**
Can we get a handful of test buyer orgs pre-seeded for UAT, or do we create them as part of the demo seeder?

---

## Summary — the critical 5

If the meeting is short, focus on these:

1. **A1/A2** — Workspace Portfolio + Task Portfolio: data or UI?
2. **A4** — Sub-Project placement
3. **B1/B2** — ZB pricing tiers + features
4. **C1** — Guild tier derivation rules
5. **D1/D2** — Legal URLs + brand assets

Everything else can be iterated on async.
