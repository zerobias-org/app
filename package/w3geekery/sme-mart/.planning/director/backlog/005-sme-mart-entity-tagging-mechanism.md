---
id: "005"
priority: HIGH
scope: sme-mart + platform
effort: investigate-then-implement
found: 2026-04-23
status: active — Clark direction 2026-04-23: "if there's NOT currently a way to tag one of our schema classes we need to solve that"
promoted_to: pre-v1.4 work; may slot into v1.4 Phase 26 (schema-adjacent) or stand alone
---

# SME Mart entity tagging mechanism — schema entities can't be tagged like hydra Resources

Surfaced by the 2026-04-23 default-ZB engagement walkthrough (Clark observation after refinements #15 + #17 from `.planning/director/bootstrap-w3geekery-engagement.md` execution). The walkthrough revealed:

- SME Mart schema entities (`Engagement`, `SmeMartProject`, etc.) are AuditgraphDB Class Objects, NOT hydra Resources
- Class Objects and hydra Resources are separate realms — no `getResource` resolution, no `linkResources` / `tagResource` from the hydra side
- `Pipeline.receive`'s `tagIds` batch parameter does NOT materialize a tagged hydra Resource for the ingested entity (semantics unclear; non-blocking but suspicious)
- The only "tag" that an Engagement carries today is `zerobiasTagId` — a SCALAR field on the class schema pointing to ONE hydra Tag UUID
- `SmeMartProject` has no tag field at all in the current schema

## The gap

If we want SME Mart schema entities to be discoverable / filterable by N tags (the way hydra Resources can have many tags applied), there is no mechanism today. The single-scalar `zerobiasTagId` is sufficient for the per-engagement-anchor pattern (one tag per engagement, used for Task↔Engagement bridging) — but it can't carry:

- Category tags ("compliance", "advisory", "platform-services")
- Status / lifecycle tags ("active-this-quarter", "needs-review")
- Custom user-applied labels
- Cross-cutting taxonomy markers (e.g., "FedRAMP-relevant", "SOC2-relevant")
- Demo/test markers (relates to backlog 002 — currently demo-seed marker is a hydra tag applied to hydra Resources but the SME Mart Class entities themselves can't carry it)

## Design space (NOT decisions yet — research-then-decide)

1. **Schema field — array of tag UUIDs.** Add `tagIds: [UUID]` field to `Engagement`, `SmeMartProject`, possibly other SME Mart classes. Stored inline. GQL-queryable. Doesn't integrate with hydra's tag system but provides multi-tag capability with hydra Tag UUIDs as the values.
2. **Sidecar entity — `EntityTagAssociation` class.** New schema class with `subjectId`, `tagId`, `subjectType`. Many-to-many via separate records. More normalized; requires more queries; gives us a queryable association table.
3. **Loose string-tag list field.** A `tags: [String]` field with tag NAMES (not UUIDs). No referential integrity; cheapest to implement; weakest semantics.
4. **Wait for platform to bridge the realms.** ZB platform may eventually support cross-realm linking — Class Objects ↔ hydra entities, possibly including hydra Tags. Defer SME Mart-side work; raise the gap with Kevin/Chris when convenient.

## Why not blocking

The default-ZB engagement walkthrough proved the recipe works WITHOUT this — the per-engagement-anchor tag pattern (one `zerobiasTagId` per engagement) is sufficient for the v1.4 batch operation and the Task↔Engagement bridging it enables. Tagging multi-dimensionally for category/lifecycle/demo-markers is future-feature territory, not v1.4-blocking.

## When to revisit

Whichever of these triggers happens first:
- v1.4 Phase 24 demo-data-visibility-gate work hits a real wall trying to mark Engagement/Project records as demo-vs-real (current plan is to use the existing `w3geekery.sme-mart.demo-seed` hydra tag — but that only tags hydra Resources, not the SME Mart Class entities behind them)
- A user-facing taxonomy feature (category tagging, lifecycle status flags) lands on the v1.5+ roadmap
- Brian directs that entity-tagging be first-class for marketplace browse/filter UX
- ZB platform announces cross-realm linking support — re-evaluate if option 4 becomes free

## Related

- `.planning/director/bootstrap-w3geekery-engagement.md` refinements #15 + #17 (the source observations)
- backlog 002 demo-data-cleanup-and-visibility (would benefit from option 1 or 2)
- The hydra Tag API in memory (works for hydra Resources only; not the issue here)
