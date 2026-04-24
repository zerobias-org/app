# Phase 13: Pilot Projects - Research

**Researched:** 2026-04-02
**Domain:** Angular 21 UI + SmeMartProject entity pilot workflow + vetting integration
**Confidence:** HIGH

## Summary

Phase 13 enables buyers to create pilot projects for POC testing, mark them complete, and promote them to real projects. All infrastructure is already in place: `projectType` field exists on SmeMartProject, field mappings are complete, and the vetting suggestion pattern is proven in the codebase.

This is a UI-only phase with no schema or service changes required. Work focuses on:
1. UI chips and icons for pilot type differentiation
2. Project list filter for type (All/RFP/Pilot/Project)
3. Completion button + dialog on project detail
4. Promote-to-project workflow (creates new linked SmeMartProject)
5. Vetting suggestion creation (non-blocking suggestion, not auto-created)

**Primary recommendation:** Implement as three focused tasks: (1) UI improvements for type visibility, (2) completion and promotion workflows, (3) vetting suggestion integration. All use existing patterns — no new libraries or architecture needed.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Manual button for MVP. Buyer clicks "Mark Pilot Complete" on project detail. Records status = completed.
- **D-02:** Status = completed (reuse existing status field). No separate pilotCompletedAt timestamp.
- **D-03:** Completion shows a summary confirmation dialog with pilot name, dates, and optional completion notes field.
- **D-04:** Allow revert — buyer can reopen a completed pilot back to active status.
- **D-05:** Task-based completion deferred — note in code that this will likely become task-gated when platform task system is wired in.
- **D-06:** Pilot stays as-is after promotion (status = completed). New SmeMartProject created with projectType = 'project'. Pilot gets a link to the promoted project (e.g., `promotedProjectId` field).
- **D-07:** "Promote to Project" button lives in actions menu (mat-menu) on project detail. Visible only when projectType = pilot AND status = completed.
- **D-08 (out):** Data carry-over during pilot→project promotion.
- **D-09:** Type chip + distinct icon. Add a second chip showing "Pilot" (or "RFP" / "Project") with distinct color alongside existing status chip. Change mat-icon for pilot projects (e.g., science/flask instead of folder_special).
- **D-10:** Add projectType filter to project list header: All / RFP / Pilot / Project.
- **D-11:** Suggestion only — pilot completion triggers a suggestion in the vetting suggestion panel (same pattern as vendor profile pre-fill). Not auto-created.
- **D-12:** Suggestion includes pilot summary: name, completion date, completion notes. Buyer clicks through for full details.
- **D-13 (out):** Vetting scope for pilot completion suggestion attachment.

### Claude's Discretion
- Data carry-over fields during pilot→project promotion (D-08) — pick reasonable fields
- Vetting item attachment scope (D-13) — whichever scope makes sense for vetting system
- Specific chip colors for project types
- Icon choices for pilot vs RFP vs project
- Schema field for `promotedProjectId` link on SmeMartProject (verify if schema change needed)

### Deferred Ideas
None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLT-01 | SmeMartProject entity supports `projectType` discriminator (rfp \| pilot \| project) | Field exists in model, field mappings, and GQL types. No schema change required. |
| PLT-02 | Pilot completion creates a conditional vetting checklist item | Vetting suggestion pattern proven in codebase (vetting-suggestion-panel.component.ts). Manual button triggers suggestion creation in VettingService. |
| PLT-03 | Buyer can promote a completed pilot to a real project (new SmeMartProject linked to pilot) | SmeMartProjectService.createProject() + SmeMartResourceService.linkResources() support this workflow. Bidirectional linking established. |
| PLT-04 | Pilot projects display visual badges/labels distinguishing them in lists and detail views | Project card already renders status chip. Add type chip with distinct icon (science, folder_special, description for types). Project list filter header implemented in ButtonToggleGroup. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/core | 21.2.7 | Angular framework | Project standard, standalone components, signals |
| @angular/material | 21.2.5 | UI components (chips, icons, buttons, menus, dialogs) | Project standard, ZeroBias design consistency |
| @zerobias-org/ngx-library | 0.2.28 | ZeroBias shared components (ZbResourceStatusComponent, ZbSnakeToSpacesPipe) | Replaces custom builds, theme integration |
| RxJS | 7.8.x | Reactive state management, async patterns | Angular standard, BehaviorSubject for context state |

