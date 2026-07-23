"use client";

import { useMemo, useState } from "react";
import { NewTaskComment } from "@zerobias-com/platform-sdk";
import type { UUID } from "@zerobias-org/types-core-js";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { CallReveal } from "@/components/CallReveal";
import { exampleTaskComment } from "@/lib/fixtures";

/**
 * CommentComposer — the first code-reveal write demo (see docs/write-demos.md). It does NOT post
 * to the platform. You compose a Markdown comment and it reveals the exact call, the request
 * payload built from your input, and an obfuscated example response.
 *
 * The MarkdownEditor is the same one a real composer would use; "posting" here means *showing the
 * code* an LLM would emit to persist it:
 *
 *   const comment = new NewTaskComment(undefined, commentMarkdown);
 *   await platformClient.getTaskApi().addComment(taskId, comment);
 *
 * `NewTaskComment` is constructed for real below (from live input), so the request payload is
 * accurate and the call shape is typechecked against the installed SDK — even though nothing is
 * sent.
 */
export function CommentComposer({ taskId }: { taskId: UUID }) {
  const [markdown, setMarkdown] = useState("");

  // The REAL request object, built from live input through the SDK class. Building it here is what
  // typechecks the shape against the installed platform-sdk — the anti-rot guarantee. It is never
  // sent anywhere.
  const request = useMemo(
    () => (markdown.trim() ? new NewTaskComment(undefined, markdown.trim()) : undefined),
    [markdown],
  );

  const call = [
    `const taskId = "${taskId}";`,
    `// Comments are authored as Markdown; the platform stores commentMarkdown.`,
    `const comment = new NewTaskComment(undefined, commentMarkdown);`,
    `const posted = await platformClient.getTaskApi().addComment(taskId, comment);`,
  ].join("\n");

  return (
    <div className="comment-composer">
      <p className="comment-composer-hint">
        Compose a comment to see the exact SDK call that would post it. This demo reveals the
        code — it does not write to the platform.
      </p>

      <MarkdownEditor
        value={markdown}
        onChange={setMarkdown}
        ariaLabel="New comment"
        placeholder="Write a comment…"
      />

      {request && (
        <CallReveal call={call} request={request} response={exampleTaskComment} />
      )}
    </div>
  );
}
