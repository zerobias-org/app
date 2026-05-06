---
id: "029"
priority: high
scope: sme-mart (UI) + platform (Guild project model)
effort: medium
found: 2026-05-06
status: open
promoted_to: null
---

# Guild project browse / discovery / join UX

## Brian's framing (2026-05-06 Slack)

> "So they need to see as member of guild. They need to be able to browse projects and join each project they want to participate. There will be some very public projects they can jump into. And some they need to request access to."

## What this is

Once a customer joins the Guild as a `member` (#021) via the Guild engagement (#020), they need a UI surface to:

1. **Browse Guild projects** — projects the Guild itself runs (working groups, standards initiatives, connector dev, crosswalk maintenance, community queries / alerts authoring, etc.)
2. **Filter by visibility / access level**:
   - **Public projects** — member can jump in directly, no approval
   - **Access-controlled projects** — member must request access and be approved
3. **Join / request join** — explicit action with approval flow for restricted projects
4. **See "my Guild projects"** — what they're already in
5. **Leave / unsubscribe** from a project

This is **distinct from the SME Mart project surface** (which is about engagement-scoped marketplace projects between buyers and providers). Guild projects are community-internal — collaborative artifact-building efforts.

## Project model nuances to resolve

- Are Guild projects modeled with the same Project entity as engagement-scoped projects, just with `provider_id = ZB.Org` and a different visibility flag? Or a distinct entity type?
- How does access-request work — is there an existing platform invitation/approval flow we can reuse, or new infra?
- What roles exist within a Guild project (lead / contributor / observer)? Tied to the Guild member classification (#021) or layered on top?
- How does this connect to the publishing pipeline (#028) — is the publishing flow scoped to a specific Guild project, or org-wide?

## Why now

This is the customer's *first interaction* with the Guild after onboarding (#020). Without this surface, joining the Guild is invisible to the user — they get a default engagement they can't see into. UI-side high priority.

## Blocked by

- #020 (engagement structure that makes Guild membership real)
- #021 (member role classification)
- Project model decision — needs Brian + Kevin alignment on whether Guild projects share the engagement-Project entity or are distinct

## See

- `.planning/notes/meetings/2026-05-05-marketplace.md`
- `.claude/research/2026-05-06-zerobias-org-community-precedents.md`
- existing SME Mart project board (`pages/engagements/`) — likely template for the UI pattern, repurposed for community projects
