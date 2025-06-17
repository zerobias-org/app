
import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi } from "@auditmation/zb-client-lib-js";
// environnment vars read from .env.development and .env.production

class ZerobiasAppService {
  public environment:any = {
    localhostOnlyApiKey: process.env.NEXT_PUBLIC_API_KEY,
    isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV !== undefined ? process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true' : false,
    production: process.env.NEXT_PUBLIC_PRODUCTION !== undefined ? process.env.NEXT_PUBLIC_PRODUCTION === 'true' : false,
    socketUrlPath: '/session',
    localPortalOrigin: process.env.NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN ? process.env.NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN : '',
    apiHostname: process.env.NEXT_PUBLIC_API_HOSTNAME
  };


  static #instance: ZerobiasAppService;
  public zerobiasOrgId = new ZerobiasClientOrgId();
  public zerobiasClientApi = new ZerobiasClientApi(this.zerobiasOrgId, this.environment);
  public zerobiasClientApp = new ZerobiasClientApp(this.zerobiasClientApi, this.zerobiasOrgId, this.environment);

  public enable = false;

  constructor() {
  }

  public async initializeAppFactory() {
    await this.zerobiasClientApp.init(
      (req) => {
        if (this.environment.isLocalDev && this.environment.localhostOnlyApiKey) {
          req.headers["Authorization"] = `APIKey ${this.environment.localhostOnlyApiKey}`;
        }
        return req;
      }
    ).then(() => {
      this.enable = true;
      console.log("ZerobiasAppSvc initialized");
    });
  }

  public static async getInstance(): Promise<ZerobiasAppService>  {
    if (!ZerobiasAppService.#instance) {
      console.log("create new isntance");
      ZerobiasAppService.#instance = new ZerobiasAppService();

      await ZerobiasAppService.#instance.initializeAppFactory();
    } 

    return ZerobiasAppService.#instance;
  }

}

export default ZerobiasAppService;
