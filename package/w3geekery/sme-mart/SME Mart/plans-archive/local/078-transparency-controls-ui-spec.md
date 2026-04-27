# Plan 078: Transparency Controls UI Spec

**Status:** Planning (spec only — implementation deferred until platform Task/Board lands)
**Created:** 2026-03-27
**Depends on:** Plan 071 (Entangled Task Pairs), Plan 057 (Board/Activity/Workflow)
**Source:** Brian CEO 2026-03-27 — "each task on each side will have a portion of Transparency Controls section that publishes to the transparency entangling bridge"

---

## Purpose

Design the "Transparency Controls" section that appears on every task in an entangled pair. This section controls what data flows across the transparency bridge between buyer and provider tasks. Each side independently decides what to share; the bridge renders the combined view.

## Core Concept

```
┌── Buyer Task (Demand Board) ──────────────┐     ┌── Provider Task (Supply Board) ──────────┐
│                                            │     │                                          │
│  Task: "Access Control Policy Required"    │     │  Task: "Access Control Policy Delivery"   │
│  Status: Evidence Requested                │     │  Status: In Progress                      │
│  Assignee: Jane (Buyer PM)                 │     │  Assignee: Bob (Vendor SE)                │
│  Internal Notes: "Critical for SOC2..."    │     │  Internal Notes: "Using template v3..."   │
│                                            │     │                                          │
│  ┌─ TRANSPARENCY CONTROLS ──────────────┐  │     │  ┌─ TRANSPARENCY CONTROLS ──────────────┐│
│  │                                      │  │     │  │                                      ││
│  │  📡 Publishing to Bridge:            │  │     │  │  📡 Publishing to Bridge:            ││
│  │  ☑ Status updates                   │  │     │  │  ☑ Status updates                   ││
│  │  ☑ Due date                         │  │     │  │  ☑ Due date                         ││
│  │  ☑ Compliance framework ref         │  │     │  │  ☑ Deliverable attachments          ││
│  │  ☐ Internal notes (PRIVATE)         │  │     │  │  ☐ Internal notes (PRIVATE)         ││
│  │  ☐ Assignee details                 │  │     │  │  ☑ Assignee name                    ││
│  │  ☑ Verification status              │  │     │  │  ☑ Effort estimate                  ││
│  │                                      │  │     │  │                                      ││
│  │  📥 Receiving from Bridge:           │  │     │  │  📥 Receiving from Bridge:           ││
│  │  ✓ Provider status: In Progress     │  │     │  │  ✓ Buyer status: Evidence Requested ││
│  │  ✓ Provider assignee: Bob           │  │     │  │  ✓ Due date: 2026-04-15             ││
│  │  ✓ Effort est: 3 days              │  │     │  │  ✓ Framework: SOC2 CC6.1            ││
│  │                                      │  │     │  │                                      ││
│  └──────────────────────────────────────┘  │     │  └──────────────────────────────────────┘│
└────────────────────────────────────────────┘     └──────────────────────────────────────────┘
                            │                                          │
                            └──────────────┬───────────────────────────┘
                                           ▼
                            ┌─ TRANSPARENCY BRIDGE ────────────────┐
                            │                                      │
                            │  REQ-001 ↔ SAT-001                   │
                            │  Combined view of shared fields      │
                            │  Audit trail of all bridge events    │
                            │  Hash verification (future)          │
                            │                                      │
                            └──────────────────────────────────────┘
```

## Transparency Controls Section

### Location
Bottom section of every task card/detail view (below description, above comments). Only visible on tasks that are part of an entangled pair.

### Data Fields Controllable per Task

Each field has a toggle: **publish** (share to bridge) or **private** (keep internal).

