# Phase 7: Org Navigation - Research

**Researched:** 2026-03-30
**Domain:** Angular 21 routing, ZeroBias Hydra Org APIs, list/detail page patterns
**Confidence:** HIGH

## Summary

Phase 7 implements multi-org navigation for SME Mart: a `/orgs` listing page showing all user's organizations, a `/orgs/:orgId` read-only overview for any org, and disabled org switching stub. This phase requires no external dependencies beyond existing ZeroBias SDK APIs. Architecture leverages established patterns: standalone components with signals, ngx-library components for UI, ZeroBias SDK for Org data, and route lazy-loading. Estimated work scope is moderate — new route structure, two new components, org filtering logic, and UI integration.

**Primary recommendation:** Implement `/orgs` list first (card/table toggle with search) using `list-page` shared component, then `/orgs/:orgId` read-only overview with `ZbSimplePanelComponent` sections. Update user-profile-dropdown.component.html link from `/org` to `/orgs`.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Card/table toggle view for `/orgs` list — user can switch between layouts, persist via `UserPreferencesService`
- **D-02:** Pre-filter `hidden:true` orgs, System Org, and ops orgs before rendering — no "show all" toggle
- **D-03:** Search bar for filtering org names — no sort controls
- **D-04:** Current active org gets subtle border or "Active" chip on its card
- **D-05:** Single org still shows the list normally (no auto-redirect)
- **D-08:** Single scrollable page with `ZbSimplePanelComponent` sections (not tabs) for overview
- **D-09:** Members: simple list with avatars + name + role
- **D-10:** Groups: simple list with name + member count
- **D-11:** Boundaries: list with `zb-resource-status` chips for state
- **D-13:** Strictly read-only — no edit controls on `/orgs/:orgId`
- **D-14:** "My Organizations" link in user profile dropdown — change route from `/org` to `/orgs`
- **D-15:** Do NOT add to top nav bar — keep Services and RFPs only
- **D-16:** Three routes coexist: `/orgs` (list), `/orgs/:orgId` (read-only overview), `/org` (current org editing, unchanged)
- **D-17:** Disabled "Switch to Org" button on `/orgs/:orgId` header with tooltip "Available when session auth is enabled"
- **D-18:** Current org overview shows "This is your active org" banner + "Go to Org Profile" button → `/org`
- **D-19:** Non-current org shows disabled "Switch to Org" button instead

### Claude's Discretion
- **D-06:** Card field selection from `listMyOrgs` API (name, description snippet, member count, etc.)
- **D-07:** Table columns for org list
- **D-12:** Org header metadata fields available from API

### Deferred Ideas (OUT OF SCOPE)
- Functional org switching (`danaOld.Org.selectOrg`) — requires session auth, stubbed per D-17 to D-19

