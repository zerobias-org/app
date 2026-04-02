# Phase 10: Vendor Profile UI - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Corporate Profile tab on the `/org` page — displaying, adding, editing, and deleting `MarketplaceProfileItem` entities across 6 sections, with expiration indicators and renewal prompts. This is the UI layer consuming the VendorProfileService built in Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Section Layout & Grouping
- **D-01:** Accordion panels (MatExpansionModule) — one panel per section (6 total). Matches the vetting tab pattern already in the app.
- **D-02:** All panels collapsed by default. Clean overview showing all 6 section headers with summary info.
- **D-03:** Accordion header shows: section name + item count + expired badge (e.g., "Insurance (3 items) ⚠ 1 expired"). Expired badge only visible when count > 0.
- **D-04:** Inside expanded sections, items displayed as simple list rows — each row with name, key details, status chip, and action menu (edit/delete). Mini-table within the accordion.

### Add/Edit Form Approach
- **D-05:** Side drawer (slide-in panel from the right) for creating and editing items. Keeps the section list visible while working.
- **D-06:** Section-specific form fields — each section gets its own form layout matching the typed interfaces from Phase 9 (InsuranceData shows policy number, carrier, coverage; PersonnelData shows name, title, credentials, etc.).
- **D-07:** Same drawer component for create and edit — mode-aware. Pre-fills fields when editing. Title changes to "Add [Section] Item" vs "Edit [Section] Item".
- **D-08:** "Add Item" button on each section's accordion header triggers the drawer in create mode.

### Delete Behavior
- **D-09:** Inline confirmation on the row — row replaces action menu with "Are you sure? Cancel / Delete" inline. No dialog popup.

### Expiration Visual Treatment
- **D-10:** Expired items use ZbResourceStatusComponent with status chip color change (red/warning chip "EXPIRED" in #eed5d1). Row stays normal, chip changes. Plus a warning icon.
- **D-11:** Expired items show an inline "Renew" action button on the row next to the status chip. Clicking opens the edit drawer pre-filled with current data.
- **D-12:** When viewing an expired item in the side drawer, a notification card appears at the top: "This item expired on [date]. Update with current information." with an "Update Now" CTA.
- **D-13:** Items expiring within 30 days get an amber/yellow "EXPIRING SOON" chip. Proactive warning before actual expiration.

### Empty State & Onboarding
- **D-14:** Brand-new org (all sections empty): Welcome card explaining the 6 profile sections, what each is for, and a "Get Started" button that expands the first section. Removed after first item is added.
- **D-15:** Individual empty sections (org has items elsewhere): Just the "Add [Section] Item" button. No message, minimal approach.

### Carried Forward from Prior Phases
- **D-16:** Single `MarketplaceProfileItem` entity with section discriminator + JSON data (Phase 8 D-01)
- **D-17:** 6 sections: corporate_identity, attestation, insurance, reference, personnel, financial (Phase 8 D-04)
- **D-18:** Org-scoped profiles, not user-scoped (Director DECISIONS.md)
- **D-19:** Section data interfaces typed in Phase 9 models (provisional, may evolve)
- **D-20:** VendorProfileService complete with full CRUD — consume directly from components (Phase 9)

### Claude's Discretion
- Exact form field layout and validation rules per section type
- Side drawer width, animation, and close behavior
- Loading/saving states and optimistic update strategy
- Section ordering (alphabetical, logical grouping, or custom)
- Row action menu details (icon placement, hover states)
- Welcome card design and copy
- 30-day expiration threshold implementation (constant vs configurable)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Org Page (integration point)
- `src/app/pages/org/org.component.ts` — Current org page with tab navigation. New "Corporate Profile" tab must be added here.
- `src/app/pages/org/org.routes.ts` — Routes for org tabs. Add new lazy-loaded route for profile tab.
- `src/app/pages/org/tabs/` — Existing tab components. Follow the same standalone component pattern.

### Service Layer (Phase 9 — direct dependency)
- `src/app/core/services/vendor-profile.service.ts` — VendorProfileService with full CRUD. UI consumes this directly.
- `src/app/core/models/marketplace-profile-item.model.ts` — Domain model + 6 typed section data interfaces (CorporateIdentityData, AttestationData, InsuranceData, ReferenceData, PersonnelData, FinancialData) + Create/Update request types.

### UI Pattern References (closest analogs)
- `src/app/pages/engagements/tabs/vetting-tab.component.ts` — Vetting tab: accordion grouping, status chips, dialog-based CRUD. Closest UI pattern to follow.
- `src/app/pages/org/tabs/documents-tab.component.ts` — Documents tab: toolbar, ZbCustomizableTableComponent, grid/list toggle. Alternative pattern reference.
- `src/app/shared/components/vetting-item-dialog/vetting-item-dialog.component.ts` — VettingItemDialog: form-based CRUD in a dialog. Reference for form patterns (though profile uses side drawer instead).

### ngx-library Components
- `ZbResourceStatusComponent` — Color-coded status chips. Used for expired/active/expiring-soon states.
- `ZbEmptyStateContainerComponent` — Empty state container (available but not needed per D-15).
- `ZbCustomizableTableComponent` — Table component (available if needed for list rows).

### Director Design Context
- `.planning/director/SESSION-STATE.md` — Mental model, design decisions for Plan 041
- `.planning/director/DECISIONS.md` — Locked decisions: single entity, org-scoped, pointer-based references, three-tier org nav

### Phase Context Files
- `.planning/phases/09-vendor-profile-service/09-CONTEXT.md` — Phase 9 decisions, service pattern, field mappings
- `.planning/phases/08-vendor-profile-schema/08-CONTEXT.md` — Phase 8 decisions, schema entity design

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VendorProfileService` — Full CRUD service ready for consumption (Phase 9)
- `ZbResourceStatusComponent` — Status chip with color coding (used in vetting tab)
- `MatExpansionModule` — Angular Material accordion (used in vetting tab)
- `MatDialog` / side drawer — Standard Material patterns
- Typed section data interfaces — 6 interfaces already defined with field shapes

### Established Patterns
- Org page tabs: lazy-loaded standalone components via `org.routes.ts`
- Tab component pattern: inject services, use signals for state, ChangeDetectionStrategy.OnPush
- CRUD dialogs: `VettingItemDialogComponent` as reference for form-based CRUD
- Status chips: `ZbResourceStatusComponent` with status string normalization (spaces→underscores, uppercase)
- Grouped lists: `MatExpansionModule` panels with computed filtered arrays (see vetting tab buyer/provider grouping)

### Integration Points
- `org.component.ts` tabs array — add new tab entry: `{ label: 'Corporate Profile', icon: 'business', path: 'profile' }`
- `org.routes.ts` — add lazy-loaded route for new profile tab component
- `ZerobiasClientApp.getCurrentOrg()` — provides current org ID for scoping VendorProfileService queries

</code_context>

<specifics>
## Specific Ideas

- Vetting tab is the closest UI analog — follow its accordion/grouping pattern but with side drawer instead of dialog
- The 6 section data interfaces are marked `@provisional` — Phase 10 can evolve field shapes if the form UX demands it
- Status chip colors from ngx-library: use existing ZB task-status chip colors (done `#d8ecba`, cancelled `#eed5d1`) mapped to active/expired states
- "Renew" inline button on expired rows should open the edit drawer with all current data pre-filled — user updates the changed fields and saves as an update (not a new item)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-vendor-profile-ui*
*Context gathered: 2026-04-01*
