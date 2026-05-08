# Cross-Domain Governance (Sempf) — Mapping to SME Mart / ZeroBias Architecture

**Date:** 2026-05-07
**Source article:** Aaron Sempf, "Cross-Domain Governance," *Architecting Autonomy* (Substack), 2026-05-07
**URL:** https://architectingautonomy.substack.com/p/cross-domain-governance
**Local PDF:** `~/Downloads/Cross-Domain Governance - by Aaron Sempf.pdf`
**Trigger:** Brian flagged the article on Slack 2026-05-07 — *"THIS IS LITERALLY TRANSPARENCY ENTANGLED TASKS between parties... TRANSPARENCY MULTI PROTOCOL GATEWAY."*
**Relates to:**
- `.planning/notes/CEO_NOTES.md` (2026-02-06, 2026-02-25, 2026-03-16, 2026-03-19 entries)
- `.planning/notes/transparency-center-multi-party-clarification.md`
- `.planning/notes/entangled-task-pairs-model-evaluation.md` (Option B selected)
- Backlog #071 (Entangled Task Pairs), #078 (Transparency Controls UI Spec)
- `.claude/handoffs/transparency-center-entangled-tasks-2026-04-21.html`

---

## Headline

The Sempf article is a **formal restatement of the architecture Brian has been designing for SME Mart / ZeroBias since February 2026**, expressed in the vocabulary of constitutional governance theory (Kelsen's hierarchy of norms, Bell-LaPadula, Macaroons, Miller's capability monotonicity, Istio multi-mesh federation, NIST Zero Trust).

This is **convergent design, not leakage**. The federation problem — *two sovereign organisations must interact at a seam where neither's authority graph applies* — is structural. Anyone designing for regulated multi-org commerce arrives at the same solution surface.

For SME Mart, the article is a high-credibility external validation of the entangled-task-pairs / transparency-center architecture. Useful as a citation when explaining the model to Kevin, Nic, Dan, Joe, or external assessors.

---

## Side-by-side mapping

