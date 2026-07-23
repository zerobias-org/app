import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Drawer — an overlay panel scoped to the region BESIDE the sidebar rail (the whole content area
 * minus the 220px nav), a faithful port of example-nextjs-v2's `Drawer`. Sizes match exactly:
 *
 *   - spans from the rail's right edge (left: 220px) to the viewport right, below the 68px header;
 *   - the panel is 90% of that region (grows with the viewport) so the code reveal spreads wide;
 *   - slides in from the right via translateX, 280ms ease-out; NO backdrop scrim — the layer is
 *     pointer-events:none so content behind stays visible/interactive; the panel is interactive.
 *
 * Escape or the close button closes it. Hosts the create/edit code-reveal forms (2-column inside).
 *
 * Hand-rolled (not an ngx component) because this is app-shell chrome — the sanctioned last-resort
 * case per the package guardrail; ngx ships no drawer.
 */
@Component({
  selector: 'app-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="drawer-root" [class.open]="open()">
      <aside class="drawer-panel" role="dialog" aria-modal="false" [attr.aria-label]="title()">
        <header class="drawer-header">
          <h2 class="drawer-title">{{ title() }}</h2>
          <button type="button" class="drawer-close" (click)="close.emit()" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        </header>
        <div class="drawer-body">
          <ng-content></ng-content>
        </div>
      </aside>
    </div>
  `,
  styles: `
    .drawer-root {
      position: fixed;
      top: 68px; /* below the 64px toolbar + 4px accent bar */
      right: 0;
      bottom: 0;
      left: 220px; /* the rail's right edge — never over the nav */
      overflow: hidden; /* clips the closed (slid-out) panel */
      pointer-events: none; /* the layer never blocks the content behind it */
      z-index: 20;
    }
    .drawer-panel {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: 90%; /* of the region beside the rail — grows with the viewport */
      display: flex;
      flex-direction: column;
      pointer-events: auto;
      background: var(--zb-background-card, var(--zb-background));
      border-left: 1px solid var(--zb-divider);
      transform: translateX(100%); /* closed = fully off to the right */
      transition: transform 280ms ease-out;
      outline: none;
    }
    .drawer-root.open .drawer-panel { transform: translateX(0); }
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--zb-spacing-md);
      padding: var(--zb-spacing-md) var(--zb-spacing-lg);
      border-bottom: 1px solid var(--zb-divider);
      flex: 0 0 auto;
    }
    .drawer-title { margin: 0; font-size: 20px; color: var(--zb-text); }
    .drawer-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--zb-spacing-xs);
      background: none;
      border: 0;
      border-radius: 6px;
      color: var(--zb-secondary-text);
      cursor: pointer;
    }
    .drawer-close:hover { color: var(--zb-text); background: var(--zb-table-row-hover); }
    .drawer-body { flex: 1 1 auto; overflow-y: auto; padding: var(--zb-spacing-lg); }
    @media (prefers-reduced-motion: reduce) {
      .drawer-panel { transition: none; }
    }
  `,
})
export class Drawer {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly close = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close.emit();
  }
}
