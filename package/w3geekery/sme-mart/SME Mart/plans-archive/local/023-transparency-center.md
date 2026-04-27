# Plan 023: Transparency Center (3-View Architecture)

**Status:** Design — entangled task pair model selected, transparency rendering layer defined
**Phase:** 5+ (post-current engagements work)
**Depends on:** Plan 022 (Engagement/Project UI), Plan 057 (boards/activities), Plan 071 (entangled task pairs)
**Source:** Brian (CEO) directives 2026-02-06, 2026-02-25, 2026-03-20, 2026-03-24
**Updated:** 2026-03-24 — integrated entangled task pair decision (Option B), cryptographic hash concept

---

## Purpose

The Transparency Center is the core trust mechanism for SME Mart engagements. It provides visibility into requirements, satisfaction/evidence, compliance, financial, functional, and legal adherence — surfaced through **transparency entangled task pairs** (Plan 071).

## Key Architecture Decision (2026-03-24)

The Transparency Center is a **rendering layer**, not a separate data store. It reads entangled task pairs (requirement ↔ satisfaction) via their resource links and renders them as a unified view. There is no "third task" or separate transparency artifact — the link IS the transparency record.

See: [Entangled Task Pairs Model Evaluation](../../notes/entangled-task-pairs-model-evaluation.md)

## Three Perspectives (At Every Level)

| Perspective | Owner | What It Shows | Data Source |
|-------------|-------|--------------|-------------|
| **Demand side (Buyer)** | Buyer | Requirements defined — what they demand. Private annotations. | Requirement tasks on Demand Board |
| **Supply side (Provider)** | Provider | How they satisfy requirements. Evidence, prep work. Private. | Satisfaction tasks on Supply Board |
| **Transparency (Shared)** | Both parties + assessors/auditors | Entangled pairs: requirement ↔ satisfaction, evidence, verification status. | Links between demand + supply tasks |

## How Entangled Pairs Power Transparency

```
Demand Board                 Transparency View              Supply Board
┌──────────────┐            ┌───────────────────┐          ┌──────────────┐
│ REQ-001      │  demands   │ Pair: REQ↔SAT     │ satisfies│ SAT-001      │
│ "Access      │───────────→│ Status: VERIFIED  │←─────────│ "Policy v2.1 │
│  control"    │            │ Evidence: ✓       │          │  delivered"  │
│              │            │ Hash: 0x3f2a...   │          │ [policy.pdf] │
│ Private:     │            │                   │          │ Private:     │
│ "Why we need │            │ Assessor view:    │          │ "Used NIST   │
│  this..."    │            │ Independent proof │          │  template"   │
└──────────────┘            └───────────────────┘          └──────────────┘
```

- **Demand view** shows only requirement tasks with their status
- **Supply view** shows only satisfaction tasks with their evidence
- **Transparency view** shows the PAIRS — both sides together, linked, with verification status
- Each party's private annotations stay invisible to the other
- Assessors/auditors see the transparency view (read-only)

## Four Transparency Dimensions

Each entangled pair belongs to a dimension:

| Dimension | Examples |
|-----------|---------|
| **Financial ($)** | Charges per pricing model, payment status, budget burn, invoices |
| **Compliance** | Regulatory adherence, standard satisfaction, audit status |
| **Functional** | Deliverable status, quality metrics, acceptance criteria satisfaction |
| **Legal** | Contractual adherence, legal requirements satisfied, NDA compliance |

## Aggregation Model

```
Entangled Task Pair: individual requirement ↔ satisfaction
    ↓ roll up by dimension
Board-level: % of requirements satisfied per board
    ↓ roll up
Project-level: transparency dashboard with 4 dimensions × 3 perspectives
    ↓ roll up
Engagement-level: cross-project transparency summary on dashboard (Plan 066)
```

## Transparency View Components

### Entangled Pairs List

Primary view — shows all requirement/satisfaction pairs in a project:

