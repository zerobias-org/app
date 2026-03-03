import {
  Component, Input, ChangeDetectionStrategy,
  signal, computed,
} from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-markdown-view',
  standalone: true,
  template: `<div class="markdown-body" [innerHTML]="renderedHtml()"></div>`,
  styleUrl: './markdown-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownView {
  private readonly _content = signal('');

  @Input({ required: true })
  set content(value: string) { this._content.set(value || ''); }

  readonly renderedHtml = computed(() => {
    const md = this._content();
    if (!md) return '';
    const html = marked.parse(md, { async: false }) as string;
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['input'],
      ADD_ATTR: ['type', 'checked', 'disabled'],
    });
  });
}
