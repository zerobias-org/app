import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { OrgDetailComponent } from './org-detail.component';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-angular-client';
import { of } from 'rxjs';

describe('OrgDetailComponent', () => {
  let component: OrgDetailComponent;
  let fixture: ComponentFixture<OrgDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['orgId', 'test-org-id']])),
          },
        },
        {
          provide: ZerobiasClientApp,
          useValue: {
            getOrg: () => of(null),
            getCurrentOrg: () => of(null),
            hydraClient: {
              getOrgApi: () => ({
                listOrgMembers: () => of([]),
                listGroups: () => of([]),
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ActivatedRoute', () => {
    const route = TestBed.inject(ActivatedRoute);
    expect(route).toBeTruthy();
  });

  it('should inject ZerobiasClientApp', () => {
    const app = TestBed.inject(ZerobiasClientApp);
    expect(app).toBeTruthy();
  });
});
