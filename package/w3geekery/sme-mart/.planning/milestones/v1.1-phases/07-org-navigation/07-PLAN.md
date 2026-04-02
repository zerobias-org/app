---
phase: 07-org-navigation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/pages/orgs/org-list.component.spec.ts
  - src/app/pages/orgs/org-detail.component.spec.ts
  - src/app/pages/orgs/org-list.component.ts
  - src/app/pages/orgs/org-list.component.html
  - src/app/pages/orgs/org-list.component.scss
  - src/app/pages/orgs/org-detail.component.ts
  - src/app/pages/orgs/org-detail.component.html
  - src/app/pages/orgs/org-detail.component.scss
  - src/app/pages/orgs/orgs.routes.ts
  - src/app/app.routes.ts
  - src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html
autonomous: true
requirements: [ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08, ORG-09, ORG-10, ORG-11]
must_haves:
  truths:
    - User can navigate to `/orgs` and see a list of all their organizations
    - Org list filters out hidden orgs, System Org, and ops orgs before rendering
    - User can click an org to view `/orgs/:orgId` read-only overview
    - Org overview displays org info (name, description), members list, groups list, and boundaries
    - Current org shows "This is your active org" banner and "Go to Org Profile" button to `/org`
    - Non-current org shows disabled "Switch to Org" button with tooltip
    - Nav sidebar "My Organizations" link routes to `/orgs` instead of `/org`
    - `/orgs/:orgId` is strictly read-only with no edit controls
  artifacts:
    - path: src/app/pages/orgs/org-list.component.ts
      provides: List all user's orgs with card/table toggle and search
      min_lines: 80
    - path: src/app/pages/orgs/org-detail.component.ts
      provides: Read-only org overview with members, groups, boundaries, and action controls
      min_lines: 100
    - path: src/app/pages/orgs/orgs.routes.ts
      provides: Routes for /orgs and /orgs/:orgId child routes
      min_lines: 10
    - path: src/app/app.routes.ts
      provides: Integration of orgs routes into main app routing
      exports: [orgs route definition]
    - path: src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html
      provides: Updated "My Organizations" link pointing to /orgs
      contains: routerLink="/orgs"
  key_links:
    - from: app.routes.ts
      to: orgs.routes.ts
      via: loadChildren lazy load
      pattern: loadChildren.*orgs.routes
    - from: org-list.component.ts
      to: ZerobiasClientApp
      via: listMyOrgs() observable
      pattern: listMyOrgs.*filter.*hidden
    - from: org-detail.component.ts
      to: ZerobiasClientApp + hydraClient APIs
      via: getOrg(), listOrgMembers(), listGroups()
      pattern: (getOrg|listOrgMembers|listGroups)
    - from: user-profile-dropdown.component.html
      to: org-list.component
      via: routerLink navigation
      pattern: routerLink.*orgs
---

<objective>
Implement multi-organization navigation for SME Mart: a `/orgs` listing page where users discover their organizations with card/table toggle and search, a `/orgs/:orgId` read-only overview showing org details and members, and disabled org switching stub. This phase unlocks transparency into all user-accessible organizations and provides the foundation for org switching (Phase 12+).

Purpose: Users need visibility into all organizations they belong to, not just their current org. Read-only org overview pages build trust and reduce confusion about org membership.

Output: Two new components (`org-list`, `org-detail`), new route structure (`/orgs` and `/orgs/:orgId`), updated navigation sidebar, and integrated Hydra APIs for cross-org member/group queries.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md

**Executor context:**
- Phase 7 of v1.1 roadmap (Org Navigation & Vendor Profile)
- SME Mart is Angular 21 with standalone components, signals, strict typing
- Existing patterns: `/org` page uses tab navigation; `list-page` shared component handles search/filter/sort; `ZerobiasClientApp` singleton for SDK access
- All required Hydra APIs confirmed working (listMyOrgs, getOrg, listOrgMembers, listGroups)
- UserPreferencesService already handles preference persistence (use for card/table toggle)
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/07-org-navigation/07-CONTEXT.md
@.planning/phases/07-org-navigation/07-RESEARCH.md

