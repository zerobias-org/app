# Marketplace Meeting — 2026-04-03

**Date:** Friday, April 3, 2026
**Time:** 1:00 PM – 1:30 PM PT
**Duration:** ~32 minutes
**Participants:** Brian Hierholzer, Clark Stacer
**Meeting Type:** 1:1 / Status + Strategy

---

## Topics Discussed

- **RFP Invitations & Private Bids** — Clark demoed the new RFP invitation system: private RFPs allow buyers to invite specific vendors; vendors see only an overview until they accept. Brian raised the idea of an interim NDA step before full RFP details are disclosed, plus a "semi-private" category for teasers visible in the public listing.

- **RFP Requirements & Qualification Criteria** — Brian wants even public/open RFPs to carry mandatory qualification criteria that vendors must prove they meet (background checks, certifications, citizenship). Clark showed the form builder approach: buyers define checklists with file uploads, and vendors submit proof that the buyer explicitly accepts. Brian noted future agentic/automated assessment could vet criteria programmatically.

- **Pilot Projects** — Clark built a pilot project phase where a lightweight engagement (e.g., sign an NDA, limited scope) can be promoted to a full project or spawn a new one. Connects naturally to the RFP invitation flow.

- **"Braille" Analogy for Programmatic Commerce** — Brian introduced a "Braille" metaphor: if both parties were blind, deaf, and mute, how would they transact? The answer is deeply programmatic, machine-readable requirements and responses — not PDFs and Word docs. Cited an IBM story where 40 people worked months on a response to a complex RFP that changed scope twice and ultimately went nowhere. SME Mart's mission is to make this process structured, transparent, and machine-actionable.

- **Platform as Commerce Engine** — Brian reiterated that ZeroBias is fundamentally a commerce/assessment engine: audit, remediation, DevSecOps, license compliance, ITSM — all the same pattern of requirements + satisfaction + transparency. Cited Quest Software's licensing audit mess as another example of the problem SME Mart solves.

- **Transcript-to-Task Product** — Brian wants to combine Clark's meeting summarizer with Joe Llamas's Claude-based work into a reusable product: record meetings, transcribe, auto-assign tasks, push to Slack. Vision: real-time meeting assistant that listens and creates tasks on voice cue ("hey Claude, make a task for this"). Brian asked Clark to open a private Slack channel with himself, Clark, and Joe to collaborate on this.

- **PromptQL / Messaging Center** — Clark researched PromptQL (from the GraphQL team) and proposed embedding a Slack-like messaging channel into SME Mart projects so conversations feed directly into the project timeline. Brian told Joe to explore the same approach to move internal comms off Slack.

- **Clark-Dan Sync Channel** — Clark created a private Slack channel (on ZeroBias org) for Clark and Dan to sync on platform integration. Shared a Claude-generated protocol for their Claude instances to align on terminology and tech stack.

## Key Decisions

1. **Private RFPs proceed as-is** — invite-only with overview teaser until accepted. Semi-private (visible teaser in public listing) deferred to later iteration.
2. **All RFPs can carry qualification criteria** — even open/public ones. Form builder approach with explicit proof submission.
3. **Transcript-to-task tool** — Clark, Brian, and Joe to collaborate in a new private Slack channel. Goal: reusable product from existing transcript/summarizer work.

## Action Items

| # | Owner | Action | Priority | Context |
|---|-------|--------|----------|---------|
| 1 | Clark | Open private Slack channel with Clark, Brian, Joe Llamas for transcript-to-task collaboration | High | Brian wants to combine Clark's summarizer + Joe's Claudbot work |
| 2 | Clark | Continue RFP invitation implementation (current GSD phase) | In progress | Private RFP invitations, vendor accept/decline flow |
| 3 | Clark + Joe | Collaborate on merging transcript processor + task assignment into a reusable product | Medium | Brian sees this as a shippable product within the project |
| 4 | Brian | Send today's meeting transcript file to Clark | Done | Was the wrong file initially; corrected version received |

## Open Questions / Unresolved

- Should there be a "semi-private" RFP category (teaser visible in public list, request-to-invite)?
- Where does the NDA step live in the RFP flow — as a pilot project or as a gate within the invitation acceptance?
- How will programmatic qualification verification work? (agentic assessment vs. manual buyer review — future phase)
- PromptQL-style messaging: build custom or embed Slack channels into projects?

## Key Quotes

> "What if we were blind, deaf, and dumb, and the only way to do business was a Braille system — deeply programmatic, very explicit, machine-readable. That's what we're building." — Brian

> "IBM had 40 people on this high-end bid process for months. The RFP changed, the team changed, and they didn't even get it. All because there's no programmatic way to do this." — Brian

> "My job is to map what you say your vision is onto what's possible to do in the platform." — Clark

> "We are just architecting a way for service providers in a new AI world... It's agentic commerce." — Brian
