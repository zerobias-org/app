import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * A received-on window, as two `YYYY-MM-DD` strings.
 *
 * Native `type="date"` inputs rather than `mat-datepicker`: the picker needs a `DateAdapter`
 * provider and hands back `Date` objects that would have to be formatted back to the date-only
 * strings the receiver's filter language wants. The native control already speaks exactly that
 * format, localizes itself, and needs no provider.
 */
@Component({
  selector: 'app-date-range',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>{{ fromLabel() }}</mat-label>
      <input
        matInput
        type="date"
        [value]="from()"
        [max]="to() || null"
        (change)="from.set(value($event))"
      />
    </mat-form-field>
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>{{ toLabel() }}</mat-label>
      <input
        matInput
        type="date"
        [value]="to()"
        [min]="from() || null"
        (change)="to.set(value($event))"
      />
    </mat-form-field>
  `,
  styles: `
    :host { display: contents; }
    mat-form-field { width: 170px; }
  `,
})
export class DateRange {
  /** Inclusive lower bound, `YYYY-MM-DD`, or `''` for unbounded. */
  readonly from = model('');
  /** Inclusive upper bound, `YYYY-MM-DD`, or `''` for unbounded. Widened to end-of-day when filtered. */
  readonly to = model('');
  readonly fromLabel = input('Received from');
  readonly toLabel = input('Received to');

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