**Reference implementations:**
@src/app/pages/org/org.component.ts — Org page with tab navigation (reference pattern)
@src/app/shared/components/list-page/list-page.component.ts — Reusable list page shell
@src/app/core/services/user-preferences.service.ts — Preference persistence

**Key libraries:**
- `@zerobias-org/ngx-library` (0.2.25): ZbSimplePanelComponent, ZbSearchInputComponent, ZbAvatarLabelComponent, ZbResourceStatusComponent
- `@zerobias-com/zerobias-angular-client` (1.1.29): ZerobiasClientApp with hydraClient for Org APIs
- `@angular/material`: Buttons, icons, menus, dividers
</context>

<tasks>

<task type="auto">
  <name>Task 0: Create test scaffold files for org components (Wave 0 — Nyquist compliance)</name>
  <files>
    src/app/pages/orgs/org-list.component.spec.ts
    src/app/pages/orgs/org-detail.component.spec.ts
  </files>
  <action>
Create test stub files to satisfy Nyquist sampling requirement. These are minimal test scaffolds that will be fleshed out during task execution.

**Create `/src/app/pages/orgs/org-list.component.spec.ts`:**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgListComponent } from './org-list.component';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-angular-client';
import { UserPreferencesService } from '@app/core/services/user-preferences.service';

describe('OrgListComponent', () => {
  let component: OrgListComponent;
  let fixture: ComponentFixture<OrgListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgListComponent],
      providers: [
        {
          provide: ZerobiasClientApp,
          useValue: {
            listMyOrgs: () => ({ subscribe: () => ({}) }),
            getCurrentOrg: () => ({ subscribe: () => ({}) }),
          },
        },
        {
          provide: UserPreferencesService,
          useValue: {
            getOrgListViewMode: () => 'cards',
            setOrgListViewMode: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ZerobiasClientApp', () => {
    const app = TestBed.inject(ZerobiasClientApp);
    expect(app).toBeTruthy();
  });

  it('should inject UserPreferencesService', () => {
    const prefs = TestBed.inject(UserPreferencesService);
    expect(prefs).toBeTruthy();
  });
});
```

**Create `/src/app/pages/orgs/org-detail.component.spec.ts`:**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { OrgDetailComponent } from './org-detail.component';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-angular-client';
import { of } from 'rxjs';

describe('OrgDetailComponent', () => {
  let component: OrgDetailComponent;
  let fixture: ComponentFixture<OrgDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['orgId', 'test-org-id']])),
          },
        },
        {
          provide: ZerobiasClientApp,
          useValue: {
            getOrg: () => of(null),
            getCurrentOrg: () => of(null),
            hydraClient: {
              getOrgApi: () => ({
                listOrgMembers: () => of([]),
                listGroups: () => of([]),
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ActivatedRoute', () => {
    const route = TestBed.inject(ActivatedRoute);
    expect(route).toBeTruthy();
  });

  it('should inject ZerobiasClientApp', () => {
    const app = TestBed.inject(ZerobiasClientApp);
    expect(app).toBeTruthy();
  });
});
```

**Rationale:** These scaffold files provide minimal test stubs that ensure Nyquist compliance by having test files in place before implementation. Executors can expand these tests with additional assertions during Tasks 1-2, or use them as a baseline for verification.
  </action>
  <verify>
    <automated>test -f src/app/pages/orgs/org-list.component.spec.ts && echo "File exists"</automated>
    <automated>test -f src/app/pages/orgs/org-detail.component.spec.ts && echo "File exists"</automated>
    <automated>grep -n "describe('OrgListComponent'" src/app/pages/orgs/org-list.component.spec.ts</automated>
    <automated>grep -n "describe('OrgDetailComponent'" src/app/pages/orgs/org-detail.component.spec.ts</automated>
  </verify>
  <done>
    Test scaffold files created. Both `org-list.component.spec.ts` and `org-detail.component.spec.ts` contain basic test stubs with component creation tests and dependency injection assertions. Files are ready for expansion during implementation tasks.
  </done>
