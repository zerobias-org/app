# UAT Migration Tracker — ✅ COMPLETE (2026-03-30)

CI/dev (`ci.zerobias.com`) was nuked and rebuilt with hydra. UAT (`uat.zerobias.com`) is our temporary CI/dev replacement. All migration steps verified complete 2026-03-30.

**UAT Credentials (Clark Stacer):**
- API Key: `660e553e-b2b4-4972-b8e3-c9cd9617f101`
- Org: Zerobias Operations (`d2216703-f63b-5281-87c0-5eaa892fbec5`)

---

## Migration Checklist

### 1. Boundary

| Entity | CI Value | UAT Value | Status |
|--------|----------|-----------|--------|
| Boundary name | W3Geekery Dev | **SME Marketplace** | ✅ Migrated 2026-03-24 |
| Boundary ID | `b1e4b97e-6ef2-4e7e-8dbc-c3750fb9306e` | **`e3871f0b-56f0-4e5e-87c6-6ca196bf88c7`** | ✅ Migrated 2026-03-24 |
| Old UAT boundary | — | `7c43e376-...` (W3Geekery Testing) | ⚠️ Superseded — tasks orphaned there |

### 2. Activity

Activities are platform-global (same IDs across all environments). Confirmed via `platform.Activity.list` on UAT.

| Entity | CI Value | UAT Value | Status |
|--------|----------|-----------|--------|
| Activity name | Ad Hoc Activity - One person | Ad Hoc Activity - One person | ✅ Same |
| Activity ID | `e15830c8-4274-4d67-bf9b-c22b60001e32` | `e15830c8-4274-4d67-bf9b-c22b60001e32` | ✅ Same |

### 3. Tags (hydra)

All tags follow the pattern `sme-mart.eng.<codename>`. Created via `hydraClient.getTagApi().createTag()` with `ownerId` = Zerobias org ID for org-scoped tags.

**Note:** Tags were originally created under ZB Operations org (wrong org). Recreated 2026-03-23 under Zerobias org (`57c741cf-...`). Old ZB-Ops IDs in "Old UAT" column.

| Tag Name | CI Tag ID | Old UAT (ZB-Ops) | UAT Tag ID (Zerobias org) | Status |
|----------|-----------|-------------------|---------------------------|--------|
| `sme-mart.eng.crystal-harbor` | `518acc1c-...` | `b4c97483-...` | `e1864514-af28-4397-93a5-f05e443b05cb` | ✅ Recreated |
| `sme-mart.eng.velvet-summit` | `e07c3ee5-...` | `0630ad1b-...` | `355a0e23-e22b-4622-b186-08e860513de6` | ✅ Recreated |
| `sme-mart.eng.amber-circuit` | `aacd35bd-...` | `b244cd6c-...` | `49e67643-85da-44b0-a47a-c67c56a4d2d7` | ✅ Recreated |
| `sme-mart.eng.silver-bridge` | `b3b590d8-...` | `29ab33e0-...` | `ba599b51-6d87-4c46-9c98-05244a928cc9` | ✅ Recreated |
| `sme-mart.eng.coral-meadow` | `49cbb0b8-...` | `b8e84e56-...` | `3b2e84a6-52bc-41d7-8e8c-5e78e65a033c` | ✅ Recreated |

### 4. Tasks

All tasks created in boundary above, activity above, status `in_progress`, workflow "Software Development Lifecycle". Each task is tagged with its corresponding engagement tag.

| Task Code | Task Name | CI Task ID | UAT Task ID (SME Marketplace) | Status |
|-----------|-----------|------------|-------------------------------|--------|
| `aha1-1` | SOC 2 Readiness Assessment | `223318eb-...` | `abc5d715-b97d-4c76-a24b-95c643b68795` | ✅ Recreated 2026-03-24 |
| `aha1-2` | NIST CSF Gap Analysis | `f30ffe2b-...` | `c3b5fc15-2cf3-406d-961b-570f78689821` | ✅ Recreated 2026-03-24 |
| `aha1-3` | Compliance Automation Setup | `4a3ad32b-...` | `3a6799c6-65ea-4833-9cf9-3f739f0fe587` | ✅ Recreated 2026-03-24 |
| `aha1-4` | FedRAMP Authorization Support | `67659347-...` | `900dfe93-ad93-4c02-996c-a8c13700e8ab` | ✅ Recreated 2026-03-24 |
| `aha1-5` | ISO 27001 Evidence Collection | `46cf4833-...` | `d9895a40-38a4-4dad-9e8a-6ee588104cf0` | ✅ Recreated 2026-03-24 |

Old task IDs (W3Geekery Testing boundary, ZB-Ops org): `fafe9c00-...`, `9d4a93a9-...`, `9ab5a79a-...`, `127dfed5-...`, `43bcbbfd-...` — orphaned, can be cleaned up later.

### 5. Hub Module Connection (Generic SQL)

| Entity | CI/QA Value | UAT Value | Status |
|--------|-------------|-----------|--------|
| Connection name | SQL Connector Connection 1 | N/A | ⏸️ Skipped — using `dbMode: 'neon'` (direct Neon HTTP) |
| Connection ID | `e3c874f5-5fd8-4fbc-8120-19861e28b19e` | N/A | ⏸️ Hub Module not active |
| Module | `@auditlogic/module-auditmation-generic-sql` | same | — |
| Connector Version | 0.5.0 | latest | — |
| Neon JDBC URL | `jdbc:postgresql://ep-aged-fog-af9wu771...` | same DB | — |

### 6. Config Files to Update After Migration

Once UAT IDs are created, update these files:

