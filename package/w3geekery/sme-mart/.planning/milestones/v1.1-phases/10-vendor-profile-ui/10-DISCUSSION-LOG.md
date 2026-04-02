# Phase 10: Vendor Profile UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 10-vendor-profile-ui
**Areas discussed:** Section layout & grouping, Add/Edit form approach, Expiration visual treatment, Empty state & onboarding

---

## Section Layout & Grouping

### Q1: How should the 6 profile sections be displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Accordion panels | MatExpansionModule panels, one per section. Matches vetting tab pattern. | ✓ |
| Card grid per section | Section header with cards below. More like documents tab. | |
| Vertical sections with dividers | All 6 sections stacked vertically, always visible. | |

**User's choice:** Accordion panels (Recommended)
**Notes:** None

### Q2: Should panels be collapsed or expanded by default?

| Option | Description | Selected |
|--------|-------------|----------|
| All collapsed | Clean overview with summary badges. | ✓ |
| First non-empty expanded | Auto-expand first section with items. | |
| All expanded | Everything open by default. | |

**User's choice:** All collapsed
**Notes:** None

### Q3: What should appear on accordion headers?

| Option | Description | Selected |
|--------|-------------|----------|
| Section name + item count + expired badge | E.g., "Insurance (3 items) ⚠ 1 expired" | ✓ |
| Section name + item count only | Simpler, no expiration info until expanded. | |
| You decide | Claude's discretion. | |

**User's choice:** Section name + item count + expired badge
**Notes:** None

### Q4: How should items be listed inside expanded sections?

| Option | Description | Selected |
|--------|-------------|----------|
| Simple list rows | Each item as a row with name, key details, status chip, action menu. | ✓ |
| Cards within section | Each item as a small card. More visual. | |
| You decide | Claude's discretion. | |

**User's choice:** Simple list rows
**Notes:** None

---

## Add/Edit Form Approach

### Q1: How should users create and edit profile items?

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog/modal | MatDialog with section-specific fields. Matches VettingItemDialog. | |
| Inline editing | Click row to expand inline form. No modal. | |
| Side drawer | Slide-in panel from the right. Keeps list visible. | ✓ |

**User's choice:** Side drawer
**Notes:** None

### Q2: Section-specific or generic form fields?

| Option | Description | Selected |
|--------|-------------|----------|
| Section-specific fields | Each section gets its own form layout matching typed interfaces. | ✓ |
| Generic name/description + JSON editor | Same form for all sections with JSON editor. | |
| Hybrid | Common fields + section-specific fields below. | |

**User's choice:** Section-specific fields (Recommended)
**Notes:** None

### Q3: Same drawer for create and edit?

| Option | Description | Selected |
|--------|-------------|----------|
| Same drawer, mode-aware | One component switching create/edit mode. Pre-fills on edit. | ✓ |
| Separate components | Distinct create and edit drawers. | |
| You decide | Claude's discretion. | |

**User's choice:** Same drawer, mode-aware (Recommended)
**Notes:** None

### Q4: Delete confirmation approach?

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm dialog | Small MatDialog: "Delete [item name]? This cannot be undone." | |
| Inline confirm | Row replaces action menu with "Are you sure? Cancel / Delete" inline. | ✓ |
| You decide | Claude's discretion. | |

**User's choice:** Inline confirm
**Notes:** None

---

## Expiration Visual Treatment

### Q1: How should expired items be visually distinguished?

| Option | Description | Selected |
|--------|-------------|----------|
| Status chip color + icon | ZbResourceStatusComponent with red/warning chip. Row stays normal. | ✓ |
| Full row highlight | Entire row gets warning background tint. | |
| Icon-only indicator | Small warning icon next to name. Subtlest. | |

**User's choice:** Status chip color + icon
**Notes:** None

### Q2: What does the VPU-07 renewal prompt look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Banner at section top | Warning banner when section has expired items. | |
| Inline action on each expired row | "Renew" button next to status chip, opens edit drawer. | ✓ |
| Notification card in drawer | Warning card at top of drawer for expired items. | ✓ |

**User's choice:** Both options 2 and 3
**Notes:** User selected both inline "Renew" button on rows AND notification card in the drawer.

### Q3: Should near-expiration items also be flagged?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, upcoming expiration warning | Items expiring within 30 days get amber "EXPIRING SOON" chip. | ✓ |
| Only expired items flagged | Keep it simple, only past-expiry items. | |
| You decide | Claude's discretion on threshold. | |

**User's choice:** Yes, upcoming expiration warning
**Notes:** None

---

## Empty State & Onboarding

### Q1: What should a brand-new org see?

| Option | Description | Selected |
|--------|-------------|----------|
| Empty accordion sections with Add buttons | All 6 sections visible, expand to "No items yet" + Add button. | |
| Welcome card with section overview | Welcome card explaining 6 sections + "Get Started" button. Removed after first item. | ✓ |
| You decide | Claude's discretion. | |

**User's choice:** Welcome card with section overview
**Notes:** None

### Q2: Individual empty section treatment?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline empty state | Subtle message "No [section] items yet" + Add button. | |
| Just the Add button | No message, just the Add button. Minimal. | ✓ |
| You decide | Claude's discretion. | |

**User's choice:** Just the Add button
**Notes:** None

---

## Claude's Discretion

- Exact form field layout and validation rules per section type
- Side drawer width, animation, and close behavior
- Loading/saving states and optimistic update strategy
- Section ordering
- Row action menu details
- Welcome card design and copy
- 30-day expiration threshold implementation

## Deferred Ideas

None — discussion stayed within phase scope
