import { TestBed } from '@angular/core/testing';
import { AppInitService } from './app-init.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { TranslateService } from '@ngx-translate/core';
import { SmeMartDbService } from './services/sme-mart-db.service';
import { DemoModeService } from './services/demo-mode.service';
import { environment } from '../../environments/environment';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AppInitService — Branded Login Redirect', () => {
  let service: AppInitService;
  let mockApp: any;
  let mockTranslate: any;
  let mockDb: any;
  let mockDemoMode: any;
  let originalLocation: any;

  beforeEach(() => {
    // Create mock services
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

    // Store original location for restoration
    originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
  });

  afterEach(() => {
    // Restore original location
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation);
    }
    vi.clearAllMocks();
  });

  describe('Unauthenticated session (401 from whoAmI probe)', () => {
    it('should redirect to branded login URL with redirect query parameter', async () => {
      // Arrange
      const originalHref = 'http://localhost:4200/projects';
      let redirectTarget = '';

      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response('', { status: 401 })
      );

      // Mock window.location.href
      const locationObj = {
        href: originalHref,
      };
      Object.defineProperty(locationObj, 'href', {
        set: (value: string) => {
          redirectTarget = value;
        },
        get: () => originalHref,
      });

      Object.defineProperty(window, 'location', {
        value: locationObj,
        writable: true,
        configurable: true,
      });

      // Act — the init() will redirect, so it won't settle normally
      try {
        await Promise.race([
          service.init(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100)),
        ]);
      } catch (err) {
        // Expected — either redirect or timeout
      }

      // Assert
      expect(redirectTarget).toContain('/login?redirect=');
      expect(redirectTarget).toContain(encodeURIComponent(originalHref));
    });

    it('should use brandedLoginSubdomain if available', async () => {
      // Arrange
      const brandedSubdomain = 'https://w3geekery.uat.zerobias.com';
      const originalSubdomain = environment.brandedLoginSubdomain;
      (environment as any).brandedLoginSubdomain = brandedSubdomain;

      const originalHref = 'http://localhost:4200/projects';
      let redirectTarget = '';

      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response('', { status: 401 })
      );

      const locationObj = {
        href: originalHref,
      };
      Object.defineProperty(locationObj, 'href', {
        set: (value: string) => {
          redirectTarget = value;
        },
        get: () => originalHref,
      });

      Object.defineProperty(window, 'location', {
        value: locationObj,
        writable: true,
        configurable: true,
      });

      // Act
      try {
        await Promise.race([
          service.init(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100)),
        ]);
      } catch (err) {
        // Expected
      }

      // Assert
      expect(redirectTarget).toContain(brandedSubdomain);

      // Cleanup
      (environment as any).brandedLoginSubdomain = originalSubdomain;
    });

    it('should fall back to defaultLoginUrl when brandedLoginSubdomain is null', async () => {
      // Arrange
      const fallbackUrl = 'https://uat.zerobias.com/login';
      const originalSubdomain = environment.brandedLoginSubdomain;
      (environment as any).brandedLoginSubdomain = null;
      (environment as any).defaultLoginUrl = fallbackUrl;

      const originalHref = 'http://localhost:4200/projects';
      let redirectTarget = '';

      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response('', { status: 401 })
      );

      const locationObj = {
        href: originalHref,
      };
      Object.defineProperty(locationObj, 'href', {
        set: (value: string) => {
          redirectTarget = value;
        },
        get: () => originalHref,
      });

      Object.defineProperty(window, 'location', {
        value: locationObj,
        writable: true,
        configurable: true,
      });

      // Act
      try {
        await Promise.race([
          service.init(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100)),
        ]);
      } catch (err) {
        // Expected
      }

      // Assert
      expect(redirectTarget).toContain(fallbackUrl);

      // Cleanup
      (environment as any).brandedLoginSubdomain = originalSubdomain;
    });
  });

  describe('Authenticated session (200 from whoAmI probe)', () => {
    it('should not redirect when user is authenticated', async () => {
      // Arrange
      let redirectTarget = '';

      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'user-123' }), { status: 200 })
      );

      const locationObj = {
        href: 'http://localhost:4200/projects',
      };
      Object.defineProperty(locationObj, 'href', {
        set: (value: string) => {
          redirectTarget = value;
        },
        get: () => 'http://localhost:4200/projects',
      });

      Object.defineProperty(window, 'location', {
        value: locationObj,
        writable: true,
        configurable: true,
      });

      // Act
      const result = await service.init();

      // Assert
      expect(result).toBe(true);
      expect(redirectTarget).toBe(''); // No redirect should occur
      expect(mockApp.init).toHaveBeenCalled();
    });
  });

  describe('Network error during probe', () => {
    it('should log error and continue with SDK init on network failure', async () => {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn');
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      // Act
      const result = await service.init();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '[AppInit] Session probe failed:',
        expect.any(Error)
      );
      expect(result).toBe(true); // Should complete despite probe failure
      expect(mockApp.init).toHaveBeenCalled();
    });
  });

  describe('i18n and DB initialization', () => {
    it('should set up i18n before probing session', async () => {
      // Arrange
      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'user-123' }), { status: 200 })
      );

      // Act
      await service.init();

      // Assert
      expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en');
      expect(mockTranslate.use).toHaveBeenCalledWith('en');
    });

    it('should attempt DB connection asynchronously', async () => {
      // Arrange
      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'user-123' }), { status: 200 })
      );

      // Act
      await service.init();
      // Wait a tick for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockDb.connect).toHaveBeenCalled();
    });
  });
});
