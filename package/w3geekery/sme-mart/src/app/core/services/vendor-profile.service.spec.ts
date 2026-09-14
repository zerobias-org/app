/**
 * Unit tests for VendorProfileService — the six typed classes that replaced the
 * MarketplaceProfileItem blob.
 *
 * The old suite tested one CRUD surface over a JSON `data` column. These test the
 * behaviours the typed rewrite introduced: per-class reads, singleton upsert (the bug
 * the old insert-only path had), derived `name`, and the certification claim junctions.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VendorProfileService } from './vendor-profile.service';
import { GraphqlReadService } from './graphql-read.service';
import { PipelineWriteService } from './pipeline-write.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import type { OrgProfileRecord } from '../models/vendor-profile.model';

function page<T>(items: T[]) {
  return { items, page: { pageNumber: 1, pageSize: 200, totalCount: items.length } };
}

const provenance = {
  verified: false,
  verificationSource: null,
  verifiedAt: null,
  verifiedBy: null,
  verificationExpiresAt: null,
};

function identity(overrides: Partial<OrgProfileRecord> = {}): OrgProfileRecord {
  return {
    id: 'identity-1', orgId: 'org-1', legalName: 'Acme Corp', dba: null, tagline: null,
    shortDescription: null, longDescription: null, website: null, logoUrl: null,
    foundedYear: null, businessClassification: null, employeeCount: null,
    primaryContactUserId: null, ...provenance, ...overrides,
  };
}

describe('VendorProfileService', () => {
  let service: VendorProfileService;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;

  beforeEach(() => {
    graphqlRead = fakeGraphqlReadService();
    pipelineWrite = fakePipelineWriteService();
    graphqlRead.query.mockResolvedValue(page([]));

    TestBed.configureTestingModule({
      providers: [
        VendorProfileService,
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });

    service = TestBed.inject(VendorProfileService);
  });

  describe('loadBundle()', () => {
    it('queries each section against its own class', async () => {
      await service.loadBundle('org-1');

      const classes = graphqlRead.query.mock.calls.map(c => c[0]);
      expect(classes).toContain('OrgProfile');
      expect(classes).toContain('FinancialProfile');
      expect(classes).toContain('ServiceCapability');
      expect(classes).toContain('InsuranceCoverage');
      expect(classes).toContain('ClientReference');
      expect(classes).toContain('Personnel');
    });

    it('filters every section by orgId', async () => {
      await service.loadBundle('org-1');

      for (const call of graphqlRead.query.mock.calls) {
        expect((call[2] as { filters: Record<string, string> }).filters)
          .toEqual({ orgId: '.eq.org-1' });
      }
    });

    it('collapses the two singleton sections to a row or null', async () => {
      graphqlRead.query.mockImplementation((className: string) =>
        Promise.resolve(className === 'OrgProfile' ? page([identity()]) : page([])),
      );

      const bundle = await service.loadBundle('org-1');

      expect(bundle.corporate_identity?.id).toBe('identity-1');
      expect(bundle.financial).toBeNull();
      expect(bundle.insurance).toEqual([]);
    });

    it('requests the provenance fields every attestation row carries', async () => {
      await service.loadBundle('org-1');

      const fields = graphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('verified');
      expect(fields).toContain('verificationSource');
      expect(fields).toContain('verificationExpiresAt');
    });

    it('returns an empty section rather than throwing when a read fails', async () => {
      graphqlRead.query.mockRejectedValue(new Error('boom'));

      const bundle = await service.loadBundle('org-1');

      expect(bundle.corporate_identity).toBeNull();
      expect(bundle.personnel).toEqual([]);
    });
  });

  describe('createRow()', () => {
    it('writes to the section class with a generated id and the orgId', async () => {
      const row = await service.createRow('insurance', 'org-1', { carrier: 'Lloyds' });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'InsuranceCoverage',
        expect.objectContaining({ orgId: 'org-1', carrier: 'Lloyds' }),
        [],
        'vendor-profile.service:create:insurance',
      );
      expect(row.id).toBeTruthy();
    });

    it('derives the required Object.name from the section primary field', async () => {
      await service.createRow('insurance', 'org-1', { carrier: 'Lloyds' });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'InsuranceCoverage',
        expect.objectContaining({ name: 'Lloyds' }),
        [],
        expect.any(String),
      );
    });

    it('falls back to a section label when the primary field is empty', async () => {
      await service.createRow('personnel', 'org-1', {});

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Personnel',
        expect.objectContaining({ name: 'Personnel' }),
        [],
        expect.any(String),
      );
    });

    it('starts a new row unverified', async () => {
      const row = await service.createRow('reference', 'org-1', { clientName: 'Initech' });
      expect(row.verified).toBe(false);
    });
  });

  describe('upsertSingleton()', () => {
    it('creates when the org has no row yet', async () => {
      graphqlRead.query.mockResolvedValue(page([]));

      await service.upsertSingleton('corporate_identity', 'org-1', { legalName: 'Acme' });

      const [, payload] = pipelineWrite.pushEntity.mock.calls[0];
      expect((payload as { id: string }).id).toBeTruthy();
    });

    it('REUSES the existing id rather than minting a new one', async () => {
      // The old insert-only path generated a fresh uuid on every save, so editing
      // produced a duplicate row instead of updating the first.
      graphqlRead.query.mockResolvedValue(page([identity()]));

      await service.upsertSingleton('corporate_identity', 'org-1', { legalName: 'Renamed' });

      const [, payload] = pipelineWrite.pushEntity.mock.calls[0];
      expect((payload as { id: string }).id).toBe('identity-1');
      expect((payload as { legalName: string }).legalName).toBe('Renamed');
    });

    it('preserves provenance already on the row when updating', async () => {
      graphqlRead.query.mockResolvedValue(page([
        identity({ verified: true, verificationSource: 'manual-review' }),
      ]));

      await service.upsertSingleton('corporate_identity', 'org-1', { tagline: 'New tagline' });

      const [, payload] = pipelineWrite.pushEntity.mock.calls[0];
      expect((payload as { verified: boolean }).verified).toBe(true);
      expect((payload as { verificationSource: string }).verificationSource).toBe('manual-review');
    });
  });

  describe('deleteRow()', () => {
    it('deletes against the section class', async () => {
      await service.deleteRow('personnel', 'p-1');
      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('Personnel', 'p-1');
    });
  });

  describe('certification claims', () => {
    it('filters the catalog by scope', async () => {
      await service.listCatalogQualifications('organizational');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'QualificationResource',
        expect.any(Array),
        expect.objectContaining({ filters: { scope: '.eq.organizational' } }),
      );
    });

    it('normalizes frameworkIds to an array when GQL returns a bare value', async () => {
      graphqlRead.query.mockResolvedValue(page([
        { id: 'sc-1', name: 'CISSP', frameworkIds: 'framework-1' },
      ]));

      const [entry] = await service.listCatalogQualifications('individual');

      expect(entry.frameworkIds).toEqual(['framework-1']);
    });

    it('treats an absent frameworkIds as empty, not malformed', async () => {
      graphqlRead.query.mockResolvedValue(page([{ id: 'sc-1', name: 'CISSP' }]));

      const [entry] = await service.listCatalogQualifications('individual');

      expect(entry.frameworkIds).toEqual([]);
    });

    it('claims an organizational-scope certification against OrgCertification', async () => {
      const claim = await service.addOrgCertification('org-1', 'CMMC.C3PAO', { certificationNumber: 'X-9' });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'OrgCertification',
        expect.objectContaining({ orgId: 'org-1', certificationCode: 'CMMC.C3PAO', certificationNumber: 'X-9' }),
        [],
        'vendor-profile.service:addOrgCertification',
      );
      expect(claim.verified).toBe(false);
    });

    it('claims an individual-scope certification against UserCertification, keyed on userId', async () => {
      await service.addUserCertification('user-1', 'ISC2.CISSP');

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'UserCertification',
        expect.objectContaining({ userId: 'user-1', certificationCode: 'ISC2.CISSP' }),
        [],
        'vendor-profile.service:addUserCertification',
      );
    });

    it('lists a user\'s claims by userId', async () => {
      await service.listUserCertifications('user-1');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'UserCertification',
        expect.any(Array),
        expect.objectContaining({ filters: { userId: '.eq.user-1' } }),
      );
    });
  });
});
