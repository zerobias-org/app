# i18n — zb/ui en.json Analysis

> **Source:** `~/Projects/zb/ui/projects/zb-ui-lib/src/lib/assets/i18n/en.json`
> **Date:** 2026-04-09
> **Purpose:** Inform SME Mart i18n conventions — what to keep, what to avoid
> **Stack:** `@ngx-translate/core` ^15, `@ngx-translate/http-loader` ^17 (both already in SME Mart package.json, unused)

---

## Raw Stats

| Metric | Value |
|---|---|
| File size | 265 KB |
| Lines | 6,846 |
| Total leaf keys | 5,195 |
| **Unique values** | **3,050 (41% duplication)** |
| Top-level namespaces | 31 |
| Max nesting depth | 6 levels |
| Interpolated values | 307 (~6%) |
| ICU message format | ~12 (basically none — mostly manual `{{pluralStr}}` hacks) |

### Biggest namespaces by leaf count

| Namespace | Leaves | Depth |
|---|---|---|
| BoundaryManager | 1,078 | 5 |
| Dialogs | 732 | 3 |
| Generic | 658 | 3 |
| ConnectionManager | 277 | 5 |
| Administration | 247 | 4 |
| Resources | 217 | 2 |
| Inventory | 215 | 3 |
| CatalogApp | 213 | 4 |
| AuditRoom | 196 | 5 |
| Designer | 165 | 4 |
| Scheduler | 152 | 5 |

---

## Problems Found

### 1. Massive duplication (CRITICAL)

41% of leaf values are duplicates. Basic common words get re-defined in every namespace:

| Word | Occurrences |
|---|---|
| Name | **68** |
| Description | **60** |
| Status | **43** |
| Created | 27 |
| Type | 25 |
| Search by keyword | 24 |
| Details | 22 |
| Enter search term | 22 |
| Tags | 20 |
| Updated | 18 |
| Version | 18 |
| Connections | 17 |
| Admin Status | 16 |

**Impact:** Translators pay to translate "Name" 68 times. Maintenance updates must hunt down every duplicate. Consistency drifts naturally.

**Root cause:** `Common` section exists but it is NOT filled with actually-common words. `Common` contains `UserSwitcher` (component-specific) and `EvidenceViewer` (component-specific). It's named "Common" but used as a namespace, not a shared vocabulary.

### 2. `Common` is mis-used as a namespace, not shared vocab

`Common.EvidenceViewer.ChainOfCustodyTab.Name` — 4 levels deep just for the word "Name", while "Name" itself gets duplicated 68 times in other namespaces. The pattern is backward.

### 3. Capitalization inconsistency

Same English word appears in multiple case forms across the file — at least 38 distinct words:

- `About this Organization` vs `About This Organization`
- `Chain Of Custody` vs `Chain of Custody`
- `Clear filter` vs `Clear Filter`
- `Create New Boundary` vs `Create new Boundary`
- `Create New Tag` vs `Create new tag` vs `Create new Tag` (3 variants)
- `Created` vs `created`
- `Draft` vs `DRAFT`
- `Disabled` vs `disabled`

Translators have to translate the same concept multiple times — or will translate one and miss the others, leaving mixed-case in production.

### 4. Over-nesting (up to 6 levels deep)

Deeply nested paths like `Assessment.Dialogs.AssessmentAssign.Title` or `Common.EvidenceViewer.ChainOfCustodyTab.BatchId`. The deeper the nesting, the more fragile — rename a component and the key has to change. The key becomes coupled to implementation structure.

### 5. Manual plural hack (`{{pluralStr}}`)

```json
"AssessmentAssign": {
  "Title": "Assign Evidence Assessment{{pluralStr}}",
  "Message": "Please confirm you want to assign {{username}} to the selected evidence assessment record{{pluralStr}}."
}
```

