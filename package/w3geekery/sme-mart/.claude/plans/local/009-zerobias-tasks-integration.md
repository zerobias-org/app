# Plan 009: ZeroBias Tasks Integration

**Status:** Draft - Pending Approval
**Created:** 2026-02-05
**Author:** Claude (with Clark)
**Priority:** HIGH - CEO Directive
**Depends On:** Plan 010 (Boundary Integration) - Must be completed first

---

## TL;DR

**CEO Directive:** ZeroBias Tasks must be the backbone of all SME Mart engagements. Every work request, proposal, contract, and deliverable should be tracked through ZB Tasks to maintain a complete audit trail of dialog, requirements, transactions, LLM prompts/output, and documents.

**What We Need:**
1. Map SME Mart Work Requests → ZeroBias Tasks
2. UI for providers/buyers to view and manage their ZB Tasks within SME Mart
3. Use ZB Task Comments for all negotiation and discussion
4. Use ZB Task Attachments for requirements docs and deliverables
5. Use ZB Task Custom Fields for marketplace metadata (rates, hours, milestones)

**SDK Available:** Platform SDK has full Tasks API - create, update, transition, comments, attachments, linking

**Outcome:** Complete audit trail of every engagement from request → proposal → contract → delivery → completion

---

## Strategic Context

### Why ZeroBias Tasks?

Brian (CEO) is adamant that the Task system carries:
- **All dialog** - Negotiations, clarifications, updates between provider and buyer
- **Requirements** - Scope of work, acceptance criteria, deliverables list
- **Transactions** - Contract terms, rates, hours, payments
- **LLM prompts/output** - AI-assisted work captured for auditability
- **Documents** - Attachments for SOWs, deliverables, evidence

This creates an **immutable audit trail** of the entire engagement lifecycle, critical for:
- Dispute resolution
- Compliance evidence
- Quality assurance
- Platform trust and transparency

### Current State

SME Mart has:
- Work Requests (Neon DB) - buyer posts what they need
- Proposals (Neon DB) - providers submit bids
- Service Offerings (Neon DB) - productized services

Missing:
- Connection to ZeroBias Tasks for tracking actual work
- Audit trail of communications
- Deliverable tracking
- Workflow state management via ZB

---

## ZeroBias Tasks Overview

### Task Data Model (from ZB Platform SDK)

```typescript
interface TaskExtended {
  id: UUID;
  name: string;                    // Task title
  description: string;             // Full description/scope
  status: TaskStatusInfo;          // Workflow state
  priority: TaskPriority;          // High/Medium/Low/Critical
  phase: TaskPhase;                // Phase in workflow

  // RACI Assignment
  assigned: Party[];               // Provider (doing the work)
  accountable: Party[];            // Buyer (responsible for outcome)
  approvers: Party[];              // Buyer stakeholders who approve
  notified: Party[];               // Others to keep informed

  // Relationships
  boundaryId: UUID;                // Work happens in buyer's boundary
  activityId: UUID;                // Task type (we'll create SME Mart activities)
  links: TaskExtendedLink[];       // Related resources

  // Marketplace Metadata
  customFields: Record<string, any>;

  // Audit Trail
  comments: TaskComment[];         // All communications
  attachments: TaskAttachment[];   // Documents and deliverables

  // Workflow
  transitions: Transition[];       // Available state changes

  // Timestamps
  createdAt, updatedAt, createdBy, updatedBy
}
```

### Available SDK Methods

```typescript
// CRUD
tasksService.create(newTask)
tasksService.get(taskId)
tasksService.update(taskId, updateTask)
tasksService.delete(taskId)
tasksService.list(page)

// Comments (Dialog Trail)
tasksService.listComments(taskId, page)
tasksService.addComment(taskId, { text })
tasksService.editComment(taskId, commentId, text)
tasksService.deleteComment(taskId, commentId)

// Attachments (Documents)
tasksService.listAttachments(taskId, page)
tasksService.addAttachment(taskId, attachment)

// Metadata
tasksService.listPriorities()
portalTasksService.listPhases()
portalTasksService.listStatuses()

// Search
portalTasksService.myTasks(page)  // Current user's tasks
portalTasksService.search(page)   // Cross-org search
```

---

