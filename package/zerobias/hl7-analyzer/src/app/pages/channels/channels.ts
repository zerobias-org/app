import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { ZbSimplePanelComponent } from '@zerobias-org/ngx-library';

import {
  ChannelComparer,
  DEFAULT_IDENTITY,
  type MatchMode,
} from '../../core/channel-compare';
import { Hl7Api, type FacetValue } from '../../core/hl7-api';
import { Hl7TargetService, messageOf } from '../../core/hl7-target.service';
import { DateRange } from '../../shared/date-range/date-range';
import { TargetPicker } from '../../shared/target-picker/target-picker';

/** How many rows of a list we render before asking the reader to narrow the window. */
const RENDER_LIMIT = 200;

/**
 * Channel coupling: pick two receiving ports and a date window, and see what both channels carry,
 * what only one carries, and where the shared messages disagree.
 *
 * The whole tool rests on one decision — what makes two messages on two channels "the same message"
 * — and that decision is the reader's to make, so it's a control on the page rather than a constant
 * in the code. `core/channel-compare.ts` explains why the business key is the default.
 *
 * Everything is computed in the browser from two fetched populations. That's deliberate: the
 * receiver can filter and count, but it has no notion of "the same message on another port", so
 * there is no server-side query that answers this. It also means the answer is only as complete as
 * the fetch, which is why a truncated side marks the whole result provisional.
 */
