# SME Mart Hierarchy Model

**Last updated:** 2026-03-25
**Status:** Working draft — revised per Kevin's ownership model (2026-03-25)
**Purpose:** Single reference for Org → Engagement/Project ownership, relationships, and ZB platform entity mapping.

---

## TL;DR

```
Org (company identity — ZB Org)
│   Everything must trace to an Org as owner.
│
├── Engagement A (corp-to-corp agreement — MSA, D&B, banking)
│   │   Owned by Org. Legal/administrative umbrella.
│   │   ↕ relates_to (many-to-many resource links)
│   │
│   ├──relates_to── SmeMartProject A (scoped work / SOW)
│   └──relates_to── SmeMartProject B (different SOW under same agreement)
│
├── Engagement B (different corp-to-corp agreement)
│   └──relates_to── SmeMartProject C
│   └──relates_to── SmeMartProject A (same project, sub-contract scenario)
│
├── SmeMartProject A (owned by Org — shared project)
│   ├── 0+ Boundaries (ZB platform — products, frameworks, users/groups/roles)
│   ├── Boards (Buyer / Provider / Shared — structural task containers)
│   ├── Tasks / SubTasks (on boards, typed by activities)
│   ├── PRD + Plan (informational: what + how/when)
│   ├── Documents (project-scoped)
│   ├── Notes / Notebooks (project-scoped, read-up to org)
│   ├── Timeline, Members, Messages, Dashboard
│   ├── Financials, Compliance, Reviews
│   └── relates_to: Engagement A, Engagement B (many-to-many)
│
└── SmeMartProject D (owned by User — private project, no engagement)
    └── (same structure, just private)
```

### Key ownership rules (Kevin, 2026-03-25)

1. **Everything must have an owner** traceable to an Org
2. **Engagement does NOT own Project** — they are peers linked via `relates_to`
3. **Project owners:** Org (shared) or User (private)
4. **Project ↔ Engagement is many-to-many** — a project can relate to multiple engagements (sub-contracts), and an engagement can relate to multiple projects
5. **Projects can exist without engagements** (internal work, private projects)
6. **Projects can be tiny (no boundary) or huge (spanning multiple boundaries)**
7. **Documents/files owned by:** Org, Engagement, OR Project

---

## Entity Definitions

### Org

The company identity in ZeroBias. Both buyers and providers are Orgs.

- **ZB Platform:** `Org` entity
- **SME Mart:** Org-level settings, document library, provider profile
- **Views:** Documents (full org library), Settings, Engagements list

### Engagement

The **corp-to-corp agreement** between a buyer org and a provider org. Administrative and legal container — NOT where scoped work lives.

- **Storage:** `Engagement` GQL class in AuditgraphDB (migrated from Neon `work_requests` via Plan 059)
- **Created when:** A Bid is accepted on an RFP, establishing a new org-to-org relationship
- **Find-or-create:** If buyer + provider already have an Engagement, new Projects are added under it
- **Contains:** Corporate-level requirements that apply across ALL projects under this relationship

**Engagement-level requirements** (Brian, 2026-03-06):
- D&B (Dun & Bradstreet) rating
- MSA (if umbrella covering all projects)
- Banking information
- Background checks on officers
- Corporate entity verification (C Corp, LLC, etc.)
- Financial statements / bank letter of good standing

**Engagement-level views** (revised 2026-03-24):

| View | Purpose |
|------|---------|
| **Overview** | Relationship summary — buyer/provider orgs, status, creation date, originating Bid |
| **Corporate Vetting** | D&B, banking, MSA, officer background checks, entity verification, financials. Checklist/wizard with document uploads per requirement. Multiple sub-sections. (Plan 063) |
| **Projects** | Table of all SmeMartProjects under this Engagement. Status, progress %, boundary, date range. Click → Project detail. |
| **Messages** | Cross-project message center with project filter. Important items from smaller projects bubble up. (Plan 065) |
| **Dashboard** | Configurable — user adds widgets: board snapshots, task query panels, pinned notes, budget alerts, progress rollups. (Plan 066) |
| **All Tasks** | Aggregate read-only board — every task from every project, with Project column/filter. Exec-level cross-project view. |
| **Notes** | Engagement Notebook — relationship-level notes (MSA discussions, vendor performance). Read-up from projects. |

