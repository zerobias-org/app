# U1 Spec — SellerListing (unified listing primitive)

**Owner:** zb-org-app (app-repo director) · **Unit:** MP-U1 / UAT task-89 · **Date:** 2026-07-27
**Decisions locked with Clark, 2026-07-27** (this thread). **Status:** design draft — **2 open questions for Clark flagged below**; build gated on Phase 31 freeing gsd-plan.
**Inputs:** MP-D1 decomposition (U1, KEYSTONE) · `marketplace/MODEL.md` §1–§3 (the `MarketplaceItem` primitive) · donors `service-offering.model.ts` + `provider.model.ts` (uat).

> **Freshness note:** sme-mart on uat moved past the inventory baseline (`432b19e` → `7cff3ce`; commit `5a707fd` synced uat to fork HEAD `9eb49543`). The seller models were refactored to camelCase and the `Provider*` junctions now **carry `verified`/`verificationSource`** — so the inventory's "no verificationSource anywhere" (§4) is now partly stale; that pair exists on the junctions today. Re-verify field lists at build kickoff.

---

## Decision summary (locked)

1. **Rename `MarketplaceItem` → `SellerListing`.** Coordinated with Parks for MODEL.md lockstep (his keystone primitive). Family: `SellerListing` (sells) · `SellerAttestation` (attests) · `OrgProfile` (identity).
2. **org-as-seller.** `ownerId` = provider **Org** (one-sided, per MODEL.md). "Someone in my org sells" = Personnel attribution on the listing, not individual ownership. Solo practitioner = org-of-one. Person-level ownership deferred.
3. **Covers the whole offering space** — `family` ∈ {service, licensed-good, productized}; spans services + goods + apps/agents ("the Whop", D-53).

---

## Q1 — ProviderProduct is NOT a goods donor  **[LOCKED — Clark 2026-07-27: "don't absorb, this is a different thing"]**

The MP-D1 decomposition + MODEL.md named **`ProviderProduct`** as the goods/licensed-good donor to absorb. Grounding it against code, that was a mislabel:

`ProviderProduct` = `{ orgId, productId→Catalog, proficiencyLevel, yearsExperience, certified, certificationDetails, verified, verificationSource }` — an **expertise junction** (same shape/cluster as `ProviderSkill`/`ProviderFramework`). It means **"our org is certified in Product X,"** not "we sell Product X." No price, no offer, no listing.