This is not a real pluralization — it's a placeholder that gets `""` or `"s"` injected. It doesn't work for:
- Languages where plural rules differ (Russian has 3 plural forms, Polish has 3, Arabic has 6)
- Singular vs plural verb agreement ("1 record is" vs "5 records are")
- Languages where the plural suffix isn't just an "s"

**Correct approach:** Use ICU MessageFormat via `@ngx-translate/messageformat-compiler`:

```json
"AssignedRecords": "{count, plural, one {1 record} other {# records}}"
```

Only ~12 of 307 interpolated values look like they might use ICU. The rest are manual.

### 6. Inconsistent punctuation

- **245** sentences (>20 chars) end with a period.
- **1,114** sentences (>20 chars) do NOT end with a period.

No rule. Some descriptions end with `.`, some don't. Buttons usually don't. Empty-state messages are a mix.

### 7. Mixed vocabulary granularity

Some keys are single words (`Name`, `Tags`). Some are full paragraphs (415-character message in `Scheduler.DataCollectionRequests...`). No guidance on where to break long copy into smaller reusable pieces vs keep as one blob.

### 8. Duplicated nested structures

`Scheduler.DataCollectionRequests.DataCollections.CollectionStatusCompletedMessage` and `BoundaryManager.DataCollectionRequests.DataCollections.CollectionStatusCompletedMessageFile` are **character-identical 327-char messages**. They were copied and pasted into two namespaces.

### 9. No interpolation variable conventions

Examples from the file:
- `{{name}}` — lowercase
- `{{count}}` — lowercase
- `{{value}}` — generic
- `{{label}}` — generic
- `{{username}}` — snake-like compound
- `{{typeLabel}}` — camelCase
- `{{pluralStr}}` — camelCase + cryptic abbreviation
- `{{format}}` — lowercase
- `{{date}}` — lowercase

No rule for naming. Some are domain-specific (`username`, `typeLabel`), others are generic (`value`, `label`). Translators don't know which value they'll receive.

### 10. No comments / context for translators

JSON doesn't support comments, but the file has zero inline hints about context. A translator seeing `"Status": "Status"` under `Administration.Teams` has no idea if this is a column header, a filter dropdown label, or a user-visible state name. Industry-standard formats like XLIFF, Fluent, or even `.po` allow translator notes.

### 11. English-only assumption baked into keys

Keys like `BoundaryManager.NoData.NoObjectDetailsAsof` use English phrases as the identifier. When translated to languages with different sentence structure (German, Japanese), the key name no longer describes the translated output. Keys should be **semantic** (`boundary_manager.empty_state.no_object_details_as_of`) not English-derived.

---

## What zb/ui Gets Right

Fair credit — not everything is bad:

1. **PascalCase is consistent** (99.8% of leaf keys) — at least there's ONE convention, even if it's not the best choice (snake_case or kebab-case scales better in CI/grep workflows).
2. **Top-level namespaces match apps** (`BoundaryManager`, `AuditRoom`, `CatalogApp`) — this IS reasonable for a multi-app portal.
3. **Single file per locale** — not split across 20 files. Easier to diff, easier to search.
4. **Interpolation works** (307 values use `{{var}}`) — the basic feature is wired up even if ICU is mostly unused.
5. **Some namespaces have internal structure** (`Dialogs.ImplementationStatement` has 72 keys scoped to one dialog) — localized scoping exists, just not enforced.

---

## Recommendations for SME Mart

### Structural

1. **Flatten aggressively.** Maximum 3 levels deep. `domain.section.key` not `domain.subdomain.section.subsection.key`.

2. **True `common` is shared vocabulary, not a namespace.** Put `common.name`, `common.description`, `common.status`, `common.cancel`, `common.save`, `common.delete`, `common.loading`, `common.empty_state_default` etc. at the top. Every component reuses them instead of re-declaring.

3. **Per-feature namespaces for app-specific copy.** `engagement.*`, `rfp.*`, `project.*`, `vendor_profile.*`, `transparency.*`. Not per-component — per feature.

4. **Reserve a `form.*` namespace for form field labels and validation errors.** These are cross-cutting across features — prevents each form from redefining "Required field".

