import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { GraphqlReadService } from './graphql-read.service';
import { PipelineWriteService } from './pipeline-write.service';
import type { GqlOrgProfileResponse } from '../gql-types/org-profile.types';
import {
  BusinessClassification,
  CompanyInfoStruct,
  EmployeeCountBand,
} from '../../onboarding/company-info.model';

/** GQL field list for OrgProfile reads. */
const ORG_PROFILE_FIELDS = [
  'id',
  'name',
  'orgId',
  'legalName',
  'dba',
  'tagline',
  'shortDescription',
  'longDescription',
  'website',
  'logoUrl',
  'employeeCount',
  'businessClassification',
  'foundedYear',
  'primaryContactUserId',
] as const;

/**
 * MarketplaceProfileService — reads and writes the company profile behind the
 * onboarding flow.
 *
 * **Storage (rewritten for smemart 2.0.7):** one `OrgProfile` row per org
 * (orgId is unique — 1:1). This replaces MarketplaceProfileItem, whose
 * section-discriminated blob was retired along with the class itself. Each
 * former section is now a real column, so there is no section vocabulary, no
 * JSON payload, and no per-section record id.
 *
 * **Pre-fill logic (readProfileForOrg):**
 * - One GQL query for the org's row → project to struct
 * - Org-level fallbacks: legalName from Org.name, logoUrl from Org.avatarUrl
 * - Fallback pre-fills are NOT written on save unless the user edits them
 *
 * **Save logic (save):**
 * - Dirty-diff against the original pre-fill snapshot, overlaid onto the stored
 *   row, so an unedited org fallback is never persisted as profile data
 * - Single upsert via PipelineWriteService.pushEntity (telemetry + error contract)
 *
 * **Completion check (getCompletionStatus):**
 * - Derived, not marked: a row exists for the org and carries a legalName.
 *   `onboarding_complete` was a marker section and died with the blob; a marker
 *   drifts out of sync with reality, a derived check is self-healing.
 *
 * **Not stored here:** `hqLocation.*` and `primaryContact.name` / `.email`.
 * OrgProfile declares no address property (the Address class was retired in
 * favour of the platform base `address` document) and resolves contact
 * name/email from the platform User rather than denormalizing them. The form
 * still collects all seven; they are dropped on save until the form shape is
 * settled.
 */
