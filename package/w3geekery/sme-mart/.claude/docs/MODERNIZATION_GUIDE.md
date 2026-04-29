# Angular Modernization Guide

When creating **new** components, services, or directives, prefer modern Angular patterns over legacy ones. When modifying existing code, modernize the patterns you touch. This guide covers what to use going forward.

> **Reference:** [angular.dev/ai/develop-with-ai](https://angular.dev/ai/develop-with-ai)

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
