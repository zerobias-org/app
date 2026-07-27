import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { JsonLine } from '../../core/json-lines';

/** A path in the rendered JSON to paint, with the finding it came from. */
export interface JsonMark {
  readonly id: string;
  /** Exact path of the line to mark, as produced by `jsonLines`. */
  readonly path: string;
  readonly title: string;
}

interface Row {
  readonly number: number;
  readonly text: string;
  readonly markId: string | null;
  readonly title: string;
}

/**
 * The materialized message as pretty JSON, with the lines a validation error points at painted.
 *
 * Takes pre-rendered lines rather than the raw value so the page can resolve each finding's path
 * against the *actual* rendered paths first — a "missing required property" error names a path that
 * by definition isn't in the JSON, and must fall back to its segment.
 */
@Component({
  selector: 'app-json-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
   * NOTE ON THE WHITESPACE: inside a <pre> every character of the template is content, including
   * the newlines between template constructs. `</span>\n}` at the end of the @for body emits a real
   * newline text node per iteration, which — because `.row` is a block-level flex box — lays out as
   * an extra empty line box between every row. The listing then renders at double height and the
   * text occupies a third of the pixels, no matter what `line-height` says. So the closing `</span>`
   * of a row must butt directly against the `}` that ends the loop. Whitespace INSIDE a tag (the
   * attributes split across lines below) is not content and is safe.
   */
  template: `
    <pre class="json"><code>@for (row of rows(); track row.number) {<span
        class="row"
        [class.marked]="!!row.markId"
        [class.active]="row.markId && row.markId === activeId()"
        [title]="row.title"
        (click)="row.markId && select.emit(row.markId)"
      ><span class="ln">{{ row.number }}</span><span class="content">{{ row.text }}</span></span>}</code></pre>
  `,
  styles: `
    :host { display: block; }
    .json {
      margin: 0;
      padding: var(--zb-spacing-sm) 0;
      background: var(--zb-code-background, var(--zb-hover-background));
      border: 1px solid var(--zb-border-color);
      border-radius: var(--zb-border-radius);
      /*
       * The <pre> is the scroll box, capped like the findings panel beside it. Without a cap a
       * 650-line message renders ~25 000px tall: the page itself becomes the scroller, the findings
       * list is pushed off screen, and a selected finding has no container to be scrolled *within*.
       */
      max-height: 70vh;
      overflow: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      /*
       * A code listing, not prose. 1.6 measured 19.2px per row at this font size, too loose to scan
       * a message; 1.4 is 16.8px and still leaves ~2px of leading either side, so the marked-row
       * background reads as a band rather than clipping the glyphs.
       */
      line-height: 1.4;
    }
    .row { display: flex; }
    .row.marked { background: color-mix(in srgb, var(--zb-warn) 16%, transparent); cursor: pointer; }
    .row.marked .content { border-left: 2px solid var(--zb-warn); padding-left: 6px; margin-left: -8px; }
    .row.active { background: color-mix(in srgb, var(--zb-warn) 34%, transparent); }
    .ln {
      flex: 0 0 auto;
      width: 4em;
      padding-right: var(--zb-spacing-sm);
      text-align: right;
      color: var(--zb-secondary-text);
      user-select: none;
    }
    .content { flex: 1 1 auto; white-space: pre; padding-right: var(--zb-spacing-md); }
  `,
})
export class JsonView {
  readonly lines = input.required<readonly JsonLine[]>();
  readonly marks = input<readonly JsonMark[]>([]);
  readonly activeId = input<string | null>(null);
  readonly select = output<string>();

  protected readonly rows = computed<readonly Row[]>(() => {
    const marks = this.marks();
    // First mark wins a line: several findings can share a segment, and one highlight per line is
    // what the reader sees anyway.
    const byPath = new Map<string, JsonMark>();
    for (const mark of marks) {
      if (!byPath.has(mark.path)) byPath.set(mark.path, mark);
    }
    const seen = new Set<string>();
    return this.lines().map((line, i) => {
      const mark = byPath.get(line.path);
      // A container path tags both its opening and closing brace; only the opening one is marked.
      const claim = mark && !seen.has(mark.id) ? mark : undefined;
      if (claim) seen.add(claim.id);
      return {
        number: i + 1,
        text: line.text,
        markId: claim?.id ?? null,
        title: claim?.title ?? '',
      };
    });
  });
}
