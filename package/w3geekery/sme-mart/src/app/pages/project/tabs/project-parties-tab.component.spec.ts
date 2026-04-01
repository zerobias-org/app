import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectPartiesTabComponent } from './project-parties-tab.component';
import { BoundaryService } from '../../../core/services/boundary.service';

describe('ProjectPartiesTabComponent', () => {
  let component: ProjectPartiesTabComponent;
  let fixture: ComponentFixture<ProjectPartiesTabComponent>;
  let mockBoundaryService: any;

  beforeEach(async () => {
    mockBoundaryService = {
      listBoundaryParties: async () => [],
      listBoundaryPartyRoles: async () => [],
      listBoundaryTeams: async () => [],
      getBoundary: async () => null,
    };

    await TestBed.configureTestingModule({
      imports: [ProjectPartiesTabComponent],
      providers: [
        { provide: BoundaryService, useValue: mockBoundaryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectPartiesTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty parties', () => {
    expect(component.boundaryParties()).toEqual({});
  });

  it('should have partiesLoading signal', () => {
    expect(typeof component.partiesLoading()).toBe('boolean');
  });

  it('should compute empty boundaryIds from project without boundaryIds', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        id: 'proj-1',
      });
    });

    expect(component.boundaryIds()).toEqual([]);
  });

  it('should compute boundaryIds from project.boundaryIds', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        id: 'proj-1',
        boundaryIds: ['boundary-1', 'boundary-2'],
      });
    });

    expect(component.boundaryIds()).toEqual(['boundary-1', 'boundary-2']);
  });

  it('should display empty state when boundaryIds is empty', async () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        id: 'proj-1',
        boundaryIds: [],
      });
    });

    component.partiesLoading.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    const emptyState = fixture.debugElement.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display loading spinner when partiesLoading is true', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        id: 'proj-1',
        boundaryIds: ['boundary-1'],
      });
    });

    component.partiesLoading.set(true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should compute empty boundaryGroups when no boundaries loaded', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        id: 'proj-1',
        boundaryIds: [],
      });
    });

    expect(component.boundaryGroups()).toEqual([]);
  });

  it('should handle error gracefully when loading parties fails', async () => {
    mockBoundaryService.listBoundaryParties = async () => {
      throw new Error('API error');
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        id: 'proj-1',
        boundaryIds: ['boundary-1'],
      });
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Should not crash, just show loading complete
    expect(component.partiesLoading()).toBe(false);
  });
});