@Component({
  selector: 'app-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTabsModule,
    ZbSimplePanelComponent,
    DateRange,
    TargetPicker,
  ],
  providers: [ChannelComparer],
  template: `
    @if (!target.targetId()) {
      <app-target-picker />
    } @else {
      <zb-simple-panel title="Compare two channels" mode="header-only" [bodyPad]="true">
        <section class="bar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="port">
            <mat-label>Channel A (receiving port)</mat-label>
            <mat-select [value]="portA()" (valueChange)="portA.set($event)">
              @for (port of ports(); track port.value) {
                <mat-option [value]="port.value">
                  {{ port.value }}
                  @if (port.count !== undefined) {
                    <span class="count">&middot; {{ port.count | number }}</span>
                  }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="port">
            <mat-label>Channel B (receiving port)</mat-label>
            <mat-select [value]="portB()" (valueChange)="portB.set($event)">
              @for (port of ports(); track port.value) {
                <mat-option [value]="port.value">
                  {{ port.value }}
                  @if (port.count !== undefined) {
                    <span class="count">&middot; {{ port.count | number }}</span>
                  }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <app-date-range [(from)]="from" [(to)]="to" />
        </section>

        <section class="bar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mode">
            <mat-label>Match messages on</mat-label>
            <mat-select [value]="mode()" (valueChange)="mode.set($event)">
              <mat-option value="identity">Business key</mat-option>
              <mat-option value="content">Full content</mat-option>
            </mat-select>
          </mat-form-field>

          @if (mode() === 'identity') {
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="key">
              <mat-label>Key fields</mat-label>
              <input matInput [(ngModel)]="identityText" />
              <mat-hint>Comma-separated path fragments; a field matches if its path contains one.</mat-hint>
            </mat-form-field>
          }

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="cap">
            <mat-label>Fetch up to</mat-label>
            <mat-select [value]="cap()" (valueChange)="cap.set($event)">
              @for (n of CAPS; track n) {
                <mat-option [value]="n">{{ n | number }} per channel</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <span class="spacer"></span>

          @if (comparer.running) {
            <button matButton="outlined" (click)="comparer.cancel()">
              <mat-icon>stop</mat-icon> Stop
            </button>
          } @else {
            <button matButton="filled" [disabled]="!canCompare()" (click)="compare()">
              <mat-icon>compare_arrows</mat-icon> Compare
            </button>
          }
        </section>

        <p class="line">
          {{
            mode() === 'identity'
              ? 'Two messages are the same when their key fields agree. Everything else is reported as a field conflict on the shared message.'
              : 'Two messages are the same when all of their content agrees, ignoring the MSH transport fields an interface engine re-stamps per hop.'
          }}
        </p>

        @if (facetError()) {
          <p class="line error">{{ facetError() }}</p>
        }
        @if (samePort()) {
          <p class="line note">Pick two different ports — a channel is trivially identical to itself.</p>
        }
      </zb-simple-panel>

      @if (comparer.running) {
        <zb-simple-panel title="Fetching" mode="header-only" [bodyPad]="true">
          <p class="line">
            {{ comparer.phase() === 'comparing' ? 'Comparing populations' : 'Fetching messages' }}
            &mdash; A: {{ comparer.fetchedA() | number }}{{ comparer.totalA() ? ' / ' + (comparer.totalA() | number) : '' }},
            B: {{ comparer.fetchedB() | number }}{{ comparer.totalB() ? ' / ' + (comparer.totalB() | number) : '' }}
          </p>
          <mat-progress-bar [mode]="progress() > 0 ? 'determinate' : 'indeterminate'" [value]="progress()" />
        </zb-simple-panel>
      } @else if (comparer.phase() === 'error') {
        <p class="line error">{{ comparer.error() }}</p>
      }

      @if (comparer.comparison(); as result) {
        <zb-simple-panel title="Result" mode="header-only" [bodyPad]="true">
          <dl class="counts">
            <div>
              <dt>Distinct on {{ request()?.portA }}</dt>
              <dd>{{ result.distinctA | number }}</dd>
            </div>
            <div>
              <dt>Distinct on {{ request()?.portB }}</dt>
              <dd>{{ result.distinctB | number }}</dd>
            </div>
            <div>
              <dt>On both</dt>
              <dd class="ok">{{ result.sharedCount | number }}</dd>
            </div>
            <div>
              <dt>Only on A</dt>
              <dd [class.bad]="result.onlyA.length > 0">{{ result.onlyA.length | number }}</dd>
            </div>
            <div>
              <dt>Only on B</dt>
              <dd [class.bad]="result.onlyB.length > 0">{{ result.onlyB.length | number }}</dd>
            </div>
            <div>
              <dt>Overlap</dt>
              <dd>{{ result.jaccard | number: '1.0-3' }}</dd>
            </div>
            <div>
              <dt>Conflicting</dt>
              <dd [class.bad]="conflictingCount() > 0">{{ conflictingCount() | number }}</dd>
            </div>
          </dl>

          @if (result.duplicatesA > 0 || result.duplicatesB > 0) {
            <p class="line">
              Collapsed {{ result.duplicatesA | number }} repeat(s) on A and
              {{ result.duplicatesB | number }} on B — a message re-sent on the same channel counts
              once, or a retransmission would read as a gap on the other side.
            </p>
          }

          @if (unkeyedCount() > 0) {
            <p class="line note">
              Set aside {{ unkeyedCount() | number }} message(s) carrying none of the key fields —
              {{ result.unkeyedA.length | number }} on A, {{ result.unkeyedB.length | number }} on B.
              The receiver keeps only its index attributes for structures it has no schema for, so a
              key naming HL7 fields cannot address them. They are excluded from every count above
              rather than counted as matched or missing.
            </p>
          }

          @if (comparer.provisional()) {
            <p class="line note">
              Provisional: {{ truncatedSides() }} hit the {{ request()?.cap | number }}-message cap,
              so a message reported as present on only one channel may simply be past the cut-off on
              the other. Narrow the date window or raise the cap to conclude anything about coverage.
            </p>
          }
        </zb-simple-panel>

        <mat-tab-group class="results" animationDuration="0ms">
          <mat-tab [label]="'On both (' + result.sharedCount + ')'">
            @if (result.couplings.length === 0) {
              <p class="line pad">Nothing matched. In business-key mode that usually means the key
                fields are absent from these message types — try different key fields.</p>
            } @else {
              <table class="grid">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Control ID on A</th>
                    <th>Control ID on B</th>
                    <th class="num">Conflicts</th>
                  </tr>
                </thead>
                <tbody>
                  @for (coupling of shown(result.couplings); track coupling.fingerprint) {
                    <tr>
                      <td>
                        <span class="descriptor">{{ coupling.descriptor }}</span>
                        <span class="sub">{{ coupling.receivedAtA | date: 'medium' }}</span>
                      </td>
                      <td><a class="mono" [routerLink]="['/messages/detail']" [queryParams]="{ id: coupling.controlIdA }">{{ coupling.controlIdA }}</a></td>
                      <td><a class="mono" [routerLink]="['/messages/detail']" [queryParams]="{ id: coupling.controlIdB }">{{ coupling.controlIdB }}</a></td>
                      <td class="num" [class.bad]="coupling.conflicts.length > 0">
                        {{ coupling.conflicts.length || '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (result.couplings.length > RENDER_LIMIT) {
                <p class="line pad">Showing the first {{ RENDER_LIMIT }} of {{ result.couplings.length | number }}.</p>
              }
            }
          </mat-tab>

          <mat-tab [label]="'Only on A (' + result.onlyA.length + ')'">
            @if (result.onlyA.length === 0) {
              <p class="line pad ok">Every message on {{ request()?.portA }} has a counterpart on {{ request()?.portB }}.</p>
            } @else {
              <table class="grid">
                <thead>
                  <tr><th>Message</th><th>Control ID</th><th>Received</th></tr>
                </thead>
                <tbody>
                  @for (record of shown(result.onlyA); track record.controlId) {
                    <tr>
                      <td class="descriptor">{{ record.descriptor }}</td>
                      <td><a class="mono" [routerLink]="['/messages/detail']" [queryParams]="{ id: record.controlId }">{{ record.controlId }}</a></td>
                      <td>{{ record.receivedAt | date: 'medium' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (result.onlyA.length > RENDER_LIMIT) {
                <p class="line pad">Showing the first {{ RENDER_LIMIT }} of {{ result.onlyA.length | number }}.</p>
              }
            }
          </mat-tab>

          <mat-tab [label]="'Only on B (' + result.onlyB.length + ')'">
            @if (result.onlyB.length === 0) {
              <p class="line pad ok">Every message on {{ request()?.portB }} has a counterpart on {{ request()?.portA }}.</p>
            } @else {
              <table class="grid">
                <thead>
                  <tr><th>Message</th><th>Control ID</th><th>Received</th></tr>
                </thead>
                <tbody>
                  @for (record of shown(result.onlyB); track record.controlId) {
                    <tr>
                      <td class="descriptor">{{ record.descriptor }}</td>
                      <td><a class="mono" [routerLink]="['/messages/detail']" [queryParams]="{ id: record.controlId }">{{ record.controlId }}</a></td>
                      <td>{{ record.receivedAt | date: 'medium' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (result.onlyB.length > RENDER_LIMIT) {
                <p class="line pad">Showing the first {{ RENDER_LIMIT }} of {{ result.onlyB.length | number }}.</p>
              }
            }
          </mat-tab>

          <mat-tab [label]="'Field conflicts (' + comparer.conflictPaths().length + ')'">
            @if (comparer.conflictPaths().length === 0) {
              <p class="line pad ok">Shared messages are identical field for field.</p>
            } @else {
              <p class="line pad">
                Fields that differ between the two copies of a shared message, most widespread first.
                Array positions are collapsed, so one divergence across 60 OBX repeats is one row.
              </p>
              <table class="grid">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>On A</th>
                    <th>On B</th>
                    <th class="num">Messages</th>
                    <th class="num">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  @for (conflict of comparer.conflictPaths(); track conflict.path) {
                    <tr>
                      <td class="mono wrap">{{ conflict.path }}</td>
                      <td class="mono wrap">{{ conflict.sample.absentA ? '(absent)' : conflict.sample.a }}</td>
                      <td class="mono wrap">{{ conflict.sample.absentB ? '(absent)' : conflict.sample.b }}</td>
                      <td class="num">{{ conflict.messages | number }}</td>
                      <td class="num">{{ conflict.occurrences | number }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </mat-tab>
        </mat-tab-group>
      }
    }
  `,
  styles: `
    :host { display: block; display: flex; flex-direction: column; gap: var(--zb-spacing-md); }
    .bar { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--zb-spacing-sm); margin-bottom: var(--zb-spacing-sm); }
    .bar .spacer { flex: 1 1 auto; }
    .port { width: 240px; }
    .mode { width: 200px; }
    .key { width: 380px; }
    .cap { width: 200px; }
    .count { color: var(--zb-secondary-text); }
    .line { margin: 0 0 var(--zb-spacing-sm); color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }
    .line.pad { padding: var(--zb-spacing-md); }
    .line.error, .line.note { color: var(--zb-warn); }
    .line.ok { color: var(--zb-success, var(--zb-primary)); }
    .counts { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-lg); margin: 0 0 var(--zb-spacing-md); }
    dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    dd { margin: 2px 0 0; font-size: var(--zb-font-size-lg); font-weight: 600; }
    dd.ok { color: var(--zb-success, var(--zb-primary)); }
    dd.bad { color: var(--zb-warn); }
    .results { background: var(--zb-card-background, transparent); }
    table.grid { width: 100%; border-collapse: collapse; font-size: var(--zb-font-size-sm); }
    table.grid th { text-align: left; font-weight: 500; color: var(--zb-secondary-text); padding: 6px 8px; border-bottom: 1px solid var(--zb-border-color); }
    table.grid td { padding: 6px 8px; border-bottom: 1px solid var(--zb-border-color); vertical-align: top; }
    table.grid .num { text-align: right; width: 110px; }
    td.bad { color: var(--zb-warn); font-weight: 600; }
    .descriptor { display: block; font-weight: 500; }
    .sub { display: block; color: var(--zb-secondary-text); font-size: 11px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
    .wrap { word-break: break-all; }
    a.mono { color: var(--zb-primary); text-decoration: none; }
    a.mono:hover { text-decoration: underline; }
  `,
})
export class Channels {
  protected readonly target = inject(Hl7TargetService);
  protected readonly comparer = inject(ChannelComparer);
  private readonly api = inject(Hl7Api);

