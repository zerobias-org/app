# Phase 13: Pilot Projects - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 13-pilot-projects
**Areas discussed:** Completion trigger, Promotion workflow, Visual distinction, Vetting item creation

---

## Completion Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Manual button | Buyer clicks 'Mark Pilot Complete' on project detail. Simplest. Records completion date. | ✓ (MVP) |
| Status field change | Buyer changes project status to 'completed' via existing status dropdown. | |
| Task-based | All pilot tasks must be resolved before completion. | (future) |

**User's choice:** Manual button for MVP, but noted task-based will likely come later. Write with extensibility in mind.

| Option | Description | Selected |
|--------|-------------|----------|
| Status = completed | Reuse existing status field. Simple. Consistent. | ✓ |
| Separate timestamp | Add pilotCompletedAt field. | |
| Both | Belt and suspenders. | |

**User's choice:** Status = completed. No separate timestamp.

| Option | Description | Selected |
|--------|-------------|----------|
| No undo | Once completed, it's done. | |
| Allow revert | Buyer can reopen a completed pilot back to active status. | ✓ |

**User's choice:** Allow revert.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with summary | Dialog shows pilot name, dates, asks for optional completion notes. | ✓ |
| Simple confirm | Just 'Are you sure?' | |
| No dialog | Direct action. | |

**User's choice:** Summary dialog with optional completion notes.

---

## Promotion Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Stays as-is | Pilot stays completed. New project created separately. Link between them. | ✓ |
| Auto-archive | Pilot status changes to 'archived' after promotion. | |
| In-place upgrade | Change pilot's projectType to 'project'. No new entity. | |

**User's choice:** Pilot stays as-is (completed), new project created with link.

| Option | Description | Selected |
|--------|-------------|----------|
| Name + description only | Minimal carry-over. | |
| Most fields | Name, description, engagement link, category, budget, timeline. | |
| You decide | Claude picks reasonable defaults. | ✓ |

**User's choice:** Claude's discretion on carry-over fields.

| Option | Description | Selected |
|--------|-------------|----------|
| Project detail header | Prominent button, visible when pilot + completed. | |
| Actions menu | Inside mat-menu dropdown on project detail. | ✓ |
| Both + completion dialog | In completion dialog AND on project detail. | |

**User's choice:** Actions menu (less prominent, cleaner).

---

## Visual Distinction

| Option | Description | Selected |
|--------|-------------|----------|
| Type chip + icon | Second chip showing 'Pilot' with distinct color + different mat-icon. | ✓ |
| Type chip only | 'Pilot' chip next to status chip. No icon change. | |
| Icon + subtle badge | Change card icon + small 'PILOT' text badge. | |

**User's choice:** Type chip + distinct icon.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, type filter | Add projectType filter (All / RFP / Pilot / Project). | ✓ |
| Not for MVP | No filter yet. | |

**User's choice:** Yes, add type filter to project list.

---

## Vetting Item Creation

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-created item | System auto-creates vetting checklist item. | |
| Suggestion only | Triggers suggestion in vetting panel (like vendor profile pre-fill). | ✓ |
| Both paths | Auto-create AND show in suggestions. | |

**User's choice:** Suggestion only (same pattern as vendor profile pre-fill).

| Option | Description | Selected |
|--------|-------------|----------|
| Parent engagement | Vetting item on engagement that owns the pilot. | |
| Promoted project | On new project from promotion. | |
| You decide | Claude picks the right scope. | ✓ |

**User's choice:** Claude's discretion on scope.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, summary | Name, completion date, completion notes in suggestion. | ✓ |
| Just a link | Pointer to pilot project. | |
| You decide | Claude picks detail level. | |

**User's choice:** Summary with pilot name, completion date, notes.

---

## Claude's Discretion

- Data carry-over fields for pilot→project promotion
- Vetting item attachment scope (engagement vs promoted project)
- Chip colors for project types
- Icon choices (pilot vs RFP vs project)

## Deferred Ideas

None — discussion stayed within phase scope.
