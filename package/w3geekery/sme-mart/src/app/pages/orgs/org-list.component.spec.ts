import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgListComponent } from './org-list.component';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { of } from 'rxjs';

describe('OrgListComponent', () => {
  let component: OrgListComponent;
  let fixture: ComponentFixture<OrgListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgListComponent],
      providers: [
        {
          provide: ZerobiasClientApp,
          useValue: {
            getOrgs: () => of([]),
            getCurrentOrg: () => of(null),
          },
        },
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

  it('should inject ZerobiasClientApp', () => {
    const app = TestBed.inject(ZerobiasClientApp);
    expect(app).toBeTruthy();
  });

  it('should inject UserPreferencesService', () => {
    const prefs = TestBed.inject(UserPreferencesService);
    expect(prefs).toBeTruthy();
  });
});
