---
id: "020"
priority: critical
scope: sme-mart + platform
effort: large
found: 2026-05-05
status: open
promoted_to: null
---

# Auto-create default engagement+project with ZeroBias.Org Guild on every customer onboarding

Brian's 2026-05-06 Slack clarification (in response to the meeting follow-up) locks the onboarding shape:

> "This will need to become part of normal onboarding with any new customer. It will be engagement for Zb core with default Proj 1. And a separate but required engagement will also be with guild (Zb-org) and set them up as member of Guild (Zb-org) and browse projects that guild -Zb org has in place... So they need to see as member of guild. They need to be able to browse projects and join each project they want to participate. There will be some very public projects they can jump into. And some they need to request access to."  — Brian, 2026-05-06

**Two things must happen on every customer onboarding:**

1. **Engagement for ZB Core with default Project 1** (today's existing behavior).
2. **Separate REQUIRED engagement with the Guild (ZB.Org)** that:
   - Sets the customer's users up as Guild members (see #021 — Guild member role).
   - Grants the user access to **browse Guild projects** that ZB.Org publishes (some public/jump-in, some access-requested).
   - Implies acceptance of a separate licensing agreement / T&Cs distinct from ZB Core's MSA.

Both ZB Core and the Guild are real legal entities (own EIN/tax ID/MSA); both surface as marketplace providers; both follow the same engagement+project rules.

The Guild engagement is what unlocks the customer's ability to PARTICIPATE in Guild projects (browsing, joining, contributing artifacts via the publishing pipeline — see #028).

Onboarding flow trigger still unresolved (signup vs first-sign-in vs explicit consent step) given the separate licensing agreement.

**Why now:** Brian called this "quite important data to capture" and explicitly tied it to the normal onboarding flow. Promoted to `critical` because every other Guild-related item (#021, #028, #029) depends on this engagement structure existing.

**Blocked by:** #021 (Guild `member` user-role classification), #022 (Geekery → ZB.Org membership for dev validation), #024 (cross-env provisioning audit of ZB.Org).

**See:**
- `.planning/notes/meetings/2026-05-05-marketplace.md`
- `.claude/research/2026-05-06-zerobias-org-community-precedents.md`
