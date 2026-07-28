# ZeroBias.ORG Community-Subsidiary Model — Precedents & Honeywell Footprint

**Date:** 2026-05-06
**Origin:** Brian's 2026-05-05 marketplace meeting introduced ZeroBias.COM (for-profit parent) + ZeroBias.ORG (subsidiary "community / standards body / guild"). This note researches comparable real-world structures and the Honeywell example Brian invoked specifically.
**Companion artifacts:** meeting notes `.planning/notes/meetings/2026-05-05-marketplace.md`; backlog 020-027.

---

## Part 1 — Real-world precedents for parent-for-profit + community-subsidiary structures

Brian's structure is **less common than its inverse** (non-profit-parent / for-profit-child, like Mozilla or OpenAI), but it exists in well-known shapes.

### Pattern 1 — For-profit creates a 501(c)(6) trade-association / standards subsidiary

The most direct fit for Brian's framing.

- **Visa + Mastercard → PCI Security Standards Council (2006).** Card brands carved out PCI DSS into an independent entity. Members are merchants, processors, QSAs. Council publishes standards, members must comply, card brands enforce contractually. Council ≠ card brands legally; payment infra ≠ standards governance.
- **HITRUST Alliance.** Developed by healthcare execs from Anthem, BCBS, etc. The Alliance is the entity that licenses the CSF framework, certifies assessors, runs membership programs. Customer orgs are *both* using the platform (assessments) *and* members of the Alliance community.
- **SAFECode (Software Assurance Forum for Excellence in Code).** Founded by Microsoft, Adobe, EMC, SAP, Symantec — corporate-only nonprofit consortium publishing software-security best practices. Members co-author whitepapers and meet in working groups.
- **EMVCo.** Owned by Visa, Mastercard, JCB, AmEx, Discover, UnionPay. Manages the EMV chip-card spec. Same shape: for-profit parents → standards entity → ecosystem participants are members.

### Pattern 2 — Inverse structure (non-profit parent / for-profit subsidiary)

Worth knowing because Brian may end up here for tax/governance reasons:

- **Mozilla Foundation (501c3) → Mozilla Corporation (for-profit subsidiary).** Foundation owns Corp. Corp earns revenue (Firefox search deals); Foundation owns the mission. Members participate via MoCo's products + MoFo's advocacy.
- **OpenAI Foundation (non-profit) → OpenAI LLC (capped-profit).** Same inverse shape, more recent and messier.
- **Apache Software Foundation.** 501c3 hosting many projects; companies sponsor; project-specific PMCs govern.

### Pattern 3 — Linux Foundation as host of community/standards subsidiaries

Probably the most relevant *operational pattern* for what .ORG would actually do day-to-day:

- **Linux Foundation hosts CNCF, OpenSSF, OCI, Hyperledger, OpenJS, FINOS, JDF, Academy Software Foundation, etc.** Each hosted project is a separately-governed sub-entity with its own membership tiers (Platinum/Gold/Silver), TOC (Technical Oversight Committee), working groups, and budgets. Companies pay tiered membership fees → get governance seats + ecosystem visibility.
- **OpenSSF specifically** is the most directly compliance/security-relevant: the SLSA framework, sigstore, supply-chain best-practice working groups, Alpha-Omega project funding. This is essentially "ZeroBias.ORG for software supply chain."

### Pattern 4 — Compliance/cyber-specific community models (most relevant to SME Mart)

These are the closest analogs given sme-mart's domain:

- **CIS (Center for Internet Security).** 501c3, develops CIS Controls + CIS Benchmarks. Has SecureSuite paid memberships; runs MS-ISAC + EI-ISAC for govt orgs. Members benchmark each other anonymously. **Almost exactly the shape Brian seems to want.**
- **OWASP Foundation.** 501c3, individual + corporate members, hundreds of contributor-driven projects, local chapters worldwide.
- **CSA (Cloud Security Alliance).** Hybrid: nonprofit standards body + commercial training arm (CCSK, CCSP certifications). Member companies co-author research.
- **ISACA.** Professional association. Certifications (CISA, CISM, CGEIT). Local chapters. Annual conferences. Member-driven publications.
- **(ISC)² / ISC2.** Professional credentialing body for CISSP/CCSP/etc. Member-driven CPE economy.
- **FS-ISAC** (Financial Services Information Sharing and Analysis Center). Members are financial institutions; share threat intel and best practices. ISACs in general (H-ISAC for healthcare, EI-ISAC for elections, etc.) are a mature template.

