# SME Mart — Backlog

**Source of truth for all pending work.** New ideas, meeting-driven stubs, and gap analysis items live here. When starting a new GSD milestone, pull items from this backlog into REQUIREMENTS.md.

**Flow:** Backlog item → `/gsd:new-milestone` → REQUIREMENTS.md → ROADMAP phases → plan → execute → archive

**Last updated:** 2026-04-03

---

## How to Use

- **Add stubs:** Drop new ideas as a row in the appropriate section. Minimum: name, one-line description, source.
- **Select for milestone:** Move items from here into the next `/gsd:new-milestone` requirements conversation.
- **After milestone ships:** Remove completed items. Update status of partially-done items.
- **Deferred items:** Stay here with a note on what's blocking them.

---

## Active Marketplace Plans (Unblocked)

These can be selected for the next milestone. Ordered roughly by business value.

| # | Plan | Description | Est. | Source |
|---|------|-------------|------|--------|
| **054** | RFP Package Builder & Access Controls | **v1.2 IN PROGRESS (Phases 14-17).** D1 (invitation controls) = Phase 14. D2 (document templates) = Phase 15. D3 (form builder) = Phase 16. Demo scripts = Phase 17. S2 (intent-to-bid/destruction attestation) deferred to v1.3. | 30–40 hrs | Gap analysis D1, D2, D3, S2; design session 2026-03-30 |
| **055** | Advanced Pricing & Evaluation | Complex pricing models: NRC/ARC, recurring/one-time, milestone payments, per-unit, multi-year (D4). Evaluation criteria builder with weighted scoring matrix (D5). Structured bid response templates (S3). Bid validity/expiration dates (S4). | 25–35 hrs | Gap analysis D4, D5, S3, S4 |
| **056** | Engagement Roles & Communication | Third-party facilitator role (D7). Mediated communication channels (D6). NDA/confidentiality tracking with per-vendor status, access logging, destruction attestation (P2). | 20–25 hrs | Gap analysis D6, D7, P2 |
| **065** | Message Center (Engagement-Scoped) | Engagement-level message center. Project-level messaging deferred to Project App. **Notes:** (1) Investigate [PromptQL](https://promptql.io) (Hasura) for pattern inspiration — thread-per-resource model, shared context, inline data refs, AI agent threads. 2026-04-01. (2) Slack API connector concept: create dedicated Slack channels per Project/Engagement, slurp conversations into SME Mart messaging center. Slack has full dev API (`api.slack.com`) — channel creation, webhooks, Slack Connect for cross-org. Could replace custom messaging UI entirely. 2026-04-02. | 8–12 hrs | Marketplace scope |
| **066** | Engagement Dashboard | Configurable widgets for cross-project visibility at the engagement level. | 12–16 hrs | Marketplace scope |
| **033 P5** | LLM-Assisted Bid Generation | Claude Agent SDK packaging, bundled ZB MCP tools, cost model (~$0.56/interaction). Phases 1–4 of Plan 033 complete. | ~8 hrs | Plan 033 |
| **046 remaining** | Org Document Management (remaining phases) | Phase 6: org switcher (deferred). Phase 8: external storage imports (deferred). Phase 9 roadmap: folders, colors, tagging UI, archive browser, versioning, PDF conversion, preview, bulk ops, templates. Expand with 19 new document types from gap analysis (E1). **Note:** Phase 15 (v1.2) cherry-picks template→instance workflow from 046. | ~20 hrs | Gap analysis E1 |
| **047** | Shared Notes & Versioning | Per-user sharing, note versioning (version browser/search/copy), Shared Notebook, timeline integration (share/pin events), pinned notes, task-linked checkboxes. 8 phases. | 32–40 hrs | Plan 047 |
| **052** | Playwright E2E Smoke Tests | Full buyer/seller Playwright smoke tests. UAT validation, CI-capable. Supersedes Plan 044. | ~12 hrs | Meeting 2026-03-13 |
| **053** | QA Skills & Cookie Import | Generic Claude Code skills (`/qa`, `/setup-cookies`) using Chrome DevTools MCP. Cookie decryption, systematic QA crawl with health scoring, regression tracking. | 16–21 hrs | Plan 053 |
| **078** | Transparency Controls UI Spec | Design spec for "Transparency Controls" section on each party's tasks (Plan 071). Controls that publish/subscribe to transparency bridge. Spec covers: shared data, granularity controls, bridge visualization. Design-only — implementation deferred. | 4–6 hrs | Brian 2026-03-27 |
| **076** | Spike: Ollama Local LLM Integration | Evaluate Ollama for cost-reduction + capability-expansion. POC: auto-tag suggestion, embedding-based semantic search (pgvector), CVE summarization. Hybrid architecture. | 8–12 hrs POC | Research |

## Partially Complete Plans

| # | Plan | What's Done | What Remains |
|---|------|-------------|--------------|
| **054** | RFP Package Builder | v1.2 Phases 13 (pilot) complete, Phase 14 (invitations) in planning. | Phases 14-17 (invitations, templates, form builder, demo scripts). S2 deferred to v1.3. |
| **034** | GQL Schema Migration | Phases 1–4 done. Schema live in prod (17 classes), receiver pipeline created. | Phase 5: service layer. |
| **022** | Engagement → Project UI Restructuring | Phase 1 done (project shell + routes + My Projects). | Remaining phases deferred — project detail UI is Project App territory. |

## Deferred — Platform Project App (Kevin's Team)

These depend on platform Task/Board/Boundary work. UI implementation deferred until the platform Project app takes shape.

| # | Plan | Notes |
|---|------|-------|
| **057** | SmeBoard/SmeActivity/SmeWorkflow (Project Bloom MVP) | Schema entities exist (PR #8). UI deferred. |
| **058** | Saved Task Views & Board Management | Depends on 057 + platform Board. |
| **064** | Project Members View | Scoped roles, boundary membership. |
| **067** | Project Schedule View (Gantt/Calendar) | Depends on platform milestones/tasks. |
| **068** | Project Financials | Budget/billing in project context. |
| **069** | Compliance Framework Linkage | Task→control mapping depends on platform Board/Task. |
| **070** | Project Reviews / Retrospectives | PM retrospectives in project context. |
| **071** | Transparency Entangled Task Pairs | Option B selected (design done). Implementation depends on platform Task/Board + entangled link types. Brian wants "Transparency Controls" section per task. |
| **072** | Task Queuing & Shift Handoff | Platform task system dependency. Brian 2026-03-24. |
| **073** | Agentic Memory Capture in Tasks | Platform task system dependency. Brian 2026-03-24. |
| **074** | Dual-Party GSD / SDD Toolkit | Depends on 071 + platform + Claude Agent SDK. Brian 2026-03-24. |

## Future Concepts (Not Yet Planned)

| Item | Description | Source |
|------|-------------|--------|
| **040** | Project Bloom (AI Document Decomposition) | Accepted Bid → Engagement + Project → AI decomposes docs into typed task/subtask tree. Expand: assessment task templates (E2), deliverable templates (E4). |
| **042** | Project Plugin (MCP + Templates + Parsers) | Bundled plugin: MCP skills, document parsers, task type templates, questionnaire flow. Dual-path: legacy doc ingestion + native creation. |
| **050** | Internal Marketplace (BU-to-BU) | Intra-company marketplace using same supply/demand constructs. Meeting 2026-03-13. |
| **051** | Reverse Bid Flow (Supply-Originated Proposals) | Suppliers propose projects to demand side within existing engagements. Meeting 2026-03-13. |
| **AI Agent RFP Assistant** | Claude Agent SDK-powered conversational RFP creation + bid evaluation for non-technical buyers. | [Proposal 003](../../proposals/003-ai-agent-rfp-assistant.md) |
| **Agentic Optimization** | AI execution scoring, drift detection, policy-aware optimization, admin AI health panel. | [Notes](../../notes/agentic-optimization-concepts.md) |

## Future Backlog (Gap Analysis Leftovers)

Items deferred from the RFP gap analysis — revisit when Phase 1/2 plans are complete.

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| D8 | Bid/performance bond management | Low | — |
| D9 | GenAI disclosure tracking | Low | — |
| S6 | Legal attestation forms (notarized affidavits, non-discrimination) | Medium | — |
| E6 | Multi-year contract lifecycle management | Low | Renewal notifications, extension options |
| P1 | Vendor conference scheduling with calendar integration | Low | — |
| P3 | Site visit coordination through platform | Low | — |

## Platform Alignment

| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| GQL Schema Package | High | **Live** (17 classes on UAT + Prod) | Plan 034. RfpInvitation + isInvitationOnly pending (Phase 14). |
| Task-backed Reviews | Medium | Planned | Reviews use ZB Task approval workflow instead of custom status field |
| `@zerobias-org/types-core-js` — PagedResults\<T\> | Low | Evaluate | Replace custom pagination. Requires Node 22+ ESM — verify Angular 21 build compat. |
| Document / Service Offering types | Pending | Blocked on Kevin | Are these existing ZB types or defined via GQL schema extension? |

---

## Completed Plans (Reference Only)

<details>
<summary>Click to expand — 28 completed plans</summary>

| # | Plan | Completed |
|---|------|-----------|
| 079 | My Organizations Refactor (three-tier org nav) | ✅ v1.1 Phase 7 |
| 080 | Project-Centric Boundary Model (Internal/External, parties) | ✅ v1.1 Phase 12 |
| 041 | Supply-Side Vendor Profile (6-section, pointers, pre-fill) | ✅ v1.1 Phases 8-11 |
| 077 | Pilot Projects (projectType, completion, promotion) | ✅ v1.2 Phase 13 |
| 059 | AuditgraphDB Migration (Neon → Pipeline + GQL) | ✅ v1.0 Phases 1-6 |
| 015 | Navigation & Taxonomy Restructuring | ✅ |
| 017 | Engagement Tasks Tab | ✅ |
| 018 | Engagement Activity Center (Timeline) | ✅ |
| 019 | Markdown Components (Milkdown Crepe + Renderer) | ✅ |
| 026 | Notes Feature | ✅ |
| 027 | OneNote-Style Togglable Column Layout | ✅ |
| 028 | Drag-and-Drop for Folders & Notes | ✅ |
| 029 | Hierarchical Tag Naming Convention | ✅ |
| 030 | SmeMartResource Abstraction Layer | ✅ |
| 031 | Document Upload to Engagement | ✅ |
| 032 | RFP Creation Wizard | ✅ |
| 033 (P1–4) | Vendor Bid Response Flow | ✅ (Phase 5 pending) |
| 035 | Engagement Tab Routes Refactor | ✅ |
| 036 | RFP / Engagement Route Split | ✅ |
| 037 | ZB Resource Tag Editor Component | ✅ |
| 038 | Document-Notes Cross-Linking | ✅ |
| 039 | Tag Prefix Migration | ✅ |
| 043 | Proposal-to-Bid Rename Migration | ✅ |
| 046 (P1–5,7) | Org-Level Document Management | ✅ (Phase 6/8/9 pending) |
| 048 | Notification Center | ✅ |
| 049 | Unit Testing Strategy | ✅ |
| 060 | ensureDefaultFolder Race Condition Fix | ✅ |
| 061 | Pipeline Write Cache | ✅ |
| 062 | Notebook Info Page | ✅ |
| 063 | Corporate Vetting Flow | ✅ |
| 075 | RFP → Project Refactor | ✅ |

Cancelled/Superseded: 016, 020, 021, 023 (stub), 024 (stub), 044, 045

</details>

---

## Key Architecture Decisions

Carried forward from PLAN.md — these inform all future milestones.

| Decision | Detail |
|----------|--------|
| Engagement/Project hierarchy | Engagement = corp-to-corp wrapper. Project = scoped work. One Engagement → many Projects. |
| Terminology | RFP = Request for Project. Vendor response = Bid (NOT Proposal). |
| Bidirectional requirements | Both buyer AND vendor have requirements at Engagement and Project levels. |
| MSA flexibility | MSA can attach at Engagement level (umbrella) OR Project level (scoped). |
| RFP → Bid → Project (phased bloom) | RFP is lightweight storefront. Accepted Bid triggers Engagement + Project. AI decomposes docs into task tree. |
| Supply-side one-time profile | Vendors load corporate docs/D&B/banking once. Pre-fills for every engagement. |
| Task status lifecycle | pending → in_progress → awaiting_approval → completed |
| Three-sided visibility | Demand (requirements + status), Supply (execution + internal notes), Shared (audit trail) |
| Platform realization | Vendor → Org. Service offering → Boundary. Owner → Principal. Per Kevin. |
| SME Mart scope | Marketplace + Engagements. Project management = separate platform app (Kevin, 2026-03-25). |

---

*Migrated from `.claude/plans/public/PLAN.md` on 2026-03-30. Old plan files archived to `.claude/plans-archive/`.*
