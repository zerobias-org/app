# Class-ID Round-Trip Verification Results

**Phase:** 20 Fire-and-Forget Audit — Wave 3
**Date:** 2026-04-29
**Source of truth:** `src/app/core/services/pipeline-write.service.ts` `SME_MART_CLASS_IDS` registry
**Verification gate:** `src/app/core/services/pipeline-write.service.spec.ts` `describe('Class-id round-trip for all 23 SME_MART_CLASS_IDS …')`

## Approach

The Wave 3 plan called for a "round-trip writes for the 23 explicit class IDs"
gate to confirm two things at once:

1. Each `SmeMartClassName` key in `SME_MART_CLASS_IDS` actually reaches
   `platformClient.getPipelineApi().receive(...)` when `pushEntities`
   is invoked with that name.
2. The `SimpleBatch.classId` carried into the receiver matches the
   canonical platform-assigned UUID — no fictional consts, no drifted
   UUID v5 form regressing the Plan 26-04 corrections (errata 023).

The platform-side verification was already done in Wave 1 against
`platform.Class.getClass` on UAT (see [`AUDIT.md`](AUDIT.md) "Class-ID
Verification Table"). Wave 3 closes the loop on the codebase side: a
parameterized `it.each` test exercises all 23 className keys against
the same UUIDs, so any future drift (rename, copy-paste error,
accidental UUID rewrite) is caught at unit-test time rather than at
runtime when a Pipeline write silently lands in the wrong class
partition.

## Result

**23/23 ✅ canonical** — every className key in `SME_MART_CLASS_IDS`
routes its batch to the canonical platform-assigned classId.

| # | Class | Canonical UUID | Codebase Source | Test Result |
|---|---|---|---|---|
| 1 | Engagement | `7711aa41-e55b-5cda-9b7a-35844a2006a1` | pipeline-write.service.ts:12 | ✅ |
| 2 | Bid | `ccddd2e5-e455-585e-9bb7-902903228b0d` | pipeline-write.service.ts:13 | ✅ |
| 3 | BidResponse | `a024a0b5-50df-59cc-ba8e-25fcd82f69c3` | pipeline-write.service.ts:14 | ✅ |
| 4 | ServiceOffering | `ff689173-4787-52c5-808b-6b2435a625a7` | pipeline-write.service.ts:15 | ✅ |
| 5 | Note | `fe7c58a9-c13b-5a4b-817f-5c4b419ed28c` | pipeline-write.service.ts:16 | ✅ |
| 6 | NoteFolder | `4d50975e-d4dc-5654-8e43-f3c5da01f49d` | pipeline-write.service.ts:17 | ✅ |
| 7 | Review | `ef5d821a-46f5-5f44-8e59-0854777d803c` | pipeline-write.service.ts:18 | ✅ |
| 8 | SmeMartDocument | `e1497ca8-a621-57f6-9263-f9a19fea3c34` | pipeline-write.service.ts:19 | ✅ |
| 9 | SmeMartProject | `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03` | pipeline-write.service.ts:22 | ✅ |
| 10 | SmeMartBoard | `20be589b-194e-5227-ba6e-c7edae42f34b` | pipeline-write.service.ts:23 | ✅ |
| 11 | SmeMartActivity | `36405d75-76f1-5f4b-ab3b-22c562d41e07` | pipeline-write.service.ts:24 | ✅ |
| 12 | SmeMartWorkflow | `295938d2-5c63-5140-a945-2ba28b88b268` | pipeline-write.service.ts:25 | ✅ |
| 13 | SmeMartTask | `e15f1e0a-1bc9-5002-b4bc-3482d4499561` | pipeline-write.service.ts:26 | ✅ |
| 14 | ProjectPrd | `920fca70-4dcf-5d9e-ba16-1dfd0f8061f0` | pipeline-write.service.ts:27 | ✅ |
| 15 | PrdSection | `d30445f3-e26d-5153-83be-fe810f63220c` | pipeline-write.service.ts:28 | ✅ |
| 16 | ProjectPlan | `bc6159da-19a3-51d0-89a8-f2147078c760` | pipeline-write.service.ts:29 | ✅ |
| 17 | PlanMilestone | `ac1a1cc8-db44-5c1d-b359-5fb02e3d381d` | pipeline-write.service.ts:30 | ✅ |
| 18 | EngagementVettingItem | `21f5841f-dd27-53ef-a0f5-6a816ec7f7e1` | pipeline-write.service.ts:33 | ✅ |
| 19 | MarketplaceProfileItem | `7bcf86a5-91dc-520d-b9bf-e308b1078d46` | pipeline-write.service.ts:36 | ✅ |
| 20 | RfpInvitation | `941cf01b-d260-5e45-8c6a-50f07b23f196` | pipeline-write.service.ts:39 | ✅ |
| 21 | DocumentTemplate | `d2493bf7-f28d-5d26-8858-58062d402012` | pipeline-write.service.ts:42 | ✅ |
| 22 | DocumentInstance | `3e1d232f-3105-535e-8ef5-70cb0f80d65f` | pipeline-write.service.ts:43 | ✅ |
| 23 | FormSubmission | `179bd4b1-d1b1-5afc-99be-a5465a662ec6` | pipeline-write.service.ts:46 | ✅ |

## Drift-detection guards

The Wave 3 spec block ships with two extra assertions designed to
catch silent regressions:

1. `expect(CASES).toHaveLength(23)` — if a new class is added to
   `SME_MART_CLASS_IDS` but the test table is not updated, this
   length check fails. Any future class-id must be paired with a
   row in this round-trip suite.
2. `expect(new Set(uuids).size).toBe(23)` and the matching name set
   check — if a copy-paste creates two classes with the same UUID
   or two registry keys with the same name, the duplicates assertion
   blows up before anything ships.

The combination converts a class drifted at runtime (silent receiver
acceptance into the wrong partition) into a unit-test regression at
PR review time.

## Field-mapping roundtrip specs (orthogonal coverage)

Nine entities also have field-level Neon ↔ GQL roundtrip specs from
the Phase 5 migration, kept as-is:

| Spec | Class |
|---|---|
| `bid.roundtrip.spec.ts` | Bid |
| `bid-response.roundtrip.spec.ts` | BidResponse |
| `document.roundtrip.spec.ts` | SmeMartDocument |
| `engagement.roundtrip.spec.ts` | Engagement |
| `note.roundtrip.spec.ts` | Note |
| `note-folder.roundtrip.spec.ts` | NoteFolder |
| `review.roundtrip.spec.ts` | Review |
| `service-offering.roundtrip.spec.ts` | ServiceOffering |
| `vendor-profile.roundtrip.spec.ts` | MarketplaceProfileItem |

The remaining 14 classes (Phase 6+ Bloom + Plan 14/15/16 entities)
are greenfield — they were built directly on Pipeline+GQL with no
prior Neon table, so there is no Neon→GQL transformation to validate.
The Wave 3 class-id round-trip block above is the canonical coverage
gate for these.

## Errata filed

**None.** All 23 IDs round-trip cleanly through the receiver-mock
path with the canonical UUIDs. No fictional consts, no drift.

## Related

- [`AUDIT.md`](AUDIT.md) — Class-ID Verification Table (Wave 1
  platform check)
- [`DECISIONS.md`](../../director/DECISIONS.md) — "Platform-Assigned
  Class IDs Are the Convention; Mistaken UUID v5 Form Was the
  Errata" (resolves errata 023)
- `src/app/core/services/pipeline-write.service.spec.ts` — the live
  round-trip suite
