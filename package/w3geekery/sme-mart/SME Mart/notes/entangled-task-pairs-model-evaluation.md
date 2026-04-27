# Entangled Task Pairs — Model Evaluation

**Date:** 2026-03-24
**Status:** Decision made — **Option B selected** (two linked tasks + transparency rendering layer)
**Source:** Brian CEO meeting 2026-03-24, Clark architecture discussion
**Related:** Plan 057, Plan 069, Plan 023 (Transparency Center)

---

## Context

Brian described the ZeroBias platform as "one giant engine for generating requirement checklists" — any party states a requirement, the other provides proof of satisfaction. He introduced the term **"Transparency Entangled Task Pairs"** for mirrored tasks on demand and supply sides connected through the transparency center.

This evaluation examines three options for representing entangled requirement/satisfaction flows in the data model and UI.

---

## Option A: Single Task with Multi-Party Fields

```
Task REQ-001 (lives on Shared board)
├── requirement_description: "Implement access control policy" (demand writes)
├── proof: [policy.pdf] (supply writes)
├── verification: VERIFIED (assessor writes)
└── RACI controls who edits which fields
```

**Pros:**
- Simplest. Lowest task count.
- One source of truth — no sync issues.
- Easiest to query ("show me all requirements and their status").

**Cons:**
- Both parties editing the same task creates contention. Who "owns" the status? If supply marks it done but demand hasn't verified, what state is it in?
- Visibility problem — demand might have internal notes about WHY they need this that they don't want supply to see. Same for supply's internal prep work.
- RACI per-field is complex to implement and confusing in UI.
- Doesn't match Brian's "entangled pairs" language — this is a single entity, not a pair.

**Verdict:** Too simple. Breaks down under real multi-party workflows.

---

## Option B: Two Linked Tasks (Requirement ↔ Satisfaction) ← SELECTED

```
Demand Board                                    Supply Board
┌─────────────────────┐                        ┌─────────────────────┐
│ REQ-001             │   demands_requirement  │ SAT-001             │
│ "Access control     │◆━━━━━━━━━━━━━━━━━━━━━━◆│ "Access control     │
│  policy required"   │   satisfies_requirement│  policy v2.1"       │
│                     │                        │ [policy.pdf]        │
│ Status: VERIFIED    │                        │ Status: DELIVERED   │
│ Assigned: Buyer PM  │                        │ Assigned: Vendor SE │
│ Private notes: ...  │                        │ Private notes: ...  │
└─────────────────────┘                        └─────────────────────┘
                    │                              │
                    └──────────┬───────────────────┘
                               ▼
                    Transparency View (rendered from link)
                    ┌─────────────────────────────┐
                    │ Entangled Pair: REQ↔SAT     │
                    │ Requirement: Access control  │
                    │ Evidence: policy.pdf ✓       │
                    │ Demand verified: ✓ 2026-03-20│
                    │ Hash: 0x3f2a...             │
                    └─────────────────────────────┘
```

**Pros:**
- Each party owns their task independently — no contention.
- Private notes/prep work stays on their board, invisible to other party.
- The LINK is the transparency record (gets the cryptographic hash).
- Transparency view is a **rendered perspective** on the link, not a third task.
- Assessors see the transparency view (read-only on both sides).
- Aligns with Brian's "entangled PAIRS" language — two things, not three.
- Not every task needs entanglement — regular work items stay simple.

**Cons:**
- Two tasks per requirement = higher task count (but each is simpler).
- Need new link types (`demands_requirement` ↔ `satisfies_requirement`).
- Auto-creation of the supply-side task when demand creates a requirement needs workflow logic.

**Verdict:** Best balance of clarity, separation of concerns, and alignment with Brian's vision. The transparency center is a VIEW, not an artifact.

---

## Option C: Three Tasks (Demand / Transparent / Supply)

```
Demand Board          Shared Board              Supply Board
┌──────────┐         ┌──────────────┐          ┌──────────┐
│ REQ-001  │────────→│ TRANS-001    │←─────────│ SAT-001  │
│ (demand) │         │ (transparent)│          │ (supply) │
└──────────┘         └──────────────┘          └──────────┘
```

**Pros:**
- Explicit transparent artifact that assessors own.
- Each perspective has its own task with its own RACI.
- Maximum flexibility.

