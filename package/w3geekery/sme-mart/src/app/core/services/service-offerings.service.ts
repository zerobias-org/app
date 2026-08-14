import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import {
  fulfillmentFor,
  type OfferRef,
  type TermsRef,
  type VendorListing,
  type VendorListingFamily,
  type VendorListingKind,
  type VendorListingLifecycle,
} from '../models';
import type { GqlOfferRef, GqlVendorListingResponse } from '../gql-types/vendor-listing.types';

/**
 * ServiceOfferingsService - reads and writes VendorListing.
 *
 * The ServiceOffering class was retired in smemart 2.0.8 and replaced by VendorListing.
 * Per Clark's ruling the new shape is PROPAGATED to consumers rather than hidden behind
 * an adapter, so this service now returns VendorListing directly.
 *
 * The service/file name still says "service offerings" - renaming it touches the barrel,
 * four components and their specs, which is outside the handed-off scope. Flagged as a
 * follow-up; the class it reads is VendorListing.
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */

/** Object-inherited + VendorListing-specific fields requested on every read. */
const VENDOR_LISTING_FIELDS: string[] = [
  'id',
  'name',
  'description',
  'ownerId',
  'family',
  'kind',
  'title',
  'summary',
  'catalogRef',
  'fulfillment',
  'lifecycle',
  'active',
  'offers',
  'terms',
  'includesSummary',
  'deliveryTime',
  'prerequisitesSummary',
  'version',
  'publishedAt',
  'dateCreated',
  'dateLastModified',
  'tag',
];

function normalizeOffers(offers: GqlVendorListingResponse['offers']): OfferRef[] {
  if (!offers) return [];
  const list: GqlOfferRef[] = Array.isArray(offers) ? offers : [offers];
  return list
    .filter((o): o is GqlOfferRef & { offerId: string } => !!o?.offerId)
    .map(o => ({ offerId: o.offerId, label: o.label ?? null }));
}

function normalizeTerms(terms: GqlVendorListingResponse['terms']): TermsRef | null {
  if (!terms?.termsId) return null;
  return { termsId: terms.termsId, label: terms.label ?? null };
}

/**
 * Map a GQL response to the app-side model.
 *
 * The wire declares everything optional (the generated class does), so this is where
 * absence is resolved once rather than at every call site.
 *
 * `title` falls back to the Object-inherited `name`: VendorListing carries both, and
 * older rows written before the split populate only `name`.
 */
export function mapGqlToVendorListing(gql: GqlVendorListingResponse): VendorListing {
  return {
    id: gql.id,
    ownerId: gql.ownerId ?? null,
    family: (gql.family as VendorListingFamily | null) ?? 'SERVICE',
    kind: (gql.kind as VendorListingKind | null) ?? 'BESPOKE_SERVICE',
    title: gql.title ?? gql.name ?? '',
    summary: gql.summary ?? gql.description ?? null,
    catalogRef: gql.catalogRef ?? null,
    fulfillment: fulfillmentFor((gql.family as VendorListingFamily | null) ?? 'SERVICE'),
    lifecycle: (gql.lifecycle as VendorListingLifecycle | null) ?? 'DRAFT',
    active: gql.active ?? false,
    offers: normalizeOffers(gql.offers),
    terms: normalizeTerms(gql.terms),
    includesSummary: gql.includesSummary ?? null,
    deliveryTime: gql.deliveryTime ?? null,
    prerequisitesSummary: gql.prerequisitesSummary ?? null,
    version: gql.version ?? 1,
    publishedAt: gql.publishedAt ?? null,
    createdAt: gql.dateCreated ?? '',
    updatedAt: gql.dateLastModified ?? '',
  };
}

/** Map the app-side model back to the GQL write payload. */
export function mapVendorListingToGql(listing: VendorListing): GqlVendorListingResponse {
  return {
    id: listing.id,
    // `name` is the Object-inherited field the platform indexes on; keep it in step with title.
    name: listing.title,
    description: listing.summary,
    ownerId: listing.ownerId,
    family: listing.family,
    kind: listing.kind,
    title: listing.title,
    summary: listing.summary,
    catalogRef: listing.catalogRef,
    fulfillment: listing.fulfillment,
    lifecycle: listing.lifecycle,
    active: listing.active,
    offers: listing.offers,
    terms: listing.terms,
    includesSummary: listing.includesSummary,
    deliveryTime: listing.deliveryTime,
    prerequisitesSummary: listing.prerequisitesSummary,
    version: listing.version,
    publishedAt: listing.publishedAt,
    dateCreated: listing.createdAt,
    dateLastModified: listing.updatedAt,
  };
}

/**
 * Fields a caller supplies when creating a listing.
 *
 * `fulfillment` is absent deliberately - it is derived from `family` via fulfillmentFor(),
 * because the family<->fulfillment pairing is validated on write and is not free to set.
 */
