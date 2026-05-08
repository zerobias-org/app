---
id: "028"
priority: high
scope: platform (zerobias-org repos + catalog) + sme-mart (visibility/UX)
effort: large
found: 2026-05-06
status: open
promoted_to: null
---

# Guild publishing pipeline: customer-built artifacts → Guild repo → ZB.Org catalog → global platform catalog

## Brian's framing (2026-05-06 Slack)

> "All connectors (Catalin), all standards, crosswalks etc and all community queries, alerts, are built by customers, but are built by them using the zb.org (guild) repo and published into the platform catalog of products / connectors / vendors / suites / products. All this context / artifacts will be done via the zerobias Guild."

> "Catalin is enabling the guild to do this, same with Daniel. They did it for now. But all things they are building now are published in Zb-org (guild repo). This is the GUILD - community."

> "If you were going to build a connector for something you need as Geekery, you have to use your guild member status to build it in the Zb org org and then publish it through a publishing process to be pulled into the Zb org catalog and then the global platform catalog."

> "For now, nothing our customers build is restricted from being private."

## What this is

The Guild is **operationally a publishing pipeline**, not a vague community concept. The artifacts customers can build:

- **Connectors** (Hub modules — Catalin owns infra)
- **Standards / crosswalks** (compliance frameworks — Daniel Rojas owns content repos today)
- **Community queries**
- **Alerts**
- (likely also: vendor records, product records, schema packages — anything in the existing `zerobias-org/*` content repos)

The flow:
1. Customer joins Guild as `member` (#021).
2. Customer authors an artifact in the **Guild repo** (= `zerobias-org/*` GitHub org), authenticated via Guild member credentials.
3. Artifact passes through a **publishing process** (today's zbb gate is the existing precedent).
4. Artifact lands in the **ZB.Org catalog**.
5. From there, it's **pulled into the global platform catalog** (catalog of products / connectors / vendors / suites / products).

Today, only Catalin + Daniel use this pipeline (informally). Going forward, every customer who joins the Guild can.

## What needs to be built / formalized

This is a multi-stream effort, not a single deliverable. Likely sub-items as the work scopes out:

- **Guild member credential model** (#030) — what credential is presented to the publishing pipeline, how it's issued/revoked
- **Per-artifact-type publishing flows** — connectors vs. crosswalks vs. queries vs. alerts likely have different acceptance criteria, validators, and review gates
- **Customer-facing visibility** in the SME Mart UI: "your Guild contributions" surface, status of each artifact (draft / submitted / published / rejected), version history
- **Privacy model** for customer-built artifacts: Brian said "nothing our customers build is restricted from being private" today, but the eventual privacy semantics need design (private-to-customer / private-to-Guild / public-in-catalog tiers) — see #030
- **Catalog browse / filter UX** — how customers discover artifacts in the Guild catalog vs. global catalog (likely overlaps with existing platform Catalog app)
- **Approval / review pipeline** — Catalin/Daniel today do informal review; formalize for scale

## Closest real-world precedents

| Pattern | Why it fits |
|---|---|
| **CNCF / Apache Software Foundation graduated-project pipeline** | Sandbox → Incubating → Graduated stages; community contributes; foundation curates canonical catalog. Closest match for the build → review → publish mechanic. |
| **HashiCorp Terraform Registry** | Community-contributed providers/modules → opinionated curation → public registry. Closest single-vendor analog (Terraform = the platform; Registry = .ORG catalog). |
| **Salesforce AppExchange / Snowflake Powered-By Snowflake** | Partner-built apps published into shared catalog. Closest commercial analog. |
| **MITRE ATT&CK community contributions** | Domain-specific (security): community submits techniques, MITRE curates canonical taxonomy. Closest compliance-domain analog. |

## Why now

This is the **operational core** of what ZB.Org actually does. Onboarding (#020) creates the engagement that makes Guild membership real; this item makes Guild membership *useful* by connecting it to a concrete activity (build → publish → catalog).

## Blocked by

- #021 (Guild member role) — credential foundation
- #024 (cross-env audit of Guild org) — need to know which envs the pipeline runs on
- Catalin + Daniel input — they're the current operators; the formalized pipeline should reflect what already works
- Likely a phase-sized effort once promoted; spike first to scope

## See

- `.planning/notes/meetings/2026-05-05-marketplace.md`
- `.claude/research/2026-05-06-zerobias-org-community-precedents.md`
- DECISIONS.md "Marketplace tagType Is Preferred for New Tags" (existing convention for content tagged `marketplace`)
- existing `zerobias-org/*` content repos owned by Daniel Rojas