### SmeMartProject (GQL entity — Plan 057 / PR #8)

**Scoped work** — a specific SOW, deliverable set, or contract under an Engagement. This is where the actual work happens.

- **Storage:** `SmeMartProject` GQL class in AuditgraphDB (new entity, built directly against Pipeline+GQL)
- **ZB Platform:** Maps to future `Project` entity (Kevin's spec: resource with RoleScope, children = plans, files, boards, timelines, notes, chatrooms)
- **Created when:** An accepted Bid's task breakdown becomes a Project ("Project Bloom" — Plan 040)
- **Boundary relationship:** Each Project references 1+ ZB Boundaries for access scoping

**Project-level requirements** (Brian, 2026-03-06):
- MSA (if project-scoped rather than engagement-level)
- Tasks / SubTasks (the actual work, on boards)
- Deliverables and milestones
- Project tech lead contact
- Support contact info
- Subject matter contacts

**Project-level views** (defined 2026-03-24):

| View | Purpose | Plan |
|------|---------|------|
| **Overview** | Project status, boundary links, PRD summary, milestones at a glance, team leads | 057 |
| **Boards** | 3-partition view (Buyer / Provider / Shared). Primary work surface. Each board has tasks, activities, workflows. | 057 |
| **Tasks** | Flat/filtered task list across all boards. "Show me everything overdue" or "my assigned tasks." | 058 |
| **PRD** | Product Requirements Document — the "what." Sections, requirements, acceptance criteria. | 057 |
| **Plan** | Milestones, approach, timeline, dependencies. The "how/when." | 057 |
| **Notes** | Project Notebook (1:1 per project). Read-up to Engagement/Org notebooks. | 026 (scoping update) |
| **Documents** | Project-scoped document shares + project-specific uploads. | 046 |
| **Timeline** | Activity feed — task transitions, comments, doc uploads, milestone completions. | 018 (scoping update) |
| **Members** | People on this project — from boundary membership. Roles, groups, assignments. | 064 |
| **Schedule** | Gantt or calendar view of milestones + task due dates. Dependencies visible. | 067 |
| **Messages** | Project-scoped thread. Also visible in Engagement message center. | 065 |
| **Financials** | Billing history, invoices, token usage, budget tracking, milestone payments. | 068 |
| **Compliance** | Framework linkage — "Task A satisfies SOC2 A2.12." Proof/evidence links for attestation. Feeds Transparency Center. | 069 |
| **Reviews** | PM retrospectives — learnings, process improvements. Living document as project proceeds. | 070 |

### Boundary

**ZB platform security and compliance envelope.** Defines what's visible, who has access, and what products/frameworks apply.

- **ZB Platform:** `Boundary` entity — already exists, managed via Boundary Manager app
- **Contains:** Products, compliance frameworks, users, groups, roles
- **Kevin's mapping** (2026-03-06): *"A service/product offering in the catalog is realized in the platform by a Boundary"*
- **Kevin's reframing** (2026-03-20): Boundary is a *"promise keeping function"* — proves you're fulfilling all obligations (compliance, operational, SDLC, contractual). Auto-discharges requirements when evidence already exists.
- **Relationship to Project:** A Project references 1+ Boundaries. Multiple Projects can share a Boundary. Board permissions inherit from Boundary.

**What comes with a Boundary:**
- Software products used
- Personnel (users/groups/roles)
- Compliance frameworks
- Audit scoping
- Access control enforcement (resources NOT in boundary are not visible)
- Auto-satisfaction engine (boundary evidence can auto-close tasks)

### SmeBoard (GQL entity — Plan 057 / PR #8)

**Structural container for tasks.** Mirrors future ZB `Board` entity.

- Per Kevin (2026-03-17): "Board is the ground a task plugs in to. It has rank, issue number, workflows. It is structural."
- Task belongs to exactly one board
- Board inherits permissions from its parent (Org, Boundary, Project, User)
- Three default partitions per project: Buyer Requirements, Provider Deliverables, Shared Milestones

### SmeActivity + SmeWorkflow (GQL entities — Plan 057 / PR #8)

- **SmeActivity** = work type blueprint (workflow, RACI, custom fields, issue prefix). Reusable across boards.
- **SmeWorkflow** = statuses + transitions. Each activity references a workflow.
- A task has BOTH a `boardId` (where it lives) and an `activityId` (how it behaves).

### Task / SubTask

The actual work items on boards within a Project.

- **ZB Platform:** `Task` entity with `child_of` links for subtask hierarchy
- **SME Mart:** `SmeMartTask` GQL entity (new, built directly against Pipeline+GQL)
- **Typed by activity:** Security Assessment, Compliance Review, Gap Assessment, etc.
- **Lifecycle:** Per workflow — typically `backlog` → `in_progress` → `awaiting_approval` → `done`
- **Compliance linkage:** Task can satisfy specific framework controls (e.g., SOC2 A2.12) with evidence links

---

## Engagement Creation Flow

```
1. RFP published (lightweight storefront listing)
   └── Buyer uploads docs, AI suggests domain tags, budget range

2. Vendor responds with Bid
   └── Approach narrative, pricing, timeline, team qualifications

3. Bid accepted → Find or create Engagement
   ├── IF new org-to-org relationship:
   │   └── Create Engagement → trigger corporate vetting (D&B, banking, MSA, officer checks)
   └── IF existing relationship:
       └── Reuse existing Engagement

4. SmeMartProject created under Engagement ("Project Bloom" — Plan 040)
   ├── AI decomposes uploaded documents → typed task/subtask tree
   ├── 3 boards created (Buyer / Provider / Shared)
   ├── PRD + Plan generated
   ├── Both parties review and refine
   └── Transparency Center activates
```

---

## Boundary Selection Flow

```
1. Buyer creates RFP
   └── Selects boundary(s) from their org's boundaries
       └── This imports: products, frameworks, users/groups/roles

2. Vendors respond with Bids
   └── Vendor maps their capabilities to buyer's boundary requirements

3. Bid accepted → Engagement (find-or-create) + Project created
   └── Project inherits buyer's selected boundary(s)
   └── Vendor boundary may also be associated (supply-side)

4. Board permissions inherit from boundary
   └── Buyer Requirements board ← Boundary A (demand-side)
   └── Provider Deliverables board ← Boundary B (supply-side)
   └── Shared Milestones board ← both boundaries

5. Complete member/group/role list available from boundary
   └── Anything missing must be added to boundary to be in compliance
```

**Tag creation:** ZB Tags (`sme-mart.eng.*`, `sme-mart.proj.*`) are created or found during this flow to link SME Mart entities to ZB platform resources.

---

## Route Structure

```
/my/engagements/                              → Engagement list
/my/engagements/:engId/                       → Engagement shell (tab nav)
  /overview                                   → Relationship summary
  /vetting                                    → Corporate vetting wizard (Plan 063)
  /projects                                   → Project list table
  /messages                                   → Cross-project messages (Plan 065)
  /dashboard                                  → Configurable widgets (Plan 066)
  /tasks                                      → All-tasks aggregate board
  /notes                                      → Engagement Notebook
  /projects/:projId/                          → Project shell (tab nav)
    /overview                                 → Project summary
    /boards                                   → 3-partition board view (Plan 057)
    /boards/:boardId                          → Single board focus
    /tasks                                    → Flat task list (Plan 058)
    /prd                                      → PRD sections (Plan 057)
    /plan                                     → Milestones + approach (Plan 057)
    /notes                                    → Project Notebook
    /documents                                → Project-scoped docs
    /timeline                                 → Activity feed
    /members                                  → Team from boundary (Plan 064)
    /schedule                                 → Gantt/calendar (Plan 067)
    /messages                                 → Project-scoped thread (Plan 065)
    /financials                               → Billing + budget (Plan 068)
    /compliance                               → Framework linkage (Plan 069)
    /reviews                                  → Retrospectives (Plan 070)
```

---

## Notes Scoping

Notes are hierarchically scoped with **read-down, edit-at-level** semantics.

### Notebook Types

| Notebook | Scope | Who can edit | Who can read |
|----------|-------|-------------|-------------|
| **Org Notebook** | Company-wide | Org admins | All org members |
| **Engagement Notebook** | Corp-to-corp relationship | Engagement participants | Engagement participants |
| **Project Notebook** | Scoped work (1:1 per project) | Project members (boundary-scoped) | Project members + engagement-level users |

### Cross-Level Visibility

A user working in a Project can:
- **Edit** their Project Notebook (full read/write)
- **Read** the Engagement Notebook (read-only from project context)
- **Read** the Org Notebook (read-only from project context)

Cross-level notebooks appear as **linked references** (not copies):

```
📓 Project Alpha Notes              ← full editor
📎 Engagement: CDPH Contract        ← read-only, link to engagement level
📎 Org: W3Geekery                   ← read-only, link to org level
```

### Note Permissions (Simple Model)

Boundary membership = access, visibility annotation = cross-party filtering. No separate permission UI needed for notes.

1. **If you're in the boundary, you can see all notes at that level**
2. **Visibility annotations** (buyer_only / provider_only / all) control cross-party visibility
3. **Org admins** can always see org-level notes
4. **No per-note permission matrix** — permissions come from boundary membership + party role

---

## Compliance Linkage Model

Tasks can satisfy specific compliance framework controls. This is distinct from the boundary's framework assignment — it's the **evidence chain** showing which work items address which requirements.

```
SmeMartProject
├── Boundary (has: SOC2, PCI-DSS frameworks)
├── SmeBoard: "Buyer Requirements"
│   └── Task BUY-003: "Access Control Policy Review"
│        ├── satisfies: SOC2 CC6.1, CC6.3
│        ├── evidence: [link to policy document]
│        └── attestation_status: verified | pending | not_started
│
└── SmeBoard: "Provider Deliverables"
    └── Task PRV-001: "Gap Assessment Report"
         ├── satisfies: SOC2 CC3.1, CC3.2, CC3.4
         ├── evidence: [link to gap report]
         └── attestation_status: verified
```

This feeds Brian's 3-view Transparency vision:
- **Demand view:** "Which of my requirements are satisfied?"
- **Supply view:** "Which controls am I providing evidence for?"
- **Transparency view:** "Independent proof chain — what's verified, what's pending?"

---

## Mapping: CEO/CIO Directives → SME Mart Model

### CEO (Brian) — 2026-02-25: Project → Boundary Hierarchy

> *"Project is a tag-based wrapper binding boundaries, tasks, subtasks, products, API ops, data objects. Where money flows."*

**SME Mart mapping:** SmeMartProject references 1+ Boundaries. Project is the "scope of work" container; Boundaries provide the security/compliance envelope.

### CEO (Brian) — 2026-03-06: Engagement → Project Taxonomy

> *"Engagement = corp-to-corp relationship. Project = scoped work. One Engagement → many Projects over time."*

**SME Mart mapping:** Engagement is the administrative umbrella (D&B, MSA, banking). SmeMartProjects hold the actual work, boards, tasks.

### CIO (Kevin) — 2026-03-06 & 2026-03-17: Platform Entity Mapping

> *"A service/product offering in the catalog is realized in the platform by a Boundary."*
> *"Board is the ground a task plugs in to. It has rank, issue number, workflows. It is structural."*
> *"Project is a Resource that creates a chain of sub-resources and provides a RoleScope."*

**SME Mart mapping:** SmeMartBoard mirrors future ZB Board. SmeMartProject mirrors future ZB Project (resource with RoleScope, children = plans, files, boards, timelines, notes).

### CEO/CIO (Brian + Kevin) — 2026-03-20: Boundary as Promise Management

> *"Boundary is a promise keeping function — proves you're fulfilling all obligations."*
> *"Task system and boundary are inseparable."*

**SME Mart mapping:** Compliance linkage (Plan 069) connects tasks to framework controls. Boundary auto-satisfaction engine can auto-close tasks when evidence already exists.

### Reconciled Model

| CEO/CIO Concept | SME Mart Entity | Storage | Relationship |
|----------------|-----------------|---------|-------------|
| Corp-to-corp agreement | **Engagement** | AuditgraphDB (GQL) | 1 buyer org : 1 provider org |
| Scoped work / SOW | **SmeMartProject** | AuditgraphDB (GQL) | Many per Engagement |
| Structural task container | **SmeBoard** | AuditgraphDB (GQL) | 3+ per Project (Buyer/Provider/Shared) |
| Work type blueprint | **SmeActivity** | AuditgraphDB (GQL) | Reusable across boards |
| Security/compliance envelope | — (imported) | ZB `Boundary` | 1+ per Project |
| Company identity | Org profile | ZB `Org` | 1:1 |
| Work items | Tasks / SubTasks | AuditgraphDB (GQL) | On boards, typed by activities |
| Promise/evidence chain | Compliance linkage | AuditgraphDB links | Task → framework control |

---

## Current Implementation State

| Entity | Storage | Status |
|--------|---------|--------|
| Org | ZB Platform `Org` | ✅ Exists |
| Engagement | AuditgraphDB `Engagement` class | ✅ Migrating (Plan 059 — Waves 1-5 in progress) |
| SmeMartProject | AuditgraphDB `SmeMartProject` class | ⏳ Schema in PR #8. UI not built. |
| SmeBoard | AuditgraphDB `SmeMartBoard` class | ⏳ Schema in PR #8. UI in Plan 057. |
| SmeActivity | AuditgraphDB `SmeMartActivity` class | ⏳ Schema in PR #8. |
| SmeWorkflow | AuditgraphDB `SmeMartWorkflow` class | ⏳ Schema in PR #8. |
| SmeMartTask | AuditgraphDB `SmeMartTask` class | ⏳ Schema in PR #8. |
| Boundary | ZB Platform `Boundary` | ✅ Exists |
| Tasks | ZB Platform `Task` | ✅ Integrated (will coexist with SmeMartTask) |
| Notes | AuditgraphDB `Note` + `NoteFolder` | ✅ Migrating (Plan 059) |
| Documents | Neon `org_documents` + FileService | ✅ Built (migration TBD) |

---

## Open Architecture Questions

| Question | Context | Who Decides |
|----------|---------|-------------|
| Can a Project span multiple Boundaries? | Feb 25 CEO notes say yes. Plan 057 models it. | Brian/Kevin |
| Per-project vs per-engagement billing? | Projects hold the work, but do invoices roll up to Engagement? | Brian (billing app) |
| SmeMartTask vs ZB Task coexistence? | Plan 057 has SmeMartTask. ZB Tasks already integrated. When to use which? | Kevin |
| Compliance linkage storage? | Task → control mapping. GQL links? Tags? Separate entity? | Clark/Kevin |
| Message center platform primitive? | Kevin spec mentions "chatrooms / message boards" as project children. Wait or build? | Kevin |
| Boundary auto-satisfaction API? | Kevin's "promise keeping" concept — how does SME Mart trigger auto-close? | Kevin |

---

## Sources

| Document | Key Content |
|----------|-------------|
| [CEO Notes — 2026-02-25](../../notes/CEO_NOTES.md) | Project → Boundary → Task hierarchy, three perspectives |
| [CEO Notes — 2026-03-06](../../notes/CEO_NOTES.md) | Engagement → Project taxonomy, "Proposal" → "Bid", bidirectional requirements |
| [CIO Notes — 2026-03-06](../../notes/CIO_NOTES.md) | Boundary = offering, Org = vendor, Project = resource container |
| [Kevin Board/Project Spec](../../notes/kevin-board-project-spec.md) | Board structure, Project as RoleScope, scoped roles |
| [2026-03-20 Architecture Meeting](../../notes/meetings/2026-03-20-ceo-cio-platform-architecture.md) | Boundary as promise management, task+boundary inseparable |
| [Plan 057](../local/057-task-partition-view.md) | Project Bloom MVP — boards, activities, workflows |
| [Plan 059](../local/059-auditgraph-migration.md) | AuditgraphDB migration — Neon → Pipeline + GQL |
| [PLAN.md](PLAN.md) | Architecture phases, sub-plans |
