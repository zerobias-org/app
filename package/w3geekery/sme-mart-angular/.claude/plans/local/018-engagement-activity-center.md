# Plan 018: Engagement Activity Center

**Status:** Draft
**Date:** 2026-02-20
**Supersedes:** Plan 016 (Messages Tab) — messaging becomes one activity type within the Activity Center
**Related:** Plan 017 (Tasks Tab) — tasks feed events into the activity timeline

---

## Overview

Replace the separate "Messages" and "Files" stubs with a unified **Activity Center** — a chronological timeline of everything that has happened on an engagement. Think GitHub issue timeline meets a compliance audit trail.

The Activity Center is the single pane of glass for engagement history: task comments, file uploads, meeting transcripts, proposal events, status changes, and sub-task activity — all rendered on a vertical timeline that users can scroll through like time travel.

---

## Activity Types

Each item on the timeline is an **Activity Event** with a type, timestamp, actor, and payload.

| Activity Type | Source | Icon | Data Source |
|---------------|--------|------|-------------|
| `comment` | Task comment (master or sub-task) | `chat_bubble` | `TaskApi.listComments()` |
| `attachment` | File uploaded to a task comment | `attach_file` | `TaskApi.listAttachments()` |
| `status_change` | Engagement status transition | `swap_horiz` | Neon `work_requests` audit or derived from timestamps |
| `proposal_submitted` | New proposal on the RFP | `rate_review` | Neon `proposals` table |
| `proposal_accepted` | Proposal accepted, engagement created | `check_circle` | Neon `proposals.status = 'accepted'` |
| `task_created` | Sub-task created | `add_task` | ZB Tasks + resource links |
| `task_completed` | Sub-task marked complete | `task_alt` | ZB Tasks status |
| `meeting_scheduled` | Meeting event (future) | `event` | TBD — calendar integration |
| `transcript_uploaded` | Meeting transcript (future) | `description` | File attachment with transcript tag |
| `file_shared` | Standalone file share (not comment attachment) | `folder` | TBD — may use ZB Files service |

### Phase 1 Activity Types (implementable now)
- `comment` — from `TaskApi.listComments()`
- `attachment` — from `TaskApi.listAttachments()`
- `proposal_submitted` — from Neon proposals data (already in engagement detail)
- `proposal_accepted` — from Neon proposals data

### Phase 2 Activity Types (after Tasks tab / Plan 017)
- `task_created`, `task_completed` — from sub-task lifecycle
- `status_change` — from engagement state machine

### Phase 3 Activity Types (future integrations)
- `meeting_scheduled`, `transcript_uploaded`, `file_shared`

---

## Data Model

```typescript
interface ActivityEvent {
  id: string;                          // unique key for tracking
  type: ActivityType;                  // discriminated union
  timestamp: Date;                     // when it happened
  actor: {                             // who did it
    name: string;
    imageUrl?: string;
    userId: string;
  };
  source: {                            // where it came from
    taskId?: string;                   // ZB task ID
    taskCode?: string;                 // e.g. "TASK-1234"
    label?: string;                    // e.g. "Phase 1: Gap Assessment"
  };
  payload: ActivityPayload;            // type-specific data
  expanded: boolean;                   // UI state — expanded or collapsed
}

// Discriminated payload types
type ActivityPayload =
  | { type: 'comment'; markdown: string; attachments: TaskAttachment[] }
  | { type: 'attachment'; file: TaskAttachment }
  | { type: 'status_change'; from: string; to: string }
  | { type: 'proposal_submitted'; providerName: string; proposedPrice?: number }
  | { type: 'proposal_accepted'; providerName: string }
  | { type: 'task_created'; taskName: string; taskCode: string }
  | { type: 'task_completed'; taskName: string; taskCode: string }
  | { type: 'meeting_scheduled'; title: string; scheduledAt: Date }
  | { type: 'transcript_uploaded'; title: string; fileId: string }
  | { type: 'file_shared'; fileName: string; fileId: string; mimeType: string };
```

---

## Timeline UX

### Layout: Alternating Left/Right

Events alternate sides of a central timeline spine — similar to a vertical timeline infographic. This isn't SMS-style alignment by user (as in Plan 016); instead it's purely visual alternation for readability and scannability.

