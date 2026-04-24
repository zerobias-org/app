# Plan 18-04 — Org Switcher Avatar Enhancement

**Phase:** 18 — Org Switcher
**Type:** enhancement (not gap_closure — Phase 18 functionally complete after 18-03)
**Est:** 30–45 min
**Origin:** Visual polish matching zb/ui portal pattern. Screenshot comparison 2026-04-15 17:29.

## Goal

Replace the empty-slot circle-dot marker on each submenu row with an actual org avatar image (with fallback), matching the zb/ui portal's `organization-switcher.component.html` pattern.

## Architecture

Pattern from `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/organization-switcher.component.html:22`:

```html
<img
  [src]="org.avatarUrl | staticImageUrl"
  class="zb-ui-resource-image s20"
  imgDefault
  [default]="'./assets/unknown-company.svg'"
/>
```

**Key pieces:**
- `staticImageUrl` pipe — ngx-library `ZbStaticImageUrlPipe`, resolves relative/static URLs
- `imgDefault` directive — ngx-library `ZbImgDefaultDirective`, swaps to fallback on image load error
- `[default]` input — absolute/relative path to fallback SVG
- `s20` class — ngx-library "20px square" resource-image styling
- `zb-ui-resource-image` class — image framing/border-radius

zb/ui does NOT use `zb-avatar-label` for org rows — plain `<img>` + fallback directive. Keep it simple.

## Tasks

### Task 1 — Vendor the `unknown-company.svg` fallback asset

- Check if SME Mart already has a suitable fallback at `src/assets/` (look for company/org placeholder SVG)
- If not: copy `~/Projects/zb/ui/projects/portal/src/assets/unknown-company.svg` to `src/assets/unknown-company.svg`
- Commit the asset separately from template changes

### Task 2 — Swap submenu row content

In `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html`, replace the current circle-dot marker + name span in the `@for` block with:

```html
@for (org of switchableOrgs(); track org.id) {
  <button
    mat-menu-item
    [class.current-org]="`${org.id}` === currentOrgId()"
    (click)="onSelectOrg(org)"
    [attr.data-testid]="'org-item-' + org.id"
  >
    <div flexRow alignCenter gap8>
      <img
        [src]="org.avatarUrl | staticImageUrl"
        class="zb-ui-resource-image s20"
        imgDefault
        [default]="'./assets/unknown-company.svg'"
      />
      <span class="ellipsis" [class.font-weight-bold]="`${org.id}` === currentOrgId()">
        {{ org.name }}
      </span>
    </div>
  </button>
}
```

Drop the `<mat-icon class="current-marker">circle</mat-icon>` / `<mat-icon class="spacer">` branches — current-org distinction handled by `font-weight-bold` on the name. If keeping a trailing visual is preferred, add a check icon inside the flex row at the end (zb/ui doesn't — the bold name is enough).

### Task 3 — Component imports

Ensure `user-profile-dropdown.component.ts` imports:

```typescript
import { ZbStaticImageUrlPipe, ZbImgDefaultDirective } from '@zerobias-org/ngx-library';
```

And add them to the standalone `imports: []` array. Check for `flexRow`, `alignCenter`, `gap8` utility directives — they may come from ngx-library or a separate layout lib. If SME Mart doesn't have those utility directives, substitute with inline styles or SCSS flex rules.

### Task 4 — SCSS adjustment

In `user-profile-dropdown.component.scss`:
- Remove `.current-marker` and `.spacer` rules (no longer used)
- Verify `.ellipsis` exists or add:
  ```scss
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  ```
- If `flexRow`/`gap8` directives aren't available, add a local style:
  ```scss
  button[mat-menu-item] > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  ```

### Task 5 — Component test update

Existing component tests reference `.current-marker` / circle icon rendering. Update:
- Remove assertions about `.current-marker` and `.spacer` icons
- Add assertion: each row contains an `<img>` with `src` resolved from `staticImageUrl` pipe
- Add assertion: fallback fires when `avatarUrl` is absent (can mock the directive or assert the `[default]` binding)

## Exit Criteria

- [ ] `unknown-company.svg` exists in `src/assets/` (or ngx-library equivalent referenced)
- [ ] Submenu rows render an `<img>` with org avatar when `avatarUrl` present, fallback SVG when absent
- [ ] Current org name renders bold; leading circle-dot removed
- [ ] Component test suite passes: `npm test -- --include='**/user-profile-dropdown.component.spec.ts' --watch=false`
- [ ] Visual confirmation via UAT screenshot — compare against zb/ui portal reference

## Out of scope

- Header chevron pattern (Pattern A from errata 013) — we already shipped Pattern B
- `ZbAvatarLabelComponent` with initials fallback — zb/ui uses plain `<img>` + imgDefault, simpler and matches
- Avatar in the current-user header (Clark Stacer / ZeroBias at top) — already uses its own component; don't touch

## References

- zb/ui template: `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/organization-switcher.component.html`
- ngx-library exports: `~/Projects/zb/zerobias-org/ngx-library/projects/ngx-library/src/public-api.ts` (confirms `ZbStaticImageUrlPipe` + `ZbImgDefaultDirective` exist)
- Fallback asset source: `~/Projects/zb/ui/projects/portal/src/assets/unknown-company.svg`