---

## Part 2 — What .ORG members would actually do (outside SME Mart compliance engagements)

Activities that happen in mature parent + community-subsidiary structures, organized by category. Each is an opportunity for a UI surface, feature, or data flow that has nothing to do with the marketplace's compliance-engagement model.

### Knowledge production (member → member, member → public)

- **Working groups / SIGs.** Topic-focused groups co-developing artifacts: AI governance, supply chain, third-party risk, data minimization, etc.
- **Whitepapers / position papers.** Co-authored by members, published under the .ORG brand.
- **Best-practice playbooks / runbooks.** Member-contributed, peer-reviewed.
- **Compliance framework crosswalks.** Community-maintained mappings (SOC2 ↔ ISO27001 ↔ HIPAA ↔ PCI ↔ NIST CSF). Huge effort, perfect community-owned artifact.
- **Standards / specs.** .ORG publishes a standard; members contribute via consensus process; vendors implement.
- **Annual industry reports.** "State of compliance" benchmarks, member-survey driven.

### Peer benchmarking & shared intel

- **Anonymized peer benchmarks.** "X% of your-size SaaS companies have completed a Type 2 SOC2 in the last 12mo." Powerful retention hook; SME Mart already has the data shape to compute these.
- **Threat intelligence sharing.** ISAC-style — members share IOCs, attack patterns, post-incident retrospectives behind a NDA wall. Dispersed by maturity tier.
- **Vendor evaluations / due-diligence sharing.** Members pool the work of vetting common vendors. "We DDQ'd Acme already, here are our findings."
- **Incident retros.** Members publish (or privately share) post-mortems for community learning.

### Professional development

- **Certifications / credentials.** .ORG-issued professional credentials (e.g., "ZeroBias.ORG Certified Compliance Architect"). Adjacent to Credly integration (per backlog 027).
- **CPE / continuing education credits.** Members earn credits through participation; feeds back into ISACA/ISC² requirements.
- **Mentorship pairings.** Senior members mentor junior; structured matchmaking surface.
- **Apprenticeship / job-training pipelines.** Inflowing talent for the industry. Adjacent to talent-marketplace future scope.
- **Career boards / job listings.** Community-internal hiring; tagged by member-org.

### Governance & community participation

- **Board elections.** Member companies vote for governance seats; observers see proceedings.
- **Working-group leadership selection.** Active members elect chairs.
- **Public commenting on regulatory matters.** Member-coordinated comments on NIST drafts, EU AI Act, SEC cyber rules. Position papers under the .ORG brand carry more weight than any single company's.
- **Awards / recognition.** Annual member awards.

### Events & networking

- **Annual summit / conference.** Largest annual revenue/branding event for most foundations.
- **Regional meetups / local chapters.** Member-organized, .ORG-coordinated.
- **Webinars / office hours.** Topic-focused recurring sessions.
- **Member directory / matchmaking.** "Find me a member who's done a HITRUST cert in the last 6 months." Pure networking surface.

### Advocacy & public posture

- **Joint statements on policy.** Members co-sign positions.
- **Press / media presence.** .ORG speaks for the community on industry topics; .COM stays neutral as the platform.
- **Liaison roles.** Member representatives sit on external standards bodies (ISO TC, NIST workshops) representing .ORG.

### Member-only digital surfaces

- **Member directory.** Searchable, with maturity badges and credentials.
- **Discussion channels.** Slack/Discord/Discourse; tier-gated.
- **Document library.** Whitepapers, playbooks, standards drafts, with version control.
- **Voting / polling tools.** Governance + position-paper drafting.

### Top two patterns most likely to land first in SME Mart

1. **Anonymized peer benchmarks.** SME Mart already has tagged data on every customer's profile / vetting / engagement state. A .ORG-branded benchmark surface (member sees their org's stats vs anonymized peer cohort) is a high-trust retention hook with low marginal feature cost — the data exists, it's just a different read view + an opt-in flag.
2. **Compliance framework crosswalks (community-maintained).** Already a known pain point — every compliance team builds its own SOC2↔ISO27001 mapping. A .ORG-owned, member-edited canonical crosswalk would be a **defensible community moat**: the more members contribute, the more accurate it gets, the more new members must join to access it. Network-effect material.