```
                        │
   ┌────────────────┐   │
   │ Feb 20, 2:15p  │   │
   │ Clark           │   │
   │ ● Comment       │───┤
   │ "Updated scope  │   │
   │  document..."   │   │
   │ 📎 scope-v2.pdf │   │
   └────────────────┘   │
                        │
                        ├───┌────────────────┐
                        │   │ Feb 20, 10:00a │
                        │   │ System          │
                        │   │ ● Status Change │
                        │   │ Draft → Active  │
                        │   └────────────────┘
                        │
   ┌────────────────┐   │
   │ Feb 19, 4:30p  │   │
   │ Acme Consulting │   │
   │ ● Proposal      │───┤
   │ Submitted at    │   │
   │ $15,000         │   │
   └────────────────┘   │
                        │
                        ├───┌────────────────┐
                        │   │ Feb 18, 9:00a  │
                        │   │ Clark           │
                        │   │ ● Task Created  │
                        │   │ TASK-1002       │
                        │   │ "Gap Assessment"│
                        │   └────────────────┘
                        │
           ─ ─ ─ Load More ─ ─ ─
```

### Event Card Anatomy

Each card on the timeline contains:

```
┌─────────────────────────────────────┐
│ ● [Icon] [Activity Type Label]      │  ← type badge + icon
│ [Avatar] [Actor Name]  · [Time]     │  ← who + when
│ [Task Code Badge]                   │  ← source task (if sub-task)
│─────────────────────────────────────│
│ [Content / Summary]                 │  ← type-specific body
│ [Attachments / Links]               │  ← drill-down affordances
└─────────────────────────────────────┘
```

### Expand / Collapse

- **Latest 5 events:** expanded by default
- **Older events:** collapsed to a single-line summary
  - Shows: icon, type label, actor name, relative timestamp, first-line preview
  - Click to expand
- **Collapse all / Expand all** toggle at top

### Drill-Down

Each activity type has a drill-down action:

| Type | Drill-Down Action |
|------|-------------------|
| `comment` | Expand to show full markdown + attachments |
| `attachment` | Preview (images/PDF inline, others download) |
| `status_change` | No drill-down — info is self-contained |
| `proposal_submitted` | Link to proposal detail in Details tab |
| `proposal_accepted` | Link to accepted provider in Overview tab |
| `task_created` | Link to task in Tasks tab |
| `task_completed` | Link to task in Tasks tab |
| `meeting_scheduled` | Open meeting details (future) |
| `transcript_uploaded` | Preview/download transcript |
| `file_shared` | Preview/download file |

### Filtering

Optional filter bar at top of Activity Center:

- **By type:** checkboxes for each activity type (default: all)
- **By actor:** dropdown of participants
- **By date range:** date picker (start/end)
- **By task:** dropdown of master + sub-tasks (show task code)

Start without filters — add them when the timeline gets busy.

---

## Architecture

### New Files

| File | Type | Purpose |
|------|------|---------|
| `core/models/activity-event.model.ts` | Model | `ActivityEvent`, `ActivityPayload` types |
| `core/services/activity-feed.service.ts` | Service | Aggregates events from multiple sources, sorts by timestamp |
| `shared/components/activity-timeline/activity-timeline.component.ts` | Component | Main timeline with alternating layout |
| `shared/components/activity-timeline/activity-timeline.component.html` | Template | |
| `shared/components/activity-timeline/activity-timeline.component.scss` | Styles | Timeline spine, alternating cards, responsive |
| `shared/components/activity-event-card/activity-event-card.component.ts` | Component | Single event card with type-specific rendering |
| `shared/components/activity-event-card/activity-event-card.component.html` | Template | `@switch` on activity type for different layouts |
| `shared/components/activity-event-card/activity-event-card.component.scss` | Styles | Card styles, expand/collapse animation |
| `shared/components/activity-composer/activity-composer.component.ts` | Component | "+ Add Comment" (replaces message-composer from Plan 016) |
| `shared/components/activity-composer/activity-composer.component.html` | Template | |
| `shared/components/activity-composer/activity-composer.component.scss` | Styles | |

### Modified Files

