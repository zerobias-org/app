# Phase 14: Invitation Controls - Research

**Researched:** 2026-04-03
**Domain:** Access control patterns, entity lifecycle management, service layer gates, Angular 21 component patterns
**Confidence:** HIGH

## Summary

Phase 14 implements closed, invitation-only RFPs with vendor invitation management. The phase requires creating a new `RfpInvitation` schema class (separate from SmeMartProject), adding an `isInvitationOnly` boolean field to SmeMartProject, and implementing both a service-level access control gate in BidsService and UI-level patterns for invitation flow. The critical pitfall is the access control gate validation — BidsService must comprehensively validate invitation status, expiration, and acceptance before creating bids, with thorough test coverage for all gate paths.

**Primary recommendation:** Follow the established Pattern: (1) Create RfpInvitation model interface and GQL types, (2) Build RfpInvitationService with CRUD following BidsService pattern (PipelineWriteService writes + GraphqlReadService reads), (3) Add `isInvitationOnly` field to SmeMartProject model + field mappings, (4) Inject invitation validation gate in BidsService.submitBid() before pushBid(), (5) Create `/my-invitations` page using "My X" pattern from my-project-list.component.ts, (6) Add "Invited Vendors" tab to project-detail using MORE_TAB_GROUPS governance group pattern, (7) Build invitation request → approval workflow where vendor-submitted requests start with status `requested`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @zerobias-org/ngx-library | 0.2.29 | UI components (autocomplete, status badge, empty state) | Single source of truth for SME Mart UI; avoids custom components |
| @angular/material | ^17.x | Material Design components (tabs, chips, dialogs) | Platform standard via ngx-library theme integration |
| @angular/cdk | ^17.x | Component Dev Kit (drag/drop, overlay) | Peer dependency, already in stack |
| Angular 21 (standalone) | 21.1.4 | Standalone components, signals, control flow syntax | Project standard; no NgModules |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ZbSimpleAutocompleteComponent | 0.2.29+ | Vendor org search dropdown on Invited Vendors tab | Org/vendor name autocomplete for invitations |
| ZbResourceStatusComponent | 0.2.29+ | Status badge for invitation status chips | Display pending/accepted/declined/revoked/expired/requested status |
| ZbEmptyStateContainerComponent | 0.2.29+ | Empty state on My Invitations page | Show "No invitations" with icon |
| @zerobias-com/zerobias-angular-client | ^1.1.23+ | ZeroBias SDK wrapper (hydra client, tag API) | Already in use; access to org/user APIs for vendor lookup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ZbSimpleAutocompleteComponent | Custom autocomplete | ngx-library handles Material theming, debounce, A11y automatically — custom adds 150+ lines with maintenance burden |
| ZbResourceStatusComponent | mat-chip with manual colors | Status component handles color/text logic per status — chip requires color switch statement in every template |
| Pipeline + GraphQL for RfpInvitation | Direct Neon writes via SmeMartDbService | Pipeline pattern is consistent with all Phase 13+ entities (Bid, Review, etc.); GraphQL reads enable server-side filtering |

**Installation:**
```bash
# All dependencies already in workspace
npm list @zerobias-org/ngx-library @angular/material @angular/cdk
```

**Version verification:** 
- `@zerobias-org/ngx-library@0.2.29` — verified 2026-04-03 (current workspace version)
- Angular 21.1.4 (project constraint)
- Material ^17.3.0 (peer of ngx-library)

## Architecture Patterns

### Recommended Project Structure (additions to existing project/)

```
src/app/
├── core/
│   ├── models/
│   │   └── rfp-invitation.model.ts          # RfpInvitation interface + CreateRequest
│   ├── services/
│   │   └── rfp-invitation.service.ts        # CRUD, validation, status transitions
│   ├── field-mappings.ts                    # Add RFP_INVITATION_FIELD_MAPPING
│   └── gql-types.ts                         # Add GqlRfpInvitationResponse + enum
├── pages/
│   ├── my-invitations/                      # NEW
│   │   ├── my-invitations.component.ts      # List component w/ filter + card grid
│   │   ├── my-invitations.component.html
│   │   ├── my-invitations.component.scss
│   │   └── my-invitations.routes.ts
│   └── project/
│       ├── tabs/
│       │   └── project-invited-vendors-tab.component.ts  # NEW — Governance tab
│       └── project-detail.component.ts      # Add "Invited Vendors" to MORE_TAB_GROUPS
└── shared/
    └── components/
        └── invitation-teaser/               # NEW — Reusable teaser view
            ├── invitation-teaser.component.ts
            ├── invitation-teaser.component.html
            └── invitation-teaser.component.scss
```

