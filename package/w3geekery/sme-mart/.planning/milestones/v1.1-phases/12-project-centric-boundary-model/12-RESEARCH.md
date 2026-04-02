# Phase 12: Project-Centric Boundary Model - Research

**Researched:** 2026-04-01
**Domain:** Angular 21 UI enhancement — org membership distinction, boundary party visualization
**Confidence:** HIGH

## Summary

Phase 12 surfaces the internal/external org membership distinction and project boundary parties in the SME Mart UI. The work centers on three UI enhancements:

1. **Org list cards** — Add Internal/External badge and engagement/project count metrics
2. **Org overview** — Add Projects panel grouped by parent engagement
3. **Project detail** — Replace "Members" stub route with read-only "Parties" tab showing boundary party information

All required ZeroBias platform APIs are confirmed available and actively used in production. The Angular project uses standalone components with signals and modern control flow (`@if`, `@for`). Core library `@zerobias-org/ngx-library` provides all UI components needed. No boundary admin/CRUD operations are required — the phase is read-only visualization only.

**Primary recommendation:** Implement in order: (1) org card enhancements, (2) org overview Projects panel, (3) project Parties tab. Each builds on established patterns and can be unit-tested independently.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Internal/External detection:** `whoAmI().ownerId === org.id` → Internal member, else External. Use ZbResourceStatusComponent chips with fixed colors (Internal=green, External=blue).
- **Org overview Projects panel:** Single panel using ZbSimplePanelComponent, projects grouped by engagement (as group headers with links to `/engagement/:id`), no separate Engagements panel.
- **Project Parties tab:** Replace `members` route with `parties`. Accordion per boundary. All read-only — no boundary CRUD in SME Mart. Data sourced from `platform.Boundary` APIs keyed off `SmeMartProject.boundaryIds`.
- **Data fetching:** Engagement/project counts via GQL. Boundary parties fetched lazily (only on tab click). Create `BoundaryService` wrapping platform APIs.

### Claude's Discretion
- Exact columns in parties table (minimum: Party Name, Roles, Teams)
- Loading/empty states for parties tab and projects panel
- Whether to cache whoAmI ownerId or fetch fresh each time
- Accordion expand/collapse default state (auto-expand single boundary?)

### Deferred Ideas (OUT OF SCOPE)
- Project context switcher (replaces org switcher) — needs more UX design
- Sub-project nesting — platform doesn't model this
- Permission cascading (boundary role → feature gating) — business logic for later
- Boundary admin in SME Mart (party creation, role assignment) — stays in ZB Governance app
- Engagement detail party view — no stubs to replace on engagement detail

</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 21.1.0 | Framework, standalone components, signals, control flow | Latest LTS, SME Mart standard |
| @angular/core | 21.1.0 | Dependency injection, component decorator, signal reactive state | Angular framework core |
| @angular/material | 21.1.4 | Material Design components (buttons, icons, tabs, dividers) | Platform/ngx-library standard |
| @zerobias-org/ngx-library | 0.2.28 | UI components (ZbSimplePanelComponent, ZbResourceStatusComponent, ZbCustomizableTableComponent, ZbAvatarLabelComponent) | SME Mart built-in component library |
| @zerobias-com/zerobias-angular-client | 1.1.29 | Angular wrapper around zerobias-client SDK; provides ZerobiasClientApp, ZerobiasClientApi, platform Boundary API access | Official ZeroBias SDK for Angular |
| @zerobias-com/platform-sdk | [included in angular-client] | Platform API types and BoundaryApi class | Boundary APIs (listBoundaryParties, listBoundaryPartyRoles, listBoundaryTeams) |
| rxjs | 7.8.0 | Observable stream handling for async operations | Angular standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CommonModule | 21.1.0 | Control flow (@if, @for, @switch), pipes | Every component template |
| MatButtonModule | 21.1.4 | Material buttons in org overview, parties table | Every page with actions |
| MatIconModule | 21.1.4 | Material icons for badges, tabs, navigation | Badge icons, tab icons |
| MatTooltipModule | 21.1.4 | Tooltips for disabled/inactive UI elements | Disabled org switching (Phase 7) |
| RouterLink / RouterOutlet | 21.1.0 | Navigation within org/project detail pages | Internal routing to `/engagement/:id`, `/project/:id` |