| Field | Default (Demand) | Default (Supply) | Notes |
|-------|-----------------|------------------|-------|
| **Status** | ☑ publish | ☑ publish | Always recommended — core transparency signal |
| **Due date** | ☑ publish | ☑ publish | Alignment on timeline |
| **Assignee name** | ☐ private | ☑ publish | Supply often shares; demand may keep PM private |
| **Compliance framework ref** | ☑ publish | ☑ publish | Which control this addresses |
| **Deliverables / attachments** | ☐ private | ☑ publish | Supply shares evidence; demand may attach internal docs |
| **Effort estimate** | ☐ private | ☑ publish | Supply shares; demand rarely relevant |
| **Internal notes** | ☐ private | ☐ private | NEVER shared by default — opt-in only |
| **Verification status** | ☑ publish | n/a | Only demand verifies |
| **Priority** | ☑ publish | ☐ private | Demand signals urgency |
| **Custom fields** | ☐ private | ☐ private | Per-field toggle if custom fields exist |

### Publishing Section UI

```
┌─ Publishing to Bridge ──────────────────────────────────┐
│                                                         │
│  Share these fields with [Provider / Buyer]:             │
│                                                         │
│  ☑ Status updates          ☑ Due date                  │
│  ☑ Compliance reference    ☐ Internal notes             │
│  ☑ Verification status     ☐ Assignee details           │
│  ☑ Priority                ☐ Effort estimate            │
│                                                         │
│  [Reset to Defaults]                                    │
└─────────────────────────────────────────────────────────┘
```

- Toggle checkboxes (mat-checkbox grid)
- "Reset to Defaults" link restores role-based defaults
- Changes are fire-and-forget (pipeline push, optimistic)
- Visual indicator on task card when any field is shared (📡 icon)

### Receiving Section UI

```
┌─ From [Provider / Buyer] ───────────────────────────────┐
│                                                         │
│  Status:     In Progress        (updated 2h ago)        │
│  Assignee:   Bob (Vendor SE)                            │
│  Effort:     3 days estimated                           │
│  Due date:   2026-04-15                                 │
│                                                         │
│  No deliverables shared yet.                            │
│                                                         │
│  [View in Transparency Center →]                        │
└─────────────────────────────────────────────────────────┘
```

- Read-only display of fields the other party has chosen to share
- Relative timestamps ("2h ago", "yesterday")
- Link to the full Transparency Center view
- Empty state when other party hasn't shared anything yet

## Data Model

### New: TransparencyConfig (per-task)

Stored as a JSON blob on each entangled task (no separate schema entity needed).

```typescript
interface TransparencyConfig {
  /** Which fields this task publishes to the bridge */
  publishing: {
    status: boolean;
    dueDate: boolean;
    assigneeName: boolean;
    complianceRef: boolean;
    deliverables: boolean;
    effortEstimate: boolean;
    internalNotes: boolean;  // false by default — opt-in only
    verificationStatus: boolean;
    priority: boolean;
  };
  /** Timestamp of last config change */
  updatedAt: string;
}
```

**Storage options:**
1. **SmeMartTask `transparencyConfig` scalar field** — JSON string stored in the task's GQL data. Simplest, no schema entity needed.
2. **Separate entity** — `TransparencyBridgeConfig` entity per task. More queryable but more complex.

**Recommendation:** Option 1 (JSON scalar on SmeMartTask). The config is task-local, rarely queried independently, and changes infrequently.

### Schema Changes Needed

```yaml
# SmeMartTask.yml — add:
- transparencyConfig:
    field: task.transparencyConfig
    # JSON string: { publishing: { status: true, ... }, updatedAt: "..." }

# SmeMartTask field definition:
# task.transparencyConfig.yml
description: 'JSON transparency publishing controls for entangled task pairs'
displayName: 'Transparency Config'
type: string
```

### Bridge Event Log (future — Plan 071 Phase 5)

For audit trail, each bridge publish event is logged:

```typescript
interface TransparencyBridgeEvent {
  id: string;
  requirementTaskId: string;
  satisfactionTaskId: string;
  sourceTaskId: string;       // which task published
  field: string;              // e.g., 'status', 'deliverables'
  value: unknown;             // the shared value
  timestamp: string;
  hash?: string;              // cryptographic hash (future)
}
```

