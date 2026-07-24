import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { BoardSwitcherComponent } from './board-switcher.component';

const PROJECT_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e61';

describe('BoardSwitcherComponent', () => {
  let fixture: ComponentFixture<BoardSwitcherComponent>;
  let component: BoardSwitcherComponent;
  let listSpy: ReturnType<typeof vi.fn>;
  let emitted: string[];

  function setup(items: Array<{ id: string; name: string }>) {
    listSpy = vi.fn().mockResolvedValue({ items });
    const clientApi = { platformClient: { getBoardApi: () => ({ list: listSpy }) } };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BoardSwitcherComponent],
      providers: [{ provide: ZerobiasClientApi, useValue: clientApi }],
    });
    fixture = TestBed.createComponent(BoardSwitcherComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.boardChanged.subscribe((id) => emitted.push(id));
  }

  beforeEach(() => vi.clearAllMocks());

  it('fetches sibling boards for the project scope', async () => {
    setup([{ id: 'b1', name: 'Alpha' }, { id: 'b2', name: 'Beta' }]);
    fixture.componentRef.setInput('scope', { type: 'project', id: PROJECT_ID });
    fixture.detectChanges(); // flush effect
    await fixture.whenStable();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(String(listSpy.mock.calls[0][5])).toBe(PROJECT_ID);
    expect(component.boards().length).toBe(2);
  });

  it('resolves the current board name from selectedBoardId', async () => {
    setup([{ id: 'b1', name: 'Alpha' }, { id: 'b2', name: 'Beta' }]);
    fixture.componentRef.setInput('scope', { type: 'project', id: PROJECT_ID });
    fixture.componentRef.setInput('selectedBoardId', 'b2');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.currentBoardName()).toBe('Beta');
  });

  it('emits boardChanged on selection', () => {
    setup([{ id: 'b1', name: 'Alpha' }]);
    component.onBoardSelect('b9');
    expect(emitted).toEqual(['b9']);
  });

  it('does not fetch when scope is null', () => {
    setup([]);
    fixture.detectChanges();
    expect(listSpy).not.toHaveBeenCalled();
  });
});
