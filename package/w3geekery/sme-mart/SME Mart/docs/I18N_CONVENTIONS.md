# SME Mart i18n Conventions

> **Authoritative conventions** for internationalization keys, values, and structure in SME Mart.
>
> Established: 2026-04-09
> Basis: Analysis of zb/ui `en.json` (`.claude/notes/i18n-zb-ui-analysis.md`) + convention discussion with Clark.
> Stack: `@ngx-translate/core` ^15, `@ngx-translate/http-loader` ^17, `@ngx-translate/messageformat-compiler` (to be installed).

---

## TL;DR

1. **Namespace prefix:** `Sm.*` (temporary — will merge into zb/ui's structure eventually)
2. **Key casing:** `PascalCase` (matches zb/ui)
3. **Max nesting depth:** 3-4 levels (5+ is a code smell)
4. **Shared vocabulary:** `Sm.Generic.*` (never duplicate across feature namespaces)
5. **Status values:** `Sm.Status.*` (values only — not labels)
6. **Cross-feature components:** `Sm.Common.ComponentName.*` (promote-on-reuse rule)
7. **Plurals/select:** ICU MessageFormat via `@ngx-translate/messageformat-compiler`
8. **Plain text values only** — HTML values must have `Html` suffix
9. **CSS handles visual casing** — never store `DRAFT` in the translation file; store `Draft` and use `text-transform: uppercase`
10. **Lint in CI:** duplicate detection, casing consistency, missing-key detection, nesting depth

---

## 1. Purpose & Scope

This document is the canonical reference for **how to write, structure, and maintain** i18n keys in SME Mart. Every PR that touches user-visible text must follow it.

### Why these conventions exist

- Prevent the 41% duplication, 38 capitalization inconsistencies, and 6-level nesting hell found in zb/ui's `en.json` (see `.claude/notes/i18n-zb-ui-analysis.md`)
- Make SME Mart a **model example** for eventually refactoring zb/ui i18n cleanly
- Support future locales (Spanish, French, German, potentially Arabic, Russian) without rework
- Keep translation files small, browseable, and translator-friendly

### What counts as user-visible text

Anything a user reads in the UI:
- Button labels, tab labels, dialog titles
- Headings, subheadings, section titles
- Form field labels, placeholders, helper text, validation errors
- Empty states, error states, loading states
- Tooltips, popovers, snackbar notifications
- Table column headers, chip labels, badge text
- Body copy, descriptions, instructions

### What is OUT of scope

- Developer console logs (`console.log`, `console.error`)
- Error messages thrown to developers (unless they bubble to users)
- Code comments
- Test fixture strings
- Internal `aria-label`s that duplicate visible text (they should re-use the visible key)
- Resource names that are data, not UI (e.g., a user's typed project name)

---

## 2. Library Setup

### Dependencies (already installed)

```json
"@ngx-translate/core": "^15.0.0",
"@ngx-translate/http-loader": "^17.0.0"
```

### Dependencies to add

```json
"@ngx-translate/messageformat-compiler": "^7.0.0",
"messageformat": "^2.3.0"
```

### Configuration (`src/app/app.config.ts`)

```typescript
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateMessageFormatCompiler } from '@ngx-translate/messageformat-compiler';

function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing
    provideTranslateService({
      defaultLanguage: 'en',
      fallbackLang: 'en',               // Missing-key fallback behavior
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompiler,
      },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MissingKeyHandler,      // Custom — see below
      },
    }),
  ],
};
```

### Missing-key handler

```typescript
@Injectable()
export class MissingKeyHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (!environment.production) {
      return `[MISSING: ${params.key}]`;  // Dev: make missing obvious
    }
    return params.key;                     // Prod: fall back to key string (ngx-translate uses fallbackLang automatically before this fires)
  }
}
```

### File layout

```
src/assets/i18n/
├── en.json     # English (primary, always complete)
├── es.json     # Spanish (future)
├── fr.json     # French (future)
└── ...
```

**Single file per locale.** Do not split by feature — translators work in one file per language.

---

## 3. Top-Level Structure

### The `Sm.*` namespace

All SME Mart keys live under the `Sm.` prefix:

```json
{
  "Sm": {
    "Generic": { ... },
    "Status": { ... },
    "Common": { ... },
    "Forms": { ... },
    "Engagement": { ... },
    "Rfp": { ... },
    "Project": { ... },
    "VendorProfile": { ... },
    "Transparency": { ... },
    "Invitations": { ... }
  }
}
```

**Why `Sm.*`:** SME Mart may eventually become a ZeroBias Platform UI app. When that happens, its keys should merge into zb/ui's structure. The `Sm.*` prefix is a temporary scope that keeps SME Mart's keys isolated until the merge, at which point `Sm.Generic.*` merges into `Generic.*`, `Sm.Status.*` merges into `Status.*`, and feature namespaces either stay as `Sm.*` or get promoted to top-level (e.g., `Transparency.*`, `Engagement.*`).

### The four shared namespaces

| Namespace | Purpose | What goes here | Example |
|---|---|---|---|
| `Sm.Generic.*` | Shared vocabulary used across the app — individual words/phrases | Common labels, actions, field names | `Sm.Generic.Save`, `Sm.Generic.Name`, `Sm.Generic.Status` |
| `Sm.Status.*` | Status **values** only | `Draft`, `Published`, `Verified`, etc. | `Sm.Status.Verified`, `Sm.Status.Pending` |
| `Sm.Common.*` | Strings tied to components used in 2+ features | Shared component copy | `Sm.Common.Timeline.EventAddedCta` |
| `Sm.Forms.*` | Generic form validation errors | Validation messages | `Sm.Forms.RequiredError`, `Sm.Forms.InvalidEmailError` |

### Feature namespaces

One per feature (NOT per component):

```
Sm.Engagement.*      — engagement list, detail, tabs
Sm.Rfp.*             — RFP list, detail, wizard
Sm.Project.*         — project list, detail, tabs
Sm.VendorProfile.*   — vendor profile sections
Sm.Transparency.*    — transparency center (Plan 078)
Sm.Invitations.*     — My Invitations page (Phase 14)
Sm.Notes.*           — notes feature
Sm.OrgDocuments.*    — org-level document management
```

**Rule:** when a feature has >50 strings, structure it internally by sub-area:

```json
{
  "Sm.Engagement": {
    "List": { ... },        // List page strings
    "Detail": { ... },      // Detail page shell
    "Tabs": {
      "Overview": { ... },
      "Timeline": { ... },
      "Documents": { ... }
    },
    "Dialogs": {
      "EditEngagement": { ... },
      "DeleteConfirm": { ... }
    }
  }
}
```

Max depth 3-4 is still the rule — this gives you 5 levels total with `Sm.` as the outermost. One level deeper is acceptable for large features. More than 5 total levels is a code smell — rethink the structure.

---

## 4. Key Naming Rules

### Case: PascalCase

**All keys are PascalCase.** Matches zb/ui for eventual merge compatibility.

```
✅ Sm.Transparency.TabTitle
✅ Sm.Generic.Save
✅ Sm.Rfp.Wizard.Step2Title

❌ sm.transparency.tab_title      (snake_case)
❌ sm.transparency.tabTitle       (camelCase)
❌ Sm_Transparency_TabTitle       (snake + Pascal)
```

### Depth: 3-4 levels normal, 5 max

```
✅ Sm.Generic.Save                          (3 levels)
✅ Sm.Transparency.Controls.PublishCta      (4 levels)
✅ Sm.Engagement.Tabs.Timeline.Heading      (5 levels)

⚠️  Sm.Engagement.Tabs.Timeline.Filters.AllChip    (6 levels — consider flattening)

❌ Sm.Engagement.Tabs.Timeline.Filters.Chips.AllActive   (7 levels — refactor)
```

When you're at 6+ levels, the answer is usually to flatten with a compound suffix:

```
❌ Sm.Engagement.Tabs.Timeline.Filters.Chips.All
✅ Sm.Engagement.TimelineFilterAllChip
✅ Sm.Engagement.Timeline.FilterAllChip
```

### Suffix conventions (STRONGLY RECOMMENDED)

Apply suffixes to leaf keys when purpose could be ambiguous. They make keys self-documenting.

| Suffix | Purpose | Example |
|---|---|---|
| `Title` | Page/dialog/section title | `Sm.Transparency.TabTitle`, `Sm.Engagement.EditDialogTitle` |
| `Heading` | Sub-section heading | `Sm.Transparency.BoundaryBreakdownHeading` |
| `Subheading` | Text under a heading | `Sm.Transparency.PageSubheading` |
| `Label` | Form field label OR element label | `Sm.Generic.NameLabel`, `Sm.Rfp.CategoryLabel` |
| `Placeholder` | Form field placeholder | `Sm.Generic.SearchPlaceholder` |
| `Helper` | Helper text under a form field | `Sm.VendorProfile.InsuranceHelper` |
| `Cta` | Button / call-to-action text | `Sm.Transparency.PublishCta`, `Sm.Rfp.CreateCta` |
| `Error` | Error message | `Sm.Forms.RequiredError`, `Sm.Rfp.DuplicateNameError` |
| `Empty` | Empty state heading or body | `Sm.Transparency.EmptyTitle`, `Sm.Transparency.EmptyBody` |
| `Tooltip` | Tooltip text | `Sm.Transparency.ControlsTooltip` |
| `Confirm` | Confirmation dialog body | `Sm.Transparency.RevokeConfirm` |
| `Success` | Success notification | `Sm.Transparency.PublishSuccess` |
| `Description` | Longer description paragraph | `Sm.Transparency.PageDescription` |
| `Html` | Value contains HTML (required marker) | `Sm.Onboarding.WelcomeHtml` |

**When to skip suffixes:** single-word common vocabulary in `Sm.Generic.*` is obvious from context. `Sm.Generic.Save` is clearly a button — no `Cta` suffix needed. `Sm.Generic.Name` is clearly a field label. Use suffixes when two keys in the same namespace would otherwise collide:

```
✅ Sm.Transparency.Publish       — the word "Publish" (verb)
✅ Sm.Transparency.PublishCta    — button text that might be "Publish Now"
✅ Sm.Transparency.PublishSuccess — "Evidence published successfully."
```

### Semantic keys, not English phrases

Keys should describe **purpose**, not the current English text. When German translates the value, the key should still make sense.

```
✅ Sm.Transparency.EmptyBody
   = "No published items yet"
   (German: "Noch keine veröffentlichten Elemente")
   Key still describes purpose.

❌ Sm.Transparency.NoPublishedItemsYet
   = "No published items yet"
   (German: "Noch keine veröffentlichten Elemente")
   Key is an English phrase that no longer matches the value.
```

---

## 5. Value Rules

### Plain text by default

Translation values should be **plain text only**. No HTML tags, no markdown, no raw JSX.

```json
{
  "Sm.Transparency.PageDescription": "Published evidence, requirements, and verification across all parties."
}
```

### HTML values require `Html` suffix

For rare cases where a value must contain HTML (emphasis, inline links, multi-format), the key MUST end in `Html` so lint can enforce safe consumption.

```json
{
  "Sm.Transparency.RevokeConfirmHtml": "This action is <strong>permanent</strong> for new consumers. Audit trail is preserved."
}
```

```html
<!-- ✅ OK: Html-suffixed key bound via [innerHTML] -->
<p [innerHTML]="'Sm.Transparency.RevokeConfirmHtml' | translate"></p>

<!-- ❌ LINT FAIL: non-Html key bound via [innerHTML] -->
<p [innerHTML]="'Sm.Transparency.RevokeConfirm' | translate"></p>

<!-- ❌ LINT FAIL: Html-suffixed key used as text -->
<p>{{ 'Sm.Transparency.RevokeConfirmHtml' | translate }}</p>
```

**Rule of thumb:** if your value needs HTML, first try splitting it into multiple keys composed in the template. Only use `Html` values when composition is infeasible.

### Capitalization

| Content type | Case | Example |
|---|---|---|
| Headings, page titles, dialog titles | **Title Case** | `"Transparency Report — Read-Only"`, `"Invite Vendor"` |
| Buttons, tab labels, CTAs | **Title Case** | `"Publish to Transparency"`, `"Save"` |
| Body copy, descriptions, helper text | **Sentence case** | `"Published evidence, requirements, and verification across all parties."` |
| Field labels | **Title Case** | `"First Name"`, `"Organization Type"` |
| Empty state headings | **Sentence case** | `"No published items yet"` |
| Empty state bodies | **Sentence case** | `"When parties publish requirements or evidence..."` |
| Status chip values | **Title Case** (CSS handles uppercase visual) | `"Draft"`, `"Verified"` |
| Validation errors | **Sentence case** | `"Required field"`, `"Must be a valid email address"` |

**Status values are stored in Title Case, NOT UPPERCASE.** If the design calls for `DRAFT` on a chip, use CSS:

```scss
// ngx-library already does this — reference only
zb-resource-status .label,
.zb-chip {
  text-transform: uppercase;
}
```

```json
{
  "Sm.Status.Draft": "Draft",      // ✅ Title Case — CSS will uppercase on chips
  "Sm.Status.Draft": "DRAFT"       // ❌ Stored uppercase — breaks translation to German
}
```

German "Entwurf" auto-becomes "ENTWURF" via CSS. Translators write real words.

### Punctuation

| Content type | Period? | Example |
|---|---|---|
| Buttons, CTAs | **No** | `"Save"`, `"Publish to Transparency"` |
| Headings, titles | **No** | `"Transparency"`, `"Invite Vendor"` |
| Tab labels | **No** | `"Overview"`, `"Timeline"` |
| Chip labels | **No** | `"Draft"`, `"Verified"` |
| Body sentences | **Yes** | `"Published evidence, requirements, and verification across all parties."` |
| Error messages (full sentence) | **Yes** | `"Evidence upload failed. Try again or contact support."` |
| Error messages (fragment) | **No** | `"Required"`, `"Invalid email"` |
| Tooltip text | **Yes** | `"Parties who see this task will lose access when revoked."` |
| Helper text | **Yes** | `"Upload a signed copy. PDFs only, max 5 MB."` |
| Empty state headings | **No** | `"No published items yet"` |
| Empty state bodies | **Yes** | `"When parties publish requirements or evidence..."` |

**Rule of thumb:** if it's a full grammatical sentence, it ends with a period. Fragments and UI labels don't.

### Length

Keep values under 150 characters where possible. Longer values (>200 chars) are a smell — either split into multiple keys composed in the template, or move to a Markdown document rendered via `<markdown-view>`.

```json
{
  // ❌ 327-char paragraph in a single key (zb/ui does this — don't copy)
  "Sm.Rfp.Wizard.Step1Body": "When you create a new RFP, you define the scope of work, the requirements your vendors must meet, and the evaluation criteria used to select a winner. Once created, invited vendors can review the RFP, submit bids, and respond to any questions or clarifications. The platform tracks all submissions and provides tools for comparing responses side by side...",

  // ✅ Split into composable pieces
  "Sm.Rfp.Wizard.Step1Heading": "Define your RFP",
  "Sm.Rfp.Wizard.Step1Point1": "Define the scope of work and requirements.",
  "Sm.Rfp.Wizard.Step1Point2": "Invited vendors review and submit bids.",
  "Sm.Rfp.Wizard.Step1Point3": "Compare responses side by side."
}
```

---

## 6. Interpolation

### Variable casing: camelCase

Interpolated variables use camelCase to match TypeScript template expression conventions.

```json
{
  "Sm.Transparency.AssignedTo": "Assigned to {userName}",
  "Sm.Transparency.Published": "Published on {publishedDate}",
  "Sm.Rfp.BidCountLabel": "{count} bids from {vendorCount} vendors"
}
```

```typescript
translate.get('Sm.Transparency.AssignedTo', { userName: 'Jane Smith' });
```

### Variable naming: semantic, not generic

```json
// ❌ Generic variable names — translator doesn't know what will arrive
{
  "Sm.Foo.Bar": "Created {value} by {name} on {date}"
}

// ✅ Semantic variable names — purpose is clear
{
  "Sm.Foo.Bar": "Created {itemType} by {userName} on {createdDate}"
}
```

### Required variables must always be present

Templates using interpolated keys MUST pass all referenced variables. Missing variables render as literal `{varName}` in the output, which is a bug.

```typescript
// ❌ Missing variable
translate.get('Sm.Transparency.AssignedTo');  // Renders: "Assigned to {userName}"

// ✅ All variables provided
translate.get('Sm.Transparency.AssignedTo', { userName: currentUser.name });
```

---

## 7. ICU MessageFormat

### Adopt from day 1

ICU MessageFormat handles plurals and select-case correctly across all languages. We adopt it from day 1 via `@ngx-translate/messageformat-compiler` so we never have to retrofit manual plural hacks like zb/ui did.

### Plural forms

```json
{
  "Sm.Transparency.ItemCount": "{count, plural, one {# item published} other {# items published}}"
}
```

```typescript
translate.get('Sm.Transparency.ItemCount', { count: 1 });   // "1 item published"
translate.get('Sm.Transparency.ItemCount', { count: 5 });   // "5 items published"
```

**Use ICU plurals even for English-only strings** — future-proofs automatically. Russian has 4 plural forms, Arabic has 6; manual `_one/_other` keys cannot express those.

### Complex plurals with composition

```json
{
  "Sm.Rfp.BidSummary": "{bidCount, plural, =0 {No bids yet} one {1 bid from 1 vendor} other {# bids from {vendorCount} vendors}}"
}
```

Note: `=0` catches the exact zero case when `other` is grammatically awkward.

### Select (choose among options)

Use `select` when the value is NOT a number but a string or enum. Common for role-based copy, gender, categorical state.

```json
{
  "Sm.Transparency.TaskOwnership": "{role, select, buyer {Buyer's requirement} provider {Provider's deliverable} auditor {Auditor's check} other {Task}}"
}
```

```typescript
translate.get('Sm.Transparency.TaskOwnership', { role: 'buyer' });
// "Buyer's requirement"
```

### When to reserve `select` patterns

If a string refers to ownership/role/gender and might need to differ in translation for Spanish/French/German/Arabic, use `select` from the start — even if English doesn't differentiate today.

```json
// ✅ Future-proof
"Sm.VendorProfile.OwnershipLabel": "{ownerRole, select, buyer {Buyer-owned} provider {Provider-owned} other {Owned}}"

// ❌ Will need refactoring when Spanish adds gendered possessives
"Sm.VendorProfile.OwnershipLabel": "{ownerRole}-owned"
```

---

## 8. Shared Vocabulary (`Sm.Generic.*`)

### What lives here

Single words or short phrases that appear in **multiple features** and describe a universal concept.

- **Action verbs:** `Save`, `Cancel`, `Delete`, `Edit`, `Close`, `Submit`, `Apply`, `Reset`, `Continue`, `Back`, `Next`, `Archive`, `Unarchive`
- **Field labels:** `Name`, `Description`, `Status`, `Type`, `Tags`, `CreatedDate`, `UpdatedDate`, `Version`, `Owner`
- **States:** `Loading`, `Saving`, `Deleting`, `Ready`, `Error`
- **Prompts:** `Search`, `Filter`, `SelectOption`, `NoResults`, `TryAgain`
- **Confirmations:** `AreYouSure`, `Yes`, `No`
- **Empty state defaults:** `NothingHere`, `ComingSoon`

### What does NOT live here

- **Feature-specific strings.** `Sm.Rfp.CreateCta = "Create RFP"` does NOT belong in Generic even though it's a button.
- **Status VALUES.** Those live in `Sm.Status.*` (see Section 9).
- **Form validation errors.** Those live in `Sm.Forms.*` (see Section 10).
- **Strings that only appear in ONE feature.** Put them in the feature namespace.

### The anti-duplication rule

If a value like `"Name"` is about to be written under `Sm.Rfp.NameLabel`, check first: does `Sm.Generic.Name` exist? If yes, use it. **Never duplicate a value across `Sm.Generic.*` and a feature namespace.** Lint enforces this.

```
❌ Sm.Generic.Name = "Name"
   Sm.Rfp.NameLabel = "Name"        ← DUPLICATE — lint fails

✅ Sm.Generic.Name = "Name"
   [Rfp uses Sm.Generic.Name]
```

**Exception:** if the feature needs a more specific label, the feature key wins and there's no duplication:

```
✅ Sm.Generic.Name = "Name"
   Sm.VendorProfile.LegalEntityNameLabel = "Legal Entity Name"    ← Not a duplicate
```

---

## 9. Status Values (`Sm.Status.*`)

### The split

| Namespace | Contains | Example |
|---|---|---|
| `Sm.Generic.Status` | The **word** "Status" (column header, form label) | `"Status"` |
| `Sm.Status.*` | Actual status **values** | `Sm.Status.Draft = "Draft"` |

### Store in Title Case, render via CSS

```json
{
  "Sm.Status.Draft": "Draft",
  "Sm.Status.Published": "Published",
  "Sm.Status.Verified": "Verified",
  "Sm.Status.PendingResponse": "Pending Response",
  "Sm.Status.Revoked": "Revoked",
  "Sm.Status.Expired": "Expired"
}
```

When a chip needs to display `VERIFIED` uppercase, let CSS do it:

```scss
.zb-chip {
  text-transform: uppercase;
}
```

This means German "Überprüft" automatically becomes "ÜBERPRÜFT" on the chip with no translation file change.

### Status key list (seed)

The following are defined in Sm.Status.* for initial coverage. Expand as features need new values.

```
Sm.Status.Draft           — generic draft state
Sm.Status.Published       — generic published state
Sm.Status.Active          — generic active state
Sm.Status.Inactive        — generic inactive
Sm.Status.Archived        — archived
Sm.Status.Deleted         — soft-deleted

Sm.Status.Pending         — awaiting action
Sm.Status.PendingResponse — awaiting specific response
Sm.Status.UnderReview     — being reviewed
Sm.Status.AwaitingReview  — queued for review
Sm.Status.InProgress      — work in progress
Sm.Status.Completed       — finished
Sm.Status.Done            — same as Completed (choose one per feature)

Sm.Status.Submitted       — user submitted
Sm.Status.Accepted        — accepted
Sm.Status.Rejected        — rejected
Sm.Status.Approved        — approved
Sm.Status.OnHold          — paused
Sm.Status.Cancelled       — cancelled

Sm.Status.Verified        — verified (used by Transparency Plan 078)
Sm.Status.Revoked         — revoked (used by Transparency Plan 078)
Sm.Status.Expired         — expired
```

---

## 10. Form Errors (`Sm.Forms.*`)

Cross-cutting form validation errors live here. NOT tied to a specific component.

```json
{
  "Sm.Forms": {
    "RequiredError": "Required field",
    "InvalidEmailError": "Must be a valid email address",
    "InvalidUrlError": "Must be a valid URL",
    "MinLengthError": "Must be at least {minLength, number} characters",
    "MaxLengthError": "Must be at most {maxLength, number} characters",
    "MinValueError": "Must be at least {min, number}",
    "MaxValueError": "Must be at most {max, number}",
    "PatternError": "Invalid format",
    "DuplicateError": "Already exists",
    "NumericError": "Must be a number",
    "IntegerError": "Must be a whole number",
    "DateInvalidError": "Must be a valid date",
    "DateInPastError": "Must be a date in the past",
    "DateInFutureError": "Must be a date in the future"
  }
}
```

Feature-specific validation errors (e.g., "Project name must be unique within the engagement") live in the feature namespace, NOT in `Sm.Forms.*`:

```json
{
  "Sm.Project.NameDuplicateError": "A project with this name already exists in this engagement"
}
```

---

## 11. Cross-Feature Components (`Sm.Common.*`)

### Promote-on-reuse rule

**Place component strings in the nearest feature namespace UNTIL the component is imported by 2+ features.** When a second feature adopts the component, promote the strings to `Sm.Common.ComponentName.*`.

| Component usage | Strings live in |
|---|---|
| `bid-form` (only RFP) | `Sm.Rfp.BidForm.*` |
| `timeline-panel` (engagement + project + transparency) | `Sm.Common.Timeline.*` |
| `document-list` (engagement docs + org docs) | `Sm.Common.DocumentList.*` |
| `vendor-profile-badges` (only vendor profile) | `Sm.VendorProfile.Badges.*` |

### Why not put them in `Sm.Common.*` upfront?

- Prevents premature "dumping ground" syndrome (zb/ui's `Common` only has 2 entries because no one bothered to migrate)
- Single-feature components can change freely without disrupting other features
- Forces a conscious decision: "this component is now shared — what should the naming look like?"

### Promotion procedure

When you add a second usage of a component that currently has strings in a feature namespace:

1. Move the strings from `Sm.{Feature}.{ComponentName}.*` to `Sm.Common.{ComponentName}.*`
2. Update the component template to use the new keys
3. Update the original feature (if any direct references)
4. Lint script detects the reference-update requirement

---

## 12. Locale Fallback Behavior

| Environment | Missing key behavior |
|---|---|
| **Production** | Fall through to `en.json` value (user sees English text in Spanish UI — better than broken) |
| **Development** | Show `[MISSING: Sm.Foo.Bar]` literal marker (makes gaps obvious) |
| **Staging/QA** | Same as Dev (catch missing keys before prod) |

The fallback is automatic via `provideTranslateService({ fallbackLang: 'en' })`. The missing-key marker is via the custom `MissingKeyHandler` that checks `environment.production`.

---

## 13. Lint Rules (CI)

### Day 1 rules (ship in CI immediately)

| Rule | Severity | What it catches |
|---|---|---|
| **Duplicate values** | Error | Same value appears under two different keys (except when one is in `Sm.Generic.*`) |
| **Capitalization inconsistency** | Warning | Same word appears in Title Case and lowercase across the file |
| **Missing key in en.json** | Error | Code references a key (via `\| translate` pipe or `translate.get`) that doesn't exist in en.json |
| **Nesting depth > 5** | Warning | Key has >5 levels deep |
| **Nesting depth > 6** | Error | Definitely too deep |
| **HTML in non-`Html` key** | Error | Value contains `<` or `>` but key doesn't end in `Html` |
| **`[innerHTML]` on non-`Html` key** | Error | Template binds `[innerHTML]="'Sm.Foo.Bar' | translate"` where `Bar` doesn't end in `Html` |

### Day-2 rules (run manually or in nightly CI)

| Rule | Severity | What it catches |
|---|---|---|
| **Unused keys in en.json** | Warning | Key defined in en.json but not referenced in any `.ts` or `.html` file |
| **Hardcoded strings in templates** | Warning | Text content in `.html` that's NOT wrapped in a `translate` pipe |
| **Duplicate across locales** | Warning | `en.json` has a key that other locale files are missing (or vice versa) |

### Script locations (to be built)

```
scripts/i18n/
├── lint-i18n.ts           # Run all Day-1 rules, fail build on errors
├── find-duplicates.ts      # Standalone duplicate detector
├── find-unused-keys.ts     # Standalone unused-key finder
├── find-hardcoded.ts       # Standalone hardcoded-string finder
└── extract-keys.ts         # Generate fresh en.json skeleton from codebase scan
```

These scripts are part of Plan 084 (i18n migration) and do NOT exist yet — they'll be built as part of that plan.

---

## 14. Workflow: How to Add a New String

When you need to display a new piece of user-visible text:

### Step 1: Decide the namespace

Ask: is this string already used elsewhere?
- **If it's a common word/action** (Save, Cancel, Name): **use `Sm.Generic.*`** — if the key exists, use it. If not, add it there.
- **If it's a status value** (Draft, Verified): **use `Sm.Status.*`**.
- **If it's a validation error** (Required, Invalid email): **use `Sm.Forms.*`**.
- **If it's tied to a component used in 2+ features:** **`Sm.Common.ComponentName.*`**.
- **Otherwise:** **feature namespace** (`Sm.Engagement.*`, `Sm.Transparency.*`, etc.).

### Step 2: Choose a semantic key

- PascalCase
- Describes purpose, not English text
- Has a suffix if ambiguous (`Title`, `Cta`, `Empty`, etc.)
- Max 4 levels deep under `Sm.*`

### Step 3: Write the value

- Plain text (no HTML unless key ends in `Html`)
- Correct case per Section 5
- Correct punctuation per Section 5
- ICU MessageFormat for plurals/select
- camelCase interpolation variables with semantic names

### Step 4: Add to `en.json`

Insert in alphabetical order within the namespace for easier diffing:

```json
{
  "Sm": {
    "Transparency": {
      "AssessorHeading": "Transparency Report — Read-Only",
      "AssessorHelper": "This view shows only items explicitly published by each party. Unpublished work is invisible.",
      "EmptyBody": "When parties publish requirements or evidence to the transparency function, entangled pairs will appear here.",
      "EmptyTitle": "No published items yet",
      "PageSubheading": "Published evidence, requirements, and verification across all parties.",
      "PublishCta": "Publish to Transparency",
      "RevokeCta": "Revoke Publication",
      "RevokeConfirm": "Parties who can currently see this will lose access. Audit trail is preserved. Continue?",
      "TabLabel": "Transparency",
      "TabTitle": "Transparency"
    }
  }
}
```

### Step 5: Use in template

```html
<!-- Simple -->
<h2>{{ 'Sm.Transparency.TabTitle' | translate }}</h2>

<!-- With interpolation -->
<p>{{ 'Sm.Transparency.AssignedTo' | translate: { userName: user.name } }}</p>

<!-- Button -->
<button mat-raised-button color="primary">
  {{ 'Sm.Transparency.PublishCta' | translate }}
</button>

<!-- HTML value (key must end in Html) -->
<p [innerHTML]="'Sm.Transparency.RevokeConfirmHtml' | translate"></p>
```

### Step 6: Use in TypeScript

```typescript
import { TranslateService } from '@ngx-translate/core';

private readonly translate = inject(TranslateService);

showConfirm() {
  const message = this.translate.instant('Sm.Transparency.RevokeConfirm');
  // ...
}
```

**Prefer `instant()` when the translation is already loaded (component init, button handlers).** Use `get()` (returns Observable) for edge cases where the translation may not be loaded yet.

### Step 7: Run lint

```bash
npm run lint:i18n   # Runs Day-1 rules
```

Fix any errors before committing.

---

## 15. Examples: Good vs Bad

### Naming

```
✅ Sm.Transparency.TabTitle
❌ Sm.Transparency.tabTitle           (camelCase not PascalCase)
❌ Sm.Transparency.Tab_Title          (underscore)
❌ Sm.Transparency.Transparency       (tautology — use shorter key)

✅ Sm.Common.Timeline.EventCreatedLabel
❌ Sm.Common.Timeline.Events.Created.Label    (too deep — 6 levels)
```

### Case

```json
✅ { "Sm.Transparency.PublishCta": "Publish to Transparency" }   (Title Case button)
❌ { "Sm.Transparency.PublishCta": "publish to transparency" }    (lowercase button)
❌ { "Sm.Transparency.PublishCta": "PUBLISH TO TRANSPARENCY" }    (UPPER stored — should be CSS)

✅ { "Sm.Transparency.EmptyBody": "When parties publish requirements..." }  (sentence case)
❌ { "Sm.Transparency.EmptyBody": "When Parties Publish Requirements..." }  (Title Case for body copy — wrong)
```

### Punctuation

```json
✅ { "Sm.Generic.Save": "Save" }                              (no period on button)
✅ { "Sm.Transparency.PageDescription": "Published evidence across parties." }  (period on sentence)
✅ { "Sm.Forms.RequiredError": "Required field" }             (no period on fragment)

❌ { "Sm.Generic.Save": "Save." }                             (unexpected period on button)
❌ { "Sm.Transparency.PageDescription": "Published evidence across parties" }  (missing period on full sentence)
```

### Duplication

```json
✅ {
  "Sm.Generic.Name": "Name",
  "Sm.VendorProfile.LegalEntityNameLabel": "Legal Entity Name"
}

❌ {
  "Sm.Generic.Name": "Name",
  "Sm.Engagement.NameLabel": "Name",      ← DUPLICATE of Sm.Generic.Name
  "Sm.Rfp.NameLabel": "Name"              ← DUPLICATE of Sm.Generic.Name
}
```

### Interpolation

```json
✅ { "Sm.Transparency.AssignedTo": "Assigned to {userName}" }
❌ { "Sm.Transparency.AssignedTo": "Assigned to {{userName}}" }  (double braces — wrong for ICU)
❌ { "Sm.Transparency.AssignedTo": "Assigned to {name}" }         (generic variable name — use semantic)
```

### Plurals

```json
✅ {
  "Sm.Transparency.ItemCount": "{count, plural, one {# item published} other {# items published}}"
}

❌ {
  "Sm.Transparency.ItemCount_one": "1 item published",
  "Sm.Transparency.ItemCount_other": "{count} items published"
}
(Manual plural hack — doesn't work for Russian/Polish/Arabic)

❌ {
  "Sm.Transparency.ItemCount": "{count} item{pluralStr} published"
}
(zb/ui-style pluralStr hack — doesn't work either)
```

### Nesting

```json
✅ {
  "Sm": {
    "Transparency": {
      "TabTitle": "Transparency",
      "PublishCta": "Publish to Transparency"
    }
  }
}
(3 levels — ideal)

⚠️ {
  "Sm": {
    "Transparency": {
      "Controls": {
        "PublishSection": {
          "Toggles": {
            "DescriptionLabel": "Description"   ← 6 levels — refactor
          }
        }
      }
    }
  }
}
```

---

## 16. Migration Path: Eventual Merge into zb/ui

When SME Mart is folded into the ZeroBias Platform (or its conventions are adopted by zb/ui), the migration looks like:

### Step 1: Vocabulary merge

`Sm.Generic.*` → `Generic.*` — vocabulary values align cleanly. Any new `Sm.Generic.*` keys that don't already exist in zb/ui's `Generic.*` get added. Duplicates collapse to the zb/ui value (or the SME Mart value if zb/ui's is broken).

### Step 2: Status merge

`Sm.Status.*` → `Status.*` — same approach. Fix zb/ui's casing inconsistencies in the process (zb/ui has `Status.Draft = "DRAFT"` — migrate to `Status.Draft = "Draft"` with CSS uppercase).

### Step 3: Feature namespace promotion

Feature namespaces decide per-feature:
- **Promote to top-level** if the feature is now a top-level app (e.g., `Sm.Transparency.*` → `Transparency.*`)
- **Merge into existing** if SME Mart conceptually integrates with an existing namespace (e.g., `Sm.Engagement.*` might merge into `Administration.*` or stay as `Engagement.*`)
- **Stay as `Sm.*`** if SME Mart remains a standalone sub-app within the portal

### Step 4: Components merge

`Sm.Common.*` → `Common.*` — but be careful: zb/ui's `Common` only has 2 entries today. Adding SME Mart's shared-component strings should be accompanied by a broader zb/ui cleanup (promote other shared components to `Common.*` at the same time).

### Step 5: Convention doc promotion

This very document should become the canonical i18n convention for the platform. Propose it to Tom / zb/ui team as part of the merge.

---

## 17. Tooling Checklist (to be built as part of Plan 084)

- [ ] `@ngx-translate/messageformat-compiler` installed and wired up
- [ ] Custom `MissingKeyHandler` for dev marker + prod fallback
- [ ] `scripts/i18n/lint-i18n.ts` — Day-1 lint rules
- [ ] `scripts/i18n/find-duplicates.ts` — duplicate value detector
- [ ] `scripts/i18n/find-unused-keys.ts` — unused key detector
- [ ] `scripts/i18n/find-hardcoded.ts` — hardcoded string finder
- [ ] `scripts/i18n/extract-keys.ts` — en.json skeleton generator from codebase scan
- [ ] `npm run lint:i18n` script in `package.json`
- [ ] CI job runs lint on every PR
- [ ] VS Code extension recommendation for inline translation preview (e.g., `i18n-ally`)

---

## 18. Plan 078 as Pilot

Plan 078 (Transparency Controls) will be the first feature to adopt these conventions end-to-end. It's ideal because:

1. Clean slate — no legacy strings to migrate
2. Well-defined copywriting contract (see `.claude/ui-specs/078-transparency-controls-UI-SPEC.md`)
3. ~30-40 new strings all in one feature namespace
4. User-visible destructive actions where correctness matters
5. Small blast radius — one tab, a few dialogs

The Plan 078 implementation will:
1. Install `@ngx-translate/messageformat-compiler`
2. Add `Sm.Transparency.*` keys to `en.json`
3. Populate `Sm.Generic.*` and `Sm.Status.*` with the vocabulary Plan 078 needs (Save, Cancel, Close, Verified, Pending, etc.)
4. Wire templates to use the `translate` pipe
5. Run lint checks and fix any violations
6. Serve as the reference example for future features migrating to i18n

---

## 19. Open Items

These are deferred until Plan 084 execution:

- Exact ngx-translate version alignment with zb/ui
- Custom lint script implementations (design in Plan 084, implement during execution)
- VS Code workspace setting recommendations
- Translator-facing comments (JSON doesn't support comments — consider a sibling `en-context.md` file per feature)
- E2E test coverage for translation rendering (Playwright tests that verify `translate` pipe output)
- RTL layout considerations (Arabic, Hebrew) — defer until we add an RTL locale

---

**Last updated:** 2026-04-09
**Status:** locked as of 2026-04-09 — changes require Clark approval
**Consumers:** Plan 078 (pilot), Plan 084 (app-wide migration), all future frontend work
