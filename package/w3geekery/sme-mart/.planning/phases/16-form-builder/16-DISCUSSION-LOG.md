# Phase 16: Form Builder - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 16-form-builder
**Areas discussed:** Form designer UX, Form storage & schema, RFP wizard integration, Vendor submission & review

---

## Form Designer UX

### Field arrangement

| Option | Description | Selected |
|--------|-------------|----------|
| Sequential list | Add Field appends to vertical list, expansion panels, drag handle for reorder | ✓ |
| Card grid | Fields as cards in responsive grid, drag-and-drop between cells | |
| Inline table | Spreadsheet-like table, rows are fields, columns are config | |

**User's choice:** Sequential list (Recommended)
**Notes:** Matches existing requirement-editor expansion panel pattern

### Type selection

| Option | Description | Selected |
|--------|-------------|----------|
| Type dropdown in panel | Click Add Field → panel opens with type dropdown, type reveals config | ✓ |
| Type chooser dialog | Dialog with 6 type cards (icon + label + desc) | |
| You decide | Claude picks | |

**User's choice:** Type dropdown in panel (Recommended)

### Reordering

| Option | Description | Selected |
|--------|-------------|----------|
| Drag handle + CDK DragDrop | Each panel gets drag handle, uses Angular CDK DragDrop | ✓ |
| Up/down arrow buttons | Simple buttons, no drag library | |
| You decide | Claude picks | |

**User's choice:** Drag handle + CDK DragDrop (Recommended)

### Sections

| Option | Description | Selected |
|--------|-------------|----------|
| No sections for v1.2 | Flat list only, deferred to v1.3 | |
| Optional sections | Buyer can optionally wrap fields in named sections | ✓ |
| You decide | Claude decides based on effort | |

**User's choice:** Optional sections
**Notes:** Diverged from recommended. Buyer can add section headers to group fields but it's not required.

### Dropdown options config

| Option | Description | Selected |
|--------|-------------|----------|
| Inline text list | Textarea or chip input, one per line or comma-separated | ✓ |
| Managed options dialog | Button opens dialog with add/remove/reorder | |
| You decide | Claude picks simplest | |

**User's choice:** Inline text list (Recommended)

### File upload config

| Option | Description | Selected |
|--------|-------------|----------|
| Allowed types + max size | Buyer picks file types + sets max size | |
| Just allowed types | Only file type filter, no size config | |
| You decide | Claude decides | ✓ |

**User's choice:** You decide (Claude's discretion)

### Number field validation

| Option | Description | Selected |
|--------|-------------|----------|
| Min, max, and step | Optional min/max bounds + step increment | ✓ |
| Min/max only | Just min and max, no step | |
| You decide | Claude picks | |

**User's choice:** Min, max, and step (Recommended)

### Text field pattern validation

| Option | Description | Selected |
|--------|-------------|----------|
| No regex for v1.2 | Required + min/max length only | |
| Preset patterns | Dropdown of common patterns (email, phone, URL) | ✓ |
| You decide | Claude picks | |

**User's choice:** Preset patterns
**Notes:** Diverged from recommended. Convenient without exposing regex complexity.

### Preview

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle preview | Button toggles between builder and rendered preview | ✓ |
| Side-by-side split | Left = builder, right = live preview | |
| Preview-only dialog | Modal showing rendered form | |

**User's choice:** Toggle preview (Recommended)

---

## Form Storage & Schema

### Config storage

| Option | Description | Selected |
|--------|-------------|----------|
| Field on SmeMartProject | formConfig JSON field on existing entity | ✓ |
| Separate FormConfig entity | New schema class linked to SmeMartProject | |

**User's choice:** Field on SmeMartProject (Recommended)

### Submission storage

| Option | Description | Selected |
|--------|-------------|----------|
| New FormSubmission entity | Separate schema class linked to Bid + Project | ✓ |
| JSON field on Bid | formResponses field on existing Bid entity | |
| You decide | Claude picks | |

**User's choice:** New FormSubmission entity (Recommended)

### Draft saving

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-save drafts | FormSubmission starts as draft, explicit Submit | ✓ |
| Submit only | No draft state, one-shot submission | |
| You decide | Claude picks | |

**User's choice:** Yes, auto-save drafts (Recommended)

### Versioning

