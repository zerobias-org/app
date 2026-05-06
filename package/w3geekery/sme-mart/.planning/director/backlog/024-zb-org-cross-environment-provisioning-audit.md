---
id: "024"
priority: medium
scope: platform infra
effort: small
found: 2026-05-05
status: open
promoted_to: null
---

# Audit ZeroBias.Org provisioning across CI / UAT / QA / Prod

Clark asked Brian whether ZeroBias.Org should exist on the CI/dev platform environment given third-party-app rules. Brian's answer: yes, treat .Org as a normal provider with its own org / EIN / business unit. Implication: .Org needs to exist on every platform environment we deploy against. Provisioning status across CI, UAT, QA, and Prod is unknown — needs an inventory before any .Org-dependent dev work can be planned.

Confirm with Kevin (platform infra owner). Document which envs have a `.Org` org record today and which need it created.

**Why now:** Prerequisite for #022 (we need to know where to provision Geekery as a .Org member) and #020 (need to know which envs the auto-engagement code can target).

**Blocked by:** none — discovery task with Kevin.

**See:** `.planning/notes/meetings/2026-05-05-marketplace.md`