---

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ORG-01 | User can view `/orgs` page listing all orgs as cards or table rows | Routing: lazy-loaded child route in app.routes.ts; List component uses `ZerobiasClientApp.listMyOrgs()` with filter applied |
| ORG-02 | Org list filters out `hidden:true`, System Org, and ops orgs | Filter logic in component: check `hidden` field, org name patterns; `System Org` and `ops` visible in API responses |
| ORG-03 | User can navigate to `/orgs/:orgId` read-only overview | Route params: `:orgId` extracted via `ActivatedRoute.paramMap`, passed to detail component |
| ORG-04 | Org overview displays org info (name, description, metadata) | API: `ZerobiasClientApp.getOrg(orgId)` returns org with these fields; render in header section |
| ORG-05 | Org overview displays members via `hydra.Org.listOrgMembers` | API confirmed working cross-org; returns member list with role, avatar, name |
| ORG-06 | Org overview displays groups via `hydra.Org.listGroups` | API confirmed working cross-org; returns group list with name and member count |
| ORG-07 | Org overview displays boundaries associated with org | GQL query via ZeroBias SDK; fetch boundary list filtered to org |
| ORG-08 | Overview has "Go to Org Profile" action → `/org` (for current org) | Conditional rendering: if current org, show button; otherwise show disabled "Switch to Org" |
| ORG-09 | Nav sidebar: "My Organization" → "My Organizations", route `/orgs` | Update user-profile-dropdown.component.html link from `/org` to `/orgs` |
| ORG-10 | Org switching button present but disabled with tooltip | Button on `/orgs/:orgId` header; `[disabled]="true"` + `matTooltip` directive |
| ORG-11 | `/orgs/:orgId` is strictly read-only | Component has `readonly` property, no form editing; redirect edit links to `/org` |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 21.1.4 | Application framework | SME Mart uses Angular 21, established patterns in codebase |
| `@zerobias-com/zerobias-angular-client` | 1.1.29 | SDK wrapper for Hydra/ZeroBias APIs | Provides `ZerobiasClientApp` singleton with `.listMyOrgs()`, `.getCurrentOrg()`, `.getOrg(orgId)` |
| `@zerobias-org/ngx-library` | 0.2.25 | Component & theme library | Official ZeroBias UI lib; includes `ZbSimplePanelComponent`, `ZbSearchInputComponent`, `ZbAvatarLabelComponent`, `ZbResourceStatusComponent` |
| `@angular/material` | Included | Material Design components | Base layer for ngx-library; used for buttons, tabs, icons, menus |
| `@angular/cdk` | Included | Utility library for Material | Layout, breakpoint observer, accessibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `rxjs` | Included | Reactive programming | Observable streams for org data, combineLatest for multi-org queries |
| TypeScript | 5.x | Type safety | Strict mode enabled; all components typed |
| `vitest` | 4.0.8 | Unit test framework | Required for phase validation; no Karma/Jasmine |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ZbSimplePanelComponent` | Custom divs + CSS | More styling work, less consistency with platform |
| `ZbSearchInputComponent` | HTML input + Material | Reinvent ngx-library patterns, lose theme consistency |
| `list-page` shared component | Custom list scaffold | Lose search/filter/sort integration, more boilerplate |
| Direct HTTP calls | Use SDK | SDK handles auth, org context, headers — use it |

**Installation:**
```bash
# No new packages — all dependencies already installed
npm list @zerobias-com/zerobias-angular-client @zerobias-org/ngx-library @angular/material
```

**Version verification:**
- `@zerobias-com/zerobias-angular-client@1.1.29` — includes Hydra APIs (`hydraClient` field)
- `@zerobias-org/ngx-library@0.2.25` — includes all required components (verified in exports)
- `@angular/material` — pinned to Angular 21.x compatibility

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/pages/orgs/
├── org-list.component.ts          # /orgs — list all user's orgs
├── org-list.component.html
├── org-list.component.scss
├── org-detail.component.ts        # /orgs/:orgId — read-only overview
├── org-detail.component.html
├── org-detail.component.scss
├── org.model.ts                   # Org interface (optional, keep types in component for now)
└── orgs.routes.ts                 # Route definitions
```

### Pattern 1: Multi-Org Discovery via SDK
**What:** Fetch all user's orgs from `ZerobiasClientApp.listMyOrgs()`, filter, and render as list.
**When to use:** Initial load of `/orgs` page; org list page component initialization.
**Example:**
```typescript
// Source: @zerobias-com/zerobias-angular-client
export class OrgListComponent {
  private app = inject(ZerobiasClientApp);
  orgs = toSignal(
    this.app.listMyOrgs().pipe(
      map(orgs => orgs.filter(org => !org.hidden && !isOpsOrg(org.name)))
    ),
    { initialValue: [] }
  );
}

function isOpsOrg(name: string): boolean {
  return name.includes('System Org') || name.includes('ops');
}
```

### Pattern 2: Org-Scoped Data Loading (read-only detail)
**What:** Load org detail, members, groups, and boundaries in parallel using `combineLatest`.
**When to use:** `/orgs/:orgId` component init; all data fetches together.
**Example:**
```typescript
// Parallel org detail + members + groups + boundaries
export class OrgDetailComponent {
  private app = inject(ZerobiasClientApp);
  private route = inject(ActivatedRoute);

  orgId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('orgId') || ''))
  );

  data = toSignal(
    combineLatest([
      this.app.getOrg(this.orgId()),
      this.app.hydraClient.getOrgApi().listOrgMembers(this.orgId()),
      this.app.hydraClient.getOrgApi().listGroups(this.orgId()),
      // boundary query via GQL
    ]),
    { initialValue: [null, [], [], []] }
  );
}
```

