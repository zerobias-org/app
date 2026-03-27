import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RfpDialog } from './rfp-dialog.component';
import { SmeMartProjectService } from '../../../core/services/sme-mart-project.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import { fakeImpersonation } from '../../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EngagementFormValues } from '../engagement-form/engagement-form.component';

describe('RfpDialog', () => {
  let component: RfpDialog;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let mockProjects: { createAsRfp: ReturnType<typeof vi.fn>; publishRfp: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    mockProjects = {
      createAsRfp: vi.fn().mockResolvedValue({ id: 'proj-new', name: 'Test RFP' }),
      publishRfp: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [RfpDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: SmeMartProjectService, useValue: mockProjects },
        { provide: ImpersonationService, useValue: fakeImpersonation() },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(RfpDialog);
    component = fixture.componentInstance;
  });

  it('should start with formValid=false', () => {
    expect(component.formValid()).toBe(false);
  });

  it('should update formValid when values change', () => {
    component.onValuesChange({ title: 'Test', category: 'assessors' } as EngagementFormValues);
    expect(component.formValid()).toBe(true);
  });

  it('should require both title and category for validity', () => {
    component.onValuesChange({ title: 'Test', category: '' } as EngagementFormValues);
    expect(component.formValid()).toBe(false);
  });

  it('should create project and publish on save(false)', async () => {
    component.onValuesChange({ title: 'Test RFP', category: 'assessors', description: 'Desc' } as EngagementFormValues);

    await component.save(false);

    expect(mockProjects.createAsRfp).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test RFP',
      category: 'assessors',
    }));
    expect(mockProjects.publishRfp).toHaveBeenCalledWith('proj-new');
    expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({ id: 'proj-new' }));
  });

  it('should create project WITHOUT publish on save(true) (draft)', async () => {
    component.onValuesChange({ title: 'Draft', category: 'advisors' } as EngagementFormValues);

    await component.save(true);

    expect(mockProjects.createAsRfp).toHaveBeenCalled();
    expect(mockProjects.publishRfp).not.toHaveBeenCalled();
  });

  it('should not save when no values', async () => {
    await component.save(false);
    expect(mockProjects.createAsRfp).not.toHaveBeenCalled();
  });

  it('should close with null on cancel', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
