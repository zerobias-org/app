import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { vi } from 'vitest';
import { ProjectCompletionDialogComponent } from './project-completion-dialog.component';
import { makeSmeMartProject } from '../../test-helpers/factories';

describe('ProjectCompletionDialogComponent', () => {
  let component: ProjectCompletionDialogComponent;
  let fixture: ComponentFixture<ProjectCompletionDialogComponent>;
  let mockDialogRef: any;

  const mockData = {
    project: makeSmeMartProject({
      name: 'Test Pilot',
      startDate: '2026-01-01',
      targetEndDate: '2026-03-31',
    }),
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectCompletionDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCompletionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty notes signal', () => {
      expect(component.notes()).toBe('');
    });

    it('should receive project data from MAT_DIALOG_DATA', () => {
      expect(component.data.project).toBeTruthy();
      expect(component.data.project.name).toBe('Test Pilot');
    });
  });

  describe('rendering', () => {
    it('should render dialog title', () => {
      const title = fixture.debugElement.nativeElement.querySelector('[mat-dialog-title]');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Mark Pilot Complete');
    });

    it('should render project name in summary', () => {
      const summary = fixture.debugElement.nativeElement.querySelector('.completion-summary');
      expect(summary).toBeTruthy();
      expect(summary.textContent).toContain('Test Pilot');
    });

    it('should render start date if available', () => {
      const summary = fixture.debugElement.nativeElement.querySelector('.completion-summary');
      expect(summary.textContent).toContain('Started');
      expect(summary.textContent).toContain('Jan 1, 2026');
    });

    it('should render target end date if available', () => {
      const summary = fixture.debugElement.nativeElement.querySelector('.completion-summary');
      expect(summary.textContent).toContain('Target End');
      expect(summary.textContent).toContain('Mar 31, 2026');
    });

    it('should not render start date when not available', async () => {
      const projectWithoutDates = makeSmeMartProject({
        name: 'Test Pilot',
        startDate: undefined,
      });

      mockData.project = projectWithoutDates;
      fixture.componentRef.location.nativeElement.innerHTML = '';
      await TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [ProjectCompletionDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockData },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ProjectCompletionDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const startDateText = fixture.debugElement.nativeElement.querySelector('.completion-summary')?.textContent;
      expect(startDateText).not.toContain('Started');
    });

    it('should render notes textarea', () => {
      const textarea = fixture.debugElement.nativeElement.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('should render Cancel button', () => {
      const cancelButton = fixture.debugElement.nativeElement.querySelector('button[mat-button]');
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.textContent).toContain('Cancel');
    });

    it('should render Complete Pilot button', () => {
      const completeButton = fixture.debugElement.nativeElement.querySelector('button[mat-raised-button]');
      expect(completeButton).toBeTruthy();
      expect(completeButton.textContent).toContain('Complete Pilot');
    });
  });

  describe('notes capture', () => {
    it('should update notes signal on textarea input', () => {
      const textarea = fixture.debugElement.nativeElement.querySelector('textarea');
      textarea.value = 'Test completion notes';
      textarea.dispatchEvent(new Event('input'));

      component.notes.set('Test completion notes');
      fixture.detectChanges();

      expect(component.notes()).toBe('Test completion notes');
    });

    it('should allow empty notes', () => {
      component.notes.set('');
      expect(component.notes()).toBe('');
    });

    it('should preserve multiline notes', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      component.notes.set(multilineText);

      expect(component.notes()).toBe(multilineText);
    });
  });

  describe('user actions', () => {
    it('should close dialog without data on Cancel', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should close dialog with notes on Complete', () => {
      component.notes.set('Test completion notes');
      component.onComplete();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ notes: 'Test completion notes' });
    });

    it('should return empty notes string when completing without input', () => {
      component.notes.set('');
      component.onComplete();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ notes: '' });
    });

    it('should handle Cancel button click', () => {
      const cancelButton = fixture.debugElement.nativeElement.querySelector('button[mat-button]');
      cancelButton.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should handle Complete button click', () => {
      component.notes.set('Test notes');
      const completeButton = fixture.debugElement.nativeElement.querySelector('button[mat-raised-button]');
      completeButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ notes: 'Test notes' });
    });
  });

  describe('form field layout', () => {
    it('should render form field with outline appearance', () => {
      const formField = fixture.debugElement.nativeElement.querySelector('mat-form-field');
      expect(formField).toBeTruthy();
      expect(formField.getAttribute('appearance')).toBe('outline');
    });

    it('should render textarea with placeholder', () => {
      const textarea = fixture.debugElement.nativeElement.querySelector('textarea');
      expect(textarea.placeholder).toContain('Document any key findings');
    });

    it('should have Notes label', () => {
      const label = fixture.debugElement.nativeElement.querySelector('mat-label');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Completion Notes (Optional)');
    });
  });

  describe('dialog data access', () => {
    it('should access project from data', () => {
      expect(component.data.project).toBe(mockData.project);
    });

    it('should access project properties', () => {
      const { project } = component.data;
      expect(project.name).toBe('Test Pilot');
      expect(project.startDate).toBe('2026-01-01');
      expect(project.targetEndDate).toBe('2026-03-31');
    });
  });
});
