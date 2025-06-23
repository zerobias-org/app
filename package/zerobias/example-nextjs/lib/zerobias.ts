
import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi } from "@auditmation/zb-client-lib-js";

class ZerobiasAppService {
  // environnment vars read from .env.development and .env.production
  // or you can set any of these in the environment i.e. when you run a build you can set these at the start of the build
  // you can then refer to any of these variables by `import { environment } from 'path/to/the/ZerobiasAppService'
  public environment:any = {
    isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV !== undefined ? (process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true' ? true : false) : false,
    production: process.env.NEXT_PUBLIC_PRODUCTION !== undefined ? (process.env.NEXT_PUBLIC_PRODUCTION === 'true' ? true : false) : false,
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
      // zerobiasClientApp.init allows setting custom axios interceptors.  
      // This particular interceptor function below will allow local dev 
      // to add an Authorization header to api requests, to get data from the Zerobias platform.
      // Set this variable in your local dev environment: NEXT_PUBLIC_API_KEY='your api key to our platform'
      // once set, this api key will be accessible via process.env.NEXT_PUBLIC_API_KEY
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

  public static async getInstance(): Promise<ZerobiasAppService>  {
    if (!ZerobiasAppService.#instance) {
      console.log("creating new ZerobiasAppService instance");
      ZerobiasAppService.#instance = new ZerobiasAppService();
      
      await ZerobiasAppService.#instance.initializeAppFactory();
    } 
    return ZerobiasAppService.#instance;
  }
}

export default ZerobiasAppService;
