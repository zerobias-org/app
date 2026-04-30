import { inject, Injectable } from '@angular/core';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { TranslateService } from '@ngx-translate/core';
import { SmeMartDbService } from './services/sme-mart-db.service';
import { DemoModeService } from './services/demo-mode.service';
import { environment } from '../../environments/environment';

/**
 * Handles app initialization: i18n setup + ZeroBias auth bootstrap + DB connection.
 *
 * Called via `provideAppInitializer` in app.config.ts — Angular blocks
 * bootstrap until `init()` resolves, so by the time components render,
 * the user is authenticated and an org is selected.
 */
@Injectable({ providedIn: 'root' })
export class AppInitService {
  private readonly app = inject(ZerobiasClientApp);
  private readonly translate = inject(TranslateService);
  private readonly db = inject(SmeMartDbService);
  private readonly demoMode = inject(DemoModeService);

  async init(): Promise<boolean> {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    // Check session status and redirect unauthenticated users to branded login.
    // Probe whoAmI to detect 401; if unauthenticated, redirect to branded login URL
    // with the current URL encoded as the redirect query parameter.
    try {
      const probe = await fetch(`${environment.apiHostname}/api/dana/me`, { credentials: 'include' });
      if (probe.status === 401) {
        this.redirectToBrandedLogin();
      }
    } catch (err) {
      // Network error or other probe failure — log but don't block (SDK init will handle auth)
      console.warn('[AppInit] Session probe failed:', err);
    }

    const authResult = await this.app.init(
      (req: any) => req,
      (res: any) => res,
      (reqErr: any) => reqErr,
      (resErr: any) => resErr,
    );

    // Connect to Neon via Generic SQL Hub Module (non-blocking — don't fail app init)
    this.db.connect().then(async (result) => {
      if (result.success) {
        console.log('[SmeMartDb] Connected to Generic SQL Hub Module');
        await this.demoMode.init(this.db);
        console.log(`[DemoMode] ${this.demoMode.enabled() ? 'ON' : 'OFF'} (canToggle: ${this.demoMode.canToggle()})`);
      } else {
        console.warn('[SmeMartDb] Connection failed:', result.error);
      }
    }).catch((err) => {
      console.warn('[SmeMartDb] Connection error:', err);
    });

    return authResult;
  }

  /**
   * Redirect unauthenticated user to branded login URL with return URL encoded.
   * Uses brandedLoginSubdomain if available; falls back to defaultLoginUrl.
   * Constructs: `<baseUrl>/login?redirect=<currentUrl>`
   * Never returns (redirects at location.href level).
   */
  private redirectToBrandedLogin(): never {
    const subdomain = environment.brandedLoginSubdomain ?? null;
    const fallback = environment.defaultLoginUrl;
    const baseUrl = subdomain ?? fallback;
    const redirect = encodeURIComponent(location.href);
    const target = `${baseUrl}/login?redirect=${redirect}`;
    location.href = target;
    // Resolve with a never-settling promise so Angular doesn't finish bootstrap before the redirect.
    return new Promise<never>(() => {}) as never;
  }
}
