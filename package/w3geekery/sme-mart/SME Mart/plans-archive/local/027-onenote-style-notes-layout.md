# 027 — OneNote-Style Togglable Column Layout

**Status:** Complete
**Updated:** 2026-03-02

## Overview

Add **toggle visibility** for the Notebooks and Folders columns inside the existing `mat-sidenav` drawer. The 3-column layout (notebooks → folders → notes list) already lives in the drawer via flexbox. This plan adds two toggle buttons in the top bar so users can hide/show columns independently, letting the notes list expand to fill the space.

No new components. No layout engine change. Pure signal + `@if` + existing flex behavior.

## Current Layout

```
┌──────────────────────────────────────────────────┬──────────────────────┐
│ mat-sidenav (resizable drawer, .nav-columns flex)│ mat-sidenav-content  │
│ ┌────────────┬──────────┬───────────────────────┐│                      │
│ │ Notebooks  │ Folders  │ Notes List            ││  note-editor-panel   │
│ │ (always)   │ (always) │ (always)              ││  (view/edit toggle)  │
│ └────────────┴──────────┴───────────────────────┘│                      │
└──────────────────────────────────────────────────┴──────────────────────┘
  hamburger toggles entire drawer open/close
```

## Target Layout

```
┌──────────────────────────────────────────────────┬──────────────────────┐
│ mat-sidenav (resizable drawer, .nav-columns flex)│ mat-sidenav-content  │
│ ┌────────────┬──────────┬───────────────────────┐│                      │
│ │ Notebooks  │ Folders  │ Notes List            ││  note-editor-panel   │
│ │ (toggle)   │ (toggle) │ (always visible)      ││  (view/edit toggle)  │
│ └────────────┴──────────┴───────────────────────┘│                      │
└──────────────────────────────────────────────────┴──────────────────────┘

Top bar: [☰ drawer] [📓 notebooks on/off] [📁 folders on/off] [search...]
```

### Toggle States

| Notebooks | Folders | Drawer contents |
|-----------|---------|-----------------|
| ON | ON | All 3 columns (default) |
| OFF | ON | Folders + Notes list |
| ON | OFF | Notebooks + Notes list |
| OFF | OFF | Notes list only |

Notes list column always has `flex: 1` — it naturally fills remaining space when siblings are hidden.

## Implementation

### Changes to `notes-panel.component.ts`

Add two signals:
```typescript
readonly showNotebooks = signal(true);
readonly showFolders = signal(true);
```

### Changes to `notes-panel.component.html`

**Top bar** — replace single hamburger with 3 buttons:
```html
<button mat-icon-button (click)="toggleDrawer()" ...>
  <mat-icon>{{ drawerOpen() ? 'menu_open' : 'menu' }}</mat-icon>
</button>
<button mat-icon-button (click)="showNotebooks.update(v => !v)"
        [class.toggle-active]="showNotebooks()"
        matTooltip="Toggle notebooks">
  <mat-icon>auto_stories</mat-icon>
</button>
<button mat-icon-button (click)="showFolders.update(v => !v)"
        [class.toggle-active]="showFolders()"
        matTooltip="Toggle folders">
  <mat-icon>folder</mat-icon>
</button>
```

**Drawer columns** — wrap with `@if`:
```html
<div class="nav-columns">
  @if (showNotebooks()) {
    <app-notes-notebooks-column .../>
  }
  @if (showFolders()) {
    <aside class="folder-col">
      <app-note-folder-tree .../>
    </aside>
  }
  <div class="notes-list-col">...</div>  <!-- always visible -->
</div>
```

### Changes to `notes-panel.component.scss`

Add toggle button active state:
```scss
.toggle-active {
  color: var(--mat-sys-primary);
}
```

No other SCSS changes needed — `.nav-columns` is already `display: flex` and `.notes-list-col` already has `flex: 1`.

## Files Changed

| File | Change |
|------|--------|
| `notes-panel.component.ts` | Add `showNotebooks`, `showFolders` signals |
| `notes-panel.component.html` | Add toggle buttons in top bar, wrap columns with `@if` |
| `notes-panel.component.scss` | Add `.toggle-active` style |

## No Changes Required

- `notes-notebooks-column/` — unchanged
- `note-folder-tree/` — unchanged
- `note-editor-panel/` — unchanged
- All services — unchanged
- All dialogs — unchanged
- Database schema — unchanged

## Dropped from Original Plan

| Originally planned | Why dropped |
|-------------------|-------------|
| `notes-list-column` component extraction | Notes list is ~30 lines of template in `notes-panel` — extraction adds complexity with no benefit |
| `note-content-viewer` component | `note-editor-panel` already has view/edit toggle — serves same purpose |
| CSS Grid rewrite | Existing flexbox handles column show/hide naturally |
| Keyboard arrow navigation | Deferred to future polish pass |

## Risks

| Risk | Mitigation |
|------|-----------|
| Columns re-mount on toggle (losing scroll position) | Angular `@if` destroys/recreates; acceptable for notebooks/folders since they're short lists. If problematic, switch to `[hidden]` or `display: none` class toggle |
| Folder tree loses selection on hide/show | Selection state lives in parent `notes-panel` signals, not in child — survives re-mount |

## Status

- [x] Plan reconciled with current drawer implementation
- [ ] Add toggle signals + top bar buttons
- [ ] Wrap columns with `@if` conditional rendering
- [ ] Style toggle active state
