import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateSubTaskDialog, type CreateSubTaskDialogData } from './create-subtask-dialog.component';
import { EngagementTasksService } from '../../../core/services/engagement-tasks.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const DIALOG_DATA: CreateSubTaskDialogData = {
  masterTaskId: 'cf72be7c-1403-11f1-845f-000000000010',
  activityId: 'cf72be7c-1403-11f1-845f-000000000020',
  boundaryId: 'cf72be7c-1403-11f1-845f-000000000030',
  initialTransitions: [],
};

describe('CreateSubTaskDialog', () => {
  let component: CreateSubTaskDialog;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let mockTasksService: { createSubTask: ReturnType<typeof vi.fn>; transitionTask: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    mockTasksService = {
      createSubTask: vi.fn().mockResolvedValue({ id: 'new-task', name: 'Test' }),
      transitionTask: vi.fn().mockResolvedValue({}),
    };

    TestBed.configureTestingModule({
      imports: [CreateSubTaskDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: DIALOG_DATA },
        { provide: EngagementTasksService, useValue: mockTasksService },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(CreateSubTaskDialog);
    component = fixture.componentInstance;
  });

  it('should have form with required name field', () => {
    expect(component.form.get('name')?.hasError('required')).toBe(true);
  });

  it('should default priority to 5 (medium)', () => {
    expect(component.form.get('priority')?.value).toBe(5);
  });

  it('should not submit when form is invalid', async () => {
    await component.onSubmit();
    expect(mockTasksService.createSubTask).not.toHaveBeenCalled();
  });

  it('should not submit while already submitting', async () => {
    component.form.patchValue({ name: 'Test' });
    // Simulate concurrent submit
    let resolveSlowPromise: () => void;
    const slow = new Promise<{ id: string; name: string }>(r => {
      resolveSlowPromise = () => r({ id: 'new-task', name: 'Test' });
    });
    mockTasksService.createSubTask.mockReturnValue(slow);
    const firstSubmit = component.onSubmit(); // starts submitting
    expect(component.submitting()).toBe(true);
    await component.onSubmit(); // should bail (already submitting)
    expect(mockTasksService.createSubTask).toHaveBeenCalledTimes(1);
    resolveSlowPromise!(); // resolve before teardown
    await firstSubmit;
  });

  it('should have priority options', () => {
    expect(component.priorityOptions).toHaveLength(4);
    expect(component.priorityOptions[0].label).toBe('Low');
    expect(component.priorityOptions[3].label).toBe('Critical');
  });

  it('should compute hasTransitions from data', () => {
    expect(component.hasTransitions()).toBe(false);
  });

  it('should track selected transition', () => {
    const transition = { id: 'tr-1', name: 'Start' } as any;
    component.selectTransition(transition);
    expect(component.selectedTransition()).toBe(transition);
  });
});
