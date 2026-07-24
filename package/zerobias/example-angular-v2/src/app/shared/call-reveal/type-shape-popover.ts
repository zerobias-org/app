import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { ZbCodeEditorComponent } from '@zerobias-org/ngx-library';

import { RESPONSE_SHAPES } from './response-shapes.generated';
import { CopyButton } from './copy-button';

/**
 * TypeShapePopover — a small "TS" badge shown next to a response's type name (twin of
 * example-nextjs-v2's `TypeShapePopover.tsx`). Hover reveals a popover with the REAL class shape,
 * extracted from the installed SDK at build time (`response-shapes.generated.ts`, via
 * `npm run extract:shapes`) so it can never drift; a copy button lets a dev paste the type into
 * their own code as a reference.
 *
 * Interaction: hover reveals; clicking the badge PINS the popover so it survives moving the cursor
 * away (to select/copy the shape) — click again to unpin. Close runs on a short delay (cancelled if
 * the cursor re-enters the badge OR popover) so the cursor has time to travel across the gap.
 */
@Component({
  selector: 'app-type-shape-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZbCodeEditorComponent, CopyButton],
  template: `
    <span class="type-popover-wrap" (mouseenter)="onEnter()" (mouseleave)="onLeave()">
      <button
        type="button"
        class="type-badge"
        [attr.aria-expanded]="open()"
        [attr.aria-pressed]="pinned()"
        [attr.aria-label]="'Show the ' + typeName() + ' type shape'"
        (click)="pinned.set(!pinned())"
      >
        TS
      </button>

      @if (open() && shape()) {
        <div class="type-popover" role="dialog" [attr.aria-label]="typeName() + ' type shape'">
          <div class="type-popover-head">
            <code>{{ typeName() }}</code>
            <span class="type-popover-hint">&#64;zerobias-com/platform-sdk</span>
            <app-copy-button [value]="shape()" />
          </div>
          <zb-code-editor [value]="shape()" [extensions]="tsExt" [readOnly]="true"></zb-code-editor>
        </div>
      }
    </span>
  `,
  styles: `
    .type-popover-wrap {
      position: relative;
      display: inline-flex;
    }
    .type-badge {
      padding: 0 6px;
      border: 1px solid var(--zb-divider);
      border-radius: 4px;
      background: transparent;
      color: var(--zb-secondary-text);
      font-family: var(--zb-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      font-size: 11px;
      font-weight: 600;
      line-height: 1.5;
      letter-spacing: 0.02em;
      cursor: pointer;
    }
    .type-badge:hover,
    .type-badge[aria-pressed='true'] {
      color: var(--zb-primary);
      border-color: var(--zb-primary);
    }
    .type-popover {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 40;
      width: min(520px, 80vw);
      max-height: 380px;
      overflow: auto;
      padding: var(--zb-spacing-sm);
      border: 1px solid var(--zb-divider);
      border-radius: 8px;
      background: var(--zb-background);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
      cursor: default;
      text-transform: none;
      letter-spacing: normal;
      font-weight: 400;
      font-style: normal;
    }
    /* Transparent bridge across the gap up to the badge, so moving the cursor from badge to popover
       never crosses un-hovered space (belt-and-suspenders with the timer-based close delay). */
    .type-popover::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 0;
      right: 0;
      height: 6px;
    }
    .type-popover-head {
      display: flex;
      align-items: baseline;
      gap: var(--zb-spacing-sm);
      margin-bottom: var(--zb-spacing-xs);
    }
    .type-popover-head code {
      font-family: var(--zb-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      font-size: var(--zb-font-size-sm);
      color: var(--zb-primary);
    }
    .type-popover-hint {
      flex: 1;
      font-size: var(--zb-font-size-xs, 12px);
      color: var(--zb-secondary-text);
    }
    zb-code-editor {
      display: block;
      border: 1px solid var(--zb-divider);
      border-radius: 6px;
      overflow: hidden;
    }
  `,
})
export class TypeShapePopover {
  /** The SDK class to show (e.g. `ProjectExtended`). Must be a key of {@link RESPONSE_SHAPES}. */
  readonly typeName = input.required<string>();

  /** CodeMirror TS grammar for the shape (highlighted like the call panel). */
  protected readonly tsExt: Extension[] = [javascript({ typescript: true })];

  protected readonly hovered = signal(false);
  protected readonly pinned = signal(false);
  protected readonly open = computed(() => this.hovered() || this.pinned());
  protected readonly shape = computed(() => RESPONSE_SHAPES[this.typeName()] ?? '');

  private closeTimer?: ReturnType<typeof setTimeout>;

  onEnter(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
    this.hovered.set(true);
  }

  onLeave(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    // Delay so the cursor can travel from the badge into the popover before it closes.
    this.closeTimer = setTimeout(() => this.hovered.set(false), 250);
  }
}
