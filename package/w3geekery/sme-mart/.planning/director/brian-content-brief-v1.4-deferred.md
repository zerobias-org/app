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

## Section 1: Tier Structure [OPEN]

**What we need:** Locked answer on how many pricing tiers SME Mart will have, what they're called, and what differentiates them.

**Why it matters:** Tiers are a data-model decision, not a copy decision. Every tier becomes a `ServiceOffering` record. Pricing calculations, access-control gates, billing reconciliation all depend on this. Cost of changing tier structure later: schema migrations + UI rework + grandfather-clause logic for early customers. Cost of deciding now: 10 minutes.

**Decision options (pick one or counter):**
- (A) Three-tier classic: **Free / Pro / Enterprise** — industry standard, reads as "trial / serious / negotiated." Covers ~90% of SaaS.
- (B) Two-tier minimal: **Free / Paid** — defer the Enterprise carve-out until a real Enterprise customer asks. Less scaffolding now.
- (C) Four-tier extended: **Free / Starter / Growth / Enterprise** — adds an entry-paid tier for solo SMEs who can't justify Pro pricing. More granularity, more complexity.
- (D) Brian-authored.

**Default if Brian doesn't answer:** (A) three-tier Free / Pro / Enterprise.

---

## Section 2: Tier Pricing + Entitlements [OPEN]

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

## Section 3: Terms of Service / Privacy / EULA [OPEN]

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

## Section 5: Tier Marketing Copy [OPEN]

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

## Section 7: Long-Term Engagement-Creation Ownership [OPEN]

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
| 1. Tier structure | [OPEN] | — | Default: A (Free/Pro/Enterprise) |
| 2. Tier pricing + entitlements | [OPEN] | — | Default: matrix above |
| 3. ToS / Privacy / EULA | [OPEN] | — | Default: C (link to ZB Terms) |
| 4. Branding assets | [LARGELY RESOLVED] | — | Pulling from ngx-library / zb/ui; confirm voice + sub-brand vs platform-brand |
| 5. Tier marketing copy | [OPEN] | — | Default: option A each tier |
| 6. Opt-in vs auto | [ANSWERED] | 2026-04-23 | Auto/invariant — confirm sanity at next meeting |
| 7. Platform ownership long-term | [OPEN] | — | Default: C (assume interim, build robust) |

**v1.5 Phase 29 unblock condition:** Sections 1, 2, 3, 5 all `[ANSWERED]` OR Director declares default-ship at v1.5 plan kickoff. Section 4 already has working defaults from ngx-library; Brian voice-confirmation is refinement, not a gate.
