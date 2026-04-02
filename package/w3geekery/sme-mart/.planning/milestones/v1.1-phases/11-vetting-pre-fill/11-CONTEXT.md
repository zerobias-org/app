# Phase 11: Vetting Pre-Fill - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Suggestion panel on the engagement vetting tab — matching vendor profile items to vetting items by section type, attaching them as pointer references (not copies), flagging expired items with renewal prompts, and auto-generating checklist items for expired attachments. This phase bridges the Corporate Profile (Phase 10) with the engagement vetting flow.

</domain>

<decisions>
## Implementation Decisions

### Section-to-VettingType Mapping
- **D-01:** Exact matches only — suggest profile items where `SectionType === VettingType`. Four direct matches: corporate_identity, insurance, reference, financial.
- **D-02:** Non-overlapping types get no suggestions. Attestation/personnel profile items never appear in vetting suggestions. Compliance/legal/certification/documentation vetting types have no profile section match.
- **D-03:** No fuzzy mapping, no configurable mapping table. Clean and predictable.

### Suggestion Panel Placement & UX
- **D-04:** Inline per vetting item — each vetting row gets a "Suggested from Profile" chip/link when matching profile items exist for that vetting_type. Clicking expands a mini-panel below the row showing matching items with "Attach" buttons.
- **D-05:** After attaching, row shows a small "Linked to Profile" chip next to the vetting status chip. Clicking the chip shows the referenced profile item's name and key detail. Vetting status stays independent (still needs reviewer approval).
- **D-06:** One profile item per vetting item (1:1 pointer). Single `profile_item_id` field on `EngagementVettingItem`. To change, detach first then attach a different one.
- **D-07:** Detach action available in the vetting item's action menu ("Detach Profile Item"). Removes the pointer, re-enables suggestion panel for that row.

