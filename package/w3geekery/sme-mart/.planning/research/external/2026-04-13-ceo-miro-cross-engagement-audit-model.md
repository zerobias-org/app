# CEO Notes + Miro Board: Cross-Engagement Multi-3PAO Audit Model

**Source:** Brian Hierholzer CEO Notes (Slack DM, 2026-04-13 10:36–11:09 AM) + Miro board `uXjVGm64Grw`
**Researched:** 2026-04-13
**Relevance:** CRITICAL — reshapes multiple core plans (071, 078, 080, 064, 041) and introduces 3 new plans

---

## Summary

Brian has extended the two-party engagement model into a **multi-engagement, multi-3PAO cross-audit network** with:

1. **UI label change** — "Entangled Pairs" → "Entangled Tasks" / "Task Pairs"
2. **Cross-engagement project parties** — a project can have parties from multiple engagements
3. **Selective disclosure / blind parties** — Buyer controls identity visibility inside a shared Project
4. **Multi-3PAO scope-partitioned auditing** — N auditors each assigned different boundary portions, with publish-scope restricted to their partition

---

## The Scenario (Brian's Words, Structured)

### Home engagement + linked engagements (asymmetric)

This is NOT a symmetric many-to-many engagement-project link. It's:

```
Engagement 1 (Buyer ◀━━▶ Seller)  ─── HOME ENGAGEMENT ───▶ Project 1
                                                               ▲
Engagement 2 (Buyer ◀━━▶ Auditor)  ── LINKED ENGAGEMENT ───────┘
                [standing/persistent — "all the time"]
```

**Key directionality from Brian's notes: "Project 1 under Engagement 1" and Engagement 2 "pulls in" to make auditor a party.**

- **Project has ONE home engagement** (its creator). Home-engagement parties are "native" — full default rights.
- **Project can be linked by N other engagements** that contribute **derived parties** with Buyer-configured scope. Derived parties have narrower default rights than native parties.
- **Only the common party (Buyer)** can initiate linking a second engagement to a project. Sellers cannot unilaterally pull in their engagements without Buyer consent.

### Standing engagements (persistent, not per-project)

Brian: *"Auditor for a buyer as an example that is paid to audit seller all the time."*

Engagement 2 (Buyer/Auditor) is a **standing engagement** — persistent relationship on retainer, NOT created for Project 1. It pre-exists and is pulled in on demand. This has two consequences:

- **Consent flow:** Buyer selects from their portfolio of standing engagements when pulling an auditor into a project. The auditor doesn't sign a new contract per project — the standing engagement covers it.
- **Lifecycle revocation:** If Engagement 2 terminates, the auditor's derived party status on all linked projects auto-revokes.

### Seller consent + partial boundary scope

**Seller is NOT a party to Engagement 2**, but Seller **must allow** Auditor into Project 1. Brian: *"party to all boundaries in scope or 'some' boundaries"* — scope is Buyer-selected per pulled-in party.

This makes **partial boundary scope a first-class field** on the derived-party link:

```typescript
ProjectLinkedEngagement = {
  engagementId: UUID,
  pulledInByPartyId: UUID,    // must be home-engagement party (typically Buyer)
  scope: {
    boundaryIds: [UUID] | 'all',  // Buyer-selected subset per pulled-in party
    taskGrants: [...]              // further narrowed at task level (CE5)
  }
}
```

Project 1 transparency center now has **3 orgs from 2 engagements** (Buyer, Seller, Auditor).

### Selective disclosure inside Project 1

- **Buyer does NOT disclose identity** of the 3PAO (Auditor) to the Auditee (Seller).
- **Auditor and Auditee remain blind** to each other.
- The **auditing and data are accessible**, but identity is shielded.
- **Only the Buyer knows all parties.**
- Anonymity between auditor and seller is critical.

### Multi-3PAO at scale

- Buyer engages **20 different 3PAOs** to assess the same Seller (Project 1).
- Each 3PAO audits **different portions of the seller's boundary** across different domains:
  - Cyber
  - AI
  - Agent audit
  - Encryption auditing
  - (more TBD)
