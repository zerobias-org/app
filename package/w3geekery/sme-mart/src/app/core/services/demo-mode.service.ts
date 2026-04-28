import { Injectable, inject, signal, computed } from '@angular/core';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { environment } from '../../../environments/environment';

const DEMO_MODE_SETTING_KEY = 'demo_mode_enabled';
const AUTHORIZED_EMAILS = ['clark@w3geekery.com'];
const AUTHORIZED_DOMAINS = ['zerobias.com'];

@Injectable({ providedIn: 'root' })
export class DemoModeService {
  private readonly app = inject(ZerobiasClientApp);

  private readonly _enabled = signal(false);
  private readonly _canToggle = signal(false);
  private readonly _userEmail = signal<string | null>(null);
  private _initialized = false;

  readonly enabled = this._enabled.asReadonly();
  readonly canToggle = this._canToggle.asReadonly();
  readonly showDemoData = computed(() => this._enabled());

  async init(db: { searchRows: Function; updateRow: Function; createRow: Function }): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const [settingResult, userEmail] = await Promise.all([
      this.loadSetting(db),
      this.resolveUserEmail(),
    ]);

    this._enabled.set(settingResult);
    this._userEmail.set(userEmail);
    this._canToggle.set(this.isAuthorized(userEmail));
  }

  async toggle(db: { searchRows: Function; updateRow: Function; createRow: Function }): Promise<void> {
    if (!this._canToggle()) return;
    const newValue = !this._enabled();
    await this.saveSetting(db, newValue);
    this._enabled.set(newValue);
  }

  private async loadSetting(db: { searchRows: Function }): Promise<boolean> {
    try {
      const result = await db.searchRows('app_settings', `(key=${DEMO_MODE_SETTING_KEY})`, { pageSize: 1 });
      const row = result.items?.[0];
      if (!row) return false;
      return row.value === 'true' || row.value === true;
    } catch {
      return false;
    }
  }

  private async saveSetting(db: { searchRows: Function; updateRow: Function; createRow: Function }, value: boolean): Promise<void> {
    const result = await db.searchRows('app_settings', `(key=${DEMO_MODE_SETTING_KEY})`, { pageSize: 1 });
    const existing = result.items?.[0];
    if (existing) {
      await db.updateRow('app_settings', existing.id, {
        value: String(value),
        updated_by: this._userEmail() || 'unknown',
      });
    } else {
      await db.createRow('app_settings', {
        key: DEMO_MODE_SETTING_KEY,
        value: String(value),
        updated_by: this._userEmail() || 'unknown',
      });
    }
  }

  private async resolveUserEmail(): Promise<string | null> {
    try {
      const user = await this.app.whoAmI() as any;
      return user?.email || user?.username || null;
    } catch {
      return null;
    }
  }

  private isAuthorized(email: string | null): boolean {
    if (environment.isLocalDev) return true;
    if (!email) return false;
    if (AUTHORIZED_EMAILS.includes(email.toLowerCase())) return true;
    const domain = email.split('@')[1]?.toLowerCase();
    return AUTHORIZED_DOMAINS.includes(domain);
  }
}
