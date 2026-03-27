import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VettingItemDialogComponent, type VettingItemDialogData } from './vetting-item-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('VettingItemDialogComponent', () => {
  let component: VettingItemDialogComponent;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [VettingItemDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { direction: 'buyer_requires' } as VettingItemDialogData },
      ],
    });

    const fixture = TestBed.createComponent(VettingItemDialogComponent);
    component = fixture.componentInstance;
  });

  it('should have form with required name field', () => {
    expect(component.form.get('name')?.hasError('required')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should be valid when name is filled', () => {
    component.form.patchValue({ name: 'HIPAA BAA' });
    expect(component.form.valid).toBe(true);
  });

  it('should default category to conditional', () => {
    expect(component.form.get('category')?.value).toBe('conditional');
  });

  it('should default evidence_type to document', () => {
    expect(component.form.get('evidence_type')?.value).toBe('document');
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('should close with CreateVettingItemRequest on valid submit', () => {
    component.form.patchValue({
      name: 'HIPAA BAA',
      description: 'Business Associate Agreement',
      category: 'conditional',
      vetting_type: 'compliance',
      evidence_type: 'document',
    });

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({
      name: 'HIPAA BAA',
      description: 'Business Associate Agreement',
      category: 'conditional',
      vetting_type: 'compliance',
      evidence_type: 'document',
      direction: 'buyer_requires',
    }));
  });
});