### Verified Versions (Checked 2026-04-01)
- `@zerobias-com/zerobias-angular-client@1.1.29` — BoundaryApi confirmed with `listBoundaryParties`, `listBoundaryPartyRoles`, `listBoundaryTeams` methods
- `@zerobias-org/ngx-library@0.2.28` — ZbSimplePanelComponent, ZbResourceStatusComponent, ZbCustomizableTableComponent, ZbAvatarLabelComponent all exported from `public-api.ts`
- `@angular/material@21.1.4` — Full Material component library available

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ZbCustomizableTableComponent | MatTableDataSource + Material Table | Ngx-library already provides battle-tested table component with infinite scroll, filtering, remote data support. Custom table would duplicate existing work. |
| ZbSimplePanelComponent | Custom divs + CSS | ngx-library gives us themed panel, consistent styling, and works with ZB theme service. Building custom loses consistency. |
| ZbResourceStatusComponent | Custom chip with `mat-chip` + CSS | Ngx-library component handles color mapping for status values. Custom would require duplicate styling logic. |
| Platform BoundaryApi | DataProducer generic SQL queries | BoundaryApi is the canonical source for boundary parties/roles/teams. DataProducer is for custom SME Mart entity queries, not platform boundary data. |

---

## Architecture Patterns

### Established SME Mart Patterns (Reference: Phase 7, org-detail.component.ts)

**Pattern: Standalone Components with Signals**
```typescript
@Component({
  selector: 'app-org-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, ZbSimplePanelComponent],
  templateUrl: './org-detail.component.html',
  styleUrl: './org-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDetailComponent {
  private readonly app = inject(ZerobiasClientApp);
  private readonly route = inject(ActivatedRoute);
  
  readonly orgId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('orgId') || '')),
    { initialValue: '' }
  );
  
  readonly isCurrent = computed(() => this.currentOrgId() === this.orgId());
}
```

**Why:** Angular 21 OnPush + signals minimize change detection, improve performance. `inject()` for DI replaces constructor parameters. `toSignal()` converts observables to reactive signals.

### Pattern: Service Delegation (Reference: GraphqlReadService, SmeMartProjectService)

Services follow a clear separation:
- **Query/Read services** (e.g., GraphqlReadService) — async methods returning data
- **Write services** (PipelineWriteService) — fire-and-forget async pushes
- **Wrapper services** (new BoundaryService) — thin wrapper around platform APIs, handles pagination/caching

```typescript
@Injectable({ providedIn: 'root' })
export class BoundaryService {
  private readonly clientApi = inject(ZerobiasClientApi);
  
  async listBoundaryParties(boundaryId: string): Promise<PartyExtended[]> {
    const api = this.clientApi.platformClient.getBoundaryApi();
    const result = await api.listBoundaryParties(boundaryId, 1, 100);
    return result.results || [];
  }
}
```

**Why:** Encapsulates boundary API complexity, allows easy caching/paging, provides single point of change if APIs shift.

### Pattern: Lazy-Loaded Tab Data

The Parties tab will use a lazy-load pattern:
```typescript
// In project-parties-tab.component.ts
readonly partiesLoading = signal(true);
readonly boundaryParties = signal<Map<string, PartyExtended[]>>(new Map());

ngOnInit() {
  this.loadPartiesForBoundaries(this.projectBoundaryIds());
}

private async loadPartiesForBoundaries(boundaryIds: string[]): Promise<void> {
  this.partiesLoading.set(true);
  try {
    for (const boundaryId of boundaryIds) {
      const parties = await this.boundaryService.listBoundaryParties(boundaryId);
      // ... fetch roles/teams per party
    }
  } finally {
    this.partiesLoading.set(false);
  }
}
```

**Why:** Avoids blocking org/project load. Parties are secondary data — only fetch when user clicks the tab.

### Pattern: WhoAmI Caching

The ImpersonationService already caches `whoAmI()` data via observable subscription. For Internal/External detection, access via:
```typescript
private readonly app = inject(ZerobiasClientApp);
const whoAmI$ = this.app.getWhoAmI(); // Observable, already cached internally
```

If signals are needed, convert once in a parent component and pass down as input.

### Recommended Project Structure

