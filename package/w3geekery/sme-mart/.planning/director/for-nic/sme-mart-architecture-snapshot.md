# SME Mart — Architecture Snapshot for ZB Platform Resource Design

**Audience:** Nic (ZB Platform — Resource entities) + Nic's Claude
**Author:** Clark Stacer / W3Geekery (via Claude Opus 4.7)
**Originated:** Snapshot of `CLAUDE_transparency-center-entangled-tasks_20260421_153215.html` (Clark, 2026-04-21)
**Currency:** Updated 2026-04-29 — incorporates Phase 25/26 lockdowns post-2026-04-21

---

## How to use this document

This is the **single most current canonical reference** for SME Mart's data model and architectural directives as of 2026-04-29. It exists because Nic is building ZB Platform Resource entities and may absorb some or all of SME Mart's schema entities into the platform. Where SME Mart has shipped patterns or locked decisions that should bias the platform design, they're surfaced here. Where SME Mart's own classes are candidates for absorption into the platform, they're flagged.

**You can ingest this whole file.** It's intentionally self-contained — schema YAMLs, canonical UUIDs, decision lockdowns, and the locked invariants from Clark's session memory are all inlined. Pointers are also provided where you may want primary-source verification.

**Conventions used here:**
- *DATA tier* = a persisted entity with its own boundary + transparency
- *VIEW tier* = rendering layer that sits alongside DATA, not in the chain (e.g., Board)
- *UI-only tier* = grouping projection, not persisted (e.g., any "Portfolio")
- ASCII over Unicode for arrows: `<-`, `->`, `<->` (not `↔`, `→`, `←`) — per Clark's terminal-render preferences. Reverse-arrow `<-` indicates **supply flow direction** (see DECISIONS § Engagement Naming Convention).
- `tighten-never-loosen` = a child boundary must be a subset of its parent's
- `req <-> sat` = the demand/supply task pairing across a commercial boundary (CE4 task entanglement)

---

## Table of contents

