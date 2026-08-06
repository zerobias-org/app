/**
 * GQL Response Types for OrgProfile entity
 *
 * 1:1 typed company profile for a platform Org (orgId unique). Replaces the
 * section-discriminated MarketplaceProfileItem blob retired in smemart 2.0.7 —
 * every section is now a real column on one row.
 *
 * Read name/avatar/slug from the platform Org, not from here.
 */

/**
 * GQL response type for OrgProfile.
 *
 * Field list mirrors `classes/OrgProfile.yml` in the w3geekery/smemart schema
 * package at 2.0.7. `extends: [Object, Verifiable]` supplies the inherited
 * fields below.
 */
export interface GqlOrgProfileResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // OrgProfile-specific fields
  orgId: string;                          // UUID of the platform Org (unique — 1:1)
  legalName?: string | null;              // registered legal entity name
  dba?: string | null;                    // doing-business-as / trade name
  tagline?: string | null;                // short marketing tagline (<= 200 chars)
  shortDescription?: string | null;       // plain-text summary (<= 500 chars)
  longDescription?: string | null;        // markdown long-form description
  website?: string | null;                // primary website URL
  logoUrl?: string | null;                // company logo image URL
  employeeCount?: string | null;          // orgProfile.employeeCount enum key (BAND_*)
  businessClassification?: string | null; // orgProfile.businessClassification enum key
  foundedYear?: number | null;            // year founded; years-in-business derived on read
  primaryContactUserId?: string | null;   // UUID of a member User; name/email resolved on read

  // Verifiable
  verified?: boolean | null;
  verificationSource?: string | null;

  // Timestamps (Object base class)
  dateCreated?: string | null;
  dateLastModified?: string | null;
  dateDeleted?: string | null;
}
