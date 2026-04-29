# Smoke Test: RFP Wizard — Create Flow (Phase 2)

## Setup

- **URL:** `http://localhost:4200`
- **Screenshots dir:** `/Users/cstacer/Pictures/Screenshots/`
- **Screenshot prefix:** `smoke-test-rfp-wizard-step`

## Steps

### 1. Navigate to wizard

1. `navigate_page` → `http://localhost:4200/rfps/new`
2. `wait_for` → ["Create RFP"]
3. `take_snapshot` — verify stepper has 5 labels: Basics, Documents, Requirements, Terms, Review
4. `take_screenshot` → `smoke-test-rfp-wizard-step1-basics.png`
5. **PASS:** Page loads, stepper visible with 5 steps, Basics step active

### 2. Fill Step 1 — Basics + RFP Tag

1. `take_snapshot` — find Title, Description, Category, RFP Tag field UIDs
2. `fill` Title → "CDPH Security Modernization - Smoke Test v2"
3. `fill` Description → "Phase 2 smoke test: requirements, eval criteria, RFP tag"
4. `fill` Category → select first available option
5. `take_snapshot` — confirm form is populated AND RFP Tag field shows a word-word value (prefixed with "sme-mart.rfp.")
6. Note the suggested RFP tag identifier value
7. `click` the "Next" button
8. `wait_for` → ["Upload Procurement Documents"]
9. `take_screenshot` → `smoke-test-rfp-wizard-step2-documents.png`
10. **PASS:** Form accepted, RFP tag visible, stepper advanced to Documents

### 3. Skip Step 2 — Documents

1. `take_snapshot` — find Skip/Next button
2. `click` "Skip" button
3. `wait_for` → ["Define Requirements"]
4. `take_screenshot` → `smoke-test-rfp-wizard-step3-requirements.png`
5. **PASS:** Stepper shows Requirements, two-panel layout visible

### 4. Add task types + requirements (Step 3)

1. `take_snapshot` — verify two-panel layout: left (Task Types) + right (empty state)
2. `click` the add (+) button in the Task Types header
3. `take_snapshot` — verify menu shows available types (Security, Compliance, etc.)
4. `click` "Security Requirements" menu item
5. `take_snapshot` — verify "Security Requirements" appears in left panel, right panel shows empty state
6. `click` "Add Requirement" button
7. `take_snapshot` — verify expansion panel appears with "New Requirement"
8. `fill` the requirement Title → "Multi-factor authentication for all users"
9. `fill` Description → "All system users must authenticate via MFA"
10. `take_snapshot` — confirm requirement fields populated
11. `take_screenshot` → `smoke-test-rfp-wizard-step4a-requirement.png`
12. `click` the add (+) button again → add "Compliance Requirements"
13. `take_snapshot` — verify 2 groups in left panel, badge shows "1" on Security
14. `click` "Next"
15. `wait_for` → ["Terms"]
16. `take_screenshot` → `smoke-test-rfp-wizard-step4b-requirements-done.png`
17. **PASS:** Task types added, requirement created with fields, badge counts correct

### 5. Fill Step 4 — Terms + Evaluation Criteria

1. `take_snapshot` — find date fields, confidentiality textarea, "Add Criterion" button
2. Use `evaluate_script` to set Response Deadline → "2026-04-15" (native date input)
3. `fill` Confidentiality Requirements → "NDA required before document access"
4. `click` "Add Criterion" button
5. `take_snapshot` — find criterion Name, Weight, Description fields
6. `fill` criterion Name → "Technical Approach"
7. `fill` criterion Weight → "40"
8. `click` "Add Criterion" again
9. `fill` second criterion Name → "Cost"
10. `fill` second criterion Weight → "30"
11. `take_snapshot` — verify weight warning shows "70%" (should be 100%)
12. `take_screenshot` → `smoke-test-rfp-wizard-step5-terms.png`
13. `click` "Next"
14. `wait_for` → ["Review & Publish"]
15. **PASS:** Terms filled, evaluation criteria added, weight validation shown

### 6. Verify Review content

1. `take_snapshot` — check for:
   - "CDPH Security Modernization - Smoke Test v2" (title)
   - Category value present
   - RFP Tag line showing `sme-mart.rfp.{word-word}`
   - "1 across 2 groups" (requirements summary)
   - "Security Requirements" with "1 requirements"
   - "Compliance Requirements" with "0 requirements"
   - "Technical Approach" + "40%" (evaluation criterion)
   - "Cost" + "30%" (evaluation criterion)
   - "Publish RFP" button
   - "Save as Draft" button
2. `take_screenshot` → `smoke-test-rfp-wizard-step6-review-detail.png`
3. **PASS:** All summary fields render including requirements tree, eval criteria, RFP tag

### 7. Save as Draft

1. `click` "Save as Draft"
2. `wait_for` → ["Draft saved"] (snackbar) — timeout 5s OK
3. `take_screenshot` → `smoke-test-rfp-wizard-step7-draft-saved.png`
4. Note the draft ID from the URL if redirected to `/rfps/:id`
5. **PASS:** No errors, draft saved confirmation

### 8. Check console errors

1. `list_console_messages` filtered to `["error"]`
2. Report any errors found
3. **PASS:** Zero console errors (or only expected warnings)

### 9. Resume draft

1. If draft ID captured in step 7, `navigate_page` → `http://localhost:4200/rfps/{id}/edit`
2. `wait_for` → ["Create RFP"]
3. `take_snapshot` — verify:
   - Title pre-populated with "CDPH Security Modernization - Smoke Test v2"
   - RFP Tag field shows the same word-word identifier from step 2
4. `take_screenshot` → `smoke-test-rfp-wizard-step9-resume.png`
5. **PASS:** Wizard loads, form data hydrated including RFP tag

## Report

After all steps, output:

```
| Step | Name                     | Status | Notes |
|------|--------------------------|--------|-------|
| 1    | Navigate to wizard       |        |       |
| 2    | Fill basics + RFP tag    |        |       |
| 3    | Skip documents           |        |       |
| 4    | Add requirements         |        |       |
| 5    | Fill terms + eval criteria |      |       |
| 6    | Verify review            |        |       |
| 7    | Save as draft            |        |       |
| 8    | Console errors           |        |       |
| 9    | Resume draft             |        |       |
```

**Verdict:** X of 9 PASSED

## Cleanup

Report the draft RFP ID. Do NOT delete — useful for DB verification.