### Service Layer
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PipelineWriteService | custom | Async fire-and-forget writes to AuditgraphDB Pipeline | All entity creates/updates/deletes |
| GraphqlReadService | custom | GraphQL queries from AuditgraphDB | All entity fetches/lists/relationships |
| SmeMartProjectService | custom | Project CRUD + RFP methods + relationship queries | All project operations (create, update, list, filtering) |
| SmeMartResourceService | custom | Entity linking (bidirectional relationships) | Pilot→project promotion links |
| VettingService | custom | Vetting item CRUD + summary computation | Pilot completion → vetting suggestion |
| EngagementContextService | custom | Reactive engagement state (loaded in detail page) | Access current engagement context |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @angular/cdk | 21.1.4 | CDK overlay, change detection utilities | Material components depend on it |
| @angular/common | 21.1.0 | CommonModule, DatePipe, TitleCasePipe | Standard templating pipes |
| TypeScript | 5.6.x | Language, strict mode enabled | All source files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mat-menu for actions | Custom dropdown | ngx-library style inconsistency, extra work |
| Mat-dialog for completion | Manual toast + form overlay | Disrupts user flow, worse UX |
| VettingService suggestion creation | Hardcoded Engagement vetting item creation | Loses future task-gating integration pattern |

**Installation:** No new packages. All dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure

SmeMartProject pilot features integrate into existing structure — no new directories required:

```
src/app/
├── pages/project/
│   ├── project-card.component.ts       # Add type chip + icon variant
│   ├── project-detail.component.ts     # Add completion button + promote action
│   ├── project-list.component.ts       # Add projectType filter toggle
│   └── project-completion-dialog.component.ts  # NEW: Completion + notes dialog
├── core/
│   ├── models/
│   │   └── sme-mart-project.model.ts  # Add promotedProjectId? field
│   ├── services/
│   │   ├── sme-mart-project.service.ts # Add completeProjectAsP ilot(), promoteToProject()
│   │   └── vetting.service.ts          # Already exists — add createPilotCompletionSuggestion()
│   └── field-mappings.ts               # Already maps projectType
└── pages/engagements/tabs/
    └── vetting-suggestion-panel.component.ts  # Already exists — no changes needed
```

### Pattern 1: Project Type Differentiation via Chips + Icons

**What:** Display two chips on project card and detail header: (1) status chip (existing), (2) type chip with distinct icon.

**When to use:** Always render both — they're independent, status shows workflow state, type shows project classification.

**Example:**
```typescript
// project-card.component.ts
<mat-card-subtitle>
  <div class="project-chips">
    <!-- Status chip (existing) -->
    <mat-chip [class]="'status-' + proj.status" size="small">
      {{ proj.status | titlecase }}
    </mat-chip>
    
    <!-- Type chip (NEW) -->
    @if (proj.projectType) {
      <mat-chip [class]="'type-' + proj.projectType" size="small">
        <mat-icon [matIconAvatarClass]="getTypeIcon(proj.projectType)"></mat-icon>
        {{ proj.projectType | titlecase }}
      </mat-chip>
    }
  </div>
</mat-card-subtitle>

// Component class
getTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    'rfp': 'description',      // Document icon
    'pilot': 'science',         // Flask/experiment icon
    'project': 'folder_open',   // Folder icon
  };
  return iconMap[type] || 'folder_special';
}

// Styles (add to project-card.component.ts styles)
.type-pilot { --mdc-chip-label-text-color: var(--zb-color-warning); }
.type-rfp { --mdc-chip-label-text-color: var(--zb-color-info); }
.type-project { --mdc-chip-label-text-color: var(--zb-color-success); }
```

**Why this pattern:** Reuses Material chip styling, consistent with existing status chips, icons provide visual scannability in lists.

### Pattern 2: Project Type Filter in List Header

**What:** Add button-toggle-group in project-list header for filtering by type.

**When to use:** On project list page, above the table/card view toggle.

