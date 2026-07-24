import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { VendorProfileForm } from './vendor-profile-form.component';
import type { MarketplaceProfileItem } from '../../../core/models/marketplace-profile-item.model';

describe('VendorProfileForm', () => {
  let fixture: ComponentFixture<VendorProfileForm>;
  let component: VendorProfileForm;

  const snackBarMock = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        BrowserAnimationsModule,
        VendorProfileForm,
      ],
      providers: [
        FormBuilder,
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VendorProfileForm);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Phase 31-B: legalEntityName pre-fill from orgName', () => {
    it('pre-fills legalEntityName with orgName when create + corporate_identity', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('section', 'corporate_identity');
      fixture.componentRef.setInput('orgName', 'Acme Corp');
      fixture.detectChanges();

      const fg = component.form();
      expect(fg).toBeTruthy();
      expect(fg!.get('legalEntityName')?.value).toBe('Acme Corp');
    });

    it('does NOT overwrite legalEntityName from item.data when mode=edit', () => {
      const item: MarketplaceProfileItem = {
        id: 'item-1',
        org_id: 'org-1',
        section: 'corporate_identity',
        name: 'Existing Entry',
        description: '',
        data: JSON.stringify({
          legalEntityName: 'Existing LLC',
          businessType: '',
          foundedYear: 0,
          yearsInBusiness: 0,
          certifications: [],
          numberOfEmployees: 0,
        }),
        status: 'active',
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as MarketplaceProfileItem;

      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('section', 'corporate_identity');
      fixture.componentRef.setInput('orgName', 'Acme Corp');
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      const fg = component.form();
      expect(fg).toBeTruthy();
      expect(fg!.get('legalEntityName')?.value).toBe('Existing LLC');
    });

    it('orgName has no effect when section is not corporate_identity', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('section', 'attestation');
      fixture.componentRef.setInput('orgName', 'Acme Corp');
      fixture.detectChanges();

      const fg = component.form();
      expect(fg).toBeTruthy();
      // attestation form has no legalEntityName control at all.
      expect(fg!.get('legalEntityName')).toBeNull();
      // serviceType is empty as before.
      expect(fg!.get('serviceType')?.value).toBe('');
    });

    it('legalEntityName is empty when orgName is "" in create mode', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('section', 'corporate_identity');
      fixture.componentRef.setInput('orgName', '');
      fixture.detectChanges();

      const fg = component.form();
      expect(fg!.get('legalEntityName')?.value).toBe('');
    });
  });
});
