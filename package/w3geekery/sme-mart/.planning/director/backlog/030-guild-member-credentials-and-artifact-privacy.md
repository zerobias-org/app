---
id: "030"
priority: medium
scope: platform auth + zerobias-org repos + sme-mart
effort: medium
found: 2026-05-06
status: open
promoted_to: null
---

# Guild member credentials + privacy model for built artifacts

## Brian's framing (2026-05-06 Slack)

> "It is required to be built via their Guild member credentials in the zerobias Guild Org that is in place."

> "For now. Nothing our customers build is restricted from being private. It is required to be built via their Guild member credentials in the zerobias Guild Guild Org that is in place."

## What this is

The Guild publishing pipeline (#028) requires a credential mechanism that:

1. **Authenticates the contributor** as a Guild member in good standing (per #021)
2. **Authorizes** the contribution against whatever Guild project the artifact targets (#029)
3. **Tags the artifact** with provenance — which member-org built this, when, version history
4. **Governs visibility** of the contribution — Brian's note "for now, nothing our customers build is restricted from being private" leaves the eventual privacy semantics open

## Open design questions

- **What IS the credential** — GitHub credentials inherited from `zerobias-org/*` membership? A platform-issued API token tied to Guild member status? Auth0 / Dana session with a Guild scope claim? Something custom?
- **How does it integrate** with platform auth — does Kevin's team already have a credential-issuance path that can be reused, or is this new infrastructure?
- **Privacy tiers for built artifacts** — current state per Brian: "nothing restricted from being private." Eventual likely tiers (need confirmation):
  - Private to author org (drafts, work-in-progress)
  - Private to a Guild project (visible to project members)
  - Public in Guild catalog (visible to all Guild members)
  - Public in global platform catalog (visible to all platform users)
- **Provenance display** — when an artifact is published, do consumers see "Built by <member-org>" attribution? What if multiple member-orgs contributed?
- **Revocation** — if a member-org leaves the Guild, what happens to artifacts they've published? (Stay published with frozen attribution? Removed? Transferred to Guild ownership?)

## Why now

#028 (publishing pipeline) cannot be built without resolving the credential mechanism. Capturing this as a separate item because the credential design has implications for platform auth (Kevin's domain) that are independent of the publishing flow itself (Catalin/Daniel's domain).

## Blocked by

- #021 (Guild member role classification) — defines what "Guild member" means in the auth layer
- Kevin input on whether platform auth already has a Guild-scope credential path
- Brian alignment on long-term privacy tiers — current "nothing restricted" stance is explicitly transitional

## See

- `.planning/notes/meetings/2026-05-05-marketplace.md`
- `.claude/research/2026-05-06-zerobias-org-community-precedents.md`
- backlog #028 (publishing pipeline this credential gates)
- existing `zerobias-org/*` repo permissions model (whatever GitHub teams / org-level access controls exist today)
