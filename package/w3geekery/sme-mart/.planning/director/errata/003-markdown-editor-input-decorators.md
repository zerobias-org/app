---
id: "003"
severity: medium
phase: 15
found: 2026-04-10
status: fixed
fixed: 2026-04-10
---

# MarkdownEditorComponent uses @Input/@Output decorators

`src/app/shared/components/markdown-editor/markdown-editor.component.ts` lines 44-49:
```typescript
@Input() content: string = '';
@Input() height: string = '200px';
@Input() placeholder: string = '';
@Input() variableNames: string[] = [];
@Output() contentChange = new EventEmitter<string>();
```

Should use `input()`/`output()` signal functions:
```typescript
readonly content = input('');
readonly height = input('200px');
readonly placeholder = input('');
readonly variableNames = input<string[]>([]);
readonly contentChange = output<string>();
```

**Root cause:** Pre-existing decorators on a shared component that Phase 15 extended. Executor added new functionality but didn't migrate existing patterns. Same class of issue as Phase 14 errata 001.

**Impact:** Inconsistent with Angular 21 signal-based approach. Template refs need updating from `content` to `content()` throughout all consumers.

**Fix:** Migrate all @Input/@Output to input()/output(). Update template references in markdown-editor.component.html AND all consumer templates that bind to these inputs.
