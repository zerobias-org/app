/**
 * Unit Tests for FeatureFlagsService
 */

import { TestBed } from '@angular/core/testing';
import { FeatureFlagsService } from './feature-flags.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureFlagsService],
    });
    service = TestBed.inject(FeatureFlagsService);
  });

  describe('get()', () => {
    it('should return default value for prefsBackend', () => {
      expect(service.get('prefsBackend')).toBe('localStorage');
    });
  });

  describe('isEnabled()', () => {
    it('should return true when flag matches value', () => {
      expect(service.isEnabled('prefsBackend', 'localStorage')).toBe(true);
    });

    it('should return false when flag does not match value', () => {
      expect(service.isEnabled('prefsBackend', 'pkv')).toBe(false);
    });
  });
});
