import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ZbSimplePanelComponent } from '@zerobias-org/ngx-library';

import { alignSegments, fieldRange, parseEr7, segmentRange, type Er7Range } from '../../core/er7';
import {
  ENVELOPE_SCHEMA_ID,
  Hl7Api,
  toRow,
  type Hl7Message,
  type ValidationResult,
} from '../../core/hl7-api';
import { Hl7SchemaService, type ResolvedError } from '../../core/hl7-schema';
import { Hl7TargetService, messageOf } from '../../core/hl7-target.service';
import { jsonLines } from '../../core/json-lines';
import { Er7View, type Er7Mark } from '../../shared/er7-view/er7-view';
import { JsonView, type JsonMark } from '../../shared/json-view/json-view';

/** One validation error, resolved to a place in both representations. */
interface Finding {
  readonly id: string;
  readonly resolved: ResolvedError;
  /** Character range in the ER7 text, when the two representations could be aligned. */
  readonly range: Er7Range | null;
}

/**
 * One message: what it says, what it looked like on the wire, and exactly where it breaks.
 *
 * The three tabs are three views of the same finding list. A validation error arrives as a JSON
 * path; `core/hl7-schema.ts` turns it into an HL7 field ordinal via the segment's live schema, and
 * `core/er7.ts` turns that ordinal into a character range in the raw text. So a single error can be
 * shown as a highlighted JSON line, a highlighted field in the ER7, and a sentence citing the schema
 * property that was violated — all from the same resolution, with no guessing.
 *
 * When alignment can't be trusted (the JSON and the wire text disagree about segment order), the
 * ER7 highlight is dropped rather than approximated: a mark on the wrong field is worse than none.
 *
 * Selecting a finding also scrolls the active code view to its mark — see `revealActiveMark()`.
 * Messages run to hundreds of lines (650 on the message this was verified against), so painting a
 * highlight the reader can't see is indistinguishable from the click doing nothing.
 */
