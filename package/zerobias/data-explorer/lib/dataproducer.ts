import { DataproducerClient, newDataproducer } from '@auditlogic/module-auditmation-interface-dataproducer-client-ts';
import { URL as CoreURL, UUID, PagedResults } from '@auditmation/types-core-js';
import ZerobiasAppService from './zerobias';
import { ConnectionListView, ScopeListView } from '@auditmation/module-auditmation-auditmation-hub';
import { ModuleSearch } from '@auditmation/module-auditmation-auditmation-store';

// PostgreSQL product package code for initial testing
const POSTGRESQL_PRODUCT_KEY = '@zerobias-org/product-oss-postgresql';

class DataProducerService {
  // Environment vars read from .env.development and .env.production
  public environment: any = {
    isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV !== undefined ? (process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true' ? true : false) : false,
    production: process.env.NEXT_PUBLIC_PRODUCTION !== undefined ? (process.env.NEXT_PUBLIC_PRODUCTION === 'true' ? true : false) : false,
    apiHostname: process.env.NEXT_PUBLIC_API_HOSTNAME
  };

  static #instance: DataProducerService;
  public client: DataproducerClient | null = null;
  public enable = false;

  constructor() {}

  /**
   * Initialize DataProducer client with hub connection profile
   * @param targetId - Connection ID (if single scope) or Scope ID (if multi-scope)
   */
  public async initializeClient(targetId: string) {
    const hubConnectionProfile = {
      server: new CoreURL(this.getHubUrl()),
      targetId: new UUID(targetId)
    };

    this.client = newDataproducer();
    await this.client.connect(hubConnectionProfile);
    this.enable = true;
    console.log("DataproducerClient initialized with targetId:", targetId);
  }

  private getHubUrl(): string {
    if (this.environment.isLocalDev) {
      return this.environment.apiHostname || 'http://localhost:8080';
    }
    return this.environment.apiHostname || 'https://api.zerobias.com';
  }

  public static async getInstance(): Promise<DataProducerService> {
    if (!DataProducerService.#instance) {
      console.log("Creating new DataProducerService instance");
      DataProducerService.#instance = new DataProducerService();
    }
    return DataProducerService.#instance;
  }

  /**
   * Reset client when changing connections
   */
  public reset() {
    this.client = null;
    this.enable = false;
  }

  /**
   * Discover connections that implement the DataProducer interface
   * Currently filters by PostgreSQL product for testing
   */
  public async discoverDataProducerConnections(): Promise<ConnectionListView[]> {
    const zerobiasService = await ZerobiasAppService.getInstance();
    const clientApi = zerobiasService.zerobiasClientApi;

    try {
      // Get PostgreSQL product for testing
      const pgProducts = await clientApi.portalClient.getProductApi()
        .search({ packageCode: POSTGRESQL_PRODUCT_KEY }, 1, 10);

      if (!pgProducts.items || pgProducts.items.length === 0) {
        console.warn('PostgreSQL product not found');
        return [];
      }

      const pgProduct = pgProducts.items[0];
      console.log('Found PostgreSQL product:', pgProduct.name);

      // Find modules using PostgreSQL
      const moduleSearchResults: PagedResults<ModuleSearch> = await clientApi.storeClient.getModuleApi()
        .search({ products: [pgProduct.id] }, 1, 50, undefined);

      const moduleIds = moduleSearchResults.items.map(m => m.id);
      console.log(`Found ${moduleIds.length} modules using PostgreSQL`);

      if (moduleIds.length === 0) {
        return [];
      }

      // Find connections using those modules
      const connectionResults: PagedResults<ConnectionListView> = await clientApi.hubClient.getConnectionApi()
        .search({ modules: moduleIds }, 1, 50, undefined);

      console.log(`Found ${connectionResults.items.length} connections`);
      return connectionResults.items;
    } catch (error) {
      console.error('Error discovering DataProducer connections:', error);
      throw error;
    }
  }

  /**
   * Get scopes for a connection (if multi-scope)
   * Returns null if single-scope connection
   */
  public async getScopesForConnection(connectionId: UUID): Promise<ScopeListView[] | null> {
    const zerobiasService = await ZerobiasAppService.getInstance();
    const clientApi = zerobiasService.zerobiasClientApi;

    try {
      // Get connection details
      const connection = await clientApi.hubClient.getConnectionApi().get(connectionId);

      if (!connection.scoped) {
        // Single-scope connection, use connection ID as targetId
        console.log('Connection is single-scope, no scopes to list');
        return null;
      }

      // Multi-scope connection, list scopes
      console.log('Connection is multi-scope, listing scopes');
      const scopeResults: PagedResults<ScopeListView> = await clientApi.hubClient.getScopeApi()
        .list(connectionId, 1, 50);

      console.log(`Found ${scopeResults.items.length} scopes`);
      return scopeResults.items;
    } catch (error) {
      console.error('Error getting scopes for connection:', error);
      throw error;
    }
  }

  /**
   * Check if a connection is multi-scope
   */
  public async isConnectionScoped(connectionId: UUID): Promise<boolean> {
    const zerobiasService = await ZerobiasAppService.getInstance();
    const clientApi = zerobiasService.zerobiasClientApi;

    try {
      const connection = await clientApi.hubClient.getConnectionApi().get(connectionId);
      return connection.scoped || false;
    } catch (error) {
      console.error('Error checking if connection is scoped:', error);
      return false;
    }
  }
}

export default DataProducerService;
