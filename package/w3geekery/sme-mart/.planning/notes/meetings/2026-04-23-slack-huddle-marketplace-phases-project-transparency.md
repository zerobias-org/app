# Slack Huddle — Marketplace Release Phases & Project/Transparency Model

**Date:** 2026-04-23
**Time:** 2:52 PM – 3:03 PM PT (~11 min)
**Source:** Slack Huddle (brianhierholzer channel)
**Participants:** Brian Hierholzer (CEO, w3geekery/ZeroBias), Clark Stacer (w3geekery contractor)
**Full transcript:** [processed/2026-04-23-slack-huddle-transcript.txt](processed/2026-04-23-slack-huddle-transcript.txt)

## Headline

Aligned on the phased rollout plan for SME Mart onto the ZeroBias marketplace and confirmed the near-term project/transparency prototype Clark is building inside SME Mart ahead of Nic's core project construct.

## Decisions

### Phased SME Mart Release

1. **Phase 1 — Soft launch as standalone tab.** Published at `UAT.zerobias.com/<appname>` (name TBD — "smemart", "marketplace", etc.). Portal home page gets a new section ("Marketplace apps" or "Community apps") with a link that opens SME Mart in a new tab. Still standalone, just discoverable.
2. **Phase 2 — Into the marketplace proper** (left-column integration in the ZB UI). Not technically hard, but requires a cycle of focus from Chris's team in parallel with Clark's team.
3. **Third-party publishing path (reuses existing precedent):** Third party clones `zerobias-org-apps` repo -> forks -> builds app locally -> opens PR -> Clark merges -> auto-deploys to `UAT.zerobias.com/<their-app-name>`. Same path used for Mira XR and the cyber-command app, and the same path Clark used for SME Mart itself.

### Provider-Org Engagement Default (what Clark is working on NOW)

- When a third-party organization is a full ZeroBias customer, they **automatically** have a one-way engagement with ZeroBias as the provider — no manual setup needed.
- This engagement is the anchor for the customer's project with ZeroBias. Every customer lands in a project with us by default.
- Each side has its own board (their internal board + ZeroBias's internal board), connected through a **transparency middle** that all requests/responses flow through.
- "This is all dual — we have our shit, they have their shit, and then we come together." (Brian)

### Project / Workspace Prototype Strategy

- Clark is building his own version of project + workspace constructs **inside SME Mart** as a prototype.
- When Nic releases core project/workspace pieces, Clark swaps his prototype out piece by piece. Brian's metaphor: "he eats your framing."
- No wiring from Nic's side yet — Clark is not blocked.

### Task Volley as MVP

- Near-term data flow = **minimally viable task volley**: request goes out, response comes back. Status updates, ticket updates, "in progress" flags.
- Longer-term = richer data flows between org boundaries — "I need these 4 data objects within this boundary," read/write permissions between boundaries. Deferred.

### Messaging Center (separate from mirrored tasks)

- Organizations can set up any number of boards / task views they want.
- Two distinct concepts: **entangled-pair tasks** (mirrored across boundary) and a **messaging center** (dialogue channel, not necessarily mirrored). Clark compared it to "PromptQL" that Brian had described before.
- Each org owns its own board layout.

### Nomenclature Convergence

- Slack now has a "project" capability inside channels — new feature. Brian flagged it as worth checking out because industry nomenclature (project / workspace / task) is converging.
- Brian floated a future **"Plans"** section as a bulletin-board-style area tied to a project/subproject/workspace — for plan updates — but explicitly marked as speculative.

## Action Items

- **Clark:** Continue building default engagement + project prototype in SME Mart (in-flight).
- **Clark + Brian:** Decide on the public name/slug for the Phase-1 portal link (marketplace vs community apps vs something else) — unresolved.
- **Clark:** Check out Slack's new "project in channel" capability for inspiration on the messaging center.
- **Clark:** Give external testers an easy way to file bugs + communicate once they can poke around in their project next week.

## Still Open

- Exact name/slug for Phase-1 portal link.
- How ordering/selection works when multiple provider orgs are visible ("how do you order" — Brian).
- How "Plans" surface, if at all, in the project/workspace hierarchy.

## Target Timeline

Clark: "pretty close — in the next week or so, we'll be able to let people come in and poke around in their project and start finding bugs."
