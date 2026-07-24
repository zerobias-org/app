import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { form, FormField, min, required } from '@angular/forms/signals';
import { ApiKeyWithData, CreateApiKeyBody } from '@zerobias-com/dana-sdk';
import { DateTime } from '@zerobias-org/types-core-js';
import { ZbDialogComponent } from '@zerobias-org/ngx-library';

import { SessionService } from '../../core/session.service';

type DurationUnit = 'hours' | 'days' | 'years';
const DURATION_UNITS: readonly DurationUnit[] = ['hours', 'days', 'years'];

interface ApiKeyForm {
  name: string;
  duration: number;
  unit: DurationUnit;
}

/** Default the key name to the user's name with spaces collapsed to underscores. */
function defaultName(userName?: string): string {
  return userName ? userName.trim().replace(/\s+/g, '_') : '';
}

/** A future expiry `duration` `unit` from now. */
function expirationFrom(duration: number, unit: DurationUnit): Date {
  const d = new Date();
  if (unit === 'hours') d.setHours(d.getHours() + duration);
  else if (unit === 'days') d.setDate(d.getDate() + duration);
  else d.setFullYear(d.getFullYear() + duration);
  return d;
}

/**
 * Create-API-key dialog. Opened via `MatDialog.open(...)` from the user menu; the `zb-dialog`
 * component supplies the ZeroBias dialog chrome (it renders `mat-dialog-title/content/actions`),
 * so it must live inside a Material dialog container — which `MatDialog` provides.
 *
 *   `danaClient.getMeApi().createApiKey({ name, expiration } as CreateApiKeyBody)`
 *
 * The returned `data` is the secret and is shown once (also copied to the clipboard immediately),
 * alongside the org id — both a developer needs to authenticate an SDK/CLI call. The form uses
 * Angular 21 Signal Forms (`form()` + `[field]`) per this app's conventions.
 */
@Component({
  selector: 'app-create-api-key-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZbDialogComponent, FormField],
  template: `
    <zb-dialog
      [title]="created() ? 'API key created' : 'Create new API key'"
      [subTitle]="
        created() ? 'Copy the key now — it is shown only once.' : null
      "
      [actionLabel]="created() ? 'Done' : 'Create'"
      [actionProcessing]="creating()"
      [actionDisabled]="!created() && !keyForm().valid()"
      [showCancel]="!created()"
      [showCloseX]="true"
      (action)="onAction()"
      (cancel)="close()"
    >
      @if (created(); as key) {
        <div class="result">
          <div class="field">
            <label for="created-org">Organization ID</label>
            <div class="copy-row">
              <input id="created-org" [value]="orgId()" readonly />
              <button
                type="button"
                class="copy-btn"
                (click)="copy(orgId(), 'org')"
                aria-label="Copy organization ID"
              >
                {{ copied() === 'org' ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>
          <div class="field">
            <label for="created-key">API key</label>
            <div class="copy-row">
              <input id="created-key" [value]="key.data" readonly />
              <button
                type="button"
                class="copy-btn"
                (click)="copy(key.data, 'key')"
                aria-label="Copy API key"
              >
                {{ copied() === 'key' ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      } @else {
        <form class="key-form" (submit)="$event.preventDefault(); onAction()">
          <div class="field">
            <label for="key-name">API key name</label>
            <input
              id="key-name"
              [formField]="keyForm.name"
              placeholder="my-integration"
              autocomplete="off"
            />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="key-duration">Expires in</label>
              <input id="key-duration" type="number" [formField]="keyForm.duration" />
            </div>
            <div class="field">
              <label for="key-unit">Unit</label>
              <select id="key-unit" [formField]="keyForm.unit">
                @for (u of units; track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
            </div>
          </div>
        </form>
      }

      @if (error(); as e) {
        <span error class="error" role="alert">{{ e }}</span>
      }
    </zb-dialog>
  `,
  styles: `
    .field {
      display: flex;
      flex-direction: column;
      gap: var(--zb-spacing-xs);
      margin-bottom: var(--zb-spacing-md);
    }
    .field-row {
      display: flex;
      gap: var(--zb-spacing-md);
    }
    .field-row .field {
      flex: 1;
    }
    label {
      color: var(--zb-secondary-text);
      font-size: var(--zb-font-size-sm);
    }
    input,
    select {
      height: 40px;
      padding: 0 var(--zb-spacing-sm);
      border: 1px solid var(--zb-divider);
      border-radius: 6px;
      background: var(--zb-background);
      color: var(--zb-text);
      font-size: var(--zb-font-size-md);
    }
    input:focus,
    select:focus {
      outline: 2px solid var(--zb-primary);
      outline-offset: -1px;
    }
    .copy-row {
      display: flex;
      gap: var(--zb-spacing-sm);
    }
    .copy-row input {
      flex: 1;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .copy-btn {
      padding: 0 var(--zb-spacing-md);
      border: 1px solid var(--zb-primary);
      border-radius: 6px;
      background: transparent;
      color: var(--zb-primary);
      cursor: pointer;
      white-space: nowrap;
    }
    .error {
      color: var(--zb-color-error);
      font-size: var(--zb-font-size-sm);
    }
  `,
})
export class CreateApiKeyDialogComponent {
  private readonly session = inject(SessionService);
  private readonly dialogRef = inject<MatDialogRef<CreateApiKeyDialogComponent>>(MatDialogRef);

  protected readonly units = DURATION_UNITS;

  private readonly model = signal<ApiKeyForm>({
    name: defaultName(this.session.user()?.name),
    duration: 30,
    unit: 'days',
  });
  protected readonly keyForm = form(this.model, (path) => {
    required(path.name);
    min(path.duration, 1);
  });

  protected readonly creating = signal(false);
  protected readonly created = signal<ApiKeyWithData | undefined>(undefined);
  protected readonly error = signal<string | null>(null);
  protected readonly copied = signal<'org' | 'key' | null>(null);

  protected readonly orgId = computed(() => this.session.org()?.id.toString() ?? '');

  /** The dialog's single action button: submit while editing, close once created. */
  async onAction(): Promise<void> {
    if (this.created()) {
      this.close();
      return;
    }
    if (!this.keyForm().valid()) return;

    const api = this.session.api();
    if (!api) {
      this.error.set('Session is not ready yet.');
      return;
    }

    const { name, duration, unit } = this.model();
    this.error.set(null);
    this.creating.set(true);
    try {
      const body: CreateApiKeyBody = {
        name: name.trim(),
        expiration: new DateTime(expirationFrom(duration, unit)),
      };
      const key = await api.danaClient.getMeApi().createApiKey(body);
      this.created.set(key);
      void this.copy(key.data, 'key');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to create the API key.');
    } finally {
      this.creating.set(false);
    }
  }

  async copy(text: string, which: 'org' | 'key'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(which);
      setTimeout(() => this.copied.update((c) => (c === which ? null : c)), 1500);
    } catch {
      // Clipboard can reject (permissions / insecure context); the value is still visible to copy
      // manually, so there's nothing actionable to surface here.
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
