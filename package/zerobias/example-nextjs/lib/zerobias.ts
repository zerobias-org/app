
import { ConnectionListView, ScopeListView } from '@auditmation/module-auditmation-auditmation-hub';
import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi, ZbEnvironment } from "@auditmation/zb-client-lib-js";
import { ExecuteRawGraphqlQuery } from "@auditmation/module-auditmation-auditmation-graphql";
import { BoundaryExtended } from "@auditmation/module-auditmation-auditmation-platform";
import { PagedResults } from "@auditmation/types-core-js";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import { ApiKey, InlineObject, Org } from '@auditmation/module-auditmation-auditmation-dana';

// environnment vars read from .env.development and .env.production
/* 
  apiHostname: process.env.NEXT_PUBLIC_API_HOSTNAME,
  localPortalOrigin: process.env.LOCAL_PORTAL_ORIGIN,
  zerobiasProdApiKey: process.env.ZEROBIAS_PROD_API_KEY
  apiKey: process.env.API_KEY,
*/

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

  public selectedBoundary: BoundaryExtended | null = null;
  public boundaries: BoundaryExtended[] = [];
  public enable = false;
  public showApiKeyForm = false;
  public showSharedSessionForm = false;
  public githubProduct:ProductExtended|null = null;
  public connections:ConnectionListView[]|null = null;
  public selectedConnection:ConnectionListView|null = null;
  public scopes:ScopeListView[]|null = null;
  public formGroup:FormData|null = null;
  public orgs:Org[]|null = null;

  constructor() {
  }

  public async initializeAppFactory() {
    await this.zerobiasClientApp.init(
      (req) => {
        if (this.environment.localhostOnlyApiKey) {
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

  public async createApiKey(inlineObject?: InlineObject): Promise<ApiKey & object | void> {
    if (!inlineObject) { 
      Promise.reject() 
    }
    try{
      return this.zerobiasClientApi.danaClient.getMeApi().createApiKey(inlineObject);
    } catch(error) {
      console.warn(error);
      // this.overlay.message = `The generation of the new API Key failed. Please contact Support.`;
    }
  }

  public getFinding = async () => {
    this.getBoundariesList(); //  list boundaries, choose boundary first

    const executeRawGraphqlQuery: ExecuteRawGraphqlQuery = new ExecuteRawGraphqlQuery(`query { 
            Finding 
            (
              state: ".eq.ACTIVE"
            )
            { 
                id 
            name 
            state 
            metadata { 
                objectId 
                versionId 
                operation 
            } 
            } 
        }`);

    const resultQuery = await this.zerobiasClientApi.graphqlClient
      .getBoundaryApi()
      .boundaryExecuteRawQuery(
        //new UUID("3f5a05d5-8a81-4f72-a33c-dc5be3949024"), // <--- listBoundaries(), select a boundary
        this.zerobiasClientApi.toUUID(this.selectedBoundary?.id),
        executeRawGraphqlQuery
      );
    console.log(resultQuery);
  };

  private getBoundariesList() {
    // auditmationPlatform.getBoundaryApi().listBoundaries(), select a boundary
    /* 
      BoundaryApi.listBoundaries(
        pageNumber?: number, 
        pageSize?: number, 
        name?: string,                <--- maybe filter by boundary name?
        status?: BoundaryStatusEnumDef, 
        type?: BoundaryTypeEnumDef, 
        sort?: SortObject
      ): Promise<PagedResults<BoundaryExtended>>
    */
    this.zerobiasClientApi.auditmationPlatform.getBoundaryApi().listBoundaries(0,50 /*, 'My Boundary Name' */).then((pagedResults: PagedResults<BoundaryExtended>) => {
      if (pagedResults) {
        this.boundaries = pagedResults.items?.length > 0 ? pagedResults.items : []; 
        // just grabbing first one, but you might need to be more selective and 
        // filter in the listBoundaries() args, maybe filter by name?
        this.selectedBoundary = this.boundaries[0];
      }
    });
  }


}

export default ZerobiasAppService;
