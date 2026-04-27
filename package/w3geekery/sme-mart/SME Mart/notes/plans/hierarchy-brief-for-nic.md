# SME Mart Hierarchy — Brief for Nic

**Last updated:** 2026-04-20 (post-huddle with Brian 1:40–2:04 PM PT)
**Source:** `.planning/BACKLOG.md` (CE1, CE4, CE6, CE10–CE14) + Brian's 2026-04-15 Slack thread + Brian's 2026-04-20 huddle notes (`.claude/notes/meetings/2026-04-20-slack-huddle-project-hierarchy-qa.md`)
**Purpose:** Confirm relationship model before schema PRs land — **Portfolios are UI only; sub-projects become Linked Projects via hydra link types**

## TL;DR for Nic

Brian's 2026-04-20 huddle simplified a lot:

- **All "Portfolios" (Engagement / Project / Workspace / Task) are UI views.** No new schema classes for any of them.
- **Sub-Project tier is rejected.** A sub-project is just **a real project of its own** that's **linked** into a primary project via a typed link between two projects. Some link types should carry data permissions (boundary access inheritance), some should be structural-only.
- **Actual hierarchy:** `Engagement → Project → (linked Projects via typed link)* → Workspace → Task`
- **Transparency can exist at any tier** — no fixed depth. Link types determine whether transparency crosses a project-project link.
- **ZB is a platform tenant of its own marketplace.** Every customer gets a default `project-zerobias-platform` project (ZB as seller, customer as buyer) where platform delivery flows.

**Key questions for you — implementation is your call:**
- What's the right mechanism for typed project↔project links — hydra `link_type` rows, a new platform primitive, our own class, something else?
- Does CE10's existing "flat project + typed relations" model already cover this, or does the data-bearing variant need additional mechanism?

**Strong preference: pull our schema into platform as first-class Resources.** Our 23 extra-platform classes (inventory below) exist because we had to start somewhere — not by design. **Ideally every one where it makes sense becomes a real platform `ResourceType`** (Project, Document, Note, Engagement, ServiceOffering, Task, Board, etc.). We'll happily refactor anything you pull into platform. See the "Our strong preference" section below for the full wishlist and our commitment.

---

## Our existing SME Mart schema — for your Claude to pull in

**Repo + path (Schema source of truth, readable by you directly):**
- GitHub: `zerobias-org/schema`, branch `dev`
- Path: `package/w3geekery/smemart/classes/`
- Local clone: `~/Projects/zb/zerobias-org/schema/package/w3geekery/smemart/classes/` (or our fork at `~/Projects/w3geekery/zerobias-org-forks/schema/...`)
- Published package: `@zerobias-org/schema-sme-mart` (w3geekery.smemart.schema)

**23 class YAML files currently in the package:**

| File | Purpose (one line) |
|---|---|
| `Engagement.yml` | Corp-to-corp agreement between buyer + provider org. Links to Reviews, Notes, Documents, NoteFolders, EngagementVettingItems |
| `EngagementVettingItem.yml` | Vetting checklist items per engagement |
| `SmeMartProject.yml` | Scoped work container inside an engagement |
| `SmeMartTask.yml` | Task extension tied to SME Mart entities |
| `SmeMartBoard.yml` | Board construct (may overlap with your Board work?) |
| `SmeMartActivity.yml` | Activity definitions for engagements/projects |
| `SmeMartWorkflow.yml` | Workflow template |
| `SmeMartDocument.yml` | Document attached to engagement |
| `ServiceOffering.yml` | Provider's marketplace catalog listing (category, pricing, service includes) |
| `MarketplaceProfileItem.yml` | Vendor/buyer profile items — credentials, certifications, references, insurance, personnel. Section discriminator + JSON data blob |
| `Bid.yml` | Buyer's bid on a service offering |
| `BidResponse.yml` | Provider's response to a bid |
| `RfpInvitation.yml` | Buyer's invitation to RFP |
| `Review.yml` | Post-engagement review |
| `Note.yml` | Engagement/project notes |
| `NoteFolder.yml` | Note organization |
| `DocumentTemplate.yml` | Reusable document template |
| `DocumentInstance.yml` | Instantiated document from template |
| `FormSubmission.yml` | Form submission record (for form-builder wizard) |
| `ProjectPlan.yml` | Project planning artifact |
| `PlanMilestone.yml` | Milestone on a project plan |
| `ProjectPrd.yml` | Product requirements doc per project |
| `PrdSection.yml` | Section within a PRD |

