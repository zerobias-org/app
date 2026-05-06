## Meeting Summary

**Date:** 2026-03-13
**Duration:** ~27 minutes
**Participants:** Clark Stacer, Brian Hierholzer
**Meeting Type:** Weekly Marketplace Strategy / Planning

### Topics Discussed

- **GraphQL Schema & Publishing Pipeline** — Clark has been working with Daniel on the GraphQL schema. Daniel is still finalizing the GitHub Actions publishing pipeline, expected soon.

- **UAT Environment Migration** — Clark is repointing local dev environments to the new UAT (ZeroBias platform side) as W3Geekery (customer perspective). Old environments will be nuked soon, so building on UAT now to harden it and find what's breaking.

- **End-to-End Testing with Playwright** — Clark has been exploring Playwright for full smoke tests. Brian mentioned MCP Browser tool on the zerobias.org channel. Both agreed it's likely a supply-side concern — once Catalin's ZeroBias-hosted MCP server is ready, MCP Browser integration would make sense.

- **Cloudflare & Agentic Traffic** — Discussion about Cloudflare publishing new tools to handle the surge in agentic scraping traffic. The need for alternate infrastructure paths for agents vs humans — relevant to SME Mart's agentic assistance features.

- **Agentic RFP/Bid Assistance** — Clark is building LLM prompts for agentic assistance with RFPs and bids. Future options include standalone agents via Claude Agent SDK bundled with ZB MCP tools — estimated ~$0.56/interaction, potentially $10-30 per RFP generation. Can charge customers for the service.

- **Internal vs External Marketplace** — Key conceptual discussion: SME Mart should work for both external (company-to-company) and internal (BU-to-BU within same organization) marketplace scenarios. Same supply/demand constructs apply:
  - **External:** Company posts RFP, suppliers bid
  - **Internal:** Team proposes project internally, needs approval through same process
  - **Reverse bids:** Supply side can propose projects to demand side (must have existing engagement — no unsolicited proposals)
  - Less legal overhead for internal, but same structural requirements

- **Task System Architecture (Demand/Supply/Transparency)** — Deep discussion on the three-part task model:
  - **Demand side:** Requirements, task origination, approval
  - **Supply side:** Fulfillment, remediation, internal work (some branches only visible to supply)
  - **Transparency center:** Shared visibility layer with full audit capability
  - Tasks can be assigned via matching process (round robin, FIFO, LIFO, capability-based) across multiple suppliers
  - Subtasks provide fine-grained detail; higher levels aggregate into summaries
  - Need to determine if there's a nesting layer between project and task (epic/playbook concept)

- **Board Concept** — Chris has discussed boards that can contain any combination of tasks/projects across multiple boundaries and engagements. Service providers need cross-project, cross-boundary visibility.

- **Notes Feature Update** — Clark built read-only checkboxes in the notes feature that can wire up to task status, giving project managers at-a-glance visibility into branch completion status.

### Key Decisions

1. SME Mart will support both internal (intra-company) and external (inter-company) marketplace scenarios using the same supply/demand constructs
2. Reverse bids (supply-originated proposals) will be supported, but only within existing engagements — no unsolicited proposals
3. Task system will follow the three-part model: demand side, supply side, transparency center — at both task and subtask levels
4. Current approach: use tags as generic containers for projects until ZeroBias platform has a formal project construct

### Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Add internal marketplace scenarios to roadmap | Next sprint | Same constructs as external, delineated differently |
| 2 | Clark | Document supply-side task origination (reverse bid) flow | Upcoming | Suppliers proposing projects within existing engagements |
| 3 | Clark | Build full end-to-end smoke test path for buyer/seller flow | Next couple weeks | Playwright-based, browser fills in forms and validates results |
| 4 | Clark | Continue UAT migration and bug stomping | Ongoing | Report issues to backend team (Chris/Nick/Andrey) |
| 5 | Clark | Explore nesting layer between project and task | Future | Epic/playbook concept for grouping tasks |

### Open Questions / Unresolved

- What is the nesting hierarchy between project and task? Is an epic/playbook layer needed?
- How will the matching/assignment process work across multiple suppliers (round robin, capability-based, etc.)?
- How should boards work across multiple boundaries and engagements for service providers?
- When will ZeroBias platform have a formal project construct? (Currently using tags as containers)
- MCP Browser — is it supply-side or demand-side? Need to evaluate once Catalin's hosted MCP server is ready

### Key Quotes

> "SME Mart could work internal to companies just the same as it could work from companies they don't know that are truly in the marketplace. So it's almost like our marketplace is the global marketplace of ZB, but then there's also an internal marketplace." — Brian

> "I don't see how a task doesn't break into a transparency middle, a supply side portion and a demand side portion." — Brian

> "There's a central task that's the shared task and then there's branches of a tree, but certain branches are only visible from the supply side, certain branches are only visible from the demand side, certain branches are visible from both." — Clark

> "All we're doing is summarizing and aggregating and packaging subtasks into groups or into the tasks and multiple tasks into a runbook that rolls into a project." — Brian
