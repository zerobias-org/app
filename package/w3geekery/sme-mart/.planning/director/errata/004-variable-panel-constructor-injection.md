---
id: "004"
severity: low
phase: 15
found: 2026-04-10
status: fixed
fixed: 2026-04-10
---

# VariablePanelComponent uses constructor injection

`src/app/shared/components/variable-panel/variable-panel.component.ts` line 44:
```typescript
constructor(fb: FormBuilder)
```

Should be:
```typescript
private readonly fb = inject(FormBuilder);
```

**Root cause:** Executor used constructor injection despite WATCH-LIST item and Phase 14 precedent. Same pattern violation as all prior phases.

**Impact:** Minor inconsistency. Component works fine but doesn't follow project convention.

**Fix:** Replace constructor parameter with `inject(FormBuilder)` class field.
