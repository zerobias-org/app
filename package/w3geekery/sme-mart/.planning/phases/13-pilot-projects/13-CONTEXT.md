# Phase 13: Pilot Projects - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable buyers to create pilot projects (POC/test engagements), mark them complete, promote to real projects, and visually distinguish them in the UI. Pilot completion triggers a vetting suggestion for the parent engagement.

</domain>

<decisions>
## Implementation Decisions

### Completion Trigger
- **D-01:** Manual button for MVP. Buyer clicks "Mark Pilot Complete" on project detail. Records status = completed.
- **D-02:** Status = completed (reuse existing status field). No separate pilotCompletedAt timestamp.
- **D-03:** Completion shows a summary confirmation dialog with pilot name, dates, and optional completion notes field.
- **D-04:** Allow revert — buyer can reopen a completed pilot back to active status.
- **D-05:** Task-based completion deferred — note in code that this will likely become task-gated when platform task system is wired in.

### Promotion Workflow
- **D-06:** Pilot stays as-is after promotion (status = completed). New SmeMartProject created with projectType = 'project'. Pilot gets a link to the promoted project (e.g., `promotedProjectId` field).
- **D-07:** "Promote to Project" button lives in actions menu (mat-menu) on project detail. Visible only when projectType = pilot AND status = completed.
- **D-08:** Data carry-over: Claude's discretion — pick reasonable fields (name, description, engagement link, category, budget, timeline). Status resets to draft.

### Visual Distinction
- **D-09:** Type chip + distinct icon. Add a second chip showing "Pilot" (or "RFP" / "Project") with distinct color alongside existing status chip. Change mat-icon for pilot projects (e.g., science/flask instead of folder_special).
- **D-10:** Add projectType filter to project list header: All / RFP / Pilot / Project.

### Vetting Item Creation
- **D-11:** Suggestion only — pilot completion triggers a suggestion in the vetting suggestion panel (same pattern as vendor profile pre-fill). Not auto-created.
- **D-12:** Suggestion includes pilot summary: name, completion date, completion notes. Buyer clicks through for full details.
- **D-13:** Vetting scope: Claude's discretion — attach to whichever scope makes sense given how the vetting system currently works (likely parent engagement).

### Claude's Discretion
- Data carry-over fields during pilot→project promotion (D-08)
- Vetting item attachment scope (D-13)
- Specific chip colors for project types
- Icon choices for pilot vs RFP vs project

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Models & Services
- `src/app/core/models/sme-mart-project.model.ts` — SmeMartProject interface, already has `projectType` field
- `src/app/core/services/sme-mart-project.service.ts` — Service with Pipeline write + GQL read, `projectType` in scalarFields
- `src/app/core/field-mappings.ts` — Bidirectional field mapping, `projectType` already mapped
- `src/app/core/gql-types.ts` — GQL response type, `projectType` already included

### UI Components
- `src/app/pages/project/project-card.component.ts` — Project card with status chip pattern (add type chip + icon here)
- `src/app/pages/project/project-list.component.ts` — Project list with table/card toggle (add projectType filter here)
- `src/app/pages/project/project-detail.component.ts` — Project detail (add completion button, promote action)

### Vetting System
- `src/app/pages/engagements/tabs/vetting-tab.component.ts` — Existing vetting tab
- `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.ts` — Suggestion panel pattern to follow for pilot completion suggestions

### Director Flags
- `.planning/director/v1.2-discuss-flags.md` — PLT-02 completion trigger question (resolved: manual button for MVP)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SmeMartProject model:** `projectType` field already exists (`string | null`), mapped in field-mappings and GQL types. No schema change needed — field is already in the YAML schema.
- **Status chip pattern:** `project-card.component.ts` already renders `mat-chip` with status-based CSS class. Same pattern for type chip.
- **ZbResourceStatusComponent:** Used in 6 places for status badges. Could use for projectType badge.
- **Vetting suggestion panel:** Existing component pattern for profile-based suggestions — extend for pilot suggestions.
- **Actions menu pattern:** Check if project detail already has a mat-menu. If not, add one.

### Established Patterns
- **Pipeline write + GQL read:** All project CRUD goes through PipelineWriteService/GraphqlReadService.
- **Optimistic updates:** PipelineWriteCache (60s TTL) masks Pipeline async delay.
- **Signal-based state:** Services use RxJS BehaviorSubjects. Components use signals where possible.

### Integration Points
- **Project creation flow:** RFP wizard creates SmeMartProject — extend wizard or add separate "New Pilot" button.
- **Project detail header:** Where completion button and actions menu live.
- **Project list filters:** Header area for the projectType filter toggle.
- **Vetting suggestion panel:** Integration point for pilot completion suggestions.

</code_context>

<specifics>
## Specific Ideas

- Task-based completion is the future direction — code the manual button in a way that's easy to extend with a task-based gate later.
- Completion notes should be stored (completion dialog has an optional notes field) — useful for vetting suggestion summary.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-pilot-projects*
*Context gathered: 2026-04-02*