@Component({
  selector: 'app-message-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    ZbSimplePanelComponent,
    Er7View,
    JsonView,
  ],
  template: `
    <a class="back" routerLink="/messages"><mat-icon>arrow_back</mat-icon> Messages</a>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (error()) {
      <p class="line error">{{ error() }}</p>
    }

    @if (message(); as m) {
      <header class="head">
        <h1>{{ controlId() }}</h1>
        @if (unparsed()) {
          <span class="verdict none"><mat-icon>help_outline</mat-icon> Not parsed</span>
        } @else if (validation(); as v) {
          @if (v.stored.valid && v.repsAgree) {
            <span class="verdict ok"><mat-icon>check_circle</mat-icon> Valid</span>
          } @else if (!v.stored.valid) {
            <span class="verdict bad">
              <mat-icon>error</mat-icon>
              {{ findings().length }} {{ findings().length === 1 ? 'error' : 'errors' }}
            </span>
          } @else {
            <span class="verdict warn"><mat-icon>compare_arrows</mat-icon> JSON &ne; ER7</span>
          }
        }
      </header>

      <dl class="meta">
        <div><dt>Received</dt><dd>{{ row().receivedAt | date: 'medium' }}</dd></div>
        <div><dt>Port</dt><dd>{{ row().sourcePort || '—' }}</dd></div>
        <div><dt>Structure</dt><dd><code>{{ row().messageStructure }}</code></dd></div>
        <div><dt>Version</dt><dd>{{ row().hl7Version }}</dd></div>
        <div><dt>Sender</dt><dd>{{ row().sendingApp || '—' }}</dd></div>
        <div><dt>Status</dt><dd>{{ row().status || '—' }}</dd></div>
        @if (validation()?.schemaId) {
          <div class="wide"><dt>Schema</dt><dd><code>{{ validation()?.schemaId }}</code></dd></div>
        }
      </dl>

      @if (unparsed()) {
        <p class="line note">
          The receiver has no schema for this structure, so it stored the wire text and its index
          attributes instead of a parsed message. The JSON tab therefore shows those attributes, not
          segments, and nothing was checked against HL7 &mdash; read the ER7 tab for the message as
          it arrived.
        </p>
      } @else if (validation(); as v) {
        @if (!v.repsAgree) {
          <p class="line note">
            The stored JSON and the message re-parsed from its ER7 text produce different verdicts
            ({{ v.stored.errors.length }} vs {{ v.rematerialized.errors.length }} errors). One of the
            two representations was built wrong &mdash; the findings below are from the stored JSON.
          </p>
        }
      }

      <div class="split">
        <mat-tab-group
          class="views"
          [selectedIndex]="tab()"
          (selectedIndexChange)="tab.set($event)"
          animationDuration="0ms"
        >
          <mat-tab label="JSON">
            <app-json-view
              [lines]="lines()"
              [marks]="jsonMarks()"
              [activeId]="activeId()"
              (select)="activeId.set($event)"
            />
          </mat-tab>
          <mat-tab label="ER7">
            @if (er7Text()) {
              <app-er7-view
                [text]="er7Text()"
                [marks]="er7Marks()"
                [activeId]="activeId()"
                (select)="activeId.set($event)"
              />
              @if (findings().length > 0 && er7Marks().length === 0) {
                <p class="line note">
                  The JSON and the wire text don't line up segment for segment, so the errors are not
                  highlighted here &mdash; they would land on the wrong field. The JSON tab still
                  shows exactly where each one is.
                </p>
              }
            } @else {
              <p class="line">No wire text stored for this message.</p>
            }
          </mat-tab>
        </mat-tab-group>

        <zb-simple-panel
          [title]="findings().length ? 'Findings (' + findings().length + ')' : 'Findings'"
          mode="header-only"
          [bodyPad]="true"
          class="findings"
        >
          @if (findings().length === 0) {
            @if (unparsed()) {
              <p class="line">
                Nothing to report: an unparsed message has no segments to check. The structure would
                need a schema in the receiver before it can be validated.
              </p>
            } @else if (validation(); as v) {
              <p class="line ok">This message satisfies <code>{{ v.schemaId }}</code>.</p>
            } @else {
              <p class="line">Not validated.</p>
            }
          } @else {
            @for (finding of findings(); track finding.id) {
              <button
                type="button"
                class="finding"
                [class.active]="finding.id === activeId()"
                (click)="activeId.set(finding.id)"
              >
                <span class="fname">
                  {{ finding.resolved.label }}
                  @if (finding.resolved.property?.dataType) {
                    <span class="dt">{{ finding.resolved.property?.dataType }}</span>
                  }
                  @if (!finding.range) {
                    <mat-icon class="nomark" title="Not locatable in the wire text">link_off</mat-icon>
                  }
                </span>
                <span class="freason">{{ finding.resolved.reason }}</span>
                @if (finding.resolved.property?.description; as description) {
                  <span class="fdesc">{{ description }}</span>
                }
                <span class="fpath">{{ finding.resolved.path }}</span>
                @if (finding.resolved.schemaId; as schemaId) {
                  <span class="fschema">
                    {{ schemaId }}
                    @if (finding.resolved.ordinal) {
                      &middot; property #{{ finding.resolved.ordinal }} &rarr; field
                      {{ finding.resolved.segmentName }}-{{ finding.resolved.ordinal }}
                    }
                  </span>
                }
              </button>
            }
            <p class="line legend">
              Field numbers come from the segment's own schema: a segment type lists its properties
              in HL7 field order, so the property's position is its field ordinal.
            </p>
          }
        </zb-simple-panel>
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .back { display: inline-flex; align-items: center; gap: 4px; color: var(--zb-secondary-text); text-decoration: none; font-size: var(--zb-font-size-sm); }
    .back:hover { color: var(--zb-primary); }
    .back mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .head { display: flex; align-items: center; gap: var(--zb-spacing-md); margin: var(--zb-spacing-sm) 0; }
    h1 { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: var(--zb-font-size-lg); word-break: break-all; }
    .verdict { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; font-weight: 600; }
    .verdict mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .verdict.ok { color: var(--zb-success, var(--zb-primary)); }
    .verdict.bad, .verdict.warn { color: var(--zb-warn); }

    .meta { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-lg); margin: 0 0 var(--zb-spacing-md); }
    dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    dd { margin: 2px 0 0; font-weight: 500; }
    .meta .wide { flex-basis: 100%; }

    .line { margin: 0 0 var(--zb-spacing-sm); color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }
    .line.error, .line.note { color: var(--zb-warn); }
    .line.ok { color: var(--zb-success, var(--zb-primary)); }
    .line.legend { margin-top: var(--zb-spacing-md); }

    .split { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: var(--zb-spacing-md); align-items: start; }
    @media (max-width: 1100px) { .split { grid-template-columns: minmax(0, 1fr); } }
    .views { min-width: 0; }
    .findings { display: block; max-height: 70vh; overflow: auto; }

    .finding {
      display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left;
      padding: var(--zb-spacing-sm); margin-bottom: 4px; cursor: pointer;
      background: none; border: 1px solid transparent; border-radius: var(--zb-border-radius);
      color: inherit; font: inherit;
    }
    .finding:hover { background: var(--zb-hover-background); }
    .finding.active { border-color: var(--zb-warn); background: color-mix(in srgb, var(--zb-warn) 10%, transparent); }
    .fname { font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .dt { font-weight: 400; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .nomark { font-size: 14px; width: 14px; height: 14px; color: var(--zb-secondary-text); }
    .freason { font-size: var(--zb-font-size-sm); }
    .fdesc { font-size: var(--zb-font-size-sm); color: var(--zb-secondary-text); }
    .fpath, .fschema { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: var(--zb-secondary-text); word-break: break-all; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  `,
})
export class MessageDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(Hl7Api);
  private readonly schemas = inject(Hl7SchemaService);
  private readonly target = inject(Hl7TargetService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly queryParams = toSignal(this.route.queryParamMap);
  protected readonly controlId = computed(() => this.queryParams()?.get('id') ?? '');

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<Hl7Message | null>(null);
  protected readonly er7Text = signal('');
  protected readonly validation = signal<ValidationResult | null>(null);
  protected readonly findings = signal<readonly Finding[]>([]);
  protected readonly activeId = signal<string | null>(null);
  protected readonly tab = signal(0);

  /** The message projected onto the header fields — the same derivation the search table uses. */
  protected readonly row = computed(() => {
    const message = this.message();
    return toRow(message ?? ({ controlId: '', receivedAt: '' } as Hl7Message));
  });

  /**
   * True when the receiver stored this message unparsed. Then `ops/validate` falls back to the
   * receipt-envelope schema, whose complaints are about the index attributes rather than the HL7 —
   * so the page reports the condition instead of the eight findings that come with it.
   */
  protected readonly unparsed = computed(() => {
    if (!this.message()) return false;
    return !this.row().materialized || this.validation()?.schemaId === ENVELOPE_SCHEMA_ID;
  });

  protected readonly lines = computed(() => {
    const message = this.message();
    return message ? jsonLines(message) : [];
  });

  /**
   * Where each finding lands in the JSON. A "missing required property" names a path that isn't in
   * the document, so it falls back to the segment that should have contained it — the nearest place
   * a reader can actually look.
   */
  protected readonly jsonMarks = computed<readonly JsonMark[]>(() => {
    const paths = new Set(this.lines().map((l) => l.path));
    return this.findings().map((finding) => ({
      id: finding.id,
      path: paths.has(finding.resolved.path) ? finding.resolved.path : finding.resolved.segmentPath,
      title: `${finding.resolved.label}: ${finding.resolved.reason}`,
    }));
  });

  protected readonly er7Marks = computed<readonly Er7Mark[]>(() =>
    this.findings()
      .filter((f): f is Finding & { range: Er7Range } => f.range !== null)
      .map((finding) => ({
        id: finding.id,
        start: finding.range.start,
        end: finding.range.end,
        title: `${finding.resolved.label}: ${finding.resolved.reason}`,
      })),
  );

  constructor() {
    effect(() => {
      const controlId = this.controlId();
      const targetId = this.target.targetId();
      untracked(() => {
        if (controlId && targetId) void this.load(controlId);
      });
    });

    // Bring the selection into view once the mark exists in the DOM.
    //
    // `afterRenderEffect` rather than `effect`: the mark is painted by the same change-detection
    // pass that the selection triggers, so a plain effect would run against the previous DOM and
    // measure the wrong element (or none).
    //
    // `tab()` is a real dependency, not a formality: MatTabBody attaches its portal only while its
    // tab is active and detaches it on leave, so the ER7 marks do not exist at all until the ER7
    // tab is shown. Depending on the tab is what makes "switch tabs with a finding selected" land
    // on the selection instead of at the top of a freshly attached view.
    afterRenderEffect(() => {
      const activeId = this.activeId();
      this.tab();
      untracked(() => {
        if (activeId) this.revealActiveMark();
      });
    });
  }

  /**
   * Scroll the active tab's mark to the middle of the code view's own scroll box.
   *
   * Deliberately not `Element.scrollIntoView()`: that walks every scrollable ancestor, so it would
   * also scroll the document and drag the message header and the findings list out of view — the
   * reader loses the list they just clicked in. Adjusting the `<pre>`'s own `scrollTop` moves only
   * the code.
   *
   * A finding with no mark is a normal outcome, not an error: `er7Marks()` drops every finding when
   * `alignSegments()` can't prove the two representations line up (invariant 3), and the template
   * already explains that in place. So a missing element means do nothing — never scroll to an
   * approximate spot.
   */
  private revealActiveMark(): void {
    const host = this.host.nativeElement;
    // Only the active tab body is attached, so at most one of these can match.
    const el =
      host.querySelector<HTMLElement>('app-json-view .row.active') ??
      host.querySelector<HTMLElement>('app-er7-view mark.active');
    const box = el?.closest('pre');
    if (!el || !box) return;

    const mark = el.getBoundingClientRect();
    const view = box.getBoundingClientRect();
    // Rects are viewport-relative, so they already account for the box's current scroll offset.
    box.scrollTop += centreDelta(mark.top - view.top, mark.height, view.height);
    // An ER7 mark can also sit far to the right of a long segment line. Only correct when it is
    // actually outside the box: re-centring a mark the reader can already see looks like drift.
    if (mark.left < view.left || mark.right > view.right) {
      box.scrollLeft += centreDelta(mark.left - view.left, mark.width, view.width);
    }
  }

  private async load(controlId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.activeId.set(null);
    this.findings.set([]);
    try {
      // The message is the only load that must succeed; the wire text and the validation are each
      // useful on their own, so a failure in one doesn't blank the page.
      const message = await this.api.get(controlId);
      if (this.controlId() !== controlId) return;
      this.message.set(message);

      const [er7, validation] = await Promise.all([
        this.api.er7(controlId).catch(() => null),
        this.api.validate(controlId).catch(() => null),
      ]);
      if (this.controlId() !== controlId) return;

      this.er7Text.set(er7?.er7 ?? '');
      this.validation.set(validation);
      // An unparsed message's "errors" are the envelope schema objecting to the index attributes;
      // resolving them against a segment schema would invent findings that don't exist.
      if (validation && !this.unparsed()) {
        await this.resolveFindings(message, er7?.er7 ?? '', validation);
      }
    } catch (err) {
      this.error.set(messageOf(err));
      this.message.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async resolveFindings(
    message: Hl7Message,
    er7: string,
    validation: ValidationResult,
  ): Promise<void> {
    const errors = validation.stored?.errors ?? [];
    const resolved = await Promise.all(
      errors.map((raw) => this.schemas.resolve(raw, validation.schemaId)),
    );
    // A newer message may have been requested while the schemas were fetching — drop this result
    // rather than pinning one message's findings onto another's text.
    if (this.controlId() !== validation.controlId) return;

    // Alignment is all-or-nothing: `alignSegments` returns null unless the JSON's segment order and
    // the wire text's agree exactly, which is what makes an offset safe to trust.
    const doc = er7 ? parseEr7(er7) : null;
    const segments = doc ? alignSegments(doc, message) : null;

    this.findings.set(
      resolved.map((item, i) => {
        const segment = segments?.get(item.segmentPath);
        const range = !segment
          ? null
          : item.ordinal
            ? fieldRange(segment, item.ordinal)
            : segmentRange(segment);
        return { id: `f${i}`, resolved: item, range };
      }),
    );
  }
}

/**
 * How far to scroll one axis so a mark sits in the middle of the view — except when the mark is
 * bigger than the view, where centring would push its *start* off the opposite edge.
 *
 * That is the common case on the ER7 tab, not an edge case: a finding with no field ordinal marks
 * the whole segment, and a populated OBX line measures wider than the pane. Aligning its start
 * shows the reader where the flagged region begins, which is the useful end of it.
 *
 * `offset` is the mark's leading edge relative to the view's, i.e. the delta that start-aligns it.
 */
function centreDelta(offset: number, markSize: number, viewSize: number): number {
  return Math.min(offset - (viewSize - markSize) / 2, offset);
}
