# Workspace Patterns for SME Mart — Synthesis & Plan

**Date:** 2026-04-15
**Source:** Multica patterns in `~/Projects/zb/zerobias-org/zb-dx/patterns/` + Slack thread w/ Brian 2026-04-15 09:42–10:17 AM PT

## Context

Explored 5 Multica patterns for applicability to SME Mart:
- `multica-engagement-workspace-hierarchy.md` (3-tier)
- `multica-workspace-isolation-boundary.md` (workspace as single-seam)
- `multica-flat-projects-with-relations.md` (DAG, not tree)
- `multica-boundaries-as-first-class.md` (subset rule)
- `multica-activity-log-pattern.md` (append-only audit)

Initial read put Workspace *above* Project (per Multica's actual schema). Brian reframed it to *within* Project — a team/agent/crew isolation layer — and introduced **Portfolio** as the multi-project wrapper and **Aperture** as a workspace specialty lens.

## Final hierarchy (locked by Brian 💥 2026-04-15 10:17 AM PT)

```
ENGAGEMENT (primary + linked — multi-party commerce contract, per CE1)
    │
    ▼
PORTFOLIO (project portfolio — transparency dashboard, sortable by project,
    │       drillable into workspaces by aperture)
    │       belongs to ONE engagement (default, pending Brian clarification on cross-engagement case)
    ▼
PROJECT (main container, flat + typed relations to other projects)
    │
    ▼
WORKSPACE (crew inside project: members + agents + skills + scoped activity log)
    └── aperture: specialty lens (cyber, AI, clinical, encryption, IAM, ...)
```

## Why this shape (not Multica's 3-tier)

- CE1 already carries the multi-party semantics at Engagement. No need to add Workspace *above* Project for that purpose.
- Brian's mental model: Workspace = "agents/people within a project." Matches operational reality for crew-based work (e.g., 3PAO audit teams).
- **Portfolio** takes the "wraps many projects" role cleanly, exposes Brian's required transparency-dashboard + drill-by-aperture UX.
- Avoids project nesting for cross-project work — handled by typed relations (CE10) not parent/child.

## Pattern → Plan mapping

| Pattern | Plan | Summary |
|---|---|---|
| Flat projects + typed relations | **CE10** | `project_relation` entity: `relates_to` / `depends_on` / `blocked_by` / `supersedes` / `derives_from` / `requires` |
| Append-only activity log + ZB extensions | **CE11** | `activity_log` class with `boundary_set`, `engagement_id`, `portfolio_id`, `party_visible_to`, `hash_chain`. 3-level rollup: workspace → project → portfolio. |
| Boundaries as first-class subset | **CE12** | Enforce chain: `engagement ⊇ portfolio ⊇ project ⊇ workspace`. Tighten-never-loosen rule at each level, middleware-enforced. |
| Workspace isolation (within-project) | **CE13** | Net-new: Workspace entity holding members + agents + skills + activity scope + **aperture** (specialty lens). |
| Engagement-workspace-hierarchy (middle-tier wrapper) | **CE14** | Net-new: Portfolio entity wrapping N projects under one engagement. Transparency dashboard + aperture-drill surface. |

## Resolved 2026-04-15 (Brian Slack follow-up 10:28–10:31 AM PT)

1. ✅ **Portfolio cross-engagement scope** → **Single engagement only.** Engagement is highest level; no spanning ("until someone asks ;)"). New nav concept surfaced: **Engagement Portfolio** = directory view sorting all engagements a party has access to ("just a directory structure"). Full nav hierarchy: Engagement Portfolio → Engagement → Project Portfolio → Project → Workspace.
2. ✅ **Aperture taxonomy** → **Tag-based, malleable** (hydra tags). User-customizable. Not a fixed enum. CE3 3PAO specialty list is a natural seed set but not authoritative.
3. ✅ **Activity log rollup / workspace privacy** → **Default private + anonymous.** Transparency is **opt-in via linked task pairs (req↔sat)** — this ties directly to CE4 Demand/Supply twins as the canonical opt-in mechanism. Flips earlier assumption; significant design implication.
4. ⏸ **Workspace lifecycle (archive cascade)** → **Deferred** per Brian.

### Implications of the privacy flip

- **CE11 (activity log)** default model: log stays in workspace unless explicitly opted-in. Rollup chain exists but is not automatic.
- **CE4 (Demand/Supply twins)** becomes the **opt-in hook** — when a workspace links a req↔sat task pair across the twin boundary, that pair's activity becomes visible to the receiving party. Single canonical mechanism instead of ad-hoc visibility toggles.
- **CE13 (Workspace)** spec now includes: `isPrivateByDefault: true` + `optInLinks: [TaskPairLink]` structure.
- **CE6 (Publish-to-Shared)** semantics clarified: "publish" = creating/activating a req↔sat link, not a manual push.

## Relationship to CE1–CE9

- **CE1** (home + linked engagements) — unchanged; portfolio/workspace are *inside* the engagement model, not replacing it
- **CE3** (multi-3PAO scope) — 3PAO crews become Workspaces with aperture = their specialty
- **CE6** (publish-to-shared) — workspace activity flows into project activity flows into portfolio transparency
- **CE7** (sub-project hierarchy, `parentProjectId`) — **reassess**. With CE10 typed relations + CE14 Portfolio as wrapper, `parentProjectId` may be redundant. Possibly deprecate CE7.
- **CE9** (nested transparency centers) — CE11's 3-level rollup may resolve most of the nesting concern. Re-evaluate after CE11 lands.

## Slack thread summary (2026-04-15)

- 09:42 AM Brian: "Is this a transparency construct also? Is workspace potentially smaller within a project?"
- 09:45 AM Clark: "yes transparency can be between any project in workspace, workspace will have transparency views for any project, customizable dashboard"
- 10:00 AM Brian: "Is workspace potentially smaller within a project and there is another construct to wrap projects?"
- 10:03 AM Brian: "Multica seemed to be smaller construct of agents/people within a project vs wrapping projects"
- 10:03 AM Brian: "There may be a need for within project and above project"
- 10:05 AM Brian: "I like workspace smaller within ai agent / human teams within project. But there may be a term still that wraps projects due to nesting issue."
- 10:06 AM Brian: "If you can avoid nesting I think it works simpler. Just need a term for multi project wrapper or are we just saying engagement grows more?"
- 10:08 AM Brian: "Portfolio may be a term we can toy with"
- 10:12 AM Brian: "Consider Portfolio. Project Portfolio 'folio' for short. Contains lots of projects. Transparency Portfolio can be sorted by project and you can drill down into workspace areas (maybe with more granular 'aperture'). So you can categorize workspaces by 'aperture' type maybe"
- 10:17 AM Brian: "💥 for now! This way it aligned with that agent/human 'workspace' concept"
