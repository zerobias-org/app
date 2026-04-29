# Slack Huddle — Project Hierarchy Q&A

**Date:** 2026-04-20
**Time:** 1:40 PM – 2:04 PM PT (~24 min)
**Source:** Slack Huddle
**Participants:** Brian Hierholzer (CEO, ZeroBias), Clark Stacer (w3geekery contractor)
**Context:** Walkthrough of [`brian-meeting-questions.md`](../plans/brian-meeting-questions.md). Covers all of **Section A (Hierarchy model)** and grazes **Section B (ZeroBias as a provider)**. Sections C–F deferred.

---

## Headline

Engagement/Project/Workspace "Portfolios" are **UI views, not data entities**. Sub-project collaboration with third parties is modeled as a **linked project** (new concept) rather than a nested sub-project tier. Linked projects carry **data-scoping implications** (boundary-governed reads/writes into the primary project). ZeroBias itself is a platform tenant via a default `zerobias-platform` project per customer — "we are dog-fooding; we have no choice."

---

## Answers to Questions Doc

### A1. Workspace Portfolio — UI view ✓
> "Those are just sorters where I've got a list of engagements… it's just literally a list." — Brian

**Decision:** UI view only. No `WorkspacePortfolio` schema class.

### A2. Task Portfolio — likely UI, implementation TBD
Brian did not name "Task Portfolio" specifically in the huddle. By analogy to his Portfolio framing ("sorters" / "directory" / "organizational cataloguing"), it's likely UI-only.

**Possible implementations (TBD):**
- **Platform `Board` entity** — if Nic's Board work covers it, we'd surface tasks through that construct rather than build our own
- **Saved search / view** over tasks, filtered by tag, custom field, or other metadata
- **Pure UI grouping** (e.g., Kanban by status, backlog view) — no persistence

**Provisional decision:** no dedicated `TaskPortfolio` schema class. Revisit once Nic's Board scope is clear and we know whether tasks need tag/custom-field indexing. Verify with Brian + Nic in next meeting.

### A3. Engagement Portfolio — nav only ✓
> "It is more of an organisational cataloguing of things… it's a directory, right?" — Brian

**Decision:** nav only. Consistent with 2026-04-15.

### A4. Sub-Project placement — **Linked Project** (new concept)
Brian rejected "nested sub-project as a new tier." Instead:

- A sub-project **is a project in its own right** between two parties (its own engagement context)
- It is **linked into** a primary project via a linkage attribute
- The linkage is a **data-driven permission set** — linked projects can read/write data governed by the primary project's boundaries
- Workspaces live **inside** each project (primary or linked), giving the full hierarchy: `Engagement > Project > (Linked Project)* > Workspace > Task`

> "Instead of a subproject being the method of linking… it's a linked project… that allows that subproject to kind of be an isolated, cleaner project/subproject/workspace hierarchy." — Brian

