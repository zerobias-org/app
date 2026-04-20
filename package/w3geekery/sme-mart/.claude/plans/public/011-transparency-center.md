# Transparency Center

**Status:** Planning
**Created:** 2026-02-06
**Author:** Clark
**Source:** CEO Vision (2026-02-06) + Engagement Gaps Analysis

---

## Executive Summary

The Transparency Center is the central "meeting place" for buyers and providers during an engagement. It aggregates all engagement-related data from the ZeroBias platform using **Tags** as the unifying mechanism, presenting role-appropriate views to each party.

**Key Innovation:** Instead of building a separate messaging/tracking system, we leverage ZeroBias's existing Tag and resourceSearch capabilities to aggregate Tasks, comments, files, and other assets into a unified engagement view.

---

## Architecture Decision: Boundaries

> **IMPORTANT:** SME Mart does NOT manage ZeroBias Boundaries.
>
> - Boundary creation, member invitations, and access management happen in **ZeroBias Platform**
> - SME Mart only **reads** boundaries the user already has access to
> - Engagements **require** a boundary - provider must be added in ZB Platform first
> - See [Plan 010](./local/010-zerobias-boundary-integration.md) for details

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRANSPARENCY CENTER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  1. PROVIDER     │  │  2. SHARED       │  │  3. BUYER                │   │
│  │     INTERNAL TC  │  │     TC           │  │     REQUIREMENTS TC      │   │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────────────┤   │
│  │                  │  │                  │  │                          │   │
│  │ Readiness data   │  │ Engagement hub   │  │ Transparency demands     │   │
│  │ NDA-gated        │  │ Both see status  │  │ What buyer requires      │   │
│  │ Per-buyer perms  │  │ Tagged assets    │  │ Compliance visibility    │   │
│  │                  │  │                  │  │                          │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘   │
│           │                     │                         │                  │
│           └─────────────────────┼─────────────────────────┘                  │
│                                 │                                            │
│                                 ▼                                            │
│           ┌─────────────────────────────────────────────┐                    │
│           │           ENGAGEMENT TAG                     │                    │
│           │        (ZeroBias Tag Resource)               │                    │
│           │                                              │                    │
│           │  Tag ID: "ENG-A7K9M2"                        │                    │
│           │  Links: Tasks, Comments, Files, Boundaries   │                    │
│           │                                              │                    │
│           │  resourceSearch(tagId) → All Assets          │                    │
│           └─────────────────────────────────────────────┘                    │
│                                 │                                            │
│                                 ▼                                            │
│           ┌─────────────────────────────────────────────┐                    │
│           │        ZEROBIAS BOUNDARY (Required)          │                    │
│           │     (Created & managed in ZB Platform)       │                    │
│           │                                              │                    │
│           │  - Provider must be member before start      │                    │
│           │  - All work scoped to this boundary          │                    │
│           │  - SME Mart reads but doesn't manage         │                    │
│           └─────────────────────────────────────────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concept: Engagement Tags

### What is an Engagement Tag?

A ZeroBias **Tag** is a platform resource that can be attached to other resources (Tasks, Comments, Files, Boundaries, etc.). For SME Mart, each engagement gets a unique Tag that:

1. **Identifies** the engagement across all ZeroBias assets
2. **Aggregates** all related data via `resourceSearch`
3. **Enables** the Transparency Center to display a unified view

### Tag Short Codes

Each engagement Tag has a human-friendly short code for easy reference:

**Format:** `ENG-XXXXXX` (ENG prefix + 6 alphanumeric characters)

**Generation Rules:**
- User can request a custom code (check availability first)
- Auto-generated codes use unambiguous character set
- **Unambiguous characters only:** `A-H, J-N, P-Z, 2-9` (excludes I/l/1, O/0)
- Examples: `ENG-A7K9M2`, `ENG-BETA42`, `ENG-SOC2Q1`

**Why Short Codes?**
- Easy to reference in conversation ("Check the TC for ENG-A7K9M2")
- Can be shared securely (not a UUID)
- Memorable for frequent collaborators
- Searchable in SME Mart UI