```
Compliance Requirements                              Status    Evidence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQ-001 ↔ SAT-001  Access Control Policy              VERIFIED  [2 docs]
REQ-002 ↔ SAT-002  Encryption at Rest                 DELIVERED [1 doc]
REQ-003 ↔ SAT-003  Incident Response Plan             IN PROGRESS  —
REQ-004 ↔ —        Penetration Test Report             OPEN      —
                                                    ───────────
                                        Compliance: 50% verified (2/4)
```

Filters: by dimension, status, framework control, assignee, board.

### Transparency Dashboard

Project-level dashboard with 4 dimension cards:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Financial   │  │  Compliance  │  │  Functional  │  │    Legal     │
│    78%       │  │    45%       │  │    62%       │  │    90%       │
│  ████████░░  │  │  █████░░░░░  │  │  ██████░░░░  │  │  █████████░  │
│  7/9 verified│  │  5/11 verif. │  │  8/13 verif. │  │  9/10 verif. │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Assessor View

Read-only mode for third-party assessors/auditors:
- See all entangled pairs across all dimensions
- Evidence documents accessible (read-only)
- Verification trail visible
- Future: cryptographic hash verification indicator

## Cryptographic Hashing (Future — Brian 2026-03-24)

Brian confirmed that transparency audit records will be cryptographically hashed — "immutable, so they are a fully immutable audit trail." Clark drew the blockchain analogy. Key points:

- Hash covers: requirement definition, evidence attachment, verification event
- Append-only: can add new events, can never erase previous ones
- Each party retains: shared memory (transparency) + private memory (proprietary)
- Implementation: likely hash chain on link events, stored alongside the link

This is a future phase — blocked on platform support for hash verification.

## Data Model

### Previous (Neon tables) — DEPRECATED

The original `transparency_requirements` and `transparency_disclosures` Neon tables are superseded by the entangled task pair model. Requirements ARE tasks on the demand board. Disclosures/satisfactions ARE tasks on the supply board. The link between them IS the transparency record.

### Current (Entangled Task Pairs via Plan 071)

- **Requirement tasks** — on demand board, tagged by dimension + compliance control
- **Satisfaction tasks** — on supply board, evidence attached
- **Links** — `demands_requirement` ↔ `satisfies_requirement` resource link types
- **Verification** — status field on requirement task (open → verified)
- **Memory** — shared (link events) + private (task-level notes per party)

No separate transparency tables needed.

## Integration with Other Plans

| Plan | Integration |
|------|------------|
| **057** (Project Bloom) | Boards gain Requirement + Satisfaction activities |
| **069** (Compliance Linkage) | Requirements tagged with framework controls; compliance matrix shows entangled pairs |
| **071** (Entangled Pairs) | Core mechanism — transparency center renders these pairs |
| **066** (Dashboard) | Transparency rollup widget on engagement dashboard |
| **073** (Agentic Memory) | Session data captured per task, shared/private retention |

## Effort Estimate

| Component | Hours | Notes |
|-----------|-------|-------|
| Entangled pairs list view | 4-6 | Renders linked pairs with status/evidence |
| Transparency dashboard (4 dimensions) | 4-6 | Rollup cards + drill-down |
| Assessor read-only mode | 2-3 | Permission-gated view |
| Aggregation service | 3-4 | Roll up pairs → board → project → engagement |
| **Total** | **13-19** | Depends on Plan 071 completion |

## Open Questions

1. How does NDA-gating work? Boundary visibility rules + additional NDA-specific logic?
2. Are requirement templates reusable across engagements?
3. What's the minimum viable transparency? Just pairs list + dimension rollup?
4. 3rd-party assessor access — separate role or observer membership on project?
5. Cryptographic hash implementation — platform primitive or SME Mart layer?
6. How do financial transparency pairs relate to the billing/invoicing system (Plan 068)?

---

*Session: `claude --resume poc/sme-mart`*
