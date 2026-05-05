---
id: "021"
priority: high
scope: platform (hydra/dana) + sme-mart
effort: medium
found: 2026-05-05
status: open
promoted_to: null
---

# `member` user-role classification for ZeroBias.Org community membership

Users join ZeroBias.Org with a role classification of `member` (Geekery, SDI, Work Worlds, Daniel Rojas Inc, Ragu Inc users are all examples). Internal core staff (Kevin McCarthy, Nick) join as `administrator`. Brian also mentioned a future `observer` classification.

Open schema-level question: is this a hydra group, a custom claim, a junction-table entity (UserOrgMembership), or a tag-style classification on the existing org-membership relationship? Brian hand-waved between "engagement", "membership", and "linked relationship" before settling on "user classification" verbally — the actual model decision is unmade.

**Why now:** Required to model who-is-what in ZB.Org (#020) and to enforce the admin/member distinction for the ZB.Org admin pool. Without a concrete decision, downstream onboarding work cannot proceed.

**Blocked by:** none — this is a prerequisite for #020. Likely needs Kevin's input (platform schema owner).

**See:** `.planning/notes/meetings/2026-05-05-marketplace.md`
