import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { EngagementBoardsTabComponent } from './boards-tab.component';
import { CreateBoardComponent } from '../../org/dialogs/create-board.component';
import { PIN_STORAGE_TOKEN } from '../../../core/services/pin-storage.interface';

const ENG_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e6f';

function makeBoard(id: string) {
  return { id, name: `Board ${id}`, description: null, boardType: 'kanban', status: 'active', isDefault: false };
}

/** Stateful in-memory PinStorage fake (matches the sync getPin/setPin + async load contract). */
function fakePinStorage() {
  const map = new Map<string, boolean>();
  return {
    load: vi.fn().mockResolvedValue(undefined),
    getPin: vi.fn((id: string) => map.get(id) ?? false),
    setPin: vi.fn((id: string, v: boolean) => {
      if (v) {
        map.set(id, true);
      } else {
        map.delete(id);
      }
    }),
    clearPin: vi.fn(),
    clearAll: vi.fn(),
  };
}

describe('EngagementBoardsTabComponent', () => {
  let listSpy: ReturnType<typeof vi.fn>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let pinStorage: ReturnType<typeof fakePinStorage>;
  let dialogResult: unknown;

  function setup(parentId: string | null = ENG_ID) {
    listSpy = vi.fn().mockResolvedValue({ items: [makeBoard('b1'), makeBoard('b2')] });
    router = { navigate: vi.fn() };
    dialogResult = null;
    dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(dialogResult) }) };
    pinStorage = fakePinStorage();
    const clientApi = { platformClient: { getBoardApi: () => ({ list: listSpy }) } };
    const route = { parent: { snapshot: { params: parentId ? { id: parentId } : {} } } };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [EngagementBoardsTabComponent],
      providers: [
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: MatDialog, useValue: dialog },
        { provide: PIN_STORAGE_TOKEN, useValue: pinStorage },
      ],
    });
    return TestBed.createComponent(EngagementBoardsTabComponent).componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  it('hydrates pin state then fetches boards filtered by projectId on init', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(pinStorage.load).toHaveBeenCalledTimes(1);
    expect(c.pinsLoaded()).toBe(true);
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(String(listSpy.mock.calls[0][5])).toBe(ENG_ID); // projectId positional arg
    expect(c.boards().length).toBe(2);
    expect(c.loading()).toBe(false);
  });

  it('skips fetch and stops loading when there is no engagement id', async () => {
    const c = setup(null);
    await c.ngOnInit();
    expect(listSpy).not.toHaveBeenCalled();
    expect(c.loading()).toBe(false);
  });

  it('sets an error and empties boards when the fetch throws', async () => {
    const c = setup();
    listSpy.mockRejectedValueOnce(new Error('boom'));
    await c.ngOnInit();
    expect(c.error()).toBe('Failed to load boards.');
    expect(c.boards()).toEqual([]);
    expect(c.loading()).toBe(false);
  });

  it('orders pinned boards first in displayBoards (persisted pins)', async () => {
    const c = setup();
    pinStorage.setPin('b2', true); // pre-existing persisted pin (hydrated state)
    await c.ngOnInit();
    expect(c.displayBoards().map((b) => b.id)).toEqual(['b2', 'b1']);
    expect(c.pinnedBoardIds()).toEqual(['b2']);
  });

  it('persists pin toggle via setPin and re-derives ordering', async () => {
    const c = setup();
    await c.ngOnInit();
    c.onPinToggle({ boardId: 'b2', isPinned: true });
    expect(pinStorage.setPin).toHaveBeenCalledWith('b2', true);
    expect(c.pinnedBoardIds()).toEqual(['b2']);
    expect(c.displayBoards().map((b) => b.id)).toEqual(['b2', 'b1']);

    c.onPinToggle({ boardId: 'b2', isPinned: false });
    expect(pinStorage.setPin).toHaveBeenCalledWith('b2', false);
    expect(c.pinnedBoardIds()).toEqual([]);
  });

  it('navigates to the board detail route on drill', () => {
    const c = setup();
    c.onBoardClick('b9');
    expect(router.navigate).toHaveBeenCalledWith(['/boards', 'b9']);
  });

  it('opens the Create Board dialog scoped to the engagement project id', async () => {
    const c = setup();
    await c.ngOnInit();
    c.openCreateBoard();
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open.mock.calls[0][0]).toBe(CreateBoardComponent);
    expect(dialog.open.mock.calls[0][1]).toMatchObject({ data: { projectId: ENG_ID } });
  });

  it('refetches boards after a board is created', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(listSpy).toHaveBeenCalledTimes(1);
    dialogResult = makeBoard('b3');
    c.openCreateBoard();
    await Promise.resolve();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