```
src/app/
├── pages/
│   ├── orgs/
│   │   ├── org-list.component.ts          # Enhance: add ownerId, engagement/project counts
│   │   ├── org-list.component.html        # Add Internal/External badge, metrics
│   │   ├── org-detail.component.ts        # Enhance: add Projects panel
│   │   └── org-detail.component.html      # Add Projects section
│   └── project/
│       ├── project-detail.component.ts    # Update tab config: rename members → parties
│       ├── project.routes.ts              # Update route: members → parties
│       └── tabs/
│           ├── project-parties-tab.component.ts    # NEW — replace ProjectComingSoonTab
│           ├── project-parties-tab.component.html  # NEW
│           └── project-parties-tab.component.scss  # NEW
├── core/
│   └── services/
│       ├── boundary.service.ts            # NEW — wraps platform.Boundary APIs
│       ├── graphql-read.service.ts        # Exists — use for engagement/project counts
│       ├── sme-mart-project.service.ts    # Exists — already queries projects
│       └── impersonation.service.ts       # Exists — use for whoAmI ownerId
└── shared/
    └── (no new shared components)
```

### Pattern 1: Org Card Internal/External Badge

**What:** Display a colored chip using `ZbResourceStatusComponent` showing "INTERNAL" or "EXTERNAL".

**When to use:** Every org card in `/orgs` list. Required by D-01.

**Example:**
```typescript
// In org-list.component.ts
private readonly app = inject(ZerobiasClientApp);
private readonly whoAmI$ = this.app.getWhoAmI();
private readonly whoAmIData = toSignal(this.whoAmI$, { initialValue: null });

readonly orgsWithBadges = computed(() => {
  const whoAmI = this.whoAmIData();
  if (!whoAmI) return [];
  
  return this.allOrgs().map(org => ({
    ...org,
    isInternal: whoAmI.ownerId === org.id,
    badgeLabel: whoAmI.ownerId === org.id ? 'INTERNAL' : 'EXTERNAL',
  }));
});

// In template:
@for (org of orgsWithBadges(); track org.id) {
  <div>
    <h3>{{ org.name }}</h3>
    <zb-resource-status [label]="org.badgeLabel" />
  </div>
}
```

**Why:** `ZbResourceStatusComponent` is already used in Phase 7 for boundary status. Reuses existing component, consistent styling.

### Pattern 2: Engagement/Project Count Metrics

**What:** Query GQL for engagement and project counts per org, display as badge metrics.

**When to use:** Org card footer or info row. Required by D-02.

**Example:**
```typescript
// In org-list.component.ts
private readonly graphqlRead = inject(GraphqlReadService);

async loadOrgMetrics(orgId: string): Promise<{ engagementCount: number; projectCount: number }> {
  const engagements = await this.graphqlRead.query('Engagement', ['id'], 
    { filters: { orgId: `.eq.${orgId}` } });
  const projects = await this.graphqlRead.query('SmeMartProject', ['id'],
    { filters: { // Need to determine engagement org membership via GQL filter } });
  
  return {
    engagementCount: engagements.page.totalCount || 0,
    projectCount: projects.page.totalCount || 0,
  };
}

// In template:
<div class="metrics-row">
  <span>{{ metrics().engagementCount }} Engagements</span>
  <span>·</span>
  <span>{{ metrics().projectCount }} Projects</span>
</div>
```

**Why:** GQL is the established read path for SME Mart entities. Counts are straightforward — total result count from pagination.

### Pattern 3: Projects Panel with Grouped Engagements

**What:** Single `ZbSimplePanelComponent` section showing projects grouped by parent engagement.

**When to use:** Org detail page (`/orgs/:orgId`). Required by D-04.

**Example:**
```typescript
// In org-detail.component.ts
private readonly graphqlRead = inject(GraphqlReadService);

readonly projects = signal<SmeMartProject[]>([]);
readonly engagementGroups = computed(() => {
  const all = this.projects();
  const groups = new Map<string, SmeMartProject[]>();
  
  for (const proj of all) {
    const engId = proj.engagementId || 'ungrouped';
    if (!groups.has(engId)) groups.set(engId, []);
    groups.get(engId)!.push(proj);
  }
  return Array.from(groups.entries());
});

private async loadProjects(orgId: string): Promise<void> {
  const result = await this.graphqlRead.query<SmeMartProject>(
    'SmeMartProject',
    ['id', 'name', 'status', 'engagementId'],
    { filters: { /* orgId filter via engagement */ }, pageSize: 100 }
  );
  this.projects.set(result.items);
}

// In template:
<zb-simple-panel>
  <h3>Projects</h3>
  @for (let [engId, prjs] of engagementGroups(); track engId) {
    <div class="group-header">
      <a [routerLink]="['/engagement', engId]">
        {{ getEngagementName(engId) }}
      </a>
    </div>
    <zb-customizable-table [data]="prjs" ...>
      <!-- Project rows -->
    </zb-customizable-table>
  }
</zb-simple-panel>
```

