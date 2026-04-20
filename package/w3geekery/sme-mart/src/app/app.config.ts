import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideZbDefaults } from '@zerobias-org/ngx-library';
import {
  ZerobiasClientApiService,
  ZerobiasClientAppService,
  ZerobiasClientOrgIdService,
} from '@zerobias-com/zerobias-angular-client';
import {
  ZerobiasClientApi,
  ZerobiasClientApp,
  ZerobiasClientOrgId,
} from '@zerobias-com/zerobias-client';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AppInitService } from './core/app-init.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),

    // ngx-library Material defaults (form-field, paginator, ripple, tabs)
    ...provideZbDefaults(),

    // ZeroBias SDK DI — environment config + abstract class implementations
    { provide: 'environment', useValue: environment },
    { provide: ZerobiasClientOrgId, useClass: ZerobiasClientOrgIdService },
    { provide: ZerobiasClientApi, useClass: ZerobiasClientApiService },
    { provide: ZerobiasClientApp, useClass: ZerobiasClientAppService },

    // Auth bootstrap — blocks Angular bootstrap until init() resolves
    provideAppInitializer(() => inject(AppInitService).init()),

    // ngx-translate — required by ngx-library table components
    ...provideTranslateHttpLoader(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: { provide: TranslateHttpLoader, useClass: TranslateHttpLoader },
      }),
    ),

    // ngx-library static image pipe
    { provide: 'nfEnvironment', useValue: environment },
  ],
};
