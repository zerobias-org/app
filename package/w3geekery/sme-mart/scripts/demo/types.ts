/**
 * TypeScript interfaces for demo seed/cleanup operations.
 */

import type { ZerobiasSdk } from '@zerobias-com/zerobias-sdk';

/**
 * Configuration loaded from environment variables or ~/.config/mcp-zb/credentials.json.
 */
export interface DemoConfig {
  url: string;
  apiKey: string;
  orgId: string;
  environment: 'uat' | 'qa' | 'prod' | 'ci';
  pipelineId: string;
  profileName: string;
  allowProd: boolean;
}

/**
 * Execution context — holds the connected SDK plus identity state.
 */
export interface DemoContext {
  config: DemoConfig;
  sdk: ZerobiasSdk;
  partyId: string;
  orgId: string;
  tagId?: string;
}

/**
 * Tracking of created resource IDs for output, and classed lists for cleanup.
 */
export interface DemoEntityIds {
  rfpId: string;
  documentIds: string[];
  vendorPartyId: string;
  invitationId: string;
  bidId: string;
  formSubmissionId: string;
  pilotId: string;
}

/**
 * Single step in the seed/cleanup process.
 */
export interface SeedStep {
  name: string;
  status: 'pending' | 'done' | 'error';
  error?: string;
}

/**
 * Class name set used by demo seed (subset of SmeMartClassName in pipeline-write.service.ts).
 */
export type DemoClassName =
  | 'SmeMartProject'
  | 'SmeMartDocument'
  | 'RfpInvitation'
  | 'Bid'
  | 'FormSubmission';