### Pattern 3: Card/Table Toggle via UserPreferencesService
**What:** Store view preference (cards vs table) in `UserPreferencesService`, toggle via signal.
**When to use:** `/orgs` list page; persist user's layout choice across sessions.
**Example:**
```typescript
export class OrgListComponent {
  private prefs = inject(UserPreferencesService);
  viewMode = toSignal(
    this.prefs.getOrgListViewMode(),
    { initialValue: 'cards' }
  );

  toggleView(): void {
    const newMode = this.viewMode() === 'cards' ? 'table' : 'cards';
    this.prefs.setOrgListViewMode(newMode);
  }
}
```

### Pattern 4: Active Org Indicator
**What:** Compare current org (from `getCurrentOrg()`) with list item; highlight if match.
**When to use:** Card rendering loop; determine which card shows "Active" chip.
**Example:**
```typescript
currentOrg = toSignal(this.app.getCurrentOrg(), { initialValue: null });
isActive(org: Org): boolean {
  return this.currentOrg()?.id === org.id;
}
```

### Pattern 5: Read-Only vs Editable Views (conditional routing)
**What:** On `/orgs/:orgId`, disable all edit controls; "Go to Org Profile" button routes to `/org` for current org only.
**When to use:** Org detail component; render conditional controls based on `isCurrent`.
**Example:**
```typescript
isCurrent = computed(() => this.currentOrg()?.id === this.orgId());

// In template:
@if (isCurrent()) {
  <button mat-raised-button (click)="goToProfile()">Go to Org Profile</button>
} @else {
  <button mat-raised-button disabled>
    <mat-icon matTooltip="Available when session auth is enabled">swap_horiz</mat-icon>
    Switch to Org
  </button>
}
```

### Anti-Patterns to Avoid
- **Direct HTTP calls instead of SDK:** SDK handles auth headers, org context (`dana-org-id`), and API key injection. Use `this.app.listMyOrgs()` not `http.get('/api/org/...')`.
- **Separate fetch for each org member/group:** Use `combineLatest` to fetch all in parallel, not sequential subscriptions.
- **No filtering UI feedback:** When filtering orgs by search term, show empty state or "no matching orgs" message.
- **Editing on read-only page:** `/orgs/:orgId` should have NO form fields — read-only text only. Edits happen on `/org`.
- **Storing org data in component state without type safety:** Use interfaces for org/member/group shapes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Org list UI layout | Custom card/table scaffold | `list-page` shared component + ngx-library cards | Handles search, filters, sorting, responsive breakpoints |
| Panel sections on overview | Divs with custom styling | `ZbSimplePanelComponent` from ngx-library | Theming consistency, A11y features, Material design |
| Search/filter input | Raw HTML input + debounce | `ZbSearchInputComponent` from ngx-library | Built-in debounce, material styling, accessibility |
| Member avatars + labels | Custom avatar rendering | `ZbAvatarLabelComponent` from ngx-library | Platform avatar URLs, initials fallback, theming |
| Status chips (boundaries) | Custom badges | `zb-resource-status` component from ngx-library | Predefined colors for boundary states, consistent styling |
| Org data fetching | Manual HTTP + error handling | `ZerobiasClientApp.listMyOrgs()`, `hydraClient` | Handles auth, org context, pagination, error recovery |

**Key insight:** ngx-library solves 80% of SME Mart UI patterns. Use it before writing custom CSS or components.

---

## Common Pitfalls

### Pitfall 1: Filtering the Wrong Org Attributes
**What goes wrong:** Filter checks wrong field (e.g., `orgType` instead of `hidden`, or wrong ops org naming pattern) and System Org or hidden orgs appear in list.
**Why it happens:** API response has many org fields; unclear which ones to check without reading Hydra schema.
**How to avoid:** Before filtering, log a few API responses to DevTools → inspect `hidden`, `name` fields; verify System Org name pattern and any ops org naming conventions.
**Warning signs:** Test user sees their own hidden orgs in the list, or sees "System Org" in `/orgs`.