**For your Claude:** read any of these files directly via `gh api repos/zerobias-org/schema/contents/package/w3geekery/smemart/classes/{FILENAME}.yml` or clone the repo locally. Full YAML definitions (properties, `linkTo` bidirectional relationships, `viewProperties`, etc.) are there.

## Our strong preference: pull these into platform as first-class Resources

**Ideally every one of these 23 classes where it makes sense would be promoted to a real platform Resource with its own ResourceType.** We are extra-platform today only because that's where we had to start — not by design. The obvious candidates for promotion, top of our wishlist:

- **`SmeMartProject` → platform `Project` Resource** — projects are foundational to every ZB customer's work, not just SME Mart. Deserves to be first-class.
- **`SmeMartDocument` → platform `Document` Resource** — documents attach to engagements, projects, tasks. Platform-wide primitive.
- **`Note` / `NoteFolder` → platform `Note` Resource + folder convention** — same pattern as Document. Notes will exist everywhere across ZB.
- **`SmeMartTask` → platform `Task` extension or convergence** — if platform Task is evolving, let's converge.
- **`SmeMartBoard` → subsume into your Board work** if it's on the roadmap.
- **`SmeMartActivity` / `SmeMartWorkflow`** — if there's a platform pattern for activity definitions + workflows, we'd adopt it.
- **`Engagement` → platform Resource** — corp-to-corp commerce contracts aren't SME-Mart-specific either; platform customers of all kinds will need them.
- **`ServiceOffering` → platform Resource** — marketplace listings will exist for every provider type the platform eventually supports.
- **`MarketplaceProfileItem` → platform Resource** — profile metadata (credentials, certifications, etc.) is a generic party-attribution concept.
- **`Review`, `Bid`, `BidResponse`, `RfpInvitation`, `FormSubmission`, `ProjectPlan`, `PlanMilestone`, `ProjectPrd`, `PrdSection`, `DocumentTemplate`, `DocumentInstance`, `EngagementVettingItem`** — case-by-case; some may stay SME-Mart-specific, others may be generic enough to platformize.

**Our commitment:**
- We'll happily **refactor anything you pull into platform** — rewire Angular services to call the platform SDK instead of our schema, migrate data, drop our class definitions. The cost of refactoring is far cheaper than the cost of maintaining parallel versions long-term.
- We'll keep our schema package minimal — just the SME-Mart-specific fields that are genuinely marketplace-unique.
- We want to **share the groundwork we've already done** (YAML definitions, field shapes, relationships, view properties) to accelerate your work rather than duplicate effort. Treat our schema as a spike / prototype, not the final home.

If you're planning to promote any of these (or have already started), we want to align early. Tell us and we'll pause any schema changes that would diverge from your direction.

---

## The hierarchy (Brian locked 2026-04-20 huddle)

```
Engagement Portfolio        [UI directory view — nav only, no entity]
      │
      ▼
Engagement                  [EXISTING class `Engagement`]
      │ owns (1:N)
      ▼
Project                     [EXISTING class `SmeMartProject`]
      │  │ owns (1:N workspaces)
      │  │
      │  └─── hydra link (typed) ──▶  Another Project (same class, separate engagement)
      │                                 ≡ "Linked Project" — may be data-bearing
      │                                 or structural-only depending on link type
      ▼
Workspace                   [NEW class `Workspace` — CE13]
      │ owns (1:N tasks)
      ▼
Task                        [EXISTING — ZB Task + our SmeMartTask]
```

**Transparency Partitions** can be declared at any tier (Engagement, Project, linked Project, Workspace) — not bound to a fixed depth. Link type determines whether transparency crosses a project-project link.

**What Portfolios are:** group-by / filter / saved-view UI projections over the entity graph above. No new classes.

**Real-world shape Brian is modeling** (primary example):

```
HIS ↔ Goshen Engagement
    └── HIS↔Goshen Primary Project (medical compliance work)
             │
             └──── linked via hydra link (data-bearing) ───▶
                     HIS ↔ ArmorStack Engagement
                         └── HIS↔ArmorStack Project (networking/SI work)
                                  │  each has its own Workspaces
                                  │  (Encryption crew, SBOM crew, etc.)
                                  ▼
```

