# Stitch + DESIGN.md Pipeline for GSD UI Phases

Prototype established **2026-04-24** against Phase 22 (Form Template Library)
as a pilot for wiring Google Stitch and the Google Labs DESIGN.md spec into
the existing `/gsd:ui-phase` workflow.

## Problem it solves

`/gsd:ui-phase` currently produces a `UI-SPEC.md` via the `gsd-ui-researcher`
agent, but mockups are informal — red-box markups, ad-hoc HTML sketches, or
prose-only descriptions. This leaves the `gsd-ui-checker` and `gsd-ui-auditor`
agents with no shared visual contract to score against, and leaves
implementers guessing at layout nuance.

Stitch generates fast, full-color UI mocks from text prompts. DESIGN.md
captures the *token system* — colors, typography, components — in a format
lint-able by a CLI and consumable by any agent.

Together: Stitch gives us **visual artifacts**, DESIGN.md gives us the **token
dictionary** that keeps generated artifacts on-brand.

## Pipeline

```
.claude/design/DESIGN.md           <-- canonical tokens (project-wide, reviewed once)
           |
           v
Stitch prompts (paste Design System Preamble + per-screen prompts)
           |
           v
PNGs --> .claude/ui-specs/<phase>/mocks/*.png
           |
           v
UI-SPEC.md references tokens AND mock filenames
           |
           v
gsd-ui-checker / gsd-ui-auditor score against UI-SPEC + mocks + DESIGN.md
```

## File Layout

```
.claude/
  design/
    DESIGN.md                 # canonical token contract (Google spec)
  ui-specs/
    022-form-template-library/
      UI-SPEC.md              # references DESIGN.md + mocks/
      stitch-prompts.md       # Design System Preamble + per-screen prompts
      mocks/
        s1-library.png
        s2-picker.png
        ...
  notes/
    stitch-designmd-pipeline.md   # this file
```

## Per-phase workflow

1. **Start a UI phase.** `/gsd:ui-phase <N>` (or manual setup). The phase has a
   brief at `.planning/director/phase-<N>-brief.md` with goal + deliverables.
2. **Create the phase ui-spec folder:** `.claude/ui-specs/<NN>-<slug>/` with
   `UI-SPEC.md`, `stitch-prompts.md`, `mocks/`.
3. **Author the UI-SPEC skeleton first** — component inventory, route map,
   token references, open questions. This forces the screen list before any
   mock is generated, so prompts stay scoped.
4. **Author Stitch prompts** — one per screen. Each prompt reuses a shared
   "Design System Preamble" that injects DESIGN.md token values so generated
   mocks match the real theme. Specify filename per screen for consistency.