### Tag Creation Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PREREQUISITE: Boundary Setup (in ZeroBias Platform)                      │
│                                                                          │
│ 1. Buyer creates boundary in ZB Platform (if not existing)              │
│ 2. Buyer invites provider to boundary in ZB Platform                    │
│ 3. Provider accepts invitation in ZB Platform                           │
│ 4. Both are now boundary members                                         │
│                                                                          │
│ Note: SME Mart does NOT do any of the above - only verifies it happened │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
Proposal Accepted (in SME Mart)
       │
       ▼
Verify provider is boundary member
       │
       ├─── If NO → Block engagement, show instructions to invite in ZB
       │
       ▼ If YES
       │
┌──────────────────────────────────────────┐
│ Create Engagement Tag                     │
│                                           │
│ POST /api/zerobias/tags                   │
│ {                                         │
│   "name": "SME-Mart-Engagement",          │
│   "shortCode": "ENG-A7K9M2",              │
│   "metadata": {                           │
│     "smeMartRequestId": "uuid",           │
│     "buyerOrgId": "uuid",                 │
│     "providerProfileId": "uuid",          │
│     "boundaryId": "uuid",                 │
│     "engagementType": "work_request",     │
│     "createdAt": "2026-02-06T..."         │
│   }                                       │
│ }                                         │
└──────────────────────────────────────────┘
       │
       ▼
Store Tag ID in work_requests.zerobias_tag_id
       │
       ▼
Create initial Task in boundary with Tag attached
       │
       ▼
Transparency Center now accessible
```

---

## The Three Transparency Centers

### 1. Provider Internal Transparency Center

**Purpose:** Provider shares internal readiness/compliance data with buyers under NDA.

**Data Source:** ZeroBias Readiness Center (provider's internal compliance posture)

**Key Features:**
- Provider selects what data to expose per engagement
- NDA acceptance required before access
- Granular permission sets (e.g., SOC 2 evidence vs. full boundary access)
- Tied to engagement Tag for audit trail

**UI Location:** Provider's engagement detail page → "Manage Visibility" section

**Permissions Model:**
```
┌─────────────────────────────────────────────────────────┐
│ PROVIDER VISIBILITY SETTINGS                            │
│                                                         │
│ Engagement: ENG-A7K9M2 (SOC 2 Assessment)               │
│ Buyer: Acme Corp                                        │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ What can Acme Corp see?                             │ │
│ │                                                     │ │
│ │ ☑ Engagement Tasks & Comments                       │ │
│ │ ☑ Deliverable Files                                 │ │
│ │ ☐ My Readiness Center Dashboard                     │ │
│ │ ☐ My SOC 2 Control Evidence                         │ │
│ │ ☐ My Full Boundary Access                           │ │
│ │                                                     │ │
│ │ NDA Status: ✅ Signed (Jan 15, 2026)                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Save Visibility Settings]                              │
└─────────────────────────────────────────────────────────┘
```

### 2. Shared Transparency Center (The Engagement Hub)

**Purpose:** The common ground where buyer and provider collaborate on the engagement.

**This is where the magic happens.** All engagement activity flows through here.

**Data Aggregation:**
```typescript
// Single API call to get everything
const engagementAssets = await zerobiasClient
  .resourceSearch({
    tagId: engagement.zerobiasTagId,
    types: ['Task', 'Comment', 'File', 'Boundary', 'TimeEntry']
  });

