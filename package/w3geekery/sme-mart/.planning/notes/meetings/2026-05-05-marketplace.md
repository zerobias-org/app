# Marketplace Meeting — 2026-05-05

**Date:** 2026-05-05
**Time:** ~14:50 PT (Brian driving, audio-only)
**Duration:** ~27 minutes
**Source:** Teams
**Participants:** Brian Hierholzer (CEO, ZeroBias), Clark Stacer (Geekery)
**Meeting Type:** Architecture brainstorm — surfaces a NEW backlog area (ZeroBias.Org subsidiary entity)

> **Terminology note (critical for this transcript):** When Brian says **"Ink"** he means **Zerobias.COM parent org** ("Inc."). **Zerobias.ORG** is a separate subsidiary entity / community / standards-body / "guild" that every platform org also joins by default.

---

## Topics Discussed

- **NEW: ZeroBias.Org as a first-class subsidiary entity** — Brian raised an architectural gap: the platform doesn't yet model that ZeroBias has a real subsidiary entity (ZeroBias.Org / "the community" / "standards body") with its own tax ID, banking, MSA, etc., and that **every customer gets a default engagement + project with ZeroBias.Org in addition to their default engagement + project with ZeroBias Inc.** This is a *real* legal entity, not a UI fiction.
- **Parent / subsidiary pattern is reusable** — Brian wants the entity model to express true parent-child legal entities (Honeywell example: global MSA at parent, transactions at subsidiaries; child entities have own EIN/tax ID/bank). ZeroBias Inc → ZeroBias.Org is the canonical first instance, but the model has to support arbitrary customer hierarchies.
- **"Members" vs "users" of the .Org community** — Brian initially tripped on terminology. Settled: **users** join ZeroBias.Org with a **role classification of "member"** (potentially also "observer", "admin"). Geekery, SDI, Work Worlds, Daniel Rojas Inc, Ragu Inc are all examples of orgs whose users are members of ZB.Org.
- **Internal staffing at .Org** — Some core employees (Kevin McCarthy, Nick) will be **administrators** of ZB.Org, will have @zerobias.org email addresses, may receive separate paychecks from .Org for work done there. Brian framed it as a real, separately-budgeted business unit.
- **Geekery's onboarding into .Org** — Brian asked Clark to coordinate with Kevin and Chris to make Geekery a member of ZeroBias.Org so Clark can validate the org-switcher and "see things in the .Org" from his account. This is a precondition for building the default-project structure.
- **Org switcher requirement** — Clark needs the ability to switch between Geekery and ZeroBias.Org orgs in the platform. If it's not already supported for this case, it needs to be added.
- **Environment scoping question (Clark)** — Clark asked whether ZeroBias.Org should exist on the CI/dev platform environment given third-party-app rules. Brian: yes, treat .Org as a normal provider with its own org / EIN / business unit; same default engagement+project pattern as ZB Inc. (Implication: .Org needs to be provisioned across CI / UAT / QA / Prod platforms, same as ZB Inc.)
- **Parked for next conversation: Channel partners** — Brian flagged but deferred a discussion about referral / channel-partner-only onboarding (no enterprise-direct registrations); customers always come through a channel. He wants this as its own conversation.
- **Parked for later: Billing rules between parent and child entities** — who pays whom in parent/child structures, intentionally deferred today.
- **Side topic: Deep personnel vetting / "risk marketplace" framing** — In the wrap-up, Brian re-emphasized that the marketplace must support deep vetting (gov ID validation, background checks, credentials per person, not just per org) because of historic incidents where contractors with false personae were actually nation-state agents. Frames the platform as "government grade" and a "risk marketplace." Connects to upcoming credential / persona work Clark already had on radar.
- **Status update from Clark** — Login flow now working; current milestone is tagging demo data so it never shows for real customers; next is fleshing out org profile system, then credential/persona work.

## Key Decisions

1. **Adopt the dual-entity model.** Every customer onboarded to the platform will, by default, get TWO engagements and TWO projects: one with ZeroBias **Inc.** (parent), one with ZeroBias **.Org** (subsidiary community).
2. **ZeroBias.Org is a provider** in the marketplace sense — listed alongside other providers, with its own legal entity, tax ID, MSA, etc.
3. **".Org members" = users with classification `member`**, not separate org records. Org-level relationship is "Geekery has an engagement with ZeroBias.Org"; user-level relationship is "Clark is a member of ZeroBias.Org".
4. **Parent/child entity hierarchy is a first-class concept** — model must support real subsidiary structures (Honeywell-style) with separate tax IDs, EINs, bank accounts under a parent.
5. **Geekery → .Org membership is the unblock** — Clark to coordinate with Kevin + Chris to provision Geekery as a member of ZeroBias.Org and validate the org-switcher works.
6. **Billing rules deferred** — explicitly out of scope for this meeting.
7. **Channel-partner / referral-only onboarding deferred** — separate conversation, but flagged.

