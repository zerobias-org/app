import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatIconRegistry } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideZbDefaults } from '@zerobias-org/ngx-library';
import {
  CLIPBOARD_OPTIONS,
  MARKED_OPTIONS,
  provideMarkdown,
  SANITIZE,
} from 'ngx-markdown';

import { routes } from './app.routes';
import { ZerobiasAppService } from './core/zerobias-app.service';
import { SessionService } from './core/session.service';
import { ClipboardButtonComponent } from './shared/markdown-viewer/clipboard-button';
import {
  markdownSanitizerFactory,
  markedOptionsFactory,
} from './shared/markdown-viewer/markdown-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // ngx-library components (e.g. zb-simple-panel) use the Angular animations API — `@inOutAnimation`
    // / `@.disabled` synthetic bindings — so provideAnimations() is REQUIRED (per docs/using-ngx-library.md).
    // Without it Angular throws NG05105 at runtime. HttpClient backs the library's data components;
    // provideZbDefaults() supplies its Material form-field/paginator/ripple defaults.
    provideAnimationsAsync(),
    provideHttpClient(),
    ...provideZbDefaults(),
    // ngx-library components (e.g. zb-remote-table) use the `translate` pipe internally, so they
    // need TranslateService/TranslateStore in the injector. Plain TranslateModule does NOT provide
    // them — only forRoot() does — so its absence throws NG0201 (No provider for _TranslateService)
    // the moment such a component renders. We ship no i18n dictionary (the demo's column labels are
    // already human-readable, and a missing key resolves to the literal string), so no loader is
    // needed here; forRoot() with no config wires the service/store and a no-op loader.
    importProvidersFrom(TranslateModule.forRoot()),
    // Markdown rendering for task descriptions + comments (used by shared/markdown-viewer).
    // Config vendored from zb-ui-lib's ComponentsModule: marked (GFM + target=_blank links),
    // DOMPurify sanitize (allowing GFM task-list checkboxes), and a copy button on code blocks.
    provideMarkdown({
      markedOptions: { provide: MARKED_OPTIONS, useFactory: markedOptionsFactory },
      sanitize: { provide: SANITIZE, useFactory: markdownSanitizerFactory },
      clipboardOptions: {
        provide: CLIPBOARD_OPTIONS,
        useValue: { buttonComponent: ClipboardButtonComponent },
      },
    }),
    // Bootstrap the ZeroBias client before the app renders: init() establishes/checks the session
    // (redirecting to SSO in deployed envs if there's none), then the session streams are wired.
    provideAppInitializer(async () => {
      // Synchronous UI wiring first (before the async session bootstrap can suspend):
      // 1) Render every <mat-icon> with Material Symbols Outlined — the same icon vocabulary
      //    example-nextjs-v2 uses (material-symbols/outlined.css). index.html loads that font;
      //    without this the icons fall back to classic (filled) Material Icons and the glyphs
      //    (e.g. inventory_2) look different from the Next.js app.
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');

      // ngx-library's own components render translation KEYS (e.g. `'ZbRemoteTable.Search' | translate`)
      // but the package ships NO i18n dictionary — the real platform apps load one from their own
      // ./assets/i18n/en.json (the 284KB zb-ui-lib bundle). We only use zb-remote-table here, so we
      // register just its namespace inline (merge=true so later demos can extend it). Verbatim from
      // zb-ui-lib/src/lib/assets/i18n/en.json → "ZbRemoteTable". Without this the search box, filter
      // controls, sort menu, and empty state show raw keys instead of English.
      const translate = inject(TranslateService);
      translate.setTranslation(
        'en',
        {
          ZbRemoteTable: {
            All: 'All',
            Apply: 'Apply',
            Cancel: 'Cancel',
            Contains: 'Contains',
            FilterBy: 'Filter by',
            Filters: 'Filters',
            NoDataFound: 'No Items Found',
            Search: 'Search',
            SearchByKey: 'Search: {{label}}',
            SearchEllipsis: 'Search...',
            SeeMore: 'See more',
            SeeLess: 'See less',
            SortBy: 'Sort by',
          },
        },
        true,
      );
      translate.setDefaultLang('en');
      translate.use('en');

      const zb = inject(ZerobiasAppService);
      const session = inject(SessionService);
      await zb.init();
      session.connect();
    }),
  ],
};
