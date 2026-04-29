# Cross-Project Collaboration Prompt: SME Mart <-> Readiness Center

> **For:** Dan Simonica's Claude instance
> **From:** Clark Stacer (W3Geekery contractor, SME Mart frontend)
> **Date:** 2026-04-03
> **Purpose:** Establish a collaboration protocol between two ZeroBias platform POC projects so our Claudes can exchange context, avoid duplicating effort, and build a shared understanding of the BIG picture.

---

## 1. Who Is Clark & What Is SME Mart?

**Clark Stacer** is a W3Geekery contractor building **SME Mart** — a marketplace for Subject Matter Experts in compliance and cybersecurity. Think "Upwork meets Whop" for the ZeroBias ecosystem.

**What it does:** Connects buyers seeking compliance services (SOC 2, ISO 27001, HIPAA, etc.) with qualified providers through a transparent, task-gated marketplace.

**Where it lives:** Angular 21 app in the `zerobias-org/app` fork (`package/w3geekery/sme-mart/`), deployed to Vercel (temporary) with eventual target of ZeroBias platform publishing.

**Current state (v1.2):**
- ~77,000 LOC TypeScript, Angular 21 standalone components
- 17 entity types reading/writing through ZeroBias AuditgraphDB
- All data flows through Pipeline (writes) + GraphQL (reads) — no direct DB access for domain entities
- 94+ automated tests, 14 domain services
- Supply-side vendor profiles, org navigation, pilot projects shipped
- Working on: invitation controls, document templates, form builder, demo scripts

### Key Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| **Framework** | Angular 21 | Standalone components, no Nx, plain Angular CLI |
| **UI Library** | `@zerobias-org/ngx-library` | Shared ZB component library (theme, tables, panels, etc.) |
| **ZB Client** | `@zerobias-com/zerobias-angular-client` | Wraps `zerobias-client` -> `zerobias-sdk` |
| **Data Writes** | Pipeline (Receiver Differential) | Push batches to AuditgraphDB via `platform.Pipeline.receive` |
| **Data Reads** | GraphQL | Auto-generated from YAML schema, read-only queries |
| **Schema** | `zerobias-org/schema` repo | YAML packages -> platform generates GQL API (15-min reload) |
| **Supplemental DB** | Neon PostgreSQL | Legacy tables being archived; non-migrated services still use it |
| **Auth** | API key (dev), session (prod) | ZeroBias platform handles login/session |
| **Deployment** | Vercel (temp), ZB platform (target) | Static export, edge middleware proxies API |

### SME Mart Entity Model (GraphQL Schema)

SME Mart defines 8 core classes + 9 "Project Bloom" classes in `zerobias-org/schema`:

**Core entities:** Engagement (RFP/work request), Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument

**Project Bloom entities:** SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartTask (not ZB Task), SmeMartSubtask, SmeMartVettingItem, SmeMartVettingResponse, MarketplaceProfileItem, + more

**Resource types** use `sme-mart:` prefix (e.g., `sme-mart:note`, `sme-mart:work-request`).

**Link types** used: `child_of`, `relates_to`, `evidence_for`, `attachment_for`, `deliverable_for`, `references`

### How Data Flows (Write + Read)

```
Angular Component
    |
    v
Domain Service (e.g., EngagementService)
    |
    +--> PipelineWriteService.pushEntity(classId, fields)
    |       |
    |       v
    |    platform.Pipeline.receive(pipelineId, batch)
    |       |
    |       v
    |    AuditgraphDB (eventual consistency, ~5-10s)
    |
    +--> GraphqlReadService.query(className, filters, fields)
            |
            v
         GQL API (read-only, auto-generated from YAML schema)
```

**Critical learning:** Pipeline `receive` is **full-replace** — always include ALL fields in a push or omitted fields get nulled. Never do partial updates.

### Platform Learnings Clark Can Share

These are things learned the hard way that may save Dan significant time:

