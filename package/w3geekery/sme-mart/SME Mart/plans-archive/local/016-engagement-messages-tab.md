# Plan 016: Engagement | Messages Tab

**Status:** Deprecated
**Date:** 2026-02-19
**Deprecated:** 2026-02-25 — Superseded by Timeline view (Plan 018) which handles comments/messages inline via the TimelineComposer + TimelineEventCard components.
**Tab:** Transparency Center → Messages (replaces "Coming Soon" stub)

---

## Overview

Build a **Message Center** inside the Engagement Detail "Messages" tab that aggregates all ZeroBias Task comments for the master engagement task and any sub-tasks. The UX is modeled after smartphone SMS — owner messages align left, other users' messages align right — creating a dialog feel on a vertical timeline.

## Data Source

- **Master task:** `engagement.zerobias_task_id` → `TaskApi.listComments(taskUUID)`
- **Sub-tasks:** Future — once ZB Tasks supports parent/child, we'll also fetch child task comments and merge them into the timeline. For now, scope to the single master task.
- **Attachments:** `TaskApi.listAttachments(taskUUID)` → build `Map<commentId, TaskAttachment[]>` for inline display.

### SDK Types (already available via `@zerobias-com/platform-sdk`)

```typescript
TaskComment { id, taskId, personId, created, updated, person?: { name, emails[], imageUrl? },
              commentTxt?, commentMarkdown?, attachmentIds? }
TaskAttachment { id, commentId, fileVersionId, fileMetadata: { name?, size?, mimeType? }, created }
NewTaskComment { commentTxt?, commentMarkdown? }
```

### API Access Pattern

```typescript
const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
const taskUUID = this.clientApi.toUUID(engagement.zerobias_task_id);

// Read
const comments = await taskApi.listComments(taskUUID, page, pageSize, 'created:desc');
const attachments = await taskApi.listAttachments(taskUUID, page, pageSize);

// Write
await taskApi.addComment(taskUUID, { commentMarkdown: '...' });
```

---

## Architecture

### New Files

| File | Type | Purpose |
|------|------|---------|
| `shared/components/message-timeline/message-timeline.component.ts` | Component | Reusable timeline that renders comment bubbles |
| `shared/components/message-timeline/message-timeline.component.html` | Template | Timeline layout with left/right alignment |
| `shared/components/message-timeline/message-timeline.component.scss` | Styles | SMS-style bubbles, avatar positioning, collapse/expand |
| `shared/components/message-composer/message-composer.component.ts` | Component | "+ New Message" button → inline markdown editor + task selector |
| `shared/components/message-composer/message-composer.component.html` | Template | Editor UI |
| `shared/components/message-composer/message-composer.component.scss` | Styles | Editor styles |
| `core/services/task-comments.service.ts` | Service | Wraps TaskApi comment/attachment CRUD, handles pagination & caching |

### Modified Files

| File | Change |
|------|--------|
| `engagement-detail.component.html` | Replace Messages tab stub with `<app-message-timeline>` + `<app-message-composer>` |
| `engagement-detail.component.ts` | Add signals for comments, attachments; load on tab select (lazy) |

---

## Step-by-Step Implementation

### Step 1: TaskCommentsService

Create `core/services/task-comments.service.ts`:

- `listComments(taskId: string, page, pageSize): Promise<PagedResults<TaskComment>>` — sort `created:desc`
- `listAttachments(taskId: string): Promise<Map<string, TaskAttachment[]>>` — fetches all attachments, groups by `commentId`
- `addComment(taskId: string, markdown: string): Promise<TaskComment>`
- `deleteComment(taskId: string, commentId: string): Promise<void>`
- Inject `ZerobiasClientApiService` for SDK access

### Step 2: MessageTimeline Component

**Inputs:**
- `comments: TaskComment[]` — ordered newest-first
- `attachments: Map<string, TaskAttachment[]>` — keyed by comment ID
- `currentUserId: string` — to determine left vs right alignment
- `engagementOwnerId: string` — engagement buyer's ZB user ID