</task>

<task type="auto">
  <name>Task 1: Create org list component with card/table toggle and search (ORG-01, ORG-02, ORG-04)</name>
  <files>
    src/app/pages/orgs/org-list.component.ts
    src/app/pages/orgs/org-list.component.html
    src/app/pages/orgs/org-list.component.scss
  </files>
  <read_first>
    src/app/pages/org/org.component.ts — reference for org-related patterns and header styling
    src/app/shared/components/list-page/list-page.component.ts — understand how search/sort/empty states work
    src/app/core/services/user-preferences.service.ts — see how preferences are persisted
    src/app/pages/providers/provider-list.component.ts — reference for how existing list pages implement card/table toggle
  </read_first>
  <action>
Create `/src/app/pages/orgs/org-list.component.ts` standalone component with:

**Imports:** Angular core (Component, inject, signal, toSignal, computed, ChangeDetectionStrategy), @angular/router (RouterLink), @angular/material (MatButtonModule, MatIconModule, MatDividerModule), ngx-library (ZbSearchInputComponent, ZbAvatarLabelComponent, ZbEmptyStateContainerComponent), ZerobiasClientApp, UserPreferencesService.

**Class: OrgListComponent**
- `private app = inject(ZerobiasClientApp)`
- `private prefs = inject(UserPreferencesService)`
- Signal: `allOrgs = toSignal(this.app.listMyOrgs(), { initialValue: [] })`
- Signal: `searchTerm = signal('')`
- Signal: `viewMode = signal<'cards' | 'table'>('cards')` — load from prefs via `UserPreferencesService`
- Computed: `filteredOrgs = computed(() => { const all = this.allOrgs(); const term = this.searchTerm().toLowerCase(); return all.filter(org => !org.hidden && !this.isOpsOrg(org.name) && org.name.toLowerCase().includes(term)); })`
- Signal: `currentOrgId = toSignal(this.app.getCurrentOrg().pipe(map(org => org?.id)), { initialValue: null })`
- Method: `isOpsOrg(name: string): boolean` — return `name.includes('System Org') || name.includes('ops')`
- Method: `toggleViewMode()` — switch between 'cards' and 'table', persist to `UserPreferencesService.setOrgListViewMode()`
- Method: `isActive(orgId: string): boolean` — return `this.currentOrgId() === orgId`

**Template:**
- Header section: title "My Organizations", description "View all organizations you belong to"
- Toolbar: search input (ZbSearchInputComponent) bound to `searchTerm`, toggle button (card/table icon) that calls `toggleViewMode()`
- Conditionally render two views:
  - Cards view (`@if (viewMode() === 'cards')`): Grid layout with cards. Each card displays: org name (bold), description snippet, member count, active indicator ("Active" chip if `isActive(orgId)`), click to navigate to `/orgs/:orgId`
  - Table view (`@if (viewMode() === 'table')`): Table with columns: Org Name | Description | Members | Status. Rows clickable, navigate to `/orgs/:orgId`
- Empty state (ZbEmptyStateContainerComponent): Show if `filteredOrgs().length === 0`
- Loading state: Show spinner if `allOrgs() is empty and not searching`

**Styling:**
- Cards: `display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; padding: 24px;`
- Card: `border: 1px solid var(--mat-sys-outline, #ddd); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;`
- Card active indicator: `border-color: var(--mat-sys-primary, #1976d2); border-width: 2px;`
- Table: `width: 100%; border-collapse: collapse;`
- Table header: `background: var(--mat-sys-surface-variant, #f5f5f5);`
- Member count: Right-aligned gray text
- Search and toolbar: Sticky, top: 0, `padding: 16px 24px; background: white; border-bottom: 1px solid var(--mat-sys-outline, #ddd);`

