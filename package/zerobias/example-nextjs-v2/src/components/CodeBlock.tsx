"use client";

import { useEffect, useRef, useState } from "react";
import type { Extension } from "@codemirror/state";
import { CodeMirror } from "./CodeMirror";
import { codeBlockExtensions } from "@/lib/codemirror";

/**
 * CodeBlock — a read-only, syntax-highlighted block rendered with the same CodeMirror engine the
 * editor uses. Shared by MarkdownViewer (fenced code inside rendered Markdown) and CallReveal
 * (the code-reveal write demos). The per-language grammar is code-split and loaded on demand;
 * an unknown/absent language degrades to plain mono.
 *
 * `fold` turns on code folding + auto-folds JSON containers beyond depth 2 (CallReveal's response
 * panel). A copy button in the top-right copies the raw source via the native Clipboard API.
 */
export function CodeBlock({
  value,
  lang,
  fold = false,
}: {
  value: string;
  lang?: string;
  fold?: boolean;
}) {
  const [extensions, setExtensions] = useState<Extension[] | null>(null);

  useEffect(() => {
    let active = true;
    codeBlockExtensions(lang, { fold }).then((ext) => {
      if (active) setExtensions(ext);
    });
    return () => {
      active = false;
    };
  }, [lang, fold]);

  return (
    <div className="codeblock-wrap">
      <CopyButton value={value} />
      {/* Until the grammar chunk resolves, show the raw code in a plain block so there's no flash
          of empty space and it stays copyable/readable if CM never mounts. */}
      {!extensions ? (
        <pre className="markdown-codeblock-fallback">
          <code>{value}</code>
        </pre>
      ) : (
        <CodeMirror
          value={value}
          extensions={extensions}
          editable={false}
          ariaLabel={lang ? `${lang} code block` : "code block"}
          className="markdown-codeblock"
        />
      )}
    </div>
  );
}

/** A small copy-to-clipboard affordance shown in the top-right of a code block. */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure context / permissions) — leave the button state unchanged
      // rather than surface an error for a copy affordance.
    }
  };

  return (
    <button
      type="button"
      className="codeblock-copy"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
