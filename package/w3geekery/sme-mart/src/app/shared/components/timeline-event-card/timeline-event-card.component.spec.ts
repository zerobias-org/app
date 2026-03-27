import { TestBed } from '@angular/core/testing';
import { TimelineEventCard } from './timeline-event-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import type { TimelineEvent } from '../../../core/models';

function makeEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: 'ev-001',
    type: 'comment',
    actor: { id: 'u-001', name: 'Jane Smith', avatarUrl: null },
    created_at: '2026-01-15T10:00:00Z',
    payload: { type: 'comment', plainText: 'This looks good!', markdown: '**This looks good!**' },
    ...overrides,
  } as TimelineEvent;
}

describe('TimelineEventCard', () => {
  let component: TimelineEventCard;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TimelineEventCard] });
    const fixture = TestBed.createComponent(TimelineEventCard);
    component = fixture.componentInstance;
    component.event = makeEvent();
  });

  it('should compute icon from event type', () => {
    expect(component.icon()).toBe('chat_bubble');
  });

  it('should compute icon for bid_accepted', () => {
    component.event = makeEvent({ type: 'bid_accepted' });
    expect(component.icon()).toBe('check_circle');
  });

  it('should compute type label', () => {
    expect(component.typeLabel()).toBe('Comment');
  });

  it('should compute actor initials', () => {
    expect(component.actorInitials()).toBe('JS');
  });

  it('should compute preview text for comment', () => {
    expect(component.previewText()).toContain('This looks good');
  });

  it('should compute preview for bid_submitted', () => {
    component.event = makeEvent({
      type: 'bid_submitted',
      payload: { type: 'bid_submitted', providerName: 'Bob IT' } as any,
    });
    expect(component.previewText()).toBe('Bob IT submitted a bid');
  });

  it('should emit toggleExpand with event id', () => {
    let emittedId = '';
    component.toggleExpand.subscribe((id: string) => { emittedId = id; });
    component.onToggle();
    expect(emittedId).toBe('ev-001');
  });

  it('should compute accent class from event type', () => {
    expect(component.accentClass()).toBe('accent-comment');
  });
});