- Scope depends on each 3PAO's expertise/depth.
- Each 3PAO can **only publish results** to shared transparency based on **ONLY their pertinent tasks** within their scope of Project 1.

---

## Miro Board Observations (`uXjVGm64Grw`)

**Purpose:** Engagement transparency, authentication, boundary requirement tracking.

### Key structural signals

- **3x duplication of per-boundary artifacts** across the canvas:
  - Boundary Gov Identity criminal background
  - Boundary Financial
  - Boundary TBD Type
  - (License implied)
- **7 copies of "Auditee Engagement Board"** kanban UI prototypes — Brian is iterating on the 3PAO/Auditee UX
- **Boundary Requirement Tables** grouped as: Demand Twin, Supply Twin, Legal/Compliance, License, TBD, Financial
- **Engagement Transparency Center** master task table — 16 auth-focused tasks (MCP Access, Agent-to-agent auth, Social login, Magic Link, duplicate account prevention, progressive profile completion, biometric login)
- **Protocol Gateway Operations** tables — 8 test cases (TC-001 to TC-008) for Google auth functional/negative/boundary scenarios
- **21 AWS architecture diagrams** — multi-region VPC, Lambda, DynamoDB, SQS for "Boundary Gov Identity criminal background" — Kevin's platform infrastructure work

### Interpretation

The heavy 3x×Ncopies pattern directly models Brian's multi-3PAO × per-boundary × per-engagement scenario:

- Each column cluster = one 3PAO's view of a project
- Each row cluster = one boundary type scoped into the audit
- Each prototype copy = one party's UI perspective (Auditee vs. Auditor vs. Buyer)

The master Engagement Transparency Center table is **platform-level auth infrastructure** (not SME Mart UI directly) but SME Mart consumes it — social login, MCP access, progressive profile all land in the marketplace.

---

## Impact on Existing Plans

| Plan | Current State | Required Change |
|------|---------------|-----------------|
| **071** Transparency Entangled Task Pairs | Designed, implementation blocked on platform | **Rename to "Entangled Tasks" (or "Task Pairs")**. Terminology update in UI, docs, API fields. |
| **078** Transparency Controls UI Spec | Design-only, deferred | **Expand** to cover: per-party anonymity controls, Buyer-managed identity visibility, blind relationship rendering, scope-filtered publishing UI |
| **080** Project-Centric Boundary Model | Designed 2026-04-01 | **Expand** scope: a project can link to MULTIPLE engagements. Add `projectEngagementIds` (array) vs current single-engagement assumption. Party list in project = union across linked engagements. |
| **064** Project Members View | Deferred (platform dep) | **Update** to render multi-engagement origins per party. Each party row shows "from Engagement X". |
| **041** Supply-Side Vendor Profile | Designed 2026-03-30 | **Expand** `personnel` + new `capabilities` section — 3PAOs declare domains of expertise (cyber, AI, agent audit, encryption) + depth levels. Buyer filters/matches on capability during 3PAO selection. |
| **056** Engagement Roles & Communication | Backlog | **Supersedes** — the "third-party facilitator role (D7)" in 056 is actually the 3PAO/Auditor role Brian is now detailing at depth. |

---

## New Plans Required

### Plan CE1: Home + Linked Engagement Project Model
**What:** Asymmetric cross-engagement linkage. A project has one **home engagement** (creator) and zero or more **linked engagements** that contribute **derived parties** on a Buyer-selected boundary scope. Linked engagements are **standing relationships** pulled in on demand, not created per project.
**Why:** Brian's "Project 1 under Engagement 1 / Engagement 2 pulls in auditor" scenario is asymmetric — home vs linked — and cannot be expressed as peer many-to-many.

**Schema:**
```typescript
Project {
  homeEngagementId: UUID,           // single, required — the creator
  linkedEngagements: [               // zero or more pulled-in engagements
    {
      engagementId: UUID,
      pulledInByPartyId: UUID,       // must be home-engagement party
      pulledInAt: DateTime,
      scope: {
        boundaryIds: [UUID] | 'all', // Buyer-selected partial scope
        publishMode: 'private-only' | 'publish-to-shared'
      }
    }
  ]
}
```