**Per decision D-01 (card/table toggle):** Toggle preference persisted via `UserPreferencesService`.
**Per decision D-02 (filtering):** Pre-filter `hidden:true`, System Org, ops orgs.
**Per decision D-03 (search):** Search bar for org names, no sort controls.
**Per decision D-04 (active indicator):** Current org gets subtle border or chip.
**Per decision D-05 (single org):** Still shows list normally.
  </action>
  <verify>
    <automated>grep -n "selector: 'app-org-list'" src/app/pages/orgs/org-list.component.ts</automated>
    <automated>grep -n "filteredOrgs = computed" src/app/pages/orgs/org-list.component.ts</automated>
    <automated>grep -n "isOpsOrg" src/app/pages/orgs/org-list.component.ts</automated>
    <automated>grep -n "toggleViewMode" src/app/pages/orgs/org-list.component.ts</automated>
    <automated>grep -n "viewMode() === 'cards'" src/app/pages/orgs/org-list.component.html</automated>
    <automated>grep -n "viewMode() === 'table'" src/app/pages/orgs/org-list.component.html</automated>
    <automated>npm test -- --include src/app/pages/orgs/org-list 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - Component selector is `app-org-list`
    - `filteredOrgs` computed signal filters out `hidden:true`, System Org, ops orgs, and applies search term (case-insensitive name match)
    - `isOpsOrg()` method correctly identifies System Org and ops orgs
    - `toggleViewMode()` method switches between cards and table views and persists to UserPreferencesService
    - Template has card view with clickable cards showing org name, description, member count, and active indicator
    - Template has table view with Name, Description, Members, Status columns
    - Both views navigate to `/orgs/:orgId` on click
    - Empty state shows when filtered list is empty
    - Search input updates `searchTerm` signal
    - View toggle button switches between card and table icons
  </acceptance_criteria>
  <done>
    `org-list.component.ts` created with card/table toggle, search filtering, org filtering logic, and active org indicator. `org-list.component.html` renders both view modes with proper navigation. `org-list.component.scss` styles cards and table with Material Design tokens. Component satisfies ORG-01 (list page), ORG-02 (filtering), ORG-04 (displays org info).
  </done>
</task>

<task type="auto">
  <name>Task 2: Create org detail component with read-only overview (ORG-03, ORG-05, ORG-06, ORG-07, ORG-08, ORG-10, ORG-11)</name>
  <files>
    src/app/pages/orgs/org-detail.component.ts
    src/app/pages/orgs/org-detail.component.html
    src/app/pages/orgs/org-detail.component.scss
  </files>
  <read_first>
    src/app/pages/org/org.component.ts — reference for org-related header styling and current org detection
    src/app/pages/providers/provider-detail.component.ts — reference for detail page layout pattern
    src/app/core/services/user-preferences.service.ts — understand preference loading
    .planning/phases/07-org-navigation/07-CONTEXT.md section "Org Overview" for decisions D-08 through D-13, D-17 through D-19
  </read_first>
  <action>
Create `/src/app/pages/orgs/org-detail.component.ts` standalone component with:

**Imports:** Angular core (Component, inject, signal, toSignal, computed, ChangeDetectionStrategy, OnInit), @angular/router (ActivatedRoute, RouterLink), @angular/material (MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule), ngx-library (ZbSimplePanelComponent, ZbAvatarLabelComponent, ZbResourceStatusComponent, ZbEmptyStateContainerComponent), ZerobiasClientApp, rxjs (combineLatest, map).

