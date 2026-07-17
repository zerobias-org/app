"use client";

import { useEffect, useState } from "react";
import type { Extension } from "@codemirror/state";
import { CodeMirror } from "./CodeMirror";
import { codeBlockExtensions } from "@/lib/codemirror";

/**
 * CodeBlock — a read-only, syntax-highlighted block rendered with the same CodeMirror engine the
 * editor uses. Shared by MarkdownViewer (fenced code inside rendered Markdown) and CallReveal
 * (the code-reveal write demos). The per-language grammar is code-split and loaded on demand;
 * an unknown/absent language degrades to plain mono.
 */
export function CodeBlock({ value, lang }: { value: string; lang?: string }) {
  const [extensions, setExtensions] = useState<Extension[] | null>(null);

  useEffect(() => {
    let active = true;
    codeBlockExtensions(lang).then((ext) => {
      if (active) setExtensions(ext);
    });
    return () => {
      active = false;
    };
  }, [lang]);

  // Until the grammar chunk resolves, show the raw code in a plain block so there's no flash of
  // empty space and it stays copyable/readable if CM never mounts.
  if (!extensions) {
    return (
      <pre className="markdown-codeblock-fallback">
        <code>{value}</code>
      </pre>
    );
  }

  return (
    <CodeMirror
      value={value}
      extensions={extensions}
      editable={false}
      ariaLabel={lang ? `${lang} code block` : "code block"}
      className="markdown-codeblock"
    />
  );
}
