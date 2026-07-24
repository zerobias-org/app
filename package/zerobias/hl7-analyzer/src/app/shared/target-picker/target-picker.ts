import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ZbResourceStatusComponent, ZbSimplePanelComponent } from '@zerobias-org/ngx-library';

import { Hl7TargetService } from '../../core/hl7-target.service';

/**
 * Picks the HL7 feed: which connection, and (when there is more than one) which scope.
 *
 * The org comes first and is chosen in the header's account menu — connections belong to an org, so
 * switching there reloads this list. That ordering is deliberate and matches how the platform works;
 * this component owns only the second half of the choice.
 *
 * Selects collapse to a read-only line when there is nothing to decide (one connection, one scope —
 * the usual case), so the common path is a statement of fact rather than a form to fill in.
 */
@Component({
  selector: 'app-target-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, ZbSimplePanelComponent, ZbResourceStatusComponent],
  template: `
    <zb-simple-panel title="HL7 feed" mode="header-only" [bodyPad]="true">
      @if (target.phase() === 'loading' && target.connections().length === 0) {
        <p class="hint">Looking for HL7 receiver connections in this org&hellip;</p>
      } @else if (target.connections().length === 0) {
        <p class="hint error">
          {{ target.error() ?? 'This org has no HL7 receiver connection.' }}
        </p>
        <p class="hint">
          Switch org in the account menu, or deploy the
          <code>&#64;zerobias-org/module-hl7-v2</code> module to a Hub node.
        </p>
      } @else {
        <div class="row">
          @if (target.connections().length === 1) {
            <div class="fixed">
              <span class="label">Connection</span>
              <span class="value">{{ target.connections()[0].name }}</span>
              <zb-resource-status [label]="target.connections()[0].status" [pill]="true" />
            </div>
          } @else {
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Connection</mat-label>
              <mat-select
                [value]="target.connectionId()"
                (valueChange)="choose($event)"
                panelWidth="null"
              >
                @for (c of target.connections(); track c.id) {
                  <mat-option [value]="c.id">{{ c.name }} &middot; {{ c.status }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          @if (target.scopes().length > 1) {
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Scope</mat-label>
              <mat-select
                [value]="target.scopeId()"
                (valueChange)="target.chooseScope($event)"
                panelWidth="null"
              >
                @for (s of target.scopes(); track s.id) {
                  <mat-option [value]="s.id">{{ s.name }} &middot; {{ s.status }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>

        @if (target.error()) {
          <p class="hint error">{{ target.error() }}</p>
        } @else if (target.phase() === 'connecting') {
          <p class="hint">Connecting through the Hub&hellip;</p>
        } @else if (target.targetId()) {
          <p class="hint">
            Target <code>{{ target.targetId() }}</code> &mdash; every call below is proxied to this
            module through the Hub.
          </p>
        } @else {
          <p class="hint">Choose a connection to start.</p>
        }
      }
    </zb-simple-panel>
  `,
  styles: `
    :host { display: block; }
    .row { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-md); align-items: center; }
    mat-form-field { min-width: 320px; }
    .fixed { display: flex; align-items: center; gap: var(--zb-spacing-sm); }
    .label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .value { font-weight: 500; }
    .hint { margin: var(--zb-spacing-sm) 0 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); line-height: 1.5; }
    .hint.error { color: var(--zb-warn); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
  `,
})
export class TargetPicker {
  protected readonly target = inject(Hl7TargetService);

  protected choose(id: string): void {
    void this.target.chooseConnection(id);
  }
}
