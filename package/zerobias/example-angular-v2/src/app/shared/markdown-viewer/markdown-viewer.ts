import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

/**
 * MarkdownViewer — renders a Markdown string to safe, styled HTML. The Angular twin of
 * example-nextjs-v2's `MarkdownViewer` and zb-ui-lib's `zb-markdown-viewer`: it wraps
 * ngx-markdown's `<markdown>`, which runs `marked` (GFM + `target="_blank"` links) and sanitizes
 * with DOMPurify — both configured globally in {@link appConfig}. The platform stores task
 * descriptions and comments as Markdown (`description`, `commentMarkdown`), so this is what shows
 * them the way they were authored instead of as raw source.
 *
 * The `.ngx-markdown-wrapper` styling lives in global `styles.scss` (not here): ngx-markdown injects
 * raw HTML that Angular's view encapsulation can't reach. Renders nothing when content is empty.
 *
 * `[clipboard]` puts a copy button on every fenced code block, rendered by our
 * {@link ClipboardButtonComponent} via the global `CLIPBOARD_OPTIONS` provider. It REQUIRES
 * clipboard.js in `angular.json` -> `scripts`; without it ngx-markdown throws ("you have to include
 * Clipboard files to angular.json") and — the part that bites — aborts the entire render, so the
 * markdown silently disappears rather than merely losing its copy buttons.
 */
@Component({
  selector: 'app-markdown-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent],
  template: `
    @if (content()?.trim()) {
      <markdown
        class="ngx-markdown-wrapper"
        [data]="content() ?? ''"
        [clipboard]="true"
      ></markdown>
    }
  `,
})
export class MarkdownViewer {
  readonly content = input<string | null | undefined>();
}