## SME Mart ↔ ZeroBias Tasks Mapping

### Entity Mapping

| SME Mart Entity | ZeroBias Task Usage |
|-----------------|---------------------|
| **Work Request** | Creates a ZB Task when posted (or when proposal accepted) |
| **Proposal** | Comment on the Work Request task with proposal details |
| **Accepted Proposal** | Task transitions to "In Progress", provider assigned |
| **Contract Terms** | Custom fields: rate, hours, timeline, milestones |
| **Negotiation** | Comments thread between buyer and provider |
| **Deliverables** | Attachments on the task |
| **Completion** | Task transitions to "Completed" |
| **Reviews** | Comment with review, link to Reviews table |

### RACI Mapping

| RACI Role | SME Mart Role | Responsibility |
|-----------|---------------|----------------|
| **Assigned** | Provider | Does the actual work |
| **Accountable** | Buyer (requestor) | Owns the outcome, approves completion |
| **Approvers** | Buyer stakeholders | Review and approve deliverables |
| **Notified** | Org admins, finance | Stay informed of progress |

### Custom Fields Schema

```typescript
interface SmeMartTaskCustomFields {
  // Link back to SME Mart
  smeMartRequestId: string;        // Work request ID in Neon
  smeMartProposalId?: string;      // Accepted proposal ID
  smeMartProviderId: string;       // Provider profile ID

  // Contract Terms
  agreedRate: number;              // $/hour or fixed price
  rateType: 'hourly' | 'fixed';
  estimatedHours?: number;
  maxBudget?: number;

  // Timeline
  startDate?: string;
  dueDate?: string;
  milestones?: Array<{
    name: string;
    dueDate: string;
    completed: boolean;
  }>;

  // Tracking
  hoursLogged?: number;
  invoiceAmount?: number;

  // AI/LLM Tracking
  llmSessionIds?: string[];        // Links to LLM conversation logs

  // Platform
  platform: 'sme-mart';
}
```

### Task Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SME Mart Task Lifecycle                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Work Request Posted]                                               │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │   DRAFT     │  ← Task created, buyer fills requirements           │
│  └──────┬──────┘                                                     │
│         │ Publish                                                    │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │    OPEN     │  ← Providers can view and submit proposals          │
│  └──────┬──────┘    (proposals = comments with structured data)      │
│         │ Accept Proposal                                            │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │ IN PROGRESS │  ← Provider assigned, work begins                   │
│  └──────┬──────┘    Comments: updates, questions, deliverables       │
│         │           Attachments: work products                       │
│         │ Submit for Review                                          │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │  IN REVIEW  │  ← Buyer reviews deliverables                       │
│  └──────┬──────┘                                                     │
│         │                                                            │
│    ┌────┴────┐                                                       │
│    ▼         ▼                                                       │
│ [Approve] [Request Changes]                                          │
│    │         │                                                       │
│    │         └──► Back to IN PROGRESS                                │
│    ▼                                                                 │
│  ┌─────────────┐                                                     │
│  │  COMPLETED  │  ← Work accepted, ready for payment                 │
│  └──────┬──────┘                                                     │
│         │ Close                                                      │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │   CLOSED    │  ← Archived, review posted                          │
│  └─────────────┘                                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Required Interfaces in SME Mart

### 1. Tasks List View

**Location:** `/my-profile/tasks` (new tab) or `/tasks`

**Features:**
- List of ZB Tasks where user is assigned, accountable, or notified
- Filter by status, role (as provider vs as buyer)
- Quick status indicators
- Click to open task detail

**API:** `portalTasksService.myTasks()`

### 2. Task Detail View

**Location:** Modal or `/tasks/[taskId]`

**Features:**
- Full task info (name, description, status, priority)
- RACI assignments display
- Contract terms (from custom fields)
- Comments thread (full dialog history)
- Attachments list with upload
- Status transition buttons
- Link back to SME Mart work request

**API:** `tasksService.get()`, `tasksService.listComments()`, `tasksService.listAttachments()`

### 3. Create Task (from Work Request)

**Trigger:** When work request is posted OR when proposal is accepted