**Key design questions:**
- Who can pull in a linked engagement? → Must be a party in both the home engagement AND the linking engagement (typically Buyer as common party)
- Can Seller veto? → No — Seller allows per engagement contract, specific scope is Buyer's choice
- What happens when a linked engagement terminates? → Derived parties auto-revoke from all projects where it's linked
- Can a linked engagement become the home engagement later? → No — home is immutable
- Migration: existing projects → `homeEngagementId` = current `engagementId`, `linkedEngagements: []`

**Scope estimate:** 15–20 hrs (schema + platform API + UI — pull-in dialog, linked-engagement list view)

### Plan CE2: Selective Disclosure / Party Anonymity
**What:** Buyer can shield the identity of one party from another inside a shared project/transparency center. Parties remain functionally connected (data flows, task assignments, transparency publishing) but names/logos/contact info are masked per visibility policy.
**Why:** 3PAO ↔ Auditee blind relationship is a stated requirement.
**Key design questions:**
- Who controls visibility? Buyer only, or delegated?
- What's masked: org name, logo, contact, principals, or all?
- What's visible: org role ("Auditor"), capabilities ("Cyber"), scope, outputs
- UI: pseudonymous labels ("3PAO-A", "Auditor #1") or role-only ("Your Auditor")
- Audit trail: does the masked identity show in logs? (Yes — buyer-side; No — auditee-side)
- Schema: `PartyVisibilityPolicy` per project-party pair

**Scope estimate:** 12–16 hrs (schema + service + UI)

### Plan CE3: Multi-3PAO Scope-Partitioned Audit
**What:** Multiple 3PAOs linked into same project via separate standing engagements, each with **Buyer-selected partial boundary scope** and specialty-aligned task subset. Each 3PAO's publishing is filtered to their scope — they can only contribute to transparency for their assigned boundary+task partition.
**Why:** Brian's 20-3PAO scenario with cyber/AI/encryption/agent-audit partitioning. Partial boundary scope ("all boundaries in scope or 'some' boundaries") is a first-class Buyer-controlled field.

**Depends on:** CE1 (linked-engagement model) + CE5 (task-level grants)

**Partition model (Buyer-configured per linked engagement):**
```typescript
LinkedEngagementScope {
  boundaryIds: [UUID] | 'all',       // subset or all — Buyer's choice
  domainTags: [string],              // specialty alignment (AI, IAM, cyber, encryption)
  taskTypeFilter?: [UUID],           // further narrow by task type
  taskGrants?: [TaskGrant]           // from CE5 — sub-task granularity
}
```

**Key design questions:**
- Can two 3PAOs share overlapping scope? → Yes (second opinion / redundant audit). Conflict arbitration TBD per Brian.
- Publishing enforcement: API rejects publish attempts outside scope (not just UI).
- Reporting: Buyer sees aggregate across all 3PAOs; each 3PAO sees only their partition.
- 3PAO specialty ↔ boundary match: is Buyer blocked from assigning an IAM-specialty 3PAO to a Financial boundary? → Probably warn, not block (expertise vs scope is distinct).
- How does an auditor discover their assigned scope? Project dashboard shows scope badge + filtered boundary list.

**Scope estimate:** 20–28 hrs (schema + scope enforcement service + UI)

---

## Resolved by Brian (2026-04-14 Marketplace Meeting)

Meeting summary: [`.claude/notes/meetings/2026-04-14-marketplace.md`](../../../.claude/notes/meetings/2026-04-14-marketplace.md)

1. **Engagement ↔ Project cardinality** — **Asymmetric, not many-to-many.** Primary engagement = buyer↔seller (the commerce). Linked/secondary engagements = buyer↔auditor(s), aligned with the buyer. The primary engagement hosts the project; linked engagements "pull into" the project as secondary parties. Projects can also be nested (parentId) OR linked across engagements via linked transparency centers — see new open question on nesting depth.

