# Brian Brief — v1.4 Deferred Content

**Audience:** Brian Hierholzer (CEO)
**Owner:** Clark (walks through in Tue/Fri meetings)
**Purpose:** Capture the inputs needed from Brian to un-defer Phase 29 (v1.5) and unblock ServiceOffering seeding. Each section is a 3-5 minute conversation unit — work through one section per meeting, mark answers inline.

## How to use this doc

- Walk through at the start of any Tue/Fri meeting (~5 min/section).
- For each section: read **What we need** + **Why it matters** + the A/B/C options aloud. Brian picks, counters, or punts.
- Mark heading `[ANSWERED]` with date + answer summary, OR `[DEFERRED]` with reason. `[OPEN]` is the default.
- Capture tangential remarks in the **Brian's free-form notes** section at the bottom — useful even if they don't fit a question.
- When sections 1-5 are answered (or Director declares default-ship), v1.5 Phase 29 unblocks.

## Defaults that ship if Brian never weighs in

Each section names a default. Director will ship that default at v1.5 plan kickoff regardless of Brian status, unless he overrides before then. This is the lever that gets answers — Brian sees what ships absent his input and can override or accept.

---

## Section 1: Tier Structure [SCRAPPED 2026-04-28]

**Status:** Scrapped per Brian directive 2026-04-28. SME Mart has NO internal pricing tiers. Monetization is a 3% transactional toll on marketplace transactions; sellers define their own pricing on each ServiceOffering. See DECISIONS.md "Marketplace Monetization Is a 3% Transactional Toll Only." All section A/B/C tier-structure options below are obsolete — the question itself was wrong-shaped.

**Original section preserved below for audit trail.**

---

**What we need:** Locked answer on how many pricing tiers SME Mart will have, what they're called, and what differentiates them.

**Why it matters:** Tiers are a data-model decision, not a copy decision. Every tier becomes a `ServiceOffering` record. Pricing calculations, access-control gates, billing reconciliation all depend on this. Cost of changing tier structure later: schema migrations + UI rework + grandfather-clause logic for early customers. Cost of deciding now: 10 minutes.

**Decision options (pick one or counter):**
- (A) Three-tier classic: **Free / Pro / Enterprise** — industry standard, reads as "trial / serious / negotiated." Covers ~90% of SaaS.
- (B) Two-tier minimal: **Free / Paid** — defer the Enterprise carve-out until a real Enterprise customer asks. Less scaffolding now.
- (C) Four-tier extended: **Free / Starter / Growth / Enterprise** — adds an entry-paid tier for solo SMEs who can't justify Pro pricing. More granularity, more complexity.
- (D) Brian-authored.

**Default if Brian doesn't answer:** (A) three-tier Free / Pro / Enterprise.

---

## Section 2: Tier Pricing + Entitlements [SCRAPPED 2026-04-28]

**Status:** Scrapped — same reason as Section 1. No SME-Mart-internal tiers exist. Sellers price their own ServiceOfferings; SME Mart takes 3% off the top. Tiered listing fees ("e.g., ~$100/mo to post an app") are a possible v1.6+ futurework but explicitly out of scope ("obvious when we get there" per Brian). See DECISIONS.md "Marketplace Monetization Is a 3% Transactional Toll Only."

**Original section preserved below for audit trail.**

---

**What we need:** Monthly/annual price for each tier + what Buyer + Provider get at each tier.

**Why it matters:** Drives the seeded ServiceOffering records, the tier-display banner on the project board, and any access-control gates we build (e.g., Free tier capped at N engagements). The numbers become a public commitment once they ship — moving them later is harder than getting them right now.