---

## Part 3 — Honeywell footprint (Brian's invoked example)

**Important framing:** When Brian invoked Honeywell in the 2026-05-05 meeting, he was using it as an **entity-hierarchy** example, not a community-model example:

> "Honeywell, as an example, in Neverfail, they resell our product globally, but the Honeywell parent really is just more of a facilitation engine. And then all kinds of subsidiary entities are what actually does business with us directly through a single global MSA at the parent, but dollar transactions exist at the children." — Brian, 2026-05-05

That's a model for **backlog 023** (parent/child hierarchy with separate EIN/MSA/transactions), NOT directly for the .ORG community concept. So Honeywell is **partial** model material — strong fit for entity structure, weaker fit for community structure.

### Current Honeywell footprint (mid-2026, mid-restructure)

Honeywell is breaking itself into **three independent public companies**:

1. **Honeywell core** (remains as Honeywell International / NYSE: HON) — anchored in automation. Vimal Kapur stays Chairman + CEO.
2. **Honeywell Aerospace** — spinning off second half of 2026, ~$15B annual revenue, will be one of the largest pure-play aerospace suppliers. Jim Currier as CEO.
3. **Solstice Advanced Materials (NASDAQ: SOLS)** — already spun off Oct 30, 2025. Sustainability-focused specialty chemicals + advanced materials.

Earlier major spin-offs (worth knowing for entity-hierarchy modeling):
- **Resideo Technologies** (2018) — consumer products / smart home
- **Garrett Motion** (2018) — turbocharger business

### Honeywell core — segment structure as of Q1 2026

Four reporting segments, each with its own president/CEO reporting to Kapur:

| Segment | CEO |
|---|---|
| Aerospace Technologies (until spin) | Jim Currier |
| Building Automation | Billal Hammoud |
| Industrial Automation | Peter Lau |
| Process Automation | Jim Masso |
| Process Technology | Ken West |

Post-Aerospace-spin (late 2026), Honeywell core collapses to **three** segments: Building Automation, Industrial Automation, Process Automation and Technology.

Clean illustration of Brian's point: a single legal parent (Honeywell International) with multiple business units that each have an independent leadership / P&L / customer base, but a unified MSA-at-the-parent posture for global resellers.

### Subsidiaries — by region and function

Honeywell operates in 70+ countries; many country-level subs are publicly traded on local exchanges:

- **Honeywell Automation India Limited (HAIL)** — separate listed entity in India
- Country/regional entities across Europe, APAC, LATAM
- **Honeywell Federal Manufacturing & Technologies (FM&T)** — operates the Kansas City National Security Campus for the US Dept of Energy / NNSA. Defense/national-security work; very different security posture than commercial side
- **Quantinuum** — quantum computing JV (Honeywell Quantum Solutions + Cambridge Quantum, merged 2021); Honeywell holds majority stake but it's a separate operating company

A textbook example of Brian's "global MSA at parent, transactions at children" frame: a multinational customer signs a single MSA at Honeywell International and then has dozens-to-hundreds of subsidiary entities transacting against that MSA on the platform.

### Closest thing Honeywell has to a "community" — Honeywell Users Group (HUG)

**NOT a separate legal entity.** HUG is a Honeywell-owned conference + steering-committee program.

What HUG actually does:
- Annual conference per region (Americas, EMEA): ~1,400 attendees (675 customers + 200+ channel partners) over 4 days, 150+ sessions
- User-driven steering committees — customers help set the agenda
- Tracks: end-user breakout presentations, technology solution presentations, workshops + training, roundtable discussions
- Strong channel partner integration — the 200+ partners are first-class participants alongside customers

Useful as an operational pattern for what .ORG community programming might look like (annual summit, user-driven agenda, channel-partner inclusion) — not useful as a legal-structure model.

### Is Honeywell a model company for ZeroBias.ORG?

| Question | Honeywell as model? |
|---|---|
| Parent/child entity hierarchy (backlog 023) | ✅ **Strong fit** — Brian explicitly cited it for this |
| Standards-body / community-as-separate-legal-entity (backlog 020) | ❌ **No fit** — they don't do this |
| Community-engagement programming (events, working groups) | 🟡 **Partial fit** — HUG is the operational model but lives inside the corp |
| Channel-partner / referral-only onboarding (backlog 025) | ✅ **Strong fit** — HUG's 200+ channel partners + Honeywell's resale-via-channel posture matches Brian's "no enterprise direct, everybody comes through a channel partner" framing |

