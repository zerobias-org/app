# Marketplace Meeting — 2026-03-31

**Date:** March 31, 2026
**Time:** 2:00 PM – 2:30 PM PT
**Duration:** ~30 minutes
**Participants:** Brian Hierholzer (Product Owner/CEO), Clark Stacer (Frontend Developer)
**Meeting Type:** Architecture / Platform Direction

---

## Topics Discussed

- **WAP/Fiverr/Upwork positioning** — Brief discussion on how SME Mart compares to existing marketplace platforms. Brian sees it as a hybrid of app marketplace and consultancy services.

- **Org construct must be replaced with boundary-based permissions (CRITICAL)** — Brian raised a fundamental architectural change: the current "org" construct in ZeroBias is being misused. External parties should never "join" an org. An organization is strictly a legal entity — same email domain, same 2FA/IDP. Anyone outside that domain must interact through **boundary permission sets** within **projects**, not org-level permissions. This is the primary topic and decision of the meeting.

- **Boundary as the security construct** — Boundaries are the centralized global IAM across all applications. A boundary grants access to applications and systems. Multiple orgs can be invited to boundaries via projects. Projects require at least one boundary for cross-org interaction.

- **Project hierarchy** — Brief discussion of sub-projects (e.g., day shift vs. night shift teams). Brian recommended stubbing this for now but not going deep.

- **Progress update** — Clark described work on My Orgs page and org profile page, which Brian flagged as needing to shift to the boundary/project model.

## Key Decisions

1. **Org permissions must be split**: users sharing the org's email domain + 2FA stay as org members. All others move to boundary permission sets. This is non-negotiable.
2. **The "org switcher" should become a boundary/project switcher** for external parties.
3. **This is critical/immediate priority** — the platform team is actively building project features, so the change must happen now.
4. **Clark will introduce the concept internally** first (to Kevin, Nick, Chris), then bring Brian in for details.

## Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Start Slack thread with Kevin, Nick, Chris about org→boundary permission migration | ASAP (2026-04-01) | Brian has already raised this with Kevin before; needs formal team alignment |
| 2 | Clark | Draft a proposal/summary of the org vs boundary distinction for Kevin | ASAP | Use this meeting summary as the basis |
| 3 | Clark | Model boundary-based permissions in SME Mart | Near-term | Can prototype in SME Mart and hand over to platform team |
| 4 | Brian | Join follow-up discussion once internal team has digested the concept | After Clark's intro | Brian to provide detail and reinforce urgency |

## Open Questions / Unresolved

- Do permissions cascade from parent projects to sub-projects, or does each project define its own?
- How to handle the transition for existing org-level permission data?
- What happens to the current "My Orgs" page — does it become "My Projects" or "My Engagements"?

## Key Quotes

> "If I don't have an email address at zerobias.com, I am not part of their org. And if I don't use their two-factor and an email address, I am not part of their org. Period." — Brian Hierholzer

> "The boundary is the security container that does everything. I do not see a use case where this is an org level permission set." — Brian Hierholzer

> "This is a very near term construct that has to be changed — critical in my opinion." — Brian Hierholzer

> "It's an interface. It's a boundary. It's a firewall. There's like points that you open up between them. Only the pieces that you want open are open." — Clark Stacer

---

## Core Concept: Org vs Boundary

| | Organization | Boundary |
|---|---|---|
| **Who** | Same email domain + same 2FA/IDP | Any party (internal or external) |
| **Access** | Full org-level systems | Scoped to specific apps/systems within the boundary |
| **Vehicle** | Employment / domain membership | Project invitation → boundary permissions |
| **Example** | clark@zerobias.com = part of ZeroBias org | clark@w3geekery.com = boundary participant in a ZeroBias project |
| **Construct** | Legal entity | Security perimeter / IAM container |

**Rule:** If a user does not share the org's email domain AND does not use the org's IDP/2FA, they are NOT part of the org. They interact via boundary permission sets within projects.
