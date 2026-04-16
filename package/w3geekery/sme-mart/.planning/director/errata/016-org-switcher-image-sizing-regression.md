---
id: "016"
severity: high
phase: 18
found: 2026-04-16
status: resolved
resolved: 2026-04-16
resolution: "Plan 18-05: ported zb-ui-resource-image CSS block (with s16/s20/s32 size modifiers and float utilities) from zb-ui-lib/components.scss:2085-2193 into SME Mart's src/styles.scss. Plan 18-04 markup left exactly as-is — root-cause fix instead of swapping to zb-avatar-label. When SME Mart merges into zb/ui, the ported block drops out seamlessly. Director UAT 2026-04-16 confirmed 5-6 equal-height rows with small avatars."
---

# Phase 18 Plan 18-04 regressed submenu visibility — unconstrained `<img>` from wrong-library reference

## Symptom

Post Plan 18-04 merge (commits 83f94d5–29c3e77, 2026-04-15), the org switcher submenu opens as a dark empty panel. No rows visible. Persists across impersonation start/stop, fresh boots, hard refreshes.

## Diagnosis (Chrome DevTools evaluate_script, 2026-04-16)

Submenu DOM contains all 6 rendered `<button>` rows — data flow is correct, `switchableOrgs()` returns 6 `_DanaOrg` objects. The first row (Auditmation Operations) has:

```
img natural dimensions: 14687 × 1558 px
button computed height: 1558 px
panel size: 280 × 400 with overflow: auto
```

The first row consumes 1558px of vertical space; the remaining 5 rows are scrolled far below the panel's 400px clip. Visually identical to "empty panel" because the top-left of a 14687×1558 image is mostly whitespace.

Verified via `mcp__chrome-devtools__evaluate_script`:

```json
{
  "buttonCount": 6,
  "buttons": [
    {"text":"Auditmation Operations","btn":{"w":272,"h":1558},
     "img":{"w":14687,"h":1558,"src":"https://auditmation.io/...Audit_TM-BlackBlue-3.png"}},
    {"text":"Roughnecks","btn":{"w":272,"h":48}},
    {"text":"System Org","btn":{"w":272,"h":248}}
  ]
}
```

## Root cause

Plan 18-04 template used:

```html
<img [src]="org.avatarUrl | staticImageUrl"
     class="zb-ui-resource-image s20"
     imgDefault [default]="'./assets/unknown-company.svg'" />
```

Copied from `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/organization-switcher.component.html:22`. The portal works because it depends on **`zb-ui-lib`**, which defines `img.zb-ui-resource-image.s20` in `~/Projects/zb/ui/projects/zb-ui-lib/src/lib/components/components.scss:2127-2134`:

```scss
img.zb-ui-resource-image {
  max-width: 24px; min-width: 24px;
  max-height: 24px; height: 24px;
  width: 24px; object-fit: contain;
  &.s20 { ...overrides to 20px... }
}
```

**SME Mart does not depend on `zb-ui-lib`.** It depends on `@zerobias-org/ngx-library`, which does NOT ship these classes. Result: classes resolve to no styles, images render at natural dimensions.

The Plan 18-04 brief that I authored cargo-culted the portal's markup without verifying SME Mart had the underlying CSS. The exit criteria said "visual confirmation via UAT screenshot — compare against zb/ui portal reference" but no one (including director) actually performed that comparison before closing the plan.

## Why this was invisible until now

Plan 18-04 unit tests assert `<img>` element exists with correct `[src]` binding. They do not assert rendered dimensions. `npm test` green, E2E green, ng build green. Nothing in the test suite exercises the actual layout.

Same class of failure as:
- Errata 013 (tests mocked SDK wrong, shipped broken feature)
- Errata 014 (tests didn't exercise real-data filter, shipped broken filter)
- Errata 015 (predev hook generated diff, swept into commit invisibly)

Theme: **tests verify code shape, not feature correctness.** Director's "visual confirmation" step is the only check that would have caught this, and we skipped it by trusting unit/E2E green.

## Fix

Plan 18-05 (revised today) — replace the `<img>` markup with `<zb-avatar-label>` that this same component already uses correctly for the trigger and menu-header rows. Drops three now-unused imports and one vendored asset. See `.planning/director/phase-18-05-brief.md`.

## Prevention patterns for WATCH-LIST

- [ ] **Markup copied from a reference app that depends on a different library** — BLOCK. Verify the reference's CSS infrastructure exists in this app before accepting the markup. Cheap check: `git grep <unique-class-name> node_modules/<dep>` — if no match in SME Mart's declared deps, CSS won't apply.
- [ ] **Plan exit criteria says "visual UAT confirmation" and it wasn't actually done** — BLOCK. Director review must show evidence (screenshot) before marking plan complete. If the gsd-executor self-certifies green without Director screenshot, reopen the plan.
- [ ] **`<img>` rendered without explicit width/height attributes AND without a known-good sizing class** — FLAG. Either constrain via scoped CSS, use a component that handles sizing (zb-avatar-label), or add explicit HTML attributes.
- [ ] **Plan 18-04-style "mirror zb/ui" references** — FLAG. zb/ui uses `zb-ui-lib` which SME Mart doesn't. Any markup pulled from zb/ui needs SME Mart equivalent validation. Consider adding to CLAUDE.md.

## Status

- Fix plan briefed: `.planning/director/phase-18-05-brief.md` (revised today, supersedes prior lazy-load hypothesis which was wrong)
- Phase 18 close gate unchanged: Director-reviewed UAT screenshot required showing all rows visible at equal heights
- No hotfix to Plan 18-04 needed — Plan 18-05 replaces the broken markup wholesale
