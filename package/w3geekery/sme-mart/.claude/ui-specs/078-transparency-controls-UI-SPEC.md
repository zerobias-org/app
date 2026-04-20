---
plan: 078
slug: transparency-controls
status: draft-prep
shadcn_initialized: false
preset: none
created: 2026-04-09
target_milestone: v1.3+ (TBD — currently design-only, implementation deferred)
source_artifacts:
  - .claude/sketches/transparency-center-ui-concepts.html
  - .claude/notes/transparency-center-multi-party-clarification.md
  - .claude/notes/entangled-task-pairs-model-evaluation.md
  - .claude/notes/questions-for-brian-miro-reconciliation.md
  - .claude/notes/CEO_NOTES.md (2026-02-06 Transparency Center Vision)
  - .claude/notes/ceo-notes-2026-03-27.md (Brian — Transparency Bridge UI request)
  - .claude/notes/meetings/2026-04-07-marketplace.md (Brian — boundary types insight)
  - ~/Projects/w3geekery/zb-poc-devs/brian-directives/2026-04-06-boundary-components-transparency.md
  - Brian's Miro board: https://miro.com/app/board/uXjVGm64Grw=/
  - Clark's Miro board: https://miro.com/app/board/uXjVGm52yII=/
---

# Plan 078 — Transparency Controls UI Design Contract

> Pre-formal design contract for the Transparency Center (per-task transparency controls + aggregated project-level transparency view). Captures the design intent ahead of formal GSD phase planning so that when Plan 078 is promoted to a real phase, the contract is ready to execute against.
>
> **Status:** DRAFT PREP — awaiting Clark's red-box markup pass on current Engagement/Project screens to finalize which HTML-sketch concepts land in which existing view. Follow-up wireframe session will refine component placement.

---

## Intent

