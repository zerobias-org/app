# Form Builder Refactor — Research (Plan 088)

**Date:** 2026-04-15
**For:** `/gsd:plan-phase` Plan 088 — Split-screen Form Builder + WYSIWYG Canvas + Grouping + Info Field Type
**Author:** Clark + Claude, pre-GSD prep

---

## Current state (Phase 16 baseline)

| File | LOC | Role |
|---|---|---|
| `form-builder.component.ts` | 127 | Editor shell (stacked expansion panels) |
| `form-field-editor.component.ts` | 163 | Right-pane-equivalent field properties form |
| `form-field-renderer.component.ts` | 123 | Single-field render (used by builder + renderer) |
| `dynamic-form-renderer.component.ts` | 159 | Runtime renderer — **already uses `FormBuilder` + `Validators`, flat `FormGroup`** |
| `form-builder.model.ts` | 81 | `FormBuilderConfig`, `FormFieldConfig`, `FormSection`, `FormSubmission` |

**Model shape today:**
```ts
FormBuilderConfig {
  version: 1;
  sections?: FormSection[];    // named sections — one level deep, unused visually in editor
  fields: FormFieldConfig[];   // flat top-level fields (the primary list)
  lockedAt?: Date;
}
```

**Runtime today:** `DynamicFormRendererComponent` builds a **flat `FormGroup`** keyed by `field.id`. Validators wired per-field via a `getValidatorsForField(field)` switch. No nested `FormGroup`, no `FormArray`, no `FormSection` rendering yet.

---

## Research Axis 1 — Canvas vs DOM CDK drag-drop

**Decision driver:** do we render the editor surface with HTML `<canvas>` (imperative pixel-level control) or DOM + CDK drag-drop (Angular-native, uses real elements)?

| Dimension | HTML `<canvas>` | DOM + Angular CDK drag-drop |
|---|---|---|
| Accessibility | ✗ nothing for free — must reimplement focus, keyboard, screen reader, tab order | ✓ real elements, keyboard/ARIA for free |
| Text rendering | ✗ custom text metrics, wrapping, selection — notoriously hard | ✓ browser handles all of it |
| Reuse of existing components | ✗ can't place a `<mat-form-field>` on a canvas; must re-render every field as pixels | ✓ place the real `<app-form-field-renderer>` on the page |
| Live editability | ✗ canvas inputs require invisible-DOM overlay hacks | ✓ native |
| Snap-to-grid / alignment | ✓ trivial (pixel math) | ✓ via CSS Grid + CDK drop zones with snap feedback |
| Drag-drop reorder | ✓ imperative | ✓ `cdkDropList` + `cdkDrag` |
| Group nesting | ✓ easy (draw rectangles) | ✓ `cdkDropList` nested in `cdkDropList`, with `cdkDropListConnectedTo` for cross-group drag |
| Horizontal layout | ✓ easy (x-axis math) | ✓ via flex `cdkDropListOrientation="horizontal"` |
| Zoom / pan / whiteboard-style UX | ✓ native | ✗ requires CSS `transform: scale()` and manual pan math; possible but more fragile |
| Export/preview parity | ✗ preview mode needs a DOM pass anyway — double-implementation | ✓ edit-mode = preview-mode with chrome toggled |
| Complexity budget | High — you're rebuilding the browser | Low — you use the browser |

### Recommendation: **DOM + Angular CDK drag-drop. Skip canvas.**

Canvas makes sense for node-graph tools (Miro, Figma) where the "document" is shapes-and-connections and zoom/pan is a first-class requirement. A form builder's document is **fields arranged in a stack with occasional horizontal pairing**. That's a DOM layout problem, not a canvas rendering problem.

**The one thing we lose by skipping canvas:** pixel-arbitrary placement ("put this field 347px from top"). For a form builder this is a **feature to avoid** — forms should align to a grid, not free-float.

### CDK capability checklist (all available out-of-box)

