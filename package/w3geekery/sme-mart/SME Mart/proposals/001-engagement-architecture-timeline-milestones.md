# Proposal 001: Engagement Architecture — Timeline Enhancement, Milestones & App Boundaries

**Date:** 2026-02-24
**Author:** Clark (W3Geekery) + Claude
**For:** Kevin (CIO) — architecture review
**Status:** Draft / Discussion

---

## Summary

This proposal addresses three interconnected questions:

1. **How should the engagement timeline evolve?** — Filters, search, milestones as timeline events
2. **Should SME Mart manage full engagement lifecycles?** — Or hand off to a dedicated Engagement/Audit Center
3. **What platform capabilities exist vs. what needs building?**

---

## Part 1: The Scope Question — Marketplace vs. Engagement Center

### The Analogy

If SME Mart is "Upwork for compliance," then:

| Concern | Upwork Equivalent | ZeroBias Equivalent |
|---------|-------------------|---------------------|
| Find an expert | Upwork marketplace | **SME Mart** |
| Agree on terms | Upwork proposal/contract | **SME Mart** (RFP → Proposal → Accept) |
| Manage the project | Upwork workspace + milestones | **??? — this is the question** |
| Track deliverables | Upwork submissions | **Engagement/Audit Center** |
| Audit trail | Upwork activity log | **ZeroBias Boundary + Tasks** |

### Three Options

#### Option A: SME Mart Does Everything (Current Path)

SME Mart handles marketplace + engagement management in one app.

```
SME Mart
├── Browse Providers / Services / RFPs
├── Post RFPs, Submit Proposals
├── Accept → Engagement begins
├── Manage Engagement (tasks, timeline, milestones, deliverables, messages)
└── Complete / Review
```

**Pros:**
- Single app, no context switching
- Faster to ship (already have engagement detail with 4 tabs)
- Simpler deployment

**Cons:**
- App gets heavy — marketplace browsing + project management are different mental models
- Not reusable — other ZeroBias apps can't use the engagement management UI
- Scales poorly if engagements get complex (sub-projects, multiple deliverables, RACI)

**Verdict:** Good for MVP/demo. Will hit limits as engagements get more sophisticated.

#### Option B: Clean Handoff — SME Mart → Engagement Center (Recommended)

SME Mart handles discovery and matchmaking. Once a proposal is accepted, the engagement lives in a separate **Engagement Center** app.

```
SME Mart (Marketplace)              Engagement Center (Project Management)
├── Browse Providers/Services       ├── Engagement Dashboard
├── Post RFPs                       ├── Tasks Board (kanban + list)
├── Submit/Accept Proposals         ├── Timeline (messages, events, milestones)
├── View "My Engagements" (links)   ├── Deliverables & Evidence
└── Reviews after completion        ├── Milestones & Scheduling
                                    ├── Files / Attachments
                                    ├── Invoicing / Hours
                                    └── Audit Trail (ZeroBias Boundary)
```

**Pros:**
- Clean separation of concerns (marketplace vs. project management)
- Engagement Center is **reusable** — could manage any ZeroBias engagement, not just SME Mart originating ones
- Maps to ZeroBias platform patterns: each engagement = a Boundary with Tasks
- Governance App provides a reference architecture to fork
- Better for Brian's vision of the platform — engagement management is a platform capability, not a marketplace feature

**Cons:**
- Two apps to build and maintain
- User navigates between apps (mitigated by deep links)
- More deployment work

**Verdict:** Right architecture for the platform long-term. SME Mart stays focused on its core value (matchmaking), and engagement management becomes a platform capability.

#### Option C: Hybrid — SME Mart Light + Engagement Center Deep

SME Mart keeps a lightweight engagement view (overview, quick status, link to Engagement Center). Engagement Center handles all the heavy project management.

```
SME Mart Engagement View (Light)     Engagement Center (Full)
├── Overview card                    ├── Everything from Option B
├── Status + milestone progress bar
├── Quick message (posts to timeline)
├── "Open in Engagement Center →"
└── Post-engagement review
```

