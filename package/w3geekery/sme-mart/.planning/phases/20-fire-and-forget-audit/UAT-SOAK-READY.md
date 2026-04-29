# UAT Soak Configuration & Telemetry Readiness

**Phase:** 20 Fire-and-Forget Audit — Wave 3
**Date Prepared:** 2026-04-29
**Soak Duration:** 1 week (7 days) post-merge
**Environment:** UAT (`https://uat.zerobias.com/sme-mart/`)
**Soak owner:** Director (review at day 7)
**Soak status:** **READY** — runs post-merge, NOT blocking phase close.

## Telemetry sink

**Sink:** `console.warn()` with structured JSON prefix
`[PIPELINE_WRITE_FAILURE] {…}` — implemented at
`src/app/core/services/pipeline-write.service.ts` (Wave 1 FF-03).

**Why console (not Sentry / CloudWatch / Datadog):**

- No remote telemetry sink is wired in the SME Mart frontend today.
- A consistent log prefix lets CloudWatch log queries on the prod
  hosting stack pattern-match and aggregate without code changes.
- Structured JSON event in the message body parses cleanly with
  `jq` / CloudWatch Insights / Sentry Issue search.
- Migrating to a remote sink later is a one-line change in
  `pushEntities()` / `deleteEntities()` rejection branches; the
  call sites and event shape do not change.

**Coverage in code:** every `pushEntities`, `pushEntity`,
`deleteEntities`, `deleteEntity` rejection path emits the structured
event before re-throwing. See `pipeline-write.service.spec.ts`
`describe('Telemetry Instrumentation (FF-03)')` for the contract
(7 specs covering all four entry points + timestamp ISO format +
explicit `callSiteTag` propagation + success-path no-op).

## Event shape

Each rejection event includes:

| Field | Source | Example |
|---|---|---|
| `className` | First arg to `pushEntities`/`deleteEntities` | `"Bid"` |
| `callSite` | Optional `callSiteTag` arg passed by caller, else stack-derived | `"bid-submit.component.ts:142"` |
| `errorMessage` | `(err as Error).message` from receive rejection | `"Pipeline validation failed: …"` |
| `timestamp` | `new Date().toISOString()` | `"2026-04-29T21:13:36.789Z"` |

Wave 2 services pass explicit `callSiteTag` strings of the form
`<file>.ts:<line>`, so post-merge telemetry attributes failures
back to a precise call site without parsing stack traces.

## Smoke test

**Status:** ✅ Covered by unit tests at `pipeline-write.service.spec.ts:226-374`
(8 specs verify the structured event fires for both push and delete,
that explicit `callSiteTag` is honored, that the error re-throws
after logging, that ISO format is produced, and that the success
path emits nothing).

A live UAT smoke test (deliberately push to a non-existent class to
trigger a real rejection) is **not required to start the soak** —
the code path is exercised by Wave 1 unit tests, and any deployed
build that triggers a rejection in real usage will write the
structured event to the browser console (which will be captured by
CloudWatch only if the deployed runtime is configured to forward
browser logs; otherwise the soak is a "manual review of console
errors during UAT exploratory testing").

## Soak hypothesis

- **Before Phase 20:** any failure on a fire-and-forget call site
  produces a silent `.catch(console.error)` write, the user sees
  the optimistic UI, and the failure is invisible.
- **After Wave 2:** the same failure produces (a) a `MatSnackBar`
  visible to the user, (b) a structured `[PIPELINE_WRITE_FAILURE]`
  console event, and (c) re-thrown rejection so the caller can
  reset state.
- **Soak goal:** measure real-world rejection frequency across all
  44 originally-fire-and-forget (now remediated) call sites during
  one week of normal UAT usage.

## Soak query patterns

**Browser console (manual, exploratory):**

Open DevTools on `uat.zerobias.com/sme-mart/`. Filter Console for
`[PIPELINE_WRITE_FAILURE]`. Each line is a parseable JSON object
following the `[PIPELINE_WRITE_FAILURE] ` prefix.

**CloudWatch Logs Insights (if browser-log forwarding is enabled
on UAT):**

```
fields @timestamp, @message
| filter @message like /\[PIPELINE_WRITE_FAILURE\]/
| parse @message /\[PIPELINE_WRITE_FAILURE\] (?<event>\{.*\})/
| stats count() as rejections by event.className, event.callSite
| sort rejections desc
```

**Local replay during soak review:**

Tail the most recent UAT browser session via DevTools → Console →
Save as. Grep for `[PIPELINE_WRITE_FAILURE]` to extract structured
events for offline analysis.

## Post-merge soak timeline

| Day | Activity |
|---|---|
| 0 (merge day) | Merge to UAT. Telemetry goes live. Director starts a soak window in the director state. |
| 1-6 | Normal UAT usage by Clark + any platform team members exercising flows. No special action — telemetry runs passively. |
| 7 | Director review: pull console traces / CloudWatch query, count `[PIPELINE_WRITE_FAILURE]` events grouped by `className` + `callSite`. |

## Soak success criteria

- The structured event format remained intact across the soak (no
  build regressed the `pipeline-write.service.ts` rejection path).
- Aggregate rejection counts are computable per `className` and
  per `callSite` (the dimensions exist on every event).
- If any `(className, callSite)` pair fired ≥ 1 rejection in the
  week, that pair is a candidate for v1.5 polish (UX upgrade
  beyond the SIMPLE pattern — disable submit button + retry,
  per-item batch handling, etc.). Polish entries already filed:
  `FF-POLISH-1`, `FF-POLISH-2`, `FF-POLISH-3` in BACKLOG.md.

## Soak does NOT block phase close

Per the Wave 3 plan and Director's checkpoint guidance, the 1-week
soak runs **independently** of Phase 20 closure. Phase 20 is
considered complete once Waves 1-3 are merged and the verifier +
gsd-tools phase complete pass. Director reviews the soak report on
Day 7 and decides whether any individual site needs a hot-fix in
v1.5 (vs. continuing to ride the SIMPLE pattern).

## Related

- [`AUDIT.md`](AUDIT.md) — telemetry sink rationale + event shape
- [`ROUND-TRIP-RESULTS.md`](ROUND-TRIP-RESULTS.md) — class-id
  drift gate
- BACKLOG.md "Fire-and-Forget Remediation Polish (v1.5)" —
  `FF-POLISH-1`/2/3 polish entries
- Errata 011 (silent fire-and-forget) — addressed by Waves 1+2+3
- Errata 023 (fictional class IDs) — re-verified canonical via
  Wave 1 + the Wave 3 round-trip block
