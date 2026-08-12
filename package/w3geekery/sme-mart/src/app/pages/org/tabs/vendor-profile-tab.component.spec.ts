import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import { PipelineWriteService } from '../../../core/services/pipeline-write.service';
import { GraphqlReadService } from '../../../core/services/graphql-read.service';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { VendorProfileTab } from './vendor-profile-tab.component';
import { VendorProfileForm } from './vendor-profile-form.component';
import { By } from '@angular/platform-browser';
import type {
  InsuranceCoverageRecord,
  OrgProfileRecord,
  ServiceCapabilityRecord,
  VendorProfileBundle,
} from '../../../core/models/vendor-profile.model';

const EMPTY_BUNDLE: VendorProfileBundle = {
  corporate_identity: null,
  financial: null,
  attestation: [],
  insurance: [],
  reference: [],
  personnel: [],
};

describe('VendorProfileTab', () => {
  let component: VendorProfileTab;
  let fixture: ComponentFixture<VendorProfileTab>;

  const vendorProfileServiceMock = {
    loadBundle: vi.fn().mockResolvedValue(EMPTY_BUNDLE),
    createRow: vi.fn(),
    updateRow: vi.fn(),
    upsertSingleton: vi.fn(),
    deleteRow: vi.fn(),
  };

  const zerobiasAppMock = {
    getCurrentOrg: vi.fn().mockReturnValue(of({ id: 'org-1', name: 'Test Org' })),
  };

  beforeEach(async () => {
    vendorProfileServiceMock.loadBundle.mockResolvedValue(EMPTY_BUNDLE);
    zerobiasAppMock.getCurrentOrg.mockReturnValue(of({ id: 'org-1', name: 'Test Org' }));

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatExpansionModule,
        MatSidenavModule,
        VendorProfileTab,
      ],
      providers: [
        { provide: VendorProfileService, useValue: vendorProfileServiceMock },
        { provide: ZerobiasClientApp, useValue: zerobiasAppMock },
        { provide: ZerobiasClientApi, useValue: {} },
        { provide: PipelineWriteService, useValue: {} },
        { provide: GraphqlReadService, useValue: {} },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VendorProfileTab);
    component = fixture.componentInstance;
  });

  const provenance = {
    verified: false,
    verificationSource: null,
    verifiedAt: null,
    verifiedBy: null,
    verificationExpiresAt: null,
  };

  function makeIdentity(id: string): OrgProfileRecord {
    return {
      id, orgId: 'org-1', legalName: `org-${id}`, dba: null, tagline: null,
      shortDescription: null, longDescription: null, website: null, logoUrl: null,
      foundedYear: null, businessClassification: null, employeeCount: null,
      primaryContactUserId: null, ...provenance,
    };
  }

  function makeInsurance(id: string): InsuranceCoverageRecord {
    return {
      id, orgId: 'org-1', carrier: `carrier-${id}`, policyNumber: null, coverageType: null,
      coverageAmount: null, currency: null, effectiveDate: null, expiresAt: null,
      certificateUrl: null, ...provenance,
    };
  }

  function makeCapability(id: string): ServiceCapabilityRecord {
    return {
      id, orgId: 'org-1', serviceSegmentId: null, yearsExperience: null,
      clientCount: null, avgProjectDuration: null, ...provenance,
    };
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('currentOrgName signal populates from getCurrentOrg() subscription', async () => {
    fixture.detectChanges();
    // Allow microtasks from loadItems() to settle.
    await fixture.whenStable();
    expect(component.currentOrgName()).toBe('Test Org');
    expect(component.currentOrgId()).toBe('org-1');
  });

  it('currentOrgName is passed to the child VendorProfileForm via orgName input', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Form only mounts when the sidenav is open (rebuilds per section to avoid
    // stale FormGroup carrying controls from a previous section).
    component.openAddForm('corporate_identity');
    fixture.detectChanges();

    const formDe = fixture.debugElement.query(By.directive(VendorProfileForm));
    expect(formDe).toBeTruthy();
    const formCmp = formDe.componentInstance as VendorProfileForm;
    expect(formCmp.orgName()).toBe('Test Org');
  });

  it('welcome card renders regardless of items count (0 items)', async () => {
    vendorProfileServiceMock.loadBundle.mockResolvedValueOnce(EMPTY_BUNDLE);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const welcome = fixture.debugElement.nativeElement.querySelector('.welcome-card');
    expect(welcome).toBeTruthy();
  });

  it('welcome card renders regardless of items count (1 item)', async () => {
    vendorProfileServiceMock.loadBundle.mockResolvedValueOnce({
      ...EMPTY_BUNDLE,
      corporate_identity: makeIdentity('a'),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const welcome = fixture.debugElement.nativeElement.querySelector('.welcome-card');
    expect(welcome).toBeTruthy();
    expect(component.allRows().length).toBe(1);
  });

  it('welcome card renders regardless of items count (N items)', async () => {
    vendorProfileServiceMock.loadBundle.mockResolvedValueOnce({
      ...EMPTY_BUNDLE,
      corporate_identity: makeIdentity('a'),
      insurance: [makeInsurance('b')],
      attestation: [makeCapability('c')],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const welcome = fixture.debugElement.nativeElement.querySelector('.welcome-card');
    expect(welcome).toBeTruthy();
    expect(component.allRows().length).toBe(3);
  });

  it('does not expose a welcomeCardDismissed signal', () => {
    expect((component as unknown as Record<string, unknown>)['welcomeCardDismissed']).toBeUndefined();
  });
});
