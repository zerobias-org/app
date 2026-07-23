import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { ZbCodeEditorComponent } from '@zerobias-org/ngx-library';

import { autoFoldBeyondDepth } from './auto-fold';

/**
 * CallReveal — the code-reveal write-demo primitive (twin of example-nextjs-v2's `CallReveal.tsx`).
 * It shows the code a consumer would write to perform a write, WITHOUT issuing it. Two stacked
 * panels:
 *
 *   1. The call     — the invocation INCLUDING its payload, as TypeScript. Callers build the text
 *                     from the REAL SDK request object via {@link objectLiteral}, e.g.
 *                     `const project: NewProject = { name: "…", status: "draft" }`, so the code
 *                     shown cannot drift from what was actually constructed — that's the anti-rot
 *                     guarantee. (There used to be a separate "Request payload" JSON panel; it was
 *                     folded into this one so a reader sees the shape and the values together
 *                     instead of zipping a signature against a JSON blob below it.)
 *   2. Response     — an obfuscated fixture showing the return shape, labeled as a fixture; or the
 *                     real response when `live` is set (the Module Usage page, whose chain really
 *                     executes).
 *
 * Real UUIDs are truncated for display (`9b2e6f14…`). Nothing here calls the platform. The panels
 * use ngx-library's `zb-code-editor` in read-only mode (dark oneDark theme via ZbThemeService).
 */
@Component({
  selector: 'app-call-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZbCodeEditorComponent],
  template: `
    <div class="call-reveal">
      <div class="block">
        <div class="label">The call</div>
        <zb-code-editor [value]="callText()" [extensions]="tsExt" [readOnly]="true"></zb-code-editor>
      </div>

      @if (response() !== undefined) {
        <div class="block">
          <div class="label">
            @if (live()) {
              Response
              <span class="note">actual response from the platform</span>
            } @else {
              Example response
              <span class="note">obfuscated fixture — no call is made</span>
            }
          </div>
          <zb-code-editor [value]="responseText()" [extensions]="jsonExt" [readOnly]="true"></zb-code-editor>
        </div>
      }
    </div>
  `,
  styles: `
    .call-reveal { display: flex; flex-direction: column; gap: var(--zb-spacing-md); }
    .label {
      display: flex;
      align-items: baseline;
      gap: var(--zb-spacing-sm);
      color: var(--zb-secondary-text);
      font-size: var(--zb-font-size-sm);
      font-weight: 500;
      margin-bottom: var(--zb-spacing-xs);
    }
    .note {
      color: var(--zb-secondary-text);
      font-weight: 400;
      font-style: italic;
      font-size: var(--zb-font-size-xs, 12px);
    }
    zb-code-editor {
      display: block;
      border: 1px solid var(--zb-divider);
      border-radius: 6px;
      overflow: hidden;
    }
  `,
})
export class CallReveal {
  /** CodeMirror language grammars for syntax highlighting (TS for the call, JSON for responses). */
  protected readonly tsExt: Extension[] = [javascript({ typescript: true })];
  /**
   * Response JSON folds anything nested deeper than 2 containers, keeping a 900-line listing
   * readable as `{ count, items: [ {…} ] }`. See {@link autoFoldBeyondDepth}.
   *
   * NOTE: do NOT add `codeFolding()` / `foldGutter()` here. `zb-code-editor` runs CodeMirror with
   * `setup: 'basic'`, and basicSetup already includes both — adding them again renders a SECOND
   * fold gutter, which shows up as doubled carets on every foldable line.
   */
  protected readonly jsonExt: Extension[] = [json(), autoFoldBeyondDepth(2)];

  /** The invocation, shown as TypeScript. */
  readonly call = input.required<string>();
  /** An obfuscated example response fixture. Omit to show only the call. */
  readonly response = input<unknown>(undefined);

  /**
   * Write demos (the default) reveal a call that is NEVER made, so the response is a fixture.
   * The Module Usage page is the opposite: its chain is read-only and the calls DO execute, so it
   * sets `live` and the panel is labelled as a real response instead of an example.
   */
  readonly live = input(false);

  protected readonly callText = computed(() => truncateUuids(this.call()));
  protected readonly responseText = computed(() =>
    this.response() === undefined ? '' : truncateUuids(JSON.stringify(this.response(), null, 2)),
  );
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Truncate any full UUID to its first segment + an ellipsis, for display only. Exported for tests. */
export function truncateUuids(text: string): string {
  return text.replace(UUID_RE, (id) => `${id.slice(0, 8)}…`);
}

/** One value as it would appear in source. SDK enums / UUID / DateFormat stringify to wire form. */
function literalOf(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const asString = String(value);
    // UUID / enums / DateFormat have a meaningful toString; a plain object does not.
    return asString === '[object Object]' ? JSON.stringify(value) : JSON.stringify(asString);
  }
  return JSON.stringify(String(value));
}

/**
 * Render a live SDK request object as the object literal a consumer assigns to a typed const, e.g.
 * `const project: NewProject = { … }`. Typing the const is what makes the compiler enforce the
 * model's required fields at the call site.
 *
 * This is what lets the demo show the call and its payload in ONE panel: rather than printing a
 * generic signature beside a separate JSON blob, the reader sees the actual construction with the
 * actual values, which is also exactly what the app runs. Keys whose value is `undefined` are
 * dropped — an optional field you did not set should not appear as noise.
 */
export function objectLiteral(value: unknown, indent = 2): string {
  const pad = ' '.repeat(indent);
  const entries = Object.entries((value ?? {}) as Record<string, unknown>).filter(
    ([, v]) => v !== undefined,
  );
  if (!entries.length) return '{}';
  return `{\n${entries.map(([k, v]) => `${pad}${k}: ${literalOf(v)},`).join('\n')}\n}`;
}