**Class: OrgDetailComponent implements OnInit**
- `private app = inject(ZerobiasClientApp)`
- `private route = inject(ActivatedRoute)`
- Signal: `orgId = toSignal(this.route.paramMap.pipe(map(p => p.get('orgId') || '')), { initialValue: '' })`
- Signal: `currentOrgId = toSignal(this.app.getCurrentOrg().pipe(map(org => org?.id)), { initialValue: null })`
- Computed: `isCurrent = computed(() => this.currentOrgId() === this.orgId())`
- Signal: `orgData = toSignal(combineLatest([ this.app.getOrg(this.orgId()), this.app.hydraClient.getOrgApi().listOrgMembers(this.orgId()), this.app.hydraClient.getOrgApi().listGroups(this.orgId()), /* GQL query for boundaries */ ]), { initialValue: [null, [], [], []] })`
- Destructured in template: `org = computed(() => this.orgData()[0])`, `members = computed(() => this.orgData()[1])`, `groups = computed(() => this.orgData()[2])`, `boundaries = computed(() => this.orgData()[3])`

**Template per D-08 (single scrollable page with ZbSimplePanelComponent sections):**
- Header section: org name (large), org description (subtitle)
- Info banner: If `isCurrent()`, show "This is your active org" (green/info color)
- Action button section:
  - If `isCurrent()`: "Go to Org Profile" button → routes to `/org`
  - If NOT current: "Switch to Org" button → disabled, `matTooltip="Available when session auth is enabled"` (per D-17, D-19)
- ZbSimplePanelComponent section 1: "Org Information"
  - Org name: `{{ org().name }}`
  - Org description (if exists): `{{ org().description }}`
  - Org ID (optional, gray text): `{{ org().id }}`
- ZbSimplePanelComponent section 2: "Members"
  - If members empty: "No members found"
  - Otherwise: List with ZbAvatarLabelComponent for each member: avatar, name, role badge
- ZbSimplePanelComponent section 3: "Groups"
  - If groups empty: "No groups found"
  - Otherwise: List with group name and member count badge for each
- ZbSimplePanelComponent section 4: "Boundaries"
  - If boundaries empty: "No boundaries associated"
  - Otherwise: List with ZbResourceStatusComponent chip for each boundary's state

**Styling:**
- Page: `padding: 24px; max-width: 1000px; margin: 0 auto;`
- Header: `margin-bottom: 24px; border-bottom: 1px solid var(--mat-sys-outline, #ddd); padding-bottom: 16px;`
- Header title: `font-size: 28px; font-weight: 500; margin: 0;`
- Header subtitle: `font-size: 14px; color: var(--mat-sys-on-surface-variant, #666); margin: 4px 0 0;`
- Info banner: `background: var(--mat-sys-primary-container, #e3f2fd); color: var(--mat-sys-on-primary-container, #1976d2); padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;`
- Action buttons: `display: flex; gap: 8px;`
- Panel sections: `margin-bottom: 24px;`
- Member/group/boundary list: `list-style: none; padding: 0; margin: 0;`
- List item: `padding: 12px 0; border-bottom: 1px solid var(--mat-sys-outline, #eee);` last-child remove border
- Role badge: `font-size: 12px; padding: 2px 8px; background: var(--mat-sys-surface-variant, #f5f5f5); border-radius: 12px;`

