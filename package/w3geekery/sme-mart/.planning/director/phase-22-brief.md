# Phase 22 — Form Template Library (Plan 087)

**Milestone:** v1.3
**Est:** 22–32 hrs
**Repos:** `app/` (SME Mart), `schema` (new `FormTemplate` class via cross-fork PR)
**Origin:** Phase 16 UAT feedback 2026-04-14 — buyers want to reuse forms across RFPs.

## Goal

Let buyers save completed forms from the RFP wizard as reusable templates in their org's library, reuse them on future RFPs, and fork a new template when editing a published one. Auto-save behavior: creating a new form creates a draft template record immediately so the user can leave and come back with no explicit "Save" step.

## Architecture

Six-part delivery, all from the BACKLOG.md 087 entry:

### 1. Schema — new `FormTemplate` class

- Location: `schema/package/w3geekery/sme-mart/classes/FormTemplate.yml` + companion fields in `fields/FormTemplate.*.yml`
- Properties:
  - `name`, `description`
  - `config` — JSON `FormBuilderConfig` (reuse Phase 16 model)
  - `ownerId` — org scope
  - `parentTemplateId` — fork lineage (nullable)
  - `usageCount` — incremented when RFP wizard uses the template
  - `status` — `draft` | `published` | `archived`
- Follows SCHEMA_CHANGE_PROCESS.md: fields/*.yml AND classes/*.yml, dataloader validation against Supabase scratch DB, PR to `zerobias-org/schema:dev`, wait for CI SUCCESS, wait for merge (no self-merge).

### 2. Service — `form-template.service.ts`

- CRUD via Pipeline write + GQL read (standard pattern)
- `save(template)`, `list(orgId, opts)`, `fork(templateId)`, `archive(templateId)`, `incrementUsage(templateId)`
- Auto-draft: on first field add in a new form, create a `status: draft` FormTemplate record immediately; debounced autosave thereafter
- **Fire-and-forget discipline:** follow Phase 20 guidance — user-triggered writes (save, fork, archive) must `await` + surface errors; background usage-counter increments can stay fire-and-forget

### 3. RFP Wizard integration (Step 2.5)

- "Pick from library" button opens template picker dialog
- Picker shows published templates for the org, filter by name, sort by usageCount
- Selection pre-fills form fields in the wizard
- Drafts NOT shown in the picker; they live in the library page

### 4. Library page — `/forms/templates`

- List + search + filter (status, name, owner)
- Drafts pinned at top with "continue editing" affordance
- Fork / archive / delete actions (delete owner-only, blocked if referenced by RFPs)
- Usage stats per template

### 5. Edit-detect on published templates

- If user loads a published template and modifies a field, prompt: "Save as New Version" (forks) vs "Overwrite" (owner-only + blocked if other RFPs reference this version)
- Fork preserves `parentTemplateId` lineage

### 6. Org Documents Center integration (coordinate with Phase 21)

- From `/org` → Documents tab, surface recent form templates as a section (or link to `/forms/templates`)
- Row click opens the template in the form builder for editing
- Phase 21 brief already notes this coordination

## Requirements

- **FT-01:** Users can save a FormBuilderConfig as a named, org-scoped template.
- **FT-02:** Creating a new form auto-creates a draft FormTemplate; no explicit Save action required to persist in-progress work.
- **FT-03:** Buyers can pick a published template in the RFP wizard Step 2.5, pre-filling the form.
- **FT-04:** `/forms/templates` lists drafts (pinned), published, and archived templates with search/filter.
- **FT-05:** Editing a published template prompts Save-as-New-Version vs Overwrite; Overwrite is owner-only + blocked when other RFPs reference the version.
- **FT-06:** Forking preserves a `parentTemplateId` pointer.
- **FT-07:** Usage count increments when a template is selected in the RFP wizard.
- **FT-08:** Org Documents Center exposes a recent-templates surface linking back to `/forms/templates`.
- **FT-09:** Schema PR merged to `zerobias-org/schema:dev` with CI SUCCESS (not SKIPPED), both classes/*.yml and fields/*.yml present, no self-merge.

## Dependencies

- Phase 16 FormBuilderConfig model + form-builder / dynamic-form-renderer components (shipped v1.2)
- Phase 21 Org Documents Center (this milestone — coordinate surface)
- Phase 20 fire-and-forget guidance (audit complete before user-triggered writes are wired)
- `zerobias-org/schema` repo PR workflow

## Verification

- Schema PR: `gh pr view <N> --repo zerobias-org/schema --json state,statusCheckRollup` returns MERGED + SUCCESS, both classes/*.yml and fields/*.yml present
- UAT flow: create form → auto-draft appears in library → publish → use in RFP wizard → edit in wizard-context without affecting library → explicit edit from library → Save-as-New-Version prompt appears
- Reference-count enforcement: Overwrite blocked when 2+ RFPs reference the version

## Out of scope

- Marketplace / public template sharing across orgs
- AI-generated templates
- Split-screen / WYSIWYG form builder redesign (Plan 088 — separate v1.3+ phase)
- Template versioning history browser (usage count + lineage pointer is sufficient for MVP)

## References

- BACKLOG.md "087" entry (full prompt)
- `src/app/core/models/form-builder.model.ts` — FormBuilderConfig
- Phase 16 artifacts (`.planning/phases/16-form-builder/`)
- Template→Instance pattern from v1.2 Phase 15 (DocumentTemplate)
- SCHEMA_CHANGE_PROCESS.md — mandatory workflow for schema PR
- WATCH-LIST.md "Schema Workflow" + "Phase Completion Gate" + "Schema Inherited-Property Redefinition"
