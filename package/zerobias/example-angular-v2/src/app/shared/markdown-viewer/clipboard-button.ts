import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * ClipboardButtonComponent — the copy control ngx-markdown renders on fenced code blocks.
 * Vendored from zb-ui-lib (`zerobias-markdown-viewer/clipboard-button`) and wired globally via
 * `CLIPBOARD_OPTIONS` in {@link appConfig}, so every rendered code block gets a copy button.
 *
 * `ViewEncapsulation.None` is intentional: the specificity-heavy overrides below (matching the
 * real component) need to reach the Material button that ngx-markdown injects outside this view.
 */
@Component({
  selector: 'clipboard-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      color="primary"
      class="btn-clipboard"
      (click)="onCopy(); $event.stopPropagation()"
    >
      <mat-icon>content_copy</mat-icon>
    </button>
  `,
  styles: `
    clipboard-button {
      position: relative;
      top: -4px;
      right: -4px;
      display: block;
    }
    .btn-clipboard.mdc-icon-button.mat-mdc-icon-button.mat-primary.mat-mdc-button-base {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-clipboard.mat-mdc-icon-button > *[role='img'] {
      width: 24px;
      height: 24px;
      font-size: 24px;
    }
    .btn-clipboard.mat-mdc-icon-button > *[role='img'] svg {
      width: 24px;
      height: 24px;
    }
  `,
})
export class ClipboardButtonComponent {
  private readonly snackbar = inject(MatSnackBar);

  onCopy(): void {
    this.snackbar.open('Copied to clipboard!', undefined, {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: 'success-toast',
    });
  }
}
