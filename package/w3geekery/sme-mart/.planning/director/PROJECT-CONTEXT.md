# SME Mart — Director Project Context

**Purpose:** Project-specific context for the meta:director command. Loaded alongside SESSION-STATE.md on every invocation to ground the director in SME Mart's reality.

---

## What This Is

SME Mart is a **marketplace for Subject Matter Experts** in compliance/cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Buyers post RFPs, vendors bid, accepted bids create Engagements (corp-to-corp agreements) which spawn Projects (scoped work).

## Tech Stack

- **Framework:** Angular 21.1.4 (standalone components, no NgModules, no Nx)
- **UI:** Angular Material 21 + `@zerobias-org/ngx-library` (use library components before building custom)
- **State:** RxJS BehaviorSubjects in services, `async` pipe in templates
- **Data reads:** GraphQL via `@zerobias-com/zerobias-angular-client` → `graphqlClient`
- **Data writes:** Pipeline via `PipelineWriteService` (fire-and-forget, 5-10s eventual consistency)
- **Auth:** `ZerobiasClientApp.init()` → session check → org selection
- **Deploy:** Vercel (temporary), target S3/CloudFront on ZB platform
- **DB:** Neon PostgreSQL (direct HTTP for non-migrated entities), AuditgraphDB for 17 GQL entities
- **Testing:** Vitest, `npm test` → `ng test`
- **Build:** Angular CLI (`ng build`), esbuild-based `@angular/build:application`

## Angular Documentation & Skills

**MANDATORY for all Angular implementation work:**

- **`AGENTS.md`** (project root) — Index of ALL local Angular 21 documentation in `.angular-docs/`. Covers signals, components, routing, forms, testing, DI, templates, etc. Refresh with `npx angular-agents-md`. **GSD agents MUST read AGENTS.md before implementing any Angular component work** — use retrieval-led reasoning, not pre-training.
- **`.angular-docs/`** — Full Angular 21 docs (guides, API references). Referenced by AGENTS.md.
- **`/sme-mart-architect` skill** (`.claude/skills/sme-mart-architect.md`) — SME Mart-specific Angular patterns: standalone components, ngx-library theming, DataProducer/Generic SQL data layer, ZeroBias SDK integration, no Nx. **Invoke this skill for implementation decisions.**
- **`/angular-architect` skill** (global) — General Angular 21 architecture: RxJS, signals, enterprise patterns, performance.

## Deployment Model

This is a **static SPA**, not a containerized service. There is no Docker, no boot sequence, no server process. The relevant initialization flow is:

```
Browser loads index.html
  → Angular bootstrap (main.ts → app.config.ts providers)
    → APP_INITIALIZER: ZerobiasClientApp.init()
      → Session check (redirect to /login if no session)
      → Org selection (sessionStorage: zb-current-dana-org-id)
      → Service initialization (catalog, preferences, etc.)
        → Router activates, components render
```

If the director's design mode asks about "boot sequence," this is what it means for SME Mart.

## Platform Security & Permission Model (CRITICAL — read before any boundary/permission work)

**Source:** ZeroBias Platform Security Guide (kb9) + Kevin corrections (2026-04-02).
**Reference:** `.planning/docs/ZB_PLATFORM_SECURITY_GUIDE.md`
**How to refresh:** `meta.getKbArticleContent` with `code: "kb9"` via ZB MCP.

### The Actual Layering

```
Org (tenancy, governance, resource ownership)
 ├── Resource Authorization (platform-wide IAM)
 │    └── Access Rules → Principals × Permissions × Resource Selectors
 └── Boundary (compliance scope + operational permissions)
      ├── Who can see collected data
      ├── Who can open tasks
      ├── Who can run hub module operations
      ├── Frameworks, controls, evidence
      └── NOT a general policy engine (no door locks, no arbitrary IAM)
```

**Org** = tenancy + governance container. Owns all resources. Users must belong to at least one. Multi-org membership is a first-class use case (auditors, consultants, shared services across divisions). Domain registration is *recommended practice*, not a hard constraint today.

**Boundary** = compliance scope + operational permissions. Controls who can do what *inside* the boundary — open a task, see collected data, allow/disallow hub module operations. It is NOT a general-purpose policy engine. Boundaries are bound to compliance frameworks and organize data/evidence.

**Resource Authorization** = the general IAM layer. Access Rules grant Principals (users, groups, API keys) permissions on Resources (apps, boundaries, connections, audits). Resource Selectors support exact match, type-based, tag-based, and property-value matching.

### Brian's Vision vs Platform Reality

| Brian says | Platform reality | Gap? |
|------------|-----------------|------|
| Org = strictly legal entity (same email domain + IDP) | Org = governance container. Domain verification coming but not enforced. Multi-org membership is normal. | No gap — aspirational direction, not a constraint today |
| Boundary is THE security construct | Boundary controls operational permissions within its scope. Resource Authorization is the general IAM. | No gap — Brian is directionally right for the SME Mart use case |
| External parties interact through boundary permission sets | Boundary party/role/team APIs already exist (`listBoundaryParties`, `listBoundaryPartyRoles`, `listBoundaryTeams`). Cross-org grants supported via Resource Authorization. | No gap — APIs exist, SME Mart just needs to surface them |
| The platform needs to change | It doesn't. The features Brian wants are already built. | **No platform gap.** SME Mart UI gap only. |

### Design Rule

