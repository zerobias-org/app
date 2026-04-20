#!/usr/bin/env ts-node
/**
 * Demo seed script — creates a realistic RFP package flow for Friday demos.
 *
 * Usage:
 *   npm run demo:seed               # seed against default profile / env
 *   npm run demo:seed -- --verbose  # also write demo-seed-output.json
 *   npm run demo:seed -- --allow-prod
 *
 * Env:
 *   ZB_API_URL / ZB_API_KEY / ZB_ORG_ID   explicit credentials
 *   ZB_PROFILE=<name>                     pick non-active profile from ~/.config/mcp-zb/credentials.json
 *   ZB_PIPELINE_ID                        override per-env default
 *   DEMO_VENDOR_ORG_ID                    vendor org ID (defaults to connected org)
 *
 * Exit codes:
 *   0 = success
 *   1 = failure
 */

import { writeFileSync } from 'fs';
import { DemoEntityIds, SeedStep } from './types';
import {
  loadConfig,
  initContext,
  ensureMarkerTag,
  createRfp,
  createDocument,
  resolveVendor,
  inviteVendor,
  createBid,
  createFormSubmission,
  createPilot,
  appendDemoState,
} from './helpers';

const VERBOSE_MODE = process.argv.includes('--verbose');

function printSummary(entities: DemoEntityIds): void {
  console.log('\n✓ Demo seed complete!\n');
  console.log('Resources created:');
  console.log(`  RFP:             ${entities.rfpId}`);
  console.log(`  Documents:       ${entities.documentIds.join(', ')}`);
  console.log(`  Invited Vendor:  ${entities.vendorPartyId}`);
  console.log(`  Invitation:      ${entities.invitationId}`);
  console.log(`  Bid:             ${entities.bidId}`);
  console.log(`  Form Submission: ${entities.formSubmissionId}`);
  console.log(`  Pilot:           ${entities.pilotId}`);

  const total =
    1 + entities.documentIds.length + 1 + 1 + 1 + 1; // rfp + docs + invite + bid + form + pilot
  console.log(`\nSummary: ${total} resources created, tagged with 'w3geekery.sme-mart.demo-seed'`);
  console.log('Cleanup: npm run demo:cleanup\n');
}

async function main(): Promise<void> {
  const steps: SeedStep[] = [];
  const entities: DemoEntityIds = {
    rfpId: '',
    documentIds: [],
    vendorPartyId: '',
    invitationId: '',
    bidId: '',
    formSubmissionId: '',
    pilotId: '',
  };

  const record = (name: string): SeedStep => {
    const step: SeedStep = { name, status: 'pending' };
    steps.push(step);
    return step;
  };
  const done = (step: SeedStep) => { step.status = 'done'; };

  console.log('\n🌱 Demo Seed');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const s1 = record('Load config');
    const config = await loadConfig();
    done(s1);

    const s2 = record('Connect SDK');
    const context = await initContext(config);
    done(s2);

    const s3 = record('Ensure marker tag');
    context.tagId = await ensureMarkerTag(context);
    done(s3);

    console.log('\n--- Creating RFP package ---');
    const s4 = record('Create RFP');
    entities.rfpId = await createRfp(context);
    done(s4);

    const s5 = record('Attach documents');
    entities.documentIds.push(await createDocument(context, entities.rfpId, 1));
    entities.documentIds.push(await createDocument(context, entities.rfpId, 2));
    done(s5);

    console.log('\n--- Inviting vendor and capturing bid ---');
    const s6 = record('Resolve vendor');
    entities.vendorPartyId = await resolveVendor(context);
    done(s6);

    const s7 = record('Invite vendor');
    entities.invitationId = await inviteVendor(context, entities.rfpId, entities.vendorPartyId);
    done(s7);

    const s8 = record('Create bid');
    entities.bidId = await createBid(context, entities.rfpId, entities.vendorPartyId);
    done(s8);

    const s9 = record('Submit form responses');
    entities.formSubmissionId = await createFormSubmission(context, entities.rfpId, entities.bidId);
    done(s9);

    console.log('\n--- Creating pilot project ---');
    const s10 = record('Create pilot');
    entities.pilotId = await createPilot(context, entities.rfpId);
    done(s10);

    // Persist state so `npm run demo:cleanup` can reverse this run.
    appendDemoState(context, {
      ids: {
        SmeMartProject: [entities.rfpId, entities.pilotId],
        SmeMartDocument: entities.documentIds,
        RfpInvitation: [entities.invitationId],
        Bid: [entities.bidId],
        FormSubmission: [entities.formSubmissionId],
      },
    });

    printSummary(entities);

    if (VERBOSE_MODE) {
      const output = {
        timestamp: new Date().toISOString(),
        environment: context.config.environment,
        url: context.config.url,
        orgId: context.config.orgId,
        pipelineId: context.config.pipelineId,
        tagId: context.tagId,
        entities,
        steps,
      };
      writeFileSync('demo-seed-output.json', JSON.stringify(output, null, 2));
      console.log('✓ Verbose output written to demo-seed-output.json\n');
    }

    process.exit(0);
  } catch (err) {
    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      lastStep.status = 'error';
      lastStep.error = (err as Error).message;
    }
    console.error(`\n❌ Seed failed at step: ${lastStep?.name ?? 'unknown'}`);
    console.error(`Error: ${(err as Error).message}\n`);

    if (entities.rfpId) {
      console.error('Partial resources created (run demo:cleanup to remove):');
      if (entities.rfpId) console.error(`  RFP: ${entities.rfpId}`);
      if (entities.documentIds.length) console.error(`  Documents: ${entities.documentIds.join(', ')}`);
      if (entities.invitationId) console.error(`  Invitation: ${entities.invitationId}`);
      if (entities.bidId) console.error(`  Bid: ${entities.bidId}`);
      if (entities.formSubmissionId) console.error(`  Form Submission: ${entities.formSubmissionId}`);
      if (entities.pilotId) console.error(`  Pilot: ${entities.pilotId}`);
    }

    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
