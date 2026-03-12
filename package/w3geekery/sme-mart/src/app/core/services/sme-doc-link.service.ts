/**
 * Centralized service for sme-doc:// URI scheme used in document-note cross-linking.
 *
 * Link format in markdown: [📄 filename.pdf](sme-doc://DOC_UUID)
 */
import { Injectable } from '@angular/core';

/** URI scheme prefix for SME Mart document links */
const SME_DOC_SCHEME = 'sme-doc://';

@Injectable({ providedIn: 'root' })
export class SmeDocLinkService {

  /** Extract document ID from an sme-doc:// URI. Returns null if not a valid link. */
  parseDocId(uri: string): string | null {
    if (!this.isDocLink(uri)) return null;
    return uri.slice(SME_DOC_SCHEME.length).trim();
  }

  /** Check if a URI uses the sme-doc:// scheme */
  isDocLink(uri: string): boolean {
    return uri.startsWith(SME_DOC_SCHEME);
  }

  /** Build a full sme-doc:// URI from a document ID */
  buildUri(docId: string): string {
    return `${SME_DOC_SCHEME}${docId}`;
  }

  /** Create a markdown link for a document */
  createMarkdownLink(filename: string, docId: string): string {
    return `[📄 ${filename}](${this.buildUri(docId)})`;
  }

  /**
   * Find all document IDs referenced in a markdown body.
   * Returns unique IDs in order of appearance.
   */
  extractDocIds(markdown: string): string[] {
    const regex = /sme-doc:\/\/([a-f0-9-]+)/gi;
    const ids: string[] = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      const id = match[1];
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    return ids;
  }
}
