import { ZbClientOrgIdSvc, ZerobiasAppSvc, ZerobiasClientApiSvc } from "@auditmation/zb-client-lib-js";
import { ExecuteRawGraphqlQuery } from "@auditmation/module-auditmation-auditmation-graphql";
import { BoundaryExtended } from "@auditmation/module-auditmation-auditmation-platform";
import { PagedResults } from "@auditmation/types-core-js";

// environment can be file-based
export const environment = {
  isLocalDev: true
};

class ZerobiasAppService {
  static #instance: ZerobiasAppService;
  private zbOrgIdService: ZbClientOrgIdSvc = new ZbClientOrgIdSvc();
  private clientApi: ZerobiasClientApiSvc = new ZerobiasClientApiSvc(this.zbOrgIdService,environment);
  private zerobiasAppService: ZerobiasAppSvc = new ZerobiasAppSvc(this.clientApi, this.zbOrgIdService);

  public selectedBoundary: BoundaryExtended|null = null;
  public boundaries: BoundaryExtended[] = [];

  constructor() {
    this.initializeAppFactory(this.zerobiasAppService);
  }

  public initializeAppFactory(zerobiasAppService: ZerobiasAppSvc) { // <<--- zerobias-app service calls client api init
    return () => zerobiasAppService.init().then(() => {
      console.log('ZerobiasAppService initialized');
    });
  }

  public static get instance(): ZerobiasAppService {
    if (!ZerobiasAppService.#instance) {
      console.log("create new isntances");
      ZerobiasAppService.#instance = new ZerobiasAppService();
    }

    return ZerobiasAppService.#instance;
  }


  public getProducts = async (page: number, perPage: number) => {
    const portalResult = await this.clientApi.portalClient
      .getProductApi()
      .search({}, page, perPage, undefined);

    return portalResult.items;
  };

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

    const resultQuery = await this.clientApi.graphqlClient
      .getBoundaryApi()
      .boundaryExecuteRawQuery(
        //new UUID("3f5a05d5-8a81-4f72-a33c-dc5be3949024"), // <--- listBoundaries(), select a boundary
        this.clientApi.toUUID(this.selectedBoundary?.id),
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
    this.clientApi.auditmationPlatform.getBoundaryApi().listBoundaries(0,50 /*, 'My Boundary Name' */).then((pagedResults: PagedResults<BoundaryExtended>) => {
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
