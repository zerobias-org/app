import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type { PagedResults } from '@zerobias-org/types-core-js';
import type { ServiceOffering } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceOfferingsService {
  private readonly db = inject(SmeMartDbService);

  async listServices(options?: QueryOptions): Promise<PagedResults<ServiceOffering>> {
    return this.db.listRows<ServiceOffering>('service_offerings', options);
  }

  async getServicesByProvider(providerId: string): Promise<ServiceOffering[]> {
    const result = await this.db.searchRows<ServiceOffering>(
      'service_offerings',
      `(provider_id=${providerId})`,
      { pageSize: 100 },
    );
    return result.items || [];
  }

  async createService(
    providerId: string,
    data: Omit<ServiceOffering, 'id' | 'provider_id' | 'created_at'>,
  ): Promise<ServiceOffering> {
    return this.db.createRow<ServiceOffering>('service_offerings', {
      provider_id: providerId,
      ...data,
    });
  }

  async updateService(serviceId: string, data: Partial<ServiceOffering>): Promise<ServiceOffering> {
    return this.db.updateRow<ServiceOffering>('service_offerings', serviceId, data as Record<string, unknown>);
  }

  async deleteService(serviceId: string): Promise<void> {
    return this.db.deleteRow('service_offerings', serviceId);
  }
}