  protected readonly RENDER_LIMIT = RENDER_LIMIT;
  protected readonly CAPS = [500, 2000, 5000] as const;

  protected readonly ports = signal<readonly FacetValue[]>([]);
  protected readonly facetError = signal<string | null>(null);
  protected readonly portA = signal('');
  protected readonly portB = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly mode = signal<MatchMode>('identity');
  protected readonly identityText = signal(DEFAULT_IDENTITY.join(', '));
  protected readonly cap = signal<number>(2000);

  protected readonly request = this.comparer.request;
  protected readonly samePort = computed(
    () => this.portA() !== '' && this.portA() === this.portB(),
  );
  protected readonly canCompare = computed(
    () => this.portA() !== '' && this.portB() !== '' && !this.samePort(),
  );
  protected readonly progress = computed(() => {
    const planned = this.comparer.totalA() + this.comparer.totalB();
    if (planned <= 0) return 0;
    return ((this.comparer.fetchedA() + this.comparer.fetchedB()) / planned) * 100;
  });
  protected readonly unkeyedCount = computed(() => {
    const result = this.comparer.comparison();
    return result ? result.unkeyedA.length + result.unkeyedB.length : 0;
  });
  protected readonly conflictingCount = computed(
    () => this.comparer.comparison()?.couplings.filter((c) => !c.consistent).length ?? 0,
  );
  protected readonly truncatedSides = computed(() => {
    const a = this.comparer.truncatedA();
    const b = this.comparer.truncatedB();
    return a && b ? 'both channels' : a ? 'channel A' : 'channel B';
  });

