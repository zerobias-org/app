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
    await this.zerobiasClientApp.init(
      (req) => {
        if (process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true') {
          req.headers = req.headers || {};
          if (process.env.NEXT_PUBLIC_API_KEY) {
            req.headers['Authorization'] = `APIKey ${process.env.NEXT_PUBLIC_API_KEY}`;
          }
          if (!req.headers['dana-org-id'] && process.env.NEXT_PUBLIC_DEFAULT_ORG_ID) {
            req.headers['dana-org-id'] = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
          }
        }
        return req;
      }
    ).then(() => {
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