1. **Schema reloads every 15 minutes** — after merging schema YAML to `zerobias-org/schema`, wait ~15 min for the platform to pick up new classes/fields
2. **Pipeline receive is full-replace** — never partial push; always include every field
3. **Hydra migration (2026-03-10)** — Tag CRUD, resource tagging/linking all moved from `danaOld`/`platform`/`fileservice` to `hydraClient`. Old accessors removed.
4. **`dana-org-id` header** — set client-side by SDK via `sessionStorage['zb-current-dana-org-id']`. Wrong org = silent failures (0 results, failed lookups). Check Network panel.
5. **Tag name constraints** — `nmtoken` domain: `A-Z 0-9 . _ - :` only, no slashes
6. **Task priorities** are numeric: 1000 (Critical), 500 (High), 200 (Normal), 100 (Low) — not 1-5
7. **GQL class IDs are deterministic** (UUID v5 from YAML content) — same across all environments. Pipeline IDs are NOT.
8. **Cannot `linkTo` platform-native entities** (Boundary, Task) in schema YAML — they're hydra entities, not schema classes
9. **Two npm registries:** `@zerobias-com` -> npm.pkg.github.com (GITHUB_TOKEN), `@zerobias-org` -> pkg.zerobias.org (ZB_TOKEN)
10. **Neon MCP `run_sql`** = ONE statement only (prepared statement limitation). Use `run_sql_transaction` for batches.

---

## 2. The BIG Picture: Where We Fit in the ZeroBias Ecosystem

```
                    ┌─────────────────────────────────────────────┐
                    │           ZeroBias Platform                  │
                    │  (auth, orgs, boundaries, tasks, hydra,     │
                    │   pipeline, GQL, schemas, file service)     │
                    └─────────┬──────────────┬────────────────────┘
                              |              |
                    ┌─────────┴──┐    ┌──────┴──────────┐
                    │  SME Mart  │    │ Readiness Center │    ... future apps
                    │  (Clark)   │    │ (Dan)            │
                    │  Angular   │    │  ???             │
                    │  Market-   │    │  Compliance      │
                    │  place     │    │  readiness?      │
                    └────────────┘    └─────────────────-┘
                              |              |
                    ┌─────────┴──────────────┴────────────┐
                    │        Shared Platform Layer          │
                    │  - zerobias-org/schema (YAML -> GQL) │
                    │  - zerobias-sdk (auth, API clients)  │
                    │  - ngx-library (Angular UI kit)      │
                    │  - Hub modules (data connectors)     │
                    │  - hydra (tags, resources, links)    │
                    └──────────────────────────────────────┘

                    Both projects:
                    - Are POC/R&D by 3rd-party devs
                    - Build on zerobias-sdk backbone
                    - Define custom GQL schemas in zerobias-org/schema
                    - Will eventually be consumed by the ZB platform
                    - Take directives from Brian (CEO) and platform support from Kevin (CIO)
```

**Parts of the ecosystem yet to be built** (that both projects may need or inform):
- Scoring app
- Billing app
- Internal Marketplace (BU-to-BU)
- LLM-assisted workflows
- E2E auth flow (custom login screens)
- Platform app publishing path (both currently use workarounds)

---

## 3. Cross-Project Exchange Protocol

### 3.1 Context Exchange Templates

When Dan's Claude and Clark's Claude need to share context, use these structured templates. Either developer can paste a filled-in template into the other's Claude session.

#### Template A: Project Snapshot

```markdown
## [Project Name] Snapshot — [Date]

**Current milestone:** [name + goal]
**Active phase:** [what's being built right now]
**Tech stack delta from last sync:** [any new deps, framework changes, etc.]
**Schema changes since last sync:** [new/modified classes in zerobias-org/schema]
**Brian directives since last sync:** [any CEO-level priorities or requirements]
**Blockers / platform issues:** [anything filed with Kevin or pending]
**SDK versions:** angular-client [ver], zerobias-sdk [ver], ngx-library [ver], hydra-sdk [ver]
```

#### Template B: Terminology Proposal

```markdown
## Terminology Proposal — [Date]

**Term:** [proposed term]
**Definition:** [what it means]
**Used in:** [which project(s)]
**Alternatives considered:** [other terms discussed]
**Brian's preference:** [if discussed]
**Status:** proposed | accepted | rejected
```

#### Template C: Learning / Platform Discovery

```markdown
## Platform Learning — [Date]

**Discovery:** [what was learned]
**Context:** [what you were trying to do when you found this]
**Impact:** [how it affects development — workaround, constraint, capability]
**Applies to:** SME Mart | Readiness Center | Both
**Verified on:** CI | UAT | Prod
```

