import {
  ZerobiasClientApi,
  ZerobiasClientApp,
  ZerobiasClientOrgId,
  ZerobiasClientSessionId,
  ZbEnvironment,
} from "@zerobias-com/zerobias-client";
import { env } from "./env";

/**
 * Builds and initializes the ZeroBias v2 client, exactly once, in the browser.
 *
 * The client (`ZerobiasClientApp`) owns authentication, the WebSocket session,
 * axios interceptors, and base-URL resolution. Every SDK call in the app goes
 * through `service.api.<serviceClient>` — never hand-rolled fetch.
 *
 * Bootstrap order (all four objects are required by the 2.x constructors):
 *   OrgId + SessionId  ->  ClientApi  ->  ClientApp  ->  app.init()
 */
export class ZerobiasAppService {
  readonly api: ZerobiasClientApi;
  readonly app: ZerobiasClientApp;
  private readonly sessionId: ZerobiasClientSessionId;

  private constructor() {
    const environment: ZbEnvironment = {
      production: env.production,
      socketUrlPath: "/session",
      isLocalDev: env.isLocalDev,
      localPortalOrigin: env.localPortalOrigin,
    };

    const orgId = new ZerobiasClientOrgId();
    const sessionId = new ZerobiasClientSessionId();
    this.sessionId = sessionId;
    this.api = new ZerobiasClientApi(orgId, sessionId, environment);
    this.app = new ZerobiasClientApp(this.api, orgId, sessionId, environment);
  }

  private async init(): Promise<void> {
    // The one place a custom request interceptor is wired in. In local dev only,
    // it attaches an API key so requests authenticate without a platform cookie.
    // In uat/qa/prod this is a no-op: the browser sends the platform session cookie.
    await this.app.init((req) => {
      if (env.isLocalDev && env.apiKey) {
        req.headers["Authorization"] = `APIKey ${env.apiKey}`;
      }
      return req;
    });
    // If there is no valid session (and we're not in local dev), init() has
    // already triggered the client's redirect to the platform login by now.

    // Standalone (cookie-session) mode: the SDK writes sessionStorage['dana-session-id']
    // ONLY from the portal-iframe postMessage, so a user who arrived via the platform
    // login redirect holds a cookie but no header-transportable credential — and
    // customer-backend calls (src/lib/backend.ts) would fall back to the backend's
    // unattributed service identity. Hydrate it from Dana: GET /me/session returns the
    // current session id, authenticated by the same-origin cookie.
    if (!env.isLocalDev && !this.sessionId.getCurrentSessionId()) {
      try {
        const sid = await this.api.danaClient.getMeApi().ensureSession();
        if (sid) this.sessionId.setCurrentSessionId(sid);
      } catch {
        // Backend calls stay unattributed; ZB SDK calls are unaffected (cookie).
      }
    }
  }

  static async create(): Promise<ZerobiasAppService> {
    const service = new ZerobiasAppService();
    await service.init();
    return service;
  }
}

// Module-level singleton promise: guarantees a single init() even under React
// StrictMode's double-effect invocation in dev.
let servicePromise: Promise<ZerobiasAppService> | null = null;

export function getZerobiasAppService(): Promise<ZerobiasAppService> {
  if (typeof window === "undefined") {
    throw new Error(
      "ZerobiasAppService is browser-only — call it from a client component effect, never during SSR/prerender.",
    );
  }
  if (!servicePromise) {
    servicePromise = ZerobiasAppService.create();
  }
  return servicePromise;
}
