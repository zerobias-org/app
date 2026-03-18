/**
 * GQL Response Types for ServiceOffering entity
 *
 * ServiceOffering represents a provider's catalog listing in the SME marketplace.
 * Buyers browse and discover providers through service offerings.
 */

/**
 * Pricing type enumeration
 */
export type PricingType = 'fixed' | 'hourly' | 'retainer' | 'variable';

/**
 * GQL ServiceOffering response type
 *
 * Extends Object base class (inherited fields: id, description, tags, links, dates)
 */
export interface GqlServiceOfferingResponse {
  // Object inherited fields
  id: string;
  name: string; // Offering title/name
  description?: string;

  // ServiceOffering-specific fields
  providerId: string;
  category: string;
  subcategory?: string | null;
  pricingType: PricingType;
  price?: string | number | null; // Price or starting price
  deliveryTime?: string | null; // e.g., "2-5 days", "1 week"
  includes?: string[] | null; // Array of service inclusions
  requirements?: string | null; // Prerequisites or requirements text
  isActive: boolean; // Active in catalog

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (ServiceOffering is typically standalone catalog item, minimal nesting)
}
