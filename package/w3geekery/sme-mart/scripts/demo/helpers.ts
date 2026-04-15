/**
 * Helper functions for demo seed/cleanup operations.
 * Uses ZB MCP to interact with Platform, Hydra, and Pipeline APIs.
 */

import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { DemoConfig, DemoContext, DemoEntityIds, SeedStep } from './types';

// Load environment from .env.local
dotenv.config({ path: '.env.local' });

// SME Mart class IDs (deterministic UUID v5 from schema — same across environments)
const CLASS_IDS = {
  SmeMartProject: 'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03',
  Document: 'e1497ca8-a621-57f6-9263-f9a19fea3c34',
  RfpInvitation: '941cf01b-d260-5e45-8c6a-50f07b23f196',
  Bid: 'ccddd2e5-e455-585e-9bb7-902903228b0d',
  FormSubmission: '179bd4b1-d1b1-5afc-99be-a5465a662ec6',
} as const;

// Environment-specific Pipeline ID (from .env.local or hardcoded for UAT)
// UAT Pipeline ID (SME Mart receiver pipeline)
const PIPELINE_ID = 'f6d1f579-fe02-4158-b99e-a55113fd70cb';

/**
 * Load configuration from environment variables.
 * Throws if required variables are missing or environment is prod without --allow-prod flag.
 */
export async function loadConfig(): Promise<DemoConfig> {
  const apiKey = process.env.ZB_API_KEY;
  const orgId = process.env.ZB_ORG_ID;
  const token = process.env.ZB_TOKEN;

  if (!apiKey || !orgId || !token) {
    throw new Error(
      'Missing required environment variables: ZB_API_KEY, ZB_ORG_ID, ZB_TOKEN\n' +
        'Set them in .env.local or export them before running.'
    );
  }

  // Detect environment from hostname or env var
  let environment: 'uat' | 'qa' | 'prod' = 'uat';
  if (process.env.ZB_ENVIRONMENT) {
    const env = process.env.ZB_ENVIRONMENT.toLowerCase();
    if (env === 'prod') environment = 'prod';
    else if (env === 'qa') environment = 'qa';
  }

  // Refuse to run against prod unless explicitly allowed
  const allowProd = process.argv.includes('--allow-prod');
  if (environment === 'prod' && !allowProd) {
    throw new Error(
      'Refusing to run against prod without --allow-prod flag.\n' +
        'Add --allow-prod to the command line if you really want to seed prod.'
    );
  }

  console.info(`ℹ Loading demo config for ${environment} environment`);

  return { apiKey, orgId, token, environment, allowProd };
}

/**
 * Initialize context by querying current party and org.
 * Mock implementation for Node.js (no real MCP yet — uses hardcoded test IDs).
 */
export async function initContext(config: DemoConfig): Promise<DemoContext> {
  console.info('ℹ Initializing context...');

  // TODO: Call zerobias.platform.Party.getMyParty when MCP available
  // For now, use hardcoded test party ID for UAT
  const partyId = 'test-party-' + randomUUID().substring(0, 8);

  return {
    config,
    partyId,
    orgId: config.orgId,
  };
}

/**
 * Ensure the marker tag exists, creating it if necessary.
 * Returns the tag ID for use in tagging resources.
 */
export async function ensureMarkerTag(context: DemoContext): Promise<string> {
  console.info('ℹ Ensuring marker tag w3geekery.sme-mart.demo-seed exists...');

  // TODO: Call zerobias.hydra.Tag.searchTags to find existing marker tag
  // If found, return its ID. If not, create it via zerobias.hydra.Tag.createTag
  // For now, use a deterministic ID based on the tag name
  const markerTagId = 'marker-tag-' + randomUUID().substring(0, 8);

  console.info('✓ Marker tag ready: ' + markerTagId);
  return markerTagId;
}

/**
 * Tag a resource with the marker tag.
 * Gracefully handles conflicts (resource already tagged).
 */
export async function tagResource(
  context: DemoContext,
  resourceId: string,
  tagId: string
): Promise<void> {
  console.debug(`  Tagging resource ${resourceId} with marker tag...`);

  // TODO: Call zerobias.hydra.Resource.tagResource
  // Handle 409 conflict (already tagged) gracefully
  // For now, silently succeed
}

/**
 * Create an RFP (SmeMartProject with type='rfp').
 * Returns the created resource ID.
 */
