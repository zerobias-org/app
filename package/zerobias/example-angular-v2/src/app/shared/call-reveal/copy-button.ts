import { ChangeDetectionStrategy, Component, OnDestroy, input, signal } from '@angular/core';

/**
 * CopyButton — a small "Copy" control that copies its `value` via the native Clipboard API and
 * briefly flips to "Copied". Shared by the CallReveal code panels (revealed on hover — the parent
 * controls visibility) and the TypeShapePopover (always visible). Twin of example-nextjs-v2's
 * CodeBlock copy button.
 */
@Component({
  selector: 'app-copy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="copy-btn"
      (click)="copy(); $event.stopPropagation()"
      [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
    >
      {{ copied() ? 'Copied' : 'Copy' }}
    </button>
  `,
  styles: `
    .copy-btn {
      padding: 2px 8px;
      border: 1px solid var(--zb-divider);
      border-radius: 4px;
      background: var(--zb-background-card, var(--zb-background));
      color: var(--zb-secondary-text);
      font-family: var(--zb-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      font-size: var(--zb-font-size-xs, 12px);
      line-height: 1.5;
      cursor: pointer;
    }
    .copy-btn:hover {
      color: var(--zb-text);
      border-color: var(--zb-primary);
    }
  `,
})
export class CopyButton implements OnDestroy {
  readonly value = input.required<string>();
  protected readonly copied = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.value());
      this.copied.set(true);
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard blocked (insecure context / permissions) — leave the button state unchanged.
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
