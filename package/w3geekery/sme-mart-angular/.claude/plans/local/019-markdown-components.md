# Plan: Markdown Components — Milkdown Crepe Editor + Renderer

## Context

Task descriptions and timeline comments contain markdown but are currently rendered as plain text (task-card) or using `marked` with `bypassSecurityTrustHtml` (timeline-event-card). The timeline composer uses a plain `<textarea>`. We want:

1. A **reusable read-only markdown renderer** for task descriptions, comments, etc.
2. A **rich markdown editor** wrapping `@milkdown/crepe` (same pattern as ZB UI PR #38) for composing comments and creating tasks

This follows the same architecture as the `ZbMilkdownCrepeComponent` + `AuditmationMarkdownTextareaComponent` in `zerobias-com/ui` PR #38, adapted for standalone Angular 21 components.

---

## Step 1: Install Dependencies

```bash
npm install @milkdown/crepe @milkdown/kit @milkdown/theme-nord \
  @codemirror/lang-javascript @codemirror/lang-json @codemirror/lang-python \
  @codemirror/lang-sql @codemirror/lang-html @codemirror/lang-css \
  @codemirror/lang-xml @codemirror/lang-yaml @codemirror/lang-markdown \
  @codemirror/lint @codemirror/theme-one-dark
```

`marked` stays — used by the read-only renderer (lighter than loading full Milkdown for view-only).

---

## Step 2: MarkdownView Component (read-only renderer)

**New files:** `src/app/shared/components/markdown-view/`
- `markdown-view.component.ts`
- `markdown-view.component.scss`

**Purpose:** Reusable component that takes markdown string input and renders sanitized HTML. Replaces the inline `marked.parse()` + `bypassSecurityTrustHtml` pattern.

```typescript
@Component({
  selector: 'app-markdown-view',
  standalone: true,
  template: `<div class="markdown-body" [innerHTML]="renderedHtml()"></div>`,
  styleUrl: './markdown-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownView {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly _content = signal('');

  @Input({ required: true })
  set content(value: string) { this._content.set(value || ''); }

  readonly renderedHtml = computed(() => {
    const md = this._content();
    if (!md) return '';
    const html = marked.parse(md, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });
}
```

**Styles:** Shared markdown body styles (headings, lists, code blocks, blockquotes, tables, links, task lists) — extracted from timeline-event-card.component.scss and aligned with ZB UI PR #38's ProseMirror styles.

---

## Step 3: MarkdownEditor Component (Milkdown Crepe wrapper)

**New files:** `src/app/shared/components/markdown-editor/`
- `markdown-editor.component.ts`
- `markdown-editor.component.html`
- `markdown-editor.component.scss`

**Purpose:** Wraps `@milkdown/crepe` in a standalone Angular component. Follows the same pattern as ZB UI PR #38's `ZbMilkdownCrepeComponent` + `AuditmationMarkdownTextareaComponent`, but combined into a single standalone component (no NgModule needed).

**Architecture:**
- Runs Milkdown outside Angular zone (performance) via `NgZone.runOutsideAngular()`
- Uses `@milkdown/kit/plugin/listener` for markdown change events
- Static toolbar with Material icons (bold, italic, strike, headings, lists, code, links, tables)
- Feature config: disable floating toolbar/block-edit/link-tooltip (we have our own toolbar)
- CodeMirror language support subset (JS, TS, JSON, Python, SQL, HTML, CSS, XML, YAML, Markdown)

**API:**
```typescript
@Input() content: string = '';       // Initial markdown
@Input() height: string = '200px';
@Input() placeholder: string = '';
@Output() contentChange = new EventEmitter<string>();  // Emits on markdown change
```

**Public methods:**
- `getMarkdown(): string` — get current markdown content
- `reset(): void` — clear editor content
- `focus(): void` — focus the editor

---

## Step 4: Wire MarkdownView into Existing Components

### 4a. TaskCard — replace plain text description

**Modify:** `task-card.component.html`

Replace:
```html
<p class="task-description">{{ taskDescription() }}</p>
```
With:
```html
<app-markdown-view [content]="taskDescription()"></app-markdown-view>
```

Add `MarkdownView` to imports array.

Remove the `.task-description` 3-line clamp CSS (the MarkdownView will handle its own styling).

### 4b. TimelineEventCard — replace inline marked usage

**Modify:** `timeline-event-card.component.ts`

- Remove `marked` import and `DomSanitizer` inject
- Remove `renderedHtml` computed that calls `marked.parse()`
- Add `MarkdownView` to imports
- Expose `commentMarkdown` computed (just returns the markdown string)

**Modify:** `timeline-event-card.component.html`

Replace:
```html
<div class="comment-body" [innerHTML]="renderedHtml()"></div>
```
With:
```html
<app-markdown-view [content]="commentMarkdown()"></app-markdown-view>
```

---

## Step 5: Wire MarkdownEditor into Composer & Dialog

### 5a. TimelineComposer — replace textarea with Milkdown

**Modify:** `timeline-composer.component.ts` + `.html`

Replace the `<textarea matInput>` with `<app-markdown-editor>`:
```html
<app-markdown-editor
  [content]="commentText()"
  (contentChange)="commentText.set($event)"
  height="150px"
  placeholder="Write a comment…">
</app-markdown-editor>
```

Remove `FormsModule`, `MatFormFieldModule`, `MatInputModule` from imports (no longer needed).
Add `MarkdownEditor` to imports.

### 5b. CreateSubTaskDialog — replace description textarea

**Modify:** `create-subtask-dialog.component.ts` + `.html`

Replace the description `<textarea matInput>` with `<app-markdown-editor>`:
```html
<app-markdown-editor
  [content]="description"
  (contentChange)="description = $event"
  height="150px"
  placeholder="Task description (Markdown supported)">
</app-markdown-editor>
```

Add `MarkdownEditor` to imports.

---

## Files Summary

| File | Action |
|------|--------|
| `package.json` | Modify — add milkdown + codemirror deps |
| `shared/components/markdown-view/markdown-view.component.ts` | **New** |
| `shared/components/markdown-view/markdown-view.component.scss` | **New** |
| `shared/components/markdown-editor/markdown-editor.component.ts` | **New** |
| `shared/components/markdown-editor/markdown-editor.component.html` | **New** |
| `shared/components/markdown-editor/markdown-editor.component.scss` | **New** |
| `shared/components/task-card/task-card.component.ts` | Modify — add MarkdownView import |
| `shared/components/task-card/task-card.component.html` | Modify — use `<app-markdown-view>` |
| `shared/components/timeline-event-card/timeline-event-card.component.ts` | Modify — remove marked, add MarkdownView |
| `shared/components/timeline-event-card/timeline-event-card.component.html` | Modify — use `<app-markdown-view>` |
| `shared/components/timeline-composer/timeline-composer.component.ts` | Modify — add MarkdownEditor |
| `shared/components/timeline-composer/timeline-composer.component.html` | Modify — replace textarea |
| `shared/components/create-subtask-dialog/create-subtask-dialog.component.ts` | Modify — add MarkdownEditor |
| `shared/components/create-subtask-dialog/create-subtask-dialog.component.html` | Modify — replace textarea |

**Total: 5 new files, 9 modified files**

---

## Implementation Order

| # | Task | Depends On |
|---|------|------------|
| 1 | Install npm dependencies | — |
| 2 | MarkdownView component (2 files) | — |
| 3 | MarkdownEditor component (3 files) | Deps installed |
| 4 | Wire MarkdownView into task-card + timeline-event-card | Step 2 |
| 5 | Wire MarkdownEditor into timeline-composer + create-subtask-dialog | Step 3 |
| 6 | Build check (`ng build`) | All above |

---

## Reference Files

- **ZB UI PR #38** — `milkdown-crepe.component.ts` (Crepe wrapper pattern), `auditmation-markdown-textarea.component.ts` (toolbar + features config)
- **Current:** `timeline-event-card.component.ts:91-98` — inline `marked.parse()` to replace
- **Current:** `timeline-composer.component.html` — plain textarea to replace
- **Current:** `task-card.component.html:63-65` — plain text description to replace

---

## Verification

1. `ng build` — no compilation errors
2. `ng serve` — navigate to an engagement:
   - **Tasks tab:** Task description renders markdown (headings, lists, checkboxes, code blocks)
   - **Timeline tab:** Comments render markdown instead of raw text
   - **Timeline composer:** Rich editor with toolbar appears instead of textarea
   - **Create sub-task dialog:** Description field uses rich editor
3. Test editor actions: bold, italic, headings, lists, code blocks, links
4. Test that content changes propagate correctly (post a comment, create a task, verify markdown saved)
