"use client";

import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { CodeBlock } from "./CodeBlock";

/**
 * MarkdownViewer — renders Markdown to safe, styled HTML.
 *
 * The React counterpart of ngx-library / zb-ui-lib's `zb-markdown-viewer` (which wraps
 * `marked` via ngx-markdown). We use `react-markdown` instead of `marked` +
 * `dangerouslySetInnerHTML` on purpose: react-markdown renders through React nodes, and
 * `rehype-sanitize` strips anything unsafe — so untrusted content (task descriptions,
 * comments authored by other users) can't inject script or markup. For a reference app,
 * showing the XSS-safe pattern matters more than mirroring the Angular internals.
 *
 * `remark-gfm` adds GitHub-flavored Markdown (tables, strikethrough, task lists, autolinks),
 * which is what the platform's task descriptions and comments actually use.
 *
 * Fenced code blocks render through `CodeBlock` -> CodeMirror (read-only), so a ```json block
 * is syntax-highlighted with the same engine the MarkdownEditor uses, rather than flat text.
 */

// Keep the language hint (`class="language-json"`) that remark puts on fenced code — the
// default sanitize schema strips it, and CodeBlock needs it to pick a grammar.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./]],
  },
};

export function MarkdownViewer({
  content,
  className,
}: {
  content: string | null | undefined;
  className?: string;
}) {
  if (!content?.trim()) return null;
  return (
    <div className={`markdown-body${className ? ` ${className}` : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{ pre: PreBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Replaces react-markdown's default `<pre><code>` for a fenced block with a CodeMirror-backed
 * `CodeBlock`. A fenced block always renders as a single `<code>` child; we lift its language
 * class and text out and hand them to CodeBlock. Inline code (no `<pre>` wrapper) is untouched.
 */
function PreBlock({ children }: { children?: ReactNode }) {
  const child = Array.isArray(children) ? children[0] : children;
  if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
    const match = /language-(\w+)/.exec(child.props.className ?? "");
    const value = String(child.props.children ?? "").replace(/\n$/, "");
    return <CodeBlock value={value} lang={match?.[1]} />;
  }
  return <pre>{children}</pre>;
}
