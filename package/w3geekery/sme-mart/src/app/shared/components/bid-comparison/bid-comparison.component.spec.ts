import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BidComparison, type ComparisonBid } from './bid-comparison.component';
import { makeComparisonBid } from '../../../test-helpers/factories';

describe('BidComparison', () => {
  let component: BidComparison;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BidComparison],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(BidComparison);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('bid list', () => {
    it('should limit to 4 bids', () => {
      const bids = Array.from({ length: 6 }, (_, i) =>
        makeComparisonBid({ id: `bid-${i}`, proposed_price: `${(i + 1) * 1000}` }),
      );
      component.bids = bids;
      expect(component.bidList()).toHaveLength(4);
      expect(component.bidCount()).toBe(6);
    });
  });

  describe('categories', () => {
    it('should extract unique sorted categories across all bids', () => {
      component.bids = [
        makeComparisonBid({ categoryCompliance: [{ category: 'Privacy', met: 1, total: 2 }] }),
        makeComparisonBid({ id: 'bid-002', categoryCompliance: [{ category: 'Security', met: 3, total: 4 }, { category: 'Privacy', met: 2, total: 3 }] }),
      ];
      expect(component.categories()).toEqual(['Privacy', 'Security']);
    });
  });

  describe('best price', () => {
    it('should find bid with lowest price', () => {
      component.bids = [
        makeComparisonBid({ id: 'bid-a', proposed_price: '15000' }),
        makeComparisonBid({ id: 'bid-b', proposed_price: '8000' }),
        makeComparisonBid({ id: 'bid-c', proposed_price: '12000' }),
      ];
      expect(component.bestPriceBidId()).toBe('bid-b');
    });

    it('should skip null prices', () => {
      component.bids = [
        makeComparisonBid({ id: 'bid-a', proposed_price: null }),
        makeComparisonBid({ id: 'bid-b', proposed_price: '5000' }),
      ];
      expect(component.bestPriceBidId()).toBe('bid-b');
    });

    it('should return undefined when no bids', () => {
      component.bids = [];
      expect(component.bestPriceBidId()).toBeUndefined();
    });
  });

  describe('best compliance', () => {
    it('should find bid with highest met count', () => {
      component.bids = [
        makeComparisonBid({ id: 'bid-a', compliance: { met: 5, partially_met: 0, not_met: 0, not_applicable: 0, planned: 0, total: 10, responded: 5 } }),
        makeComparisonBid({ id: 'bid-b', compliance: { met: 9, partially_met: 0, not_met: 0, not_applicable: 0, planned: 0, total: 10, responded: 9 } }),
      ];
      expect(component.bestComplianceBidId()).toBe('bid-b');
    });
  });

  describe('getCategoryCompliance', () => {
    it('should return met/total string for matching category', () => {
      const bid = makeComparisonBid();
      expect(component.getCategoryCompliance(bid, 'Security')).toBe('5/6');
    });

    it('should return dash for missing category', () => {
      const bid = makeComparisonBid();
      expect(component.getCategoryCompliance(bid, 'Nonexistent')).toBe('—');
    });
  });

  describe('getInitials', () => {
    it('should return first letters of first two words', () => {
      expect(component.getInitials('Alice Jones')).toBe('AJ');
    });

    it('should handle single word', () => {
      expect(component.getInitials('Alice')).toBe('A');
    });
  });

  describe('event emissions', () => {
    it('should emit viewBid', () => {
      const spy = vi.spyOn(component.viewBid, 'emit');
      component.onView('bid-001');
      expect(spy).toHaveBeenCalledWith('bid-001');
    });

    it('should emit acceptBid', () => {
      const spy = vi.spyOn(component.acceptBid, 'emit');
      component.onAccept('bid-001');
      expect(spy).toHaveBeenCalledWith('bid-001');
    });

    it('should emit rejectBid', () => {
      const spy = vi.spyOn(component.rejectBid, 'emit');
      component.onReject('bid-001');
      expect(spy).toHaveBeenCalledWith('bid-001');
    });
  });
});
