import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BidFormReviewComponent } from './bid-form-review.component';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import { DynamicFormRendererComponent } from './form-builder/dynamic-form-renderer.component';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

describe('BidFormReviewComponent', () => {
  let component: BidFormReviewComponent;
  let fixture: ComponentFixture<BidFormReviewComponent>;
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
      fields: [{ id: 'field-1', name: 'Name', type: 'text' }],
    } as any as FormBuilderConfig,
  };

  const mockSubmission: FormSubmission = {
    id: 'sub-123' as any,
    projectId: 'project-123' as any,
    bidId: 'bid-123' as any,
    status: 'submitted',
    submissionData: { name: 'Vendor Response' },
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    formSubmissionService = {
      markReviewed: vi.fn(),
    };

    snackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BidFormReviewComponent, DynamicFormRendererComponent],
      providers: [
        { provide: FormSubmissionService, useValue: formSubmissionService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BidFormReviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render form config when available', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.detectChanges();
    });

    expect(component.formConfig()).toBeTruthy();
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
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.detectChanges();
    });

    const parsed = component.formConfig();
    expect(parsed).toBeTruthy();
    expect((parsed as any).id).toBe('form-1');
  });

  it('should not render section when submission is null', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', null);
      fixture.detectChanges();
    });

    const section = fixture.nativeElement.querySelector('.form-review-section');
    expect(section).toBeFalsy();
  });

  it('should not render section when formConfig is null', () => {
    const projectNoForm: SmeMartProject = {
      ...mockProject,
      formConfig: null,
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', projectNoForm);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.detectChanges();
    });

    const section = fixture.nativeElement.querySelector('.form-review-section');
    expect(section).toBeFalsy();
  });

  it('should show Mark Reviewed button when status is submitted', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.detectChanges();
    });

    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent).toContain('Mark Reviewed');
  });

  it('should show reviewed status when status is reviewed', () => {
    const reviewedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy: 'reviewer-1' as any,
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', reviewedSubmission);
      fixture.detectChanges();
    });

    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeFalsy(); // Button should not be present
  });

  it('should show revised alert when status is revised', () => {
    const revisedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'revised',
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', revisedSubmission);
      fixture.detectChanges();
    });

    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('.revised-alert');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Vendor revised form');
  });

  it('should mark submission as reviewed on button click', async () => {
    const reviewedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy: 'reviewer-1' as any,
    };

    formSubmissionService.markReviewed.mockResolvedValue(reviewedSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.componentRef.setInput('currentUserId', 'reviewer-1');
      fixture.detectChanges();
    });

    await component.onMarkReviewed();

    expect(formSubmissionService.markReviewed).toHaveBeenCalledWith(
      'sub-123',
      'reviewer-1'
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Form marked as reviewed',
      'OK',
      { duration: 3000 }
    );
  });

  it('should show error snackbar on mark reviewed failure', async () => {
    const error = new Error('Mark failed');
    formSubmissionService.markReviewed.mockRejectedValue(error);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.componentRef.setInput('currentUserId', 'reviewer-1');
      fixture.detectChanges();
    });

    await component.onMarkReviewed();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to mark reviewed: Mark failed',
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('should do nothing when marking reviewed without currentUserId', async () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.componentRef.setInput('currentUserId', null);
      fixture.detectChanges();
    });

    await component.onMarkReviewed();

    expect(formSubmissionService.markReviewed).not.toHaveBeenCalled();
  });

  it('should do nothing when marking reviewed without submission', async () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', null);
      fixture.componentRef.setInput('currentUserId', 'reviewer-1');
      fixture.detectChanges();
    });

    await component.onMarkReviewed();

    expect(formSubmissionService.markReviewed).not.toHaveBeenCalled();
  });

  it('should set isMarking flag during review action', async () => {
    formSubmissionService.markReviewed.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(
            () => resolve({ ...mockSubmission, status: 'reviewed' }),
            100
          );
        })
    );

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.componentRef.setInput('currentUserId', 'reviewer-1');
      fixture.detectChanges();
    });

    expect(component.isMarking()).toBe(false);
    const promise = component.onMarkReviewed();
    expect(component.isMarking()).toBe(true);
    await promise;
    expect(component.isMarking()).toBe(false);
  });

  it('should handle isReviewed computed signal', () => {
    const reviewedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy: 'reviewer-1' as any,
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', reviewedSubmission);
      fixture.detectChanges();
    });

    expect(component.isReviewed()).toBe(true);
  });

  it('should handle isRevised computed signal', () => {
    const revisedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'revised',
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', revisedSubmission);
      fixture.detectChanges();
    });

    expect(component.isRevised()).toBe(true);
  });

  it('should render section title', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.detectChanges();
    });

    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h3');
    expect(title?.textContent).toBe('Submission Form Responses');
  });

  it('should handle form config parsing errors gracefully', () => {
    const projectWithBadConfig: SmeMartProject = {
      ...mockProject,
      formConfig: 'invalid json' as any,
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', projectWithBadConfig);
      fixture.componentRef.setInput('submission', mockSubmission);
      fixture.detectChanges();
    });

    expect(component.formConfig()).toBeNull();
  });
});
