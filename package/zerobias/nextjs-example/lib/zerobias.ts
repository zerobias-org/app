import { AxiosRequestConfig } from "axios";
import { URL, UUID } from "@auditmation/types-core-js";
import {
  newPortal,
  PortalConnector,
} from "@auditmation/module-auditmation-auditmation-portal";
import {
  ExecuteRawGraphqlQuery,
  GraphqlConnector,
  newGraphql,
} from "@auditmation/module-auditmation-auditmation-graphql";

class ZerobiasApiServices {
  static #instance: ZerobiasApiServices;

  private portalClient: PortalConnector;
  private graphqlClient: GraphqlConnector;

  private constructor() {
    const authHeader = `APIKey ${process.env.NEXT_PUBLIC_ZEROBIAS_PROD_API_KEY}`;    
    const axiosConfig: AxiosRequestConfig = {
      validateStatus: () => true,
      headers: { Authorization: authHeader },
      withCredentials: true,
    };

    this.portalClient = newPortal(axiosConfig);
    this.graphqlClient = newGraphql(axiosConfig);
    this.loadConnectors();
  }

  public static get instance(): ZerobiasApiServices {
    if (!ZerobiasApiServices.#instance) {
      console.log("create new isntances");
      ZerobiasApiServices.#instance = new ZerobiasApiServices();
    }

    return ZerobiasApiServices.#instance;
  }

  private getZerobiasClientApiUrl = (
    path: string,
    isLocalDev: boolean = false
  ): URL => {
    if (isLocalDev) {
      return new URL(`${location.protocol}//${location.host}/${path}`);
    } else {
      return new URL(`${location.protocol}//${location.host}/api/{path}`);
    }
  };

  private loadConnectors = async () => {
    await this.portalClient.connect({
      url: this.getZerobiasClientApiUrl("api", true),
    });
    await this.graphqlClient.connect({
      url: this.getZerobiasClientApiUrl("api", true),
    });
  };

  public getProducts = async (page: number, perPage: number) => {
    const portalResult = await this.portalClient
      .getProductApi()
      .search({}, page, perPage, undefined);

    return portalResult.items;
  };

  public getFinding = async () => {
    const resultQuery = await this.graphqlClient
      .getBoundaryApi()
      .boundaryExecuteRawQuery(
        new UUID("3f5a05d5-8a81-4f72-a33c-dc5be3949024"),
        new ExecuteRawGraphqlQuery(
          `query { 
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
        }`
        )
      );
    console.log(resultQuery);
  };
}

export default ZerobiasApiServices;