**Flow:**
```typescript
const newTask = {
  name: workRequest.title,
  description: workRequest.description,
  activityId: SME_MART_ACTIVITY_ID,  // Pre-configured activity type
  boundaryId: buyer.boundaryId,       // Work scoped to buyer's boundary
  priority: 'medium',
  accountable: [buyer.zerobiasUserId],
  customFields: {
    smeMartRequestId: workRequest.id,
    platform: 'sme-mart',
    rateType: workRequest.budgetType,
    maxBudget: workRequest.budgetMax,
  }
};
const task = await tasksService.create(newTask);
// Store task.id back on workRequest record
```

### 4. Add Comment (Communications)

**Use Cases:**
- Provider submits proposal (structured comment)
- Buyer asks clarifying question
- Provider provides update
- Either party adds note
- LLM output logged

**UI:** Comment input at bottom of task detail, threaded display

**API:** `tasksService.addComment(taskId, { text })`

### 5. Add Attachment (Documents)

**Use Cases:**
- Buyer uploads requirements doc
- Provider uploads deliverable
- Either party shares reference material

**UI:** Drag-drop zone or file picker, attachment list with download

**API:** `tasksService.addAttachment(taskId, attachment)`

### 6. Transition Task (Workflow)

**UI:** Buttons for available transitions based on current status

**Validation:** Check requirements before transition (use `TasksService.checkRequirements()`)

**API:** `tasksService.update(taskId, { status: newStatus })`

### 7. Work Request Integration

**On Work Request Page:**
- Show linked ZB Task status
- Quick link to open task detail
- "View Full History" button

**On Provider Directory:**
- Badge showing active tasks count

### 8. Proposal as Structured Comment

When provider submits proposal, create a comment with structured data:

```typescript
const proposalComment = {
  text: JSON.stringify({
    type: 'proposal',
    proposalId: proposal.id,
    coverLetter: proposal.coverLetter,
    proposedPrice: proposal.proposedPrice,
    proposedTimeline: proposal.proposedTimeline,
    submittedAt: new Date().toISOString(),
  })
};
await tasksService.addComment(taskId, proposalComment);
```

UI renders these specially (card format vs plain text).

---

## Implementation Phases

### Phase 1: SDK Integration & Basic Task Creation

1. Add Platform SDK task methods to SME Mart
2. Create ZB Task when work request is posted
3. Store `zerobiasTaskId` on work request record
4. Basic task fetch and display

**Deliverables:**
- `src/lib/zerobias-tasks.ts` - Task service wrapper
- Update work request creation flow
- Schema update: add `zerobiasTaskId` to `workRequests` table

### Phase 2: Task List View

1. Create `/my-profile/tasks` page (or tab)
2. Fetch user's tasks via `portalTasksService.myTasks()`
3. Display in table with status, priority, role indicators
4. Filter controls

**Deliverables:**
- `src/app/my-profile/tasks/page.tsx`
- `src/components/tasks/TasksList.tsx`
- `src/hooks/useZeroBiasTasks.ts`

### Phase 3: Task Detail & Comments

1. Task detail modal or page
2. Display full task info
3. Comments thread (list + add)
4. Link back to work request

**Deliverables:**
- `src/components/tasks/TaskDetail.tsx`
- `src/components/tasks/TaskComments.tsx`
- `src/components/tasks/AddCommentForm.tsx`

### Phase 4: Attachments & Documents

1. Attachment list display
2. File upload capability
3. Download links

**Deliverables:**
- `src/components/tasks/TaskAttachments.tsx`
- `src/components/tasks/AttachmentUpload.tsx`

### Phase 5: Workflow Transitions

1. Display available transitions
2. Requirements validation before transition
3. Transition execution

**Deliverables:**
- `src/components/tasks/TaskTransitions.tsx`
- `src/components/tasks/RequirementsDialog.tsx`

### Phase 6: Proposal Integration

1. Create structured comments for proposals
2. Special rendering for proposal comments
3. Accept/reject updates task and assigns provider

**Deliverables:**
- Update proposal creation flow
- `src/components/tasks/ProposalComment.tsx`

### Phase 7: LLM Integration Prep

1. Custom field for LLM session tracking
2. Comment type for LLM output logging
3. UI for viewing LLM history

**Deliverables:**
- Schema for LLM tracking
- `src/components/tasks/LlmOutputComment.tsx`

---

## API Endpoints Needed

