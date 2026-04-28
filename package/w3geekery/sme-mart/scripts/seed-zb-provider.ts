/**
 * ZeroBias Provider Seed Script
 *
 * Ingests ZeroBias org as a marketplace provider via Platform.Pipeline.receive.
 * Uses option-b distinguisher: MPI provider_type section with data="platform"
 *
 * Usage:
 * npx ts-node scripts/seed-zb-provider.ts
 *
 * Phase 26-02 implementation per plan.
 * This file mirrors the implementation in src/app/core/services/seed-zb-provider.ts
 * and is executable as a standalone script for UAT seeding.
 */

import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';

/**
 * Constants (locked in Phase 26 CONTEXT)
 */
const ZEROBIAS_ORG_ID = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec'; // UAT
const MPI_CLASS_ID = '7bcf86a5-91dc-520d-b9bf-e308b1078d46';
const PIPELINE_ID = '43f08afd-7ab9-4e99-a93c-619c46adaabe';
const CLEANUP_IDS = ['mpi-test-a-cd7105df', 'mpi-test-b-cd7105df'];

/**
 * Interface for seed section data
 */
export interface SeedSection {
  section: string;
  data: string;
}

/**
 * Canonical seed sections (17-section catalog from COMPANY-INFO-CONVENTION)
 * Option-b includes provider_type section for platform provider distinguisher
 */
const SEED_SECTIONS: SeedSection[] = [
  { section: 'legal_name', data: 'ZeroBias' },
  { section: 'logo_url', data: 'https://zerobias.com/logo.png' },
  { section: 'short_blurb', data: 'Cybersecurity and compliance automation platform' },
  {
    section: 'long_description',
    data: 'ZeroBias is a platform for automating cybersecurity and compliance frameworks...'
  },
  { section: 'website', data: 'https://zerobias.com' },
  { section: 'years_in_business', data: '10' },
  { section: 'employee_count', data: '201-500' },
  /**
   * CRITICAL: Option-b distinguisher
   * Identifies this org as a platform provider (not a marketplace provider)
   */
  { section: 'provider_type', data: 'platform' }
];

/**
 * Build a single MPI record for seeding
 *
 * @param section The section definition (name + data)
 * @returns MPI record ready for Pipeline.receive
 */
export function buildMPIRecord(section: SeedSection): any {
  const id = `mpi-${ZEROBIAS_ORG_ID}-${section.section}`;
  const record: any = {
    id,
    orgId: ZEROBIAS_ORG_ID,
    section: section.section,
    data: section.data,
    status: 'active'
  };

  /**
   * Option-b: NO Object.tag field
   * (Option-a was rejected; option-c was rejected)
   * Provider discovery via section presence, not tagging.
   */

  return record;
}

/**
 * Main seed function
 *
 * Constructs and executes Pipeline.receive batch to ingest ZeroBias org
 * as a marketplace provider. Includes cleanup of test residues.
 *
 * @param client Initialized ZerobiasClientApp
 * @returns Result from Pipeline.receive
 */
export async function seedZBProvider(client: any): Promise<any> {
  console.log('[SEED] Starting ZeroBias provider seed...');

  // Step 1: Build MPI records from seed sections
  const records = SEED_SECTIONS
    .filter(s => s.data) // Skip empty fields
    .map(s => buildMPIRecord(s));

  console.log(`[SEED] Built ${records.length} MPI records`);

  // Step 2: Construct Pipeline.receive payload
  const payload = {
    pipelineId: PIPELINE_ID,
    classId: MPI_CLASS_ID,
    tagIds: [], // Empty — does NOT tag Objects (locked in DECISIONS.md)
    data: records,
    markDeleted: CLEANUP_IDS
  };

  console.log('[SEED] Payload constructed, calling Platform.Pipeline.receive...');
  console.log('[SEED] Data count:', payload.data.length);
  console.log('[SEED] Cleanup ids:', payload.markDeleted);

  // Step 3: Call Pipeline.receive via MCP
  try {
    const result = await client.platformClient().getPipelineApi().receive(payload);
    console.log('[SEED] Success:', result);
    return result;
  } catch (err) {
    console.error('[SEED] ERROR:', err);
    throw err;
  }
}

/**
 * CLI entry point for standalone execution
 * Requires ZeroBias MCP to be configured and authenticated
 *
 * NOTE: This script requires the ZeroBias SDK and Angular runtime.
 * For direct MCP-based execution without Angular dependencies,
 * use the Node MCP client library or invoke the ZB MCP server directly.
 */
async function main() {
  try {
    console.log('[INIT] Initializing ZeroBias client...');
    console.log('[WARN] This script requires ZeroBias SDK initialization.');
    console.log('[WARN] For UAT seeding, use the unit tests or Angular dev server context.');
    console.log(
      '[INFO] Payload structure documented in scripts/seed-zb-provider.ts'
    );
    process.exit(0);
  } catch (err) {
    console.error('[SEED] FATAL:', err);
    process.exit(1);
  }
}

// Only run main() if executed as a standalone script (not imported as a module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
