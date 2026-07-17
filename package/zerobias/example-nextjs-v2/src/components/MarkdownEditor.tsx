"use client";

import { useMemo } from "react";
import { CodeMirror } from "./CodeMirror";
import { MarkdownViewer } from "./MarkdownViewer";
import { markdownEditorExtensions } from "@/lib/codemirror";

/**
 * MarkdownEditor — a source-plus-preview Markdown editor.
 *
 * Deliberately NOT WYSIWYG. The platform stores task descriptions and comments as Markdown
 * (`commentMarkdown`, task `description`), so the honest authoring experience is: edit the
 * Markdown source, see it rendered. The left pane is CodeMirror with Markdown highlighting;
 * the right pane is the very same `MarkdownViewer` used to display the saved value, so what
 * you preview is exactly what will render after `addComment` / `update`.
 *
 * Controlled: `value` is the Markdown string, `onChange` gets the next string. The caller
 * owns the value and is responsible for persisting it.
 */
export type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name for the source editor. */
  ariaLabel?: string;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  ariaLabel = "Markdown editor",
}: MarkdownEditorProps) {
  // Built once — the placeholder is fixed for the editor's lifetime. A changing placeholder
  // would rebuild the CM view, which we don't want mid-edit.
  const extensions = useMemo(
    () => markdownEditorExtensions(placeholder),
    [placeholder],
  );

  return (
    <div className="markdown-editor">
      <section className="markdown-editor-pane">
        <div className="markdown-editor-label" aria-hidden>
          Write
        </div>
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          ariaLabel={ariaLabel}
          className="markdown-editor-source"
        />
      </section>

      <section className="markdown-editor-pane">
        <div className="markdown-editor-label" aria-hidden>
          Preview
        </div>
        <div className="markdown-editor-preview">
          {value.trim() ? (
            <MarkdownViewer content={value} />
          ) : (
            <p className="markdown-editor-empty">Nothing to preview yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
