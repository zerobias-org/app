import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { BoardStatus } from '@zerobias-com/platform-sdk';
import { CreateBoardComponent, type CreateBoardDialogData } from './create-board.component';

const PROJECT_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e6f';
const DATA: CreateBoardDialogData = { projectId: PROJECT_ID };

describe('CreateBoardComponent', () => {
  let createSpy: ReturnType<typeof vi.fn>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  function setup() {
    createSpy = vi.fn().mockResolvedValue({ id: 'new-board', name: 'Test' });
    dialogRef = { close: vi.fn() };
    const clientApi = { platformClient: { getBoardApi: () => ({ create: createSpy }) } };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CreateBoardComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: DATA },
        { provide: ZerobiasClientApi, useValue: clientApi },
      ],
    });
    return TestBed.createComponent(CreateBoardComponent).componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  it('starts invalid (name required) and defaults boardType to kanban', () => {
    const c = setup();
    expect(c.form.controls.name.hasError('required')).toBe(true);
    expect(c.form.invalid).toBe(true);
    expect(c.form.controls.boardType.value).toBe('kanban');
  });

  it('does not submit while the form is invalid', async () => {
    const c = setup();
    await c.onSubmit();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('creates a board with status active + selected type and closes with the result', async () => {
    const c = setup();
    c.form.setValue({ name: 'My Board', description: 'desc', boardType: 'list' });
    await c.onSubmit();

    expect(createSpy).toHaveBeenCalledTimes(1);
    const body = createSpy.mock.calls[0][0];
    expect(body.name).toBe('My Board');
    expect(body.description).toBe('desc');
    expect(body.status).toBe(BoardStatus.Active);
    expect(String(body.projectId)).toBe(PROJECT_ID);
    expect(dialogRef.close).toHaveBeenCalledWith({ id: 'new-board', name: 'Test' });
    expect(c.isSubmitting()).toBe(false);
  });

  it('surfaces an error and keeps the dialog open when create fails', async () => {
    const c = setup();
    createSpy.mockRejectedValueOnce(new Error('boom'));
    c.form.setValue({ name: 'My Board', description: '', boardType: 'kanban' });
    await c.onSubmit();

    expect(c.submitError()).toBe('Failed to create board. Please try again.');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(c.isSubmitting()).toBe(false);
  });

  it('closes with null on cancel', () => {
    const c = setup();
    c.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
