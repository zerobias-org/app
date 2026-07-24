// CodeMirror 6 extension sets, shared by the two places this app uses CodeMirror:
//   - MarkdownEditor  -> markdownEditorExtensions() (editable source pane)
//   - MarkdownViewer  -> codeBlockExtensions(lang)  (read-only fenced-code highlighting)
//
// One engine, two configs. This mirrors ngx-library's own showcase, which highlights code
// with CodeMirror (`@acrodata/code-editor` + `@codemirror/theme-one-dark`) — we use the
// framework-agnostic CM6 core directly instead of the Angular wrapper. oneDark is the same
// syntax theme the showcase ships, so highlighted code reads the same across both apps.

import { history, defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { bracketMatching, codeFolding, foldGutter, LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, EditorView, highlightSpecialChars, keymap, placeholder as cmPlaceholder } from "@codemirror/view";

import { autoFoldBeyondDepth } from "./auto-fold";

// Font + sizing shared by both configs. oneDark handles colors; this only aligns the
// typography with the app so code reads like the rest of the portal's mono surfaces.
const sharedTheme = EditorView.theme({
  "&": { fontSize: "var(--zb-font-size-sm)" },
  ".cm-content": {
    fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
    padding: "var(--zb-space-sm) 0",
  },
  ".cm-scroller": { lineHeight: "1.6" },
  "&.cm-focused": { outline: "none" },
});

/**
 * Extensions for the editable Markdown source pane.
 *
 * `markdown({ base: markdownLanguage, codeLanguages: languages })` gives GFM-aware Markdown
 * highlighting AND lazily highlights the contents of fenced code blocks in their own language
 * (```json, ```ts, …) — the same `languages` registry the viewer uses, so a JSON block looks
 * the same whether you're typing it or reading the rendered result.
 */
export function markdownEditorExtensions(placeholderText?: string): Extension[] {
  return [
    history(),
    drawSelection(),
    highlightSpecialChars(),
    bracketMatching(),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    oneDark,
    sharedTheme,
    placeholderText ? cmPlaceholder(placeholderText) : [],
  ];
}

/**
 * Extensions for a read-only code block in the viewer. Async because the per-language grammar
 * is code-split — we only pull in the JSON/TS/etc. parser a document actually references.
 * An unknown or absent language falls back to plain (uncolored) mono text, still in oneDark.
 *
 * `opts.fold` enables code folding + a fold gutter and auto-folds JSON containers nested beyond
 * depth 2 — used by CallReveal's response panel, where a live platform response can run ~900 lines
 * and the reader only needs the envelope (`{ count, items: [ {…} ] }`) with each item one click away.
 */
export async function codeBlockExtensions(
  lang?: string,
  opts?: { fold?: boolean },
): Promise<Extension[]> {
  const base: Extension[] = [oneDark, sharedTheme, EditorView.editable.of(false)];
  if (opts?.fold) {
    base.push(codeFolding(), foldGutter(), autoFoldBeyondDepth(2));
  }
  if (!lang) return base;

  const desc = LanguageDescription.matchLanguageName(languages, lang, true);
  if (!desc) return base;

  try {
    const support = await desc.load();
    return [...base, support];
  } catch {
    // Grammar chunk failed to load — degrade to plain mono rather than break the render.
    return base;
  }
}
