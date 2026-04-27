---
plan: 087
phase: 22
slug: form-template-library
status: skeleton
design_contract: ../../design/DESIGN.md
created: 2026-04-24
target_milestone: v1.3
source_artifacts:
  - .planning/director/phase-22-brief.md
  - .planning/BACKLOG.md  # entry "087"
  - src/app/core/models/form-builder.model.ts  # FormBuilderConfig (Phase 16)
stitch_prompts: stitch-prompts.md
mocks_dir: mocks/
---

# Phase 22 — Form Template Library UI Design Contract

> Design contract for the Form Template Library. Token set comes from
> [`DESIGN.md`](../../design/DESIGN.md). Screen references use Stitch-generated
> mocks dropped into `mocks/`; those mocks are ideation input only — the
> implementation realises this spec using `@zerobias-org/ngx-library`
> primitives.

---

## Intent

Let buyers reuse form structures across RFPs. Every new form created in the RFP
wizard **auto-saves as a draft** `FormTemplate`; the buyer can publish, fork,
or archive drafts from a dedicated library page. On future RFPs they pick a
published template from a picker dialog in the wizard (Step 2.5), which
pre-fills the form. Edits to a published template prompt Save-as-New-Version
vs Overwrite (owner-only, blocked if 2+ RFPs reference the version).

## Scope

### In scope (screens in this spec)

| # | Screen | Route / trigger | Mock |
|---|--------|-----------------|------|
| S1 | **Library Page** | `/forms/templates` | `mocks/s1-library.png` |
| S2 | **Picker Dialog** | RFP wizard Step 2.5 → "Pick from library" button | `mocks/s2-picker.png` |
| S3 | **Edit-Detect Modal** | User modifies a published template in the library editor | `mocks/s3-edit-detect.png` |
| S4 | **Auto-Draft Indicator** | Inline state in the RFP wizard form-builder step | `mocks/s4-autodraft-indicator.png` |
| S5 | **Documents Center Surface** | `/org` → Documents tab, "Recent form templates" section | `mocks/s5-docs-surface.png` |

### Out of scope

- Split-screen / WYSIWYG form builder redesign (Plan 088, separate phase)
- Cross-org template sharing
- AI-generated templates
- Versioning history browser (usage count + `parentTemplateId` is the MVP)

---

## Target View Integration

### S1 — Library Page (`/forms/templates`)

**File:** `src/app/pages/forms/form-template-library.component.ts` (new)
**Route:** `form-template-library.routes.ts` (new) → lazy-loaded from app routes

Layout follows the standard SME Mart list-page frame:

- Page header (`h1` typography) with title "Form Templates" + primary action
  button "New template" (→ opens form builder in `/forms/templates/new`).
- Search input (`ZbSearchInputComponent`) + status filter chip row (`Drafts`,
  `Published`, `Archived`) above the table.
- Remote table (`ZbRemoteTableComponent`) with columns: Name, Status (chip),
  Usage count, Owner, Updated. Drafts pin to the top via a sort override.
- Row hover: background `{colors.primary-container}`. Row click: open
  `/forms/templates/:id` (form-builder edit view).
- Empty state via `ZbEmptyStateContainerComponent` when no templates exist.
- Row actions menu: Open, Fork, Publish (drafts only), Archive, Delete
  (owner-only, blocked when referenced).

### S2 — Picker Dialog (RFP wizard)

**File:** `src/app/pages/rfp/wizard/steps/step-form-template-picker.component.ts` (new)
**Opened by:** `MatDialog` from the existing RFP wizard Step 2.5 form-builder button.

- `mat-dialog` with rounded `{rounded.lg}` surface.
- Title row: "Pick a form template" (h3) + close icon.
- Search input + sort control ("Most used", "Recently updated", "Name").
- Scrollable list of template cards (`ZbSimplePanelComponent` in
  `header-only` variant, one per template): name, description, chip with
  usage count, preview button.
- **Only `status: published` templates appear.** Drafts are explicitly hidden.
- Select action commits on double-click OR "Use this template" button.
- Cancel closes the dialog, no side effect.

### S3 — Edit-Detect Modal

**File:** reusable `confirm-save-as-new-version-dialog.component.ts` (new, in `src/app/shared/dialogs/`).

Triggered when a user has loaded a published template from `/forms/templates/:id`,
modifies a field, then tries to save.