### SME Mart API Routes

```
GET    /api/tasks                    → List user's ZB tasks
GET    /api/tasks/[taskId]           → Get single task with comments/attachments
POST   /api/tasks                    → Create task (internal, from work request)
PATCH  /api/tasks/[taskId]           → Update task
POST   /api/tasks/[taskId]/comments  → Add comment
POST   /api/tasks/[taskId]/attachments → Upload attachment
POST   /api/tasks/[taskId]/transition → Transition task status
```

These wrap the ZB Platform SDK calls with SME Mart business logic.

---

## Database Schema Updates

```sql
-- Add ZeroBias Task reference to work requests
ALTER TABLE work_requests
ADD COLUMN zerobias_task_id TEXT;

-- Add ZeroBias Task reference to proposals (for tracking)
ALTER TABLE proposals
ADD COLUMN zerobias_comment_id TEXT;

-- Optional: Local cache of task status for quick display
ALTER TABLE work_requests
ADD COLUMN zerobias_task_status TEXT;
```

---

## Activity Type Configuration

Need to create a custom Activity in ZeroBias for SME Mart tasks:

```typescript
const SME_MART_ACTIVITY = {
  id: '<generate-uuid>',
  name: 'SME Mart Engagement',
  code: 'sme-mart-engagement',
  description: 'Work engagement initiated through SME Mart marketplace',
  // Configure required fields, transitions, etc.
};
```

This may require coordination with ZeroBias platform team.

---

## Boundary Integration

### Why Boundaries Matter

ZeroBias Boundaries enforce compliance isolation:
- Only boundary members can access boundary resources
- Tasks live within boundaries
- Providers must be **invited to buyer's boundary** before they can do work
- This ensures proper access control, audit trails, and compliance scoping

### Boundary Workflow for Engagements

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Boundary Invitation Flow                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Proposal Accepted]                                                 │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 1. Buyer initiates boundary invitation for provider          │   │
│  │    - Provider receives invitation                             │   │
│  │    - Provider accepts invitation                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 2. Provider becomes boundary member with scoped role          │   │
│  │    - Role: "External Consultant" or similar                   │   │
│  │    - Permissions: Limited to task + related resources         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 3. Task assigned to provider within boundary                  │   │
│  │    - Provider can now access task, comments, attachments      │   │
│  │    - Provider can view scoped boundary resources              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 4. Work completed, engagement closed                          │   │
│  │    - Option: Revoke boundary access                           │   │
│  │    - Option: Keep for future engagements                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Boundary-Related Interfaces Needed

#### 1. Boundary Selection (Buyer Side)

When buyer creates work request:
- Select which boundary the work relates to
- Or create new boundary for this engagement
- Boundary determines compliance scope (SOC 2, ISO 27001, etc.)

```typescript
// Work request creation
interface WorkRequestCreate {
  // ... existing fields
  zeroBiasBoundaryId?: string;  // Which boundary this work is for
}
```

#### 2. Boundary Invitation (On Proposal Accept)

When proposal is accepted:
- Trigger boundary invitation for provider
- Use ZB SDK to send invitation
- Track invitation status

```typescript
// Boundary invitation via Platform SDK
await boundaryService.inviteParty(boundaryId, {
  userId: provider.zerobiasUserId,
  roleId: EXTERNAL_CONSULTANT_ROLE_ID,
  message: `You've been invited to work on: ${workRequest.title}`,
});
```

#### 3. Invitation Status Tracking

- Show pending invitations to provider
- Provider can accept/decline within SME Mart
- Block task access until invitation accepted

#### 4. Boundary Context in Task View

- Display boundary name/context on task
- Link to boundary details (if permitted)
- Show provider's role within boundary

### Required SDK Methods

```typescript
// Boundary Management (Platform SDK)
boundaryService.get(boundaryId)                    // Get boundary details
boundaryService.listParties(boundaryId)            // List boundary members
boundaryService.inviteParty(boundaryId, invite)    // Invite user to boundary
boundaryService.removeParty(boundaryId, partyId)   // Remove user from boundary

