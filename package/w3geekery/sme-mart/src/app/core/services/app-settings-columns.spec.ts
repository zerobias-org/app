/**
 * Regression Tests — `app_settings` table column contract
 *
 * The `app_settings` Neon table has columns `key`, `value`, `description`,
 * `category`, `updated_at`, `updated_by` (see `app-settings.model.ts`).
 *
 * An earlier version of `demo-mode.service.ts` and `admin.service.ts`
 * queried `setting_key` / `setting_value` instead, which Postgres rejected
 * with `column "setting_key" does not exist`. The error surfaced via the
 * admin demo-mode toggle's snackbar but every other admin setting failed
 * silently.
 *
 * These specs lock the contract: both services MUST use `key` and `value`
 * in filter strings AND in row payloads.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DemoModeService } from './demo-mode.service';
import { AdminService } from './admin.service';
import { SmeMartDbService } from './sme-mart-db.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';

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
// DemoModeService — duck-typed db param
// ──────────────────────────────────────────────────────────────────────

describe('DemoModeService — app_settings column contract', () => {
  let service: DemoModeService;
  let mockApp: { whoAmI: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockApp = {
      whoAmI: vi.fn().mockResolvedValue({ email: 'clark@w3geekery.com' }),
    };

    TestBed.configureTestingModule({
      providers: [
        DemoModeService,
        { provide: ZerobiasClientApp, useValue: mockApp },
      ],
    });

    service = TestBed.inject(DemoModeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init() reads the setting with filter (key=...) — NOT (setting_key=...)', async () => {
    const db = makeMockDb();
    await service.init(db as never);

    expect(db.searchRows).toHaveBeenCalled();
    const [tableName, filter] = db.searchRows.mock.calls[0];
    expect(tableName).toBe('app_settings');
    expect(filter).toBe('(key=demo_mode_enabled)');
    expect(filter).not.toContain('setting_key');
  });

  it('init() reads `value` from the row — NOT `setting_value`', async () => {
    const db = makeMockDb();
    db.searchRows.mockResolvedValue({
      items: [{ id: 'r1', key: 'demo_mode_enabled', value: 'true' }],
    });

    await service.init(db as never);

    expect(service.enabled()).toBe(true);
  });

  it('toggle() creates a row with `key` + `value` props — NOT `setting_key` + `setting_value`', async () => {
    const db = makeMockDb();
    db.searchRows.mockResolvedValue({ items: [] }); // no existing row → createRow path
    await service.init(db as never);
    await service.toggle(db as never);

    expect(db.createRow).toHaveBeenCalledTimes(1);
    const [tableName, payload] = db.createRow.mock.calls[0];
    expect(tableName).toBe('app_settings');
    expect(payload).toHaveProperty('key', 'demo_mode_enabled');
    expect(payload).toHaveProperty('value');
    expect(payload).not.toHaveProperty('setting_key');
    expect(payload).not.toHaveProperty('setting_value');
  });

  it('toggle() updates existing row by `key` PK with pkColumn arg — NOT by `id`', async () => {
    // app_settings has no `id` column; PK is `key`. Locked in 2026-05-07 after the
    // demo-toggle was crashing in cross-org context with "Cannot read properties of
    // undefined (reading 'replace')" — root cause was passing existing.id (always
    // undefined) as rowKey to updateRow, which built `WHERE id = 'undefined'` and
    // crashed in escapeValue. Fix: pass the key value + pkColumn='key' to updateRow.
    const db = makeMockDb();
    db.searchRows.mockResolvedValue({
      items: [{ key: 'demo_mode_enabled', value: 'false' }],
    });
    await service.init(db as never);
    await service.toggle(db as never);

    expect(db.updateRow).toHaveBeenCalledTimes(1);
    const [tableName, rowKey, payload, pkColumn] = db.updateRow.mock.calls[0];
    expect(tableName).toBe('app_settings');
    expect(rowKey).toBe('demo_mode_enabled');
    expect(pkColumn).toBe('key');
    expect(payload).toHaveProperty('value');
    expect(payload).not.toHaveProperty('setting_value');
  });
});

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
