# Questions for Brian — Miro Board Reconciliation

**Date:** 2026-04-06
**Context:** Comparing Brian's Miro board (https://miro.com/app/board/uXjVGm64Grw/) with the SME Mart engagement architecture model
**Reference:** HTML diagram at `~/.agent/diagrams/sme-mart-engagement-architecture.html`
**Clark's Miro board:** https://miro.com/app/board/uXjVGm52yII=/ (contains system hierarchy + engagement architecture diagrams)

---

## Where We Align

These concepts map directly between Brian's Miro and our architecture:

| Brian's Miro | Our Model | Notes |
|---|---|---|
| "Demand Twin Boundary Requirements Tasks" | BUYER partition (`board.partition = BUYER`) | Demand-side requirements board |
| "Supply Boundary Multi Protocol Auth Gateway Tasks" | PROVIDER partition (`board.partition = PROVIDER`) | Supply-side deliverables board |
| "ProjectTransparency Center" table | SHARED partition (`board.partition = SHARED`) | The intersection — only explicit submits |
| "Transparency Publisher" tables | Entangled Task Pairs (Plan 071) | Publication mechanism = the link IS the record |
| Auditee Project Board (Kanban) | Buyer's task view | Demand-side UI |
| Auditor Project Board (Kanban) | AUDIT partition (`board.partition = AUDIT`) | 3rd party assessor view |

---

## Questions

### 1. "Twin Boundary" — Mirror or Shared?

Your Demand table is called "Demand **Twin** Boundary Requirements Tasks." Does "twin" mean:

- **(A)** Each party gets their own **mirrored copy** of the boundary (two separate boundary instances, one per side)?
- **(B)** Both parties share **one boundary** but see different partitioned views of it?

Our model assumes (B) — one boundary, partitioned views via `board.partition`. If you're thinking (A), that changes the data model significantly. Which is it?

### 2. "Multi Protocol Authorization Gateway" — What's the Scope?

The Supply table name includes "Multi Protocol Authorization Gateway." The tasks mention MCP Access, agent-to-agent auth, Google/Apple/Facebook SSO, Magic Link, biometric.

- Is this the **boundary-level auth layer** — how parties authenticate into their boundary-scoped view?
- Or is this a **platform-wide auth feature** that applies beyond SME Mart / Readiness Center?
- How does this relate to the existing ZeroBias IDP and session management? Additive or replacement?

### 3. Duplicate Boundary Diagrams — Template or Two Instances?

You have two copies of each boundary diagram (Infra, Apps, Policies, Legal, License) at different x-positions. Are these:

- **(A)** Templates awaiting customization per engagement/project?
- **(B)** Representing the demand-side and supply-side each getting their own boundary infrastructure instance?
- **(C)** Before/after or current/proposed comparison?

### 4. Boundary Component Types vs. Readiness Dimensions

**RESOLVED (2026-04-07 Slack):** Brian clarified these are **boundary component types** — things *inside* a boundary (policies, requirements, parties, assets), NOT types of boundaries. The list is growing:
- Current: Infra, Apps, Policies, Legal/MSA Reqs, License Reqs, Standards Reqs, Technical Reqs
- Coming: Agreements, People/Parties, Assets by type
- TBD: Chargeback/commerce models for paid consumption

These are a **separate taxonomy** from readiness dimensions (Legal, Financial, Cyber, Clinical, Functional). Boundary component types = what the scope contains. Readiness dimensions = what subtasks measure.

### 4a. Chargeback / Commerce — Where Does It Live?

Brian raised (2026-04-07): paid consumption models (e.g., "licensing qty 10 at $1/license/month") need a home. Options:
- **(A)** Boundary component — chargeback requirements scoped to a boundary
- **(B)** Project-level requirements — commerce terms per project
- **(C)** Engagement-level — pricing/billing terms on the corp-to-corp agreement
- **(D)** Both project and engagement — umbrella terms at engagement, specific pricing at project

