# Phase 15: Document Templates - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable org admins to create reusable document templates (MSA, NDA, SOW) with variable substitution, and buyers to instantiate templates into engagements, projects, or notes. Templates are org-level with `{{variable}}` syntax. Instances are scoped copies with resolved content, editable with diff tracking against the original.

</domain>

<decisions>
## Implementation Decisions

### Scope & Entity Model
- **D-01:** Templates instantiate into THREE scopes: engagement documents, project documents, AND notes. Not just engagement-scoped.
- **D-02:** DocumentInstance entity tracks template provenance (templateId, templateVersion, variableValues) for all scopes. For notes scope, a DocumentInstance is created alongside a Note entity (instance = audit trail, note = content).
- **D-03:** Instances are editable after creation — NOT sealed snapshots. Diff tracking via edit history log (separate records with timestamp and author, not just original + current fields).
- **D-04:** Duplicate prevention: warn but allow. Show "This template was already instantiated here. Create another copy?" — buyer can proceed or view existing.

### Template Management UI
- **D-05:** Template library lives as a tab on the `/org` page ("Document Templates" tab). Consistent with org-level management.
- **D-06:** Clicking a template in the list opens a dedicated `/templates/:id` editor page with full Milkdown editor. List is tab, editor is standalone route.
- **D-07:** Template list uses card layout — card per template showing name, type chip (MSA/NDA/SOW), status badge, variable count, last edited.
- **D-08:** Template lifecycle: Draft → Published → Archived. Only Published templates appear in instantiation pickers. Archived preserves for existing instances but hides from pickers.

### Instantiation Workflow
- **D-09:** Chooser dialog pattern. "Add from Template" button opens dialog showing published org templates. Buyer picks one, fills custom variables in same dialog, clicks Create. Consistent with existing document-chooser-dialog pattern.
- **D-10:** Same chooser dialog for all three scopes (engagement, project, notes). Context determines where the instance is created.
- **D-11:** For Notes scope: "New Note" button becomes a split button — default click = blank note (existing behavior), dropdown arrow reveals "From Template" option that opens the chooser dialog.

### Preview & Variable Insertion
- **D-12:** Both toolbar button + slash command for inserting variables. Toolbar button opens a picker dropdown. Slash command (`/var`) triggers inline autocomplete. Single grouped list with "Built-in" and "Custom" section headers.
- **D-13:** Variables render as styled inline chips in the Milkdown editor (like Notion mentions). Visually distinct from content. Requires a Milkdown plugin.
- **D-14:** Template preview via toggle button in editor toolbar. Switches between edit mode and rendered preview with auto-generated sample data (realistic fake values for built-in vars, label/default for custom vars).
- **D-15:** Custom variable management via side panel on the `/templates/:id` editor page. Lists built-in vars (read-only) and custom vars (add/edit/delete with name, label, type, required, defaultValue).

### Document Listing on RFP/Engagement
- **D-16:** Mixed list on existing Documents tab — file uploads (SmeMartDocument) and template instances (DocumentInstance) together. Template instances get a distinct icon/badge ("Template" chip). "Add from Template" button alongside existing "Upload" button.
- **D-17:** Clicking a template document shows inline rendered markdown (expand or panel). Edit button opens Milkdown editor for the instance. Shows "Modified from template" indicator if content differs from original.
- **D-18:** Template documents share the same visibility controls as uploaded documents (all/buyer_only/provider_only). Consistent behavior across document types.

### Claude's Discretion
- Milkdown variable chip plugin approach (build custom or extend existing mention plugin)
- Notes folder integration details (how chooser dialog resolves target folder)
- Edit history entity design (fields, linking, cleanup policy)
- Card layout details for template list (spacing, metadata shown)
- "Modified from template" diff display format

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research (CRITICAL — all technical decisions locked here)
- `.planning/phases/15-document-templates/15-RESEARCH.md` — Variable syntax, registry, escaping, missing var behavior, content format, storage model. Read FIRST.

