---
id: "002"
severity: medium
phase: 14
found: 2026-04-10
status: fixed
fixed: 2026-04-10
---

# 26 !important declarations in Phase 14 SCSS files

Three files contain `!important` for Material chip color overrides inside `::ng-deep`:

- `src/app/pages/my-invitations/my-invitations.component.scss` — 12 occurrences
- `src/app/pages/project/tabs/project-invited-vendors-tab.component.scss` — 12 occurrences
- `src/app/shared/components/invitation-teaser/invitation-teaser.component.scss` — 2 occurrences

**Root cause:** Executor overrode Material chip colors with `!important` instead of using CSS custom properties. Common shortcut for `::ng-deep` + Material M3 chip styling.

**Impact:** Violates project coding standards (CLAUDE.md: "NEVER use `!important` by default"). Makes future theme changes harder. Sets a bad precedent for other phases.

**Fix:** Replace `!important` overrides with Material M3 chip theming custom properties:
```scss
// Instead of:
::ng-deep .status-pending .mdc-evolution-chip__text-label {
  color: #0f0f10 !important;
}

// Use:
::ng-deep .status-pending {
  --mdc-chip-label-text-color: #0f0f10;
  --mdc-chip-elevated-container-color: #d7e0ee;
}
```

Both `my-invitations` and `project-invited-vendors-tab` have identical status color blocks — should also be extracted to a shared mixin or utility class to avoid duplication.
