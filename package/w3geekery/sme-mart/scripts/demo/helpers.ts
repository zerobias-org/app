/**
 * Helper functions for demo seed/cleanup.
 *
 * Uses the vanilla ZerobiasSdk (@zerobias-com/zerobias-sdk) to hit platform
 * Pipeline receive and hydra Tag/Resource APIs. Auth resolved from env
 * (ZB_API_URL / ZB_API_KEY / ZB_ORG_ID) with fallback to
 * ~/.config/mcp-zb/credentials.json for local dev ergonomics.
 */

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { ZerobiasSdk } from '@zerobias-com/zerobias-sdk';
import { SimpleBatch } from '@zerobias-com/platform-sdk';
import { UUID, URL as ZbUrl } from '@zerobias-org/types-core-js';

import { DemoConfig, DemoContext, DemoClassName } from './types';
import { DEMO_TAG_UUIDS } from '../../src/app/core/constants/demo-tags';

// ---------------------------------------------------------------------------
// SME Mart AuditgraphDB class IDs (deterministic — same across environments)
// Kept in sync with src/app/core/services/pipeline-write.service.ts.
// ---------------------------------------------------------------------------
const CLASS_IDS: Record<DemoClassName, string> = {
  SmeMartProject:  'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03',
  SmeMartDocument: 'e1497ca8-a621-57f6-9263-f9a19fea3c34',
  RfpInvitation:   '941cf01b-d260-5e45-8c6a-50f07b23f196',
  Bid:             'ccddd2e5-e455-585e-9bb7-902903228b0d',
  FormSubmission:  '179bd4b1-d1b1-5afc-99be-a5465a662ec6',
};

const DEMO_MARKER_TAG_NAME = 'w3geekery.sme-mart.demo-seed';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface McpProfile {
  url?: string;
  'api-key'?: string;
  'org-id'?: string;
}

interface McpCredentials {
  active?: string;
  profiles?: Record<string, McpProfile>;
}

function readMcpProfile(profileName?: string): McpProfile | null {
  const credPath = join(homedir(), '.config', 'mcp-zb', 'credentials.json');
  if (!existsSync(credPath)) return null;
  try {
    const creds = JSON.parse(readFileSync(credPath, 'utf8')) as McpCredentials;
    const name = profileName || creds.active;
    if (!name || !creds.profiles || !creds.profiles[name]) return null;
    return creds.profiles[name];
  } catch {
    return null;
  }
}

function detectEnvironment(url: string): DemoConfig['environment'] {
  if (url.includes('app.zerobias.com')) return 'prod';
  if (url.includes('qa.zerobias.com')) return 'qa';
  if (url.includes('uat.zerobias.com')) return 'uat';
  return 'ci';
}

// Pipeline IDs keyed by environment.
// Keep in sync with src/environments/environment.{uat,ci,prod}.ts.
// UAT pipeline migrated 2026-04-16 from ZeroBias-org (f6d1f579-...) to W3Geekery-org boundary.
const PIPELINE_IDS: Record<DemoConfig['environment'], string> = {
  uat:  '43f08afd-7ab9-4e99-a93c-619c46adaabe',
  ci:   '',   // fill in if CI seeding is needed
  qa:   '',
  prod: '',
};

/**
 * Load config from env vars, falling back to ~/.config/mcp-zb/credentials.json.
 * Throws on missing required fields or prod-without-flag.
 */
