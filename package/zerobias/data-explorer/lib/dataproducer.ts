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
    const zerobiasService = await ZerobiasAppService.getInstance();

    // Use the Hub URL from zb-client, which knows about /hub path
    const baseUrl = zerobiasService.zerobiasClientApi.hubClient.getBasePath();

    const hubConnectionProfile = {
      server: new CoreURL(baseUrl),
      targetId: new UUID(targetId)
    };

    console.log('Initializing DataProducer with Hub URL:', baseUrl);
    this.client = newDataproducer();
    await this.client.connect(hubConnectionProfile);
    this.enable = true;
    console.log("DataproducerClient initialized with targetId:", targetId);
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
   * Currently filters by PostgreSQL product for testing, falls back to listing all connections
   */
  public async discoverDataProducerConnections(): Promise<ConnectionListView[]> {
    const zerobiasService = await ZerobiasAppService.getInstance();
    const clientApi = zerobiasService.zerobiasClientApi;

    try {
      // Try to find PostgreSQL connections via product/module association
      const pgProducts = await clientApi.portalClient.getProductApi()
        .search({ packageCode: POSTGRESQL_PRODUCT_KEY }, 1, 10);

      if (pgProducts.items && pgProducts.items.length > 0) {
        const pgProduct = pgProducts.items[0];
        console.log('Found PostgreSQL product:', pgProduct.name, pgProduct.id);

        // Find modules using PostgreSQL
        const moduleSearchResults: PagedResults<ModuleSearch> = await clientApi.storeClient.getModuleApi()
          .search({ products: [pgProduct.id] }, 1, 50, undefined);

        const moduleIds = moduleSearchResults.items.map(m => m.id);
        console.log(`Found ${moduleIds.length} modules using PostgreSQL:`, moduleIds);

        if (moduleIds.length > 0) {
          // Find connections using those modules
          const connectionResults: PagedResults<ConnectionListView> = await clientApi.hubClient.getConnectionApi()
            .search({ modules: moduleIds }, 1, 50, undefined);

          console.log(`Found ${connectionResults.items.length} PostgreSQL connections via product association`);

          if (connectionResults.items.length > 0) {
            return connectionResults.items;
          }
        }
      }

      // Fallback: List all connections and filter by name pattern
      console.log('PostgreSQL product association incomplete. Listing all connections and filtering by name...');
      const allConnections = await this.listAllConnections();

      // Filter connections that likely support SQL/PostgreSQL based on name
      const sqlConnections = allConnections.filter(conn => {
        const name = conn.name.toLowerCase();
        return name.includes('sql') ||
               name.includes('postgres') ||
               name.includes('database') ||
               name.includes('db');
      });

      if (sqlConnections.length > 0) {
        console.log(`Found ${sqlConnections.length} SQL-related connections by name pattern`);
        return sqlConnections;
      }

      // If no SQL connections found by pattern, return all connections
      console.log('No SQL connections found by name pattern. Returning all connections.');
      return allConnections;
    } catch (error) {
      console.error('Error discovering DataProducer connections:', error);
      throw error;
    }
  }

  /**
   * List all connections (fallback to verify API is working)
   */
  public async listAllConnections(): Promise<ConnectionListView[]> {
    const zerobiasService = await ZerobiasAppService.getInstance();
    const clientApi = zerobiasService.zerobiasClientApi;

    try {
      console.log('Listing ALL connections for verification...');
      const allConnections: PagedResults<ConnectionListView> = await clientApi.hubClient.getConnectionApi()
        .list(1, 100);

      console.log(`Total connections found: ${allConnections.items.length}`);
      allConnections.items.forEach((conn, idx) => {
        console.log(`  ${idx + 1}. ${conn.name} (ID: ${conn.id})`);
      });

      return allConnections.items;
    } catch (error) {
      console.error('Error listing all connections:', error);
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
