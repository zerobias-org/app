---
id: "012"
severity: medium
phase: 17
found: 2026-04-15
status: open
---

# Pipeline-created AuditgraphDB objects do not materialize as hydra `Resource` rows

Discovered during Phase 17 wiring (SUMMARY §"State-file-driven cleanup"):

> Pipeline-created AuditgraphDB objects do **not** materialize as hydra `Resource` rows, so `tagResource` fails with a FK violation and `listTaggedResources(tagId)` returns zero items even after a successful seed (verified with a probe script, 2026-04-15 18:10Z).

This forced Phase 17's cleanup to switch from tag-driven (original plan: `hydra.Tag.searchTags` → `Resource.listTaggedResources`) to local state-file-driven. State-file works for this specific demo CLI but is a symptom of a larger gap.

**Impact:**
- Any UI/service that wants to tag pipeline-created entities for cross-cutting queries (saved searches, grouping, discovery) will hit the same FK wall
- SME Mart's Tag-based discovery (e.g., `listTaggedResources` for "all my RFPs") works for Neon-stored entities but not for AuditgraphDB entities — asymmetric behavior likely surprising to future devs
- Backlog Plan 087 (Form Template Library) plans org-scoped tagging of templates — will hit this if templates are pipeline-stored

**Root cause (hypothesis):**
Pipeline ingestion writes to AuditgraphDB directly without creating corresponding `hydra.Resource` rows for indexability. Possibly by design (perf, scale), possibly a config flag, possibly unimplemented.

**Fix (requires platform team):**

1. **Escalate to Kevin** with the evidence (probe script, cleanup.ts state-file workaround). Ask:
   - Is this by design or a config gap?
   - Is there an automatic pipeline→hydra materialization path (flag, webhook, scheduler) we're missing?
   - If by design, what's the recommended pattern for tagging pipeline-stored entities?
2. If platform-side fix is coming: wait and replace state-file cleanup with tag-driven in a follow-up.
3. If by design: document the pattern in `.claude/notes/zb-graphql-custom-schema-howto.md` so every future tagging feature knows to use an alternative (e.g., hydra.Tag.searchTags via class-scoped search rather than resource lookup).

**Related:**
- Memory note `project_sme_mart_prod_pipeline.md` already documents pipeline IDs and receive patterns
- `reference_sme_mart_zb_deps.md` mentions data-utils as a ZB package to watch — maybe the materialization hook is coming there

**For Plan 087 (Form Template Library):** Design must account for this — if templates are pipeline-stored, tagging must use class-scoped search not resource-scoped.