**Why:** Reuses established patterns from Phase 7 org overview. Grouped tables are standard marketplace UI. Lazy-loading engagement names can be deferred to Wave 0/1 if needed.

### Pattern 4: Project Parties Tab with Boundary Accordion

**What:** Accordion section per boundary. Each accordion contains a table of boundary parties with roles and teams.

**When to use:** Project detail page, replacing `members` route. Required by D-06, D-07.

**Example:**
```typescript
// In project-parties-tab.component.ts
private readonly boundaryService = inject(BoundaryService);
private readonly projectService = inject(SmeMartProjectService);

readonly project = input.required<SmeMartProject>();
readonly boundaryIds = computed(() => this.project().boundaryIds || []);

readonly partiesLoading = signal(true);
readonly boundaryPartiesMap = signal<Record<string, BoundaryPartyData[]>>({});

ngOnInit() {
  this.loadBoundaryParties();
}

private async loadBoundaryParties(): Promise<void> {
  this.partiesLoading.set(true);
  try {
    const map: Record<string, BoundaryPartyData[]> = {};
    
    for (const boundaryId of this.boundaryIds()) {
      const parties = await this.boundaryService.listBoundaryParties(boundaryId);
      const partiesWithRoles: BoundaryPartyData[] = [];
      
      for (const party of parties) {
        const roles = await this.boundaryService.listBoundaryPartyRoles(
          boundaryId,
          party.id
        );
        partiesWithRoles.push({
          ...party,
          roles: roles.map(r => r.name).join(', '),
        });
      }
      
      map[boundaryId] = partiesWithRoles;
    }
    
    this.boundaryPartiesMap.set(map);
  } finally {
    this.partiesLoading.set(false);
  }
}

// In template:
@if (partiesLoading()) {
  <mat-spinner />
} @else {
  @for (boundaryId of boundaryIds(); track boundaryId) {
    <mat-expansion-panel [expanded]="boundaryIds().length === 1">
      <mat-expansion-panel-header>
        <mat-panel-title>{{ getBoundaryName(boundaryId) }}</mat-panel-title>
      </mat-expansion-panel-header>
      
      <zb-customizable-table
        [data]="boundaryPartiesMap()[boundaryId] || []"
        [columns]="['partyName', 'roles', 'teams']"
        [readonly]="true"
      >
        <!-- Party table -->
      </zb-customizable-table>
    </mat-expansion-panel>
  }
}
```

**Why:** Accordion handles multi-boundary gracefully. Single boundary auto-expands for clean UX. Table rows are read-only (no edit actions). Pattern matches existing Phase 7 org detail panels.

### Anti-Patterns to Avoid

- **Querying org members instead of boundary parties:** Boundary parties ≠ org members. Use `platform.Boundary.listBoundaryParties`, not `hydra.Org.listOrgMembers`. Different security models.
- **Storing whoAmI ownerId in component state:** Use the existing `app.getWhoAmI()` observable or access via ImpersonationService. Avoid duplicate caching.
- **Custom party/role tables:** Use ZbCustomizableTableComponent, not `<table>` or MatTable with custom code. Library component handles sorting, pagination, infinite scroll.
- **Bundling boundary admin UI:** SME Mart is read-only for boundaries. Party creation, role assignment, team management stay in ZB Governance app. Do not build these features.
- **Fetching all parties eagerly:** Fetch on tab click (lazy load), not during project page load. Parties are secondary visualization, not critical path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data pagination for boundary parties | Custom page tracking in component | BoundaryService with standard page parameters | SDK provides PagedResults wrapper, handles limits/offsets. Custom would duplicate pagination logic. |
| Party status/role display styling | Custom CSS chips or badges | ZbResourceStatusComponent + ZbChipColorsDirective | ngx-library components handle Material Design theming, color maps, accessibility. Custom loses consistency with ZB platform UI. |
| Org-project relationship queries | Custom GQL filters or joins | GraphqlReadService.query() with RFC4515 filters | Service has established filtering syntax, boundary scoping, field mapping. Custom GQL strings are error-prone. |
| Internal/External org detection | Custom email domain checks or group membership queries | Simple `whoAmI().ownerId === org.id` comparison | Brian's decision: orgs are strictly legal entities (same IDP/2FA). ownerId comparison is the canonical check. Email domain heuristics are fragile. |
| Party role collection | Calling listBoundaryPartyRoles per party in loop | BoundaryService wraps all calls, can be extended for batch fetching | Looping API calls in components is slow/untested. Service encapsulation allows future optimization (batch endpoints if platform adds them). |