1. [TL;DR — 60-second read](#tldr-60-second-read)
2. [Source HTML this snapshot extends](#source-html-this-snapshot-extends)
3. [What changed since 2026-04-21](#what-changed-since-2026-04-21)
4. [Locked architectural invariants (from session memory)](#locked-architectural-invariants-from-session-memory)
5. [The Transparency Center concept](#the-transparency-center-concept)
6. [The four DATA tiers](#the-four-data-tiers)
7. [Sub-project is a tag (default mechanism)](#sub-project-is-a-tag-default-mechanism)
8. [Board polymorphism + filter views](#board-polymorphism--filter-views)
9. [Engagement coalition pattern (multi-3PAO)](#engagement-coalition-pattern-multi-3pao)
10. [Backend consolidation proposal (Kevin 2026-04-22)](#backend-consolidation-proposal-kevin-2026-04-22)
11. [CE backlog summaries (CE1–CE14)](#ce-backlog-summaries-ce1ce14)
12. [Related ROADMAP phases](#related-roadmap-phases)
13. [Related older plan numbers](#related-older-plan-numbers)
14. [SME Mart schema inventory (23 classes + canonical IDs)](#sme-mart-schema-inventory-23-classes--canonical-ids)
15. [Schema YAMLs — full inventory inline](#schema-yamls--full-inventory-inline)
16. [Curated locked DECISIONS (cross-relevant subset)](#curated-locked-decisions-cross-relevant-subset)
17. [Hydra tag taxonomy (cross-cutting reference)](#hydra-tag-taxonomy-cross-cutting-reference)
18. [Open questions for Nic](#open-questions-for-nic)
19. [Pointers (schema repo, source files, related repos)](#pointers-schema-repo-source-files-related-repos)
20. [Vocabulary quick-reference](#vocabulary-quick-reference)

---

## TL;DR — 60-second read

- SME Mart is W3Geekery's marketplace for SMEs, built on the ZB platform. It will eventually be **absorbed into the platform itself**; SME Mart's job is to bias platform design where it can.
- The architecture has **four DATA tiers**: `Engagement -> Project -> Workspace -> Task`. Boundaries `tighten-never-loosen` down the chain.
- **`Workspace`** (CE13, net-new) is the innermost DATA tier. It carries crew, aperture tag, sub-project tag, scoped activity log, boundary partition, transparency partition. **Private + anonymous by default.**
- **`Board`** is a polymorphic VIEW layer (Kevin's spec). Parent ∈ {`Org`, `Boundary`, `Project`, `User`} today; proposed additions are `Workspace` and `Transparency`. Each Task is owned by exactly one Board (Kevin's rule).
- **Transparency** is a function/partition mechanism, NOT an entity (Kevin's directive). Data crosses party boundaries through **exactly one seam**: a `req <-> sat` **task entanglement** (CE4 — N-party, not strictly binary). This is the core SME Mart invariant.
- **Sub-project is a tag** (Brian 2026-04-21) by default. Hydra tag, same family as the `aperture` tag. Heavier mechanisms (contains-link, cross-engagement, lateral CE10) only when distinct boundary or transparency is needed.
- **Multi-3PAO is the norm**: a primary `Buyer <- Seller` Engagement is augmented by N linked `Buyer <- Auditor` Engagements (CE1). Auditors gain data-plane access to the supplier ONLY through CE1 linkage. A single supplier SAT task can be `twin_of`-paired to multiple demand REQs.
- **Engagement naming** uses `Buyer <- Provider` (ASCII reverse-arrow), where the arrow indicates supply flowing toward the buyer (the 1st-class citizen / Demand-owner).
- **Kevin proposes consolidation** (2026-04-22): one platform `Project` class with a `flavor` discriminator ∈ {`engagement`, `project`, `subproject`, `workspace`}. SME Mart agrees to refactor `Engagement.yml` and `SmeMartProject.yml` into `Project[flavor=*]` records when the platform delivers it.
- **Class IDs are platform-assigned, NOT deterministic UUID v5** (errata 023). Two of SME Mart's 23 class IDs were originally invented by hashing the class name; both were rejected by Pipeline.receive with "No such Class" until corrected against `platform.Class.getClass`.

---

## Source HTML this snapshot extends

The source visualization is at:
```
~/Pictures/Screenshots/CLAUDE_transparency-center-entangled-tasks_20260421_153215.html
```

It has two top-level tabs:
1. **Transparency Center** — Brian's 2026-04-21 quote + a worked example (HIS / Goshen / ArmorStack / ModelAudit) showing a buyer + multi-auditor coalition publishing entangled supply/demand task pairs into a shared transparency surface
2. **Full Structure** — sub-tabs for Overview Tree, Engagement, Project, Workspace, Board, Task, Cross-Cutting Links, and Backend Class Model (Kevin's consolidation proposal)

This MD covers the same topics + adds: locked decisions made AFTER 2026-04-21, full CE backlog summaries, related ROADMAP phases, the 23-class schema inventory with canonical platform-assigned UUIDs, five curated schema YAMLs inline, and locked invariants from Clark's session memory that don't appear in the HTML.

The HTML's footer reads:
> *CLARK . 2026-04-21 / 22 . TRANSPARENCY CENTER + FULL STRUCTURE + BACKEND CLASS MODEL . FOR BRIAN + NIC + KEVIN*

---

## What changed since 2026-04-21

| Date | Event | Impact |
|---|---|---|
| 2026-04-23 | DECISIONS § "Engagement Naming Convention" locked | Engagements use `Buyer <- Provider` ASCII reverse-arrow, not `↔`. New convention applies to new records only — existing demo data not backfilled (Phase 24 will gate or delete). |
| 2026-04-23 | DECISIONS § "Default ZB Engagement is Auto, Invariant, Compliance-Driven" locked | Every existing platform Org gets a default `<Org> <- ZeroBias` engagement automatically (org-detection + lazy-on-load reconcile in Phase 27). NOT a UI flow. |
| 2026-04-23 | DECISIONS § "v1.4 Phase 29 Deferred to v1.5" | Tier-display / ToS / branding moved to v1.5. v1.4 ships placeholder ServiceOffering data only. |
| 2026-04-24 | DECISIONS § "Object.tag Field Shape — Validated via UAT Experiment" | Locked the canonical Pipeline.receive payload shape: `tag: [{ value: "<hydra-tag-uuid>" }]`. Tags are immutable post-ingest (Kevin clarification). |
| 2026-04-25 — 2026-04-27 | Phase 25 (Platform Data Audit) executed | 9 SDK/GQL/Hydra sources documented; canonical class IDs verified via `platform.Class.getClass`; `MarketplaceProfileItem` replace-by-id semantics validated. |
| 2026-04-27 | Phase 25 closeout: COMPANY-INFO-CONVENTION-DRAFT.md | 17-section catalog for marketplace profile items locked (legal_name, dba, logo_url, short_blurb, long_description, website, primary_contact.*, hq_location.*, years_in_business, employee_count, onboarding_complete, **provider_type**). Phase 28 form schema must match. |
| 2026-04-28 | DECISIONS § "Platform-Provider Distinguisher (Phase 26 Plan 01)" locked | **Option B** — MPI section `provider_type=platform` distinguishes platform-providers from regular providers. Option A (hydra global tag `marketplace.platform_provider`) blocked on `zerobias-com/tag#1` cycle time. |
| 2026-04-28 | Phase 26 Plan 02 closed: ZB-as-provider seeded into MPI on UAT | 6 ZeroBias MPI records ingested via `platform.Pipeline.receive`. Canonical MPI class id `7bcf86a5-91dc-520d-b9bf-e308b1078d46` empirically validated. |
| 2026-04-28 | Errata 023 filed: "Two fictional class IDs in `pipeline-write.service.ts` cause silent production failures" | Two SME Mart consts (`MarketplaceProfileItem`, `EngagementVettingItem`) had IDs invented as deterministic UUID v5 hashes. Pipeline.receive rejects them with "No such Class". Plan 26-04 patched them with the canonical platform-assigned IDs. **Lesson:** Class IDs are platform-assigned at registration, NOT derivable from class names. |
| 2026-04-29 | DECISIONS § "Platform-Assigned Class IDs Are Not Deterministic UUID v5" locked | Universal lesson — applies to any future class ID consts. Always verify via `platform.Class.getClass`. |

---

## Locked architectural invariants (from session memory)

These are persisted in Clark's session memory and have been re-confirmed multiple times. They are LOAD-BEARING — a design that violates one is fighting the system.

### Invariant 1 — Task Entanglement is the only DATA transparency seam

> The **Task Entanglement** (req <-> sat link, pair OR N-party) is **the one and only transparency seam for DATA**. Everything else is private by default.

- Originally framed as a binary "Demand/Supply twin." Brian clarified 2026-04-15: it's **N-party** (pair, trio, quartet, quintet, sextet…). Minimum 2 parties (commerce axiom).
- **Scope:** applies to *data* — evidence, findings, activity logs, audit artifacts, document content. When data crosses party boundaries, it crosses via a task entanglement link.
- **NOT covered:** **messaging** between parties is a separate concern (scoped to Project + Engagement, possibly Workspace) and does not require an entanglement link to flow. Open architectural question: Slack-channel-scannable-by-LLM vs. custom PromptQL-like in-app messaging.
- **Lifecycle (TBD):** entanglements may evolve in place (versioned as parties join) OR die-and-respawn on reassignment. Multiple scenarios likely coexist; rules undecided.
- **How to apply:** when designing a feature that moves DATA across parties, the answer is always the entanglement link (CE4). Do not add ad-hoc data-visibility toggles. "Publish to shared" (CE6) means activating an entanglement link, not a manual push.

**Source:** Brian Hierholzer (Slack 2026-04-15 10:17 AM lock-in + 11:43 AM N-party clarification). Clark confirmation: *"the Demand/Supply twin link is the one and only transparency seam — EXACTLY THE PURPOSE."*

### Invariant 2 — Every Project has a related Engagement

> In SME Mart, **every** `Project` between Orgs has an associated `Engagement` between those Orgs. There are no orphan Projects.

- Engagement defines the supply/demand relationship and is the context that determines which Org is Provider and which is Buyer for that work.
- Without an Engagement, the Project has no contractual context, no role assignments, and no clear supply-side/demand-side framing.
- **Vocabulary:** use *every* / *always*, never *some* / *may have* / *might have*.
- **Role context (Provider vs Buyer) flows from the Engagement**, not from static profile properties.
- If you find a Project without an Engagement in data or diagrams, treat it as a bug / modeling gap, not a valid case.

**Source:** Clark, 2026-04-23.

### Invariant 3 — Tasks/Subtasks are the runtime access control layer

> All boundary access requires task approval. The only way to GET/POST/read/write from a boundary's `/app/api/object/` is through an approved task/subtask.

- **Tasks/subtasks ARE the runtime** — they define the read/write operations and act as the execution layer.
- **Demand side (boundary owner)** = approving party for each task (network owner side).
- **Supply side task partition** = defines and publishes explicit requirements to transparency partition (e.g., "task requires AWS S3 ARN policy, IAM setting, data objects X/Y/Z, read & write access, daily/hourly schedule").
- **Three partitions:**
  - **Demand partition** — boundary owner defines requirements, approves/denies task execution
  - **Supply partition** — provider defines explicit resource requirements and publishes them
  - **Transparency partition** — shows denied/accepted status:
    - Hard requirements (1–5): must be met
    - Soft requirements (6–10): met/not met shown but non-blocking
    - "Approved run" vs "denied run" status

**Source:** Brian (CEO highest priority, declared 2026-03-16, expanded 2026-03-19).

### Invariant 4 — Board ≠ Activity (distinct concepts, do not conflate)

- **Board** is a **structural container** — provides rank, issue numbering (`BUY-001`), permissions. "The ground a task plugs in to" (Kevin 2026-03-16). Scopes: org, boundary, project, user (+proposed: workspace, transparency).
- **Activity** is a **work type blueprint** — defines workflow, RACI, custom fields, transitions. Reusable across boards (same activity can be used on buyer board AND provider board).
- **Task references BOTH:** `boardId` (which board it lives on) + `activityId` (which activity defines its behavior).

**Source:** Kevin, 2026-03-16. Earlier framing of boards as "user-created collections" was wrong. Saved filters are a separate concept ("Saved Task Views" — Plan 058).

### Invariant 5 — SME Mart will be absorbed into ZB platform; minimize non-platform entities

> **Link everything to actual ZB platform entities as much as possible; the less we use non-platform entities, the better.** (Clark, 2026-04-23)

- Before proposing a new SME Mart GQL class, check if the concept can be expressed with an existing platform primitive: `Vendor`, `Product`, `Framework`, `Role`, `Skill`, `Segment`, `ServiceSegment`, `hydra.Resource`, `hydra.Tag`, `hydra.ResourceLink`.
- For relationships, prefer `hydra.ResourceLink` over custom join classes when semantics fit.
- For User/Org references, link to ZB-native User/Org IDs, never to SME Mart profile row IDs.
- For catalog content (frameworks, skills, roles) missing from the platform, file a Content team task (moderated catalog-addition Task Activity exists per Clark) — don't shadow-add in SME Mart.
- **Net implication:** SME Mart's 23-class schema is intended to shrink. Hierarchy-shaped classes (Engagement, SmeMartProject, eventually Workspace) are candidates for absorption into a consolidated platform `Project` (see § Backend Consolidation Proposal).

### Invariant 6 — Engagement naming uses `Buyer <- Provider` reverse-arrow

- ASCII `<-` (reverse-arrow), not Unicode `↔`. Buyer is named first; arrow points TOWARD the buyer indicating **supply flow**.
- Buyer = 1st-class citizen, Demand-side party. Supplier exists to satisfy Buyer's demand.
- This aligns with the project's Demand/Supply vocabulary (the entanglement / transparency invariant).
- Examples: `"W3Geekery <- ZeroBias"` (W3Geekery is buyer of ZB platform services), `"W3Geekery <- HIS"` (W3Geekery is buyer of HIS auditor services).

**Source:** Clark, 2026-04-23. ASCII over Unicode per terminal-render reliability + grep-ability.

---

## The Transparency Center concept

### Brian's framing (2026-04-21)

> "Transparency center is the capture from supply – demand entangled tasks. And those tasks can be grouped at workspace / sub-project / project and published into the shared transparency center."
> — Brian Hierholzer

### What it is, structurally

The Transparency Center is **NOT an entity** (Kevin's directive). It is a **function** — a query surface that aggregates published `req <-> sat` (and N-party) entanglements across the parties to a coalition.

- **Default state:** every workspace / project is private + anonymous.
- **Opt-in publication granularities (chosen by the publishing party):**
  - publish @ workspace — entire workspace's entangled pairs
  - publish @ sub-project tag — pairs tagged with a specific sub-project
  - publish @ project — entire project's entangled pairs
- **Two-axis publication:** demand side and supply side each independently choose a granularity. The Transparency Center captures the intersection / union per the configured policy.
- **Navigation:** TC navigates by tag (Brian 2026-04-21). Pulls in aperture tags, sub-project tags, and any other hydra tags applied to workspaces/tasks. *"The transparency layer can navigate all these disparate areas with more clarity."*
- **Polymorphic Board parent (proposed):** a Transparency surface should be a valid Board parent so the TC can render its own Board.

### The demand/supply diagram (from the HTML, summarized)

The HTML walks through one example:
- Primary Engagement: `HIS <- Goshen` (Buyer = HIS, Provider = Goshen the supplier)
- Linked Engagements (CE1):
  - `HIS <- ArmorStack` (3PAO auditing encryption)
  - `HIS <- ModelAudit` (3PAO auditing AI risk)
- Supplier-side workspace runs SAT tasks ("Deliver TLS config export", "Supply KMS rotation log", "Produce model lineage manifest")
- Demand-side workspaces run REQ tasks ("Collect TLS inventory", "Witness key rotation evidence", "Review model lineage manifest")
- A single supplier SAT (e.g., "Produce model lineage manifest") can be `twin_of`-paired to multiple demand REQs (buyer's own + ModelAudit's REQ)
- All published pairs flow into the shared TC at the chosen granularity

### Boundary subset chain

```
engagement ⊇ project ⊇ workspace ⊇ task
```

Tighten-never-loosen. Middleware-enforced at write time. Tags don't carry boundaries (they're filters, not scopes). `twin_of` is the only link type that legitimately crosses the commercial boundary; paired Tasks are each single-owned by their own Board (neither owns the other).

---

## The four DATA tiers

| Tier | Class | Kind | Identity | Boundary | Transparency |
|---|---|---|---|---|---|
| 1 | `Engagement` | DATA — existing | Commerce contract between parties | Outermost; commercial ceiling | Carries party list + MSA; no own data-visibility toggles |
| 2 | `SmeMartProject` (= `Project`) | DATA — existing | Scoped work container | Subset of Engagement | Own transparency partition |
| 3 | `Workspace` | DATA — net-new (CE13) | Innermost scope tier; crew + aperture | Subset of Project | Own transparency partition; **private + anonymous by default** |
| 4 | `SmeMartTask` | DATA — existing | Atomic unit of work | Inherits via Board's parent (Kevin's rule — Tasks single-owned by exactly one Board) | None of its own; pairing is via `twin_of` (CE4) |

**Portfolios at every tier are UI-only grouping projections** — not DATA. Boundary is union-of-members; transparency is aggregation-over-members; no ID that outlives member entities. Promote to DATA only if a level needs distinct boundary / transparency from its members.

**Sub-task** = a Task whose parent is another Task (Kevin's spec). Inherits the parent Task's scope. Usually not shown on the Board.

### Workspace anatomy (CE13)

The new innermost DATA tier carries:
- `crew[]` — humans + agents that operate inside the workspace
- `aperture` tag — focus area (encryption, AI, SBOM-SSDF, OSCAL, CycloneDX). 3PAO specialty taxonomy as a seed set; user-customizable.
- `sub-project` tag — thematic grouping (Cyber, Clinical Compliance, AI Assessment, Delivery, AI Engineering). Same family as aperture. **Default for sub-project semantics** (Brian 2026-04-21).
- `boundary partition` — subset of parent Project
- `transparency partition` — opt-in transparency surface
- `scoped activity log` — see CE11

3PAO audit crews are natural workspaces. Each gets its own crew + aperture + isolated activity log.

---

## Sub-project is a tag (default mechanism)

Brian, 2026-04-21:
> "If that is tagging construct to manage sub project and workspace views that's perfectly acceptable. As long as those tags are pulled into transparency center."

### Four mechanisms, lightest first

| # | Mechanism | When | Boundary? | Source |
|---|---|---|---|---|
| 0 | **Sub-project TAG (default)** | Almost always | No — filter, not scope | Brian 2026-04-21 |
| 1 | `contains`-type link | Promote tag → link only when sub-project needs distinct boundary/transparency partition. Same engagement. | Yes — child ⊆ parent | Heavier |
| 2 | Cross-engagement link | A primary Project pulls work from a secondary Project in a linked Engagement. Data-bearing or structural-only per link type. Example: `Buyer <- Auditor` project pulled into `Buyer <- Seller` primary | Cross-engagement — see CE1 | Heavier |
| 3 | Lateral / CE10 link | NOT containment. Types: `depends_on`, `relates_to`, `blocked_by`, `supersedes`, `derives_from`, `requires`. Same or different engagement. | Neither owns the other | Heaviest |

**Question for Nic:** tag semantics are clear (hydra tag). For mechanisms 1–3, what's the canonical platform approach — hydra `link_type`, CE10 extension, or a new platform primitive?

---

## Board polymorphism + filter views

### Kevin's spec (2026-03-17) — Board parent types

- `Org` — org-wide rendering (e.g., org-wide bugs board)
- `Boundary` — tasks within a Boundary scope
- `Project` — all tasks across a Project (Brian: *"a board is trapping all things on a project"*)
- `User` — personal task view ("my inbox")

### Proposed additions (2026-04-21)

- `Workspace` — scoped rendering of tasks within a Workspace's crew/aperture/transparency partition
- `Transparency` — renders tasks shared via a Transparency Center surface

### Board vs Workspace — side-by-side disambiguation

| Dimension | Board | Workspace |
|---|---|---|
| What it is | Rendering anchor for Tasks | Scope partition (access + visibility) |
| What it owns | **Tasks** (Kevin's rule — single ownership) | Scope members: crew, aperture, activity log |
| Defines activities | Yes — Activity superset, phases, ranks, transitions, codes | No |
| Defines scope / roles | No — inherits from parent | Yes — own boundary, transparency, crew |
| Parent type | Polymorphic: Org / Boundary / Project / User / (+Workspace, +Transparency) | Project (or contains-linked Project) |
| In boundary subset chain? | No — VIEW layer | Yes — innermost DATA tier |
| Answers the question | *How are tasks displayed?* | *Who's inside & what do they see?* |

### Task ownership chains (single ownership — chosen at creation)

```
Task -> Board(parent=Project)      -> Project -> Engagement
Task -> Board(parent=Workspace)    -> Workspace -> Project -> Engagement
Task -> Board(parent=Boundary)     -> Boundary
Task -> Board(parent=Org)          -> Org
Task -> Board(parent=User)         -> User
Task -> Board(parent=Transparency) -> Transparency Center
```

Same Project can host Boards with different parents simultaneously — a project-level Board AND multiple workspace-level Boards side by side. Each Task picks exactly one Board at creation; scope flows through that one Board's parent.

**Moving a Task between scopes** = re-parenting it to a different Board. Identity stays; owner changes.

### Board filter views — "like epic" (Brian 2026-04-21)

> "if I'm in a board I want to look at a subproject view or workspace view (like epic?)"

From within a Board, the UI should support filtering the rendered task set by:
- **Sub-project tag filter** — show only tasks tagged with e.g. "Cyber" (the Jira-epic analog)
- **Workspace filter** — show only tasks whose Workspace is X (for project-level Boards that span many workspaces)
- **Aperture filter** — show only tasks whose workspace aperture is e.g. "encryption"
- **Combined** — multiple filters composable

Filters are query-layer; they don't re-own the tasks. Each task still has exactly one Board owner.

### Open questions for Nic & Kevin (from HTML)

- **Is `SmeMartBoard` redundant with platform Board?** Kevin's spec covers rendering, phases, ranks, codes, transitions, polymorphic parents. If platform Board delivers all of that, `SmeMartBoard` should be dropped.
- **Does Kevin's Board accept Workspace and Transparency as parent types?** If not, we need them added.
- **Does platform Board support tag-filter views on rendered tasks?** (Sub-project / workspace / aperture filters, composable.) If not, that's a Board feature request.

---

## Engagement coalition pattern (multi-3PAO)

> A buyer typically uses **multiple** separate 3PAO auditors to audit different portions of the supplier. (Brian 2026-04-21)

### Structure

- **Primary Engagement:** `Buyer <- Seller` — the commerce contract being audited
- **Linked Engagements:** `Buyer <- Auditor A`, `Buyer <- Auditor B`, `Buyer <- Auditor C`, …
- Each linked auditor's Project is **CE1-linked** into the primary Buyer-Seller project via:
  - `Project.homeEngagementId: UUID` (the primary)
  - `Project.linkedEngagements: [{ engagementId, pulledInByPartyId, scope, anonymityToggle }]`

### Side assignment (locked)

- The buyer AND all linked auditors are on the **demand side** (they all issue REQ tasks).
- The supplier is the **supply side** / auditee (it runs SAT tasks).
- A single supplier SAT can be `twin_of`-paired to multiple demand REQs simultaneously — buyer's own REQ plus any number of auditor REQs. **N-party entanglement, not strictly binary.**

### Data-plane access through primary

A linked audit project reaches the supplier's people, apps, devices, and policies **only through the primary project's boundaries**. Without the CE1 link, the auditor has no access path. This is how seller consent for pulled-in auditors gets baked into the transparency-system agreement at primary-engagement signing — no per-request approval.

### Termination semantics

- **Primary termination** requires a **mutual handshake** (buyer + seller).
- **Linked-engagement termination** auto-revokes that auditor across all projects they were pulled into. (Cascade granularity TBD.)

### Anonymity (CE6)

- Anonymity is a **per-linked-engagement TOGGLE**, Buyer-controlled (not enforced platform-wide).
- Default/best-practice = anonymous (the "0-bias standard").
- When on: mask org/logo/contact/principals; preserve role + specialty.
- Remediation flows THROUGH the transparency center — auditor identity stays anonymous through remediation.

---

## Backend consolidation proposal (Kevin 2026-04-22)

Kevin proposed: consolidate `Engagement`, `Project`, `Sub-project`, `Workspace` into **ONE backend class** (`Project`) with a flavor discriminator. UI renders per flavor; backend shares one permission / boundary / link / activity model.

The conceptual tiers above describe what users see; this section describes what gets BUILT.

### The one class

```
class Project (platform)
  flavor: "engagement" | "project" | "subproject" | "workspace"
```

**All flavors share** (Kevin's existing Project spec + CE additions):
- Own boundary set + boundary subset enforcement (`parent.boundaries ⊇ child.boundaries`)
- Own RoleScope (`scope=project` extends to any flavor)
- Own children chain (Plans, Files, Boards, Notes, Timelines, Whiteboards, Tasks via Boards, nested Projects)
- Own transparency partition (Transparency is a *function*, not a class — Kevin's directive)
- Typed `Project <-> Project` link primitive: contains / cross-engagement / CE10 lateral
- Activity log rollup (CE11): one chain implementation rolls through all flavors
- Valid Board parent (polymorphically)

### Flavor matrix

| flavor | UI label | allowed parent | flavor-specific props |
|---|---|---|---|
| `engagement` | Engagement | Org pair (via members) | `parties[]`, MSA, commercial lifecycle |
| `project` | Project | `Project[flavor=engagement]` (`homeEngagementId`) + `linkedEngagements[]` | `homeEngagementId`, `linkedEngagements[]` |
| `subproject` | Sub-project (when promoted from tag) | `Project[flavor=project]` via contains-type link | *(none additional)* — same shape as project, distinct boundary/transparency |
| `workspace` | Workspace | `Project[flavor=project]` (or subproject) | `crew[]`, aperture tag, sub-project tag (filter) |

Parent-child compatibility enforced by a validation matrix. E.g., `workspace` can't contain `engagement`; only specific pairs are valid.

### What consolidates

- One permission / role-scope model
- One boundary subset chain implementation
- One CRUD API surface (flavor-parameterized)
- One `Project <-> Project` link primitive covers CE1 / contains / CE10 lateral
- One activity-log rollup mechanism
- One transparency-partition implementation (function, not class)
- SME Mart's `Engagement.yml` + `SmeMartProject.yml` collapse into platform `Project[flavor=*]`

### What stays distinct (NOT Project flavors)

- **Board** — VIEW layer; rendering, phases/ranks/transitions, task-code namespace. Kevin's own class.
- **Task** — atomic unit owned by Board; not a scoped container.
- **Tags** (aperture, sub-project) — hydra tags; lightweight filters, not containers.
- **Org** — identity / auth / billing; beyond Project's scope.
- **User** — principal; not a container.
- **Boundary** — security perimeter; distinct semantics.
- **Transparency** — a *function* / partition mechanism. Not a Project flavor. Not an entity.

### Board polymorphism simplifies

- **Before consolidation:** Board.parent could be Org / Boundary / Project / User / Workspace / Transparency (6 polymorphic targets).
- **After consolidation:** `Board.parent ∈ { Org, User, Boundary, Project[any flavor] }`. 4 targets. Workspace case is absorbed into `Project[flavor=workspace]`. Transparency drops off entirely (it was never an entity).

### Migration commitment (W3Geekery -> Platform)

> Per our standing commitment to Nic: we'll refactor anything platform pulls in.

- Drop `Engagement.yml` from SME Mart schema → create `Project[flavor=engagement]` records in platform
- Drop `SmeMartProject.yml` → migrate to `Project[flavor=project]`
- Workspace (CE13 net-new) → land in platform as `Project[flavor=workspace]` instead of a parallel new class
- SME Mart Angular services rewire to call the consolidated Project API with `flavor` parameter
- Sub-project (tag) stays as hydra tag; promote to `Project[flavor=subproject]` only per case

**Net:** SME Mart's 23-class schema inventory shrinks. Most hierarchy-shaped classes become flavor usage of platform `Project`.

### Kevin & Nic — open questions (from HTML)

- **Flavor set confirmation** — `{engagement, project, subproject, workspace}`. Any additions or splits?
- **Parent-compatibility matrix** — which pairings are valid? Proposed: engagement ← none (root); project ← engagement; subproject ← project; workspace ← project | subproject.
- **Flavor-specific property validation** — JSON-schema-per-flavor, or per-flavor validators in producers?
- **Cross-engagement link model** — still typed `Project <-> Project`, with `link_type` carrying data-plane-access semantics for linked audit projects?
- **Board.parent polymorphism** — confirm the 4-target set `{Org, User, Boundary, Project[any flavor]}`?

---

## CE backlog summaries (CE1–CE14)

These are the cross-engagement (CE) backlog items that originated from Brian's CEO directives and the Multica research. Numbering is non-contiguous because CE2 was superseded by CE6.

> Source: `.planning/BACKLOG.md` (the project's BACKLOG, lines 103–116, with cross-references to research docs at `.planning/research/external/` and `.planning/research/internal/`).

| CE | Title | Status | One-line summary |
|---|---|---|---|
| **CE1** | Home + Linked Engagement Project Model | Confirmed 2026-04-14. **Foundational for CE3–CE9.** 15–20 hrs. | Asymmetric: project has ONE home (primary) engagement = Buyer↔Seller commerce + N linked (secondary) engagements (typically Buyer↔Auditor). Linked engagements are standing relationships on retainer with engagement-level MSA/background/banking, but per-project commercial terms vary. Seller consent baked into transparency-system agreement at primary-signing. Primary termination = mutual handshake; linked termination auto-revokes that auditor cascade-wide. **Schema:** `Project.homeEngagementId: UUID` + `Project.linkedEngagements: [{engagementId, pulledInByPartyId, scope, anonymityToggle}]`. |
| **CE2** | *(superseded by CE6)* | Reframed | Originally "Selective Disclosure / Party Anonymity" as visibility gate. Merged into CE6 Publish-to-Shared Pipeline. |
| **CE3** | Multi-3PAO Scope-Partitioned Audit | Confirmed 2026-04-14. 20–28 hrs. Depends on CE1 + CE5 + CE8. | Multiple 3PAOs linked via separate standing engagements, each with **Buyer-selected scope** — arbitrarily granular: whole-boundary, boundary-subset, AND intra-boundary partition (specific tasks/controls). Specialty-aligned task filter. Healthcare-vertical examples: clinical compliance, clinical engineering/HL7, cybersecurity (HIPAA/NIST/SOC2), AI governance. **Scope overlap explicitly supported** (Buyer "bake-off" second-opinion pattern). Publishing API-enforced to scope. Conflict arbitration flows through the **Cybersecurity SLA (CE8)**. 3PAOs = "category #1" in the SME Mart directory. |
| **CE4** | **Task Entanglement (N-party)** — formerly "Twinned Boundary Requirements" | Updated 2026-04-15. 14–22 hrs. | Every boundary requirement generates a Demand/Supply **entanglement** — pair, trio, quartet, quintet, sextet… Minimum 2 parties (commerce axiom). Independent RAG status per party-role, party-scoped visibility. **THE canonical opt-in data transparency mechanism.** Lifecycle: evolve in-place (versioned as parties join) OR die-and-respawn on reassignment. Expands Plan 080; aligned with Plan 071 (Entangled Tasks). |
| **CE5** | Protocol Gateway — Task-Level Grants | 18–24 hrs. **Blocks CE3.** | Permission enforcement at task/subtask granularity (not just boundary-level). Grant types: `read`, `write`, `publish-to-shared`, `close-task`. Default grant matrix per task-type template. |
| **CE6** | Publish-to-Shared Pipeline + Anonymity | Confirmed 2026-04-14. 16–22 hrs. Depends on CE1; integrates with CE8. | Private 3PAO workspace → elevated findings published to shared transparency center. **Anonymity is a per-linked-engagement TOGGLE, Buyer-controlled.** Default/best-practice = anonymous (the "0-bias standard"). When on: mask org/logo/contact/principals; preserve role + specialty. Remediation flows THROUGH the TC (alerts + rights-to-cure 30/60/90d) — auditor identity stays anonymous through remediation; penalties/cure-windows/contractual-outs pre-defined in the Cybersecurity SLA (CE8). Replaces CE2's visibility-gate approach. |
| **CE7** | Sub-Project Hierarchy (`parentProjectId`) | 6–8 hrs. **Possibly deprecated by CE10** — reassess after both land. | Add `SmeMartProject.parentProjectId` for structural work-breakdown. **ONE home engagement per project tree** — sub-projects inherit `engagementId` immutably. Cross-engagement participation for sub-projects handled via CE1 linked engagements on the root + scope narrowing per sub-project (extend `LinkedEngagementScope.subProjectIds: [UUID]`). Lateral project↔project relationships continue to use platform resource links, not `parentProjectId`. Cascade: archive parent → archive children; delete blocked if children exist. |
| **CE8** | **Cybersecurity SLA — First-Class Contract Template** | NEW 2026-04-14. 18–24 hrs. Depends on CE1 + CE3 + CE6. | Assessor-packaged continuous-monitoring contract: assessment logic + legal terms + rights-to-cure windows (30/60/90d) + penalty/out clauses. Buyer subscribes; terms imposed into primary-engagement contract with Seller. **Authoritative for conflict arbitration** (scope overlap, threshold breaches). Likely a reusable SME Mart entity type published by 3PAOs, subscribed-to by Buyers, inserted into Engagement as SLA attachment. |
| **CE9** | **Nested Transparency Centers** | NEW 2026-04-14. Research-then-plan; scope TBD. Touches CE1 + CE6 + CE7. | Each project has its own transparency center. Linked projects create linked transparency centers. Buyer↔Auditor (linked engagement) may need a **secondary** TC that publishes into the **primary** TC. Brian's "inception" nesting concern — depth limit and rollup semantics unresolved. **Note:** CE11's 3-level activity log rollup may resolve most of this; re-evaluate after CE11. |
| **CE10** | **Typed Project Relations (flat graph)** | NEW 2026-04-15. 8–12 hrs. **Complements (may deprecate) CE7's `parentProjectId`.** | Add `project_relation` entity/edge for lateral project↔project links: `relates_to`, `depends_on`, `blocked_by`, `requires`, `supersedes`, `derives_from`. **DAG semantics**, validation layer prevents cycles on `depends_on`/`blocked_by`. Leverages ZB platform resource-link system. Source: Multica `multica-flat-projects-with-relations` pattern. |
| **CE11** | **Append-Only Activity Log with ZB Extensions** | NEW 2026-04-15. 20–28 hrs. | New `ActivityLog` class: append-only, hash-chained (Merkle-style tamper evidence), with `boundary_set`, `engagement_id`, `portfolio_id`, `party_visible_to` fields. **Default private to its workspace** (Brian 2026-04-15); transparency propagation is **opt-in via linked task pairs (req↔sat)** — ties to CE4. Rollup chain available when opted in: workspace → project → portfolio. Replaces concept-only references in CE6 + CE9. Source: Multica `multica-activity-log-pattern` + ZB multi-party extensions. |
| **CE12** | **Boundary Subset Enforcement (4-level chain)** | NEW 2026-04-15. 10–14 hrs. | Enforce `engagement.boundaries ⊇ portfolio.boundaries ⊇ project.boundaries ⊇ workspace.boundaries`. Each level can only tighten, never loosen. **Middleware rejects violations at write time.** Provides mathematical clarity for Brian's "deepest requirements auditing" goal — schema enforces scoping, not policy docs. Source: Multica `multica-boundaries-as-first-class` pattern + CE3 partial-scope language. |
| **CE13** | **Within-Project Workspace (crew isolation + aperture)** | NEW 2026-04-15. 18–24 hrs. Depends on CE10/CE11/CE12. | Net-new `Workspace` entity scoped to a project. Contains: members (humans + agents), skills, scoped activity log, boundary subset. **Aperture is a tag-based attribute** (hydra tags, malleable, user-customizable — Brian 2026-04-15) — not a fixed enum; the 3PAO specialty taxonomy is a common seed set. **Workspaces are private + anonymous by DEFAULT.** Transparency is opt-in via linked task pairs (req↔sat, ties to CE4). 3PAO audit crews are natural workspaces. |
| **CE14** | **Portfolio (project wrapper under engagement)** | NEW 2026-04-15. 20–28 hrs. Depends on CE1 + CE11 + CE12. | Net-new `ProjectPortfolio` entity wrapping N projects under **one engagement** (Brian 2026-04-15 — engagement is highest level, no cross-engagement portfolios "until someone asks"). Carries the multi-project transparency dashboard UX: projects sortable, workspaces drillable by aperture. Portfolio boundaries ⊆ Engagement boundaries (CE12). Nav sibling (no new entity for now): **Engagement Portfolio** — directory view sorting all engagements the party has access to ("just a directory structure" per Brian). |

### CE relationship graph (high level)

```
CE1 (Linked Engagements) ----+
  |                          |
  v                          v
CE3 (Multi-3PAO) -- CE6 (Publish-to-Shared + Anonymity) -- CE8 (Cybersecurity SLA)
  ^                          |
  |                          v
CE5 (Task-level grants)    CE9 (Nested TCs) -- (resolved by) -> CE11 (Activity Log)

CE10 (Typed Project Relations) -- CE13 (Workspace) -- CE12 (Boundary Subset)
  ^                                    |
  |                                    v
CE7 (parentProjectId)            CE14 (Portfolio)
  (may be deprecated by CE10)         |
                                      v
                                 CE4 (Task Entanglement) — the canonical seam
```

CE4 is the load-bearing transparency mechanism for ALL of the above. CE11 + CE13 are private-by-default; transparency activates ONLY via CE4.

---

## Related ROADMAP phases

These are the v1.4 milestone phases that touch boards / transparency / projects. Source: `.planning/ROADMAP.md` (full file is the source of truth; summaries below are derivation).

### Phase 23 — Transparency Controls: UI-SPEC Lock + Opportunistic Implementation

**Goal:** Capture Brian's transparency-controls vision as a UI-SPEC. Research what backend deliverables Transparency Controls depend on. Key open question: does CE4 (N-party task entanglement) have any usable surface yet, or is this pure UI-ahead-of-platform?

**Locked early in scoping (per `.planning/director/phase-23-brief.md`):**
- Transparency Controls is an **N-party** affair (CE4 N-party clarification 2026-04-15).
- Kevin's clarification: *"Transparency is a FUNCTION, not a place"* — the TC may map to existing platform surfaces we can wire up rather than a new entity.
- Full CE4 / N-party entanglement implementation is platform-dependent; Phase 23 ships the UI-SPEC + opportunistic implementation only.

**Out of scope:** full CE4 backend implementation; full multi-party data isolation (Plan 056).

### Phase 24 — Demo Data Visibility Gate

**Goal:** Hide demo-tagged data (`sme-mart.demo` hydra tag on records) from non-admin users. Provide an admin toggle ("Show demo data") that surfaces tagged records for development/demo. Currently implemented as `app_settings.demo_mode_enabled` boolean + `DemoModeService` signal-gated GQL query short-circuit.

**Open architectural concern (surfaced in Plan 26-03 redraft 2026-04-29):** the current GraphqlReadService gate returns empty for ALL queries when demo mode is OFF — too coarse. Phase 24 will replace this with per-record `tag=sme-mart.demo` filtering once demo records are re-tagged in MPI.

**For Nic:** if platform Resource has a tag-based visibility primitive, SME Mart wants to use it.

### Phase 30 — Default Project Board + Coming Soon Placeholders

**Goal:** Every default ZB engagement gets a default project + a default Board with a minimal task scaffold. Coming Soon placeholders for tier display, ToS surfaces, branding (the v1.5 content layer).

**Touches:**
- Default engagement bootstrap (DECISIONS § "Default ZB Engagement is Auto, Invariant").
- `SmeMartBoard` rendering (and the open question of whether `SmeMartBoard` is redundant with platform Board).

### Phase 31 — W3Geekery Dogfood + Production Smoke Test

**Goal:** Use W3Geekery's own engagement (the dev-services engagement, `ZeroBias <- W3Geekery`) as the dogfood instance. Smoke-test all v1.4 flows end-to-end on prod. Validates the "build the channel by using the channel" principle.

**Locked context (DECISIONS § "Bootstrap-Recursion Collapses by Manual Engagement Creation" 2026-04-22):**
- W3Geekery↔ZeroBias dev-services Engagement + default Project created manually via MCP / Pipeline.receive on UAT before v1.4 ships.
- Buyer = ZeroBias; Provider = W3Geekery (dev services). NOTE: NOT the same engagement as the ZB-as-platform-tenant default-engagement Brian directs for paying customers.

---

## Related older plan numbers

These plan numbers appear throughout BACKLOG.md, the cross-engagement audit research doc, and DECISIONS.md. Summaries below are derivation from the BACKLOG / research docs.

| Plan | Title | Cross-engagement role |
|---|---|---|
| **041** | Vendor Profile Service | Existing service class for Vendor profile items. **MarketplaceProfileItem** (one of the 23 SME Mart classes) was originally Plan 041's data model. |
| **056** | Multi-Party Data Isolation | Original framing of party-scoped data isolation. Replaced/expanded by CE3 (Multi-3PAO Scope-Partitioned Audit) + CE5 (Task-level grants) + CE6 (Publish-to-Shared). |
| **064** | Project Members View | Original UI for project membership. **2026-04-13 update:** must render multi-engagement origins per party — each row shows "from Engagement X". Supports CE1 cross-engagement model. |
| **071** | Entangled Tasks / Task Pairs | Original framing of the demand/supply task pair concept. Aligned with CE4 (terminology: "twin" → "entanglement" with N-party cardinality, 2026-04-15). |
| **080** | Project Parties / Members | Original framing of project parties. Expanded by CE1 (linked engagements) and CE3 (multi-3PAO). Source for: |
|  |  | — DECISIONS § "Internal vs External Org Membership (Plan 080)" |
|  |  | — DECISIONS § "Project Members → Parties (Plan 080)" |
|  |  | — DECISIONS § "Boundary Admin Stays in ZB Platform (Plan 080)" |

The cross-engagement audit research doc is at `.planning/research/external/2026-04-13-ceo-miro-cross-engagement-audit-model.md` — it introduces CE1–CE6 and reshapes plans 071/078/080/064/041/056. Worth reading if you want the historical narrative for how SME Mart got from binary twins to N-party entanglement.

---

## SME Mart schema inventory (23 classes + canonical IDs)

These class IDs are **platform-assigned at registration**, NOT deterministic UUID v5. Verify any unfamiliar class via `platform.Class.getClass(<id>)`.

Source of truth: `src/app/core/services/pipeline-write.service.ts` (the SME_MART_CLASS_IDS map) — copied here verbatim and freshness-checked 2026-04-29.

```ts
const SME_MART_CLASS_IDS = {
  // Original 8 entities (migrated from Neon in Phases 2-4)
  Engagement:      '7711aa41-e55b-5cda-9b7a-35844a2006a1',
  Bid:             'ccddd2e5-e455-585e-9bb7-902903228b0d',
  BidResponse:     'a024a0b5-50df-59cc-ba8e-25fcd82f69c3',
  ServiceOffering: 'ff689173-4787-52c5-808b-6b2435a625a7',
  Note:            'fe7c58a9-c13b-5a4b-817f-5c4b419ed28c',
  NoteFolder:      '4d50975e-d4dc-5654-8e43-f3c5da01f49d',
  Review:          'ef5d821a-46f5-5f44-8e59-0854777d803c',
  SmeMartDocument: 'e1497ca8-a621-57f6-9263-f9a19fea3c34',

  // Phase 6 Bloom entities (greenfield — built directly on Pipeline+GQL)
  SmeMartProject:  'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03',
  SmeMartBoard:    '20be589b-194e-5227-ba6e-c7edae42f34b',
  SmeMartActivity: '36405d75-76f1-5f4b-ab3b-22c562d41e07',
  SmeMartWorkflow: '295938d2-5c63-5140-a945-2ba28b88b268',
  SmeMartTask:     'e15f1e0a-1bc9-5002-b4bc-3482d4499561',
  ProjectPrd:      '920fca70-4dcf-5d9e-ba16-1dfd0f8061f0',
  PrdSection:      'd30445f3-e26d-5153-83be-fe810f63220c',
  ProjectPlan:     'bc6159da-19a3-51d0-89a8-f2147078c760',
  PlanMilestone:   'ac1a1cc8-db44-5c1d-b359-5fb02e3d381d',

  // Plan 063 — Corporate Vetting (canonical platform-assigned id, confirmed via platform.Class.getClass on UAT 2026-04-28)
  EngagementVettingItem: '21f5841f-dd27-53ef-a0f5-6a816ec7f7e1',

  // Plan 041 — Vendor Profile Service (canonical platform-assigned id, validated empirically by Plan 26-02 seed)
  MarketplaceProfileItem: '7bcf86a5-91dc-520d-b9bf-e308b1078d46',

  // Phase 14 — Invitation Controls
  RfpInvitation: '941cf01b-d260-5e45-8c6a-50f07b23f196',

  // Phase 15 — Document Templates
  DocumentTemplate: 'd2493bf7-f28d-5d26-8858-58062d402012',
  DocumentInstance: '3e1d232f-3105-535e-8ef5-70cb0f80d65f',

  // Phase 16 — Form Builder
  FormSubmission: '179bd4b1-d1b1-5afc-99be-a5465a662ec6',
};
```

### Pipeline + Boundary IDs (UAT)

These are environment-specific (NOT deterministic):

| Resource | UUID (UAT) | Notes |
|---|---|---|
| Pipeline | `43f08afd-7ab9-4e99-a93c-619c46adaabe` | `platform.Pipeline.receive` target |
| Platform boundary | `c15fb2dc-4f8c-48b5-b27a-707bd516b005` | W3Geekery SME Marketplace DEV; used by `graphql.Boundary.boundaryExecuteRawQuery` |
| `Object.tag` propertyId | `65aadece-c352-4d59-8137-6ae03b98506d` | Inherited on every class; `dataTypeName: "tag"`, `dataTypeType: "object"`, `multi: true` |

### W3Geekery walkthrough artifacts (UAT, canonical UUIDs)

Useful for cross-referencing if Nic's claude wants to query the actual records:

| Artifact | UUID | Notes |
|---|---|---|
| `sme-mart.eng.w3geekery-default-zb` (hydra tag) | `a81cd320-243e-44eb-bdd9-9824019ef3dd` | Tag for default ZB engagement |
| Engagement (external UUID) | `746010b7-dc99-436b-9142-8c4b85c5e623` | For GQL queries |
| Engagement Task (meta-tracker) | `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` | Activity: `aha1` (Ad Hoc - One person), `e15830c8-4274-4d67-bf9b-c22b60001e32` |
| ZeroBias org id (UAT) | `57c741cf-a58e-5efc-bf2f-93c4f6cf76ec` | Owner of platform-provider MPI records |
| W3Geekery org id (UAT) | `cd7105df-523d-5392-9f9a-3f83d3f30107` | Buyer org in `W3Geekery <- ZeroBias` engagement |

---

## Schema YAMLs — full inventory inline

All 20 SME Mart class YAMLs from the schema repo are inlined below — Nic may absorb any of these into platform Resource design, so the full surface is provided. Inlined verbatim as of 2026-04-29 from:

```
~/Projects/zb/zerobias-org/schema/package/w3geekery/smemart/classes/
```

Full repo path: `https://github.com/zerobias-org/schema/tree/main/package/w3geekery/smemart/classes/`

**Three classes from the 23-class inventory are NOT in the local schema repo as of 2026-04-29** — these are likely in a separate schema package or a feature branch we don't have locally: `DocumentTemplate`, `DocumentInstance`, `FormSubmission` (Phases 15–16). Pipeline.receive accepts them on UAT (canonical IDs in the inventory section above), but the schema YAMLs aren't in `~/Projects/zb/zerobias-org/schema`. If you find them, please ping back — we'd like to update this snapshot.

The 20 inlined YAMLs are organized into two groups:

- **Hierarchy / structural classes (5)** — the prime absorption candidates under Kevin's `Project[flavor=*]` consolidation proposal
- **Domain-specific classes (15)** — marketplace / bidding / RFP / vetting / notes / documents / planning / activity-workflow entities

---

### Hierarchy / structural classes (5)

These are the 5 classes most relevant to platform Resource design. Each is a candidate for absorption into a consolidated platform `Project` with a `flavor` discriminator (Kevin 2026-04-22) — except `MarketplaceProfileItem` which is its own absorption candidate (a vendor/buyer profile primitive), and `SmeMartTask` / `SmeMartBoard` which would absorb into platform Task / platform Board respectively.

#### Engagement.yml

```yaml
description: "Corp-to-corp agreement between a buyer org and a provider org in the SME Mart marketplace. Projects relate to an engagement via platform resource links (relates_to), not parent-child."
extends:
  - Object
properties:
  - buyerZerobiasUserId:
    field: engagement.buyerZerobiasUserId
  - buyerZerobiasOrgId:
    field: engagement.buyerZerobiasOrgId
  - zerobiasTagId:
    field: engagement.zerobiasTagId
  - zerobiasTaskId:
    field: engagement.zerobiasTaskId
  - status:
    field: engagement.status
  - engagementTag:
    field: engagement.engagementTag
  - facilitatorUserId:
    field: engagement.facilitatorUserId
  - communicationMode:
    field: engagement.communicationMode
  - reviews:
    linkTo: Review.id.engagement
    multi: true
  - notes:
    linkTo: Note.id.engagement
    multi: true
  - documents:
    linkTo: SmeMartDocument.id.engagement
    multi: true
  - noteFolders:
    linkTo: NoteFolder.id.engagement
    multi: true
  - vettingItems:
    linkTo: EngagementVettingItem.id.engagement
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Tag":
    jsonata: engagementTag
    sort: engagementTag
```

**Notes:**
- `buyerZerobiasOrgId` is the only party reference at the schema level (no `providerZerobiasOrgId` field). Provider direction is encoded in the `name` field via the `Buyer <- Provider` convention.
- `Engagement` has NO `Project` link field. Projects relate via `Project.engagementId` + platform `relates_to` resource link, not parent-child.
- This class is a candidate for **absorption into `Project[flavor=engagement]`** under Kevin's consolidation proposal.

#### SmeMartProject.yml

```yaml
description: "Scoped work container. Owned by Org or User. Related to Engagements via platform resource links (relates_to), not parent-child. References 0+ ZB Boundaries. Also serves as RFP when in draft/published status."
extends:
  - Object
properties:
  - status:
    field: project.status
  - ownerId:
    field: project.ownerId
  - ownerType:
    field: project.ownerType
  - startDate:
    field: project.startDate
  - targetEndDate:
    field: project.targetEndDate
  - boundaryIds:
    field: project.boundaryIds
  - industry:
    field: project.industry
  - complianceFrameworkIds:
    field: project.complianceFrameworkIds
  - category:
    field: project.category
  - budgetType:
    field: project.budgetType
  - budgetMin:
    field: project.budgetMin
  - budgetMax:
    field: project.budgetMax
  - timeline:
    field: project.timeline
  - responseDeadline:
    field: project.responseDeadline
  - questionsDeadline:
    field: project.questionsDeadline
  - evaluationCriteria:
    field: project.evaluationCriteria
  - wizardStep:
    field: project.wizardStep
  - wizardData:
    field: project.wizardData
  - engagementId:
    field: project.engagementId
  - projectType:
    field: project.projectType
  - isInvitationOnly:
    field: project.isInvitationOnly
  - bids:
    linkTo: Bid.id.project
    multi: true
  - reviews:
    linkTo: Review.id.project
    multi: true
  - boards:
    linkTo: SmeMartBoard.id.project
    multi: true
  - prds:
    linkTo: ProjectPrd.id.project
    multi: true
  - plans:
    linkTo: ProjectPlan.id.project
    multi: true
  - notes:
    linkTo: Note.id.project
    multi: true
  - documents:
    linkTo: SmeMartDocument.id.project
    multi: true
  - noteFolders:
    linkTo: NoteFolder.id.project
    multi: true
  - rfpInvitations:
    linkTo: RfpInvitation.id.project
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Category":
    jsonata: category
    sort: category
  "Owner Type":
    jsonata: ownerType
    sort: ownerType
  "Project Type":
    jsonata: projectType
    sort: projectType
```

**Notes:**
- `engagementId` is a scalar, NOT a typed link (`linkTo`). Project ↔ Engagement relationship currently rides on the scalar field + platform resource links rather than the `linkTo` mechanism.
- Heavy field set because `SmeMartProject` doubles as the RFP entity (when `status` is `draft` / `published`).
- `boundaryIds` is an array — projects can span N boundaries (consistent with the boundary-subset chain).
- This class is a candidate for **absorption into `Project[flavor=project]`** under consolidation. The RFP-overload is awkward and may want its own flavor or its own class.

#### SmeMartBoard.yml

```yaml
description: "Structural container for tasks. Provides rank, issue numbering, and permission inheritance from boundary."
extends:
  - Object
properties:
  - scope:
    field: board.scope
  - partition:
    field: board.partition
  - boundaryId:
    field: board.boundaryId
  - project:
    linkTo: SmeMartProject.id.boards
  - tasks:
    linkTo: SmeMartTask.id.board
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Scope":
    jsonata: scope
    sort: scope
  "Partition":
    jsonata: partition
    sort: partition
```

**Notes:**
- Current SME Mart `SmeMartBoard` is project-scoped (single `project` link). Kevin's polymorphism (Org / Boundary / Project / User / Workspace / Transparency) is NOT yet expressed in this class.
- `partition` field exists but is under-defined (would carry demand/supply/transparency partition per Brian's P0 directive — see Invariant 3).
- **Open question:** is `SmeMartBoard` redundant with platform Board? If platform Board delivers the polymorphic-parent + rendering/phases/ranks/transitions surface, this class should be dropped (HTML's open question for Nic & Kevin).

#### SmeMartTask.yml

```yaml
description: "Task on a board, under an activity. Supports subtask hierarchy via parent link."
extends:
  - Object
properties:
  - code:
    field: task.code
  - rank:
    field: task.rank
  - phaseCode:
    field: task.phaseCode
  - status:
    field: task.status
  - priority:
    field: task.priority
  - dueDate:
    field: task.dueDate
  - sourceDocument:
    field: task.sourceDocument
  - transparencyConfig:
    field: task.transparencyConfig
  - board:
    linkTo: SmeMartBoard.id.tasks
  - activity:
    linkTo: SmeMartActivity.id.tasks
  - parent:
    linkTo: SmeMartTask.id.children
  - children:
    linkTo: SmeMartTask.id.parent
    multi: true
viewProperties:
  "Code":
    jsonata: code
    sort: code
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Phase":
    jsonata: phaseCode
    sort: phaseCode
  "Due Date":
    jsonata: dueDate
    sort: dueDate
```

**Notes:**
- `transparencyConfig` is a placeholder for CE4 entanglement / transparency partition config. Schema-level shape TBD pending CE4 backend implementation.
- `parent` ↔ `children` symmetric link supports Kevin's sub-task model (a Task can be owned by another Task).
- `sourceDocument` carries the Brian "task requires AWS S3 ARN policy, IAM setting, data objects X/Y/Z" supply-side requirement description (Invariant 3).
- No explicit `req` / `sat` role discriminator yet. The `twin_of` (CE4) link type and entanglement role will be added when CE4 lands.

#### MarketplaceProfileItem.yml

```yaml
description: "Vendor/buyer profile item containing credentials, certifications, references, insurance info, or personnel data. Uses section discriminator + JSON data blob for flexible content."
extends:
  - Object
properties:
  - section:
    field: marketplaceProfileItem.section
  - expiresAt:
    field: marketplaceProfileItem.expiresAt
  - status:
    field: marketplaceProfileItem.status
  - orgId:
    field: marketplaceProfileItem.orgId
  - data:
    field: marketplaceProfileItem.data
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Section":
    jsonata: section
    sort: section
  "Status":
    jsonata: status
    sort: status
  "Expires At":
    jsonata: expiresAt
    sort: expiresAt
```

**Notes:**
- This class is a **section-discriminated single-entity** pattern (per DECISIONS § "VendorProfileItem: Single Entity with Section Discriminator"). One MPI record per section per org — flat sub-section pattern (e.g., `primary_contact.email`) instead of JSON-encoded objects.
- `data` is a plain string (NOT JSON for primary fields). Replaces the older "JSON blob" framing in the description.
- `orgId` is the partition key. Reads use `MarketplaceProfileItem(orgId: ".eq.<id>") { id, section, data, status }`.
- **17-section catalog locked** in `.planning/director/COMPANY-INFO-CONVENTION-DRAFT.md`: `legal_name`, `dba`, `logo_url`, `short_blurb`, `long_description`, `website`, `primary_contact.user_id`, `primary_contact.name`, `primary_contact.email`, `hq_location.{street,city,state,country,postal_code}`, `years_in_business`, `employee_count`, `onboarding_complete`, plus the platform-provider distinguisher `provider_type`.
- **Pipeline.receive replace key is `id` only** (validated 2026-04-27 via UAT experiment). Per-section saves are independent.

---

### Domain-specific classes (15)

These classes implement SME Mart's marketplace, bidding, vetting, notes, documents, project planning, and activity-workflow surfaces. They are less load-bearing for the structural Project/Engagement consolidation, but **any of them could be candidates for absorption into platform primitives** if the platform's Resource design covers analogous concepts (e.g., a unified `Note` / `Review` / `Document` / `Activity` primitive).

Grouped by domain:

- [Bidding flow](#bidding-flow-bid-bidresponse-rfpinvitation): `Bid.yml`, `BidResponse.yml`, `RfpInvitation.yml`
- [Engagement support](#engagement-support-engagementvettingitem-review): `EngagementVettingItem.yml`, `Review.yml`
- [Notes & Documents](#notes--documents-note-notefolder-smemartdocument): `Note.yml`, `NoteFolder.yml`, `SmeMartDocument.yml`
- [Provider catalog](#provider-catalog-serviceoffering): `ServiceOffering.yml`
- [Project planning artifacts](#project-planning-artifacts-projectprd-prdsection-projectplan-planmilestone): `ProjectPrd.yml`, `PrdSection.yml`, `ProjectPlan.yml`, `PlanMilestone.yml`
- [Work-type / workflow definitions](#work-type--workflow-definitions-smemartactivity-smemartworkflow): `SmeMartActivity.yml`, `SmeMartWorkflow.yml`

---

### Bidding flow (Bid, BidResponse, RfpInvitation)

The RFP-to-bid pipeline. A `SmeMartProject` in `published` status acts as the RFP. Providers submit `Bid` records against the RFP, with a `BidResponse` per requirement. Invitation-only RFPs use `RfpInvitation` to gate which vendors can bid.

#### Bid.yml

```yaml
description: "A vendor's bid on an RFP (SmeMartProject in published status)"
extends:
  - Object
properties:
  - providerId:
    field: bid.providerId
  - coverLetter:
    field: bid.coverLetter
  - price:
    field: bid.price
  - status:
    field: bid.status
  - timeline:
    field: bid.timeline
  - executiveSummary:
    field: bid.executiveSummary
  - teamDescription:
    field: bid.teamDescription
  - totalEstimatedHours:
    field: bid.totalEstimatedHours
  - pricingBreakdown:
    field: bid.pricingBreakdown
  - wizardData:
    field: bid.wizardData
  - wizardStep:
    field: bid.wizardStep
  - pricingModel:
    field: bid.pricingModel
  - bidValidUntil:
    field: bid.bidValidUntil
  - project:
    linkTo: SmeMartProject.id.bids
  - responses:
    linkTo: BidResponse.id.bid
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Price":
    jsonata: price
    sort: price
  "Status":
    jsonata: status
    sort: status
```

**Notes:**
- `wizardData` + `wizardStep` carry partial-bid state for the multi-step bid composition UI (mirrors the RFP wizard's pattern on `SmeMartProject`).
- `pricingBreakdown` is a JSON blob; structure varies per `pricingModel` (fixed / hourly / milestone-based).
- Highly SME-Mart-specific. Unlikely to absorb into a generic platform primitive directly, but the *pattern* (a directional response to a published Project/RFP) might map to a more general "Proposal" or "Response" primitive if the platform has one.

#### BidResponse.yml

```yaml
description: "A vendor's compliance response to a single RFP requirement"
extends:
  - Object
properties:
  - bidId:
    field: bidResponse.bidId
  - requirementId:
    field: bidResponse.requirementId
  - complianceStatus:
    field: bidResponse.complianceStatus
  - responseText:
    field: bidResponse.responseText
  - estimatedHours:
    field: bidResponse.estimatedHours
  - estimatedCost:
    field: bidResponse.estimatedCost
  - certificationRef:
    field: bidResponse.certificationRef
  - readyDate:
    field: bidResponse.readyDate
  - bid:
    linkTo: Bid.id.responses
viewProperties:
  "Requirement":
    jsonata: requirementId
  "Status":
    jsonata: complianceStatus
    sort: complianceStatus
  "Hours":
    jsonata: estimatedHours
    sort: estimatedHours
```

**Notes:**
- One BidResponse per RFP requirement per Bid.
- `complianceStatus` is an enum (`compliant` / `partial` / `non-compliant` / etc. — see `bidResponse.complianceStatus` enum file).
- `requirementId` is a scalar reference to a requirement defined in the RFP's `evaluationCriteria` JSON. NOT a typed link.
- This is the closest SME Mart class to the eventual `req <-> sat` task entanglement (CE4). Worth noting — when CE4 lands, BidResponse may evolve into (or be subsumed by) a task-entanglement primitive.

#### RfpInvitation.yml

```yaml
description: "Invitation to submit a bid on an invitation-only RFP"
extends:
  - Object
properties:
  - vendorOrgId:
    field: rfpInvitation.vendorOrgId
  - status:
    field: rfpInvitation.status
  - invitedAt:
    field: rfpInvitation.invitedAt
  - respondedAt:
    field: rfpInvitation.respondedAt
  - invitationMessage:
    field: rfpInvitation.invitationMessage
  - requestReason:
    field: rfpInvitation.requestReason
  - project:
    linkTo: SmeMartProject.id.rfpInvitations
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Vendor Org":
    jsonata: vendorOrgId
    sort: vendorOrgId
```

**Notes:**
- Used when `SmeMartProject.isInvitationOnly = true`. Gates which orgs can see and bid on the RFP.
- Could absorb into a more general "Resource Invitation" platform primitive if one exists.

---

### Engagement support (EngagementVettingItem, Review)

#### EngagementVettingItem.yml

```yaml
description: "Corporate vetting checklist item for an engagement (D&B, MSA, insurance, etc.). Bidirectional: buyer and provider each have requirements."
extends:
  - Object
properties:
  - engagementId:
    field: vettingItem.engagementId
  - category:
    field: vettingItem.category
  - vettingType:
    field: vettingItem.vettingType
  - evidenceType:
    field: vettingItem.evidenceType
  - status:
    field: vettingItem.status
  - direction:
    field: vettingItem.direction
  - conditionTrigger:
    field: vettingItem.conditionTrigger
  - documentIds:
    field: vettingItem.documentIds
  - submittedAt:
    field: vettingItem.submittedAt
  - verifiedAt:
    field: vettingItem.verifiedAt
  - verifiedBy:
    field: vettingItem.verifiedBy
  - expiresAt:
    field: vettingItem.expiresAt
  - rejectionReason:
    field: vettingItem.rejectionReason
  - waivedReason:
    field: vettingItem.waivedReason
  - notes:
    field: vettingItem.notes
  - profileItemId:
    field: vettingItem.profileItemId
  - engagement:
    linkTo: Engagement.id.vettingItems
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Category":
    jsonata: category
    sort: category
  "Direction":
    jsonata: direction
    sort: direction
```

**Notes:**
- Plan 063 — Corporate Vetting. Class id: `21f5841f-dd27-53ef-a0f5-6a816ec7f7e1` (canonical, post-errata-023 fix).
- `direction` discriminates buyer-asks-provider vs provider-asks-buyer vetting requirements.
- `profileItemId` links back to a `MarketplaceProfileItem` record (e.g., the insurance certificate the vetting item validates).
- `documentIds` is an array of `SmeMartDocument` ids (uploaded evidence).
- `expiresAt` supports the credentials/certs/insurance lifecycle pattern (matches MPI's `expiresAt`).
- Could absorb into a general platform "vetting checklist" or "compliance attestation" primitive if one exists.

#### Review.yml

```yaml
description: "Review/rating of a provider, scoped to engagement and/or project"
extends:
  - Object
properties:
  - providerId:
    field: review.providerId
  - engagementId:
    field: review.engagementId
  - reviewerZerobiasUserId:
    field: review.reviewerZerobiasUserId
  - rating:
    field: review.rating
  - reviewText:
    field: review.reviewText
  - status:
    field: review.status
  - engagement:
    linkTo: Engagement.id.reviews
  - project:
    linkTo: SmeMartProject.id.reviews
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Rating":
    jsonata: rating
    sort: rating
  "Status":
    jsonata: status
    sort: status
```

**Notes:**
- Buyer-side review of a provider's performance on an engagement/project.
- `rating` is numeric (presumably 1–5).
- Strong candidate for absorption into a platform `Review` primitive if one exists — the shape is generic.

---

### Notes & Documents (Note, NoteFolder, SmeMartDocument)

#### Note.yml

```yaml
description: "Rich-text note scoped to engagement and/or project"
extends:
  - Object
properties:
  - engagementId:
    field: note.engagementId
  - folderId:
    field: note.folderId
  - archived:
    field: note.archived
  - authorZerobiasUserId:
    field: note.authorZerobiasUserId
  - isMeetingMinutes:
    field: note.isMeetingMinutes
  - boundaryId:
    field: note.boundaryId
  - projectId:
    field: note.projectId
  - content:
    field: note.content
  - accessLevel:
    field: note.accessLevel
  - folder:
    linkTo: NoteFolder.id.notes
  - engagement:
    linkTo: Engagement.id.notes
  - project:
    linkTo: SmeMartProject.id.notes
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Access":
    jsonata: accessLevel
    sort: accessLevel
```

**Notes:**
- Dual-scoped (`engagementId` + `projectId`) — note can be engagement-only, project-only, or both. Implementation question: does the platform need per-Resource notes, or a separate `Note` primitive?
- `accessLevel` is an enum that controls visibility (private/shared/public-within-engagement).
- `boundaryId` carries an explicit boundary reference — supports the Note being scope-attached even when its owner Project/Engagement spans multiple boundaries.
- Strong absorption candidate — most platforms have notes/comments primitives.

#### NoteFolder.yml

```yaml
description: "Hierarchical folder structure for notes, scoped to engagement and/or project"
extends:
  - Object
properties:
  - engagementId:
    field: noteFolder.engagementId
  - createdByZerobiasUserId:
    field: noteFolder.createdByZerobiasUserId
  - accessLevel:
    field: noteFolder.accessLevel
  - color:
    field: noteFolder.color
  - sortOrder:
    field: noteFolder.sortOrder
  - parentId:
    field: noteFolder.parentId
  - engagement:
    linkTo: Engagement.id.noteFolders
  - project:
    linkTo: SmeMartProject.id.noteFolders
  - parent:
    linkTo: NoteFolder.id.children
  - children:
    linkTo: NoteFolder.id.parent
    multi: true
  - notes:
    linkTo: Note.id.folder
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
```

**Notes:**
- Self-referential parent/children link supports nested folder hierarchy.
- Same dual-scoping pattern as Note (engagement + project).
- A platform "folder/collection" primitive could absorb this.

#### SmeMartDocument.yml

```yaml
description: "Uploaded file tracked via ZB FileService, scoped to engagement and/or project"
extends:
  - File
properties:
  - engagementId:
    field: document.engagementId
  - archived:
    field: document.archived
  - displayName:
    field: document.displayName
  - uploadedByZerobiasUserId:
    field: document.uploadedByZerobiasUserId
  - documentType:
    field: document.documentType
  - engagement:
    linkTo: Engagement.id.documents
  - project:
    linkTo: SmeMartProject.id.documents
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Type":
    jsonata: documentType
    sort: documentType
```

**Notes:**
- **Extends `File` (not `Object`)** — uses ZB's FileService primitive as its base class. Worth flagging: if platform Resource has an enriched File model, SmeMartDocument is just metadata extending it.
- `documentType` is enum (contract / insurance / cert / report / etc. — see `document.documentType` enum file).
- Storage / streaming / preview is handled by FileService entirely; this class is the SME-Mart-scoped projection.

---

### Provider catalog (ServiceOffering)

#### ServiceOffering.yml

```yaml
description: "A provider's catalog listing in the SME marketplace"
extends:
  - Object
properties:
  - providerId:
    field: serviceOffering.providerId
  - isActive:
    field: serviceOffering.isActive
  - category:
    field: serviceOffering.category
  - pricingType:
    field: serviceOffering.pricingType
  - price:
    field: serviceOffering.price
  - deliveryTime:
    field: serviceOffering.deliveryTime
  - subcategory:
    field: serviceOffering.subcategory
  - serviceIncludes:
    field: serviceOffering.serviceIncludes
  - serviceRequirements:
    field: serviceOffering.serviceRequirements
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Category":
    jsonata: category
    sort: category
  "Pricing":
    jsonata: pricingType
    sort: pricingType
```

**Notes:**
- **DEFERRED FROM v1.4** per DECISIONS § "ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't" (2026-04-24). Tier structure pending Brian confirmation. Phase 26 ships placeholder values (Free / Growth $99/mo / Enterprise $999/mo) in seeded data only.
- `pricingType` enum (see `serviceOffering.pricingType.yml`): fixed / hourly / tier-based / etc.
- No `engagement` or `project` link — service offerings are catalog entries, not engagement-scoped. Discovered via Browse Providers + filters.
- Strong candidate for a generic "Catalog Listing" platform primitive.

---

### Project planning artifacts (ProjectPrd, PrdSection, ProjectPlan, PlanMilestone)

The PRD + Plan family. PRD captures WHAT needs to be done (sections of requirements). Plan captures HOW/WHEN (timeline + milestones). Both attach to a `SmeMartProject`.

#### ProjectPrd.yml

```yaml
description: "Product Requirements Document — informational layer capturing WHAT needs to be done"
extends:
  - Object
properties:
  - title:
    field: prd.title
  - summary:
    field: prd.summary
  - project:
    linkTo: SmeMartProject.id.prds
  - sections:
    linkTo: PrdSection.id.prd
    multi: true
viewProperties:
  "Title":
    jsonata: title
    sort: title
  "Name":
    jsonata: name
    sort: name
```

#### PrdSection.yml

```yaml
description: "Section within a PRD (overview, objectives, requirements, etc.)"
extends:
  - Object
properties:
  - sectionType:
    field: prdSection.sectionType
  - title:
    field: prdSection.title
  - content:
    field: prdSection.content
  - sortOrder:
    field: prdSection.sortOrder
  - prd:
    linkTo: ProjectPrd.id.sections
viewProperties:
  "Title":
    jsonata: title
    sort: title
  "Type":
    jsonata: sectionType
    sort: sectionType
  "Sort Order":
    jsonata: sortOrder
    sort: sortOrder
```

**Notes (PRD pair):**
- `sectionType` enum (`prd.sectionType.yml`): overview / objectives / requirements / acceptance-criteria / out-of-scope / etc.
- Content is rich text (presumably markdown).
- 1:N — one PRD per project; many sections per PRD.

#### ProjectPlan.yml

```yaml
description: "Project plan — informational layer capturing HOW/WHEN work will be done"
extends:
  - Object
properties:
  - title:
    field: plan.title
  - approach:
    field: plan.approach
  - estimatedDuration:
    field: plan.estimatedDuration
  - teamStructure:
    field: plan.teamStructure
  - project:
    linkTo: SmeMartProject.id.plans
  - milestones:
    linkTo: PlanMilestone.id.plan
    multi: true
viewProperties:
  "Title":
    jsonata: title
    sort: title
  "Duration":
    jsonata: estimatedDuration
  "Name":
    jsonata: name
    sort: name
```

#### PlanMilestone.yml

```yaml
description: "Individual milestone within a project plan"
extends:
  - Object
properties:
  - targetDate:
    field: milestone.targetDate
  - status:
    field: milestone.status
  - sortOrder:
    field: milestone.sortOrder
  - plan:
    linkTo: ProjectPlan.id.milestones
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Target Date":
    jsonata: targetDate
    sort: targetDate
  "Sort Order":
    jsonata: sortOrder
    sort: sortOrder
```

**Notes (Plan pair):**
- 1:N — one Plan per project; many Milestones per plan.
- `milestone.status` enum: planned / in-progress / completed / blocked / etc.
- These are **informational artifacts**, not workflow primitives. They're documents (rich descriptions of approach + dated milestones) that live alongside the Project, not the actual task-bearing surface (that's Boards + Tasks).
- Could absorb into a generic "document" or "structured-content" platform primitive — they're essentially typed sections with sort-order.

---

### Work-type / workflow definitions (SmeMartActivity, SmeMartWorkflow)

These two classes implement Kevin's **Activity** concept (per Invariant 4: Board ≠ Activity). Activity defines work-type behavior; Workflow defines the state machine (statuses + transitions). Tasks reference an Activity, which references a Workflow.

#### SmeMartActivity.yml

```yaml
description: "Work type blueprint defining how tasks behave. Declares workflow, RACI, issue prefix, and custom fields. Reusable across boards."
extends:
  - Object
properties:
  - activityType:
    field: activity.activityType
  - issuePrefix:
    field: activity.issuePrefix
  - estimatedTime:
    field: activity.estimatedTime
  - packageCode:
    field: activity.packageCode
  - taskNameTemplate:
    field: activity.taskNameTemplate
  - workflow:
    linkTo: SmeMartWorkflow.id.activities
  - extendsActivity:
    linkTo: SmeMartActivity.id.extendedBy
  - extendedBy:
    linkTo: SmeMartActivity.id.extendsActivity
    multi: true
  - tasks:
    linkTo: SmeMartTask.id.activity
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Type":
    jsonata: activityType
    sort: activityType
  "Prefix":
    jsonata: issuePrefix
    sort: issuePrefix
```

**Notes:**
- Per Kevin (2026-03-16): Activity is a **work-type blueprint** — defines workflow, RACI, custom fields, transitions. Reusable across boards. The platform `Activity` primitive already exists in `@zerobias-com/platform-sdk` — `SmeMartActivity` mirrors that.
- `extendsActivity` self-link supports activity inheritance / specialization. (E.g., a "bug" activity might extend a base "task" activity, inheriting its workflow but adding bug-specific fields.)
- `issuePrefix` provides task-code namespacing (e.g., `BUG-`, `RFP-`, `BID-`).
- `taskNameTemplate` supports auto-naming new tasks within the activity (e.g., `"{prefix}-{counter}: {summary}"`).
- **For Nic — strong absorption candidate** if platform Activity covers all of these. SmeMartActivity probably should not exist long-term.

#### SmeMartWorkflow.yml

```yaml
description: "Workflow definition with statuses and transitions. Referenced by activities."
extends:
  - Object
properties:
  - packageCode:
    field: workflow.packageCode
  - statuses:
    field: workflow.statuses
  - transitions:
    field: workflow.transitions
  - defaults:
    field: workflow.defaults
  - activities:
    linkTo: SmeMartActivity.id.workflow
    multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Statuses":
    jsonata: statuses
```

**Notes:**
- `statuses`, `transitions`, `defaults` are JSON blob fields — the workflow state machine is data, not separate entities.
- 1:N — one workflow shared across many activities (e.g., a generic "open / in-progress / done" workflow can be referenced by multiple activity types).
- Strong absorption candidate alongside Activity. If platform Workflow exists, SmeMartWorkflow goes away.

---

### What's NOT in the schema repo (Phase 15–16 classes)

Three classes from the 23-class inventory don't have YAMLs in `~/Projects/zb/zerobias-org/schema` as of 2026-04-29:

- `DocumentTemplate` — class id `d2493bf7-f28d-5d26-8858-58062d402012` (Phase 15 — Document Templates)
- `DocumentInstance` — class id `3e1d232f-3105-535e-8ef5-70cb0f80d65f` (Phase 15 — Document Templates)
- `FormSubmission` — class id `179bd4b1-d1b1-5afc-99be-a5465a662ec6` (Phase 16 — Form Builder)

`Pipeline.receive` accepts these on UAT (verified empirically — they were registered via Phase 15/16 schema PRs). The YAMLs may live in a separate schema package, an unmerged feature branch, or were registered out-of-band. **If you find them, please flag back** — we'd like to update this snapshot.

---

## Curated locked DECISIONS (cross-relevant subset)

These are the entries from `.planning/director/DECISIONS.md` most relevant to platform Resource design. The full DECISIONS.md has ~50+ entries; below are the cross-relevant subset.

### 1. Platform-Assigned Class IDs Are Not Deterministic UUID v5

**Date:** 2026-04-29 (codified after errata 023).
**Decision:** Class IDs are platform-assigned at class registration; they are NOT derivable as UUID v5 hashes from class name. Always verify any unfamiliar class ID via `platform.Class.getClass(<id>)`.
**Why:** Two SME Mart consts (`MarketplaceProfileItem`, `EngagementVettingItem`) were originally invented as UUID v5 hashes from class names. Pipeline.receive rejected both with "No such Class" errors. Failures landed in `console.error()` `.catch()` blocks — silent in production for weeks.
**Anti-pattern:** Generating UUID v5 from a string and using it as a class ID const without verifying. Even if the v5 derivation is "obvious" from the class name.

### 2. MarketplaceProfileItem Replace Semantics + Cleanup Residue

**Date:** 2026-04-27 (validated via UAT experiment).
**Decision:** `Pipeline.receive` for `MarketplaceProfileItem` replaces by **`id` only**. Per-section saves are independent — ingesting one MPI record does NOT clobber other MPI records of the same class with different ids.
**Why:** Phase 28 form save needs to write per-field MPI records keyed by `(orgId, section)` without read-modify-write fan-out. Validated via UAT experiment 2026-04-27 (records `mpi-test-a-cd7105df` and `mpi-test-b-cd7105df`).
**How to apply:**
- Save flow: one `Pipeline.receive` batch per save; data array contains one record per dirty form field; each record has a deterministic id `mpi-<orgId>-<section>`.
- Pre-fill flow: one GQL query — `MarketplaceProfileItem(orgId: ".eq.<id>") { section, data }` — group client-side by `section`, project to form model.
- Cleanup: `markDeleted` rides alongside seeded records (Pipeline.receive requires non-empty `data` — can't be delete-only).

### 3. Object.tag Field Shape — Validated via UAT Experiment

**Date:** 2026-04-24.
**Decision:** The `Object.tag` field accepts at Pipeline.receive ingest time in this canonical shape:
```json
"tag": [ { "value": "<hydra-tag-UUID>" } ]
```
- Array of objects (matching `multi: true`).
- Each object has a required `value` property holding the tag UUID.
- Server stores the value literally — no auto-enrichment with tag name/ownerId/type.
- Schema validator accepts `oneOf`: single object OR the array form. Prefer the array form to match `multi: true` semantics.

**Why:** Validator-driven discovery via a throwaway push. Three of four plausible shapes (UUID string, `{id: ...}` ref, full `{id, name, ownerId}` ref) would have been accepted-at-lint but rejected-at-ingest; only `{ value: ... }` was correct.

**Read patterns also validated:**
- **Read-by-id:** `platform.Object.getVersionByObjectIdOrVersionId(<internal-object-uuid>)` returns the full record including `tag` array.
- **Read-by-tag (discovery):** GQL via `graphql.Boundary.boundaryExecuteRawQuery` with structured Input filter — `ClassName(tag: { value: ".eq.<tag-uuid>" }) { ... }`. Filter syntax: `zerobias.*.schemaInput` types accept `.eq.` dot-prefix RFC4515 inside property values.
- **Tags are immutable post-ingest** (Kevin 2026-04-23). Must be set at ingest time via the inherited `Object.tag` field.

### 4. Platform-Provider Distinguisher (Phase 26 Plan 01)

**Date:** 2026-04-28.
**Decision:** **Option B** — MPI `provider_type` section with `data: "platform"` for ZeroBias org records.
**Why option-a was rejected:** Option-a (hydra global tag `marketplace.platform_provider`) requires a new TagType `marketplace` to exist in `hydra.tag_type`. `platform.Tag.suggestTag` rejects unregistered types. Only way to register a new TagType is a PR to `zerobias-com/tag` (`#1` opened 2026-04-27, cycle time unknown — likely Daniel Rojas territory).
**Why option-c was rejected:** Hardcoded `orgId === ZB_ORG_UUID` is env-fragile (UAT and prod ZB org UUIDs differ in non-aligned envs).
**Forward path:** when `zerobias-com/tag#1` merges + publishes, v1.5 can migrate via a one-shot `Pipeline.receive` batch (add `Object.tag`, drop section).

### 5. ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't

**Date:** 2026-04-24.
**Decision:** ServiceOffering tier records are deferred from v1.4 pending Brian's confirmation of the tier structure. Plan 26-02 ships placeholder values (Free / Growth $99/mo / Enterprise $999/mo) in seeded data only.
**Why:** Brian asks come in drips. v1.4 ships data placeholders so the ingest path is tested; tier display / ToS / branding moves to v1.5 (Phase 29).

### 6. Engagement Naming Convention: `<Buyer> <- <Provider>` (ASCII reverse-arrow)

**Date:** 2026-04-23.
See [Invariant 6](#invariant-6--engagement-naming-uses-buyer---provider-reverse-arrow) above.

### 7. Default ZB Engagement is Auto, Invariant, Compliance-Driven

**Date:** 2026-04-23.
**Decision:** Every existing ZeroBias platform Org always has at least one engagement with ZeroBias (3PO=Buyer, ZB=Provider) by default. This is a side-effect of being a ZB platform customer and a ZB compliance requirement. Created automatically via org-detection, NOT via any user UI action.
**How:** (a) one-shot batch backfill for all existing platform orgs; (b) lazy-on-load reconciliation in the auth/routing layer for orgs added after the batch runs. Long-term, ZB platform itself will own this responsibility (likely at platform-onboarding time); SME Mart fills the gap until then.
**For Nic:** if the platform absorbs default-engagement creation, the lazy-on-load guard in SME Mart's auth layer becomes redundant.

### 8. VendorProfileItem: Single Entity with Section Discriminator

**Decision:** `MarketplaceProfileItem` (the schema name) is a single entity with a `(section, data)` discriminator pattern. Every "field" of the company-info convention is its own MPI record. Flat sub-sections (e.g., `primary_contact.email`) instead of JSON-encoded objects.
**Why:** `data` stays a plain string. Adding/renaming sub-fields doesn't require touching JSON parsers across pre-fill, form binding, save. Search/filter by sub-field works without server-side JSON path support.

### 9. Internal vs External Org Membership (Plan 080)

**Decision:** Project members can be internal (party of an Engagement) or external (invited individual). Different entity types; same UI surface.
**For Nic:** if platform Resource has a unified party-membership primitive, SME Mart's plan 080 model is a candidate for absorption.

### 10. Pointer-Based Engagement References

**Decision:** Engagement references throughout SME Mart use `engagementId: UUID` pointers, not embedded sub-objects. Cross-engagement aggregations (CE1 linked engagements) are arrays of pointers.
**For Nic:** consistent with platform `hydra.ResourceLink` patterns; if platform Resource has a typed link primitive, SME Mart will use it.

---

## Hydra tag taxonomy (cross-cutting reference)

Tags are used everywhere in SME Mart — as the default sub-project mechanism, as the aperture, as the demo-data gate, as the engagement discriminator, as the platform-provider distinguisher, and as the canonical opt-in transparency surface for queryable record discovery. This section consolidates everything one needs to know about hydra tags before designing platform Resource entities that interact with them.

### Three different tagging surfaces — DO NOT confuse them

There are three distinct "tag" concepts in the platform, with different APIs, different semantics, and different lifecycles:

| Surface | What it tags | Set when | API | Mutable post-set? |
|---|---|---|---|---|
| **`Object.tag`** (inherited property) | Class-Object records (Pipeline-ingested) — Engagements, MPI records, SmeMartProjects, etc. | At Pipeline.receive ingest time, **per-record** | `platform.Pipeline.receive(.., { data: [{ ..., tag: [{value: "<uuid>"}] }] })` | **NO — immutable post-ingest** (Kevin 2026-04-23) |
| **`hydra.Resource.tagResource`** | Hydra Resources — ZB Tasks, Files, Boundaries, etc. | Any time after creation | `hydra.Resource.tagResource(resourceId, tagId)` (or `store.Resource.tagResource` on prod) | Yes — add/remove freely |
| **`Pipeline.receive(.., tagIds: [...])`** | **NOTHING** — confirmed via experiment | N/A | The `tagIds` parameter at the batch level **does NOT actually tag the ingested Objects.** Semantics still unclear; possibly tags the batch-job record itself but not the resulting Class-Objects. | N/A — don't rely on it |

**For Nic — implication for Resource design:** if platform Resource has a single unified tagging primitive, that's a strict improvement over the current bifurcation. Today an SME Mart developer has to know whether they're tagging a class-Object (Pipeline payload field) or a hydra Resource (separate API call) — and the `tagIds` batch parameter is a footgun that *looks* like it should work but doesn't.

### Object.tag canonical payload shape (locked)

Source: DECISIONS § "Object.tag Field Shape — Validated via UAT Experiment" (2026-04-24).

```json
"tag": [ { "value": "<hydra-tag-UUID>" } ]
```

- **Array of objects** matching `multi: true` on the field definition.
- Each object has a single required `value` property holding the tag's UUID.
- Server stores the value literally — **no auto-enrichment** with tag name/ownerId/type. The client must already know the tag's UUID.
- Schema validator accepts `oneOf`: a single object (`{ value: "..." }`) OR the array form. **Prefer the array form** to match `multi: true` semantics and handle multi-tag cases.
- The field's identity: `propertyId` `65aadece-c352-4d59-8137-6ae03b98506d`, `dataTypeName: "tag"`, `dataTypeType: "object"`, `multi: true`. Inherited on every class.

**Rejected shapes (confirmed via failed experiments):**
- `[{ id: "<uuid>" }]` — schema validation error: `"value is required"`
- `["<uuid>"]` (bare strings) — schema validation error
- `{ id, name, ownerId }` ref objects — schema validation error
- Single object outside an array (when `multi: true`) — works at lint, fails at semantic check

**Anti-pattern:** Guessing the shape from the class description (`multi: true`, `dataTypeName: "tag"`) instead of pushing a test record and letting the validator tell you. Three of four plausible shapes accept-at-lint but reject-at-ingest. Validator-driven discovery via a throwaway push is cheaper than reading the whole dataType schema tree.

### Read patterns (also locked)

- **Read-by-id (single object):** `platform.Object.getVersionByObjectIdOrVersionId(<internal-object-uuid>)` returns the full record including the `tag` array.
- **Read-by-tag (discovery / GQL filter):**
  ```
  ClassName(tag: { value: ".eq.<tag-uuid>" }) { id, ...other-fields }
  ```
  Verified on `SmeMartProject`: returned exactly the tagged record when filtered by its tag UUID; returned empty when filtered by unrelated tags; returned all records when unfiltered. Filter syntax: `zerobias.*.schemaInput` types accept `.eq.` dot-prefix RFC4515 inside property values. Other operators (`.sw.`, `.in.`, `.like.`, etc.) presumably work but are untested.
- **No separate tag-discovery endpoint needed.** The existing GQL path is sufficient.

### TagType registry (the locked enum)

Hydra tags are typed. The TagType is a string discriminator on `hydra.tag_type`. As of 2026-04-29 the **only valid values** (verified empirically by `platform.Tag.suggestTag` rejection error 2026-04-27) are:

```
boundary
client
environment
env-type
framework
module-deployment
other
product-segment
query-folder
region
service-segment
```

**Custom types are NOT allowed at runtime.** Attempting `platform.Tag.suggestTag` with type `marketplace` (or any unlisted value) returns:

```
type 'marketplace' is not valid - {boundary|client|environment|env-type|framework|module-deployment|other|product-segment|query-folder|region|service-segment}
```

**Adding a new TagType requires a PR to `zerobias-com/tag`** — adding a folder for the new type. As of 2026-04-29, the first such PR ever (`zerobias-com/tag#1`, opened 2026-04-27 by Clark to register `marketplace`) is open with unknown cycle time (likely Daniel Rojas territory; could be days-to-weeks).

**This is why the platform-provider distinguisher decision (DECISIONS § Phase 26 Plan 01) chose option-b (MPI section) over option-a (hydra global tag).** SME Mart can't ship a `marketplace.platform_provider` global tag until that PR merges.

**For Nic — implication for Resource design:** if platform Resource has a more flexible tag-type model (or doesn't require a static type registry at all), that removes a real friction point. The current model forces apps to either (a) reuse one of the 11 generic types as a stretch (e.g., `other` for marketplace concerns), or (b) wait on a multi-day PR cycle to add a new type, or (c) work around the type system entirely (e.g., section discriminators inside a class).

### Tag name constraints

- **Domain:** `nmtoken` — characters `A-Z`, `0-9`, `.`, `_`, `-`, `:` (case insensitive)
- **No max length** (practically capped by storage)
- **Slashes (`/`) are NOT allowed** — common gotcha when reaching for filesystem-style namespacing
- Tags ARE allowed to contain dots, which SME Mart uses for hierarchical naming (e.g., `sme-mart.eng.w3geekery-default-zb`)

### Tag scope semantics

A tag's scope determines who can see and apply it:

| Scope | How to set | Visibility |
|---|---|---|
| `user` | Default when `ownerId` is omitted on `createTag` | Owning user only |
| `org` | Pass `ownerId: <orgId>` on `createTag` | All members of that org |
| `system` / `global` | Reserved for platform-level tags | Cross-org; requires the registered TagType to support it |

For SME Mart, almost all tags are **org-scoped** (engagement tags, demo tags, sub-project tags). The aspirational "global platform-provider tag" would be system-scoped — pending the `zerobias-com/tag#1` cycle.

### Creation paths — TWO different APIs

#### `hydra.Tag.createTag` — direct creation (auto-approved)

```ts
hydra.Tag.createTag({
  newTag: {
    name: "sme-mart.eng.w3geekery-default-zb",
    type: "other",                                // must be one of the 11 valid types
    ownerId: "<org-uuid>",                        // org-scoped; omit for user-scoped
    description: "Default ZB engagement for W3Geekery",
  }
})
```

- Returns the tag immediately with its UUID.
- No moderation step. SME Mart's standard creation path.

#### `platform.Tag.suggestTag` — moderated path (creates a ZB Task for admin approval)

- Creates a moderation Task; an admin must approve before the tag becomes real.
- Used for **user-suggested** tags that need human review (e.g., a marketplace customer suggesting a new framework tag).
- Validates the type against the registered TagType registry — this is how SME Mart discovered `marketplace` is unregistered (see § TagType registry above).

**Anti-pattern:** Calling `suggestTag` from a system-level seed script. It creates moderation Tasks unnecessarily and requires admin attention. Use `createTag` for system-driven tag creation; reserve `suggestTag` for user UI flows.

### Read paths

- **`hydra.Tag.searchTags` (POST)** — Partial / prefix matching via `TagSearchBody.name`. Use for all tag queries when you don't know the UUID.
- **`hydra.Tag.getTag` (GET)** — Direct lookup by UUID. Use for cached tag retrieval.
- **`hydra.Tag.listTags` (GET)** — Paginated list. Has a `nameFilter` param (may work in hydra; was historically broken on the older platform Tag service).

**Note:** prod environments may hit `store.Resource.tagResource` instead of `hydra.Resource.tagResource` due to historical service routing. Test against both if writing prod code.

### Resource tagging vs Object tagging — which API for what?

- If you're tagging a **ZB Task**, **File**, **Boundary**, or any other **hydra Resource** — use `hydra.Resource.tagResource(resourceId, tagId)`. Mutable post-set.
- If you're tagging a **class-Object** (anything ingested via Pipeline.receive — `Engagement`, `SmeMartProject`, `MarketplaceProfileItem`, `SmeMartTask`, etc.) — use the per-record `tag` field in the Pipeline.receive payload. Immutable post-ingest.
- If you're using `Pipeline.receive(.., tagIds: [...])` (the batch-level parameter) — **stop**, that doesn't actually tag the ingested objects. Set the per-record `tag` field instead.

### SME Mart tag namespace conventions

SME Mart has settled on a `<scope>.<dimension>.<value>` naming pattern. Examples in active use:

| Tag name | Type | Scope | Purpose |
|---|---|---|---|
| `sme-mart.eng.<engagement-slug>` | `other` | `org` | Engagement discriminator. One per engagement. Used in W3Geekery walkthrough as `sme-mart.eng.w3geekery-default-zb`. |
| `sme-mart.demo` | `other` | `org` (or system) | Phase 24 demo-data visibility gate. Records carrying this tag are hidden from non-admin users. |
| `sme-mart.aperture.<focus-area>` | `other` | `org` (user-customizable) | Workspace aperture (CE13). Brian seed examples: `sme-mart.aperture.encryption`, `sme-mart.aperture.ai`, `sme-mart.aperture.sbom-ssdf`. |
| `sme-mart.subproject.<theme>` | `other` | `org` | Sub-project tag (default mechanism per Brian 2026-04-21). Examples: `sme-mart.subproject.cyber`, `sme-mart.subproject.clinical-compliance`. |
| `marketplace.platform_provider` | (would be) `marketplace` (UNREGISTERED) | `system` | **Aspirational** — the platform-provider distinguisher under option-a. **NOT in use** as of 2026-04-29; blocked on `zerobias-com/tag#1`. |

The `sme-mart.<dimension>.<value>` namespace is a convention, not enforced. The registered `type` on these tags is `other` (since `marketplace` doesn't exist) — the namespace pattern lives in the tag's `name` rather than its `type`.

### Tagging gotchas (worth surfacing)

- **`Pipeline.receive` requires non-empty `data` array** — you can't issue a delete-only batch (cleanup `markDeleted` rides alongside seeded records).
- **Tags are immutable post-ingest on class-Objects.** If you ingested a record without the right tag, you can't `Pipeline.receive` again to "add" the tag — `Pipeline.receive` replaces by `id`, so re-ingesting the same id with a new `tag` array overwrites the prior version. To "add" a tag, you must re-ingest the full record.
- **Reading by tag uses `value`, writing uses `value`** — but the read filter is `tag: { value: ".eq.<uuid>" }` (object-with-RFC4515-string), while the write payload is `tag: [{ value: "<uuid>" }]` (array of objects with literal UUIDs). Easy to confuse.
- **Tag UUIDs differ between environments** — UAT and prod have different UUIDs for "the same" tag. Hardcoding a tag UUID is env-fragile; resolve via `searchTags` + name-by-convention.
- **`platform.Tag.suggestTag` returns enum-rejection errors as plain text** in the response message. Parse with care (this is how Clark discovered the registered TagType list — by reading the rejection message).

### What platform Resource design might consider (for Nic)

Based on the friction points above, here are the question-shaped invitations to think about:

1. **Single tagging API surface** — a Resource primitive that handles both the class-Object case and the hydra Resource case under one API. Would eliminate the `tagIds`-batch-parameter footgun.
2. **Mutable tags on class-Objects** — would the platform support post-ingest tag mutation on Resources? (Trade-off: append-only audit cleanliness vs. operational ergonomics.)
3. **Dynamic TagType registry** — could TagType be data-driven (a hydra TagType class) rather than folder-driven (PRs to `zerobias-com/tag`)? Would unblock per-app tag taxonomies without admin intervention.
4. **Composable tag namespaces** — first-class hierarchical namespaces (e.g., `marketplace.platform_provider` resolves through a `marketplace` ancestry) vs. the current flat-string-with-dots convention.
5. **Tag-scoped permissions** — a tag could carry its own visibility/permission semantics (an evolution of "scope=user/org/system"). Useful for the demo-data gate pattern (`sme-mart.demo` → "non-admin readers don't see records carrying this tag").

---

## Open questions for Nic

These collect the open questions sprinkled across the HTML, the BACKLOG, and recent DECISIONS:

### About platform Project consolidation (Kevin's proposal)

1. **Flavor set** — `{engagement, project, subproject, workspace}`. Any additions or splits planned (e.g., `portfolio` flavor)?
2. **Parent-compatibility matrix** — confirm: `engagement ← none` (root); `project ← engagement`; `subproject ← project`; `workspace ← project | subproject`?
3. **Flavor-specific property validation** — JSON-schema-per-flavor, or per-flavor validators in producers?
4. **Cross-engagement link model** — typed `Project <-> Project` with `link_type` carrying data-plane-access semantics for linked audit projects (CE1)?
5. **Board.parent polymorphism** — confirm the 4-target set `{Org, User, Boundary, Project[any flavor]}`?

### About sub-project link mechanisms (lighter-than-tag wasn't enough)

6. For mechanisms beyond the default tag — `contains`-link (same engagement), `cross-engagement` link, `lateral` (CE10) — what's the canonical platform approach? hydra `link_type`, CE10 extension, or a new platform primitive?

### About platform Board

7. **Is platform Board ready to absorb `SmeMartBoard`?** Specifically: rendering + phases/ranks/transitions + task-code namespace + polymorphic parents.
8. **Does platform Board accept `Workspace` and `Transparency` as parent types?** If not, can they be added?
9. **Does platform Board support tag-filter views on rendered tasks?** (Sub-project / workspace / aperture filters, composable, per Brian's "like epic" UX 2026-04-21.)
10. **Single-task ownership rule** — any platform deviation from Kevin's "every task is owned by exactly one Board" rule?

### About transparency / activity log (CE4 + CE11)

11. **CE4 (Task Entanglement) — backend surface** — does any usable surface exist today, or is it still "design only"? Phase 23 (Transparency Controls UI-SPEC) is the consumer.
12. **CE11 (ActivityLog) — hash-chain implementation** — is the platform planning a Merkle-style append-only log primitive? SME Mart's design assumes one.
13. **Default-private + opt-in transparency** — how do you envision exposing the publish-to-shared (CE6) primitive? A typed link with `link_type=publish_to_transparency`, or a separate API?

### About boundary subset enforcement (CE12)

14. **Middleware-enforced boundary subset** — `engagement ⊇ project ⊇ workspace ⊇ task`. Is this on the platform roadmap, or does each consuming app reimplement it?
15. **Tighten-never-loosen rule** — same question as 14, applied to mutation semantics.

### About absorbing SME Mart entities

16. Of the 23 SME Mart classes, the obvious absorption candidates are `Engagement`, `SmeMartProject`, `SmeMartBoard`, `SmeMartTask` (per Kevin's consolidation), and possibly `SmeMartActivity`, `SmeMartWorkflow` (if platform absorbs Activity). Do you (Nic) have a preferred priority order?
17. The remaining domain-specific classes (`Bid`, `BidResponse`, `ServiceOffering`, `RfpInvitation`, `MarketplaceProfileItem`, `EngagementVettingItem`, `Note`, `NoteFolder`, `SmeMartDocument`, `Review`, `ProjectPrd`, `PrdSection`, `ProjectPlan`, `PlanMilestone`, `DocumentTemplate`, `DocumentInstance`, `FormSubmission`) are SME-Mart-specific marketplace/RFP entities. Are any of them candidates for general platform primitives (e.g., `Note` / `Review` / `Document`)?

---

## Pointers (schema repo, source files, related repos)

### Schema repo

- **Repo (zerobias-org):** `https://github.com/zerobias-org/schema`
- **Local (Clark's machine):** `~/Projects/zb/zerobias-org/schema`
- **W3Geekery fork (for cross-fork PRs):** `~/Projects/w3geekery/zerobias-org-forks/schema` (PRs target `zerobias-org/schema:dev`)
- **SME Mart classes:** `package/w3geekery/smemart/classes/*.yml` (20 files as of 2026-04-29)
- **SME Mart enums:** `package/w3geekery/smemart/enums/*.yml` (13 files)
- **SME Mart fields:** `package/w3geekery/smemart/fields/`

### SME Mart app (Angular 21)

- **Repo:** `https://github.com/zerobias-org/app` (W3Geekery branch: `poc/sme-mart`)
- **Local (W3Geekery fork):** `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/`
- **Class IDs source of truth:** `src/app/core/services/pipeline-write.service.ts` (`SME_MART_CLASS_IDS` map)
- **GQL read service (with the demo-mode gate at line 80):** `src/app/core/services/graphql-read.service.ts`
- **MPI read pattern (single-org):** `src/app/core/services/vendor-profile.service.ts` (`listProfileItems`)
- **Provider seed runbook:** `src/app/core/services/seed-zb-provider.ts` + `seed-zb-provider.spec.ts`

### Director artifacts (this repo)

- **DECISIONS.md (full, ~50+ entries):** `.planning/director/DECISIONS.md`
- **BACKLOG (the CE-numbered items):** `.planning/BACKLOG.md` (CE1–CE14 at lines 103–116)
- **ROADMAP (v1.4 phases):** `.planning/ROADMAP.md`
- **company_info convention (17-section catalog):** `.planning/director/COMPANY-INFO-CONVENTION-DRAFT.md`
- **W3Geekery walkthrough (UAT bootstrap recipe):** `.planning/director/bootstrap-w3geekery-engagement.md`
- **Cross-engagement audit research (originated CE1–CE6):** `.planning/research/external/2026-04-13-ceo-miro-cross-engagement-audit-model.md`
- **Workspace patterns research (originated CE10–CE14):** `.planning/research/internal/2026-04-15-workspace-patterns-for-sme-mart.md`
- **Errata 023 (fictional class IDs lesson):** `.planning/director/errata/023-fictional-class-ids-silent-failures.md`

### Cross-developer knowledge base

- **zb-dx repo (shared dev experience):** `~/Projects/zb/zerobias-org/zb-dx`
- **Slack:** `#zb-dx` (zerobias.org workspace)
- **Friction logs relevant to platform Resource design:** see `~/Projects/zb/zerobias-org/zb-dx/friction-log/` (10+ entries on auth, SDK shape, hub-module env coverage, PKV API, CDN auth)

### Source HTML

- **Path:** `~/Pictures/Screenshots/CLAUDE_transparency-center-entangled-tasks_20260421_153215.html`
- **Two top-level tabs:** Transparency Center (the supply/demand entangled-task diagram) + Full Structure (the Engagement → Project → Workspace → Task tree + Backend Class Model)
- This MD covers the same content + currency updates + deeper context on schemas / decisions / invariants.

---

## Vocabulary quick-reference

| Term | Meaning |
|---|---|
| **Demand side** | Buyer + auditor coalition. All issue REQ tasks. |
| **Supply side** | Supplier (auditee). Runs SAT tasks that satisfy REQs from buyer + linked auditors. |
| **REQ task** | "Requirement" task on the demand side. Pairs to one or more SAT tasks via `twin_of`. |
| **SAT task** | "Satisfaction" task on the supply side. Can satisfy multiple REQs simultaneously (N-party). |
| **twin_of** | The CE4 link type. Pairs a REQ to its SAT. The only link type that legitimately crosses the commercial boundary. |
| **Entanglement** | The N-party generalization of `twin_of`. Pair, trio, quartet, quintet, sextet… (Brian 2026-04-15). |
| **Aperture** | A focus-area tag on a Workspace (e.g., encryption, AI, SBOM, OSCAL). Hydra tag, user-customizable. |
| **Sub-project tag** | Same family as aperture. Thematic grouping on a Workspace/Task (e.g., Cyber, Clinical Compliance). DEFAULT mechanism for sub-project semantics. |
| **CE1** | Linked Engagements. Cross-engagement edge (multi-3PAO pattern). |
| **CE4** | Task Entanglement. THE canonical opt-in transparency seam. |
| **CE10** | Lateral typed Project↔Project relations: `relates_to`, `depends_on`, `blocked_by`, `requires`, `supersedes`, `derives_from`. |
| **CE11** | ActivityLog. Append-only, hash-chained, default-private, opt-in rollup. |
| **CE12** | Boundary subset enforcement. `engagement ⊇ project ⊇ workspace ⊇ task`. Tighten-never-loosen. |
| **CE13** | Workspace. Net-new innermost DATA tier. Crew + aperture + scoped activity log. |
| **CE14** | Portfolio. Net-new wrapper for N projects under one engagement. |
| **`Buyer <- Provider`** | ASCII reverse-arrow naming convention for engagements. Buyer first; arrow indicates supply flow toward buyer. |
| **MPI** | `MarketplaceProfileItem`. The section-discriminated single-entity profile class. Class id `7bcf86a5-91dc-520d-b9bf-e308b1078d46`. |
| **Pipeline.receive** | Platform write API. `platform.Pipeline.receive(pipelineId, { classId, tagIds, data, markDeleted })`. Replace by `id`. |
| **Object.tag** | The inherited tag field on every class. Set ONLY at ingest time. Shape: `[{ value: "<hydra-tag-uuid>" }]`. |
| **Tighten-never-loosen** | Boundary subset rule: each child boundary must be a subset of its parent's. Middleware-enforced. |
| **3PAO** | Third-Party Assessment Organization. Auditor / certifier in compliance contexts. |

---

**End of snapshot.** If something here is wrong or stale by the time you read it, the most current source is `.planning/director/DECISIONS.md` + `.planning/BACKLOG.md` + the `pipeline-write.service.ts` `SME_MART_CLASS_IDS` map. Cross-check there before acting on anything load-bearing.
