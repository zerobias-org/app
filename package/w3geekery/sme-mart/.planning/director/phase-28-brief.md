# Phase 28 — Company Profile Review/Confirm Form

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 6–10 hrs
**Repos:** `app/` (SME Mart frontend).
**Origin:** 3P plan onboarding flow. Per DECISIONS.md "Default ZB Engagement is Auto, Invariant" — this form is DECOUPLED from engagement creation (engagement is already created by Phase 27's lazy guard). Phase 28 is pure user-facing data review.

## Goal

On first login, show the authenticated user a form pre-populated with everything ZB platform already knows about their company (from Phase 25's inventory) — they review, edit, confirm. Save writes back to the appropriate SDK targets (MarketplaceProfileItem / equivalent). No fresh data entry; it's a review flow. Non-populatable fields are explicitly flagged as "please provide" instead of blank.

## Architecture

### Starting state
- Phase 25 produced `PLATFORM-DATA-INVENTORY.md` with a pre-fill map: field name → source → pre-fillable yes/no/partial.
- Phase 26 codified `company_info` convention (`COMPANY-INFO-CONVENTION.md`) — the canonical shape for provider/buyer org profiles in the marketplace.
- Phase 27's lazy guard has already ensured the user's Org has a default ZB engagement by the time this form renders.
- Phase 27's onboarding routing sends first-time users HERE before anywhere else.

### Deliverables

1. **Review form component** (`src/app/onboarding/company-profile-form.component.ts` or similar) rendering fields per the `company_info` convention:
   - Legal name, DBA, logo URL, short blurb, long description, primary contact, website, HQ location, years in business, employee-count bucket (exact set per Phase 26 convention).
2. **Pre-fill logic** driven by Phase 25's pre-fill map. For each field, call the mapped SDK/GQL source and populate the form. Show "(pre-filled from platform)" indicator next to auto-filled fields; show "please provide" + a hint next to known-unknown fields.
3. **Save handler** that writes confirmed values back via the appropriate endpoint (MarketplaceProfileItem create/update — exact operation per Phase 25 inventory). If the user made edits, only edited fields get overwritten; un-edited pre-fills are re-confirmed with the same value so we persist explicit user-confirmation state (even if no content changed).
4. **Onboarding-complete marker.** Post-save, set some flag — likely a tag or a dedicated MarketplaceProfileItem field — indicating "this user has completed onboarding for this org." Phase 27's routing reads this flag to decide Phase 28 vs Phase 30 on subsequent logins.
5. **"Skip for now" escape** — user can skip the form and go to Phase 30 anyway. Phase 30 shows a persistent "complete your profile" nudge until they do.
6. **Unit tests** for: pre-fill mapping, save handler writes correct fields, onboarding-complete marker is set post-save, skip-for-now routes to Phase 30 without marking complete.

## Requirements

- **CP-01:** Form renders every field in the `company_info` convention.
- **CP-02:** Pre-fillable fields are populated on form mount from the correct SDK/GQL source per Phase 25 map.
- **CP-03:** Known-unknown fields show a "please provide" indicator + optional hint text.
- **CP-04:** Save writes all confirmed values to the platform via the Phase 25-mapped endpoint(s).
- **CP-05:** Post-save, onboarding-complete marker is set for the current user+org.
- **CP-06:** Skip-for-now escape exists; routes to Phase 30 WITHOUT setting the complete marker.
- **CP-07:** Subsequent logins for a user with complete marker set → Phase 27 routes directly to Phase 30 (never shows this form again unless the user explicitly navigates back to edit).
- **CP-08:** Unit tests cover the four flows (pre-fill, save, skip, repeat-login-skip).

## Dependencies

- Phase 25 `PLATFORM-DATA-INVENTORY.md` (pre-fill map is the critical input).
- Phase 26 `COMPANY-INFO-CONVENTION.md` (field schema).
- Phase 27 routing (delivers first-time users here; reads the complete marker).
- ngx-library components (form fields, buttons, autocomplete — use existing components first per CLAUDE.md).

## Verification

- Fresh test user logs in for the first time → lands on this form → pre-fillable fields auto-populate with real values from their ZB platform data; known-unknowns flagged correctly.
- User edits a pre-filled field → save → fetch via GQL → edited value persists.
- User skips → lands on Phase 30 → on re-login, back to this form (skip did not mark complete).
- User fills fully → save → re-login → goes straight to Phase 30 (complete marker honored).
- Per-org LLM-prompt generation (separate future brief) produces follow-up enrichment prompts for the known-unknowns this form surfaces — out of Phase 28 scope, but Phase 28's known-unknown list feeds it.

## Out of scope

- LLM-assisted enrichment of known-unknowns (deferred director brief).
- Document upload / attachment UI (v1.5+).
- Non-profile company-info fields (banking, insurance, compliance attestation, etc. — v1.5+ or separate phase).
- Multi-org company-profile selection (single currentOrg assumed).
- Fully mocking the pre-fill sources in unit tests — integration-level harness handles this.
- Validating the `company_info` convention covers every conceivable future field (convention is extensible; Phase 28 codifies the v1.4 baseline).

## References

- `.planning/director/PLATFORM-DATA-INVENTORY.md` (Phase 25 output — pre-fill map)
- `.planning/director/COMPANY-INFO-CONVENTION.md` (Phase 26 output — field schema)
- DECISIONS.md "Default ZB Engagement is Auto, Invariant, Compliance-Driven" (why this form is decoupled from engagement creation)
- Future: `.planning/director/llm-prompt-generation-for-unpopulatable-fields.md` (consumes the known-unknown list, out of Phase 28 scope)
