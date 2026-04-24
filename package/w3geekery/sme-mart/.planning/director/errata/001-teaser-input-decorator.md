---
id: "001"
severity: medium
phase: 14
found: 2026-04-10
status: fixed
fixed: 2026-04-10
---

# InvitationTeaserComponent uses @Input() instead of input() signal

`src/app/shared/components/invitation-teaser/invitation-teaser.component.ts:31` uses:
```typescript
@Input() project!: SmeMartProject;
```

Should be:
```typescript
project = input.required<SmeMartProject>();
```

**Root cause:** Executor used the old Angular decorator pattern. This was on the WATCH-LIST ("Agent uses `@Input()` decorator instead of `input()` signal function") but the executor didn't catch it.

**Impact:** Inconsistent with all other Phase 14 components which correctly use signals. Will require refactoring if the template references `project` as a signal elsewhere.

**Fix:** Replace `@Input()` with `input.required<SmeMartProject>()`. Update template references from `project` to `project()` (signal call). Update `teaser-reason-dialog.component.ts` if it reads the input.
