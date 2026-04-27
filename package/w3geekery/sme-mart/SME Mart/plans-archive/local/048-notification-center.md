# Plan 048: Notification Center

**Status:** Complete
**Estimate:** 8–12 hrs
**Created:** 2026-03-12

## Goal

Add an in-app notification center to SME Mart, modeled on the ZB UI `CardsService` / `zb-cards` pattern. Notifications are stored in Neon initially but follow the ZB platform Card model so migration to the real CardService is seamless.

## ZB UI Reference Architecture

**Source:** `~/Projects/zb/ui/projects/zb-ui-lib/src/lib/`

| ZB UI Component | SME Mart Equivalent | Notes |
|-----------------|---------------------|-------|
| `CardsService` (BehaviorSubject-based) | `NotificationService` (signal-based) | Same API shape, Angular signals instead of RxJS |
| `zb-cards` (popover panel) | `NotificationPanelComponent` | Bell icon + dropdown, same layout |
| `zb-card` (individual card) | `NotificationCardComponent` | Title/desc/severity/timestamp/expand |
| `@zerobias-com/cardservice-sdk` Card model | `Notification` interface | Mirror fields for migration |
| WebSocket handler | Polling initially | No WS infra in SME Mart yet |
| `CardEventType` enum | `NotificationEventType` enum | For cross-component navigation |

### ZB Card Model (target schema)
```typescript
Card {
  id, principalId, type, cardType, severity,
  read (Date|null), created, updated,
  source: string[],
  payload: { name, title, description, imageUrl, resourceId, id }
}
```

### ZB UI Patterns to Replicate
- Bell icon with `matBadge` (warn color, small, hidden when no unread)
- Popover: header ("Notifications" + close), type filter, card list with infinite scroll, footer (Mark All Read, Dismiss All)
- Card layout: prefix (type icon + severity), content (title bold-if-unread + desc), suffix (relative timestamp + expand chevron)
- Expansion: Dismiss button (if dismissable type) + Go button (if resourceId in payload)
- Immutable state updates (never mutate arrays)

## Neon Table Design

### `notifications` table
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  TEXT NOT NULL,           -- zerobias user ID
  type          TEXT NOT NULL,           -- 'bid_received', 'task_assigned', etc.
  card_type     TEXT NOT NULL DEFAULT 'notification', -- 'notification', 'alert', 'task'
  severity      TEXT NOT NULL DEFAULT 'info',         -- none, info, low, medium, high, critical
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  resource_id   TEXT,                    -- linked entity ID (engagement, bid, task, etc.)
  resource_type TEXT,                    -- 'engagement', 'bid', 'task', 'note', 'document'
  source        JSONB DEFAULT '[]',      -- source identifiers
  payload       JSONB DEFAULT '{}',      -- additional data
  read_at       TIMESTAMPTZ,
  dismissed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type);