| File | What to update |
|------|----------------|
| `src/environments/environment.ts` | `smeMartConnectionId` → new UAT connection ID |
| `src/environments/environment.vercel.ts` | `smeMartConnectionId` → new UAT connection ID |
| `middleware.ts` | Already defaults to `uat.zerobias.com` ✅ |
| `vercel.env` | `ZB_API_KEY`, `ZB_ORG_ID` → UAT values (for Vercel deploy) |
| `.claude/notes/demo-data-guide.md` | All tag IDs, task IDs, boundary ID → UAT values |

---

## Neon Database (No Migration Needed)

Neon DB is independent of ZeroBias environment — same database across CI/QA/UAT/Prod.

| Entity | Value | Notes |
|--------|-------|-------|
| Project ID | `square-meadow-76427985` | Stays the same |
| Database | `neondb` | Stays the same |
| Endpoint | `ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech` | Stays the same |
| Connection string | in `.env.local` | No change needed |

---

## Migration Order

1. **Boundary** — create first (tasks need a boundary) ✅ Done
2. **Activity** — platform-global, same ID everywhere ✅ No migration needed
3. **Tags** — create via hydra API ✅ Done (5 tags created 2026-03-13)
4. **Tasks** — create in boundary + activity, tag each ✅ Done (5 tasks created + tagged 2026-03-13)
5. **Hub Connection** — ⏸️ Skipped (using `dbMode: 'neon'`, Hub Module not active)
6. **Update configs** — Neon DB rows + demo-data-guide + tracker updated ✅ Done
7. **Verify** — `npm run dev` loads against UAT ✅ Done (2026-03-13). Fixed: Neon timestamp bug, documents-tab sub init. PKV 500s are UAT platform issue (not our code).

---

### 7. GQL Schema (AuditgraphDB)

Schema class IDs are **deterministic** (derived from YAML content) — same across all environments (prod, UAT, CI). No per-environment class ID mapping needed.

| Entity | Class ID | Status |
|--------|----------|--------|
| Engagement | `7711aa41-e55b-5cda-9b7a-35844a2006a1` | ✅ Live on UAT |
| Bid | `ccddd2e5-e455-585e-9bb7-902903228b0d` | ✅ Live on UAT |
| BidResponse | `a024a0b5-50df-59cc-ba8e-25fcd82f69c3` | ✅ Live on UAT |
| ServiceOffering | `ff689173-4787-52c5-808b-6b2435a625a7` | ✅ Live on UAT |
| Note | `fe7c58a9-c13b-5a4b-817f-5c4b419ed28c` | ✅ Live on UAT |
| NoteFolder | `4d50975e-d4dc-5654-8e43-f3c5da01f49d` | ✅ Live on UAT |
| Review | `ef5d821a-46f5-5f44-8e59-0854777d803c` | ✅ Live on UAT |
| SmeMartDocument | `e1497ca8-a621-57f6-9263-f9a19fea3c34` | ✅ Live on UAT |
| SmeMartProject | `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03` | ✅ Live on UAT |
| SmeMartBoard | `20be589b-194e-5227-ba6e-c7edae42f34b` | ✅ Live on UAT |
| SmeMartActivity | `36405d75-76f1-5f4b-ab3b-22c562d41e07` | ✅ Live on UAT |
| SmeMartWorkflow | `295938d2-5c63-5140-a945-2ba28b88b268` | ✅ Live on UAT |
| SmeMartTask | `e15f1e0a-1bc9-5002-b4bc-3482d4499561` | ✅ Live on UAT |
| ProjectPrd | `920fca70-4dcf-5d9e-ba16-1dfd0f8061f0` | ✅ Live on UAT |
| PrdSection | `d30445f3-e26d-5153-83be-fe810f63220c` | ✅ Live on UAT |
| ProjectPlan | `bc6159da-19a3-51d0-89a8-f2147078c760` | ✅ Live on UAT |
| PlanMilestone | `ac1a1cc8-db44-5c1d-b359-5fb02e3d381d` | ✅ Live on UAT |

**Key insight:** Class IDs are deterministic UUIDs from schema YAML — same across all ZB environments. Pipeline IDs are NOT — they're per-environment.

### 8. Receiver Pipeline (AuditgraphDB)

| Entity | Prod Value | UAT Value (SME Marketplace) | Status |
|--------|------------|----------------------------|--------|
| Pipeline name | SME Mart Entity Pipeline | SME Mart Entity Pipeline | ✅ Recreated 2026-03-24 |
| Pipeline ID | `091d5068-0527-4f45-9839-37f6d5c1669e` | **`f6d1f579-fe02-4158-b99e-a55113fd70cb`** | ✅ Recreated 2026-03-24 |
| Boundary | Platform (`2842fab1-...`) | **SME Marketplace (`e3871f0b-...`)** | ✅ Migrated |
| Org | Zerobias (`57c741cf-...`) | Zerobias (`57c741cf-...`) | ✅ Same |
| Boundary Product ID | `94f0b2f2-...` | **`4927da5d-86b2-4ab8-a1b2-9ffa9ce2a341`** | ✅ Already existed |
| Execution Mode | `receiver` | `receiver` | — |
| Batch Mode | `differential` | `differential` | — |

Old pipeline ID (Platform boundary): `591861da-0eac-45b3-ad1c-eb4e46734402` — superseded.

---

## Notes

- UAT uses **hydra** for tags/resources (same as what CI will eventually use)
- Tag creation on UAT should use `hydraClient.getTagApi().createTag()` — no more `danaOld` path
- Task→Tag linking uses `hydraClient.getResourceApi()` for resource tagging
- Neon `work_requests` rows updated with UAT tag/task IDs ✅ (all 5 verified 2026-03-30)