Honeywell is a **multi-pattern reference**: clearly the model for entity hierarchy, plausibly the model for channel-partner sales motion, and a reasonable operational template for community programming — but **not** the model for .ORG-as-separate-legal-entity. For that piece, the precedents in Part 1 (CIS, OWASP, Linux Foundation hosted projects, HITRUST) are still better fits.

**Recommendation:** ask Brian to clarify which pattern Honeywell was meant to anchor — entity hierarchy, channel-partner motion, community programming, or all three.

---

---

## Part 4 — Brian's 2026-05-06 Slack clarification (the actual operational definition)

Clark sent Brian a follow-up Slack message asking for concrete use cases + Honeywell clarification. Brian's reply substantially **upgrades** the .ORG model from "vague community" to a concrete operational pattern. Captured verbatim below + synthesized.

### Brian's reply (verbatim, abbreviated where redundant)

**On Honeywell:**

> "Honeywell is example of big companies that has corp parent and 20 different entities in different countries. So we deal with corp parents (parent entity engagement) sometimes at MSA level but then have separate entity children companies that pay bills to us so they have their own children entity engagements / projects."

**On the .ORG community (which Brian calls "the Guild"):**

> "For the 'ZeroBias foundation'. ZB org on platform.
>
> All connectors (Catalin), all standards, crosswalks etc and all community queries, alerts, are built by customers, but are built by them using the zb.org (guild) repo and published into the platform catalog of products / connectors / vendors / suites / products. All this context / artifacts will be done via the zerobias Guild."

> "Catalin is enabling the guild to do this, same with Daniel. They did it for now. But all things they are building now are published in Zb-org (guild repo). This is the GUILD - community.
>
> For now. Nothing our customers build (connectors / crosswalks) is restricted from being private. It is required to be built via their Guild member credentials in the zerobias Guild Org that is in place.
>
> Geekery needs to ask to be invited to the Zb org org on platform so you can become a member and use org switcher. And then if you were going to build a connector for something you need as Geekery, you have to use your guild member status to build it in the Zb org org and then publish it through a publishing process to be pulled into the Zb org catalog and then the global platform catalog."

**On onboarding:**

> "This will need to become part of normal onboarding with any new customer. It will be engagement for ZB core with default Proj 1. And a separate but required engagement will also be with guild (Zb-org) and set them up as member of Guild (Zb-org) and browse projects that guild -Zb org has in place.
>
> So they need to see as member of guild. They need to be able to browse projects and join each project they want to participate. There will be some very public projects they can jump into. And some they need to request access to.
>
> This is quite important data to capture."

### Synthesis — the actual model

**".ORG" = "the Guild" = a publishing pipeline** for community-built platform artifacts. Customers build connectors / standards / crosswalks / queries / alerts in the Guild repo using Guild member credentials, then go through a publishing process that lands them in the **ZB.Org catalog**, which feeds the **global platform catalog**.

The Guild infrastructure already exists — informally. Today, **Daniel Rojas** (owns the existing `zerobias-org/*` content repos) and **Catalin** (platform/MCP infra; previously involved in connector and hosted-MCP work per CEO_NOTES + March meetings) operate the pipeline by hand. Going forward, every customer who joins the Guild via the auto-created onboarding engagement gets the same access pattern those two have today.

**The flow:**

```
Customer onboards
   |
   +-- Engagement #1: ZB Core (default Project 1)  -- existing behavior
   +-- Engagement #2: Guild / ZB.Org (REQUIRED, new)
            |
            +-- Customer's user(s) become Guild members (#021)
            +-- Member can BROWSE Guild projects (#029)
                  +-- Public projects: jump in
                  +-- Access-controlled projects: request access
            +-- Member credential authorizes contribution to Guild repo (#030)
            +-- Authored artifact -> publishing process -> Guild catalog -> platform catalog (#028)
```

### Why this changes the precedent picture

The earlier read (Part 1) was correct that compliance/standards bodies (CIS, OWASP, HITRUST) are good *governance* analogs. But Brian's reply makes clear the **load-bearing operational pattern** is the **graduated-project + canonical-catalog** mechanic, not the standards-body trade-association mechanic.