**Per D-13:** Strictly read-only — no edit controls. "Go to Org Profile" routes to `/org` only for current org.
**Per D-18:** Current org shows info banner + "Go to Org Profile" button.
**Per D-19:** Non-current org shows disabled "Switch to Org" button.
  </action>
  <verify>
    <automated>grep -n "selector: 'app-org-detail'" src/app/pages/orgs/org-detail.component.ts</automated>
    <automated>grep -n "isCurrent = computed" src/app/pages/orgs/org-detail.component.ts</automated>
    <automated>grep -n "listOrgMembers\|listGroups" src/app/pages/orgs/org-detail.component.ts</automated>
    <automated>grep -n "This is your active org" src/app/pages/orgs/org-detail.component.html</automated>
    <automated>grep -n "Switch to Org" src/app/pages/orgs/org-detail.component.html</automated>
    <automated>grep -n "\[disabled\]" src/app/pages/orgs/org-detail.component.html</automated>
    <automated>npm test -- --include src/app/pages/orgs/org-detail 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - Component selector is `app-org-detail`
    - `isCurrent` computed signal correctly identifies current org by comparing `currentOrgId()` to route `orgId()`
    - `orgData` loads org details, members, groups, and boundaries in parallel via `combineLatest`
    - Template displays org name and description in header
    - Info banner shows "This is your active org" only when `isCurrent()` is true
    - Current org shows "Go to Org Profile" button that routes to `/org`
    - Non-current org shows disabled "Switch to Org" button with tooltip "Available when session auth is enabled"
    - ZbSimplePanelComponent used for all 4 sections (Org Info, Members, Groups, Boundaries)
    - Members list displays with avatars and role badges
    - Groups list displays with member count
    - Boundaries list displays with status chips
    - All sections show empty state if data is empty
    - Page is read-only (no form controls, no edit buttons except "Go to Org Profile")
  </acceptance_criteria>
  <done>
    `org-detail.component.ts` created with route param extraction, current org detection, and parallel data loading for org/members/groups/boundaries. `org-detail.component.html` renders read-only overview with conditional action buttons (current vs non-current org). `org-detail.component.scss` styles sections with Material Design tokens. Component satisfies ORG-03 (read-only overview), ORG-05 (members), ORG-06 (groups), ORG-07 (boundaries), ORG-08 (go to profile), ORG-10 (switch button stub), ORG-11 (read-only).
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire org routes into app, update navigation sidebar (ORG-09)</name>
  <files>
    src/app/pages/orgs/orgs.routes.ts
    src/app/app.routes.ts
    src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html
  </files>
  <read_first>
    src/app/app.routes.ts — understand current lazy-load pattern for other routes (e.g., /org, /my/engagements)
    src/app/pages/org/org.routes.ts — reference for route structure with child routes
    src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html — current link routing to /org
    src/app/pages/orgs/org-list.component.ts — to be imported in routes
    src/app/pages/orgs/org-detail.component.ts — to be imported in routes
  </read_first>
  <action>
**Create `/src/app/pages/orgs/orgs.routes.ts` with:**
```typescript
import { Routes } from '@angular/router';
import { OrgListComponent } from './org-list.component';
import { OrgDetailComponent } from './org-detail.component';

export const ORGS_ROUTES: Routes = [
  {
    path: '',
    component: OrgListComponent,
  },
  {
    path: ':orgId',
    component: OrgDetailComponent,
  },
];
```

**Update `/src/app/app.routes.ts`:**
Add new lazy-loaded route after the existing `/org` route (around line 37-40):
```typescript
{
  path: 'orgs',
  loadChildren: () =>
    import('./pages/orgs/orgs.routes').then((m) => m.ORGS_ROUTES),
},
```

**Update `/src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html`:**
On line 28, change `routerLink="/org"` to `routerLink="/orgs"`:
```html
<a mat-menu-item routerLink="/orgs">
  <mat-icon>business</mat-icon>
  <span>My Organizations</span>
</a>
```

**Rationale:**
- D-14: Update "My Organizations" link in user profile dropdown from `/org` to `/orgs`
- D-15: Do NOT add to top nav bar (Services, RFPs only)
- D-16: Three routes coexist: `/orgs` (list), `/orgs/:orgId` (read-only), `/org` (current org editing)
- Routes use lazy loading pattern consistent with `/org`, `/my/engagements`, etc.
  </action>
  <verify>
    <automated>grep -n "export const ORGS_ROUTES" src/app/pages/orgs/orgs.routes.ts</automated>
    <automated>grep -n "path: ''" src/app/pages/orgs/orgs.routes.ts</automated>
    <automated>grep -n "path: ':orgId'" src/app/pages/orgs/orgs.routes.ts</automated>
    <automated>grep -n "path: 'orgs'" src/app/app.routes.ts</automated>
    <automated>grep -n "loadChildren.*orgs.routes" src/app/app.routes.ts</automated>
    <automated>grep -n "routerLink=\"/orgs\"" src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html</automated>
    <automated>npm test -- --include src/app/layout/ 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - `orgs.routes.ts` exports `ORGS_ROUTES` constant with two routes: `''` (list) and `:orgId` (detail)
    - `orgs.routes.ts` imports and references `OrgListComponent` and `OrgDetailComponent`
    - `app.routes.ts` includes a `path: 'orgs'` route with `loadChildren` lazy loading from `orgs.routes`
    - `app.routes.ts` route is placed after `/org` route (logical organization)
    - `user-profile-dropdown.component.html` line 28 has `routerLink="/orgs"` (not `/org`)
    - "My Organizations" menu item label is unchanged
    - No other nav items are added or changed
  </acceptance_criteria>
  <done>
    `orgs.routes.ts` created with child routes for list and detail. `app.routes.ts` updated to lazy-load orgs module. `user-profile-dropdown.component.html` updated to route to `/orgs`. All three components are wired together; `/orgs` route is now accessible from nav sidebar. Satisfies ORG-09 (sidebar link update).
  </done>
