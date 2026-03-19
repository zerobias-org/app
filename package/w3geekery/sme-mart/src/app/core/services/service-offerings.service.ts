import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { SERVICE_OFFERING_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type { ServiceOffering } from '../models';
import type { GqlServiceOfferingResponse } from '../gql-types';

@Injectable({ providedIn: 'root' })
export class ServiceOfferingsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  /**
   * List all active service offerings.
   * Queries GraphQL with isActive filter, transforms responses to ServiceOffering shape.
   */
  async listServices(options?: QueryOptions): Promise<PagedResults<ServiceOffering>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: { isActive: '.eq.true' },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
      'ServiceOffering',
      this.getServiceOfferingFields(),
      gqlOptions,
    );

    // Transform GQL responses to ServiceOffering (Neon shape)
    const items = result.items.map(gql =>
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

    // Transform and return as array
    return result.items.map(gql =>
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

    // Transform to GQL shape and push to Pipeline (fire-and-forget)
    const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(offering, SERVICE_OFFERING_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('ServiceOffering', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to push ServiceOffering to Pipeline:', err);
    });

    // Return optimistic response immediately
    return offering;
  }

  /**
   * Update an existing service offering and push updates to Pipeline.
   * Returns optimistic ServiceOffering immediately.
   */
  async updateService(serviceId: string, data: Partial<ServiceOffering>): Promise<ServiceOffering> {
    // Fetch current offering to merge updates
    const current = await this.graphqlRead.getById<GqlServiceOfferingResponse>(
      'ServiceOffering',
      serviceId,
      this.getServiceOfferingFields(),
    );

    if (!current) throw new Error(`ServiceOffering ${serviceId} not found`);

    // Transform current GQL to Neon, merge updates, transform back to GQL
    const neonCurrent = mapGqlToNeon<ServiceOffering>(current, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon);
    const updated: ServiceOffering = { ...neonCurrent, ...data, updated_at: new Date().toISOString() };

    // Push to Pipeline
    const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(updated, SERVICE_OFFERING_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('ServiceOffering', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to update ServiceOffering in Pipeline:', err);
    });

    // Return optimistic response
    return updated;
  }

  /**
   * Delete a service offering by pushing delete to Pipeline (fire-and-forget).
   */
  async deleteService(serviceId: string): Promise<void> {
    this.pipelineWrite.deleteEntity('ServiceOffering', serviceId).catch(err => {
      console.error('Failed to delete ServiceOffering from Pipeline:', err);
    });
  }

  /**
   * Get standard field list for ServiceOffering GQL queries.
   */
  private getServiceOfferingFields(): string[] {
    return [
      'id',
      'providerId',
      'title',
      'description',
      'category',
      'subcategory',
      'pricingType',
      'price',
      'deliveryTime',
      'includes',
      'requirements',
      'isActive',
      'createdAt',
      'updatedAt',
    ];
  }
}
