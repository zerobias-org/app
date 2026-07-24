import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ZbSimplePanelComponent } from '@zerobias-org/ngx-library';

import { SessionService } from '../../core/session.service';
import { Hl7TargetService } from '../../core/hl7-target.service';
import { TargetPicker } from '../../shared/target-picker/target-picker';

/**
 * Overview — pick the feed, then choose a tool.
 *
 * The picker lives here because the choice is shared: both tools read from one target, and putting
 * it on the landing page makes the order of operations (org, then feed, then work) the shape of the
 * app rather than something to explain.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, ZbSimplePanelComponent, TargetPicker],
  template: `
    <section class="intro">
      <h1>HL7 v2 analyzer</h1>
      <p class="lead">
        Reads the messages captured by an <code>&#64;zerobias-org/module-hl7-v2</code> MLLP receiver
        through the Hub. Two tools: validate a message against its HL7 schema, and check whether two
        receiving ports are carrying the same traffic.
      </p>
    </section>

    <app-target-picker />

    <div class="tools">
      <a class="tool" routerLink="/messages" [class.disabled]="!target.targetId()">
        <mat-icon>search</mat-icon>
        <span class="tool-title">Messages</span>
        <span class="tool-text">
          Search by port, structure, version, sender or date. Validate a whole result set at once, or
          open one message to see its JSON, its ER7 wire text, and every invalid region highlighted
          in place with the schema rule that flagged it.
        </span>
      </a>
      <a class="tool" routerLink="/channels" [class.disabled]="!target.targetId()">
        <mat-icon>compare_arrows</mat-icon>
        <span class="tool-title">Channels</span>
        <span class="tool-text">
          Compare two receiving ports over a date range. Shows what both carry, what only one has,
          and where two copies of the same message disagree field by field.
        </span>
      </a>
    </div>

    <zb-simple-panel title="Session" mode="header-only" [bodyPad]="true" class="session">
      @if (session.user(); as user) {
        <dl class="session-grid">
          <div>
            <dt>Signed in as</dt>
            <dd>{{ user.name }}</dd>
          </div>
          <div>
            <dt>Organization</dt>
            <dd>{{ session.org()?.name ?? '—' }}</dd>
          </div>
        </dl>
        <p class="hint">
          Connections belong to an org, so switching org in the account menu re-picks the feed.
        </p>
      } @else {
        <p class="hint">Resolving your session&hellip;</p>
      }
    </zb-simple-panel>
  `,
  styles: `
    :host { display: block; max-width: 980px; }
    .intro h1 { margin: 0 0 var(--zb-spacing-sm); }
    .lead { color: var(--zb-secondary-text); font-size: var(--zb-font-size-lg); line-height: 1.5; margin: 0 0 var(--zb-spacing-lg); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }

    .tools { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--zb-spacing-md); margin-top: var(--zb-spacing-lg); }
    .tool {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-areas: 'icon title' 'icon text';
      gap: 2px var(--zb-spacing-md);
      padding: var(--zb-spacing-lg);
      border: 1px solid var(--zb-border-color);
      border-radius: var(--zb-border-radius);
      background: var(--zb-surface);
      color: inherit;
      text-decoration: none;
      transition: border-color 120ms ease, background 120ms ease;
    }
    .tool:hover { border-color: var(--zb-primary); background: var(--zb-hover-background); }
    .tool.disabled { opacity: 0.55; pointer-events: none; }
    .tool mat-icon { grid-area: icon; color: var(--zb-primary); }
    .tool-title { grid-area: title; font-weight: 600; }
    .tool-text { grid-area: text; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }

    .session { display: block; margin-top: var(--zb-spacing-lg); }
    .session-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--zb-spacing-md); margin: 0; }
    dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    dd { margin: 4px 0 0; font-weight: 500; }
    .hint { margin: var(--zb-spacing-md) 0 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }
  `,
})
export class Home {
  protected readonly session = inject(SessionService);
  protected readonly target = inject(Hl7TargetService);
}
