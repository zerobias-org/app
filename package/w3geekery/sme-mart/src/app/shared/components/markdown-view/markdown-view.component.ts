import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  ViewEncapsulation, signal, computed,
} from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { smeDocLinkMarkedExtension, SME_DOC_LINK_CLASS, SME_DOC_LINK_ATTR } from '../../plugins/sme-doc-link.plugin';

// Register the sme-doc link renderer once
marked.use(smeDocLinkMarkedExtension);

// Allow sme-doc:// protocol in DOMPurify (default only allows http, https, mailto, etc.)
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'href' && data.attrValue.startsWith('sme-doc://')) {
    data.forceKeepAttr = true;
  }
});

@Component({
  selector: 'app-markdown-view',
  standalone: true,
  template: `<div class="markdown-body" (click)="onBodyClick($event)" [innerHTML]="renderedHtml()"></div>`,
  styleUrl: './markdown-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownView {
  private readonly _content = signal('');

  @Input({ required: true })
  set content(value: string) { this._content.set(value || ''); }

  /** Emits the document ID when a user clicks an sme-doc:// link. */
  @Output() docLinkClick = new EventEmitter<string>();

  readonly renderedHtml = computed(() => {
    const md = this._content();
    if (!md) return '';
    const html = marked.parse(md, { async: false }) as string;
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['input'],
      ADD_ATTR: ['type', 'checked', 'disabled', SME_DOC_LINK_ATTR],
    });
  });

  onBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const docLink = target.closest(`.${SME_DOC_LINK_CLASS}`) as HTMLElement | null;
    if (!docLink) return;

    event.preventDefault();
    event.stopPropagation();

    const docId = docLink.getAttribute(SME_DOC_LINK_ATTR);
    if (docId) {
      this.docLinkClick.emit(docId);
    }
  }
}
