"use client";

import { useEffect, useRef } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * CodeMirror — a thin React wrapper around a CodeMirror 6 `EditorView`.
 *
 * Deliberately unopinionated: it owns the imperative view lifecycle (create on mount, destroy
 * on unmount, reflect external value changes) and nothing else. WHAT the editor does — language,
 * theme, editable vs read-only — is entirely the caller's `extensions`. That is what lets the
 * same component back both the editable Markdown source pane and the read-only code blocks in
 * the viewer (see `src/lib/codemirror.ts`).
 *
 * The view is built once per structural config (`extensions` identity). Typing never rebuilds
 * it: `value` and `onChange` are read through refs, so a parent re-render mid-keystroke can't
 * tear down the editor and lose the cursor. Memoize `extensions` in the parent.
 */
export type CodeMirrorProps = {
  value: string;
  /** Omit for a read-only view. */
  onChange?: (value: string) => void;
  /** CM6 extensions. A NEW array identity rebuilds the editor — memoize it. */
  extensions: Extension[];
  editable?: boolean;
  /** Accessible name applied to the editable content DOM. */
  ariaLabel?: string;
  className?: string;
};

export function CodeMirror({
  value,
  onChange,
  extensions,
  editable = true,
  ariaLabel,
  className,
}: CodeMirrorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Latest value/onChange without forcing a rebuild — read inside the stable view. Synced in
  // an effect (not during render) so the update listener always sees the current handler.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!hostRef.current) return;

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        ...extensions,
        EditorView.editable.of(editable),
        EditorState.readOnly.of(!editable),
        ariaLabel ? EditorView.contentAttributes.of({ "aria-label": ariaLabel }) : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [extensions, editable, ariaLabel]);

  // Reflect an external value change (programmatic reset, a fresh seed) into the doc without
  // stomping the cursor. When the change came from typing, the doc already equals `value`, so
  // the guard below dispatches nothing.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return <div ref={hostRef} className={className} />;
}
