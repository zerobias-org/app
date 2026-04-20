import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectDetailFormComponent } from './project-detail-form.component';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import { DynamicFormRendererComponent } from '../../shared/components/form-builder/dynamic-form-renderer.component';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

describe('ProjectDetailFormComponent', () => {
  let component: ProjectDetailFormComponent;
  let fixture: ComponentFixture<ProjectDetailFormComponent>;
  let formSubmissionService: any;
  let snackBar: any;

  const mockProject: SmeMartProject = {
    id: 'project-123',
    name: 'Test Project',
    status: 'active',
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    formConfig: {
      id: 'form-1',
      fields: [
        { id: 'field-1', name: 'Name', type: 'text', required: true },
      ],
    } as any as FormBuilderConfig,
  };

  const mockSubmission: FormSubmission = {
    id: 'sub-123' as any,
    projectId: 'project-123' as any,
    bidId: 'bid-123' as any,
    status: 'draft',
    submissionData: { name: 'Test Name' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    formSubmissionService = {
      create: vi.fn(),
      update: vi.fn(),
      getByProjectAndBid: vi.fn(),
    };

    snackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailFormComponent, DynamicFormRendererComponent],
      providers: [
        { provide: FormSubmissionService, useValue: formSubmissionService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render form config when available', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
      expect(component.formConfig()).toBeTruthy();
    });
  });

  it('should parse JSON form config', () => {
    const projectWithJsonConfig: SmeMartProject = {
      ...mockProject,
      formConfig: JSON.stringify({
        id: 'form-1',
        fields: [{ id: 'field-1', name: 'Name', type: 'text' }],
      }) as any,
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', projectWithJsonConfig);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    const parsed = component.formConfig();
    expect(parsed).toBeTruthy();
    expect((parsed as any).id).toBe('form-1');
  });

  it('should load existing submission on init when vendor', async () => {
    formSubmissionService.getByProjectAndBid.mockResolvedValue(mockSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('currentUserId', 'vendor-1');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(formSubmissionService.getByProjectAndBid).toHaveBeenCalledWith(
      'project-123',
      'bid-123'
    );
    expect(component.currentSubmission()).toEqual(mockSubmission);
  });

  it('should create new submission on form submit when none exists', async () => {
    const newSubmission: FormSubmission = {
      id: 'new-sub-123' as any,
      projectId: 'project-123' as any,
      bidId: 'bid-123' as any,
      status: 'submitted',
      submissionData: { name: 'New Entry' },
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    formSubmissionService.create.mockResolvedValue(newSubmission);
    formSubmissionService.update.mockResolvedValue(newSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('currentUserId', 'vendor-1');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    const formData = { name: 'New Entry' };
    await component.onFormSubmit(formData);

    expect(formSubmissionService.create).toHaveBeenCalledWith(
      'project-123',
      'bid-123'
    );
    expect(formSubmissionService.update).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Form submitted successfully',
      'OK',
      { duration: 3000 }
    );
  });

  it('should update existing submission on form submit', async () => {
    const updatedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'submitted',
      submissionData: { name: 'Updated Name' },
      submittedAt: new Date(),
    };

    formSubmissionService.update.mockResolvedValue(updatedSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('currentUserId', 'vendor-1');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    component.currentSubmission.set(mockSubmission);
    const formData = { name: 'Updated Name' };
    await component.onFormSubmit(formData);

    expect(formSubmissionService.update).toHaveBeenCalledWith(
      'sub-123',
      expect.objectContaining({
        status: 'submitted',
        submissionData: formData,
      })
    );
    expect(component.currentSubmission()).toEqual(updatedSubmission);
  });

  it('should save draft when onDraftSave called with no existing submission', async () => {
    const draftSubmission: FormSubmission = {
      id: 'draft-sub-123' as any,
      projectId: 'project-123' as any,
      bidId: 'bid-123' as any,
      status: 'draft',
      submissionData: { name: 'Draft Entry' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    formSubmissionService.create.mockResolvedValue(draftSubmission);
    formSubmissionService.update.mockResolvedValue(draftSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('currentUserId', 'vendor-1');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    const formData = { name: 'Draft Entry' };
    await component.onDraftSave(formData);

    expect(formSubmissionService.create).toHaveBeenCalledWith(
      'project-123',
      'bid-123'
    );
    expect(component.currentSubmission()).toEqual(draftSubmission);
    expect(snackBar.open).toHaveBeenCalledWith('Draft saved', 'OK', {
      duration: 2000,
    });
  });

  it('should update draft when onDraftSave called with existing submission', async () => {
    const updatedDraft: FormSubmission = {
      ...mockSubmission,
      submissionData: { name: 'Updated Draft' },
      status: 'draft',
    };

    formSubmissionService.update.mockResolvedValue(updatedDraft);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('currentUserId', 'vendor-1');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    component.currentSubmission.set(mockSubmission);
    const formData = { name: 'Updated Draft' };
    await component.onDraftSave(formData);

    expect(formSubmissionService.update).toHaveBeenCalledWith(
      'sub-123',
      expect.objectContaining({
        status: 'draft',
        submissionData: formData,
      })
    );
    expect(component.currentSubmission()).toEqual(updatedDraft);
  });

  it('should show error snackbar on submission failure', async () => {
    const error = new Error('Network error');
    formSubmissionService.create.mockRejectedValue(error);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('currentUserId', 'vendor-1');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    await component.onFormSubmit({ name: 'Test' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to submit form: Network error',
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('should show error when submitting with missing context', async () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', { ...mockProject, id: undefined });
      fixture.componentRef.setInput('bidId', '');
      fixture.detectChanges();
    });

    await component.onFormSubmit({ name: 'Test' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Unable to submit form: missing context',
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('should render no-form message when formConfig is null', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', {
        ...mockProject,
        formConfig: null,
      });
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(
      'No submission form configured for this project'
    );
  });

  it('should set correct form mode based on isVendor flag', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.componentRef.setInput('isVendor', true);
      fixture.detectChanges();
    });

    // Mode computed from isVendor is 'fill'
    expect(component['isVendor']()).toBe(true);
  });

  it('should handle submission data updates correctly', () => {
    const data = { name: 'Test', email: 'test@example.com' };
    const submission: FormSubmission = {
      id: 'sub-1' as any,
      projectId: 'project-123' as any,
      bidId: 'bid-123' as any,
      status: 'draft',
      submissionData: data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    component.currentSubmission.set(submission);
    expect(component.currentSubmission()?.submissionData).toEqual(data);
  });
});
