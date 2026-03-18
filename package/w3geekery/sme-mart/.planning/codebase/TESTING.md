# Testing

> Auto-generated codebase map. Source of truth is the code itself.

## Framework

- **Vitest** — test runner and assertion library
- **Angular TestBed** — component/service test setup
- **`vi.fn()`** — mocking (Vitest's built-in mock, no Jest)
- **No E2E framework** currently configured

## Configuration

- Setup: `src/test-setup.ts`
- Run: `npm test` → `ng test` (Angular CLI integration)
- **Never run `npx vitest run` directly** — always use `npm test`

## Test Structure

### Co-located specs
Test files live next to their source:
```
src/app/core/services/bids.service.ts
src/app/core/services/bids.service.spec.ts
```

### Coverage
- **40 spec files** across the codebase
- **~6,266 lines** of test code
- Services, mappers, pipes, and some components tested
- Mappers have 100% coverage (pure functions)

## Test Helpers (`src/app/test-helpers/`)

### `angular.ts` (170 lines)
Mock factories for Angular services:
- `fakeSnackBar()` — mock `MatSnackBar`
- `fakeMatDialog()` — mock `MatDialog`
- Service-specific mock factories for ZeroBias SDK services

### `constants.ts` (37 lines)
Stable test IDs:
- `TEST_USER_ID`, `TEST_ORG_ID`, `TEST_BID_ID`, etc.
- Valid UUID formats for ZeroBias APIs

### `factories.ts` (376 lines)
Domain model factories with sensible defaults:
- `buildBid(overrides?)`, `buildWorkRequest(overrides?)`, etc.
- Returns typed objects matching model interfaces
- Overrides pattern: `{ ...defaults, ...overrides }`

## Mocking Patterns

### ZeroBias SDK services
```typescript
const mockClientApi = {
  hydraClient: {
    getTagApi: () => ({
      searchTags: vi.fn().mockResolvedValue({ items: [] }),
      createTag: vi.fn().mockResolvedValue(fakeTag),
    }),
  },
  platformClient: {
    getPipelineApi: () => ({
      receive: vi.fn().mockResolvedValue(undefined),
    }),
  },
};

providers: [
  { provide: ZerobiasClientApi, useValue: mockClientApi },
]
```

### SmeMartDbService
```typescript
const mockDb = {
  connected: signal(true),
  query: vi.fn().mockResolvedValue({ rows: [] }),
};
providers: [
  { provide: SmeMartDbService, useValue: mockDb },
]
```

### Angular Material dialogs
```typescript
providers: [
  { provide: MatDialog, useValue: fakeMatDialog() },
  { provide: MatSnackBar, useValue: fakeSnackBar() },
]
```

## Test Categories

| Category | Count | Location |
|----------|-------|----------|
| Service specs | ~12 | `src/app/core/services/*.spec.ts` |
| Mapper specs | 6 | `src/app/core/mappers/*.spec.ts` |
| Pipe specs | 2 | `src/app/shared/pipes/*.spec.ts` |
| Component specs | ~15 | `src/app/pages/**/*.spec.ts` |
| Util specs | 1 | `src/app/core/utils/*.spec.ts` |
| App spec | 1 | `src/app/app.spec.ts` |

## What's NOT Tested

- E2E flows (no Cypress/Playwright)
- `SmeMartDbService` Hub mode (only Neon mode tested)
- `AppInitService` (bootstrap logic)
- Most page-level components (only a few have specs)
- `GraphqlReadService` and `PipelineWriteService`
- Shared components (~55 components, few have specs)

## Running Tests

```bash
npm test                    # Run all tests via Angular CLI
npm test -- --watch         # Watch mode
npm test -- --reporter=dot  # Minimal output
```
