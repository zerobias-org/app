# Director Review — Phase 12: Project-Centric Boundary Model

**Reviewed:** 2026-04-01
**Verdict:** PASS with 4 FLAGs

## Flags (executor should read before starting)

**FLAG-1: `loadOrgMetrics()` is sequential — parallelize.**
Task 1 loops `for (const org of orgs) await loadOrgMetrics(org.id)` — serial GQL calls. With 5 orgs, that's 5 sequential round-trips. Use `Promise.all(orgs.map(o => loadOrgMetrics(o.id)))` to fire all metric queries in parallel.

**FLAG-2: Project count query has no org filter.**
Task 1's `loadOrgMetrics` queries `SmeMartProject` with `pageSize: 1` but NO org filter. This returns the total count for the current org context, not per-org. Must filter by `ownerId` matching the org ID, or query engagements first then count linked projects.

**FLAG-3: BoundaryService interfaces use `[key: string]: any` — too loose.**
Task 3's `BoundaryParty`, `BoundaryPartyRole`, `BoundaryTeam` interfaces have index signatures. Check the actual SDK response types from `platformClient.getBoundaryApi()` and type these properly. At minimum, remove the index signature and add explicit optional fields for known properties.

**FLAG-4: Boundary names are truncated UUIDs — resolve actual names.**
Task 4 shows boundary names as `Boundary abc12345...`. Check if `platform.Boundary.getBoundary(boundaryId)` exists to fetch the actual boundary name. Or call `listBoundaries` once and build a name lookup map. Truncated UUIDs are a poor UX.

## Notes

- Good: accordion auto-expands single boundary, collapses multiple
- Good: ZbCustomizableTableComponent for party tables
- Good: effect-based lazy loading on boundaryIds input change
- Minor: verify `SmeMartProject` type is exported and importable from the models barrel