### Expired Item Handling in Suggestions
- **D-08:** Expired profile items shown in suggestions with EXPIRED chip (red #eed5d1) and warning text: "This item is expired — update your profile first." Vendor CAN still attach expired items.
- **D-09:** When an expired profile item is attached, auto-generate a visual checklist card on the vetting tab: "⚠ [Item Name] is expired — Update in Corporate Profile". Card links to `/org` profile tab. Card auto-dismisses when the profile item is updated (checked on next load via expiresAt comparison).
- **D-10:** Expiring-soon items (within 30 days) shown in suggestions with EXPIRING_SOON chip (amber #ffb74d). Attachable without warning — proactive indicator only.

### Pointer Lifecycle & Staleness
- **D-11:** Auto-reflect on updates — since it's a pointer, the vetting item always shows current profile data. No "updated" indicator needed. If an expired item gets renewed, the EXPIRED warning auto-clears on next load.
- **D-12:** Block deletion of referenced profile items. When vendor tries to delete a profile item from Corporate Profile that is referenced by any vetting item, show: "This item is used in N engagement(s). Detach from vetting first." This requires a reference count check in the delete flow (touches Phase 10 VendorProfileTab delete handler).
- **D-13:** The reference check queries all `EngagementVettingItem` records with `profile_item_id === item.id` across all engagements for the org.

### Carried Forward from Prior Phases
- **D-14:** Pointer-based engagement references via `profile_item_id`, not document copies (Director DECISIONS.md)
- **D-15:** Org-scoped profiles (Director DECISIONS.md)
- **D-16:** Single `MarketplaceProfileItem` entity with section discriminator + JSON data (Phase 8)
- **D-17:** VendorProfileService with full CRUD (Phase 9)
- **D-18:** Corporate Profile tab with accordion sections, expiration indicators (Phase 10)
- **D-19:** VettingService with CRUD and status transitions (existing)

### Claude's Discretion
- Exact positioning of the suggestion mini-panel (below row vs expandable section)
- Suggestion chip styling and icon choice
- "Linked to Profile" chip click behavior (tooltip vs popover vs navigate)
- Checklist card styling and dismiss animation
- Reference count query implementation (GQL filter vs service method)
- Loading states for suggestion panel (fetching profile items)
- Whether to preload all profile items on tab init or lazy-load per vetting item expansion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Director Design Context
- `.planning/director/DECISIONS.md` — Pointer-based references, org-scoped profiles, engagement-specific docs stay engagement-scoped
- `.planning/director/SESSION-STATE.md` — Mental model for vendor profile + vetting integration

### Phase Dependencies (direct)
- `.planning/phases/09-vendor-profile-service/09-01-SUMMARY.md` — VendorProfileService implementation details
- `.planning/phases/10-vendor-profile-ui/10-CONTEXT.md` — Corporate Profile tab decisions, expiration treatment
- `.planning/phases/10-vendor-profile-ui/10-01-SUMMARY.md` — Phase 10 implementation details

### Vetting System (integration point)
- `src/app/pages/engagements/tabs/vetting-tab.component.ts` — Current vetting tab: accordion grouping, status chips, dialog CRUD. THIS IS THE FILE TO MODIFY.
- `src/app/pages/engagements/tabs/vetting-tab.component.html` — Current vetting tab template
- `src/app/core/services/vetting.service.ts` — VettingService with CRUD operations
- `src/app/core/models/vetting-item.model.ts` — EngagementVettingItem model, VettingType enum, VettingStatus types
- `src/app/shared/components/vetting-item-dialog/vetting-item-dialog.component.ts` — Existing vetting item CRUD dialog

### Vendor Profile System (data source)
- `src/app/core/services/vendor-profile.service.ts` — VendorProfileService to query profile items
- `src/app/core/models/marketplace-profile-item.model.ts` — MarketplaceProfileItem model, SectionType enum
- `src/app/pages/org/tabs/vendor-profile-tab.component.ts` — Delete flow needs reference check (D-12)

### UI Components
- `ZbResourceStatusComponent` from `@zerobias-org/ngx-library` — Status chips for EXPIRED/EXPIRING_SOON states

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VendorProfileService.listProfileItems(orgId)` — Returns all profile items for an org, already parses JSON data
- `ZbResourceStatusComponent` — Color-coded status chips, already used in both vetting and profile tabs
- `VettingService` — Full CRUD for vetting items, status transitions
- `EngagementContextService` — Provides current engagement context (engagement ID, org ID)
- Expiration helpers from vendor-profile-tab (`isExpired()`, `isExpiringSoon()`) — reuse or extract to shared utility

### Established Patterns
- Vetting tab: accordion grouping by direction (buyer_requires / provider_requires), status chips, MatDialog for CRUD
- Vendor profile tab: accordion grouping by section, inline delete confirmation, side drawer for forms
- Signal-based state management with computed filtered arrays
- `ChangeDetectionStrategy.OnPush` on all tab components

### Integration Points
- `EngagementVettingItem` model needs new `profile_item_id?: string` field
- `VettingService` needs method to check reference counts (for delete blocking)
- `vetting-tab.component.ts` needs profile item suggestion logic per vetting row
- `vendor-profile-tab.component.ts` delete handler needs reference check before allowing deletion (D-12)
- GQL field mapping in `field-mappings.ts` needs `profile_item_id` mapping (if stored in AuditgraphDB)

</code_context>

<specifics>
## Specific Ideas

- The 4 exact-match mapping (SectionType === VettingType) means the suggestion query is: `vendorProfileService.listProfileItems(orgId).filter(item => item.section === vettingItem.vetting_type)`
- Checklist card for expired attachments should use the same yellow/amber styling as the "Items Needing Attention" renewal card from Phase 10 (consistency)
- "Linked to Profile" chip could use the same `ZbResourceStatusComponent` with a custom label like "PROFILE_LINKED" and a distinct color (e.g., blue #d7e0ee from the in_progress chip color)
- Reference count for delete blocking: query GQL for `EngagementVettingItem` where `profile_item_id` matches, count results. If > 0, block with engagement names listed.
- The `profile_item_id` field on `EngagementVettingItem` may need a schema update (Phase 8-style) if it needs to be in AuditgraphDB. Check if the field can be added to the existing schema class or if it's a Neon-only field.

</specifics>

<deferred>
## Deferred Ideas

- Auto-advance vetting status to "submitted" when profile item attached (decided against — status stays independent)
- Snapshot-on-attach with diff tracking (decided against — pointer is live data)
- Fuzzy mapping table for non-overlapping types (decided against — exact matches only)
- ZB Task generation for expired item renewal (decided against — visual checklist card instead)
- Multi-attachment (multiple profile items per vetting item) — single pointer for now

</deferred>

---

*Phase: 11-vetting-pre-fill*
*Context gathered: 2026-04-01*
