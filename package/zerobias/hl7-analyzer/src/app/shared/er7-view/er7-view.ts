import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** A character range in the ER7 text to paint, with the finding it came from. */
export interface Er7Mark {
  readonly id: string;
  readonly start: number;
  readonly end: number;
  /** Shown as the mark's tooltip — the error, in HL7 terms. */
  readonly title: string;
}

interface Piece {
  readonly text: string;
  readonly markId: string | null;
}

interface Line {
  readonly number: number;
  readonly pieces: readonly Piece[];
  readonly marked: boolean;
}

/**
 * The raw ER7 message with its invalid regions painted in place.
 *
 * A `<pre>` of spans rather than a code editor: the highlights are arbitrary character ranges
 * computed from the schema (see `core/er7.ts`), and a `<pre>` lets us place them exactly, at a
 * fraction of a CodeMirror instance's weight. HL7 has no syntax highlighting worth the name anyway
 * — the interesting structure here is *which field is wrong*, which is what the marks show.
 *
 * Marks never span a line: a field lives inside its segment, and a segment is a line. Anything that
 * would cross a newline is clipped to the line, so a bad range can't smear the whole message.
 */
@Component({
  selector: 'app-er7-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
   * The template's own newlines are content inside a <pre> — see the note in json-view.ts. The row's
   * closing `</span>` must butt against the `}` closing the @for, or every line gets an empty line
   * box after it and the message renders at double height.
   */
  template: `
    <pre class="er7"><code>@for (line of lines(); track line.number) {<span
        class="row"
        [class.marked]="line.marked"
      ><span class="ln">{{ line.number }}</span><span class="content">@for (piece of line.pieces; track $index) {@if (piece.markId) {<mark
              [class.active]="piece.markId === activeId()"
              [title]="titleOf(piece.markId)"
              (click)="select.emit(piece.markId)"
            >{{ piece.text }}</mark>} @else {<span>{{ piece.text }}</span>}}</span></span>}</code></pre>
  `,
  styles: `
    :host { display: block; }
    .er7 {
      margin: 0;
      padding: var(--zb-spacing-sm) 0;
      background: var(--zb-code-background, var(--zb-hover-background));
      border: 1px solid var(--zb-border-color);
      border-radius: var(--zb-border-radius);
      /* Same scroll box and same metrics as the JSON tab — switching tabs must not resize the pane
       * or re-space the text under the reader. */
      max-height: 70vh;
      overflow: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      line-height: 1.4;
    }
    .row { display: flex; }
    .row.marked { background: color-mix(in srgb, var(--zb-warn) 8%, transparent); }
    .ln {
      flex: 0 0 auto;
      width: 3.5em;
      padding-right: var(--zb-spacing-sm);
      text-align: right;
      color: var(--zb-secondary-text);
      user-select: none;
    }
    .content { flex: 1 1 auto; white-space: pre; padding-right: var(--zb-spacing-md); }
    mark {
      background: color-mix(in srgb, var(--zb-warn) 30%, transparent);
      color: inherit;
      border-bottom: 2px solid var(--zb-warn);
      cursor: pointer;
    }
    mark.active { background: var(--zb-warn); color: var(--zb-warn-contrast, #fff); }
    /* An empty field still has to be visible, or "missing required property" points at nothing. */
    mark:empty { display: inline-block; width: 6px; height: 1em; vertical-align: text-bottom; }
  `,
})
export class Er7View {
  readonly text = input.required<string>();
  readonly marks = input<readonly Er7Mark[]>([]);
  readonly activeId = input<string | null>(null);
  /** A mark was clicked — the page uses this to select the matching finding. */
  readonly select = output<string>();

  protected readonly lines = computed<readonly Line[]>(() => {
    const text = this.text();
    const marks = this.marks();
    const out: Line[] = [];
    let offset = 0;
    let number = 0;

    while (offset <= text.length) {
      let end = text.length;
      for (let i = offset; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\r' || ch === '\n') {
          end = i;
          break;
        }
      }
      if (end > offset || offset < text.length) {
        number += 1;
        out.push({
          number,
          pieces: split(text.slice(offset, end), offset, marks),
          marked: marks.some((m) => m.start < end && m.end >= offset),
        });
      }
      if (end >= text.length) break;
      offset = end + (text[end] === '\r' && text[end + 1] === '\n' ? 2 : 1);
    }
    return out;
  });

  protected titleOf(id: string): string {
    return this.marks().find((m) => m.id === id)?.title ?? '';
  }
}

/** Cut one line into marked / unmarked pieces. Overlaps resolve to the first mark that claims a run. */
function split(line: string, base: number, marks: readonly Er7Mark[]): readonly Piece[] {
  const local = marks
    .map((m) => ({ id: m.id, start: m.start - base, end: m.end - base }))
    .filter((m) => m.end >= 0 && m.start <= line.length)
    .map((m) => ({ id: m.id, start: Math.max(0, m.start), end: Math.min(line.length, m.end) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  if (local.length === 0) return [{ text: line, markId: null }];

  const pieces: Piece[] = [];
  let cursor = 0;
  for (const mark of local) {
    if (mark.start < cursor) continue; // already covered by an earlier mark
    if (mark.start > cursor) pieces.push({ text: line.slice(cursor, mark.start), markId: null });
    // A zero-width mark (an absent field) still renders, so the reader sees where the gap is.
    pieces.push({ text: line.slice(mark.start, mark.end), markId: mark.id });
    cursor = Math.max(mark.end, mark.start);
  }
  if (cursor < line.length) pieces.push({ text: line.slice(cursor), markId: null });
  return pieces;
}