export type NewVendorListing = Pick<VendorListing, 'family' | 'kind' | 'title'> &
  Partial<
    Pick<
      VendorListing,
      | 'summary'
      | 'catalogRef'
      | 'active'
      | 'lifecycle'
      | 'offers'
      | 'terms'
      | 'includesSummary'
      | 'deliveryTime'
      | 'prerequisitesSummary'
    >
  >;

@Injectable({ providedIn: 'root' })
export class ServiceOfferingsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * List all buyer-visible listings.
   * `active` is the buyer-visibility flag; `lifecycle` is editorial state and is not filtered here.
   */
  async listServices(options?: QueryOptions): Promise<PagedResults<VendorListing>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: {
        active: '.eq.true',
      },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlVendorListingResponse>(
      'VendorListing',
      VENDOR_LISTING_FIELDS,
      gqlOptions,
    );

    const items = result.items.map(mapGqlToVendorListing);

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * Get all listings owned by a specific vendor Org.
   * Returns array (no pagination).
   */
  async getServicesByVendor(ownerId: string): Promise<VendorListing[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: { ownerId: `.eq.${ownerId}` },
      pageNumber: 1,
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlVendorListingResponse>(
      'VendorListing',
      VENDOR_LISTING_FIELDS,
      gqlOptions,
    );

    return result.items.map(mapGqlToVendorListing);
  }

  /**
   * Create a new listing and push to Pipeline.
   * Returns the optimistic VendorListing immediately (doesn't wait for GQL indexing).
   */
  async createService(ownerId: string, data: NewVendorListing): Promise<VendorListing> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const active = data.active ?? true;

    const listing: VendorListing = {
      id,
      ownerId,
      family: data.family,
      kind: data.kind,
      title: data.title,
      summary: data.summary ?? null,
      catalogRef: data.catalogRef ?? null,
      // Derived, never caller-supplied - the pairing is validated on write.
      fulfillment: fulfillmentFor(data.family),
      lifecycle: data.lifecycle ?? (active ? 'LISTED' : 'DRAFT'),
      active,
      offers: data.offers ?? [],
      terms: data.terms ?? null,
      includesSummary: data.includesSummary ?? null,
      deliveryTime: data.deliveryTime ?? null,
      prerequisitesSummary: data.prerequisitesSummary ?? null,
      version: 1,
      publishedAt: active ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    const gqlData = mapVendorListingToGql(listing);
    try {
      await this.pipelineWrite.pushEntity(
        'VendorListing',
        gqlData as unknown as Record<string, unknown>,
        [],
        'service-offerings.service:createService',
      );
    } catch (err) {
      this.snackBar.open(
        `Failed to save listing: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return listing;
  }

  /**
   * Update an existing listing and push updates to Pipeline.
   * Returns the optimistic VendorListing immediately.
   *
   * `version` bumps on every update: it is monotonic and pins what a buyer bought, so a
   * buyer-visible edit that did not bump it would silently rewrite history.
   */
  async updateService(serviceId: string, data: Partial<VendorListing>): Promise<VendorListing> {
    // Check write-through cache first, fall back to GQL fetch
    let current = this.pipelineWrite.getCached('VendorListing', serviceId) as GqlVendorListingResponse | null;
    if (!current) {
      current = await this.graphqlRead.getById<GqlVendorListingResponse>(
        'VendorListing',
        serviceId,
        VENDOR_LISTING_FIELDS,
      );
      if (!current) throw new Error(`VendorListing ${serviceId} not found`);
    }

    const listing = mapGqlToVendorListing(current);
    const updated: VendorListing = {
      ...listing,
      ...data,
      // family drives fulfillment; recompute rather than trust a caller-supplied pair.
      fulfillment: fulfillmentFor(data.family ?? listing.family),
      version: listing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    const gqlData = mapVendorListingToGql(updated);
    try {
      await this.pipelineWrite.pushEntity(
        'VendorListing',
        gqlData as unknown as Record<string, unknown>,
        [],
        'service-offerings.service:updateService',
      );
    } catch (err) {
      this.snackBar.open(
        `Failed to update listing: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return updated;
  }

  /**
   * Set a listing's buyer visibility.
   *
   * Turning a listing off maps to lifecycle SUSPENDED, not RETIRED: RETIRED is end-of-life
   * and nothing in the UI expresses end-of-life, whereas "pulled from sale but not dead" is
   * exactly the seller-paused case the enum documents. RETIRED stays reachable only through
   * an explicit retire action, which does not exist yet.
   */
  async setActive(serviceId: string, active: boolean): Promise<VendorListing> {
    return this.updateService(serviceId, {
      active,
      lifecycle: active ? 'LISTED' : 'SUSPENDED',
    });
  }

  /**
   * Delete a listing by pushing a delete to Pipeline.
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('VendorListing', serviceId);
    } catch (err) {
      this.snackBar.open(
        `Failed to delete listing: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }
}
