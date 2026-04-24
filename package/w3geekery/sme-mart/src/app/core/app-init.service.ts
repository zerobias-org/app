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

    // Stack-mode (localhost unified-origin) workaround for platform bug:
    // Dana's /api/dana/me/session/login?next=... responds 307 Location: /login/ with `next` stripped.
    // The client SDK's redirectLogin() passes `next` correctly; Dana discards it.
    // We pre-empt by probing whoAmI ourselves and redirecting straight to the static login
    // page with `next` intact (login.js honors ?next= via URLSearchParams).
    // Remove once Dana preserves `next` through its 307.
    if (!environment.isLocalDev && location.hostname === 'localhost') {
      const probe = await fetch(`${environment.apiHostname}/api/dana/me`, { credentials: 'include' });
      if (probe.status === 401) {
        const next = encodeURIComponent(location.href);
        location.href = `/login/en_us/login.html?next=${next}&cookieDomain=localhost`;
        // Resolve with a never-settling promise so Angular doesn't finish bootstrap before the redirect.
        return new Promise<boolean>(() => {});
      }
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
}
