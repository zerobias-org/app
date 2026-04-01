# Phase 11: Vetting Pre-Fill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 11-vetting-pre-fill
**Areas discussed:** Section-to-VettingType mapping, Suggestion panel placement & UX, Expired item handling, Pointer lifecycle & staleness

---

## Section-to-VettingType Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Exact matches only | Only suggest where SectionType === VettingType (4 matches). No fuzzy mapping. | ✓ |
| Configurable mapping table | Define SECTION_TO_VETTING_MAP constant (attestation → compliance, etc.) | |
| Suggest all regardless | Show all profile items for any vetting item. Maximum flexibility, noisier. | |

**User's choice:** Exact matches only
**Notes:** 4 direct matches: corporate_identity, insurance, reference, financial. Simple and predictable.

---

## Suggestion Panel Placement & UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline per vetting item | Each row gets "Suggested from Profile" chip, expands mini-panel below | ✓ |
| Sidebar suggestion panel | Collapsible sidebar listing all profile items grouped by section | |
| Modal picker per item | Dialog opens showing matching profile items when vendor clicks action | |

**User's choice:** Inline per vetting item
**Notes:** Minimal UI change, contextual presentation.

### Follow-up: Post-Attach Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Status chip + pointer indicator | "Linked to Profile" chip next to status. Click shows details. Status independent. | ✓ |
| Auto-advance to 'submitted' | Attaching auto-moves status. Profile item IS the evidence. | |
| Replace evidence with pointer | Evidence section shows linked item inline. | |

**User's choice:** Status chip + pointer indicator

### Follow-up: Cardinality

| Option | Description | Selected |
|--------|-------------|----------|
| One profile item per vetting item | 1:1 pointer. Single profile_item_id field. | ✓ |
| Multiple per vetting item | Array of profile_item_ids. More complex. | |

**User's choice:** One per vetting item (1:1)

---

## Expired Item Handling in Suggestions

| Option | Description | Selected |
|--------|-------------|----------|
| Show with warning, still attachable | EXPIRED chip + warning text. Vendor CAN still attach. | ✓ |
| Hide expired, show 'update needed' | Expired hidden. Prompt to update profile. | |
| Show but block attachment | Greyed out, Attach disabled. | |

**User's choice:** Show with warning, still attachable

### Follow-up: Auto-Generate Checklist

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, checklist prompt | Visual card on vetting tab. Auto-dismisses when profile item updated. | ✓ |
| Just warning chip | EXPIRED chip sufficient. No separate checklist. | |
| Generate ZB Task | Platform task for renewal. Heavier-weight. | |

**User's choice:** Yes, auto-generate checklist prompt

---

## Pointer Lifecycle & Staleness

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-reflect, no indicator | Pointer = live data. No "updated" badge needed. | ✓ |
| 'Source updated' indicator | Badge when profile data changes after attachment. | |
| Snapshot + diff | Store snapshot, show diff on change. | |

**User's choice:** Auto-reflect, no indicator

### Follow-up: Deleted Profile Items

| Option | Description | Selected |
|--------|-------------|----------|
| Block deletion if referenced | Prevent deleting profile items used in engagements. Show count. | ✓ |
| Show 'source removed' warning | Dangling reference with warning. Vendor can detach. | |
| Auto-detach silently | Clear profile_item_id automatically. | |

**User's choice:** Block deletion if referenced
**Notes:** This touches Phase 10's delete flow — vendor-profile-tab.component.ts delete handler needs reference count check.

---

## Claude's Discretion

- Suggestion mini-panel positioning
- Chip styling, icon choices
- "Linked to Profile" chip click behavior
- Checklist card styling and dismiss animation
- Reference count query implementation
- Loading states for suggestion panel
- Profile item preload vs lazy-load strategy

## Deferred Ideas

- Auto-advance vetting status on attach
- Snapshot-on-attach with diff tracking
- Fuzzy mapping table for non-overlapping types
- ZB Task generation for expired renewal
- Multi-attachment (multiple profile items per vetting item)
