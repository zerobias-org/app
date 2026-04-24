# Conventions

> Auto-generated codebase map. Source of truth is the code itself.

## Language & Framework

- **TypeScript** strict mode (`tsconfig.json`)
- **Angular 21** standalone components (no NgModules)
- **SCSS** for styles (component + global)
- **Plain Angular CLI** — no Nx

## Component Style

### Standalone by default
All components use `standalone: true`. No `NgModule` wrappers.

```typescript
@Component({
  selector: 'app-provider-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, ...],
  templateUrl: './provider-card.component.html',
  styleUrl: './provider-card.component.scss',
})
export class ProviderCard { ... }
```

### Signals & Computed
Modern Angular reactive primitives used throughout:
- `signal()` for component state
- `computed()` for derived values
- `effect()` for side effects
- Services expose `signal()` for reactive state (e.g., `SmeMartDbService.connected`)

### Class names (no suffix)
Component classes use PascalCase **without** a `Component` suffix in the class name:
- `export class ProviderCard` (not `ProviderCardComponent`)
- `export class Home` (not `HomeComponent`)
- File still has suffix: `provider-card.component.ts`

## Service Patterns

### Dependency Injection
All services use `@Injectable({ providedIn: 'root' })` with `inject()` function:

```typescript
@Injectable({ providedIn: 'root' })
export class BidsService {
  private readonly db = inject(SmeMartDbService);
  private readonly tags = inject(SmeMartTagService);
}
```

### Error Handling
- Services log errors via `console.warn()` / `console.error()`
- Non-blocking connections (DB connect in `AppInitService` uses `.catch()`)
- Services return result objects with `success` / `error` fields

### Immutability
New objects returned from operations — no mutation of existing data. Mapper functions are pure.

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case with type suffix | `bid-resource.mapper.ts` |
| Classes | PascalCase, no type suffix | `BidsService`, `ProviderCard` |
| Interfaces/Types | PascalCase | `Bid`, `WorkRequest`, `GqlQueryResult<T>` |
| Enums | PascalCase members | `BidStatus.Submitted` |
| Constants | UPPER_SNAKE | `SME_MART_CLASS_IDS`, `PIPELINE_ID` |
| CSS classes | kebab-case | `.provider-card`, `.bid-summary` |
| Routes | kebab-case paths | `/my-profile`, `/my/engagements` |
| Tags | dot-separated namespace | `sme-mart.eng.amber-circuit` |

## Import Organization

Barrel exports (`index.ts`) in `core/models/`, `core/mappers/`, and `shared/`.

Typical import order (no enforced linter rule):
1. Angular framework (`@angular/*`)
2. Third-party (`@zerobias-*`, `@ngx-translate/*`, Material)
3. Local (`../models`, `../services`, `../../shared`)

## File Size Guidelines

- Components: typically 100-400 lines
- Services: typically 50-200 lines
- Models: typically 20-80 lines
- Mappers: typically 15-40 lines (pure functions)

## Barrel Exports

- `src/app/core/models/index.ts` — all model interfaces
- `src/app/core/mappers/index.ts` — all mapper functions
- `src/app/shared/index.ts` — shared components, pipes, directives

## CSS / Theming

- `@zerobias-org/ngx-library` theme imported via `src/styles.scss`
- ngx-library assets copied in `angular.json` → `assets` array
- SCSS include paths configured for ngx-library styles
- Component styles use `:host` scoping
- **No `!important`** — use proper specificity

## Comments & Documentation

- JSDoc on services and non-obvious functions
- Inline comments for platform-specific quirks (e.g., GQL availability timing)
- `CLAUDE.md` and `.claude/notes/` for architectural decisions
- No auto-generated docs — code is self-documenting where possible