Give each party in an engagement the ability to explicitly publish task-level data into a multi-party **Transparency Function** (Kevin's clarification — not a place, a read-through rendering). The function reads only explicitly-published items from each party's private workspace and renders a unified view (aggregated scores, entangled pairs, assessor read-only report) consumable by any participating party including third-party auditors.

**Core architectural principles** (locked):

1. Transparency Center is a **FUNCTION**, not a data store. It reads from both sides at render time. (Kevin)
2. **Zero default visibility.** Tasks are private by default — nothing is published until a party explicitly permits it.
3. **Multi-party, not just buyer/seller.** N parties in any role combination (buyer, provider, auditor, assessor, observer).
4. **Entangled Task Pairs (Option B selected 2026-03-24).** Each demand-side requirement has a linked supply-side satisfaction task. The **link IS the transparency record** (gets the cryptographic hash). No third "transparency task" exists.
5. **Boundary component types** (Policies, Legal Reqs, License Reqs, Standards, Technical, Infra, Apps, People, Assets, Agreements) are the taxonomy used to filter and aggregate transparency data. They are NOT types of boundaries — they are things WITHIN boundaries.
6. Existing tasks that should NOT be entangled (work items, shared milestones) don't get transparency controls — regular tasks stay simple.

---

## Scope: What Gets Adopted, What Gets Deferred

### Adopted from HTML sketch concepts (`.claude/sketches/transparency-center-ui-concepts.html`)

| Sketch Tab | Concepts Adopted | Target Location in Existing App |
|---|---|---|
| **Architecture** | Explanatory only — inform user mental model via help/about dialog. No standalone view. | Help dialog / docs only |
| **Project View** | Summary scorecards (4 metrics), boundary component filter chips, entangled pairs table, published vs private row treatment | New `transparency` tab on **Project Detail** (`project/:projId/transparency`) |
| **Task Controls** | Per-data-point toggle panel, "Visible to" party selector, "Entangled pair" reference, private notes (never publishable) | New section within the existing **task detail pane** (task drawer / bottom sheet) |
| **Entangled Pairs** | Side-by-side demand/bridge/supply view, audit trail timeline, pending/unmatched state | New **entangled pair drawer** opened from the project transparency table |
| **Assessor View** | Read-only compliance report, boundary component breakdown, only-published-items rendering, explicit callout that unpublished items are invisible | Party-role-scoped variant of the project transparency tab (when active party is an assessor/auditor) |

### Deferred (out of scope for this spec)

- Cryptographic hash implementation (blockchain/signing)
- Agentic session audit trail (Brian's "desktop → agentic sessions" vision from CEO_NOTES)
- Auto-creation workflow (when demand creates a requirement, does supply-side task auto-create?) — needs platform-level decision
- Cross-engagement transparency aggregation (single dashboard across all engagements)
- Transparency API / external consumer integration
- Real-time updates (websocket/polling) — assume manual refresh on first implementation
- NDA-gated data sharing from Readiness Center (Brian's original three-component vision)
- Partial satisfaction (one evidence satisfies multiple requirements) — many-to-many

---

## Target View Integration

### Project Detail — new `Transparency` tab

**File:** `src/app/pages/project/tabs/project-transparency-tab.component.ts` (new)
**Route:** `project/:projId/transparency` in `project.routes.ts`

Placement in existing tab structure (`project-detail.component.ts`):

```typescript
// PRIMARY_TABS — unchanged
// MORE_TAB_GROUPS → add to 'Tracking' group:
{
  heading: 'Tracking',
  tabs: [
    { path: 'timeline', label: 'Timeline', icon: 'history' },
    { path: 'transparency', label: 'Transparency', icon: 'visibility' },  // NEW
    { path: 'dashboard', label: 'Dashboard', icon: 'widgets' },
    { path: 'financials', label: 'Financials', icon: 'payments' },
  ],
},
```

Rationale: Transparency fits under "Tracking" because it's a read-through aggregated view of task state. Primary tabs stay focused on content (Overview/Boards/Notes/Documents).

### Project Detail — `Boards` tab (when built)

Each task card on the Kanban board gains a small **publish indicator icon** (eye or lock) showing whether that task has any fields published to the transparency function. Opens the per-task Transparency Controls section when clicked.

**File:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (currently coming-soon — this is a future integration point, not a current modification)

### Task Detail Pane — new `Transparency Controls` section

**File:** Existing task detail drawer/dialog component (TBD — this lives inside the Boards view which is `ProjectComingSoonTab` today). For the spec, assume the future task-detail pane will have an expandable "Transparency Controls" section.

**Placement:** Last section in the task drawer, below: title/description → status → attachments → notes → **Transparency Controls**

### Engagement Detail — no direct modification

Engagements aggregate across multiple projects. The engagement-level "transparency roll-up" (total across all engagement projects) is **deferred**. First implementation targets project-level only. Engagement-level view can be added later as an engagement tab.

---

## Design System

| Property | Value | Source |
|---|---|---|
| Tool | none (ngx-library + Angular Material M3, no shadcn) | SME Mart existing stack |
| Preset | not applicable | — |
| Component library | `@zerobias-org/ngx-library` (Zb* components) + Angular Material M3 | CLAUDE.md |
| Icon library | Material Icons (already in use) | SME Mart existing |
| Font | Roboto, 'Helvetica Neue', sans-serif (400 / 500 / 700) | `node_modules/@zerobias-org/ngx-library/src/styles/theme.scss` |

**Theme tokens:** Use existing CSS custom properties from ngx-library (`--zb-*` and `--mat-sys-*`). **Never hardcode colors.** Per ngx-library CLAUDE.md rule #3.

**Specific tokens to reference:**
- `var(--mat-sys-primary)` — `#03aff0` (SME Mart blue — accent)
- `var(--mat-sys-tertiary)` — `#6aa84f` (success green)
- `var(--mat-sys-error)` — `#cc0000` (destructive only)
- `var(--mat-sys-surface)` — card backgrounds
- `var(--mat-sys-surface-dim)` — secondary surfaces
- `var(--zb-background)` — page background
- `var(--zb-text)` — body text

---

## Spacing Scale

Use existing 8-point scale (inherited from Angular Material + SME Mart convention):

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing (card padding, form field gaps) |
| lg | 24px | Section padding, tab content padding |
| xl | 32px | Page-level margins, major section breaks |
| 2xl | 48px | Hero spacing (rare in transparency views) |

Exceptions: none.

---

## Typography

Inherit from SME Mart + Angular Material M3 typography scale:

| Role | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 28px | 500 | 1.2 | Page titles (e.g., "Transparency") |
| Heading | 20px | 500 | 1.3 | Section headers ("By Boundary Component") |
| Subheading | 16px | 500 | 1.4 | Card titles, table headers |
| Body | 14px | 400 | 1.5 | Default body text |
| Caption | 12px | 400 | 1.4 | Table metadata, timestamps, helper text |
| Label | 11px | 600 | 1.3 | Uppercase eyebrow labels ("DEMAND", "SUPPLY"), badge text |

**No new fonts.** Roboto only, declared at the root.

---

## Color

| Role | Value | Usage |
|---|---|---|
| Dominant (60%) | `var(--mat-sys-background)` / `var(--mat-sys-surface)` | Page background, card surfaces |
| Secondary (30%) | `var(--mat-sys-surface-dim)` / `var(--mat-sys-surface-variant)` | Sidebar panels, table row hover, secondary cards |
| Accent (10%) | `var(--mat-sys-primary)` (SME Mart blue `#03aff0`) | Primary CTAs, active tab underline, selected state |
| Destructive | `var(--mat-sys-error)` (`#cc0000`) | "Revoke publication" confirmation only |

**Accent reserved for:**
- Primary CTA buttons ("Publish to Transparency", "Submit Evidence")
- Active tab underline (transparency tab in more-menu)
- Selected filter chip (boundary component active)
- Focused form field outlines
- Summary scorecard numeric values when they hit target thresholds

**NOT reserved for:** every clickable element, hover states (use surface-dim), decorative icons.

**Party/role colors** (semantic, not part of 60/30/10):

| Role | Color | Usage |
|---|---|---|
| Demand side | `var(--mat-sys-tertiary)` or amber `#f59e0b` | Demand party indicator dots, column backgrounds in entangled pair view (subtle 8% alpha tint) |
| Supply side | Green `#10b981` | Supply party indicator dots, column backgrounds in entangled pair view |
| Shared / transparency bridge | `var(--mat-sys-primary)` | Bridge column, verified links, transparency icon |
| Audit / assessor | Pink `#ec4899` | Read-only assessor view header/border, "Read-Only" badge |

**Party role colors must be decided with Clark during wireframe session.** The sketch uses demand=amber/supply=green — pending confirmation whether that matches zb/ui party conventions.

---

## Status & State Color Mapping

Reuse existing SME Mart/ngx-library status chip colors where possible (from `.claude/CLAUDE.md` memory note on ZB task-status chip colors):

| State | Chip Background | Text | Usage |
|---|---|---|---|
| Private (unpublished) | `#e9e9e9` | `#0f0f10` | Task exists but nothing published to transparency |
| Submitted / Pending | `#d7e0ee` | `#0f0f10` | Evidence published, awaiting verification |
| Verified | `#d8ecba` | `#0f0f10` | Demand party verified the evidence |
| Rejected / Revoked | `#eed5d1` | `#0f0f10` | Publication revoked OR evidence rejected |
| Published (generic) | `var(--mat-sys-primary-container)` | `var(--mat-sys-on-primary-container)` | Generic "has been published" state where verify/reject doesn't apply |

---

## Component Inventory (ngx-library First)

**Use ngx-library before building custom.** Preference order:

1. `@zerobias-org/ngx-library` component
2. Angular Material component (`mat-*`)
3. Existing SME Mart shared component (`src/app/shared/components/*`)
4. Build new (last resort, document why)

### Project Transparency Tab — components needed

| UI Element | Component | Notes |
|---|---|---|
| Page header | Existing `project-detail` layout + Material `h2` | Follows existing tab pattern |
| Summary scorecards (4) | `ZbSimplePanelComponent` (header-only variant) | Reuse existing panel pattern with `.master-card` styling |
| Scorecard progress bars | Material `mat-progress-bar` or simple CSS `.score-bar` | Lightweight, no new dep |
| Boundary component filter chips | `mat-chip-set` + `mat-chip-option` | Material, NOT ngx-library — ngx-library has no chip component |
| Entangled pairs table | `ZbRemoteTableComponent` OR `ZbCustomizableTableComponent` | Prefer remote-table for server-side filter/sort. Check `public-api.ts` for current capabilities. |
| Party indicator dot | Custom span with background-color | Trivial — no component needed |
| Status badge | `ZbResourceStatusComponent` | Already used for ZB task status, label auto-uppercases |
| Empty state (no reqs yet) | `ZbEmptyStateContainerComponent` | ngx-library standard |
| Row click → drawer | Material `mat-drawer` or `MatDialog` | Match existing task-detail drawer pattern |

### Entangled Pair Drawer — components needed

| UI Element | Component | Notes |
|---|---|---|
| Drawer container | `mat-drawer` (existing pattern in project detail?) | Verify if project detail has a drawer; if not use `MatDialog` with wide variant |
| Three-column layout | CSS grid `grid-template-columns: 1fr auto 1fr` | No component needed |
| Task card (demand & supply) | `ZbSimplePanelComponent` | Reuse |
| Bridge column | Custom styled div with arrows | Trivial — no component |
| Hash display | Monospace `<code>` tag styled via utility class | Trivial |
| Audit trail timeline | Existing `timeline-panel.component` (SME Mart shared) | ALREADY EXISTS — reuse |

### Per-Task Transparency Controls Section — components needed

| UI Element | Component | Notes |
|---|---|---|
| Expandable section container | Material `mat-expansion-panel` | Standard |
| Section title | `ZbButtonLabelComponent` OR custom `<h3>` | Check ngx-library first |
| Toggle row | `mat-slide-toggle` with leading label/sublabel | Standard Material |
| "Visible to" party selector | `ZbSimpleMultiAutocompleteComponent` | ngx-library — BUT ⚠️ see Playwright gotcha in e2e-testing-guide.md — not broken for user, only for E2E |
| Entangled pair reference | Link + badge (text only, no component) | Trivial |
| Submit/Publish button | `mat-raised-button color="primary"` | Standard |
| "Revoke publication" button | `mat-button color="warn"` with confirmation `MatDialog` | Standard |

---

## i18n

**Plan 078 is the pilot feature for SME Mart's new i18n conventions** — see `.claude/docs/I18N_CONVENTIONS.md`.

- Namespace: `Sm.Transparency.*`
- Casing: PascalCase
- Compiler: `@ngx-translate/messageformat-compiler` (installed as part of Plan 078 execution)
- Reuse from `Sm.Generic.*`, `Sm.Status.*`, `Sm.Forms.*` wherever possible
- All copywriting in this spec is written in English but MUST be added to `src/assets/i18n/en.json` under `Sm.Transparency.*` (not hardcoded in templates)
- `Sm.Common.Timeline.*` will be created during execution (timeline-panel gets promoted from single-feature to shared when Plan 078 adopts it for audit trail rendering)

## Copywriting Contract

| Element | Copy | Notes |
|---|---|---|
| **Project transparency tab label** | `Transparency` | Not "Transparency Center" (too verbose for tab) |
| **Tab icon** | `visibility` (Material icon) | Eye icon — matches "see into the project" metaphor |
| **Tab description (hover / help)** | `Published items visible to participating parties` | |
| **Page heading (tab content)** | `Transparency` | Match tab label |
| **Page subheading** | `Published evidence, requirements, and verification across all parties.` | |
| **Empty state heading** | `No published items yet` | |
| **Empty state body** | `When parties publish requirements or evidence to the transparency function, entangled pairs will appear here.` | |
| **Empty state CTA** | None. Transparency is a consequence of task activity, not a direct action here. | |
| **Summary scorecard: Requirements** | `{N} requirements` + `{verified}/{total} verified` | Numeric focus |
| **Summary scorecard: Evidence Items** | `{N} evidence items` + `{published}/{required}` | |
| **Summary scorecard: Boundary Coverage** | `{N}/{total} components` + `{list of 2-3 pending}` | |
| **Summary scorecard: Transparency Score** | `{%}` + `% of requirements with verified evidence` | Single large number |
| **Boundary filter: All chip** | `All` | |
| **Boundary filter: disabled (0 items) chip** | `{Component} (0)` dimmed | |
| **Entangled pairs table columns** | `Requirement`, `Demanded By`, `Evidence`, `Supplied By`, `Status`, `Component` | |
| **"Private" row indicator** | Row dimmed 50% + `Private` badge | Row is filterable "My Private Only" / "All Published" |
| **Entangled pair drawer title** | `Entangled Pair: {requirement name}` | |
| **Demand column label** | `DEMAND ({party name})` | Uppercase eyebrow |
| **Bridge column label** | `TRANSPARENCY` | Uppercase eyebrow |
| **Supply column label** | `SUPPLY ({party name})` | Uppercase eyebrow |
| **Bridge link state: matched** | `Match` (green badge) | |
| **Bridge link state: awaiting** | `Awaiting evidence` (amber badge) | |
| **Bridge link state: revoked** | `Revoked` (red badge) | |
| **Audit trail header** | `AUDIT TRAIL` | Uppercase eyebrow |
| **Primary CTA (task control section)** | `Publish to Transparency` | Specific verb + noun |
| **Primary CTA (supply side submit)** | `Submit Evidence` | Specific to supply role |
| **Destructive CTA** | `Revoke Publication` | |
| **Destructive confirmation title** | `Revoke Publication` | |
| **Destructive confirmation body** | `Parties who can currently see this will lose access. Audit trail is preserved. Continue?` | Explain consequences |
| **Destructive confirm button** | `Revoke` | Matches title verb |
| **Toggle section title** | `Transparency Controls` | Matches Brian's language |
| **Toggle section subheading** | `Choose what to publish to the transparency function` | Kevin's "function" language |
| **Private notes tooltip** | `Private notes are never publishable. They stay on your workspace only.` | Reinforces zero default visibility |
| **Assessor view header** | `Transparency Report — Read-Only` | |
| **Assessor view helper** | `This view shows only items explicitly published by each party. Unpublished work is invisible.` | Explicit transparency guarantee |

---

## Interaction States

### Project Transparency Tab — states

1. **Loading** — spinner + "Loading transparency report..."
2. **Empty (no reqs exist)** — `ZbEmptyStateContainerComponent` with the empty state copy above
3. **Populated, all private (no publications yet)** — show scorecards with 0% transparency score + table with only dimmed "Private" rows
4. **Populated, partial publication** — mix of published (visible) and private (dimmed) rows
5. **Error** — error state with retry button

### Per-Task Transparency Controls — states

1. **Collapsed** — header shows "Transparency Controls — {N published / {total}}"
2. **Expanded, none published** — toggles all off, "Publish to Transparency" button enabled
3. **Expanded, partial** — mix of on/off toggles, "Update Publication" button
4. **Expanded, fully published** — all relevant toggles on, "Revoke All" button (destructive)
5. **Loading after publish** — button shows spinner, toggles disabled

### Entangled Pair Drawer — states

1. **Matched & verified** — both columns show task cards, bridge shows "Match" + hash
2. **Matched but awaiting evidence** — demand card populated, supply card shows "Preparing" dashed outline, bridge shows "Awaiting"
3. **Matched but rejected** — supply card shows rejection reason, bridge shows "Revoked" in error color
4. **Not yet matched (orphan demand)** — demand card populated, supply column shows "No supply task linked yet" empty state

---

## Accessibility Contract

- All interactive elements reachable via keyboard (`tab` / `shift+tab`)
- Toggle switches must announce state to screen readers (`aria-checked`)
- Party dots must not be the sole indicator — always pair with text label ("Acme Corp (Demand)")
- Status chips must have `aria-label` with the full status ("Verified 2026-04-05")
- Color contrast ratios: 4.5:1 minimum (Material M3 tokens already comply)
- Focus indicators: use existing ngx-library focus ring styles, do not remove outlines
- Confirmation dialogs: trap focus, restore focus on close

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|---|---|---|
| ngx-library (first-party, internal) | ZbSimplePanel, ZbResourceStatus, ZbEmptyStateContainer, ZbRemoteTable, ZbSimpleMultiAutocomplete | Not required (internal first-party) |
| Angular Material M3 | mat-chip, mat-progress-bar, mat-slide-toggle, mat-expansion-panel, mat-drawer, MatDialog, mat-tab-nav-bar | Not required (first-party Google) |
| SME Mart shared | timeline-panel | Not required (internal) |

**No third-party registries.** No shadcn. No external component packages beyond the ngx-library + Material stack already in use.

---

## Open Questions (to resolve in wireframe session with Clark)

1. **Party role colors** — does SME Mart/zb-ui have an existing demand/supply/audit color convention? If yes, inherit. If no, confirm amber/green/pink.
2. **Transparency tab placement** — "Tracking" group in More menu? Or promote to primary tab (4 → 5 primary tabs)?
3. **Engagement-level roll-up** — deferred for v1 but should the UI-SPEC include a "Future: Engagement Transparency" note?
4. **Publish indicator on Kanban cards** — eye icon vs lock icon vs progress pie? Decide during Boards tab spec later.
5. **Boundary component source of truth** — are boundary components already modeled in schema, or does Plan 078 need a precursor schema PR to define them as first-class entities? (Brian's 2026-04-06 directive says "types of things within boundaries" — unclear if this is a simple enum or a full entity.)
6. **Audit trail data source** — does existing timeline-panel pull from a generic timeline service, or do we need a transparency-specific event stream?
7. **Assessor role detection** — how does the app know the current user is viewing as an assessor vs buyer vs vendor? Check if party role is already surfaced in the org context service.
8. **Hash column** — should the UI actually show the cryptographic hash (even as a future placeholder), or hide it entirely until the platform feature lands?

---

## Wireframe Session Plan (Clark's markup pass)

**Input:** Screenshots of current Engagement Detail, Project Detail (all tabs), task drawer (if implemented).
**Output:** Red-box annotations on each screenshot indicating where sketch concepts should land + any concepts that should be rejected or reshaped.

### Suggested markup targets

1. **Project Detail — More menu dropdown** — confirm Transparency lives in Tracking group
2. **Project Detail — Boards tab (coming soon)** — red box where the per-task publish indicator goes on Kanban cards
3. **Project Detail — future Transparency tab mockup** — red-box regions for scorecards, filter chips, entangled table
4. **Task Detail drawer (Boards tab, coming soon)** — red box where the Transparency Controls expansion panel lives
5. **Engagement Detail — defer** — no changes this phase
6. **Existing RFP Detail — possible integration** — does RFP have its own transparency needs? (Discussion)

After Clark's markup, produce low-fidelity wireframes (Miro board + HTML sketches) for each red-boxed area with final component decisions.

---

## Checker Sign-Off (when promoted to formal phase)

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending — awaiting wireframe session with Clark + Brian Miro board finalization

---

## Related Artifacts

- **HTML sketches (living reference):** `.claude/sketches/transparency-center-ui-concepts.html`
- **Architecture clarification (Kevin):** `.claude/notes/transparency-center-multi-party-clarification.md`
- **Data model decision (Option B):** `.claude/notes/entangled-task-pairs-model-evaluation.md`
- **Brian's Miro feedback:** `~/Projects/w3geekery/zb-poc-devs/brian-directives/2026-04-06-boundary-components-transparency.md`
- **Miro screenshots uploaded:** `~/Pictures/Screenshots/transparency-01-*.png` through `transparency-05-*.png`
- **Backlog entry:** `.planning/BACKLOG.md` Plan 078
- **Deferred platform dependencies:** Plan 071 (Entangled Task Pairs implementation), Plan 057 (Project Bloom / Board entities)
