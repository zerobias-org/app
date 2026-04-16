# Plan 18-05 — Port `zb-ui-resource-image` CSS Pattern to SME Mart Global Styles

**Phase:** 18 — Org Switcher
**Type:** gap_closure (errata 016)
**Est:** 20–30 min, 2 tasks
**Origin:** Plan 18-04 shipped markup referencing `zb-ui-resource-image.s20` CSS that doesn't exist in SME Mart. Diagnosed 2026-04-16 via Chrome DevTools: Auditmation Operations logo renders at 14687×1558 natural dimensions because class resolves to no styles.

> **Supersedes earlier "lazy-load + retry" and "replace with zb-avatar-label" hypotheses.** Data flow verified correct (switchableOrgs returns 6 orgs, DOM has 6 buttons). Bug is pure CSS — classes referenced by Plan 18-04 aren't defined anywhere in SME Mart's style graph. Fixing the root cause (missing CSS) is better than routing around it.

## Root cause (abridged; full version in errata 016)

`~/Projects/zb/ui/projects/zb-ui-lib/src/lib/components/components.scss:2085-2193` defines the `zb-ui-resource-image` + size modifier pattern (`s16`, `s20`, `s32`), used 13+ places across zb/ui. The portal's org-switcher markup depends on it. Plan 18-04 copied the portal's markup into SME Mart without porting the CSS. Classes resolve to nothing, `<img>` renders at natural size, 14687×1558 logo blows out the panel layout.

## Why port the CSS (not swap to zb-avatar-label)

- **Addresses the actual root cause.** Plan 18-04's markup is correct; the only thing missing is the CSS that backs it. Adding the classes restores the original intent.
- **Reusable pattern.** `zb-ui-resource-image` + `s*` size modifiers are used for any resource image (orgs, products, connections, evidence, collector bots, etc.). SME Mart will need this anywhere a resource logo is rendered in a list. One-time CSS port unblocks future uses without bespoke SCSS.
- **Matches zb/ui ecosystem.** Keeps consistency with the broader ZB portal patterns Clark + future devs already know.
- **Smaller diff.** Plan 18-04's component markup stays exactly as-is. No spec changes, no import changes, no asset removal.

## Fix

### Task 1 — Port `zb-ui-resource-image` + size modifiers + helper classes to SME Mart

Append to `src/styles.scss` (appropriate section: global image utilities):

```scss
// =============================================================================
// Resource image sizing classes — ported from zb-ui-lib components.scss:2085-2193
// Used wherever <img> renders a resource logo/avatar at a constrained size.
// See .planning/director/errata/016-org-switcher-image-sizing-regression.md
// =============================================================================

img.zb-ui-product-logo {
  max-height: 24px;
  max-width: 24px;
  width: auto;
  height: auto;
  vertical-align: middle;
}

img.zb-ui-resource-image {
  max-width: 24px;
  min-width: 24px;
  max-height: 24px;
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;

  &.s16 {
    max-width: 16px; min-width: 16px;
    max-height: 16px; height: 16px; width: 16px;
    object-fit: contain; vertical-align: middle;
    &.maintain-aspect { min-width: unset; width: auto; max-width: 100%; }
  }

  &.s20 {
    max-width: 20px; min-width: 20px;
    max-height: 20px; height: 20px; width: 20px;
    object-fit: contain; vertical-align: middle;
    &.maintain-aspect { min-width: unset; width: auto; max-width: 100%; }
  }

  &.s32 {
    max-width: 32px; min-width: 32px;
    max-height: 32px; height: 32px; width: 32px;
    object-fit: contain; vertical-align: middle;
    &.maintain-aspect { min-width: unset; width: auto; max-width: 100%; }
  }

  &.float.left {
    float: left;
    &.margin, &.margin4 { margin-right: 4px; }
    &.margin8 { margin-right: 8px; }
    &.margin16 { margin-right: 16px; }
  }
}
```

**Drop the dark-theme `filter: invert` blocks** — they're commented out in the source anyway; when/if dark theme lands in SME Mart, add back deliberately.

**Drop the `.using-default` and plain `img.resource-image` rules** for now — only add if SME Mart uses them elsewhere. Keep scope minimal: just the classes Plan 18-04 referenced.

### Task 2 — Delete the local Plan 18-04 SCSS workaround

In `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.scss`, remove the `.org-row` styles if they were added to work around the missing CSS. Audit and confirm — if `.org-row` was just semantic (not compensating for unsized img), leave it.

Keep `.org-switcher-submenu` / `.org-list` (panel sizing, unrelated).

### Task 3 — Verify

1. `npm test -- --include='**/user-profile-dropdown.component.spec.ts' --watch=false` — should still pass, no behavior change
2. Chrome DevTools verify: after load, `document.querySelectorAll('.org-list img.zb-ui-resource-image.s20').forEach(i => console.log(i.getBoundingClientRect()))` — all should report 20×20
3. `npm run lint` clean
4. UAT screenshot showing 5–6 rows at equal heights with small avatars

## Requirements addressed

- **OS-01**: Submenu renders populated org list visibly
- **OS-03**: Current org visually distinguished (font-weight-bold on name already works once row heights are sane)

## Exit criteria

- [ ] `src/styles.scss` has the ported resource-image CSS block
- [ ] Submenu rows all render at ~48px height (not 1558px)
- [ ] All 6 org rows visible without scrolling in a 400px panel
- [ ] `npm test` + `npm run lint` + `npx tsc --noEmit` clean
- [ ] Clark UAT screenshot: populated, equal-height list, small avatars, current org bold, single chevron
- [ ] **Director reviews the screenshot** before phase close — not self-certified by executor

## Out of scope

- Swapping `<img>` for `<zb-avatar-label>` (considered and rejected — root cause fix is cleaner)
- Dark-theme `filter: invert` rules (port later when dark theme lands)
- Global adoption of `zb-ui-resource-image` in other SME Mart views (out of scope; those can use the now-available classes when they touch their views)
- Contributing the class pattern upstream to `@zerobias-org/ngx-library` — worth considering separately; ngx-library currently doesn't have an equivalent

## References

- Errata 016 (filed same session) — full diagnosis
- Source CSS: `~/Projects/zb/ui/projects/zb-ui-lib/src/lib/components/components.scss:2085-2193`
- Plan 18-04 markup that needs this CSS:
  `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html` (`@for` inside `<mat-menu #orgSwitcherSubmenu>`)
- SME Mart global styles: `src/styles.scss` (210 lines pre-port)
