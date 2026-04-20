import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BidReview, type RequirementGroup } from './bid-review.component';
import { COMPLIANCE_STATUS_OPTIONS } from '../../../core/models/bid-response.model';
import type { ComplianceStatus } from '../../../core/models';
import { makeBidSummaryRow } from '../../../test-helpers/factories';

describe('BidReview', () => {
  let component: BidReview;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BidReview],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(BidReview);
    component = fixture.componentInstance;
    component.bid = makeBidSummaryRow({
      cover_letter: 'Full coverage.',
      proposed_price: '15000',
      proposed_timeline: '8 weeks',
      executive_summary: 'Phased approach.',
      team_description: '4 consultants.',
      total_estimated_hours: 160,
      pricing_breakdown: [
        { taskType: 'Assessment', estimatedHours: 60, estimatedCost: 6000 },
        { taskType: 'Implementation', estimatedHours: 100, estimatedCost: 10000 },
      ],
      rfp_title: 'HIPAA Compliance',
      budget_min: '12000',
      budget_max: '18000',
      total_responses: 15,
      met_count: 10,
      partial_count: 3,
      not_met_count: 1,
      planned_count: 1,
      sum_estimated_hours: 160,
      sum_estimated_cost: 16000,
      provider_display_name: 'Bob Chen',
      provider_headline: 'HIPAA Specialist',
      provider_rating: 4.9,
    });
    component.requirementGroups = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('provider name', () => {
    it('should use provider_display_name', () => {
      expect(component.providerName()).toBe('Bob Chen');
    });

    it('should fallback to Vendor', () => {
      component.bid = makeBidSummaryRow({
        cover_letter: 'Full coverage.',
        proposed_price: '15000',
        proposed_timeline: '8 weeks',
        executive_summary: 'Phased approach.',
        team_description: '4 consultants.',
        total_estimated_hours: 160,
        pricing_breakdown: [
          { taskType: 'Assessment', estimatedHours: 60, estimatedCost: 6000 },
          { taskType: 'Implementation', estimatedHours: 100, estimatedCost: 10000 },
        ],
        rfp_title: 'HIPAA Compliance',
        budget_min: '12000',
        budget_max: '18000',
        total_responses: 15,
        met_count: 10,
        partial_count: 3,
        not_met_count: 1,
        planned_count: 1,
        sum_estimated_hours: 160,
        sum_estimated_cost: 16000,
        provider_display_name: null,
        provider_headline: 'HIPAA Specialist',
        provider_rating: 4.9,
      });
      expect(component.providerName()).toBe('Vendor');
    });
  });

  describe('compliance', () => {
    it('should compute from row counts', () => {
      const c = component.compliance();
      expect(c).not.toBeNull();
      expect(c!.met).toBe(10);
      expect(c!.partially_met).toBe(3);
      expect(c!.not_met).toBe(1);
      expect(c!.total).toBe(15);
    });

    it('should return null when no responses', () => {
      component.bid = makeBidSummaryRow({
        cover_letter: 'Full coverage.',
        proposed_price: '15000',
        proposed_timeline: '8 weeks',
        executive_summary: 'Phased approach.',
        team_description: '4 consultants.',
        total_estimated_hours: 160,
        pricing_breakdown: [
          { taskType: 'Assessment', estimatedHours: 60, estimatedCost: 6000 },
          { taskType: 'Implementation', estimatedHours: 100, estimatedCost: 10000 },
        ],
        rfp_title: 'HIPAA Compliance',
        budget_min: '12000',
        budget_max: '18000',
        total_responses: 0,
        met_count: 10,
        partial_count: 3,
        not_met_count: 1,
        planned_count: 1,
        sum_estimated_hours: 160,
        sum_estimated_cost: 16000,
        provider_display_name: 'Bob Chen',
        provider_headline: 'HIPAA Specialist',
        provider_rating: 4.9,
      });
      expect(component.compliance()).toBeNull();
    });
  });

  describe('pricing breakdown', () => {
    it('should parse array pricing_breakdown', () => {
      expect(component.pricingBreakdown()).toHaveLength(2);
    });

    it('should parse string pricing_breakdown', () => {
      component.bid = makeBidSummaryRow({
        cover_letter: 'Full coverage.',
        proposed_price: '15000',
        proposed_timeline: '8 weeks',
        executive_summary: 'Phased approach.',
        team_description: '4 consultants.',
        total_estimated_hours: 160,
        pricing_breakdown: JSON.stringify([{ taskType: 'Audit', estimatedHours: 10, estimatedCost: 1000 }]) as any,
        rfp_title: 'HIPAA Compliance',
        budget_min: '12000',
        budget_max: '18000',
        total_responses: 15,
        met_count: 10,
        partial_count: 3,
        not_met_count: 1,
        planned_count: 1,
        sum_estimated_hours: 160,
        sum_estimated_cost: 16000,
        provider_display_name: 'Bob Chen',
        provider_headline: 'HIPAA Specialist',
        provider_rating: 4.9,
      });
      expect(component.pricingBreakdown()).toHaveLength(1);
    });

    it('should return empty when null', () => {
      component.bid = makeBidSummaryRow({ pricing_breakdown: null });
      expect(component.pricingBreakdown()).toEqual([]);
    });
  });

  describe('status helpers', () => {
    it('should detect pending status', () => {
      expect(component.isPending()).toBe(true);
    });

    it('should detect non-pending status', () => {
      component.bid = makeBidSummaryRow({
        cover_letter: 'Full coverage.',
        proposed_price: '15000',
        proposed_timeline: '8 weeks',
        executive_summary: 'Phased approach.',
        team_description: '4 consultants.',
        total_estimated_hours: 160,
        pricing_breakdown: [
          { taskType: 'Assessment', estimatedHours: 60, estimatedCost: 6000 },
          { taskType: 'Implementation', estimatedHours: 100, estimatedCost: 10000 },
        ],
        rfp_title: 'HIPAA Compliance',
        budget_min: '12000',
        budget_max: '18000',
        total_responses: 15,
        met_count: 10,
        partial_count: 3,
        not_met_count: 1,
        planned_count: 1,
        sum_estimated_hours: 160,
        sum_estimated_cost: 16000,
        provider_display_name: 'Bob Chen',
        provider_headline: 'HIPAA Specialist',
        provider_rating: 4.9,
        status: 'accepted',
      });
      expect(component.isPending()).toBe(false);
    });

    it('should map status color from COMPLIANCE_STATUS_OPTIONS', () => {
      for (const opt of COMPLIANCE_STATUS_OPTIONS) {
        expect(component.getStatusColor(opt.value)).toBe(opt.color);
      }
    });

    it('should map status label from COMPLIANCE_STATUS_OPTIONS', () => {
      expect(component.getStatusLabel('met')).toBe('Met');
      expect(component.getStatusLabel('partially_met')).toBe('Partially Met');
    });

    it('should fallback color for unknown status', () => {
      expect(component.getStatusColor('unknown' as ComplianceStatus)).toBe('#9e9e9e');
    });
  });

  describe('event emissions', () => {
    it('should emit accept with bid id', () => {
      const spy = vi.spyOn(component.accept, 'emit');
      component.onAccept();
      expect(spy).toHaveBeenCalledWith('bid-001');
    });

    it('should emit reject with bid id', () => {
      const spy = vi.spyOn(component.reject, 'emit');
      component.onReject();
      expect(spy).toHaveBeenCalledWith('bid-001');
    });

    it('should emit back', () => {
      const spy = vi.spyOn(component.back, 'emit');
      component.onBack();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('sum fields', () => {
    it('should expose sumHours and sumCost', () => {
      expect(component.sumHours()).toBe(160);
      expect(component.sumCost()).toBe(16000);
    });
  });
});
