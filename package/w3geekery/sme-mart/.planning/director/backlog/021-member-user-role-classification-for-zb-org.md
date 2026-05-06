---
id: "021"
priority: high
scope: platform (hydra/dana) + sme-mart
effort: medium
found: 2026-05-05
status: open
promoted_to: null
---

# Guild `member` user-role classification for ZeroBias.Org

Users join ZeroBias.Org (internally: **the Guild**) with a role classification of `member` (Geekery, SDI, Work Worlds, Daniel Rojas Inc, Ragu Inc users are all examples). Internal core staff (Kevin McCarthy, Nick) join as `administrator`. Brian also mentioned a future `observer` classification.

**Brian's 2026-05-06 Slack clarification revealed why member status is load-bearing**, not just a profile label: it gates the **publishing pipeline** (see #028).

> "It is required to be built via their Guild member credentials in the zerobias Guild Org that is in place... if you were going to build a connector for something you need as Geekery, you have to use your guild member status to build it in the Zb org org and then publish it through a publishing process to be pulled into the Zb org catalog and then the global platform catalog."  — Brian, 2026-05-06

So Guild member status:
- Grants browse-access to Guild projects (some public, some access-requested — see #029)
- Provides the **member credential** required to author / commit artifacts (connectors, crosswalks, standards, queries, alerts) to the Guild repo
- Is the prerequisite identity that the publishing pipeline checks before allowing artifacts into the Guild catalog → global platform catalog

Open schema-level question: is this a hydra group, a custom claim, a junction-table entity (UserOrgMembership), or a tag-style classification on the existing org-membership relationship? Brian hand-waved between "engagement", "membership", and "linked relationship" before settling on "user classification" verbally — the actual model decision is unmade. Now also has to integrate with whatever credential mechanism the publishing pipeline uses (#028, #030).

**Why now:** Required to model who-is-what in the Guild (#020) AND to gate the publishing pipeline (#028). Without a concrete decision, downstream onboarding + publishing work cannot proceed.

**Blocked by:** none — this is a prerequisite for #020 and #028. Likely needs Kevin's input (platform schema owner) + Catalin/Daniel input (publishing pipeline owners).

**See:**
- `.planning/notes/meetings/2026-05-05-marketplace.md`
- `.claude/research/2026-05-06-zerobias-org-community-precedents.md`
