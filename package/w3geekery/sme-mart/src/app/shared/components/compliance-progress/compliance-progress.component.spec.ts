import { TestBed } from '@angular/core/testing';
import { ComplianceProgress } from './compliance-progress.component';
import type { ComplianceSummary } from '../../../core/models';

describe('ComplianceProgress', () => {
  let component: ComplianceProgress;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ComplianceProgress] });
    const fixture = TestBed.createComponent(ComplianceProgress);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('segments', () => {
    it('should return empty array when summary is null', () => {
      expect(component.segments()).toEqual([]);
    });

    it('should return empty array when total is 0', () => {
      component.summary = { met: 0, partially_met: 0, not_met: 0, not_applicable: 0, planned: 0, total: 0, responded: 0 };
      expect(component.segments()).toEqual([]);
    });

    it('should compute segments with correct percentages', () => {
      component.summary = { met: 5, partially_met: 2, not_met: 1, not_applicable: 1, planned: 1, total: 10, responded: 10 };
      const segs = component.segments();
      expect(segs).toHaveLength(5);
      expect(segs[0]).toEqual({ label: 'Met', count: 5, pct: 50, cssClass: 'seg-met' });
      expect(segs[1]).toEqual({ label: 'Partial', count: 2, pct: 20, cssClass: 'seg-partial' });
    });

    it('should filter out zero-count segments', () => {
      component.summary = { met: 3, partially_met: 0, not_met: 0, not_applicable: 0, planned: 0, total: 3, responded: 3 };
      expect(component.segments()).toHaveLength(1);
      expect(component.segments()[0].label).toBe('Met');
    });
  });

  describe('responded/total', () => {
    it('should return 0 when no summary', () => {
      expect(component.responded()).toBe(0);
      expect(component.total()).toBe(0);
      expect(component.respondedPct()).toBe(0);
    });

    it('should compute responded percentage', () => {
      component.summary = { met: 3, partially_met: 1, not_met: 0, not_applicable: 0, planned: 0, total: 10, responded: 4 };
      expect(component.responded()).toBe(4);
      expect(component.total()).toBe(10);
      expect(component.respondedPct()).toBe(40);
    });
  });

  describe('compact mode', () => {
    it('should default to non-compact', () => {
      expect(component.isCompact()).toBe(false);
    });

    it('should support compact input', () => {
      component.compact = true;
      expect(component.isCompact()).toBe(true);
    });
  });

  describe('label visibility', () => {
    it('should default to visible', () => {
      expect(component.labelVisible()).toBe(true);
    });

    it('should support hiding label', () => {
      component.showLabel = false;
      expect(component.labelVisible()).toBe(false);
    });
  });
});
