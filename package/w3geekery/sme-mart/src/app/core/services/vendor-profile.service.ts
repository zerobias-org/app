import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GraphqlReadService } from './graphql-read.service';
import { PipelineWriteService, type SmeMartClassName } from './pipeline-write.service';
import {
  SECTION_CLASS,
  type ClientReferenceRecord,
  type FinancialProfileRecord,
  type InsuranceCoverageRecord,
  type OrgCertificationRecord,
  type OrgProfileRecord,
  type PersonnelRecord,
  type SectionType,
  type QualificationResourceRecord,
  type ServiceCapabilityRecord,
  type UserCertificationRecord,
  type VendorProfileBundle,
  type VendorProfileRecord,
} from '../models/vendor-profile.model';

/**
 * Vendor profile CRUD over the six typed classes that replaced MarketplaceProfileItem.
 *
 * The blob stored six section-discriminated JSON payloads behind one class and one set
 * of CRUD methods. Each section now reads and writes its own class, so the payload is
 * queryable and each row carries its own provenance from Verifiable.
 *
 * THERE WAS NO TYPED-WRITE PRECEDENT TO COPY. The only one had been
 * saveCorporateProfileSections in the onboarding form, and it was insert-only — a fresh
 * uuid() on every save with no read-back, so editing produced duplicate rows rather than
 * an update. This builds real read + update per class instead of reconstructing that.
 */

/** Provenance fields, requested on every read. */
const VERIFIABLE_FIELDS = ['verified', 'verificationSource', 'verifiedAt', 'verifiedBy', 'verificationExpiresAt'];

const SECTION_FIELDS: Record<SectionType, string[]> = {
  corporate_identity: [
    'id', 'orgId', 'legalName', 'dba', 'tagline', 'shortDescription', 'longDescription',
    'website', 'logoUrl', 'foundedYear', 'businessClassification', 'employeeCount',
    'primaryContactUserId', ...VERIFIABLE_FIELDS,
  ],
  attestation: [
    'id', 'orgId', 'serviceSegmentId', 'yearsExperience', 'clientCount',
    'avgProjectDuration', ...VERIFIABLE_FIELDS,
  ],
  insurance: [
    'id', 'orgId', 'carrier', 'policyNumber', 'coverageType', 'coverageAmount',
    'currency', 'effectiveDate', 'expiresAt', 'certificateUrl', ...VERIFIABLE_FIELDS,
  ],
  reference: [
    'id', 'orgId', 'clientName', 'contactName', 'contactEmail', 'contactPhone',
    'relationship', 'projectName', 'startDate', 'endDate', 'summary', ...VERIFIABLE_FIELDS,
  ],
  personnel: [
    'id', 'orgId', 'fullName', 'title', 'email', 'specialization', 'bio', 'linkedinUrl',
    'isKeyPersonnel', 'backgroundCheckStatus', 'userId', 'roleId', ...VERIFIABLE_FIELDS,
  ],
  financial: [
    'id', 'orgId', 'annualRevenue', 'revenueCurrency', 'creditScore', 'creditRatingAgency',
    'bankName', 'dunsNumber', 'yearEndMonth', ...VERIFIABLE_FIELDS,
  ],
};

const ORG_CERTIFICATION_FIELDS = [
  'id', 'orgId', 'certificationCode', 'certificationNumber', 'issuedAt', 'expiresAt',
  'notes', ...VERIFIABLE_FIELDS,
];

const USER_CERTIFICATION_FIELDS = [
  'id', 'userId', 'certificationCode', 'certificationNumber', 'issuedAt', 'expiresAt',
  'notes', ...VERIFIABLE_FIELDS,
];

const QUALIFICATION_RESOURCE_FIELDS = [
  'id', 'name', 'code', 'scope', 'ecosystemCode', 'proficiency', 'frameworkIds',
  'standardIds', 'issuerVendorIds', 'prerequisiteCertificationIds', 'qualifiesForRoleIds',
  'supersedesCode', 'sourceUrl', 'status',
];

/** GQL returns multi-valued fields as either a bare value or an array. */
function toArray(value: unknown): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

/**
 * Every one of these classes extends Object, where `name` is REQUIRED. The form does not
 * collect a separate name — asking for one on top of "Carrier" or "Full name" is a field
 * the user would have to invent — so it is derived from each section's primary field.
 */
