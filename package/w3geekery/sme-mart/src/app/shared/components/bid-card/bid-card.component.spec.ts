import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BidCard, type BidCardData } from './bid-card.component';
import { makeBidCardData } from '../../../test-helpers/factories';

describe('BidCard', () => {
  let component: BidCard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BidCard],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(BidCard);
    component = fixture.componentInstance;
    component.bid = makeBidCardData();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('computed signals', () => {
    it('should compute displayName from provider_display_name', () => {
      expect(component.displayName()).toBe('Jane Smith');
    });

    it('should fallback displayName to Anonymous', () => {
      component.bid = makeBidCardData({ provider_display_name: undefined });
      expect(component.displayName()).toBe('Anonymous');
    });

    it('should compute initials from display name', () => {
      expect(component.initials()).toBe('JS');
    });

    it('should compute single initial for one-word name', () => {
      component.bid = makeBidCardData({ provider_display_name: 'Jane' });
      expect(component.initials()).toBe('J');
    });

    it('should compute statusColor from bid status', () => {
      expect(component.statusColor()).toBe('default'); // pending
      component.bid = makeBidCardData({ status: 'accepted' });
      expect(component.statusColor()).toBe('primary');
      component.bid = makeBidCardData({ status: 'rejected' });
      expect(component.statusColor()).toBe('warn');
    });

    it('should detect draft and pending states', () => {
      expect(component.isPending()).toBe(true);
      expect(component.isDraft()).toBe(false);
      component.bid = makeBidCardData({ status: 'draft' });
      expect(component.isDraft()).toBe(true);
    });
  });

  describe('buyer actions', () => {
    it('should show buyer actions when isBuyer and pending', () => {
      component.isBuyer = true;
      expect(component.showBuyerActions()).toBe(true);
    });

    it('should hide buyer actions when not pending', () => {
      component.isBuyer = true;
      component.bid = makeBidCardData({ status: 'accepted' });
      expect(component.showBuyerActions()).toBe(false);
    });

    it('should show withdraw for own pending bid', () => {
      component.isOwnBid = true;
      expect(component.showWithdraw()).toBe(true);
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

    it('should emit withdraw with bid id', () => {
      const spy = vi.spyOn(component.withdraw, 'emit');
      component.onWithdraw();
      expect(spy).toHaveBeenCalledWith('bid-001');
    });
  });
});
