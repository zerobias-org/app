/**
 * VendorProfileService — CRUD for marketplace vendor profile items.
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Handles JSON serialization/deserialization for 6 section types:
 * - corporate_identity, attestation, insurance, reference, personnel, financial
 *
 * Plan 041: Vendor Profile Service
 */

import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING, mapGqlToNeon, mapNeonToGql } from '../field-mappings';
import type { GqlMarketplaceProfileItemResponse } from '../gql-types/marketplace-profile-item.types';
import type {
  MarketplaceProfileItem,
  SectionType,
  CreateMarketplaceProfileItemRequest,
  UpdateMarketplaceProfileItemRequest,
  CorporateIdentityData,
  AttestationData,
  InsuranceData,
  ReferenceData,
  PersonnelData,
  FinancialData,
} from '../models/marketplace-profile-item.model';

// Type union for all section data types
type SectionData =
  | CorporateIdentityData
  | AttestationData
  | InsuranceData
  | ReferenceData
  | PersonnelData
  | FinancialData;

@Injectable({ providedIn: 'root' })
export class VendorProfileService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  // ── Query ──

  /**
   * List all profile items for a given org, optionally filtered by section.
   * Returns items sorted by name.
   *
   * @param orgId — Organization ID (passed explicitly, not auto-detected)
   * @param section — Optional section filter (corporate_identity, attestation, etc.)
   * @returns Profile items for the org, excluding soft-deleted items
   */
  async listProfileItems(orgId: string, section?: SectionType): Promise<MarketplaceProfileItem[]> {
    const filters: Record<string, string> = {
      orgId: `.eq.${orgId}`,
    };
    if (section) {
      filters['section'] = `.eq.${section}`;
    }

    const result = await this.graphqlRead.query<GqlMarketplaceProfileItemResponse>(
      'MarketplaceProfileItem',
      this.getFields(),
      {
        filters,
        pageSize: 200,
      },
    );

    const items = result.items
      .filter(gql => !(gql as unknown as Record<string, unknown>)['dateDeleted'])
      .map(gql => this.fromGql(gql));

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }

  /**
   * Get a single profile item by ID.
   *
   * @param id — Item ID
   * @returns Profile item or null if not found
   */
  async getProfileItem(id: string): Promise<MarketplaceProfileItem | null> {
    // Check cache first
    const cached = this.pipelineWrite.getCached('MarketplaceProfileItem', id);
    if (cached) return this.fromGql(cached as unknown as GqlMarketplaceProfileItemResponse);

    const gql = await this.graphqlRead.getById<GqlMarketplaceProfileItemResponse>(
      'MarketplaceProfileItem',
      id,
      this.getFields(),
    );
    if (!gql) return null;

    this.pipelineWrite.seedCache('MarketplaceProfileItem', id, gql as unknown as Record<string, unknown>);
    return this.fromGql(gql);
  }

  // ── Create ──

  /**
   * Create a new profile item.
   *
   * @param orgId — Organization ID (required, explicit)
   * @param req — Creation request with name, section, description, data, optional expiresAt/status
   * @returns Created profile item
   * @throws Error if validation fails (missing name, invalid section, invalid data)
   */
  async createProfileItem(
    orgId: string,
    req: CreateMarketplaceProfileItemRequest,
  ): Promise<MarketplaceProfileItem> {
    // Validate required fields
    if (!req.name || !req.name.trim()) {
      throw new Error('Profile item name is required');
    }

    if (!this.isValidSection(req.section)) {
      throw new Error(`Invalid section: ${req.section}`);
    }

    // Validate data is not empty
    if (!req.data || typeof req.data !== 'object') {
      throw new Error('Profile item data must be a non-empty object');
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const item: MarketplaceProfileItem = {
      id,
      org_id: orgId,
      section: req.section,
      name: req.name.trim(),
      description: req.description?.trim() ?? null,
      data: this.serializeData(req.data),
      expires_at: req.expiresAt ?? null,
      status: req.status ?? 'active',
      created_at: now,
      updated_at: now,
    };

    const gqlData = this.toGql(item);
    this.pipelineWrite.pushEntity('MarketplaceProfileItem', gqlData).catch(err => {
      console.error('[VendorProfileService] Failed to push profile item:', err);
    });

    return item;
  }

  // ── Update ──

  /**
   * Update an existing profile item (partial update).
   *
   * @param id — Item ID
   * @param req — Update request with optional fields (all fields partial)
   * @returns Updated profile item
   * @throws Error if item not found or update invalid
   */
  async updateProfileItem(
    id: string,
    req: Partial<CreateMarketplaceProfileItemRequest>,
  ): Promise<MarketplaceProfileItem> {
    // Fetch current (cache-aware)
    const cached = this.pipelineWrite.getCached('MarketplaceProfileItem', id);
    let current: MarketplaceProfileItem | null;
    if (cached) {
      current = this.fromGql(cached as unknown as GqlMarketplaceProfileItemResponse);
    } else {
      const gql = await this.graphqlRead.getById<GqlMarketplaceProfileItemResponse>(
        'MarketplaceProfileItem',
        id,
        this.getFields(),
      );
      if (!gql) throw new Error(`Profile item ${id} not found`);
      current = this.fromGql(gql);
    }
    if (!current) throw new Error(`Profile item ${id} not found`);

    const now = new Date().toISOString();
    const updated: MarketplaceProfileItem = {
      ...current,
      name: req.name?.trim() ?? current.name,
      description: req.description !== undefined ? (req.description?.trim() ?? null) : current.description,
      section: req.section ?? current.section,
      data: req.data ? this.serializeData(req.data) : current.data,
      expires_at: req.expiresAt ?? current.expires_at,
      status: req.status ?? current.status,
      updated_at: now,
    };

    // Validate updated state
    if (!this.isValidSection(updated.section)) {
      throw new Error(`Invalid section: ${updated.section}`);
    }

    const gqlData = this.toGql(updated);
    this.pipelineWrite.pushEntity('MarketplaceProfileItem', gqlData).catch(err => {
      console.error('[VendorProfileService] Failed to update profile item:', err);
    });

    return updated;
  }

  // ── Delete ──

  /**
   * Soft-delete a profile item.
   *
   * @param id — Item ID
   */
  async deleteProfileItem(id: string): Promise<void> {
    const cached = this.pipelineWrite.getCached('MarketplaceProfileItem', id);
    const current = cached ?? await this.graphqlRead.getById<GqlMarketplaceProfileItemResponse>(
      'MarketplaceProfileItem',
      id,
      this.getFields(),
    );

    const today = new Date().toISOString().split('T')[0];
    const gqlData: Record<string, unknown> = {
      ...(current ?? { id }),
      dateDeleted: today,
    };

    this.pipelineWrite.pushEntity('MarketplaceProfileItem', gqlData).catch(err => {
      console.error('[VendorProfileService] Failed to delete profile item:', err);
    });
  }

  // ── Private helpers ──

  /**
   * Check if a section value is valid.
   */
  private isValidSection(section: string): section is SectionType {
    const validSections: SectionType[] = [
      'corporate_identity',
      'attestation',
      'insurance',
      'reference',
      'personnel',
      'financial',
    ];
    return validSections.includes(section as SectionType);
  }

  /**
   * Parse JSON data string into typed section object.
   * On parse error, logs warning and returns empty object matching section type.
   *
   * @param dataStr — JSON string from GQL response
   * @param section — Section type (for default object shape)
   * @returns Typed section data object
   */
  private parseData(dataStr: string): SectionData {
    if (!dataStr) return {} as SectionData;
    try {
      return JSON.parse(dataStr) as SectionData;
    } catch (err) {
      console.warn('[VendorProfileService] Failed to parse data JSON:', dataStr, err);
      return {} as SectionData;
    }
  }

  /**
   * Serialize section data to JSON string.
   *
   * @param data — Typed section data object
   * @returns JSON string for storage
   */
  private serializeData(data: unknown): string {
    return JSON.stringify(data ?? {});
  }

  /**
   * Transform GQL response → domain model.
   * Special handling: parse `data` field from JSON string to typed object.
   */
  private fromGql(gql: GqlMarketplaceProfileItemResponse): MarketplaceProfileItem {
    const mapped = mapGqlToNeon<MarketplaceProfileItem>(
      gql,
      MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.gqlToNeon,
    );

    // Parse data field from JSON string
    const rawData = (gql as unknown as Record<string, unknown>)['data'];
    if (typeof rawData === 'string') {
      try {
        mapped.data = rawData; // Keep as string in domain model
      } catch {
        mapped.data = '{}';
      }
    } else {
      mapped.data = '{}';
    }

    return mapped;
  }

  /**
   * Transform domain model → GQL data for pipeline push.
   * Special handling: ensure `data` is JSON string.
   */
  private toGql(item: MarketplaceProfileItem): Record<string, unknown> {
    const gql = mapNeonToGql<GqlMarketplaceProfileItemResponse>(
      item,
      MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING.neonToGql,
    ) as unknown as Record<string, unknown>;

    // Ensure data is a JSON string
    if (typeof gql['data'] !== 'string') {
      gql['data'] = this.serializeData(gql['data']);
    }

    return gql;
  }

  /**
   * Get array of all GQL field names for this entity.
   * Used in query() calls to select which fields to fetch.
   */
  private getFields(): string[] {
    return [
      'id',
      'orgId',
      'section',
      'name',
      'description',
      'data',
      'expiresAt',
      'status',
      'dateCreated',
      'dateLastModified',
      'dateDeleted',
    ];
  }
}
