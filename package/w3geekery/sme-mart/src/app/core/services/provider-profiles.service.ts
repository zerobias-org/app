import { Injectable, inject, signal } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ExecuteRawGraphqlQuery } from '@zerobias-com/graphql-sdk';
import { UUID, PagedResults } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type {
  ProviderProfile,
  ProviderSkill,
  ProviderRole,
  ProviderProduct,
  ProviderFramework,
  ProviderSegment,
  ProviderServiceSegment,
  ProviderDirectoryRow,
  ProviderDetailRow,
} from '../models';

interface MpiRow {
  id: string;
  orgId: string;
  section: string;
  data: string;
  status: string;
}

/**
 * Provider CRUD operations.
 * Wave 2 (Plan 26-03): Reads from MPI/GQL (no Neon VIEWs).
 * Writes still target individual Neon tables (provider_profiles, provider_skills, etc.) —
 * those are CRUD methods at the end of the file, unchanged.
 *
 * Wave 2 Decision (26-03 Director-locked):
 * - Call boundaryApi.boundaryExecuteRawQuery DIRECTLY (bypassing GraphqlReadService.query)
 * - Reason: GraphqlReadService has a demo-mode gate (lines 80-84) that short-circuits
 *   empty results when demo mode is OFF. This gate was appropriate when all GQL data was
 *   demo-seeded, but after 26-02, ZB is REAL (untagged) GQL data and the gate incorrectly
 *   hides it. Direct boundary calls see ZB regardless of demo-mode toggle position.
 * - Future: Phase 24 follow-up should replace the demo-mode gate with per-record tag filtering.
 */
@Injectable({ providedIn: 'root' })
export class ProviderProfilesService {
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly providers = signal<ProviderDirectoryRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // MPI/GQL Read Path (Plan 26-03 Wave 2)
  // ─────────────────────────────────────────────────────────────────────────

  private readonly MPI_FIELDS = ['id', 'orgId', 'section', 'data', 'status'];

  /**
   * Query MarketplaceProfileItem directly via boundaryExecuteRawQuery.
   * Bypasses GraphqlReadService.query to avoid demo-mode gate.
   */
  private async queryMpi(filter: string, pageSize = 200): Promise<MpiRow[]> {
    const query = `{ MarketplaceProfileItem(${filter}) { ${this.MPI_FIELDS.join(' ')} } }`;
    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
    const rawQuery = new ExecuteRawGraphqlQuery(query);

    const result = await boundaryApi.boundaryExecuteRawQuery(
      new UUID(environment.boundaryId),
      rawQuery,
      false, // includeRawData
      1, // pageNumber
      pageSize,
      undefined, // sort
    );

    const data = result.data as Record<string, unknown> | null;
    return (data?.['MarketplaceProfileItem'] as MpiRow[]) ?? [];
  }

  private groupByOrg(rows: MpiRow[]): Map<string, MpiRow[]> {
    const map = new Map<string, MpiRow[]>();
    for (const row of rows) {
      if (!map.has(row.orgId)) map.set(row.orgId, []);
      map.get(row.orgId)!.push(row);
    }
    return map;
  }

  private getSection(rows: MpiRow[], name: string): string | null {
    const row = rows.find(r => r.section === name && r.status === 'active');
    return row?.data ?? null;
  }

  private projectToDirectoryRow(orgId: string, rows: MpiRow[]): ProviderDirectoryRow {
    const displayName = this.getSection(rows, 'legal_name') ?? '(unnamed)';

    return {
      id: orgId,
      user_id: null,
      slug: displayName.toLowerCase().replace(/\s+/g, '-'),
      zerobias_user_id: this.getSection(rows, 'primary_contact.user_id') ?? '',
      zerobias_org_id: orgId,
      display_name: displayName,
      headline: this.getSection(rows, 'short_blurb'),
      about: null, // Detail-only; set in projectToDetailRow
      avatar_url: this.getSection(rows, 'logo_url'),
      hourly_rate: null,
      availability_status: null,
      response_time: null,
      total_jobs_completed: null,
      total_earnings: null,
      rating_average: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      skills: '[]',
      roles: '[]',
      products: '[]',
      frameworks: '[]',
      segments: '[]',
      service_segments: '[]',
      skill_count: null,
      role_count: null,
      service_count: null,
      review_count: null,
    };
  }

