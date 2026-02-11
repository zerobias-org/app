# Plan 010: ZeroBias Boundary Integration

**Status:** Draft - Updated with Architecture Decision
**Created:** 2026-02-05
**Updated:** 2026-02-06
**Author:** Claude (with Clark)
**Priority:** HIGH - Prerequisite for Tasks Integration
**Depends On:** Nothing (foundational)
**Blocks:** Plan 009 (Tasks Integration)

---

## Architecture Decision: No Boundary Management in SME Mart

> **DECIDED (2026-02-06):** SME Mart will NOT duplicate ZeroBias platform admin capabilities.
>
> **What this means:**
> - ❌ NO boundary creation in SME Mart
> - ❌ NO boundary member invitations in SME Mart
> - ❌ NO boundary settings/configuration in SME Mart
> - ✅ ONLY show boundaries user already has access to
> - ✅ ONLY allow selecting from existing boundaries for engagements
> - ✅ Engagement REQUIRES a boundary (cannot start without one)
>
> **User Experience:** Wizard flow guides users to create boundaries in ZeroBias platform first, then return to SME Mart.

---

## TL;DR

**Problem:** SME Mart engagements need to happen within ZeroBias Boundaries for compliance isolation. Without boundaries:
- No proper access control
- No audit trail context
- No compliance scoping
- Tasks have nowhere to live

**Solution:** Integrate ZeroBias Boundaries into SME Mart so that:
1. ~~Buyers can select/create boundaries for work requests~~ **Buyers select from existing boundaries only**
2. ~~Providers are invited to buyer's boundary when engaged~~ **Invitations happen in ZB platform**
3. All work (tasks, docs, communications) happens within boundary context

**This Must Come First:** Tasks integration (Plan 009) depends on boundaries being in place.

**Real Example:** Clark (w3geekery) doing work for ZeroBias should be operating within a ZeroBias boundary right now for compliance!

---

## Why Boundaries First?

### Dependency Chain

```
Boundaries (Plan 010)
    └── Tasks (Plan 009)
            └── Work Requests integration
            └── Proposals integration
            └── Deliverables tracking
```

### What Boundaries Provide

| Capability | Why It Matters for SME Mart |
|------------|----------------------------|
| **Access Control** | Only invited providers can access buyer's work context |
| **Audit Trail** | All activity logged within boundary scope |
| **Compliance Scope** | Boundary defines which frameworks apply (SOC 2, ISO, etc.) |
| **Data Isolation** | Work products stay within boundary, not leaked across orgs |
| **Task Context** | Tasks must belong to a boundary |
| **Resource Linking** | Can link tasks to controls, policies, evidence |

---

## Current State

SME Mart currently:
- Has no boundary integration
- Work requests exist only in Neon DB
- No connection between marketplace and ZB compliance context
- Providers have no formal access to buyer's ZB environment

---

## Proposed Integration

### Boundary Roles in SME Mart

| Actor | Boundary Role | Access Level |
|-------|---------------|--------------|
| **Buyer (Org Admin)** | Boundary Owner/Admin | Full access, can invite others |
| **Buyer (Team Member)** | Boundary Member | Can create requests, manage tasks |
| **Provider (Engaged)** | External Consultant | Limited access: assigned tasks + related resources |
| **Provider (Not Engaged)** | No access | Cannot see boundary content |

### User Flows

#### Flow 1: Buyer Creates Work Request (Select Existing Boundary)

```
1. Buyer goes to create work request
2. Buyer sees boundary selector:
   - Dropdown of ONLY their existing boundaries (from ZB platform)
   - NO "Create New" option in SME Mart
3. If no suitable boundary exists:
   - Wizard guides buyer to ZB platform to create boundary
   - Buyer creates boundary + invites provider in ZB platform
   - Buyer returns to SME Mart and refreshes boundary list
   - Newly created boundary now appears in dropdown
4. Work request stored with boundaryId
5. Engagement CANNOT proceed without boundary selection
```

**Resolved Decision:** Select from existing boundaries only. SME Mart does not manage boundaries.

#### Flow 2: Provider Accepts Proposal → Boundary Access Required

```
1. Buyer accepts provider's proposal
2. SME Mart checks if provider is already a boundary member
3. If NOT a member:
   - Engagement is BLOCKED
   - Buyer sees: "Provider needs boundary access"
   - Instructions: "Invite [Provider] to [Boundary] in ZeroBias platform"
   - Link to ZB platform boundary management
4. Once provider is added in ZB platform:
   - Buyer (or system) checks membership again
   - OR provider confirms they've been added
   - Engagement can now proceed
5. Provider now has access to boundary → Task created → Work begins
```

