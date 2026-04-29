# SME Mart — Backlog

**Source of truth for FEATURE WORK pending milestone planning.** New feature ideas, meeting-driven stubs, and gap analysis items live here. When starting a new GSD milestone, pull items from this backlog into REQUIREMENTS.md.

**Flow:** Backlog item → `/gsd:new-milestone` → REQUIREMENTS.md → ROADMAP phases → plan → execute → archive

**Last updated:** 2026-04-20

## Two backlog systems — know the difference

| System | Where | For | Tooling |
|---|---|---|---|
| **GSD backlog** (this file) | `.planning/BACKLOG.md` — single-file table | Feature work awaiting milestone planning. Items become phases. | `/gsd:add-backlog`, `/gsd:review-backlog`, `/gsd:plan-milestone-gaps` |
| **Director backlog** | `.planning/director/backlog/{NNN}-{slug}.md` — per-item files | Architecture decisions, cross-milestone observations, patterns to revisit. May or may not become feature work. | `/meta:backlog`, reviewed in `/meta:director design` |

**Rule of thumb:** "this might become code" → here. "architectural decision / observation / pattern concern" → director backlog.

---

## How to Use

- **Add stubs:** Drop new ideas as a row in the appropriate section. Minimum: name, one-line description, source.
- **Select for milestone:** Move items from here into the next `/gsd:new-milestone` requirements conversation.
- **After milestone ships:** Remove completed items. Update status of partially-done items.
- **Deferred items:** Stay here with a note on what's blocking them.

---

## Active Marketplace Plans (Unblocked)

These can be selected for the next milestone. Ordered roughly by business value.