| File | Change |
|------|--------|
| `engagement-detail.component.html` | Replace Messages tab → "Activity" tab with `<app-activity-timeline>` |
| `engagement-detail.component.html` | Remove Files tab (absorbed into Activity Center) |
| `engagement-detail.component.ts` | Add activity feed loading, lazy on tab select |

### Tab Structure After Implementation

| Tab | Content |
|-----|---------|
| Overview | Engagement summary, accepted provider, ZB integration IDs |
| Details | Description, budget, timeline, all proposals |
| Tasks | Master task + sub-tasks (Plan 017) |
| **Activity** | Unified timeline of all engagement events + comment composer |

The "Messages" and "Files" tabs merge into **Activity**. Messages are comments in the feed. Files are attachments visible on comment events and file-share events.

---

## Step-by-Step Implementation

### Step 1: Activity Event Model

Create `core/models/activity-event.model.ts` with the `ActivityEvent` interface and `ActivityPayload` discriminated union as defined in the Data Model section above.

### Step 2: ActivityFeedService

Create `core/services/activity-feed.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class ActivityFeedService {
  /**
   * Fetch and merge all activity events for an engagement.
   * Returns events sorted newest-first.
   */
  async getActivityFeed(engagement: EngagementDetailRow): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    // 1. Task comments → comment events
    if (engagement.zerobias_task_id) {
      const comments = await this.fetchTaskComments(engagement.zerobias_task_id);
      const attachments = await this.fetchTaskAttachments(engagement.zerobias_task_id);
      events.push(...this.mapCommentEvents(comments, attachments));
    }

    // 2. Proposals → proposal_submitted / proposal_accepted events
    events.push(...this.mapProposalEvents(engagement));

    // 3. Sub-task events (Phase 2, after Plan 017)
    // events.push(...await this.fetchSubTaskEvents(engagement));

    // Sort newest first
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Set initial expand state: latest 5 expanded
    events.forEach((e, i) => e.expanded = i < 5);

    return events;
  }
}
```

The service is the single aggregation point. As new activity types are added (meetings, transcripts, status changes), they plug in here as additional data sources.

### Step 3: ActivityEventCard Component

Renders a single event card. Uses `@switch (event.payload.type)` to render type-specific content:

- **comment:** Avatar, name, timestamp, markdown body (rendered via `marked`), attachment chips
- **attachment:** File icon, filename, size, preview/download buttons
- **proposal_submitted:** Provider name, proposed price, link to Details tab
- **proposal_accepted:** Provider name, congratulatory styling
- **task_created / task_completed:** Task code badge, task name, link to Tasks tab
- **status_change:** From → To with arrow icon

Inputs: `event: ActivityEvent`, `side: 'left' | 'right'`
Outputs: `drillDown: EventEmitter<ActivityEvent>`, `toggleExpand: EventEmitter<void>`

### Step 4: ActivityTimeline Component

The container that lays out event cards on alternating sides of a central spine.

Inputs:
- `events: ActivityEvent[]`
- `loading: boolean`

Behavior:
- Central vertical line (the "spine") using CSS `::before` pseudo-element
- Each event card positioned alternately left/right using `:nth-child(odd/even)`
- Dot/node on the spine at each event's position
- Collapsed events render as a compact single-line row spanning the full width (no left/right offset)
- "Load More" button at bottom if paginated
- Responsive: on narrow screens (`< 768px`), all cards stack left-aligned (no alternation)

### Step 5: ActivityComposer Component

Evolved from Plan 016's MessageComposer — posts a comment to a task, which then appears as a `comment` event in the timeline.

- "+ Add Comment" button at top of Activity tab
- Inline `<textarea>` with markdown support (upgrade to Milkdown later)
- Sub-task selector dropdown (hidden until sub-tasks exist, per Plan 017)
- On submit: post via `TaskApi.addComment()`, then prepend to events feed

### Step 6: Wire into Engagement Detail

- Rename "Messages" tab → **"Activity"**
- Remove "Files" tab (absorbed)
- Lazy-load activity feed on tab select
- Pass events to `<app-activity-timeline>`
- Handle `drillDown` events to navigate to other tabs (e.g., click proposal → switch to Details tab)

---

## Styling Guide

### Timeline Spine