2. **Seller consent model** — **Baked into the transparency-system agreement at Engagement 1.** Not per-request approval. The seller agrees up front to be subject to buyer's auditor(s) of choice. Brian: *"You are being subject to my auditor or auditors of choice… you're going to have to share information with them."* Anonymity protects the seller's brand/company ID; assessment data is what matters.

3. **Anonymity persistence through remediation** — **Auditor stays anonymous; remediation flows through the transparency center.** Findings + alerts + rights-to-cure (30/60/90-day windows) live in the shared transparency center. The seller sees the failure/finding + cure obligation, not the auditor. This is the **Cybersecurity SLA** mechanism (see New Concept below). Remediation penalties and contractual outs are pre-negotiated via SLA terms, so no direct back-and-forth needed.

4. **3PAO capability registry (specialty taxonomy)** — **Marketplace-curated AND vendor-declared.** SME Mart provides a directory for "known demand" specialties (cyber, AI, quantum encryption, IAM, agent audit, etc.); vendors can declare their own verticals (like schema extensions) if not covered. SME Mart may relabel or curate. 3PAOs are explicitly "**category #1**" — top-level category in the SME Mart directory.

5. **Scope overlap / conflict arbitration** — **Buyer decides, via the Cybersecurity SLA.** Overlapping/second-opinion audits ("bake-off") are a legitimate pattern for paranoid buyers. When findings conflict, the buyer's Cybersecurity SLA terms are authoritative (pre-defined thresholds, cure periods, penalties, contractual outs).

6. **3PAO discovery (catalog vs. bring-your-own)** — **Both.** Buyers can bring their own 3PAOs but they MUST register in SME Mart (Brian: *"can't have them off the island"*). Private placement flow vs. open bid (already distinguished in the marketplace). SME Mart directory is the discovery surface for catalog-sourced; BYO 3PAOs flow through private placement.

### New Concept: Cybersecurity SLA (CE8)

Brian introduced this mid-meeting as the contractual mechanism for continuous monitoring and finding arbitration:
- **Packaged by assessor, sold to buyer** as a subscription (e.g. $200/app × 5 apps = $1,000/mo)
- **Contains**: assessment logic + legal terms/conditions + rights-to-cure language + penalty/out clauses
- **Imposed**: buyer inserts SLA terms into the primary-engagement contract with seller
- **Continuous monitoring**: authoritative for thresholds, cure windows, and conflict arbitration
- **Teeth**: financial penalties, contractual-out clauses on breach

This becomes **Plan CE8: Cybersecurity SLA as First-Class Contract Template**.

### New Open Questions (from meeting)

1. **Nested transparency centers — depth limit?** Brian acknowledged the "inception" problem: every project has its own transparency center; linked projects have linked transparency centers; auditor↔buyer may need a secondary transparency center that publishes into the primary. How many nesting levels are realistic before the model breaks?
2. **Global/meta auditor role** — Clark raised: does someone (regulator, board-level observer) need visibility across all transparency centers? Unresolved.
3. **Cybersecurity SLA structure** — is this a reusable SME Mart entity type (assessor-published template that buyers subscribe to), or free-form attachment to engagements? Leaning entity type given Brian's packaging language.
4. **Termination cascade granularity** — auditor revoked from a buyer globally vs. project-by-project? Transcript suggests global revoke within that buyer's scope but not confirmed for sub-project contexts.

---

## Implementation Sequencing Suggestion

1. **First:** UI rename (071) — cheapest, unblocks terminology consistency. Can ship within an hour when Plan 071 lands.
2. **Next:** Expand Plan 080 scope to include multi-engagement linkage. Designed concurrently with CE1.
3. **Then:** CE1 (Cross-Engagement Project Party) as foundational schema + API work. Blocks CE2 and CE3.
4. **Parallel:** CE2 (Anonymity) and CE3 (Scope-Partitioned) can proceed in parallel once CE1 schema lands, since they touch different surfaces (visibility policy vs. scope assignment).
5. **Parallel:** Plan 041 expansion for 3PAO capability declaration — feeds CE3's scope matching.

