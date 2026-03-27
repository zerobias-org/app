import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcceptBidDialog, type AcceptBidDialogData } from './accept-bid-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const DIALOG_DATA: AcceptBidDialogData = {
  bidId: 'bid-001',
  providerName: 'Jane Smith',
  proposedPrice: '15000',
  proposedTimeline: '4-6 weeks',
  compliance: { met: 8, partially_met: 1, not_met: 0, not_applicable: 1, planned: 0, total: 10, responded: 10 },
  otherBidCount: 2,
};

describe('AcceptBidDialog', () => {
  let component: AcceptBidDialog;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [AcceptBidDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: DIALOG_DATA },
      ],
    });

    const fixture = TestBed.createComponent(AcceptBidDialog);
    component = fixture.componentInstance;
  });

  it('should have access to dialog data', () => {
    expect(component.data.providerName).toBe('Jane Smith');
    expect(component.data.otherBidCount).toBe(2);
  });

  it('should close with confirmed=true on confirm', () => {
    component.onConfirm();
    expect(dialogRef.close).toHaveBeenCalledWith({ confirmed: true });
  });

  it('should set accepting flag on confirm', () => {
    expect(component.accepting()).toBe(false);
    component.onConfirm();
    expect(component.accepting()).toBe(true);
  });

  it('should close with confirmed=false on cancel', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith({ confirmed: false });
  });
});
