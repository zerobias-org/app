import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BidForm, type BidFormData } from './bid-form.component';
import { BidsService } from '../../../core/services/bids.service';
import { TEST_WR_ID, TEST_PROVIDER_USER_ID } from '../../../test-helpers/constants';

describe('BidForm', () => {
  let component: BidForm;
  let mockBidsService: { submitBid: ReturnType<typeof vi.fn> };
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  const dialogData: BidFormData = { requestId: TEST_WR_ID, providerId: TEST_PROVIDER_USER_ID };

  beforeEach(() => {
    mockBidsService = {
      submitBid: vi.fn().mockResolvedValue({ id: 'bid-new', status: 'pending' }),
    };
    mockDialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [BidForm],
      providers: [
        provideNoopAnimations(),
        { provide: BidsService, useValue: mockBidsService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });

    const fixture = TestBed.createComponent(BidForm);
    component = fixture.componentInstance;
  });

  it('should create with form controls', () => {
    expect(component).toBeTruthy();
    expect(component.form.contains('cover_letter')).toBe(true);
    expect(component.form.contains('proposed_price')).toBe(true);
    expect(component.form.contains('proposed_timeline')).toBe(true);
  });

  describe('onSubmit', () => {
    it('should call submitBid with form data and dialog data', async () => {
      component.form.patchValue({
        cover_letter: 'Our team is ready.',
        proposed_price: '5000',
        proposed_timeline: '2 weeks',
      });

      await component.onSubmit();

      expect(mockBidsService.submitBid).toHaveBeenCalledWith({
        project_id: TEST_WR_ID,
        provider_id: TEST_PROVIDER_USER_ID,
        cover_letter: 'Our team is ready.',
        proposed_price: '5000',
        proposed_timeline: '2 weeks',
      });
    });

    it('should close dialog with bid on success', async () => {
      await component.onSubmit();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ id: 'bid-new', status: 'pending' });
    });

    it('should handle empty form values as undefined', async () => {
      await component.onSubmit();
      expect(mockBidsService.submitBid).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: TEST_WR_ID,
          provider_id: TEST_PROVIDER_USER_ID,
        }),
      );
    });

    it('should not close dialog on failure', async () => {
      mockBidsService.submitBid.mockRejectedValue(new Error('Server error'));
      await component.onSubmit();
      // close is NOT called when submit fails
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should reset submitting flag on error', async () => {
      mockBidsService.submitBid.mockRejectedValue(new Error('fail'));
      await component.onSubmit();
      expect(component.submitting).toBe(false);
    });

    it('should prevent double submit', async () => {
      component.submitting = true;
      await component.onSubmit();
      expect(mockBidsService.submitBid).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog with null', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
