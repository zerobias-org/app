import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import { VettingService } from '../../../core/services/vetting.service';
import { PipelineWriteService } from '../../../core/services/pipeline-write.service';
import { GraphqlReadService } from '../../../core/services/graphql-read.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { VendorProfileTab } from './vendor-profile-tab.component';
import { VendorProfileForm } from './vendor-profile-form.component';
import { By } from '@angular/platform-browser';
import type { MarketplaceProfileItem } from '../../../core/models/marketplace-profile-item.model';

describe('VendorProfileTab', () => {
  let component: VendorProfileTab;
  let fixture: ComponentFixture<VendorProfileTab>;

  const vendorProfileServiceMock = {
    listProfileItems: vi.fn().mockResolvedValue([]),
    createProfileItem: vi.fn(),
    updateProfileItem: vi.fn(),
    deleteProfileItem: vi.fn(),
    getProfileItemReferenceCount: vi.fn().mockResolvedValue(0),
  };

  const vettingServiceMock = {
    listVettingItems: vi.fn().mockResolvedValue([]),
  };

  const zerobiasAppMock = {
    getCurrentOrg: vi.fn().mockReturnValue(of({ id: 'org-1', name: 'Test Org' })),
  };

  beforeEach(async () => {
    vendorProfileServiceMock.listProfileItems.mockResolvedValue([]);
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
        { provide: VettingService, useValue: vettingServiceMock },
        { provide: ZerobiasClientApp, useValue: zerobiasAppMock },
        { provide: ZerobiasClientApi, useValue: {} },
        { provide: PipelineWriteService, useValue: {} },
        { provide: GraphqlReadService, useValue: {} },
        { provide: ImpersonationService, useValue: {} },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VendorProfileTab);
    component = fixture.componentInstance;
  });

  function makeItem(section: MarketplaceProfileItem['section'], id: string): MarketplaceProfileItem {
    return {
      id,
      org_id: 'org-1',
      section,
      name: `item-${id}`,
      description: '',
      data: '{}',
      status: 'active',
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as MarketplaceProfileItem;
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
    vendorProfileServiceMock.listProfileItems.mockResolvedValueOnce([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const welcome = fixture.debugElement.nativeElement.querySelector('.welcome-card');
    expect(welcome).toBeTruthy();
  });

  it('welcome card renders regardless of items count (1 item)', async () => {
    vendorProfileServiceMock.listProfileItems.mockResolvedValueOnce([
      makeItem('corporate_identity', 'a'),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const welcome = fixture.debugElement.nativeElement.querySelector('.welcome-card');
    expect(welcome).toBeTruthy();
    expect(component.items().length).toBe(1);
  });

  it('welcome card renders regardless of items count (N items)', async () => {
    vendorProfileServiceMock.listProfileItems.mockResolvedValueOnce([
      makeItem('corporate_identity', 'a'),
      makeItem('insurance', 'b'),
      makeItem('attestation', 'c'),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const welcome = fixture.debugElement.nativeElement.querySelector('.welcome-card');
    expect(welcome).toBeTruthy();
    expect(component.items().length).toBe(3);
  });

  it('does not expose a welcomeCardDismissed signal', () => {
    expect((component as unknown as Record<string, unknown>)['welcomeCardDismissed']).toBeUndefined();
  });
});