### Models & Services
- `src/app/core/models/index.ts` — Model barrel file, add DocumentTemplate + DocumentInstance models
- `src/app/core/services/pipeline-write.service.ts` — Pipeline write pattern, SME_MART_CLASS_IDS mapping for new entity class IDs
- `src/app/core/services/graphql-read.service.ts` — GQL read pattern for template queries
- `src/app/core/services/notes.service.ts` — Notes CRUD, createNote pattern (line 36) — integration point for template→note instantiation
- `src/app/core/services/document.service.ts` — Existing document service pattern
- `src/app/core/services/org-document.service.ts` — Org-level document operations

### Markdown Editor
- `src/app/shared/components/markdown-editor/markdown-editor.component.ts` — Milkdown Crepe editor, current toolbar/plugins, `getMarkdown()`/`reset()`/`focus()` API. Must be extended with variable chip plugin + toolbar button + slash command.

### UI Components (existing patterns to follow)
- `src/app/shared/components/notes-panel/notes-panel.component.ts` — Notes panel with `createNewNote()` at line 256. Split button integration point.
- `src/app/shared/components/note-editor/note-editor-dialog.component.ts` — Note editor dialog pattern
- `src/app/shared/components/document-chooser-dialog/` — Existing chooser dialog pattern to follow for template chooser
- `src/app/pages/project/project-detail.component.ts` — Tab pattern, documents tab integration
- `src/app/pages/engagements/tabs/notes-tab.component.ts` — Notes tab, integration point for "From Template" entry

### Schema Repo
- `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/` — YAML entity definitions, add DocumentTemplate.yml + DocumentInstance.yml

### Requirements
- `.planning/REQUIREMENTS.md` — D2-01 through D2-05 (Document Packages requirements)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Milkdown Crepe editor** (`shared/components/markdown-editor/`): Full WYSIWYG with toolbar. Needs extension for variable chips + slash command + preview toggle.
- **Document chooser dialog** (`shared/components/document-chooser-dialog/`): Existing pattern for selecting documents. Template chooser dialog follows same pattern.
- **ZbResourceStatusComponent**: Status badge component — reuse for template status (draft/published/archived) and document type chips.
- **SmeMartDocument model + service**: File upload documents. Template instances coexist alongside these on the Documents tab.
- **Notes panel split button**: `createNewNote()` currently creates blank note inline. Becomes split button with "From Template" option.

### Established Patterns
- **Pipeline write + GQL read**: All entities use PipelineWriteService + GraphqlReadService. New DocumentTemplate + DocumentInstance follow same pattern.
- **Entity service pattern**: Model interface + Service class + GQL types + field mapping constants + class ID in SME_MART_CLASS_IDS.
- **Schema-first workflow**: YAML PR → dataloader validation → merge → 15-min GQL reload (proven in Phase 14).
- **Optimistic updates**: PipelineWriteCache (60s TTL).
- **Share visibility**: EngagementDocument has `access_level` (all/buyer_only/provider_only). DocumentInstance should have same field.

### Integration Points
- **`/org` page**: New "Document Templates" tab for template library list
- **`/templates/:id`**: New route for dedicated template editor page
- **Documents tab** (engagement/project detail): Mixed list with "Add from Template" button
- **Notes panel toolbar**: Split button on "New Note" for "From Template" option
- **Schema repo**: Two new YAML classes (DocumentTemplate, DocumentInstance)

</code_context>

<specifics>
## Specific Ideas

- Edit history log for instances (not just original+current) — enables full audit trail of post-instantiation changes
- Variable chips in Milkdown (styled inline tokens like Notion mentions) — requires custom Milkdown plugin
- Split button pattern on Notes "New Note" — preserves existing blank-note-inline flow while adding template option
- Auto-generated sample data for preview mode — zero-config realistic fake values for built-in vars

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-document-templates*
*Context gathered: 2026-04-10*
