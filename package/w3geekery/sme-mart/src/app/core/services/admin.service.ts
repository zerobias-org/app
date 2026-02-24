import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type { PagedResults } from '@zerobias-org/types-core-js';
import type { AdminStats, AppSetting, MarketplaceUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly db = inject(SmeMartDbService);

  async getStats(): Promise<AdminStats | null> {
    const result = await this.db.listRows<AdminStats>('v_admin_stats', { pageSize: 1 });
    return result.items?.[0] ?? null;
  }

  async getSettings(): Promise<AppSetting[]> {
    const result = await this.db.listRows<AppSetting>('app_settings', { pageSize: 100 });
    return result.items || [];
  }

  async updateSetting(key: string, value: unknown, updatedBy: string): Promise<AppSetting> {
    // Find the setting by key, then update by its row ID
    const result = await this.db.searchRows<AppSetting>(
      'app_settings',
      `(setting_key=${key})`,
      { pageSize: 1 },
    );
    const existing = result.items?.[0];
    if (existing) {
      return this.db.updateRow<AppSetting>('app_settings', existing.id, {
        setting_value: value,
        updated_by: updatedBy,
      });
    }
    // Create if not found
    return this.db.createRow<AppSetting>('app_settings', {
      setting_key: key,
      setting_value: value,
      updated_by: updatedBy,
    });
  }

  async listUsers(options?: QueryOptions): Promise<PagedResults<MarketplaceUser>> {
    return this.db.listRows<MarketplaceUser>('marketplace_users', options);
  }
}
