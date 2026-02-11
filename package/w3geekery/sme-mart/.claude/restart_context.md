# SME Mart - Restart Context

**Last Updated:** 2026-02-10
**Branch:** `poc/sme-mart`

## Current State

### Plan 011 — RFP → Engagement Lifecycle — COMPLETE
**Plan:** `.claude/plans/local/011-rfp-engagement-lifecycle.md`
**Status:** Implementation complete, dev server compiles clean

#### Files Created/Modified
1. **`src/lib/engagement-lifecycle.ts`** — NEW: `isRfpPhase()`, `isEngagementPhase()`, `getLifecycleLabel()` based on `engagementTag` presence
2. **`src/app/api/engagements/route.ts`** — Removed ZeroBias Tag creation from POST (tag now created on proposal acceptance). Kept Task creation. Renamed "Engagement Details" → "RFP Details" in task description. GET now includes `proposals` relation (id, providerId, status) for browse page filtering.
3. **`src/app/api/proposals/[id]/route.ts`** — On proposal acceptance: generates BIP39 tag, creates ZeroBias Tag via SDK, updates work request with `engagementTag`, `zerobiasTagId`, and `status: 'in_progress'`
4. **`src/hooks/useUserRole.ts`** — NEW: PKV-backed role preference (buyer/provider/both), debounced save, localStorage fallback for mock mode
5. **`src/components/layout/UserProfileDropdown.tsx`** — Added role toggle (ToggleButtonGroup: Buyer/Provider/Both) between Edit Profile and Dark Theme sections
6. **`src/app/engagements/page.tsx`** — Added lifecycle toggle (RFPs|Engagements|All), "My Proposals" chip for providers, dynamic page header, CTA renamed to "Post an RFP", imports lifecycle helpers
7. **`src/components/marketplace/EngagementCard.tsx`** — Added lifecycle label chip (RFP/Engagement), `ProposalSummary` interface, `proposals` in `EngagementCardData`, RFP tooltip
8. **`src/app/engagements/new/page.tsx`** — Terminology: "Post an RFP", "Creating RFP...", sign-in alert updated
9. **`src/app/engagements/[engagementId]/page.tsx`** — Lifecycle label chip in header, contextual cancel text ("Cancel RFP" vs "Cancel Engagement"), lifecycle-aware status messages, RFP tooltips

#### Remaining
- **Manual testing** — Verify end-to-end flow in dev server (post RFP → submit proposal → accept → verify tag creation → lifecycle label change)

### Previously Completed (This Branch)
1. **Engagement Creation Flow with ZeroBias Tag + Task** — DONE (now partially refactored by Plan 011)
2. **Removed dead polyfill packages** — DONE
3. **Fixed all pre-existing build errors** — DONE

### Open STANDUP Items
<!-- STANDUP -->
1. Should we add a new `engagement` tag type in ZeroBias? (currently using `other`)
2. Should engagement tags be org-scoped or user-scoped? (currently defaulting org)
<!-- /STANDUP -->

## Key Reference

### ZeroBias MCP Profile
- Profile: `dev` (points to `api.ci.zerobias.com`)
- Connected as: `Roughneck-Admin` in `Roughnecks` org
- Org ID: `ea998b93-d05a-5743-8fe4-0e8d383f2b0c`

### Key Activity IDs
- **"Task" activity:** `5583de55-e303-49fb-a671-2591e6d8ced5` (Software Development Lifecycle workflow)

### Important: MCP is npm-linked to local source
`zb` is symlinked to `~/zb-repos/clients/packages/mcp` (branch: `fix/mcp-describe-wildcard-content-type`). `zb update` will NOT work. To update: `npm uninstall -g @zerobias-com/zerobias-mcp` then install from registry.

### CI Environment Notes
- CI (`ci.zerobias.com`): Auth works, catalog endpoints intermittently 503
- QA (`qa.zerobias.com`): Full API but auth redirect broken (sends to CI login URL)

## Questions Still Open
1. When engagement completes, does tag stay on boundary or get archived?
2. Provider filter preferences — save "Match my expertise" criteria?
