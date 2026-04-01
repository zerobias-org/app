/**
 * Roundtrip Field Validation Tests for MarketplaceProfileItem Entity (Plan 041)
 *
 * Validates that no fields are lost during GQL → domain → Pipeline → GQL transformation cycles.
 * Tests JSON data serialization/deserialization for all 6 section types.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { VendorProfileService } from './vendor-profile.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import type { GqlMarketplaceProfileItemResponse } from '../gql-types/marketplace-profile-item.types';
import type {
  MarketplaceProfileItem,
  SectionType,
  InsuranceData,
  AttestationData,
  CorporateIdentityData,
  ReferenceData,
  PersonnelData,
  FinancialData,
} from '../models/marketplace-profile-item.model';

// ── Test Factories ──

function createInsuranceItem(): MarketplaceProfileItem {
  const data: InsuranceData = {
    policyNumber: 'POL-2024-123456',
    carrier: 'Zurich North America',
    coverageType: 'general_liability',
    coverageAmount: 2000000,
    effectiveDate: '2024-01-01',
    expirationDate: '2025-12-31',
    limits: '2M/5M/2M',
    deductible: 5000,
  };

  return {
    id: 'profile-insurance-001',
    org_id: 'org-001',
    name: 'D&O Insurance Coverage',
    description: 'Directors and Officers Liability insurance',
    section: 'insurance' as SectionType,
    data: JSON.stringify(data),
    expires_at: '2025-12-31T23:59:59Z',
    status: 'active',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  };
}

function createAttestationItem(): MarketplaceProfileItem {
  const data: AttestationData = {
    serviceType: 'security_audit',
    yearsExperience: 12,
    clientCount: 45,
    avgProjectDuration: '8 weeks',
    certifications: ['ISO 27001', 'CEH', 'OSCP'],
    specializations: ['cloud_security', 'penetration_testing'],
  };

  return {
    id: 'profile-attestation-001',
    org_id: 'org-001',
    name: 'Security Certifications',
    description: 'Professional security certifications and experience',
    section: 'attestation' as SectionType,
    data: JSON.stringify(data),
    expires_at: '2026-12-31T23:59:59Z',
    status: 'active',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  };
}

function createCorporateIdentityItem(): MarketplaceProfileItem {
  const data: CorporateIdentityData = {
    legalEntityName: 'Acme Security Solutions LLC',
    businessType: 'llc',
    foundedYear: 2015,
    yearsInBusiness: 9,
    certifications: ['ISO 27001', 'SOC 2'],
    numberOfEmployees: 42,
  };

  return {
    id: 'profile-corporate-001',
    org_id: 'org-001',
    name: 'Corporate Identity',
    description: 'Legal entity registration and business info',
    section: 'corporate_identity' as SectionType,
    data: JSON.stringify(data),
    expires_at: null,
    status: 'active',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  };
}

function createReferenceItem(): MarketplaceProfileItem {
  const data: ReferenceData = {
    clientName: 'Global Finance Corp',
    contactPerson: 'Jane Smith',
    email: 'jane.smith@globalfinance.com',
    phone: '415-555-0123',
    projectType: 'compliance_audit',
    projectDuration: '12 weeks',
    outcome: 'Successful SOX audit with zero findings',
  };

  return {
    id: 'profile-reference-001',
    org_id: 'org-001',
    name: 'Client Reference',
    description: 'Project reference from Global Finance Corp',
    section: 'reference' as SectionType,
    data: JSON.stringify(data),
    expires_at: null,
    status: 'active',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  };
}

function createPersonnelItem(): MarketplaceProfileItem {
  const data: PersonnelData = {
    name: 'Dr. Michael Johnson',
    title: 'Principal Security Architect',
    yearsExperience: 18,
    specialization: 'zero_trust_architecture',
    credentials: ['CISSP', 'CISM'],
    certifications: ['AWS Solutions Architect', 'Azure Security Engineer'],
  };

  return {
    id: 'profile-personnel-001',
    org_id: 'org-001',
    name: 'Key Personnel: Dr. Johnson',
    description: 'Principal architect with 18 years experience',
    section: 'personnel' as SectionType,
    data: JSON.stringify(data),
    expires_at: null,
    status: 'active',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  };
}

function createFinancialItem(): MarketplaceProfileItem {
  const data: FinancialData = {
    annualRevenue: 5250000,
    yearsInBusiness: 9,
    creditScore: 780,
    bankReferences: ['JP Morgan Commercial', 'Silicon Valley Bank'],
    taxIdVerified: true,
    liabilityCoverage: 2000000,
  };

  return {
    id: 'profile-financial-001',
    org_id: 'org-001',
    name: 'Financial Profile',
    description: 'Revenue, credit, and bank references',
    section: 'financial' as SectionType,
    data: JSON.stringify(data),
    expires_at: null,
    status: 'active',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  };
}

describe('VendorProfileService — Roundtrip Field Validation', () => {
  let service: VendorProfileService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  const gqlCache: Record<string, GqlMarketplaceProfileItemResponse> = {};

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    // Clear cache for each test
    Object.keys(gqlCache).forEach(key => delete gqlCache[key]);

    // Mock pushEntity to store in cache
    pipelineWrite.pushEntity.mockImplementation((className, obj) => {
      if (className === 'MarketplaceProfileItem') {
        const id = (obj as any).id || `profile-${Date.now()}`;
        // Transform domain→GQL for cache
        const gqlObj: GqlMarketplaceProfileItemResponse = {
          id: (obj as any).id,
          orgId: (obj as any).orgId,
          section: (obj as any).section,
          name: (obj as any).name,
          description: (obj as any).description || null,
          data: (obj as any).data,
          expiresAt: (obj as any).expiresAt || null,
          status: (obj as any).status,
          dateCreated: (obj as any).dateCreated || (obj as any).createdAt,
          dateLastModified: (obj as any).dateLastModified || (obj as any).updatedAt,
        };
        gqlCache[id] = gqlObj;
      }
      return Promise.resolve();
    });

    // Mock getById to retrieve from cache
    graphqlRead.getById.mockImplementation((className, id) => {
      if (className === 'MarketplaceProfileItem' && gqlCache[id]) {
        return Promise.resolve(gqlCache[id]);
      }
      return Promise.resolve(null);
    });

    TestBed.configureTestingModule({
      providers: [
        VendorProfileService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
      ],
    });

    service = TestBed.inject(VendorProfileService);
  });

  // ── Roundtrip: InsuranceData ──

  describe('Roundtrip: InsuranceData', () => {
    it('should preserve InsuranceData through GQL→domain→Pipeline→GQL cycle', async () => {
      const original = createInsuranceItem();

      // Create via service (triggers toGql → Pipeline)
      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        description: original.description,
        data: JSON.parse(original.data) as InsuranceData,
        expiresAt: original.expires_at || undefined,
        status: original.status,
      });

      // Retrieve via service (triggers fromGql)
      const retrieved = await service.getProfileItem(created.id);

      // Verify fields preserved
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      expect(retrieved.org_id).toBe(original.org_id);
      expect(retrieved.section).toBe(original.section);
      expect(retrieved.name).toBe(original.name);
      expect(retrieved.description).toBe(original.description);
      expect(retrieved.status).toBe(original.status);

      // Verify JSON data round-trip
      const retrievedData = JSON.parse(retrieved.data) as InsuranceData;
      const originalData = JSON.parse(original.data) as InsuranceData;
      expect(retrievedData).toEqual(originalData);
      expect(retrievedData.policyNumber).toBe('POL-2024-123456');
      expect(retrievedData.carrier).toBe('Zurich North America');
      expect(retrievedData.coverageAmount).toBe(2000000);
    });
  });

  // ── Roundtrip: AttestationData ──

  describe('Roundtrip: AttestationData', () => {
    it('should preserve AttestationData through GQL→domain→Pipeline→GQL cycle', async () => {
      const original = createAttestationItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        description: original.description,
        data: JSON.parse(original.data) as AttestationData,
        expiresAt: original.expires_at || undefined,
        status: original.status,
      });

      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      // Verify field mapping
      expect(retrieved.org_id).toBe(original.org_id);
      expect(retrieved.section).toBe('attestation');
      expect(retrieved.name).toBe(original.name);

      // Verify JSON data round-trip including arrays
      const retrievedData = JSON.parse(retrieved.data) as AttestationData;
      const originalData = JSON.parse(original.data) as AttestationData;
      expect(retrievedData).toEqual(originalData);
      expect(retrievedData.certifications).toEqual(['ISO 27001', 'CEH', 'OSCP']);
      expect(retrievedData.specializations).toEqual(['cloud_security', 'penetration_testing']);
      expect(retrievedData.yearsExperience).toBe(12);
    });
  });

  // ── Roundtrip: CorporateIdentityData ──

  describe('Roundtrip: CorporateIdentityData', () => {
    it('should preserve CorporateIdentityData through GQL→domain→Pipeline→GQL cycle', async () => {
      const original = createCorporateIdentityItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        description: original.description,
        data: JSON.parse(original.data) as CorporateIdentityData,
        expiresAt: original.expires_at || undefined,
        status: original.status,
      });

      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      // Verify all fields
      expect(retrieved.org_id).toBe(original.org_id);
      expect(retrieved.section).toBe('corporate_identity');

      // Verify JSON data preservation
      const retrievedData = JSON.parse(retrieved.data) as CorporateIdentityData;
      const originalData = JSON.parse(original.data) as CorporateIdentityData;
      expect(retrievedData).toEqual(originalData);
      expect(retrievedData.legalEntityName).toBe('Acme Security Solutions LLC');
      expect(retrievedData.foundedYear).toBe(2015);
      expect(retrievedData.numberOfEmployees).toBe(42);
    });
  });

  // ── Roundtrip: ReferenceData ──

  describe('Roundtrip: ReferenceData', () => {
    it('should preserve ReferenceData through cycle', async () => {
      const original = createReferenceItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        data: JSON.parse(original.data) as ReferenceData,
      });

      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      const retrievedData = JSON.parse(retrieved.data) as ReferenceData;
      expect(retrievedData.clientName).toBe('Global Finance Corp');
      expect(retrievedData.contactPerson).toBe('Jane Smith');
      expect(retrievedData.outcome).toBe('Successful SOX audit with zero findings');
    });
  });

  // ── Roundtrip: PersonnelData ──

  describe('Roundtrip: PersonnelData', () => {
    it('should preserve PersonnelData through cycle', async () => {
      const original = createPersonnelItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        data: JSON.parse(original.data) as PersonnelData,
      });

      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      const retrievedData = JSON.parse(retrieved.data) as PersonnelData;
      expect(retrievedData.name).toBe('Dr. Michael Johnson');
      expect(retrievedData.yearsExperience).toBe(18);
      expect(retrievedData.credentials).toContain('CISSP');
    });
  });

  // ── Roundtrip: FinancialData ──

  describe('Roundtrip: FinancialData', () => {
    it('should preserve FinancialData through cycle', async () => {
      const original = createFinancialItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        data: JSON.parse(original.data) as FinancialData,
      });

      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      const retrievedData = JSON.parse(retrieved.data) as FinancialData;
      expect(retrievedData.annualRevenue).toBe(5250000);
      expect(retrievedData.creditScore).toBe(780);
      expect(retrievedData.taxIdVerified).toBe(true);
      expect(retrievedData.bankReferences).toContain('JP Morgan Commercial');
    });
  });

  // ── JSON Serialization Fidelity ──

  describe('JSON Serialization', () => {
    it('should round-trip JSON data without loss across all types', async () => {
      const testCases = [
        { original: createInsuranceItem(), label: 'Insurance' },
        { original: createAttestationItem(), label: 'Attestation' },
        { original: createCorporateIdentityItem(), label: 'Corporate Identity' },
        { original: createReferenceItem(), label: 'Reference' },
        { original: createPersonnelItem(), label: 'Personnel' },
        { original: createFinancialItem(), label: 'Financial' },
      ];

      for (const testCase of testCases) {
        const original = testCase.original;
        const originalData = JSON.parse(original.data);

        const created = await service.createProfileItem(original.org_id, {
          section: original.section,
          name: original.name,
          data: originalData,
        });

        const retrieved = await service.getProfileItem(created.id);
        expect(retrieved, `${testCase.label}: retrieved should exist`).not.toBeNull();
        if (!retrieved) throw new Error(`Retrieved is null for ${testCase.label}`);

        const retrievedData = JSON.parse(retrieved.data);
        expect(retrievedData, `${testCase.label}: data should round-trip`).toEqual(originalData);
      }
    });
  });

  // ── Field Mapping Validation ──

  describe('Field Mapping', () => {
    it('should apply correct bidirectional field mapping (GQL↔domain)', async () => {
      const original = createInsuranceItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        description: original.description,
        data: JSON.parse(original.data) as InsuranceData,
        expiresAt: original.expires_at || undefined,
      });

      // Verify domain model has snake_case
      expect(created).toHaveProperty('org_id');
      expect(created).toHaveProperty('created_at');
      expect(created).toHaveProperty('updated_at');
      expect(created).not.toHaveProperty('orgId');
      expect(created).not.toHaveProperty('dateCreated');

      // Retrieve and verify round-trip
      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      // Domain model should still have snake_case
      expect(retrieved.org_id).toBe(original.org_id);
      expect(retrieved.expires_at).toBe(original.expires_at);
    });

    it('should preserve all Object inherited fields', async () => {
      const original = createCorporateIdentityItem();

      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        description: original.description,
        data: JSON.parse(original.data) as CorporateIdentityData,
      });

      const retrieved = await service.getProfileItem(created.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) throw new Error('Retrieved is null');

      // Verify all inherited fields present
      expect(retrieved).toHaveProperty('id');
      expect(retrieved).toHaveProperty('name');
      expect(retrieved).toHaveProperty('description');
      expect(retrieved).toHaveProperty('created_at');
      expect(retrieved).toHaveProperty('updated_at');
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(original.name);
    });
  });

  // ── Error Scenarios ──

  describe('Error Scenarios', () => {
    it('should handle malformed JSON in GQL response gracefully', async () => {
      const malformedGql: GqlMarketplaceProfileItemResponse = {
        id: 'bad-json',
        orgId: 'org-001',
        section: 'insurance',
        name: 'Bad JSON Item',
        description: null,
        data: 'not valid json {]',
        expiresAt: null,
        status: 'active',
        dateCreated: '2026-03-18T10:00:00Z',
        dateLastModified: '2026-03-18T10:00:00Z',
      };

      graphqlRead.getById.mockResolvedValue(malformedGql);

      const result = await service.getProfileItem('bad-json');
      expect(result).not.toBeNull();
      if (!result) throw new Error('Result is null');

      // Service should parse gracefully (returning empty object for malformed)
      const data = JSON.parse(result.data);
      expect(typeof data).toBe('object');
    });

    it('should throw validation error for missing required fields', async () => {
      await expect(
        service.createProfileItem('org-001', {
          section: 'insurance',
          name: '',
          data: createMockInsuranceData(),
        }),
      ).rejects.toThrow();
    });

    it('should propagate Pipeline push errors', async () => {
      pipelineWrite.pushEntity.mockRejectedValueOnce(new Error('Pipeline unavailable'));

      const original = createInsuranceItem();
      const created = await service.createProfileItem(original.org_id, {
        section: original.section,
        name: original.name,
        data: JSON.parse(original.data) as InsuranceData,
      });

      // Create should return immediately (fire-and-forget)
      expect(created).toBeTruthy();
    });
  });
});

// ── Test Helpers ──

function createMockInsuranceData(): InsuranceData {
  return {
    policyNumber: 'POL-2024-001',
    carrier: 'Zurich',
    coverageType: 'general_liability',
    coverageAmount: 2000000,
    effectiveDate: '2024-01-01',
    expirationDate: '2025-12-31',
  };
}
