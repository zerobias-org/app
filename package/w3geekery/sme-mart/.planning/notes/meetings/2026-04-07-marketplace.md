## Meeting Summary

**Date:** 2026-04-07
**Time:** 2:00 PM – 2:45 PM PT
**Duration:** ~42 minutes
**Participants:** Brian Hierholzer, Clark Stacer
**Meeting Type:** Strategy / Architecture Discussion

### Topics Discussed

- **Shared repo for third-party developer artifacts** — Brian wants Clark to push the current w3geekery toolkit repo to a ZeroBias org repo ("sample app builder toolkit"). Work Worlds may also want access. Kevin confirmed repo location doesn't matter yet — artifacts will be organized later.

- **Environment firewall rules (CRITICAL)** — Brian reinforced strict environment separation. w3geekery/Geekery must stay on **UAT only** — no cheating by using dev. Dev is exclusively for ZeroBias core team. Same rule applies to Dan/SDI — must stay on UAT (currently on prod, needs to migrate). If UAT is broken, either fix it or work on non-blocked items. This is a hard rule.

- **Dev environment rebuild** — Kevin and Chris are rebuilding dev with new UAT features. Clark is temporarily on UAT; will switch back to dev when rebuild completes. Some UAT issues remain unresolved.

- **UI prototyping approach** — Brian prefers top-down visual/UI-first design (Miro mockups → requirements → code). Clark historically worked from designer mockups but now uses bottom-up emergent approach with Claude generating UI from data models and requirements. GSD has a UI spec step that can accept design contracts. Both approaches converge — Brian's Miro diagrams feed Claude's implementation.

- **Brian's Miro board impact** — Clark confirmed Brian's transparency center Miro diagram was highly valuable — it crystallized the juxtaposition pattern (two-sided task boards with transparency center in the middle). Previously the visual picture was unclear.

- **Project/Engagement architecture refactoring** — Clark realized engagements don't need a separate GQL object — they're just another project type with different properties. Both are containers for requirements and proof of satisfaction. Project types could include: engagement, pilot, financial, commerce, licensing, technical.

- **Boundary types as architecture pattern (MAJOR)** — Brian and Clark converged on a key architectural insight: boundaries should be **typed** (commerce boundary, licensing boundary, technical/network boundary, engagement boundary). Each boundary type has its own people, policies, apps, frameworks, and standards. A **project** is the container that rolls up multiple typed boundaries. The transparency center aggregates across all boundary types at the project level. RBAC lives at the boundary level — finance people see finance tasks, engineers see technical tasks, etc.

- **Commerce boundary specifics** — Commerce boundaries would contain payment gateways (Stripe, Plaid, Wells Fargo), FINRA rules, PCI compliance, revenue models, licensing. Different permission sets for finance/accounting roles on both buy-side and sell-side.

- **Multi-party transparency** — The assessor sits between buyer and seller. Brian has an existing slide deck diagram showing this three-party arrangement. Transparency center runs vertically through all boundary types.

- **Schema development lifecycle** — Brief mention of an emergent community-driven schema management process: community develops/forks schemas → hardens through QA/UAT/prod → then released to private orgs for private schema development.

### Key Decisions

1. **Push shared toolkit repo to ZeroBias org** — Clark will move the w3geekery repo to a zerobias-org repo (sample app builder toolkit).
2. **w3geekery stays on UAT only** — Hard rule, no exceptions. Same for Dan/SDI. Dev is ZeroBias core only.
3. **Engagement = project type** — No separate engagement object; engagements are a project type within the existing project construct.
4. **Boundaries are typed** — Commerce, licensing, technical, engagement, etc. Projects roll up multiple boundary types. Transparency center aggregates across all.
5. **Brian will extend Miro diagram** — Adding buyer, seller, assessor, and multiple boundary types (commerce, licensing, technical) to the existing diagram.

### Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Push toolkit repo to zerobias-org | Soon | Brian wants shared visibility; Work Worlds may also need access |
| 2 | Clark | Check in with Dan on MCP/Miro integration progress | This week | Dan is adopting Clark's tooling; said it'd take a couple days |
| 3 | Clark | Discuss with Kevin: should w3geekery Clark vs ZeroBias Clark be split across environments? | Next standup | Brian's rule is clear but Clark needs to confirm logistics with Kevin |
| 4 | Clark | Refactor GQL schema — collapse engagement into project types | When unblocked | Engagement is just a project type with different properties |
| 5 | Brian | Extend Miro diagram with boundary types, buyer/seller/assessor | Tomorrow (2026-04-08) | Adding commerce, licensing, technical boundaries; three-party arrangement |
| 6 | Clark | Overlay Brian's Miro diagram with technical visualization | After Brian updates | Use tooling to extend the boundary-type view |

### Open Questions / Unresolved

- How exactly should the project construct package multiple boundaries? Is it a UI wrapper or a data model change?
- Are "apertures" (focused views within a boundary) needed, or does RBAC at the boundary level suffice?
- Where does the schema development lifecycle tooling live (community org vs private org)?
- How should commerce/monetization tasks that span multiple boundaries be categorized?
- Does Kevin's project model already support multi-boundary projects, or does it need extension?

### Key Quotes

> "Geekery cannot cheat, period. If you're blocked, you're blocked." — Brian

> "I always have to start in the UI because I'm visual and verbal... I'm always kind of visualizing it in my brain and then I kind of work backwards." — Brian

> "Having Claude really helps unlock going the other direction — not knowing what it's gonna look like yet, and then letting it materialize based on what needs to happen." — Clark

> "These are commerce boundaries and licensing boundaries... and we use the boundary construct by different types." — Brian

> "If we can just make any kind of boundary we want for any kind of thing and a project can scoop up as many boundaries as you want — that's the container for them." — Clark
