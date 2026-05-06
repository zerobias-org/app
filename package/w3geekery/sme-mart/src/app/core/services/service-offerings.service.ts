import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { SERVICE_OFFERING_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type { ServiceOffering } from '../models';
import type { GqlServiceOfferingResponse } from '../gql-types';

/**
 * ServiceOfferingsService - FULLY MIGRATED TO PIPELINE (Phase 5)
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Neon service_offerings table archived 2 weeks after Phase 5 completion (2026-04-02).
 * 2-week observation period for production stability verification.
 */
@Injectable({ providedIn: 'root' })
export class ServiceOfferingsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * List all active service offerings.
   * Queries GraphQL with isActive filter, transforms responses to ServiceOffering shape.
   */
  async listServices(options?: QueryOptions): Promise<PagedResults<ServiceOffering>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: {
        isActive: '.eq.true',
      },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
      'ServiceOffering',
      this.getServiceOfferingFields(),
      gqlOptions,
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(
      result.items as (GqlServiceOfferingResponse & { tag?: Array<{ value: string }> | null })[],
    );

    // Transform GQL responses to ServiceOffering (Neon shape)
    const items = filteredGql.map(gql =>
      mapGqlToNeon<ServiceOffering>(gql, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * Get all service offerings by a specific provider.
   * Queries GraphQL with providerId filter, returns array (no pagination).
   */
  async getServicesByProvider(providerId: string): Promise<ServiceOffering[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: { providerId: `.eq.${providerId}` },
      pageNumber: 1,
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
      'ServiceOffering',
      this.getServiceOfferingFields(),
      gqlOptions,
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(
      result.items as (GqlServiceOfferingResponse & { tag?: Array<{ value: string }> | null })[],
    );

    // Transform and return as array
    return filteredGql.map(gql =>
      mapGqlToNeon<ServiceOffering>(gql, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon),
    );
  }

  /**
   * Create a new service offering and push to Pipeline.
   * Returns optimistic ServiceOffering immediately (doesn't wait for GQL indexing).
   */
  async createService(
    providerId: string,
    data: Omit<ServiceOffering, 'id' | 'provider_id' | 'created_at' | 'updated_at'>,
  ): Promise<ServiceOffering> {
    // Generate UUID for new offering
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Build Neon-shaped ServiceOffering
    const offering: ServiceOffering = {
      id,
      provider_id: providerId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      subcategory: data.subcategory ?? null,
      pricing_type: data.pricing_type,
      price: data.price ?? null,
      delivery_time: data.delivery_time ?? null,
      includes: data.includes ?? null,
      requirements: data.requirements ?? null,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    // Transform to GQL shape and push to Pipeline
    const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(offering, SERVICE_OFFERING_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('ServiceOffering', gqlData as unknown as Record<string, unknown>, [], 'service-offerings.service:109');
    } catch (err) {
      this.snackBar.open(
        `Failed to save service offering: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Return optimistic response immediately
    return offering;
  }

  /**
   * Update an existing service offering and push updates to Pipeline.
   * Returns optimistic ServiceOffering immediately.
   */
  async updateService(serviceId: string, data: Partial<ServiceOffering>): Promise<ServiceOffering> {
    // Check write-through cache first, fall back to GQL fetch
    let current = this.pipelineWrite.getCached('ServiceOffering', serviceId) as GqlServiceOfferingResponse | null;
    if (!current) {
      current = await this.graphqlRead.getById<GqlServiceOfferingResponse>(
        'ServiceOffering',
        serviceId,
        this.getServiceOfferingFields(),
      );
      if (!current) throw new Error(`ServiceOffering ${serviceId} not found`);
    }

    // Transform current GQL to Neon, merge updates, transform back to GQL
    const neonCurrent = mapGqlToNeon<ServiceOffering>(current, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon);
    const updated: ServiceOffering = { ...neonCurrent, ...data, updated_at: new Date().toISOString() };

    // Push to Pipeline
    const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(updated, SERVICE_OFFERING_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('ServiceOffering', gqlData as unknown as Record<string, unknown>, [], 'service-offerings.service:148');
    } catch (err) {
      this.snackBar.open(
        `Failed to update service offering: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Return optimistic response
    return updated;
  }

  /**
   * Delete a service offering by pushing delete to Pipeline.
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ServiceOffering', serviceId);
    } catch (err) {
      this.snackBar.open(
        `Failed to delete service offering: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Get standard field list for ServiceOffering GQL queries.
   */
  private getServiceOfferingFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'providerId',
      'isActive',
      'category',
      'subcategory',
      'pricingType',
      'price',
      'deliveryTime',
      'serviceIncludes',
      'serviceRequirements',
      'dateCreated',
      'dateLastModified',
      'tag',
    ];
  }
}
