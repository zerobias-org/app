# Demo Seed & Cleanup Scripts

CLI scripts for creating and tearing down a realistic RFP marketplace flow for Friday demos with Brian.

## Overview

These scripts exercise the complete SME Mart marketplace flow:
1. **seed** — Creates RFP + documents + invited vendor + submitted bid + form responses + pilot project
2. **cleanup** — Removes all demo-created data by marker tag

All demo-created resources are tagged with a well-known marker tag (`w3geekery.sme-mart.demo-seed`) so cleanup can safely remove only demo data, never production data.

## Prerequisites

- Node.js >= 18.19.1
- npm >= 10.2.4
- `.env.local` with valid ZB credentials:
  - `ZB_API_KEY` — API key for ZB platform (UAT or QA)
  - `ZB_ORG_ID` — W3Geekery/SME Mart org UUID
  - `ZB_TOKEN` — Hydra/Platform token (if needed)

Example `.env.local`:
```bash
ZB_API_KEY=your-api-key
ZB_ORG_ID=your-org-id
ZB_TOKEN=your-token
ZB_ENVIRONMENT=uat
```

## Quick Start

### Seed Demo Data

```bash
npm run demo:seed
```

Output:
```
🌱 Demo Seed Script
Timestamp: 2026-04-15T14:30:00Z

ℹ Loading demo config for uat environment
ℹ Initializing context...
ℹ Ensuring marker tag w3geekery.sme-mart.demo-seed exists...
✓ Marker tag ready

--- Creating RFP package ---

Creating RFP...
✓ RFP created: abc12345-...

Attaching documents...

Creating document...
✓ Document created: def67890-...

--- Creating vendor relationship ---

Creating document...
✓ Document created: ghi13579-...

Inviting vendor...
✓ Vendor invited: jkl24680-...

--- Submitting bid and responses ---

Creating bid...
✓ Bid created: mno35791-...

Creating form submission...
✓ Form submission created: pqr46802-...

--- Creating pilot project ---

Creating pilot project...
✓ Pilot project created: stu57913-...

✓ Demo seed complete!

Resources created:
  RFP:             abc12345-...
  Documents:       def67890-..., ghi13579-...
  Invited Vendor:  vendor-party-xyz
  Invitation:      jkl24680-...
  Bid:             mno35791-...
  Form Responses:  pqr46802-...
  Pilot Project:   stu57913-...

Summary: 7 resources created and tagged with 'w3geekery.sme-mart.demo-seed'

Run cleanup with: npm run demo:cleanup
```

### Cleanup Demo Data

```bash
npm run demo:cleanup
```

Output:
```
🗑️ Demo Cleanup Script
Timestamp: 2026-04-15T14:35:00Z

ℹ Loading demo config for uat environment
✓ Configuration loaded

✓ Context initialized

--- Finding demo-tagged resources ---

Found 7 demo resource(s) to delete.

--- Deleting demo resources (in dependency order) ---

  Deleting bid abc12345-... ✓
  Deleting form submission def67890-... ✓
  Deleting document ghi13579-... ✓
  Deleting invitation jkl24680-... ✓
  Deleting RFP mno35791-... ✓
  Deleting pilot stu57913-... ✓

✓ Cleanup complete. 6 resources removed.
```

## Flags

### `--verbose`

Write full seed output to `demo-seed-output.json` for programmatic follow-up:

```bash
npm run demo:seed -- --verbose
```

Output file includes all resource IDs, timestamps, and step logs.

### `--allow-prod`

Permit running against production (default refuses prod for safety):

```bash
npm run demo:seed -- --allow-prod
```

Required only if `ZB_ENVIRONMENT=prod`. Strongly discouraged unless you're intentionally seeding prod demo data.

## Output & Resource IDs

After successful seed, you'll see a summary block with:
- **RFP ID** — The request for proposal (marketplace listing)
- **Document IDs** — Attached RFP documents
- **Vendor Party ID** — The invited vendor account
- **Invitation ID** — The RFP invitation sent to vendor
- **Bid ID** — The submitted bid from vendor
- **Form Submission ID** — Structured form responses on the bid
- **Pilot Project ID** — The engagement/pilot project

