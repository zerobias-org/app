import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectDetail } from './project-detail.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ProjectContextService } from '../../core/services/project-context.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { makeSmeMartProject } from '../../test-helpers/factories';
import { Subject } from 'rxjs';

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockProjectService: any;
  let mockProjectContext: any;
  let mockDialog: any;
  let mockSnackBar: any;
  let mockImpersonation: any;
  let refreshSubject: Subject<void>;

  beforeEach(async () => {
    refreshSubject = new Subject<void>();

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
    };

    mockActivatedRoute = {
      snapshot: {
        params: { projId: 'proj-123' },
      },
      firstChild: {
        snapshot: {
          url: [{ path: 'overview' }],
        },
      },
    };

    mockProjectService = {
      getProject: jasmine.createSpy('getProject').and.resolveTo(
        makeSmeMartProject({ id: 'proj-123', name: 'Test Project' })
      ),
      updateProject: jasmine.createSpy('updateProject').and.resolveTo(
        makeSmeMartProject({ id: 'proj-123', status: 'completed' })
      ),
    };

    mockProjectContext = {
      project: jasmine.createSpy('project').and.returnValue(
        makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' })
      ),
      setProject: jasmine.createSpy('setProject'),
      setCurrentUserId: jasmine.createSpy('setCurrentUserId'),
      engagementId: jasmine.createSpy('engagementId').and.returnValue('eng-123'),
      engagementName: jasmine.createSpy('engagementName').and.returnValue('Test Engagement'),
      projectName: jasmine.createSpy('projectName').and.returnValue('Test Project'),
      status: jasmine.createSpy('status').and.returnValue('active'),
      clear: jasmine.createSpy('clear'),
      refresh$: refreshSubject.asObservable(),
    };

    mockDialog = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => ({
          toPromise: () => Promise.resolve({ notes: 'Test completion' }),
        }),
      }),
    };

    mockSnackBar = {
      open: jasmine.createSpy('open'),
    };

    mockImpersonation = {
      effectiveUserId: jasmine.createSpy('effectiveUserId').and.returnValue('user-123'),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SmeMartProjectService, useValue: mockProjectService },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ImpersonationService, useValue: mockImpersonation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canCompletePilot computed', () => {
    it('should return true when projectType=pilot and status!=completed', () => {
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'active' })
      );

      // Re-create component to update the computed
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: ImpersonationService, useValue: mockImpersonation },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canCompletePilot()).toBe(true);
    });

    it('should return false when projectType=rfp', () => {
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(
        makeSmeMartProject({ projectType: 'rfp', status: 'active' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: ImpersonationService, useValue: mockImpersonation },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canCompletePilot()).toBe(false);
    });

    it('should return false when status=completed', () => {
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'completed' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: ImpersonationService, useValue: mockImpersonation },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canCompletePilot()).toBe(false);
    });
  });

  describe('completePilot', () => {
    it('should open ProjectCompletionDialogComponent', async () => {
      await component.completePilot();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should pass project data to dialog', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot' });
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(project);

      await component.completePilot();

      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1].data.project).toEqual(project);
    });

    it('should set isCompletingPilot during completion', async () => {
      // Mock a delayed dialog close
      mockDialog.open = jasmine.createSpy('open').and.returnValue({
        afterClosed: () => ({
          toPromise: () => new Promise(resolve => setTimeout(() => resolve({ notes: 'Test' }), 10)),
        }),
      });

      const completionPromise = component.completePilot();
      expect(component.isCompletingPilot()).toBe(true);

      await completionPromise;
      expect(component.isCompletingPilot()).toBe(false);
    });

    it('should call updateProject with status=completed on dialog confirm', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(project);

      await component.completePilot();

      expect(mockProjectService.updateProject).toHaveBeenCalledWith('proj-123', { status: 'completed' });
    });

    it('should update project context on successful completion', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(project);

      await component.completePilot();

      expect(mockProjectContext.setProject).toHaveBeenCalled();
    });

    it('should show success snackbar on completion', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(project);

      await component.completePilot();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Pilot marked complete', 'Dismiss', { duration: 3000 });
    });

    it('should handle dialog cancellation gracefully', async () => {
      mockDialog.open = jasmine.createSpy('open').and.returnValue({
        afterClosed: () => ({
          toPromise: () => Promise.resolve(undefined), // User cancelled
        }),
      });

      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(project);

      await component.completePilot();

      // Should not call updateProject when cancelled
      expect(mockProjectService.updateProject).not.toHaveBeenCalled();
    });

    it('should show error snackbar on failure', async () => {
      mockProjectService.updateProject = jasmine.createSpy('updateProject').and.rejectWith(new Error('API error'));

      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(project);

      await component.completePilot();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to mark pilot complete', 'Dismiss', { duration: 5000 });
    });

    it('should not proceed if projectType is not pilot', async () => {
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(
        makeSmeMartProject({ projectType: 'rfp' })
      );

      await component.completePilot();

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not proceed if project is already completed', async () => {
      mockProjectContext.project = jasmine.createSpy('project').and.returnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'completed' })
      );

      await component.completePilot();

      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('should load project on init', async () => {
      await component.ngOnInit();

      expect(mockProjectService.getProject).toHaveBeenCalledWith('proj-123');
    });

    it('should set loading to false after loading', async () => {
      expect(component.loading()).toBe(true);

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
    });

    it('should redirect if project not found', async () => {
      mockProjectService.getProject = jasmine.createSpy('getProject').and.resolveTo(null);

      await component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });

    it('should handle load error gracefully', async () => {
      mockProjectService.getProject = jasmine.createSpy('getProject').and.rejectWith(new Error('API error'));

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
      expect(mockSnackBar.open).toHaveBeenCalled();
    });
  });

  describe('goToEngagement', () => {
    it('should navigate to engagement detail', () => {
      component.goToEngagement();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/engagements', 'eng-123']);
    });

    it('should navigate to engagements list if no engagementId', () => {
      mockProjectContext.engagementId = jasmine.createSpy('engagementId').and.returnValue(null);

      component.goToEngagement();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });
  });
});