**Brian's instincts about WHAT should happen are usually right. His understanding of HOW the platform works is often wrong.** Our job is to map his vision onto existing platform constructs, not build new platform features. Always verify API availability before accepting "platform needs to change" claims.

When Brian describes a feature:
1. Translate his business language into platform concepts (boundary, resource, access rule, party, role)
2. Search ZB MCP to verify the API exists (`zerobias_search`)
3. If the API exists → build the SME Mart UI that surfaces it
4. If the API doesn't exist → flag to Kevin, don't build a workaround

## Data Layer Pattern

```
WRITES:                                    READS:
Component → Service → PipelineWriteService   Component → Service → GraphqlReadService
  pushEntity(classId, fields)                  query { smeMartEngagement { ... } }
  fire-and-forget, returns immediately         returns current AuditgraphDB state

  Cache: PipelineWriteCache (60s TTL)          Eventual consistency: 5-10s delay
  seedCache() from GQL on first load           Optimistic updates mask the delay
```

17 entity types on AuditgraphDB. 7 non-migrated services still use Neon direct (SmeMartDbService).

## Team

- **Brian** — CEO. Business directives. Not a developer. Meetings Tuesdays/Fridays.
- **Kevin** — CIO. Platform infrastructure. Flag Hub/platform issues to Kevin.
- **Clark** — W3Geekery contractor. SME Mart frontend. **15 hrs/week cap.**

Requirements arrive informally from Brian meetings, not formal specs.

## Scope Boundaries

**SME Mart scope (active):** Marketplace features — RFPs, bids, provider catalog, engagements, corporate vetting, engagement messaging, engagement dashboards.

**NOT SME Mart scope (deferred):** Project management (boards, tasks, activities, workflows, Gantt, financials, compliance linkage). Kevin: "Projects probably would be their own app." Plans 057-074 are deferred for this reason.

**Review/checkpoint should flag** any plan that crosses into project management territory.

## GQL Schema Workflow

**MANDATORY READING:** [`.planning/docs/SCHEMA_CHANGE_PROCESS.md`](.planning/docs/SCHEMA_CHANGE_PROCESS.md) — full step-by-step guide for any GQL schema changes. GSD agents MUST read this before planning or executing any schema work.

Schema changes require a PR to `zerobias-org/schema:dev`, which triggers platform reload (~15 min). Steps:
1. Edit YAML in `zerobias-org-forks/schema` (our fork)
2. Run `npm run verify` (dataloader validation — **mandatory before commit**)
3. PR against `zerobias-org/schema:dev`
4. Wait 15 min for platform to pick up changes

Class IDs are deterministic (same across environments). Pipeline IDs are NOT.

## Key IDs (UAT)

| Entity | ID |
|--------|-----|
| Boundary (SME Marketplace DEV, W3Geekery) | `c15fb2dc-4f8c-48b5-b27a-707bd516b005` |
| Pipeline (SME Mart Entity Pipeline) | `f6d1f579-fe02-4158-b99e-a55113fd70cb` |
| Org (W3Geekery) | `cd7105df-523d-5392-9f9a-3f83d3f30107` |
| Prior (decommissioning) boundary — ZeroBias SME Marketplace | `e3871f0b-56f0-4e5e-87c6-6ca196bf88c7` |
| Activity (Ad Hoc) | `e15830c8-4274-4d67-bf9b-c22b60001e32` |

Full ID mapping: `.planning/notes/uat-migration-tracker.md`

## Planning Structure

| File | Purpose |
|------|---------|
| `.planning/BACKLOG.md` | **Source of truth** for all pending work. Stubs go here. |
| `.planning/PROJECT.md` | Project identity, constraints, current state. |
| `.planning/ROADMAP.md` | Current milestone phases. |
| `.planning/STATE.md` | GSD execution state. |
| `.planning/RETROSPECTIVE.md` | Cumulative learnings. |
| `.planning/director/` | Director's workspace (this file, SESSION-STATE, WATCH-LIST, DECISIONS). |
| `.claude/plans-archive/` | 55 historical plan files from pre-GSD era (local, gitignored). |
| `CLAUDE.md` | Project conventions, Quick Reference. |

## Design Mode — SME Mart-Specific Questions

When in design mode, always explore:
- Does this feature affect demand side, supply side, or both?
- How does it interact with the engagement lifecycle (RFP → Bid → Engagement → Project)?
- Does it need GQL schema changes (new entity/fields)?
- Does it need Pipeline write support (new entity type)?
- Does it touch ZB platform APIs (tags, tasks, boundaries)?
- Is this marketplace scope or project management scope?
- What would Brian demo? What does he care about?
- Can we use ngx-library components, or do we need custom UI?
- Is the scope realistic for 15 hrs/week?

## Review Mode — SME Mart Checklist

In addition to the standard review checks:
- [ ] Standalone components (NOT NgModules)
- [ ] `inject()` function (NOT constructor injection)
- [ ] ngx-library components used where available
- [ ] No `!important` in CSS
- [ ] Immutable data patterns (new objects, not mutations)
- [ ] Pipeline writes use full-replace (never partial pushes)
- [ ] GQL field names match schema (not display names)
- [ ] Environment-specific IDs are not hardcoded in source
- [ ] File naming uses type suffixes (`foo.component.ts`, not `foo.ts`)
- [ ] Effort estimate fits 15 hrs/week budget
- [ ] Feature stays in marketplace scope (not project management)