---

## Additional Findings From Zoomed Screenshots (2026-04-13 PM)

Clark provided zoomed screenshots that surfaced intel not extractable via Miro API.

### 3PAO specialty taxonomy (confirmed, first-class)

Each 3PAO org has a specialty tag that drives their scope partition:
- **Org A** — AI specialty
- **Org B** — Quantum encryption specialty
- **Org C** — IAM specialty
- (more expected — "20 different 3PAOs" per Brian)

Specialty + side (Demand/Supply) fully identifies a 3PAO's scope context.

### Demand Twin / Supply Twin is first-class

Not "Demand/Supply boundary types" — **every boundary requirement exists as both a Demand Twin and a Supply Twin**, paired. This is digital-twin terminology consistent with ZB platform patterns. Visible examples:
- Demand Twin Legal Boundary Requirements + Supply Twin Legal Boundary Requirements
- Demand Twin Boundary Requirements + Supply Twin Boundary Requirements
- Demand Twin Legal/Compliance Boundary + Supply Twin License Boundary Requirements
- Demand Twin TBD Boundary Requirements + Supply Twin TBD Boundary Requirements

**Implication:** Our current one-sided requirement model must expand to twinned requirements with party-scoped visibility.

### Boundary type taxonomy (confirmed from diagrams)

Six boundary types visible:
1. Legal / Compliance Boundary
2. Boundary Financial
3. Boundary Gov Identity criminal background
4. Boundary TBD Type (placeholder/custom)
5. License Boundary
6. (one more implied — "boundaries by type" aggregation panel)

### Per-3PAO view has 5 columns (authoritative layout)

From Image 14 (clearest):

| Column | Content |
|--------|---------|
| Protocol Gateway | **Task/sub-task level grants** — permission enforcement |
| Project 1 Board | Kanban with assigned tasks |
| Project 1 Transparency Private / Publish to Shared | **Private workspace → elevated findings** |
| Boundaries by Type RAGS Tasks | RAG (Red/Amber/Green) status per boundary |
| Boundaries by Type | Architecture diagrams (AWS VPC/Lambda/SQS etc.) |

### Two major architectural revisions

**1. Permissions are task-level, not boundary-level.**

Protocol Gateway grants apply to individual tasks and subtasks. This is much finer-grained than our current model assumes. CE3 scope partitioning must include task-level grants:

```typescript
ProjectParty.scope = {
  taskGrants: [{taskId, subtaskIds?, grantType: 'read'|'write'|'publish'}]
}
```

**2. Private → Publish-to-Shared IS the selective disclosure mechanism.**

Not a separate visibility policy — the flow is:
1. 3PAO works in their **private workspace** (full visibility of their scope)
2. 3PAO selects specific findings to **publish to shared transparency**
3. Anonymity rules applied **at publish time** — Buyer decides who sees 3PAO identity on the shared view

This re-frames CE2 (Selective Disclosure) as a **publish pipeline** rather than a visibility gate. Much cleaner architecture.

### Engagement Transparency Center master task list (partial read)

Tasks are numbered (01.00, 02.00…) with Priority + Status + Description + Notes columns. Mixed content:

**Audit workflow tasks:**
- 01.00 Evaluate Type of audit / Scope / Mission Stmt with context on audit team domain
- 02.00 Create Risk Assessment profile for identified "consultable gold"

**Platform auth infrastructure tasks:**
- Social Logins (Apple, Google, Facebook)
- Magic Link / Email Authentication
- Duplicate Account Prevention
- Support profile completion rate MCP (Registration rate KPIs)
- MCP Access
- Agent-to-agent authorization

**Implication:** The Transparency Center task list is a **hybrid template** — audit-workflow boilerplate + platform readiness items. In SME Mart terms, these become the engagement task-template seeding Plan 040 (Project Bloom).

### Top-level engagement banner (multi-engagement naming)

