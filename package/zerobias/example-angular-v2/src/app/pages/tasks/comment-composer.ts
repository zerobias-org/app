import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NewTaskComment } from '@zerobias-com/platform-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { MarkdownTextarea } from '../../shared/markdown-editor/markdown-textarea';
import { exampleTaskComment } from './fixtures';

/**
 * CommentComposer — the code-reveal WRITE demo for the comment thread (twin of example-nextjs-v2's
 * `CommentComposer`). It does NOT post. You author a Markdown comment in the real Milkdown editor,
 * and it reveals the exact call, the request payload built from your input, and an obfuscated
 * example response:
 *
 *   const comment: NewTaskComment = { commentMarkdown };
 *   await platformClient.getTaskApi().addComment(taskId, comment);
 *
 * `NewTaskComment` is constructed for real from live input, so the payload is accurate and the call
 * shape is typechecked against the installed platform-sdk — even though nothing is sent.
 */
@Component({
  selector: 'app-comment-composer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownTextarea, CallReveal],
  template: `
    <div class="comment-composer">
      <p class="hint">
        Compose a comment to see the exact SDK call that would post it. This demo reveals the code —
        it does not write to the platform.
      </p>

      <app-markdown-textarea (change)="onChange($event.markdown)" />

      @if (request(); as req) {
        <app-call-reveal [call]="call()" [response]="exampleTaskComment" />
      }
    </div>
  `,
  styles: `
    .comment-composer { display: flex; flex-direction: column; gap: var(--zb-spacing-md); margin-top: var(--zb-spacing-md); }
    .hint { margin: 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
  `,
})
export class CommentComposer {
  readonly taskId = input.required<UUID>();

  protected readonly markdown = signal('');
  protected readonly exampleTaskComment = exampleTaskComment;

  /** The REAL request object, built from live input — typechecks the shape; never sent. */
  protected readonly request = computed(() => {
    const md = this.markdown().trim();
    if (!md) return undefined;
    const comment: NewTaskComment = { commentMarkdown: md };
    return comment;
  });

  protected readonly call = computed(() =>
    [
      `const taskId = "${this.taskId()}";`,
      `// Comments are authored as Markdown; the platform stores commentMarkdown.`,
      `const comment: NewTaskComment = ${objectLiteral(this.request())};`,
      `const posted = await platformClient.getTaskApi().addComment(taskId, comment);`,
    ].join('\n'),
  );

  onChange(markdown: string): void {
    this.markdown.set(markdown);
  }
}