// User's Boundaries (Portal SDK)
portalBoundaryService.myBoundaries()               // Boundaries user belongs to
portalBoundaryService.myInvitations()              // Pending invitations
portalBoundaryService.acceptInvitation(inviteId)   // Accept invitation
portalBoundaryService.declineInvitation(inviteId)  // Decline invitation
```

### Database Schema Updates (Additional)

```sql
-- Track boundary associations
ALTER TABLE work_requests
ADD COLUMN zerobias_boundary_id TEXT;

-- Track boundary invitations
CREATE TABLE boundary_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID REFERENCES work_requests(id),
  provider_id UUID REFERENCES provider_profiles(id),
  zerobias_invitation_id TEXT,
  status TEXT DEFAULT 'pending',  -- pending, accepted, declined, revoked
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);
```

### Compliance Considerations

1. **Audit Trail**: All boundary invitations logged in ZB
2. **Access Scoping**: Provider only sees what their role permits
3. **Time-Bound Access**: Consider auto-revoking access after engagement ends
4. **NDA/Terms**: May require provider to accept terms before boundary access
5. **Data Isolation**: Work products stay within boundary context

### Phase Addition: Boundary Management

Add to implementation phases:

**Phase 1.5: Boundary Integration**
1. Add boundary selection to work request creation
2. Implement boundary invitation on proposal accept
3. Track invitation status
4. Gate task access on boundary membership

**Deliverables:**
- `src/lib/zerobias-boundaries.ts` - Boundary service wrapper
- `src/components/boundaries/BoundarySelector.tsx`
- `src/components/boundaries/InvitationStatus.tsx`
- Update proposal acceptance flow

---

## Feature Requests for ZeroBias Tasks

Based on SME Mart needs, potential enhancements to request:

1. **Structured Comments** - First-class support for typed comments (proposal, update, deliverable) vs plain text
2. **Comment Reactions** - Approve/acknowledge without new comment
3. **Hours Logging** - Built-in time tracking on tasks
4. **Invoice Generation** - Create invoice from task hours/deliverables
5. **Template Tasks** - Pre-configured task templates for common engagement types
6. **External Party Support** - Assign tasks to users outside the boundary org

---

<!-- STANDUP -->
> **Discussion: Buyer Work-in-Progress Dashboard**
>
> Once work begins, where do buyers spend their time? Need to think through:
> 1. Should there be a dedicated "My Engagements" or "Work in Progress" dashboard for buyers?
> 2. Each active engagement needs: messages/updates, notifications, status, discussion, documents
> 3. Is this just a view of their ZB Tasks, or does SME Mart add a layer on top?
> 4. How does this relate to the existing `/requests` page - is that just for posting, and a separate dashboard for active work?
> 5. Provider has profile + services as their "home" - what's the equivalent for buyers?
> 6. Should buyer and provider see the same engagement view, or different perspectives?
<!-- /STANDUP -->

## Questions for Discussion

1. **When to create ZB Task?**
   - Option A: When work request is posted (task exists before proposal accepted)
   - Option B: When proposal is accepted (task only for active engagements)
   - Recommendation: Option A - captures full history including proposals

2. **Boundary scoping?**
   - Whose boundary does the task live in?
   - Recommendation: Buyer's boundary (they own the work context)

3. **Activity type?**
   - Do we need one SME Mart activity or multiple (per service category)?
   - Recommendation: Start with one, expand later

4. **Access control?**
   - How does provider access task in buyer's boundary?
   - May need "external collaborator" or cross-boundary task sharing

5. **Notifications?**
   - Rely on ZB notifications or build SME Mart specific?
   - Recommendation: Use ZB for task notifications, SME Mart for marketplace notifications

---

## Success Metrics

- 100% of accepted work requests have linked ZB Task
- All negotiation captured in task comments
- All deliverables tracked as attachments
- Complete audit trail from request → completion
- Disputes resolvable via task history

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: SDK + Creation | Medium | SDK access |
| Phase 2: Task List | Small | Phase 1 |
| Phase 3: Detail + Comments | Medium | Phase 2 |
| Phase 4: Attachments | Small | Phase 3 |
| Phase 5: Transitions | Medium | Phase 3 |
| Phase 6: Proposals | Medium | Phase 3, 5 |
| Phase 7: LLM Prep | Small | Phase 3 |

**Total:** Medium-Large, recommend incremental delivery

---

**Approval:** [ ] Approved by _____ on _____
