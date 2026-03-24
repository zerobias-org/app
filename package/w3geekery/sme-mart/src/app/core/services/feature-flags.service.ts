import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Feature flag definitions.
 * Add new flags here with a default value. Each environment file
 * can override via `environment.featureFlags`.
 */
export interface FeatureFlags {
  /** User prefs storage: 'localStorage' (no network) or 'pkv' (ZB cross-device sync). */
  prefsBackend: 'localStorage' | 'pkv';
}

const DEFAULTS: FeatureFlags = {
  prefsBackend: 'localStorage',
};

/**
 * Typed feature flag access. Reads from environment config at init time.
 *
 * Usage:
 *   private readonly flags = inject(FeatureFlagsService);
 *   if (this.flags.isEnabled('prefsBackend', 'pkv')) { ... }
 *   const backend = this.flags.get('prefsBackend');
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly flags: FeatureFlags;

  constructor() {
    this.flags = {
      ...DEFAULTS,
      ...(environment as any).featureFlags,
    };
  }

  /** Get a flag value. */
  get<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
    return this.flags[key];
  }

  /** Check if a flag equals a specific value. */
  isEnabled<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): boolean {
    return this.flags[key] === value;
  }
}
