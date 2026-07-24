import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgListComponent } from './org-list.component';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { of } from 'rxjs';

describe('OrgListComponent', () => {
  let component: OrgListComponent;
  let fixture: ComponentFixture<OrgListComponent>;
  let mockClientApi: { danaClient: { getMeApi: () => { listMyOrgs: () => Promise<unknown[]> } } };
  let mockApp: { getWhoAmI: () => unknown; getCurrentOrgId: () => string };

  beforeEach(async () => {
    mockApp = {
      getWhoAmI: () => of({ ownerId: 'org-1', id: 'user-1' }),
      getCurrentOrgId: () => 'org-1'
    };

    mockClientApi = {
      danaClient: {
        getMeApi: () => ({
          listMyOrgs: () => Promise.resolve([])
        })
      }
    };

    await TestBed.configureTestingModule({
      imports: [OrgListComponent],
      providers: [
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: ZerobiasClientApp, useValue: mockApp },
        {
          provide: UserPreferencesService,
          useValue: {
            getOrgListViewMode: () => 'cards',
            setOrgListViewMode: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with allOrgs signal', () => {
    const allOrgs = component.allOrgs();
    expect(Array.isArray(allOrgs)).toBe(true);
  });

  it('should expose a getDomain helper that prefers domains over supportEmail', () => {
    expect(component.getDomain({ id: 'a', name: 'A', domains: ['w3geekery.com'] })).toBe('@w3geekery.com');
    expect(component.getDomain({ id: 'b', name: 'B', supportEmail: 'help@example.com' })).toBe('help@example.com');
    expect(component.getDomain({ id: 'c', name: 'C' })).toBe('');
  });

  it('should have filteredOrgs computed signal', () => {
    const filtered = component.filteredOrgs();
    expect(Array.isArray(filtered)).toBe(true);
  });
});