export async function loadConfig(): Promise<DemoConfig> {
  const profileName = process.env['ZB_PROFILE'];
  const profile = readMcpProfile(profileName);

  // All-or-nothing env override: if the full env triple is present, use env
  // exclusively. Otherwise fall back to the credentials.json profile to avoid
  // cross-wiring URL from one env with orgId from another.
  const envUrl = process.env['ZB_API_URL'];
  const envKey = process.env['ZB_API_KEY'];
  const envOrg = process.env['ZB_ORG_ID'];
  const envComplete = envUrl && envKey && envOrg;

  const url = envComplete ? envUrl : (profile?.url || '');
  const apiKey = envComplete ? envKey : (profile?.['api-key'] || '');
  const orgId = envComplete ? envOrg : (profile?.['org-id'] || '');
  const resolvedProfile = envComplete
    ? 'env'
    : (profileName || (profile ? 'credentials.json (active)' : 'unknown'));

  const missing: string[] = [];
  if (!url) missing.push('ZB_API_URL');
  if (!apiKey) missing.push('ZB_API_KEY');
  if (!orgId) missing.push('ZB_ORG_ID');
  if (missing.length > 0) {
    throw new Error(
      `Missing credentials: ${missing.join(', ')}.\n` +
      `  Set env vars, or ensure ~/.config/mcp-zb/credentials.json has an active profile.\n` +
      `  Set ZB_PROFILE=<name> to pick a non-active profile.`,
    );
  }

  const environment = detectEnvironment(url);
  const pipelineId = process.env['ZB_PIPELINE_ID'] || PIPELINE_IDS[environment];
  if (!pipelineId) {
    throw new Error(
      `No pipelineId configured for environment '${environment}'. ` +
      `Set ZB_PIPELINE_ID explicitly.`,
    );
  }

  const allowProd = process.argv.includes('--allow-prod');
  if (environment === 'prod' && !allowProd) {
    throw new Error(
      `Refusing to run against prod (${url}) without --allow-prod flag.`,
    );
  }

  console.info(`ℹ Environment: ${environment} (${url}) — profile: ${resolvedProfile}`);
  console.info(`ℹ OrgId: ${orgId}`);
  console.info(`ℹ PipelineId: ${pipelineId}`);

  return { url, apiKey, orgId, environment, pipelineId, profileName: resolvedProfile, allowProd };
}

// ---------------------------------------------------------------------------
// Context — connect SDK and resolve current party
// ---------------------------------------------------------------------------

export async function initContext(config: DemoConfig): Promise<DemoContext> {
  console.info('ℹ Connecting SDK...');
  const sdk = new ZerobiasSdk();
  await sdk.connect({
    url: new ZbUrl(config.url),
    apiKey: config.apiKey,
    orgId: new UUID(config.orgId),
  });

  let partyId = '';
  try {
    const party = await sdk.platform.getPartyApi().getMyParty();
    // Party surface varies; id is always present.
    partyId = (party as { id?: { toString: () => string } }).id?.toString() || '';
    console.info(`✓ Connected as party ${partyId}`);
  } catch (err) {
    console.warn(
      `⚠ getMyParty failed (${(err as Error).message}). Seeding will proceed without a party reference.`,
    );
  }

  return { config, sdk, partyId, orgId: config.orgId };
}

// ---------------------------------------------------------------------------
// Tags — org-scoped marker
// ---------------------------------------------------------------------------

export async function ensureMarkerTag(context: DemoContext): Promise<string> {
  const tagApi = context.sdk.hydra.getTagApi();

  // Search existing org-scoped tag by exact name.
  try {
    const results = await tagApi.listTags(1, 50, undefined, DEMO_MARKER_TAG_NAME);
    const existing = (results.items || []).find(
      (t: { name?: string }) => t.name === DEMO_MARKER_TAG_NAME,
    );
    if (existing) {
      const id = (existing as { id?: { toString: () => string } }).id?.toString() || '';
      if (id) {
        console.info(`✓ Marker tag found: ${id}`);
        return id;
      }
    }
  } catch (err) {
    console.warn(`⚠ listTags failed (${(err as Error).message}), will attempt create.`);
  }

  // Create new org-scoped tag.
  const createBody = {
    name: DEMO_MARKER_TAG_NAME,
    ownerId: new UUID(context.orgId),
    description: 'Demo data marker tag — used for cleanup by scripts/demo/cleanup.ts',
  };
  const created = await tagApi.createTag(createBody as unknown as Parameters<typeof tagApi.createTag>[0]);
  const id = (created as { id?: { toString: () => string } }).id?.toString() || '';
  if (!id) throw new Error('createTag returned no id');
  console.info(`✓ Marker tag created: ${id}`);
  return id;
}