function deriveName(section: SectionType, row: Record<string, unknown>): string {
  const pick = (key: string): string | null => {
    const v = row[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  switch (section) {
    case 'corporate_identity': return pick('legalName') ?? 'Corporate identity';
    case 'financial': return pick('bankName') ?? 'Financial profile';
    case 'insurance': return pick('carrier') ?? pick('policyNumber') ?? 'Insurance coverage';
    case 'reference': return pick('clientName') ?? 'Client reference';
    case 'personnel': return pick('fullName') ?? 'Personnel';
    case 'attestation': return pick('avgProjectDuration') ?? 'Service capability';
  }
}

@Injectable({ providedIn: 'root' })
export class VendorProfileService {
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly snackBar = inject(MatSnackBar);

  // ── Reads ─────────────────────────────────────────────────────────────────

  /**
   * Load every section for an org in one pass.
   *
   * The six queries are independent, so they run concurrently. The two singleton
   * sections collapse to a single row or null; the other four stay arrays.
   */
  async loadBundle(orgId: string): Promise<VendorProfileBundle> {
    const [identity, financial, capabilities, insurance, references, personnel] = await Promise.all([
      this.readSection<OrgProfileRecord>('corporate_identity', orgId),
      this.readSection<FinancialProfileRecord>('financial', orgId),
      this.readSection<ServiceCapabilityRecord>('attestation', orgId),
      this.readSection<InsuranceCoverageRecord>('insurance', orgId),
      this.readSection<ClientReferenceRecord>('reference', orgId),
      this.readSection<PersonnelRecord>('personnel', orgId),
    ]);

    return {
      corporate_identity: identity[0] ?? null,
      financial: financial[0] ?? null,
      attestation: capabilities,
      insurance,
      reference: references,
      personnel,
    };
  }

  /** Read one section's rows for an org. */
  async readSection<T>(section: SectionType, orgId: string): Promise<T[]> {
    try {
      const result = await this.graphqlRead.query<T>(
        SECTION_CLASS[section],
        SECTION_FIELDS[section],
        { filters: { orgId: `.eq.${orgId}` }, pageNumber: 1, pageSize: 200 },
      );
      return result.items;
    } catch (err) {
      console.error(`[VendorProfileService] read ${section} failed:`, err);
      return [];
    }
  }

  // ── Writes ────────────────────────────────────────────────────────────────

  /**
   * Create a row in a section.
   *
   * Singleton sections go through upsertSingleton instead — creating a second
   * OrgProfile or FinancialProfile for one org is the duplicate-row bug the old
   * insert-only path produced.
   */
  async createRow<T extends VendorProfileRecord>(
    section: SectionType,
    orgId: string,
    data: Partial<T>,
  ): Promise<T> {
    const base = {
      ...data,
      id: crypto.randomUUID(),
      orgId,
      verified: false,
      verificationSource: null,
    } as Record<string, unknown>;
    const row = { ...base, name: deriveName(section, base) } as unknown as T;

    await this.push(SECTION_CLASS[section], row, `vendor-profile.service:create:${section}`);
    return row;
  }

  /** Update an existing row in place, preserving its id and provenance. */
  async updateRow<T extends VendorProfileRecord>(
    section: SectionType,
    current: T,
    changes: Partial<T>,
  ): Promise<T> {
    const merged = { ...current, ...changes, id: current.id } as Record<string, unknown>;
    const updated = { ...merged, name: deriveName(section, merged) } as unknown as T;
    await this.push(SECTION_CLASS[section], updated, `vendor-profile.service:update:${section}`);
    return updated;
  }

  /**
   * Write the singleton for a section, updating the existing row when there is one.
   *
   * This is the whole reason the old path produced duplicates: it minted a new id on
   * every save. Read first, reuse the id when a row exists.
   */
  async upsertSingleton<T extends VendorProfileRecord>(
    section: 'corporate_identity' | 'financial',
    orgId: string,
    data: Partial<T>,
  ): Promise<T> {
    const existing = (await this.readSection<T>(section, orgId))[0];
    return existing
      ? this.updateRow<T>(section, existing, data)
      : this.createRow<T>(section, orgId, data);
  }

  /** Delete a row from a section. */
  async deleteRow(section: SectionType, id: string): Promise<void> {
    try {
      await this.pipelineWrite.deleteEntity(SECTION_CLASS[section], id);
    } catch (err) {
      this.snackBar.open(`Failed to delete: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
      throw err;
    }
  }

  // ── Certification claims ──────────────────────────────────────────────────

  /**
   * Catalog entries claimable at a given scope.
   *
   * Scope is not cosmetic — it decides which junction is legal. An individual-scope
   * entry is claimable via UserCertification, an organizational one via OrgCertification,
   * and the catalog is 100 individual / 26 organizational. An unfiltered org-side list
   * would be almost entirely unclaimable options.
   *
   * ⚠️ QualificationResource lives in `zerobias.schemas.qualifications`, NOT in smemart,
   * so this reads across a package boundary. That package is not published yet
   * (zerobias-org/schema#79) — until it is, this returns [] rather than rows.
   */
  async listCatalogQualifications(
    scope: 'individual' | 'organizational',
  ): Promise<QualificationResourceRecord[]> {
    try {
      const result = await this.graphqlRead.query<Record<string, unknown>>(
        'QualificationResource',
        QUALIFICATION_RESOURCE_FIELDS,
        { filters: { scope: `.eq.${scope}` }, pageNumber: 1, pageSize: 500 },
      );
      return result.items.map(item => ({
        ...item,
        frameworkIds: toArray(item['frameworkIds']),
        standardIds: toArray(item['standardIds']),
        issuerVendorIds: toArray(item['issuerVendorIds']),
        prerequisiteCertificationIds: toArray(item['prerequisiteCertificationIds']),
        qualifiesForRoleIds: toArray(item['qualifiesForRoleIds']),
      }) as unknown as QualificationResourceRecord);
    } catch (err) {
      console.error('[VendorProfileService] listCatalogQualifications failed:', err);
      return [];
    }
  }

  /** An org's certification claims. */
  async listOrgCertifications(orgId: string): Promise<OrgCertificationRecord[]> {
    try {
      const result = await this.graphqlRead.query<OrgCertificationRecord>(
        'OrgCertification',
        ORG_CERTIFICATION_FIELDS,
        { filters: { orgId: `.eq.${orgId}` }, pageNumber: 1, pageSize: 200 },
      );
      return result.items;
    } catch (err) {
      console.error('[VendorProfileService] listOrgCertifications failed:', err);
      return [];
    }
  }

  /** A user's certification claims. Keyed on userId — Personnel.userId may be null. */
  async listUserCertifications(userId: string): Promise<UserCertificationRecord[]> {
    try {
      const result = await this.graphqlRead.query<UserCertificationRecord>(
        'UserCertification',
        USER_CERTIFICATION_FIELDS,
        { filters: { userId: `.eq.${userId}` }, pageNumber: 1, pageSize: 200 },
      );
      return result.items;
    } catch (err) {
      console.error('[VendorProfileService] listUserCertifications failed:', err);
      return [];
    }
  }

  /** Claim an organizational-scope catalog certification for an org. */
  async addOrgCertification(
    orgId: string,
    certificationCode: string,
    data: Partial<OrgCertificationRecord> = {},
  ): Promise<OrgCertificationRecord> {
    const row: OrgCertificationRecord = {
      id: crypto.randomUUID(),
      orgId,
      certificationCode,
      certificationNumber: data.certificationNumber ?? null,
      issuedAt: data.issuedAt ?? null,
      expiresAt: data.expiresAt ?? null,
      notes: data.notes ?? null,
      verified: false,
      verificationSource: null,
      verifiedAt: null,
      verifiedBy: null,
      verificationExpiresAt: null,
    };
    await this.push('OrgCertification', row, 'vendor-profile.service:addOrgCertification');
    return row;
  }

  /** Claim an individual-scope catalog certification for a user. */
  async addUserCertification(
    userId: string,
    certificationCode: string,
    data: Partial<UserCertificationRecord> = {},
  ): Promise<UserCertificationRecord> {
    const row: UserCertificationRecord = {
      id: crypto.randomUUID(),
      userId,
      certificationCode,
      certificationNumber: data.certificationNumber ?? null,
      issuedAt: data.issuedAt ?? null,
      expiresAt: data.expiresAt ?? null,
      notes: data.notes ?? null,
      verified: false,
      verificationSource: null,
      verifiedAt: null,
      verifiedBy: null,
      verificationExpiresAt: null,
    };
    await this.push('UserCertification', row, 'vendor-profile.service:addUserCertification');
    return row;
  }

  async removeOrgCertification(id: string): Promise<void> {
    await this.pipelineWrite.deleteEntity('OrgCertification', id);
  }

  async removeUserCertification(id: string): Promise<void> {
    await this.pipelineWrite.deleteEntity('UserCertification', id);
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async push(className: SmeMartClassName, row: unknown, source: string): Promise<void> {
    try {
      await this.pipelineWrite.pushEntity(
        className,
        row as Record<string, unknown>,
        [],
        source,
      );
    } catch (err) {
      this.snackBar.open(`Failed to save: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
      throw err;
    }
  }
}
