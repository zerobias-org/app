import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BoardCardComponent, type BoardCardData, type BoardPinToggle } from './board-card.component';

const BOARD: BoardCardData = {
  id: 'board-1',
  name: 'Vetting Board',
  description: 'Vendor vetting tasks',
  boardType: 'kanban',
  status: 'active',
  isDefault: true,
};

describe('BoardCardComponent', () => {
  let fixture: ComponentFixture<BoardCardComponent>;
  let component: BoardCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BoardCardComponent] });
    fixture = TestBed.createComponent(BoardCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('board', BOARD);
  });

  it('renders name, titlecased type and status', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Vetting Board');
    expect(text).toContain('Kanban');
    expect(text).toContain('Active');
  });

  it('renders the Default chip only when isDefault is true', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Default');

    fixture.componentRef.setInput('board', { ...BOARD, isDefault: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Default');
  });

  it('renders the description only when present', () => {
    fixture.componentRef.setInput('board', { ...BOARD, description: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Vendor vetting tasks');
  });

  it('emits pinToggled with the negated pin state on pin click', () => {
    let emitted: BoardPinToggle | undefined;
    component.pinToggled.subscribe((e) => (emitted = e));
    fixture.componentRef.setInput('isPinned', false);
    fixture.detectChanges();
    component.onPin();
    expect(emitted).toEqual({ boardId: 'board-1', isPinned: true });
  });

  it('emits cardClicked with the board id on drill click', () => {
    let emitted: string | undefined;
    component.cardClicked.subscribe((id) => (emitted = id));
    fixture.detectChanges();
    component.onDrill();
    expect(emitted).toBe('board-1');
  });

  it('exposes accessible pin button state via aria-expanded', () => {
    fixture.componentRef.setInput('isPinned', true);
    fixture.detectChanges();
    const pinButton = fixture.nativeElement.querySelector('button[aria-expanded]') as HTMLElement;
    expect(pinButton.getAttribute('aria-expanded')).toBe('true');
    expect(pinButton.getAttribute('aria-label')).toContain('Unpin');
  });

  it('shows the pinned preview only when pinned', () => {
    fixture.componentRef.setInput('isPinned', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-board-card-pinned-preview')).toBeNull();

    fixture.componentRef.setInput('isPinned', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-board-card-pinned-preview')).not.toBeNull();
  });
});
