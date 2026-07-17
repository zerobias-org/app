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

  private constructor() {
    const environment: ZbEnvironment = {
      production: env.production,
      // The live session WebSocket. In uat/qa/prod the platform serves it (wss://<host>/api/session)
      // and the client uses it for session/org push events. In LOCAL DEV there is no ws server at
      // localhost:3000/session, so the client would fail to connect and reconnect-spam the console
      // forever. `ClientApp.init` only opens the socket when `socketUrlPath` is truthy
      // (`!!this.environment.socketUrlPath`), so leaving it empty in local dev disables the socket
      // (and the reconnect loop) entirely. Nothing else reads it — the URL is only built inside the
      // connect path we're skipping.
      socketUrlPath: env.isLocalDev ? "" : "/session",
      isLocalDev: env.isLocalDev,
      localPortalOrigin: env.localPortalOrigin,
    };

    const orgId = new ZerobiasClientOrgId();
    const sessionId = new ZerobiasClientSessionId();
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
