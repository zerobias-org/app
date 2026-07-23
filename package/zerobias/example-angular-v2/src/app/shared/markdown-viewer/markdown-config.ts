import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import DOMPurify from 'dompurify';

/**
 * ngx-markdown configuration, vendored verbatim from zb-ui-lib's `ComponentsModule` so the
 * reference app renders task descriptions and comments exactly as the real ZeroBias components do.
 * Wired into the app via `provideMarkdown(...)` in {@link appConfig}.
 */

/** Sanitize rendered HTML with DOMPurify, allowing GFM task-list checkboxes (`<input type checked disabled>`). */
export function markdownSanitizerFactory(): (html: string) => string {
  return (html: string) =>
    DOMPurify.sanitize(html, {
      ADD_TAGS: ['input'],
      ADD_ATTR: ['type', 'checked', 'disabled'],
    });
}

/** GFM + line breaks, and force every link to open in a new tab with `rel="nofollow"`. */
export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  const originalLink = renderer.link;
  renderer.link = function (
    this: MarkedRenderer,
    link: Parameters<MarkedRenderer['link']>[0],
  ) {
    const html = originalLink.call(this, link);
    return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
  };

  return { renderer, gfm: true, breaks: true };
}
