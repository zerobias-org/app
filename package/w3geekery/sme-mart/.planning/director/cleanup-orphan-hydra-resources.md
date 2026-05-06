# Cleanup — Orphan Hydra Resources (post-Phase-24)

**Status:** OPEN — deferred from Phase 24 v1.4. Not a phase. Director brief tracking a known gap.
**Origin:** Phase 24 plan-check HIGH-1 (2026-05-01). Plan 24-04 Task 1 originally assumed `hydra.Resource.deleteResource` exists. Verified absent via `mcp__zerobias__zerobias_search` (28 hydra Resource ops returned, zero match).
**Owner:** Director (queues to backlog post-v1.4); requires Kevin input on cascade behavior before scope can be sized.
**Related:** `phase-24-brief.md`, `24-CONTEXT.md` HIGH-1, `project_sme_mart_transparency_invariant.md`.

---

## Problem

Hydra exposes no `deleteResource` operation. When SME Mart marks a class-Object as deleted via `Pipeline.markDeleted` (Phase 24 demo cleanup, future ops cleanup, future user-driven deletions), the **hydra Resource that was tagged at ingest persists**. Over time these hydra Resources accumulate as orphans — not pointed to by any class-Object, not surfaced in class-driven queries, but still resident in the platform's hydra store.

Specific to Phase 24's case: `81053c14-...` (global demo, marketplace tagType) and `d618b602-...` (legacy `w3geekery.sme-mart.demo-seed`, other tagType) are tagged on hydra Resources that mirror the class-Object Engagements / SmeMartProjects / etc. that the seeder created. Phase 24 visibility filter is on `Object.tag` at GQL read time — so orphan hydra Resources are *invisible* to the marketplace UI by construction. But they exist.

## Why deferred from Phase 24

Phase 24's mandate is **visibility**, not destruction. Visibility is satisfied without hydra cleanup:

- Class-driven queries filter by `Object.tag` and exclude demo-tagged Objects.
- Hydra Resources with no class-Object backreference don't surface in any class-list endpoint.
- Marketplace UI never reads hydra-Resource-direct; everything routes through class queries.

Bundling hydra cleanup into Phase 24 would have:
1. Invented a destruction story (Path b — `untagResource` only — leaves Resources resident, just untagged).
2. Pulled in Kevin platform-side conversation as a phase blocker.
3. Inflated a 1-wave visibility phase into a 2-front cleanup epic.

Director called it: defer, file this brief, file backlog entry, return to it when Kevin clarifies cascade behavior or when orphan accumulation becomes observable (DB bloat / billing / GQL noise).

## Open questions for Kevin

1. **Does class-Object `Pipeline.markDeleted` cascade to remove tagged hydra Resources?** Or are class-Objects and hydra Resources lifecycle-independent?
2. **If no cascade, what's the canonical path for cleaning up orphan hydra Resources?** Is `deleteResource` on the hydra roadmap? Is `untagResource` followed by some sweeper job the intended pattern?
3. **Is orphan-hydra-Resource accumulation a known platform issue?** Bloat, query performance, billing, GQL search noise — any of these on Kevin's radar?
4. **For the W3Geekery production cutover (Phase 31):** must we ensure zero demo-tagged orphan hydra Resources before launch, or is "invisible to class queries" sufficient?

These belong on the next Kevin sync, not in a 1-on-1 ping (no fire).

## Three minimum-viable cleanup paths

### Path A — `hydra.Resource.untagResource` sweep
Walk all hydra Resources tagged with `81053c14-...` and `d618b602-...`, call `untagResource` to remove the demo tag. Resources persist but are detagged.

- **Cost:** ~2 hr. Single MCP-driven script, no platform changes.
- **Effect:** Removes the only signal that a Resource was demo. Doesn't reduce row count.
- **Risk:** If Kevin later ships `deleteResource`, this path leaves us with unfindable orphans (no demo tag = no way to identify them as cleanup candidates).

### Path B — Wait for hydra `deleteResource`
Platform-side ask via Kevin. Run a proper delete sweep when the operation exists.

- **Cost:** Zero from SME Mart side. Kevin's queue.
- **Effect:** Real cleanup when it lands. Until then, orphans accumulate.
- **Risk:** Indefinite hold. Feature may never ship if no other consumer wants it.

### Path C — Custom cleanup script invoked manually post-Phase-24-close
Hybrid: identify orphans by tag NOW (so we can find them later), document the orphan inventory, then revisit when Path B lands.

- **Cost:** ~3 hr. Inventory script + commit the inventory file.
- **Effect:** Captures the population so it's recoverable when delete becomes possible.
- **Risk:** Inventory drifts as new orphans accumulate; needs periodic refresh.

## Recommended scope (Director call)

**Defer until post-v1.4. Path B is the right answer if Kevin says cascade exists.** If cascade doesn't exist and Kevin has no `deleteResource` plan, fall back to Path C (inventory now, sweep later) before W3Geekery production cutover (Phase 31). Path A is a last resort only — detagging without delete is worse than the current state because we lose the ability to identify orphans later.

## Action items

| # | Action | Owner | Trigger |
|---|---|---|---|
| 1 | Add to v1.5 backlog as `MARKETPLACE-CLEANUP-1 — orphan hydra Resource sweep` | Director | After v1.4 milestone-close |
| 2 | Surface questions 1–4 above to Kevin | Director / Clark | Next Kevin sync |
| 3 | Run inventory probe: `mcp__zerobias__zerobias_execute hydra.Resource.searchResources` filtered on the two demo tag UUIDs against UAT and prod; record counts + IDs | Director (manual MCP) | Before Phase 31 (production cutover) |
| 4 | If Kevin confirms cascade exists for `Pipeline.markDeleted`: close this brief, no further work. | Director | After Kevin sync |
| 5 | If no cascade and no `deleteResource` planned: execute Path C inventory script before Phase 31 | Director / executor | Pre-Phase-31 |

## Pre-execute MCP probe (for whoever picks this up)

```
mcp__zerobias__zerobias_execute hydra.Resource.searchResources
  body: { tag: { value: ".eq.81053c14-a8e5-4939-b538-c122c7d0eb1a" } }

mcp__zerobias__zerobias_execute hydra.Resource.searchResources
  body: { tag: { value: ".eq.d618b602-21cc-40a1-a9fa-534b7bc1672c" } }
```

Run against both UAT and prod. Record counts in this file under a new `## Inventory snapshot` section.

## Anti-patterns

- **Conflating this with Phase 24.** Phase 24 is visibility-only. Reopening it to add hydra cleanup invalidates the closed scope and re-trips the plan-check.
- **Calling `untagResource` blindly without a delete path.** Detagged orphans are *worse* than tagged orphans — you lose the only handle for finding them later.
- **Treating this as urgent.** Orphans are invisible to UI; bloat is theoretical until Kevin confirms or production tells us otherwise.
- **Filing this as a phase brief.** It's not a phase. It's a maintenance ask gated on platform input.

## Cross-references

- `.planning/phases/24-demo-data-visibility-gate/24-CONTEXT.md` — HIGH-1 resolution (Path c selected, this brief is the receiver).
- `.planning/phases/24-demo-data-visibility-gate/24-04-PLAN.md` — Task 1 scope (class-Object `markDeleted` only).
- `DECISIONS.md` — entry to be added: "Orphan Hydra Resources Deferred From Phase 24" once gsd-plan's three pre-execute edits land.
- `DIRECTOR-PARKS-RESUME.md` — In-flight tracker should add a row pointing here.

---

**Last updated:** 2026-05-01 (drafted)