5. **Clark runs Stitch manually** (web app at
   [stitch.withgoogle.com](https://stitch.withgoogle.com/) — no CLI, no
   programmatic access). Pastes the preamble, then each prompt, exports PNG
   into `mocks/` with the prescribed filename.
6. **Iterate on UI-SPEC** once mocks are in hand — fill in layout details the
   prompts couldn't guess, resolve open questions, tune the component
   inventory.
7. **Lint DESIGN.md** if it was touched:
   `npx @google/design.md@latest lint .claude/design/DESIGN.md`.
   Zero errors required; orphan-token warnings are acceptable (we carry the
   full M3 palette even when only a subset maps to components).
8. **`gsd-ui-checker`** validates the UI-SPEC against its 6-pillar rubric.
   The mocks + DESIGN.md give it visual context. Implementation begins once
   the checker returns PASS.
9. **`gsd-ui-auditor`** (post-implementation) reviews the built UI against
   DESIGN.md token usage and UI-SPEC component mapping.

## What Stitch is NOT

- **Not an implementation source.** Stitch exports generic HTML/React; the
  project is Angular 21 + `@zerobias-org/ngx-library`. Mocks are ideation
  only. The UI-SPEC names the real primitives (`ZbSimplePanelComponent`,
  `ZbRemoteTableComponent`, `MatDialog`, etc.) that the implementer must use.
- **Not a design system library.** It does not know ngx-library. Feeding it
  the token set in the preamble is the only way to keep generations on-brand.

## Automation — `.claude/scripts/stitch-gen.mjs`

**Pipeline is fully automated end-to-end** via a Node script that uses
`@google/stitch-sdk` directly with OAuth/ADC. No MCP server, no API key.

Invocation:

```bash
node .claude/scripts/stitch-gen.mjs \
  --prompt-file <path-to-prompt.txt> \
  --out .claude/ui-specs/<NN>-<slug>/mocks/s<N>-<slug>.png \
  --device desktop
```

Options:
- `--prompt "..."` — inline prompt (alternative to `--prompt-file`)
- `--stitch-project <id>` — reuse specific Stitch project (default: reads `.stitch-project-id`)
- `--title "..."` — title for new Stitch project on first run
- `--device desktop|mobile|tablet|agnostic` (default: desktop)

First invocation creates a Stitch project and persists the ID to
`.claude/scripts/.stitch-project-id` (gitignored). Subsequent runs reuse it
so all screens share style context.

**Prerequisites:**
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- ADC set up with cloud-platform scope: `gcloud auth application-default login`
- Quota project set: `gcloud auth application-default set-quota-project clark-claude-tools`
- `.claude/scripts/` deps installed: `cd .claude/scripts && npm install`

**What the script does:**
1. Grab OAuth access token from ADC
2. Instantiate `StitchToolClient` with `accessToken + projectId` (GCP project)
3. Create/reuse Stitch project
4. `project.generate(prompt, deviceType)` → `Screen`
5. `screen.getImage()` returns screenshot URL
6. Download PNG, save to `--out` path

**Why a script instead of the official MCP:**
- `@_davideast/stitch-mcp proxy` (the de-facto MCP) **requires `STITCH_API_KEY`** to boot, even in OAuth mode (bug in the package).
- API keys don't authorize the Stitch API's tool endpoints (`list_projects`, `create_project`, etc.) — those require OAuth.
- The SDK supports OAuth directly, so bypassing the MCP is simpler and more reliable.

**Regenerating mocks when DESIGN.md changes:**

```bash
# one-shot reset: drop project ID so next run creates a fresh project with new style context
rm .claude/scripts/.stitch-project-id
# then rerun the 5 screen prompts
```

## DESIGN.md specifics

- Lives at `.claude/design/DESIGN.md`, authored against version `alpha` of the
  spec.
- Front matter contains tokens (colors, typography, rounded, spacing,
  components); markdown body contains rationale, do's/don'ts, references.
- Section order is enforced by the linter: Overview → Colors → Typography →
  Layout → Elevation → Shapes → Components → Do's and Don'ts.
- Component entries use only the spec's valid props: `backgroundColor`,
  `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`.
  Variants (hover, active, disabled) are *separate entries* with related key
  names (e.g., `button-primary`, `button-primary-hover`).
- Orphan-token warnings are expected when the palette carries more colors
  than components reference. Resolve them only when it reflects an actual gap
  in the component catalog.

## Useful CLI commands

```bash
# Lint
npx @google/design.md@latest lint .claude/design/DESIGN.md

# Compare two DESIGN.md revisions (e.g., before/after a theme bump)
npx @google/design.md@latest diff .claude/design/DESIGN.md DESIGN.new.md

# Export tokens for Tailwind or W3C DTCG consumers (not used in Angular project)
npx @google/design.md@latest export --format dtcg .claude/design/DESIGN.md > tokens.json

# Emit the DESIGN.md spec itself (useful for agent prompt context)
npx @google/design.md@latest spec --rules
```

## When to update DESIGN.md

- A new ngx-library component ships AND we start using it. Add its token
  entry.
- The ngx-library palette changes upstream (rare — we own the ngx-library
  fork). Re-run the source palette through M3 tone resolution and update the
  hex values.
- A status chip variant is added/removed. Status chip palette lives in the
  color block and the `chip-status-*` components.
- A new typography scale is adopted across the app. Add the scale, then
  reference it from relevant components.

Treat DESIGN.md updates like schema changes: they are noticeable, they affect
downstream generation, they should be reviewed.

## Current status

- [x] DESIGN.md drafted from ngx-library tokens (lint: 0 errors, 13 orphan
  warnings acceptable).
- [x] Phase 22 UI-SPEC skeleton at
  `.claude/ui-specs/022-form-template-library/UI-SPEC.md`.
- [x] Phase 22 Stitch prompts at
  `.claude/ui-specs/022-form-template-library/stitch-prompts.md` — 5 screens.
- [x] Phase 22 mocks generated manually via Stitch web UI (s1..s5 in `mocks/`).
- [x] Project adapter agent at `.claude/agents/gsd-ui-researcher-sme-mart.md`.
- [x] Automation script at `.claude/scripts/stitch-gen.mjs` — working end to
  end with OAuth/ADC; smoke-tested 2026-04-24 generating a login card PNG.
- [ ] Regenerate Phase 22 mocks through `stitch-gen.mjs` (optional — current
  manual mocks are good enough for ideation; rerun only if DESIGN.md drifts).
- [ ] UI-SPEC iteration pass after mocks reviewed.
- [ ] `gsd-ui-checker` run to score the spec before Phase 22 planning begins.

## Open question

Is it worth codifying this pipeline into the `gsd-ui-researcher` agent prompt
so every future UI phase produces the `DESIGN.md`-referencing `UI-SPEC.md` +
Stitch prompts scaffolding by default? Revisit after Phase 22 uses this end
to end.
