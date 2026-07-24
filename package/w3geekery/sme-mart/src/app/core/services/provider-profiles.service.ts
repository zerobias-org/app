import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ExecuteRawGraphqlQuery } from '@zerobias-com/graphql-sdk';
import { UUID, PagedResults } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';
import type {
  ProviderSkill,
  ProviderRole,
  ProviderProduct,
  ProviderFramework,
  ProviderSegment,
  ProviderServiceSegment,
  OrgProfile,
  ProviderDirectoryView,
  ProviderDetailView,
  ExpertiseItem,
} from '../models';
import { CatalogService } from './catalog.service';
import { PipelineWriteService } from './pipeline-write.service';

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
  private readonly catalog = inject(CatalogService);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly snackBar = inject(MatSnackBar);

  readonly providers = signal<ProviderDirectoryView[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Half-A: GQL Nested Reads (Phase 33, Wave 1)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Query OrgProfile + expertise junctions via boundaryExecuteRawQuery.
   * Nested selections return all expertise data in one request.
   */
  private async queryOrgProfile(filter: string): Promise<OrgProfile | null> {
    const query = `{
      OrgProfile(${filter}) {
        id orgId legalName dba tagline shortDescription longDescription website logoUrl
        employeeCount businessClassification foundedYear primaryContactUserId
        verified verificationSource created_at
      }
    }`;

    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
    const result = await boundaryApi.boundaryExecuteRawQuery(
      new UUID(environment.boundaryId),
      new ExecuteRawGraphqlQuery(query),
      false, // includeRawData
      1, // pageNumber
      1, // pageSize
      undefined, // sort
    );

    const data = result.data as Record<string, unknown> | null;
    return (data?.['OrgProfile'] as OrgProfile) ?? null;
  }

  /**
   * Query expertise junctions for an orgId with nested selections.
   */
  private async queryExpertiseJunctions(orgId: string): Promise<{
    skills: ProviderSkill[];
    roles: ProviderRole[];
    products: ProviderProduct[];
    frameworks: ProviderFramework[];
    segments: ProviderSegment[];
    serviceSegments: ProviderServiceSegment[];
  }> {
    const filter = `filter: "orgId.eq.${orgId}"`;

    // Query all 6 expertise junction types in parallel
    const [skillsResult, rolesResult, productsResult, frameworksResult, segmentsResult, ssResult] =
      await Promise.all([
        this.queryJunctionType('ProviderSkill', filter),
        this.queryJunctionType('ProviderRole', filter),
        this.queryJunctionType('ProviderProduct', filter),
        this.queryJunctionType('ProviderFramework', filter),
        this.queryJunctionType('ProviderSegment', filter),
        this.queryJunctionType('ProviderServiceSegment', filter),
      ]);

    return {
      skills: skillsResult as ProviderSkill[],
      roles: rolesResult as ProviderRole[],
      products: productsResult as ProviderProduct[],
      frameworks: frameworksResult as ProviderFramework[],
      segments: segmentsResult as ProviderSegment[],
      serviceSegments: ssResult as ProviderServiceSegment[],
    };
  }

  /**
   * Query a single junction type and return typed results.
   */
  private async queryJunctionType(className: string, filter: string): Promise<unknown[]> {
    const fieldsByClass: Record<string, string> = {
      ProviderSkill: 'id orgId skillId proficiencyLevel yearsExperience verified verificationSource created_at',
      ProviderRole: 'id orgId roleId isPrimary yearsInRole verified verificationSource created_at',
      ProviderProduct: 'id orgId productId proficiencyLevel yearsExperience certified certificationDetails verified verificationSource created_at',
      ProviderFramework: 'id orgId frameworkId proficiencyLevel yearsExperience assessorCertified implementationExperience auditExperience verified verificationSource created_at',
      ProviderSegment: 'id orgId segmentId isPrimary verified verificationSource created_at',
      ProviderServiceSegment: 'id orgId serviceSegmentId isPrimary verified verificationSource created_at',
    };

    const fields = fieldsByClass[className];
    if (!fields) return [];

    const query = `{ ${className}(${filter}) { ${fields} } }`;
    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();

    try {
      const result = await boundaryApi.boundaryExecuteRawQuery(
        new UUID(environment.boundaryId),
        new ExecuteRawGraphqlQuery(query),
        false,
        1,
        1000,
        undefined,
      );

      const data = result.data as Record<string, unknown> | null;
      return (data?.[className] as unknown[]) ?? [];
    } catch (err) {
      console.error(`[ProviderProfilesService] Query ${className} failed:`, err);
      return [];
    }
  }

  /**
   * Build expertise items with resolved names from CatalogService.
   */
  private buildExpertiseItems(
    items: unknown[],
    idField: string,
    resolveFn: (id: string) => { name: string } | undefined,
  ): ExpertiseItem[] {
    return items.map((item: unknown) => {
      const typedItem = item as Record<string, unknown> & { id: string; verified?: boolean; verificationSource?: string | null };
      return {
        id: typedItem.id,
        name: resolveFn(String(typedItem[idField]))?.name || '(unknown)',
        verified: typedItem.verified ?? false,
        verificationSource: (typedItem.verificationSource as string | null) ?? null,
      };
    });
  }

  /**
   * Convert OrgProfile + expertise junctions to ProviderDirectoryView.
   */
  private toDirectoryRow(profile: OrgProfile, expertise: Awaited<ReturnType<typeof this.queryExpertiseJunctions>>): ProviderDirectoryView {
    return {
      id: profile.id, // Expose id for downstream callers (33-06 compatibility)
      orgId: profile.orgId,
      legalName: profile.legalName,
      tagline: profile.tagline,
      logoUrl: profile.logoUrl,
      segmentCount: expertise.segments.length + expertise.serviceSegments.length,
      skillCount: expertise.skills.length,
      verified: profile.verified ?? false,
    };
  }

  /**
   * Convert OrgProfile + expertise junctions to ProviderDetailView.
   * Resolves all expertise names via CatalogService.
   */
  private async toDetailRow(
    profile: OrgProfile,
    expertise: Awaited<ReturnType<typeof this.queryExpertiseJunctions>>,
  ): Promise<ProviderDetailView> {
    return {
      id: profile.id, // Expose id for downstream callers (33-06 compatibility)
      orgId: profile.orgId,
      legalName: profile.legalName,
      dba: profile.dba,
      tagline: profile.tagline,
      shortDescription: profile.shortDescription,
      longDescription: profile.longDescription,
      website: profile.website,
      logoUrl: profile.logoUrl,
      foundedYear: profile.foundedYear,
      employeeCount: profile.employeeCount,
      businessClassification: profile.businessClassification,
      verified: profile.verified ?? false,
      skillCount: expertise.skills.length,
      segments: this.buildExpertiseItems(expertise.segments, 'segmentId', (id) => this.catalog.findSegment(id)),
      serviceSegments: this.buildExpertiseItems(expertise.serviceSegments, 'serviceSegmentId', (id) => this.catalog.findServiceSegment(id)),
      skills: this.buildExpertiseItems(expertise.skills, 'skillId', (id) => this.catalog.findSkill(id)),
      roles: this.buildExpertiseItems(expertise.roles, 'roleId', (id) => this.catalog.findRole(id)),
      products: this.buildExpertiseItems(expertise.products, 'productId', (id) => this.catalog.findProduct(id)),
      frameworks: this.buildExpertiseItems(expertise.frameworks, 'frameworkId', (id) => this.catalog.findFramework(id)),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  async listProviders(orgId?: string, pageSize?: number): Promise<PagedResults<ProviderDirectoryView>> {
    this.loading.set(true);
    try {
      // Query all OrgProfile records (optionally filtered by orgId)
      const filter = orgId ? `filter: "orgId.eq.${orgId}"` : '';
      const query = `{ OrgProfile${filter ? `(${filter})` : ''} { id orgId legalName tagline logoUrl verified verificationSource created_at } }`;

      const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
      const result = await boundaryApi.boundaryExecuteRawQuery(
        new UUID(environment.boundaryId),
        new ExecuteRawGraphqlQuery(query),
        false,
        1,
        pageSize ?? 200,
        undefined,
      );

      const data = result.data as Record<string, unknown> | null;
      const profiles = (data?.['OrgProfile'] as OrgProfile[]) ?? [];

      // For each profile, load expertise counts
      const items: ProviderDirectoryView[] = [];
      for (const profile of profiles) {
        const expertise = await this.queryExpertiseJunctions(profile.orgId);
        items.push(this.toDirectoryRow(profile, expertise));
      }

      this.providers.set(items);
      return PagedResults.fromArray(items, 1, pageSize ?? 200, items.length);
    } catch (err) {
      console.error('[ProviderProfilesService] listProviders failed:', err);
      return PagedResults.fromArray([], 1, pageSize ?? 200, 0);
    } finally {
      this.loading.set(false);
    }
  }

  async searchProviders(query: string, pageSize?: number): Promise<PagedResults<ProviderDirectoryView>> {
    // List all and filter in memory by legalName/tagline
    const all = await this.listProviders(undefined, pageSize);
    const lower = query.toLowerCase();
    const items = all.items.filter(
      p =>
        p.legalName.toLowerCase().includes(lower) ||
        (p.tagline?.toLowerCase().includes(lower) ?? false),
    );
    return PagedResults.fromArray(items, 1, pageSize ?? 200, items.length);
  }

  async getProvider(orgId: string): Promise<ProviderDetailView | null> {
    try {
      const profile = await this.queryOrgProfile(`filter: "orgId.eq.${orgId}"`);
      if (!profile) return null;

      const expertise = await this.queryExpertiseJunctions(orgId);
      return this.toDetailRow(profile, expertise);
    } catch (err) {
      console.error('[ProviderProfilesService] getProvider failed:', err);
      return null;
    }
  }

  async getProviderByUserId(userId: string): Promise<ProviderDetailView | null> {
    try {
      // Query OrgProfile by primaryContactUserId
      const filter = `filter: "primaryContactUserId.eq.${userId}"`;
      const query = `{ OrgProfile(${filter}) { id orgId } }`;

      const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
      const result = await boundaryApi.boundaryExecuteRawQuery(
        new UUID(environment.boundaryId),
        new ExecuteRawGraphqlQuery(query),
        false,
        1,
        1,
        undefined,
      );

      const data = result.data as Record<string, unknown> | null;
      const profiles = (data?.['OrgProfile'] as Array<{ orgId: string }>) ?? [];

      if (profiles.length === 0) return null;

      // Get the first matching org
      return this.getProvider(profiles[0].orgId);
    } catch (err) {
      console.error('[ProviderProfilesService] getProviderByUserId failed:', err);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile CRUD (writes to provider_profiles) — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Update OrgProfile + optional HQ Address via Pipeline.
   * Both writes scoped to orgId FK (not provider_id).
   * Defaults verified=false / verificationSource=null per D-53.
   * Pipeline.receive is full-replace — send complete object to avoid nulling unmapped fields.
   */
  async updateProfile(orgId: string, profileData: Partial<OrgProfile>): Promise<OrgProfile> {
    const payload: Record<string, unknown> = {
      id: `orgprofile-${orgId}`,
      name: `OrgProfile-${orgId}`,
      orgId,
      legalName: profileData.legalName ?? undefined,
      dba: profileData.dba ?? undefined,
      tagline: profileData.tagline ?? undefined,
      shortDescription: profileData.shortDescription ?? undefined,
      longDescription: profileData.longDescription ?? undefined,
      website: profileData.website ?? undefined,
      logoUrl: profileData.logoUrl ?? undefined,
      employeeCount: profileData.employeeCount ?? undefined,
      businessClassification: profileData.businessClassification ?? undefined,
      foundedYear: profileData.foundedYear ?? undefined,
      primaryContactUserId: profileData.primaryContactUserId ?? undefined,
      verified: profileData.verified ?? false,
      verificationSource: profileData.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('OrgProfile', payload, [], 'provider-profiles.service:updateProfile.OrgProfile');
    } catch (err) {
      this.snackBar.open(
        `Failed to update profile: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // If hqLocation provided, write Address (1:1, owner-generic)
    const hqLocation = (profileData as unknown as Record<string, unknown>)['hqLocation'];
    if (hqLocation && typeof hqLocation === 'object') {
      const hqLoc = hqLocation as Record<string, unknown>;
      const addressPayload: Record<string, unknown> = {
        id: `address-${orgId}-hq`,
        name: `HQ Address - ${orgId}`,
        ownerType: 'org',
        ownerId: orgId,
        addressType: 'registered',
        isPrimary: true,
        street1: hqLoc['street1'] ?? undefined,
        street2: hqLoc['street2'] ?? undefined,
        city: hqLoc['city'] ?? undefined,
        region: hqLoc['region'] ?? undefined,
        postalCode: hqLoc['postalCode'] ?? undefined,
        country: hqLoc['country'] ?? undefined,
        userLabel: 'Headquarters',
        verified: profileData.verified ?? false,
        verificationSource: profileData.verificationSource ?? null,
      };

      try {
        await this.pipelineWrite.pushEntity('Address', addressPayload, [], 'provider-profiles.service:updateProfile.Address');
      } catch (err) {
        this.snackBar.open(
          `Failed to update address: ${(err as Error).message}`,
          'Dismiss',
          { duration: 5000 },
        );
        throw err;
      }
    }

    return payload as unknown as OrgProfile;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Expertise CRUD — 6 relation tables — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add skill expertise junction for org.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addSkill(orgId: string, data: Omit<ProviderSkill, 'id' | 'created_at'>): Promise<ProviderSkill> {
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {
      id,
      name: `${orgId}-skill-${data.skillId}`,
      orgId,
      skillId: data.skillId,
      proficiencyLevel: data.proficiencyLevel ?? undefined,
      yearsExperience: data.yearsExperience ?? undefined,
      verified: data.verified ?? false,
      verificationSource: data.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('ProviderSkill', payload, [], 'provider-profiles.service:addSkill');
    } catch (err) {
      this.snackBar.open(
        `Failed to add skill: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderSkill;
  }

  /**
   * Delete skill expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not skillId).
   */
  async deleteSkill(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderSkill', recordId, 'provider-profiles.service:deleteSkill');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete skill: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Add role expertise junction for org.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addRole(orgId: string, data: Omit<ProviderRole, 'id' | 'created_at'>): Promise<ProviderRole> {
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {
      id,
      name: `${orgId}-role-${data.roleId}`,
      orgId,
      roleId: data.roleId,
      isPrimary: data.isPrimary ?? false,
      yearsInRole: data.yearsInRole ?? undefined,
      verified: data.verified ?? false,
      verificationSource: data.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('ProviderRole', payload, [], 'provider-profiles.service:addRole');
    } catch (err) {
      this.snackBar.open(
        `Failed to add role: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderRole;
  }

  /**
   * Delete role expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not roleId).
   */
  async deleteRole(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderRole', recordId, 'provider-profiles.service:deleteRole');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete role: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Add product expertise junction for org.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addProduct(orgId: string, data: Omit<ProviderProduct, 'id' | 'created_at'>): Promise<ProviderProduct> {
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {
      id,
      name: `${orgId}-product-${data.productId}`,
      orgId,
      productId: data.productId,
      proficiencyLevel: data.proficiencyLevel ?? undefined,
      yearsExperience: data.yearsExperience ?? undefined,
      certified: data.certified ?? false,
      certificationDetails: data.certificationDetails ?? undefined,
      verified: data.verified ?? false,
      verificationSource: data.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('ProviderProduct', payload, [], 'provider-profiles.service:addProduct');
    } catch (err) {
      this.snackBar.open(
        `Failed to add product: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderProduct;
  }

  /**
   * Delete product expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not productId).
   */
  async deleteProduct(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderProduct', recordId, 'provider-profiles.service:deleteProduct');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete product: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Add framework expertise junction for org.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addFramework(orgId: string, data: Omit<ProviderFramework, 'id' | 'created_at'>): Promise<ProviderFramework> {
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {
      id,
      name: `${orgId}-framework-${data.frameworkId}`,
      orgId,
      frameworkId: data.frameworkId,
      proficiencyLevel: data.proficiencyLevel ?? undefined,
      yearsExperience: data.yearsExperience ?? undefined,
      assessorCertified: data.assessorCertified ?? false,
      implementationExperience: data.implementationExperience ?? false,
      auditExperience: data.auditExperience ?? false,
      verified: data.verified ?? false,
      verificationSource: data.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('ProviderFramework', payload, [], 'provider-profiles.service:addFramework');
    } catch (err) {
      this.snackBar.open(
        `Failed to add framework: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderFramework;
  }

  /**
   * Delete framework expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not frameworkId).
   */
  async deleteFramework(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderFramework', recordId, 'provider-profiles.service:deleteFramework');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete framework: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Add capability segment expertise junction for org.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addSegment(orgId: string, data: Omit<ProviderSegment, 'id' | 'created_at'>): Promise<ProviderSegment> {
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {
      id,
      name: `${orgId}-segment-${data.segmentId}`,
      orgId,
      segmentId: data.segmentId,
      isPrimary: data.isPrimary ?? false,
      verified: data.verified ?? false,
      verificationSource: data.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('ProviderSegment', payload, [], 'provider-profiles.service:addSegment');
    } catch (err) {
      this.snackBar.open(
        `Failed to add segment: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderSegment;
  }

  /**
   * Delete capability segment expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not segmentId).
   */
  async deleteSegment(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderSegment', recordId, 'provider-profiles.service:deleteSegment');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete segment: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Add service segment expertise junction for org (D-56 Option B).
   * serviceSegmentId is a Catalog Service-segment UUID (133 leaf nodes under Services domain).
   * NOT a hydra tag ID — the retired 9 hardcoded service-segment tags are no longer used.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addServiceSegment(orgId: string, data: Omit<ProviderServiceSegment, 'id' | 'created_at'>): Promise<ProviderServiceSegment> {
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {
      id,
      name: `${orgId}-service-segment-${data.serviceSegmentId}`,
      orgId,
      serviceSegmentId: data.serviceSegmentId,
      isPrimary: data.isPrimary ?? false,
      verified: data.verified ?? false,
      verificationSource: data.verificationSource ?? null,
    };

    try {
      await this.pipelineWrite.pushEntity('ProviderServiceSegment', payload, [], 'provider-profiles.service:addServiceSegment');
    } catch (err) {
      this.snackBar.open(
        `Failed to add service segment: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderServiceSegment;
  }

  /**
   * Delete service segment expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not serviceSegmentId).
   */
  async deleteServiceSegment(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderServiceSegment', recordId, 'provider-profiles.service:deleteServiceSegment');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete service segment: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
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