### Naming

5. **snake_case, not PascalCase.** Matches URL slugs, CLI tools, grep patterns. Easier to visually separate words. Matches i18n convention in most ecosystems (Fluent, gettext, rails-i18n).

6. **Semantic keys, not English phrases.** `transparency.empty_state.no_published_items` — when German says "Keine veröffentlichten Einträge vorhanden", the key still makes sense.

7. **Suffix conventions:**
   - `*_title` — page/dialog/section titles
   - `*_heading` — sub-headings within a section
   - `*_label` — form field labels
   - `*_placeholder` — form placeholders
   - `*_helper` — helper text below fields
   - `*_cta` — call-to-action button text
   - `*_error` — error messages
   - `*_empty` — empty state messages
   - `*_tooltip` — tooltip text
   - `*_confirm` — confirmation dialog body
   - `*_success` — success notification
   - `*_description` — longer descriptive paragraph

### Interpolation

8. **Use ICU MessageFormat for all plurals via `@ngx-translate/messageformat-compiler`.** No `{{pluralStr}}` hacks. Pattern: `{count, plural, one {# item} other {# items}}`.

9. **Interpolation variable naming:** snake_case, semantic names (`{{buyer_org_name}}` not `{{name}}`). Matches the Phase 15 template variable convention (`{{buyerOrgName}}` uses camelCase though — we should unify).

### Content

10. **Consistent punctuation rules:**
    - **Buttons/CTAs:** no trailing period. `Save`, `Publish to Transparency`, `Cancel`.
    - **Full sentences (body text, tooltips, error messages):** always end with a period.
    - **Headings/titles:** no trailing period.
    - **Bulleted list items:** no trailing period.

11. **Consistent capitalization rules:**
    - **Sentence case** for body copy, descriptions, helper text: `Published evidence, requirements, and verification across all parties.`
    - **Title Case** for headings, buttons, tab labels, dialog titles: `Publish to Transparency`, `Transparency Report`
    - **UPPER CASE** only for status chips where the design calls for it (e.g., `DRAFT`, `PUBLISHED`).

12. **No duplicate values.** If two keys must have the same English text, make the second key alias the first via documentation or use the same key. Actual duplication is a lint failure.

### Tooling

13. **Lint en.json in CI.** Custom script or a lib to catch:
    - Duplicated values across keys (warn/error)
    - Capitalization inconsistencies
    - Unused keys (grep codebase for the key → no match = unused)
    - Missing keys used in code (find `'key' | translate` with no corresponding entry)
    - Max nesting depth exceeded

14. **Lock the convention in a doc** (`.planning/docs/I18N_CONVENTIONS.md`) — every PR touching strings follows it.

---

## Discussion Questions for SME Mart i18n Plan

### Key/Value Conventions

1. **PascalCase, camelCase, or snake_case for keys?** snake_case recommended (see recommendation 5). Decision locks hundreds of keys, hard to change later.

2. **Max nesting depth?** Recommend 3. zb/ui goes to 6. Flatter is easier to grep, refactor, and reason about.

3. **`common.*` for shared vocab — YES.** But what exactly belongs there? My proposal:
   - Action verbs: `save`, `cancel`, `delete`, `edit`, `close`, `submit`, `apply`, `reset`, `continue`, `back`, `next`, `yes`, `no`
   - Field labels: `name`, `description`, `status`, `type`, `created_at`, `updated_at`, `tags`, `search`
   - States: `loading`, `saving`, `error`, `empty`
   - Common messages: `required_field`, `loading`, `no_results`, `something_went_wrong`
   - **Do NOT put feature-specific strings in common.**

4. **Suffix conventions: use them or not?** Recommend yes (see recommendation 7). Makes the purpose of each key self-documenting.

5. **Interpolation variable naming:** snake_case or camelCase? Phase 15 template research used `{{buyerOrgName}}` (camelCase). Pick one and use everywhere. snake_case is more traditional for i18n files; camelCase matches TypeScript conventions. **My recommendation: snake_case for i18n values, camelCase for Angular template expressions — they're different contexts.**

