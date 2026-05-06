import { inject, Injectable } from '@angular/core';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { TranslateService } from '@ngx-translate/core';
import { SmeMartDbService } from './services/sme-mart-db.service';
import { DemoModeService } from './services/demo-mode.service';

/**
 * Handles app initialization: i18n setup + ZeroBias auth bootstrap + DB connection.
 *
 * Called via `provideAppInitializer` in app.config.ts. The Zerobias SDK's
 * `ZerobiasClientApp.whoAmI()` (used internally by `init`) handles the
 * unauthenticated branch on its own — `redirectLogin()` sets
 * `globalThis.location.href` to the same-origin login URL, which on a
 * branded fork (e.g. `w3geekery.uat.zerobias.com`) lands the user at the
 * branded login page automatically. We do not duplicate that path here.
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

    const authResult = await this.app.init(
      (req: unknown) => req,
      (res: unknown) => res,
      (reqErr: unknown) => reqErr,
      (resErr: unknown) => resErr,
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