**Pros:** Best of both — users see engagement status without leaving SME Mart, but deep management happens in dedicated app.

**Cons:** Some UI duplication. Need to keep light view in sync.

**Verdict:** Best UX, moderate additional effort. This is the refined version of Option B.

### Recommendation: Option C (Hybrid)

Build SME Mart's engagement detail as a **summary dashboard** with a prominent link to the Engagement Center for deep management. This lets us:

1. Ship the enhanced timeline and basic milestones in SME Mart now
2. Build the Engagement Center as a separate app that leverages ZeroBias Governance patterns
3. Keep both apps focused on their primary concern

---

## Part 2: Enhanced Timeline — Filters, Search & Unified Activity

### Current State

The engagement timeline shows all events linearly: comments, task status changes, proposal events, and system events. No filtering, no search.

### Proposed Architecture

#### 2.1 Event Type Filter Chips

A horizontal chip bar above the timeline:

```
[All] [Messages] [Tasks] [Milestones] [Status Changes] [Files] [System]
```

Each chip toggles visibility of that event type. Multiple can be active. This **replaces the need for a separate Messages tab** — the user just clicks "Messages" to see only messages.

Event type mapping:

| Chip | Timeline Event Types |
|------|---------------------|
| Messages | `comment` |
| Tasks | `task_created`, `task_status_changed`, `task_assigned` |
| Milestones | `milestone_created`, `milestone_completed`, `milestone_missed` |
| Status Changes | `engagement_status_changed`, `proposal_accepted`, `proposal_submitted` |
| Files | `attachment_added`, `deliverable_submitted` |
| System | `boundary_created`, `tag_created`, `engagement_created` |

#### 2.2 Timeline Search

A search input above the filter chips:

```
[🔍 Search timeline...                    ]
[All] [Messages] [Tasks] [Milestones] [Status Changes] [Files] [System]
──────────────────────────────────────────────────────
│ Feb 24 ─── ● Clark posted a comment
│            "The SOC 2 evidence package is ready..."
│
│ Feb 22 ─── ● Phase 1 milestone completed
│            "Evidence Collection Complete"
```

Search operates on: message body, task names, milestone titles, file names. Filters and search compose (filters narrow by type, search narrows by content).

#### 2.3 Implementation

**Effort:** Low-medium. The timeline infrastructure exists. This adds:
- Filter state (signal array of enabled types)
- Search state (debounced signal)
- `computed()` that filters the event list
- UI: Material chip bar + search input

---

## Part 3: Milestones & Scheduling

### 3.1 Platform Assessment

**What ZeroBias provides:**
- **Tasks** — status, priority, RACI (responsible/accountable/consulted/informed), comments, attachments, links between tasks
- **Activity model** — workflow definitions with transitions (status A → triggers activity B)
- **Boundaries** — container for tasks, parties, roles, evidence

**What ZeroBias does NOT provide:**
- Due dates / deadlines on tasks (no native field)
- Scheduled notifications or reminders
- Milestone-specific data model
- Gantt/timeline visualization
- Time-based triggers or automation

**Pipeline scheduling** exists (cron-based recurring jobs) but is designed for data collection bots, not engagement milestones.

### 3.2 Milestone Data Model

Since the platform lacks native milestone support, milestones live in Neon:

```sql
CREATE TABLE engagement_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES work_requests(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  phase           VARCHAR(100),          -- e.g., "Phase 1: Assessment"
  milestone_type  VARCHAR(50) NOT NULL,  -- phase_gate, deliverable, review, go_live, custom
  due_date        TIMESTAMPTZ NOT NULL,
  completed_date  TIMESTAMPTZ,
  status          VARCHAR(50) DEFAULT 'pending',  -- pending, in_progress, completed, missed
  sort_order      INTEGER DEFAULT 0,
  -- Notification config
  notify_users    TEXT[],                -- ZeroBias user IDs to notify
  notify_before   INTEGER DEFAULT 3,     -- Days before due_date to send reminder
  -- Audit
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_milestones_engagement ON engagement_milestones(engagement_id);
CREATE INDEX idx_milestones_due_date ON engagement_milestones(due_date);
CREATE INDEX idx_milestones_status ON engagement_milestones(status);
```

