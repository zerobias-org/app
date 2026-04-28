/**
 * ZeroBias Provider Seed Function Tests
 *
 * Validates the seed payload for ZeroBias org ingestion via Platform.Pipeline.receive.
 * Follows option-b (MPI provider_type section) per Plan 26-01 decision.
 */

import { describe, it, expect } from 'vitest';
import { buildMPIRecord, seedZBProvider } from './seed-zb-provider';

describe('seedZBProvider', () => {
  /**
   * Test 1: Deterministic IDs
   * Validates that MPI record ids are constructed consistently per (orgId, section)
   */
  it('should construct deterministic ids for each section', () => {
    const section = { section: 'legal_name', data: 'ZeroBias' };
    const record = buildMPIRecord(section);
    expect(record.id).toBe('mpi-57c741cf-a58e-5efc-bf2f-93c4f6cf76ec-legal_name');
    expect(record.orgId).toBe('57c741cf-a58e-5efc-bf2f-93c4f6cf76ec');
    expect(record.section).toBe('legal_name');
    expect(record.data).toBe('ZeroBias');
    expect(record.status).toBe('active');
  });

  /**
   * Test 2: provider_type section (option-b distinguisher)
   * Option-b: Add provider_type section with data="platform" to identify platform providers
   * No Object.tag field needed (option-a was rejected in Plan 26-01)
   */
  it('should include provider_type section with data=platform for platform provider identification', () => {
    const section = { section: 'provider_type', data: 'platform' };
    const record = buildMPIRecord(section);
    expect(record.section).toBe('provider_type');
    expect(record.data).toBe('platform');
    // CRITICAL: option-b means NO Object.tag field
    expect(record.tag).toBeUndefined();
  });

  /**
   * Test 3: markDeleted cleanup
   * Validates that cleanup residue ids are included in the payload
   */
  it('should include markDeleted cleanup ids in payload', async () => {
    const mockClient = {
      platformClient: () => ({
        getPipelineApi: () => ({
          receive: async (payload: any) => {
            expect(payload.markDeleted).toContain('mpi-test-a-cd7105df');
            expect(payload.markDeleted).toContain('mpi-test-b-cd7105df');
            // TAG-SHAPE-TEST-C is a different class (SmeMartProject), NOT in MPI cleanup
            expect(payload.markDeleted).not.toContain('64047b6c-52e7-4592-ac1d-27f5020d1e01');
            return { success: true };
          }
        })
      })
    };
    await seedZBProvider(mockClient as any);
  });

  /**
   * Test 4: Payload structure
   * Validates that Pipeline.receive payload has correct shape and required fields
   */
  it('should construct valid Pipeline.receive payload', async () => {
    const mockClient = {
      platformClient: () => ({
        getPipelineApi: () => ({
          receive: async (payload: any) => {
            expect(payload.pipelineId).toBe('43f08afd-7ab9-4e99-a93c-619c46adaabe');
            expect(payload.classId).toBe('7bcf86a5-91dc-520d-b9bf-e308b1078d46');
            expect(payload.tagIds).toEqual([]);
            expect(Array.isArray(payload.data)).toBe(true);
            expect(payload.data.length).toBeGreaterThan(0);
            expect(Array.isArray(payload.markDeleted)).toBe(true);
            return { success: true };
          }
        })
      })
    };
    await seedZBProvider(mockClient as any);
  });

  /**
   * Test 5: Required sections present
   * Validates that all required company_info sections are seeded
   * Includes provider_type section per option-b distinguisher
   */
  it('should include all required sections in seed batch', async () => {
    const requiredSections = [
      'legal_name',
      'logo_url',
      'short_blurb',
      'long_description',
      'website',
      'years_in_business',
      'employee_count',
      'provider_type' // option-b: distinguisher section
    ];
    const mockClient = {
      platformClient: () => ({
        getPipelineApi: () => ({
          receive: async (payload: any) => {
            const sections = payload.data.map((r: any) => r.section);
            requiredSections.forEach(req => {
              expect(sections).toContain(req);
            });
            return { success: true };
          }
        })
      })
    };
    await seedZBProvider(mockClient as any);
  });
});