| Sempf article (Cross-Domain Governance) | Brian's directive / SME Mart construct |
|---|---|
| Domain A (sovereign) <-> Domain B (sovereign) at federation seam | Demand party + Supply party at engagement boundary |
| Three-tier hierarchy: Global / Domain / Pairwise contract | Brian's "3 partitions at every level" (Engagement -> Project -> Plan -> Task -> SubTask) |
| Pairwise contract — "evaluated by both control-surface bands" (page 11 diagram) | Transparency partition — the shared middle, both parties publish into it |
| Conjunction default — "both must permit for interaction to proceed" | Task approval gates boundary API; demand approves, supply publishes evidence (CEO notes 2026-03-19) |
| Monotonic reduction at boundaries — "crossing can only restrict, never amplify" | Zero-default visibility: internal data invisible unless explicitly submitted (multi-party clarification) |
| Legibility without shared state — "what crosses the boundary is the finding, not the state" | **Exactly the Option B decision** in entangled-task-pairs: the LINK is the transparency record; private tasks stay sovereign on each board |
| Governance findings — attributable, tamper-evident records | Cryptographic hash on link events (entangled-pairs note, design point #1) |
| Composition primitives: conjunction / disjunction / delegation / precedence | Demand/supply approval semantics + escalation paths in Plans 057/069/071 |
| Cross-domain legibility = shared structure, not shared state (standardised finding format) | Auto-rendered Transparency View reading both linked tasks (entangled-pairs note line 132) |
| Authority graph (per domain) | Per-org RACI + boundary membership |
| Control-surface band (per domain) | Per-org task approval workflow |
| Federation seam | The transparency intersection between two/N parties on an engagement |
| "Federation is earned through constitutional participation, not assumed from proximity" | Brian's zero-default visibility: nothing crosses unless explicitly submitted |
| "Separation is the default state. Federation is the deliberate, contracted exception." | Boundary Manager app: resources NOT in the boundary are not visible (CEO notes 2026-02-25) |

---

## The page-11 block diagram

The diagram in the article *is* the SME Mart architecture, drawn at the platform layer:

- **Domain A** = Demand-side party (private board, sovereign authority graph)
- **Domain B** = Supply-side party (private board, sovereign authority graph)
- **Federation Seam** with **Pairwise Contract** evaluated by both bands = Transparency partition (shared middle, conjunction default = both must permit)
- **Authority Graph + Control-Surface Band** per domain = Each party's RACI/approval gate
- **Outbound Intent** -> **Conjunction (default)** -> **Inbound Intent** = Demand requirement task -> shared link -> Supply satisfaction task
- **Legibility Records** (governance findings: permit/deny + context, attributable, tamper-evident) = Brian's "explicit submission/published evidence with cryptographic hash"
- **State & Execution remains sovereign within each domain** = Private notes, prep work, evaluation criteria stay on the originating board

In other words: REQ <-> SAT entangled pair, drawn at platform-architecture grain.

---

## What the article adds that we do not yet have explicit

### 1. Tier-1 Global Constitution (platform-wide invariants)

We have per-engagement transparency rules but no named **platform-wide invariants** that all engagements inherit. Sempf names a starter set:

- "No irreversible action without an audit trail"
- "No scope expansion under unconfirmed state"

For ZeroBias, that's the platform-level minimums every engagement inherits regardless of party-specific rules. Worth a backlog item to make this explicit. Candidate Tier-1 invariants for ZeroBias:

- No data egress from a boundary without an approved task
- No task transitions to `completed` without a signed legibility record
- No engagement contract amendment without consent from all current parties
- No retroactive edits to published transparency-partition artifacts (append-only)

### 2. Conjunction-default safety framing

We have assumed "both must permit" but never named the trade-off explicitly. Article frames it precisely:

> "Conjunction provides safety at the cost of liveness. A misconfigured domain blocks all interactions at its seams. This is a design choice, not a defect."

Useful language for explaining to a buyer/provider why their task is "stuck waiting" — it's the correct failure mode at a sovereignty boundary. The pairwise contract can opt into a different primitive (precedence, disjunction) where parties have agreed liveness > bilateral safety.

### 3. Federation evolution (governance-of-governance)

Article 14 in Sempf's series (next post) addresses how pairwise contracts and constitutional layers evolve over time without undermining the stability they were built to provide. Maps to our implicit "engagement contract amendments" question. Future backlog item — the model needs a mechanism for:

- Bounded amendment of engagement-level pairwise contracts (both parties consent)
- Versioning of transparency rules (which version applied at the time of a given finding?)
- Onboarding/offboarding parties to multi-party engagements without invalidating in-flight tasks

### 4. Vocabulary upgrade

Better terms for spec/handoff conversations with Kevin, Nic, and external assessors:

| Our current term | Sempf term | When to use which |
|---|---|---|
| Transparency partition | Pairwise contract layer | "Pairwise contract" when talking to platform/security people; "transparency partition" with users |
| Entangled task pair | Bilateral conjunction at federation seam | Use Sempf when justifying the architecture; use ours when describing the UX |
| Published evidence | Legibility record | "Legibility record" when emphasising attributability + tamper-evidence |
| Hash on link event | Governance finding | Same |
| Zero-default visibility | Monotonic reduction at boundaries | Sempf form for security/compliance audiences |
| 3 partitions per entity | Three-tier governance hierarchy | Sempf form when explaining to architecture-literate audiences |
| Boundary Manager | Control-surface band | Sempf form when describing runtime evaluation, not data model |

---

## What the article does *not* change

The Option B decision (entangled-task-pairs note, 2026-03-24) — two linked tasks + a rendered transparency view, no third artifact — is **exactly what Sempf prescribes**: "legibility without shared state... what crosses the boundary is the finding, not the state."

The multi-party clarification (transparency-center-multi-party-clarification.md) — N parties, any role combination, zero default visibility — is the same model just generalised: N control-surface bands instead of 2, with up to N(N-1)/2 pairwise contracts at the active seams. The model holds; no re-architecture needed.

The hierarchical partitioning (Engagement -> Project -> Plan -> Task -> SubTask, each with Demand|Transparency|Supply) is consistent with Sempf's nested constitutions: a project-level pairwise contract inherits invariants from the engagement-level contract, which inherits from the platform-level (Tier-1) global constitution. Validity flows downward, constraints flow upward.

---

## Where this could be cited

| Audience | Citation purpose |
|---|---|
| Kevin (platform) | Justify why pairwise contract / link-as-record needs first-class platform support, not just app-level convention. Reframes "entangled task pairs" as a known federation pattern. |
| Nic (GQL) | Justify standardised finding format across services — "shared structure, not shared state" — as the protocol for cross-service legibility. |
| Dan (Readiness Center) | Confirm the same model applies to auditor/auditee flows. Same Tier 1/2/3 hierarchy; auditor is just a third party at the seam. |
| Joe (Work Worlds) | Same architecture for any cross-org agentic interaction on the platform. |
| External assessors / customers | Show the architecture is grounded in established theory (Kelsen, Bell-LaPadula, Macaroons, NIST ZTA, Istio multi-mesh) — not bespoke. |
| Future investors / partnerships | The article reads like a spec for what we are already shipping. High-credibility external validation. |

---

## Recommended follow-ups

1. **Backlog item — Tier-1 platform invariants.** Make explicit the ZeroBias-platform-wide rules every engagement inherits (no scope expansion under unconfirmed state, no irreversible action without audit trail, append-only transparency artifacts, etc.). Candidate name: `PLATFORM-INVARIANTS-1`.
2. **Backlog item — engagement contract amendment governance.** Once the Sempf "Layered Boundary Evolution" post drops (next in series), use it to spec how engagement pairwise contracts get amended over time. Candidate name: `ENGAGEMENT-AMEND-1`.
3. **Outreach — partnership ping.** Brian could respond to Aaron Sempf saying *"we are building this in production for regulated marketplace commerce — here is the implementation."* Converts a theory blog into a validation/partnership channel. Low cost, asymmetric upside.
4. **Spec language pass.** When updating Plan 057 / Plan 069 / Plan 071 specs for engineering audiences, use Sempf terminology in parallel with our own ("transparency partition (pairwise contract)") so platform conversations have shared vocabulary with the broader autonomous-systems community.

---

*Captured 2026-05-07 from full read of the Sempf article + cross-reference against CEO notes, transparency-center-multi-party-clarification.md, and entangled-task-pairs-model-evaluation.md.*

---

## ADDENDUM 2026-05-07 (Brian, Slack 10:13 / 10:18 AM) — ZB IS THE SCHEMA OF RECORD

Brian read the initial mapping and pushed back on bulk vocabulary adoption. Direct quotes:

> "REQUIREMENT is the 'contract'. We need to use REQUIREMENTS. Entangled task pairs **are** demand and supply REQUIREMENT contracts. Are they or are they not satisfied — and that test/measurement is ASSESSMENT and the rules-checks. What are lower-level requirements and their checks (assessment of those rules), which are just lower-level REQUIREMENTS — which is a 'contract' agreement between entangled tasks that they will or will not be met. Requirements is the formal 'demand side specific of a task contract (1/2) and the supply acceptance entangled task is the acknowledging portion of the contract (2/2). The Transparency gateway (multi-protocol) is the acceptance/denial vehicle as well. The memory system is the RECORD, full hash too, of the end-to-end supply-side and demand-side data/script/anything and all of what is exchanged."

> "Bottom line. I like most of our verbiage more. I think we adopt 'contract' into the definition as above and let's look at how if zerobias was the schema of record how do we map his word choice to ours in each layer but make sure we put 'contract' and requirements into our schema first."

### Brian's framing (one sentence)

**Requirement IS the contract.** The entangled task pair *is* the contract instance. Lower-level requirements are rules/checks that roll up. Assessment is the measurement of satisfaction. Memory/Record is the hash-anchored audit.

### What this changes in the mapping

ZB is canonical. Sempf demotes from peer to reference language. The mapping table rewrites such that **ZB names appear in the canonical column, Sempf names appear as references that map *to* our schema.** Almost nothing gets renamed. Three new schema entities carry the model.

### Schema entities to formalize FIRST (before any mapping work)

| Entity | Definition | Status |
|---|---|---|
| **Requirement** | A contract between two parties (demand and supply) over what is required and how it will be satisfied. Has a demand-half task (1/2), a supply-half / acceptance task (2/2), and N child Requirements (rules/checks). Recursive. | NEW &mdash; add to sme-mart YAML schema. |
| **Assessment** | Measurement of whether a Requirement is satisfied. Carries the rule/check definition, the result (pass/fail/inconclusive), and references to evidence. Multiple Assessments may roll up into one Requirement's status. | NEW &mdash; add to sme-mart YAML schema. Brian's addition; Sempf has no explicit assessment layer. |
| **Record** | Append-only, hash-chained memory of every exchange touching a Requirement (created, accepted, evidence added, assessed, disputed, verified, waived). End-to-end data, scripts, payloads. | NEW &mdash; add to sme-mart YAML schema. Replaces "legibility record" terminology. |

### Sketch — Requirement schema

```yaml
Requirement:
  description: |
    A contract between two parties (demand and supply) over what is required
    and how it will be satisfied. Demand-half (1/2) + supply-half (2/2) form
    the full contract instance. Lower-level requirements (rules/checks) nest
    recursively under their parent.
  fields:
    - id
    - title
    - terms                       # the contract specification
    - demand_task_id              # REQ task — formal demand-side specification (1/2)
    - supply_task_id              # SAT task — supply-side acknowledgment / acceptance (2/2)
    - parent_requirement_id       # for nested rules/checks
    - acceptance_primitive: enum [conjunction, precedence, disjunction]   # default: conjunction
    - status: enum [draft, open, accepted, disputed, satisfied, waived, denied]
    - assessment_ids: [Assessment.id]
    - record_ids: [Record.id]     # the hash-chained audit trail
```

### Net Sempf adoption (final)

| What gets adopted from Sempf | What does NOT get adopted |
|---|---|
| **`acceptance_primitive` enum values** &mdash; `conjunction` (default), `precedence`, `disjunction`. Terms of art worth keeping. | "Sovereign domain" (we have **Party**), "authority graph" (we have **RACI + members/admins**), "control-surface band" (we have **task approval workflow / Boundary Manager**), "outbound intent" (we have **REQ task / SAT task**), "federation seam" (we have **Engagement**), "legibility record" (we have **Record** &mdash; Brian's word, not Sempf's). |
| **One definitional addition**: the word *"contract"* goes into the description of `Requirement`. *A Requirement is a contract.* | Tier 1/2/3 numbering in user-facing docs. (May still appear in platform-level architecture conversations.) |
| **Three new entities driven by Brian's framing** (not Sempf's): `Requirement`, `Assessment`, `Record`. | Everything else. |

### Revised follow-ups

1. **NEW (was implicit) &mdash; backlog `SCHEMA-CONTRACT-1`**: formalize `Requirement`, `Assessment`, `Record` in the sme-mart YAML schema. Brian's explicit ask: *"put 'contract' and requirements into our schema first."* Highest priority of the new follow-ups.
2. Tier-1 platform invariants (`PLATFORM-INVARIANTS-1`) &mdash; deferred until #1 lands.
3. Engagement contract amendment governance (`ENGAGEMENT-AMEND-1`) &mdash; deferred until next Sempf article.
4. Sempf outreach &mdash; unchanged.
5. Spec language pass &mdash; superseded: ZB names lead, Sempf names appear only as parenthetical reference where audience benefits.

*Addendum captured 2026-05-07 from Brian's Slack pushback.*