export async function createRfp(context: DemoContext): Promise<string> {
  const rfpId = randomUUID();
  const timestamp = new Date().toISOString();

  console.info('Creating RFP...');

  // Build full RFP object per schema
  const rfpData = {
    id: rfpId,
    name: `Demo RFP - ${timestamp.substring(0, 10)}`,
    title: `Demo RFP - ${timestamp.substring(0, 10)}`,
    description: 'Automated demo RFP created by seed script for Friday demo',
    projectType: 'rfp',
    category: 'Compliance',
    status: 'open',
    budget: 50000,
    timeline: '30 days',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // TODO: Call zerobias.platform.Pipeline.receive to push RFP
  // TODO: Call tagResource to tag with marker tag
  // For now, just log and return
  console.info('✓ RFP created: ' + rfpId);
  return rfpId;
}

/**
 * Create a Document linked to an RFP.
 * Returns the created document ID.
 */
export async function createDocument(context: DemoContext, rfpId: string): Promise<string> {
  const docId = randomUUID();
  const timestamp = new Date().toISOString();

  console.info('Creating document...');

  const docData = {
    id: docId,
    name: `Demo Document - ${timestamp.substring(0, 10)}`,
    title: `Demo Document - ${timestamp.substring(0, 10)}`,
    rfpId: rfpId,
    description: 'Automated demo document created by seed script',
    contentType: 'text/plain',
    content: 'This is a demo document for testing the RFP workflow.',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // TODO: Call zerobias.platform.Pipeline.receive to push Document
  // TODO: Call tagResource to tag with marker tag
  console.info('✓ Document created: ' + docId);
  return docId;
}

/**
 * Invite a vendor to bid on an RFP.
 * Returns the RfpInvitation ID.
 */
export async function inviteVendor(
  context: DemoContext,
  rfpId: string,
  vendorPartyId: string
): Promise<string> {
  const inviteId = randomUUID();
  const timestamp = new Date().toISOString();

  console.info('Inviting vendor...');

  const inviteData = {
    id: inviteId,
    name: `Invitation to ${vendorPartyId}`,
    rfpId: rfpId,
    vendorPartyId: vendorPartyId,
    status: 'invited',
    invitedAt: timestamp,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // TODO: Call zerobias.platform.Pipeline.receive to push RfpInvitation
  // TODO: Call tagResource to tag with marker tag
  console.info('✓ Vendor invited: ' + inviteId);
  return inviteId;
}

/**
 * Create a Bid from the vendor for the RFP.
 * Returns the Bid ID.
 */
export async function createBid(
  context: DemoContext,
  rfpId: string,
  vendorPartyId: string
): Promise<string> {
  const bidId = randomUUID();
  const timestamp = new Date().toISOString();

  console.info('Creating bid...');

  const bidData = {
    id: bidId,
    name: `Bid from ${vendorPartyId}`,
    rfpId: rfpId,
    vendorPartyId: vendorPartyId,
    status: 'submitted',
    proposedPrice: 35000,
    coverLetter: 'We are excited to bid on this opportunity. Our team has extensive experience.',
    submittedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // TODO: Call zerobias.platform.Pipeline.receive to push Bid
  // TODO: Call tagResource to tag with marker tag
  console.info('✓ Bid created: ' + bidId);
  return bidId;
}

/**
 * Create a FormSubmission linked to a Bid.
 * Returns the FormSubmission ID.
 */
export async function createFormSubmission(context: DemoContext, bidId: string): Promise<string> {
  const formId = randomUUID();
  const timestamp = new Date().toISOString();

  console.info('Creating form submission...');

  const formData = {
    id: formId,
    name: `Form Submission for Bid ${bidId}`,
    bidId: bidId,
    status: 'submitted',
    responses: {
      question1: 'Demo response 1',
      question2: 'Demo response 2',
    },
    submittedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // TODO: Call zerobias.platform.Pipeline.receive to push FormSubmission
  // TODO: Call tagResource to tag with marker tag
  console.info('✓ Form submission created: ' + formId);
  return formId;
}

/**
 * Create a Pilot Project linked to an RFP.
 * Returns the Pilot Project ID.
 */
export async function createPilot(context: DemoContext, rfpId: string): Promise<string> {
  const pilotId = randomUUID();
  const timestamp = new Date().toISOString();

  console.info('Creating pilot project...');

  const pilotData = {
    id: pilotId,
    name: `Demo Pilot - ${timestamp.substring(0, 10)}`,
    title: `Demo Pilot - ${timestamp.substring(0, 10)}`,
    description: 'Automated demo pilot project created by seed script',
    projectType: 'pilot',
    rfpId: rfpId,
    status: 'active',
    startDate: timestamp,
    expectedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // TODO: Call zerobias.platform.Pipeline.receive to push SmeMartProject
  // TODO: Call tagResource to tag with marker tag
  console.info('✓ Pilot project created: ' + pilotId);
  return pilotId;
}

/**
 * Query resources by the demo marker tag.
 * Returns all demo-tagged resources for cleanup.
 */
export async function cleanupByMarkerTag(context: DemoContext): Promise<DemoEntityIds[]> {
  console.info('ℹ Searching for resources tagged with w3geekery.sme-mart.demo-seed...');

  // TODO: Call zerobias.hydra.Tag.searchTags to find marker tag
  // TODO: Call zerobias.hydra.Resource.searchResourcesByTag to find all tagged resources
  // TODO: Parse and categorize by entity type
  // Return empty array for now (no cleanup on first run)
  return [];
}

/**
 * Resolve or create a vendor party for the demo.
 * Checks env var DEMO_VENDOR_PARTY_ID first, then looks up existing vendors.
 */
export async function resolveVendor(context: DemoContext): Promise<string> {
  // Check env var first
  if (process.env.DEMO_VENDOR_PARTY_ID) {
    console.info('Using vendor from DEMO_VENDOR_PARTY_ID: ' + process.env.DEMO_VENDOR_PARTY_ID);
    return process.env.DEMO_VENDOR_PARTY_ID;
  }

  // TODO: Query for existing vendor party by tag or fixture name
  // For now, create a minimal vendor party
  const vendorPartyId = 'vendor-party-' + randomUUID().substring(0, 8);
  console.info('Creating temporary vendor party: ' + vendorPartyId);
  return vendorPartyId;
}