**Key insight:** All three phases (org cards, org overview, parties tab) consume data from two sources: (1) AuditgraphDB via GraphQL (engagements/projects), (2) Platform Boundary API (parties/roles/teams). Neither is novel — both are established SME Mart query paths. The work is UI composition, not backend integration.

---

## Code Examples

Verified patterns from existing codebase:

### Example 1: Observable to Signal Conversion (org-list.component.ts pattern)
```typescript
// Source: SME Mart org-list.component.ts (existing)
readonly allOrgs = signal<OrgListItem[]>([]);
readonly searchTerm = signal('');

constructor() {
  this.loadOrgs();
}

private async loadOrgs(): Promise<void> {
  try {
    this.isLoading.set(true);
    const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
    this.allOrgs.set(
      (orgs || []).map((org: any) => ({
        id: org.id?.toString() || org.id,
        name: org.name || '',
        description: org.description,
      }))
    );
  } finally {
    this.isLoading.set(false);
  }
}
```

### Example 2: GraphQL Query for Engagement Counts
```typescript
// Source: GraphqlReadService.query() pattern
// Usage: Count engagements per org
const result = await this.graphqlRead.query<Engagement>(
  'Engagement',
  ['id', 'name', 'status'],
  { 
    filters: { /* orgId lookup filter */ },
    pageSize: 1,
    pageNumber: 1,
  }
);
const count = result.page.totalCount || 0;
```

### Example 3: ZbSimplePanelComponent Usage (org-detail.component.html pattern)
```html
<!-- Source: SME Mart org-detail.component.html -->
<zb-simple-panel>
  <div class="panel-header">
    <h3>Boundaries</h3>
  </div>
  <div class="panel-content">
    <!-- Panel body content -->
  </div>
</zb-simple-panel>
```

