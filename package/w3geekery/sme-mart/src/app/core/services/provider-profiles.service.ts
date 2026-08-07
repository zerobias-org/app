import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedResults } from '@zerobias-org/types-core-js';
import { GraphqlReadService } from './graphql-read.service';
import type {
  ProviderSkillProficiency,
  ProviderRole,
  ProviderProductProficiency,
  ProviderFrameworkProficiency,
  ProviderSegment,
  ProviderServiceSegment,
  OrgProfile,
  ProviderDirectoryView,
  ProviderDetailView,
  ExpertiseItem,
} from '../models';
import { CatalogService } from './catalog.service';
import { PipelineWriteService } from './pipeline-write.service';

/** The six expertise junction classes, all registered in SME_MART_CLASS_IDS. */
type JunctionClassName =
  | 'ProviderSkillProficiency'
  | 'ProviderRole'
  | 'ProviderProductProficiency'
  | 'ProviderFrameworkProficiency'
  | 'ProviderSegment'
  | 'ProviderServiceSegment';

/** `created_at` dropped throughout — GQL exposes dateCreated and nothing consumed it. */
const JUNCTION_FIELDS: Record<JunctionClassName, string[]> = {
  ProviderSkillProficiency: ['id', 'orgId', 'skillId', 'proficiencyLevel', 'yearsExperience', 'verified', 'verificationSource'],
  ProviderRole: ['id', 'orgId', 'roleId', 'isPrimary', 'yearsInRole', 'verified', 'verificationSource'],
  ProviderProductProficiency: ['id', 'orgId', 'productId', 'proficiencyLevel', 'yearsExperience', 'certified', 'certificationDetails', 'verified', 'verificationSource'],
  ProviderFrameworkProficiency: ['id', 'orgId', 'frameworkId', 'proficiencyLevel', 'yearsExperience', 'assessorCertified', 'implementationExperience', 'auditExperience', 'verified', 'verificationSource'],
  ProviderSegment: ['id', 'orgId', 'segmentId', 'isPrimary', 'verified', 'verificationSource'],
  ProviderServiceSegment: ['id', 'orgId', 'serviceSegmentId', 'isPrimary', 'verified', 'verificationSource'],
};

/**
 * Provider CRUD operations. Reads OrgProfile and the six expertise junctions from GQL;
 * writes go through PipelineWriteService.
 *
 * Reads were re-hosted on GraphqlReadService 2026-08-07. They previously called
 * boundaryExecuteRawQuery directly, hand-building `OrgProfile(filter: "orgId.eq.X")` —
 * an argument the generated schema never declares, which is why those reads 500'd. The
 * fenced path names the argument after the FIELD: `OrgProfile(orgId: ".eq.X")`.
 *
 * The four-claim justification that used to sit here was wrong on every count and has
 * been deleted rather than patched: there is no demo-mode gate in GraphqlReadService
 * (query() is the plain path); there is no MarketplaceProfileItem left to read from;
 * the writes do not target Neon tables (all seven go through pipelineWrite.pushEntity);
 * and the reads are not one nested request (they are one flat query plus six junction
 * queries).
 */
@Injectable({ providedIn: 'root' })
export class ProviderProfilesService {
  private readonly graphqlRead = inject(GraphqlReadService);
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
   * Fields selected for a full OrgProfile read.
   *
   * `created_at` is deliberately absent: GQL exposes `dateCreated`, and the live path
   * never requested it, so nothing consumes it. Add a mapping only if a real consumer
   * turns up.
   */
  private static readonly ORG_PROFILE_FIELDS = [
    'id', 'orgId', 'legalName', 'dba', 'tagline', 'shortDescription', 'longDescription',
    'website', 'logoUrl', 'employeeCount', 'businessClassification', 'foundedYear',
    'primaryContactUserId', 'verified', 'verificationSource',
  ];

  /** Fields selected for the directory listing — a narrower read than the detail page. */
  private static readonly ORG_PROFILE_SUMMARY_FIELDS = [
    'id', 'orgId', 'legalName', 'tagline', 'logoUrl', 'verified', 'verificationSource',
  ];

  /**
   * Query a single OrgProfile by orgId.
   *
   * Takes an orgId rather than a filter string on purpose: a pre-built filter string is
   * the shape that produced the malformed `filter:` argument in the first place.
   */
  private async queryOrgProfile(orgId: string): Promise<OrgProfile | null> {
    const result = await this.graphqlRead.query<OrgProfile>(
      'OrgProfile',
      ProviderProfilesService.ORG_PROFILE_FIELDS,
      { filters: { orgId: `.eq.${orgId}` }, pageNumber: 1, pageSize: 1 },
    );
    return result.items[0] ?? null;
  }

