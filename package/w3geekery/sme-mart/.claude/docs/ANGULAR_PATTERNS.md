# Angular Best Practices

Angular-specific coding standards for SME Mart Angular (Angular 21).

> Adapted from ZeroBias UI `.claude/docs/ANGULAR_PATTERNS.md`

## Angular 21 Key Features

### Zoneless Change Detection (Default in Angular 21)
Angular 21 uses zoneless change detection by default. New applications no longer need `provideZonelessChangeDetection()`. If your code relies on Zone.js, you must explicitly add `provideZoneChangeDetection()`.

### Signal Forms (Experimental)
Angular 21 introduces Signal Forms in `@angular/forms/signals`:
```typescript
import { signalForm, signalFormControl } from '@angular/forms/signals';

const form = signalForm({
  name: signalFormControl(''),
  email: signalFormControl('')
});

// Access values reactively
const nameValue = form.controls.name.value(); // Signal!
```

For gradual migration from reactive forms, use `@angular/forms/signals/compat`.

### @angular/aria for Accessibility
The new `@angular/aria` package provides accessible directives implementing WAI-ARIA patterns with keyboard navigation, ARIA attributes, focus management, and screen reader support.

## Control Flow Syntax

**ALWAYS use modern Angular control flow syntax:**

```html
@if (condition) {
  <div>Content</div>
} @else if (otherCondition) {
  <div>Alt content</div>
} @else {
  <div>Fallback</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No items found</p>
}

@switch (status()) {
  @case ('loading') { <div>Loading...</div> }
  @case ('error') { <div>Error occurred</div> }
  @default { <div>Content loaded</div> }
}
```

### Content Projection with Control Flow

**IMPORTANT:** Elements using content projection (`<ng-content>`) must exist **outside** of control flow blocks, or projection fails silently.

```html
<!-- ❌ WRONG - Projected content inside @if won't work -->
<my-wrapper>
  @if (showContent) {
    <div projected-content>Won't project correctly</div>
  }
</my-wrapper>

<!-- ✅ CORRECT - Container exists unconditionally -->
<my-wrapper>
  <div projected-content>
    @if (showContent) {
      This content will project correctly
    }
  </div>
</my-wrapper>
```

## Template Change Detection Optimization

**Avoid calling functions directly in templates** — they trigger on every change detection cycle. Use pipes, computed signals, or component properties instead.

### ❌ Avoid — Functions in Templates
```html
<span>{{ getFormattedDate(item.date) }}</span>
@if (isExpired(item)) { <span class="expired">Expired</span> }
```

### ✅ Correct — Use Computed Signals or Pipes
```typescript
// Pre-compute in the component
isExpired = computed(() => this.item().expirationDate < new Date());
```

```html
<!-- Reading a signal or using a pipe -->
@if (isExpired()) { <span class="expired">Expired</span> }
<span>{{ item.date | date:'mediumDate' }}</span>
```

### When Functions Are Acceptable
- **Event handlers**: `(click)="handleClick()"` — only called on events
- **Simple property access**: `{{ item.name }}` — just reading, not computing
- **Getter that returns a signal**: signals handle change detection efficiently

## Component Method Ordering

Organize methods in this order:
1. **Lifecycle hooks** (`ngOnInit`, `ngOnDestroy`, etc.)
2. **Public getters/setters**
3. **Public methods** (event handlers, template-accessible methods)
4. **Private methods** (always at the bottom)

## File Naming Convention

Angular 21 dropped type suffixes. **This project keeps traditional suffixed naming** — easier to scan.

| Type | Pattern | Example |
|------|---------|---------|
| Component | `foo.component.ts` / `.html` / `.scss` | `provider-card.component.ts` |
| Service | `foo.service.ts` | `catalog.service.ts` |
| Pipe | `foo.pipe.ts` | `currency-format.pipe.ts` |
| Directive | `foo.directive.ts` | `auto-focus.directive.ts` |
| Guard | `foo.guard.ts` | `admin.guard.ts` |
| Model/Interface | `foo.model.ts` | `provider.model.ts` |
| Routes | `foo.routes.ts` | `my-profile.routes.ts` |