  constructor() {
    // Ports belong to the target's data, so they're re-read whenever the target changes — and any
    // result computed against the previous target is dropped rather than left to look current.
    effect(() => {
      const targetId = this.target.targetId();
      untracked(() => {
        this.comparer.reset();
        this.ports.set([]);
        this.portA.set('');
        this.portB.set('');
        if (targetId) void this.loadPorts();
      });
    });
  }

  protected compare(): void {
    if (!this.canCompare()) return;
    void this.comparer.run({
      portA: this.portA(),
      portB: this.portB(),
      from: this.from(),
      to: this.to(),
      mode: this.mode(),
      identity: parseIdentity(this.identityText()),
      cap: this.cap(),
    });
  }

  /** The slice of a list we actually render — see RENDER_LIMIT. */
  protected shown<T>(items: readonly T[]): readonly T[] {
    return items.length > RENDER_LIMIT ? items.slice(0, RENDER_LIMIT) : items;
  }

  private async loadPorts(): Promise<void> {
    this.facetError.set(null);
    try {
      const ports = await this.api.facet('sourcePort');
      this.ports.set(ports);
      // Two ports is the common case on a small receiver; pre-selecting them saves the reader from
      // making a choice the data has already made for them.
      if (ports.length === 2) {
        this.portA.set(ports[0].value);
        this.portB.set(ports[1].value);
      }
    } catch (err) {
      this.facetError.set(messageOf(err));
    }
  }
}

/** `a, b ,c` -> `['a','b','c']`. Empty input means "no key", which the comparer reads as content mode. */
function parseIdentity(text: string): readonly string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