**Behavior:**
- Render as vertical timeline, newest at top
- Latest 3 comments: **expanded** by default
- Older comments: **collapsed** (show date, user avatar, first line preview; click to expand)
- Each comment bubble shows:
  - **Header:** user avatar (from `comment.person?.imageUrl`, fallback to initials), display name, date/time (relative, e.g. "2 hours ago"), task code badge (if from sub-task — future)
  - **Body:** `commentMarkdown` rendered as HTML (use `marked` library or Angular `innerHTML` with sanitization)
  - **Footer (when expanded):** attachment chips with download/preview icons
- **Alignment:**
  - `comment.personId === engagementOwnerId` → **align-left** (owner's messages)
  - All other users → **align-right** (dialog counterpart)

**Markdown Rendering Decision:**
The ZB UI uses Milkdown (`ng-milkdown` + `@milkdown/crepe`), but that's in `neverfail-lib` which isn't exported from `ngx-library`. Options:

| Option | Pros | Cons |
|--------|------|------|
| A. Install `marked` + `DomSanitizer` | Simple, lightweight, no ZB dependency | Different renderer than ZB UI |
| B. Install `ng-milkdown` directly | Matches ZB UI rendering | Heavy dependency, complex setup |
| C. Plain `<pre>` with basic formatting | Zero dependencies | Poor UX for rich content |

**Recommendation: Option A** — use `marked` for read-only rendering. It's lightweight (~40KB), widely used, and handles standard markdown well. We can swap to Milkdown later if `ngx-library` exports the viewer.

### Step 3: MessageComposer Component

**Inputs:**
- `taskId: string` — master engagement task ID
- `subTasks: { id: string; code: string }[]` — optional list of sub-task targets (future)

**Outputs:**
- `messageSent: EventEmitter<TaskComment>` — emitted after successful post

**Behavior:**
- "+ New Message" button at top of Messages tab
- Clicking opens an inline editor panel (slides down, not a dialog — keeps context visible)
- **Editor:** Start with a plain `<textarea>` with placeholder "Write a message... (Markdown supported)". Swap to Milkdown/ng-milkdown in a future iteration when `ngx-library` exports it.
- **Sub-task selector** (future): `<mat-select>` dropdown listing master task + any sub-tasks. Label shows task code. Default = master task. Hidden when no sub-tasks exist.
- **Actions:** "Send" (primary button) + "Cancel" (text button)
- On send: call `taskCommentsService.addComment(selectedTaskId, markdownText)`
- Clear editor and emit `messageSent` on success
- Show snackbar on error

### Step 4: Wire into Engagement Detail

In `engagement-detail.component.ts`:
- Add signals: `comments`, `attachments`, `commentsLoading`, `commentsLoaded`
- **Lazy load:** Only fetch comments when Messages tab is selected (`(selectedTabChange)` event on `mat-tab-group`)
- On `messageSent` event: prepend new comment to `comments` signal (optimistic, or re-fetch)
- Pass `currentUserId` and `engagement.buyer_zerobias_user_id` for alignment logic

In `engagement-detail.component.html`:
- Replace the `<zb-empty-state-container>` in Messages tab with:
```html
@if (!engagement()!.zerobias_task_id) {
  <zb-empty-state-container icon="chat" title="No Task Linked"
    description="Messages require a linked ZeroBias Task." />
} @else if (commentsLoading()) {
  <mat-spinner diameter="40" />
} @else {
  <app-message-composer
    [taskId]="engagement()!.zerobias_task_id!"
    (messageSent)="onMessageSent($event)" />
  @if (comments().length === 0) {
    <zb-empty-state-container icon="chat" title="No Messages Yet"
      description="Start a conversation about this engagement." />
  } @else {
    <app-message-timeline
      [comments]="comments()"
      [attachments]="attachmentMap()"
      [currentUserId]="currentUserId()!"
      [engagementOwnerId]="engagement()!.buyer_zerobias_user_id" />
  }
}
```

### Step 5: Attachment Preview/Download (Phase 2 enhancement)

- Each expanded comment with `attachmentIds` shows attachment chips
- Chip displays: file icon (by mime type), filename, size
- **Download:** use `FilesService.download(fileVersionId)` — need to confirm `@zerobias-com/fileservice-sdk` access pattern in Angular client
- **Preview:** open in overlay/dialog — images inline, PDFs in iframe, others download-only
- This step may need Kevin's input on `fileservice-sdk` availability in `ngx-library`/Angular client

### Step 6: Sub-Task Aggregation (Phase 3 — deferred)

- Requires ZB Tasks parent/child hierarchy API (may not exist yet — confirm with Kevin)
- If available: fetch child tasks of master task, then fetch comments for each
- Merge all comments into single timeline, add task code badge to each bubble
- Thread/nesting concept: explore later, may need ZB platform support first

---

## Styling Guide

### SMS-style Bubbles

```
┌─ Messages ─────────────────────────────────────────────┐
│                                                         │
│  [+ New Message]                                        │
│                                                         │
│  ┌──────────────────────────┐                           │
│  │ 🧑 Clark  · 2 min ago   │                           │  ← owner (left-aligned)
│  │ Here's the updated scope │                           │
│  │ document for review...   │                           │
│  │ 📎 scope-v2.pdf          │                           │
│  └──────────────────────────┘                           │
│                                                         │
│                    ┌──────────────────────────┐         │
│                    │ 👤 Provider  · 1 hr ago  │         │  ← other user (right-aligned)
│                    │ Looks good, I'll start   │         │
│                    │ on phase 1 Monday.       │         │
│                    └──────────────────────────┘         │
│                                                         │
│  ▸ Jan 15 · Clark · "Initial requirements..."  [+2]    │  ← collapsed older messages
│  ▸ Jan 14 · Provider · "Thanks for the intro..." [+1]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Colors
- Owner bubbles: light background matching app primary (subtle, not loud)
- Other user bubbles: slightly different hue or neutral gray
- Timestamps: muted text
- Task code badges: small chip/pill style
- Follow existing `styles.scss` theme variables

### Responsive
- On narrow screens, bubbles span full width (no left/right offset)
- Composer editor is full-width always

---

## Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `marked` | Markdown → HTML rendering | **Install** (~40KB) |
| `@zerobias-com/platform-sdk` | TaskApi, TaskComment types | Already installed |
| `@zerobias-com/fileservice-sdk` | Attachment download/preview | Transitive dep — verify access |

---

## Open Questions

1. **Sub-task hierarchy API** — Does ZB Tasks support listing child tasks of a parent? Need to confirm with Kevin before Step 6.
2. **Thread/nesting** — Clark mentioned exploring this. Likely needs ZB platform support first. Defer.
3. **Fileservice in Angular client** — Is `FilesService` accessible via `ZerobiasClientApiService`, or do we need a wrapper? Check SDK.
4. **Real-time updates** — No WebSocket/SSE for now. Manual refresh or poll on tab focus. Consider later.
5. **Markdown editor upgrade** — When `ngx-library` exports `auditmation-markdown-textarea`, swap the `<textarea>` for it.

---

## Estimated Effort

| Step | Description | Estimate |
|------|-------------|----------|
| 1 | TaskCommentsService | 0.5 hr |
| 2 | MessageTimeline component | 2 hrs |
| 3 | MessageComposer component | 1 hr |
| 4 | Wire into engagement-detail | 0.5 hr |
| 5 | Attachment preview/download | 1.5 hrs (may need Kevin) |
| **Total (Steps 1–4)** | **Core Messages Tab** | **~4 hrs** |