```scss
.activity-timeline {
  position: relative;
  padding: 1rem 0;

  // Central spine
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--zb-divider);
    transform: translateX(-50%);
  }
}

.timeline-event {
  display: flex;
  width: 100%;
  margin-bottom: 1.5rem;

  &:nth-child(odd) {
    justify-content: flex-start;
    padding-right: calc(50% + 1.5rem);
  }

  &:nth-child(even) {
    justify-content: flex-end;
    padding-left: calc(50% + 1.5rem);
  }
}

// Responsive: stack left on narrow screens
@media (max-width: 768px) {
  .activity-timeline::before {
    left: 1rem;
  }

  .timeline-event,
  .timeline-event:nth-child(odd),
  .timeline-event:nth-child(even) {
    padding-left: 2.5rem;
    padding-right: 0;
    justify-content: flex-start;
  }
}
```

### Event Card Colors

| Type | Card Accent |
|------|-------------|
| `comment` | `--mat-sys-primary-container` (subtle primary) |
| `attachment` | `--mat-sys-secondary-container` |
| `status_change` | `--mat-sys-tertiary-container` |
| `proposal_*` | `--mat-sys-surface-variant` |
| `task_*` | `--mat-sys-surface-variant` |

Use left-border accent (3px solid) rather than full background color — keeps it clean.

### Timeline Node (dot on spine)

```scss
.timeline-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--mat-sys-primary);
  border: 2px solid var(--zb-background);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
```

---

## Relationship to Other Plans

### Plan 016 (Messages Tab) — Superseded

The Activity Center absorbs the Messages tab concept. Task comments become `comment` events in the timeline. The composer remains but is now the Activity Composer. The SMS-style left/right alignment by user is replaced by alternating visual layout.

### Plan 017 (Tasks Tab) — Complementary

The Tasks tab remains separate — it's the management view for creating/viewing sub-tasks. But task lifecycle events (created, completed, status changed) feed into the Activity Center as events. The two tabs are complementary:

- **Tasks tab:** "What needs to be done" (actionable)
- **Activity tab:** "What has happened" (historical)

---

## Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `marked` | Markdown → HTML rendering for comment bodies | **Install** (~40KB) |
| `@zerobias-com/platform-sdk` | TaskApi, TaskComment, TaskAttachment types | Already installed |
| `@zerobias-com/fileservice-sdk` | Attachment preview/download | Transitive dep — verify access |

---

## Open Questions

1. **Audit trail completeness** — Should we store activity events in Neon for a permanent record, or always reconstruct from ZB Tasks + Neon proposals at query time? Storing provides offline access and faster loads; reconstructing avoids data duplication.
2. **Status change events** — Currently no audit table tracks engagement status transitions. Options: (a) add `engagement_status_history` table in Neon, (b) derive from `updated_at` timestamps, (c) defer until needed.
3. **Meeting integration** — What calendar/meeting system? Google Calendar? ZB platform meetings? This determines the Phase 3 data source.
4. **Transcript format** — Plain text? Markdown? Will transcripts be auto-generated (Otter.ai, etc.) or manually uploaded?
5. **File sharing outside comments** — Is there a need for standalone file sharing (not attached to a comment)? Or are all files always attached to a task comment?
6. **Pagination strategy** — Load all events at once (fine for < 100), or paginated infinite scroll?

---

## Phased Delivery

### Phase 1: Core Activity Timeline (~5 hrs)
- ActivityEvent model
- ActivityFeedService (comments + proposals only)
- ActivityTimeline + ActivityEventCard components
- ActivityComposer (post comments)
- Wire into engagement-detail, rename tab
- `marked` for markdown rendering

### Phase 2: Task Events + Status History (~3 hrs, after Plan 017)
- Sub-task comment aggregation
- Task created/completed events
- Status change events (requires Neon audit table or derivation)

### Phase 3: Meetings + Transcripts + Files (~3 hrs, future)
- Meeting scheduled events
- Transcript upload and preview
- Standalone file sharing
- Activity type filters

### Phase 4: Polish (~2 hrs)
- Date range filtering
- Actor filtering
- Export activity log (PDF/CSV for compliance)
- Real-time updates (poll on tab focus or WebSocket)
