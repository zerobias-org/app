# Marketplace Meeting — 2026-04-21

**Date:** 2026-04-21
**Time:** 2:00 PM – 2:15 PM PT
**Duration:** ~17 minutes (transcript 0:00–16:47)
**Participants:** Clark Stacer, Brian Hierholzer
**Meeting Type:** Weekly sync / status + architecture discussion
**Source:** Teams

## Topics Discussed

- **SME Mart UAT publishing is live** — Clark has SME Mart publishing to `uat.zerobias.com/smemart`. A few login issues remain; Chris is working on a login SDK fix and Clark updated the client to match.
- **Portal integration roadmap (3 phases)** — (1) short-term: add a portal section with a link that opens SME Mart in a new tab using same UAT creds; (2) mid-term: host inside the portal iframe; (3) long-term: fold SME Mart fully into core.
- **"Clay" model for externalized prototyping** — Brian's framing: extract core concepts (Readiness Center, Transparency Center, SME Mart) as extendable external apps; outsiders can fork/PR; whatever "sticks" gets pulled back into core. Same process for readiness/transparency.
- **Joe onboarding as external partner** — Brian is prepping Joe (a remediation-bot builder) to ship on the platform using the same engagement/project constructs Clark and Dan use. Joe should declare services via marketplace profile, get customers via engagement -> MSA flow.
- **Context Development Lifecycle** — Brian articulated a release pipeline for external contributions: queries, remediations, connectors, schema extensions must run through QA lab -> UAT lab -> production lab for a given customer, with validated testing and reviewer consensus before accepting into the global context catalog. "I won't buy it if it's not mature and validated against my lab resources."
- **Board vs Workspace distinction** — Clark summarized Claude's framing:
  - *Board* = structural — task rendering, phases, ranks, codes, activity-driven UI; specific to tasks
  - *Workspace* = conceptual scope — crew/aperture/boundary partition, scoped activity log, transparency
  - Both can nest under a project; both group tasks; difference is "how tasks are rendered/transitioned" vs "who can see them and what scope they run in."
- **Project hierarchy ("house" analogy)** — Engagement > Project > Sub-project > Workspace. Brian's house analogy: project = house, sub-projects = floors, workspaces = rooms on a floor (functional partitions like IoT vs desktops vs infra). Linked projects follow the same rigid structure but carry their own data/security plane.
- **Next-week target** — Clark hopes to invite someone (likely Joe) into SME Mart UAT after demo-data isolation is complete.

## Key Decisions

1. **Portal integration via "open in new tab" is the immediate path** — no iframe integration yet; full portal hosting is a later step.
2. **Linked projects use the same structural components as primary projects** — "not mixing things" — every project, sub-project, workspace follows the same rigid structure whether primary or linked.
3. **Board and Workspace stay as separate concepts** — both nest under project but serve different purposes (rendering vs scope/transparency).
4. **Transcript tooling is flexible** — both Teams and Slack Huddle transcripts work equally well (Clark has a summarizer for each); next meeting can be either.

## Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Finish SME Mart login cleanup (coordinate with Chris on login SDK fix) | Immediate | Blocks UAT invite to external users |
| 2 | Clark | Isolate demo data so third-party orgs can't see it (admin-only visibility) | Before inviting externals | Required before inviting Joe or others |
| 3 | Clark | Smooth out org profile pages + engagement/project pages between ZeroBias and a party | Next steps | Part of readiness for external invitees |
| 4 | Clark | Prototype board + workspace constructs; tweak based on real usage | Ongoing | Need to validate the board/workspace model in practice |
| 5 | Brian | Continue prepping Joe on engagement structure + Context Development Lifecycle | Ongoing | Joe as first external marketplace partner |
| 6 | Nick | Deliver first round of his work | Early next week | Clark coordinating; unknown scope |
| 7 | Clark | Invite Joe (and/or others) into SME Mart UAT once demo-data isolation + profile pages land | Target: next week | Blocked on items 1-3 |

## Open Questions / Unresolved

- How exactly does a linked project's data/security plane interact with its primary project's permissions? (Brian flagged it as a dependency but didn't resolve the mechanics.)
- Should Transparency become a valid "board parent"? (Clark mentioned this from Claude's summary but didn't confirm the decision.)
- When does SME Mart transition from "external app" to "core platform" — what are the acceptance criteria for "the pieces that stick"?

## Key Quotes

> "That whole process, if we could do that, that would be awesome. Because it's like, here, here's a readiness app. Go do whatever you want. And then however you want us to look, or fork in core." — Brian

> "A board is structural, and a workspace is conceptual — content aware... transparency becomes a valid board parent." — Clark (summarizing Claude)

> "If you don't follow this set of guidelines to release your remediation or your agentic, whatever that is, I'm not going to buy it because it's not mature and I have to have validated testing and approvals." — Brian (on Context Development Lifecycle)

> "It has to be flexible enough to — every company probably has their own twisted hierarchy — and ours needs to be flexible enough to allow for all kinds of different constructs." — Clark

## Next Actions Offered

1. Create Jira tasks (PM project) for items 1–4 and 7
2. Draft Slack message summarizing for Dan / Chris / Nick
3. Save meeting notes (this file)
4. Attach summary to weekly Marketplace Meeting ZB task via `/tt` rollup flush