#### Template D: Overlap Alert

```markdown
## Potential Overlap — [Date]

**What we're building:** [brief description]
**What it looks like you're building:** [what seems similar in the other project]
**Suggestion:** [share component? extract to library? coordinate schema? delineate scope?]
**Urgency:** low | medium | high (are we about to ship conflicting things?)
```

### 3.2 Periodic Sync Checklist

At each sync (weekly or biweekly, aligned with Brian meetings):

- [ ] Exchange Project Snapshots (Template A)
- [ ] Review shared glossary — any new terms to align?
- [ ] Schema namespace check — any new classes that could collide?
- [ ] SDK version check — anyone on a newer version with breaking changes?
- [ ] Brian directives — anything that affects both projects?
- [ ] Kevin requests — any platform asks we should coordinate?
- [ ] Lessons learned — anything discovered that helps the other project?
- [ ] Overlap check — are we building anything similar?

---

## 4. Meeting Notes: Sharing & Improving

### Current Setup (SME Mart)

Clark uses a Claude skill chain for processing MS Teams meeting transcripts:

1. **Template** (`ms-teams-meeting-transcription-summarizer-template.md`) — generic Teams transcript parser that handles `.docx` extraction, speaker merge, filler removal, and structured summary generation
2. **Project customization** (`sme-mart-meeting-summarizer.md`) — adds known participants, domain terminology, and preferred next actions
3. **Slash command** (`/process-teams-transcription <path>`) — one-command invocation

**Output structure:**
- Summary (topics, decisions, action items table, open questions, key quotes)
- `---`
- Full cleaned transcript

**Saved to:** `~/.claude/timetracker/meetings/YYYY-MM-DD-marketplace.md` + project-local `.planning/notes/meetings/`

### Sharing Proposal

The template is designed to be copied and customized per project. Dan should:

1. **Copy the template** to Readiness Center's `.claude/skills/` directory
2. **Create a project-specific customization** with Readiness Center participants, terminology, and context
3. **Create the slash command** wrapper for one-click processing

### Improvement Suggestions Requested

Dan's Claude: please review the template structure above and suggest improvements, especially:
- Are there summary sections missing that would be valuable?
- Is the action item table format optimal for tracking across projects?
- Should the "Key Quotes" section include more context (e.g., topic tag)?
- Any better approaches to handling speaker identification in noisy transcripts?

### Shared Meeting Notes Location

**Proposal:** Create a shared location for cross-project meeting notes visibility:

| Option | Pros | Cons |
|--------|------|------|
| **OneDrive shared folder** | Accessible to both, versioned, searchable | Requires OneDrive setup, manual sync |
| **Shared Teams channel** | Already in Teams, real-time | Notes get buried in chat |
| **GitHub repo** (e.g., `zerobias-org/project-notes`) | Git versioned, PR-able, Claude-readable | Overhead for non-code content |
| **Shared `.planning/notes/shared/` convention** | Both Claudes can read/write natively | Requires being in the same filesystem or git repo |

**Recommendation:** A **shared OneDrive folder** (`/ZeroBias POC Projects/Meeting Notes/`) with subfolders per project (`sme-mart/`, `readiness-center/`, `cross-project/`). Both Claudes can process files from there. Meeting notes that contain cross-project decisions go in `cross-project/`.

---

## 5. Anti-Duplication Protocol

### Schema Namespace Convention

Both projects define schemas in `zerobias-org/schema`. To avoid collisions:

- **SME Mart prefix:** `sme-mart:` (e.g., `sme-mart:note`, `sme-mart:work-request`)
- **Readiness Center prefix:** `readiness:` or `rc:` (Dan to confirm)
- **Shared entities:** If both projects need the same concept, discuss before defining — it may belong in a shared schema package

**Check before creating new schema classes:**
1. Does this concept already exist in the other project's schema?
2. Does this concept exist in the ZB platform natively?
3. Should this be a shared entity rather than project-specific?

### Component / Service Overlap

