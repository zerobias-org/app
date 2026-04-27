# Plan 043: Bid Rename Migration (proposal → bid)

**Status:** Complete
**Created:** 2026-03-06
**Driver:** Brian directive — "Proposal" removed from vocabulary. Vendor response = **Bid**.

## Scope

270 occurrences of "proposal" across 48 source files + 14 plan files + database tables/VIEWs.

## Phase 1: Models & Interfaces (~1 hr)

Rename model files, interfaces, and type exports.

| File | Action |
|------|--------|
| `src/app/core/models/bid.model.ts` | Rename interfaces: `Proposal` → `Bid`, `ProposalStatus` → `BidStatus`, `ProposalFormData` → `BidFormData` (file already renamed in phase changes) |
| `src/app/core/models/index.ts` | Update barrel export from `Proposal` → `Bid` |

## Phase 2: Services (~1.5 hrs)

Rename service files and update all internal references.

| File | Action |
|------|--------|
| `src/app/core/services/bids.service.ts` | Class `ProposalsService` → `BidsService`. Method names: `getProposals` → `getBids`, `createProposal` → `createBid`, etc. (file already renamed in phase changes) |
| All services importing BidsService | Update imports from `ProposalsService` → `BidsService` |

## Phase 3: Mappers (~1 hr)

| File | Action |
|------|--------|
| `src/app/core/mappers/bid-resource.mapper.ts` | Update class/function names (file already renamed in phase changes) |

## Phase 4: Components (~4 hrs)

Rename component directories, files, selectors, and templates.

| Component | Action |
|-----------|--------|
| `bid-card/` | Files → `bid-card.component.*`, selector → `app-bid-card`, class → `BidCardComponent` (dir already renamed in phase changes) |
| `bid-form/` | Files → `bid-form.component.*`, selector → `app-bid-form`, class → `BidFormComponent` (dir already renamed in phase changes) |
| Any template referencing `<app-bid-*>` | Verify selector references use `app-bid-*` (not `app-proposal-*`) |
| Any component importing Bid types | Update imports from `Proposal` → `Bid` |

## Phase 5: Routes & Pages (~1.5 hrs)

| File | Action |
|------|--------|
| Route definitions using `proposal` paths | Evaluate — may keep URL paths as-is or migrate |
| Page components referencing proposals | Update variable names, labels, tooltips |
| Navigation labels | "Proposals" → "Bids" in UI text |

## Phase 6: Database & VIEWs (~2 hrs)

| Object | Action |
|--------|--------|
| `bids` table | Already named `bids` (was `proposals`). Verify columns: `bid_count`, `pending_bid_count` (not `proposal_count`) |
| VIEWs (`v_engagement_summary`, `v_engagement_detail`, etc.) | Update JOIN targets from `proposals` → `bids`, column aliases from `proposal_*` → `bid_*` |
| `SmeMartDbService` SQL queries | Update table/view references from `proposals` → `bids` |

**Risk:** Database rename requires coordination. Consider keeping `proposals` table with a `bids` VIEW alias during transition.

## Phase 7: Plan Files (~1.5 hrs)

14 plan files reference "proposal". Update terminology:
- `.claude/plans/public/PLAN.md` ✅ Done
- `.claude/plans/BIG-PICTURE.md` ✅ Done
- `.claude/plans/local/033-vendor-bid-response.md` ✅ Updated (file renamed from 033-vendor-proposal-response.md)
- `.claude/plans/local/030-sme-mart-resource-abstraction.md` — Update resource type from `sme-mart:proposal` → `sme-mart:bid`
- `.claude/plans/local/036-rfp-engagement-split.md` — Update RFP proposal terminology
- `.claude/plans/public/008-engagement-lifecycle.md` — Update proposal flow terminology
- `.claude/notes/sme-mart-resource-types-summary.md` — Update resource type
- `.claude/notes/demo-data-guide.md` — Update engagement examples
- `.claude/notes/neon-mcp-reference.md` — Update table names and query references
- `.claude/notes/types-quick-reference.md` — Check for proposal references
- `.claude/skills/sme-mart-architect.md` — Update service/component pattern examples
- `.claude/restart_context_043.md` — Update context for session continuity
- `.claude/notes/CEO_NOTES.md` — Update strategic context

## Phase 8: GQL Schema (~2 hrs)

| File | Action |
|------|--------|
| `zerobias-org/schema` PR #3 | Rename `Proposal` entity → `Bid` in YAML schema package |
| Related schema references | Update field names, relationships |

**Dependency:** Coordinate with Kevin — schema changes affect platform.

## Execution Strategy

1. **Phases 1–5** can be done together in one commit (all local code)
2. **Phase 6** (database) should be a separate commit with migration SQL
3. **Phase 7** (plans) can be done alongside Phase 1–5
4. **Phase 8** (GQL schema) is a separate PR on `zerobias-org/schema`

## Estimated Total: ~14.5 hrs

**Risk factors:**
- Database rename may break running queries if done without VIEW alias
- GQL schema PR needs Kevin review
- 270 occurrences means thorough grep validation after each phase

## Acceptance Criteria

- [x] Zero occurrences of "proposal" in source code (except "Budget / Cost Proposal" doc type — standard procurement term)
- [x] Build passes clean (`ng build` — no errors)
- [x] Database queries work with new table/view names (table `proposals` → `bids`, enum `proposal_status` → `bid_status`, VIEW aliases updated)
- [x] UI displays "Bid" terminology throughout
- [x] Plan files updated with new terminology
- [x] GQL schema PR updated (Clark, 2026-03-06)
