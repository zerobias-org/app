# Skill: SME Mart Meeting Summarizer

> Customized from [ms-teams-meeting-transcription-summarizer-template.md](ms-teams-meeting-transcription-summarizer-template.md). See the template for full parsing/cleaning/summary instructions — this file only contains the SME Mart-specific customizations.

Follow all parsing, cleaning, and summary steps from the template. Apply these project-specific customizations:

## Known Participants

| Name | Role | Company/Team |
|------|------|-------------|
| Brian Hierholzer | Product Owner / CEO | w3geekery / ZeroBias |
| Clark Stacer | Frontend Developer | w3geekery (contractor) |

## Project Context

SME Mart is a marketplace platform for Subject Matter Experts, talent, and task workers, built on the ZeroBias platform. Key concepts frequently discussed:
- **Task system** — ZeroBias task engine with subtasks, assignment, billing, compliance
- **Transparency center** — Shared visibility between supply-side and demand-side parties
- **Observability** — Agent activity logging, decisioning audit trail, security checks (see [observability article notes](../notes/observability-wall-article.md))
- **Data sensitivity** — PII, CUI, data classification affecting storage and access
- **Buy-side / Sell-side** — Marketplace participants with different views of shared tasks
- **Boundaries** — ZeroBias security boundaries scoping all work

## Domain Terminology

| Term | Meaning |
|------|---------|
| SME Mart | The marketplace app being built |
| Boundary | ZeroBias access-control perimeter for an engagement |
| Transparency Center | Shared audit/visibility view between supply and demand parties |
| C-Traces | Cognitive Traces — observability concept for capturing agent reasoning (action + context + justification) |
| CUI | Controlled Unclassified Information (government data classification) |
| Hub Module | ZeroBias connector module for external data sources |
| Dana | ZeroBias core API layer |

## Preferred Next Actions

1. **Create Jira tasks** — Use Atlassian MCP tools (project: PM, site: 0bias.atlassian.net)
2. **Draft Slack message** — Summarize for team members not on the call
3. **Generate requirements doc** — Extract specs into a structured document
4. **Attach to ZB task** — Add summary as a comment on the weekly Marketplace meeting task (via `/tt` rollup flush)
5. **Save meeting notes** — Save to timetracker meetings archive

## Notes Save Location

Primary: `~/.claude/timetracker/meetings/`
Secondary: `.planning/notes/meetings/` (project-local copy)
Filename: `YYYY-MM-DD-marketplace.md`
