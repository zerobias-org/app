import { DataproducerClient, newDataproducer } from '@auditlogic/module-auditmation-interface-dataproducer-client-ts';
import { URL as CoreURL, UUID } from '@auditmation/types-core-js';

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
}

export default DataProducerService;