| # | Plan | Description | Est. | Source |
|---|------|-------------|------|--------|
| **054** | RFP Package Builder & Access Controls | **v1.2 IN PROGRESS.** Phase 13 (pilot) complete. Phase 14 (invitations) code complete, UAT pending GQL schema. Phase 15 research done (template syntax design). D2 (document templates) = Phase 15. D3 (form builder) = Phase 16. Demo scripts = Phase 17. S2 deferred to v1.3. | 30–40 hrs | Gap analysis D1, D2, D3, S2; design session 2026-03-30 |
| **055** | Advanced Pricing & Evaluation | Complex pricing models: NRC/ARC, recurring/one-time, milestone payments, per-unit, multi-year (D4). Evaluation criteria builder with weighted scoring matrix (D5). Structured bid response templates (S3). Bid validity/expiration dates (S4). | 25–35 hrs | Gap analysis D4, D5, S3, S4 |
| **056** | Engagement Roles & Communication | Third-party facilitator role (D7). Mediated communication channels (D6). NDA/confidentiality tracking with per-vendor status, access logging, destruction attestation (P2). | 20–25 hrs | Gap analysis D6, D7, P2 |
| **065** | Message Center (Engagement-Scoped) | Engagement-level message center. Project-level messaging deferred to Project App. **Notes:** (1) Investigate [PromptQL](https://promptql.io) (Hasura) for pattern inspiration — thread-per-resource model, shared context, inline data refs, AI agent threads. 2026-04-01. (2) Slack API connector concept: create dedicated Slack channels per Project/Engagement, slurp conversations into SME Mart messaging center. Slack has full dev API (`api.slack.com`) — channel creation, webhooks, Slack Connect for cross-org. Could replace custom messaging UI entirely. 2026-04-02. | 8–12 hrs | Marketplace scope |
| **066** | Engagement Dashboard | Configurable widgets for cross-project visibility at the engagement level. | 12–16 hrs | Marketplace scope |
| **033 P5** | LLM-Assisted Bid Generation | Claude Agent SDK packaging, bundled ZB MCP tools, cost model (~$0.56/interaction). Phases 1–4 of Plan 033 complete. | ~8 hrs | Plan 033 |
| **046 remaining** | Org Document Management (remaining phases) | Phase 6: org switcher (deferred). Phase 8: external storage imports (deferred). Phase 9 roadmap: folders, colors, tagging UI, archive browser, versioning, PDF conversion, preview, bulk ops, templates. Expand with 19 new document types from gap analysis (E1). **Note:** Phase 15 (v1.2) cherry-picks template→instance workflow from 046. | ~20 hrs | Gap analysis E1 |
| **047** | Shared Notes & Versioning | Per-user sharing, note versioning (version browser/search/copy), Shared Notebook, timeline integration (share/pin events), pinned notes, task-linked checkboxes. 8 phases. | 32–40 hrs | Plan 047 |
| **052** | Playwright E2E Smoke Tests | **✅ DONE 2026-04-09** (Phases 1-3). 7 specs, 15/15 tests passing. Phase 4 (CI integration) deferred. See Completed Plans section. |  | Meeting 2026-03-13 |
| **053** | QA Skills & Cookie Import | Generic Claude Code skills (`/qa`, `/setup-cookies`) using Chrome DevTools MCP. Cookie decryption, systematic QA crawl with health scoring, regression tracking. | 16–21 hrs | Plan 053 |
| **052 P4** | Playwright E2E — CI Integration | Phase 4 of Plan 052 (deferred). GitHub Actions workflow, JUnit reporter, separate tsconfig. Add after smoke suite stable locally for 1 week. | 2–3 hrs | Plan 052 |
| **082** | Add `data-testid` attributes to key landing elements | Improve E2E test stability. No `data-testid` exists anywhere in the app — tests rely on role + text + CSS classes (brittle). Add to list headings, card containers, tab links, primary CTAs. | 3–4 hrs | Plan 052 execution finding 2026-04-09 |
| **083** | Update stale `.claude/smoke-tests/rfp-wizard-create.md` | The `/rfps/new` flow now shows an AI-extract vs step-by-step method chooser BEFORE the 5-step mat-stepper. Smoke test doc references the old flow. Also: `app-list-page` renders title as `<h2>` not `<h1>`; Angular template `{{ tab.label }}` whitespace issue. | 1 hr | Plan 052 execution finding 2026-04-09 |
| **084** | App-wide i18n migration (ngx-translate) | Migrate all hardcoded English strings to `@ngx-translate/core` keys. **Scaffolding exists** — library is installed, `TranslateService` wired up, `en.json` exists but empty. **Conventions locked** — see `.planning/docs/I18N_CONVENTIONS.md` (PascalCase, `Sm.*` namespace, ICU MessageFormat, suffix conventions, promote-on-reuse for shared components, CSS-handled uppercase). **zb/ui reference** — `projects/zb-ui-lib/src/lib/assets/i18n/en.json` is a cautionary tale (41% duplication, 38 casing inconsistencies) — analysis in `.planning/notes/i18n-zb-ui-analysis.md`. **Plan 078 pilots** the conventions. Plan 084 is the app-wide migration once pilot proves out. Includes lint script implementation (`scripts/i18n/lint-i18n.ts`). | 30-50 hrs migration + 4-6 hrs lint tooling | Plan 078 prep 2026-04-09 |
| **085** | Prefer ngx-library form components; per-component helpers for bespoke ones | **Direction, not a sprint.** When touching a form component, prefer `zb-simple-autocomplete` / `zb-simple-multi-autocomplete` (gain Playwright helpers for free, less custom Material wiring). When the UX needs more than ngx-library provides (free-text creation, protected chips, chip colors, immediate persist, collapsible/removable section wrappers, "show all as chips" mode, `Set<string>` selection shape), keep the custom component AND write per-component E2E helpers in `e2e/helpers/<component>.ts` — don't migrate just for testability. **Three known custom components** stay as-is until a feature naturally redesigns them: `app-catalog-filter-section` (RFP/services filter drawer), `app-resource-tag-autocomplete`, `app-sme-resource-tag-editor`. **None implement `ControlValueAccessor`** — Layer 1 race may not apply (verify with a spike before assuming a helper is needed). **Also watch for upstream contribution opportunities:** if we build a reusable pattern (filter drawer wrapper, chips+autocomplete+inline-create, protected-chip predicate), consider proposing it to `@zerobias-org/ngx-library` rather than keeping it SME-Mart-only. The `selectValue()` PRs (#5, #6) are the model: identify pattern → draft for ngx-library → ship upstream → consume back. Full decision process documented in `.planning/notes/e2e-testing-guide.md` § "When you hit a custom (non-zb) Material autocomplete". | Ongoing — bake into daily decisions, no dedicated migration sprint | E2E analysis 2026-04-09 |
| **078** | Transparency Controls UI Spec | Design spec for "Transparency Controls" section on each party's tasks (Plan 071). Controls that publish/subscribe to transparency bridge. **IN PROGRESS:** (1) HTML UI concept sketches (`.claude/sketches/transparency-center-ui-concepts.html`) — 5 views. (2) Screenshots uploaded to Clark's Miro board. (3) UI-SPEC draft-prep written (`.claude/ui-specs/078-transparency-controls-UI-SPEC.md`) — GSD format, target view integration mapping, component inventory, copywriting contract, 8 open questions for wireframe session. Kevin clarified: TC is a FUNCTION (not a place). Next: Clark's red-box markup pass on Engagement/Project screens → low-fi wireframes. | 4–6 hrs | Brian 2026-03-27 |
| **076** | Spike: Ollama Local LLM Integration | Evaluate Ollama for cost-reduction + capability-expansion. POC: auto-tag suggestion, embedding-based semantic search (pgvector), CVE summarization. Hybrid architecture. | 8–12 hrs POC | Research |
| **081** | UI Screenshot Catalog + Miro Gap Analysis | **(1)** Snapshot Brian's Miro diagram as baseline. **(2)** Capture screenshots of all built views/flows via Chrome DevTools MCP (RFP lifecycle, bids, invitations, vendor profile, org nav, pilots, project detail). **(3)** Overlay screenshots onto Miro where they map to Brian's diagram nodes. **(4)** Identify diagram nodes with NO corresponding UI — these become specs for views we haven't built yet. **(5)** Annotate gaps with proposed UI direction. Output: annotated Miro board showing built vs unbuilt, plus a gap list feeding future backlog items. | 4–6 hrs | Brian feedback 2026-04-06 |
| **087** | Form Template Library (save → reuse → fork-on-edit) | **From Phase 16 UAT feedback 2026-04-14.** Buyers build a form once and reuse it across RFPs. Every saved form becomes a library entry; selecting a template in the wizard pre-fills fields; editing a template forks a new version rather than mutating the original. **Auto-save on create** — starting a new form immediately creates a draft template so the user can leave and come back to edit it later, no explicit "save" step needed. **Scope:** (1) Schema — new `FormTemplate` class (`w3geekery/smemart/classes/FormTemplate.yml`) with `name`, `description`, `config` (JSON FormBuilderConfig), `ownerId`, `parentTemplateId` (fork lineage), `usageCount`, `status` (draft/published/archived). (2) Service — `form-template.service.ts` with CRUD + fork + list-by-org + auto-save draft on first field add. (3) UI in RFP wizard Step 2.5 — "Pick from library" button + template picker dialog + (implicit) auto-draft on first edit. (4) Library page — `/forms/templates` — list/search/fork/archive + drafts pinned at top. (5) Edit-detect — if user loads a published template then modifies, prompt "Save as new" vs "Overwrite" (owner-only + blocked if other RFPs reference this version). (6) **Org Documents Center integration** — from the existing Org Documents center (Plan 046 area), a link/section surfaces recent form templates; row click opens the template in the form builder for editing. Could be its own "Forms" section or embedded as a short list with "View all" → `/forms/templates`. **Dependencies:** builds on Phase 16 FormBuilderConfig model; coordinates with Plan 046 Org Documents surface. **Prompt for `/gsd:plan-phase`:** *"Plan a Form Template Library for SME Mart. Users save completed forms from the RFP wizard as reusable templates in their org's library, reuse them on future RFPs, and fork a new template when they edit one. Auto-save behavior: creating a new form immediately creates a draft template record so the user can leave and come back — no explicit 'save' button needed. Cover: (a) schema changes — new FormTemplate class with fork lineage, status (draft/published/archived), usage count, parentTemplateId; (b) service layer — form-template.service.ts with save/list/fork/archive/usage tracking + auto-draft on first field add (debounced autosave thereafter); (c) wizard UI — template picker in RFP Step 2.5 (Submission Form step), implicit autosave (no Save button while editing a fresh form), dirty-edit detection on published templates that asks Save-as-New vs Overwrite; (d) library page at /forms/templates with list/search/filter/fork/archive, drafts pinned at top with 'continue editing' affordance; (e) Org Documents Center integration — existing Org Documents view (Plan 046 area) gets a link/section showing recent form templates, row click opens that template in the form builder for editing; (f) access control — org-scoped, owner-only delete, fork preserves lineage pointer. Reference existing FormBuilderConfig (src/app/core/models/form-builder.model.ts), Phase 16 form-builder component, Plan 046 Org Documents center, and the template→instance pattern from Plan 015 (document templates) for variable-substitution parallels. Out of scope: marketplace/public template sharing, AI-generated templates."* | 22–32 hrs | Phase 16 UAT feedback 2026-04-14 |
| **088** | Split-screen Form Builder + WYSIWYG Canvas + Grouping + Info Field Type | **From Phase 16 UAT feedback 2026-04-14. Extended 2026-04-15 w/ WYSIWYG + grouping + Angular-native output.** Replace the current "expand to edit one field at a time" form builder UX with a two-pane layout: left = live rendered preview of the field being edited (or whole form when none selected), right = field properties editor. Preview tab becomes a cleaner version of the left pane — full form rendered with proper spacing, read-only. **Also adds Option B** from the same UAT conversation: new `'info'` field type for heading + description text blocks that aren't inputs (not stored in submissionData, no validation). Drops anywhere between fields as explainer content. **Scope:** (1) Redesign `form-builder.component` as two-pane grid (mat-sidenav or CSS grid). (2) Selection model — clicking a field row highlights it + loads editor in right pane. (3) Live render — left pane uses `form-field-renderer` in new `edit-preview` mode (interactive, not disabled, but no persistence). (4) Add `'info'` to `FormFieldType` enum; `form-field-editor` shows only label + description (markdown-capable) for info fields; `dynamic-form-renderer` renders them as styled callout blocks; excluded from form-group controls + submissionData. (5) Preview tab uses existing `dynamic-form-renderer` with `mode='preview'` but with builder chrome stripped (just spaced form). (6) **"Add Field" split-button** — primary button label "Add Field" inserts a field of the most-recently-used type (or default); caret opens menu of all field types (text, textarea, dropdown, number, file, checkbox, info) and selecting one inserts a field of that type pre-configured. Saves two clicks per field when the user knows what type they want. **Dependencies:** Phase 16 components exist.

**NEW (2026-04-15) — WYSIWYG canvas + grouping + Angular-native rendering:**
- **Research spike:** evaluate **HTML `<canvas>` (or SVG) drag-and-drop WYSIWYG** for field placement as an alternative to the stacked-panel + two-pane approach. Canvas enables true visual field arrangement (drag anywhere, snap-to-grid, live preview). Consider CDK drag-drop with a DOM-based canvas before committing to `<canvas>` — DOM-based may give us more for free (accessibility, text rendering, focus). Decide DOM vs. canvas based on complexity tradeoff in the spike.
- **Grouping / sub-grouping:** fields can be organized into **vertical groups, horizontal groups, and nested sub-groups**. Each group supports optional heading + description. Groups become first-class in the structured JSON config (not flat fields).
- **Rendered output contract (FIRM):** the form renderer outputs real **Angular `FormGroup` / `FormControl`** — not a custom validation shell. Groups in config map 1:1 to nested `FormGroup` instances; fields map to `FormControl` with Angular validators wired from the field's validation config (`Validators.required`, `Validators.minLength`, custom validators for regex/etc.). This preserves Angular forms semantics end-to-end — reactive forms, dirty/touched/valid states, status change streams — no custom mirror.
- **Storage:** forms stored as structured JSON (existing `FormBuilderConfig` model, extended for groups). JSON schema must round-trip through save/load/render without loss.
- **Field + group types extend Angular primitives:** custom field components wrap standard Material/ngx-library inputs but the underlying state is always a `FormControl`. Group components wrap Material layout (`mat-card` / fieldset) but the underlying state is always a `FormGroup`.

**RESEARCH COMPLETE (2026-04-16)** — 7-axis research doc at [`.planning/research/internal/2026-04-15-form-builder-refactor-research.md`](.planning/research/internal/2026-04-15-form-builder-refactor-research.md). Headline findings: (a) **DOM + Angular CDK drag-drop over HTML canvas** — canvas's accessibility/text/reuse costs outweigh the pixel-placement benefit, and arbitrary placement is actually an anti-feature for form builders; CDK covers reorder, nested drop zones, connected lists, horizontal orientation, keyboard drag, palette-to-canvas copy. (b) **Schema migration v1→v2** — discriminated union `FormNodeConfig = FormFieldConfig | FormGroupConfig` with recursive `children: FormNodeConfig[]`; existing `FormSubmission.submissionData` untouched via preserved field IDs; silent migrator at load time. (c) **Build custom** vs ngx-formly/formio/SurveyJS — each incumbent fights the "renderer outputs real FormGroup" contract. Stays Angular-native and fits the 20–26 hr estimate. (d) **6 open questions for Discuss phase:** conditional fields scope, cross-field validators, undo granularity, perf ceiling, migration trigger, column-snap UX. (e) **5 sequencing recommendations** for the planner — schema migration first, group renderer before editor, keep `form-field-renderer` untouched, etc. Research is sufficient to skip the planner's research phase and go straight to Discuss on v1.4 kickoff.

**Prompt for `/gsd:plan-phase`:** *"Plan a split-screen Form Builder redesign for SME Mart Phase 16 follow-up, plus an 'info' (heading + description, no input) field type AND a WYSIWYG canvas-style builder with hierarchical grouping. Currently the form-builder shows a stacked list of expansion panels — one expanded at a time — for field editing. Redesign the EDITING side as two panes: left = WYSIWYG canvas showing live rendered fields that can be dragged into position and grouped, right = properties editor for the currently-selected field or group. Preview tab becomes a clean full-form render with no builder chrome. Also add FormFieldType 'info' for non-input explainer blocks with heading + optional markdown description, excluded from submissionData and validation. **Research spike first:** evaluate HTML canvas vs DOM-based CDK drag-drop for the WYSIWYG surface. Pick the simpler approach that supports: (a) drag fields onto the canvas from a palette, (b) rearrange existing fields by drag, (c) group selected fields into vertical or horizontal groups with optional heading + description, (d) nested sub-groups, (e) snap-to-row/column layout feedback. **Storage + rendering contract:** forms stored as structured JSON extending FormBuilderConfig to include groups. The renderer outputs real Angular reactive forms — groups become nested FormGroup instances, fields become FormControl with Angular validators wired from the field's validation config (Validators.required, Validators.minLength, custom regex). No custom validation shell — preserve Angular forms semantics end-to-end so consumers get FormGroup.valid, statusChanges, valueChanges, dirty/touched for free. Cover: (a) form-builder.component.{ts,html,scss} two-pane layout + canvas host, selection model for fields AND groups, responsive fallback; (b) group component (vertical / horizontal / nested) with optional heading + markdown description, wraps a child FormGroup; (c) field registry mapping FormFieldType → component + default Validator set; (d) form-field-renderer — new 'edit-preview' mode interactive but non-persisting, plus 'info' field rendering as styled callout; (e) form-field-editor + new group-editor — detect 'info' and group types to show appropriate property panels; (f) dynamic-form-renderer — build nested FormGroup tree from config, skip info fields in control creation and submissionData, render groups as layout wrappers; (g) preview tab simplification — reuse dynamic-form-renderer with mode='preview'. Also replace the current single 'Add Field' button with a split-button: primary click inserts a field using the most-recently-used type (default text on first use), caret opens a menu of all field types (text, textarea, dropdown, number, file, checkbox, info) plus 'Add Vertical Group' and 'Add Horizontal Group'. Reference existing Phase 16 components at src/app/shared/components/form-builder/, FormBuilderConfig model at src/app/core/models/form-builder.model.ts, Angular Reactive Forms docs, and Angular CDK drag-drop. Out of scope: collaborative editing, template library (Plan 087), form logic/conditional-display (future)."* | 20–26 hrs | Phase 16 UAT feedback 2026-04-14 |
| **086** | zbb local stack — full prod simulation for SME Mart | **PARTIALLY PROMOTED to Phase 19 (v1.3).** Phase 19 covers cloudfront-sim + minio SPA/login serving. Hub-server + Verdaccio + postgres deferred to **089**. Original scope: compose a `zbb` slot mirroring production SME Mart deployment. Kevin confirmed feasibility 2026-04-13. | ~3-4 hrs (SPA/login serving only, via Phase 19) | Slack discussion w/ Kevin 2026-04-13 |
| **090** | Seller Credentials Catalog (roles + certifications) | **Research complete 2026-04-23. Target v1.4 or v1.5.** Brian directive: Sellers multi-select compliance/cybersecurity credentials on their profile (CMMC CCA, CISSP, FedRAMP 3PAO, etc.); Buyers filter/search Sellers by credentials. Kevin (Content) confirmed 2026-04-23 Content team will NOT own this short-term — SME Mart owns the seed catalog, Content migrates later. **Curated catalog exists** (frozen seed, external to this repo): `~/Projects/zb/ui/.claude/proposals/sme-mart-compliance-catalog.xlsx` (58 roles, 126 certs, 33 role→cert requirements, 19 sources across cyberab.org CMMC/SCF/SCA, FedRAMP, HITRUST, PCI SSC, CSA STAR, IAPP, ISO, CREST, ISACA, ISC², CompTIA, GIAC, EC-Council, OffSec, Mile2, FITSI). **Data model decision locked:** 3 new GQL classes in `zerobias-org/schema` — `Issuer`, `Certification`, `ProviderCredential`. NOT Neon tables (DataProducer writes don't work). NOT tags (flattens issuer/expiry metadata). **Pattern reuse:** clone the expertise chip-picker UI (`my-profile-expertise.component.ts`), extend `catalog-filters.component.ts` with a 7th filter row, template moderation off Reviews + `VettingStatus` enum. **Prerequisite gap:** Provider individual-vs-company scope (`ProviderProfile` has no `type` field today; C3PAO is org-level, CCA is individual) — needs resolving before credentials honor the `scope` enum. **Open questions for discuss:** (1) Provider-as-GQL-class vs opaque-UUID link to Neon `ProviderProfile` (ask Kevin). (2) GIAC enumeration (62 certs, catalog has 12) — free-form `G*` validation or complete catalog. (3) Auto-verification roadmap (Cyber AB Marketplace API, ISACA registry). (4) DoD 8140.3 refresh cadence (CAC-gated source). (5) Ecosystem filter granularity (flat 130 certs vs hierarchical). **Full research doc:** [`.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md`](.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md). **Scope:** 3 GQL classes + dataloader validation (4-6h); XLSX→GQL seed script via PipelineWrite (4-6h); Seller profile credentials section (6-8h); Buyer search filter row (2-3h); Admin catalog tab + moderation queue (8-10h); "submit custom credential" flow (4-6h); tests (4-6h). **Not in v1:** auto-verification, `RoleRequirement` join class, GIAC full enumeration, DoD 8140.3 automation. | 32–45 hrs | Brian directive + Kevin content-team decision 2026-04-23 |
| **092** | Marketplace tagType adoption — refactor tag-filter components | **From DECISIONS.md "Marketplace tagType Is Preferred for New Tags" 2026-04-29.** `zerobias-com/tag` PR #1 (Daniel Rojas merged 2026-04-29) registered `marketplace` tagType + `platform_provider` + `demo` global tags. Forward decision: NEW SME Mart tags use `tagType: "marketplace"`; existing `other`-typed tags stay (UUID-churn cost too high to migrate). **This entry covers the code-side refactor:** (1) Audit tag-filter services and components that today filter by `tagType === 'other'` (or that hardcode the type at all). (2) Update each to accept BOTH `other` and `marketplace` during the coexistence period. (3) Update any tag-creation paths (e.g., resource-tag-autocomplete inline-create) to default new tags to `marketplace`. (4) Add a unit-test fixture covering both types in lookup. **Tag NAMES retain `sme-mart.` prefix** — no name-side changes in this work. **Not blocking anything.** Phase 24 (Demo Data Visibility Gate) will use the `demo` global tag as its implementation primitive — that's covered in Phase 24's brief, not here. v1.5 hygiene candidate. | 4–6 hrs | DECISIONS.md 2026-04-29 + Daniel's PR #1 merge |
| **091** | Provider detail cosmetic polish (Phase 26 follow-up) | Two small nits surfaced during Phase 26 detail-page verify on 2026-04-28 (root-causes investigated 2026-04-28). **(1) Avatar fallback path is broken when img URL fails to load.** Template at `provider-detail.component.html:11-15` only branches on `p.avatar_url` truthiness — `@if (p.avatar_url) { <img [alt]=display_name> } @else { <span class="initials">{{ initials() }}</span> }`. When the URL is truthy but the request 404s (current state on UAT — seed at `seed-zb-provider.ts:23` writes `logo_url: 'https://zerobias.com/logo.png'`, which doesn't resolve), the browser falls back to rendering the `alt` text "ZeroBias" inside the avatar circle's CSS clip, displaying "ZeroBia" (clipped). The intended `initials()` fallback ("Z") is never reached. **Fix:** add `(error)="onLogoError()"` to the `<img>` and toggle a signal that re-routes to the `@else` branch on load failure. (Optional: also fix the seed URL to a real asset or null, but the component-level fallback is the durable fix.) **(2) "jobs completed" row missing count prefix when null.** Template at `provider-detail.component.html:34`: `<span>{{ p.total_jobs_completed }} jobs completed</span>`. When `total_jobs_completed` is null (current ZB shape — `provider-profiles.service.ts:109` sets it null because corporate providers don't have completed jobs), template renders blank + space + " jobs completed". **Fix:** wrap the row in `@if (p.total_jobs_completed !== null && p.total_jobs_completed > 0)` to hide it for corporate providers, OR coalesce with `{{ p.total_jobs_completed ?? 0 }}`. Hide is preferred — corporate providers don't have a "jobs completed" concept. Both nits contained to `provider-detail.component.{ts,html}` (and possibly `provider-card.component.*` if same patterns there). Not Phase 26 closure-blocking — Director acknowledged. | 1–2 hrs | Phase 26 closeout 2026-04-28 |
| **089** | zbb Hub Module Local Stack — **re-evaluate need first** | **Deferred from Phase 19 (2026-04-16). Director analysis 2026-04-17 suggests this may not be needed at all — READ BEFORE PROMOTING.** Original framing: extend Phase 19 infrastructure with local Hub module hosting (Verdaccio + hub-server + postgres) to iterate on SME Mart's custom Hub Module. **Architecture research finding (2026-04-17):** Hub is already a published zbb stack (`@zerobias-com/hub`) with ghcr.io images (hub-server, hub-events, hub-pkg-proxy), depends on `@zerobias-com/dana-stack`. `hub-pkg-proxy` is the proper module-publishing target, not plain Verdaccio. **Director analysis — do we need a custom Hub Module at all?** Answer: **probably no.** SME Mart is Angular 21 static export with no server routes. Data access is already served by existing platform hub modules: GQL reads, `Pipeline.receive` writes, `hydra.Tag`, `hydra.Resource`, File SDK, Dana auth. Remaining Neon-direct usage (7 tables per memory) is being migrated to Pipeline+GQL schemas. **Problems a custom Hub Module would solve + sanity check:** (1) Server-side authorization — real gap today, but Brian's v1.4 task-gated boundary API vision solves it upstream; building custom Hub Module solves it twice, probably wrong. (2) Secrets out of browser (Neon connection string, errata 015) — real, but the fix is completing the Pipeline+GQL migration, not adding a Hub Module. (3) FormSubmission server-side validation — real gap (Phase 16 Pitfall #3), but not uniquely a Hub Module's job (GQL resolver extension or platform-service module also work). (4) Domain-aggregated API — GQL already does this; if it can't, enrich the schema. (5) Long-running/batch processes — none in v1.3/v1.4 scope. (6) External-service integrations with secrets — none in SME Mart scope. (7) Centralized audit — not a stated SME Mart requirement. **Net:** One real problem (authorization) is being solved upstream. Every other problem is either already-solved, not-in-scope, or has a better-positioned solution. A custom Hub Module would be a solution looking for a problem. **Outstanding Kevin questions** (if 089 ever activates): (a) Is `hub-pkg-proxy` the right publish target for custom modules? (b) Is the W3Geekery custom Hub Module publishing pipeline working on UAT/prod (stale Feb-2026 note says it was broken)? **If activated, scope becomes:** re-evaluate whether SME Mart ever needs a custom Hub Module given Pipeline+GQL direction, likely archive. Otherwise, scope becomes consuming `@zerobias-com/hub` zbb stack + dana-stack + publishing via hub-pkg-proxy (not custom Verdaccio). **Not blocking anything.** Phase 19 v2 ships without this. | ~4-6 hrs IF activated; likely archive | Phase 19 scope reduction + Director analysis 2026-04-17 |

## Partially Complete Plans

| # | Plan | What's Done | What Remains |
|---|------|-------------|--------------|
| **054** | RFP Package Builder | v1.2 Phases 13 (pilot) + 14 (invitations) code complete. Phase 14 UAT blocked on GQL schema availability. Phase 15 research complete (template variable syntax design doc). | Phases 15-17 (templates, form builder, demo scripts). S2 deferred to v1.3. |
| **034** | GQL Schema Migration | Phases 1–4 done. Schema live in prod (17 classes), receiver pipeline created. | Phase 5: service layer. |
| **022** | Engagement → Project UI Restructuring | Phase 1 done (project shell + routes + My Projects). | Remaining phases deferred — project detail UI is Project App territory. |

## Deferred — Platform Project App (Kevin's Team)

These depend on platform Task/Board/Boundary work. UI implementation deferred until the platform Project app takes shape.

| # | Plan | Notes |
|---|------|-------|
| **057** | SmeBoard/SmeActivity/SmeWorkflow (Project Bloom MVP) | Schema entities exist (PR #8). UI deferred. |
| **058** | Saved Task Views & Board Management | Depends on 057 + platform Board. |
| **064** | Project Members View | Scoped roles, boundary membership. **Update 2026-04-13:** must render multi-engagement origins per party — each row shows "from Engagement X". Supports CE1 cross-engagement model. |
| **067** | Project Schedule View (Gantt/Calendar) | Depends on platform milestones/tasks. |
| **068** | Project Financials | Budget/billing in project context. |
| **069** | Compliance Framework Linkage | Task→control mapping depends on platform Board/Task. |
| **070** | Project Reviews / Retrospectives | PM retrospectives in project context. |
| **071** | Transparency **Entangled Tasks** (Task Pairs) | **Renamed 2026-04-13 per Brian CEO notes** — was "Entangled Task Pairs". UI labels, docs, API field names all use "Entangled Tasks" or "Task Pairs". Option B selected (design done). Implementation depends on platform Task/Board + entangled link types. |
| **072** | Task Queuing & Shift Handoff | Platform task system dependency. Brian 2026-03-24. |
| **073** | Agentic Memory Capture in Tasks | Platform task system dependency. Brian 2026-03-24. |
| **074** | Dual-Party GSD / SDD Toolkit | Depends on 071 + platform + Claude Agent SDK. Brian 2026-03-24. |

## Fire-and-Forget Remediation (Phase 20 Wave 2 deferrals)

**Purpose:** Phase 20 Wave 2 remediates 33 CRITICAL+SIMPLE call sites with await + toast. Deferred sites require more substantial UX work and are grouped here for v1.5 planning.

**Wave 2 Completed (24 MEDIUM+CRITICAL sites):**
- `notes.service.ts:52,89,118` — createNote, updateNote, deleteNote | await + toast ✅
- `note-folder.service.ts:107,230,260` — createFolder, updateFolder, deleteFolder | await + toast ✅
- `vendor-profile.service.ts:149,204,232` — create/update/delete profile items | await + toast ✅
- `org-document.service.ts:274,286,300` — archiveDocument, restoreDocument, updateDocument | await + snackBar ✅
- `project-prd.service.ts:76,164,216,270` — createPrd, updatePrd, createPrdSection, updatePrdSection | await + snackBar ✅
- `project-plan.service.ts:77,165,217,271` — createPlan, updatePlan, createMilestone, updateMilestone | await + snackBar ✅
- `sme-mart-board.service.ts:59,160` — createBoard, updateBoard | await + snackBar ✅
- `note-hierarchy.service.ts:149` — moveNote | await + snackBar ✅
- `sme-mart-workflow.service.ts:53,148` — createWorkflow, updateWorkflow | await + snackBar ✅

**Remaining (18 CRITICAL+SIMPLE sites across 8 services):**

| File:Line | Class | User Action | Current | Proposed Fix | Complexity |
|---|---|---|---|---|---|
| `bids.service.ts:368` | Bid | Submit bid draft/final | Fire-and-forget on `pushEntities` | Await + form-level error (disable button, show inline error, allow retry) | SIMPLE |
| `sme-mart-task.service.ts:82,247` | SmeMartTask | Create, update task (Brian P0) | Fire-and-forget | Await + dialog + toast on error | SIMPLE |
| `vetting.service.ts:184,226,283,309` | EngagementVettingItem | Batch initialize, status transitions, edits (4 sites) | Fire-and-forget batch | Await + per-item OR rollback error state + retry UX | SIMPLE |
| `reviews.service.ts:143,180,216` | Review | Submit, update, transition (3 sites) | Fire-and-forget | Await + form error state + disabled submit button | SIMPLE |
| `engagements.service.ts:172,193` | Engagement | Create, update (2 sites) | Fire-and-forget | Await + snackbar + modal confirmation on error | SIMPLE |
| `service-offerings.service.ts:109,139` | ServiceOffering | Create, update (2 sites) | Fire-and-forget | Await + form error state | SIMPLE |
| `rfp-invitation.service.ts:286` | RfpInvitation | Invitation send (1 site) | Fire-and-forget | Await + disable send button until success; retry dialog on error | SIMPLE |
| `sme-mart-project.service.ts:353` | SmeMartProject | Create/update project (1 site) | Fire-and-forget | Await + form error state | SIMPLE |

**Subtotal: 18 CRITICAL+SIMPLE sites remaining, all SIMPLE complexity. Wave 2 removed 15 from queue (org-document 3, project-prd 4, project-plan 4, sme-mart-board 2, note-hierarchy 1, sme-mart-workflow 2).**

**Severity:** All deferred sites are CRITICAL (user-initiated actions, loss of expected state if failure is silent). v1.5 should prioritize implementing all 18 remaining sites using the same Pattern: await + MatSnackBar.open + re-throw (or form error state for form-driven actions).

**Related:** Errata 011, Errata 023, Phase 20 AUDIT.md Wave 2 grouping, `.planning/phases/20-fire-and-forget-audit/AUDIT.md`.

---

## Cross-Engagement Multi-3PAO Audit Model (New 2026-04-13)

From Brian's CEO notes + Miro board analysis. See [research doc](.planning/research/external/2026-04-13-ceo-miro-cross-engagement-audit-model.md). These reshape the current two-party model into a cross-engagement network with selective disclosure and scope-partitioned publishing.

| # | Plan | Notes |
|---|------|-------|
| **CE1** | Home + Linked Engagement Project Model | **Confirmed 2026-04-14.** Asymmetric: project has ONE home (primary) engagement = Buyer↔Seller commerce, + N linked (secondary) engagements, typically Buyer↔Auditor aligned-with-Buyer. Linked engagements are **standing relationships** on retainer with engagement-level MSA/background/banking, but per-project commercial terms vary (not 1-contract-per-project). Seller consent to pulled-in auditors is **baked into the transparency-system agreement at primary engagement signing** — no per-request approval. Primary termination requires **mutual handshake**; linked-engagement termination auto-revokes that auditor across projects they were pulled into (cascade granularity TBD). Schema: `Project.homeEngagementId: UUID` + `Project.linkedEngagements: [{engagementId, pulledInByPartyId, scope, anonymityToggle}]`. **Foundational for CE3–CE9.** 15–20 hrs. |
| **CE2** | *(superseded by CE6)* | Originally "Selective Disclosure / Party Anonymity" as visibility gate. Reframed after screenshots — see CE6 Publish-to-Shared Pipeline. |
| **CE3** | Multi-3PAO Scope-Partitioned Audit | **Confirmed 2026-04-14.** Multiple 3PAOs linked via separate standing engagements, each with **Buyer-selected scope** — arbitrarily granular: whole-boundary, boundary-subset, AND intra-boundary partition (specific tasks/controls). Specialty-aligned task filter. Per Brian, specialties are "and, and, and, and" — healthcare vertical examples: clinical compliance, clinical engineering/HL7, cybersecurity (HIPAA/NIST/SOC2), AI governance. **Scope overlap explicitly supported** (Buyer "bake-off" second-opinion pattern). Publishing API-enforced to scope. **Conflict arbitration flows through the Cybersecurity SLA (CE8), not ad-hoc Buyer adjudication.** 3PAOs are "category #1" in the SME Mart directory. Depends on CE1 + CE5 + CE8. 20–28 hrs. |
| **CE4** | **Task Entanglement (N-party)** — formerly "Twinned Boundary Requirements" | **Updated 2026-04-15.** Every boundary requirement generates a Demand/Supply **entanglement** — not strictly a pair. Can be pair, trio, quartet, quintet, sextet... Minimum 2 parties (commerce axiom). Independent RAG status per party-role, party-scoped visibility. **This is the canonical opt-in data transparency mechanism** per the core invariant — the one and only seam for cross-party data. Entanglements have a lifecycle: evolve in-place (versioned as parties join) OR die-and-respawn on reassignment (rules tbd). Expands Plan 080; aligned with Plan 071 (Entangled Tasks). 14–22 hrs. |
| **CE5** | Protocol Gateway — Task-Level Grants | Permission enforcement at task/subtask granularity (not just boundary-level). Grant types: read, write, publish-to-shared, close-task. Default grant matrix per task-type template. Blocks CE3. 18–24 hrs. |
| **CE6** | Publish-to-Shared Pipeline + Anonymity | **Confirmed 2026-04-14.** Private 3PAO workspace → elevated findings published to shared transparency center. **Anonymity is a per-linked-engagement TOGGLE, Buyer-controlled** (not enforced platform-wide). Default/best-practice = anonymous (the "0-bias standard"). When on: mask org/logo/contact/principals; preserve role + specialty. Remediation flows THROUGH the transparency center (alerts + rights-to-cure 30/60/90d) — auditor identity stays anonymous through remediation; penalties/cure-windows/contractual-outs pre-defined in the Cybersecurity SLA (CE8). Replaces CE2's visibility-gate approach. Depends on CE1; integrates with CE8. 16–22 hrs. |
| **CE7** | Sub-Project Hierarchy (`parentProjectId`) | Add `SmeMartProject.parentProjectId` for structural work-breakdown. **ONE home engagement per project tree** — sub-projects inherit `engagementId` immutably. Cross-engagement participation for sub-projects handled via CE1 linked engagements on the root + scope narrowing per sub-project (extend `LinkedEngagementScope.subProjectIds: [UUID]`). Lateral project↔project relationships (`depends_on`, `relates_to`) continue to use platform resource links, not `parentProjectId`. Cascade: archive parent → archive children; delete blocked if children exist. Schema PR + 15-min reload. 6–8 hrs. |
| **CE8** | **Cybersecurity SLA — First-Class Contract Template** (NEW 2026-04-14) | Assessor-packaged continuous-monitoring contract: assessment logic + legal terms + rights-to-cure windows (30/60/90d) + penalty/out clauses. Buyer subscribes; terms are imposed into primary-engagement contract with Seller. **Authoritative for conflict arbitration** (scope overlap, threshold breaches). Likely a reusable SME Mart entity type published by 3PAOs, subscribed-to by Buyers, inserted into Engagement as SLA attachment. Depends on CE1 + CE3 + CE6. Source: Brian 2026-04-14 meeting. 18–24 hrs. |
| **CE9** | **Nested Transparency Centers** (NEW 2026-04-14) | Each project has its own transparency center. Linked projects create linked transparency centers. Buyer↔Auditor (linked engagement) may need a **secondary** transparency center that publishes into the **primary** transparency center. Brian's "inception" nesting concern — depth limit and rollup semantics unresolved. Touches CE1 (linked-engagement scope), CE6 (publish pipeline), and CE7 (sub-project hierarchy). Research-then-plan; scope estimate TBD after depth investigation. **Note:** CE11's 3-level activity log rollup may resolve most of this; re-evaluate after CE11. |
| **CE10** | **Typed Project Relations (flat graph)** (NEW 2026-04-15) | Add `project_relation` entity/edge for lateral project↔project links: `relates_to`, `depends_on`, `blocked_by`, `requires`, `supersedes`, `derives_from`. DAG semantics, validation layer prevents cycles on `depends_on`/`blocked_by`. Leverages ZB platform resource-link system. Complements (may deprecate) CE7's `parentProjectId`. Source: Multica `multica-flat-projects-with-relations` pattern. 8–12 hrs. |
| **CE11** | **Append-Only Activity Log with ZB Extensions** (NEW 2026-04-15) | New `ActivityLog` class: append-only, hash-chained (Merkle-style tamper evidence), with `boundary_set`, `engagement_id`, `portfolio_id`, `party_visible_to` fields. **Default private to its workspace** (confirmed Brian 2026-04-15); transparency propagation is **opt-in via linked task pairs (req↔sat)** — ties to CE4 Demand/Supply twins as the canonical opt-in mechanism. Rollup chain available when opted in: workspace → project → portfolio. Replaces concept-only references in CE6 + CE9. Source: Multica `multica-activity-log-pattern` + ZB multi-party extensions. 20–28 hrs. |
| **CE12** | **Boundary Subset Enforcement (4-level chain)** (NEW 2026-04-15) | Enforce `engagement.boundaries ⊇ portfolio.boundaries ⊇ project.boundaries ⊇ workspace.boundaries`. Each level can only tighten, never loosen. Middleware rejects violations at write time. Provides mathematical clarity for Brian's "deepest requirements auditing" goal — schema enforces scoping, not policy docs. Source: Multica `multica-boundaries-as-first-class` pattern + CE3 partial-scope language. 10–14 hrs. |
| **CE13** | **Within-Project Workspace (crew isolation + aperture)** (NEW 2026-04-15) | Net-new `Workspace` entity scoped to a project. Contains: members (humans + agents), skills, scoped activity log, boundary subset. **Aperture** is a **tag-based** attribute (hydra tags, malleable, user-customizable — confirmed Brian 2026-04-15 10:31 AM) — not a fixed enum; the 3PAO specialty taxonomy is a common seed set. **Workspaces are private + anonymous by DEFAULT** (confirmed Brian 2026-04-15). Transparency is opt-in via linked task pairs (req↔sat, ties to CE4 Demand/Supply twins). Workspace = "agent/human crew within a project." 3PAO audit crews are natural workspaces. Depends on CE10/CE11/CE12. 18–24 hrs. |
| **CE14** | **Portfolio (project wrapper under engagement)** (NEW 2026-04-15) | Net-new `ProjectPortfolio` entity wrapping N projects under **one engagement** (confirmed Brian 2026-04-15 10:28 AM — engagement is highest level, no cross-engagement portfolios "until someone asks"). Carries the multi-project transparency dashboard UX: projects sortable, workspaces drillable by aperture. Brian's "project portfolio / folio" term. Portfolio boundaries ⊆ Engagement boundaries (CE12). Nav sibling (no new entity for now): **Engagement Portfolio** — directory view sorting all engagements the party has access to ("just a directory structure" per Brian). Depends on CE1 + CE11 + CE12. 20–28 hrs. |

### Existing plans updated by this research

- **071** → renamed "Entangled Tasks" / "Task Pairs" (terminology change)
- **080** → expand to support twinned (Demand/Supply) boundary requirements (CE4)
- **078** → UI spec must cover Private workspace view, Publish-to-Shared dialog, RAG rollup per boundary type
- **064** → render multi-engagement origins per party
- **041** → add 3PAO capability declaration (specialty taxonomy: AI, Quantum encryption, IAM, cyber, agent audit, etc.)
- **056** → reframe "third-party facilitator role (D7)" as 3PAO/Auditor role detailed in CE1–CE6

### Resolved 2026-04-14 (Marketplace meeting w/ Brian — full answers in [research doc](.planning/research/external/2026-04-13-ceo-miro-cross-engagement-audit-model.md) + [meeting notes](.planning/notes/meetings/2026-04-14-marketplace.md))

1. ✅ Engagement ↔ Project cardinality → Asymmetric (primary + linked), not many-to-many
2. ✅ Seller consent → Baked into transparency-system agreement at Engagement 1, not per-request
3. ✅ Anonymity persistence → Auditor stays anonymous; remediation flows through transparency center via Cybersecurity SLA (see CE8)
4. ✅ 3PAO capability registry → Both — marketplace-curated directory + vendor-declared extensions; 3PAOs are "category #1"
5. ✅ Scope overlap arbitration → Buyer decides, authoritative via Cybersecurity SLA terms
6. ✅ 3PAO discovery → Both — catalog + BYO; BYO 3PAOs must register in SME Mart (private placement flow)

### New open questions (from 2026-04-14 meeting)

1. Nested transparency centers — depth limit before the model breaks? (drives CE9 scope)
2. Global/meta auditor role — does a regulator/board-level observer need cross-transparency-center visibility?
3. Cybersecurity SLA structure — reusable entity type vs free-form attachment (leaning entity type; drives CE8 schema)
4. Termination cascade granularity — auditor revoke global-per-buyer vs per-project?

### Resolved 2026-04-15 (Slack thread w/ Brian — workspace patterns)

Full analysis: [`.planning/research/internal/2026-04-15-workspace-patterns-for-sme-mart.md`](.planning/research/internal/2026-04-15-workspace-patterns-for-sme-mart.md)

1. ✅ Portfolio cross-engagement scope → **Single engagement only.** Engagement is the highest level; no cross-engagement spanning. Future concept: **Engagement Portfolio** = directory view of all engagements (nav only, not a new entity). Hierarchy: Engagement Portfolio → Engagement → Project Portfolio → Project → Workspace.
2. ✅ Aperture taxonomy → **Tag-based (malleable, user-customizable).** Uses hydra tags, not a fixed enum. 3PAO specialty list is a natural seed set.
3. ✅ Workspace activity privacy → **Default private + anonymous.** Transparency is **opt-in via linked task pairs (req↔sat)** — ties directly to CE4 Demand/Supply twins as the canonical opt-in mechanism.
4. ⏸ Workspace archive cascade → **Deferred** per Brian.

### New open questions (from 2026-04-15 11:43–11:49 AM — N-party task entanglement)

Brian: "May be more than a 'pair'. May be a trio, quartet: task entanglement." And: tasks can evolve or die-and-respawn on reassignment.

1. Entanglement cardinality growth — automatic when additional parties claim a req, or explicit Buyer invitation?
2. Entanglement lifecycle — which scenarios evolve-in-place vs die-and-respawn? What's the reassignment default?
3. Versioning semantics — when an entanglement evolves, does the old version stay queryable (audit history) or collapse into the new?
4. Role flexibility — always 1 Demand + N Supply, or can roles be more flexible (joint-buyer, multi-demand scenarios)?

## Automation (Claude `/schedule`)

Candidates for recurring scheduled tasks via Claude Code `/schedule` (cloud-hosted, runs on Anthropic infrastructure).

| Task | Frequency | What It Does |
|------|-----------|-------------|
| `#zb-poc-devs` Slack scan | Daily | Scan channel for new messages, flag items relevant to SME Mart |
| ZB dependency check | Weekly | Check `angular-client`, `ngx-library`, `data-utils` for new versions |
| `zb-poc-devs` repo scan | Daily | Check for new platform learnings, glossary updates, schema namespace changes |
| Schema PR status | On-demand | Poll open PRs on `zerobias-org/schema` for CI status |

## Future Concepts (Not Yet Planned)

| Item | Description | Source |
|------|-------------|--------|
| **040** | Project Bloom (AI Document Decomposition) | Accepted Bid → Engagement + Project → AI decomposes docs into typed task/subtask tree. Expand: assessment task templates (E2), deliverable templates (E4). |
| **042** | Project Plugin (MCP + Templates + Parsers) | Bundled plugin: MCP skills, document parsers, task type templates, questionnaire flow. Dual-path: legacy doc ingestion + native creation. |
| **050** | Internal Marketplace (BU-to-BU) | Intra-company marketplace using same supply/demand constructs. Meeting 2026-03-13. |
| **051** | Reverse Bid Flow (Supply-Originated Proposals) | Suppliers propose projects to demand side within existing engagements. Meeting 2026-03-13. |
| **AI Agent RFP Assistant** | Claude Agent SDK-powered conversational RFP creation + bid evaluation for non-technical buyers. | [Proposal 003](../../proposals/003-ai-agent-rfp-assistant.md) |
| **Agentic Optimization** | AI execution scoring, drift detection, policy-aware optimization, admin AI health panel. | [Notes](../../notes/agentic-optimization-concepts.md) |
| **Org Switcher (user menu)** | Org-switcher dropdown in the user menu, mirroring `zb/ui` portal pattern. Calls `app.selectOrg(org)` which writes Dana cookie + sessionStorage via SDK. Resolves the recurring "dropped into last-in-list org" issue (SDK `selectDefaultOrg` fallback at `zerobias-client-app.ts:177` picks `orgs.at(-1)` when no cached org). First-class UX instead of DevTools snippets. Reference: `~/Projects/zb/ui/` portal user-menu component. | 2026-04-15 Clark |

## Future Backlog (Gap Analysis Leftovers)

Items deferred from the RFP gap analysis — revisit when Phase 1/2 plans are complete.

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| D8 | Bid/performance bond management | Low | — |
| D9 | GenAI disclosure tracking | Low | — |
| S6 | Legal attestation forms (notarized affidavits, non-discrimination) | Medium | — |
| E6 | Multi-year contract lifecycle management | Low | Renewal notifications, extension options |
| P1 | Vendor conference scheduling with calendar integration | Low | — |
| P3 | Site visit coordination through platform | Low | — |
| CLEANUP-25 | Phase 25 audit residue cleanup — `markDeleted` for `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df` (MarketplaceProfileItem class `7bcf86a5-91dc-520d-b9bf-e308b1078d46`) and `64047b6c-52e7-4592-ac1d-27f5020d1e01` TAG-SHAPE-TEST-C (SmeMartProject class `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`) | Low | Pipeline.receive requires non-empty `data`; piggyback on next real ingest per class. Pipeline `43f08afd-7ab9-4e99-a93c-619c46adaabe`. |

## Platform Alignment

| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| GQL Schema Package | High | **Live** (17 classes on UAT + Prod) | Plan 034. RfpInvitation + isInvitationOnly pending (Phase 14). |
| Task-backed Reviews | Medium | Planned | Reviews use ZB Task approval workflow instead of custom status field |
| `@zerobias-org/types-core-js` — PagedResults\<T\> | Low | Evaluate | Replace custom pagination. Requires Node 22+ ESM — verify Angular 21 build compat. |
| Document / Service Offering types | Pending | Blocked on Kevin | Are these existing ZB types or defined via GQL schema extension? |

---

## Completed Plans (Reference Only)

<details>
<summary>Click to expand — 29 completed plans</summary>

| # | Plan | Completed |
|---|------|-----------|
| 079 | My Organizations Refactor (three-tier org nav) | ✅ v1.1 Phase 7 |
| 080 | Project-Centric Boundary Model (Internal/External, parties) | ✅ v1.1 Phase 12 |
| 041 | Supply-Side Vendor Profile (6-section, pointers, pre-fill) | ✅ v1.1 Phases 8-11 |
| 077 | Pilot Projects (projectType, completion, promotion) | ✅ v1.2 Phase 13 |
| 059 | AuditgraphDB Migration (Neon → Pipeline + GQL) | ✅ v1.0 Phases 1-6 |
| 015 | Navigation & Taxonomy Restructuring | ✅ |
| 017 | Engagement Tasks Tab | ✅ |
| 018 | Engagement Activity Center (Timeline) | ✅ |
| 019 | Markdown Components (Milkdown Crepe + Renderer) | ✅ |
| 026 | Notes Feature | ✅ |
| 027 | OneNote-Style Togglable Column Layout | ✅ |
| 028 | Drag-and-Drop for Folders & Notes | ✅ |
| 029 | Hierarchical Tag Naming Convention | ✅ |
| 030 | SmeMartResource Abstraction Layer | ✅ |
| 031 | Document Upload to Engagement | ✅ |
| 032 | RFP Creation Wizard | ✅ |
| 033 (P1–4) | Vendor Bid Response Flow | ✅ (Phase 5 pending) |
| 035 | Engagement Tab Routes Refactor | ✅ |
| 036 | RFP / Engagement Route Split | ✅ |
| 037 | ZB Resource Tag Editor Component | ✅ |
| 038 | Document-Notes Cross-Linking | ✅ |
| 039 | Tag Prefix Migration | ✅ |
| 043 | Proposal-to-Bid Rename Migration | ✅ |
| 046 (P1–5,7) | Org-Level Document Management | ✅ (Phase 6/8/9 pending) |
| 048 | Notification Center | ✅ |
| 049 | Unit Testing Strategy | ✅ |
| 060 | ensureDefaultFolder Race Condition Fix | ✅ |
| 061 | Pipeline Write Cache | ✅ |
| 062 | Notebook Info Page | ✅ |
| 063 | Corporate Vetting Flow | ✅ |
| 075 | RFP → Project Refactor | ✅ |
| 052 (P1-3) | Playwright E2E Smoke Tests | ✅ 2026-04-09 (Phase 4 CI deferred) |

Cancelled/Superseded: 016, 020, 021, 023 (stub), 024 (stub), 044, 045

</details>

---

## Key Architecture Decisions

Carried forward from PLAN.md — these inform all future milestones.

| Decision | Detail |
|----------|--------|
| Engagement/Project hierarchy | Engagement = corp-to-corp wrapper. Project = scoped work. One Engagement → many Projects. |
| Terminology | RFP = Request for Project. Vendor response = Bid (NOT Proposal). |
| Bidirectional requirements | Both buyer AND vendor have requirements at Engagement and Project levels. |
| MSA flexibility | MSA can attach at Engagement level (umbrella) OR Project level (scoped). |
| RFP → Bid → Project (phased bloom) | RFP is lightweight storefront. Accepted Bid triggers Engagement + Project. AI decomposes docs into task tree. |
| Supply-side one-time profile | Vendors load corporate docs/D&B/banking once. Pre-fills for every engagement. |
| Task status lifecycle | pending → in_progress → awaiting_approval → completed |
| Three-sided visibility | Demand (requirements + status), Supply (execution + internal notes), Shared (audit trail) |
| Platform realization | Vendor → Org. Service offering → Boundary. Owner → Principal. Per Kevin. |
| SME Mart scope | Marketplace + Engagements. Project management = separate platform app (Kevin, 2026-03-25). |

---

## Scanner Watch (auto-updated by Slack AI scanner)

External research drops from `#ai-*` Slack channels, mapped to plans. Full analyses in `.planning/research/external/`. Scanner source: `~/.claude/slack-scanner/`.

| Plan # | External Research Drops |
|--------|-------------------------|
| 033 P5 | 2026-04-09-pattern-skills-vs-mcp, 2026-04-13-pattern-coralos-marketplace |
| 041 | 2026-04-13-ceo-miro-cross-engagement-audit-model |
| 064 | 2026-04-13-ceo-miro-cross-engagement-audit-model |
| 065 | 2026-04-10-tool-promptql, 2026-04-13-pattern-coralos-marketplace |
| 071 | 2026-04-13-ceo-miro-cross-engagement-audit-model |
| 074 | 2026-04-09-pattern-skills-vs-mcp |
| 078 | 2026-04-10-tool-promptql, 2026-04-13-ceo-miro-cross-engagement-audit-model |
| 080 | 2026-04-13-ceo-miro-cross-engagement-audit-model |
| CE1–CE6 | 2026-04-13-ceo-miro-cross-engagement-audit-model (origin) |

---

## Scanner Spikes

| # | Plan | Description | Est. | Source | Analysis |
|---|------|-------------|------|--------|----------|
| **999.1** | PromptQL Pattern Extraction for Plan 065 | Evaluate thread-per-resource, wiki-from-conversations, and permission-aware messaging patterns from PromptQL for engagement-scoped message center design | 4–6 hrs | spike from scanner | ~/.claude/slack-scanner/analysis/deep/promptql.md |

---

*Migrated from `.claude/plans/public/PLAN.md` on 2026-03-30. Old plan files archived to `.claude/plans-archive/`.*
