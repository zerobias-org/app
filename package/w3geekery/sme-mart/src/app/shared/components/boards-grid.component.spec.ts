import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BoardsGridComponent } from './boards-grid.component';
import type { BoardCardData, BoardPinToggle } from './board-card.component';

const BOARDS: BoardCardData[] = [
  { id: 'b1', name: 'Alpha', description: null, boardType: 'kanban', status: 'active', isDefault: false },
  { id: 'b2', name: 'Beta', description: null, boardType: 'list', status: 'active', isDefault: false },
];

describe('BoardsGridComponent', () => {
  let fixture: ComponentFixture<BoardsGridComponent>;
  let component: BoardsGridComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BoardsGridComponent] });
    fixture = TestBed.createComponent(BoardsGridComponent);
    component = fixture.componentInstance;
  });

  it('renders the empty state when there are no boards', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No boards');
    expect(fixture.nativeElement.querySelector('.boards-grid')).toBeNull();
  });

  it('renders one card per board, tracked by id', () => {
    fixture.componentRef.setInput('boards', BOARDS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-board-card').length).toBe(2);
  });

  it('applies the pinned class only to pinned cards', () => {
    fixture.componentRef.setInput('boards', BOARDS);
    fixture.componentRef.setInput('pinnedBoardIds', ['b1']);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-board-card');
    expect((cards[0] as HTMLElement).classList.contains('pinned')).toBe(true);
    expect((cards[1] as HTMLElement).classList.contains('pinned')).toBe(false);
  });

  it('isPinned reflects the pinnedBoardIds input', () => {
    fixture.componentRef.setInput('pinnedBoardIds', ['b2']);
    fixture.detectChanges();
    expect(component.isPinned('b2')).toBe(true);
    expect(component.isPinned('b1')).toBe(false);
  });

  it('forwards pinToggled and cardClicked from child cards', () => {
    fixture.componentRef.setInput('boards', BOARDS);
    fixture.detectChanges();

    let pin: BoardPinToggle | undefined;
    let clicked: string | undefined;
    component.pinToggled.subscribe((e) => (pin = e));
    component.cardClicked.subscribe((id) => (clicked = id));

    component.pinToggled.emit({ boardId: 'b1', isPinned: true });
    component.cardClicked.emit('b2');

    expect(pin).toEqual({ boardId: 'b1', isPinned: true });
    expect(clicked).toBe('b2');
  });
});
