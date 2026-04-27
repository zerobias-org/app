# Proposal 002: Schedule Sync — External PM Tool Integration

**Date:** 2026-02-26
**Author:** Clark (W3Geekery) + Claude
**For:** Brian (CEO), Kevin (CIO) — architecture review
**Status:** Draft / Discussion

---

## Summary

Customers already manage project schedules in tools like Jira, Monday.com, Asana, and Smartsheet. Rather than forcing them to re-enter milestones in SME Mart, we should let them **connect their existing PM tool** so engagement timelines stay in sync automatically.

This proposal covers:

1. **What integration methods exist** — iCal feeds, webhooks, REST APIs
2. **What to build in SME Mart** — a tiered sync engine starting simple
3. **How synced milestones appear** in the engagement timeline
4. **What the ZB platform provides** and where gaps exist

---

## The Problem

When a buyer accepts a proposal and an engagement begins, the buyer's project schedule lives in their PM tool — not in SME Mart. Today there's no way for SME Mart to know:

- When milestones are due
- When tasks slip or complete
- How the engagement timeline maps to the buyer's internal project plan

The provider (SME) is flying blind on the buyer's schedule, and the buyer has to manually communicate changes.

---

## Part 1: PM Tool Landscape

### Enterprise Compliance PM Tools

| Tool | Market Position | iCal Export | Webhooks | REST API |
|------|----------------|-------------|----------|----------|
| **Jira** | Enterprise standard | ICS native | Event webhooks | REST v3 |
| **Monday.com** | Growing in compliance | No native | Webhooks | GraphQL |
| **Asana** | Cross-functional PM | iCal URL | No webhooks | REST |
| **Smartsheet** | Resource planning | Calendar sub | Webhooks | REST |
| **Wrike** | Enterprise security | No | Webhooks | REST |
| **ClickUp** | Mid-market to enterprise | No native | Webhooks | REST |
| **Basecamp** | Smaller teams | iCal URL | No | REST |
| **MS Project** | Legacy enterprise | Via Outlook/Graph | Graph webhooks | MS Graph |

**Key insight:** No single integration method covers all tools. But iCal covers ~80%, and webhooks cover ~60%. Together they reach nearly everything.

---

## Part 2: Integration Architecture

### Tiered Approach

```
┌──────────────────────────────────────────────────────────┐
│                    Engagement Detail                      │
│                                                          │
│  Settings → Schedule Sync                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Import milestones from:                            │  │
│  │                                                    │  │
│  │  ○ iCal Feed URL        [paste URL here      ]    │  │
│  │  ○ Webhook               [copy this endpoint]     │  │
│  │  ○ Manual entry           (existing behavior)     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Connected: Jira (iCal) · Last sync: 2 hours ago        │
│  [Sync Now]  [Disconnect]                                │
└──────────────────────────────────────────────────────────┘
```

### Tier 1: iCal Feed Subscription (Build First)

**Why start here:**
- Works with ~80% of PM tools out of the box
- Zero API keys — customer just pastes a URL
- Read-only by design (safe, no write access to their system)
- Industry standard (RFC 5545) — no vendor lock-in
- Lowest friction for the customer

**How it works:**

```
Customer's PM Tool                    SME Mart
─────────────────                    ─────────
Jira / Asana / etc.
  │
  │ iCal URL
  │ (e.g. https://asana.com/
  │  ical/project/12345)
  │
  └──────────────────────────────► Stored per engagement
                                     │
                                     │ Poll every 4 hours
                                     │ (or on-demand "Sync Now")
                                     ▼
                                   Parse VEVENT / VTODO
                                     │
                                     ▼
                                   Upsert into
                                   engagement_milestones
                                   (source = 'ical')
                                     │
                                     ▼
                                   Appear in timeline
                                   as synced markers
```

**iCal data we can extract:**

| iCal Property | Maps To | Example |
|---------------|---------|---------|
| `SUMMARY` | Milestone title | "Draft SOC 2 Report" |
| `DTSTART` / `DTEND` | Due date range | 2026-03-15 |
| `DUE` (VTODO) | Deadline | 2026-03-15 |
| `STATUS` | Milestone status | `IN-PROCESS`, `COMPLETED`, `CANCELLED` |
| `PERCENT-COMPLETE` | Progress | 50 |
| `DESCRIPTION` | Notes | "Evidence collection phase" |
| `UID` | External ID (for upsert) | `task-123@jira.atlassian.com` |

