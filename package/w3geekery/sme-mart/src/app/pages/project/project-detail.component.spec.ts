import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';  // used for TestBed.inject()
import { vi } from 'vitest';
import { ProjectDetail } from './project-detail.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { SmeMartResourceService } from '../../core/services/sme-mart-resource.service';
import { VettingService } from '../../core/services/vetting.service';
import { ProjectContextService } from '../../core/services/project-context.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeSmeMartProject } from '../../test-helpers/factories';
import { Subject, of } from 'rxjs';

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockProjectService: any;
  let mockResourceService: any;
  let mockVettingService: any;
  let mockProjectContext: any;
  let mockDialog: any;
  let mockImpersonation: any;
  let mockZerobiasClientApi: any;
  let refreshSubject: Subject<void>;
  let snackBarOpenSpy: ReturnType<typeof vi.spyOn>;
  let vettingSetSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    refreshSubject = new Subject<void>();

    mockRouter = {
      navigate: vi.fn(),
      navigateByUrl: vi.fn(),
      events: of({}),
      createUrlTree: vi.fn().mockReturnValue({ toString: () => '/test' }),
      serializeUrl: vi.fn().mockReturnValue('/test'),
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
      getProject: vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'proj-123', name: 'Test Project' })
      ),
      updateProject: vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'proj-123', status: 'completed' })
      ),
      createProject: vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'proj-456', name: 'Promoted Project', projectType: 'project', status: 'draft' })
      ),
    };

    mockResourceService = {
      linkResources: vi.fn().mockResolvedValue(undefined),
    };

    mockVettingService = {
      pilotCompletionSuggestion: vi.fn().mockReturnValue(null),
      setPilotCompletionSuggestion: vi.fn(),
      clearPilotCompletionSuggestion: vi.fn(),
    };

    mockProjectContext = {
      project: vi.fn().mockReturnValue(
        makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' })
      ),
      setProject: vi.fn(),
      setCurrentUserId: vi.fn(),
      engagementId: vi.fn().mockReturnValue('eng-123'),
      engagementName: vi.fn().mockReturnValue('Test Engagement'),
      projectName: vi.fn().mockReturnValue('Test Project'),
      status: vi.fn().mockReturnValue('active'),
      clear: vi.fn(),
      refresh$: refreshSubject.asObservable(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of({ notes: 'Test completion' })),
      }),
    };

    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('user-123'),
    };

    mockZerobiasClientApi = {
      platformClient: vi.fn().mockReturnValue({}),
      hubClient: vi.fn().mockReturnValue({}),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SmeMartProjectService, useValue: mockProjectService },
        { provide: SmeMartResourceService, useValue: mockResourceService },
        { provide: VettingService, useValue: mockVettingService },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;

    // Spy on the component's actual injected services (standalone component may get its own instances)
    snackBarOpenSpy = vi.spyOn((component as any).snackBar, 'open').mockReturnValue({ onAction: () => of({}) } as any);
    vettingSetSpy = vi.spyOn((component as any).vetting, 'setPilotCompletionSuggestion');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canCompletePilot computed', () => {
    it('should return true when projectType=pilot and status!=completed', () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
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
          { provide: SmeMartResourceService, useValue: mockResourceService },
          { provide: VettingService, useValue: mockVettingService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ImpersonationService, useValue: mockImpersonation },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canCompletePilot()).toBe(true);
    });

    it('should return false when projectType=rfp', () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'rfp', status: 'active' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: SmeMartResourceService, useValue: mockResourceService },
          { provide: VettingService, useValue: mockVettingService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ImpersonationService, useValue: mockImpersonation },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canCompletePilot()).toBe(false);
    });

    it('should return false when status=completed', () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'completed' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: SmeMartResourceService, useValue: mockResourceService },
          { provide: VettingService, useValue: mockVettingService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ImpersonationService, useValue: mockImpersonation },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
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
      mockProjectContext.project = vi.fn().mockReturnValue(project);

      await component.completePilot();

      const callArgs = mockDialog.open.mock.lastCall;
      expect(callArgs[1].data.project).toEqual(project);
    });

    it('should set isCompletingPilot during completion', async () => {
      // Mock a delayed dialog close
      mockDialog.open = vi.fn().mockReturnValue({
        afterClosed: () => of({ notes: 'Test' }),
      });

      const completionPromise = component.completePilot();
      expect(component.isCompletingPilot()).toBe(true);

      await completionPromise;
      expect(component.isCompletingPilot()).toBe(false);
    });

    it('should call updateProject with status=completed on dialog confirm', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = vi.fn().mockReturnValue(project);

      await component.completePilot();

      expect(mockProjectService.updateProject).toHaveBeenCalledWith('proj-123', { status: 'completed' });
    });

    it('should update project context on successful completion', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = vi.fn().mockReturnValue(project);

      await component.completePilot();

      expect(mockProjectContext.setProject).toHaveBeenCalled();
    });

    it('should show success snackbar on completion', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = vi.fn().mockReturnValue(project);

      // Set dialog to return completion data
      mockDialog.open = vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of({ notes: 'Test notes' })),
      });

      // Configure project service to return completed project
      mockProjectService.updateProject = vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'completed' })
      );

      await component.completePilot();

      expect(snackBarOpenSpy).toHaveBeenCalledWith('Pilot marked complete', 'Dismiss', { duration: 3000 });
    });

    it('should handle dialog cancellation gracefully', async () => {
      mockDialog.open = vi.fn().mockReturnValue({
        afterClosed: () => of(undefined), // User cancelled
      });

      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = vi.fn().mockReturnValue(project);

      await component.completePilot();

      // Should not call updateProject when cancelled
      expect(mockProjectService.updateProject).not.toHaveBeenCalled();
    });

    it('should show error snackbar on failure', async () => {
      const project = makeSmeMartProject({ id: 'proj-123', projectType: 'pilot', status: 'active' });
      mockProjectContext.project = vi.fn().mockReturnValue(project);

      // Set up dialog to return completion data
      mockDialog.open = vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of({ notes: 'Test notes' })),
      });

      // Configure project service to reject
      mockProjectService.updateProject = vi.fn().mockRejectedValue(new Error('API error'));

      await component.completePilot();

      expect(snackBarOpenSpy).toHaveBeenCalledWith('Failed to mark pilot complete', 'Dismiss', { duration: 5000 });
    });

    it('should not proceed if projectType is not pilot', async () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'rfp' })
      );

      await component.completePilot();

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not proceed if project is already completed', async () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
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
      mockProjectService.getProject = vi.fn().mockResolvedValue(null);

      await component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });

    it('should handle load error gracefully', async () => {
      // Configure service to reject on getProject
      mockProjectService.getProject = vi.fn().mockRejectedValue(new Error('API error'));

      await component.ngOnInit();

      expect(component.loading()).toBe(false);

      expect(snackBarOpenSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load project'), 'Dismiss', { duration: 5000 });
    });
  });

  describe('goToEngagement', () => {
    it('should navigate to engagement detail', () => {
      component.goToEngagement();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/engagements', 'eng-123']);
    });

    it('should navigate to engagements list if no engagementId', () => {
      mockProjectContext.engagementId = vi.fn().mockReturnValue(null);

      component.goToEngagement();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });
  });

  describe('canPromote computed', () => {
    it('should return true when projectType=pilot and status=completed', () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'completed' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: SmeMartResourceService, useValue: mockResourceService },
          { provide: VettingService, useValue: mockVettingService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ImpersonationService, useValue: mockImpersonation },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canPromote()).toBe(true);
    });

    it('should return false when status!=completed', () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'active' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: SmeMartResourceService, useValue: mockResourceService },
          { provide: VettingService, useValue: mockVettingService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ImpersonationService, useValue: mockImpersonation },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canPromote()).toBe(false);
    });

    it('should return false when projectType!=pilot', () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'project', status: 'completed' })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProjectDetail],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: SmeMartProjectService, useValue: mockProjectService },
          { provide: SmeMartResourceService, useValue: mockResourceService },
          { provide: VettingService, useValue: mockVettingService },
          { provide: ProjectContextService, useValue: mockProjectContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ImpersonationService, useValue: mockImpersonation },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        ],
      });
      fixture = TestBed.createComponent(ProjectDetail);
      component = fixture.componentInstance;

      expect(component.canPromote()).toBe(false);
    });
  });

  describe('promoteToProject', () => {
    it('should create new project with projectType=project and status=draft', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed', name: 'Test Pilot' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      await component.promoteToProject();

      expect(mockProjectService.createProject).toHaveBeenCalledWith(expect.objectContaining({
        projectType: 'project',
        status: 'draft',
        name: 'Test Pilot',
      }));
    });

    it('should copy key fields from pilot to new project', async () => {
      const pilot = makeSmeMartProject({
        id: 'pilot-1',
        projectType: 'pilot',
        status: 'completed',
        name: 'Test Pilot',
        description: 'Test desc',
        category: 'test-cat',
      });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      await component.promoteToProject();

      const call = mockProjectService.createProject.mock.lastCall[0];
      expect(call.name).toBe('Test Pilot');
      expect(call.description).toBe('Test desc');
      expect(call.category).toBe('test-cat');
    });

    it('should link pilot to promoted project via updateProject', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      // Configure services
      mockProjectService.createProject = vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'proj-456', projectType: 'project', status: 'draft' })
      );
      mockProjectService.updateProject = vi.fn().mockResolvedValue(pilot);

      await component.promoteToProject();

      expect(mockProjectService.updateProject).toHaveBeenCalledWith(
        'pilot-1',
        expect.objectContaining({ promotedProjectId: 'proj-456' })
      );
    });

    it('should update pilot with promotedProjectId', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      await component.promoteToProject();

      const lastCall = mockProjectService.updateProject.mock.lastCall;
      expect(lastCall[0]).toBe('pilot-1');
      expect(lastCall[1]).toEqual(expect.objectContaining({ promotedProjectId: 'proj-456' }));
    });

    it('should navigate to new project after promotion', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);
      mockRouter.navigate = vi.fn();

      await component.promoteToProject();

      // Navigation is delayed by 1s, so we need to wait a bit
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects', 'proj-456']);
    });

    it('should set isPromoting during promotion', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      const promotionPromise = component.promoteToProject();
      expect(component.isPromoting()).toBe(true);

      await promotionPromise;
      expect(component.isPromoting()).toBe(false);
    });

    it('should show success snackbar on promotion', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      // Configure services
      mockProjectService.createProject = vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'proj-456', projectType: 'project', status: 'draft' })
      );
      mockProjectService.updateProject = vi.fn().mockResolvedValue(pilot);

      await component.promoteToProject();

      expect(snackBarOpenSpy).toHaveBeenCalledWith('Pilot promoted to project', 'View', { duration: 5000 });
    });

    it('should show error snackbar on promotion failure', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      // Configure service to reject
      mockProjectService.createProject = vi.fn().mockRejectedValue(new Error('API error'));

      await component.promoteToProject();

      expect(snackBarOpenSpy).toHaveBeenCalledWith('Failed to promote pilot', 'Dismiss', { duration: 5000 });
    });

    it('should not proceed if projectType is not pilot', async () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'project', status: 'completed' })
      );

      await component.promoteToProject();

      expect(mockProjectService.createProject).not.toHaveBeenCalled();
    });

    it('should not proceed if status is not completed', async () => {
      mockProjectContext.project = vi.fn().mockReturnValue(
        makeSmeMartProject({ projectType: 'pilot', status: 'active' })
      );

      await component.promoteToProject();

      expect(mockProjectService.createProject).not.toHaveBeenCalled();
    });
  });

  describe('completePilot integration with vetting', () => {
    it('should call setPilotCompletionSuggestion after pilot completion', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'active', engagementId: 'eng-123', name: 'Test Pilot' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      // Configure dialog and service
      mockDialog.open = vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of({ notes: 'Test notes' })),
      });
      mockProjectService.updateProject = vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed', engagementId: 'eng-123', name: 'Test Pilot' })
      );

      await component.completePilot();

      expect(vettingSetSpy).toHaveBeenCalledWith(expect.objectContaining({
        pilotId: 'pilot-1',
        pilotName: 'Test Pilot',
        engagementId: 'eng-123',
      }));
    });

    it('should include completion notes in suggestion if provided', async () => {
      const pilot = makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'active', engagementId: 'eng-123', name: 'Test Pilot' });
      mockProjectContext.project = vi.fn().mockReturnValue(pilot);

      // Configure dialog with specific notes
      mockDialog.open = vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of({ notes: 'Pilot completed successfully' })),
      });
      mockProjectService.updateProject = vi.fn().mockResolvedValue(
        makeSmeMartProject({ id: 'pilot-1', projectType: 'pilot', status: 'completed', engagementId: 'eng-123', name: 'Test Pilot' })
      );

      await component.completePilot();

      const lastCall = vettingSetSpy.mock.lastCall;
      expect(lastCall && lastCall[0].completionNotes).toBe('Pilot completed successfully');
    });
  });
});
