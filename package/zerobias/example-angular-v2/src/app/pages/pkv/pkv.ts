import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Pkv as PkvPair } from '@zerobias-com/dana-sdk';
import { ZbSimplePanelComponent } from '@zerobias-org/ngx-library';

import { SessionService } from '../../core/session.service';

interface PkvForm {
  key: string;
  /** Raw JSON text; parsed to an object on submit (Pkv.value is `{ [k]: object }`). */
  value: string;
}

const DEFAULT_VALUE = '{ "example": true }';

/**
 * Canonical read + write against the Principal Key-Value store — the Angular twin of
 * example-nextjs-v2's `/pkv` page.
 *   read:  danaClient.getPkvApi().listPrincipalKeyValues(_, _, 50) -> PagedResults<Pkv>
 *   write: danaClient.getPkvApi().upsertPrincipalKeyValue({ key, value })
 *
 * `Pkv.value` is a JSON object map, so the textarea text must parse to a (non-array) object.
 * The write form uses Angular 21 Signal Forms (`form()` + `[formField]`) like the app's other
 * write demo (create-api-key-dialog).
 */
@Component({
  selector: 'app-pkv',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZbSimplePanelComponent, FormField],
  template: `
    <section class="intro">
      <h1>Principal Key-Value</h1>
      <p class="lead">
        <code>danaClient.getPkvApi()</code> — list and upsert key-value pairs scoped to the
        current principal.
      </p>
    </section>

    <zb-simple-panel title="Add / update a pair" mode="header-only" [bodyPad]="true" class="panel">
      <form class="pkv-form" (submit)="$event.preventDefault(); submit()">
        <div class="field">
          <label for="pkv-key">Key</label>
          <input id="pkv-key" [formField]="pkvForm.key" placeholder="my-setting" autocomplete="off" />
        </div>
        <div class="field">
          <label for="pkv-value">Value (JSON object)</label>
          <textarea id="pkv-value" rows="3" [formField]="pkvForm.value"></textarea>
        </div>
        @if (error(); as e) {
          <p class="error" role="alert">{{ e }}</p>
        }
        <button class="btn" type="submit" [disabled]="saving() || !pkvForm().valid()">
          {{ saving() ? 'Saving…' : 'Save pair' }}
        </button>
      </form>
    </zb-simple-panel>

    <zb-simple-panel title="Stored pairs" mode="header-only" [bodyPad]="true" class="panel">
      @if (loading()) {
        <p class="state">Loading key-value pairs…</p>
      } @else if (pairRows().length === 0) {
        <p class="state">No key-value pairs yet.</p>
      } @else {
        <table class="kv-table">
          <thead>
            <tr><th>Key</th><th>Value</th></tr>
          </thead>
          <tbody>
            @for (row of pairRows(); track row.key) {
              <tr>
                <td><code>{{ row.key }}</code></td>
                <td><code>{{ row.value }}</code></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </zb-simple-panel>
  `,
  styles: `
    :host { display: block; }
    .intro h1 { margin: 0 0 var(--zb-spacing-xs); }
    .lead { color: var(--zb-secondary-text); margin: 0 0 var(--zb-spacing-md); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
    .panel { display: block; margin-bottom: var(--zb-spacing-md); }
    .pkv-form { display: flex; flex-direction: column; gap: var(--zb-spacing-sm); }
    .field { display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    input, textarea {
      padding: var(--zb-spacing-xs) var(--zb-spacing-sm);
      border: 1px solid var(--zb-divider);
      border-radius: 6px;
      background: var(--zb-background);
      color: var(--zb-text);
      font-size: var(--zb-font-size-md);
      font-family: inherit;
    }
    textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical; }
    input:focus, textarea:focus { outline: 2px solid var(--zb-primary); outline-offset: -1px; }
    .btn {
      align-self: flex-start;
      height: 40px;
      padding: 0 var(--zb-spacing-lg);
      border: none;
      border-radius: 6px;
      background: var(--zb-primary);
      color: #fff;
      font-size: var(--zb-font-size-md);
      cursor: pointer;
    }
    .btn:disabled { opacity: 0.5; cursor: default; }
    .error { color: var(--zb-color-error); font-size: var(--zb-font-size-sm); margin: 0; }
    .state { color: var(--zb-secondary-text); margin: 0; }
    .kv-table { width: 100%; border-collapse: collapse; }
    .kv-table th, .kv-table td {
      text-align: left;
      padding: var(--zb-spacing-xs) var(--zb-spacing-sm);
      border-bottom: 1px solid var(--zb-divider);
    }
    .kv-table th { color: var(--zb-secondary-text); font-weight: 500; font-size: var(--zb-font-size-sm); }
  `,
})
export class Pkv implements OnInit {
  private readonly session = inject(SessionService);

  protected readonly pairs = signal<PkvPair[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Table rows with the value pre-serialized — the template renders these directly (no per-render call). */
  protected readonly pairRows = computed(() =>
    this.pairs().map((p) => ({ key: p.key, value: JSON.stringify(p.value) })),
  );

  private readonly model = signal<PkvForm>({ key: '', value: DEFAULT_VALUE });
  protected readonly pkvForm = form(this.model, (path) => {
    required(path.key);
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const api = this.session.api();
    if (!api) return;
    this.loading.set(true);
    api.danaClient
      .getPkvApi()
      .listPrincipalKeyValues(undefined, undefined, 50)
      .then((results) => this.pairs.set(results.items))
      .catch((err) => {
        console.error('Failed to list key-value pairs', err);
        this.error.set('Could not load key-value pairs.');
      })
      .finally(() => this.loading.set(false));
  }

  protected async submit(): Promise<void> {
    if (!this.pkvForm().valid()) return;
    const api = this.session.api();
    if (!api) return;
    this.error.set(null);

    const { key, value } = this.model();
    const parsed = parsePkvValue(value);
    if (!parsed) {
      this.error.set('Value must be valid JSON (an object).');
      return;
    }

    this.saving.set(true);
    try {
      await api.danaClient.getPkvApi().upsertPrincipalKeyValue({ key: key.trim(), value: parsed });
      this.model.set({ key: '', value: DEFAULT_VALUE });
      this.load();
    } catch (err) {
      console.error('Failed to save key-value pair', err);
      this.error.set('Could not save the key-value pair.');
    } finally {
      this.saving.set(false);
    }
  }
}

/**
 * Parse the value textarea into a `Pkv.value` (a JSON object map), or `null` if it isn't valid JSON
 * or isn't a plain object (arrays and primitives are rejected). Pure, so the validation is testable.
 */
export function parsePkvValue(text: string): { [k: string]: object } | null {
  try {
    const candidate = JSON.parse(text);
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) return null;
    return candidate;
  } catch {
    return null;
  }
}
