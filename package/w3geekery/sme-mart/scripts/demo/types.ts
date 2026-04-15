/**
 * TypeScript interfaces for demo seed/cleanup operations.
 */

/**
 * Configuration loaded from environment variables.
 */
export interface DemoConfig {
  apiKey: string;
  orgId: string;
  token: string;
  environment: 'uat' | 'qa' | 'prod';
  allowProd: boolean;
}

/**
 * Execution context initialized from config and API queries.
 */
export interface DemoContext {
  config: DemoConfig;
  partyId: string;
  orgId: string;
  tagId?: string;
}

/**
 * Tracking of created resource IDs for output and cleanup.
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
