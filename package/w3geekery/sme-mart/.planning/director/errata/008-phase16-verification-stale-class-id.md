---
id: "008"
severity: low
phase: 16
found: 2026-04-14
status: open
---

# Phase 16 — VERIFICATION.md references old FormSubmission class ID

`16-VERIFICATION.md:61` still documents the FormSubmission class ID as `af7eb14f-d2f0-59e3-8371-9e436b7a1bc2`:

> `pipeline-write.service.ts` | Class ID registration for FormSubmission | ✓ VERIFIED | FormSubmission UUID `af7eb14f-d2f0-59e3-8371-9e436b7a1bc2` registered in `SME_MART_CLASS_IDS` constant (line 46).

The correct live ID is `179bd4b1-d1b1-5afc-99be-a5465a662ec6` (retrieved via `platform.Class.getClass` when UAT schema went live 2026-04-14). Code was corrected in commit 69a2da8; the closeout update at the bottom of VERIFICATION.md also reflects the correct ID.

**Root cause:** The verified-artifacts table was filled in before the class ID correction landed. When the closeout section was appended, the middle-of-document reference was not updated — only the summary at the bottom.

**Impact:** Low — anyone reading the artifacts table linearly will see the wrong ID, catch the correction only if they read the closeout. Could mislead future debugging if someone greps VERIFICATION.md for the class ID.

**Fix:** Replace line 61's `af7eb14f-d2f0-59e3-8371-9e436b7a1bc2` with `179bd4b1-d1b1-5afc-99be-a5465a662ec6` and note the correction inline: *"(corrected 2026-04-14 — prior executor value was wrong)"*.

**Category:** Doc drift. Not a process failure — just stale text. Worth one minute to fix.
