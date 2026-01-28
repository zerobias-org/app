import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi, ZbEnvironment } from "@zerobias-com/zb-client-lib-js";

class ZerobiasAppService {
  static #instance: ZerobiasAppService;

  public environment: ZbEnvironment = {
    production: process.env.NODE_ENV === 'production',
    isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true',
    socketUrlPath: '/session',
    localPortalOrigin: process.env.NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN
  };

  public zerobiasOrgId = new ZerobiasClientOrgId();
  public zerobiasClientApi = new ZerobiasClientApi(this.zerobiasOrgId, this.environment);
  public zerobiasClientApp = new ZerobiasClientApp(this.zerobiasClientApi, this.zerobiasOrgId, this.environment);

  public enable = false;

  public async initializeAppFactory() {
    await this.zerobiasClientApp.init(
      (req) => {
        if (this.environment.isLocalDev && process.env.NEXT_PUBLIC_API_KEY) {
          req.headers["Authorization"] = `APIKey ${process.env.NEXT_PUBLIC_API_KEY}`;
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
