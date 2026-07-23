import { Injectable } from '@angular/core';
import {
  ZbEnvironment,
  ZerobiasClientApi,
  ZerobiasClientApp,
  ZerobiasClientOrgId,
  ZerobiasClientSessionId,
} from '@zerobias-com/zerobias-client';
import { environment } from '../../environments/environment';

/**
 * Builds and initializes the ZeroBias v2 client once, in the browser — the Angular counterpart of
 * the React app's `src/lib/zerobias-app-service.ts`. `ZerobiasClientApp` owns authentication, the
 * session, axios interceptors, and base-URL resolution; every SDK call in the app goes through
 * `this.api.<serviceClient>` — never hand-rolled fetch.
 *
 * Bootstrap order (all four objects are required by the 2.x constructors):
 *   OrgId + SessionId  ->  ClientApi  ->  ClientApp  ->  app.init()
 *
 * `init()` is idempotent (a shared promise), so the APP_INITIALIZER and any later caller share one
 * initialization even under repeated injection.
 */
@Injectable({ providedIn: 'root' })
export class ZerobiasAppService {
  readonly api: ZerobiasClientApi;
  readonly app: ZerobiasClientApp;
  private initialized?: Promise<void>;

  constructor() {
    const env: ZbEnvironment = {
      production: environment.production,
      // The live session WebSocket. In uat/qa/prod the platform serves it; in LOCAL DEV there is
      // no ws server, so the client would reconnect-spam the console forever. Empty in local dev
      // disables the socket entirely (same fix as the React app). See docs.
      socketUrlPath: environment.isLocalDev ? '' : '/session',
      isLocalDev: environment.isLocalDev,
      localPortalOrigin: environment.localPortalOrigin,
    };

    const orgId = new ZerobiasClientOrgId();
    const sessionId = new ZerobiasClientSessionId();
    this.api = new ZerobiasClientApi(orgId, sessionId, env);
    this.app = new ZerobiasClientApp(this.api, orgId, sessionId, env);
  }

  /**
   * Initialize the client and establish/check the session. In deployed envs a missing session
   * makes `init()` redirect to platform SSO rather than reject; a rejection here is a genuine
   * bootstrap error. Local dev authenticates via the `proxy.conf.js` API-key header, so the
   * request interceptor is a passthrough.
   */
  init(): Promise<void> {
    if (!this.initialized) {
      this.initialized = this.app.init((req) => req).then(() => undefined);
    }
    return this.initialized;
  }
}