6. **Plural strategy:** adopt `@ngx-translate/messageformat-compiler` from day one so we never have to rewrite manual `{{pluralStr}}` hacks?

7. **Namespace granularity:** per-feature or per-component? I recommend per-feature (`engagement.*`, `transparency.*`) because components within a feature share vocabulary. zb/ui does per-app + per-dialog which creates the nesting explosion.

8. **ICU gender/number cases?** English rarely needs gender, but if we're planning for Spanish/French/German/Arabic eventually, we should reserve `{ gender, select, ... }` patterns for profile names, ownership ("her task" vs "his task").

9. **Stored vs rendered:** do we store plain text and let the renderer escape, or allow HTML in values? zb/ui has some values with `\n` newlines but no HTML. **Recommend: plain text only, no HTML allowed.** Use multiple keys + Angular template composition for formatting.

10. **Lint tooling:** build custom or adopt existing (`i18next-parser`, `ngx-translate-extract`)? Most ngx-translate tooling doesn't support duplicate detection or capitalization checks out of the box.

11. **Pluralization when `@ngx-translate/messageformat-compiler` is not available:** do we fall back to multiple keys (`item_count_one`, `item_count_other`) or polyfill?

12. **Locale fallback:** if a key is missing in `es.json`, fall back to `en.json` value or show `[MISSING: key]`? Production setting vs dev setting.

13. **CI check:** fail the build if a string is hardcoded in a template instead of using translate pipe? Too aggressive early in the migration, valuable once migration is complete.

---

## Relevance to Plan 078

Plan 078 (Transparency Controls) is a prime candidate to be the FIRST consumer of our new i18n conventions, because:

1. It has a clean, well-defined copywriting contract already (in the UI-SPEC draft-prep)
2. It introduces ~30-40 new strings all at once, not mixed with legacy hardcoded strings
3. It's a self-contained feature (one tab, one dialog, a few dialogs) — small blast radius
4. All strings are new, nothing to migrate
5. It has user-visible destructive actions where translation correctness matters for trust

**Proposed namespace for Plan 078:** `transparency.*` with the structure:

```
transparency.tab_label
transparency.tab_heading
transparency.tab_description
transparency.page_subheading
transparency.empty_heading
transparency.empty_body
transparency.scorecard.requirements_label
transparency.scorecard.requirements_value           // "{verified}/{total} verified"
transparency.scorecard.evidence_label
transparency.scorecard.boundary_label
transparency.scorecard.score_label
transparency.filter.all
transparency.filter.policies
transparency.filter.legal_reqs
transparency.filter.license_reqs
...
transparency.table.col_requirement
transparency.table.col_demanded_by
transparency.table.col_evidence
transparency.table.col_supplied_by
transparency.table.col_status
transparency.table.col_component
transparency.pair.title                              // "Entangled Pair: {name}"
transparency.pair.col_demand                        // "DEMAND ({party})"
transparency.pair.col_transparency
transparency.pair.col_supply
transparency.pair.state_matched
transparency.pair.state_awaiting
transparency.pair.state_revoked
transparency.pair.audit_trail_heading
transparency.controls.section_title                 // "Transparency Controls"
transparency.controls.section_subtitle
transparency.controls.private_notes_tooltip
transparency.controls.cta_publish
transparency.controls.cta_submit_evidence
transparency.controls.cta_revoke
transparency.controls.revoke_dialog_title
transparency.controls.revoke_dialog_body
transparency.controls.revoke_dialog_confirm
transparency.assessor.heading
transparency.assessor.helper
transparency.assessor.read_only_badge
```

And re-use from `common.*`:
- `common.cancel`, `common.save`, `common.close`, `common.back`, `common.continue`
- `common.status_verified`, `common.status_pending`, `common.status_private` (if we put status words in common)

**This is the discussion we need to have before writing any translation keys in en.json.**
