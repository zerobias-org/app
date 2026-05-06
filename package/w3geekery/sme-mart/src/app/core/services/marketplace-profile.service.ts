import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { GraphqlReadService } from './graphql-read.service';
import { PipelineWriteService } from './pipeline-write.service';
import {
  CompanyInfoStruct,
  MarketplaceProfileItemRecord,
} from '../../onboarding/company-info.model';
import {
  SECTION_LEGAL_NAME,
  SECTION_LOGO_URL,
  SECTION_ONBOARDING_COMPLETE,
  USER_FACING_SECTIONS,
} from '../../onboarding/company-info-sections';

/**
 * Maps CompanyInfoStruct field names to section constants.
 * Used for bidirectional conversion between form struct and MPI records.
 */
interface StructFieldToSection {
  [key: string]: string;
}

const STRUCT_TO_SECTION_MAP: StructFieldToSection = {
  legalName: SECTION_LEGAL_NAME,
  dba: 'dba',
  logoUrl: SECTION_LOGO_URL,
  shortBlurb: 'short_blurb',
  longDescription: 'long_description',
  'primaryContact.userId': 'primary_contact.user_id',
  'primaryContact.name': 'primary_contact.name',
  'primaryContact.email': 'primary_contact.email',
  website: 'website',
  'hqLocation.street': 'hq_location.street',
  'hqLocation.city': 'hq_location.city',
  'hqLocation.state': 'hq_location.state',
  'hqLocation.country': 'hq_location.country',
  'hqLocation.postalCode': 'hq_location.postal_code',
  yearsInBusiness: 'years_in_business',
  employeeCount: 'employee_count',
};

/**
 * MarketplaceProfileService — reads and writes company profile data for the onboarding flow.
 *
 * **Pre-fill logic (readProfileForOrg):**
 * - One GQL query → group by section → project to struct
 * - Org-level fallbacks: legal_name from Org.name, logo_url from Org.avatarUrl
 * - Fallback pre-fills are NOT written on save unless user edits them
 *
 * **Save logic (save):**
 * - Dirty-diff: compare current form state against original pre-fill snapshot
 * - Build MPI records for each dirty field (deterministic id: mpi-<orgId>-<section>)
 * - Batch write via PipelineWriteService.pushEntities (Phase 20 telemetry + error contract)
 * - Append onboarding_complete marker with ISO date
 *
 * **Completion check (getCompletionStatus):**
 * - Query for onboarding_complete marker
 * - Used by Phase 27 routing guard to decide form skip
 */
