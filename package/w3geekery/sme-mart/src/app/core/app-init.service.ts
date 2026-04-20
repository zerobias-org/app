import { inject, Injectable } from '@angular/core';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { TranslateService } from '@ngx-translate/core';
import { SmeMartDbService } from './services/sme-mart-db.service';

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

  async init(): Promise<boolean> {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    const authResult = await this.app.init(
      (req: any) => req,
      (res: any) => res,
      (reqErr: any) => reqErr,
      (resErr: any) => resErr,
    );

    // Connect to Neon via Generic SQL Hub Module (non-blocking — don't fail app init)
    this.db.connect().then((result) => {
      if (result.success) {
        console.log('[SmeMartDb] Connected to Generic SQL Hub Module');
      } else {
        console.warn('[SmeMartDb] Connection failed:', result.error);
      }
    }).catch((err) => {
      console.warn('[SmeMartDb] Connection error:', err);
    });

    return authResult;
  }
}
