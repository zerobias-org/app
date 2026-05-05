---
id: "027"
priority: medium
scope: sme-mart + platform auth (TBD with Kevin)
effort: large
found: 2026-05-05
status: open
promoted_to: null
---

# Personnel-level identity assurance: government ID validation + background-check integration + third-party verification provider evaluation

## Context

Brian raised in the 2026-05-05 marketplace meeting that the platform must support deep personnel-level vetting because "this is a risk marketplace, not just a marketplace" — citing real-world incidents where contractors registered under false personae turned out to be nation-state agents. He wants to "know everything" about every person working on every project: real name, validated government ID on file, background check, credentials, the full picture.

## What already exists (do NOT duplicate)

The bulk of personnel/corporate vetting is already modeled and shipping:

- **`MarketplaceProfileItem`** (Plan 041 / Phase 9) — `src/app/core/models/marketplace-profile-item.model.ts` — has 6 section types including `personnel` with `PersonnelData` (name, title, years experience, specialization, credentials, certifications). Also `corporate_identity`, `attestation`, `insurance`, `reference`, `financial`.
- **`EngagementVettingItem`** (Plan 063) — `src/app/core/models/vetting-item.model.ts` — full vetting-flow lifecycle (`not_started → submitted → under_review → verified → rejected → expired → waived`), bidirectional (buyer/provider requirements), evidence types (`document`, `form`, `certification`, `attestation`, `reference`), `verified_by` / `verified_at` / `expires_at` audit fields.
- **DECISIONS.md "Engagement vetting items reference org profile items via `profile_item_id`. No document copies."** — wiring established.
- **UI:** `vetting-suggestion-panel.component.ts`, `vetting-tab.component.ts`, `vetting-item-dialog/`, `vetting.service.ts` — surfaces all live.

This backlog item is a NARROW EXTENSION of that work, not a replacement.

## The actual gaps

1. **Per-person government ID field on `PersonnelData`** — currently captures professional metadata (credentials, certifications) but no `governmentIdRef` / `idVerifiedAt` / `idVerificationProvider`. `corporate_identity` covers entity ID, not person ID.
2. **Background-check integration** — vetting items today are manually verified (a human marks `status: 'verified'`). No third-party background-check service is integrated.
3. **Identity assurance at sign-up** — TBD with Kevin: does platform auth (Dana / Auth0 / whatever underlies it) already provide person-level identity assurance, or is identity proof entirely on the application side? This determines whether sme-mart needs a sign-up-time identity step or whether it inherits one.

## Buy-vs-build: third-party identity & background-check providers to evaluate

Almost certainly the right call is **buy, not build** — identity verification and background checks are regulated, liability-laden, and dominated by specialized providers. Initial candidate list (research phase to short-list):

**Identity verification (gov ID + selfie + liveness):**
- Persona — pay-per-verification, embeddable
- Onfido — strong international gov-ID coverage
- Jumio — enterprise tier, KYC-grade
- Stripe Identity — easy integration if already on Stripe
- ID.me — strong US gov-trust signal (already used by IRS, VA, state DMVs); fits "government grade" framing

**Credential / badge verification:**
- Credly — issues + verifies professional credentials/badges; could replace or augment freeform `credentials: string[]` on `PersonnelData`
- Accredible — similar
- LinkedIn Verified Skills (less authoritative but free signal)

**Background checks:**
- Checkr — API-first, modern
- HireRight — enterprise standard
- Sterling — enterprise standard
- GoodHire — small-business friendly

**Comparison axes for the eventual spike:**
- Coverage (US-only vs international; which gov IDs supported)
- Webhook + verification-token model (we want proof-of-verification we can store on `PersonnelData`, not have to re-call)
- Pricing tier (per-verification vs subscription)
- Compliance (SOC 2, GDPR, the "government grade" framing)
- Integration complexity (hosted UI vs SDK)

## Why now

- Brian's 2026-05-05 framing makes this load-bearing for product positioning, not just nice-to-have
- The MPI / vetting foundation exists and the gaps are narrow — easier to extend now than after more dependencies pile on
- Buy-vs-build research has lead time (vendor demos, pricing, security review) — capturing now so the research can start before the actual implementation is scheduled

## Blocked by

- Kevin clarification on what platform auth (Dana / Auth0) currently provides for identity assurance — determines sme-mart vs platform scope of #3 above
- Brian alignment on which "verified" badges to expose in marketplace UI (transparency surface design)

## See

- `.planning/notes/meetings/2026-05-05-marketplace.md` — meeting context
- `src/app/core/models/marketplace-profile-item.model.ts` — existing personnel section
- `src/app/core/models/vetting-item.model.ts` — existing vetting flow
- DECISIONS.md "Engagement vetting items reference org profile items via `profile_item_id`"