@Injectable({ providedIn: 'root' })
export class MarketplaceProfileService {
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Read profile for an org: one GQL query → group by section → project to struct.
   *
   * @param orgId — The org UUID to read profile for
   * @returns CompanyInfoStruct with pre-fill values + org fallbacks
   * @throws On GQL error or undefined orgId
   */
  async readProfileForOrg(orgId: string): Promise<CompanyInfoStruct> {
    if (!orgId) {
      throw new Error('Cannot read profile: orgId is undefined or empty');
    }

    let mpiRecords: Array<{
      id: string;
      section: string;
      data: string;
      status: string;
      expiresAt?: string | null;
    }>;

    try {
      const result = await this.graphqlRead.query<{
        id: string;
        section: string;
        data: string;
        status: string;
        expiresAt?: string | null;
      }>('MarketplaceProfileItem', ['id', 'section', 'data', 'status', 'expiresAt'], {
        filters: { orgId: `.eq.${orgId}` },
        pageSize: 999,
      });
      mpiRecords = result.items.filter(r => r.status === 'active');
    } catch (err) {
      this.snackBar.open(
        'Failed to load profile data',
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Group by section for fast lookup
    const bySection = new Map<string, string>();
    mpiRecords.forEach(r => bySection.set(r.section, r.data));

    // Fetch org name and avatar for fallbacks
    let orgName: string | undefined;
    let orgAvatarUrl: string | undefined;

    try {
      const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
      const org = orgs?.find(o => String(o.id) === orgId);
      orgName = org?.name || undefined;
      orgAvatarUrl = org?.avatarUrl ? String(org.avatarUrl) : undefined;
    } catch (err) {
      // Org lookup failed; continue with empty fallbacks
      console.error('Failed to fetch org fallback data:', err);
    }

    // Project to struct with fallbacks
    const struct: CompanyInfoStruct = {
      legalName: bySection.get('legal_name') || orgName || '',
      dba: bySection.get('dba'),
      logoUrl: bySection.get('logo_url') || orgAvatarUrl,
      shortBlurb: bySection.get('short_blurb'),
      longDescription: bySection.get('long_description'),
      primaryContact: {
        userId: bySection.get('primary_contact.user_id'),
        name: bySection.get('primary_contact.name'),
        email: bySection.get('primary_contact.email'),
      },
      website: bySection.get('website'),
      hqLocation: {
        street: bySection.get('hq_location.street'),
        city: bySection.get('hq_location.city'),
        state: bySection.get('hq_location.state'),
        country: bySection.get('hq_location.country'),
        postalCode: bySection.get('hq_location.postal_code'),
      },
      yearsInBusiness: bySection.get('years_in_business')
        ? Number(bySection.get('years_in_business'))
        : undefined,
      employeeCount: bySection.get('employee_count'),
    };

    return struct;
  }

  /**
   * Save profile: dirty-diff → batch write.
   *
   * Only fields where current[field] !== original[field] are written.
   * Org-fallback pre-fills (legal_name from Org.name, logo_url from Org.avatarUrl) are
   * NOT written unless the user explicitly edited them.
   *
   * Always appends onboarding_complete marker with ISO date.
   *
   * @param orgId — The org UUID to save for
   * @param current — Current form state (Partial<CompanyInfoStruct>)
   * @param original — Original pre-fill snapshot (Partial<CompanyInfoStruct>)
   * @throws On PipelineWriteService error (already wrapped with snackbar + re-throw)
   */
  async save(
    orgId: string,
    current: Partial<CompanyInfoStruct>,
    original: Partial<CompanyInfoStruct>,
  ): Promise<void> {
    const records: MarketplaceProfileItemRecord[] = [];

    // Collect dirty fields
    this.collectDirtyFields(orgId, current, original, records);

    // Append onboarding_complete marker with today's ISO date
    const isoDate = new Date().toISOString().split('T')[0];
    records.push({
      id: `mpi-${orgId}-${SECTION_ONBOARDING_COMPLETE}`,
      orgId,
      section: SECTION_ONBOARDING_COMPLETE,
      data: isoDate,
      status: 'active',
    });

    // Write via PipelineWriteService
    // This wraps the SDK call with Phase 20 telemetry (callSiteTag, error logging, re-throw)
    try {
      await this.pipelineWrite.pushEntities(
        'MarketplaceProfileItem',
        records,
        [],
        'mpi-company-profile-save',
      );
    } catch (err) {
      this.snackBar.open(
        `Failed to save profile: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  /**
   * Check if profile completion marker exists.
   *
   * @param orgId — The org UUID to check
   * @returns true if onboarding_complete marker exists and is active, false otherwise
   */
  async getCompletionStatus(orgId: string): Promise<boolean> {
    try {
      const result = await this.graphqlRead.query<{
        id: string;
        section: string;
        status: string;
      }>('MarketplaceProfileItem', ['id', 'section', 'status'], {
        filters: {
          orgId: `.eq.${orgId}`,
          section: `.eq.${SECTION_ONBOARDING_COMPLETE}`,
        },
        pageSize: 1,
      });

      return result.items.length > 0 && result.items[0]?.status === 'active';
    } catch (err) {
      console.error('Failed to check onboarding completion status:', err);
      return false;
    }
  }

  /**
   * Collects dirty fields by comparing current form state against original snapshot.
   * Builds MPI records for each dirty field.
   *
   * **Dirty-diff semantics:**
   * - If current[field] !== original[field], field is dirty
   * - Empty pre-fill + empty user input = not dirty
   * - Org-fallback pre-fill + no user edit = not dirty (org field remains authoritative)
   * - Nested fields (primaryContact, hqLocation) are compared at leaf level
   *
   * @private
   */
  private collectDirtyFields(
    orgId: string,
    current: Partial<CompanyInfoStruct>,
    original: Partial<CompanyInfoStruct>,
    records: MarketplaceProfileItemRecord[],
  ): void {
    // Flat iteration of all user-facing sections
    USER_FACING_SECTIONS.forEach(sectionName => {
      const structField = this.sectionToStructField(sectionName);
      if (!structField) return; // Skip unknown sections

      const currentValue = this.getNestedValue(current, structField);
      const originalValue = this.getNestedValue(original, structField);

      // Check if dirty: current !== original
      const isDirty = currentValue !== originalValue;
      if (!isDirty) return; // Skip unchanged fields

      // Skip if both are empty (nothing to write)
      if (
        this.isEmpty(currentValue) &&
        this.isEmpty(originalValue)
      ) {
        return;
      }

      // Build and append record
      const dataValue = this.valueToString(currentValue);
      records.push({
        id: `mpi-${orgId}-${sectionName}`,
        orgId,
        section: sectionName,
        data: dataValue,
        status: 'active',
      });
    });
  }

  /**
   * Map section name (snake_case) to struct field path (camelCase).
   * @private
   */
  private sectionToStructField(section: string): string | undefined {
    // Reverse lookup: find the struct field that maps to this section
    for (const [field, sec] of Object.entries(STRUCT_TO_SECTION_MAP)) {
      if (sec === section) return field;
    }
    return undefined;
  }

  /**
   * Get nested value from struct (e.g., 'primaryContact.email' from { primaryContact: { email: '...' } }).
   * @private
   */
  private getNestedValue(
    obj: Partial<CompanyInfoStruct> | undefined,
    path: string,
  ): unknown {
    if (!obj) return undefined;

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Convert value to string for MPI data field.
   * @private
   */
  private valueToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return String(value);
  }

  /**
   * Check if value is empty (null, undefined, empty string).
   * @private
   */
  private isEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }
}
