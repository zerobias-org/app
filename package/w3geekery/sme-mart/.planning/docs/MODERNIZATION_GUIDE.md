# Angular Modernization Guide

When creating **new** components, services, or directives, prefer modern Angular patterns over legacy ones. When modifying existing code, modernize the patterns you touch. This guide covers what to use going forward.

> **Reference:** [angular.dev/ai/develop-with-ai](https://angular.dev/ai/develop-with-ai)

## Touch It = Fix It (Modernization Rule)

**This is the load-bearing rule for Angular 21 modernization in SME Mart.**

When you modify a file under `src/app/`, fix every modernization-rule violation in that file as part of the same change. The rules are listed below; the ESLint config at [`eslint.config.js`](../../eslint.config.js) is the authoritative source.

### What this means in practice

- **Editing `provider-card.component.ts` to add a new field?** Migrate any remaining `@Input()` / `@Output()` to `input()` / `output()` while you're in the file. Migrate constructor DI to `inject()`. Remove `CommonModule` if present. Replace `*ngIf` / `*ngFor` with `@if` / `@for`. The pre-commit hook will refuse the commit if you don't.
- **Tiny one-line fix in a violating file?** You still own the whole file. The CI gate is diff-based; the hook lints staged files in full; both will catch every violation in the file you touched, not just the line you changed.
- **Untouched files are not your problem (right now).** Pre-existing violations in files you didn't modify do not block your PR. They live in [`INITIAL-AUDIT.md`](../phases/27.5-modernization-enforcement/INITIAL-AUDIT.md) and migrate organically as the codebase is touched. Long-term tracker: `MODERN-CLEANUP-1` in [`.planning/BACKLOG.md`](../BACKLOG.md).

### Why this model and not "annotate everything"

A blanket sweep of `eslint-disable-next-line` comments across the ~1561 pre-existing ESLint messages was rejected on 2026-05-01:

- The diff-based CI gate ([`.github/workflows/lint.yml`](../../../../../.github/workflows/lint.yml)) only checks files in the diff; untouched violators cannot fail a PR regardless of whether they have disable comments.
- Annotating everything would be ~15-20 hrs of mechanical churn and impose a permanent maintenance tax (every cleanup PR has to remove the comment AND fix the code, doubling the change surface).
- "Touch it = fix it" pushes cleanup to the natural moment a file is being edited anyway, when the developer already has the file's context loaded.

### Closure of MODERN-CLEANUP-1

The cleanup is "complete" when a re-run of `npx eslint . --format json` against the full repo reports zero rule violations. There is no scheduled re-audit cadence; re-run on demand whenever a milestone wants visibility into remaining work.

### Emergency bypass

`git commit --no-verify` is human-only and requires explicit authorization. Agents must never use it. If used, file an errata immediately under `.planning/director/errata/`.

---

## Dependency Injection: `inject()` over constructor injection

```typescript
// Legacy
constructor(
  private route: ActivatedRoute,
  private taskService: TasksService
) {}

// Modern — prefer for new code
private route = inject(ActivatedRoute);
private taskService = inject(TasksService);
```

**Why:** Cleaner syntax, works in functions and guards without a class, better tree-shaking. Services should still use `providedIn: 'root'` for singletons.

## Inputs & Outputs: signal functions over decorators

```typescript
// Legacy — @Input with signal bridge (current pattern in our shared components)
private readonly _service = signal<ServiceOffering | null>(null);
@Input({ required: true }) set service(value: ServiceOffering) { this._service.set(value); }
readonly title = computed(() => this._service()?.title || '');

// Modern — signal input (eliminates the bridge boilerplate)
readonly service = input.required<ServiceOffering>();
readonly title = computed(() => this.service().title);
```

```typescript
// Legacy
@Output() save = new EventEmitter<Item>();

// Modern
save = output<Item>();
```

**Why:** Type-safe, works natively with signals/computed, no need for `ngOnChanges` or signal bridge workaround. Access values with `this.name()` in code and `name()` in templates.

**Note:** When extending a base class that uses `@Input()`, stay consistent with the base class pattern in that component.

## Change Detection: use OnPush

```typescript
// Legacy (no change detection strategy = Default)
@Component({ ... })

// Modern — all our components already use this ✅
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  ...
})
```

**Status:** 100% of our components already use OnPush. Keep it that way.

## Standalone Components

Our entire app is standalone — no NgModules. This is the Angular 21 default. Keep it that way.

## Signals for Component State

```typescript
// Legacy
public loading = false;
public items: Item[] = [];
public get hasItems(): boolean { return this.items.length > 0; }

// Modern — prefer for all component state
loading = signal(false);
items = signal<Item[]>([]);
hasItems = computed(() => this.items().length > 0);
```

**Why:** Automatic UI updates, fine-grained reactivity, works with OnPush out of the box. Use `signal()` for local state, `computed()` for derived state, `effect()` for side effects.

**When to keep RxJS:** HTTP calls, complex async streams, debounce/throttle, combining multiple async sources. Signals and RxJS coexist — use `toSignal()` and `toObservable()` to bridge.

## Control Flow: `@if/@for/@switch`

```html
<!-- All our templates already use this ✅ -->
@if (loading()) {
  <div>Loading...</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No items found</p>
}
```

**Status:** 100% of our templates use modern control flow. Keep it that way.

## Strict Typing: avoid `any`

```typescript
// Legacy
public onFilterChange(key, value, chipType) { ... }

// Modern — prefer for new code
public onFilterChange(key: string, value: string, chipType: ChipType): void { ... }
```

**Why:** Catches bugs at compile time, improves IDE support, makes code self-documenting. Use `unknown` when the type is genuinely uncertain, never `any`.

## Quick Reference

| Pattern | Legacy (existing code) | Modern (new code) |
|---------|----------------------|-------------------|
| DI | `constructor(private svc: Svc)` | `svc = inject(Svc)` |
| Inputs | `@Input() name: string` | `name = input<string>()` |
| Required inputs | `@Input({ required: true })` | `name = input.required<string>()` |
| Outputs | `@Output() save = new EventEmitter()` | `save = output<Item>()` |
| State | `public loading = false` | `loading = signal(false)` |
| Derived | `get x() { return ... }` | `x = computed(() => ...)` |
| Change det. | Default (none specified) | `OnPush` |
| Types | implicit `any` | explicit types everywhere |
| Control flow | `@if`, `@for`, `@switch` | same (already adopted) |
| Standalone | `standalone: true` | same (already adopted) |

## Current Codebase Status

**What's already modern:**
- ✅ 100% OnPush change detection
- ✅ 100% standalone components
- ✅ 100% modern control flow (`@if/@for`)
- ✅ 97% signal-based state management
- ✅ 89% `inject()` DI

**What needs modernization:**
- ❌ 0% signal inputs/outputs — all use `@Input()/@Output()` decorators
- 🔶 2 components use constructor injection for Router
- 🔶 9 shared components use "signal bridge" workaround (input setter → signal.set)
- 🔶 1 component (`proposal-form`) has plain `submitting` property

## If Lint Fires on You — Troubleshooting Common Violations

When the pre-commit hook or CI rejects your change, the ESLint output names the rule and the file:line. Match the rule against the sections below for a before/after fix. Top-pressure rules from [`INITIAL-AUDIT.md`](../phases/27.5-modernization-enforcement/INITIAL-AUDIT.md) (snapshot 2026-05-01): `no-explicit-any` (293), `prefer-signals` (176), `no-unused-vars` (90), `no-restricted-syntax`/banned-`@Output` (80).

### `@angular-eslint/prefer-signals` — `@Input()` / `@Output()` decorators

**Why it's banned:** Signal-based inputs/outputs are part of Angular 21's core reactivity model. Decorator-based versions are deprecated and don't compose with `computed()` / `effect()` cleanly. (176 violations in audit — second-highest pressure rule.)

```typescript
// BEFORE — fails lint
@Input() count: number = 0;
@Input({ required: true }) name!: string;
@Output() valueChanged = new EventEmitter<number>();

// AFTER — modern signals
import { input, output } from '@angular/core';

readonly count = input<number>(0);
readonly name = input.required<string>();
readonly valueChanged = output<number>();
```

Reading the value: `this.count()` (call as function) instead of `this.count` (field access). The `readonly` modifier is required by `@angular-eslint/prefer-signals`'s `preferReadonlySignalProperties` flag.

### `@typescript-eslint/no-explicit-any` — `any` typed values

**Why it's banned:** `any` opts out of TypeScript's type checking entirely, defeating the purpose of typing the codebase. Highest-pressure rule in audit (293 violations) — most cleanup work flows through this.

```typescript
// BEFORE — fails lint
function process(data: any): any { return data.value; }
const items: any[] = [];
catch (err: any) { console.error(err.message); }

// AFTER — narrow the type
function process<T extends { value: unknown }>(data: T): T['value'] { return data.value; }
const items: ServiceOffering[] = [];
catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

When the type genuinely is unknown (parsed JSON, third-party with no types), use `unknown` and narrow at the use site. Reach for `any` only when interfacing with code you cannot type — and when you do, leave a `// TODO: type this` comment so the next developer fixes it.

### `@typescript-eslint/no-unused-vars` — declared but unused

**Why it's banned:** Unused imports/parameters are dead code. They drift away from intent and confuse future readers.

```typescript
// BEFORE — fails lint
import { Subject, Observable } from 'rxjs';  // Observable never used
function format(value: string, options: FormatOptions) {  // options never used
  return value.trim();
}

// AFTER — drop dead code, or prefix intentional unused
import { Subject } from 'rxjs';
function format(value: string, _options: FormatOptions) {  // _ prefix = intentional
  return value.trim();
}
```

The leading `_` prefix tells the rule the parameter is intentionally unused (e.g., callback signatures you must match). Don't use it to silence the rule on real unused code — just delete the code.

### `@angular-eslint/prefer-inject` — constructor DI

**Why it's banned:** Field-level `inject()` works in any class context (services, components, guards, resolvers, functional interceptors), composes with the rest of the component class, and avoids constructor-parameter sprawl.

```typescript
// BEFORE — fails lint
constructor(
  private readonly router: Router,
  private readonly catalog: CatalogService,
) {}

// AFTER — field-level inject()
import { inject } from '@angular/core';

private readonly router = inject(Router);
private readonly catalog = inject(CatalogService);
```

If the class needs a non-trivial constructor body, retain the constructor (no parameters) and keep the field-level `inject()` calls.

### `@typescript-eslint/no-restricted-imports` — `CommonModule` in standalone components

**Why it's banned:** Standalone components should declare only the directives/pipes they actually use. `CommonModule` pulls everything (~16 directives + pipes) regardless of need; it bloats the standalone import surface and obscures dependency intent.

```typescript
// BEFORE — fails lint
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  // ...
})

// AFTER — declare only what you use
import { AsyncPipe, NgClass } from '@angular/common';

@Component({
  standalone: true,
  imports: [AsyncPipe, NgClass],
  // ...
})
```

If you find yourself listing 8+ directives, audit the template — usually the actual usage is much smaller than the wholesale `CommonModule` import suggested. Often the right move is migrating `*ngIf`/`*ngFor` to `@if`/`@for` and dropping the directive imports entirely.

### `@angular-eslint/template/prefer-control-flow` — `*ngIf` / `*ngFor` / `*ngSwitch`

**Why it's banned:** Built-in `@if` / `@for` / `@switch` are zoneless-friendly, type-narrow correctly, and don't require an `imports: [NgIf, NgFor]` declaration.

```html
<!-- BEFORE — fails lint -->
<div *ngIf="user$ | async as user">{{ user.name }}</div>
<li *ngFor="let item of items; trackBy: trackById">{{ item.name }}</li>

<!-- AFTER — control flow -->
@if (user$ | async; as user) {
  <div>{{ user.name }}</div>
}
@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
}
```

Note: `@for` requires a `track` expression (block-level, not directive-level).

### `@angular-eslint/prefer-standalone` — NgModule-declared components

**Why it's banned:** Standalone is the default in Angular 21. NgModules add ceremony and a second declaration surface for no benefit.

```typescript
// BEFORE — fails lint
@Component({
  selector: 'app-foo',
  templateUrl: './foo.component.html',
})
export class FooComponent {}

// In a module:
@NgModule({ declarations: [FooComponent], ... })
export class FooModule {}

// AFTER — standalone
@Component({
  selector: 'app-foo',
  standalone: true,
  imports: [/* directives + pipes used in template */],
  templateUrl: './foo.component.html',
})
export class FooComponent {}
```

Drop the NgModule entirely. Update consumers to import the component directly.

### `no-restricted-syntax` — banned `@Output()` decorator

**Why it's banned:** Same reason as `prefer-signals` (above) — the decorator-based variant is legacy. This rule is the AST-level catch-all that fires whenever an `@Output()` decorator appears, even on properties without a paired `@Input()`. (80 violations in audit.)

```typescript
// BEFORE — fails lint
@Output() readonly save = new EventEmitter<Item>();

// AFTER
import { output } from '@angular/core';

readonly save = output<Item>();
```

Emit: `this.save.emit(item)` -> `this.save.emit(item)` (same call site; only the field initializer changes).

### Other rules

For any rule not covered above (or for additional examples), the authoritative documentation lives in the plugin's own docs:

- `@angular-eslint/*` rules: `node_modules/@angular-eslint/eslint-plugin/docs/rules/<rule-name>.md`
- `@typescript-eslint/*` rules: <https://typescript-eslint.io/rules/>
- The repo's complete rule config: [`eslint.config.js`](../../eslint.config.js)

### Still stuck?

- Check [`INITIAL-AUDIT.md`](../phases/27.5-modernization-enforcement/INITIAL-AUDIT.md) for examples of the same violation in other files (top-10-by-rule sections — see who else has fixed this pattern).
- Search for the rule name in `.specstory/history/` — there may be a prior session where this exact violation came up.
- If a rule fires on a pattern you believe is correct, file an errata under `.planning/director/errata/` with the file:line and the rule output. **Do not bypass with `--no-verify`.**
