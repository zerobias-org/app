import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectCard } from './project-card.component';
import { makeSmeMartProject } from '../../test-helpers/factories';

describe('ProjectCard', () => {
  let component: ProjectCard;
  let fixture: ComponentFixture<ProjectCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getTypeIcon', () => {
    it('should return description icon for rfp', () => {
      expect(component.getTypeIcon('rfp')).toBe('description');
    });

    it('should return science icon for pilot', () => {
      expect(component.getTypeIcon('pilot')).toBe('science');
    });

    it('should return folder_open icon for project', () => {
      expect(component.getTypeIcon('project')).toBe('folder_open');
    });

    it('should return folder_special icon for unknown type', () => {
      expect(component.getTypeIcon('unknown')).toBe('folder_special');
    });
  });

  describe('rendering', () => {
    it('should render project card with required input', () => {
      const project = makeSmeMartProject({
        name: 'Test Project',
        status: 'active',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const card = fixture.debugElement.nativeElement.querySelector('.project-card');
      expect(card).toBeTruthy();
    });

    it('should render status chip', () => {
      const project = makeSmeMartProject({
        name: 'Test Project',
        status: 'active',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const statusChip = fixture.debugElement.nativeElement.querySelector('mat-chip[class*="status-"]');
      expect(statusChip).toBeTruthy();
      expect(statusChip.textContent).toContain('Active');
    });

    it('should render type chip when projectType is set', () => {
      const project = makeSmeMartProject({
        name: 'Test Pilot',
        status: 'active',
        projectType: 'pilot',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const typeChip = fixture.debugElement.nativeElement.querySelector('mat-chip[class*="type-"]');
      expect(typeChip).toBeTruthy();
      expect(typeChip.textContent).toContain('Pilot');
    });

    it('should not render type chip when projectType is null', () => {
      const project = makeSmeMartProject({
        name: 'Test Project',
        status: 'active',
        projectType: null,
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const typeChip = fixture.debugElement.nativeElement.querySelector('mat-chip[class*="type-"]');
      expect(typeChip).toBeFalsy();
    });

    it('should render both status and type chips horizontally', () => {
      const project = makeSmeMartProject({
        name: 'Test Pilot',
        status: 'active',
        projectType: 'pilot',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const chipsDiv = fixture.debugElement.nativeElement.querySelector('.project-chips');
      expect(chipsDiv).toBeTruthy();

      const chips = chipsDiv.querySelectorAll('mat-chip');
      expect(chips.length).toBe(2); // status + type
    });

    it('should render project name in title', () => {
      const project = makeSmeMartProject({
        name: 'My Test Project',
        status: 'active',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const title = fixture.debugElement.nativeElement.querySelector('mat-card-title');
      expect(title.textContent).toContain('My Test Project');
    });

    it('should render project description when present', () => {
      const project = makeSmeMartProject({
        name: 'Test Project',
        description: 'This is a test description',
        status: 'active',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const desc = fixture.debugElement.nativeElement.querySelector('.project-desc');
      expect(desc).toBeTruthy();
      expect(desc.textContent).toContain('This is a test description');
    });

    it('should apply correct CSS class for type-rfp', () => {
      const project = makeSmeMartProject({
        name: 'Test RFP',
        status: 'draft',
        projectType: 'rfp',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const typeChip = fixture.debugElement.nativeElement.querySelector('.type-rfp');
      expect(typeChip).toBeTruthy();
    });

    it('should apply correct CSS class for type-project', () => {
      const project = makeSmeMartProject({
        name: 'Test Project',
        status: 'active',
        projectType: 'project',
      });

      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('project', project);
      });

      fixture.detectChanges();

      const typeChip = fixture.debugElement.nativeElement.querySelector('.type-project');
      expect(typeChip).toBeTruthy();
    });
  });
});