### Example 4: Standalone Component Imports
```typescript
// Source: SME Mart org-list.component.ts (Pattern)
@Component({
  selector: 'app-org-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
  ],
  templateUrl: './org-list.component.html',
  styleUrl: './org-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgListComponent { }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NgModules + declarations | Standalone components with imports | Angular 14+ | Smaller bundle, simpler DI, easier testing. SME Mart adopted standalone-first. |
| async pipe in templates | toSignal() + signal bindings | Angular 16+ | Signals are faster, clearer reactive intent. SME Mart uses toSignal() consistently. |
| Constructor DI | inject() function | Angular 14+ | Cleaner code, easier mocking, works outside constructors. SME Mart standard. |
| *ngIf, *ngFor, *ngSwitch | @if, @for, @switch control flow | Angular 21 | New syntax is more readable, better type narrowing, faster. SME Mart uses new syntax. |
| Material Table + MatTableDataSource | ZbCustomizableTableComponent | Phase 7 | Library component includes sorting, infinite scroll, remote data. Built specifically for SME Mart. |
| Custom status chips | ZbResourceStatusComponent | ngx-library 0.2+ | Theming integration, color mapping, accessibility. One source of truth. |

**Deprecated/outdated:**
- `*ngIf` / `*ngFor` — Use `@if` / `@for` (control flow syntax)
- Constructor parameter DI — Use `inject()` function
- Manually managed observables in components — Use `toSignal()` + computed()

---

## Common Pitfalls

### Pitfall 1: Internal/External Detection Using Email Domain

**What goes wrong:** Developer checks email domain (e.g., `email.endsWith('@acme.com')`) to detect internal vs. external org membership.

**Why it happens:** Seems intuitive — internal users have company email, external don't. But ZeroBias doesn't enforce email domain = org membership. Users can be invited to orgs with different email domains (contractors, partners, cross-org collaborators).

**How to avoid:** Use `whoAmI().ownerId === org.id` — the canonical check. ownerId is the user's home org (set at account creation). If it matches the org you're viewing, the user is internal. Otherwise, external. This is Brian's decision (2026-04-01), not a heuristic.

**Warning signs:** Code contains `email.indexOf('@')`, email domain splits, or checking org.email_domain. These are red flags.

### Pitfall 2: Querying Org Members Instead of Boundary Parties

**What goes wrong:** Developer calls `hydra.Org.listOrgMembers(orgId)` to populate the project "Members" tab, treating project members as org members.

**Why it happens:** Org members are familiar — they're the org's user list. Project parties are less intuitive — they're boundary-scoped security principals that may not be org members.

**How to avoid:** Use `platform.Boundary.listBoundaryParties(boundaryId)` — the canonical source for project participants. Boundary parties can include external orgs, invited users, and service accounts. Org members are strictly org members.

**Warning signs:** Code calls `Org.listOrgMembers`, treats member IDs as user IDs, or filters org members by project involvement.

### Pitfall 3: Eager-Loading Boundary Parties on Project Page Load

**What goes wrong:** Project detail page fetches all boundary parties, roles, and teams immediately on page load. Blocks render, slow page transition.

**Why it happens:** Intuitive to load all data upfront. But parties are secondary visualization — most users visit the overview, not the parties tab.

**How to avoid:** Lazy-load parties when user clicks the "Parties" tab. Show loading spinner during fetch. This is D-10 — fetch only when needed.

**Warning signs:** API calls in component constructor or ngOnInit for parties data. No `loading` signal for the parties tab.

### Pitfall 4: Boundary Admin UI in SME Mart

**What goes wrong:** Developer builds party creation, role assignment, or team management UI in SME Mart. Results in duplicate code and sync issues with ZB Governance app.

**Why it happens:** Parties are visible in SME Mart, so it seems natural to manage them there too. But they're managed in the ZB platform's Governance app.

**How to avoid:** Keep SME Mart read-only for boundary operations. No create/update/delete boundary APIs in SME Mart. If users need to manage parties/roles/teams, direct them to ZB Governance.

**Warning signs:** Code calls `platform.Boundary.createBoundaryParty`, `createBoundaryPartyRole`, or `createBoundaryTeam`. Component has create/edit/delete buttons for parties.

### Pitfall 5: Hard-Coding Boundary Colors/Status Labels

**What goes wrong:** Component hard-codes the color for "INTERNAL" badge (green) or "EXTERNAL" badge (blue) instead of using the ZbResourceStatusComponent color mapping.

**Why it happens:** Simple CSS feels faster than looking up component API. But colors change with platform theme updates or admin customization.

**How to avoid:** Always use `ZbResourceStatusComponent` with `[label]="statusLabel"`. Component handles color mapping, theme inheritance, and accessibility.

**Warning signs:** Template contains `[ngStyle]="{ backgroundColor: 'green' }"` or `[style.color]="isInternal ? '#00aa00' : '#0000ff'"`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Angular CLI | Development (ng serve, ng build) | ✓ | 21.1.4 | — |
| Node.js | Build, package management | ✓ | 18.19.1+ | — |
| npm | Package manager | ✓ | 10.2.4+ | — |
| @zerobias-com/zerobias-angular-client | Platform API access (getWhoAmI, BoundaryApi) | ✓ | 1.1.29 | — |
| @zerobias-org/ngx-library | UI components (ZbSimplePanelComponent, etc.) | ✓ | 0.2.28 | — |
| @angular/material | Material Design components | ✓ | 21.1.4 | — |
| ZeroBias Platform API | Boundary party/role/team queries | ✓ | Current (UAT) | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:** None identified.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.8 |
| Config file | `vitest.config.ts` (via Angular 21 @angular/build:unit-test) |
| Quick run command | `npm test -- --run --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

No explicit phase requirements provided. Testing approach aligns with existing SME Mart patterns (Phase 7 org list component has specs at `src/app/pages/orgs/org-list.component.spec.ts`).