### 3.3 Milestone Types

| Type | Description | Example |
|------|-------------|---------|
| `phase_gate` | End of a project phase | "Phase 1: Assessment Complete" |
| `deliverable` | Specific work product due | "Draft SOC 2 Report" |
| `review` | Review/approval checkpoint | "Client Review of Evidence Package" |
| `go_live` | Production deployment or launch | "Controls Go-Live" |
| `custom` | User-defined | "Stakeholder Presentation" |

### 3.4 How Milestones Appear in Timeline

Milestones are rendered as **future markers** in the timeline — they appear at their `due_date` position:

```
──────────────────────────────────────────────────
│ Mar 15 ─── ◆ MILESTONE (due in 19 days)
│            "Draft SOC 2 Report"
│            Phase 1: Assessment │ Status: In Progress
│
│ Feb 24 ─── ● Clark posted a comment
│            "Starting evidence collection..."
│
│ Feb 20 ─── ◆ MILESTONE ✓ Completed Feb 19
│            "Kickoff Meeting"
│            Phase 1: Assessment │ Completed
```

Overdue milestones get a red indicator. Completed milestones show completion date.

### 3.5 Notification Strategy (Phased)

**Phase 1 (Now):** Client-side only
- On engagement detail load, check for milestones where `due_date - notify_before <= now() AND status = 'pending'`
- Show banner: "Milestone 'Draft Report' is due in 3 days"
- Show overdue milestones prominently

**Phase 2 (Later):** Server-side notifications
- **Option A:** Neon `pg_cron` extension — nightly job checks upcoming milestones, inserts into a `notifications` table that the app polls
- **Option B:** Vercel Cron Job (free tier: 1/day) — hits an API endpoint that checks milestones and sends notifications via ZeroBias platform
- **Option C:** ZeroBias Pipeline — if Kevin exposes custom pipeline job registration, we could hook into the platform's scheduling infrastructure

**Phase 3 (Future):** Automation triggers
- "When milestone X is completed, automatically create tasks for Phase 2"
- "When milestone is 7 days overdue, escalate to project sponsor"
- These map to the ZeroBias Activity model's `onTransition` pattern

---

## Part 4: Engagement Center App — If We Build It

### Architecture (Fork of Governance Patterns)

The ZeroBias Governance App already provides:
- Task board (kanban + list views)
- Boundary-scoped navigation
- RACI role management
- Activity/workflow transitions

An Engagement Center would fork these patterns for marketplace engagements:

```
Engagement Center App
├── /engagements                      # My engagements list
├── /engagements/:id
│   ├── /overview                     # Summary, milestone progress, key metrics
│   ├── /tasks                        # Kanban board + list (ZeroBias Tasks API)
│   │   ├── /tasks/board              # Drag-drop kanban
│   │   └── /tasks/:taskId            # Task detail (comments, attachments, transitions)
│   ├── /timeline                     # Unified activity feed (filtered, searchable)
│   ├── /milestones                   # Milestone management + Gantt-style view
│   ├── /deliverables                 # Evidence/file management
│   ├── /team                         # RACI roles (from ZeroBias Boundary)
│   └── /settings                     # Engagement config, notifications, access
```

### Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Angular 21 | Same as SME Mart, portal-native |
| Components | `@zerobias-org/ngx-library` | Consistent ZeroBias UX |
| Tasks | ZeroBias Platform SDK (Tasks API) | Native task management |
| Boundaries | ZeroBias Platform SDK (Boundary API) | Access control, RACI |
| Milestones | Neon PostgreSQL (custom table) | Platform doesn't have native milestone model |
| Timeline | ZeroBias Boundary Events + Neon | Composite event stream |
| Auth | ZeroBias SDK (same as SME Mart) | Platform-native |
| Deployment | S3/CloudFront (or Vercel interim) | Same as SME Mart |

