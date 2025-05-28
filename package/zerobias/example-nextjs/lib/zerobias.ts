import { ZerobiasClientOrgId, ZerobiasClientApp, ZerobiasClientApi, getZerobiasClientUrl } from "@auditmation/zb-client-lib-js";
import { ExecuteRawGraphqlQuery } from "@auditmation/module-auditmation-auditmation-graphql";
import { BoundaryExtended } from "@auditmation/module-auditmation-auditmation-platform";
import { PagedResults } from "@auditmation/types-core-js";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import { ApiKey, InlineObject } from '@auditmation/module-auditmation-auditmation-dana';

// environnment vars read from .env.development and .env.production
export const environment = {
  isLocalDev: process.env.IS_LOCAL_DEV ? true : false,
};

class ZerobiasAppService {
  static #instance: ZerobiasAppService;
  public zerobiasOrgId: ZerobiasClientOrgId = new ZerobiasClientOrgId();
  public zerobiasClientApi: ZerobiasClientApi = new ZerobiasClientApi(this.zerobiasOrgId, environment);
  public zerobiasClientApp: ZerobiasClientApp = new ZerobiasClientApp(this.zerobiasClientApi, this.zerobiasOrgId);

  public selectedBoundary: BoundaryExtended | null = null;
  public boundaries: BoundaryExtended[] = [];
  public enable = false;

    constructor() {
    this.zerobiasOrgId = new ZerobiasClientOrgId();
    this.zerobiasClientApi = new ZerobiasClientApi(this.zerobiasOrgId, environment);
    this.zerobiasClientApp = new ZerobiasClientApp(
      this.zerobiasClientApi,
      this.zerobiasOrgId
    );
  }

  public async initializeAppFactory() {
    this.zerobiasClientApp.init().then(() => {
      this.enable = true;
      console.log("ZerobiasAppSvc initialized");
    });
  }

  public static async getInstance(): Promise<ZerobiasAppService>  {
    if (!ZerobiasAppService.#instance) {
      console.log("create new isntances");
      ZerobiasAppService.#instance = new ZerobiasAppService();

      await ZerobiasAppService.#instance.initializeAppFactory();
    } 
    if (!ZerobiasAppService.#instance.enable) {
      // redirect to login
      ZerobiasAppService.#instance.redirectToLogin();
    }

    return ZerobiasAppService.#instance;
  }

  public redirectToLogin = (): void => {
    const next = location.href;
    // change this function to whatever you need it to be if this doesn't work for you
  
    // NOTE: this will send you to /login - if you are in local dev you will either need 
    // to be running your `zerobias-org/login` app or manually login on your QA platform
    // const url = getZerobiasClientUrl('/login', false, environment.isLocalDev, false);
    window.location.href = `https://ci.zerobias.com/login?next=${next}`;
  }

  public logOut = async () => {
    this.zerobiasClientApi.danaClient
      ?.getMeApi()
      .logoutGet()
      .then((data) => {
        console.log("logout")
        console.log(data);
        console.log("******")
      });
  };


  public getProducts = async (page: number, perPage: number) => {
    let products:Array<ProductExtended> = [];

    this.zerobiasClientApi.portalClient.getProductApi().search({}, page, perPage, undefined).then((pagedResults:PagedResults<ProductExtended>) => {
      products = pagedResults.items;
    });

    return products;
  };


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
