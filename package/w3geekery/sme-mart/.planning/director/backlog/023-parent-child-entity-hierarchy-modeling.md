---
id: "023"
priority: medium
scope: platform schema + sme-mart
effort: large
found: 2026-05-05
status: open
promoted_to: null
---

# First-class parent/child entity hierarchy with independent legal/tax identity

The platform must model real parent/subsidiary corporate structures, not just user-of-org membership. Each subsidiary entity can have its own tax ID / EIN, bank accounts, MSAs, and can transact independently of the parent — while still being tied to a parent for facilitation, global agreements, and (eventually) parent/child billing rules (deferred — see #026).

Brian's canonical examples:
- ZeroBias Inc (parent) → ZeroBias.Org (subsidiary, "community / standards body")
- Honeywell parent (global MSA + facilitation engine) → many subsidiary entities (where dollar transactions actually happen)
- Implies any customer entity could itself be a parent with subsidiaries the platform must track

**Why now:** ZB.Org work (#020) depends on this model existing in some form for the canonical case. Surfacing this as a separate item because the pattern generalizes well beyond .Org and needs design thought before implementation.

**Blocked by:** none — needs design/architecture spike.

**See:** `.planning/notes/meetings/2026-05-05-marketplace.md`