Brian says TBD. This needs a decision before implementing financials (Backlog #068).

### 5. Where Does Readiness Center End and SME Mart Begin?

The board covers both Dan's Readiness Center and SME Mart. From our analysis:

- **Readiness Center territory:** Boundary infrastructure diagrams, policies, compliance assessments (auditee preparing for audit)
- **SME Mart territory:** Engagement lifecycle, RFP→Bid→Project flow, supply/demand marketplace, task management

But the Transparency Center spans both — an auditee in the Readiness Center submitting evidence to an auditor uses the same publish/subscribe mechanism as a provider in SME Mart submitting deliverables to a buyer.

- Is the Transparency Center a **shared platform capability** that both apps consume?
- Or does each app implement its own version?
- Who owns the Transparency Center codebase — platform team (Kevin), Readiness Center (Dan), or SME Mart?

### 6. Kanban Prototypes — Shared UI Component?

The Auditee and Auditor Kanban boards are structurally identical (3 columns, color-coded cards, priority indicators, category tags, avatars). This maps to our `SmeMartBoard` + `SmeMartTask` entities.

- Should this Kanban board component be a **shared/reusable UI** that both Readiness Center and SME Mart consume?
- Or separate implementations per app?
- The `board.partition` enum already supports both use cases (BUYER/PROVIDER for SME Mart, AUDIT for assessors). Does the Kanban UI need to visually differentiate which partition the user is viewing?

---

## Suggestions for the Miro Board

### A. Add the Transparency Center to the Spatial Center

Right now the Transparency Publisher tables sit alongside the other tables. Visually placing the Transparency Center **between** the Auditee and Auditor Kanban boards would immediately communicate the intersection concept — each side pushes evidence inward, the center only shows what's been explicitly submitted.

```
┌──────────────┐    ┌─────────────────────┐    ┌──────────────┐
│  Auditee     │───▶│  Transparency       │◀───│  Auditor     │
│  Board       │    │  Center             │    │  Board       │
│  (Demand)    │    │  (explicit submits)  │    │  (Audit)     │
└──────────────┘    └─────────────────────┘    └──────────────┘
```

### B. Label Boundary Component Diagrams by Party

If the duplicate boundary diagrams represent demand vs. supply sides, label them explicitly:
- "Boundary Infra — **Demand Side**" / "Boundary Infra — **Supply Side**"
- This makes the twin boundary concept visible
- Clarify these are **component types within** a boundary (per Brian's 2026-04-07 feedback)

### C. Add a "Visibility Rules" Section

A small card or frame on the board stating the core rules would prevent misinterpretation:
1. Each party sees ONLY their partition + SHARED
2. SHARED shows ONLY explicitly submitted items
3. Any party can create demands (not just buyer/auditor)
4. N parties supported (not limited to 2)

### D. Show the Readiness Dimensions as Subtask Categories

The task tables already contain auth/security/compliance tasks — mapping those to the 5 readiness dimensions (Legal, Financial, Cyber, Clinical, Functional) as column headers or tags would connect the tasks to the rollup model:

```
SubTask readiness (per dimension)
    ↓ roll up
Task readiness (aggregated)
    ↓ roll up  
Board-level score
    ↓ roll up
Project-level dashboard
```

### E. Separate Platform vs. App Concerns

Consider adding a visual divider or color-coding that distinguishes:
- **Platform layer** (Kevin's team): Boundary management, task/board infrastructure, auth gateway
- **Readiness Center** (Dan): Auditee preparation, compliance assessment workflows
- **SME Mart** (Clark): Marketplace, engagements, RFP→Bid→Project flow

This would help all three teams understand scope boundaries and avoid stepping on each other.

---

## References

- **HTML diagram:** `~/.agent/diagrams/sme-mart-engagement-architecture.html`
- **System hierarchy:** `~/.agent/diagrams/sme-mart-system-hierarchy.html`
- **Schema enums:** `zerobias-org/schema/package/w3geekery/smemart/enums/board.partition.yml`
- **Plan 023:** Transparency Center (3-view architecture) — archived
- **Plan 071:** Entangled Task Pairs — backlog, deferred to platform
- **Plan 078:** Transparency Controls UI Spec — backlog
- **CEO Notes:** 5 readiness dimensions (Legal, Financial, Cyber, Clinical, Functional)
- **Backlog:** `.planning/BACKLOG.md` — deferred platform items #057–#074
