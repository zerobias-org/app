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
import type { OrgProfileRecord } from '../../../core/models/vendor-profile.model';

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

  describe('Phase 31-B: legalName pre-fill from orgName', () => {
    it('pre-fills legalName with orgName when create + corporate_identity', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('section', 'corporate_identity');
      fixture.componentRef.setInput('orgName', 'Acme Corp');
      fixture.detectChanges();

      const fg = component.form();
      expect(fg).toBeTruthy();
      expect(fg!.get('legalName')?.value).toBe('Acme Corp');
    });

    it('does NOT overwrite legalName from the edited row when mode=edit', () => {
      // The typed row is read field-by-field; there is no `data` blob to JSON.parse.
      const item: OrgProfileRecord = {
        id: 'org-profile-1',
        orgId: 'org-1',
        legalName: 'Existing LLC',
        dba: null,
        tagline: null,
        shortDescription: null,
        longDescription: null,
        website: null,
        logoUrl: null,
        foundedYear: null,
        businessClassification: null,
        employeeCount: null,
        primaryContactUserId: null,
        verified: false,
        verificationSource: null,
        verifiedAt: null,
        verifiedBy: null,
        verificationExpiresAt: null,
      };

      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('section', 'corporate_identity');
      fixture.componentRef.setInput('orgName', 'Acme Corp');
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      const fg = component.form();
      expect(fg).toBeTruthy();
      expect(fg!.get('legalName')?.value).toBe('Existing LLC');
    });

    it('orgName has no effect when section is not corporate_identity', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('section', 'attestation');
      fixture.componentRef.setInput('orgName', 'Acme Corp');
      fixture.detectChanges();

      const fg = component.form();
      expect(fg).toBeTruthy();
      // attestation maps to ServiceCapability, which has no legalName control at all.
      expect(fg!.get('legalName')).toBeNull();
      // serviceSegmentId (was the free-text serviceType) is empty as before.
      expect(fg!.get('serviceSegmentId')?.value).toBe('');
    });

    it('legalName is empty when orgName is "" in create mode', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('section', 'corporate_identity');
      fixture.componentRef.setInput('orgName', '');
      fixture.detectChanges();

      const fg = component.form();
      expect(fg!.get('legalName')?.value).toBe('');
    });
  });
});
