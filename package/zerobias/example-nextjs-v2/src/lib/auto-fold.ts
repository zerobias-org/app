import { ensureSyntaxTree, foldable, foldEffect, syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import type { StateEffect } from "@codemirror/state";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";

/** Containers worth folding in a JSON document. Scalars have nothing to collapse. */
const CONTAINERS = new Set(["Object", "Array"]);

/**
 * Auto-fold every JSON container nested deeper than `maxDepth` (twin of example-angular-v2's
 * `shared/call-reveal/auto-fold.ts`).
 *
 * Real platform responses are big — a 25-repo listing is ~900 lines — and a code panel showing all
 * of it teaches nothing while making the page endless. Folding beyond depth 2 leaves the shape
 * legible (`{ count, items: [ {…}, {…} ] }`) with each item one click from expanding, which is the
 * level a reader actually needs.
 *
 * Depth is 1-based on containers only: the root object is 1, `items` is 2, each element is 3 — so
 * `maxDepth: 2` collapses the elements and keeps the envelope open.
 *
 * Implemented as a ViewPlugin so it re-runs on document change — the read-only CodeBlock reuses the
 * same EditorView when a new response replaces the old one.
 */
export function autoFoldBeyondDepth(maxDepth = 2) {
  return ViewPlugin.define((view: EditorView) => {
    const fold = () => {
      const effects: StateEffect<unknown>[] = [];
      const walk = (node: SyntaxNode, depth: number): void => {
        for (let child = node.firstChild; child; child = child.nextSibling) {
          const isContainer = CONTAINERS.has(child.name);
          const childDepth = isContainer ? depth + 1 : depth;
          if (isContainer && childDepth > maxDepth) {
            // foldable() takes a LINE range, not an arbitrary node span — it asks the fold
            // services what is foldable on that line. Passing the node's own from/to spans many
            // lines and just returns null, which is why folding silently did nothing.
            const line = view.state.doc.lineAt(child.from);
            const range = foldable(view.state, line.from, line.to);
            // Fold this node and stop — folding a parent makes its children moot.
            if (range) effects.push(foldEffect.of(range));
            continue;
          }
          walk(child, childDepth);
        }
      };
      // CodeMirror parses INCREMENTALLY — plain `syntaxTree()` stops at the rendered viewport, so
      // on a long response most containers would have no tree yet and silently go unfolded. Force
      // a full parse first, falling back to the partial tree if the budget runs out.
      const tree =
        ensureSyntaxTree(view.state, view.state.doc.length, 5000) ?? syntaxTree(view.state);
      walk(tree.topNode, 0);
      if (effects.length) view.dispatch({ effects });
    };

    // The syntax tree is not parsed on the first synchronous pass, so defer the initial fold.
    let queued = setTimeout(fold, 0);

    return {
      update(u: ViewUpdate) {
        // A new response reuses the same editor — re-fold when the document is replaced.
        if (u.docChanged) {
          clearTimeout(queued);
          queued = setTimeout(fold, 0);
        }
      },
      destroy() {
        clearTimeout(queued);
      },
    };
  });
}
