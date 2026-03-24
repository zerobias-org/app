/**
 * SME Doc Link Plugin
 *
 * Provides rendering support for sme-doc:// links in markdown:
 * - `smeDocLinkMarkedExtension` — marked renderer extension for read-only MarkdownView
 * - CSS class constants for consistent styling across editor and viewer
 *
 * Link format: [📄 filename.pdf](sme-doc://DOC_UUID)
 */
import type { MarkedExtension, Tokens } from 'marked';

/** CSS class applied to sme-doc link elements */
export const SME_DOC_LINK_CLASS = 'sme-doc-link';

/** Data attribute holding the document ID */
export const SME_DOC_LINK_ATTR = 'data-doc-id';

/** URI scheme prefix */
const SME_DOC_SCHEME = 'sme-doc://';

/**
 * Extract document ID from an sme-doc:// href.
 * Returns null if href doesn't use the scheme.
 */
export function parseDocIdFromHref(href: string): string | null {
  if (!href.startsWith(SME_DOC_SCHEME)) return null;
  return href.slice(SME_DOC_SCHEME.length).trim() || null;
}

/**
 * Marked renderer extension that transforms sme-doc:// links into styled
 * inline elements instead of plain <a> tags.
 *
 * Usage:
 * ```ts
 * import { marked } from 'marked';
 * marked.use(smeDocLinkMarkedExtension);
 * ```
 */
export const smeDocLinkMarkedExtension: MarkedExtension = {
  renderer: {
    link({ href, text }: Tokens.Link): string | false {
      const docId = parseDocIdFromHref(href);
      if (!docId) return false; // fall through to default renderer

      // Strip the emoji prefix if present for cleaner display
      const displayText = text.replace(/^📄\s*/, '');

      return `<a class="${SME_DOC_LINK_CLASS}" href="${href}" ${SME_DOC_LINK_ATTR}="${docId}" title="${displayText}">📄 ${displayText}</a>`;
    },
  },
};
