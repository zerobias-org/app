# Plan 063: Corporate Vetting Flow

**Status:** Ready to implement
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Updated:** 2026-03-26
**Depends on:** Plan 022 (done), Plan 075 (done)
**Source:** Brian CEO directive 2026-03-06 — Engagement-level corporate vetting requirements
**Analysis:** [engagement-vetting-requirements-analysis.md](../../notes/engagement-vetting-requirements-analysis.md)

---

## Purpose

Build the Corporate Vetting tab under Engagement — a structured checklist for managing org-to-org compliance requirements that must be satisfied before (or during) project work. Bidirectional: buyer and provider each have requirements of the other.

## Architecture Decision: Standalone Entity

~~Plan 057 "Engagement Setup" board~~ — DEFERRED (platform Project App). Cannot use SmeMartTask/SmeMartBoard.

**Decision: New `EngagementVettingItem` GQL entity** via Pipeline+GQL (same pattern as all other SME Mart entities). This gives us:
- Structured, queryable data (filter by engagement, status, direction)
- Independent of platform board/task system
- Document linking via `documentIds` array → existing `SmeMartDocument`
- Clean migration path: if/when platform tasks land, vetting items can become tasks

## Data Model

### Schema YAML (`EngagementVettingItem.yml`)

```yaml
EngagementVettingItem:
  properties:
    engagementId:
      type: string
    category:
      type: string        # always | conditional | nice_to_have
    vettingType:
      type: string        # corporate_identity | insurance | compliance | financial | legal | reference | certification
    evidenceType:
      type: string        # document | form | certification | attestation | reference
    status:
      type: string        # not_started | submitted | under_review | verified | rejected | expired | waived
    direction:
      type: string        # buyer_requires | provider_requires
    conditionTrigger:
      type: string        # null for "always", description for conditional (e.g., "Healthcare / PHI")
    documentIds:
      type: string        # JSON array of SmeMartDocument IDs (GQL doesn't support arrays natively)
    submittedAt:
      type: string
    verifiedAt:
      type: string
    verifiedBy:
      type: string        # ZB user ID
    expiresAt:
      type: string        # for time-limited items (insurance COI, financials)
    rejectionReason:
      type: string
    waivedReason:
      type: string
    notes:
      type: string
```

### TypeScript Model (`vetting-item.model.ts`)

