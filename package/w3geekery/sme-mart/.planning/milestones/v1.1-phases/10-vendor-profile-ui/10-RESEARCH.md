# Phase 10: Vendor Profile UI - Research

**Researched:** 2026-04-01
**Domain:** Angular 21 UI layer for vendor profile CRUD with accordion grouping, side drawer forms, and expiration indicators
**Confidence:** HIGH

## Summary

Phase 10 implements the Corporate Profile tab on the `/org` page, providing org members with a unified interface to manage MarketplaceProfileItem entities across 6 sections (corporate_identity, attestation, insurance, reference, personnel, financial). The UI leverages established SME Mart patterns: Material expansion panels for grouping (following the vetting-tab precedent), side drawer for form CRUD instead of dialogs, reactive forms with section-specific field layouts, and ZbResourceStatusComponent for expiration indicators.

The service layer is ready from Phase 9 (VendorProfileService with full CRUD). The implementation is straightforward: accordion shells around section-filtered arrays, a dual-mode form drawer (create/edit), inline delete confirmation, and computed expired/expiring-soon indicators. All required components and patterns already exist in the codebase — no new custom solutions needed.

**Primary recommendation:** Build the profile tab component following the vetting-tab accordion structure exactly, but replace the dialog with a MatSidenavModule side drawer for forms. Use Material's native components and ngx-library chips/status components throughout.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/material | ^18+ | Expansion panels, sidenav, form controls, dialogs | Established pattern in SME Mart (vetting-tab, documents-tab use this) |
| @zerobias-org/ngx-library | ^0.2.25 | ZbResourceStatusComponent for status chips, theme integration | Mandatory first choice for all UI components in SME Mart |
| ReactiveFormsModule | Angular 21 builtin | Form control binding, validation | Standard for all SME Mart forms (vetting-item-dialog, documents-tab) |
| MatExpansionModule | @angular/material | Accordion panels (6 sections) | Direct analog: vetting-tab uses this for buyer/provider grouping |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MatSidenavModule | @angular/material | Side drawer for add/edit forms (right slide-in panel) | Decision D-05: side drawer instead of dialog for context preservation |
| MatMenuModule | @angular/material | Inline action menus (edit/delete on each row) | Standard for context menus in SME Mart (vetting-tab uses this) |
| MatDatepickerModule | @angular/material | Date input for expiresAt fields | Needed for date fields in insurance, personnel, financial sections |
| MatChipsModule | @angular/material | Status badges (expired/expiring-soon), removable selections | Used in other SME Mart tabs for tags and filtering |
| MatProgressBarModule | @angular/material | Progress indicator within sections (optional, per D-03 summary badge) | Used in vetting-tab for section progress |
| CommonModule | Angular 21 builtin | Control flow directives (@if, @for, @switch) | Mandatory for all templates |
| DatePipe, TitleCasePipe | Angular 21 builtin | Format dates and text in templates | Standard for SME Mart templates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MatSidenavModule side drawer | MatDialog (modal) | Dialog blocks the section list; side drawer keeps list visible (D-05 choice) |
| ZbResourceStatusComponent | mat-chip or custom badge | ZbResourceStatusComponent handles color mapping automatically (EXPIRED=#eed5d1, etc) from ngx-library theming |
| Expansion panels | Custom tabs or simple dividers | MatExpansionModule is battle-tested in vetting-tab; collapse state is built-in |

**Installation:**
```bash
# Already installed in project
npm list @angular/material @zerobias-org/ngx-library
```

**Version verification:** @zerobias-org/ngx-library@0.2.25 is currently installed; @angular/material version ~18.x.

## Architecture Patterns

### Recommended Project Structure
```
src/app/pages/org/tabs/
├── vendor-profile-tab.component.ts         # Main tab component (accordion + sidenav orchestration)
├── vendor-profile-tab.component.html       # Template with accordion & sidenav outlet
├── vendor-profile-tab.component.scss       # Styles for sections, rows, accordion
├── vendor-profile-form.component.ts        # Form drawer (create/edit mode, section-aware)
└── vendor-profile-form.component.html      # Reactive form with section-specific fields

src/app/shared/components/
├── profile-item-row/                       # Optional: extracted row component for list items
│   ├── profile-item-row.component.ts       # Single row with actions, status chip
│   └── profile-item-row.component.html
```

### Pattern 1: Accordion with Section Grouping (from vetting-tab)
**What:** Multiple expansion panels, one per section. Each panel header shows section name + item count + expired badge (D-03).
**When to use:** When you need to organize items by category with collapse/expand state.
**Example:**
```typescript
// Source: src/app/pages/engagements/tabs/vetting-tab.component.ts (lines 57-63)
readonly insuranceItems = computed(() =>
  this.items().filter(i => i.section === 'insurance'),
);

readonly expiredCount = computed(() =>
  this.items().filter(i => this.isExpired(i)).length,
);

// In template:
// <mat-expansion-panel>
//   <mat-expansion-panel-header>
//     <mat-panel-title>
//       Insurance ({{ insuranceItems().length }} items)
//       @if (expiredCount() > 0) {
//         <mat-chip>⚠ {{ expiredCount() }} expired</mat-chip>
//       }
//     </mat-panel-title>
//   </mat-expansion-panel-header>
```

### Pattern 2: Side Drawer for CRUD Forms (new, adapting vetting-item-dialog)
**What:** MatSidenavModule sidenav opening from the right when user clicks "Add Item" or "Edit". Same drawer component for both create and edit modes (mode-aware via signal).
**When to use:** When you need a form that doesn't block the underlying list (D-05 decision).
**Example:**
```typescript
// Side drawer orchestration in vendor-profile-tab.component.ts
private sidenavService = inject(SidenavService); // Custom service or signal-based

openAddForm(section: string): void {
  this.formMode.set('create');
  this.selectedSection.set(section);
  this.sidenavOpen.set(true);
}

openEditForm(item: MarketplaceProfileItem): void {
  this.formMode.set('edit');
  this.editingItem.set(item);
  this.sidenavOpen.set(true);
}

// In template:
// <mat-sidenav-container>
//   <mat-sidenav #drawer position="end" [opened]="sidenavOpen()">
//     <app-vendor-profile-form
//       [mode]="formMode()"
//       [item]="editingItem()"
//       [section]="selectedSection()"
//       (save)="onSave($event)"
//       (close)="sidenavOpen.set(false)">
//     </app-vendor-profile-form>
//   </mat-sidenav>
//   <mat-sidenav-content>
//     <!-- Accordion with list here -->
//   </mat-sidenav-content>
// </mat-sidenav-container>
```

### Pattern 3: Reactive Forms with Section-Specific Fields
**What:** A single FormBuilder-based component with conditionally-rendered field groups per section (insurance shows policyNumber/carrier, personnel shows name/title/credentials, etc).
**When to use:** When a single form needs to adapt its layout based on a discriminator field.
**Example:**
```typescript
// Source: Adapt vetting-item-dialog.component.ts pattern
export class VendorProfileFormComponent {
  private fb = inject(FormBuilder);
  private vendorProfileService = inject(VendorProfileService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() section: string = 'corporate_identity';
  @Input() item?: MarketplaceProfileItem;
  @Output() save = new EventEmitter<CreateMarketplaceProfileItemRequest>();
  @Output() close = new EventEmitter<void>();

  form = this.fb.group({
    // Common fields
    name: ['', Validators.required],
    // Section-specific fields rendered via @switch
    // insurance: policyNumber, carrier, coverageAmount, expiresAt
    // personnel: title, credentials, department
  });

  ngOnInit() {
    if (this.mode === 'edit' && this.item) {
      this.form.patchValue(this.item);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = this.mapFormToRequest();
    this.save.emit(data);
  }
}
```

### Pattern 4: Expiration Indicators (computed + ZbResourceStatusComponent)
**What:** A computed signal that categorizes items as active/expired/expiring-soon based on expiresAt field, then renders ZbResourceStatusComponent with appropriate status label and color.
**When to use:** When you need visual warnings for time-sensitive data.
**Example:**
```typescript
// In vendor-profile-tab.component.ts
isExpired(item: MarketplaceProfileItem): boolean {
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt) < new Date();
}

isExpiringSoon(item: MarketplaceProfileItem): boolean {
  if (!item.expiresAt) return false;
  const days = Math.ceil(
    (new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return days > 0 && days <= 30; // D-13: 30-day threshold
}

getStatusLabel(item: MarketplaceProfileItem): string {
  if (this.isExpired(item)) return 'EXPIRED';
  if (this.isExpiringSoon(item)) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

// In template (row component):
// <zb-resource-status
//   [label]="getStatusLabel(item)"
//   [pill]="true"
//   [showDot]="false"
//   size="small" />
```

### Anti-Patterns to Avoid
- **Custom accordion:** Don't build accordion from scratch; MatExpansionModule handles collapse state, animations, and accessibility.
- **Dialog instead of side drawer:** Dialogs are modal and block the list; D-05 explicitly chose side drawer for context.
- **Hardcoded field layouts:** Don't duplicate form fields for each section; use @switch/@if with computed conditions.
- **Manual date handling:** Use MatDatepickerModule; don't build custom date pickers or manual date string parsing.
- **Ignoring ngx-library theme:** All chip colors and status indicators should come from ZbResourceStatusComponent, not custom CSS.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accordion collapse/expand state | Custom state machine with ngFor loops | MatExpansionModule | Handles keyboard nav, animations, multiple panel control. SME Mart vetting-tab already uses this pattern. |
| Form state for create/edit modes | Separate form components per mode | Single component with @Input mode signal and ngOnInit patchValue | Reduces duplication; vetting-item-dialog does this with a "direction" discriminator. |
| Status chip colors (expired/active) | Custom CSS color map in component | ZbResourceStatusComponent with label mapping | ngx-library theme already defines #eed5d1 (cancelled, repurposed as expired). ZbResourceStatusComponent handles uppercasing and color lookup. |
| Side drawer animation/position | Custom transform CSS or jQuery | MatSidenavModule (built into @angular/material) | MatSidenavModule handles slide-in animation, backdrop, close on ESC, and responsive positioning. |
| Date picker for expiresAt | Custom input with date parsing | MatDatepickerModule | Handles keyboard nav, locale formatting, invalid date rejection. Standard in Material apps. |
| Inline delete confirmation | Separate confirmation dialog | Inline row state toggle (show cancel/confirm buttons instead of action menu) | D-09 decision: no popup dialogs; row-level UI is less intrusive. |
| Item count badge in accordion header | Custom computed in component template | Computed signal pre-calculating count per section | Signals are reactive and cache computed values. Template becomes cleaner (just `{{ sectionCount() }}`). |

**Key insight:** All the hard problems (accordion state, form mode switching, status chip styling) have pre-built Angular Material and ngx-library solutions. Phase 10 is UI composition, not custom logic.

## Common Pitfalls

### Pitfall 1: Section Filtering in Template Instead of Computed
**What goes wrong:** Writing `this.items().filter(i => i.section === 'insurance')` directly in template with `@for` — array recreates on every change detection cycle, destroying accordion state.
**Why it happens:** Computed signals are reactive but easy to forget; template filters seem simpler.
**How to avoid:** Define a computed signal per section (or use a computed Map). SME Mart vetting-tab does this correctly (lines 57–63).
**Warning signs:** Accordion panels re-expanding unexpectedly, form losing focus, performance degradation with large item counts.

### Pitfall 2: Mixing Dialog and Side Drawer Patterns
**What goes wrong:** Trying to reuse VettingItemDialogComponent as-is for the profile form. Dialog config (width, position) doesn't translate to sidenav, and MatDialogRef doesn't work with MatSidenavModule.
**Why it happens:** Similar-looking form components; easy to assume one can replace the other.
**How to avoid:** Create a new VendorProfileFormComponent designed for sidenav (no MatDialogRef, no dialog config). Use @Input/@Output instead of dialog data/return.
**Warning signs:** TypeError on MatDialogRef in sidenav context, form not closing after save, modal backdrop blocking interaction.

### Pitfall 3: Forgetting orgId in Service Calls
**What goes wrong:** Calling `vendorProfileService.list()` without passing current orgId. Service is flexible (D-02) and requires explicit orgId; without it, you get no results or wrong org's data.
**Why it happens:** Many services auto-filter by current org. Phase 9 VendorProfileService doesn't.
**How to avoid:** Always pass `getCurrentOrg().id` (or subscribe to it) when calling service methods. See org.component.ts line 76 for the pattern.
**Warning signs:** Empty profile list even after adding items, items appearing for wrong org, console errors about undefined orgId.

### Pitfall 4: Not Normalizing Status String for ZbResourceStatusComponent
**What goes wrong:** Passing `item.status = 'EXPIRED'` or `item.status = 'expired'` to ZbResourceStatusComponent. Component expects uppercase + underscores for enum lookup (e.g., `EXPIRING_SOON`).
**Why it happens:** Field names in domain model might be snake_case or lowercase; status label needs uppercase with underscores.
**How to avoid:** Create a helper function `normalizeStatus(status: string): string` and pass `[label]="normalizeStatus(item.status)"`. SME Mart vetting-tab does this (line 69, 146).
**Warning signs:** Status chip showing blank or wrong color, console errors about unknown status in ZbResourceStatusComponent.

### Pitfall 5: Inline Delete Confirmation Blocking User Interaction
**What goes wrong:** Implementing D-09 (inline confirmation) by replacing the entire row with "Are you sure?" buttons. User can't click away to cancel; row becomes hard to interact with.
**Why it happens:** Misinterpreting D-09 as a full row replacement instead of a state toggle on the action menu.
**How to avoid:** Toggle a `confirmingDelete` signal on the item row. Keep the row visible, replace the [matMenuTriggerFor] action menu with a cancel/confirm inline button pair. User can click elsewhere or press ESC to cancel (natural escape route).
**Warning signs:** User confusion ("how do I get out of this?"), high cancel rate in delete actions, accessibility issues with no escape key.

### Pitfall 6: Status Chip Showing All Fields Instead of Item Count in Header
**What goes wrong:** D-03 says accordion header shows "Insurance (3 items) ⚠ 1 expired". Instead building "Insurance" + full item list in header, making headers massive.
**Why it happens:** Treating accordion header as a compact summary instead of a label.
**How to avoid:** Header shows: section name + count + expired badge. Item list is inside the accordion panel content, not in the header. See vetting-tab lines 41-48 for the pattern.
**Warning signs:** Accordion headers taking up half the screen, hard to read, looks cluttered.

## Code Examples

Verified patterns from official sources:

### Accordion with Computed Section Arrays
```typescript
// Source: src/app/pages/engagements/tabs/vetting-tab.component.ts (lines 57-63)
readonly buyerRequires = computed(() =>
  this.items().filter(i => i.direction === 'buyer_requires'),
);

readonly providerRequires = computed(() =>
  this.items().filter(i => i.direction === 'provider_requires'),
);

// In template:
// <mat-accordion multi>
//   @for (item of buyerRequires(); track item.id) {
//     <mat-expansion-panel>...</mat-expansion-panel>
//   }
// </mat-accordion>
```

### Reactive Form with Conditional Fields
```typescript
// Source: src/app/shared/components/vetting-item-dialog/vetting-item-dialog.component.ts (lines 50-87)
const form = this.fb.group({
  name: ['', Validators.required],
  description: [''],
  category: ['', Validators.required],
  vetting_type: ['', Validators.required],
  evidence_type: ['', Validators.required],
});

// For profile form, adapt to:
const form = this.fb.group({
  name: ['', Validators.required],
  expiresAt: [''], // Optional date field
  // Section-specific conditionals:
  // @switch (section())
  //   @case ('insurance') { policyNumber, carrier, coverageAmount }
  //   @case ('personnel') { title, credentials, department }
});
```

### Status Chip with Color Mapping
```typescript
// Source: src/app/pages/engagements/tabs/vetting-tab.component.ts (line 69)
// In vetting-tab template:
<zb-resource-status [label]="normalizeStatus(item.status)" [pill]="true" [showDot]="false" size="small" />

// For profile, adapt to:
<zb-resource-status
  [label]="getStatusLabel(item)"
  [pill]="true"
  [showDot]="false"
  size="small"
  [class.expired]="isExpired(item)">
</zb-resource-status>

// Component method:
getStatusLabel(item: MarketplaceProfileItem): string {
  if (this.isExpired(item)) return 'EXPIRED';
  if (this.isExpiringSoon(item)) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

isExpired(item: MarketplaceProfileItem): boolean {
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt) < new Date();
}
```

### Sidenav + Form Pattern (adapting dialog pattern)
```typescript
// In vendor-profile-tab.component.ts:
readonly sidenavOpen = signal(false);
readonly formMode = signal<'create' | 'edit'>('create');
readonly selectedSection = signal('');
readonly editingItem = signal<MarketplaceProfileItem | null>(null);

openAddForm(section: string): void {
  this.formMode.set('create');
  this.selectedSection.set(section);
  this.editingItem.set(null);
  this.sidenavOpen.set(true);
}

openEditForm(item: MarketplaceProfileItem): void {
  this.formMode.set('edit');
  this.editingItem.set(item);
  this.sidenavOpen.set(true);
}

async onFormSave(request: CreateMarketplaceProfileItemRequest): Promise<void> {
  try {
    if (this.formMode() === 'create') {
      await this.vendorProfileService.create(this.currentOrgId(), request);
    } else {
      const itemId = this.editingItem()?.id;
      if (itemId) {
        await this.vendorProfileService.update(itemId, request);
      }
    }
    await this.loadItems();
    this.sidenavOpen.set(false);
  } catch (err) {
    this.snackBar.open('Failed to save profile item', 'OK');
  }
}

// In template:
<mat-sidenav-container class="profile-container">
  <mat-sidenav #drawer position="end" [opened]="sidenavOpen()">
    <app-vendor-profile-form
      [mode]="formMode()"
      [section]="selectedSection()"
      [item]="editingItem()"
      (save)="onFormSave($event)"
      (close)="sidenavOpen.set(false)">
    </app-vendor-profile-form>
  </mat-sidenav>
  <mat-sidenav-content>
    <!-- Accordion sections here -->
  </mat-sidenav-content>
</mat-sidenav-container>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Modal dialogs for all forms (vetting-item-dialog) | Side drawer for context preservation (D-05) | Phase 10 decision | Keeps section list visible while editing; reduces context loss for users managing multiple items |
| Manual section grouping with nested loops | Computed signals per section (Angular 21 pattern) | Angular 21 signals introduction | Better performance (memoized), cleaner templates, reactive by default |
| Custom accordion state machine | MatExpansionModule (Material standard) | Material maturity | Keyboard nav, animations, A11y built-in; SME Mart established this in vetting-tab |
| `*ngIf` / `*ngFor` control flow | `@if` / `@for` (Angular 21 syntax) | Angular 21 default | Cleaner syntax, slightly better performance, less verbose templates |

**Deprecated/outdated:**
- Using MatDialog for side-panel forms — D-05 explicitly chose sidenav for this phase
- Form dialogs without mode awareness — vetting-item-dialog proves the mode pattern works

## Validation Architecture

**Test Framework**
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.8 |
| Config file | vitest.config.ts (in project root) |
| Quick run command | `npm test -- vendor-profile-tab.component.spec.ts --run` |
| Full suite command | `npm test` |

**Phase Requirements → Test Map**
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VPU-01 | Corporate Profile tab visible on /org page | Component | `npm test -- vendor-profile-tab.spec.ts --run` | ❌ Wave 0 |
| VPU-02 | Tab displays items organized by 6 sections (accordion) | Component + visual | `npm test -- vendor-profile-tab.spec.ts --run` | ❌ Wave 0 |
| VPU-03 | User can add new profile item via side drawer | Component + integration | `npm test -- vendor-profile-form.spec.ts --run` | ❌ Wave 0 |
| VPU-04 | User can edit existing profile item | Component + integration | `npm test -- vendor-profile-form.spec.ts --run` | ❌ Wave 0 |
| VPU-05 | User can delete profile item with inline confirmation | Component | `npm test -- vendor-profile-tab.spec.ts --run` | ❌ Wave 0 |
| VPU-06 | Expired items display with visual indicator (status chip) | Component | `npm test -- vendor-profile-tab.spec.ts --run` | ❌ Wave 0 |
| VPU-07 | Expired items show "updated version needed" checklist prompt | Component | `npm test -- vendor-profile-tab.spec.ts --run` | ❌ Wave 0 |

**Sampling Rate**
- **Per task commit:** `npm test -- --run --include "**/vendor-profile*.spec.ts"` (unit tests only)
- **Per wave merge:** `npm test` (full suite including integration tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

**Wave 0 Gaps**
- [ ] `tests/vendor-profile-tab.component.spec.ts` — accordion rendering, item filtering, expiration logic
- [ ] `tests/vendor-profile-form.component.spec.ts` — form mode switching, create/edit payload generation, validation
- [ ] `tests/vendor-profile-tab.integration.spec.ts` — service integration, save/delete round-trips
- [ ] Form fixtures — sample profile item data for section types (insurance, personnel, etc.)

## Environment Availability

**Step 2.6: SKIPPED** — Phase 10 is purely UI/component code consuming the existing VendorProfileService (Phase 9). No external dependencies (databases, CLIs, services) are required at runtime. All integration happens through the service layer which already connects to GraphQL and Pipeline.

## Open Questions

1. **Form layout per section type**
   - What we know: 6 sections (corporate_identity, attestation, insurance, reference, personnel, financial) each with different fields (Phase 8 + 9 context).
   - What's unclear: Exact field names, required/optional status, validation rules, and order per section (marked as Claude's discretion in D-04 to D-08).
   - Recommendation: Review Phase 9 section data interfaces (MarketplaceProfileItem models) to determine field shapes. Insurance might need policyNumber, carrier, coverageAmount, effectiveDate, expirationDate. Personnel might need title, credentials, department. Build form fields from the interface shapes defined in Phase 9.

2. **"Updated version needed" checklist prompt (VPU-07)**
   - What we know: Expired items should trigger a checklist prompt suggesting the vendor update the item (Success Criteria SC-6).
   - What's unclear: Is this a toast notification, a card UI element, or a separate checklist component? Should it be interactive or informational?
   - Recommendation: Implement as a dismissible card at the top of the accordion (above sections) that lists expired items and offers quick-edit buttons. Makes it discoverable without being modal.

3. **Side drawer width and animation**
   - What we know: D-05 chose side drawer for context preservation.
   - What's unclear: Exact width (400px? 500px? percentage?), animation duration, backdrop behavior (should clicking backdrop close the drawer?).
   - Recommendation: Default to 400px min-width with optional resize handle (SME Mart has a ResizableDrawerDirective already). Backdrop should close on click (Material default). Allow ESC key to close (Material standard).

4. **Section ordering in accordion**
   - What we know: 6 sections exist.
   - What's unclear: Display order (alphabetical, logical grouping, custom priority?).
   - Recommendation: Use a constant order array (e.g., SECTION_ORDER = ['corporate_identity', 'attestation', 'insurance', 'personnel', 'financial', 'reference']) to control accordion order. Makes it easy to adjust if business priority changes.

## Sources

### Primary (HIGH confidence)
- Context7: Angular Material expansion panels, sidenav component documentation
- Official docs: @angular/material MatExpansionModule, MatSidenavModule APIs
- SME Mart codebase: vetting-tab.component.ts (accordion pattern), vetting-item-dialog.component.ts (form pattern), org.component.ts (tab routing)
- Phase 9 CONTEXT.md: VendorProfileService interface and field mappings
- Phase 10 CONTEXT.md: Design decisions D-01 through D-20

### Secondary (MEDIUM confidence)
- SME Mart CLAUDE.md: Angular 21 conventions, ngx-library component patterns
- sme-mart-architect.md skill: Standalone components, reactive forms, signals, Material integration

### Tertiary (verified, design-level)
- Phase 8 CONTEXT.md: MarketplaceProfileItem entity design, section discriminator, data field
- REQUIREMENTS.md: VPU-01 through VPU-07 success criteria

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — All components are established (Material, ngx-library, vetting-tab pattern already ships in app)
- Architecture: HIGH — Patterns are proven (accordion from vetting-tab, forms from vetting-item-dialog, side drawer from Material)
- Pitfalls: MEDIUM-HIGH — Based on extrapolation from similar components; some pitfalls are hypothetical but grounded in common Angular mistakes
- Implementation details (form fields per section, exact side drawer width): MEDIUM — Requires reading Phase 9 model interfaces; unclear parts flagged as "Open Questions"

**Research date:** 2026-04-01
**Valid until:** 2026-04-15 (stable domain; Angular Material and ngx-library are mature)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VPU-01 | Corporate Profile tab visible on `/org` (current org only) page | Org tab routing established in org.routes.ts; new tab entry added to OrgPage.tabs array; lazy-loaded component like other tabs (documents, engagements, projects, members, settings) |
| VPU-02 | Tab displays profile items organized by 6 sections with visual grouping | MatExpansionModule accordion pattern proven in vetting-tab; computed signals per section (insurable items, personnel items, etc.) filter from master array; header shows section name + item count + expired badge (D-03) |
| VPU-03 | User can add new profile item to any section via form/modal | MatSidenavModule side drawer (right panel) with VendorProfileFormComponent in create mode; "Add Item" button on each accordion header triggers drawer; section discriminator passed to form |
| VPU-04 | User can edit existing profile items with changes reflected in UI within 2-3s | Form drawer in edit mode with @Input item pre-fill; onSubmit calls vendorProfileService.update(); optimistic update via item array refresh after service call returns |
| VPU-05 | User can delete profile item with confirmation | Inline confirmation (D-09): row-level state toggle replaces action menu with "Cancel / Delete" buttons; no modal dialog required |
| VPU-06 | Expired items display with visual indicator (color, badge) | Computed isExpired() method checks expiresAt < today; ZbResourceStatusComponent renders "EXPIRED" chip with #eed5d1 color from ngx-library theme; row stays visible (not hidden) |
| VPU-07 | Expired items auto-generate "updated version needed" checklist prompt | Card UI above accordion listing expired items with quick-edit buttons; appears when any item.expiresAt < today; remains visible until items are updated or dismissed |

---

*Phase: 10-vendor-profile-ui*
*Research completed: 2026-04-01*
