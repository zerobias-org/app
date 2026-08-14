/**
 * VendorListing - a seller's marketplace listing.
 *
 * Replaces the retired ServiceOffering class (smemart 2.0.8). Shape transcribed from
 * schema/package/w3geekery/smemart/classes/VendorListing.yml and the generated
 * ts/src/class/VendorListing.ts, NOT from a planning doc.
 *
 * NO MONEY IS STORED HERE. Pricing lives in the Ledger; `offers` carries pointers.
 * The retired ServiceOffering.price / .pricing_type have no successor field on this
 * class by design - do not reintroduce them.
 *
 * The wire type (GqlVendorListingResponse) declares every field optional because the
 * generated class does. This app-side model is deliberately stricter: the mapper fills
 * defaults so consumers do not each re-handle absence.
 */

/** What kind of thing a listing is, which determines how it is delivered. */
export type VendorListingFamily = 'SERVICE' | 'LICENSED_GOOD' | 'PRODUCTIZED';

/** Sub-type within a family. Each value belongs to exactly one family. */
export type VendorListingKind =
  | 'BESPOKE_SERVICE'
  | 'FRAMEWORK'
  | 'ASSESSOR_LOGIC'
  | 'BOM'
  | 'FEATURE_PACK'
  | 'APP'
  | 'AGENT';

/** How a purchased listing is delivered. Paired to family, validated on write. */
export type VendorListingFulfillment = 'ENGAGEMENT' | 'ENTITLEMENT_GRANT';

/** Editorial state. Distinct from `active`, which is buyer visibility. */
export type VendorListingLifecycle = 'DRAFT' | 'LISTED' | 'SUSPENDED' | 'RETIRED';

/** Pointer to a Ledger Offer that prices this listing, plus a display label. */
export interface OfferRef {
  offerId: string;
  label: string | null;
}

/** Pointer to the terms governing this listing, plus a display label. */
export interface TermsRef {
  termsId: string;
  label: string | null;
}

export interface VendorListing {
  id: string;
  /** UUID of the vendor Org that owns this listing. Was ServiceOffering.provider_id. */
  ownerId: string | null;
  family: VendorListingFamily;
  kind: VendorListingKind;
  title: string;
  /** Was ServiceOffering.description. */
  summary: string | null;
  /** UUID of the Catalog entry this listing is about; null for pure-bespoke. */
  catalogRef: string | null;
  fulfillment: VendorListingFulfillment;
  lifecycle: VendorListingLifecycle;
  /** Buyer visibility. Was ServiceOffering.is_active. */
  active: boolean;
  offers: OfferRef[];
  terms: TermsRef | null;
  /** Free-text listing copy. Was ServiceOffering.includes (a string[]). */
  includesSummary: string | null;
  deliveryTime: string | null;
  /** Free-text listing copy. Was ServiceOffering.requirements. */
  prerequisitesSummary: string | null;
  /** Monotonic; bumps on any buyer-visible edit so a buyer can prove what they bought. */
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Resolved on read for display; not stored on the class. Was provider_display_name. */
  ownerDisplayName?: string;
}

/**
 * family -> fulfillment is a load-bearing pairing that the schema cannot enforce.
 * The app's write path owns this validation (VendorListing.yml:18-22).
 */
export const FULFILLMENT_BY_FAMILY: Record<VendorListingFamily, VendorListingFulfillment> = {
  SERVICE: 'ENGAGEMENT',
  LICENSED_GOOD: 'ENTITLEMENT_GRANT',
  PRODUCTIZED: 'ENTITLEMENT_GRANT',
};

/** Each kind belongs to exactly one family (vendorListing.kind.yml). */
export const FAMILY_BY_KIND: Record<VendorListingKind, VendorListingFamily> = {
  BESPOKE_SERVICE: 'SERVICE',
  FRAMEWORK: 'LICENSED_GOOD',
  ASSESSOR_LOGIC: 'LICENSED_GOOD',
  BOM: 'LICENSED_GOOD',
  FEATURE_PACK: 'LICENSED_GOOD',
  APP: 'PRODUCTIZED',
  AGENT: 'PRODUCTIZED',
};

export const KINDS_BY_FAMILY: Record<VendorListingFamily, VendorListingKind[]> = {
  SERVICE: ['BESPOKE_SERVICE'],
  LICENSED_GOOD: ['FRAMEWORK', 'ASSESSOR_LOGIC', 'BOM', 'FEATURE_PACK'],
  PRODUCTIZED: ['APP', 'AGENT'],
};

/** Resolve the fulfillment a family requires. Use on every write path. */
export function fulfillmentFor(family: VendorListingFamily): VendorListingFulfillment {
  return FULFILLMENT_BY_FAMILY[family];
}
