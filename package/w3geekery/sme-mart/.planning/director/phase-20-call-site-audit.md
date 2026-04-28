# Phase 20 — `pushEntity` / `pushEntities` Call-Site Audit (Director Pre-Pass)

**Audit date:** 2026-04-28
**Auditor:** Director Parks (instance #2)
**Method:** `grep -rn "pushEntity\|pushEntities" src/ --include="*.ts"` minus `pipeline-write.service.ts`, `test-helpers/`, `*.spec.ts`. Each line manually classified by call shape (`await ...` vs `....catch(err => console.error)`) and entity criticality.
**Total:** 60 call sites — **44 fire-and-forget** (`.catch(err => console.error)`) + **16 already awaited**.

This is a director-pre-pass to seed Phase 20's actual audit (deliverable 1 of the phase). The Phase 20 audit task must re-verify each classification against the real call shape (user-initiated vs background) and the call site's surrounding error/UX handling. Numbers and ratings here are starting points, not final.

---

## Summary by Criticality

| Criticality | Count (FF) | Count (awaited) | Notes |
|---|---|---|---|
| **CRITICAL** — user-visible loss (user thinks "saved", didn't) | 33 | 5 | Bids, profile, vetting, reviews, docs, engagements, offerings, tasks, PRDs, plans |
| **MEDIUM** — collaboration loss / partial state | 9 | 0 | Notes, folders, workflows, hierarchy |
| **LOW** — telemetry / activity log | 2 | 0 | SmeMartActivity |
| **AWAITED — admin/seed only** | 0 | 11 | DemoData, DocumentTemplate, DocumentInstance |
| **TOTAL** | 44 | 16 | |

---

## CRITICAL — Fire-and-forget user-action call sites (33)

User clicks a save/submit/upload/send button. Service writes via `pushEntity(...).catch(err => console.error(...))`. The user sees no error if validation fails or the call rejects. **This is the errata 011 + errata 023 silent-failure surface.**

| # | file:line | className | Action (likely) | Notes |
|---|---|---|---|---|
| 1 | `vendor-profile.service.ts:149` | MarketplaceProfileItem | Profile save (legalName / DBA / contact / etc.) | **CONFIRMED SILENT-FAILING** until Plan 26-04 corrected the const. Errata 023. |
| 2 | `vendor-profile.service.ts:204` | MarketplaceProfileItem | Profile section update | Same — errata 023. |
| 3 | `vendor-profile.service.ts:232` | MarketplaceProfileItem | Profile section delete (markDeleted) | Same — errata 023. |
| 4 | `vetting.service.ts:184` | EngagementVettingItem | `initializeVetting` (batch) | **CONFIRMED SILENT-FAILING** pre-Plan 26-04. Errata 023. |
| 5 | `vetting.service.ts:226` | EngagementVettingItem | Status transition | Same — errata 023. |
| 6 | `vetting.service.ts:283` | EngagementVettingItem | Detail edit | Same — errata 023. |
| 7 | `vetting.service.ts:309` | EngagementVettingItem | Status transition (alt path) | Same — errata 023. |
| 8 | `bids.service.ts:368` | Bid | **Submit Bid / save Bid draft** | Highest-impact CRITICAL. Bid submission is core business flow. |
| 9 | `reviews.service.ts:143` | Review | Review submit | User posts review of provider. |
| 10 | `reviews.service.ts:180` | Review | Review update | |
| 11 | `reviews.service.ts:216` | Review | Review state transition | |
| 12 | `engagements.service.ts:172` | Engagement | Engagement create | User "creates engagement" expects it to exist. |
| 13 | `engagements.service.ts:193` | Engagement | Engagement update | |
| 14 | `service-offerings.service.ts:109` | ServiceOffering | Offering create | Provider lists service. |
| 15 | `service-offerings.service.ts:139` | ServiceOffering | Offering update | |
| 16 | `rfp-invitation.service.ts:286` | RfpInvitation | RFP invitation send | User expects providers were notified. |
| 17 | `org-document.service.ts:132` | SmeMartDocument | Document upload save | After file lands in S3, metadata write. |
| 18 | `org-document.service.ts:271` | SmeMartDocument | Document metadata update | |
| 19 | `org-document.service.ts:282` | SmeMartDocument | Document re-classify | |
| 20 | `org-document.service.ts:302` | SmeMartDocument | Document delete (markDeleted) | |
| 21 | `project-prd.service.ts:76` | ProjectPrd | PRD create | |
| 22 | `project-prd.service.ts:164` | ProjectPrd | PRD update | |
| 23 | `project-prd.service.ts:216` | PrdSection | PRD section create | |
| 24 | `project-prd.service.ts:270` | PrdSection | PRD section update | |
| 25 | `project-plan.service.ts:77` | ProjectPlan | Plan create | |
| 26 | `project-plan.service.ts:165` | ProjectPlan | Plan update | |
| 27 | `project-plan.service.ts:217` | PlanMilestone | Milestone create | |
| 28 | `project-plan.service.ts:271` | PlanMilestone | Milestone update | |
| 29 | `sme-mart-task.service.ts:82` | SmeMartTask | Task create | **Brian P0 partition work — must not silently lose tasks.** |
| 30 | `sme-mart-task.service.ts:247` | SmeMartTask | Task update | |
| 31 | `sme-mart-project.service.ts:353` | SmeMartProject | Project create/update | |
| 32 | `sme-mart-board.service.ts:59` | SmeMartBoard | Board create | |
| 33 | `sme-mart-board.service.ts:152` | SmeMartBoard | Board update | |

## MEDIUM — Fire-and-forget collaboration call sites (9)

Failure leaves collaborative state inconsistent (note missing on next reload, folder didn't move, workflow definition didn't update). Less acute than CRITICAL but still user-visible eventually.

| # | file:line | className | Action |
|---|---|---|---|
| 34 | `notes.service.ts:52` | Note | Create note |
| 35 | `notes.service.ts:89` | Note | Update note |
| 36 | `notes.service.ts:118` | Note | Delete note (markDeleted) |
| 37 | `note-hierarchy.service.ts:147` | Note | Hierarchy reparent |
| 38 | `note-folder.service.ts:107` | NoteFolder | Folder create |
| 39 | `note-folder.service.ts:230` | NoteFolder | Folder update / move |
| 40 | `note-folder.service.ts:260` | NoteFolder | Folder delete |
| 41 | `sme-mart-workflow.service.ts:53` | SmeMartWorkflow | Workflow create (admin) |
| 42 | `sme-mart-workflow.service.ts:140` | SmeMartWorkflow | Workflow update (admin) |

## LOW — Fire-and-forget telemetry call sites (2)

Activity-log writes. Idempotent in practice; a missed activity row doesn't corrupt user-visible state. Telemetry is the legitimate use of fire-and-forget.

| # | file:line | className | Action |
|---|---|---|---|
| 43 | `sme-mart-activity.service.ts:57` | SmeMartActivity | Activity log write |
| 44 | `sme-mart-activity.service.ts:146` | SmeMartActivity | Activity log write (alt) |

---

## AWAITED — already correct pattern (16)

These call sites use `await this.pipelineWrite.pushEntities(...)` (or `pushEntity`) without a `.catch`. Errors propagate to the caller, which can surface them. Phase 20 should still **verify the caller actually surfaces the error to the user** (an `await` that throws into a context that swallows the throw is no better than `.catch(console.error)`).

| # | file:line | className | Notes |
|---|---|---|---|
| 45 | `document-instance.service.ts:143` | DocumentInstance | User-initiated save of doc instance. Verify caller surface. |
| 46 | `document-instance.service.ts:204` | DocumentInstance | Update. Verify caller surface. |
| 47 | `document-template.service.ts:63` | DocumentTemplate | Template create (admin/user). Verify surface. |
| 48 | `document-template.service.ts:84` | DocumentTemplate | Template update. Verify surface. |
| 49 | `form-submission.service.ts:67` | FormSubmission | Form submit — **CRITICAL flow already done right.** |
| 50 | `form-submission.service.ts:167` | FormSubmission | Form submit alt path. |
| 51 | `bid-response.service.ts:83` | BidResponse | Bid response — **CRITICAL flow already done right.** |
| 52 | `demo-data.service.ts:178` | Engagement (demo seed) | Admin tool — UI surfaces success/fail in the demo runner. |
| 53 | `demo-data.service.ts:189` | SmeMartProject (demo) | " |
| 54 | `demo-data.service.ts:200` | Bid (demo) | " |
| 55 | `demo-data.service.ts:211` | BidResponse (demo) | " |
| 56 | `demo-data.service.ts:222` | Note (demo) | " |
| 57 | `demo-data.service.ts:233` | NoteFolder (demo) | " |
| 58 | `demo-data.service.ts:244` | SmeMartDocument (demo) | " |
| 59 | `demo-data.service.ts:255` | ServiceOffering (demo) | " |
| 60 | `demo-data.service.ts:266` | Review (demo) | " |

---

## Class-ID Risk Cross-Check

Per errata 023 audit (2026-04-28), all 23 `SME_MART_CLASS_IDS` entries were verified against `platform.Class.getClass(<name>)` on UAT. The two fictional consts (MPI, EngagementVettingItem) were corrected by Plan 26-04 (commit `b1e997b`). **No other consts in `pipeline-write.service.ts:10-47` are fictional as of 2026-04-28.**

Phase 20's audit task should still re-run `platform.Class.getClass` against every const at audit time as a safety check — especially for any new className added between 2026-04-28 and Phase 20 execution. Watch pattern from DECISIONS.md ("Platform-Assigned Class IDs Are Not Deterministic UUID v5") applies to any new entry.

## Remediation Complexity Hints (preliminary — Phase 20 audit refines)

These are starting estimates; the Phase 20 audit task must verify each by reading the actual service + caller component:

- **SIMPLE** (replace `.catch(console.error)` with `await` + `MatSnackBar` toast on rejection): notes, note-folders, activity, workflow admin, possibly board/project metadata.
- **MEDIUM** (need new error state in form, retry/dirty UI, or re-enable submit button): bids, profile, vetting, reviews, RFP invitations, service offerings, engagements, tasks, PRDs, plans, documents.
- **COMPLEX** (re-architect optimistic-UI flow, retry queue, or rollback semantics): unlikely for any of these but called out as a possibility for `bids.service.ts:368` and `vetting.service.ts:184` (batch).

Phase 20 is **opportunistic remediation**: apply the SIMPLE fixes in the same phase; file backlog entries for MEDIUM/COMPLEX and let v1.5 prioritize.

---

## What this audit does NOT cover

- Whether `await` callers actually surface errors to users (still needs verification — see AWAITED section).
- Component-level error UX (where the toast/banner/inline-error should land for each CRITICAL call site).
- Telemetry sink choice (CloudWatch / posthog / console-only) — that's Phase 20 deliverable 2.
- Cross-cutting service `pushBatch` / multi-class atomic writes — none observed; all current call sites are single-class.