Updated closest precedents (operational, not just structural):

| Pattern | Why it fits the Guild |
|---|---|
| **CNCF / Apache Software Foundation graduated-project pipeline** | Sandbox → Incubating → Graduated stages; community contributes; foundation curates canonical catalog. Direct match for build → review → publish mechanic. |
| **HashiCorp Terraform Registry** | Community-contributed providers/modules → opinionated curation → public registry. Closest single-vendor analog (Terraform = the platform; Registry = .ORG catalog). |
| **Salesforce AppExchange / Snowflake Powered-By Snowflake** | Partner-built apps published into shared catalog. Closest commercial analog. |
| **MITRE ATT&CK community contributions** | Domain-specific (security): community submits techniques, MITRE curates canonical taxonomy. Closest compliance-domain analog. |

CIS, OWASP, HITRUST etc. are still relevant for the **community-engagement side** (events, working groups, certifications, advocacy — all the activities in Part 2), but they're *not* the load-bearing pattern. The load-bearing pattern is the contributor pipeline.

### Backlog mapping (post-2026-05-06)

What got confirmed verbatim by Brian's reply:

- **#020** default engagement on onboarding — "engagement for ZB core with default Proj 1. And a separate but required engagement will also be with guild" → confirmed; promoted to `critical`
- **#021** `member` user-role — "set them up as member of Guild" → confirmed; rebranded to "Guild member" + extended to cover publishing-credential semantics
- **#022** Geekery → ZB.Org provisioning — "Geekery needs to ask to be invited... become a member and use org switcher" → confirmed verbatim
- **#023** parent/child entity hierarchy — Honeywell answer confirms it's the canonical example for backlog 023 (not for the Guild model)

What's NEW from Brian's reply:

- **#028** Guild publishing pipeline — connectors/crosswalks/standards/queries/alerts → Guild repo → publishing process → ZB.Org catalog → global platform catalog
- **#029** Guild project browse / discovery / join UX — public-jump-in vs. access-requested projects
- **#030** Guild member credentials + artifact privacy model

What's still parked:

- **#025** channel-partner / referral-only onboarding (Brian deferred)
- **#026** parent/child billing rules (Brian deferred)
- **#027** personnel identity assurance (Brian's "risk marketplace" framing — separate thread)

### Honeywell — refined read after Brian's clarification

Brian explicitly used Honeywell **only** as an entity-hierarchy example. He did NOT use it as a community/Guild model. Honeywell remains a valid model for:

- **#023** parent/child entity hierarchy ✅ confirmed canonical
- **#025** channel-partner sales motion 🟡 plausible (their HUG event integrates 200+ channel partners; their resale-via-channel posture matches Brian's "no enterprise direct" framing — but Brian didn't tie it to channel partners explicitly)

Honeywell is **not** a model for:

- **#020 / #028 / #029 / #030** — the Guild model. Different operational pattern entirely.

---

## Sources

- [Honeywell Announces Updated Business Segment Structure Ahead of Aerospace Spin-Off](https://www.honeywell.com/us/en/press/2025/10/honeywell-announces-updated-business-segment-structure-ahead-of-aerospace-spin-off)
- [Honeywell Completes Spin-Off of Solstice Advanced Materials](https://www.honeywell.com/us/en/press/2025/10/honeywell-completes-spin-off-of-solstice-advanced-materials)
- [Honeywell aerospace spin-off on track for second half of 2026](https://www.investing.com/news/company-news/honeywell-aerospace-spinoff-on-track-for-second-half-of-2026-93CH-4302829)
- [About Our Spin-Offs | Honeywell International Inc.](https://investor.honeywell.com/investor-resources/about-our-spin-offs)
- [Honeywell Users Group 2025 (Americas)](https://process.honeywell.com/us/en/about-us/honeywell-users-group)
- [Honeywell Users Group EMEA 2025 brochure](https://automation.honeywell.com/content/dam/automation/en/about-us/hug/documents/hon-ia-hps-hug-emea-2025-brochure.pdf)
- [About HUG (Honeywell PMT)](https://pmt.honeywell.com/us/en/about-pmt/honeywell-users-group/about-us)
- [Honeywell User Group (Honeywell Process)](https://process.honeywell.com/us/en/initiative/honeywell-user-group/honeywell-user-group)
