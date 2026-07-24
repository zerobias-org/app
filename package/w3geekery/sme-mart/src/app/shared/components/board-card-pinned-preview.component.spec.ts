import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BoardCardPinnedPreviewComponent } from './board-card-pinned-preview.component';

describe('BoardCardPinnedPreviewComponent', () => {
  let fixture: ComponentFixture<BoardCardPinnedPreviewComponent>;
  let component: BoardCardPinnedPreviewComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BoardCardPinnedPreviewComponent] });
    fixture = TestBed.createComponent(BoardCardPinnedPreviewComponent);
    component = fixture.componentInstance;
  });

  it('shows "No tasks" when count is zero', () => {
    fixture.componentRef.setInput('pinnedTaskCount', 0);
    fixture.detectChanges();
    expect(component.label()).toBe('No tasks');
    expect(fixture.nativeElement.textContent).toContain('No tasks');
  });

  it('shows the count when tasks are present', () => {
    fixture.componentRef.setInput('pinnedTaskCount', 7);
    fixture.detectChanges();
    expect(component.label()).toBe('7 tasks');
    expect(fixture.nativeElement.textContent).toContain('7 tasks');
  });

  it('defaults maxTasks to 25', () => {
    expect(component.maxTasks()).toBe(25);
  });
});
