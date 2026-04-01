import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgListComponent } from './org-list.component';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { GraphqlReadService } from '../../core/services/graphql-read.service';
import { of } from 'rxjs';

describe('OrgListComponent', () => {
  let component: OrgListComponent;
  let fixture: ComponentFixture<OrgListComponent>;
  let mockGraphqlRead: any;
  let mockClientApi: any;
  let mockApp: any;

  beforeEach(async () => {
    mockGraphqlRead = {
      query: () => Promise.resolve({
        items: [],
        page: { pageNumber: 1, pageSize: 1, totalCount: 0 }
      })
    };

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
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
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

  it('should have orgMetrics signal', () => {
    const metrics = component.orgMetrics();
    expect(typeof metrics).toBe('object');
  });

  it('should have orgsWithMetadata computed signal', () => {
    const withMetadata = component.orgsWithMetadata();
    expect(Array.isArray(withMetadata)).toBe(true);
  });

  it('should have filteredOrgs computed signal', () => {
    const filtered = component.filteredOrgs();
    expect(Array.isArray(filtered)).toBe(true);
  });
});