Same pattern for Buyer↔3PAO audit scenarios: N separate Engagements (Buyer↔Auditor A, Buyer↔Auditor B, Buyer↔Auditor C) with their projects **linked into** a primary Buyer↔Seller project.

---

## The use case Brian is modeling

Multi-3PAO audit inside one Buyer↔Seller Engagement:

```
Buyer (Org A) ──Engagement P─▶ Seller (Org B)
                              │
                              └── Project 1 (shared work surface)
                                    │
                                    ├── Workspace Portfolio "Vendor Risk"
                                    │     ├── Workspace "Encryption" (Auditor Party A, linked via CE1)
                                    │     ├── Workspace "AI"        (Auditor Party B, linked via CE1)
                                    │     └── Workspace "SBOM-SSDF" (Auditor Party C, linked via CE1)
                                    │
                                    └── Each auditor has their OWN Engagement with Buyer
                                        (pulled into Project 1 via CE1 linkedEngagements[])
```

Supply-side (sellers/auditors) manage their work via **reciprocal supply-side tasks** within each nesting level — CE4 Demand/Supply twin pattern extends all the way down: each Workspace has req↔sat task pairs against supply-side boundaries. One demand can draw from multiple supply-side boundaries.

Real examples Brian cited: **OSCAL SDO** (1 project, 6 workspaces), **CycloneDX** (same pattern).

---

## Relationships & ownership by level

| Level | Entity | Owner / parent key | Owns (children) | Cross-entity relations |
|---|---|---|---|---|
| **Engagement Portfolio** | **OPEN** — nav-only vs structural (see Q1) | — | Engagements | — |
| **Engagement** | `Engagement` (existing) | Pair of Orgs (buyer + provider/auditor) | Project Portfolios | **CE1 linked engagements** — the only cross-engagement edge. Anchors on `Project.homeEngagementId` + `Project.linkedEngagements[]` |
| **Project Portfolio** | `ProjectPortfolio` (new, CE14) | `engagementId: UUID` (single engagement ceiling) | Projects | None cross-portfolio |
| **Project** | `SmeMartProject` (existing) | `portfolioId: UUID` (inherits `engagementId`) | Sub-Projects (CE7), Workspace Portfolios | **CE10 typed relations** to other Projects (`depends_on`, `relates_to`, `blocked_by`, `supersedes`, `derives_from`, `requires`) via platform resource links |
| **Sub-Project** | `SmeMartProject.parentProjectId` (field add, CE7) — **Brian flagged as possibly needed above Workspace** | `parentProjectId: UUID` | Same as Project | Same as Project; inherits engagement immutably |
| **Workspace Portfolio** | **NEW entity** (needs CE number) | `projectId: UUID` (or `parentProjectId` if sub-project) | Workspaces | None cross-portfolio |
| **Workspace** | `Workspace` (new, CE13) | `workspacePortfolioId: UUID` | Task Portfolios, Members (humans + agents), Skills, scoped ActivityLog | **CE4 Demand/Supply twin** — req task in workspace ↔ sat task in supply-side workspace, crosses boundary only via this link |
| **Task Portfolio** | **NEW entity** (needs CE number) | `workspaceId: UUID` | Tasks | None cross-portfolio |
| **Task** | `SmeMartTask` (existing) + ZB Task | `taskPortfolioId: UUID` | Sub-Tasks | `req ↔ sat` twin pairs (CE4) |

---

## Invariants to enforce

1. **Boundary subset chain — extended to 7 tiers** (CE12 enlarged):
   ```
   engagement ⊇ projectPortfolio ⊇ project [⊇ subProject] ⊇ workspacePortfolio ⊇ workspace ⊇ taskPortfolio ⊇ task
   ```
   Tighten-never-loosen at every level. Middleware-enforced at write time.

2. **Transparency partition at every tier.** Each level is its own privacy boundary with opt-in publication. Shared Transparency Center exposes data at Engagement / Project / Workspace / Task granularity per Brian.

3. **Engagement is the commercial ceiling.** Cross-engagement collaboration happens only through **CE1 linked engagements** on a Project (e.g., Buyer↔Auditor linked into a Buyer↔Seller primary engagement).

4. **Engagement inheritance is immutable down the tree.** All descendants carry the root engagement ID; can't be re-parented.