### Relationship to SME Mart

```
SME Mart                         Engagement Center
──────────                       ─────────────────
Find provider ──→ Post RFP ──→ Accept proposal ──→ [Handoff]
                                                       │
                                    ┌──────────────────┘
                                    ▼
                              Create Boundary
                              Create Master Task
                              Generate ENG- tag
                              Set up milestones (template?)
                              Begin work
                                    │
                              ┌─────┘
                              ▼
                         Engagement Center
                         manages the work
                              │
                              ▼
                         Completion ──→ SME Mart
                                       (review provider)
```

### Platform Questions for Kevin

1. **Boundary creation from external app** — Can SME Mart programmatically create a Boundary when a proposal is accepted? What permissions are needed?

2. **Task customFields** — Is there a plan to add typed custom fields or due dates to the Task model? This would eliminate the need for a separate milestones table.

3. **Activity-based workflows** — Could we define an "Engagement Lifecycle" activity template that maps milestone phases to task transitions?

4. **Pipeline extensibility** — Could SME Mart register custom Pipeline jobs for milestone notifications? Or is Pipeline strictly for connector/collector bots?

5. **Portal app registration** — What's the process for registering a new app (Engagement Center) in the portal? Same as SME Mart's deployment path?

6. **Cross-app navigation** — Can one portal app deep-link to another? (SME Mart → Engagement Center for a specific engagement)

7. **Shared component extraction** — Should timeline, task board, and milestone components live in `ngx-library` for reuse across Governance App, Engagement Center, and SME Mart?

---

## Part 5: Recommended Roadmap

### Near-Term (Phase 5 completion — SME Mart)

| Item | Effort | Value |
|------|--------|-------|
| Timeline filter chips | Low | High — replaces Messages tab, user controls what they see |
| Timeline search | Low | High — essential for busy engagements |
| Milestone data model (Neon table) | Low | Foundation for everything else |
| Milestone CRUD in engagement detail | Medium | Users can create/track milestones |
| Milestone markers in timeline | Low | Visual integration |

### Medium-Term (Phase 6-7)

| Item | Effort | Value |
|------|--------|-------|
| Client-side milestone notifications | Low | "Due in 3 days" banners |
| SME Mart engagement summary view (light) | Medium | Quick status without deep management |
| Engagement Center app scaffold | Medium | Fork governance patterns |
| Cross-app deep linking (SME Mart → EC) | Low | Seamless handoff |

### Long-Term (Post-MVP)

| Item | Effort | Value |
|------|--------|-------|
| Server-side milestone notifications | Medium | Proactive reminders |
| Engagement templates (milestone presets) | Medium | "SOC 2 Audit" template with pre-built phases |
| Gantt/progress visualization | Medium | Visual project tracking |
| Automation triggers on milestones | High | "On complete → create next phase tasks" |
| Shared component extraction to ngx-library | High | Platform-wide reuse |

---

## Decision Points

**Decision 1:** Do we build the Engagement Center as a separate app, or extend SME Mart?
- **Recommendation:** Separate app (Option C hybrid), but defer until after SME Mart Phase 5/6
- **Why:** Clean architecture, reusable, platform-aligned. But shipping the enhanced timeline + milestones in SME Mart first gives us something to demo now.

**Decision 2:** Milestones in Neon vs. ZeroBias Task customFields?
- **Recommendation:** Neon table. Tasks aren't designed for time-bound checkpoints. If Kevin plans to add due dates to the Task model, we can migrate later.

**Decision 3:** Server-side notifications — pg_cron, Vercel cron, or ZeroBias Pipeline?
- **Recommendation:** Defer. Client-side "due soon" banners are sufficient for now. Revisit when engagement volume warrants proactive notifications.

---

*This proposal is a starting point for discussion. The technical implementation details are flexible — the key decisions are architectural (where does engagement management live?) and strategic (how much should SME Mart own vs. the platform?).*