// Split into panels
const tasks = engagementAssets.filter(a => a.type === 'Task');
const comments = engagementAssets.filter(a => a.type === 'Comment');
const files = engagementAssets.filter(a => a.type === 'File');
const timeEntries = engagementAssets.filter(a => a.type === 'TimeEntry');
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRANSPARENCY CENTER: ENG-A7K9M2                                              │
│ SOC 2 Type II Readiness Assessment • Acme Corp ↔ Jane Smith                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─ HEADER ─────────────────────────────────────────────────────────────────┐│
│ │ Status: IN PROGRESS    Due: Mar 4, 2026    Price: $5,000 (Fixed)         ││
│ │ Started: Feb 6, 2026   Hours: 12.5         Revisions: 1/3 used           ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌─ TABS ───────────────────────────────────────────────────────────────────┐│
│ │ [Overview] [Tasks] [Messages] [Files] [Time Log] [Deliverables]          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌─ OVERVIEW TAB ───────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │ ┌─ Progress ──────────┐  ┌─ Recent Activity ──────────────────────────┐ ││
│ │ │ ████████░░ 80%      │  │ • Jane uploaded "Gap Analysis.pdf"  2h ago │ ││
│ │ │                     │  │ • Comment from Jane: "Ready for..."  3h ago│ ││
│ │ │ Tasks: 4/5 complete │  │ • Time logged: 2.5 hours           5h ago  │ ││
│ │ │ Deliverables: 1/2   │  │ • Task completed: "Initial Review" 1d ago  │ ││
│ │ └─────────────────────┘  └─────────────────────────────────────────────┘ ││
│ │                                                                          ││
│ │ ┌─ Quick Actions ────────────────────────────────────────────────────┐   ││
│ │ │ [Send Message] [Upload File] [Log Time] [Submit Deliverable]       │   ││
│ │ └────────────────────────────────────────────────────────────────────┘   ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌─ MESSAGES TAB ───────────────────────────────────────────────────────────┐│
│ │ All communication happens here (via ZB Task comments with engagement Tag)││
│ │                                                                          ││
│ │ ┌────────────────────────────────────────────────────────────────────┐   ││
│ │ │ 👤 Acme Corp (Buyer) • Feb 6, 10:30 AM                            │   ││
│ │ │ Looking forward to working together. Please start with the gap    │   ││
│ │ │ analysis when ready.                                               │   ││
│ │ └────────────────────────────────────────────────────────────────────┘   ││
│ │                                                                          ││
│ │ ┌────────────────────────────────────────────────────────────────────┐   ││
│ │ │ 👤 Jane Smith (Provider) • Feb 6, 11:15 AM                        │   ││
│ │ │ Thanks! I've started the initial document review. Will have        │   ││
│ │ │ preliminary findings by end of week.                               │   ││
│ │ └────────────────────────────────────────────────────────────────────┘   ││
│ │                                                                          ││
│ │ ┌─ New Message ──────────────────────────────────────────────────────┐   ││
│ │ │ Type your message...                                    [Send]     │   ││
│ │ │ [📎 Attach File]                                                   │   ││
│ │ └────────────────────────────────────────────────────────────────────┘   ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Panels/Tabs:**

| Tab | Content | ZB Resource Type |
|-----|---------|------------------|
| **Overview** | Summary, progress, recent activity | Aggregated |
| **Tasks** | Task list, subtasks, status | `Task` |
| **Messages** | Threaded communication | `Comment` (tagged) |
| **Files** | Shared documents, assets | `File` |
| **Time Log** | Hours logged, work diary | `TimeEntry` |
| **Deliverables** | Submitted work, revisions | `File` + custom metadata |

### 3. Buyer Transparency Requirements

**Purpose:** Buyers define upfront what visibility they require from providers.

**Use Case:** Enterprise buyers may require:
- Access to provider's SOC 2 evidence
- Visibility into provider's task breakdown
- Time tracking granularity
- Specific compliance documentation

**UI Location:** Buyer's Work Request form → "Transparency Requirements" section