**Polling strategy:**
- Default: every 4 hours
- On-demand: "Sync Now" button in UI
- Smarter: compare `Last-Modified` / `ETag` headers before full parse
- Store `last_synced_at` per connection

### Tier 2: Inbound Webhooks (Add for Real-Time)

**Why add this:**
- <5 second latency (vs 4-24 hours for iCal)
- Covers tools without iCal export (Monday.com, Wrike, ClickUp)
- Push model — no polling overhead

**How it works:**

```
SME Mart generates per-engagement webhook URL:
  https://app.zerobias.com/api/webhooks/schedule/{engagementId}/{secret}

Customer registers this URL in their PM tool:
  Jira → Webhooks → Add → task:created, task:updated, task:deleted
  Monday.com → Integrations → Webhooks → POST to URL

SME Mart receives vendor-specific payload → normalizes → upserts milestone
```

**Normalized event schema:**

```typescript
interface ScheduleWebhookEvent {
  source: 'jira' | 'monday' | 'clickup' | 'wrike' | 'smartsheet' | 'custom';
  eventType: 'created' | 'updated' | 'completed' | 'deleted';
  externalId: string;        // vendor's task/milestone ID
  title: string;
  dueDate?: string;          // ISO 8601
  startDate?: string;        // ISO 8601
  status?: string;           // normalized to: pending | in_progress | completed | cancelled
  percentComplete?: number;  // 0-100
  assignee?: string;         // display name
  description?: string;
  raw?: unknown;             // preserve original payload for debugging
}
```

**Vendor detection:** Inspect request headers or URL path segment to identify source tool. Jira sends `X-Atlassian-Webhook-Identifier`, Monday sends specific payload shape, etc.

**Security:**
- Secret token in URL path (not guessable)
- HMAC signature verification where vendors support it (Jira, Smartsheet)
- Rate limiting per endpoint
- Payload size limit (reject > 1MB)

### Tier 3: Direct API Connectors (Future / Nice-to-Have)

For tools where the customer wants deeper sync (two-way, status updates back to PM tool), a direct API connector could use OAuth or API keys. This is significantly more work and carries security liability (storing credentials). Defer unless there's clear demand.

**Alternative:** Recommend customers use Zapier / Make / n8n to bridge their PM tool to SME Mart's webhook endpoint. Zero custom integration work for us.

---

## Part 3: Data Model (Aligned with `hydra.cron`)

> **Design principle:** Mirror the ZB platform's `hydra.cron` table schema so that when Kevin exposes it, migrating SME Mart cron rows into the platform requires minimal code changes.

### Platform Reference: `hydra.cron` Schema

```sql
-- PLATFORM (read-only reference — this is what we're mirroring)
CREATE TABLE hydra.cron (
    id          uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id    uuid NOT NULL,              -- who owns this cron entry
    type        text NOT NULL,              -- event type key for routing
    cron        text NOT NULL,              -- UTC cron expression
    external_id text,                       -- scheduler's job ID
    data        jsonb,                      -- arbitrary payload (routing, config)
    created     timestamp NOT NULL,
    updated     timestamp NOT NULL,
    enabled     boolean DEFAULT true NOT NULL,
    deleted     timestamp                   -- soft delete
);
```

**Key patterns from CronDAO:**
- `create` → insert + `schedule()` (register with scheduler)
- `update` → update + reschedule (cancel old, schedule new)
- `delete` → soft delete (`deleted` timestamp) + `cancel()`
- `enable`/`disable` → toggle `enabled` + schedule/cancel
- `listByOwnerAndType(ownerId, type)` — primary query pattern
- `listByTypeAndDataField(type, key, value)` — query by jsonb payload field
- `setExternalId(id, externalId)` — store scheduler's job reference

### New Table: `sme_cron` (mirrors `hydra.cron`)