| Feature | Test Type | Automated Command | File Exists? |
|---------|-----------|-------------------|-------------|
| Org card Internal/External badge (D-01) | unit | `npm test -- src/app/pages/orgs/org-list.component.spec.ts` | ✅ (partial) |
| Org card engagement/project counts (D-02) | unit | `npm test -- src/app/pages/orgs/org-list.component.spec.ts` | ❌ Wave 0 |
| Org overview Projects panel (D-04) | unit | `npm test -- src/app/pages/orgs/org-detail.component.spec.ts` | ✅ (partial) |
| BoundaryService query methods (D-11) | unit | `npm test -- src/app/core/services/boundary.service.spec.ts` | ❌ Wave 0 |
| Project parties tab layout (D-06, D-07) | unit | `npm test -- src/app/pages/project/tabs/project-parties-tab.component.spec.ts` | ❌ Wave 0 |
| Lazy loading parties on tab click (D-10) | integration | `npm test -- src/app/pages/project/tabs/project-parties-tab.component.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run focused test file only (e.g., `npm test -- src/app/pages/orgs/org-list.component.spec.ts`)
- **Per wave merge:** Full suite `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/core/services/boundary.service.spec.ts` — unit tests for BoundaryService methods (listBoundaryParties, listBoundaryPartyRoles, listBoundaryTeams), error handling
- [ ] Enhanced `src/app/pages/orgs/org-list.component.spec.ts` — tests for engagement/project count queries, whoAmI ownerId caching, badge label computation
- [ ] Enhanced `src/app/pages/orgs/org-detail.component.spec.ts` — tests for Projects panel grouping by engagement, engagement link navigation
- [ ] `src/app/pages/project/tabs/project-parties-tab.component.spec.ts` — tests for lazy loading, boundary accordion expansion, parties table rendering, empty/error states
- [ ] Mock/stub for `platform.Boundary` API in tests — vitest mocking of BoundaryApi.listBoundaryParties, etc.

---

## Sources

### Primary (HIGH confidence)
- **12-CONTEXT.md** — Phase decisions (D-01 through D-11), locked design choices, canonical references to Phase 7, SDK APIs
- **REQUIREMENTS.md** — Org Navigation (ORG-*) and Vendor Profile (VPR-*, VPS-*, VPU-*) requirements, traceability matrix
- **STATE.md** — Project milestone state, phase 12 addition, director session state
- **Director DECISIONS.md** — Internal/External detection logic, project members → parties, boundary read-only scope
- **director/SESSION-STATE.md** — ZB API confirmation (BoundaryApi methods with exact signatures), existing codebase notes
- SME Mart source code inspection (2026-04-01):
  - `org-list.component.ts` — Signal patterns, org list filtering, whoAmI integration
  - `org-detail.component.ts` — toSignal() usage, ZbSimplePanelComponent integration
  - `sme-mart-project.service.ts` — GraphQL query patterns, field mappings
  - `impersonation.service.ts` — whoAmI caching, effective org ID retrieval
  - `graphql-read.service.ts` — RFC4515 filtering syntax, boundary scoping
  - `boundary.service.ts` (verified in node_modules) — BoundaryApi method signatures

### Secondary (MEDIUM confidence)
- **CLAUDE.md** (project-level) — Angular 21 standalone patterns, ngx-library conventions, file naming
- **sme-mart-architect.md** (skill guide) — Angular 21 modern patterns, Control flow syntax, signal reactive patterns
- ngx-library public API inspection — ZbSimplePanelComponent, ZbResourceStatusComponent, ZbCustomizableTableComponent all confirmed exported
- @zerobias-com/zerobias-angular-client type definitions — BoundaryApi class, method signatures, PagedResults wrapper

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — All versions verified against package.json and node_modules SDK exports
- **Architecture Patterns:** HIGH — Based on existing Phase 7 implementations and established SME Mart code review
- **Boundary APIs:** HIGH — SESSION-STATE.md confirms API availability with exact method names; SDK type definitions verify signatures
- **UI Components:** HIGH — ngx-library public-api.ts confirms all required components exported
- **Testing:** HIGH — Vitest config confirmed in package.json; test framework and commands verified

**Research date:** 2026-04-01  
**Valid until:** 2026-04-30 (stable stack, low churn expected; re-validate before implementation if >= 4 weeks have passed)

---

**Phase:** 12-project-centric-boundary-model  
**Milestone:** v1.1 — Org Navigation & Vendor Profile  
**Researched by:** Claude Code (research phase agent)  
**Ready for:** `/gsd:plan-phase` to create PLAN.md