- `cdkDropList` + `cdkDrag` — drag-drop reorder in one container
- `cdkDropListConnectedTo` — drag between multiple containers (field palette → canvas, group A → group B)
- `cdkDropListOrientation="horizontal"` — horizontal group support
- Nested `cdkDropList` — sub-group support. Each group is its own drop list; `connectedTo` links siblings for cross-group drag.
- `cdkDragPreview`, `cdkDragPlaceholder` — customizable ghost + insertion indicator
- Keyboard drag-drop — arrow keys move items when focused (Angular 17+ CDK)
- `cdkDropList sortingDisabled` toggle — for the palette (don't let palette items reorder, only copy out)

### Specific CDK patterns to plan for

1. **Palette → canvas copy-drop:** palette is a `cdkDropList` with `cdkDragDisabled` on sorting; each item is a `cdkDrag` that, when dropped on the canvas drop list, inserts a new `FormFieldConfig` rather than reordering.
2. **Nested groups:** each group is both a `cdkDropList` (contents) AND a `cdkDrag` (itself draggable within its parent). Use `cdkDropListData` to bind the group's `fields: FormFieldConfig[]` array.
3. **Horizontal groups:** the group-level `cdkDropListOrientation` flips from `vertical` (default) to `horizontal`.
4. **Cross-group drag:** compute `connectedTo` arrays dynamically — every drop list lists every OTHER drop list in the tree.

---

## Research Axis 2 — Nested FormGroup + FormArray patterns

### Goal
Config JSON round-trips to an Angular reactive form tree where:
- Every `FormBuilderConfig` root → one `FormGroup`
- Every `FormGroupConfig` (new, nested) → one nested `FormGroup` keyed by `group.id`
- Every `FormFieldConfig` → one `FormControl` keyed by `field.id`
- `info` fields → NO control created (they're not inputs)

### Canonical pattern (Angular Reactive Forms)

```ts
// Given config:
// { groups: [
//     { id: 'contact', orientation: 'vertical', heading: 'Contact',
//       fields: [{id:'email', type:'text', ...}, {id:'phone', type:'text', ...}] },
//     { id: 'address', orientation: 'horizontal', heading: 'Address',
//       fields: [{id:'city'}, {id:'state'}, {id:'zip'}] }
//   ],
//   fields: [ { id: 'notes', type: 'textarea' } ]  // ungrouped top-level
// }

const root = fb.group({
  contact: fb.group({
    email: fb.control('', [Validators.required, Validators.email]),
    phone: fb.control('', []),
  }),
  address: fb.group({
    city: fb.control('', [Validators.required]),
    state: fb.control('', [Validators.required]),
    zip: fb.control('', [Validators.pattern(/^\d{5}$/)]),
  }),
  notes: fb.control('', []),
});
```

**Access patterns:**
- `root.get('contact.email')` — path-style lookup
- `root.value` — produces the nested object shape (no manual reassembly)
- `root.valid`, `root.statusChanges`, `root.dirty` — apply recursively automatically
- `root.get('contact') as FormGroup` — pass the sub-group to a child component that renders `<div [formGroup]="contactGroup">`

### `FormArray` — do we need it?

Only if a field config grows a "repeating rows" concept (e.g., "list of references, add row"). **Out of scope for Plan 088.** `FormArray` is a future consideration when the builder gets a "repeatable group" field type.

### Template binding (child component accepts a FormGroup)

```html
<!-- parent -->
<app-form-group-renderer
  [group]="childGroup"
  [config]="groupConfig">
</app-form-group-renderer>

<!-- child -->
<div [formGroup]="group">
  @for (f of config.fields; track f.id) {
    @if (f.type !== 'info') {
      <app-form-field-renderer [field]="f" [control]="group.get(f.id)" />
    } @else {
      <div class="info-block">
        <h3>{{ f.label }}</h3>
        <p [innerHTML]="f.description | markdown"></p>
      </div>
    }
  }
</div>
```

### Validator composition — stay declarative

The current `getValidatorsForField()` switch is already correct. Extend, don't replace:

```ts
function validatorsFor(field: FormFieldConfig): ValidatorFn[] {
  const v: ValidatorFn[] = [];
  if (field.required) v.push(Validators.required);

  if (field.type === 'text' || field.type === 'textarea') {
    const t = field.textValidation;
    if (t?.minLength) v.push(Validators.minLength(t.minLength));
    if (t?.maxLength) v.push(Validators.maxLength(t.maxLength));
    if (t?.pattern === 'email') v.push(Validators.email);
    if (t?.pattern === 'custom' && t.patternValue) v.push(Validators.pattern(t.patternValue));
  }
  if (field.type === 'number') {
    const n = field.numberValidation;
    if (n?.min !== undefined) v.push(Validators.min(n.min));
    if (n?.max !== undefined) v.push(Validators.max(n.max));
  }
  return v;
}
```

**Cross-field validators (future):** Angular's `Validators` are field-scoped. Group-level cross-field rules (e.g., "at least one of these three") attach to the parent `FormGroup` via `fb.group({...}, { validators: [atLeastOneRequired(['a','b','c'])] })`. Plan for this in the schema: `FormGroupConfig.groupValidators?: GroupValidatorConfig[]`. Out of initial scope but don't paint yourself into a corner.

---

## Research Axis 3 — Storage format extension

### Current model
```ts
FormBuilderConfig { version: 1; sections?: FormSection[]; fields: FormFieldConfig[]; lockedAt?: Date; }
FormSection       { id: string; label: string; fields: FormFieldConfig[]; }
FormFieldConfig   { id, type, label, required, placeholder?, description?, textValidation?, dropdownOptions?, numberValidation?, fileUploadConfig?, sectionId? }
```

### Proposed extension (v2)

```ts
export type FormFieldType = 'text' | 'textarea' | 'dropdown' | 'number' | 'file' | 'checkbox' | 'info';

export interface FormFieldConfig {
  kind: 'field';                  // discriminator — NEW
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  // ... existing type-specific validation
}

export interface FormGroupConfig {
  kind: 'group';                  // discriminator — NEW
  id: string;
  orientation: 'vertical' | 'horizontal';
  heading?: string;
  description?: string;           // markdown
  collapsible?: boolean;          // future — v2+
  children: FormNodeConfig[];     // RECURSIVE — nested groups
}

export type FormNodeConfig = FormFieldConfig | FormGroupConfig;

export interface FormBuilderConfig {
  version: 2;                     // bumped
  children: FormNodeConfig[];     // replaces `fields` + `sections`
  lockedAt?: Date;
}
```

### Migration

- Old `v1` configs detected by `version === 1` (or missing).
- Migrator function: collapse `sections[*].fields` into top-level `children` as `FormGroupConfig` with `orientation: 'vertical'`; append loose `fields` as top-level `FormFieldConfig`. Output `version: 2`.
- Run migrator on load inside `DynamicFormRendererComponent.ngOnInit()`. Persist migrated shape on next save.
- **No breaking change to existing FormSubmissions** — `submissionData` is still a `Record<string, unknown>` keyed by field ID. Since field IDs are preserved through migration, existing submissions remain valid.

### Discriminator choice

Using `kind: 'field' | 'group'` (plus `type` for field-type) keeps `FormNodeConfig` a discriminated union, so TypeScript narrows correctly in renderers:
```ts
if (node.kind === 'group') { /* node: FormGroupConfig */ }
else { /* node: FormFieldConfig, node.type narrows to FormFieldType */ }
```

### JSON size implications

Nested structure adds ~20-30% JSON size vs flat (extra `children: []` wrappers + discriminators). Negligible for the expected payload sizes (forms under 100 fields). Don't prematurely optimize with index-based arrays or ID-only references.

---

## Research Axis 4 — Library survey

### ngx-formly (JSON-driven forms for Angular)

- **What it is:** Mature (12+ years) library that takes JSON config and renders Angular forms with full reactive-forms integration. Supports nested `FormGroup`, `FormArray`, custom field types, custom wrappers (perfect for groups), expressions (conditional visibility, async validators).
- **Pros:** Solves ~80% of what Plan 088 needs off-the-shelf. Validators, nested groups, custom field types. Well-maintained.
- **Cons:** Config shape is ngx-formly's, not ours (`FormlyFieldConfig`). Migration would mean translating `FormBuilderConfig` → ngx-formly schema at render time. Also: ngx-formly doesn't ship a **builder** (the editor UI) — it ships a **renderer**. You'd still need to build the canvas-style editor yourself.
- **Verify before committing:** Angular 21 compatibility (check npm registry for latest version). ngx-formly's release cadence sometimes lags major Angular releases.

### formio / form.io

- **What it is:** Full hosted form-building platform. Has a JS builder SDK that can be embedded.
- **Pros:** Builder UI already exists, drag-drop, conditional logic, lots of field types.
- **Cons:** Heavy dependency. Not Angular-native (wraps React/vanilla under the hood in places). Loses the "outputs real FormGroup" contract — formio has its own form state. **Likely wrong fit.**

### SurveyJS / Creator

- **What it is:** Survey-oriented form builder + JSON schema. Has a "Creator" that IS a visual builder.
- **Pros:** Visual builder out-of-box. Drag-drop, sections, page logic.
- **Cons:** Not Angular-native reactive forms — has its own model layer. Loses the FormGroup contract. **Wrong fit for this plan's hard constraint.**

### Recommendation

**Do not adopt a library. Build custom on Angular Reactive Forms + CDK drag-drop.** Reasons:
- Plan 088's **hard contract** is "renderer outputs real `FormGroup`/`FormControl`." Every library in the survey either fights this contract or solves only half the problem (renderer but no builder, or builder but no Angular-native state).
- Plan's complexity estimate (20-26 hrs) already fits the custom path. Library adoption adds translation-layer work, version-pin risk, and fights Angular 21 type safety.
- We already have working renderers (`FormFieldRendererComponent`, `DynamicFormRendererComponent`). The refactor is additive (groups + editor UX), not a rewrite.

**Consider ngx-formly later** if a future plan wants ZB-wide form-config portability. For SME Mart now: **custom, stay Angular-native.**

---

## Research Axis 5 — Editor layout & interaction patterns

### Two-pane layout

```
+------------------+-------------------+-----------------+
|  Palette (left)  |  Canvas (center)  | Properties (R)  |
|                  |                   |                 |
| [Text]           |  +-------------+  | Label: [_____]  |
| [Textarea]       |  | Email       |  | Required: [x]  |
| [Dropdown]       |  +-------------+  | Validation:    |
| [Number]         |  +-------------+  |   min: [__]    |
| [File]           |  | Phone       |  |   max: [__]    |
| [Checkbox]       |  +-------------+  | ...             |
| [Info]           |  ┌─ Address ──┐   |                 |
| ─────────        |  |            |   |                 |
| [V Group]        |  | [City][St] |   |                 |
| [H Group]        |  | [Zip______]|   |                 |
|                  |  └────────────┘   |                 |
+------------------+-------------------+-----------------+
```

**CSS Grid:** `grid-template-columns: 240px 1fr 320px; grid-template-rows: 1fr;`
**Responsive:** collapse Palette + Properties to drawers below 1024px (matches SME Mart's other drawer patterns in catalog/filter UI).

### Selection model

- Clicking a field or group in the canvas sets `selectedNodeId` signal.
- Right-pane properties editor reacts to `selectedNodeId` → loads matching `FormFieldConfig` or `FormGroupConfig`.
- Changes in properties editor write through a `FormNodeConfig` edit service (deep-merge into the `children` tree by ID path).
- Deselect: click the canvas background → `selectedNodeId = null` → properties pane shows "Select a field or group."

### Group affordances

- **Visual border** on hover/focus (Material elevation 1 at rest, elevation 3 when selected).
- **Group toolbar** on selection: `[ heading pencil ] [ V/H toggle ] [ delete ] [ duplicate ]`.
- **Drop zone highlight** when dragging another field over a group: inner border glows accent color.
- **Empty-group placeholder:** dashed border + "Drop fields here" text when a group has zero children.

### "Add" split-button

```
[ Add Field ▾ ]
  ├── Text
  ├── Textarea
  ├── Dropdown
  ├── Number
  ├── File
  ├── Checkbox
  ├── ─────────
  ├── Info (heading + description)
  ├── ─────────
  ├── Vertical Group
  └── Horizontal Group
```

- Primary click: insert field of last-used type (default `text`).
- Caret click: open menu.
- New node inserts at end of current selection's container (group or root), or end of root if nothing selected.

### Preview tab

- Same `DynamicFormRendererComponent` with `mode="preview"`, NO builder chrome (no palette, no properties, no selection highlight).
- Full-width content area, realistic spacing.
- Form is disabled (current behavior).

---

## Research Axis 6 — Accessibility & keyboard

Must-haves before shipping:
- **Tab order:** palette items → canvas nodes (in document order) → properties form. Each canvas node is focusable (`tabindex="0"`).
- **Keyboard drag:** CDK drag-drop supports arrow-key reordering when a drag handle is focused (Angular 17+). Confirm works in Angular 21.
- **Screen reader:** each canvas node has `aria-label="{{field.label}}, {{field.type}}, position 3 of 7 in group Contact"`. Groups announce as landmarks (`role="group"` + `aria-labelledby`).
- **Escape key:** cancels active drag, deselects selection.
- **Enter/Space on palette item:** inserts at end of selected container (keyboard alternative to drag).
- **Delete/Backspace on canvas node:** soft-delete with undo toast (5-second window to `/undo`).

---

## Research Axis 7 — Testability

**Critical:** the existing Phase 16 spec files (~60% of LOC in the folder are `.spec.ts`) must mostly survive the refactor. Strategy:

- `DynamicFormRendererComponent` tests stay — the public contract (inputs, outputs, emitted submissions) doesn't change. Add new tests for group rendering.
- `FormBuilderComponent` tests mostly rewrite (layout + interaction changed entirely).
- **New test surface:** group drag-in/drag-out, nested-group drag, horizontal-group layout, info-field exclusion from submissionData, migrator v1→v2 round-trip.
- E2E: Playwright helpers in `e2e/helpers/form-builder.ts`. Page-object that exposes `addField(type, { groupId })`, `createGroup(orientation, { parentGroupId })`, `editField(id, props)`, `expectValid()`.

**Testability as first-class:** write the E2E helpers during implementation (per Plan 085 directive), not after.

---

## Open Questions for Plan 088 Discussion

1. **Conditional/computed fields out of scope?** Plan 088 excludes conditional display. Confirm — Angular Formly-style `expressionProperties` would be a later plan.
2. **Validator expression language?** Current validators are enums/literals. Do we want a future path to "custom cross-field validator" (e.g., "zip must be valid for selected state")? If yes: reserve `groupValidators` shape in v2 schema now.
3. **Undo/redo scope?** Plan 087 (template library) implies auto-save on edit — how much session-level undo do we want before the next autosave checkpoint? (Suggest: 20 actions, cleared on save.)
4. **Drag-drop performance ceiling?** CDK drag-drop handles ~100 items fine. Forms over 50 fields are a UX smell anyway, but note the ceiling.
5. **Migration trigger?** Run v1→v2 migrator at load time (silent) or require explicit "migrate form" action? Silent is better UX; flag if audit trail cares.
6. **Does the canvas need a "snap to column" toggle?** Horizontal groups with 2-3 fields could auto-balance widths. Or always-equal widths (simpler). Recommend: always-equal in v1, add weighting later if needed.

---

## Recommended Next Steps (for `/gsd:plan-phase`)

1. **Decide** on DOM + CDK (recommendation above) during Discuss.
2. **Schema migration** is Plan Step 1 — it's a shape change touched by every subsequent step.
3. **Build group renderer BEFORE editor** — the runtime contract (`FormGroup` tree output) is the harder half. If that works, the editor is just UI.
4. **Palette → properties-panel UX parity** — every field type configurable via palette drag AND properties form. No type should be drag-only or form-only.
5. **Keep `form-field-renderer` unchanged** if possible — it's the leaf that's already battle-tested. Only renderers ABOVE it (group, form) get the redesign.

---

## Glossary

| Term | Meaning in this doc |
|---|---|
| Canvas | The center editor surface where fields live. (NOT HTML `<canvas>` element — DOM-based.) |
| Palette | Left-pane source of field + group types. |
| Properties | Right-pane form for the selected node. |
| Node | Generic term for "field or group" (`FormNodeConfig`). |
| v1 / v2 | `FormBuilderConfig.version` — pre- and post-refactor schema. |
