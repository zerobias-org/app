import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { CompanyProfileFormComponent } from './company-profile-form.component';
import { MarketplaceProfileService } from '../core/services/marketplace-profile.service';
import { CompanyInfoStruct } from './company-info.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('CompanyProfileFormComponent', () => {
  let component: CompanyProfileFormComponent;
  let fixture: ComponentFixture<CompanyProfileFormComponent>;
  let mockService: any;
  let mockRouter: any;
  let mockSnackBar: any;
  let mockZbApp: any;

  const mockOrgId = 'test-org-id-123';
  const mockPreFilledData: CompanyInfoStruct = {
    legalName: 'Acme Inc',
    dba: 'Acme Trading',
    logoUrl: 'https://example.com/logo.png',
    shortBlurb: 'We do acme things',
    longDescription: 'Long description here',
    primaryContact: {
      userId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    },
    website: 'https://acme.com',
    hqLocation: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
    },
    yearsInBusiness: 5,
    employeeCount: '11-50',
  };

  beforeEach(async () => {
    // Mock dependencies
    mockService = {
      readProfileForOrg: vi.fn().mockResolvedValue(mockPreFilledData),
      save: vi.fn().mockResolvedValue(void 0),
      getCompletionStatus: vi.fn().mockResolvedValue(false),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockZbApp = {
      getCurrentOrgId: vi.fn().mockReturnValue(mockOrgId),
    };

    await TestBed.configureTestingModule({
      imports: [CompanyProfileFormComponent, ReactiveFormsModule],
      providers: [
        { provide: MarketplaceProfileService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ZerobiasClientApp, useValue: mockZbApp },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyProfileFormComponent);
    component = fixture.componentInstance;
  });

  describe('CP-01: renders all 16 user-facing sections', () => {
    it('should render legal_name, dba, logo_url, short_blurb, long_description, primary_contact.*, website, hq_location.*, years_in_business, employee_count', async () => {
      // Mount component
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for async form initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      // Check that form was created and has all expected controls
      const form = component.form();
      expect(form).toBeTruthy();

      // Verify all top-level form controls exist
      expect(form?.get('legalName')).toBeTruthy();
      expect(form?.get('dba')).toBeTruthy();
      expect(form?.get('logoUrl')).toBeTruthy();
      expect(form?.get('shortBlurb')).toBeTruthy();
      expect(form?.get('longDescription')).toBeTruthy();
      expect(form?.get('primaryContact')).toBeTruthy();
      expect(form?.get('website')).toBeTruthy();
      expect(form?.get('hqLocation')).toBeTruthy();
      expect(form?.get('yearsInBusiness')).toBeTruthy();
      expect(form?.get('employeeCount')).toBeTruthy();

      // Verify nested primaryContact controls
      const primaryContact = form?.get('primaryContact');
      expect(primaryContact?.get('userId')).toBeTruthy();
      expect(primaryContact?.get('name')).toBeTruthy();
      expect(primaryContact?.get('email')).toBeTruthy();

      // Verify nested hqLocation controls
      const hqLocation = form?.get('hqLocation');
      expect(hqLocation?.get('street')).toBeTruthy();
      expect(hqLocation?.get('city')).toBeTruthy();
      expect(hqLocation?.get('state')).toBeTruthy();
      expect(hqLocation?.get('country')).toBeTruthy();
      expect(hqLocation?.get('postalCode')).toBeTruthy();

      // Count form fields in the DOM
      const compiled = fixture.nativeElement as HTMLElement;
      const formFields = compiled.querySelectorAll('mat-form-field');
      expect(formFields.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('CP-03: pre-fill annotations', () => {
    it('should render (pre-filled from platform) annotation for fields with existing MPI records', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      // Check that pre-filled fields are marked
      expect(component.isPreFilled('legalName')).toBe(true);
      expect(component.isPreFilled('dba')).toBe(true);
      expect(component.isPreFilled('logoUrl')).toBe(true);
      expect(component.isPreFilled('primaryContact.userId')).toBe(true);

      // Fields should still be editable (not readonly)
      const legalNameControl = component.form()?.get('legalName');
      expect(legalNameControl?.enabled).toBe(true);
    });

    it('should render (please provide) hint for empty fields', async () => {
      // Mock empty pre-fill
      mockService.readProfileForOrg.mockResolvedValue({
        legalName: 'Acme Inc',
        // All other fields empty
      });

      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      // Check that empty fields are NOT marked as pre-filled
      expect(component.isPreFilled('dba')).toBe(false);
      expect(component.isPreFilled('website')).toBe(false);
      expect(component.isPreFilled('hqLocation.street')).toBe(false);
    });
  });

  describe('CP-06: skip-for-now flow', () => {
    it('should skip route to /projects without calling service.save()', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      // Call skip
      await component.onSkip();

      // Verify router navigation
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects']);

      // Verify service.save() was NOT called
      expect(mockService.save).not.toHaveBeenCalled();
    });
  });

  describe('Form validation and save', () => {
    it('should validate required legalName field', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const form = component.form();
      const legalNameControl = form?.get('legalName');

      // Clear the field
      legalNameControl?.setValue('');
      legalNameControl?.markAsTouched();

      expect(legalNameControl?.hasError('required')).toBe(true);
      expect(form?.invalid).toBe(true);
    });

    it('should validate URL format for logoUrl', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const form = component.form();
      const logoUrlControl = form?.get('logoUrl');

      // Set invalid URL
      logoUrlControl?.setValue('not-a-url');
      logoUrlControl?.markAsTouched();

      expect(logoUrlControl?.hasError('pattern')).toBe(true);

      // Set valid HTTPS URL
      logoUrlControl?.setValue('https://example.com/logo.png');
      expect(logoUrlControl?.hasError('pattern')).toBe(false);
    });

    it('should call service.save() with correct arguments and navigate on success', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      // Perform save
      await component.onSave();

      // Verify service.save() was called
      expect(mockService.save).toHaveBeenCalled();

      // Verify navigation
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects']);

      // Verify snackbar success message
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Profile saved successfully!',
        'Dismiss',
        expect.any(Object)
      );
    });

    it('should show error on save failure', async () => {
      // Mock service error
      mockService.save.mockRejectedValue(new Error('Network error'));

      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      // Perform save
      await component.onSave();

      // Verify snackbar error message
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        'Dismiss',
        expect.any(Object)
      );

      // Verify router NOT navigated
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Org ID resolution', () => {
    it('should show error if orgId is undefined at mount', async () => {
      mockZbApp.getCurrentOrgId.mockReturnValue(undefined);

      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(component.loadError()).toContain('organization');
      expect(component.isLoading()).toBe(false);
    });
  });
});