| Option | Description | Selected |
|--------|-------------|----------|
| Lock on first submission | Form editable until first submission, then locked | ✓ |
| Version + snapshot | Submissions store config version, buyer can edit | |
| You decide | Claude decides | |

**User's choice:** Lock on first submission (Recommended)

### Schema class for config

| Option | Description | Selected |
|--------|-------------|----------|
| JSON field only | Shape defined by TS interface, no YAML schema for config | ✓ |
| Validated JSON field | JSON Schema definition in YAML for server validation | |

**User's choice:** JSON field only (Recommended)

### File storage mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| ZB FileService | Reuse existing upload SDK, file ref in submissionData | ✓ |
| You decide | Claude decides | |

**User's choice:** ZB FileService (Recommended)

### Field limit

| Option | Description | Selected |
|--------|-------------|----------|
| Soft limit with warning | Warning at ~25 fields, no hard cap | ✓ |
| Hard limit (e.g., 50) | Enforce maximum | |
| You decide | Claude picks | |

**User's choice:** Soft limit with warning

---

## RFP Wizard Integration

### Step placement

| Option | Description | Selected |
|--------|-------------|----------|
| New step after Requirements | Basics → Requirements → Submission Form → Documents → Terms → Review | ✓ |
| Embedded in Requirements step | Form builder below requirements list | |
| Standalone page | Separate page/tab on RFP detail | |

**User's choice:** New step after Requirements (Recommended)

### Optional vs required

| Option | Description | Selected |
|--------|-------------|----------|
| Optional step | Buyer can skip, vendors get traditional bids | ✓ |
| Required step | Every RFP must have a form | |
| You decide | Claude decides | |

**User's choice:** Optional step (Recommended)

### Draft persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-persist on step change | Same pattern as existing wizard steps | ✓ |
| You decide | Claude follows existing pattern | |

**User's choice:** Auto-persist on step change (Recommended)

### Review step display

| Option | Description | Selected |
|--------|-------------|----------|
| Rendered preview | Read-only DynamicFormRenderer in preview mode | ✓ |
| Summary table | Compact field name/type/required table | |
| You decide | Claude picks | |

**User's choice:** Rendered preview (Recommended)

---

## Vendor Submission & Review

### Vendor form location

| Option | Description | Selected |
|--------|-------------|----------|
| Tab on RFP detail | New "Submission Form" tab alongside existing tabs | ✓ |
| Part of bid dialog | Form fields inside bid submission dialog | |
| Standalone page | Dedicated /rfps/:id/submit route | |

**User's choice:** Tab on RFP detail (Recommended)

### Buyer review

| Option | Description | Selected |
|--------|-------------|----------|
| Inline on bid detail | Read-only rendered section + Mark Reviewed button | ✓ |
| Side-by-side comparison | Multi-vendor column comparison | |
| Both | Inline + comparison view | |

**User's choice:** Inline on bid detail (Recommended)

### Edit after submission

| Option | Description | Selected |
|--------|-------------|----------|
| Editable until RFP closes | Status reverts to "revised" on edit, resets reviewed | ✓ |
| Locked on submit | Immutable after submission | |
| You decide | Claude picks | |

**User's choice:** Editable until RFP closes (Recommended)

### No form behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hide tab entirely | Tab doesn't render when no formConfig | ✓ |
| Show empty state | Tab with "no form required" message | |

**User's choice:** Hide tab entirely (Recommended)

### Bid gate

| Option | Description | Selected |
|--------|-------------|----------|
| Form required before bid | Submit Bid disabled until form submitted | ✓ |
| Independent | Bid and form submission are separate | |
| You decide | Claude picks | |

**User's choice:** Form required before bid (Recommended)

### Renderer component

| Option | Description | Selected |
|--------|-------------|----------|
| Same component, mode prop | One DynamicFormRenderer with preview/fill/review modes | ✓ |
| Separate components | Different components per context | |

**User's choice:** Same component, mode prop (Recommended)

---

## Claude's Discretion

- File upload field constraints (allowed types, max size)
- FormSubmission field mapping constants + class ID registration
- CDK DragDrop integration within expansion panels
- Section header UI design
- "Revised" status badge styling
- Form validation error display patterns

## Deferred Ideas

- Side-by-side bid comparison (evaluation feature for v1.3)
- Conditional form logic (D3-07, already in REQUIREMENTS.md)
- Repeating form sections (D3-08, already deferred)
- Form template reuse across RFPs
