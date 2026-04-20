# Joe Llamas — Demo Feedback Request

**Date sent:** 2026-02-25
**Requested by:** Brian (CEO)
**Demo URL:** https://sme-mart-clark-stacers-projects.vercel.app/
**Status:** Feedback arriving in batches — more coming

## Context

Brian asked Clark to invite Joe Llamas to review the SME Mart Vercel demo and provide feedback on his needs as both a Buyer and a Provider.

## Demo Setup

- Joe logs in as **Roughnecks-Admin** in **Roughnecks** org (API key locked for demo)
- Must use the **impersonation panel** (floating button, bottom-right) to switch users
- **Recommended Buyer view:** Pinnacle Corp — 1 active engagement (SOC 2 Fast-Track w/ Gina) + 2 open RFPs with competing proposals
- **Recommended Provider view:** A3-Gina-Auditor — 2 active engagements (crystal-harbor + coral-meadow) + pending proposals on open RFPs

## Questions Asked

### As a Buyer:
1. What info needed about a provider before engaging?
2. Current process for finding/vetting compliance experts?
3. What's most frustrating about current process?
4. What would make them come back vs. using existing network?

### As a Provider:
1. What info to showcase on profile to win work?
2. How to be notified about relevant RFPs?
3. What tools for managing multiple engagements?
4. What makes platform worth listing on vs. existing channels?

### General:
1. First impression of UI/navigation — anything confusing?
2. Expected features that are missing?
3. Anything in the way or unnecessary?

## Feedback Prompt Given to Joe

Joe was given a structured LLM prompt to organize feedback into:
1. **First Impressions**
2. **Buyer Experience**
3. **Provider Experience**
4. **Must-Haves**
5. **Nice-to-Haves**
6. **Confusing/Broken**
7. **Comparisons** (to Upwork, Toptal, etc.)

Each item should note which page/screen and which impersonated user.

---

## Joe's Feedback — Batch 1 (2026-02-25)

### Key Insight: Joe Is the Source

Joe revealed that much of the SME Mart vision originated from his conversations with Brian over 18 months. Specifically:
- **The Upwork model** — Joe gave Brian the marketplace model tied to tasks/contracts
- **Vetting via assessments** — Joe's team built adaptive quizzes that increase difficulty based on correct answers
- **Credly integration** — Joe's team built credential validation using Credly badges
- **Work Worlds** — Joe's product that overlaps heavily with SME Mart's provider/engagement management

This means Joe is more of a **product co-architect** than a naive user. His feedback reflects deep familiarity with the problem space and existing solutions.

### Buyer Responses

| Question | Response | Implication |
|----------|----------|-------------|
| Info needed before engaging? | **Proof of credentials** — Credly badge integration | Need Credly API integration to display verified badges on provider profiles |
| Current vetting process? | **Adaptive assessment quizzes** — difficulty scales with correct answers | Need assessment/quiz system for provider vetting (beyond profile/reviews) |
| Most frustrating? | N/A | — |
| What brings you back? | **Price, efficiency, transparency, scoring** | Scoring system is critical; transparency aligns with Brian's Transparency Center vision |

### Provider Responses

