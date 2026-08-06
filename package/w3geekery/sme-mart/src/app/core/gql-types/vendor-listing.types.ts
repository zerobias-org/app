/**
 * GQL Response Types for the VendorListing entity.
 *
 * Transcribed from the generated class in the shipped schema package
 * (schema/package/w3geekery/smemart/ts/src/class/VendorListing.ts, smemart 2.0.8).
 *
 * EVERY FIELD EXCEPT id/name IS OPTIONAL ON THE WIRE - the generated class declares
 * them that way. Do not tighten these to match the app-side VendorListing model; the
 * mapper is what closes the gap.
 */

/** Ledger Offer pointer + display label. Carries no money. */
export interface GqlOfferRef {
  offerId?: string;
  label?: string | null;
}

/** Terms pointer + display label. */
export interface GqlTermsRef {
  termsId?: string;
  label?: string | null;
}

export interface GqlVendorListingResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;
  tag?: Array<{ value: string }> | null;
  dateCreated?: string | null;
  dateLastModified?: string | null;

  // VendorListing-specific fields
  ownerId?: string | null;
  family?: string | null;
  kind?: string | null;
  title?: string | null;
  summary?: string | null;
  catalogRef?: string | null;
  fulfillment?: string | null;
  lifecycle?: string | null;
  active?: boolean | null;
  offers?: GqlOfferRef | GqlOfferRef[] | null;
  terms?: GqlTermsRef | null;
  includesSummary?: string | null;
  deliveryTime?: string | null;
  prerequisitesSummary?: string | null;
  version?: number | null;
  publishedAt?: string | null;
}