**Decision shape (matrix to fill — pre-filled with Director's straw-man):**

| Tier | Price (mo) | Engagements/mo | Concurrent projects | Document storage | SME match priority | Custom branding |
|---|---|---|---|---|---|---|
| Free | $0 | 1 | 1 | 100 MB | Standard | No |
| Pro | $99 | 10 | 5 | 5 GB | Boosted | Limited |
| Enterprise | Quote | Unlimited | Unlimited | Unlimited | Priority | Full |

**Brian — strike, edit, or replace any row. Specifically:**
- Are the Free-tier limits (1 engagement, 100 MB) too tight? Too loose?
- Is "SME match priority" the right Pro differentiator, or something else (faster bid response, premium SME pool, dedicated success manager)?
- Annual discount: 2 months free? 20% off? None?
- Buyer-vs-Provider asymmetry: do providers pay differently than buyers, or same tiers both sides?

**Default if Brian doesn't answer:** matrix above ships as-is.

---

## Section 3: Terms of Service / Privacy / EULA [ANSWERED-VIA-ARCHITECTURE 2026-04-28]

**Status:** Answered architecturally — ToS lives at the **ZB platform per-app layer**, not at the SME Mart layer. Two-layer model:
1. **Engagement-level MSA** — required to have a ZB account at all. Account-level ToS, like AWS.
2. **Per-app/product ToS** — every ZB offering (SME Mart, Value Manager, Governance, ~30 packages eventually) carries its own ToS + consumption model + price model.

SME Mart consumes the per-app ToS layer once it exists at the platform level. The actual ToS *content* gets authored as requirement-tasks in the **W3Geekery↔ZeroBias engagement project notes** (specifically in a "supporting all ZeroBias apps — content/assets gathering" workspace that Clark stands up after the W3Geekery↔ZB engagement is live). Brian responds to those tasks (eventually via his own Claude). One workspace covers content for all ZB apps.

**Phase 29 implication:** Phase 29's old scope (ToS link surface on the engagement/project board in v1.5) collapses substantially. Without the platform-side per-app ToS layer, there's nothing to link to. Phase 29 either waits on the platform layer or its remaining scope (ZB branding adoption check) merges into Phase 30.

**Open meta-question still unresolved:** Does the requirement-task carry the content (Brian writes ToS into the task body), or does the task point to an API that Brian writes to? Brian leans "task is a guide that *includes* the API for satisfaction." Worth resolving before building the requirement-task UI.

See DECISIONS.md "Per-App ToS Architecture — Two-Layer (Engagement MSA + Per-App ToS)."

**Original section preserved below for audit trail.**

---

**What we need:** URLs to ToS, Privacy Policy, and (if applicable) Acceptable Use / EULA.

**Why it matters:** Default project board has a placeholder "Terms" link surface. Without real URLs it points nowhere — not shippable to paying customers.

**Decision options:**
- (A) Brian provides URLs to legal-counsel-drafted documents (best for Enterprise customers; takes weeks).
- (B) Use a SaaS template service (Termly, Iubenda, GetTerms.io) — generates compliant docs in 30 minutes, ~$10-30/mo. Adequate for most early-stage SaaS.
- (C) Borrow ZeroBias platform's existing ToS by reference ("by using SME Mart you agree to ZeroBias platform Terms at <url>"). Cheapest. Shifts liability onto platform Terms — works if SME Mart is structured as a platform feature, not a separate product.

**Question for Brian:** does ZeroBias already have legal counsel he'd route SME Mart through, or is this option (B) territory?

**Default if Brian doesn't answer:** (C) — link to ZeroBias platform Terms with a one-line "ZB Terms apply to SME Mart use" note.

---

## Section 4: Branding Assets [LARGELY RESOLVED — confirm at meeting]

**Status:** Existing ZeroBias brand assets are available from `~/Projects/zb/ui` and `@zerobias-org/ngx-library` (logo, color palette via theme tokens, typography). ZB-as-provider profile in Browse Providers will pull from those by default — no new assets needed to ship.

**What we still need from Brian (5-min confirmation):**
- Confirm we're using the **ZeroBias platform brand** as ZB-the-provider's face (vs. commissioning a distinct sub-brand for "ZB-as-marketplace-provider").
- Brand voice for the provider blurb / long-description copy: formal/compliance-y (audit firm tone) or approachable/marketplace-y (Upwork tone)? Drives Section 5 copy direction too.

**Defaults if Brian doesn't confirm:** use existing ZeroBias brand from ngx-library + neutral marketplace voice.

---

## Section 5: Tier Marketing Copy [SCRAPPED 2026-04-28]

**Status:** Scrapped — no tiers exist (see Sections 1 + 2). No "Free / Pro / Enterprise" comparison page to write copy for. If individual ServiceOffering listings need marketing copy, that's seller-authored, not SME-Mart-authored. See DECISIONS.md "Marketplace Monetization Is a 3% Transactional Toll Only."

**Original section preserved below for audit trail.**

---

**What we need:** 1-2 sentence pitch per tier — appears on tier cards, comparison page, upgrade prompts.

**Why it matters:** "What do I get if I upgrade?" needs an answer in 8 seconds. Generic copy ("More features!") doesn't convert.

**Pre-drafted — Brian strikes/edits/replaces:**

**Free:**
- (A) "Try SME Mart with one engagement. Browse vendors, post requirements, see how it works."
- (B) "Get started free. Connect with one expert, no credit card required."
- (C) Brian-authored.

**Pro ($99/mo):**
- (A) "Run your compliance engagements end-to-end. Up to 10 active engagements, boosted SME visibility, 5 GB document storage."
- (B) "For teams managing multiple compliance workstreams. Boosted matching, more storage, priority support."
- (C) Brian-authored.

**Enterprise (Quote):**
- (A) "Tailored for large compliance programs. Unlimited engagements, dedicated SME pool, custom branding, white-glove onboarding."
- (B) "Enterprise-grade compliance marketplace. Talk to us about volume pricing and dedicated support."
- (C) Brian-authored.

**Default if Brian doesn't answer:** (A) for each tier.

---

## Section 6: Opt-in vs Auto for Default ZB Engagement [ANSWERED 2026-04-23]

**Status:** AUTO/INVARIANT — every existing platform Org gets a default ZB engagement automatically, no opt-in, no UI gate. Locked per `.planning/director/DECISIONS.md` "Default ZB Engagement is Auto, Invariant, Compliance-Driven."

**Confirm with Brian:** sanity-check at next Tue/Fri ("you're good with the engagement appearing automatically for every customer, right?"). If he counters, this turns back into `[OPEN]` and v1.4 Phase 27 plans get reshaped.

---

## Section 7: Long-Term Engagement-Creation Ownership [ANSWERED-PARTIAL 2026-04-28]

**Status (partial answer):** Brian confirmed 2026-04-28 that **eventually onboarding adopts SME Mart's engagement→project flow** — the current website-CRM-trial → manual-setup path gets replaced. New signups land in a **pilot project** with thinner engagement requirements (no banking, lighter MSA); when the pilot graduates, the same project transitions from "pilot" type to "production" type (preserves entity/ID/history). See DECISIONS.md "Pilot vs Production Project Type Is a Type Flip on the Same Project."

**What this means for SME Mart's lazy-on-load guard:** still interim, but the long-term direction is now clearer. The platform takes over the auto-creation responsibility WHEN the platform's onboarding adopts SME Mart's flow — that adoption is the migration trigger, not a separate "platform owns this now" handoff. So the SME Mart guard runs until the platform onboarding flow IS SME Mart's flow.

**Still open / unscoped:** target date for the platform-onboarding adoption. No window committed.

**Original section preserved below for audit trail.**

---

**What we need:** Confirmation that the default-ZB-engagement-creation responsibility eventually moves into the ZB platform itself (at platform-onboarding time), and SME Mart's lazy-on-load guard is interim only.

**Why it matters:** Currently SME Mart fills the gap by creating the engagement on first authed page load. Long-term, this should fire at ZB platform sign-up (before SME Mart is even involved) so the invariant holds for ALL platform customers, not just those who eventually visit SME Mart. Knowing whether/when the platform will own this affects how much investment goes into the SME Mart-side mechanism.

**Decision options:**
- (A) Yes, ZB platform will eventually own this — SME Mart's lazy guard is interim. Target window: 6 months / 12 months / no commitment.
- (B) No, this stays SME Mart's responsibility indefinitely. Build the mechanism robustly.
- (C) Unknown / depends on platform roadmap priorities.

**Default if Brian doesn't answer:** (C) — assume interim, but build the SME Mart guard production-quality (no shortcuts that assume platform takeover).

---

## Brian's free-form notes

Use this section to capture anything Brian says that doesn't fit a question above — competitor mentions, customer anecdotes, "remember to ask X about Y" reminders. Date each entry.

```
[YYYY-MM-DD] —
```

---

## Appendix: Optional Claude prompt for Brian's self-service path

If Brian prefers to think through any section conversationally rather than in a meeting, he can paste this prompt into Claude.ai or ChatGPT and answer in plain English. The AI structures his answers into the format Clark needs.

```
I'm the CEO of ZeroBias, a compliance/cybersecurity platform. We're building SME Mart — a marketplace for Subject Matter Experts (compliance auditors, security consultants) that ZB platform customers can hire. Think Upwork meets compliance.

I need to make decisions on the following for our v1.5 release. For each section I answer, structure my response into:
- The decision (one sentence)
- Specific values (numbers, names, URLs as applicable)
- Anything I want to revisit later

Sections (I'll answer one or several):

1. Pricing tier structure — how many tiers, names, what differentiates
2. Pricing matrix — monthly/annual prices + entitlements per tier (engagements, storage, matching priority, branding)
3. Legal documents — ToS, Privacy Policy, EULA URLs (or whether we use a service like Termly)
4. Branding — logo, colors, voice
5. Tier marketing copy — the 1-2 sentence pitch on each tier card (Free / Pro / Enterprise)
6. Long-term: should ZB platform own the auto-creation of customer<>ZB engagements eventually, or stays in SME Mart?

For any section I haven't fully decided, ask me 2-3 follow-up questions (not 10) to surface my preferences. Don't pad answers with caveats — give me a structured output Clark can paste into a doc.
```

---

## Status tracking

| Section | Status | Date | Notes |
|---|---|---|---|
| 1. Tier structure | [SCRAPPED] | 2026-04-28 | Question wrong-shaped — no SME-Mart-internal tiers; 3% toll model |
| 2. Tier pricing + entitlements | [SCRAPPED] | 2026-04-28 | Same — sellers define their own pricing |
| 3. ToS / Privacy / EULA | [ANSWERED-VIA-ARCHITECTURE] | 2026-04-28 | Per-app ToS is a platform-layer concern; content authored in W3Geekery↔ZB project notes |
| 4. Branding assets | [LARGELY RESOLVED] | — | Pulling from ngx-library / zb/ui; confirm voice + sub-brand vs platform-brand |
| 5. Tier marketing copy | [SCRAPPED] | 2026-04-28 | No tiers exist; per-offering copy is seller-authored |
| 6. Opt-in vs auto | [ANSWERED] | 2026-04-23 | Auto/invariant — confirm sanity at next meeting |
| 7. Platform ownership long-term | [ANSWERED-PARTIAL] | 2026-04-28 | Platform onboarding eventually adopts SME Mart's flow; no target date committed |

**v1.5 Phase 29 status (revised 2026-04-28):** Original Phase 29 scope (tier display + ToS link + branding) has dissolved. Tiers don't exist. ToS is a platform-layer architectural concern, not a SME Mart v1.5 deliverable. Branding is largely resolved. **Recommendation:** Phase 29 either retires entirely (most scope evaporated) or its residual scope (ZB branding adoption check on the default-engagement page) merges into Phase 30. Director to make the call at v1.5 plan kickoff.

**New questions surfaced 2026-04-28** (not in original brief — file as new sections or migrate to W3Geekery↔ZB project notes once that engagement is live):
- Task-as-data-sink vs Task-pointing-to-API for requirement satisfaction (per-app ToS authoring workflow + future requirement-task patterns)
- Marketplace listing tier model (DEFERRED — "obvious when we get there")
- How Joe's and Dan's UIs integrate with SME Mart's structure (BACKLOG #095 cross-team sync)

**Brief deprecation path:** Once W3Geekery↔ZB engagement+project is live (target end of 2026-04 week per Action Item #3), this brief stops accumulating new sections — new Brian asks file as project-notes tasks per DECISIONS.md "Brian-W3Geekery Collaborative Spec Lives in Project Notes."
