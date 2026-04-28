import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SimpleBatch } from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';

const ZEROBIAS_ORG_ID = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';
// Empirically-validated UAT class id (Pipeline.receive accepts this; the schema-derived
// UUID v5 'ee1e68b7-...' in pipeline-write.service.ts was rejected with "No such Class").
// See errata in DECISIONS.md / phase-26 if this divergence persists across envs.
const MPI_CLASS_ID = '7bcf86a5-91dc-520d-b9bf-e308b1078d46';
const CLEANUP_IDS = ['mpi-test-a-cd7105df', 'mpi-test-b-cd7105df'];

export interface SeedSection {
  section: string;
  data: string;
}

// Option-b distinguisher (Plan 26-01 DECISIONS.md): provider_type section identifies
// platform providers. NO Object.tag, NO hardcoded orgId filter.
export const SEED_SECTIONS: SeedSection[] = [
  { section: 'legal_name', data: 'ZeroBias' },
  { section: 'logo_url', data: 'https://zerobias.com/logo.png' },
  { section: 'short_blurb', data: 'Cybersecurity and compliance automation platform' },
  {
    section: 'long_description',
    data: 'ZeroBias is a platform for automating cybersecurity and compliance frameworks.',
  },
  { section: 'website', data: 'https://zerobias.com' },
  { section: 'years_in_business', data: '10' },
  { section: 'employee_count', data: '201-500' },
  { section: 'provider_type', data: 'platform' },
];

export interface MPIRecord {
  id: string;
  name: string;
  orgId: string;
  section: string;
  data: string;
  status: string;
}

export function buildMPIRecord(section: SeedSection): MPIRecord {
  return {
    id: `mpi-${ZEROBIAS_ORG_ID}-${section.section}`,
    name: `MPI - ZeroBias - ${section.section}`,
    orgId: ZEROBIAS_ORG_ID,
    section: section.section,
    data: section.data,
    status: 'active',
  };
}

@Injectable({ providedIn: 'root' })
export class SeedZbProviderService {
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly classId = MPI_CLASS_ID;
  readonly orgId = ZEROBIAS_ORG_ID;
  readonly cleanupIds = CLEANUP_IDS;

  buildBatch(): SimpleBatch {
    const records = SEED_SECTIONS.filter(s => s.data).map(buildMPIRecord);
    return new SimpleBatch(
      new UUID(MPI_CLASS_ID),
      records,
      [],
      CLEANUP_IDS,
    );
  }

  async seed(): Promise<void> {
    const pipelineApi = this.clientApi.platformClient.getPipelineApi();
    const batch = this.buildBatch();
    await pipelineApi.receive(new UUID(environment.pipelineId), batch);
  }
}