**Locked resolution:**
- **`ProviderProduct` is NOT absorbed.** It stays an expertise junction (R3 / Cluster B / task-155 adoption, tied to U3's seller cluster).
- **U1 absorbs `ServiceOffering`** (the one real listing donor — services) into `SellerListing`.
- **licensed-good + productized families are GREENFIELD** — no sme-mart donor exists today; define them on the primitive and mock the authoring. (Matches U2's "largest greenfield" reality — there's no goods-commerce in code at all.)

*Reverses the earlier "absorb ProviderProduct" call + my #330 note to Parks. Correction sent to Parks to fix MODEL.md's R1 donor list + the tracker.*

---

## Model (`SellerListing`, from MODEL.md §1)

```ts
type ListingFamily = 'service' | 'licensed_good' | 'productized';
type ListingKind =
  | 'bespoke_service'                                   // service
  | 'framework' | 'assessor_logic' | 'bom' | 'feature_pack'  // licensed_good
  | 'app' | 'agent';                                   // productized
type Fulfillment = 'engagement' | 'entitlement_grant';
type ListingLifecycle = 'draft' | 'listed' | 'suspended' | 'retired';

interface SellerListing {
  id: string;
  ownerId: string;              // provider ORG (the seller) — one-sided
  family: ListingFamily;
  kind: ListingKind;            // sub-type within family
  title: string;
  summary: string;
  catalogRef?: string | null;   // -> Catalog (what this is ABOUT); optional for pure-bespoke
  fulfillment: Fulfillment;     // paired to family (see table) — validated, not free
  offers: OfferRef[];           // -> Ledger price models; NO money stored here (see Q2)
  terms?: LegalFacet | null;    // per-item legal/terms (ODRL/DPV-shaped); may inherit item-class terms
  lifecycle: ListingLifecycle;
  active: boolean;
  segments?: string[];          // Catalog-backed discovery facets
  verification?: VerificationBadge | null;   // see Q-defer below
  createdAt: string;
  updatedAt: string;
}

interface OfferRef { offerId: string; label?: string | null; }   // pointer only (Ledger owns the money)
```

### family → kind → fulfillment (the load-bearing pairing)

| family | example kind | fulfillment | delivered via |
|---|---|---|---|
| `service` | bespoke_service | **engagement** | Projects houses a buyer→provider engagement (originated on purchase) |
| `licensed_good` | framework, assessor_logic, bom, feature_pack | **entitlement_grant** | Ledger records the entitlement; scope via Boundary/Catalog |
| `productized` | app, agent | **entitlement_grant** | Ledger entitlement + delivery (install/enable) |

`pricing_type` (subscription/fixed/hourly/milestone) is a **Ledger** concern via `offers[]` — NOT a discriminator on the listing. Product-vs-service is `family`.

---

## Donor absorption

| Donor | → | Notes |
|---|---|---|
| **ServiceOffering** (`{title, category, subcategory, pricing_type, price, includes[], is_active, ...}`) | `SellerListing{family:'service', kind:'bespoke_service'}` | The one real listing donor. `price`/`pricing_type` become an `OfferRef` pointer (money → Ledger, Q2); `category`/`subcategory` → `catalogRef`/`segments`; `is_active` → `active`/`lifecycle`. |
| **ProviderProduct** | (NOT absorbed — see Q1) | expertise junction; stays with the seller cluster (U3). |
| licensed_good / productized | greenfield | no donor; define + mock. |

---

## Seams (SellerListing *references*, does not re-own — MODEL.md boundary)

- **→ Catalog** — `catalogRef`, `segments[]` (what the listing is about / discovery facets).
- **→ Ledger** — `offers[]: OfferRef[]` **pointer only**; origination/order-intent is **U2**. See Q2.
- **→ Projects** — `fulfillment='engagement'` ORIGINATES a bilateral buyer→provider engagement (requirement-first, NOT boundary-housed — MODEL.md §2). The engagement itself is U2/Projects, not minted here.

---

## Q2 — the U1 ↔ U2 (Ledger) boundary  **[REFERRED TO PARKS — Clark 2026-07-27: seam/contract owner]**

`offers[]`/`OfferRef` is where U1 (listing, contracts C1+C2) meets U2 (commerce origination, C1). Parks owns the cross-app seam contracts (`tc-mesh-contracts.md`), so the cut is his to define. **My proposed split, sent to Parks for the C1 contract:**
- **U1 builds:** the `offers: OfferRef[]` field + the `OfferRef` **pointer shape** (`offerId` + display `label`), so a listing can *carry* pricing pointers, and the listing-authoring UI can attach them (mocked offer picker).
- **U2 builds:** the actual origination — order-intent emission, the Ledger settlement seam, and engagement/entitlement creation.

So **U1 = the listing carries the pointer; U2 = the pointer acts.** Await Parks' C1 contract ruling before building the `offers[]` write path.

---

## Locked (Clark did not object, 2026-07-27)

- **`fulfillment`** — stored enum, **validated against `family`** (service→engagement; licensed_good/productized→entitlement_grant). Not free-set.
- **`verification: VerificationBadge`** — **derived** from the seller's `SellerAttestation`/expertise + vetting (U3/U4), not a separately-stored badge; keep the field, populate read-through. (Revisit exact derivation at U4.)
- **`terms: LegalFacet`** — define the field; mock a minimal per-item terms ref; the full ODRL/DPV legal facet is its own later cross-cutting design, not U1.

## To-confirm-at-build

- **enum casing** — MODEL.md uses hyphen/space forms; code will use snake/camel. Normalize at build.
- **`ownerId` link vs scalar** — scalar for the prototype; real link is backend's call at absorption (D-58 3-axis).

---

## Build plan (U1, once wave-1 launches)

1. Register `SellerListing` in `SME_MART_CLASS_IDS` (+ `OfferRef` shape).
2. Migrate `ServiceOffering` rows → `SellerListing{service}`; keep ServiceOffering readable through transition, then SUPERSEDE.
3. Mock the **listing-authoring UI** (create/edit a listing across families) — the D-58 artifact backend absorbs.
4. Stamp **MP-U1** on the PR (+ UAT task-89). Wave-1 parallel with U3.