**Key Change:** Invitations happen in ZeroBias platform, NOT in SME Mart. SME Mart only verifies membership.

**Resolved:** All boundary invitations go through ZB platform. SME Mart provides guidance but doesn't execute invitations.

#### Flow 3: Provider Views Their Boundaries

```
1. Provider goes to My Profile → Boundaries tab (or similar)
2. Shows list of boundaries they're a member of (fetched from ZB)
3. For each: boundary name, org, role, active engagements in SME Mart
4. Click → Opens boundary in ZB platform (new tab)
```

**Resolved Decision:** MINIMAL integration. SME Mart shows boundary list but all management happens in ZB platform.

#### Flow 4: Engagement Ends → Access Review (Out of Scope for SME Mart)

```
1. Task marked completed in SME Mart
2. SME Mart shows reminder: "Review provider access in ZeroBias platform"
3. Link to ZB platform boundary member management
4. Buyer manages access (keep/revoke) directly in ZB platform
```

**Resolved Decision:** Access management happens in ZB platform. SME Mart only provides reminders/links.

---

## Engagement Creation Wizard Flow

Since boundaries must exist before engagements can start, SME Mart needs a guided flow for buyers who don't have a suitable boundary.

### Wizard: "No Boundary? Let's Set One Up"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATE WORK REQUEST - Step 1 of 3: Select Boundary                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Work requests require a ZeroBias Boundary for compliance and access control.│
│                                                                             │
│ ┌─ Your Boundaries ────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │ ○ SOC 2 Compliance Program (acme-soc2-2026)                              ││
│ │   Members: 5 • Created: Jan 15, 2026                                     ││
│ │                                                                          ││
│ │ ○ ISO 27001 Implementation (acme-iso27001)                               ││
│ │   Members: 3 • Created: Feb 1, 2026                                      ││
│ │                                                                          ││
│ │ ○ General Security Consulting (acme-security)                            ││
│ │   Members: 8 • Created: Nov 10, 2025                                     ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ [🔄 Refresh List]                                                           │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ ℹ️  Don't see a suitable boundary?                                          │
│                                                                             │
│ You'll need to create one in the ZeroBias platform first:                   │
│                                                                             │
│ 1. Open ZeroBias Platform → Boundaries                                      │
│ 2. Click "Create Boundary"                                                  │
│ 3. Configure compliance scope and settings                                  │
│ 4. (Optional) Pre-invite the provider you plan to engage                    │
│ 5. Return here and click "Refresh List"                                     │
│                                                                             │
│ [Open ZeroBias Platform ↗]                                                  │
│                                                                             │
│                                                         [Cancel] [Next →]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Confirm Provider Access

Once a boundary is selected and proposal is accepted:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ENGAGEMENT SETUP - Provider Access Required                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Before this engagement can start, the provider needs access to your         │
│ boundary.                                                                    │
│                                                                             │
│ ┌─ Status ─────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │ Provider: Jane Smith (jane@securitypro.com)                              ││
│ │ Boundary: SOC 2 Compliance Program                                       ││
│ │                                                                          ││
│ │ Access Status: ❌ NOT A MEMBER                                           ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ To add Jane Smith to your boundary:                                         │
│                                                                             │
│ 1. Open the boundary in ZeroBias Platform                                   │
│ 2. Go to Members → Invite                                                   │
│ 3. Enter: jane@securitypro.com                                              │
│ 4. Assign role: External Consultant (recommended)                           │
│ 5. Send invitation                                                          │
│ 6. Wait for Jane to accept, then return here                                │
│                                                                             │
│ [Open Boundary in ZeroBias ↗]        [🔄 Check Access Again]                │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ ⏳ Waiting for provider access...                                           │
│    This engagement will be ready to start once access is confirmed.         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Access Confirmed → Engagement Starts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ENGAGEMENT SETUP - Ready to Start!                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Status ─────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │ Provider: Jane Smith                                                      ││
│ │ Boundary: SOC 2 Compliance Program                                       ││
│ │                                                                          ││
│ │ Access Status: ✅ MEMBER (External Consultant)                           ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ Everything is ready. Starting the engagement will:                          │
│ • Create a ZeroBias Task in the selected boundary                          │
│ • Create an Engagement Tag for tracking (ENG-XXXXXX)                       │
│ • Open the Transparency Center for collaboration                           │
│                                                                             │
│                                                    [Start Engagement →]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Interfaces Needed

