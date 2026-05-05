---
id: "026"
priority: low
scope: platform billing + sme-mart
effort: large
found: 2026-05-05
status: open
promoted_to: null
---

# Billing rules for parent/child entity hierarchies (who pays whom)

When parent/subsidiary entity model exists (#023), billing rules across the hierarchy become non-trivial: who pays for what, parent-pays-for-child vs child-pays-on-own-account, MSAs at the parent vs invoices at the child, etc. Honeywell example: global MSA at parent, dollar transactions at children.

Brian explicitly deferred this: "we're not going to get into that right now." Capturing as a future-work item that depends on #023.

**Why now:** Mentioned in 2026-05-05 marketplace meeting and explicitly deferred. Logging so the dependency on #023 is captured.

**Blocked by:** #023 (parent/child entity model must exist first).

**See:** `.planning/notes/meetings/2026-05-05-marketplace.md`
