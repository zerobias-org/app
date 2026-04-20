# SME Mart Hierarchy Model

**Last updated:** 2026-03-09
**Status:** Working draft — pending Brian/Kevin validation
**Purpose:** Single reference for the Engagement → Project → Boundary mapping between SME Mart concepts and ZeroBias platform entities.

---

## TL;DR

```
Org (company identity — ZB Org)
└── Engagement (corp-to-corp relationship — MSA, D&B, banking, compliance)
    ├── Project A (scoped work / SOW — boundary-scoped)
    │   ├── Boundary (ZB platform — products, frameworks, users/groups/roles)
    │   ├── Documents (subset of Org Documents shared to this Project)
    │   ├── Members/Groups/Roles (ZB platform, scoped by boundary)
    │   ├── Tasks / SubTasks (ZB Tasks, scoped by boundary)
    │   └── Notes (Project Notebook — 1:1 per project)
    ├── Project B (different SOW, different boundary)
    └── Project C (may share boundary with A)
```

---

## Entity Definitions

### Org

The company identity in ZeroBias. Both buyers and providers are Orgs.

- **ZB Platform:** `Org` entity
- **SME Mart:** Org-level settings, document library, provider profile
- **Tabs:** Documents (full org library), Settings, Engagements list

### Engagement

The **corp-to-corp relationship** between a buyer org and a provider org. Administrative and legal container — NOT where scoped work lives.

- **ZB Platform:** No direct entity yet. Currently `work_requests` table in Neon.
- **Created when:** A Bid is accepted on an RFP, establishing a new org-to-org relationship (or reused if relationship already exists)
- **Contains:** Corporate-level requirements that apply across ALL projects under this relationship

**Engagement-level requirements** (Brian, 2026-03-06):
- D&B (Dun & Bradstreet) rating
- MSA (if umbrella covering all projects)
- Banking information
- Background checks on officers
- Corporate entity verification (C Corp, LLC, etc.)
- Financial statements / bank letter of good standing

**Engagement-level tabs:**
- Overview (relationship summary, status)
- Bids (RFP responses for this relationship)
- Timeline (activity history)
- Notes (Engagement Notebook — relationship-level notes)
- Projects list (all scoped work under this relationship)

### Project

**Scoped work** — a specific SOW, deliverable set, or contract under an Engagement. This is where the actual work happens.

