# Open Questions for Brian / Kevin

**Last updated:** 2026-03-25
**Purpose:** Questions that came up during development that need business/platform decisions. Grouped by topic with context so Brian/Kevin can answer without needing full engineering context.

---

## Engagement Vetting Process

**Context:** When a bid is accepted on an RFP, we create/link an Engagement (corp-to-corp agreement). The engagement should have vetting requirements (D&B, MSA, banking, officer background checks) that must be satisfied before project work begins. We don't have this process defined yet.

1. **What are the minimum vetting requirements for an engagement to be "satisfied"?** Is it a fixed checklist (D&B, MSA, banking, background checks) or configurable per org?

2. **Who approves vetting completion?** Is it the buyer, the provider, both, or an admin/assessor?

3. **Can project work begin before vetting is 100% complete?** Or is it a hard gate — no work until all vetting items are satisfied?

4. **Are vetting requirements the same for all engagement types?** (e.g., does a $5K assessment need the same D&B check as a $500K multi-year contract?)

5. **Does an engagement need to be in a boundary?** Can engagement vetting documents (D&B reports, officer background checks) exist outside the scope of a boundary for compliance purposes?

---

## Bid Acceptance & Multi-Provider Scenarios

**Context:** Currently we assume one accepted bid per RFP → one provider → one project. Brian has mentioned round-robin, multi-party, and sub-contracting scenarios.

6. **Can multiple bids be accepted on a single RFP?** Scenarios:
   - **Shortlist model:** Accept multiple bids as "contenders," then ultimately select one winner
   - **Split-work model:** Accept multiple bids, each provider does a piece of the project (e.g., one does assessment, another does remediation)
   - **Spawn-projects model:** Accept multiple bids, each acceptance creates a separate project under the same engagement

7. **Round-robin assignment (Brian):** How does this work? Is it:
   - Multiple providers on rotation for recurring tasks?
   - Provider queue where next available provider gets the work?
   - Something else?

8. **Sub-contracting:** If a provider wins a bid but sub-contracts part of the work, does the sub-contractor get their own engagement? Or do they work under the primary provider's engagement?

---

## Project Ownership & Privacy

**Context:** Kevin's spec says projects can be owned by "Org or Boundary." Standup conversation mentioned "Org or User (private)." Our schema has `ownerType` with values `org`/`user`.

9. **Can projects be owned by Users (private projects)?** Kevin's doc says "Org or Boundary." Does "User" ownership exist for personal/private projects, or is everything org-owned?

10. **If projects can be private (user-owned), who can see them?** Just the owner? Or can they invite collaborators?

---

## Engagement ↔ Project Relationship

**Context:** Kevin confirmed engagement doesn't own project — they're peers linked via `relates_to`. We're implementing many-to-many resource links.

11. ~~Resolved — see below~~

12. **When an RFP bid is accepted, should the project automatically link to the engagement, or should the buyer explicitly choose which engagement to link it to?** (Buyer might have multiple engagements with the same provider org.)

---

## RFP Process

**Context:** Refactoring RFPs from Engagement entities to SmeMartProject entities in draft/published status.

13. ~~Resolved — see below~~

14. ~~Resolved — see below~~

15. **Invitation-only RFPs (Plan 054):** How does a buyer invite specific providers? By org? By individual? Can an invited provider decline without "withdrawing" a bid?  

---

## Boundary & Compliance

**Context:** Projects reference 0+ boundaries. Boundaries define compliance frameworks, products, and access control.

16. **Can a project start without a boundary?** Kevin said projects can be "tiny with no boundary or huge spanning multiple." What triggers boundary association — project creation, bid acceptance, or manual assignment? 

17. **Boundary auto-satisfaction (Kevin's "promise keeping" concept):** If a boundary already has evidence for a compliance control, can it auto-close the corresponding project task? What API would SME Mart call to check this?

---

## Task System & Boards

**Context:** Tasks and boards are being built as platform primitives. SME Mart defers to the platform Project app for task management.

18. ~~Resolved — see below~~

19. ~~Resolved — see below~~

---

## Platform Integration

**Context:** Kevin is planning Project as a standalone platform app (like Boundary Manager). SME Mart handles marketplace/engagements.

20. **Deep linking between apps:** When SME Mart links to a project (e.g., from the engagement's "Related Projects" list), what URL format should we use? `{portal}/project/{projectId}`? Or will the Project app have its own URL scheme?

21. **Portal sidebar navigation:** Will "Projects" appear as a top-level item in the portal sidebar alongside Governance, Boundary Manager, etc.? This affects how SME Mart links to projects.

---

## How to Use This Document

- **Clark updates this** when questions come up during development
- **Brian/Kevin answer inline** (or Clark captures answers from meetings)
- **Answered questions** get moved to a "Resolved" section at the bottom with the answer and date
- Questions marked with a person's name are specifically for them; unmarked = either

---

## Resolved

**#11 — Can a project exist without any engagement?** (2026-03-25, Clark)
YES. Projects are independent entities. Internal work, personal projects, POCs don't need a vendor relationship.

**#13 — Can an RFP be re-opened after all bids are rejected?** (2026-03-25, Clark)
RFP status should NOT change based on rejected bids. RFP stays published, simply waits for more bids until one satisfies requirements.

**#14 — RFP expiration after responseDeadline?** (2026-03-25, Clark)
Don't auto-expire. Show notification that responseDeadline was reached. Chip on the card indicating the originator needs to take action — bids won't be accepted beyond deadline.

**#18 — Task code uniqueness — who generates codes?** (2026-03-25, Kevin via Clark)
Platform creates task codes on task creation. Possibly a future feature to define custom codes, but not currently.

**#19 — Entangled task pair link types — platform or SME Mart?** (2026-03-25, Kevin via Clark)
Ideally platform-level link types. Until platform supports them, SME Mart handles its own `demands_requirement` / `satisfies_requirement` links.
