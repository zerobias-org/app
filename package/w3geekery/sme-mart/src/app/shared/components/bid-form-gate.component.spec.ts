import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BidFormGateComponent } from './bid-form-gate.component';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

describe('BidFormGateComponent', () => {
  let component: BidFormGateComponent;
  let fixture: ComponentFixture<BidFormGateComponent>;
  let formSubmissionService: any;

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
    submissionData: { name: 'Test' },
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    formSubmissionService = {
      getByProjectAndBid: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BidFormGateComponent],
      providers: [
        { provide: FormSubmissionService, useValue: formSubmissionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BidFormGateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show gate when project has no formConfig', async () => {
    const projectNoForm: SmeMartProject = {
      ...mockProject,
      formConfig: null,
    };

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', projectNoForm);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(false);
    expect(formSubmissionService.getByProjectAndBid).not.toHaveBeenCalled();
  });

  it('should not show gate when bidId is missing', async () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', '');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(false);
    expect(formSubmissionService.getByProjectAndBid).not.toHaveBeenCalled();
  });

  it('should show gate when no submission exists', async () => {
    formSubmissionService.getByProjectAndBid.mockResolvedValue(null);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(true);
    expect(formSubmissionService.getByProjectAndBid).toHaveBeenCalledWith(
      'project-123',
      'bid-123'
    );
  });

  it('should show gate when submission is in draft status', async () => {
    const draftSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'draft',
      submittedAt: undefined,
    };

    formSubmissionService.getByProjectAndBid.mockResolvedValue(draftSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(true);
  });

  it('should show gate when submission is in revised status', async () => {
    const revisedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'revised',
    };

    formSubmissionService.getByProjectAndBid.mockResolvedValue(
      revisedSubmission
    );

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(true);
  });

  it('should not show gate when submission is in submitted status', async () => {
    formSubmissionService.getByProjectAndBid.mockResolvedValue(mockSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(false);
  });

  it('should not show gate when submission is in reviewed status', async () => {
    const reviewedSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy: 'reviewer-1' as any,
    };

    formSubmissionService.getByProjectAndBid.mockResolvedValue(
      reviewedSubmission
    );

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(false);
  });

  it('should show gate on service error (fail-safe)', async () => {
    formSubmissionService.getByProjectAndBid.mockRejectedValue(
      new Error('Service error')
    );

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(true);
  });

  it('should emit scrollToForm event when button clicked', () => {
    let emitted = false;
    component.scrollToForm.subscribe(() => {
      emitted = true;
    });

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    component.showGate.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button?.click();

    expect(emitted).toBe(true);
  });

  it('should render gate banner with correct text when showing', async () => {
    formSubmissionService.getByProjectAndBid.mockResolvedValue(null);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.form-gate-banner');
    const span = fixture.nativeElement.querySelector('.form-gate-banner span');

    expect(banner).toBeTruthy();
    expect(span?.textContent).toContain(
      'You must complete and submit the submission form'
    );
  });

  it('should not render gate banner when showGate is false', async () => {
    formSubmissionService.getByProjectAndBid.mockResolvedValue(mockSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.form-gate-banner');
    expect(banner).toBeFalsy();
  });

  it('should handle multiple ngOnInit calls', async () => {
    formSubmissionService.getByProjectAndBid.mockResolvedValue(mockSubmission);

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('bidId', 'bid-123');
      fixture.detectChanges();
    });

    await component.ngOnInit();
    expect(component.showGate()).toBe(false);

    // Change to draft and reinit
    const draftSubmission: FormSubmission = {
      ...mockSubmission,
      status: 'draft',
      submittedAt: undefined,
    };
    formSubmissionService.getByProjectAndBid.mockResolvedValue(draftSubmission);

    await component.ngOnInit();
    expect(component.showGate()).toBe(true);
  });
});
