import { TestBed } from '@angular/core/testing';
import { AppInitService } from './app-init.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { TranslateService } from '@ngx-translate/core';
import { SmeMartDbService } from './services/sme-mart-db.service';
import { DemoModeService } from './services/demo-mode.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AppInitService', () => {
  let service: AppInitService;
  let mockApp: any;
  let mockTranslate: any;
  let mockDb: any;
  let mockDemoMode: any;

  beforeEach(() => {
    mockApp = {
      init: vi.fn().mockReturnValue(Promise.resolve(true)),
    };
    mockTranslate = {
      setDefaultLang: vi.fn(),
      use: vi.fn(),
    };
    mockDb = {
      connect: vi.fn().mockReturnValue(Promise.resolve({ success: true })),
    };
    mockDemoMode = {
      init: vi.fn().mockReturnValue(Promise.resolve()),
      enabled: vi.fn(() => false),
      canToggle: vi.fn(() => false),
    };

    TestBed.configureTestingModule({
      providers: [
        AppInitService,
        { provide: ZerobiasClientApp, useValue: mockApp },
        { provide: TranslateService, useValue: mockTranslate },
        { provide: SmeMartDbService, useValue: mockDb },
        { provide: DemoModeService, useValue: mockDemoMode },
      ],
    });
    service = TestBed.inject(AppInitService);
  });

  it('configures i18n before SDK init', async () => {
    await service.init();

    expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en');
    expect(mockTranslate.use).toHaveBeenCalledWith('en');
    expect(mockApp.init).toHaveBeenCalled();
  });

  it('returns the SDK init result', async () => {
    mockApp.init.mockResolvedValue(true);

    const result = await service.init();

    expect(result).toBe(true);
  });

  it('attempts DB connection asynchronously after SDK init', async () => {
    await service.init();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockDb.connect).toHaveBeenCalled();
  });
});