> **Note:** SME Mart only reads boundary data from ZeroBias. All management happens in ZB platform.

### 1. Boundary Selector (Work Request Creation)

**Location:** Work request creation form (wizard step 1)

**UI:**
- Dropdown/autocomplete of buyer's existing boundaries (from ZB)
- ~~"Create New Boundary" option~~ **REMOVED - not in SME Mart**
- Shows boundary name, member count, created date
- "Refresh List" button to re-fetch from ZB
- Help text + link to ZB platform for boundary creation

**Component:** `src/components/boundaries/BoundarySelector.tsx`

### 2. My Boundaries List (Read-Only)

**Location:** `/my-profile/boundaries` or dashboard sidebar

**UI:**
- List of boundaries user belongs to (fetched from ZB)
- For each: boundary name, org, role
- Active SME Mart engagements count (from Neon)
- "Open in ZeroBias" link for each boundary (external link)
- ~~Management actions~~ **REMOVED - management in ZB**

**Component:** `src/components/boundaries/MyBoundaries.tsx`

### 3. ~~Pending Invitations~~ → ZeroBias Platform

**REMOVED from SME Mart.** Invitation management happens in ZeroBias platform.

SME Mart can optionally show: "You have pending boundary invitations. [Check in ZeroBias →]"

### 4. Boundary Context Display (Read-Only)

**Location:** Work request detail, engagement detail, Transparency Center

**UI:**
- Boundary name as badge/chip
- Click → Opens boundary in ZB platform (new tab)
- ~~Compliance frameworks~~ (show if available from ZB API)

**Component:** `src/components/boundaries/BoundaryBadge.tsx`

### 5. Provider Access Status (Read-Only)

**Location:** Engagement setup wizard (before engagement starts)

**UI:**
- Shows whether provider is a member of selected boundary
- If NOT member: Instructions to invite in ZB platform + link
- "Check Access Again" button to re-verify
- ~~Invitation management~~ **REMOVED - happens in ZB**

**Component:** `src/components/boundaries/ProviderAccessStatus.tsx`

### 6. Engagement Blocked Banner

**Location:** Engagement/work request detail when provider lacks access

**UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ ENGAGEMENT BLOCKED: Provider needs boundary access           │
│                                                                 │
│ Jane Smith is not a member of "SOC 2 Compliance Program".       │
│ Invite them in ZeroBias Platform to proceed.                    │
│                                                                 │
│ [Open Boundary in ZeroBias ↗]         [🔄 Check Again]          │
└─────────────────────────────────────────────────────────────────┘
```

**Component:** `src/components/boundaries/EngagementBlockedBanner.tsx`

---

## SDK Methods Required

> **SME Mart only needs READ operations.** All write operations (create, invite, remove) happen in ZB platform.

```typescript
// From Platform/Portal SDK - READ ONLY for SME Mart
interface BoundaryReadService {
  // Get boundary details
  get(boundaryId: string): Promise<Boundary>;

  // List boundaries user has access to
  list(): Promise<PagedResults<Boundary>>;

  // List parties in boundary (to check if provider is a member)
  listParties(boundaryId: string): Promise<PagedResults<Party>>;

  // Check if specific user is a member of boundary
  isMember(boundaryId: string, userId: string): Promise<boolean>;
}

// NOT NEEDED in SME Mart (happens in ZB platform):
// - create()
// - inviteParty()
// - removeParty()
// - acceptInvitation()
// - declineInvitation()
```

### SDK Methods SME Mart Will Use

| Method | Purpose | When Used |
|--------|---------|-----------|
| `list()` | Populate boundary selector dropdown | Work request creation |
| `get(id)` | Get boundary details for display | Engagement detail, TC |
| `listParties(id)` | Check if provider has access | Engagement setup verification |
| `isMember(id, userId)` | Quick membership check | Before engagement can start |

### Investigate SDK Availability

**TODO:** Check what boundary-related READ methods are currently available in:
- `@zerobias-com/platform-sdk`
- `@zerobias-com/portal-sdk`

Expected to need:
- ✅ `list()` - likely available
- ✅ `get(id)` - likely available
- ❓ `listParties(id)` - need to verify
- ❓ `isMember(id, userId)` - may need to derive from listParties

---

## Database Schema Updates

> **Simplified:** No invitation tracking table needed since invitations happen in ZB platform.

```sql
-- Add boundary reference to work requests
ALTER TABLE work_requests
ADD COLUMN zerobias_boundary_id TEXT,
ADD COLUMN zerobias_boundary_name TEXT;  -- Cached for display

