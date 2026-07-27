# U3 Spec — SellerAttestation (typed seller cluster + real migration)

**Owner:** zb-org-app (app-repo director) · **Unit:** MP-U3 (per Parks' `mp-d1-marketplace-decomposition.md`) · **Date:** 2026-07-27
**Decisions locked with Clark, 2026-07-27** (this thread). **Status:** design pinned; build gated on Phase 31 freeing gsd-plan.
**Inputs:** MP-D1 decomposition (U3) · `mp-d1-marketplace-inventory-2026-07-24.md` (§2.2–2.4, §4) · current `marketplace-profile-item.model.ts` (uat).

---

## Decision summary (locked)

1. **U3 = A — real migration**, not a mock. Build blob → typed classes for real in sme-mart; migrate live rows; re-point consumers. It exercises the typed schema end-to-end so it's a high-fidelity donor for the task-155 platform adoption.
2. **Realization = separate concrete classes sharing a base** (not one polymorphic class). Backend adopts distinct classes (task-155), so we decompose; `SellerAttestation` is the shared **base/concept**, not one mega-table.
3. **Rename** `MarketplaceProfileItem` → the `SellerAttestation` family. "Marketplace" is redundant (the app IS the marketplace); the blob is being decomposed anyway.
4. **`OrgProfile` is split out** — it is identity, not an attestation. Its own 1:1-with-org class (this is the task-155 `OrgProfile`).
5. **Provenance envelope = U4** lives on the `SellerAttestation` base (every attestation carries it).
6. **Personnel is person-centric, named-only** — no anonymous role-coverage entries (those belong to `ProviderRole`).

---

## Model

### The base (shared envelope — carries U4 provenance)

```ts
type SellerAttestationType =
  | 'insurance' | 'client_reference' | 'personnel'
  | 'financial' | 'service_capability';   // 'service_capability' = today's 'attestation' section

type AttestationStatus =
  'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired' | 'waived';

interface SellerAttestationBase {
  id: string;
  orgId: string;                        // seller org, 1:many (scalar today; link TBD at absorption)
  type: SellerAttestationType;
  label: string;
  status: AttestationStatus;
  // provenance — U4:
  verified: boolean;
  verificationSource: string | null;    // 'platform_identity' | 'D&B' | 'manual_review' | 'self' | ...
  verifiedAt: string | null;
  verifiedBy: string | null;            // userId
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### The five concrete flavors (each `extends SellerAttestationBase`)

Payload fields are the **current** section shapes (`marketplace-profile-item.model.ts`, `@provisional`), carried forward verbatim unless noted:

```ts
InsuranceCoverage  { policyNumber, carrier, coverageType, coverageAmount,
                     effectiveDate, expirationDate, limits?, deductible? }
ClientReference    { clientName, contactPerson, email, phone?, projectType,
                     projectDuration, outcome?,
                     contactPrincipalId?: string|null }   // optional link, same pattern as Personnel
Personnel          { name, title, yearsExperience, specialization,
                     credentials?: string[], certifications?: string[],
                     principalId?: string|null,           // 0..1 -> platform Principal (WHO)
                     roleId?: string|null }                // 0..1 -> Catalog Role (WHAT, typed title)
FinancialProfile   { annualRevenue, profitMargin, employeeCount,
                     yearsOperating, revenueGrowth? }
ServiceCapability  { serviceType, yearsExperience, clientCount?,
                     avgProjectDuration?, certifications?: string[], specializations?: string[] }
```

### Split out — `OrgProfile` (NOT a SellerAttestation)

```ts
OrgProfile {                             // 1:1 with org; = task-155 OrgProfile (Cluster A)
  id, orgId,
  legalName, dba?,
  businessClassification,               // 7-enum (D-57)
  employeeCount,                        // band — RECONCILE 5-band (company-info.model.ts) vs 7-band (D-57)
  foundedYear,
  tagline?, shortDescription?, longDescription?, website?, logoUrl?,
  ...+ the SellerAttestationBase provenance envelope (verified/verificationSource/...)
}
```
(`corporate_identity` section → `OrgProfile`. `Address`/`OrgSegment` are the other Cluster-A classes, specced alongside but out of this doc's payload detail.)

---

## Personnel — the identity/role design (locked)

- **Principal answers WHO, Catalog Role answers WHAT.** `principalId` → platform **Principal** (identity); `roleId` → **Catalog Role** (the taxonomy `ProviderRole` FKs to). NOT platform RBAC roles.
- **Named-only (no anonymous role coverage).** A `Personnel` requires a `name` **or** a `principalId`. Anonymous "we have a licensed PE (unnamed)" claims are **not** Personnel — they are `ProviderRole` claims (with credentials). Do not build a second path for them.
- **Do not collapse into `ProviderRole`.** `ProviderRole` (Cluster B, org-level) = "our org can staff role X." `Personnel` = named individuals. A `Personnel.roleId` may *substantiate* a `ProviderRole` claim, but the two stay distinct.
- **Link behavior:**
  - `principalId` set → pre-fill/sync name+title from the Principal; provenance `verificationSource='platform_identity'` (strong).
  - `principalId` null → off-platform named expert; free-text; `verificationSource='self'` until vetted.
- **Population:** "add from your team" picker over OrgMembers (pre-fill + link) as convenience; NOT an auto-synced mirror of the member roster (curation + privacy + off-platform case).
- Same optional-Principal-link pattern applies to `ClientReference.contactPerson` (`contactPrincipalId?`), for consistency.

---

## Migration plan (U3=A — real)

Current state (inventory §2.2–2.3): live seller data is in the `MarketplaceProfileItem` blob (`section` discriminator + `data` JSON string); the typed `Provider*` junction writes are **all stubbed** (`provider-profiles.service.ts:203-256`); `OrgProfile`/`Address`/`OrgSegment` have **no code**.

1. **Land the typed classes** (base + 5 flavors + `OrgProfile`/`Address`/`OrgSegment`) as real sme-mart schema classes (registered in `SME_MART_CLASS_IDS` — closes the inventory §2.2 registry gap for the ones we author).
2. **Build the write path** for the `Provider*` expertise junctions (replace the stubbed throws with real Pipeline writes).
3. **Migrate blob → typed rows:** map each `MarketplaceProfileItem.section` to its typed class; `corporate_identity → OrgProfile`, `insurance → InsuranceCoverage`, etc. Backfill script + verification pass.
4. **Re-point consumers** off the blob onto the typed classes: `vendor-profile-form`, the engagement **vetting tab** (`EngagementVettingItem.profile_item_id` currently → MPI), the provider directory read path.
5. **Deprecate** `MarketplaceProfileItem` (Cluster C SUPERSEDE) once consumers are migrated. Keep the blob readable through the transition.

---

## Contracts / seams (Marketplace *references*, does not re-own — MODEL.md boundary)

- **→ platform Principal** — `Personnel.principalId`, `ClientReference.contactPrincipalId`. Pin the exact FK target (Principal id vs an org-membership id) at spec time. Cross-model contract + a clean dogfood of linking a marketplace record to platform identity.
- **→ Catalog Role** — `Personnel.roleId` (same taxonomy as `ProviderRole.zerobias_role_id`).
- **task-155 tie:** the typed classes authored here are the app-side wiring of the 9 classes task-155 has backend adopting (which are "complete" **platform-side only** today). U3 is the working prototype backend absorbs.

---

## Open / deferred

- **`employeeCount` band reconciliation** (5-band code vs 7-band D-57) — resolve during `OrgProfile` build.
- **`orgId` link vs scalar** — today scalar; whether it becomes a real link is backend's call at absorption (D-58 3-axis: schema=sme-mart, home=deferred).
- **Provenance `verificationSource` vocabulary** — enumerate the allowed sources with U4 (`platform_identity` / `D&B` / `manual_review` / `self` / ...).
- **U4 continuous-assessment engine** — explicitly OUT of sme-mart scope; a platform-service question for Brian/Kevin (see U4 seam note).
- **Exact final class names** — `SellerAttestation` base confirmed; per-flavor names (`InsuranceCoverage`/`ClientReference`/`Personnel`/`FinancialProfile`/`ServiceCapability`) match the task-155 manifest terms; confirm at build kickoff.
