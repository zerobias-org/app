/**
 * Regression Tests — `app_settings` table column contract
 *
 * The `app_settings` Neon table has columns `key`, `value`, `description`,
 * `category`, `updated_at`, `updated_by` (see `app-settings.model.ts`).
 *
 * An earlier version of `admin.service.ts` queried `setting_key` /
 * `setting_value` instead, which Postgres rejected with
 * `column "setting_key" does not exist`. Every admin setting failed silently.
 *
 * These specs lock the contract: the service MUST use `key` and `value`
 * in filter strings AND in row payloads.
 *
 * A parallel DemoModeService block lived here until the demo-mode machinery was
 * removed; the AdminService contract it shared is what these tests still guard.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AdminService } from './admin.service';
import { SmeMartDbService } from './sme-mart-db.service';

interface MockDb {
  searchRows: ReturnType<typeof vi.fn>;
  updateRow: ReturnType<typeof vi.fn>;
  createRow: ReturnType<typeof vi.fn>;
  listRows: ReturnType<typeof vi.fn>;
}

function makeMockDb(): MockDb {
  return {
    searchRows: vi.fn().mockResolvedValue({ items: [] }),
    updateRow: vi.fn().mockResolvedValue({}),
    createRow: vi.fn().mockResolvedValue({}),
    listRows: vi.fn().mockResolvedValue({ items: [] }),
  };
}

// ──────────────────────────────────────────────────────────────────────
// AdminService — DI-injected SmeMartDbService
// ──────────────────────────────────────────────────────────────────────

describe('AdminService — app_settings column contract', () => {
  let service: AdminService;
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = makeMockDb();

    TestBed.configureTestingModule({
      providers: [
        AdminService,
        { provide: SmeMartDbService, useValue: mockDb },
      ],
    });

    service = TestBed.inject(AdminService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updateSetting() searches with filter (key=...) — NOT (setting_key=...)', async () => {
    await service.updateSetting('registration.allow_new_users', true, 'clark@w3geekery.com');

    expect(mockDb.searchRows).toHaveBeenCalled();
    const [tableName, filter] = mockDb.searchRows.mock.calls[0];
    expect(tableName).toBe('app_settings');
    expect(filter).toBe('(key=registration.allow_new_users)');
    expect(filter).not.toContain('setting_key');
  });

  it('updateSetting() creates a row with `key` + `value` props when none exists', async () => {
    mockDb.searchRows.mockResolvedValue({ items: [] });

    await service.updateSetting('notifications.email_enabled', true, 'admin@zerobias.com');

    expect(mockDb.createRow).toHaveBeenCalledTimes(1);
    const [tableName, payload] = mockDb.createRow.mock.calls[0];
    expect(tableName).toBe('app_settings');
    expect(payload).toHaveProperty('key', 'notifications.email_enabled');
    expect(payload).toHaveProperty('value', true);
    expect(payload).toHaveProperty('updated_by', 'admin@zerobias.com');
    expect(payload).not.toHaveProperty('setting_key');
    expect(payload).not.toHaveProperty('setting_value');
  });

  it('updateSetting() updates existing row with `value` prop — NOT `setting_value`', async () => {
    mockDb.searchRows.mockResolvedValue({
      items: [{ id: 'row-7', key: 'notifications.email_enabled', value: false }],
    });

    await service.updateSetting('notifications.email_enabled', true, 'admin@zerobias.com');

    expect(mockDb.updateRow).toHaveBeenCalledTimes(1);
    const [tableName, rowId, payload] = mockDb.updateRow.mock.calls[0];
    expect(tableName).toBe('app_settings');
    expect(rowId).toBe('row-7');
    expect(payload).toHaveProperty('value', true);
    expect(payload).toHaveProperty('updated_by', 'admin@zerobias.com');
    expect(payload).not.toHaveProperty('setting_value');
  });
});
