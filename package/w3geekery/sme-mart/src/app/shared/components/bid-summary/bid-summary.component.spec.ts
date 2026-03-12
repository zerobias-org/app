import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BidSummary } from './bid-summary.component';
import { makeBidSummaryRow } from '../../../test-helpers/factories';

describe('BidSummary', () => {
  let component: BidSummary;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BidSummary],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(BidSummary);
    component = fixture.componentInstance;
    component.bid = makeBidSummaryRow();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('basic computed signals', () => {
    it('should expose executive summary', () => {
      expect(component.executiveSummary()).toBe('We propose a phased approach.');
    });

    it('should expose cover letter', () => {
      expect(component.coverLetter()).toBe('Our approach covers all requirements.');
    });

    it('should expose status', () => {
      expect(component.status()).toBe('pending');
    });
  });

  describe('pricing breakdown', () => {
    it('should return array when already parsed', () => {
      const breakdown = component.pricingBreakdown();
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].taskType).toBe('Assessment');
    });

    it('should parse string pricing_breakdown', () => {
      component.bid = makeBidSummaryRow({
        pricing_breakdown: JSON.stringify([
          { taskType: 'Audit', estimatedHours: 20, estimatedCost: 2000 },
        ]) as any,
      });
      expect(component.pricingBreakdown()).toHaveLength(1);
      expect(component.pricingBreakdown()[0].taskType).toBe('Audit');
    });

    it('should return empty array when no breakdown', () => {
      component.bid = makeBidSummaryRow({ pricing_breakdown: null });
      expect(component.pricingBreakdown()).toEqual([]);
    });
  });

  describe('totals', () => {
    it('should compute total estimated hours', () => {
      expect(component.totalEstimatedHours()).toBe(120);
    });

    it('should compute total estimated cost', () => {
      expect(component.totalEstimatedCost()).toBe(12000);
    });

    it('should return 0 when no breakdown', () => {
      component.bid = makeBidSummaryRow({ pricing_breakdown: null });
      expect(component.totalEstimatedHours()).toBe(0);
      expect(component.totalEstimatedCost()).toBe(0);
    });
  });

  describe('compliance', () => {
    it('should compute compliance summary from row counts', () => {
      const c = component.compliance();
      expect(c).not.toBeNull();
      expect(c!.met).toBe(7);
      expect(c!.partially_met).toBe(2);
      expect(c!.total).toBe(10);
    });

    it('should return null when no total_responses', () => {
      component.bid = makeBidSummaryRow({ total_responses: 0 });
      expect(component.compliance()).toBeNull();
    });
  });

  describe('sum fields', () => {
    it('should expose sumHours and sumCost', () => {
      expect(component.sumHours()).toBe(120);
      expect(component.sumCost()).toBe(12000);
    });
  });
});