**Configuration:**
```
┌─────────────────────────────────────────────────────────────────┐
│ TRANSPARENCY REQUIREMENTS                                        │
│ Define what visibility you require from the provider            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Required Visibility:                                        │ │
│ │                                                             │ │
│ │ ☑ Detailed task breakdown with time estimates               │ │
│ │ ☑ Daily progress updates                                    │ │
│ │ ☑ All files shared within platform                          │ │
│ │ ☐ Access to provider's relevant Readiness data (NDA req'd)  │ │
│ │ ☐ Full boundary access during engagement                    │ │
│ │                                                             │ │
│ │ Time Tracking Granularity:                                  │ │
│ │ ○ None required                                             │ │
│ │ ● Hourly summary                                            │ │
│ │ ○ Detailed work log with descriptions                       │ │
│ │                                                             │ │
│ │ Compliance Documentation:                                   │ │
│ │ [+ Add required document type]                              │ │
│ │ • SOC 2 Type II Report                                      │ │
│ │ • Professional Liability Insurance                          │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Note: Providers will see these requirements before submitting   │
│ proposals. They must agree to meet these transparency levels.   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Addressing Engagement Gaps

The Transparency Center directly addresses the critical gaps identified in the engagement lifecycle research:

| Gap | How TC Addresses It |
|-----|---------------------|
| **Messaging** | Messages tab = ZB Comments tagged with engagement Tag |
| **Deliverable Workflow** | Deliverables tab with submit/review/revise flow |
| **Auto-Complete Timer** | Status bar shows countdown; auto-triggers after 7 days |
| **Response Time** | Activity timestamps visible; response metrics calculated |
| **Revision Handling** | Revision counter in header; tracked per deliverable |
| **Contract/Agreement** | Overview tab shows engagement terms; linked to summary doc |
| **Dispute Resolution** | "Report Issue" action → Opens Resolution workflow |

### Messaging via ZeroBias Comments

Instead of building a separate messaging system:

```typescript
// Sending a message = Creating a ZB Comment with engagement Tag
async function sendMessage(engagementTagId: string, message: string, attachments?: File[]) {
  const comment = await zerobiasClient.createComment({
    content: message,
    tags: [engagementTagId],
    attachments: attachments?.map(f => f.id),
    metadata: {
      source: 'sme-mart-transparency-center',
      messageType: 'engagement-message'
    }
  });

  return comment;
}

// Fetching messages = resourceSearch for Comments with Tag
async function getMessages(engagementTagId: string) {
  return await zerobiasClient.resourceSearch({
    tagId: engagementTagId,
    types: ['Comment'],
    filter: { 'metadata.messageType': 'engagement-message' },
    sort: { createdAt: 'asc' }
  });
}
```

**Benefits:**
- Full audit trail in ZeroBias
- No separate messaging infrastructure
- Threaded replies via Comment.parentId
- File attachments via Comment.attachments
- Notifications via ZeroBias notification system

### Deliverable Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ DELIVERABLES                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Deliverable 1: Gap Analysis Report ─────────────────────────┐│
│ │ Status: ✅ ACCEPTED                                          ││
│ │ Submitted: Feb 10, 2026 • Accepted: Feb 12, 2026             ││
│ │ Files: Gap_Analysis_v2.pdf (final)                           ││
│ │                                                              ││
│ │ History:                                                      ││
│ │ • v1 submitted Feb 8 → Revision requested Feb 9              ││
│ │ • v2 submitted Feb 10 → Accepted Feb 12                      ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─ Deliverable 2: Remediation Plan ────────────────────────────┐│
│ │ Status: ⏳ UNDER REVIEW (5 days remaining)                   ││
│ │ Submitted: Feb 13, 2026                                       ││
│ │ Files: Remediation_Plan.pdf                                  ││
│ │                                                              ││
│ │ [Accept Deliverable] [Request Revision] [Extend Review]      ││
│ │                                                              ││
│ │ Revisions used: 1/3                                          ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─ Deliverable 3: Final Report ────────────────────────────────┐│
│ │ Status: 📝 PENDING SUBMISSION                                ││
│ │ Due: Mar 4, 2026                                             ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [+ Add Deliverable] (Provider only)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deliverable States:**
1. `pending_submission` - Awaiting provider upload
2. `under_review` - Submitted, buyer reviewing (7-day timer starts)
3. `revision_requested` - Buyer requested changes
4. `accepted` - Buyer approved
5. `auto_accepted` - 7-day timer expired, auto-approved

### Auto-Complete Timer Implementation

```typescript
// When deliverable submitted
async function submitDeliverable(engagementId: string, deliverableId: string, files: File[]) {
  await db.update(deliverables)
    .set({
      status: 'under_review',
      submittedAt: new Date(),
      reviewDeadline: addDays(new Date(), 7), // 7-day window
      files: files.map(f => f.id)
    })
    .where(eq(deliverables.id, deliverableId));

  // Schedule auto-accept job
  await scheduleJob('auto-accept-deliverable', {
    deliverableId,
    executeAt: addDays(new Date(), 7)
  });

  // Notify buyer
  await notifyBuyer(engagementId, 'deliverable_submitted', deliverableId);
}

