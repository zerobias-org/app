import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';
import { ProjectList } from './project-list.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { makeSmeMartProject } from '../../test-helpers/factories';

describe('ProjectList', () => {
  let component: ProjectList;
  let fixture: ComponentFixture<ProjectList>;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockProjectService: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      parent: {
        snapshot: {
          params: {},
        },
      },
    };

    mockProjectService = {
      listProjects: vi.fn().mockResolvedValue({
        items: [
          makeSmeMartProject({ name: 'RFP 1', projectType: 'rfp' }),
          makeSmeMartProject({ name: 'Pilot 1', projectType: 'pilot' }),
          makeSmeMartProject({ name: 'Project 1', projectType: 'project' }),
        ],
      }),
      listProjectsByEngagement: vi.fn().mockResolvedValue({
        items: [],
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectList],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SmeMartProjectService, useValue: mockProjectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('projectTypeFilter signal', () => {
    it('should initialize to empty string (All)', () => {
      expect(component.projectTypeFilter()).toBe('');
    });

    it('should be settable to rfp', () => {
      component.projectTypeFilter.set('rfp');
      expect(component.projectTypeFilter()).toBe('rfp');
    });

    it('should be settable to pilot', () => {
      component.projectTypeFilter.set('pilot');
      expect(component.projectTypeFilter()).toBe('pilot');
    });

    it('should be settable to project', () => {
      component.projectTypeFilter.set('project');
      expect(component.projectTypeFilter()).toBe('project');
    });
  });

  describe('setProjectTypeFilter', () => {
    it('should update filter signal and reload projects', async () => {
      await component.setProjectTypeFilter('pilot');

      expect(component.projectTypeFilter()).toBe('pilot');
      expect(mockProjectService.listProjects).toHaveBeenCalled();
    });

    it('should call listProjects with RFC4515 filter for pilot', async () => {
      await component.setProjectTypeFilter('pilot');

      const calls = mockProjectService.listProjects.mock.calls;
      const lastArgs = calls[calls.length - 1];
      expect(lastArgs[0].filters.projectType).toBe('.eq.pilot');
    });

    it('should call listProjects without filter when set to empty string', async () => {
      await component.setProjectTypeFilter('');

      const calls = mockProjectService.listProjects.mock.calls;
      const lastArgs = calls[calls.length - 1];
      expect(lastArgs[0].filters).toBeUndefined();
    });

    it('should update projects signal after loading', async () => {
      await component.setProjectTypeFilter('rfp');

      expect(component.projects().length).toBe(3); // From mock data
    });
  });

  describe('ngOnInit', () => {
    it('should load projects on init', async () => {
      await component.ngOnInit();

      expect(mockProjectService.listProjects).toHaveBeenCalled();
    });

    it('should set loading signal to false after loading', async () => {
      expect(component.loading()).toBe(true);

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
    });

    it('should load projects by engagement when engagementId is present', async () => {
      mockActivatedRoute.parent.snapshot.params = { id: 'eng-123' };

      await component.ngOnInit();

      expect(mockProjectService.listProjectsByEngagement).toHaveBeenCalledWith('eng-123', expect.any(Object));
    });
  });

  describe('view mode', () => {
    it('should initialize viewMode signal', () => {
      expect(component.viewMode()).toMatch(/table|cards/);
    });

    it('should have setViewMode method', () => {
      expect(typeof component.setViewMode).toBe('function');
    });

    it('should update viewMode signal', () => {
      const originalMode = component.viewMode();
      const newMode = originalMode === 'table' ? 'cards' : 'table';

      component.setViewMode(newMode as any);

      expect(component.viewMode()).toBe(newMode);
    });
  });

  describe('rendering', () => {
    it('should render filter toggle buttons', async () => {
      await component.ngOnInit();
      fixture.detectChanges();

      const toggles = fixture.debugElement.nativeElement.querySelectorAll('mat-button-toggle');
      // Should have 4 type filters + 2 view mode toggles
      expect(toggles.length).toBeGreaterThanOrEqual(4);
    });

    it('should render All, RFP, Pilot, Project filter buttons', async () => {
      await component.ngOnInit();
      fixture.detectChanges();

      const allButton = fixture.debugElement.nativeElement.textContent;
      expect(allButton).toContain('All');
      expect(allButton).toContain('RFP');
      expect(allButton).toContain('Pilot');
      expect(allButton).toContain('Project');
    });

    it('should display projects in grid view when viewMode is cards', async () => {
      component.viewMode.set('cards');
      await component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const grid = fixture.debugElement.nativeElement.querySelector('.project-cards-grid');
      expect(grid).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should set loading to false on error', async () => {
      mockProjectService.listProjects = vi.fn().mockRejectedValue(new Error('API error'));

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
    });
  });
});