```sql
CREATE TABLE sme_cron (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL,                -- ZB user ID who created
  type        TEXT NOT NULL,                -- 'ical_poll' | 'webhook_keepalive' | 'reminder' | 'report'
  cron        TEXT NOT NULL,                -- UTC cron expression (e.g. '0 */4 * * *')
  external_id TEXT,                         -- pg_cron jobid or future platform cron ID
  data        JSONB,                        -- type-specific payload (see below)
  created     TIMESTAMP NOT NULL DEFAULT now(),
  updated     TIMESTAMP NOT NULL DEFAULT now(),
  enabled     BOOLEAN NOT NULL DEFAULT true,
  deleted     TIMESTAMP                     -- soft delete (null = active)
);

-- Same query patterns as hydra.cron
CREATE INDEX idx_sme_cron_owner_type ON sme_cron(owner_id, type) WHERE deleted IS NULL;
CREATE INDEX idx_sme_cron_type ON sme_cron(type) WHERE deleted IS NULL AND enabled = true;
CREATE INDEX idx_sme_cron_data ON sme_cron USING gin(data) WHERE deleted IS NULL;
```

**`type` values and their `data` payloads:**

| type | data payload | description |
|------|-------------|-------------|
| `ical_poll` | `{ "engagementId": "uuid", "icalUrl": "https://...", "lastEtag": "..." }` | Poll an iCal feed URL |
| `webhook_keepalive` | `{ "engagementId": "uuid", "webhookSource": "jira" }` | Verify webhook endpoint is live |
| `reminder` | `{ "engagementId": "uuid", "milestoneId": "uuid", "daysBefore": 3 }` | Notify before milestone due date |
| `report` | `{ "engagementId": "uuid", "reportType": "weekly_status" }` | Generate periodic reports |

### New Table: `sme_cron_runs` (execution history)

```sql
CREATE TABLE sme_cron_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_id     UUID NOT NULL REFERENCES sme_cron(id),
  started_at  TIMESTAMP NOT NULL DEFAULT now(),
  finished_at TIMESTAMP,
  status      TEXT NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'error'
  result      JSONB,                           -- { "milestones_synced": 5, "errors": [] }
  error       TEXT
);

CREATE INDEX idx_sme_cron_runs_cron ON sme_cron_runs(cron_id, started_at DESC);
```

### Extended: `engagement_milestones` (from Proposal 001)

Add columns to the milestones table proposed in 001:

```sql
-- Add to engagement_milestones:
  source          VARCHAR(20) DEFAULT 'manual',  -- 'manual' | 'ical' | 'webhook'
  external_id     VARCHAR(255),                   -- UID from iCal or vendor task ID
  external_url    TEXT,                            -- deep link back to PM tool
  cron_id         UUID REFERENCES sme_cron(id),   -- which cron job syncs this
  percent_complete INTEGER DEFAULT 0,             -- 0-100, from external source
  last_synced_at  TIMESTAMPTZ,

CREATE UNIQUE INDEX idx_milestones_external
  ON engagement_milestones(cron_id, external_id)
  WHERE external_id IS NOT NULL;
```

The unique index on `(cron_id, external_id)` enables upsert logic — when a sync runs, milestones are matched by their external ID and updated rather than duplicated.

### Angular Service: `CronService` (mirrors CronDAO)

```typescript
// cron.service.ts — follows CronDAO method signatures for future portability
@Injectable({ providedIn: 'root' })
export class CronService {
  // --- CRUD (Neon via DataProducer) ---
  create(cron: SmeCron): Observable<SmeCron>                     // insert + register with executor
  update(cron: SmeCron): Observable<SmeCron>                     // update + reschedule
  delete(id: string): Observable<void>                           // soft delete (set deleted timestamp) + cancel
  enable(id: string): Observable<SmeCron>                        // set enabled=true + register
  disable(id: string): Observable<SmeCron>                       // set enabled=false + cancel

  // --- Query (same patterns as CronDAO) ---
  listByOwnerAndType(ownerId: string, type: string): Observable<SmeCron[]>
  listByTypeAndDataField(type: string, key: string, value: string): Observable<SmeCron[]>

  // --- Execution ---
  runNow(id: string): Observable<SmeCronRun>                     // manually trigger a cron job
  getRunHistory(cronId: string, limit?: number): Observable<SmeCronRun[]>
}
```