If both projects need similar UI patterns or services:
1. **First choice:** Use `@zerobias-org/ngx-library` if it exists there
2. **Second choice:** One project builds it, the other imports (via shared package)
3. **Last resort:** Both build independently (document why sharing wasn't feasible)

---

## 6. Shared Learnings & Informed Suggestions

### How to Share

Both Claudes should maintain a "learnings" file that the other project can ingest:

- **SME Mart:** `.planning/notes/platform-learnings-for-dan.md` (Clark maintains)
- **Readiness Center:** Equivalent file Dan maintains for Clark

Format: use Template C (Learning / Platform Discovery) entries, appended chronologically.

### Suggestion Protocol

When one Claude identifies something that could benefit the other project:

1. **Write it up** using Template D (Overlap Alert) or Template C (Learning)
2. **Flag the scope:** "This is a suggestion for [Readiness Center / SME Mart]"
3. **Don't assume context** — explain the why, not just the what
4. **Respect autonomy** — suggestions, not directives. Each project has its own priorities.

---

## 7. Shared Communication Channels

### Slack Channel Proposal

**Create: `#zb-poc-devs`** (or `#zb-platform-builders`)

**Purpose:** Async updates between Clark, Dan, Kevin, and Brian about:
- Platform changes that affect POC projects
- Schema namespace coordination
- SDK version updates and breaking changes
- Brian directives that touch both projects
- Quick questions between developers

**Processing:** Both Claudes can periodically scan the channel (if Slack MCP is available) for updates relevant to their project. Tag messages with `[sme-mart]`, `[readiness]`, or `[both]` for easy filtering.

### Brian Directive Tracker

**Create a shared document** (OneDrive or GitHub) tracking CEO-level directives:

```markdown
## Brian Directives

| Date | Directive | Affects | Status | Notes |
|------|-----------|---------|--------|-------|
| 2026-03-16 | Task/subtask demand/supply/transparency partitions | Both? | SME Mart: P0 deferred | CEO highest priority |
| 2026-XX-XX | [Readiness Center directive] | RC | Active | [details] |
```

This prevents the scenario where Brian tells Clark something on Tuesday and Dan something different on Thursday, with neither knowing about the other's directive.

---

## 8. Shared Glossary (Living Document)

**Proposal:** Maintain a shared glossary file that both projects contribute to. Start with known terms, add as new ones emerge.

| Term | Definition | Used By | Brian's Preferred Label |
|------|-----------|---------|------------------------|
| Boundary | ZeroBias access-control perimeter scoping all work | Both | Boundary |
| Task / Subtask | ZB task engine hierarchy (SME Mart uses task/subtask in UI per Brian) | Both | Task / Subtask |
| Transparency Center | Shared audit/visibility view between supply and demand parties | SME Mart | Transparency Center |
| C-Traces | Cognitive Traces — observability for capturing agent reasoning | SME Mart | TBD |
| Hub Module | ZeroBias connector module for external data sources | Both | Hub Module |
| Dana | ZeroBias core API layer | Both | Dana |
| Hydra | ZB service for tags, resources, and links (migrated 2026-03-10) | Both | Hydra |
| Pipeline | Receiver Differential Pipeline — write path to AuditgraphDB | Both | Pipeline |
| AuditgraphDB | ZB's graph database backing the GQL API | Both | AuditgraphDB |
| Readiness Center | [Dan to define] | RC | [TBD] |

**Dan's Claude:** Please fill in Readiness Center-specific terminology and flag any terms above where your project uses a different label for the same concept.

---

## 9. Response Requested

Dan, after your Claude ingests this, please have it produce:

1. **A Readiness Center snapshot** (Template A) so Clark's Claude can understand your project
2. **Your schema namespace prefix** so we can avoid collisions
3. **Your current SDK versions** so we can flag any drift
4. **Any terminology conflicts** from the glossary above
5. **Your thoughts on the meeting notes sharing approach** and any improvements to the template
6. **Whether a shared Slack channel makes sense** for your workflow
7. **Any platform learnings** you've discovered that Clark should know about
8. **Your Claude setup** — do you use Claude Code CLI? Skills? Memory? GSD workflow? This helps us optimize the exchange format.

---

*This document is a living artifact. As both projects evolve, update it. Clark's Claude has memory of all SME Mart context and can produce updated snapshots on request.*