</task>

</tasks>

<verification>
After all tasks complete, verify the following phase-level conditions:

1. **Route accessibility:**
   - Run `ng serve`, navigate to app root
   - Click "My Organizations" in user profile dropdown
   - Should land on `/orgs` with org list (card or table view depending on preference)
   - Verify search and toggle buttons are present and functional

2. **Org list filtering:**
   - Verify no "System Org" or orgs with "ops" in the name appear
   - Verify no `hidden: true` orgs appear
   - Verify current org has visual indicator (border or "Active" chip)
   - Verify search filters orgs by name (case-insensitive)

3. **Org detail (read-only):**
   - Click an org card or row to navigate to `/orgs/:orgId`
   - Verify URL includes org ID
   - Verify org name and description are displayed
   - Verify members list shows with avatars and roles
   - Verify groups list shows with member counts
   - Verify boundaries list shows with status chips
   - Verify no edit forms or controls are present

4. **Conditional actions:**
   - Navigate to current org's detail page → should show "This is your active org" banner and "Go to Org Profile" button
   - Click "Go to Org Profile" → should navigate to `/org`
   - Navigate to a non-current org's detail page → should show disabled "Switch to Org" button with tooltip
   - Hover over "Switch to Org" button → tooltip should display "Available when session auth is enabled"

5. **Navigation consistency:**
   - `/org` route still works (current org editing)
   - `/orgs` and `/orgs/:orgId` are new and functional
   - All three routes coexist without conflict

</verification>

<success_criteria>
Phase 7 is complete when:
- [ ] `/orgs` list page renders all user's organizations filtered by hidden/System Org/ops criteria
- [ ] Card and table view modes toggle via UI button and persist via UserPreferencesService
- [ ] Search bar filters org list by name (case-insensitive)
- [ ] Current org displays visual indicator (border or "Active" chip)
- [ ] `/orgs/:orgId` route loads and renders read-only org overview
- [ ] Org detail shows org info (name, description), members, groups, and boundaries
- [ ] Current org shows "This is your active org" banner and "Go to Org Profile" button (→ `/org`)
- [ ] Non-current org shows disabled "Switch to Org" button with tooltip
- [ ] "My Organizations" link in user dropdown routes to `/orgs` (was `/org`)
- [ ] All read-only pages have no edit controls or forms
- [ ] All 11 requirements (ORG-01 through ORG-11) verified as complete
- [ ] Wave 0 test scaffold files exist and basic component creation tests pass

**Measure:** 100% requirement coverage. All manual verification checks pass. No build errors. No TypeScript errors in new components. Nyquist compliance verified.
</success_criteria>

<output>
After execution, create `.planning/phases/07-org-navigation/07-PLAN-SUMMARY.md` with:
- Execution summary (time, tasks completed)
- Files created/modified
- Routes wired and accessible
- Test results (manual verification checks)
- Any deviations from plan
- Next phase (08-org-navigation — Vendor Profile Schema)
</output>