  private projectToDetailRow(orgId: string, rows: MpiRow[]): ProviderDetailRow {
    const dirRow = this.projectToDirectoryRow(orgId, rows);

    return {
      ...dirRow,
      about: this.getSection(rows, 'long_description'),
      user_email: this.getSection(rows, 'primary_contact.email'),
      user_org_id: orgId,
      service_offerings: '[]',
      reviews: '[]',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  async listProviders(options?: QueryOptions): Promise<PagedResults<ProviderDirectoryRow>> {
    this.loading.set(true);
    try {
      // Option-b (Plan 26-01 locked): Only orgs with provider_type=platform
      const platformRows = await this.queryMpi(
        `section: ".eq.provider_type", data: ".eq.platform"`,
        options?.pageSize ?? 200,
      );

      const platformOrgIds = Array.from(new Set(platformRows.map(r => r.orgId)));
      if (platformOrgIds.length === 0) {
        this.providers.set([]);
        return PagedResults.fromArray([], 1, options?.pageSize ?? 200, 0);
      }

      // Fetch all MPI rows for platform orgs
      const allRows = await this.queryMpi(`orgId: ".in.${platformOrgIds.join(',')}"`, 1000);

      const grouped = this.groupByOrg(allRows);
      const items = platformOrgIds.map(orgId => this.projectToDirectoryRow(orgId, grouped.get(orgId) ?? []));

      this.providers.set(items);
      return PagedResults.fromArray(items, 1, items.length, items.length);
    } finally {
      this.loading.set(false);
    }
  }

  async searchProviders(filter: string, options?: QueryOptions): Promise<PagedResults<ProviderDirectoryRow>> {
    // For now: list all platform providers, filter in memory by display_name.ilike(filter).
    // When MPI section-text search is needed at scale, push the filter into the GQL query.
    // Temp nature documented per Wave 2 decision.
    const all = await this.listProviders(options);
    const lower = filter.toLowerCase();
    const items = all.items.filter(p => p.display_name.toLowerCase().includes(lower));
    return PagedResults.fromArray(items, 1, items.length, items.length);
  }

  async getProvider(orgId: string): Promise<ProviderDetailRow | null> {
    const rows = await this.queryMpi(`orgId: ".eq.${orgId}"`, 200);
    if (rows.length === 0) return null;
    return this.projectToDetailRow(orgId, rows);
  }

  async getProviderByUserId(zerobiasUserId: string): Promise<ProviderDetailRow | null> {
    const userRows = await this.queryMpi(
      `section: ".eq.primary_contact.user_id", data: ".eq.${zerobiasUserId}"`,
      1,
    );
    if (userRows.length === 0) return null;
    return this.getProvider(userRows[0].orgId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile CRUD (writes to provider_profiles) — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * NOTE: These are placeholder stubs. Wave 2 does not rewrite CRUD methods.
   * They still require SmeMartDbService which is out of scope for 26-03.
   * Future phase (cleanup) will implement via PipelineWriteService after Neon->GQL migration.
   * Unused parameters are suppressed with underscore prefix to suppress TS6133 warnings.
   */
  async updateProfile(_id: string, _data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    throw new Error('updateProfile not yet implemented for GQL-backed providers');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Expertise CRUD — 6 relation tables — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  async addSkill(_providerId: string, _data: Omit<ProviderSkill, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderSkill> {
    throw new Error('addSkill not yet implemented for GQL-backed providers');
  }

  async deleteSkill(_skillId: string): Promise<void> {
    throw new Error('deleteSkill not yet implemented for GQL-backed providers');
  }

  async addRole(_providerId: string, _data: Omit<ProviderRole, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderRole> {
    throw new Error('addRole not yet implemented for GQL-backed providers');
  }

  async deleteRole(_roleId: string): Promise<void> {
    throw new Error('deleteRole not yet implemented for GQL-backed providers');
  }

  async addProduct(_providerId: string, _data: Omit<ProviderProduct, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderProduct> {
    throw new Error('addProduct not yet implemented for GQL-backed providers');
  }

  async deleteProduct(_productId: string): Promise<void> {
    throw new Error('deleteProduct not yet implemented for GQL-backed providers');
  }

  async addFramework(_providerId: string, _data: Omit<ProviderFramework, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderFramework> {
    throw new Error('addFramework not yet implemented for GQL-backed providers');
  }

  async deleteFramework(_frameworkId: string): Promise<void> {
    throw new Error('deleteFramework not yet implemented for GQL-backed providers');
  }

  async addSegment(_providerId: string, _data: Omit<ProviderSegment, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderSegment> {
    throw new Error('addSegment not yet implemented for GQL-backed providers');
  }

  async deleteSegment(_segmentId: string): Promise<void> {
    throw new Error('deleteSegment not yet implemented for GQL-backed providers');
  }

  async addServiceSegment(_providerId: string, _data: Omit<ProviderServiceSegment, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderServiceSegment> {
    throw new Error('addServiceSegment not yet implemented for GQL-backed providers');
  }

  async deleteServiceSegment(_segmentId: string): Promise<void> {
    throw new Error('deleteServiceSegment not yet implemented for GQL-backed providers');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Parse JSON aggregation strings from VIEW rows into typed arrays.
   * No longer used internally; kept for backwards compat with bid-ai.service.ts:104.
   */
  parseViewJson<T>(jsonValue: unknown): T[] {
    if (!jsonValue) return [];
    if (Array.isArray(jsonValue)) return jsonValue as T[];
    if (typeof jsonValue === 'string') {
      try {
        return JSON.parse(jsonValue) as T[];
      } catch {
        return [];
      }
    }
    return [];
  }
}