-- Track provider access verification (cache to avoid repeated API calls)
-- This is optional - could also always check live from ZB
CREATE TABLE boundary_access_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  work_request_id UUID REFERENCES work_requests(id),
  provider_id UUID REFERENCES provider_profiles(id),
  zerobias_boundary_id TEXT NOT NULL,
  zerobias_user_id TEXT NOT NULL,  -- Provider's ZB user ID

  -- Cache state
  has_access BOOLEAN DEFAULT FALSE,
  last_checked_at TIMESTAMP DEFAULT NOW(),

  -- Access was confirmed (engagement can proceed)
  access_confirmed_at TIMESTAMP,

  UNIQUE(work_request_id, provider_id)
);

-- Index for quick lookups
CREATE INDEX idx_boundary_access_work_request
ON boundary_access_cache(work_request_id);
```

**Note:** The `boundary_access_cache` table is optional. Alternative approach:
- Always check access live via ZB SDK `listParties()` or `isMember()`
- More up-to-date but more API calls
- Decision: Start with live checks, add caching if performance issues

---

## API Routes

> **Simplified:** Read-only boundary access. No invitation management routes.

```
# Boundaries (READ ONLY - proxies to ZB SDK)
GET    /api/boundaries              → List user's boundaries (from ZB)
GET    /api/boundaries/[id]         → Get boundary details (from ZB)
GET    /api/boundaries/[id]/members → List boundary members (from ZB)

# Access Verification
GET    /api/boundaries/[id]/check-access/[userId]  → Check if user is member
POST   /api/boundaries/[id]/verify-access          → Verify and cache access status

# REMOVED - These happen in ZB platform:
# POST   /api/boundaries              → Create new boundary
# POST   /api/invitations             → Send boundary invitation
# PATCH  /api/invitations/[id]/accept → Accept invitation
# DELETE /api/invitations/[id]        → Revoke access
```

### Helper Endpoints

```typescript
// GET /api/boundaries
// Returns: List of boundaries current user has access to
// Used by: Boundary selector dropdown

// GET /api/boundaries/[id]/check-access/[userId]
// Returns: { hasAccess: boolean, role?: string, checkedAt: string }
// Used by: Engagement setup to verify provider access