This is Phase 5 (crypto hashing) territory — defer for now.

## Component Architecture

### TransparencyControlsComponent

```
File: shared/components/transparency-controls/transparency-controls.component.ts

@Input() taskId: string
@Input() entangledTaskId: string     // the linked task on the other side
@Input() role: 'demand' | 'supply'   // determines default config
@Input() config: TransparencyConfig  // current publishing config
@Output() configChanged: EventEmitter<TransparencyConfig>
```

**Sections:**
1. **Publishing toggles** — checkbox grid, fire-and-forget save
2. **Received data** — read-only display of other party's shared fields
3. **Bridge link** — "View in Transparency Center"

### TransparencyBadgeComponent

Small indicator on task cards showing transparency status:

```
File: shared/components/transparency-badge/transparency-badge.component.ts

@Input() publishingCount: number   // how many fields are being shared
@Input() receivingCount: number    // how many fields received from other side
```

Renders as: `📡 3 shared · 2 received` (compact pill on task card header)

### Integration Points

| Existing Component | Change Needed |
|-------------------|---------------|
| `TaskCard` | Add `<app-transparency-controls>` section (after description, before comments). Only show when task has `entangledTaskId`. |
| `TaskListPanel` | Add `<app-transparency-badge>` to task card headers for entangled tasks. |
| `EngagementDetail` (Transparency tab — future Plan 023) | Full transparency center view showing all entangled pairs. |

## Defaults by Role

| Field | Demand (buyer) creates requirement | Supply (provider) creates requirement |
|-------|-----------------------------------|--------------------------------------|
| status | publish | publish |
| dueDate | publish | publish |
| assigneeName | private | publish |
| complianceRef | publish | publish |
| deliverables | private | publish |
| effortEstimate | private | publish |
| internalNotes | private | private |
| verificationStatus | publish | n/a |
| priority | publish | private |

When a user creates a requirement and the entangled pair is auto-created, both tasks get default configs based on role. Users can change anytime.

## Implementation Phases (when unblocked)

### Phase A: Config model + storage (~2 hrs)
- Add `transparencyConfig` field to SmeMartTask schema
- TransparencyConfig TypeScript interface
- Default config factory by role
- Save/load from pipeline + GQL

### Phase B: Controls UI (~3 hrs)
- TransparencyControlsComponent (publishing toggles + receiving display)
- TransparencyBadgeComponent (compact indicator)
- Wire into TaskCard (conditional on entanglement)

### Phase C: Bridge data flow (~3 hrs)
- When config changes, push updated shared fields to the other task's "received" data
- Real-time or near-real-time bridge sync (polling or WebSocket if available)
- Handle field visibility changes (un-sharing a field removes it from the other side)

### Phase D: Transparency Center view (~4 hrs)
- Full page/tab showing all entangled pairs
- Filter/sort by status, framework, assignee
- Audit trail (who shared what, when)

**Total: ~12 hrs (when unblocked by platform Task/Board)**

## Pending Schema Changes (for batch PR)

Add to `pending-schema-changes.md`:

```yaml
# SmeMartTask.yml — add scalar field:
- transparencyConfig:
    field: task.transparencyConfig

# New field definition file:
# fields/task.transparencyConfig.yml
description: 'JSON transparency publishing controls for entangled task pairs'
displayName: 'Transparency Config'
type: string
```

## Open Questions

1. **Real-time sync:** When Party A changes a shared field value, how quickly does Party B see it? Pipeline propagation (~seconds) or do we need WebSocket push?
2. **Granularity:** Should deliverable sharing be per-file or all-or-nothing?
3. **Audit requirements:** Does the bridge event log need to be immutable from day 1, or can we add crypto hashing later?
4. **Multi-party:** If an assessor/auditor has read-only access, do they see ALL shared fields from both sides, or only what each party explicitly shares with them?
5. **Template configs:** Should there be org-level default transparency configs (e.g., "our org always shares status + due date")?

---

*Session: `claude --resume poc/sme-mart`*