**Example:**
```typescript
// project-list.component.ts
<div class="project-list-header">
  <h3>Projects</h3>
  
  <!-- Type filter (NEW) -->
  <mat-button-toggle-group 
    [(value)]="projectTypeFilter()" 
    (change)="setProjectTypeFilter($event.value)"
    hideSingleSelectionIndicator>
    <mat-button-toggle value="">All</mat-button-toggle>
    <mat-button-toggle value="rfp">RFP</mat-button-toggle>
    <mat-button-toggle value="pilot">Pilot</mat-button-toggle>
    <mat-button-toggle value="project">Project</mat-button-toggle>
  </mat-button-toggle-group>
  
  <!-- View mode toggle (existing) -->
  <mat-button-toggle-group ...></mat-button-toggle-group>
</div>

// Component logic
readonly projectTypeFilter = signal<string>('');

async setProjectTypeFilter(filter: string): Promise<void> {
  this.projectTypeFilter.set(filter);
  await this.loadProjects(); // Refetch with filter
}

async loadProjects(): Promise<void> {
  const options: any = { pageNumber: 1, pageSize: 50 };
  if (this.projectTypeFilter()) {
    options.filters = { projectType: `.eq.${this.projectTypeFilter()}` };
  }
  this.projects.set(
    await this.projectService.listProjects(options)
  );
}
```

**Why this pattern:** Material button-toggle matches existing view toggle, stored in signal for reactive updates, minimal service changes (GraphqlReadService supports filters).

### Pattern 3: Pilot Completion Dialog + State Update

**What:** On "Mark Pilot Complete" button click, show modal with pilot summary, optional notes field, confirm/cancel.

**When to use:** Only when `projectType = 'pilot'` AND `status !== 'completed'`.