**Decision:** Project has an optional **link-to-primary-project** attribute. Not every project is linked. Links have **types** (some carry data permissions, some don't).

### A5. Multi-3PAO scenario — **CONFIRMED** ✓
> "That shouldn't that primary project is between a buyer and a seller, but I have secondary… where I'm the buyer and I'm not engaging with my seller relative to this project, but I have a subproject within this primary project which is me and another engagement party." — Brian

Real-world example given: **HIS → Goshen** primary project, with **ArmorStack** (another engaged party) and **ZeroBias** both linked in via their own projects. "This is real shit" — these constructs already exist informally; the app needs to represent them.

### A6. Transparency depth — **as deep as it needs to go**
> "It could be at any level between any interface between orgs and projects." — Clark (confirmed by Brian)

**Decision:** Transparency partition can exist at any tier (engagement, project, linked-project, workspace). CE11/CE12 needs to support arbitrary-depth partitioning — no fixed inheritance rule. Link type determines whether transparency crosses a project link.

---

## New Concept Introduced — Link Types

Projects can link to other projects via **typed links**. Types vary:
- Some carry **data permissions** (inherited boundary access into the primary project)
- Some are **purely structural** (navigation/visibility without data scope)
- Some carry **transparency intersections** between linked projects

**Schema implication:** `ProjectLink` entity (or `Project.linkedToPrimaryProjectId` + `ProjectLinkType` lookup). Need to be able to express "ArmorStack's project is linked into HIS↔Goshen primary with data-read scope on Boundary X."

---

## B1–B4 — ZeroBias as Provider (partial)

Brian deferred pricing/features/billing specifics but established the architecture:

- **ZeroBias is the ultimate seller.** Every customer has an engagement with ZB.
- **Every customer gets a default project** — `project-zerobias-platform` — where ZB is seller, customer is buyer
- Platform delivery (tickets, support, licensing, MSA, banking) flows through **that** default project
- The current ZB signup flow will eventually be **replaced** by SME Mart's engagement flow ("everyone comes in the front door"). For now, create profiles manually ("come in the back door").
- **Pricing/tiers/guild licensing:** Brian will send data later; keep placeholders for MVP. **Do not block on pricing.**
- **Legal/banking placeholders:** add fields (MSA, Dun & Bradstreet, banking info, licensing) but leave as stubs.

**Clark's plan (accepted):** build real profiles for Goshen, Work Worlds, HIS, ArmorStack, and ZeroBias using known info; back them into multi-engagement scenarios that already exist in reality.

---

## Real-World Seed Data

Brian identified the **actual** relationships to model (as of today):

| Party | Role | Location | Type |
|---|---|---|---|
| ZeroBias | Platform / seller-of-last-resort | — | Platform |
| HIS (Health Information Solutions) | Compliance consultancy | Austin, TX | Consultancy |
| Goshen | Hospital (ZB's customer via HIS) | Indiana | Healthcare provider |
| ArmorStack | Systems integrator / IT consultancy | Minneapolis, MN | SI |

**Engagements that already exist (informally):**
- ZB ↔ HIS
- ZB ↔ Goshen
- ZB ↔ ArmorStack
- HIS ↔ Goshen (primary project: medical compliance)
- HIS ↔ ArmorStack (linked into HIS↔Goshen project)
- (likely) ArmorStack ↔ Goshen

**Clark's deliverable:** seed these as real demo data, not fake orgs.

---

## Key Decisions

1. **No new schema entities** for Workspace Portfolio, Task Portfolio, Engagement Portfolio — they are UI views/directories.
2. **Sub-project model = Linked Project** — a self-contained project linked into a primary project via typed link. Rejects nested sub-project tier.
3. **Link types** are a first-class concept — some data-bearing, some not.
4. **Transparency can exist at any tier**, not bound to a fixed depth.
5. **ZB-as-platform-tenant is a hard architectural invariant** — every customer gets a `zerobias-platform` default project.
6. **Seed data uses real parties** (HIS, Goshen, ArmorStack, ZeroBias) — not fictional orgs.
7. **Pricing/guild/legal** are not blocking; use stubs for MVP.

---

## Action Items

| # | Owner | Action | Priority | Context |
|---|---|---|---|---|
| 1 | Clark | Update SME Mart schema: keep Portfolios as UI only | High | A1/A2/A3 confirmed — no `WorkspacePortfolio`/`TaskPortfolio`/`EngagementPortfolio` classes |
| 2 | Clark | Add `ProjectLink` concept (or linked-project attribute + link-type lookup) to Project schema | High | A4 decision — replaces nested sub-project tier |
| 3 | Clark | Model `LinkType` with at least two flavors: data-bearing and structural-only | High | Enables boundary-governed data flow across linked projects |
| 4 | Clark | Seed demo data with HIS / Goshen / ArmorStack / ZeroBias + their real engagements | High | Replaces fake demo orgs |
| 5 | Clark | Add stub fields on Engagement: MSA, banking, D&B, licensing, credit-card-trap placeholder | Medium | Non-blocking — stubs only for MVP |
| 6 | Clark | Once deploy unblocks, expose engagement-edit + profile-edit screens; lock down under-construction areas | Medium | Lets the real parties start using it with ZB creds |
| 7 | Brian | Send pricing/packaging/guild/licensing spec data | — | Will define B1–C3 when ready; not blocking |
| 8 | Brian | Share HIS / Goshen / ArmorStack company details (EIN, banks, addresses) | — | For seed data in action #4 |
| 9 | Clark | Confirm Task Portfolio implementation path (Board entity vs. saved search vs. UI-only) with Brian + Nic | Low | A2 inferred; may overlap with Nic's Board work — don't build a TaskPortfolio class preemptively |

---

## Still Open (deferred to future meetings)

- **C1–C3** — Guild tier derivation rules (Brian will send data)
- **D1–D2** — Legal doc URLs, brand assets (placeholders for now)
- **E1–E4** — Onboarding UX specifics (auto-create vs. opt-in engagement confirmation, returning-user incomplete-profile flow, default project naming string)
- **F1–F3** — Ownership of ZB company profile, URL permanence, test orgs

---

## Key Quotes

> "So we are, we, so Where I'm hoping to get — SME Mart comes into the platform core. We are the ultimate seller here. Every one of our customers is… we have an engagement with every customer. Bottom line." — Brian

> "We are dog-fooding our solution. We have no choice." — Brian

> "It's a project between parties that was assigned into another primary project… so that way it's a subproject, but it is still its own project construct between two parties that have an engagement." — Brian (defining Linked Project)

> "That linked project will have data implications because they are going to have the ability or require data from the boundaries in the primary project security constructs." — Brian (on link-as-permission-set)

> "These things literally exist. I'm not kidding — ArmorStack, HIS, ZeroBias, Goshen — all these constructs, if you can get it there, we can literally start putting parties in these different areas." — Brian (on real seed data)
