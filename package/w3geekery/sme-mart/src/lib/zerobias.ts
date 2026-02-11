import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi, ZbEnvironment } from "@zerobias-com/zerobias-client";

class ZerobiasAppService {
  static #instance: ZerobiasAppService;

  public environment: ZbEnvironment = {
    production: process.env.NODE_ENV === 'production',
    isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true',
    socketUrlPath: process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true' ? '' : '/session',
    localPortalOrigin: process.env.NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN
  };

  public zerobiasOrgId = new ZerobiasClientOrgId();
  public zerobiasClientApi = new ZerobiasClientApi(this.zerobiasOrgId, this.environment);
  public zerobiasClientApp = new ZerobiasClientApp(this.zerobiasClientApi, this.zerobiasOrgId, this.environment);

  public enable = false;

  public async initializeAppFactory() {
    // Auth headers (Authorization, dana-org-id) are injected server-side
    // by src/middleware.ts using the ZEROBIAS_API_KEY env var, so the API key
    // never reaches the browser bundle. No client-side interceptor needed.
    await this.zerobiasClientApp.init().then(() => {
      this.enable = true;
      console.log("ZerobiasAppSvc initialized");
    });
  }

  public static async getInstance(): Promise<ZerobiasAppService> {
    if (!ZerobiasAppService.#instance) {
      console.log("creating new ZerobiasAppService instance");
      ZerobiasAppService.#instance = new ZerobiasAppService();
      await ZerobiasAppService.#instance.initializeAppFactory();
    }
    return ZerobiasAppService.#instance;
  }
}

export default ZerobiasAppService;