### Schedule Builder Utility (mirrors `cronUtil.ts`)

```typescript
// cron-expression.util.ts — same pattern as platform's cronUtil.ts
export interface SmeCronSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  executionTime: string;       // "HH:MM" (user's local time)
  timezone: string;            // IANA timezone ID (e.g. 'America/Los_Angeles')
  dayOfWeek?: string;          // for weekly: 'monday' | 'tuesday' | ...
  dayOfMonth?: number;         // for monthly/yearly: 1-31
  monthOfYear?: string;        // for yearly: 'january' | 'february' | ...
}

// Converts user-friendly schedule → UTC cron expression
// Uses luxon (already in project) instead of @js-joda for timezone conversion
export function buildCronExpression(schedule: SmeCronSchedule): string { ... }
```

**Why mirror the platform's approach:**
- Same field names (`executionTime`, `timezone`, `frequency`, `dayOfWeek`, `dayOfMonth`, `monthOfYear`)
- Same conversion logic (user's local time → UTC cron expression)
- When Kevin exposes `hydra.cron`, this utility can be replaced with the SDK's `Schedule` type directly

### Sync Logic (Pseudocode)

```typescript
async syncIcalFeed(cronEntry: SmeCron): Promise<SmeCronRun> {
  const run = await this.cronRunService.start(cronEntry.id);
  try {
    const { icalUrl, lastEtag } = cronEntry.data;
    const response = await fetch(icalUrl, {
      headers: lastEtag ? { 'If-None-Match': lastEtag } : {}
    });

    if (response.status === 304) {
      return this.cronRunService.finish(run.id, 'success', { skipped: true });
    }

    const events = parseIcal(await response.text());

    for (const event of events) {
      await upsertMilestone({
        engagementId: cronEntry.data.engagementId,
        cronId: cronEntry.id,
        source: 'ical',
        externalId: event.uid,
        title: event.summary,
        dueDate: event.dtstart || event.due,
        status: mapIcalStatus(event.status),
        percentComplete: event.percentComplete ?? 0,
        description: event.description,
      });
    }

    // Soft-delete milestones removed from feed
    await markRemovedMilestones(cronEntry.id, events.map(e => e.uid));

    // Update ETag for next poll
    const newEtag = response.headers.get('ETag');
    if (newEtag) {
      await this.cronService.update({
        ...cronEntry,
        data: { ...cronEntry.data, lastEtag: newEtag }
      });
    }

    return this.cronRunService.finish(run.id, 'success', {
      milestones_synced: events.length
    });
  } catch (error) {
    return this.cronRunService.finish(run.id, 'error', null, error.message);
  }
}
```

### Migration Path: `sme_cron` → `hydra.cron`

When the platform exposes cron scheduling:

1. **Schema compatibility** — `sme_cron` columns map 1:1 to `hydra.cron` (id, owner_id, type, cron, external_id, data, enabled, created, updated, deleted)
2. **Migrate rows** — `INSERT INTO hydra.cron SELECT * FROM sme_cron WHERE deleted IS NULL`
3. **Swap service** — Replace `CronService` (Neon SQL) with SDK's `CronDAO` calls. Method names already match.
4. **Drop `sme_cron`** — Once all rows are migrated and the platform handles execution

---

## Part 4: Timeline Integration

Synced milestones appear in the engagement timeline alongside native events, but are visually distinct:

```
──────────────────────────────────────────────────
│ Mar 15 ─── ◆ MILESTONE (synced from Jira)       ← blue "synced" badge
│            "Draft SOC 2 Report"
│            Due: Mar 15 │ Progress: 50%
│            🔗 View in Jira                       ← deep link
│
│ Mar 10 ─── ● Clark posted a comment              ← native event
│            "Starting evidence collection..."
│
│ Mar 1  ─── ◆ MILESTONE (manual)                  ← no badge
│            "Kickoff Meeting" ✓ Completed Feb 28
│
│ Feb 25 ─── ◇ MILESTONE (synced from Jira)        ← overdue indicator
│            "Scoping Document" ⚠ Overdue by 3 days
│            🔗 View in Jira
```

**Visual distinctions:**
- **Manual milestones:** Standard milestone icon, full edit controls
- **Synced milestones:** "Synced from {tool}" badge, read-only, deep link to source, progress bar if available
- **Overdue synced milestones:** Warning indicator (same as manual overdue)

**Filter integration:** Timeline filter chips (from Plan 018) get a "Milestones" chip. Synced and manual milestones are both included. A sub-filter could distinguish source if needed.

---

## Part 5: ZB Platform Assessment

### What the platform provides today

| Capability | Status | Notes |
|-----------|--------|-------|
| **Pipeline cron scheduling** | Exists | Designed for data collection bots, not calendar events |
| **Alert Bot triggers** | Exists | Cron + change events with JSONata conditions |
| **Activity Triggers** | Exists | Auto-create tasks on business events |
| **HTTP Notification Endpoints** | Schema exists | Used for CRM (Salesforce/Zoho) onboarding |
| **Change events on all CRUD** | Exists | AWS SQS-based event architecture |

### What the platform does NOT provide

| Gap | Impact | Workaround |
|-----|--------|------------|
| No task due dates | Can't use ZB Tasks for milestone dates | Neon `engagement_milestones` table |
| No outbound webhooks | Can't push schedule changes to external tools | Future: two-way sync is Tier 3 |
| No calendar protocol support | No iCal/CalDAV server | SME Mart handles iCal parsing client-side |
| No reminder/escalation system | No "notify 3 days before due" | Client-side banner on page load |

### Platform feature requests (additions to Plan 025)

| FR | Request | Priority |
|----|---------|----------|
| FR-007 | Task `dueDate` field | Medium — would let synced milestones live as ZB Tasks instead of Neon |
| FR-008 | Outbound webhook delivery | Low — would enable two-way PM sync |

---

## Part 6: Cron Execution Strategy

Since SME Mart is a **client-side Angular app** (no backend server), cron job execution needs creative solutions. The `sme_cron` table stores the schedule definitions, but something must _execute_ them.

### Execution Options

#### Option A: Client-Side Lazy Execution (MVP)

When a user opens an engagement, check if any `sme_cron` entries for that engagement are due:

```typescript
// engagement-detail.component.ts
const crons = await this.cronService.listByTypeAndDataField(
  'ical_poll', 'engagementId', engagementId
);
for (const cron of crons) {
  if (cron.enabled && isDue(cron)) {
    await this.icalSyncService.syncIcalFeed(cron);
  }
}
```

`isDue()` checks the last run in `sme_cron_runs` against the cron expression. If the interval has elapsed, it fires.

**Pros:** No server needed, works immediately, mirrors the CronDAO `enabled` check pattern
**Cons:** Only fires when someone visits the page, CORS issues with some iCal URLs

#### Option B: Neon `pg_cron` (Background Execution)

Neon supports the `pg_cron` extension on all tiers. Register SQL-based jobs that query `sme_cron` and execute sync logic:

```sql
-- Enable pg_cron (one-time, via Neon API or console)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Master dispatcher: runs every hour, finds due cron entries
SELECT cron.schedule('sme-cron-dispatcher', '0 * * * *', $$
  INSERT INTO sme_cron_runs (cron_id, status)
  SELECT id, 'pending'
  FROM sme_cron
  WHERE enabled = true
    AND deleted IS NULL
    AND (
      -- Check if this entry is due based on its cron expression
      -- pg_cron can't evaluate arbitrary cron expressions, so we use
      -- a simpler approach: check last run time vs interval
      NOT EXISTS (
        SELECT 1 FROM sme_cron_runs r
        WHERE r.cron_id = sme_cron.id
          AND r.started_at > now() - interval '4 hours'
      )
    );
$$);
```

**Caveat:** pg_cron only runs when Neon compute is **active**. On the free tier with scale-to-zero (5 min idle), jobs won't fire when nobody is using the app. This is acceptable for MVP — the customer is likely to visit the engagement page within hours anyway, and Option A catches up on missed runs.

**Pros:** True background execution when compute is active, no Vercel dependency
**Cons:** Scale-to-zero gaps on free tier, SQL-only execution (can't fetch HTTP)

#### Option C: Vercel Cron (Reliable Background)

Vercel supports cron jobs (1/day free, more on paid). A serverless function queries `sme_cron` for due entries and executes them:

```json
{
  "crons": [{
    "path": "/api/cron/dispatch",
    "schedule": "0 */4 * * *"
  }]
}
```

The API route:
1. Queries `sme_cron WHERE enabled = true AND deleted IS NULL AND type = 'ical_poll'`
2. For each due entry, fetches the iCal URL and upserts milestones
3. Records results in `sme_cron_runs`

**Pros:** Reliable, HTTP-capable (can fetch iCal URLs directly)
**Cons:** Tied to Vercel, limited frequency on free tier

#### Option D: Platform `hydra.cron` Integration (Endgame)

When Kevin exposes the `hydra.cron` table:
1. Migrate `sme_cron` rows → `hydra.cron` entries
2. Register a CronEventHandler that routes `ical_poll` events to the Hub Module
3. The Hub Module's `/schedule/sync` endpoint does the actual iCal fetch + upsert
4. Full platform-native cron — no Neon pg_cron or Vercel needed

**Pros:** Platform-native, uses the same scheduler, CronEvent routing, and CronDAO patterns
**Cons:** Requires both exposed cron table AND custom Hub Module

### Recommended Progression

```
Dev/Demo (now)     → MVP (in-app)       → Deployed           → Endgame
──────────────────────────────────────────────────────────────────────────
Option E           → Option A            → Option C           → Option D
(launchd + ngrok)    (client-side lazy)    (Vercel cron)        (hydra.cron)
                                           + Option B if
                                             Neon stays on
```

**Why this order:**
- Option E gets cron running immediately on your machine for dev/demo. ngrok bridges to Vercel for one-off demos.
- Option A embeds lazy sync into the app itself (page-load triggered), no external dependencies
- Option C adds reliability once the feature is proven and deployed
- Option B (pg_cron) is a bonus if Neon compute stays active (paid tier or always-on)
- Option D is the migration target — and because `sme_cron` mirrors `hydra.cron`, the migration is a table copy + service swap

#### Option E: Local Cron Dispatcher via macOS `launchd` (Dev/Demo)

A Bun script on your machine dispatches `sme_cron` entries on a schedule. For demos with Vercel-deployed SME Mart, spin up a one-time ngrok session so the app can call the local dispatcher.

**`scripts/cron-dispatcher.ts`** (Bun script):

```typescript
#!/usr/bin/env bun
// Connects directly to Neon, queries sme_cron for due entries, executes them.
// Runs as a macOS launchd job or crontab entry.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface SmeCron {
  id: string;
  type: string;
  cron: string;
  data: Record<string, unknown>;
  enabled: boolean;
}

async function dispatch() {
  console.log(`[${new Date().toISOString()}] Checking sme_cron...`);

  // Find enabled cron entries that haven't run in the last 4 hours
  const due = await sql`
    SELECT c.* FROM sme_cron c
    WHERE c.enabled = true
      AND c.deleted IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM sme_cron_runs r
        WHERE r.cron_id = c.id
          AND r.started_at > now() - interval '4 hours'
          AND r.status = 'success'
      )
  ` as SmeCron[];

  console.log(`  Found ${due.length} due entries`);

  for (const cron of due) {
    const [run] = await sql`
      INSERT INTO sme_cron_runs (cron_id, status)
      VALUES (${cron.id}, 'running')
      RETURNING *
    `;

    try {
      if (cron.type === 'ical_poll') {
        await syncIcal(cron, sql);
      }
      // Add other type handlers here (reminder, report, etc.)

      await sql`
        UPDATE sme_cron_runs
        SET status = 'success', finished_at = now()
        WHERE id = ${run.id}
      `;
      console.log(`  ✓ ${cron.type} [${cron.id.slice(0, 8)}]`);
    } catch (err: any) {
      await sql`
        UPDATE sme_cron_runs
        SET status = 'error', finished_at = now(), error = ${err.message}
        WHERE id = ${run.id}
      `;
      console.error(`  ✗ ${cron.type} [${cron.id.slice(0, 8)}]: ${err.message}`);
    }
  }
}

async function syncIcal(cron: SmeCron, sql: any) {
  const { icalUrl, engagementId, lastEtag } = cron.data as any;
  const headers: Record<string, string> = {};
  if (lastEtag) headers['If-None-Match'] = lastEtag;

  const res = await fetch(icalUrl, { headers });
  if (res.status === 304) return; // unchanged

  const text = await res.text();
  // TODO: parse iCal (VEVENT/VTODO) and upsert into engagement_milestones
  // For now, just log
  console.log(`    Fetched ${text.length} bytes from ${icalUrl}`);

  // Update ETag
  const newEtag = res.headers.get('ETag');
  if (newEtag) {
    await sql`
      UPDATE sme_cron SET data = data || ${JSON.stringify({ lastEtag: newEtag })}::jsonb,
                          updated = now()
      WHERE id = ${cron.id}
    `;
  }
}

dispatch().catch(console.error);
```

**macOS `launchd` plist** (`~/Library/LaunchAgents/com.w3geekery.sme-cron.plist`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.w3geekery.sme-cron</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/cstacer/.bun/bin/bun</string>
    <string>run</string>
    <string>/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/scripts/cron-dispatcher.ts</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>DATABASE_URL</key>
    <string>postgresql://neondb_owner:PASSWORD@ep-aged-fog-af9wu771.us-west-2.aws.neon.tech/neondb?sslmode=require</string>
  </dict>
  <key>StartInterval</key>
  <integer>14400</integer><!-- every 4 hours (seconds) -->
  <key>StandardOutPath</key>
  <string>/tmp/sme-cron.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/sme-cron.err</string>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

**Setup commands:**

```bash
# Load the job (starts immediately + every 4 hours)
launchctl load ~/Library/LaunchAgents/com.w3geekery.sme-cron.plist

# Manual test run
bun run scripts/cron-dispatcher.ts

# Check logs
tail -f /tmp/sme-cron.log

# Unload when done
launchctl unload ~/Library/LaunchAgents/com.w3geekery.sme-cron.plist
```

**For Vercel demo with ngrok:**

```bash
# Start ngrok pointing to local dispatcher (one-time session)
ngrok http 3333  # or whatever port a small HTTP wrapper listens on

# Give the ngrok URL to the Vercel-deployed app as CRON_DISPATCHER_URL
# The app's "Sync Now" button POSTs to this URL instead of running client-side
```

**Pros:** Works immediately, no cloud dependencies, full control, easy to debug
**Cons:** Only runs on your machine, not suitable for production

---

### CORS Proxy for iCal URLs

Client-side iCal fetch will hit CORS on many PM tools. Solutions:
- **Vercel Edge Middleware** — add a `/api/proxy/ical?url=...` route (already have proxy infra for ZB API)
- **Future Hub Module** — proxy through the Hub Module endpoint
- **Workaround:** Some tools provide CORS-friendly URLs or allow origin whitelisting

---

## Part 7: Implementation Roadmap

### Phase 1: Cron Infrastructure + Manual Milestones (Near-Term)

| Item | Effort | Depends On |
|------|--------|------------|
| Create `sme_cron` table in Neon (mirrors `hydra.cron`) | Low | — |
| Create `sme_cron_runs` table in Neon | Low | — |
| Create `engagement_milestones` table in Neon | Low | — |
| `CronService` with CRUD + enable/disable (mirrors CronDAO) | Medium | sme_cron table |
| `buildCronExpression()` utility (mirrors cronUtil.ts) | Low | — |
| Milestone CRUD UI in engagement detail | Medium | milestones table |
| Milestone markers in timeline | Low | milestones table |

### Phase 2: iCal Sync + Client-Side Execution (Near-Term)

| Item | Effort | Depends On |
|------|--------|------------|
| iCal URL input → creates `sme_cron` entry (type `ical_poll`) | Medium | Phase 1 |
| Client-side lazy execution (Option A) | Medium | CronService |
| iCal proxy endpoint (CORS) | Low | Vercel middleware |
| "Synced from {tool}" badge in timeline | Low | iCal sync |
| Sync status UI (last run, error state, run history) | Low | sme_cron_runs table |
| Client-side "due soon" / overdue banners | Low | milestones table |

### Phase 3: Webhooks + Background Execution (Medium-Term)

| Item | Effort | Depends On |
|------|--------|------------|
| Webhook endpoint (`/api/webhooks/schedule/{id}/{secret}`) | Medium | sme_cron table |
| Vendor payload normalizer (Jira, Monday, ClickUp) | Medium | webhook endpoint |
| Vercel cron dispatcher (Option C) | Low | Phase 2 complete |
| Neon pg_cron dispatcher (Option B, if paid tier) | Low | Phase 2 complete |
| Reminder cron type (`daysBefore` milestone notifications) | Medium | milestones + sme_cron |

### Phase 4: Platform Migration (Future)

| Item | Effort | Depends On |
|------|--------|------------|
| Migrate `sme_cron` → `hydra.cron` (row copy) | Low | Kevin exposes cron table |
| Replace `CronService` with SDK CronDAO calls | Low | Platform SDK update |
| Hub Module `/schedule/sync` endpoint | Medium | Custom Hub Module |
| OAuth flows for direct PM API access | High | Clear demand |
| Two-way sync (write back to PM tools) | High | OAuth + outbound webhooks |
| Milestone templates ("SOC 2 Audit" preset phases) | Medium | Phase 2 complete |

---

## Decision Points

**Decision 1:** iCal-first or webhook-first?
- **Recommendation:** iCal first. Higher coverage (~80%), lower customer friction (paste a URL vs configure webhook), and works as client-side MVP without a server component.

**Decision 2:** Where does milestone data live — Neon or ZB Tasks?
- **Recommendation:** Neon (via `engagement_milestones`). ZB Tasks lack `dueDate`. If FR-007 ships, we can migrate milestone data into ZB Tasks and get platform-level visibility for free.

**Decision 3:** Cron execution — client-side, pg_cron, Vercel, or platform?
- **Recommendation:** Client-side lazy execution (Option A) first. It validates the feature with zero infrastructure. Graduate to Vercel cron (Option C) for reliability, then platform `hydra.cron` (Option D) as the endgame. The `sme_cron` table design ensures each migration is a service swap, not a rewrite.

**Decision 4:** Should we support two-way sync (write back to PM tools)?
- **Recommendation:** Defer. Read-only sync is 90% of the value. Two-way adds OAuth complexity, credential storage liability, and vendor-specific write APIs. Revisit if customers request it.

**Decision 5:** Neon pg_cron — worth enabling now?
- **Recommendation:** Not on free tier. Scale-to-zero means jobs won't fire when idle. If Brian upgrades to a paid plan (always-on compute), pg_cron becomes viable for background dispatch alongside Vercel cron. The `sme_cron` table is ready for either executor.

---

## Open Questions for Kevin

1. **`hydra.cron` exposure timeline** — We've modeled `sme_cron` after `hydra.cron`. When the platform exposes it, we want to migrate rows directly. Any ETA or blocker?
2. **CronEvent routing** — Could SME Mart register a CronEventHandler for custom cron types (e.g. `ical_poll`)? Or would we need a Hub Module to receive CronEvents?
3. **Pipeline extensibility** — Could SME Mart register a custom Pipeline job for iCal polling? Or is Pipeline strictly for connector bots?
4. **HTTP Notification Endpoints** — The outbound webhook schema exists. Is there a plan to implement outbound event delivery? Would solve two-way sync without custom code per vendor.
5. **Task `dueDate`** — Any plans to add a native due date field to ZB Tasks? This is the most impactful single feature for schedule-aware engagements (FR-007).

---

*This proposal builds on Proposal 001 (milestones) and extends it with external schedule awareness. The `sme_cron` table is intentionally designed as a portable mirror of `hydra.cron` — same columns, same query patterns, same lifecycle (create/enable/disable/soft-delete) — so that migration to the platform's cron system is a row copy and a service swap, not a rewrite.*
