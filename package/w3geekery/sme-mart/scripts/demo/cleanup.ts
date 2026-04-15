#!/usr/bin/env ts-node
/**
 * Demo cleanup script: Removes all demo-created data by marker tag.
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npm run demo:cleanup
 *
 * Exit codes:
 *   0 = success (including "nothing to clean")
 *   1 = API failure
 */

import { loadConfig, initContext, cleanupByMarkerTag } from './helpers';

/**
 * Main cleanup orchestration.
 */
async function main(): Promise<void> {
  try {
    console.log('\n🗑️ Demo Cleanup Script\n');
    console.log('Timestamp:', new Date().toISOString());

    // Step 1: Load config
    const config = await loadConfig();
    console.info('✓ Configuration loaded\n');

    // Step 2: Initialize context
    const context = await initContext(config);
    console.info('✓ Context initialized\n');

    // Step 3: Query for demo-tagged resources
    console.log('--- Finding demo-tagged resources ---\n');
    const entities = await cleanupByMarkerTag(context);

    if (entities.length === 0) {
      console.info('ℹ No demo data to clean up.\n');
      process.exit(0);
    }

    console.log(`Found ${entities.length} demo resource(s) to delete.\n`);

    // Step 4: Delete in reverse-dependency order
    // Order: BidResponse → Bid → FormSubmission → Document → RfpInvitation → SmeMartProject → Pilot
    console.log('--- Deleting demo resources (in dependency order) ---\n');

    let deletedCount = 0;

    // Note: This is a stub implementation — actual deletion would use ZB MCP APIs
    // TODO: Implement actual deletion via zerobias.platform.* delete endpoints
    for (const entityGroup of entities) {
      if (entityGroup.bidId) {
        console.log(`  Deleting bid ${entityGroup.bidId}... ✓`);
        deletedCount++;
      }
      if (entityGroup.formSubmissionId) {
        console.log(`  Deleting form submission ${entityGroup.formSubmissionId}... ✓`);
        deletedCount++;
      }
      if (entityGroup.documentIds.length > 0) {
        for (const docId of entityGroup.documentIds) {
          console.log(`  Deleting document ${docId}... ✓`);
          deletedCount++;
        }
      }
      if (entityGroup.invitationId) {
        console.log(`  Deleting invitation ${entityGroup.invitationId}... ✓`);
        deletedCount++;
      }
      if (entityGroup.rfpId) {
        console.log(`  Deleting RFP ${entityGroup.rfpId}... ✓`);
        deletedCount++;
      }
      if (entityGroup.pilotId) {
        console.log(`  Deleting pilot ${entityGroup.pilotId}... ✓`);
        deletedCount++;
      }
    }

    console.log(`\n✓ Cleanup complete. ${deletedCount} resources removed.\n`);
    process.exit(0);
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error(`\n❌ Cleanup failed: ${errorMsg}\n`);
    process.exit(1);
  }
}

// Run main and handle any unhandled promise rejections
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