### Pattern 1: RfpInvitation Entity Service (PipelineWriteService + GraphqlReadService)

**What:** RfpInvitationService follows the established pattern: service layer mediates between Pipeline (async writes) and GraphQL (reads). Optimistic updates via PipelineWriteCache mask the ~3-5s Pipeline→GQL indexing delay.

**When to use:** All entity CRUD operations. This is THE pattern for SME Mart entities (Bid, Review, SmeMartProject, etc.).

**Example:**

```typescript
// src/app/core/models/rfp-invitation.model.ts
export interface RfpInvitation {
  id: string;
  projectId: string;           // FK to SmeMartProject (link field in GQL)
  vendorOrgId: string;          // Invited org UUID
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired' | 'requested';
  invitedAt: string;            // ISO 8601
  respondedAt: string | null;   // Null until vendor accepts/declines
  invitationMessage?: string | null;  // Optional personalization from buyer
  requestReason?: string | null;      // Vendor's reason if status='requested'
  createdAt: string;
  updatedAt: string;
}

export interface CreateRfpInvitationRequest {
  projectId: string;
  vendorOrgId: string;
  invitationMessage?: string;
}

export interface UpdateRfpInvitationRequest {
  status?: RfpInvitation['status'];
  respondedAt?: string;
  invitationMessage?: string;
  requestReason?: string;
}

// src/app/core/services/rfp-invitation.service.ts
@Injectable({ providedIn: 'root' })
export class RfpInvitationService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  private readonly scalarFields = [
    'id', 'projectId', 'vendorOrgId', 'status', 'invitedAt', 'respondedAt',
    'invitationMessage', 'requestReason', 'dateCreated', 'dateLastModified',
  ];

  /** Create invitation and push to Pipeline. */
  async createInvitation(data: CreateRfpInvitationRequest): Promise<RfpInvitation> {
    const id = `invitation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const invitation: RfpInvitation = {
      id,
      projectId: data.projectId,
      vendorOrgId: data.vendorOrgId,
      status: 'pending',
      invitedAt: now,
      respondedAt: null,
      invitationMessage: data.invitationMessage ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.pipelineWrite.push('RfpInvitation', invitation);
    return invitation;
  }

  /** List invitations for a project (buyer view). */
  async listByProject(projectId: string): Promise<RfpInvitation[]> {
    const fieldStr = this.scalarFields.join(' ');
    const query = `{ RfpInvitation(projectId: ".eq.${projectId}") { ${fieldStr} } }`;
    const data = await this.graphqlRead.rawQuery(query, 1, 100);
    const rawItems = (data['RfpInvitation'] as Record<string, unknown>[]) ?? [];
    return rawItems.map(gql => mapGqlToNeon(gql, RFP_INVITATION_FIELD_MAPPING.gqlToNeon));
  }

  /** List invitations for vendor (My Invitations page). */
  async listByVendorOrg(vendorOrgId: string): Promise<RfpInvitation[]> {
    // Filter: vendorOrgId + status IN (pending, accepted, requested)
    const query = `{
      RfpInvitation(
        vendorOrgId: ".eq.${vendorOrgId}",
        status: ".in.[pending,accepted,requested]"
      ) { ${this.scalarFields.join(' ')} }
    }`;
    const data = await this.graphqlRead.rawQuery(query, 1, 100);
    const rawItems = (data['RfpInvitation'] as Record<string, unknown>[]) ?? [];
    return rawItems.map(gql => mapGqlToNeon(gql, RFP_INVITATION_FIELD_MAPPING.gqlToNeon));
  }

  /** Vendor accepts invitation (marks as accepted). */
  async acceptInvitation(invitationId: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(invitationId);
    if (!current) throw new Error(`Invitation ${invitationId} not found`);
    if (current.status !== 'pending') {
      throw new Error(`Cannot accept invitation with status ${current.status}`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pipelineWrite.push('RfpInvitation', updated);
    // TODO: Notification — "Invitation accepted" to buyer (notification center integration, Phase ?)
    return updated;
  }

  /** Vendor declines invitation (marks as declined). */
  async declineInvitation(invitationId: string, reason?: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(invitationId);
    if (!current) throw new Error(`Invitation ${invitationId} not found`);
    if (current.status !== 'pending') {
      throw new Error(`Cannot decline invitation with status ${current.status}`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'declined',
      respondedAt: new Date().toISOString(),
      requestReason: reason ?? null,
      updatedAt: new Date().toISOString(),
    };

    this.pipelineWrite.push('RfpInvitation', updated);
    // TODO: Notification — "Invitation declined" to buyer
    return updated;
  }

  /** Buyer revokes invitation (pending or accepted). */
  async revokeInvitation(invitationId: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(invitationId);
    if (!current) throw new Error(`Invitation ${invitationId} not found`);
    if (current.status === 'revoked' || current.status === 'expired') {
      throw new Error(`Cannot revoke invitation with status ${current.status}`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    };

    this.pipelineWrite.push('RfpInvitation', updated);
    // TODO: Notification — "Invitation revoked" to vendor
    return updated;
  }

  /** Vendor requests invitation (status → requested). */
  async requestInvitation(projectId: string, vendorOrgId: string, reason?: string): Promise<RfpInvitation> {
    // Check if invitation already exists
    const existing = await this.findByProjectAndVendor(projectId, vendorOrgId);
    if (existing) {
      throw new Error(`Invitation already exists for this vendor on this project`);
    }

    const id = `invitation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const invitation: RfpInvitation = {
      id,
      projectId,
      vendorOrgId,
      status: 'requested',
      invitedAt: now,
      respondedAt: null,
      requestReason: reason ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.pipelineWrite.push('RfpInvitation', invitation);
    // TODO: Notification — "Invitation request received" to buyer
    return invitation;
  }

  /** Buyer approves a request (status: requested → accepted). */
  async approveRequest(invitationId: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(invitationId);
    if (!current) throw new Error(`Invitation ${invitationId} not found`);
    if (current.status !== 'requested') {
      throw new Error(`Can only approve invitations with status 'requested'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pipelineWrite.push('RfpInvitation', updated);
    // TODO: Notification — "Invitation request approved" to vendor
    return updated;
  }

  /** Buyer declines a request (status: requested → declined). */
  async declineRequest(invitationId: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(invitationId);
    if (!current) throw new Error(`Invitation ${invitationId} not found`);
    if (current.status !== 'requested') {
      throw new Error(`Can only decline invitations with status 'requested'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'declined',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pipelineWrite.push('RfpInvitation', updated);
    // TODO: Notification — "Invitation request declined" to vendor
    return updated;
  }

  /** Fetch single invitation by ID. */
  async getInvitation(id: string): Promise<RfpInvitation | null> {
    const cached = this.pipelineWrite.getCached('RfpInvitation', id);
    if (cached) {
      return mapGqlToNeon(cached, RFP_INVITATION_FIELD_MAPPING.gqlToNeon);
    }

    const invitation = await this.graphqlRead.getById<GqlRfpInvitationResponse>(
      'RfpInvitation',
      id,
      this.scalarFields,
    );
    if (!invitation) return null;

    this.pipelineWrite.seedCache('RfpInvitation', id, invitation as unknown as Record<string, unknown>);
    return mapGqlToNeon(invitation, RFP_INVITATION_FIELD_MAPPING.gqlToNeno);
  }

  /** Find invitation by project + vendor org. */
  async findByProjectAndVendor(projectId: string, vendorOrgId: string): Promise<RfpInvitation | null> {
    const fieldStr = this.scalarFields.join(' ');
    const query = `{
      RfpInvitation(
        projectId: ".eq.${projectId}",
        vendorOrgId: ".eq.${vendorOrgId}"
      ) { ${fieldStr} }
    }`;
    const data = await this.graphqlRead.rawQuery(query, 1, 1);
    const rawItems = (data['RfpInvitation'] as Record<string, unknown>[]) ?? [];
    if (!rawItems.length) return null;
    return mapGqlToNeon(rawItems[0], RFP_INVITATION_FIELD_MAPPING.gqlToNeon);
  }
}
```

### Pattern 2: Access Control Gate in BidsService

**What:** Defense-in-depth: service-level validation BEFORE calling pipelineWrite.push(). BidsService.submitBid() (and submitDraft → finalize path) must validate invitation status. Gate checks three conditions: (1) If project is invitation-only, (2) Vendor has an invitation for that project, (3) Invitation status is 'accepted' (not pending, declined, revoked, expired).

**When to use:** Any operation that creates or updates an entity that should be access-controlled. In Phase 14: bid submission gates. In future phases: document submission, etc.

**Example:**

```typescript
// src/app/core/services/bids.service.ts — submitBid method with gate

/**
 * Submit a new bid (simple flow) with optimistic update.
 * Links bid to SmeMartProject via `project` link field.
 * 
 * GATE: If project is invitation-only, validates vendor has accepted invitation.
 */
async submitBid(data: {
  project_id: string;
  provider_id: string;
  cover_letter?: string;
  proposed_price?: string;
  proposed_timeline?: string;
}): Promise<Bid> {
  // Fetch project to check isInvitationOnly flag
  const project = await this.projectService.getProject(data.project_id);
  if (!project) {
    throw new Error(`Project ${data.project_id} not found`);
  }

  // === ACCESS CONTROL GATE ===
  if (project.isInvitationOnly) {
    // Get vendor's org ID (from provider profile or session)
    const vendorOrgId = await this.getVendorOrgId(data.provider_id);
    
    // Check if vendor has an accepted invitation for this project
    const invitation = await this.rfpInvitationService.findByProjectAndVendor(
      data.project_id,
      vendorOrgId,
    );

    // Validation logic
    if (!invitation) {
      throw new Error(
        `Vendor does not have an invitation to submit a bid on this RFP. ` +
        `Request an invitation to participate.`
      );
    }

    if (invitation.status !== 'accepted') {
      throw new Error(
        `Invitation status is '${invitation.status}'. ` +
        `You must accept the invitation before submitting a bid.`
      );
    }

    // Optional: Check if invitation is expired (only if we add expiry in future)
    // if (this.isInvitationExpired(invitation)) { throw new Error(...); }
  }
  // === END GATE ===

  // Proceed with bid creation (unchanged)
  const id = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const bid: Bid = {
    id,
    request_id: null,
    project_id: data.project_id,
    provider_id: data.provider_id,
    cover_letter: data.cover_letter || null,
    proposed_price: data.proposed_price || null,
    proposed_timeline: data.proposed_timeline || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  this.pushBid(bid);
  return bid;
}
```

### Pattern 3: "My X" Page (My Invitations)

**What:** Reuse the "My Projects" page pattern (my-project-list.component.ts) for My Invitations. Single-route, lazy-loaded under `/my-invitations`, card/grid layout with filter bar, status chips.

**When to use:** Any vendor-facing list of personal items (invitations, saved searches, watchlist, etc.).

**Example structure:**

```typescript
// src/app/pages/my-invitations/my-invitations.component.ts
@Component({
  selector: 'app-my-invitations',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatChipsModule, ...],
  templateUrl: './my-invitations.component.html',
  styleUrl: './my-invitations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyInvitationsComponent implements OnInit {
  private readonly rfpInvitationService = inject(RfpInvitationService);
  private readonly smeMartProjectService = inject(SmeMartProjectService);
  private readonly impersonation = inject(ImpersonationService);

  invitations = signal<RfpInvitation[]>([]);
  projects = signal<Map<string, SmeMartProject>>(new Map());
  loading = signal(false);

  statusFilters = ['pending', 'accepted', 'requested'];
  selectedStatusFilter = signal<string | null>(null);

  async ngOnInit() {
    await this.loadInvitations();
  }

  async loadInvitations() {
    this.loading.set(true);
    try {
      const vendorOrgId = await this.impersonation.getEffectiveOrgId();
      const all = await this.rfpInvitationService.listByVendorOrg(vendorOrgId);
      this.invitations.set(all);

      // Preload projects for display
      const projectIds = new Set(all.map(i => i.projectId));
      for (const id of projectIds) {
        const project = await this.smeMartProjectService.getProject(id);
        if (project) {
          this.projects.set(id, project);
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  filteredInvitations = computed(() => {
    const filter = this.selectedStatusFilter();
    const invites = this.invitations();
    return filter ? invites.filter(i => i.status === filter) : invites;
  });

  async acceptInvitation(invitationId: string) {
    await this.rfpInvitationService.acceptInvitation(invitationId);
    await this.loadInvitations();
  }

  async declineInvitation(invitationId: string, reason?: string) {
    await this.rfpInvitationService.declineInvitation(invitationId, reason);
    await this.loadInvitations();
  }
}
```

### Pattern 4: Tab Addition (Invited Vendors tab on Project Detail)

**What:** Add "Invited Vendors" tab to the "Governance" group in MORE_TAB_GROUPS. Route → project-invited-vendors-tab.component.ts. Component lists all RfpInvitations for the project with bulk actions (invite, revoke, approve requests).

**When to use:** Any buyer-focused administrative view on a project.

**Example:**

```typescript
// In project-detail.component.ts, update MORE_TAB_GROUPS:

const MORE_TAB_GROUPS: readonly TabGroup[] = [
  // ... other groups ...
  {
    heading: 'Governance',
    tabs: [
      { path: 'parties', label: 'Parties', icon: 'group' },
      { path: 'invited-vendors', label: 'Invited Vendors', icon: 'mail_outline' }, // NEW
      { path: 'compliance', label: 'Compliance', icon: 'verified_user' },
      { path: 'reviews', label: 'Reviews', icon: 'rate_review' },
    ],
  },
];
```

Then in project.routes.ts:

```typescript
{ path: 'invited-vendors', component: ProjectInvitedVendorsTabComponent, data: { title: 'Invited Vendors' } },
```

### Anti-Patterns to Avoid

- **DO NOT** hardcode vendor org lookup — always fetch from user session / vendor profile to ensure org scoping is correct
- **DO NOT** skip the gate in BidsService — UI disables the button, but a determined user can make direct service calls; service-level validation is mandatory (defense in depth)
- **DO NOT** create multiple invitation records for the same vendor on the same project — query first before creating (unique constraint)
- **DO NOT** forget TODO stubs at notification trigger points (8 total: invitation sent, request received, request approved, request declined, invitation accepted, invitation declined, invitation revoked, auto-expired)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Org/vendor autocomplete | Custom autocomplete with Material inputs | `ZbSimpleAutocompleteComponent` from ngx-library | Handles debounce, min-chars, A11y, theming automatically |
| Status badge colors | CSS class switch in template | `ZbResourceStatusComponent` from ngx-library | Centralized color palette, consistent with platform; avoids scattered CSS |
| Vendor org lookup | Manual HTTP call to user service | Inject ZerobiasClientApp, call `getCurrentOrg()` + `listMyOrgs()` | Already authenticated, handles multi-tenancy headers |
| Null checking for optional fields | Manual `field !== null && field !== undefined` | TypeScript strict mode + nullish coalescing (`field ?? default`) | Simpler, type-safe |
| Date comparisons for expired invitations | Manual `new Date(invitedAt) < new Date()` logic | Create utility: `isInvitationExpired(invitation)` in RfpInvitationService | Single source of truth; testable |

**Key insight:** The access control gate is NOT something to defer or skip. Every service-level state transition (bid creation, document upload, form submission) requires a gate that checks authorization. Build the gate FIRST, wire UI disabling SECOND — the service is the source of truth.

## Runtime State Inventory

**Trigger:** Phase 14 is a NEW ENTITY phase (RfpInvitation does not exist yet). No existing runtime state to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — RfpInvitation is new entity | No migration required |
| Live service config | None — no external services reference RfpInvitation | No config changes |
| OS-registered state | None | No re-registration needed |
| Secrets/env vars | None — uses existing API keys (Platform, Hydra, Hub) | No new secrets |
| Build artifacts | None — new code only, no stale build remnants | No cleanup required |

## Common Pitfalls

### Pitfall 1: Incomplete Access Control Gate (CRITICAL)

**What goes wrong:** UI disables "Submit Bid" button for uninvited vendors, but the service allows it anyway. Vendor crafts direct service call (or curl request) bypassing the button. Bid is created for a vendor who should not have access.

**Why it happens:** Developer assumes UI validation is sufficient. Service is treated as "safe because UI guards it." This is a common security anti-pattern (defense in depth is missing).

**How to avoid:**
1. **Service gate BEFORE any write:** In BidsService.submitBid(), check invitation status BEFORE calling pipelineWrite.push()
2. **Throw on gate failure:** Reject with explicit error message (not silent return)
3. **Test all paths:** Unit tests for (a) uninvited vendor, (b) invited but pending, (c) invited and accepted, (d) invited but declined, (e) invited but revoked
4. **UI respects gate errors:** Catch service errors in component, display user-friendly message

**Warning signs:**
- "Button is disabled, that should be enough" comments in code
- No service-level validation tests for gate paths
- Gate logic in component instead of service
- Bid creation succeeds even when gate error is thrown (means error is silently swallowed)

### Pitfall 2: Invitation Status Transition Chaos

**What goes wrong:** Code allows invalid state transitions (e.g., pending → requested, or pending → pending again). Over time, invitations enter contradictory states.

**Why it happens:** Status transitions are implemented piecemeal without a clear state machine. Developer adds "approve request" method but forgets to validate current status.

**How to avoid:**
1. **Document valid transitions:** Create a state diagram or transition table in service
2. **Validate EVERY transition:** Each method (acceptInvitation, declineInvitation, approveRequest, declineRequest, revokeInvitation) checks current status and throws if transition is invalid
3. **Test transitions:** Unit tests covering all valid and invalid transitions
4. **Immutable update:** Create new object with updated status, don't mutate existing

**Warning signs:**
- "status can be anything" in tests
- Transitions that don't validate pre-state
- No error thrown for invalid transitions (silent failure)

### Pitfall 3: Missing Notification Stubs

**What goes wrong:** Phase 14 code launches without TODO comments marking notification points. Later, Phase 15+ discovers missing notifications with no clue where they should go.

**Why it happens:** Notification center is out-of-scope for Phase 14, so developer skips the trigger points entirely. Six months later, no one remembers where notifications should fire.

**How to avoid:**
1. **Add TODO comments at EVERY trigger point:** invitation sent, request received, request approved, request declined, invitation accepted/declined, invitation revoked
2. **TODO format:** `// TODO: Notification — "X" to Y (notification center integration, Phase ?)`
3. **Reference:** See similar TODOs in engagement-lifecycle.service.ts for format

**Warning signs:**
- No TODOs in RfpInvitationService
- Notification points hardcoded later (email, push) instead of unified notification center
- "Where should notifications go?" question arises during Phase 15

### Pitfall 4: Org Scoping Confusion (Multi-Tenancy)

**What goes wrong:** Vendor invitation list shows invitations from other orgs. Buyer creates invitations for wrong org. Org ID header mismatches GQL queries.

**Why it happens:** Org ID scoping is implicit in query filters. Developer forgets to pass org ID to queries, or uses wrong org context.

**How to avoid:**
1. **Always scope queries by org:** `vendorOrgId` filter is mandatory in listByVendorOrg()
2. **Fetch org ID from ZeroBias session:** Use ImpersonationService.getEffectiveOrgId(), not hardcoded
3. **Unit test with multiple orgs:** Create invitations for Org A and Org B, verify filters return correct subset
4. **Log org ID in error messages:** "Invitation XYZ not found in org ABC" makes debugging easier

**Warning signs:**
- No org ID in GQL filter strings
- Org ID hardcoded as a constant
- Tests don't mock ImpersonationService.getEffectiveOrgId()

### Pitfall 5: Schema Mismatch — Missing isInvitationOnly Field

**What goes wrong:** Code adds `isInvitationOnly` to SmeMartProject model, but schema repo doesn't have the field definition. GQL queries return undefined. Gate logic breaks.

**Why it happens:** Developer forgets to add field to schema YAML and run dataloader before committing. Or adds field to code but schema PR is not merged yet.

**How to avoid:**
1. **Schema repo is source of truth:** Add `isInvitationOnly` boolean field to SmeMartProject class YAML FIRST
2. **Run dataloader after schema changes:** `npm run verify` in schema/package/w3geekery/sme-mart/
3. **Update gql-types.ts:** Add `isInvitationOnly?: boolean` to GqlSmeMartProjectResponse
4. **Update model interface:** Add `isInvitationOnly?: boolean` to SmeMartProject interface
5. **Update field mappings:** Add entry to SMEMART_PROJECT_FIELD_MAPPING
6. **Test: query project and log the field:** Verify GQL returns the field, not undefined

**Warning signs:**
- Code references `project.isInvitationOnly` but queries return it as `undefined`
- "isInvitationOnly is not a field" error in TypeScript
- Gate logic uses `isInvitationOnly ?? false` (workaround for undefined)

## Code Examples

Verified patterns from existing codebase:

### Entity Model + Service (Bid Pattern)

```typescript
// src/app/core/models/bid.model.ts — reference pattern
export interface Bid {
  id: string;
  request_id: string | null;
  project_id?: string | null;
  provider_id: string | null;
  cover_letter: string | null;
  proposed_price: string | null;
  proposed_timeline: string | null;
  status: BidStatus;
  created_at: string;
  updated_at: string;
}
```

**APPLY TO RfpInvitation:** Same pattern (id, timestamps, foreign keys as separate fields, status enum).

### Field Mapping Pattern

```typescript
// src/app/core/field-mappings.ts — excerpt for Bid
export const BID_FIELD_MAPPING = {
  neonToGql: {
    id: 'id',
    request_id: 'engagementId',
    project_id: 'project',
    provider_id: 'providerId',
    status: 'status',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: {
    id: 'id',
    engagementId: 'request_id',
    project: 'project_id',
    providerId: 'provider_id',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
} as const;
```

**APPLY TO RfpInvitation:** Create RFP_INVITATION_FIELD_MAPPING following same bidirectional pattern.

### Service CRUD Pattern (BidsService)

```typescript
// src/app/core/services/bids.service.ts — submitBid method
async submitBid(data: {
  project_id: string;
  provider_id: string;
  cover_letter?: string;
  proposed_price?: string;
  proposed_timeline?: string;
}): Promise<Bid> {
  const id = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const bid: Bid = {
    id,
    request_id: null,
    project_id: data.project_id,
    provider_id: data.provider_id,
    cover_letter: data.cover_letter || null,
    proposed_price: data.proposed_price || null,
    proposed_timeline: data.proposed_timeline || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  this.pushBid(bid);
  return bid;
}
```

**APPLY TO RfpInvitationService.createInvitation():** Generate UUID + timestamps, push to Pipeline immediately.

### Tab Pattern (Project Detail)

```typescript
// src/app/pages/project/project-detail.component.ts — MORE_TAB_GROUPS structure
const MORE_TAB_GROUPS: readonly TabGroup[] = [
  {
    heading: 'Governance',
    tabs: [
      { path: 'parties', label: 'Parties', icon: 'group' },
      { path: 'compliance', label: 'Compliance', icon: 'verified_user' },
      { path: 'reviews', label: 'Reviews', icon: 'rate_review' },
    ],
  },
];
```

**APPLY:** Add `{ path: 'invited-vendors', label: 'Invited Vendors', icon: 'mail_outline' }` to Governance group.

### "My X" Page Pattern

```typescript
// src/app/pages/my-projects/my-project-list.component.ts — structure to follow
@Component({
  selector: 'app-my-project-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatChipsModule, ...],
  templateUrl: './my-project-list.component.html',
  styleUrl: './my-project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProjectListComponent implements OnInit {
  private readonly projectService = inject(SmeMartProjectService);
  private readonly impersonation = inject(ImpersonationService);

  projects = signal<SmeMartProject[]>([]);
  loading = signal(false);

  async ngOnInit() {
    this.loading.set(true);
    try {
      const result = await this.projectService.listProjects({ pageSize: 50 });
      this.projects.set(result.items);
    } finally {
      this.loading.set(false);
    }
  }
}
```

**APPLY TO MyInvitationsComponent:** Same pattern, replace listProjects() with rfpInvitationService.listByVendorOrg().

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| View-level validation only (no gate) | Service + UI validation (defense in depth) | Phase 13+ (Platform services) | Access control is now bulletproof — requires service-level gate |
| Hardcoded org IDs in queries | Dynamic org ID from ZeroBias session | Phase 12 (Multi-tenancy) | Supports multi-org scenarios, no data leakage |
| Neon direct writes (SmeMartDbService) | Pipeline writes + GQL reads (Plan 075) | Phase 13 (AuditgraphDB migration) | All entities go through unified Pipeline; enables audit logging |
| Manual date handling (string concatenation) | ISO 8601 strings + utility functions | Phase 11+ (Timestamps) | Consistent, queryable, timezone-safe |
| NgModules + decorators | Standalone components + inject() | Phase 11 (Angular 21 upgrade) | Smaller bundle, easier to tree-shake, modern Angular |

**Deprecated/outdated:**
- `SmeMartDbService.listRows('table')` — replaced by GraphqlReadService for reads
- Neon direct writes (legacy) — replaced by PipelineWriteService
- Request → Engagement naming (legacy) — all code now uses SmeMartProject

## Open Questions

1. **Notification center integration timing (D-16 stub placement):**
   - What we know: Phase 14 adds TODO stubs at 8 trigger points, Phase 15+ integrates notifications
   - What's unclear: Which specific phase handles notification center? (Phase 18? Later?)
   - Recommendation: Verify with Kevin or roadmap.md. Place comprehensive stubs now so Phase 15+ can grep and implement.

2. **Invitation expiration dates (D-29 deferred, but mention in schema YAML):**
   - What we know: Phase 14 scope is explicit boolean + status tracking, not per-invitation expiry
   - What's unclear: Should RfpInvitation model include expirationDate field for future use?
   - Recommendation: Add nullable `expirationDate?: string` to model and field mappings now. Gate validation can ignore it in Phase 14 (check for null). Future phase can implement auto-expire logic.

3. **Request approval vs. direct invite (D-14 full-cycle, but buyer UX unclear):**
   - What we know: Vendor requests invitation → buyer sees request on Invited Vendors tab → buyer approves/declines
   - What's unclear: Is "approve" instant acceptance (status → accepted), or does it send a new invitation for vendor to accept again?
   - Recommendation: Per D-14, "approve" sets status to `pending`/`accepted` directly — vendor gets immediate access, no double-confirm. Brian will clarify on Tuesday if needed.

## Environment Availability

**Step 2.6 Skipped:** Phase 14 has no new external dependencies. Existing tools and services:
- ZeroBias SDK (hydra, platform client) — already available
- Neon PostgreSQL database — already available
- Angular 21, Material, ngx-library — already installed
- NPM packages (@zerobias-com/*, @zerobias-org/*) — already available

No new CLI tools, runtimes, or services required.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Angular testing utilities |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test src/app/core/services/rfp-invitation.service.spec.ts` |
| Full suite command | `npm test` (all tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D1-01 | Buyer toggles `isInvitationOnly` on RFP | unit | `npm test src/app/core/services/sme-mart-project.service.spec.ts` | ✅ (update existing) |
| D1-02 | Buyer adds vendors to invitation list | unit | `npm test src/app/core/services/rfp-invitation.service.spec.ts` | ❌ Wave 0 |
| D1-03 | Vendor accepts/declines invitation | unit | `npm test src/app/core/services/rfp-invitation.service.spec.ts` | ❌ Wave 0 |
| D1-04 | Gate blocks uninvited vendor bid creation | unit | `npm test src/app/core/services/bids.service.spec.ts` | ✅ (add gate tests) |
| D1-05 | Vendor views My Invitations page | integration | `npm test src/app/pages/my-invitations/my-invitations.component.spec.ts` | ❌ Wave 0 |
| D1-06 | Buyer views Invited Vendors tab | integration | `npm test src/app/pages/project/tabs/project-invited-vendors-tab.component.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test src/app/core/services/rfp-invitation.service.spec.ts` (service layer, fastest feedback)
- **Per wave merge:** `npm test` (full suite including components, all gate paths)
- **Phase gate:** Full suite green + gate path code review (8 scenarios: uninvited, pending, accepted, declined, revoked, requested, auto-expired)

### Wave 0 Gaps
- [ ] `src/app/core/services/rfp-invitation.service.spec.ts` — covers D1-02, D1-03, status transitions, gate validation
- [ ] `src/app/pages/my-invitations/my-invitations.component.spec.ts` — covers D1-05 (load, filter, accept/decline, request)
- [ ] `src/app/pages/project/tabs/project-invited-vendors-tab.component.spec.ts` — covers D1-06 (list, invite, revoke, approve requests)
- [ ] Update `src/app/core/services/bids.service.spec.ts` — add comprehensive gate tests (6 scenarios: uninvited, pending, accepted, declined, revoked, expired)
- [ ] Update `src/app/core/services/sme-mart-project.service.spec.ts` — test `isInvitationOnly` field CRUD
- [ ] `src/app/core/models/rfp-invitation.model.ts` + `gql-types.ts` + field mappings (no tests needed, types)

**Framework install:** None — Vitest + Angular testing already installed from Phase 11+

## Sources

### Primary (HIGH confidence)
- Phase 13 CONTEXT.md + RESEARCH.md — established RfpInvitation entity model decisions (D-01 through D-14)
- BidsService implementation (`src/app/core/services/bids.service.ts`) — service CRUD pattern verified
- SmeMartProjectService (`src/app/core/services/sme-mart-project.service.ts`) — field mapping + Pipeline write pattern
- Field mappings source (`src/app/core/field-mappings.ts`) — bidirectional mapping pattern
- Project detail component (`src/app/pages/project/project-detail.component.ts`) — tab structure, MORE_TAB_GROUPS pattern
- My Project List (`src/app/pages/my-projects/my-project-list.component.ts`) — "My X" page pattern
- sme-mart-architect skill (`.claude/skills/sme-mart-architect.md`) — Angular 21 + ngx-library conventions
- CLAUDE.md project guidance — team, constraints, tech stack
- ngx-library package (0.2.29) — component catalog verified

### Secondary (MEDIUM confidence)
- Phase 13 Research (pilot-projects) — established SmeMartProject model, projectType field pattern
- REQUIREMENTS.md (D1-01 through D1-06) — requirement traceability
- STATE.md — project roadmap, Phase 14 effort estimate (12–16 hours)
- Pending schema changes document (`.planning/notes/pending-schema-changes.md`) — tracks `isInvitationOnly` + RfpInvitation as immediate needs

### Tertiary (LOW confidence)
- None — all research grounded in code inspection or explicit documentation

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — ngx-library, Angular 21, Material all verified in workspace
- Architecture: **HIGH** — BidsService, SmeMartProjectService patterns examined in detail; PipelineWriteService + GraphqlReadService flow verified
- Pitfalls: **HIGH** — Critical Pitfall #1 (access control gate) explicitly documented in Phase 14 CONTEXT.md; other pitfalls derived from established patterns
- Test requirements: **MEDIUM** — Vitest available, but test structure for new components inferred from existing test files (not examined in detail)

**Research date:** 2026-04-03
**Valid until:** 2026-04-17 (14 days — Phase 14 begins planning imminently; schema changes may shift timeline)

---

*Phase: 14-invitation-controls*
*Research completed: 2026-04-03*