  /**
   * Query all six expertise junctions for an orgId.
   */
  private async queryExpertiseJunctions(orgId: string): Promise<{
    skills: ProviderSkillProficiency[];
    roles: ProviderRole[];
    products: ProviderProductProficiency[];
    frameworks: ProviderFrameworkProficiency[];
    segments: ProviderSegment[];
    serviceSegments: ProviderServiceSegment[];
  }> {
    // Query all 6 expertise junction types in parallel
    const [skillsResult, rolesResult, productsResult, frameworksResult, segmentsResult, ssResult] =
      await Promise.all([
        this.queryJunctionType('ProviderSkillProficiency', orgId),
        this.queryJunctionType('ProviderRole', orgId),
        this.queryJunctionType('ProviderProductProficiency', orgId),
        this.queryJunctionType('ProviderFrameworkProficiency', orgId),
        this.queryJunctionType('ProviderSegment', orgId),
        this.queryJunctionType('ProviderServiceSegment', orgId),
      ]);

    return {
      skills: skillsResult as ProviderSkillProficiency[],
      roles: rolesResult as ProviderRole[],
      products: productsResult as ProviderProductProficiency[],
      frameworks: frameworksResult as ProviderFrameworkProficiency[],
      segments: segmentsResult as ProviderSegment[],
      serviceSegments: ssResult as ProviderServiceSegment[],
    };
  }

  /**
   * Query a single junction type and return typed results.
   */
  private async queryJunctionType(className: JunctionClassName, orgId: string): Promise<unknown[]> {
    const fields = JUNCTION_FIELDS[className];

    try {
      const result = await this.graphqlRead.query<unknown>(
        className,
        fields,
        { filters: { orgId: `.eq.${orgId}` }, pageNumber: 1, pageSize: 1000 },
      );
      return result.items;
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
      const result = await this.graphqlRead.query<OrgProfile>(
        'OrgProfile',
        ProviderProfilesService.ORG_PROFILE_SUMMARY_FIELDS,
        {
          filters: orgId ? { orgId: `.eq.${orgId}` } : {},
          pageNumber: 1,
          pageSize: pageSize ?? 200,
        },
      );
      const profiles = result.items;

      // Load each profile's expertise concurrently. This was a serial await inside a
      // for-loop: 6 junction queries per provider, at pageSize 200 that is 1200 requests
      // end to end.
      const items: ProviderDirectoryView[] = await Promise.all(
        profiles.map(async profile =>
          this.toDirectoryRow(profile, await this.queryExpertiseJunctions(profile.orgId)),
        ),
      );

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
      const profile = await this.queryOrgProfile(orgId);
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
      const result = await this.graphqlRead.query<{ orgId: string }>(
        'OrgProfile',
        ['id', 'orgId'],
        { filters: { primaryContactUserId: `.eq.${userId}` }, pageNumber: 1, pageSize: 1 },
      );

      const first = result.items[0];
      if (!first) return null;

      // Get the first matching org
      return this.getProvider(first.orgId);
    } catch (err) {
      console.error('[ProviderProfilesService] getProviderByUserId failed:', err);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile CRUD (writes to provider_profiles) — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Update OrgProfile via Pipeline.
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

    // The HQ-address write that lived here is gone. It targeted the Address class,
    // retired in smemart 2.0.7 in favour of the platform base `address` document —
    // which OrgProfile does not yet declare a property for, so there is nowhere to
    // put an address today. Nothing fed this path (the sole caller,
    // my-profile-overview, never passes hqLocation), so no data is lost by removing
    // it; leaving it would only have meant a guaranteed runtime failure against a
    // class that no longer exists. Restore address writes when OrgProfile adopts the
    // platform document.

    return payload as unknown as OrgProfile;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Expertise CRUD — 6 relation tables — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add skill expertise junction for org.
   * Org-scoped via orgId FK. Defaults verified=false / verificationSource=null per D-53.
   */
  async addSkill(orgId: string, data: Omit<ProviderSkillProficiency, 'id' | 'created_at'>): Promise<ProviderSkillProficiency> {
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
      await this.pipelineWrite.pushEntity('ProviderSkillProficiency', payload, [], 'provider-profiles.service:addSkill');
    } catch (err) {
      this.snackBar.open(
        `Failed to add skill: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderSkillProficiency;
  }

  /**
   * Delete skill expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not skillId).
   */
  async deleteSkill(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderSkillProficiency', recordId, 'provider-profiles.service:deleteSkill');
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
  async addProduct(orgId: string, data: Omit<ProviderProductProficiency, 'id' | 'created_at'>): Promise<ProviderProductProficiency> {
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
      await this.pipelineWrite.pushEntity('ProviderProductProficiency', payload, [], 'provider-profiles.service:addProduct');
    } catch (err) {
      this.snackBar.open(
        `Failed to add product: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderProductProficiency;
  }

  /**
   * Delete product expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not productId).
   */
  async deleteProduct(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderProductProficiency', recordId, 'provider-profiles.service:deleteProduct');
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
  async addFramework(orgId: string, data: Omit<ProviderFrameworkProficiency, 'id' | 'created_at'>): Promise<ProviderFrameworkProficiency> {
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
      await this.pipelineWrite.pushEntity('ProviderFrameworkProficiency', payload, [], 'provider-profiles.service:addFramework');
    } catch (err) {
      this.snackBar.open(
        `Failed to add framework: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return payload as unknown as ProviderFrameworkProficiency;
  }

  /**
   * Delete framework expertise junction by record ID.
   * recordId is the auto-generated junction row ID (not frameworkId).
   */
  async deleteFramework(recordId: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity('ProviderFrameworkProficiency', recordId, 'provider-profiles.service:deleteFramework');
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