5. **Workspaces are private + anonymous by default** (confirmed Brian 2026-04-15). Transparency is opt-in via **CE4 Demand/Supply twin** linked task pairs (`req ↔ sat`) — the canonical cross-boundary seam at every nesting level.

6. **Aperture / focus is a hydra tag**, not an enum. User-customizable. Brian's examples: "encryption", "AI", "SBOM-SSDF", "OSCAL", "CycloneDX". 3PAO specialty taxonomy is a seed set.

7. **Project-to-project cross-work uses typed relations** (CE10), not hierarchy. `parentProjectId` (CE7) is for structural work-breakdown only; lateral dependencies stay as platform resource links.

8. **ActivityLog rollup** (CE11) needs extending to **7 levels** — append-only, hash-chained (Merkle-style), rolling up `task → taskPortfolio → workspace → workspacePortfolio → [subProject] → project → projectPortfolio → engagement`. Previously 3 levels; now 7.

---

## Data model vs UI display — critical distinction

Not every tier needs to be a first-class entity. Some are **data** (own lifecycle, own boundaries, own transparency partition, queryable as objects) and some are **UI views** (aggregations / group-by / filter projections over existing entities). This decision drives schema cost and query semantics.

**Proposal for Nic's review** — simplest model that satisfies Brian's stated requirements:

| Tier | Data or UI? | Rationale |
|---|---|---|
| **Engagement Portfolio** | **UI only** | Brian 2026-04-15 ("just a directory structure"). Nav-level grouping over the Engagements a party can access. Not a persisted object. Brian's 2026-04-20 phrasing may just be listing visible UI tiers, not asserting it's an entity. **Verify with Brian.** |
| **Engagement** | **DATA** (existing) | Commerce contract, boundary set, parties, MSA. |
| **Project Portfolio** | **DATA** (CE14) | Carries its own boundary, its own transparency dashboard, its own "drill-by-aperture" UX. Needs queryable identity. |
| **Project** | **DATA** (existing) | — |
| **Sub-Project** | **DATA** *if promoted* — currently field addition on `SmeMartProject` (CE7) | Depends on whether Brian needs Sub-Project to have its own boundary / transparency partition. If yes, promote to own class. |
| **Workspace Portfolio** | **PROBABLY UI** — propose group-by-focus-tag view over `Workspace` records within a Project | Unless Brian wants Portfolio-level boundary scoping / permissions / transparency distinct from the parent Project. If yes → DATA. **Verify with Brian.** |
| **Workspace** | **DATA** (CE13) | Crew + aperture tag + scoped activity log + transparency partition. Needs identity. |
| **Task Portfolio** | **UI only** — propose group-by-status / group-by-activity view over `Task` records within a Workspace | Tasks already group naturally by Workspace. "Task Portfolio" reads as a list view (Kanban / backlog / sprint grouping), not a persisted object. **Verify with Brian.** |
| **Task** | **DATA** (existing) | — |

**Why this matters for CE12 boundary chain:** only DATA tiers participate in the `⊇` subset enforcement. UI views inherit from their source entity and don't need their own boundary. If Brian promotes Workspace Portfolio or Task Portfolio to DATA, they join the chain:

```
Minimum (conservative):  engagement ⊇ projectPortfolio ⊇ project ⊇ workspace
Maximum (all promoted):  engagement ⊇ projectPortfolio ⊇ project ⊇ subProject
                                   ⊇ workspacePortfolio ⊇ workspace ⊇ taskPortfolio ⊇ task
```

**Same for CE11 activity log rollup** — only DATA tiers roll up. UI views don't have their own log stream.

---

## What's new vs existing (data model only)

| Entity | Data/UI | Status | Class / field |
|---|---|---|---|
| Engagement | DATA | existing | `Engagement` |
| Project Portfolio | DATA | new (CE14) | `ProjectPortfolio` |
| Project | DATA | existing | `SmeMartProject` |
| Sub-Project | DATA (field, maybe class) | CE7 | `SmeMartProject.parentProjectId`; promote to own class only if Brian needs distinct boundary/transparency |
| Workspace | DATA | new (CE13) | `Workspace` + aperture hydra tag |
| Task | DATA | existing | ZB `Task` + `SmeMartTask` |
| ActivityLog | DATA | new (CE11) | `ActivityLog` — 4-to-7-level rollup depending on Portfolio promotion decisions |
| Linked Engagement metadata | DATA (field) | CE1 | `SmeMartProject.homeEngagementId`, `linkedEngagements[]` |
| Engagement Portfolio | **UI only** | nav view | directory over user's `Engagement` records |
| Workspace Portfolio | **UI only** (proposed) | view | group-by focus-tag over `Workspace` within a project |
| Task Portfolio | **UI only** (proposed) | view | group-by status / backlog view over `Task` within a workspace |