These IDs are useful for:
- Manual UAT of the marketplace flow (test filtering, messaging, etc.)
- Errata 006 — exercising deferred flows 5–8 that require vendor/buyer accounts
- Verification checks via GraphQL

## Idempotency

Both scripts are safe to run multiple times:

- **Seed**: Creates fresh resources each time. No conflict checking needed — just create new UUIDs.
- **Cleanup**: Finds all demo-tagged resources and deletes them. Safe to run when nothing exists (exits 0 with "nothing to clean").

Typical workflow:
```bash
npm run demo:seed      # Create demo data for Friday demo
# ... demo happens ...
npm run demo:cleanup   # Clean up after demo
npm run demo:seed      # Seed again for Monday follow-up
npm run demo:cleanup   # Clean up again
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success (seed: created all resources; cleanup: removed all or none) |
| `1` | Failure (seed: API error or validation failure; cleanup: API error) |

Useful for CI/CD integration — seed exits non-zero on failure, suitable for smoke testing.

## Troubleshooting

### "Missing required environment variables"

Ensure `.env.local` has:
```bash
ZB_API_KEY=...
ZB_ORG_ID=...
ZB_TOKEN=...
```

Run `env | grep ZB_` to verify they're loaded.

### "Refusing to run against prod without --allow-prod flag"

If you really want to seed prod:
```bash
npm run demo:seed -- --allow-prod
```

Otherwise, set `ZB_ENVIRONMENT=uat` or `qa` and try again.

### "API failure" errors

Check:
1. API key is valid and not expired
2. Org ID matches the correct SME Mart test org
3. UAT/prod endpoints are reachable (network/firewall)
4. ZB platform is up (check #zerobias-platform Slack or ask Kevin)

### "No demo data to clean up"

Cleanup found no resources tagged with `w3geekery.sme-mart.demo-seed`. This is normal if:
- Seed has never been run
- Cleanup already removed everything
- Manual deletions were performed

Exit code is still 0 (success) — idempotent behavior.

## UAT Usage (Errata 006)

Deferred UAT flows 5–8 require real vendor/buyer accounts. Use seeded data:

1. Run `npm run demo:seed`
2. Copy resource IDs from summary (especially RFP ID, Vendor Party ID, Bid ID)
3. Open UAT at `https://uat.zerobias.com/` and log in as buyer/vendor
4. Manually navigate to the seeded RFP, bid, or pilot project using the IDs
5. Exercise the flows (message vendor, review bid, accept/reject, etc.)
6. Run `npm run demo:cleanup` to remove test data when done

For verbose output (includes URLs and all IDs):
```bash
npm run demo:seed -- --verbose
cat demo-seed-output.json
```

## Integration Testing (Smoke Test)

The seed script can be used as a light smoke test in CI:

```bash
npm run demo:seed && npm run demo:cleanup
```

Exits 0 if the full RFP → bid → pilot flow succeeds, 1 if any step fails. Useful for:
- Verifying API endpoints are healthy
- Testing schema changes don't break the flow
- Pre-demo checks (run 5 min before Friday demo to catch issues)

## Debugging

For additional logging, the scripts write to stdout/stderr. Redirect to a file:

```bash
npm run demo:seed 2>&1 | tee demo-seed.log
npm run demo:cleanup 2>&1 | tee demo-cleanup.log
```

Then inspect the logs for API errors, step-by-step progress, and created resource IDs.

## Technical Details

- **Marker Tag**: `w3geekery.sme-mart.demo-seed` (org scope, owned by SME Mart test org)
- **Cleanup Strategy**: Query by tag → collect IDs → delete in reverse-dependency order (responses → bid → documents → RFP → pilot)
- **API Surface**: ZB MCP (Platform Pipeline, Hydra Tag/Resource APIs)
- **Environment**: Reads from `.env.local` (default UAT); refuses prod without `--allow-prod`

## Related

- [SME Mart CLAUDE.md](../../CLAUDE.md) — Project conventions
- [GSD Phases 13–17](../../.planning/ROADMAP.md) — Feature roadmap
- [ERR-006](../../.planning/errata/) — UAT flows 5–8 (deferred)