```

**Migration path:** When ZB CardService is available, swap `NotificationService` data source from Neon → `cardClient.getCardApi()`. The `type`, `cardType`, `severity`, `payload` fields already match.

## Notification Types

| Type | Trigger | Severity | Resource |
|------|---------|----------|----------|
| `bid_received` | New bid on buyer's RFP | medium | bid |
| `bid_accepted` | Buyer accepts provider's bid | high | engagement |
| `bid_rejected` | Buyer rejects provider's bid | info | bid |
| `task_assigned` | Task assigned to user | medium | task |
| `task_status_changed` | Task status transition | info | task |
| `document_shared` | Document shared with engagement | info | document |
| `note_shared` | Note shared with user (Plan 047) | low | note |
| `engagement_created` | New engagement from accepted bid | high | engagement |
| `rfp_published` | New RFP published to marketplace | info | rfp |

## Phases

### Phase 1: Data Layer (1–2 hrs) — **Complete**
- [x] Create `notifications` table in Neon (via `run_sql_transaction`)
- [x] Create `Notification` model (`notification.model.ts`) mirroring ZB Card
- [x] Create `NotificationService` with signals (matches `CardsService` API)
  - `notifications = signal<Notification[]>([])`
  - `unreadCount = computed(() => ...)`
  - `loading = signal(false)`
  - Methods: `list()`, `markAsRead(id)`, `markAllAsRead()`, `dismiss(id)`, `dismissAll()`, `create()`
- [x] Add `NotificationEventType` enum for cross-component events

### Phase 2: Bell Icon + Panel UI (2–3 hrs) — **Complete**
- [x] `NotificationPanelComponent` — MatMenu popover attached to bell icon
  - Bell icon with `matBadge` in app toolbar (next to user dropdown)
  - MatMenu popover (consistent with codebase — no CDK overlay usage)
  - Header: "Notifications" label + unread count
  - Type filter: `mat-select` with notification types
  - Card list: scrollable (400px max-height)
  - Footer: "Mark All Read" + "Dismiss All" buttons
- [x] `NotificationCardComponent` — individual notification
  - Prefix: type icon (Material icon per type) + severity indicator bar
  - Content: title (bold if unread) + description (expand on click)
  - Suffix: relative timestamp + expand chevron
  - Expansion: Dismiss button + Go button (navigates to resource)
- [x] Add bell icon to app toolbar (`app-shell.component.html`)

### Phase 3: Navigation + Event System (1–2 hrs) — **Complete** (folded into Phase 2)
- [x] "Go" button navigation: route to resource based on `resource_type` + `resource_id`
  - `engagement` → `/engagements/:id`
  - `bid`/`rfp` → `/rfps/:id` (uses `parent_id` from payload)
  - `task` → `/engagements/:parentId#tasks`
  - `document` → `/engagements/:parentId#documents`
  - `note` → `/engagements/:parentId#notes`
- [x] `NotificationEvent` subject for cross-component communication
- [x] Auto-mark-as-read on "Go" navigation

### Phase 4: Notification Triggers (2–3 hrs) — **Complete**
- [x] Add fire-and-forget notification triggers to existing services:
  - `EngagementLifecycleService.acceptBid()` → `bid_accepted` + `engagement_created`
  - `BidsService.submitDraft()` → `bid_received` (optional context param)
  - `BidsService.rejectBid()` → `bid_rejected` (optional context param)
  - `WorkRequestsService.createRfp()` → `rfp_published` (self-confirmation to buyer)
  - `DocumentService` share → `document_shared` — **Deferred** (needs engagement participant lookup)
  - `EngagementTasksService` assign → `task_assigned` — **Deferred** (no assignee concept in current model)
- [x] Determine recipient(s) for each trigger (buyer vs provider)
- [x] All affected test specs updated with `NotificationService` mock provider

### Phase 5: Tests + Polish (2 hrs) — **Complete**
- [x] Unit tests for `NotificationService` (26 tests — CRUD, signals, filtering, polling)
- [x] Unit tests for `NotificationCardComponent` (14 tests — display, expand, navigate, relative time)
- [x] Unit tests for `NotificationPanelComponent` (16 tests — lifecycle, filtering, badge, actions)
- [x] Add to shared test-helpers: `makeNotification()` factory, `fakeNotificationService()` mock
- [x] 94 total tests passing across 6 spec files

## Architecture Decisions

1. **Signals over BehaviorSubject** — ZB UI uses RxJS BehaviorSubjects. SME Mart standardizes on Angular signals. Same reactivity, fewer imports.
2. **Neon-backed initially** — No CardService SDK available to SME Mart yet. Store in Neon via SmeMartDbService. Column names and payload shape match Card model for easy migration.
3. **No WebSocket** — ZB UI uses WebSocket for real-time push. SME Mart uses polling (30s interval) initially. When embedded in ZB portal, can receive card events via `postMessage`.
4. **Notification creation is in-process** — triggers call `NotificationService.create()` directly. When migrated to ZB platform, triggers would create Cards via CardService API (server-side).
5. **MatMenu for popover** — Codebase uses MatMenu for all dropdowns (no CDK overlay usage). Consistent pattern, built-in positioning and keyboard handling.

## Files

| File | Purpose |
|------|---------|
| `src/app/core/models/notification.model.ts` | Notification interface |
| `src/app/core/services/notification.service.ts` | CRUD + signals |
| `src/app/shared/components/notification-panel/` | Bell + dropdown panel |
| `src/app/shared/components/notification-card/` | Individual card |
| `src/app/test-helpers/factories.ts` | Add `makeNotification()` |
| `src/app/test-helpers/angular.ts` | Add `fakeNotificationService()` |