- `mat-dialog` sized 480px wide.
- Title: "This template is published" (h3).
- Body: explains options. "Saving will either create a new version (fork) or
  overwrite the published template. Overwrite is only available to the owner
  and only when no active RFPs reference this version."
- Secondary action: **Save as new version** (button-primary, filled).
- Primary destructive action: **Overwrite** (button-tertiary green IF allowed,
  disabled with inline warning otherwise).
- Cancel keeps edits in-place without persisting.

### S4 — Auto-Draft Indicator

Inline chip inside the form-builder toolbar. No dedicated file — lives in the
existing `form-builder.component.ts`.

- Chip variant: `chip-neutral` from DESIGN.md.
- Copy cycles through:
  - "Draft" (idle, post-autosave)
  - "Saving…" (in-flight autosave)
  - "Saved · {relative time}" (resolved)
  - "Save failed — Retry" (error; chip becomes clickable, background
    `{colors.error-container}` with error text)

Debounced autosave on field add/edit/remove (300ms trailing).

### S5 — Documents Center Surface

Coordinates with Phase 21. A new section on the Org Documents Center:

- Section title "Form templates" (h3) with a "See all" link → `/forms/templates`.
- Horizontal scroller of the 6 most recent templates as `card` tiles.

---

## Component Inventory (ngx-library + Material)

| Role | Primitive | Token |
|------|-----------|-------|
| Page title | Plain `<h1>` with project typography | `{typography.h1}` |
| Section title | Plain `<h3>` | `{typography.h3}` |
| Primary action button | `mat-flat-button color="primary"` | `{components.button-primary}` |
| Publish / Save-as-new-version | `mat-flat-button color="accent"` | `{components.button-tertiary}` |
| Table | `ZbRemoteTableComponent` | `{components.table-header}` + `{components.table-row}` |
| Search | `ZbSearchInputComponent` | `{components.input}` |
| Status chip | `ZbResourceStatusComponent` | `{components.chip-status-*}` |
| Neutral chip | `ZbChipColorsDirective` on span | `{components.chip-neutral}` |
| Panel / card | `ZbSimplePanelComponent` | `{components.panel}` + `{components.panel-header}` |
| Empty state | `ZbEmptyStateContainerComponent` | — |
| Dialog | `MatDialog` | `{components.dialog}` |

## Copywriting Contract

Tone: direct, professional, no exclamation marks. Avoid "awesome" / "amazing".

- Primary button labels use imperative verbs: "New template", "Use this template".
- Chip labels are Title Case ("Draft", "Published", "Archived"). `zb-resource-status` handles internal casing.
- Empty states lead with the action the user can take, not the absence ("Create your first template" not "No templates yet").
- Error messages end with a period. Success toasts do not.

## Accessibility & States

- All primary actions reachable via keyboard (Tab / Enter).
- Row action menus must be operable from the keyboard — use `mat-menu` defaults.
- Status chips carry both color AND text (never color-only).
- Loading states: `ZbRemoteTableComponent` handles skeleton rows natively; picker dialog shows a spinner with "Loading templates…" caption.
- Contrast: all token pairings in DESIGN.md pass WCAG AA at 4.5:1 (lint confirmed).

## Open Questions

1. Should the Library Page pre-filter to the current org's templates only, or surface templates shared across orgs the user belongs to? (Impacts header + filter UI.)
2. When overwriting is blocked by references, do we link to the referencing RFPs? If yes, that's a new mini-screen.
3. Does the documents-center surface (S5) need drag-to-reorder, or is recency-sorted read-only acceptable for MVP?
4. Auto-draft behavior for a user with zero edits (opened then left) — do we delete the empty draft on navigation-away, or let it persist?

## Verification

- All 9 requirements (FT-01..FT-09) map to a screen or screen behavior in this spec.
- Token references resolve against `../../design/DESIGN.md`.
- Mocks (Stitch output) present in `mocks/` for S1-S5.
- Component inventory names only primitives that exist in the installed `ngx-library` + Angular Material versions.
- UI-SPEC reviewed against `gsd-ui-checker` 6-pillar checklist.

## References

- DESIGN.md: `.claude/design/DESIGN.md`
- Stitch prompts: `stitch-prompts.md` (this directory)
- Phase brief: `.planning/director/phase-22-brief.md`
- Backlog entry: `.planning/BACKLOG.md` section "087"
- Phase 16 form builder: `src/app/pages/form-builder/`
- Phase 15 DocumentTemplate (analogous template lifecycle): `.planning/phases/15-document-templates/`
