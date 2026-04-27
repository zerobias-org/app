# Plan 071: Transparency Entangled Task Pairs

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 057 (boards/activities/workflows), Plan 069 (compliance linkage)
**Source:** Brian CEO meeting 2026-03-24 — "Transparency Entangled Task Pairs"
**Decision doc:** [`.claude/notes/entangled-task-pairs-model-evaluation.md`](../../notes/entangled-task-pairs-model-evaluation.md)

---

## Purpose

Implement the entangled task pair system: when one party creates a requirement, a linked satisfaction task is auto-created for the other party. The transparency center renders these pairs as a unified view. Cryptographic hashing (future) makes the audit trail immutable.

## Decision

**Option B selected** — two linked tasks (requirement ↔ satisfaction) with a transparency rendering layer. See evaluation doc for full analysis of 3 options.

## Data Model

### New Activities

| Activity | Board | Workflow | Issue Prefix |
|----------|-------|----------|-------------|
| Requirement | Demand board | `open → acknowledged → evidence_requested → verified` (or `rejected`) | REQ- |
| Satisfaction | Supply board | `assigned → in_progress → delivered → accepted` (or `revision_needed`) | SAT- |

### New Link Types

| Link | From → To | Semantics |
|------|-----------|-----------|
| `demands_requirement` | Requirement → Satisfaction | "This requirement demands this satisfaction" |
| `satisfies_requirement` | Satisfaction → Requirement | Reverse |

Implementation: Either ZB platform resource link types (ask Kevin) or `SmeMartTask` GQL links in our schema. Platform link types are preferred for cross-system interop.

### Entanglement Auto-Creation

When a requirement task is created on the demand board:
1. System auto-creates a satisfaction task on the supply board
2. Links the pair with `demands_requirement` ↔ `satisfies_requirement`
3. Satisfaction task inherits: title, description, compliance tags, due date
4. Satisfaction task gets: supply-side assignment, "Satisfaction" activity, initial status `assigned`

### Bidirectional

Requirements are bidirectional — supply can also create requirements of demand (e.g., "Provide tech lead contact", "Grant API access"). Same model, reversed roles. The "demand board" and "supply board" labels are relative to who's making the requirement, not fixed.

### Partial Satisfaction (Many-to-Many)

One satisfaction task can address multiple requirements (e.g., a single policy document satisfies SOC2 CC6.1 AND CC6.3). Links are many-to-many. The compliance matrix shows which requirements share satisfaction tasks.

## UI Components

### Entangled Pair Card

Renders a requirement + satisfaction as a single visual unit:

```
┌─────────────────────────────────────────────────┐
│ REQ-001 ↔ SAT-001          Status: VERIFIED ✓  │
│─────────────────────────────────────────────────│
│ Demand: "Access control policy"    │ Supply: "Policy v2.1 delivered" │
│ Owner: Jane (Buyer PM)            │ Owner: Bob (Vendor SE)          │
│ Framework: SOC2 CC6.1             │ Evidence: [policy.pdf]          │
│ Requested: 2026-03-01             │ Delivered: 2026-03-15           │
│                                   │ Verified: 2026-03-20            │
└─────────────────────────────────────────────────┘
```

### Transparency View

A dedicated view (tab or panel) showing all entangled pairs in a project:
- Filter by: status (open/verified/rejected), framework, board, assignee
- Sort by: date, status, framework control
- Assessor/auditor read-only mode
- Future: cryptographic hash verification indicator

### Requirement Creation Flow

1. User clicks "Add Requirement" on demand board (or bulk-import from compliance framework)
2. Fills requirement details + optional compliance tag
3. System creates requirement task + auto-creates entangled satisfaction task
4. Supply-side user is notified
5. Both tasks appear on their respective boards; pair appears in transparency view

## Phases

### Phase 1: Link types + activities (2-3 hrs)
- Define `demands_requirement` / `satisfies_requirement` link types
- Add "Requirement" and "Satisfaction" activities to demo data
- Add workflows for both

### Phase 2: Auto-creation logic (3-4 hrs)
- Service method: `createRequirement()` → creates demand task + supply task + link
- Handle bidirectional (supply can also create requirements)
- Event emission for notifications

### Phase 3: Entangled Pair UI (4-6 hrs)
- `EntangledPairCardComponent` — renders linked pair
- `TransparencyViewComponent` — list/filter all pairs in a project
- Integration with existing board views (show entanglement indicator on board tasks)

### Phase 4: Compliance integration (3-4 hrs)
- Bulk requirement import from compliance framework controls
- Compliance matrix shows pairs
- Connect to Plan 069 compliance linkage

### Phase 5: Cryptographic hashing (future — blocked on platform)
- Hash link events for immutable audit trail
- Verification UI
- Blockchain-style append-only log

## Effort Estimate

| Phase | Hours | Notes |
|-------|-------|-------|
| 1 — Link types + activities | 2-3 | Schema + demo data |
| 2 — Auto-creation logic | 3-4 | Service + notifications |
| 3 — Entangled Pair UI | 4-6 | Card, transparency view, board indicators |
| 4 — Compliance integration | 3-4 | Framework import, matrix |
| **Total (Phases 1-4)** | **12-17** | Phase 5 deferred |

## Open Questions

1. Auto-create supply task immediately, or require supply-side "acceptance" first?
2. Platform link types (ask Kevin) vs GQL schema links?
3. Many-to-many: can one requirement have multiple satisfaction tasks from different suppliers?
4. Boundary auto-satisfaction: if boundary already has evidence, auto-verify?
5. How does this interact with the 24/7 task handoff scenario (Plan 072)?

---

*Session: `claude --resume poc/sme-mart`*