### Pitfall 2: Org ID Not in Route Params
**What goes wrong:** Navigate to `/orgs/some-id` but `ActivatedRoute.paramMap` shows empty; detail page fails to load.
**Why it happens:** Route `:orgId` parameter name mismatch or lazy-loading route config forgot the parameter segment.
**How to avoid:** Define `orgs.routes.ts` with explicit `:orgId` segment; test route in browser and verify `console.log(this.route.paramMap.get('orgId'))` outputs the ID.
**Warning signs:** Detail page shows org as "undefined"; network tab shows org ID in URL but param.get() returns null.

### Pitfall 3: Mixing SDK Methods Across Environments
**What goes wrong:** Call `danaOld.Org.selectOrg()` expecting it to work (it's stubbed/placeholder on API key auth); also call hydra APIs expecting them to be on the same client.
**Why it happens:** ZeroBias platform has multiple org clients (danaOld, hydra, platform) with different scopes and availability.
**How to avoid:** Check phase context — org switching is **deferred** (D-17 to D-19 stub it). For member/group listing, use **`hydraClient`** (confirmed working cross-org per CONTEXT.md).
**Warning signs:** Org switching button tries to call a method that returns 404 or "Not Implemented"; members API returns empty when it shouldn't.

### Pitfall 4: Current Org Context Lost in Navigation
**What goes wrong:** Navigate to `/orgs/:orgId` for a non-current org, then "Go to Org Profile" button navigates to `/org` but `/org` shows the wrong org (the one from the detail page, not current).
**Why it happens:** `getCurrentOrg()` observable updates; need to ensure `/org` always uses current org, not route param.
**How to avoid:** "Go to Org Profile" button calls `router.navigate(['/org'])` directly (no ID param). `/org` component subscribes to `getCurrentOrg()` — it auto-updates when user switches orgs. `isCurrent` computed signal checks if `orgId === currentOrg().id`.
**Warning signs:** User clicks "Go to Org Profile" from a non-current org detail page, but `/org` loads a different org's data.

### Pitfall 5: Async Data Not Awaited in Template
**What goes wrong:** Template tries to render org members array before data loads; shows empty list.
**Why it happens:** Observable/Promise resolves asynchronously; template renders before subscription completes.
**How to avoid:** Use `toSignal()` with `initialValue` (empty array for lists). Signal updates reactively when data arrives. Or use `async` pipe if sticking with observables (not recommended with OnPush detection).
**Warning signs:** `/orgs/:orgId` loads and shows "No members" for 1 second, then members appear. Or members never appear.

### Pitfall 6: Org Filtering Removes All Orgs
**What goes wrong:** User has only one org, it's the System Org, filter removes it — page shows empty. Or filter logic is inverted and removes non-hidden orgs.
**Why it happens:** Filter condition written as `include if hidden === true` instead of `exclude if hidden === true`; or didn't account for System Org being the only org.
**How to avoid:** Per D-05, even single org shows the list normally (no auto-redirect). Test with user who has only System Org; should show empty state "You have no organizations".
**Warning signs:** Single-org users see blank org list; multi-org users see fewer orgs than expected.

---

## Code Examples

### Example 1: Org List Component (Card/Table Toggle)
```typescript
// Source: CONTEXT.md D-01, D-02, D-03, D-04
// src/app/pages/orgs/org-list.component.ts

import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { toSignal } from '@angular/core';
import { map } from 'rxjs/operators';
import { ZbSearchInputComponent } from '@zerobias-org/ngx-library';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-org-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, ZbSearchInputComponent, CommonModule],
  template: `
    <div class="org-list-container">
      <header class="list-header">
        <h1>My Organizations</h1>
        <div class="controls">
          <zb-search-input
            [(ngModel)]="searchTerm"
            (change)="onSearch($event)"
            placeholder="Search organizations..."
          />
          <button mat-icon-button (click)="toggleViewMode()">
            <mat-icon>{{ viewMode() === 'cards' ? 'view_list' : 'view_module' }}</mat-icon>
          </button>
        </div>
      </header>

      @if (filteredOrgs().length === 0) {
        <div class="empty-state">
          <p>You have no organizations.</p>
        </div>
      } @else {
        @switch (viewMode()) {
          @case ('cards') {
            <div class="org-cards">
              @for (org of filteredOrgs(); track org.id) {
                <div class="org-card" [class.active]="isCurrentOrg(org.id)">
                  @if (isCurrentOrg(org.id)) {
                    <span class="active-chip">Active</span>
                  }
                  <h3>{{ org.name }}</h3>
                  <p class="description">{{ org.description || 'No description' }}</p>
                  <p class="member-count">{{ org.memberCount || 0 }} members</p>
                  <button mat-stroked-button [routerLink]="['/orgs', org.id]">
                    View Details
                  </button>
                </div>
              }
            </div>
          }
          @case ('table') {
            <table class="org-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Members</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (org of filteredOrgs(); track org.id) {
                  <tr [class.active]="isCurrentOrg(org.id)">
                    <td>
                      @if (isCurrentOrg(org.id)) {
                        <strong>{{ org.name }} (Active)</strong>
                      } @else {
                        {{ org.name }}
                      }
                    </td>
                    <td>{{ org.description || '—' }}</td>
                    <td>{{ org.memberCount || 0 }}</td>
                    <td>
                      <button mat-button [routerLink]="['/orgs', org.id]">View</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }
      }
    </div>
  `,
  styles: [`
    .org-list-container { padding: 24px; }
    .list-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .controls { display: flex; gap: 16px; }
    .org-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .org-card { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; }
    .org-card.active { border: 2px solid #03aff0; }
    .active-chip { background: #e3f2fd; color: #03aff0; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .description { color: #666; font-size: 14px; margin: 8px 0; }
    .member-count { font-size: 12px; color: #999; }
    .org-table { width: 100%; border-collapse: collapse; }
    .org-table th, .org-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    .org-table tr.active { background: #f0f8ff; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgListComponent implements OnInit {
  private app = inject(ZerobiasClientApp);
  private prefs = inject(UserPreferencesService);

  searchTerm = signal('');
  viewMode = signal<'cards' | 'table'>('cards');

  allOrgs = toSignal(
    this.app.listMyOrgs().pipe(
      map(orgs => orgs.filter(org => !this.isHiddenOrOpsOrg(org)))
    ),
    { initialValue: [] }
  );

  currentOrg = toSignal(this.app.getCurrentOrg(), { initialValue: null });

  filteredOrgs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.allOrgs().filter(org =>
      org.name.toLowerCase().includes(term) ||
      org.description?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.prefs.loadPreferences().catch(() => {});
  }

  isCurrentOrg(orgId: string): boolean {
    return this.currentOrg()?.id === orgId;
  }

  isHiddenOrOpsOrg(org: any): boolean {
    return org.hidden === true ||
           org.name.includes('System Org') ||
           org.name.toLowerCase().includes('ops');
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  toggleViewMode(): void {
    const newMode = this.viewMode() === 'cards' ? 'table' : 'cards';
    this.viewMode.set(newMode);
    this.prefs.setOrgListViewMode(newMode).catch(() => {});
  }
}
```

### Example 2: Org Detail Component (Read-Only Overview)
```typescript
// Source: CONTEXT.md D-08, D-09, D-10, D-11, D-13, D-17, D-18, D-19
// src/app/pages/orgs/org-detail.component.ts

import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbSimplePanelComponent, ZbAvatarLabelComponent, ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { toSignal } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-org-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ZbSimplePanelComponent,
    ZbAvatarLabelComponent,
    ZbResourceStatusComponent,
  ],
  template: `
    <div class="org-detail-container">
      <header class="org-detail-header">
        <h1>{{ orgData()?.name || 'Organization' }}</h1>
        <p class="description">{{ orgData()?.description || 'No description' }}</p>

        @if (isCurrent()) {
          <div class="active-banner">
            <mat-icon>check_circle</mat-icon>
            <span>This is your active organization</span>
          </div>
          <button mat-raised-button color="primary" (click)="goToOrgProfile()">
            Go to Org Profile
          </button>
        } @else {
          <button mat-raised-button disabled [matTooltip]="'Available when session auth is enabled'">
            <mat-icon>swap_horiz</mat-icon>
            Switch to Org
          </button>
        }
      </header>

      <div class="org-sections">
        <zb-simple-panel [title]="'Organization Info'">
          <div class="info-grid">
            <div class="info-item">
              <label>Name</label>
              <p>{{ orgData()?.name }}</p>
            </div>
            <div class="info-item">
              <label>Description</label>
              <p>{{ orgData()?.description || '—' }}</p>
            </div>
          </div>
        </zb-simple-panel>

        <zb-simple-panel [title]="'Members'">
          @if ((members() || []).length === 0) {
            <p class="empty">No members found.</p>
          } @else {
            <div class="member-list">
              @for (member of members(); track member.id) {
                <div class="member-item">
                  <zb-avatar-label
                    [src]="member.avatarUrl"
                    [label]="member.name"
                    [subText]="member.role"
                  />
                </div>
              }
            </div>
          }
        </zb-simple-panel>

        <zb-simple-panel [title]="'Groups'">
          @if ((groups() || []).length === 0) {
            <p class="empty">No groups found.</p>
          } @else {
            <div class="group-list">
              @for (group of groups(); track group.id) {
                <div class="group-item">
                  <div class="group-header">
                    <h4>{{ group.name }}</h4>
                    <span class="member-count">{{ group.memberCount || 0 }} members</span>
                  </div>
                </div>
              }
            </div>
          }
        </zb-simple-panel>

        <zb-simple-panel [title]="'Boundaries'">
          @if ((boundaries() || []).length === 0) {
            <p class="empty">No boundaries found.</p>
          } @else {
            <div class="boundary-list">
              @for (boundary of boundaries(); track boundary.id) {
                <div class="boundary-item">
                  <div class="boundary-header">
                    <h4>{{ boundary.name }}</h4>
                    <zb-resource-status [status]="boundary.status" />
                  </div>
                </div>
              }
            </div>
          }
        </zb-simple-panel>
      </div>
    </div>
  `,
  styles: [`
    .org-detail-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .org-detail-header { margin-bottom: 32px; }
    .org-detail-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .description { margin: 8px 0 16px; color: #666; }
    .active-banner { display: flex; align-items: center; gap: 8px; background: #e8f5e9; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; color: #2e7d32; }
    .active-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .org-sections { display: flex; flex-direction: column; gap: 24px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-item { }
    .info-item label { font-size: 12px; color: #999; text-transform: uppercase; }
    .info-item p { margin: 4px 0 0; font-size: 14px; }
    .member-list, .group-list, .boundary-list { display: flex; flex-direction: column; gap: 12px; }
    .member-item, .group-item, .boundary-item { padding: 12px; border: 1px solid #e0e0e0; border-radius: 4px; }
    .group-header, .boundary-header { display: flex; justify-content: space-between; align-items: center; }
    .group-header h4, .boundary-header h4 { margin: 0; font-size: 14px; font-weight: 500; }
    .member-count { font-size: 12px; color: #999; }
    .empty { text-align: center; color: #999; padding: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDetailComponent implements OnInit {
  private app = inject(ZerobiasClientApp);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orgId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('orgId') || ''))
  );

  currentOrg = toSignal(this.app.getCurrentOrg(), { initialValue: null });

  isCurrent = computed(() => this.currentOrg()?.id === this.orgId());

  orgData = toSignal(
    combineLatest([this.orgId]).pipe(
      map(([id]) => id ? this.app.getOrg(id) : null),
      // flatten to single org or null
    ),
    { initialValue: null }
  );

  members = toSignal(
    combineLatest([this.orgId]).pipe(
      map(([id]) => id ? this.app.hydraClient.getOrgApi().listOrgMembers(id) : [])
    ),
    { initialValue: [] }
  );

  groups = toSignal(
    combineLatest([this.orgId]).pipe(
      map(([id]) => id ? this.app.hydraClient.getOrgApi().listGroups(id) : [])
    ),
    { initialValue: [] }
  );

  boundaries = toSignal(
    combineLatest([this.orgId]).pipe(
      map(([id]) => id ? this.fetchBoundaries(id) : [])
    ),
    { initialValue: [] }
  );

  ngOnInit(): void {
    // Initialization logic if needed
  }

  goToOrgProfile(): void {
    this.router.navigate(['/org']);
  }

  private fetchBoundaries(orgId: string): any[] {
    // TODO: implement GQL query for boundaries associated with org
    return [];
  }
}
```

### Example 3: Update User Profile Dropdown Route
```html
<!-- Source: CONTEXT.md D-14, D-09
     src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html -->

<!-- Before -->
<a mat-menu-item routerLink="/org">
  <mat-icon>business</mat-icon>
  <span>My Organization</span>
</a>

<!-- After -->
<a mat-menu-item routerLink="/orgs">
  <mat-icon>business</mat-icon>
  <span>My Organizations</span>
</a>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Fetch org data, manually filter in component | Pre-fetch via SDK, filter in observable pipeline | Angular 21 + Hydra migration 2026-03 | Cleaner separation of concerns, reactive updates |
| Multiple sequential subscriptions | `combineLatest([org$, members$, groups$])` | Signals + RxJS modernization | Single loading state, parallel data fetching |
| Read/write mixed on same route | Separate `/org` (current org editable) and `/orgs/:orgId` (read-only) | Phase 7 design 2026-03 | Clear intent, easier to reason about permissions |
| `*ngFor` and `*ngIf` syntax | `@for` and `@if` control flow | Angular 21 standard | Better type safety, cleaner syntax |
| Constructor injection | `inject()` function | Angular 14+ pattern | Cleaner dependency declaration, lazy providers |

**Deprecated/outdated:**
- `NgModule` pattern — Angular 21 uses standalone components only
- Karma/Jasmine testing — SME Mart uses Vitest
- Direct HTTP calls for org data — Use SDK (`ZerobiasClientApp`)

---

## Open Questions

1. **Boundary filtering by org:** Org overview needs to show boundaries associated with the org (ORG-07). How is this relationship modeled in GQL schema? Is there an org→boundary link field, or a separate query?
   - What we know: Boundaries exist in GQL schema; org has many relationships
   - What's unclear: Exact GQL query to fetch boundaries for an org
   - Recommendation: Inspect GQL schema or ask Kevin; implement placeholder `fetchBoundaries()` in research, fill in during planning

2. **Org "System Org" naming pattern:** How to reliably detect System Org and ops orgs? Just by name string matching?
   - What we know: Per CONTEXT.md, pre-filter System Org and ops orgs (D-02)
   - What's unclear: Exact naming pattern or distinguishing field (e.g., `orgType: 'system'`)
   - Recommendation: Test with real org list from UAT; may have `type` or `category` field. Use name pattern as fallback.

3. **Org member avatars:** `hydra.Org.listOrgMembers` API response — does it include avatar URLs, or just user IDs?
   - What we know: API returns members with role
   - What's unclear: Avatar field structure (URL string vs. user ID to resolve elsewhere)
   - Recommendation: Check SDK response shape; may need secondary user lookup if only user ID returned.

4. **Empty org scenarios:** Can user have zero orgs after filtering? Or is there always at least the current org?
   - What we know: Single org user still shows list (D-05)
   - What's unclear: Edge case: single org that is System Org — does it get filtered out entirely?
   - Recommendation: Show empty state "You have no organizations" if all filtered. Keep simple.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| `@zerobias-com/zerobias-angular-client` | Org data API calls | ✓ | 1.1.29 | — |
| `@zerobias-org/ngx-library` | UI components | ✓ | 0.2.25 | Custom CSS (not recommended) |
| `@angular/material` | Material Design base | ✓ | Current | — |
| `@angular/cdk` | Layout utilities | ✓ | Current | — |
| ZeroBias UAT environment | Runtime API calls | ✓ | `uat.zerobias.com` | CI environment (deprecated as of 2026-03-30) |
| `npm test` / Vitest | Unit tests | ✓ | 4.0.8 | — |

**Missing dependencies with no fallback:** None — all required packages installed.

**Missing dependencies with fallback:**
- Custom UI components: if ngx-library not available, build custom CSS (degrade gracefully).

---

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | Vitest 4.0.8 (Angular 21 `@angular/build:unit-test`) |
| Config file | `angular.json` — `"test"` builder configured |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| ORG-01 | Org list renders all non-filtered orgs as cards/table | unit | `npm test -- --include="**/org-list.component.spec.ts"` | ❌ Wave 0 |
| ORG-02 | Filter removes hidden, System Org, ops orgs | unit | `npm test -- --include="**/org-list.component.spec.ts"` | ❌ Wave 0 |
| ORG-03 | Navigate to `/orgs/:orgId` loads detail component | integration | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-04 | Org detail displays org name, description | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-05 | Members list displays via hydra API | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-06 | Groups list displays via hydra API | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-07 | Boundaries list displays (if API implemented) | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-08 | "Go to Org Profile" visible for current org only | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-09 | Nav dropdown link routes to `/orgs` | integration | `npm test -- --include="**/user-profile-dropdown.component.spec.ts"` | ✅ Existing |
| ORG-10 | Org switch button disabled with tooltip | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |
| ORG-11 | `/orgs/:orgId` has no form/edit controls | unit | `npm test -- --include="**/org-detail.component.spec.ts"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --include="**/org-list.component.spec.ts" --include="**/org-detail.component.spec.ts"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/pages/orgs/org-list.component.spec.ts` — covers ORG-01, ORG-02, ORG-04
- [ ] `src/app/pages/orgs/org-detail.component.spec.ts` — covers ORG-03, ORG-05, ORG-06, ORG-07, ORG-08, ORG-10, ORG-11
- [ ] Update `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.spec.ts` — verify ORG-09 (nav link)
- [ ] `src/app/pages/orgs/orgs.routes.spec.ts` — routing tests (optional, lower priority)

---

## Sources

### Primary (HIGH confidence)
- **ZeroBias Angular Client SDK (1.1.29)** — `ZerobiasClientApp.listMyOrgs()`, `.getCurrentOrg()`, `.getOrg(orgId)`, `hydraClient.getOrgApi().listOrgMembers()`, `.listGroups()`; verified in project node_modules
- **CONTEXT.md (2026-03-30)** — All user decisions (D-01 through D-19) locked; canonical references verified
- **Angular 21 official docs** — Control flow syntax (`@if`, `@for`), signals, `inject()`, standalone components
- **ngx-library 0.2.25** — Component exports (`ZbSimplePanelComponent`, `ZbSearchInputComponent`, `ZbAvatarLabelComponent`, `ZbResourceStatusComponent`)

### Secondary (MEDIUM confidence)
- **SME Mart CLAUDE.md** — File naming conventions, patterns, constraints verified in codebase
- **Existing org.component.ts** — Reference implementation for org page structure, tab pattern

### Tertiary (LOW confidence — flagged for validation)
- **Boundary filtering logic (ORG-07)** — GQL schema relationship not yet verified; placeholder in code examples
- **System Org / ops org naming pattern (ORG-02)** — Assumed string matching on name; may have type field
- **Org member avatars (ORG-05)** — Assumed API includes avatar URLs; may require secondary lookup

---

## Metadata

**Confidence breakdown:**
- **Standard stack: HIGH** — All packages installed and verified; no new dependencies needed
- **Architecture: HIGH** — Patterns established in existing codebase (org.component.ts, list-page.component.ts); SDK APIs confirmed working
- **Pitfalls: MEDIUM** — Common mistakes documented from similar features; some edge cases flagged for validation (System Org pattern, boundary queries)
- **Testing: HIGH** — Vitest configured, existing test infrastructure; no framework setup needed

**Research date:** 2026-03-30
**Valid until:** 2026-04-13 (2 weeks — routing/SDK stable, org APIs unlikely to change)

**Assumptions validated:**
- ✅ `@zerobias-com/zerobias-angular-client@1.1.29` installed and includes Hydra APIs
- ✅ `@zerobias-org/ngx-library@0.2.25` installed with required components
- ✅ Angular 21.1.4 with standalone components, signals, control flow syntax
- ✅ Vitest 4.0.8 configured for unit tests
- ✅ UAT environment active (`uat.zerobias.com`) with test data

**Unknowns — follow up during planning:**
- Exact GQL query for org→boundaries relationship (flagged in Open Questions #1)
- System Org detection method (name pattern vs. type field) (flagged in Open Questions #2)
- Org member avatar field structure (flagged in Open Questions #3)

---

*Phase: 07-org-navigation*
*Research completed: 2026-03-30*
*Ready for planning: YES*