- **ZB Platform:** Project entity (on Kevin's near-term roadmap — tag-based wrapper with Members + Admins groups)
- **Created when:** An accepted Bid's task breakdown becomes a Project
- **Boundary relationship:** Each Project references 1+ ZB Boundaries for access scoping

**Project-level requirements** (Brian, 2026-03-06):
- MSA (if project-scoped rather than engagement-level)
- Tasks / SubTasks (the actual work)
- Deliverables
- Project tech lead contact
- Support contact info
- Subject matter contacts

**Project-level tabs:**
- Overview (scope, status, progress)
- Documents (subset of Org Documents shared to this Project)
- Members/Groups/Roles (ZB platform users scoped by project boundary)
- Tasks (ZB Tasks scoped by boundary)
- Notes (Project Notebook)
- Timeline

### Boundary

**ZB platform security and compliance envelope.** Defines what's visible, who has access, and what products/frameworks apply.

- **ZB Platform:** `Boundary` entity — already exists, managed via Boundary Manager app
- **Contains:** Products, compliance frameworks, users, groups, roles
- **Kevin's mapping** (2026-03-06): *"A service/product offering in the catalog is realized in the platform by a Boundary"*
- **Relationship to Project:** A Project references 1+ Boundaries. Multiple Projects can share a Boundary.

**What comes with a Boundary:**
- Software products used
- Personnel (users/groups/roles)
- Compliance frameworks
- Audit scoping
- Access control enforcement (resources NOT in boundary are not visible)

### Task / SubTask

The actual work items within a Project, scoped by the Project's Boundary.

- **ZB Platform:** `Task` entity with `child_of` links for subtask hierarchy
- **Typed by domain:** Security, Compliance, Legal, Functional, Financial (via Task Activities when available)
- **Lifecycle:** `draft` → `open` → `in_progress` → `awaiting_approval` → `completed`

---

## Boundary Selection Flow

When a buyer creates an RFP (Request for Project), the flow is:

```
1. Buyer creates RFP
   └── Selects boundary(s) from their org's boundaries
       └── This imports: products, frameworks, users/groups/roles

2. Vendors respond with Bids
   └── Vendor maps their capabilities to buyer's boundary requirements

3. Bid accepted → Engagement created (if new org-to-org)
   └── Project created under Engagement
       └── Project inherits buyer's selected boundary(s)
       └── Vendor boundary may also be associated (supply-side)

4. Complete member/group/role list available from boundary
   └── Anything missing must be added to boundary to be in compliance
```

**Tag creation:** ZB Tags (`sme-mart.eng.*`, `sme-mart.proj.*`) are created or found during this flow to link SME Mart entities to ZB platform resources.

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

To **edit** a higher-level notebook, navigate to that level of the hierarchy. This prevents accidental edits to shared notebooks from a narrow project context.

### Note Permissions (Simple Model)

Rather than per-note ACLs (which become a management nightmare), use **boundary membership as the permission boundary:**

1. **If you're in the boundary, you can see all notes at that level**
2. **Visibility annotations** (buyer_only / provider_only / all) control cross-party visibility — same pattern as document shares
3. **Org admins** can always see org-level notes
4. **No per-note permission matrix** — permissions come from boundary membership + party role

This keeps permissions simple: boundary membership = access, visibility annotation = cross-party filtering. No separate permission UI needed for notes.

### Open Question: Note Selectability

Clark wants notes to be **selectable from within the Notes UI** for quick reference — e.g., "who's the person responsible for task X?" This implies:
- Notes can reference/mention users, groups, or roles
- A lookup panel or autocomplete drawing from boundary-scoped members
- Possibly an `@mention` syntax in the Milkdown editor that resolves to ZB platform principals

---

## Mapping: CEO/CIO Directives → SME Mart Model

### CEO (Brian) — 2026-02-25: Project → Boundary Hierarchy

> *"Project is a tag-based wrapper binding boundaries, tasks, subtasks, products, API ops, data objects. Where money flows."*

Brian's Feb 25 model placed Project ABOVE Boundary. A Project can span multiple Boundaries.

**SME Mart mapping:** This still holds. An SME Mart Project references 1+ Boundaries imported from the buyer's selection. The Project is the "scope of work" container; Boundaries provide the security/compliance envelope.

### CEO (Brian) — 2026-03-06: Engagement → Project Taxonomy

> *"Engagement = corp-to-corp relationship. Project = scoped work. One Engagement → many Projects over time."*
> *"We sell NF software through distributors. Often times they get pulled into selling it from clients who want them to sell it to them or we sign them up. Both require the corps to put high level corporate to corp legal and banking info in place and D&B, etc. But from there. Lots of software will be sold. Or lots of projects will be awarded."*

Brian's March 6 model added Engagement ABOVE Project. The Engagement is the administrative umbrella (D&B, MSA, banking). Projects are the actual work.

**SME Mart mapping:** Engagement is a new layer above what we had. The current `work_requests` table represents something between an Engagement and a Project. As the Project layer is built out, `work_requests` becomes the Engagement, and a new `projects` table (or ZB Project entity) holds scoped work.

### CIO (Kevin) — 2026-03-06: Platform Entity Mapping

> *"A service/product offering in the catalog is realized in the platform by a Boundary the same way a vendor is realized by an Org."*
> *"Projects can be in a boundary or not."*
> *"Project = a bunch of related resources (boards, timelines, files, calendar)."*

Kevin's model is flexible: Projects are resource containers that MAY be boundary-scoped. The platform won't enforce a rigid hierarchy — that's for the consuming app (SME Mart) to define.

**SME Mart mapping:** SME Mart will enforce Project → Boundary association because compliance scoping is core to the marketplace use case. But the ZB platform Project entity itself will be more generic.

### Reconciled Model

| CEO/CIO Concept | SME Mart Entity | ZB Platform Entity | Relationship |
|----------------|-----------------|-------------------|-------------|
| Corp-to-corp relationship | **Engagement** | None (Neon `work_requests`) | 1 buyer org : 1 provider org |
| Scoped work / SOW | **Project** | `Project` (future) | Many per Engagement |
| Security/compliance envelope | — (imported) | `Boundary` | 1+ per Project |
| Catalog listing / offering | Service Offering | `Boundary` | Provider's marketplace presence |
| Company identity | Org profile | `Org` | 1:1 |
| Work items | Tasks / SubTasks | `Task` + `child_of` links | Scoped by boundary |

---

## Current Implementation State

| Entity | Storage | Status |
|--------|---------|--------|
| Org | ZB Platform `Org` | ✅ Exists |
| Engagement | Neon `work_requests` table | ✅ Built (has `zerobias_boundary_id` — will migrate to Project level) |
| Project | — | ❌ Not yet built. Waiting for ZB Project entity. |
| Boundary | ZB Platform `Boundary` | ✅ Exists. `work_requests.zerobias_boundary_id` stores boundary at engagement level (temporary). |
| Tasks | ZB Platform `Task` | ✅ Integrated |
| Notes | Neon `notes` + `note_folders` | ✅ Built at engagement level. Needs hierarchy scoping. |
| Documents | Neon `org_documents` + `org_document_shares` | ✅ Built with polymorphic sharing (engagement/project/task scope) |

### Migration Path

When ZB Project entity ships:
1. Add `projects` table/entity linking to `work_requests` (engagement)
2. Move `zerobias_boundary_id` from `work_requests` to `projects`
3. Scope Members/Groups/Roles tabs by project's boundary(s)
4. Add Project Notebook (1:1 per project)
5. Document shares already support `shared_with_type = 'project'` — ready to go

---

## Open Architecture Questions

| Question | Context | Who Decides |
|----------|---------|-------------|
| Can a Project span multiple Boundaries? | Feb 25 CEO notes say yes. Practical implications for UI scoping? | Brian/Kevin |
| Should Engagement have its own Boundary? | Currently 1:1. If Project gets boundary, does Engagement need one for corp-level access? | Brian/Kevin |
| Bidirectional requirements at Project level? | March 6 CEO notes: vendor also has requirements from buyer (tech lead, support contact). How to model? | Brian |
| Note mention/reference system? | Clark wants @mention of users/groups in notes. Platform support or SME Mart-only? | Clark/Kevin |
| Per-project vs per-engagement billing? | If Projects are the work container, does billing roll up at Project or Engagement? | Brian (billing app) |

---

## Sources

| Document | Key Content |
|----------|-------------|
| [CEO Notes — 2026-02-25](.claude/notes/CEO_NOTES.md#2026-02-25) | Project → Boundary → Task hierarchy, three perspectives |
| [CEO Notes — 2026-03-06](.claude/notes/CEO_NOTES.md#2026-03-06) | Engagement → Project taxonomy, "Proposal" → "Bid", bidirectional requirements |
| [CIO Notes — 2026-03-06](.claude/notes/CIO_NOTES.md) | Boundary = offering, Org = vendor, Project = resource container |
| [BIG-PICTURE.md](BIG-PICTURE.md) | System map, gap analysis, priority tiers |
| [PLAN.md](PLAN.md) | Architecture phases, sub-plans |
