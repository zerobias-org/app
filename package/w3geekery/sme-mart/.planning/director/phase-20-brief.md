# Phase 20 — Fire-and-Forget `pushEntity` Audit, Instrumentation + Opportunistic Remediation

**Milestone target:** v1.4 (insert before Phase 27 — see Promotion note below)
**Est:** ~10 hrs audit+instrument+verify + opportunistic SIMPLE remediations (MEDIUM/COMPLEX deferred to v1.5 backlog)
**Repos:** `app/` (SME Mart only)
**Origin:** Errata 011 (director-flagged 2026-04-15) — **promoted from "theoretical risk" to "two confirmed production bugs" by errata 023 (2026-04-28)**
**Brief refreshed:** 2026-04-28 (Director Parks instance #2)

## Status update — why this brief was rewritten

Errata 011 documented fire-and-forget `.catch(err => console.error)` as a **silent-failure risk** but had no confirmed instances. **Errata 023 (2026-04-28) confirmed two real production bugs hiding behind that pattern**, both silently failing for the entire life of their respective plans:

| Class | First plan | Time silently failing | Production impact |
|---|---|---|---|
| MarketplaceProfileItem | Plan 041 | months | **ZERO MPI writes ever landed** through `vendor-profile.service.ts` (149/204/232) until Plan 26-02 bypassed `PipelineWriteService` directly with the canonical class id. |
| EngagementVettingItem | Plan 063 | months | **ZERO vetting-item writes ever landed** through `vetting.service.ts` (184/226/283/309). `initializeVetting`, all status transitions, all detail edits silently rejected. |

Plan 26-04 corrected the two fictional consts at `pipeline-write.service.ts:33,36` (commit `b1e997b`). **That fixes the immediate symptom. It does NOT fix the silent-failure mode.** The next bug — wrong const, schema drift, validation regression, network blip during a real save — will still hide. Phase 20's job is to close the silent-failure mode itself, so future regressions surface to users instead of disappearing into `console.error`.

## Promotion

Per `DIRECTOR-PARKS-RESUME.md` "Next-action sequence" item 5, Phase 20 should be **promoted from TBD to actively planned and inserted before Phase 27**. Phase 27's auth gate + lazy-on-load default-engagement guard relies on round-trip writes succeeding; running it on top of an unaudited fire-and-forget surface stacks more silent-failure exposure during onboarding routing work. Inserting Phase 20 first (suggested order: 24 → 25✅ → 26 → **20** → 27 → 28 → 30 → 31) lets every subsequent phase ship with telemetry visibility and SIMPLE call sites already remediated.

(Final phase ordering is Clark/GSD's call. Director recommends 26 → 20 → 27. Skipping 20 until v1.5 leaves Brian-P0 task-partition work, vetting flows, and bid submission all silent on failure during v1.4 verification.)

## Goal

Eliminate the silent-failure mode that hid two production bugs for months. Specifically:

1. **Audit** every `pushEntity` / `pushEntities` call site (60 found 2026-04-28; 44 fire-and-forget + 16 already-awaited — see `phase-20-call-site-audit.md` for the ranked table).
2. **Instrument** every `.catch()` site with a counter so the next silent failure produces a visible signal.
3. **Verify** that already-`await`ed call sites actually surface errors to users (an `await` whose throw lands in a swallowing context is the same bug).
4. **Remediate SIMPLE call sites** in this phase. File backlog entries for MEDIUM / COMPLEX.
5. **Re-verify class-ID consts** against `platform.Class.getClass(<name>)` at audit time as a safety check — including any consts added between 2026-04-28 and Phase 20 execution.

## Architecture

### Deliverable 1 — Audit & verify

- Director seed: `.planning/director/phase-20-call-site-audit.md` (60 sites, preliminary criticality classification).
- Phase 20 audit task **re-verifies each classification** by reading the call site + the calling component's UX:
  - User-initiated vs background?
  - Does the caller surface the error today (toast, inline form error, retry prompt)? If yes, today's `.catch(console.error)` is masking but not the only line of defense. If no, this is a CRITICAL silent-failure site.
  - Remediation complexity: **SIMPLE** (toast + await), **MEDIUM** (new form error state / disabled-button feedback), **COMPLEX** (UX re-architecture, retry queue).
- **MANDATORY at audit time:** run `platform.Class.getClass(<name>)` against every entry in `SME_MART_CLASS_IDS`. Confirm none have drifted into "fictional" status since 2026-04-28. Flag any new entries that weren't in the 2026-04-28 audit.
- Output: `.planning/phases/20-fire-and-forget-audit/AUDIT.md` (final) — supersedes the director seed.

### Deliverable 2 — Instrumentation

- Add lightweight telemetry to `PipelineWriteService.pushEntity` / `pushEntities`:
  - Wrap the existing internal call so every rejection produces a counted event tagged with `{ className, callSite, errorMessage, timestamp }`.
  - `callSite` is caller-provided (preferred — explicit tag) or stack-derived (fallback).
  - Sink to `console.error` (existing) **plus** a remote sink (env-gated; UAT + prod). Telemetry sink choice is Phase 20's call: CloudWatch / Sentry / Datadog / posthog — pick whatever is already wired in. If nothing is wired, use `console.warn` with a structured prefix (`[PIPELINE_WRITE_FAILURE]`) so a CloudWatch logs query can find them.
- **No user-facing behavior change in this deliverable.** Telemetry only.
- 1-week soak on UAT before close. If any call site fires non-zero `.catch()` events during the soak, errata 011's hypothesis is confirmed in production again — file errata, decide if a hot-fix supersedes opportunistic remediation order.

### Deliverable 3 — Opportunistic remediation (time-boxed)

For every CRITICAL+SIMPLE call site (per the refined audit):

- Replace `.catch(console.error)` with `await` + surfaced error state:
  - Toast (`MatSnackBar` is the project's idiom) is the default surface.
  - Form submissions: re-enable submit button + inline error.
  - Bid submit / vetting transitions: explicit "save failed, retry" UX.
- Add spec coverage that asserts **the user-visible failure path** — not just that `pushEntity` rejected. Address WATCH-LIST: "Unit test uses fake that never errors."
- Mock shape per `feedback_tests_passing_against_wrong_shape_mocks.md` — derive from real SDK / sibling spec, not imagination.

For CRITICAL+MEDIUM and CRITICAL+COMPLEX call sites: **DO NOT remediate in this phase.** Add individual entries to `.planning/BACKLOG.md` under a "Fire-and-Forget Remediation" section with:
- Call site identifier (file:line)
- Proposed fix approach
- Complexity rationale
- Severity (CRITICAL — these are the deferred ones, all CRITICAL)

Track remediation entries in a single backlog rollup so v1.5 milestone planning can pick them up as a batch or split across phases.

## Requirements

- **FF-01:** AUDIT.md exists with 100% of `pushEntity` / `pushEntities` call sites cataloged. Each row: file:line | className | criticality (CRITICAL / MEDIUM / LOW / AWAITED-VERIFY) | remediation complexity (SIMPLE / MEDIUM / COMPLEX / N-A).
- **FF-02:** Class-ID safety re-verification: every `SME_MART_CLASS_IDS` entry confirmed against `platform.Class.getClass(<name>)` at audit time. Output as a small table appended to AUDIT.md ("Class-ID verification, {date}, profile {profile}").
- **FF-03:** Telemetry ships — every fire-and-forget rejection produces a structured logged event including `className`, `callSite`, error message, and timestamp. Visible in console + remote sink (or `console.warn` with structured prefix if no remote sink exists).
- **FF-04:** All CRITICAL+SIMPLE call sites have fire-and-forget removed, error state surfaced (toast or equivalent), and at least one spec covering the user-visible error path with a correctly-shaped mock.
- **FF-05:** All CRITICAL+MEDIUM and CRITICAL+COMPLEX call sites have backlog entries with proposed remediations. Backlog entries grouped under a "Fire-and-Forget Remediation" section.
- **FF-06:** AWAITED call sites verified: each of the 16 `await this.pipelineWrite.pushEntities(...)` sites has its caller checked. Any caller that swallows the throw without surfacing to the user is added to the SIMPLE remediation list.
- **FF-07:** WATCH-LIST updated: "Service method ends with `.catch(err => console.error(err))`" is a BLOCK for user-triggered actions going forward.
- **FF-08:** WATCH-LIST adds: "Class-ID const carries comment `(deterministic UUID v5 from schema)`" — verify against `platform.Class.getClass` before trust.

## Dependencies

None. Self-contained in `app/`. Phase 26 must close before Phase 20 starts (Plan 26-04 is the corrective fix that produces the canonical-const baseline Phase 20 audits against). **Plan 26-04 already merged 2026-04-28** (commit `b1e997b`) — dependency is satisfied at brief authorship time.

## Verification

- **Audit review:** Director walks the ranked table with Clark; sanity-check criticality classifications and remediation-complexity ratings.
- **Class-ID safety:** AUDIT.md includes the 23-row class-id verification table; Director confirms no new fictional entries.
- **Spec suite:** every remediated call site has a new failing-write spec that passes with the fix and would fail with the old `.catch(console.error)` pattern. Test mocks verified against real SDK shape.
- **Build green:** `npm test` (targeted), `npm run build:prod` succeed. tsc --noEmit passes.
- **UAT soak (post-merge, before close):** telemetry runs for 1 week. Director reviews the soak report. If non-zero `.catch()` fires on any call site, file errata immediately. If zero fires across all 44 sites for a full week, that's a useful negative result — record in retrospective; the silent-failure hypothesis was right historically (errata 023's two cases) but not currently active in any other site.

## Out of scope

- Rewriting the Pipeline write pattern across the app — remediation is call-site-by-call-site.
- `PipelineWriteService` internal redesign — stays single-method; callers decide `await` vs not.
- Telemetry dashboard / alerting — just sink the events; analysis is manual for this milestone.
- Designing new error UX for MEDIUM/COMPLEX sites — those flow into v1.5 backlog with proposed approaches but no implementation here.
- Cross-cutting "atomic multi-class" writes — none currently exist; not addressed.

## References

- Errata 011 (`.planning/director/errata/011-pipeline-fire-and-forget-masks-errors.md`) — original flag.
- Errata 023 (`.planning/director/errata/023-fictional-class-ids-silent-failures.md`) — two confirmed instances.
- DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5" (2026-04-28).
- `.planning/director/phase-20-call-site-audit.md` — director-pre-pass call-site table (60 sites, preliminary classification).
- `src/app/core/services/pipeline-write.service.ts:172` — `pushEntity` definition (single-entity wrapper around `pushEntities`).
- `src/app/core/services/pipeline-write.service.ts:10-47` — `SME_MART_CLASS_IDS` (24 entries audited; 21 confirmed canonical, 2 corrected by Plan 26-04, all currently canonical).
- `feedback_tests_passing_against_wrong_shape_mocks.md` — test mock-shape discipline (mocks must mirror real SDK).
- Phase 17 SUMMARY lines 104-106 — schema gotchas the CLI surfaced that the app silently ate (the original observation).
