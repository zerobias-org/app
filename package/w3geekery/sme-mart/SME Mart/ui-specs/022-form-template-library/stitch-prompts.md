# Stitch Prompts — Phase 22 Form Template Library

Paste each prompt into [stitch.withgoogle.com](https://stitch.withgoogle.com/).
Generate the mock, download the PNG, drop it in `./mocks/` using the filename
next to each prompt.

The **Design System Preamble** must be pasted into Stitch once as the "design
system" context before generating, OR prepended to every prompt if Stitch
doesn't expose a persistent design panel. It teaches Stitch the SME Mart
token set so outputs match the real app. Values come from
`../../design/DESIGN.md` (the canonical token contract).

---

## Design System Preamble (paste first)

Design system: SME Mart, enterprise marketplace app.

Palette (Material 3 tone-40 resolved):
- Primary (azure): `#00658d`, on-primary `#ffffff`, primary-container `#c6e7ff`
- Secondary (slate): `#3a637c`
- Tertiary (forest green, success only): `#316b19`, on-tertiary `#ffffff`
- Error: `#ba1a1a`
- Background / Surface (warm limestone): `#f5faff`
- Surface container (raised chrome): `#dee3e8`
- Text: `#171c20` (ink)
- Outline: `#556068` / `#bdc8d1`
- Status chip palette: backlog `#e9e9e9`, in-progress `#d7e0ee`, done `#d8ecba`, cancelled `#eed5d1`, all with label `#0f0f10`

Typography: Roboto everywhere. h1 32/500, h2 24/500, h3 20/500, body 14/400, body-sm 12/400, label 14/500, button 14/500 with +0.02em letter-spacing, caps 12/500 uppercase +0.08em.

Shape: 8px card/panel radius, 12px dialog radius, 4px input radius, pill (9999px) buttons and status chips.

Layout: 16px page padding, 24px between sections, 4px spacing unit base.

Component conventions: Angular Material M3. Pill-shaped buttons. Outlined `mat-form-field` inputs. Status chips always carry both color AND text. Status chip text is UPPERCASE with underscores replacing spaces (e.g., `IN_PROGRESS`). Green is reserved for affirmative actions (publish / save / approve) — never as a neutral accent. Tables have a raised header strip on surface-container. Row hover on primary-container.

---

## S1 — Library Page

**Filename:** `mocks/s1-library.png`
**Viewport:** Desktop 1440x900.

Desktop web app — list page at route `/forms/templates`. Title "Form Templates" top-left (h1 32px, 500 weight, ink `#171c20`). Right-aligned primary action button "New template" (filled pill, primary `#00658d`, white text, 40px tall).

Below the title, a single-row toolbar: a 400px-wide outlined search input on the left with placeholder "Search templates…" and a leading magnifier icon; three filter chips to its right labeled "Drafts", "Published", "Archived" — only "Drafts" is the active/selected state (primary-container `#c6e7ff` background, ink text); the other two are neutral chips (surface-container `#dee3e8` background).

Below the toolbar, a data table on surface `#f5faff`. Table header row on surface-container `#dee3e8` with uppercase caps-style labels in 12px/500 +letter-spacing: "NAME", "STATUS", "USAGE", "OWNER", "UPDATED", and a trailing empty column for a row-actions kebab.

8 rows. First three rows are drafts, pinned with a small "Draft" status chip in the Status column (backlog `#e9e9e9` fill, uppercase "DRAFT" label in ink). Next three rows are published (muted green `#d8ecba` status chip labeled "PUBLISHED"). Last two rows archived (muted rose `#eed5d1` chip "ARCHIVED"). Usage column shows integers like "12", "47", "3". Owner column shows a 24px circular avatar + name. Updated column shows relative time ("2 hours ago", "yesterday", "3 days ago"). Each row has a trailing three-dot kebab.

Bottom-right of the table: "Rows per page" selector and pagination controls in muted slate `#3a637c`.

Overall feel: clean, spacious, enterprise, calm. No gratuitous color. One primary action. Pill buttons. Rounded 8px table corners. No exclamation marks or marketing copy.

---

## S2 — Picker Dialog

**Filename:** `mocks/s2-picker.png`
**Viewport:** Desktop 1440x900. Show dialog centered with a dimmed scrim over a faded RFP-wizard Step 2.5 in the background.

Modal dialog, 640px wide, centered on a dimmed scrim. Dialog surface is light limestone `#f5faff` with 12px rounded corners and a soft drop shadow.

Title row (24px padding): "Pick a form template" on the left (h3 20px/500 ink), close "×" icon on the right.

Body: a 320px-wide outlined search input with placeholder "Search published templates…"; to its right a compact sort dropdown labeled "Most used" (values: Most used, Recently updated, Name).

Below that, a scrollable vertical list of 5 template cards. Each card is a surface-container-light panel (8px radius, 16px padding, 12px vertical gap between cards): template name (label 14/500 ink), short description below in body-sm 12px/400 slate, a small neutral chip on the right showing usage count like "47 uses", and a "Preview" text button at the far right.

One card is in a selected state with a 2px primary-container `#c6e7ff` border and a subtle shaded background.

Footer: right-aligned "Cancel" text button and a filled primary pill "Use this template" button.

**Important:** no draft templates shown — all 5 have "Published" implied by inclusion.

---

## S3 — Edit-Detect Modal

**Filename:** `mocks/s3-edit-detect.png`
**Viewport:** Desktop 1440x900. Centered modal over the form-builder view.

Small confirmation dialog, 480px wide, centered over a dimmed scrim. 12px rounded corners, limestone surface.

Title: "This template is published" (h3 20/500, ink).

Body paragraph (body-md 14/400, slate text):
"Saving will either create a new version of this template (a fork) or overwrite the current published version. Overwriting is only available to the template owner, and only when no active RFPs reference this version."

Below the paragraph, a small info box with a neutral `surface-container` background and a short bullet list: "2 RFPs currently reference this version" with a rightward link arrow icon.

Footer button row right-aligned: "Cancel" text button, "Save as new version" filled pill primary button (azure `#00658d` background, white text), and a third "Overwrite" filled pill button in green `#316b19` that is visibly **disabled** (lower opacity, non-interactive cursor) because of the referencing RFPs. Below the Overwrite button, a small warning caption in error red `#ba1a1a`: "Blocked by 2 active RFP references."

---

## S4 — Auto-Draft Indicator

**Filename:** `mocks/s4-autodraft-indicator.png`
**Viewport:** Desktop 1440x900. Show the form-builder toolbar area only (a ~200px-tall strip).

A form-builder toolbar across the top of a workspace canvas. Left side: template name inline-edit ("Untitled form template" in slate italic placeholder state). Immediately to the right of the name, a small neutral pill chip 24px tall with the label "Saved · 4s ago" in caps style (12/500 +letter-spacing, uppercase "SAVED · 4S AGO"), neutral `#dee3e8` background, ink label.

Below the main chip, produce a vertical strip of four variants stacked with labels showing each state:

1. "Draft" — backlog-gray `#e9e9e9` background.
2. "Saving…" — primary-container `#c6e7ff` background, with a tiny inline spinner icon.
3. "Saved · 4s ago" — neutral `#dee3e8` background.
4. "Save failed — Retry" — error-container `#ffdad6` background, error-red `#ba1a1a` label, cursor indicating clickability.

Right side of the toolbar: disabled "Publish" filled pill button (green `#316b19`) with caption "Add at least one field to publish" in slate body-sm.

---

## S5 — Documents Center Surface

**Filename:** `mocks/s5-docs-surface.png`
**Viewport:** Desktop 1440x900. Show the Org Documents Center page with this surface prominently placed.

Org Documents Center page. Page title "Documents" (h1) with a tab bar below: "Files", "Templates", "Shared", "Archive". "Templates" is the active tab (azure underline).

Under the tab bar, two sections:

Section 1 (top): "Document templates" (h3) with a "See all" link. Horizontal scroller of 5 document-template cards.

Section 2 (below): "Form templates" (h3) with a "See all" link routing to `/forms/templates`. Horizontal scroller of 6 form-template cards. Each card: 240px wide, 140px tall, 8px rounded corners, 16px padding. Card content: small form icon at top-left, template name (label 14/500 ink), truncated description (body-sm 12/400 slate, 2 lines), footer row with a "Published" status chip on the left and a usage count "47 uses" on the right. Hovering the card raises elevation slightly and shows a primary "Use" text button bottom-right.

Overall page padding 24px. Cool, calm enterprise layout. Muted colors. No marketing language.
