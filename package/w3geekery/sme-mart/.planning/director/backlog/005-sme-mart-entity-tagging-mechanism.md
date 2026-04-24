---
id: "005"
priority: HIGH
scope: sme-mart + platform
effort: investigate-then-implement
found: 2026-04-23
status: RESOLVED 2026-04-24 — mechanism validated (inherited `Object.tag` field at ingest time). See "Resolution" section below.
promoted_to: no schema PR needed; recipe folded into `bootstrap-w3geekery-engagement.md` Steps C + E
---

# SME Mart entity tagging mechanism — schema entities can't be tagged like hydra Resources

Surfaced by the 2026-04-23 default-ZB engagement walkthrough (Clark observation after refinements #15 + #17 from `.planning/director/bootstrap-w3geekery-engagement.md` execution). The walkthrough revealed:

- SME Mart schema entities (`Engagement`, `SmeMartProject`, etc.) are AuditgraphDB Class Objects, NOT hydra Resources
- Class Objects and hydra Resources are separate realms — no `getResource` resolution, no `linkResources` / `tagResource` from the hydra side
- `Pipeline.receive`'s `tagIds` batch parameter does NOT materialize a tagged hydra Resource for the ingested entity (semantics unclear; non-blocking but suspicious)
- The only "tag" that an Engagement carries today is `zerobiasTagId` — a SCALAR field on the class schema pointing to ONE hydra Tag UUID
- `SmeMartProject` has no tag field at all in the current schema

## Resolution (2026-04-24)

Kevin clarified 2026-04-23 that the mechanism DOES exist — via the inherited `Object.tag` field, which every class already has. Requirements:

- **Tags must be set at INGEST TIME** (immutable post-ingest).
- **Pipeline.receive payload** populates the field per-record: `data[i].tag`.
- **Validated shape** (experiment 2026-04-24, see DECISIONS.md "Object.tag Field Shape"): `tag: [{ value: "<hydra-tag-UUID>" }]`. Array of objects with `value` property holding the tag UUID. `multi: true`, so multiple tags per Object are supported natively.

This resolves the observed gap:
- Multi-tag capability on class Objects: YES (array field, per-record).
- Uses existing hydra Tag UUIDs as values: YES (no new tag primitive needed).
- GQL-queryable (server stores literally, field is indexed per class describe): pending read-endpoint confirmation from Kevin, but structurally the data is there.

The `zerobiasTagId` scalar field on Engagement still exists and is still used for the per-engagement-anchor pattern (Task↔Engagement bridging via shared hydra Tag — Step D in the bootstrap brief). The new `tag` field on every class Object (via base Object inheritance) is the generalized multi-tag mechanism that sits alongside it.

## Open (post-resolution)

- ~~**READ endpoint for tag-scoped discovery**~~ — **RESOLVED 2026-04-24.** GQL path: `ClassName(tag: { value: ".eq.<tag-uuid>" }) { ... }` via `graphql.Boundary.boundaryExecuteRawQuery`. Verified round-trip: wrote a tag via Pipeline.receive, queried by tag UUID, got back the one tagged record. Kevin-ask closed.
- **Retroactive tagging of existing walkthrough records** — the W3Geekery Engagement + SmeMartProject created pre-resolution have no `tag` field populated. Re-push via Pipeline.receive during the HIS walkthrough or batch run to close the loop.
- **Cleanup of experiment residue** — `SmeMartProject` record `TAG-SHAPE-TEST-C` (schema id `64047b6c-52e7-4592-ac1d-27f5020d1e01`) left on UAT. Include `markDeleted: [...]` in a future SmeMartProject batch (class `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`).

## Historical gap analysis (kept for context — superseded by Resolution above)

If we want SME Mart schema entities to be discoverable / filterable by N tags (the way hydra Resources can have many tags applied), there is no mechanism today. The single-scalar `zerobiasTagId` is sufficient for the per-engagement-anchor pattern (one tag per engagement, used for Task↔Engagement bridging) — but it can't carry:

- Category tags ("compliance", "advisory", "platform-services")
- Status / lifecycle tags ("active-this-quarter", "needs-review")
- Custom user-applied labels
- Cross-cutting taxonomy markers (e.g., "FedRAMP-relevant", "SOC2-relevant")
- Demo/test markers (relates to backlog 002 — currently demo-seed marker is a hydra tag applied to hydra Resources but the SME Mart Class entities themselves can't carry it)

## Design space (SUPERSEDED — all four options were hypotheticals before Kevin's clarification)

1. ~~Schema field — array of tag UUIDs~~ — no schema PR needed; `Object.tag` is inherited.
2. ~~Sidecar entity — `EntityTagAssociation` class~~ — unnecessary given `Object.tag`.
3. ~~Loose string-tag list field~~ — weaker semantics than the validated shape.
4. ~~Wait for platform~~ — the mechanism was already there; we just didn't see it.

## Why not blocking

The default-ZB engagement walkthrough proved the recipe works WITHOUT this — the per-engagement-anchor tag pattern (one `zerobiasTagId` per engagement) is sufficient for the v1.4 batch operation and the Task↔Engagement bridging it enables. Tagging multi-dimensionally for category/lifecycle/demo-markers is future-feature territory, not v1.4-blocking. **Now with `Object.tag` validated, multi-tag is no longer future-feature — it's available immediately for any new Pipeline.receive writes.**

## When to revisit (post-resolution)

Still potentially relevant even after resolution:
- v1.4 Phase 24 demo-data-visibility-gate: can now use `Object.tag` to mark new records demo-vs-real at ingest. Existing records (demo or walkthrough) need retroactive re-push.
- A user-facing taxonomy feature: no schema work needed; use `Object.tag` with app-defined tag UUIDs.
- Brian directs first-class entity-tagging for marketplace browse/filter UX: unblocked pending the READ endpoint from Kevin.

## Related

- `.planning/director/bootstrap-w3geekery-engagement.md` refinements #15 + #17 (the source observations), plus Steps C + E (now populate `tag` field)
- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment" (2026-04-24)
- backlog 002 demo-data-cleanup-and-visibility (now unblocked on the tagging side)
- The hydra Tag API in memory (works for hydra Resources only; `Object.tag` is the parallel mechanism for class Objects)