// POST /api/boundaries/[id]/verify-access
// Body: { userId: string, workRequestId: string }
// Returns: { hasAccess: boolean, cached: boolean }
// Side effect: Updates boundary_access_cache if caching enabled
```

---

## Implementation Phases

> **Simplified:** Since we're read-only, fewer phases needed.

### Phase 1: SDK Integration & Discovery

1. Investigate available boundary READ methods in SDK
2. Create `src/lib/zerobias-boundaries.ts` service wrapper (read-only)
3. Test: list user's boundaries, get boundary details, list members
4. Document any missing SDK methods needed

**Deliverables:**
- SDK investigation notes
- `src/lib/zerobias-boundaries.ts` (read-only service)
- Feature requests for missing SDK methods (if any)

### Phase 2: Boundary Selector + Work Request Integration

1. Add boundary selector to work request creation wizard
2. Fetch buyer's boundaries via SDK
3. Store boundary ID on work request (required field)
4. Display boundary badge on work request detail
5. Add "Refresh List" and "Open ZeroBias" helper links

**Deliverables:**
- `src/components/boundaries/BoundarySelector.tsx`
- `src/components/boundaries/BoundaryBadge.tsx`
- Update work request creation form to wizard flow
- Schema migration (add `zerobias_boundary_id` to work_requests)
- `/api/boundaries` read-only routes

### Phase 3: Provider Access Verification

1. On proposal acceptance, check if provider is boundary member
2. If not member → Block engagement, show instructions
3. "Check Access Again" button to re-verify
4. Once verified → Engagement can proceed

**Deliverables:**
- `src/components/boundaries/ProviderAccessStatus.tsx`
- `src/components/boundaries/EngagementBlockedBanner.tsx`
- `/api/boundaries/[id]/check-access/[userId]` route
- Update proposal acceptance flow

### Phase 4: My Boundaries View (Optional)

1. List user's boundaries (fetched from ZB)
2. Show active SME Mart engagements per boundary
3. "Open in ZeroBias" links

**Deliverables:**
- `src/app/my-profile/boundaries/page.tsx` (or tab in existing profile)
- `src/components/boundaries/MyBoundaries.tsx`

### ~~Phase 5: Invitation Flow~~ REMOVED

**Not needed.** Invitations happen in ZeroBias platform.

### ~~Phase 6: Access Revocation~~ REMOVED

**Not needed.** Access management happens in ZeroBias platform.
SME Mart can show reminder: "Review provider access in ZeroBias" when engagement ends.

---

## Integration Points

### With Tasks (Plan 009)

Once boundaries are in place:
- Task creation includes `boundaryId`
- Task access requires boundary membership
- Provider sees tasks only in boundaries they're invited to

### With Work Requests

- Work request linked to boundary
- Boundary context shown on request
- Invitation triggered on engagement

### With Proposals

- Proposal acceptance triggers invitation
- Invitation status shown on proposal

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Boundary Creation** | ❌ Not in SME Mart | Don't duplicate ZB platform admin capabilities |
| **Invitation Management** | ❌ Not in SME Mart | Happens in ZB platform |
| **Access Revocation** | ❌ Not in SME Mart | Managed in ZB platform |
| **Integration Depth** | Minimal (read-only) | Show boundaries, verify access, link to ZB for management |

## Remaining Questions

1. **Boundary Required?**
   - ✅ **DECIDED:** Yes, engagement cannot start without a boundary
   - Provider must be a member before work can begin

2. **Default Boundary:**
   - Should buyers have a "default" boundary for quick requests?
   - Or always require explicit selection?
   - **Recommendation:** Explicit selection, no default (clearer for compliance)

3. **Role Configuration:**
   - What permissions should "External Consultant" role have in ZB?
   - Need to coordinate with ZB platform team
   - SME Mart doesn't control this, but should document recommended setup

4. **Multi-Boundary Engagements:**
   - Can one work request span multiple boundaries?
   - **Recommendation:** No, one boundary per request for simplicity

5. **ZB Platform Links:**
   - What's the URL pattern for opening boundaries in ZB platform?
   - Need: `https://app.zerobias.com/boundaries/{id}` or similar
   - Need: `https://app.zerobias.com/boundaries/{id}/members/invite` for invitation

6. **Stale Cache:**
   - If we cache access status, how often should we re-check?
   - **Recommendation:** Check live on critical actions; cache for display only

---

## Compliance Considerations

1. **Audit Trail**: All invitations logged in ZB
2. **Least Privilege**: Providers get minimal required access
3. **Time-Bound Access**: Consider auto-revocation policies
4. **Terms Acceptance**: May require NDA/terms before access
5. **Access Review**: Periodic review of external access

---

## Estimated Effort

> **Reduced scope** due to read-only approach.

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: SDK Discovery | Small | SDK access |
| Phase 2: Boundary Selection + Wizard | Medium | Phase 1 |
| Phase 3: Access Verification | Small | Phase 2 |
| Phase 4: My Boundaries (optional) | Small | Phase 1 |
| ~~Phase 5: Invitation Send~~ | ~~Medium~~ | REMOVED |
| ~~Phase 6: Revocation~~ | ~~Small~~ | REMOVED |

**Total:** Small-Medium (reduced from original estimate)

**Timeline:** 1-2 sprints, should be completed before Tasks integration (Plan 009)

---

## Next Steps After Approval

1. Investigate SDK read methods available:
   - `list()` - list user's boundaries
   - `get(id)` - get boundary details
   - `listParties(id)` - list members (to verify access)

2. Coordinate with ZB platform team on:
   - URL patterns for deep-linking to boundary management
   - Recommended "External Consultant" role configuration
   - Any rate limits on membership checks

3. Begin Phase 1 implementation

---

## Summary of Architecture Decision

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOUNDARY MANAGEMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │     ZEROBIAS PLATFORM   │    │        SME MART             │ │
│  │                         │    │                             │ │
│  │  ✅ Create boundaries   │    │  ✅ List user's boundaries  │ │
│  │  ✅ Invite members      │    │  ✅ Select for engagement   │ │
│  │  ✅ Manage roles        │    │  ✅ Verify provider access  │ │
│  │  ✅ Remove members      │    │  ✅ Display boundary badge  │ │
│  │  ✅ Configure settings  │    │  ✅ Link to ZB platform     │ │
│  │                         │    │                             │ │
│  │  = ADMIN ACTIONS        │    │  = READ-ONLY CONSUMPTION    │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Approval:** [ ] Approved by _____ on _____

**Last Updated:** 2026-02-06
