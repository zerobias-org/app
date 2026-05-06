# Pending Schema Changes (batch for next PR)

## Immediate (needed for current bugs/features)

### 1. SmeMartProject — add `engagementId` scalar
- **Why:** `engagement` link field is not queryable as GQL scalar. Projects tab under Engagement is empty.
- **Add:** `engagementId` string property + field definition `project.engagementId.yml`
- **Impact:** `listProjectsByEngagement` can filter server-side

### 2. SmeMartProject — add `projectType` field (Plan 077)
- **Why:** Pilot Projects need type distinction: `rfp | pilot | project`
- **Add:** `projectType` string property + field definition + `project.projectType` enum
- **Impact:** Pilot lifecycle, filtering by type

### 3. SmeMartProject — `ownerId` ✅ already exists

### 4. Note — `content` ✅ already exists in schema

---

## Near-term (Plan 078 — Transparency Controls)

### 5. SmeMartTask — add `transparencyConfig` scalar
- **Why:** Per-task publish/private controls for entangled transparency bridge
- **Add:** `transparencyConfig` string property (JSON) + field definition `task.transparencyConfig.yml`
- **Value:** `{ publishing: { status: true, dueDate: true, ... }, updatedAt: "..." }`

---

## Future (not needed yet, spec-phase discovery)

### Plan 055 — Advanced Pricing (Bid entity changes)
- `bid.pricingModel` — string (fixed/hourly/milestone/nrc-arc)
- `bid.nrcAmount` — string (one-time non-recurring cost)
- `bid.arcAmount` — string (annual recurring cost)
- `bid.milestonePayments` — string (JSON array of {name, amount, dueDate})
- `bid.bidValidUntil` — string (ISO date — bid expiration)
- **SmeMartProject:** `evaluationMatrix` — string (JSON weighted scoring criteria)
- **Possible new entity:** `BidLineItem` for itemized pricing rows

### Plan 056 — Engagement Roles (Engagement entity changes)
- `engagement.facilitatorUserId` — string (third-party consultant managing RFP)
- `engagement.communicationMode` — string (direct/mediated)
- **OR** extend EngagementVettingItem to cover NDA tracking (already has status workflow, direction, document linking)
- **Possible new entity:** `EngagementNda` (per-vendor NDA tracking with status, access log, destruction attestation)

### Plan 065 — Message Center (NEW entity)
- **SmeMartMessage** class:
  - `content` — string (markdown)
  - `authorId` — string (ZB user ID)
  - `projectId` — string (optional, null = engagement-level)
  - `engagementId` — string
  - `threadId` — string (self-referencing for reply threading)
  - `visibility` — string (buyer_only/provider_only/all)
  - `priority` — string (normal/important/urgent)
  - `pinned` — string (boolean-as-string, GQL quirk)
- **Links:** `engagement` → Engagement, `project` → SmeMartProject, `thread` → SmeMartMessage (parent)
- ~12 field definitions

### Plan 066 — Dashboard
- **No schema changes** — dashboard config stored in user preferences (localStorage/PKV)

---

## Summary

| Priority | Changes | Field Defs | New Entities |
|----------|---------|-----------|-------------|
| **Immediate** | 2 scalars on SmeMartProject | 2 | 0 |
| **Near-term** | 1 scalar on SmeMartTask | 1 | 0 |
| **Future (055)** | 5 on Bid, 1 on SmeMartProject | 6 | 0-1 |
| **Future (056)** | 2 on Engagement | 2 | 0-1 |
| **Future (065)** | New SmeMartMessage class | ~12 | 1 |

**Next batch PR:** Items 1-2 (immediate). Item 5 optional if we want to future-proof.

*Run dataloader before commit.*