@Injectable({ providedIn: 'root' })
export class MarketplaceProfileService {
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Read profile for an org: one GQL query → project to struct.
   *
   * @param orgId — The org UUID to read profile for
   * @returns CompanyInfoStruct with pre-fill values + org fallbacks
   * @throws On GQL error or undefined orgId
   */
  async readProfileForOrg(orgId: string): Promise<CompanyInfoStruct> {
    if (!orgId) {
      throw new Error('Cannot read profile: orgId is undefined or empty');
    }

    let row: GqlOrgProfileResponse | null;

    try {
      row = await this.findRowForOrg(orgId);
    } catch (err) {
      this.snackBar.open(
        'Failed to load profile data',
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

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
      legalName: row?.legalName || orgName || '',
      dba: row?.dba ?? undefined,
      logoUrl: row?.logoUrl || orgAvatarUrl,
      shortBlurb: row?.shortDescription ?? undefined,
      longDescription: row?.longDescription ?? undefined,
      primaryContact: {
        userId: row?.primaryContactUserId ?? undefined,
        // name/email are resolved from the platform User, not stored — left
        // empty here rather than faked from a value we do not have.
        name: undefined,
        email: undefined,
      },
      website: row?.website ?? undefined,
      yearsInBusiness: yearsSince(row?.foundedYear),
      employeeCount: (row?.employeeCount as EmployeeCountBand | null) ?? undefined,
      businessClassification:
        (row?.businessClassification as BusinessClassification | null) ?? undefined,
    };

    return struct;
  }

  /**
   * Save profile: dirty-diff → overlay onto the stored row → one upsert.
   *
   * Only fields where current[field] !== original[field] are written. Org-fallback
   * pre-fills (legalName from Org.name, logoUrl from Org.avatarUrl) are NOT
   * written unless the user explicitly edited them.
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
    if (!orgId) {
      throw new Error('Cannot save profile: orgId is undefined or empty');
    }

    // The row is 1:1 with the org, so a write is a full-row upsert. Start from
    // what is stored, overlay only the fields the user actually changed.
    let existing: GqlOrgProfileResponse | null;
    try {
      existing = await this.findRowForOrg(orgId);
    } catch (err) {
      // A read failure here would silently turn an update into an insert and
      // orphan the stored row, so treat it as fatal rather than guessing.
      this.snackBar.open(
        'Failed to save profile: could not read the current profile',
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    const payload: Record<string, unknown> = {
      id: existing?.id ?? crypto.randomUUID(),
      name: existing?.name ?? `OrgProfile-${orgId}`,
      orgId,
      legalName: existing?.legalName ?? null,
      dba: existing?.dba ?? null,
      shortDescription: existing?.shortDescription ?? null,
      longDescription: existing?.longDescription ?? null,
      website: existing?.website ?? null,
      logoUrl: existing?.logoUrl ?? null,
      employeeCount: existing?.employeeCount ?? null,
      businessClassification: existing?.businessClassification ?? null,
      foundedYear: existing?.foundedYear ?? null,
      primaryContactUserId: existing?.primaryContactUserId ?? null,
      verified: false,
      verificationSource: null,
    };

    this.overlayDirtyFields(payload, current, original);

    try {
      await this.pipelineWrite.pushEntity(
        'OrgProfile',
        payload,
        [],
        'org-profile-company-profile-save',
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
   * Check whether the org's profile is complete.
   *
   * Derived rather than marked: an OrgProfile row exists and carries a
   * legalName — the form's only required field.
   *
   * @param orgId — The org UUID to check
   * @returns true if the org has a profile row with a legalName, false otherwise
   */
  async getCompletionStatus(orgId: string): Promise<boolean> {
    try {
      const row = await this.findRowForOrg(orgId);
      return !!row?.legalName?.trim();
    } catch (err) {
      console.error('Failed to check onboarding completion status:', err);
      return false;
    }
  }

  // ── Private helpers ──

  /**
   * Fetch the org's single OrgProfile row, or null if it has none.
   * @private
   */
  private async findRowForOrg(orgId: string): Promise<GqlOrgProfileResponse | null> {
    const result = await this.graphqlRead.query<GqlOrgProfileResponse>(
      'OrgProfile',
      [...ORG_PROFILE_FIELDS],
      {
        filters: { orgId: `.eq.${orgId}` },
        pageSize: 1,
      },
    );

    return result.items[0] ?? null;
  }

  /**
   * Overlay changed form values onto the upsert payload.
   *
   * **Dirty-diff semantics:**
   * - If current[field] !== original[field], the field is dirty
   * - Empty pre-fill + empty user input = not dirty
   * - Org-fallback pre-fill + no user edit = not dirty (the org field remains
   *   authoritative and the profile row keeps whatever it already held)
   *
   * @private
   */
  private overlayDirtyFields(
    payload: Record<string, unknown>,
    current: Partial<CompanyInfoStruct>,
    original: Partial<CompanyInfoStruct>,
  ): void {
    this.overlayIfDirty(payload, 'legalName', current.legalName, original.legalName);
    this.overlayIfDirty(payload, 'dba', current.dba, original.dba);
    this.overlayIfDirty(payload, 'logoUrl', current.logoUrl, original.logoUrl);
    this.overlayIfDirty(payload, 'shortDescription', current.shortBlurb, original.shortBlurb);
    this.overlayIfDirty(
      payload,
      'longDescription',
      current.longDescription,
      original.longDescription,
    );
    this.overlayIfDirty(payload, 'website', current.website, original.website);
    this.overlayIfDirty(
      payload,
      'employeeCount',
      current.employeeCount,
      original.employeeCount,
    );
    this.overlayIfDirty(
      payload,
      'businessClassification',
      current.businessClassification,
      original.businessClassification,
    );
    this.overlayIfDirty(
      payload,
      'primaryContactUserId',
      current.primaryContact?.userId,
      original.primaryContact?.userId,
    );

    // yearsInBusiness is a duration; the schema stores the year it started from.
    if (current.yearsInBusiness !== original.yearsInBusiness) {
      payload['foundedYear'] = foundedYearFrom(current.yearsInBusiness);
    }
  }

  /**
   * Write `value` onto the payload under `field` when it differs from the
   * snapshot. An empty-to-empty transition is not a change.
   * @private
   */
  private overlayIfDirty(
    payload: Record<string, unknown>,
    field: string,
    value: string | undefined,
    originalValue: string | undefined,
  ): void {
    if (value === originalValue) return;
    if (isEmpty(value) && isEmpty(originalValue)) return;

    payload[field] = isEmpty(value) ? null : value;
  }
}

/** Empty means null, undefined, or the empty string. */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** Derive years-in-business from the stored founding year. */
function yearsSince(foundedYear: number | null | undefined): number | undefined {
  if (foundedYear === null || foundedYear === undefined) return undefined;
  const years = new Date().getFullYear() - foundedYear;
  return years >= 0 ? years : undefined;
}

/** Convert an entered years-in-business duration back to a founding year. */
function foundedYearFrom(yearsInBusiness: number | undefined): number | null {
  if (yearsInBusiness === null || yearsInBusiness === undefined) return null;
  const years = Number(yearsInBusiness);
  if (!Number.isFinite(years) || years < 0) return null;
  return new Date().getFullYear() - Math.floor(years);
}