// Cron job or scheduled function
async function autoAcceptDeliverables() {
  const expiredDeliverables = await db
    .select()
    .from(deliverables)
    .where(
      and(
        eq(deliverables.status, 'under_review'),
        lte(deliverables.reviewDeadline, new Date())
      )
    );

  for (const d of expiredDeliverables) {
    await db.update(deliverables)
      .set({ status: 'auto_accepted', acceptedAt: new Date() });

    await notifyParties(d.engagementId, 'deliverable_auto_accepted', d.id);
    await checkEngagementCompletion(d.engagementId);
  }
}
```

---

## Data Model

### New Tables/Fields for Neon

```typescript
// Engagement tag reference
// Add to work_requests table
zerobiasTagId: text('zerobias_tag_id'),        // ZeroBias Tag UUID
engagementCode: text('engagement_code'),        // Short code: "ENG-A7K9M2"

// New table: deliverables
export const deliverables = pgTable('deliverables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workRequestId: uuid('work_request_id').references(() => workRequests.id),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  status: deliverableStatusEnum('status').default('pending_submission'),
  submittedAt: timestamp('submitted_at'),
  reviewDeadline: timestamp('review_deadline'),
  acceptedAt: timestamp('accepted_at'),
  revisionCount: integer('revision_count').default(0),
  maxRevisions: integer('max_revisions').default(3),
  zerobiasFileIds: text('zerobias_file_ids').array(), // ZB File resource IDs
  createdAt: timestamp('created_at').defaultNow(),
});

export const deliverableStatusEnum = pgEnum('deliverable_status', [
  'pending_submission',
  'under_review',
  'revision_requested',
  'accepted',
  'auto_accepted'
]);

// New table: transparency_requirements
export const transparencyRequirements = pgTable('transparency_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  workRequestId: uuid('work_request_id').references(() => workRequests.id),
  requireDetailedTasks: boolean('require_detailed_tasks').default(false),
  requireDailyUpdates: boolean('require_daily_updates').default(false),
  requireFilesInPlatform: boolean('require_files_in_platform').default(true),
  requireReadinessAccess: boolean('require_readiness_access').default(false),
  timeTrackingLevel: text('time_tracking_level').default('hourly'), // none, hourly, detailed
  requiredDocuments: text('required_documents').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

// New table: provider_visibility_grants
export const providerVisibilityGrants = pgTable('provider_visibility_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id),
  workRequestId: uuid('work_request_id').references(() => workRequests.id),
  grantType: text('grant_type').notNull(), // 'tasks', 'files', 'readiness', 'boundary'
  scope: text('scope'), // JSON: specific resources or categories
  ndaAcceptedAt: timestamp('nda_accepted_at'),
  grantedAt: timestamp('granted_at').defaultNow(),
  revokedAt: timestamp('revoked_at'),
});
```

### ZeroBias Resource Types Used

| Resource | Usage |
|----------|-------|
| **Tag** | Engagement identifier; attached to all assets |
| **Task** | Main engagement task + subtasks/milestones |
| **Comment** | Messages, threaded discussions |
| **File** | Deliverables, shared documents |
| **TimeEntry** | Hours logged against tasks |
| **Boundary** | Secure work environment |

---

## Role-Based Views

### Buyer View

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 BUYER VIEW: ENG-A7K9M2                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Provider: Jane Smith (⭐ 4.9)                                   │
│                                                                 │
│ PRIMARY ACTIONS:                                                │
│ • Review deliverables (1 pending review)                        │
│ • Send message                                                  │
│ • Request update                                                │
│ • Report issue                                                  │
│                                                                 │
│ VISIBLE:                                                        │
│ ✅ All tasks and progress                                       │
│ ✅ Messages and files                                           │
│ ✅ Time log (per transparency requirements)                     │
│ ✅ Provider's granted Readiness data (if NDA signed)            │
│                                                                 │
│ BUYER-ONLY SECTIONS:                                            │
│ • My transparency requirements                                  │
│ • Internal notes (not visible to provider)                      │
│ • Payment status and history                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Provider View

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 PROVIDER VIEW: ENG-A7K9M2                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Client: Acme Corp                                               │
│                                                                 │
│ PRIMARY ACTIONS:                                                │
│ • Submit deliverable                                            │
│ • Log time                                                      │
│ • Send message                                                  │
│ • Update task status                                            │
│ • Manage visibility settings                                    │
│                                                                 │
│ VISIBLE:                                                        │
│ ✅ All tasks I'm assigned to                                    │
│ ✅ Messages and files                                           │
│ ✅ My time log                                                  │
│ ✅ Buyer's transparency requirements                            │
│                                                                 │
│ PROVIDER-ONLY SECTIONS:                                         │
│ • My visibility grants (what buyer can see)                     │
│ • My earnings from this engagement                              │
│ • Internal notes                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Short Code Generation

### Unambiguous Character Set

```typescript
// Characters that are visually distinct
const UNAMBIGUOUS_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
// Excludes: I, L, O (confused with 1, l, 0)
// Excludes: 0, 1 (confused with O, I, l)