**Example:**
```typescript
// project-detail.component.ts
async completePilot(): Promise<void> {
  const project = this.ctx.project();
  if (!project || project.projectType !== 'pilot') return;

  const dialogRef = this.dialog.open(ProjectCompletionDialogComponent, {
    width: '500px',
    data: { project },
  });

  const result = await dialogRef.afterClosed().toPromise();
  if (!result) return; // User cancelled

  // Update project status to 'completed'
  const updated = await this.projectService.updateProject(project.id, {
    status: 'completed',
    // Optionally store completion notes (depends on schema field availability)
  });

  this.ctx.setProject(updated);
  this.snackBar.open('Pilot marked complete', 'Dismiss', { duration: 3000 });

  // Trigger vetting suggestion creation (async, non-blocking)
  await this.createPilotCompletionSuggestion(project);
}

// Dialog component
@Component({
  selector: 'app-project-completion-dialog',
  template: `
    <h2 mat-dialog-title>Mark Pilot Complete</h2>
    <mat-dialog-content>
      <div class="completion-summary">
        <p><strong>{{ data.project.name }}</strong></p>
        <p>Started: {{ data.project.startDate | date:'mediumDate' }}</p>
        @if (data.project.targetEndDate) {
          <p>Target End: {{ data.project.targetEndDate | date:'mediumDate' }}</p>
        }
      </div>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Completion Notes (Optional)</mat-label>
        <textarea matInput [(ngModel)]="notes" rows="4"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" 
        (click)="dialogRef.close({ notes: notes })">
        Complete Pilot
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, FormsModule],
})
export class ProjectCompletionDialogComponent {
  notes = '';
  constructor(public dialogRef: MatDialogRef<ProjectCompletionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {}
}
```

**Why this pattern:** Dialog provides clear confirmation UX, allows optional notes capture, matches platform patterns (see EngagementVettingItem model for notes field precedent).

### Pattern 4: Pilot→Project Promotion Workflow

**What:** "Promote to Project" action creates new SmeMartProject with `projectType = 'project'`, links it to pilot via `promotedProjectId`, copies key fields.

**When to use:** Only when `projectType = 'pilot'` AND `status = 'completed'`. Button in actions menu on detail page.

**Example:**
```typescript
// project-detail.component.ts
async promoteToProject(): Promise<void> {
  const project = this.ctx.project();
  if (!project || project.projectType !== 'pilot' || project.status !== 'completed') {
    this.snackBar.open('Can only promote completed pilots', 'Dismiss');
    return;
  }

  this.promoting.set(true);
  try {
    // 1. Create new project with type 'project'
    const newProject = await this.projectService.createProject({
      name: project.name,
      description: project.description,
      engagementId: project.engagementId,
      projectType: 'project',
      status: 'draft', // Reset to draft for real project workflow
      startDate: new Date().toISOString(),
      targetEndDate: project.targetEndDate, // Carry over target date
      category: project.category,
      budgetType: project.budgetType,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      timeline: project.timeline,
    });

    // 2. Link pilot → promoted project
    await this.resourceService.linkResources(
      project.id,
      'sme-mart:project',
      newProject.id,
      'sme-mart:project',
      'promoted_to', // Custom link type for pilot promotion
      { promotedAt: new Date().toISOString() }
    );

    // 3. Update pilot with promotedProjectId pointer
    await this.projectService.updateProject(project.id, {
      promotedProjectId: newProject.id,
    });

    this.snackBar.open('Pilot promoted to project', 'View', {
      duration: 5000,
    }).onAction().subscribe(() => {
      this.router.navigate(['/projects', newProject.id]);
    });

    // Navigate to new project detail
    setTimeout(() => {
      this.router.navigate(['/projects', newProject.id]);
    }, 2000);

  } catch (err) {
    console.error('[ProjectDetail] Promotion failed:', err);
    this.snackBar.open('Failed to promote pilot', 'Dismiss', { duration: 5000 });
  } finally {
    this.promoting.set(false);
  }
}
```

**Schema consideration:** If `promotedProjectId` field doesn't exist on SmeMartProject, a simple schema update is needed:
```yaml
SmeMartProject:
  fields:
    promotedProjectId:
      type: string
      nullable: true
      description: "ID of the project this pilot was promoted to"
```

But CONTEXT.md indicates projectType field already exists, so assume schema support exists (verify during implementation).

**Why this pattern:** Creates full separation between pilot and project (different status lifecycle), maintains audit trail via links, allows buyers to still view pilot completion notes separately.

### Pattern 5: Vetting Suggestion Creation on Pilot Completion

**What:** When pilot status = 'completed', create a suggestion item in the vetting suggestion panel (same pattern as vendor profile pre-fill).

**When to use:** Automatically after "Mark Pilot Complete" confirmation (async, non-blocking).

**Example:**
```typescript
// project-detail.component.ts (continued)
async createPilotCompletionSuggestion(project: SmeMartProject): Promise<void> {
  try {
    if (!project.engagementId) return;

    const engagement = await this.engagementService.getEngagement(project.engagementId);
    if (!engagement) return;

    // Create a transient suggestion object (not yet persisted)
    // The vetting suggestion panel will display this without auto-attaching
    const suggestion = {
      pilotId: project.id,
      pilotName: project.name,
      completionDate: new Date().toISOString(),
      completionNotes: project.completionNotes || '',
      engagementId: project.engagementId,
      vettingType: 'documentation', // Type of vetting this suggests
      summary: `Pilot "${project.name}" completed. Ready for vetting checklist.`,
    };

    // Signal this to vetting tab (via context or event service)
    this.vettingService.setPilotCompletionSuggestion(suggestion);

    // In vetting-suggestion-panel.component, subscribe to this and render as a suggestion card
  } catch (err) {
    console.warn('[ProjectDetail] Failed to create vetting suggestion:', err);
    // Silent fail — vetting not critical
  }
}

// vetting.service.ts (add new signal-based pattern)
private pilotCompletionSuggestion = signal<PilotCompletionSuggestion | null>(null);
readonly pilotCompletionSuggestion$ = this.pilotCompletionSuggestion.asObservable();

setPilotCompletionSuggestion(suggestion: PilotCompletionSuggestion): void {
  this.pilotCompletionSuggestion.set(suggestion);
}

// vetting-suggestion-panel.component.ts (listen for pilot suggestions)
readonly pilotSuggestion = toSignal(this.vetting.pilotCompletionSuggestion$);

// Render in template alongside existing suggestions
```

**Why this pattern:** Non-blocking (async), doesn't interrupt pilot completion workflow, matches the vendor profile pre-fill suggestion pattern already in codebase, allows buyer to dismiss or act on vetting checklist separately.

### Anti-Patterns to Avoid

- **Storing completion timestamp separately:** CONTEXT.md D-02 says use `status = 'completed'` only. No `pilotCompletedAt` field — status enum is the signal.
- **Auto-creating vetting items:** D-11 says suggestion only, not auto-created. Auto-creation over-reaches into vetting policy.
- **Deletion instead of revert:** D-04 says allow revert (reopening). Keep all pilot data, just change status back to active/draft.
- **Manual bidirectional linking:** Always use SmeMartResourceService.linkResources() for both directions at once. The method signature handles bidirectionality.
- **Hard-coding type strings:** Use constants or enums for 'rfp', 'pilot', 'project' — avoids typos in templates and filters.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project type UI chips | Custom icon/badge component | Material mat-chip + mat-icon + CSS classes | Built-in theming, accessibility, consistent with ngx-library |
| Filter UI in lists | Custom dropdown/select | Material mat-button-toggle-group | Exists in project, matches view toggle pattern |
| Completion confirmation | Custom alert/confirm dialog | Material mat-dialog with form fields | Form validation, standard UX, reusable |
| Entity linking | Manual SQL/GQL inserts | SmeMartResourceService.linkResources() | Handles bidirectionality, audit trail, filters soft-deletes |
| Vetting suggestions | Direct EngagementVettingItem creation | VettingService pattern + signal-based suggestion queue | Integrates with existing vetting workflow, allows future task gating |
| Status transitions | Client-side enum checks | VETTING_STATUS_TRANSITIONS map (pattern exists) | Centralized rules, prevents invalid states |

**Key insight:** All infrastructure for pilot management already exists — project types, field mappings, vetting patterns, linking. Only UI and state orchestration remain.

## Common Pitfalls

### Pitfall 1: Forgetting to Filter by projectType in List Queries
**What goes wrong:** Filter button exists but doesn't change displayed projects.
**Why it happens:** listProjects() method signature already supports filters parameter, but caller forgets to pass it or passes wrong syntax.
**How to avoid:** Always pass `{ filters: { projectType: `.eq.${value}` } }` in GqlQueryOptions. Test each filter value (empty/'all', 'rfp', 'pilot', 'project').
**Warning signs:** Button toggles but cards/table rows don't update.

### Pitfall 2: Not Unlinking When Promoting
**What goes wrong:** Pilot gets promoted but old relationships break, buyer can't find pilot history from project detail.
**Why it happens:** SmeMartResourceService.linkResources() creates new link but old relationship wasn't considered.
**How to avoid:** Always call linkResources() for both directions after createProject(). For pilot case, create two links: pilot→newProject ("promoted_to") AND newProject←pilot ("promoted_from").
**Warning signs:** Project detail shows orphaned pilot, no way to navigate back to original.

### Pitfall 3: Mixing status + type for UI logic
**What goes wrong:** Template checks `if (status === 'completed' && type === 'pilot')` in multiple places, code becomes brittle.
**Why it happens:** Both properties are needed, but scattered checks create maintenance burden.
**How to avoid:** Create computed property: `isCompletedPilot = computed(() => project.status === 'completed' && project.projectType === 'pilot')`. Use in templates.
**Warning signs:** Same conditional duplicated in 3+ places.

### Pitfall 4: Dialog doesn't update parent component state
**What goes wrong:** User completes pilot in dialog, dialog closes, but project-detail still shows "Mark Complete" button.
**Why it happens:** Dialog returns data but component doesn't await or doesn't re-fetch from service.
**How to avoid:** After dialogRef.afterClosed() resolves with data, immediately call `this.ctx.setProject(updated)` with fresh data from service. Use signals for reactivity.
**Warning signs:** Need to manually refresh page for UI to update.

### Pitfall 5: Completion notes stored nowhere
**What goes wrong:** Dialog captures notes but they're never stored or displayed.
**Why it happens:** Notes field isn't mapped in field-mappings, not in SmeMartProject model, nowhere to persist.
**How to avoid:** Verify schema has notes field on SmeMartProject (or create it). Add to model interface. Add to field-mappings. Then pass to updateProject().
**Warning signs:** Dialog accepts notes but vetting suggestion has no notes to display.

## Code Examples

Verified patterns from codebase:

### Accessing Project Type in Templates
```typescript
// Source: project-card.component.ts (existing)
// Extend to check projectType
@if (proj.projectType === 'pilot') {
  <mat-icon class="pilot-icon">science</mat-icon>
}
```

### Creating and Linking Resources
```typescript
// Source: SmeMartProjectService.linkToEngagement() (line 247)
await this.resourceService.linkResources(
  projectId,
  'sme-mart:work-request',
  engagementId,
  'sme-mart:work-request',
  'relates_to',
  { source: 'bid-acceptance', linkedAt: new Date().toISOString() },
);

// Same pattern for pilot→project promotion
await this.resourceService.linkResources(
  pilotId,
  'sme-mart:project',
  newProjectId,
  'sme-mart:project',
  'promoted_to',
  { promotedAt: new Date().toISOString() }
);
```

### Field Mappings Already Include projectType
```typescript
// Source: field-mappings.ts (SME_MART_PROJECT_FIELD_MAPPING)
neonToGql: {
  projectType: 'projectType', // 'rfp' | 'pilot' | 'project' (Plan 077)
},
gqlToNeon: {
  projectType: 'projectType',
}
```

### Updating Project Status
```typescript
// Source: SmeMartProjectService.updateProject() (line 153)
const updated: SmeMartProject = {
  ...existing,
  ...changes,
  updatedAt: new Date().toISOString(),
};
this.pushToGql(updated);
return updated;

// Usage for pilot completion
await this.projectService.updateProject(projectId, { status: 'completed' });
```

### Vetting Suggestion Panel Pattern
```typescript
// Source: vetting-suggestion-panel.component.ts (line 39)
// Panel already listens to vetting items and renders suggestions
// Extend to listen for pilotCompletionSuggestion signals
readonly pilotSuggestion = toSignal(this.vetting.pilotCompletionSuggestion$);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate pilotCompletedAt timestamp | Single status field = 'completed' | Phase 13 CONTEXT.md D-02 | Simpler model, less field management |
| RFP type hardcoded to 'rfp' | projectType discriminator field | Phase 075 (v1.0) | Unified project container, pilot support |
| Manual engagement linking in components | SmeMartResourceService.linkResources() | Phase v1.1 | Bidirectional links, reusable pattern |
| Direct vetting item creation | VettingService suggestions + signal bus | Phase 063 + Phase 13 | Decoupled vetting flow, future task-gating ready |
| No type filtering in lists | Mat-button-toggle-group filter | Phase 13 | Better UX, project discovery |

**Deprecated/outdated:**
- Separate RFP entity model (now SmeMartProject with projectType='rfp')
- Direct Neon writes (Pipeline + GQL now standard)
- Hardcoded status chips without type distinction

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Angular 21+ default) + TestBed |
| Config file | No vitest.config.ts (uses angular.json builder @angular/build:unit-test) |
| Quick run command | `npm test -- --run src/app/pages/project/project-card.component.spec.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLT-01 | SmeMartProject model includes projectType field | unit | `npm test -- src/app/core/models/sme-mart-project.model.spec.ts` | ❌ Wave 0 |
| PLT-02 | Pilot completion triggers vetting suggestion | integration | `npm test -- src/app/pages/project/project-detail.component.spec.ts` | ❌ Wave 0 |
| PLT-03 | Promote button creates new project + links | integration | `npm test -- src/app/core/services/sme-mart-project.service.spec.ts` | ❌ Wave 0 |
| PLT-04 | Pilot type displays as distinct chip/icon in list | component | `npm test -- src/app/pages/project/project-card.component.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Quick test for changed file (e.g., `npm test -- --run src/app/pages/project/project-detail.component.spec.ts`)
- **Per wave merge:** Full project-related tests (e.g., `npm test -- --run "src/app/**/*.spec.ts"`)
- **Phase gate:** Full suite green (`npm test`) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/pages/project/project-card.component.spec.ts` — projectType chip rendering (PLT-04)
- [ ] `src/app/pages/project/project-list.component.spec.ts` — filter toggle + query params (PLT-04)
- [ ] `src/app/pages/project/project-detail.component.spec.ts` — completion dialog, promote workflow (PLT-02, PLT-03)
- [ ] `src/app/pages/project/project-completion-dialog.component.spec.ts` — NEW component, form validation, notes capture
- [ ] `src/app/core/services/sme-mart-project.service.spec.ts` — completeProjectAsPilot(), promoteToProject() methods (PLT-02, PLT-03)
- [ ] `src/app/core/services/vetting.service.spec.ts` — createPilotCompletionSuggestion() integration (PLT-02)
- [ ] `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.spec.ts` — pilot suggestion display (PLT-02)

Framework install: Already present (tsconfig.spec.json references vitest/globals).

## Environment Availability

**Development Environment:**
- Angular CLI: `ng serve --proxy-config proxy-uat.conf.js` (targets UAT)
- Database: Neon PostgreSQL via HTTP + Generic SQL Hub Module
- GQL indexing: ~15 min after Pipeline write (optimistic updates via PipelineWriteCache mask this)
- Material icons: Pre-loaded from assets (science, description, folder_open icons all standard)

**No external dependencies for this phase** — all work is UI + service orchestration within existing infrastructure.

Missing dependencies with fallback:
- None — all required Material, Angular, and ZB packages already installed.

## Open Questions

1. **Schema field: `promotedProjectId` on SmeMartProject**
   - What we know: projectType field exists (verified in model, mappings, GQL types)
   - What's unclear: Does SmeMartProject schema have promotedProjectId field yet? Or is it added in this phase?
   - Recommendation: Verify in zerobias-org/schema PR #28 (v1.0.9). If not present, add simple string field. Field is optional/nullable (only set after promotion).

2. **Completion notes storage location**
   - What we know: Dialog captures notes, vetting suggestion needs them for summary
   - What's unclear: Which SmeMartProject field stores these? Are they in notes field, or wrapped in JSON object?
   - Recommendation: Check if SmeMartProject.notes exists. If not, add it. Or use a completionNotes field. Store in field-mappings.

3. **Vetting suggestion auto-attach to engagement or boundary**
   - What we know: VettingService creates items linked to engagement_id
   - What's unclear: D-13 deferred to Claude's discretion. Should pilot completion suggestion attach to parent engagement or parent boundary?
   - Recommendation: Parent engagement (same scope as vetting items). Pilot is project-scoped, engagement is vetting-scoped — match the vetting container.

4. **Pilot revert workflow detail**
   - What we know: D-04 says allow revert — buyer can reopen completed pilot
   - What's unclear: UI location for revert button? Same actions menu as promote, but disabled when status != 'completed'?
   - Recommendation: "Reopen Pilot" button in actions menu, visible only when status='completed' && projectType='pilot'. Confirmation dialog: "This pilot will return to active status."

## Sources

### Primary (HIGH confidence)
- **SmeMartProject Model** — `/src/app/core/models/sme-mart-project.model.ts` — `projectType` field verified, status field documented
- **SmeMartProjectService** — `/src/app/core/services/sme-mart-project.service.ts` — CRUD, linking, relationship queries all implemented
- **Project Card Component** — `/src/app/pages/project/project-card.component.ts` — Status chip pattern, icon rendering, CSS class binding
- **Project List Component** — `/src/app/pages/project/project-list.component.ts` — Table/card toggle pattern, filtering structure
- **Vetting Service** — `/src/app/core/services/vetting.service.ts` — Item CRUD, summary computation, suggestion pattern
- **Vetting Suggestion Panel** — `/src/app/pages/engagements/tabs/vetting-suggestion-panel.component.ts` — Profile pre-fill suggestion pattern, attachment flow
- **Field Mappings** — `/src/app/core/field-mappings.ts` — SME_MART_PROJECT_FIELD_MAPPING includes projectType bidirectional mapping
- **Angular 21 Material** — npm package `@angular/material@21.2.5` — Chip, Icon, Button, Menu, Dialog, Form Field components all available
- **ngx-library** — npm package `@zerobias-org/ngx-library@0.2.28` — ZbResourceStatusComponent, ZbSnakeToSpacesPipe available

### Secondary (MEDIUM confidence - existing pattern verification)
- **CONTEXT.md Phase 13** — Locked decisions D-01 through D-13, deferred areas, existing code insights
- **SmeMartResourceService** — Inferred from SmeMartProjectService usage (linkToEngagement pattern) — bidirectional linking works
- **PipelineWriteService + GraphqlReadService** — Inferred from SmeMartProjectService usage — fire-and-forget write + optimistic caching pattern proven

## Metadata

**Confidence breakdown:**
- Standard Stack: **HIGH** — All dependencies verified in package.json, versions current as of 2026-02-25
- Architecture Patterns: **HIGH** — All patterns exist in codebase (chips, filtering, dialogs, linking, vetting suggestions)
- Pitfalls: **HIGH** — Identified from existing SmeMartProjectService patterns + common Angular/RxJS issues
- Test Requirements: **MEDIUM** — Framework assumed (vitest + TestBed standard in Angular 21), Wave 0 gaps identified but test infrastructure not fully audited

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (30 days — stable phase, no platform changes expected)
**Depends on:** v1.1 complete (verified 2026-03-30 in STATE.md)
