import { Injectable, inject, signal } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type { PagedResults } from '@zerobias-org/types-core-js';
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

/**
 * Provider CRUD operations.
 * Reads from VIEWs (v_provider_directory, v_provider_detail).
 * Writes to individual tables (provider_profiles, provider_skills, etc.).
 */
@Injectable({ providedIn: 'root' })
export class ProviderProfilesService {
  private readonly db = inject(SmeMartDbService);

  readonly providers = signal<ProviderDirectoryRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ---------------------------------------------------------------------------
  // List / Search (reads from VIEWs)
  // ---------------------------------------------------------------------------

  async listProviders(options?: QueryOptions): Promise<PagedResults<ProviderDirectoryRow>> {
    this.loading.set(true);
    try {
      const result = await this.db.listRows<ProviderDirectoryRow>('v_provider_directory', options);
      this.providers.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async searchProviders(filter: string, options?: QueryOptions): Promise<PagedResults<ProviderDirectoryRow>> {
    this.loading.set(true);
    try {
      const result = await this.db.searchRows<ProviderDirectoryRow>('v_provider_directory', filter, options);
      this.providers.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async getProvider(id: string): Promise<ProviderDetailRow | null> {
    return this.db.getRow<ProviderDetailRow>('v_provider_detail', id);
  }

  async getProviderByUserId(zerobiasUserId: string): Promise<ProviderDetailRow | null> {
    const result = await this.db.searchRows<ProviderDetailRow>(
      'v_provider_detail',
      `(zerobias_user_id=${zerobiasUserId})`,
      { pageNumber: 1, pageSize: 1 },
    );
    return result.items?.[0] ?? null;
  }

  // ---------------------------------------------------------------------------
  // Profile CRUD (writes to provider_profiles)
  // ---------------------------------------------------------------------------

  async updateProfile(id: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    return this.db.updateRow<ProviderProfile>('provider_profiles', id, data as Record<string, unknown>);
  }

  // ---------------------------------------------------------------------------
  // Expertise CRUD — 6 relation tables
  // ---------------------------------------------------------------------------

  // Skills
  async addSkill(providerId: string, data: Omit<ProviderSkill, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderSkill> {
    return this.db.createRow<ProviderSkill>('provider_skills', { provider_id: providerId, ...data });
  }

  async deleteSkill(skillId: string): Promise<void> {
    return this.db.deleteRow('provider_skills', skillId);
  }

  // Roles
  async addRole(providerId: string, data: Omit<ProviderRole, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderRole> {
    return this.db.createRow<ProviderRole>('provider_roles', { provider_id: providerId, ...data });
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.db.deleteRow('provider_roles', roleId);
  }

  // Products
  async addProduct(providerId: string, data: Omit<ProviderProduct, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderProduct> {
    return this.db.createRow<ProviderProduct>('provider_products', { provider_id: providerId, ...data });
  }

  async deleteProduct(productId: string): Promise<void> {
    return this.db.deleteRow('provider_products', productId);
  }

  // Frameworks
  async addFramework(providerId: string, data: Omit<ProviderFramework, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderFramework> {
    return this.db.createRow<ProviderFramework>('provider_frameworks', { provider_id: providerId, ...data });
  }

  async deleteFramework(frameworkId: string): Promise<void> {
    return this.db.deleteRow('provider_frameworks', frameworkId);
  }

  // Segments
  async addSegment(providerId: string, data: Omit<ProviderSegment, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderSegment> {
    return this.db.createRow<ProviderSegment>('provider_segments', { provider_id: providerId, ...data });
  }

  async deleteSegment(segmentId: string): Promise<void> {
    return this.db.deleteRow('provider_segments', segmentId);
  }

  // Service Segments
  async addServiceSegment(providerId: string, data: Omit<ProviderServiceSegment, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderServiceSegment> {
    return this.db.createRow<ProviderServiceSegment>('provider_service_segments', { provider_id: providerId, ...data });
  }

  async deleteServiceSegment(segmentId: string): Promise<void> {
    return this.db.deleteRow('provider_service_segments', segmentId);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Parse JSON aggregation strings from VIEW rows into typed arrays. */
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