| Question | Response | Implication |
|----------|----------|-------------|
| What to showcase on profile? | **Scoring system** (they're building it) | Provider profiles need a computed score/rating beyond star reviews |
| How to get notified? | **Match maker** (they're building it) | RFP-to-provider matching/recommendation engine needed |
| Tools for managing engagements? | **Work Worlds** handles this for them | Their vision: providers don't manage engagements manually — the platform does it |
| Worth listing vs existing channels? | **Work Worlds** lets users engage "in their way" | Flexible engagement modes, not one-size-fits-all workflow |

### Summary

Joe's responses don't describe feature *requests* — they describe features **already being built** in Work Worlds. The overlap is significant. His feedback essentially confirms the roadmap items Brian has already outlined (scoring, matchmaking, Transparency Center) and adds two concrete integrations:

1. **Credly** — credential verification badges
2. **Adaptive assessments** — provider vetting quizzes

---

## Suggested Actions

### Immediate (SME Mart scope — Clark can act on)

1. **Add "Credentials" section to provider profiles** — placeholder UI for verified badges (Credly integration later). Show badge images, issuer, date earned. This is a visible differentiator Joe clearly cares about.

2. **Add "Score" to provider cards/profiles** — currently we show star ratings from reviews. Joe's team is building a scoring system. We should add a computed "Provider Score" field to the data model and display it prominently (separate from review stars). Exact algorithm TBD — could start with a weighted composite (reviews + credentials + engagement completion rate).

3. **Surface "transparency" and "scoring" in the UI copy** — Joe called out transparency and scoring as key value props. Make sure these concepts are visible in headers, empty states, and marketing copy within the app.

### Medium-term (needs Brian/Kevin input)

4. **Credly API integration** — Research [Credly's API](https://info.credly.com/) for badge verification. Would need: provider links Credly profile → app fetches and displays badges. This likely lives in a Hub Module or direct API call. **Escalate to Kevin** for implementation approach.

5. **Assessment/quiz system** — Joe's team uses adaptive quizzes for vetting. This is a significant feature (quiz authoring, scoring, difficulty scaling). Likely a separate module or integration. **Discuss with Brian** whether to build in SME Mart or integrate with Joe's existing system.

6. **Match maker / recommendation engine** — Joe mentions they're building this. Needs discussion on whether SME Mart implements its own matching (based on skills, categories, availability, score) or integrates with Work Worlds' matcher. **Discuss with Brian.**

### Strategic (Brian-level decisions)

7. **SME Mart ↔ Work Worlds integration** — Joe explicitly said there's "a lot of overlap." Brian needs to clarify: Is SME Mart a standalone marketplace, or does it become the ZeroBias frontend for Work Worlds? This affects architecture significantly.

8. **Scoring algorithm ownership** — Who defines the provider scoring model? If Joe's team already has one, should we adopt it? Or build our own that factors in ZeroBias-specific signals (task completion, boundary compliance, audit trail)?

---

---

## Follow-up: Integration Alignment (sent 2026-02-25)

Clark sent Joe a follow-up message to explore the SME Mart ↔ Work Worlds relationship and integration strategy. Key framing:

### Integration Paths Proposed

1. **Direct API-to-API (REST)** — Work Worlds exposes endpoints, SME Mart calls them (and vice versa)
2. **MCP (Model Context Protocol)** — both expose MCP servers, AI agents orchestrate across both
3. **ZeroBias platform as middleware** — both register as Hub Modules, communicate through platform API
4. **Shared data layer** — both read/write to shared database views or event streams

### Context Given to Joe

- SME Mart is built to use the ZeroBias MCP server
- SME Mart will have its own API endpoints exposed
- Eventually the marketplace becomes part of the ZeroBias platform (accessible via ZeroBias API/MCP)
- Anything Joe builds against the ZeroBias interface would carry forward

### LLM Evaluation Prompt Given to Joe

Joe was asked to have his LLM evaluate integration possibilities with this prompt:

```
I'm building Work Worlds, a platform for managing SME (Subject Matter Expert) engagements.
A partner is building SME Mart, a compliance/security expert marketplace on the ZeroBias platform.

We have significant overlap:
- SME Mart: provider profiles, RFPs, proposals, engagement lifecycle, provider reviews
- Work Worlds: scoring system, match maker, adaptive assessments, Credly credential
  verification, engagement management

Integration options:
1. Direct API-to-API (REST)
2. MCP (Model Context Protocol) — both expose MCP servers, AI agents orchestrate across both
3. ZeroBias platform as middleware — both register as Hub Modules
4. Shared data layer — shared database views or event streams

Questions to evaluate:
- Which capabilities should be shared vs. kept separate?
- Simplest integration that avoids duplication?
- Which approach scales best if the marketplace becomes part of the ZeroBias platform?
- What data contracts (APIs, schemas) should we agree on now?

SME Mart data entities: provider_profiles, service_offerings, work_requests (RFPs),
proposals, engagements, reviews, categories. Each provider has skills, roles,
certifications, and star ratings.

Please suggest a concrete integration strategy — which capabilities live where,
what APIs we'd need to define, and what we should align on first.
```

### Specific Questions Asked

1. **Scoring system + Credly** — do those have APIs we could call? If so, SME Mart displays scores/badges immediately.
2. **Match maker** — does it have an API? SME Mart could use it for RFP-to-provider recommendations.
3. **Adaptive assessments** — does the provider take them in Work Worlds, and SME Mart just displays results? Or does the assessment UI need to live in our app?
4. **What should we NOT build twice?** — whoever owns it exposes it as an API for the other.

### Joe's LLM Analysis Result (2026-02-25)

Initial LLM suggestion proposed that Work Worlds owns scoring, assessments, and execution while SME Mart owns discovery and contracting.

**~~Ownership split proposed:~~** *(CORRECTED — see Brian's clarification below)*

~~Work Worlds = execution, scoring, assessments, performance validation~~
~~SME Mart = marketplace discovery & contracting~~

---

## Brian's Clarification (2026-02-25, 12:53 PM)

**Critical correction:** Work Worlds does NOT own engagement, scoring, or assessment features. Those are **ZeroBias platform features** that Work Worlds *consumes*.

> "WW uses the engagement center and those features from ZB. They are not features of WW. WW consumes."

### Corrected Architecture

```
┌─────────────────────────────────────────────────┐
│            ZeroBias Platform (source of truth)   │
│  Engagement Center, Tasks, Boundaries, Scoring,  │
│  Assessments, Credly, Matchmaker, Audit Trail    │
└──────────┬──────────────────────┬────────────────┘
           │                      │
           ▼                      ▼
      SME Mart                Work Worlds
   (marketplace UX)         (engagement UX)
   - Provider discovery     - Provider's workspace
   - RFPs & proposals       - Task execution
   - Matching buyers        - Performance dashboards
     to providers           - Assessment-taking UX
   - Contracting            - Client collaboration
```

**Both SME Mart and Work Worlds are UX layers** that consume the same ZeroBias platform capabilities. Neither owns the underlying features — ZeroBias does.

### What This Changes

| What we thought | What's actually true |
|-----------------|---------------------|
| Work Worlds owns scoring | **ZB platform** owns scoring; WW displays it |
| Work Worlds owns assessments | **ZB platform** owns assessments; WW provides the taking UX |
| Work Worlds owns Credly | **ZB platform** owns credential integration; WW and SME Mart both display |
| SME Mart should call WW APIs | **Both should call ZB APIs** — WW is a peer consumer, not a provider |
| Integration = SME Mart ↔ WW | **Integration = both → ZeroBias platform** |

### What This Means for SME Mart Architecture

1. **Provider Score** — display-only. Fetch from **ZB platform API** (not Work Worlds). Do NOT build scoring logic in SME Mart.
2. **Credly badges** — display-only. Fetch from **ZB platform** credential APIs.
3. **Match maker** — consume **ZB platform** matching service when available.
4. **Assessments** — providers take assessments via **ZB platform** (possibly through WW's UX). SME Mart displays results from ZB API.
5. **Engagement lifecycle** — SME Mart owns marketplace flow (RFP → proposal → contract). Engagement execution uses **ZB Engagement Center** (Tasks, Boundaries). WW provides an alternative UX for the same ZB engagement data.

### Immediate Design Implications

- Provider profile and card components should have **slots/placeholders for platform data** (score badge, credential badges, assessment status) populated via ZB API
- Do NOT build scoring, matching, or assessment logic — these are platform features
- SME Mart's engagement detail view is a **lightweight view** of ZB engagement data; WW may offer a richer execution view of the same data
- The `provider_profiles` table can cache a `platform_score` and `platform_score_updated_at` for display performance, refreshed via ZB API

---

## Joe's Work Worlds Definition (2026-02-25)

Joe provided a definitive description of Work Worlds. This supersedes all earlier assumptions and Brian's clarification needs to be read in this context — Brian was saying WW uses ZB's Tasks/Boundaries primitives, not that WW's own features (scoring, assessments, etc.) are ZB platform features.

### What Work Worlds IS

An **execution platform** that transforms real-world system events (security alerts, vulnerabilities, compliance findings) into structured, measurable work called **"Missions."** It sits on top of ZeroBias as the **execution and performance layer.**

### How It Works

```
External Systems (Stellar Cyber, Mend, Palo Alto, etc.)
    │ generate findings
    ▼
ZeroBias (system of record)
    │ normalizes findings into tasks
    ▼
Work Worlds (execution layer)
    │ wraps tasks into "Missions"
    │ assigns/matches to experts (human or AI)
    │ tracks execution, scores performance
    ▼
Verified Outcomes (proof of work, scoring, reputation)
```

### What Work Worlds Owns (WW features, NOT ZB features)

| Capability | Description |
|-----------|-------------|
| **Mission creation** | Wraps normalized ZB task data into Missions with objectives, required skills, effort estimates, reward value, validation criteria |
| **Skill + performance matching** | Matches missions to experts based on skills AND past performance |
| **Adaptive assessments** | Validates expertise via quizzes that scale difficulty with correct answers |
| **Execution tracking** | Steps taken, actions performed, progress monitoring |
| **Scoring** | Speed, quality, completion, accuracy — objective performance metrics |
| **Proof of work** | Logs, video highlights, verifiable evidence of work done |
| **Real-time engagement state** | Who is doing what, progress, outcomes |
| **Credential verification** | Credly integration + internal credential validation |

### What ZeroBias Owns (unchanged)

Tasks, findings, boundaries, compliance standards, audit graph. ZB is the **system of record and governance layer.**

### Key Distinctions

> **Work Worlds is NOT a marketplace.** It does not manage discovery, RFPs, or contracting. It provides execution, validation, and performance data which external systems (like SME Mart) can consume.

> **Work Worlds answers "who can do the work and how well they perform it," not "who should be hired."**

### Non-Negotiable Principle

> **Scoring, performance tracking, and execution validation must exist in a single system (Work Worlds). These should not be duplicated across platforms.**

### WW APIs (to be exposed)

| API | Purpose | SME Mart would use for... |
|-----|---------|--------------------------|
| User scoring | Performance scores per expert | Display on provider profiles/cards |
| Credential verification | Credly + internal badges | Display verified badges on profiles |
| Matchmaker | Skill + performance-based matching | Recommend providers for RFPs |
| Assessments | Start assessment + get results | Show assessment status/score on profiles |
| Mission/engagement performance | Per-engagement metrics | Show track record on provider profiles |

---

## Definitive Architecture (Final)

```
External Systems (Stellar Cyber, Mend, Palo Alto, etc.)
    │ findings
    ▼
┌──────────────────────────────────────────────┐
│  ZeroBias Platform (system of record)         │
│  Tasks, Findings, Boundaries, Compliance,     │
│  Standards, Audit Graph, Auth, Orgs, Catalog  │
└──────────┬──────────────────┬────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌──────────────────────┐
│  Work Worlds      │  │  SME Mart             │
│  (execution)      │  │  (marketplace)        │
│                   │  │                       │
│  Missions         │  │  Provider discovery   │
│  Matching         │  │  RFPs & proposals     │
│  Assessments      │  │  Contracting          │
│  Scoring          │  │  Engagement center    │
│  Proof of work    │  │  (lightweight)        │
│  Credential verif │  │                       │
└────────┬──────────┘  └───────────┬───────────┘
         │                         │
         │    WW APIs              │
         └────────────────────────→│
           scoring, credentials,
           matchmaker, assessments,
           performance data
```

**SME Mart consumes WW APIs** for scoring, credentials, matching, and performance data.
**Both consume ZB APIs** for tasks, boundaries, auth, catalog.
**WW adds a significant execution/scoring layer** on top of ZB that SME Mart should consume, not rebuild.

### What This Means for SME Mart (Final)

| SME Mart Feature | Data Source | Notes |
|-----------------|------------|-------|
| Provider score/reputation | **Work Worlds API** | Display-only. WW computes from actual mission performance. |
| Credential badges | **Work Worlds API** | WW owns Credly + internal verification. SME Mart renders. |
| Provider matching for RFPs | **Work Worlds API** | WW's matchmaker uses skills + performance history. |
| Assessment status | **Work Worlds API** | Providers take assessments in WW. SME Mart shows pass/score. |
| Engagement task tracking | **ZeroBias Task API** | Both apps read/write the same ZB tasks. |
| RFPs, proposals, contracting | **SME Mart (own DB)** | This is purely SME Mart's domain. |
| Provider profiles, services | **SME Mart (own DB)** | SME Mart owns marketplace profiles. |

### Engagement Center — Settled Position (2026-02-25)

**SME Mart owns the engagement center.** No conflict with WW — the domains are cleanly separated:

| Concern | Owner | View |
|---------|-------|------|
| Engagement overview, status, contracting | **SME Mart** | Buyer/Provider marketplace view |
| Proposal history, acceptance workflow | **SME Mart** | How we got here |
| Activity timeline (comments, status changes) | **SME Mart** | Business/contract timeline |
| Task list (ZB Tasks) | **Both** (shared ZB data) | SME Mart = progress view; WW = execution view |
| Mission execution, steps, actions | **Work Worlds** | Provider's execution workspace |
| Scoring, proof of work | **Work Worlds** | Performance validation |
| **Scheduling** | **SME Mart** (to build) | When missions/work should happen |

**How WW data appears in SME Mart's engagement timeline:**

SME Mart's Timeline tab already shows color-coded events (comments, proposals, status changes). WW mission results would appear as **additional timeline event types**:

- **Mission Completed** — WW mission finished, score, duration, outcome summary
- **Mission Started** — provider began work on a mission
- **Assessment Passed** — provider completed a WW adaptive assessment
- **Score Updated** — provider's performance score changed

These events flow from WW API → SME Mart timeline as read-only entries. SME Mart doesn't control or modify them.

**Scheduling (new feature needed):**

SME Mart needs to build scheduling so buyers and providers can coordinate when work happens. This feeds into WW's mission system — a scheduled block in SME Mart could trigger a mission in WW. Scheduling is marketplace-side coordination; mission execution is WW-side.

### Implications for SME Mart Codebase

1. **Do NOT build scoring logic** — consume WW scoring API when available
2. **Do NOT build assessment system** — consume WW assessment API
3. **Do NOT build Credly integration** — consume WW credential API
4. **Do NOT build matching algorithm** — consume WW matchmaker API
5. **DO build placeholder UI** for all of the above — slots on provider profiles/cards ready to display WW data
6. **DO build the marketplace** — discovery, RFPs, proposals, contracting is exclusively SME Mart's domain
7. **DO build the engagement center** — SME Mart owns this. Business/contract view with timeline, tasks, scheduling.
8. **DO build scheduling** — new feature for coordinating when work happens
9. **DO add WW mission event types to timeline** — placeholder event cards for mission started/completed/scored, populated from WW API when available

### Next Steps

1. **Clark:** Add placeholder UI for WW-sourced data on provider profiles (score, badges, assessment status, performance metrics) — display-only slots
2. **Clark:** Add WW mission event types to TimelineEventCard component (placeholder, render when WW data available)
3. **Clark:** Plan scheduling feature for engagement center
4. **Joe:** Share WW API specs (OpenAPI or similar) for scoring, credentials, matchmaker, assessments, performance, mission events
5. **Both:** Agree on provider identity mapping — ZB user ID is the natural shared key
6. **Both:** Define timeline event contract — what data does a "mission completed" event contain?
7. **Both:** Define data refresh strategy — SME Mart caches WW scores locally, or fetches on-demand?

---

## Joe's Revised Position: Assessments & Credentials in SME Mart (2026-02-25)

Joe stated that **assessments and credential verification should live in SME Mart**, not in Work Worlds or the ZeroBias platform. His reasoning: these features belong in the auth/vetting layer closest to the marketplace where providers are discovered and engaged.

This reverses the earlier position that SME Mart should consume these from WW APIs. Instead:

| Feature | Previous Position | Joe's New Position |
|---------|------------------|-------------------|
| Adaptive assessments | Consume from WW API | **Build in SME Mart** |
| Credential verification (Credly) | Consume from WW API | **Build in SME Mart** |
| Scoring | Consume from WW API | TBD (may follow) |
| Matching | Consume from WW API | TBD (may follow) |

**Joe is sending an LLM doc** with implementation details of how they built assessments and credential verification, with enough detail for Clark to recreate the features in Angular.

### What This Changes for SME Mart

If assessments and credentials are SME Mart features:
1. **DO build assessment system** — quiz authoring, adaptive difficulty, scoring, provider vetting
2. **DO build Credly integration** — badge verification, display on provider profiles
3. These become SME Mart-owned tables in Neon PostgreSQL (new schema needed)
4. Work Worlds would *consume* these from SME Mart (not the other way around)
5. The diagram and "Do NOT Build" list need updating once confirmed

### Open Questions

- If assessments live in SME Mart, does WW call SME Mart APIs for assessment data?
- Does scoring also move to SME Mart, or stay with WW?
- No conflict with Brian — he only spoke about the engagement center, not assessments/credentials. This is Joe revising his own WW feature list.

---

## Brian's Hierarchy Clarification (2026-02-25, 2:05 PM)

Brian clarified the full engagement structure. See [CEO_NOTES.md](./CEO_NOTES.md) for full details.

**Key change: Engagement → Project → Task → SubTask hierarchy.**

- **Engagement** = org-to-org (tax, W-9, background checks, banking, high-level legal)
- **Project** = specific scope of work, where $ happens, multiple per engagement
- **Task** = how outcomes delivered (apps/services/agents)
- **SubTask** = legal, financial, and functional compliance per task

**Transparency Center** aggregates from subtask → task → project → engagement with 3 views (Buyer, Supplier, Shared).

**Assessments** are tied to "Readiness" — a supplier-side construct. Multiple assessments roll into a readiness score.

**ZB platform gap:** No Project entity exists yet. SME Mart may need to model this in Neon initially.

New plans created: 022 (Project Layer), 023 (Transparency Center), 024 (Readiness/Scoring), 025 (ZB Platform Feature Requests).

---

## Joe's Clarification: Extended ZB User Profile (2026-02-25, 4:00 PM)

When asked whether assessments and credentials should live in WW, ZB, or SME Mart, Joe responded:

> "I want it to live in ZB in the user profile. I want to extend the user profile to include assessment, certs (credly), maybe an avatar (ready player me connector) and then history and memory of activity"

### What Joe Is Asking For (Standup Summary)

Joe wants the **ZB user profile** to become the single source of truth for provider identity — not just auth/org membership, but a rich profile that includes:

1. **Assessments** — adaptive quiz results (pass/fail, scores, difficulty level reached)
2. **Credentials** — Credly badge verification (certifications like CISSP, CISA, CCSK)
3. **Avatar** — Ready Player Me integration (3D avatar, used in WW's Three.js worlds)
4. **History** — engagement/activity history across the platform
5. **Memory** — persistent context about the user's past work and preferences

Both SME Mart and Work Worlds would consume this enriched profile from the ZB platform API. Neither app builds or owns these features.

**Question for Kevin:** Is extending the ZB user profile on the roadmap? How much of this is feasible near-term vs. long-term?

---

## Awaiting

- **Joe's LLM doc** — implementation details for assessments + credential verification (enough to recreate in Angular)
- Joe's General feedback (First Impressions, UI/UX, Confusing/Broken items)
- Provider identity mapping agreement (ZB user ID?)
- Timeline event contract for WW mission events
- Kevin's response to extended user profile request (standup 2026-02-26)
- More batches of Joe's feedback coming
