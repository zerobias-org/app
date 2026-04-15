#!/usr/bin/env ts-node
/**
 * Demo seed script: Creates a realistic RFP package flow for Friday demos with Brian.
 *
 * Usage:
 *   npm run demo:seed
 *   npm run demo:seed -- --verbose
 *   npm run demo:seed -- --allow-prod
 *
 * Exit codes:
 *   0 = success
 *   1 = failure
 */

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
  tagResource,
} from './helpers';

const VERBOSE_MODE = process.argv.includes('--verbose');

/**
 * Print the summary block with all created resource IDs.
 */
function printSummary(entities: DemoEntityIds, steps: SeedStep[]): void {
  console.log('\n✓ Demo seed complete!\n');
  console.log('Resources created:');
  console.log(`  RFP:             ${entities.rfpId}`);
  console.log(`  Documents:       ${entities.documentIds.join(', ')}`);
  console.log(`  Invited Vendor:  ${entities.vendorPartyId}`);
  console.log(`  Invitation:      ${entities.invitationId}`);
  console.log(`  Bid:             ${entities.bidId}`);
  console.log(`  Form Responses:  ${entities.formSubmissionId}`);
  console.log(`  Pilot Project:   ${entities.pilotId}`);

  const totalCount =
    1 + // RFP
    entities.documentIds.length +
    1 + // invitation
    1 + // bid
    1 + // form submission
    1; // pilot

  console.log(`\nSummary: ${totalCount} resources created and tagged with 'w3geekery.sme-mart.demo-seed'\n`);
  console.log('Run cleanup with: npm run demo:cleanup\n');

  if (VERBOSE_MODE) {
    // Write JSON output for programmatic follow-up
    const output = {
      timestamp: new Date().toISOString(),
      environment: process.env['ZB_ENVIRONMENT'] || 'uat',
      entities,
      totalCount,
      steps: steps.map(s => ({ name: s.name, status: s.status, error: s.error })),
    };

    try {
      require('fs').writeFileSync('demo-seed-output.json', JSON.stringify(output, null, 2));
      console.log('✓ Verbose output written to demo-seed-output.json\n');
    } catch (err) {
      console.warn('⚠ Failed to write verbose output:', (err as Error).message);
    }
  }
}

/**
 * Main seed orchestration.
 */
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

  try {
    console.log('\n🌱 Demo Seed Script\n');
    console.log('Timestamp:', new Date().toISOString());

    // Step 1: Load config
    const config = await loadConfig();
    steps.push({ name: 'Load config', status: 'done' });

    // Step 2: Initialize context
    const context = await initContext(config);
    steps.push({ name: 'Initialize context', status: 'done' });

    // Step 3: Ensure marker tag exists
    const tagId = await ensureMarkerTag(context);
    context.tagId = tagId;
    steps.push({ name: 'Ensure marker tag', status: 'done' });

    // Step 4: Create RFP
    console.log('\n--- Creating RFP package ---\n');
    entities.rfpId = await createRfp(context);
    if (context.tagId) {
      await tagResource(context, entities.rfpId, context.tagId);
    }
    steps.push({ name: 'Create RFP', status: 'done' });

    // Step 5: Attach documents (2+)
    console.log('\nAttaching documents...\n');
    const doc1Id = await createDocument(context, entities.rfpId);
    if (context.tagId) {
      await tagResource(context, doc1Id, context.tagId);
    }
    entities.documentIds.push(doc1Id);

    const doc2Id = await createDocument(context, entities.rfpId);
    if (context.tagId) {
      await tagResource(context, doc2Id, context.tagId);
    }
    entities.documentIds.push(doc2Id);

    steps.push({ name: 'Attach documents (2)', status: 'done' });

    // Step 6: Resolve vendor
    console.log('\n--- Creating vendor relationship ---\n');
    entities.vendorPartyId = await resolveVendor(context);
    steps.push({ name: 'Resolve vendor', status: 'done' });

    // Step 7: Invite vendor
    entities.invitationId = await inviteVendor(context, entities.rfpId, entities.vendorPartyId);
    if (context.tagId) {
      await tagResource(context, entities.invitationId, context.tagId);
    }
    steps.push({ name: 'Invite vendor', status: 'done' });

    // Step 8: Create bid
    console.log('\n--- Submitting bid and responses ---\n');
    entities.bidId = await createBid(context, entities.rfpId, entities.vendorPartyId);
    if (context.tagId) {
      await tagResource(context, entities.bidId, context.tagId);
    }
    steps.push({ name: 'Submit bid', status: 'done' });

    // Step 9: Create form submission
    entities.formSubmissionId = await createFormSubmission(context, entities.bidId);
    if (context.tagId) {
      await tagResource(context, entities.formSubmissionId, context.tagId);
    }
    steps.push({ name: 'Submit form responses', status: 'done' });

    // Step 10: Create pilot project
    console.log('\n--- Creating pilot project ---\n');
    entities.pilotId = await createPilot(context, entities.rfpId);
    if (context.tagId) {
      await tagResource(context, entities.pilotId, context.tagId);
    }
    steps.push({ name: 'Create pilot project', status: 'done' });

    // Print summary and exit successfully
    printSummary(entities, steps);
    process.exit(0);
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error(`\n❌ Seed failed at step: ${steps[steps.length - 1]?.name || 'unknown'}`);
    console.error(`Error: ${errorMsg}\n`);

    if (entities.rfpId) {
      console.error('Partially created resources (safe for manual cleanup):');
      if (entities.rfpId) console.error(`  RFP: ${entities.rfpId}`);
      if (entities.documentIds.length > 0) console.error(`  Documents: ${entities.documentIds.join(', ')}`);
      if (entities.vendorPartyId) console.error(`  Vendor: ${entities.vendorPartyId}`);
      if (entities.bidId) console.error(`  Bid: ${entities.bidId}`);
      if (entities.formSubmissionId) console.error(`  Form Submission: ${entities.formSubmissionId}`);
      if (entities.pilotId) console.error(`  Pilot: ${entities.pilotId}`);
      console.error('\nRun: npm run demo:cleanup\n');
    }

    process.exit(1);
  }
}

// Run main and handle any unhandled promise rejections
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