Readable banner labels confirm:
- **Auditee Org 1 (Supply mostly)** — the seller in Engagement 1
- **Buyer/Auditee - Org 1 (Supply mostly)** — notation suggests Buyer sees Auditee as supply
- **Buyer/Auditee - Org 2 (Demand mostly)** — Buyer's demand-side engagement
- **Project 1 (auditing) Org 1 & Org2 (IMAC ongoing)** — project links both engagements; "IMAC" likely Install/Move/Add/Change (ITIL term) referring to ongoing operational changes during audit

The "(mostly)" qualifiers suggest **parties are not purely Demand or Supply** — most of their work is on one side, but they can have cross-side tasks. Our model should support party side as a soft default with per-task overrides.

---

## Revised Plan Impact Summary

| Plan | Revision from screenshots |
|------|---------------------------|
| **CE1** (new) | Projects link many engagements — confirmed unchanged |
| **CE2** (new) | **Reframe**: not a visibility gate but a Private → Publish pipeline. Anonymity applied at publish time. |
| **CE3** (new) | **Expand**: scope partition includes task-level grants via Protocol Gateway, not just boundary-level |
| **080** | Expand to support Demand Twin + Supply Twin pairing on every boundary requirement |
| **078** | UI spec must cover Private workspace view, Publish-to-Shared dialog, and RAG rollup per boundary type |
| **041** | 3PAO capability declaration = specialty taxonomy (AI, Quantum encryption, IAM, cyber, agent audit, …). Make this a platform-level ontology per Brian's language. |
| **071** | Rename "Entangled Pairs" → "Entangled Tasks" — confirmed UI change |

## New Plans Revised

### Plan CE4: Twinned Boundary Requirements
**What:** Every boundary requirement exists as a Demand Twin + Supply Twin pair with independent RAG status, party-scoped visibility, and linked lifecycle.
**Why:** Miro board universally treats requirements as twinned; current model is single-sided.
**Key design questions:**
- Is the twin split automatic on requirement creation, or manual?
- How does RAG aggregate at project level — separate Demand/Supply rollups or combined?
- Does each twin have its own task list or shared tasks with side-tagged subtasks?
**Scope estimate:** 14–18 hrs (schema + service + UI)

### Plan CE5: Protocol Gateway Task-Level Grants
**What:** Permission enforcement at task/subtask granularity. Parties receive grants scoped to specific tasks within the boundaries they're assigned.
**Why:** Protocol Gateway column in 3PAO views is task/subtask level; boundary-level grants aren't fine-grained enough.
**Key design questions:**
- Grant types: read, write, publish-to-shared, close-task
- Does task-type template carry default grant matrix?
- Who grants: Buyer auto-assigns based on engagement + specialty + scope; exceptions require explicit approval?
- Audit trail per grant change
**Scope estimate:** 18–24 hrs (schema + authz service + UI)

### Plan CE6: Publish-to-Shared Pipeline + Anonymity
**What:** Replaces CE2's visibility-gate approach. Each party has a private workspace; specific findings/tasks are explicitly published to shared transparency. Anonymity rules (Buyer-configured) applied at publish time — mask org name/logo/contact but preserve role + specialty.
**Why:** Clearer architecture visible in Miro; matches Brian's "publish results to shared transparency based on ONLY their pertinent tasks" phrasing.
**Key design questions:**
- Publish unit: single finding, task, or bundle?
- Approval workflow: auto-publish, 3PAO self-review, or Buyer-gated?
- Revoke/redact: can a party un-publish? With what consequences?
- Masking presentation: pseudonym ("3PAO-A"), role-only ("Your IAM Auditor"), or fully hidden
**Scope estimate:** 16–22 hrs (schema + pipeline + UI)

## Links

- Miro board: https://miro.com/app/board/uXjVGm64Grw=/
- Slack context: zerobias.org DM with Brian, 2026-04-13 10:36–11:09 AM
- Screenshots: `~/Pictures/Screenshots/Screenshot 2026-04-13 at 2.56.58 PM.png` through `...3.03.22 PM.png`
- Related plans: 071, 078, 080, 064, 041, 056
