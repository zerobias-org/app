import { Injectable, inject, signal, computed } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type {
  CatalogRole,
  CatalogRoleCategory,
  CatalogSkill,
  CatalogFramework,
  CatalogSegment,
  ServiceSegment,
  CatalogProduct,
} from '../models';

/**
 * Fetches and caches ZeroBias catalog data (roles, skills, products,
 * frameworks, segments, service segments).
 *
 * Call `loadAll()` once after auth init. Data is cached in signals —
 * catalog data rarely changes so a single fetch per session is sufficient.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly roles = signal<CatalogRole[]>([]);
  readonly roleCategories = signal<CatalogRoleCategory[]>([]);
  readonly skills = signal<CatalogSkill[]>([]);
  readonly frameworks = signal<CatalogFramework[]>([]);
  readonly segments = signal<CatalogSegment[]>([]);
  readonly serviceSegments = signal<ServiceSegment[]>([]);
  readonly products = signal<CatalogProduct[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Total number of loaded catalog items across all types */
  readonly totalLoaded = computed(() =>
    this.roles().length +
    this.skills().length +
    this.frameworks().length +
    this.segments().length +
    this.serviceSegments().length +
    this.products().length
  );

  // ---------------------------------------------------------------------------
  // Batch load
  // ---------------------------------------------------------------------------

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await Promise.all([
        this.loadRoles(),
        this.loadSkills(),
        this.loadFrameworks(),
        this.loadSegments(),
        this.loadServiceSegments(),
        this.loadProducts(),
      ]);
      console.log(`[Catalog] Loaded ${this.totalLoaded()} catalog items`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error.set(msg);
      console.warn('[Catalog] Load error:', msg);
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Individual loaders
  // ---------------------------------------------------------------------------

  async loadRoles(): Promise<CatalogRole[]> {
    const result = await this.clientApi.auditmationPlatform
      .getCatalogRoleApi()
      .list(1, 1000);
    const items: CatalogRole[] = (result.items || []).map((item: any) => {
      const catName = item.roleCategory?.name;
      const catCode = item.roleCategory?.externalCode;
      return {
        id: String(item.id || ''),
        name: item.name || '',
        code: item.code || item.externalCode || '',
        description: item.description,
        categoryId: item.roleCategory?.id,
        categoryName: catName && catCode ? `${catName} (${catCode})` : catName,
      };
    });
    items.sort((a, b) => {
      const catA = (a.categoryName || '').toLowerCase();
      const catB = (b.categoryName || '').toLowerCase();
      if (catA !== catB) return catA.localeCompare(catB);
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    this.roles.set(items);
    return items;
  }

  async loadRoleCategories(): Promise<CatalogRoleCategory[]> {
    const result = await this.clientApi.auditmationPlatform
      .getCatalogRoleApi()
      .listRoleCategories(1, 100);
    const items: CatalogRoleCategory[] = (result.items || []).map((item: any) => ({
      id: String(item.id || ''),
      name: item.name || '',
      code: item.code || item.externalCode || '',
      description: item.description,
    }));
    this.roleCategories.set(items);
    return items;
  }

  async loadSkills(): Promise<CatalogSkill[]> {
    const skillType = 'skill' as any;
    const result = await this.clientApi.auditmationPlatform
      .getCatalogRoleApi()
      .listRoleQualifications(1, 1000, skillType);
    const items: CatalogSkill[] = (result.items || []).map((item: any) => {
      // Trim "Skill in " prefix from description, use as display name
      let displayName = item.description || item.name || '';
      if (displayName.toLowerCase().startsWith('skill in ')) {
        displayName = displayName.slice(9);
      }
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      return {
        id: String(item.id || ''),
        name: displayName,
        code: item.name || '', // e.g., "s0011"
        description: item.description,
      };
    });
    items.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    this.skills.set(items);
    return items;
  }

  async loadFrameworks(): Promise<CatalogFramework[]> {
    const result = await this.clientApi.portalClient
      .getFrameworkApi()
      .search({} as any, 1, 100);
    const items: CatalogFramework[] = (result.items || []).map((item: any) => ({
      id: String(item.id || ''),
      name: item.name || '',
      description: item.description,
    }));
    this.frameworks.set(items);
    return items;
  }

  async loadSegments(): Promise<CatalogSegment[]> {
    const result = await this.clientApi.auditmationPlatform
      .getSegmentApi()
      .list(1, 1000);
    const items: CatalogSegment[] = (result.items || []).map((item: any) => ({
      id: String(item.id || ''),
      name: item.name || '',
      code: item.code || item.externalCode || '',
      description: item.description,
    }));
    this.segments.set(items);
    return items;
  }

  async loadServiceSegments(): Promise<ServiceSegment[]> {
    const tagTypes = ['service-segment'] as any;
    const result = await this.clientApi.auditmationPlatform
      .getTagApi()
      .listTags(1, 100, tagTypes);
    const items: ServiceSegment[] = (result.items || []).map((item: any) => ({
      id: String(item.id || ''),
      name: item.name || '',
      type: 'service-segment',
      description: item.description,
    }));
    this.serviceSegments.set(items);
    return items;
  }

  async loadProducts(): Promise<CatalogProduct[]> {
    const searchBody = { productServiceFilter: 'product' as any };
    const result = await this.clientApi.portalClient
      .getProductApi()
      .search(searchBody as any, 1, 1000);
    const items: CatalogProduct[] = (result.items || []).map((item: any) => ({
      id: String(item.id || ''),
      name: item.name || '',
      description: item.description,
      vendorName: item.vendorName,
    }));
    items.sort((a, b) => {
      const vendorA = (a.vendorName || '').toLowerCase();
      const vendorB = (b.vendorName || '').toLowerCase();
      if (vendorA !== vendorB) return vendorA.localeCompare(vendorB);
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    this.products.set(items);
    return items;
  }

  // ---------------------------------------------------------------------------
  // Lookups (search cached data)
  // ---------------------------------------------------------------------------

  findRole(idOrCode: string): CatalogRole | undefined {
    return this.roles().find(r => r.id === idOrCode || r.code === idOrCode);
  }

  findSkill(idOrCode: string): CatalogSkill | undefined {
    return this.skills().find(s => s.id === idOrCode || s.code === idOrCode);
  }

  findFramework(idOrName: string): CatalogFramework | undefined {
    return this.frameworks().find(f => f.id === idOrName || f.name === idOrName);
  }

  findSegment(idOrCode: string): CatalogSegment | undefined {
    return this.segments().find(s => s.id === idOrCode || s.code === idOrCode);
  }

  findServiceSegment(idOrName: string): ServiceSegment | undefined {
    return this.serviceSegments().find(s => s.id === idOrName || s.name === idOrName);
  }

  findProduct(idOrName: string): CatalogProduct | undefined {
    return this.products().find(p => p.id === idOrName || p.name === idOrName);
  }

  // ---------------------------------------------------------------------------
  // Client-side filter (for autocomplete search)
  // ---------------------------------------------------------------------------

  filterItems<T extends { name: string; code?: string; description?: string }>(
    items: T[],
    search: string,
  ): T[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      item =>
        item.name?.toLowerCase().includes(lower) ||
        item.code?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower),
    );
  }
}
