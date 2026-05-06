---
id: "023"
severity: high
phase: "*"
found: 2026-04-28
status: open
related: "011"
---

# Two fictional class IDs in `pipeline-write.service.ts` cause silent production failures

The 2026-04-28 audit of `SME_MART_CLASS_IDS` (23 entries) against `platform.Class.getClass(<name>)` on UAT found **two consts that do not match any class registered on the platform**. Pipeline.receive returns `"No such Class"` for both, and every write path through them is wrapped in fire-and-forget `.catch(err => console.error(...))` — so failures land in the dev console and never surface to users.

## Confirmed fictional consts

| Class | Codebase const (`pipeline-write.service.ts:33,36`) | Canonical (platform-assigned) |
|---|---|---|
| EngagementVettingItem | `66fa174f-86b2-5854-b7c1-7ffe26fcaa46` | `21f5841f-dd27-53ef-a0f5-6a816ec7f7e1` |
| MarketplaceProfileItem | `ee1e68b7-f003-5f5f-a111-7ec93b37681c` | `7bcf86a5-91dc-520d-b9bf-e308b1078d46` |

Both are commented `// Plan 0XX — ... (deterministic UUID v5 from schema)`. The original authors computed UUID v5 derivations expecting the platform would assign the same UUID when the class was registered. **It didn't.** Class IDs come from the platform registration pipeline (dataloader / catalog publish), not from a deterministic UUID v5 of the schema.

## Impact

- **MarketplaceProfileItem** — every write through `vendor-profile.service.ts` (lines 149, 204, 232) has been silently failing since Plan 041. Today the only MPI rows on UAT are those landed by Plan 26-02's seed (which used `7bcf86a5-...` directly, bypassing `pipeline-write.service.ts`).
- **EngagementVettingItem** — every write through `vetting.service.ts` (lines 184, 226, 283, 309) has been silently failing since Plan 063. `initializeVetting()`, status transitions, and detail edits all hit Pipeline.receive with `66fa174f-...` and get rejected with `"No such Class"`.

## Confirmation methodology

- All 23 SME_MART_CLASS_IDS audited via `platform.Class.getClass(<name>)` on UAT (profile `uat-clark@w3geekery`) 2026-04-28.
- 21 consts match the registered class ID (no action needed).
- 2 fictional consts identified — both flagged here.
- Live MPI proof: Plan 26-02 seed via `mcp__zerobias__zerobias_execute` with `7bcf86a5-...` succeeded; same payload with `ee1e68b7-...` was rejected with `"No such Class"` (gsd-execute self-halt finding 2026-04-28).
- Reverse-direction test of `66fa174f-...` not yet run — symmetry inference from MPI case + identical comment provenance is the basis. Plan 26-04 will include an empirical confirmation as part of TDD.

## Root cause

1. **Wrong UUID-derivation assumption:** Plan 041 + Plan 063 authors believed `class metadata UUID = uuidv5(schema-namespace, className)`. The platform's actual registration assigns UUIDs that are NOT the schema-derived value.
2. **No round-trip verification at plan close:** Neither plan's verification step queried GQL for an actual write through `PipelineWriteService` after introducing the const. UAT verification was done indirectly (manual scripts using literal class IDs that happened to be correct), masking the const error.
3. **Silent-failure mode hid the bug:** `.catch(err => console.error(...))` in `vendor-profile.service` and `vetting.service` swallowed every "No such Class" rejection. No telemetry, no toast, no error budget. **This is errata 011 going from "theoretical risk" to "two confirmed instances".**

## Fix path

**Immediate (handed to gsd-plan as Plan 26-04 — see prompt in Director's hand-off message 2026-04-28):**
- Correct both consts to canonical platform IDs.
- Drop the misleading "deterministic UUID v5 from schema" comments — these are platform-assigned IDs.
- TDD: tests bind to canonical UUIDs and would fail with the fictional ones; mocks mirror real SDK shape per `feedback_tests_passing_against_wrong_shape_mocks.md`.
- Live UAT verification: run one MPI write via `vendor-profile.create` and one vetting-item write via `vetting.initializeVetting` through the corrected service; GQL read-back to confirm rows actually land.

**Systemic (Phase 20 — already in v1.3 roadmap, not yet planned):**
- Audit all `pushEntity` / `pushEntities` call sites for fire-and-forget patterns (~48 identified per Phase 20 brief).
- Add telemetry to measure real-world failure rates.
- Remediate CRITICAL+SIMPLE call sites — replace fire-and-forget with `await` + surfaced error state.
- Promote Phase 20 from TBD to actively-planned.

## Watch pattern (additions to WATCH-LIST)

Already covered by errata 011's watch entry. Strengthen the framing:

> **"Deterministic UUID v5 from schema" comments are now suspect** — verify any class const carrying that comment against `platform.Class.getClass(<name>)` before trusting it. Platform-assigned UUIDs do not match naive UUID v5 derivations.

## Related artifacts

- Errata 011 — fire-and-forget masks errors (this is its first two confirmed instances)
- `pipeline-write.service.ts:33,36` — the consts to correct
- `vendor-profile.service.ts:149,204,232` — silent MPI write failures
- `vetting.service.ts:184,226,283,309` — silent vetting-item write failures
- DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5" (added 2026-04-28)
- Phase 20 brief — `.planning/director/phase-20-brief.md` (designed but never executed)