function generateEngagementCode(): string {
  const prefix = 'ENG-';
  const codeLength = 6;
  let code = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
    code += UNAMBIGUOUS_CHARS[randomIndex];
  }

  return prefix + code;
}

// Examples: ENG-A7K9M2, ENG-XPRT42, ENG-SOC2QA

async function createEngagementCode(customCode?: string): Promise<string> {
  if (customCode) {
    // Validate format
    if (!/^[A-HJ-NP-Z2-9]{4,8}$/i.test(customCode)) {
      throw new Error('Invalid code format. Use 4-8 alphanumeric characters (no I, L, O, 0, 1)');
    }

    // Check availability
    const existing = await db.query.workRequests.findFirst({
      where: eq(workRequests.engagementCode, `ENG-${customCode.toUpperCase()}`)
    });

    if (existing) {
      throw new Error('Code already in use');
    }

    return `ENG-${customCode.toUpperCase()}`;
  }

  // Auto-generate unique code
  let attempts = 0;
  while (attempts < 10) {
    const code = generateEngagementCode();
    const existing = await db.query.workRequests.findFirst({
      where: eq(workRequests.engagementCode, code)
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique code');
}
```

---

## API Endpoints

### Transparency Center Endpoints

```typescript
// GET /api/tc/[engagementCode] - Get transparency center data
// Returns aggregated engagement data for the authenticated user's role

// GET /api/tc/[engagementCode]/messages - Get messages
// POST /api/tc/[engagementCode]/messages - Send message

// GET /api/tc/[engagementCode]/deliverables - List deliverables
// POST /api/tc/[engagementCode]/deliverables - Submit deliverable
// PATCH /api/tc/[engagementCode]/deliverables/[id] - Update status (accept/revise)

// GET /api/tc/[engagementCode]/files - List files
// POST /api/tc/[engagementCode]/files - Upload file

// GET /api/tc/[engagementCode]/time - Get time entries
// POST /api/tc/[engagementCode]/time - Log time

// GET /api/tc/[engagementCode]/tasks - Get tasks from ZeroBias
// PATCH /api/tc/[engagementCode]/tasks/[id] - Update task status

// Provider visibility
// GET /api/tc/[engagementCode]/visibility - Get visibility settings
// PATCH /api/tc/[engagementCode]/visibility - Update visibility grants
```

---

## Implementation Phases

### Prerequisites (Plan 010)

Before implementing TC, the following from Plan 010 must be complete:
- ✅ Boundary selector on work request creation
- ✅ Provider access verification
- ✅ Engagement blocked banner (if provider not in boundary)
- ✅ "Open in ZeroBias" links for boundary management

### Phase 1: Core Transparency Center

**Goal:** Launch basic TC with messaging and task tracking

**Scope:**
1. **Engagement start requires verified boundary access** (from Plan 010)
2. Engagement Tag creation on proposal acceptance (after access verified)
3. Short code generation (auto + custom)
4. TC page with Overview tab
5. Messages tab (ZB Comments integration)
6. Tasks tab (ZB Tasks integration)
7. Files tab (ZB Files integration)
8. Basic role-based views (buyer vs provider)

**Technical Work:**
- [ ] ZeroBias Tag API integration
- [ ] ZeroBias resourceSearch integration
- [ ] Short code generation utility
- [ ] TC page component (`/tc/[code]`)
- [ ] Messages panel with Comment CRUD
- [ ] Tasks panel with Task read
- [ ] Files panel with File upload/list
- [ ] Role detection and view switching

### Phase 2: Deliverables & Workflow

**Goal:** Structured deliverable submission and review

**Scope:**
1. Deliverables table and API
2. Deliverables tab in TC
3. Submit deliverable flow
4. Review/accept/revise flow
5. Auto-complete timer (7 days)
6. Revision tracking
7. Notifications for deliverable events

**Technical Work:**
- [ ] `deliverables` table in Neon
- [ ] Deliverable CRUD API
- [ ] File attachment to deliverables
- [ ] Status state machine
- [ ] Cron job for auto-accept
- [ ] Email/push notifications

### Phase 3: Transparency Requirements & Visibility

**Goal:** Buyer requirements and provider visibility controls

**Scope:**
1. Transparency Requirements on Work Request form
2. Requirements visible to providers before proposal
3. Provider Visibility Settings panel
4. NDA workflow for readiness data access
5. Visibility grants table and enforcement

**Technical Work:**
- [ ] `transparency_requirements` table
- [ ] Requirements UI on Work Request form
- [ ] Requirements display on Request detail
- [ ] `provider_visibility_grants` table
- [ ] NDA acceptance flow
- [ ] Readiness Center data fetching (via ZB API)
- [ ] Permission enforcement in TC

### Phase 4: Advanced Features

**Goal:** Full CEO vision with boundary integration

**Scope:**
1. Boundary creation on engagement start
2. Boundary access via TC
3. Full audit trail visualization
4. Agentic session tracking
5. Time tracking with work diary
6. Analytics and insights

---

## Success Metrics

### Phase 1
- [ ] 100% of new engagements get Engagement Tags
- [ ] TC accessible for all active engagements
- [ ] Messages flowing via ZB Comments
- [ ] Users can view tasks and files

### Phase 2
- [ ] Deliverables submitted through TC
- [ ] 80%+ deliverables reviewed within 7 days
- [ ] Auto-complete working correctly
- [ ] Zero deliverable disputes due to unclear process

### Phase 3
- [ ] Buyers specifying transparency requirements
- [ ] Providers granting selective visibility
- [ ] NDA workflow completion rate > 90%

### Phase 4
- [ ] Full audit trail for all engagements
- [ ] Boundary integration operational
- [ ] Time tracking adoption > 50%

---

## Open Questions

1. **Tag Persistence:** What happens to the Tag when engagement completes? Archive or keep active?
2. **Message Notifications:** Email, push, or in-app only for new messages?
3. **File Storage Limits:** Max file size? Total per engagement?
4. **Readiness Integration:** Which Readiness Center data is exposable? API available?
5. **NDA Template:** Standard NDA or customizable per buyer?
6. **Dispute Flow:** Where does "Report Issue" go? Resolution Center (future) or support email?
7. **Multi-Party Engagements:** Can one engagement have multiple providers? How does TC handle?

---

## References

- [CEO Notes](../../notes/CEO_NOTES.md) - Original vision for Transparency Center
- [Engagement Lifecycle](./008-engagement-lifecycle.md) - Gap analysis and workflow
- [Competitor Research](../../research/competitor-engagement-flows.md) - Upwork/Fiverr patterns
- [ZeroBias Boundary Integration](./local/010-zerobias-boundary-integration.md)
- [ZeroBias Tasks Integration](./local/009-zerobias-tasks-integration.md)

---

**Last Updated:** 2026-02-06
