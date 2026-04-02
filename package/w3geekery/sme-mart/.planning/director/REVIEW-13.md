# Director Review — Phase 13: Pilot Projects

**Reviewed:** 2026-04-02
**Plans:** 13-01 (Wave 1), 13-02 (Wave 2)
**Verdict:** Ship with flags addressed

## FLAGS (must address during execution)

### FLAG-1: Constructor injection instead of inject() (both plans)
Plan 13-01 Task 4 and Plan 13-02 Task 2 use `constructor(private dialog: MatDialog, @Inject(MAT_DIALOG_DATA)...)` pattern. Project convention requires `inject()` function.

**Fix:** Use `readonly dialog = inject(MatDialog)`, `readonly dialogRef = inject(MatDialogRef)`, `readonly data = inject(MAT_DIALOG_DATA)` as class fields. No constructor needed.

### FLAG-2: Signal vs BehaviorSubject confusion (13-02 Task 1)
Plan says `signal<T>()` then `.asObservable()`. Angular signals don't have `.asObservable()`. Pick one:
- **Option A (preferred):** Use Angular `signal()` + expose directly. Components use the signal, not an observable.
- **Option B:** Use `BehaviorSubject` if you need RxJS interop. But the suggestion panel already uses `toSignal()`, so just expose the signal.

**Fix:** Remove `.asObservable()`. Expose the signal directly. Components already use `toSignal()` for subscription.

### FLAG-3: mat-button-toggle two-way binding with signal (13-01 Task 3)
Template has `[(value)]="projectTypeFilter()"` — signals don't support `[()]` banana-in-a-box syntax.

**Fix:** Use `[value]="projectTypeFilter()"` (one-way) with `(change)="setProjectTypeFilter($event.value)"`.

### FLAG-4: Link types need API verification (13-02 Task 2)
Plan uses `promoted_to` and `promoted_from` as resource link types. These may not exist in the platform.

**Fix:** Before execution, run `zerobias_search("linkType")` or `zerobias_search("listResourceLinkTypes")` to verify available link types. If `promoted_to`/`promoted_from` don't exist, either create them or use existing `relates_to` link type with metadata. This is the ORG-07 lesson — verify before assuming.

## NOTES (executor can handle)

- Plan 13-01 Task 6 test framework mention says "Vitest + Angular TestBed" — project uses `npm test` → `ng test`. Executor should follow existing test patterns, not introduce new test runner assumptions.
- Plan 13-02 Task 6 manual verification is good but won't be possible until after Plan 01 ships. Expected since it's Wave 2.

## Pre-Approval Checklist

- [x] Every requirement ID appears in at least one plan task
- [x] Test tasks present in both plans
- [x] No spec decisions left unpersisted
- [x] Angular correctness checked (flags above)
- [x] Budget fits 15 hrs/week (6-8 hrs total for phase)
- [x] Feature stays in marketplace scope
- [ ] API dependencies verified — FLAG-4 needs link type verification

**Ship it** — with FLAG-1 through FLAG-4 addressed by the executor before/during execution.