```typescript
export type VettingCategory = 'always' | 'conditional' | 'nice_to_have';
export type VettingType = 'corporate_identity' | 'insurance' | 'compliance' | 'financial' |
                          'legal' | 'reference' | 'certification' | 'documentation';
export type VettingStatus = 'not_started' | 'submitted' | 'under_review' | 'verified' |
                            'rejected' | 'expired' | 'waived';
export type EvidenceType = 'document' | 'form' | 'certification' | 'attestation' | 'reference';
export type VettingDirection = 'buyer_requires' | 'provider_requires';

export interface EngagementVettingItem {
  id: string;
  engagement_id: string;
  name: string;
  description: string | null;
  category: VettingCategory;
  vetting_type: VettingType;
  evidence_type: EvidenceType;
  status: VettingStatus;
  direction: VettingDirection;
  condition_trigger: string | null;
  document_ids: string[];           // parsed from JSON string
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  waived_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

## Default Vetting Templates

When a new engagement is created, seed the vetting checklist with Brian's 6 "always required" items + additional items based on the engagement's industry/value. Templates live in a constant (no DB query needed):

```typescript
const DEFAULT_VETTING_ITEMS: Omit<EngagementVettingItem, 'id' | 'engagement_id' | 'created_at' | 'updated_at' | ...>[] = [
  { name: 'D&B Rating',                   category: 'always', vetting_type: 'financial',           evidence_type: 'document',    direction: 'buyer_requires' },
  { name: 'MSA (Master Service Agreement)',category: 'always', vetting_type: 'legal',              evidence_type: 'document',    direction: 'buyer_requires' },
  { name: 'Banking Information',           category: 'always', vetting_type: 'financial',           evidence_type: 'document',    direction: 'buyer_requires' },
  { name: 'Officer Background Checks',    category: 'always', vetting_type: 'compliance',          evidence_type: 'certification', direction: 'buyer_requires' },
  { name: 'Corporate Entity Verification',category: 'always', vetting_type: 'corporate_identity',  evidence_type: 'document',    direction: 'buyer_requires' },
  { name: 'Financial Statements',         category: 'always', vetting_type: 'financial',           evidence_type: 'document',    direction: 'buyer_requires' },
];
```

## UI Design

### New Tab: Vetting (`/my/engagements/:engId/vetting`)

8th tab in the engagement detail nav bar. Only visible on active engagements (not RFPs).

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Corporate Vetting                    [+ Add Item]      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Requirements for Provider        4/6 verified          │
│  ──────────────────────────────────────────────          │
│  ● D&B Rating               VERIFIED    Score: 85  [▼]  │
│  ● MSA                      VERIFIED    2026-01-15 [▼]  │
│  ● Banking Information       SUBMITTED              [▼]  │
│  ○ Officer Background Checks NOT STARTED             [▼]  │
│  ● Corp Entity Verification  VERIFIED    LLC         [▼]  │
│  ○ Financial Statements      NOT STARTED             [▼]  │
│                                                         │
│  Requirements from Provider       0/0                   │
│  ──────────────────────────────────────────────          │
│  (No requirements added)          [+ Add Requirement]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Expanded Item (click chevron)

```
│  ● D&B Rating               VERIFIED    Score: 85  [▲]  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Description: Dun & Bradstreet financial health  │    │
│  │  Evidence: Document upload                       │    │
│  │  Status: [Dropdown: not_started → ... → verified]│    │
│  │  Verified by: Kevin (2026-01-10)                 │    │
│  │  Expires: 2027-01-10                             │    │
│  │                                                  │    │
│  │  Documents:                                      │    │
│  │  📄 dnb-report-2026.pdf  [View] [Remove]        │    │
│  │  [+ Attach Document]                             │    │
│  │                                                  │    │
│  │  Notes: Annual renewal needed by Jan 2027        │    │
│  │  [Save] [Delete Item]                            │    │
│  └─────────────────────────────────────────────────┘    │
```

#### Components

| Component | File | Purpose |
|-----------|------|---------|
| `VettingTabComponent` | `pages/engagements/tabs/vetting-tab.component.ts` | Tab container, loads items, groups by direction |
| `VettingChecklistComponent` | `shared/components/vetting-checklist/vetting-checklist.component.ts` | Renders grouped checklist with progress bar |
| `VettingItemRowComponent` | `shared/components/vetting-item-row/vetting-item-row.component.ts` | Single row with expand/collapse, status chip, actions |
| `VettingItemDialogComponent` | `shared/components/vetting-item-dialog/vetting-item-dialog.component.ts` | Add/edit dialog (mat-dialog) |

## Implementation Phases

### Phase 1: Schema + Service Layer (~1.5 hrs)

1. **Schema YAML** — `EngagementVettingItem.yml` in `zerobias-org-forks/schema` → PR to `zerobias-org/schema:dev`
2. **Model** — `src/app/core/models/vetting-item.model.ts` (types + default templates)
3. **GQL types** — `src/app/core/gql-types/vetting-item.types.ts`
4. **Field mappings** — Add to `src/app/core/field-mappings.ts`
5. **Service** — `src/app/core/services/vetting.service.ts`
   - `initializeVetting(engagementId)` — seed default items
   - `listVettingItems(engagementId)` — GQL query grouped by direction
   - `updateVettingItem(id, changes)` — status transitions, notes, docs
   - `addVettingItem(engagementId, data)` — custom item (buyer or provider)
   - `deleteVettingItem(id)` — soft delete
   - `getVettingSummary(engagementId)` — counts by status (for tab badge)

**Note:** Schema PR will take ~15 min to propagate after merge. Service can be built optimistically (pipeline writes work immediately, GQL reads work after propagation).

### Phase 2: UI Components (~2.5 hrs)

1. **VettingTabComponent** — container, calls `initializeVetting` on first visit (lazy seed), groups items by `direction`
2. **VettingChecklistComponent** — mat-expansion-panel list with progress bar, section headers ("Requirements for Provider" / "Requirements from Provider")
3. **VettingItemRowComponent** — status chip (`zb-resource-status`), name, date, expand/collapse with inline edit form
4. **VettingItemDialogComponent** — mat-dialog for adding new items (name, category, type, direction, description)
5. **Route** — add `vetting` to `ENGAGEMENT_TAB_ROUTES` (8th tab, after `notes`)
6. **Document attachment** — reuse `OrgDocumentService.shareDocument()` for linking docs to items, show attached docs with [View] button

### Phase 3: Polish + Tests (~1.5 hrs)

1. **Status transitions** — enforce valid transitions (not_started → submitted → under_review → verified/rejected)
2. **Expiration warning** — highlight items expiring within 30 days
3. **Tab badge** — show count of unverified required items on the vetting tab
4. **Unit tests** — VettingService CRUD, default template seeding, status transitions
5. **Demo data** — seed vetting items for existing demo engagements

## Effort Estimate

**Total: 5-6 hours** across 3 phases

| Phase | Hours | Blocked? |
|-------|-------|----------|
| 1. Schema + Service | 1.5 | Schema PR needed (can build service first) |
| 2. UI Components | 2.5 | After schema propagates |
| 3. Polish + Tests | 1.5 | No |

## Open Questions (for Brian)

1. Are "always required" items truly universal, or configurable per org/engagement type?
2. Who can waive a requirement — only buyer admin, or engagement owner?
3. Should the vetting gate block project activation, or just show a warning?

---

*Session: `claude --resume poc/sme-mart`*