---

## Questions for Nic (verify / feedback)

**Core ask:** tell us the right mechanism for the Linked Project relationship. We don't want to commit to an implementation that's parallel to something you're building or planning. Everything below is framed as "what's your guidance?" not "this is what we'll do."

1. **Linked Project relationship — how should we model it?** Two `SmeMartProject` records from different engagements get linked, with a **type** on the link that indicates whether it carries data permissions (boundary-access inheritance) or is structural-only. Candidate mechanisms we've considered: (a) hydra `link_type` rows, (b) CE10's existing flat-project typed relations, (c) a new link class in our schema, (d) promote `SmeMartProject` to a real platform Resource and use whatever platform mechanism is canonical. Which is right, or something else?

2. **Data-bearing vs structural link types** — where does the "this link inherits boundary access" attribute live? On the link-type definition? On the link instance? On a separate permission record?

3. **Boundary subset enforcement across linked projects (CE12)** — `engagement ⊇ project ⊇ workspace` is a clean subset chain within one engagement. Linked projects come from *another* engagement. For data-bearing links we want `linkedProject.readScope ⊆ primaryProject.boundaries`. Is this GQL-enforceable, middleware, or platform-native?

4. **Typed relations on Project (CE10)** — are the existing types (`depends_on`, `relates_to`, `blocked_by`, `supersedes`, `derives_from`, `requires`) the right set to extend for linked-project semantics, or is linked-project a separate concept?

5. **CE4 Demand/Supply twin** — req task in primary project ↔ sat task in a linked project across an engagement boundary. Schema-expressed (e.g., a `twin_of` link on tasks)? Middleware-assembled? Platform-native?

6. **ActivityLog rollup depth (CE11)** — rollup chain depth varies with linked-project tree shape. Any platform precedent for dynamic-depth rollups?

7. **Transparency Partition at any tier** — partitions as Resource-to-party-set relationships (at Engagement / Project / Workspace / Task level) — new class, hydra links, view projection, platform entity?

8. **Aperture as a Workspace tag** — "drill by aperture" UX needs to filter Workspaces across linked projects in an engagement. Tag-based query or indexed field?

9. **Task Portfolio — Board-adjacent?** We're deferring a dedicated `TaskPortfolio` class. Does your Board entity / in-flight work already cover "filtered/grouped view over tasks"? Should SME Mart's task-grouping UX sit on top of Board? (We also have our own `SmeMartBoard` class — see schema inventory — which may be redundant with yours.)

10. **ZB-as-platform-tenant invariant** — every customer gets a `project-zerobias-platform` default project (ZB as seller). Schema convention we maintain, or is there (or should there be) a platform-provided seed mechanism?

11. **Any of our 23 classes that should be platform Resources?** — see inventory above. If the platform already has or is evolving toward entities that overlap with ours (ServiceOffering, Board, Task, Activity, Workflow, etc.), we'd rather adopt platform primitives than maintain parallel versions. What should we consolidate or hand off?

---

## Related plans (for context)

- **CE1** — Home + Linked Engagement Project Model (2026-04-14)
- **CE4** — Demand/Supply twins (linked task pairs as transparency seam)
- **CE6** — Publish-to-Shared Pipeline + Anonymity
- **CE7** — Sub-Project Hierarchy (`parentProjectId`)
- **CE9** — Nested Transparency Centers (may be resolved by tiered partitions)
- **CE10** — Flat Projects + Typed Relations
- **CE11** — Append-Only Activity Log (now needs 7-level rollup)
- **CE12** — Boundary Subset Enforcement (now needs 7-tier chain)
- **CE13** — Within-Project Workspace (crew + focus/aperture)
- **CE14** — Project Portfolio
- **CE-NEW-A** — Workspace Portfolio (Brian 2026-04-20)
- **CE-NEW-B** — Task Portfolio (Brian 2026-04-20)