## Action Items

| # | Owner | Action | Priority | Context |
|---|-------|--------|----------|---------|
| 1 | Clark | Coordinate with Kevin McCarthy + Chris to provision Geekery as a member of ZeroBias.Org on the relevant platform env | High — unblocks all subsequent .Org work | Brian explicitly named this as the immediate next step |
| 2 | Clark | Validate org-switcher works between Geekery org and ZeroBias.Org once member access is granted; flag to Kevin/team if missing | High | "If you can't, we need to make that happen — that is a default scenario" |
| 3 | Clark | Compile follow-up question list from this transcript and send to Brian (or schedule a working session) | Med | Clark said: "I'll come back with a list of questions" |
| 4 | Clark | Sketch the dual-entity / parent-child / engagement / project model as a diagram or note before next meeting | Med | "Boil this down... see if I can make a picture out of it" |
| 5 | Clark | Add a backlog item for **".Org auto-engagement on customer onboarding"** — every new customer gets default engagement+project with both ZB Inc and ZB.Org | High | Core decision from meeting |
| 6 | Clark | Add a backlog item for **"Member" user classification** in the user/role model, scoped to .Org membership | Med | Settled-on terminology |
| 7 | Clark | Confirm with Kevin whether ZeroBias.Org is provisioned (or planned) across CI, UAT, QA, Prod platform environments | Med | Clark's environment question — Brian's answer was "yes, treat as normal provider" but provisioning status isn't established |
| 8 | Brian | Send Clark the official Teams transcript when it produces | Low | Brian committed end-of-call |
| 9 | Brian / Clark | Schedule follow-up to discuss **channel-partner / referral-only onboarding** | Med | Brian explicitly parked this |
| 10 | Brian / Clark | Schedule eventual deep dive on **parent/child billing rules** | Low | Brian explicitly deferred this; will matter for Honeywell-class customers |

## Open Questions / Unresolved

- **Schema-level:** Is "member" a user-role on the .Org, a junction-table entity (UserOrgMembership), or a hydra-tagged relationship? Brian hand-waved between "engagement", "membership", and "linked relationship" before settling on "user classification." Needs a concrete model decision before any backend or schema work.
- **Default project naming:** "default project one" was Brian's term. What should these auto-created projects actually be named in the UI? Single project per (customer, provider) pair, or one per customer with sub-projects per provider?
- **Onboarding flow trigger:** When does the .Org engagement+project get auto-created — at customer signup, at first sign-in, or at a separate consent step (since Brian mentioned a separate licensing agreement and T&Cs to abide by)?
- **ZB.Org admin pool:** How is the admin/member distinction enforced (groups? role assignment at provisioning?)? Kevin and Nick are admins; Geekery is member. Is this a hydra group / role / custom claim?
- **Cross-environment provisioning:** Does ZeroBias.Org exist as an org record on CI today? UAT? Need to inventory before assuming we can build against it.
- **Standards-body angle:** Brian compared .Org to "an open source or a standards body" — does this imply a public-facing artifact catalog (standards documents, frameworks) that .Org publishes? Could overlap with existing schema/framework catalog work.
- **Channel-partner model (parked):** When Brian re-opens this, it will likely affect onboarding flow and referral attribution — worth keeping in mind so .Org work doesn't paint into a corner.

## Key Quotes

> "We have not considered the existence of the ZeroBias.Org community as part of every engagement and project." — Brian (the framing of the whole meeting)

> "Just like SDI is a member of the ZeroBias.Org Org. Just like Ragu is a member of the ZeroBias.Org. ... Geekery is a member of ZeroBias.Org Org." — Brian (defining the membership pattern)

> "Both sides of that engagement, both sides of that project, entangled tasks — all that. Same rules." — Brian (treating .Org engagements as ordinary engagements, not a special case)

> "If you can't [org-switch into ZeroBias.Org], we need to actually make that happen, because that is a default scenario." — Brian (raising the org-switcher requirement)

> "This is a risk marketplace, right? This is not just a marketplace. We need to know everything." — Brian (re: deep vetting, framing the platform's value prop)
