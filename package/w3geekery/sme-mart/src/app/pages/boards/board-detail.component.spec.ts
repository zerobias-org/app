import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { BoardDetailComponent } from './board-detail.component';
import { ProjectContextService } from '../../core/services/project-context.service';

const BOARD_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e60';
const PROJECT_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e61';
const ENG_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e62';
const OWNER_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e63';

describe('BoardDetailComponent', () => {
  let getBoardSpy: ReturnType<typeof vi.fn>;
  let getProjectSpy: ReturnType<typeof vi.fn>;
  let listTasksSpy: ReturnType<typeof vi.fn>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let ctx: ProjectContextService;

  function setup() {
    getBoardSpy = vi.fn().mockResolvedValue({
      id: BOARD_ID, name: 'Vetting Board', ownerId: OWNER_ID, projectId: PROJECT_ID,
    });
    getProjectSpy = vi.fn((id: unknown) => {
      const s = String(id);
      if (s === PROJECT_ID) {
        return Promise.resolve({ id: PROJECT_ID, name: 'Project X', parentId: ENG_ID });
      }
      if (s === ENG_ID) {
        return Promise.resolve({ id: ENG_ID, name: 'Engagement Y' });
      }
      return Promise.reject(new Error('unexpected project id'));
    });
    listTasksSpy = vi.fn().mockResolvedValue({ items: [{ id: 't1', name: 'Task 1', status: 'todo' }] });
    router = { navigate: vi.fn() };
    const clientApi = {
      platformClient: {
        getBoardApi: () => ({ get: getBoardSpy, listTasks: listTasksSpy }),
        getProjectApi: () => ({ get: getProjectSpy }),
      },
    };
    const route = { snapshot: { params: { boardId: BOARD_ID } } };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BoardDetailComponent],
      providers: [
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    ctx = TestBed.inject(ProjectContextService);
    return TestBed.createComponent(BoardDetailComponent).componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  it('fetches the board, records ownerId (C-4), and loads tasks', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(getBoardSpy).toHaveBeenCalledTimes(1);
    expect(c.board()?.name).toBe('Vetting Board');
    expect(c.partyUUID()).toBe(OWNER_ID);
    expect(c.tasks().length).toBe(1);
    expect(c.loading()).toBe(false);
  });

  it('derives the breadcrumb from the board -> project -> engagement chain', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(c.breadcrumb()).toEqual([
      { label: 'Engagement Y', url: `/engagements/${ENG_ID}` },
      { label: 'Project X', url: null },
      { label: 'Vetting Board', url: null },
    ]);
  });

  it('exposes a project board scope for the switcher', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(c.boardScope()).toEqual({ type: 'project', id: PROJECT_ID });
    expect(c.currentBoardId()).toBe(BOARD_ID);
  });

  it('reflects admin state from ProjectContextService (L-9 gate)', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(c.isAdmin()).toBe(false);
    ctx.setIsAdmin(true);
    expect(c.isAdmin()).toBe(true);
  });

  it('navigates on board switch', () => {
    const c = setup();
    c.onBoardSelected('other-board');
    expect(router.navigate).toHaveBeenCalledWith(['/boards', 'other-board']);
  });

  it('toggles the config panel surface', () => {
    const c = setup();
    expect(c.configPanelOpen()).toBe(false);
    c.toggleConfigPanel();
    expect(c.configPanelOpen()).toBe(true);
  });

  it('opens the board in the ZB platform in a new tab', async () => {
    const c = setup();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    await c.ngOnInit();
    c.openInZbPlatform();
    expect(openSpy).toHaveBeenCalledWith(`https://app.zerobias.com/app/boards/${BOARD_ID}`, '_blank');
    openSpy.mockRestore();
  });

  it('sets an error when the board fetch fails', async () => {
    const c = setup();
    getBoardSpy.mockRejectedValueOnce(new Error('boom'));
    await c.ngOnInit();
    expect(c.error()).toBe('Failed to load board.');
    expect(c.loading()).toBe(false);
  });
});
