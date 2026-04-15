#!/usr/bin/env ts-node
/**
 * Demo cleanup script — removes every resource carrying the demo marker tag.
 *
 * Idempotent — safe to run when nothing is tagged.
 *
 * Usage:
 *   npm run demo:cleanup
 *
 * Env:
 *   same credential resolution as demo:seed (ZB_API_URL / ZB_API_KEY / ZB_ORG_ID
 *   or ~/.config/mcp-zb/credentials.json).
 *
 * Exit codes:
 *   0 = success (including "nothing to clean")
 *   1 = API failure
 */

import { loadConfig, initContext, cleanupByMarkerTag } from './helpers';

async function main(): Promise<void> {
  console.log('\n🗑️ Demo Cleanup');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const config = await loadConfig();
    const context = await initContext(config);
    const total = await cleanupByMarkerTag(context);

    if (total === 0) {
      console.info('\nℹ No demo resources to clean.');
    } else {
      console.log(`\n✓ Cleanup complete — ${total} resource(s) deleted.\n`);
    }
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Cleanup failed: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