export async function tagResource(
  context: DemoContext,
  resourceId: string,
  tagId: string,
): Promise<void> {
  const resourceApi = context.sdk.hydra.getResourceApi();
  try {
    await resourceApi.tagResource(new UUID(resourceId), [new UUID(tagId)]);
  } catch (err) {
    // 409 = already tagged — that's fine for idempotency.
    const msg = (err as Error).message;
    if (!msg.includes('409') && !/already/i.test(msg)) {
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Pipeline entity push / delete
// ---------------------------------------------------------------------------

/**
 * Push a single entity through the Receiver Pipeline.
 * Mirrors PipelineWriteService.pushEntity in the Angular app.
 */
export async function pushEntity(
  context: DemoContext,
  className: DemoClassName,
  data: Record<string, unknown>,
  tagIds: string[] = [],
): Promise<void> {
  const classId = CLASS_IDS[className];
  const pipelineApi = context.sdk.platform.getPipelineApi();

  // Ensure name field (AuditgraphDB Object base class requires it).
  const name = (data['name'] as string | undefined)
    ?? (data['title'] as string | undefined)
    ?? (data['displayName'] as string | undefined)
    ?? `${className}-${(data['id'] as string | undefined) ?? 'unknown'}`;
  const ensured = { ...data, name };

  const batch = new SimpleBatch(
    new UUID(classId),
    [ensured],
    tagIds.map(id => new UUID(id)),
  );
  await pipelineApi.receive(new UUID(context.config.pipelineId), batch);
}

/**
 * Mark entities as deleted through the Receiver Pipeline (differential mode).
 *
 * The receive endpoint rejects empty `data` arrays ("Simple batch must have
 * at least one item") even when `markDeleted` is populated — so we also pass
 * stub `{id, name}` rows for each deletion. Server treats `markDeleted` as
 * authoritative and prunes the referenced ids.
 */
export async function deleteEntities(
  context: DemoContext,
  className: DemoClassName,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const classId = CLASS_IDS[className];
  const pipelineApi = context.sdk.platform.getPipelineApi();

  // Class-specific required-field stubs so schema validation passes.
  const buildStub = (id: string): Record<string, unknown> => {
    const base: Record<string, unknown> = { id, name: `${className}-${id}` };
    if (className === 'SmeMartDocument') {
      base['fileVersionId'] = id;
      base['size'] = 0;
      base['filename'] = `${id}.bin`;
    }
    return base;
  };
  const stubs = ids.map(buildStub);

  // SimpleBatch constructor: (classId, data, tagIds, markDeleted)
  const batch = new SimpleBatch(new UUID(classId), stubs, [], ids);
  await pipelineApi.receive(new UUID(context.config.pipelineId), batch);
}

// ---------------------------------------------------------------------------
// Seed entity creators
// ---------------------------------------------------------------------------

function isoNow(): string {
  return new Date().toISOString();
}

/** Date-only YYYY-MM-DD — the pattern used by `dateCreated`/`dateLastModified`. */
function dateOnly(d: Date = new Date()): string {
  return d.toISOString().substring(0, 10);
}

export async function createRfp(context: DemoContext): Promise<string> {
  const id = randomUUID();
  const now = isoNow();
  const data = {
    id,
    name: `Demo RFP — ${now.substring(0, 10)}`,
    description: 'Automated demo RFP created by seed script for Friday demo.',
    status: 'published',
    projectType: 'rfp',
    category: 'Compliance',
    budgetType: 'range',
    budgetMin: 25000,
    budgetMax: 50000,
    timeline: '30 days',
    responseDeadline: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    isInvitationOnly: false,
    wizardStep: 999, // "complete" sentinel used elsewhere in app
    dateCreated: dateOnly(),
    dateLastModified: dateOnly(),
  };
  await pushEntity(context, 'SmeMartProject', data, [DEMO_TAG_UUIDS.GLOBAL_DEMO, ...(context.tagId ? [context.tagId] : [])]);
  console.info(`✓ RFP created: ${id}`);
  return id;
}

export async function createDocument(
  context: DemoContext,
  rfpId: string,
  index: number,
): Promise<string> {
  const id = randomUUID();
  const now = isoNow();
  const filename = index === 1 ? 'Scope-of-Work.pdf' : 'Requirements-Checklist.xlsx';
  const mimeType = index === 1
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const sizeBytes = index === 1 ? 412_831 : 56_902;
  const data = {
    id,
    name: filename,
    engagementId: rfpId, // legacy field repurposed as RFP link in schema
    filename,
    displayName: filename,
    mimeType,
    // File base class requires GQL-native `fileVersionId` + `size`.
    // Demo docs have no backing ZB file, so use the doc id as a sentinel version.
    fileVersionId: id,
    size: sizeBytes,
    zbFileId: id,
    zbFileVersionId: id,
    fileSizeBytes: sizeBytes,
    documentType: 'rfp-attachment',
    description: `Demo attachment ${index} for RFP ${rfpId}`,
    archived: false,
    dateCreated: dateOnly(),
    dateLastModified: dateOnly(),
  };
  await pushEntity(context, 'SmeMartDocument', data, [DEMO_TAG_UUIDS.GLOBAL_DEMO, ...(context.tagId ? [context.tagId] : [])]);
  console.info(`✓ Document created: ${id} (${filename})`);
  return id;
}

export async function inviteVendor(
  context: DemoContext,
  rfpId: string,
  vendorOrgId: string,
): Promise<string> {
  const id = randomUUID();
  const now = isoNow();
  const data = {
    id,
    name: `Invitation to ${vendorOrgId} for RFP ${rfpId}`,
    projectId: rfpId,
    vendorOrgId,
    status: 'accepted',
    invitedAt: now,
    respondedAt: now,
    invitationMessage: 'You are invited to bid on this demo RFP.',
    dateCreated: dateOnly(),
    dateLastModified: dateOnly(),
  };
  await pushEntity(context, 'RfpInvitation', data, [DEMO_TAG_UUIDS.GLOBAL_DEMO, ...(context.tagId ? [context.tagId] : [])]);
  console.info(`✓ Vendor invited: ${id}`);
  return id;
}

export async function createBid(
  context: DemoContext,
  rfpId: string,
  vendorPartyId: string,
): Promise<string> {
  const id = randomUUID();
  const now = isoNow();
  const data = {
    id,
    name: `Bid from ${vendorPartyId} on RFP ${rfpId}`,
    project: rfpId, // link to SmeMartProject
    providerId: vendorPartyId,
    coverLetter:
      'Thank you for the opportunity. Our team brings 10+ years of compliance expertise and will deliver on time.',
    proposedPrice: '35000',
    proposedTimeline: '28 days',
    price: '35000',
    timeline: '28 days',
    executiveSummary: 'We propose a phased compliance assessment with weekly check-ins.',
    teamDescription: 'Lead consultant + 2 senior analysts.',
    totalEstimatedHours: 240,
    pricingModel: 'fixed',
    bidValidUntil: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    status: 'submitted',
    wizardStep: 999,
    dateCreated: dateOnly(),
    dateLastModified: dateOnly(),
  };
  await pushEntity(context, 'Bid', data, [DEMO_TAG_UUIDS.GLOBAL_DEMO, ...(context.tagId ? [context.tagId] : [])]);
  console.info(`✓ Bid created: ${id}`);
  return id;
}

export async function createFormSubmission(
  context: DemoContext,
  rfpId: string,
  bidId: string,
): Promise<string> {
  const id = randomUUID();
  const now = isoNow();
  const submissionData = {
    yearsOfExperience: '10',
    references: 'Acme Corp, Globex, Initech',
    soc2Certified: true,
  };
  const data = {
    id,
    name: `Form submission for Bid ${bidId}`,
    projectId: rfpId,
    bidId,
    submissionData: JSON.stringify(submissionData),
    status: 'submitted',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await pushEntity(context, 'FormSubmission', data, [DEMO_TAG_UUIDS.GLOBAL_DEMO, ...(context.tagId ? [context.tagId] : [])]);
  console.info(`✓ Form submission created: ${id}`);
  return id;
}

export async function createPilot(
  context: DemoContext,
  rfpId: string,
): Promise<string> {
  const id = randomUUID();
  const now = isoNow();
  const data = {
    id,
    name: `Demo Pilot — ${now.substring(0, 10)}`,
    description: 'Pilot project promoted from the demo RFP to exercise post-award workflow.',
    status: 'active',
    projectType: 'pilot',
    promotedProjectId: rfpId, // pilot→rfp backlink (Plan 077)
    category: 'Compliance',
    startDate: dateOnly(),
    targetEndDate: dateOnly(new Date(Date.now() + 60 * 86_400_000)),
    timeline: '60 days',
    dateCreated: dateOnly(),
    dateLastModified: dateOnly(),
  };
  await pushEntity(context, 'SmeMartProject', data, [DEMO_TAG_UUIDS.GLOBAL_DEMO, ...(context.tagId ? [context.tagId] : [])]);
  console.info(`✓ Pilot created: ${id}`);
  return id;
}

// ---------------------------------------------------------------------------
// Vendor resolution
// ---------------------------------------------------------------------------

/**
 * Pick a vendor org/party id for the demo. Order of preference:
 *   1. DEMO_VENDOR_ORG_ID env var
 *   2. Current user's org (self-bid — fine for demo purposes)
 */
export async function resolveVendor(context: DemoContext): Promise<string> {
  const envVendor = process.env['DEMO_VENDOR_ORG_ID'] || process.env['DEMO_VENDOR_PARTY_ID'];
  if (envVendor) {
    console.info(`ℹ Vendor from env: ${envVendor}`);
    return envVendor;
  }
  console.info(`ℹ Vendor defaults to connected org: ${context.orgId} (set DEMO_VENDOR_ORG_ID to override)`);
  return context.orgId;
}

// ---------------------------------------------------------------------------
// Cleanup — state-file driven
// ---------------------------------------------------------------------------

// State file tracks every entity created by `demo:seed` so `demo:cleanup` can
// reverse it. We can't use hydra's `listTaggedResources` for this because
// pipeline-created AuditgraphDB objects don't materialize as hydra Resource
// rows (verified on UAT 2026-04-15 — tagResource fails with FK violation).
//
// The marker tag still rides along on SimpleBatch.tagIds as a best-effort
// label, but is not the source of truth for cleanup.

export const STATE_FILE_PATH = join(__dirname, '.demo-state.json');

export interface DemoStateEntry {
  timestamp: string;
  environment: string;
  url: string;
  orgId: string;
  tagId?: string;
  ids: Record<DemoClassName, string[]>;
}

export interface DemoState {
  entries: DemoStateEntry[];
}

function readDemoState(): DemoState {
  if (!existsSync(STATE_FILE_PATH)) return { entries: [] };
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE_PATH, 'utf8')) as DemoState;
    return parsed && Array.isArray(parsed.entries) ? parsed : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

function writeDemoState(state: DemoState): void {
  writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Append a seed run's ids to the state file so `demo:cleanup` can undo it.
 */
export function appendDemoState(
  context: DemoContext,
  entry: Omit<DemoStateEntry, 'timestamp' | 'environment' | 'url' | 'orgId' | 'tagId'>,
): void {
  const state = readDemoState();
  state.entries.push({
    timestamp: new Date().toISOString(),
    environment: context.config.environment,
    url: context.config.url,
    orgId: context.orgId,
    tagId: context.tagId,
    ...entry,
  });
  writeDemoState(state);
}

/**
 * Cleanup orchestrator — reads `.demo-state.json`, deletes every recorded entity
 * (in reverse-dependency order), clears the state file. Idempotent.
 */
export async function cleanupByMarkerTag(context: DemoContext): Promise<number> {
  const state = readDemoState();
  if (state.entries.length === 0) {
    console.info('ℹ No demo state file — nothing to clean.');
    return 0;
  }

  // Filter to entries matching the current environment only — don't stomp
  // other env's demo data just because the file happens to contain them.
  const targets = state.entries.filter(e => e.url === context.config.url);
  const skipped = state.entries.length - targets.length;
  if (targets.length === 0) {
    console.info(`ℹ No demo state entries for ${context.config.url} (skipped ${skipped}).`);
    return 0;
  }
  if (skipped > 0) {
    console.info(`ℹ Skipping ${skipped} state entries from other environments.`);
  }

  // Aggregate ids by class across all matching entries, then delete in
  // reverse-dependency order.
  const byClass: Record<DemoClassName, string[]> = {
    FormSubmission: [],
    Bid: [],
    RfpInvitation: [],
    SmeMartDocument: [],
    SmeMartProject: [],
  };
  for (const entry of targets) {
    for (const className of Object.keys(byClass) as DemoClassName[]) {
      const ids = entry.ids[className] || [];
      byClass[className].push(...ids);
    }
  }

  const order: DemoClassName[] = [
    'FormSubmission',
    'Bid',
    'RfpInvitation',
    'SmeMartDocument',
    'SmeMartProject',
  ];
  let total = 0;
  for (const className of order) {
    const ids = byClass[className];
    if (ids.length === 0) continue;
    // De-dupe (same id pushed by multiple seeds)
    const uniq = Array.from(new Set(ids));
    console.info(`  Deleting ${uniq.length} ${className}(s)...`);
    await deleteEntities(context, className, uniq);
    total += uniq.length;
  }

  // Retain other-env entries, drop cleaned ones.
  const remaining = state.entries.filter(e => e.url !== context.config.url);
  if (remaining.length === 0) {
    unlinkSync(STATE_FILE_PATH);
  } else {
    writeDemoState({ entries: remaining });
  }

  return total;
}

