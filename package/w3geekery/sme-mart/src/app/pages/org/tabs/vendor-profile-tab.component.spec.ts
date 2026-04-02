import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { vi } from 'vitest';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import { VettingService } from '../../../core/services/vetting.service';
import { PipelineWriteService } from '../../../core/services/pipeline-write.service';
import { GraphqlReadService } from '../../../core/services/graphql-read.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { VendorProfileTab } from './vendor-profile-tab.component';

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
    getCurrentOrg: vi.fn().mockReturnValue({ id: 'org-1', name: 'Test Org' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, MatExpansionModule, MatSidenavModule, VendorProfileTab],
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    // Implementation pending — Task 1
  });

  it('should filter items by section', () => {
    // Implementation pending — Task 1
  });

  it('should open form in create mode', () => {
    // Implementation pending — Task 1
  });

  it('should open form in edit mode', () => {
    // Implementation pending — Task 1
  });

  it('should delete item', () => {
    // Implementation pending — Task 4
  });

  it('should show welcome card when org is empty', () => {
    // Implementation pending — Task 1 (D-14)
  });

  it('should hide welcome card after first item added', () => {
    // Implementation pending — Task 1 (D-14)
  });
});
