import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { VendorProfileService } from '../../../core/services/vendor-profile.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { VendorProfileTab } from './vendor-profile-tab.component';

describe('VendorProfileTab', () => {
  let component: VendorProfileTab;
  let fixture: ComponentFixture<VendorProfileTab>;
  let vendorProfileService: jasmine.SpyObj<VendorProfileService>;
  let zerobiasApp: jasmine.SpyObj<ZerobiasClientApp>;

  beforeEach(async () => {
    const vendorProfileServiceSpy = jasmine.createSpyObj('VendorProfileService', [
      'listProfileItems',
      'createProfileItem',
      'updateProfileItem',
      'deleteProfileItem',
    ]);

    const zerobiasAppSpy = jasmine.createSpyObj('ZerobiasClientApp', ['getCurrentOrg']);

    await TestBed.configureTestingModule({
      imports: [CommonModule, MatExpansionModule, MatSidenavModule, VendorProfileTab],
      providers: [
        { provide: VendorProfileService, useValue: vendorProfileServiceSpy },
        { provide: ZerobiasClientApp, useValue: zerobiasAppSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VendorProfileTab);
    component = fixture.componentInstance;
    vendorProfileService = TestBed.inject(VendorProfileService) as jasmine.SpyObj<VendorProfileService>;
    zerobiasApp = TestBed.inject(ZerobiasClientApp) as jasmine.SpyObj<ZerobiasClientApp>;
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