**Cons:**
- Triple task count — management overhead scales badly.
- The "transparent" task is redundant if the link itself carries the shared state.
- When does the transparent task diverge from the other two? Who resolves conflicts?
- Three tasks for every requirement is hard to explain to users.
- No clear owner of the transparent task — it's a mirror, not independent work.

**Verdict:** Over-engineered. The transparency view in Option B serves the same purpose without a third artifact.

---

## Decision: Option B

Selected 2026-03-24 by Clark after architecture discussion.

### Key Design Points

**1. The link IS the transparency record.**
A `demands_requirement` ↔ `satisfies_requirement` resource link type captures when entanglement was created, when evidence was attached, when verification occurred. The cryptographic hash (future) goes on link events.

**2. Not every task needs entanglement.**
Three categories of tasks in a project:

| Type | Where | Entangled? | Example |
|------|-------|-----------|---------|
| **Requirement** | Demand board | Yes — creates supply pair | "Need SOC2 access control evidence" |
| **Deliverable** | Supply board | Maybe — may satisfy a requirement | "Deliver gap assessment report" |
| **Work item** | Either board | No | "Set up staging environment" |
| **Shared milestone** | Shared board | No | "Phase 1 sign-off gate" |

**3. Transparency view is a UI component, not a data structure.**
Reads both tasks via the link and renders them side-by-side. Assessors/auditors get read access. No third task to maintain.

**4. Requirement flow:**

```
1. Compliance framework or buyer defines requirement
   └── Requirement task created on Demand Board
       ├── Tagged: sme-mart.requirement, sme-mart.compliance.soc2.CC6.1
       ├── Activity: "Requirement" (workflow: open → acknowledged → evidence_requested → verified)
       └── Status: OPEN

2. Entangled satisfaction task auto-created on Supply Board
   ├── Linked: satisfies_requirement ↔ demands_requirement
   ├── Activity: "Satisfaction" (workflow: assigned → in_progress → delivered → accepted)
   └── Status: ASSIGNED

3. Supply attaches evidence (file, screenshot, attestation)
   └── Satisfaction task → DELIVERED

4. Demand reviews evidence
   ├── Requirement task → VERIFIED (or REJECTED with notes)
   └── Link event logged (transparency record)

5. Assessor/auditor sees Transparency View
   └── REQ-001 ↔ SAT-001: Verified ✓, Evidence: policy.pdf, Hash: 0x3f2a...
```

**5. New link types needed:**

| Link | From | To | Semantics |
|------|------|----|-----------|
| `demands_requirement` | Requirement task | Satisfaction task | "This requirement demands this satisfaction" |
| `satisfies_requirement` | Satisfaction task | Requirement task | Reverse of above |

These would be ZB platform resource link types (like `child_of`/`parent_to`). Need Kevin to create them, or model as `SmeMartTask` links in GQL schema.

---

## Impact on Plans

| Plan | Impact |
|------|--------|
| **057** (Project Bloom) | Board model gains entangled pair support. New activities: "Requirement", "Satisfaction". |
| **069** (Compliance Linkage) | Requirement tasks link to framework controls AND to satisfaction tasks. Compliance matrix shows pairs. |
| **023** (Transparency Center) | Transparency view renders entangled pairs from links. Not a separate board. |
| **071** (new) | Entangled Task Pairs — the full system: auto-creation, link types, transparency rendering, crypto hash. |
| **058** (Saved Views) | Add "Entangled Pairs" as a default saved view — shows all requirement/satisfaction pairs across boards. |

---

## Open Questions

1. **Auto-creation trigger:** When demand creates a requirement task, does the supply-side satisfaction task auto-create? Or does supply manually "accept" the requirement first?
2. **Bidirectional requirements:** Brian said requirements are bidirectional — supply can also require things from demand. Same model, just reversed roles on the link.
3. **Partial satisfaction:** Can one satisfaction task address multiple requirements? (One evidence document satisfies SOC2 CC6.1 AND CC6.3.) If so, many-to-many links needed.
4. **Boundary auto-satisfaction:** Kevin's "promise keeping" concept — if the boundary already has evidence for a control, can it auto-create AND auto-verify the satisfaction task?
5. **Link type creation:** Do we ask Kevin for platform-level link types, or define our own in GQL schema?
