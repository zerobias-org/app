import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { NotificationCard } from './notification-card.component';
import { makeNotification } from '../../../test-helpers/factories';

describe('NotificationCard', () => {
  let component: NotificationCard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotificationCard],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(NotificationCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('notification', makeNotification());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('computed state', () => {
    it('should detect unread notification', () => {
      expect(component.isUnread()).toBe(true);
    });

    it('should detect read notification', () => {
      TestBed.createComponent(NotificationCard).componentRef
        .setInput('notification', makeNotification({ read_at: '2026-03-01T00:00:00Z' }));
      // Re-create to test read state
      const fixture = TestBed.createComponent(NotificationCard);
      fixture.componentRef.setInput('notification', makeNotification({ read_at: '2026-03-01T00:00:00Z' }));
      expect(fixture.componentInstance.isUnread()).toBe(false);
    });

    it('should map type to icon', () => {
      expect(component.typeIcon()).toBe('gavel');
    });

    it('should map severity to color', () => {
      expect(component.severityColor()).toBe('#2196f3'); // info = blue
    });

    it('should detect resource availability', () => {
      expect(component.hasResource()).toBe(true);
    });

    it('should detect no resource', () => {
      const fixture = TestBed.createComponent(NotificationCard);
      fixture.componentRef.setInput('notification', makeNotification({ resource_id: null, resource_type: null }));
      expect(fixture.componentInstance.hasResource()).toBe(false);
    });
  });

  describe('expand/collapse', () => {
    it('should start collapsed', () => {
      expect(component.expanded()).toBe(false);
    });

    it('should toggle expanded state', () => {
      component.toggleExpand();
      expect(component.expanded()).toBe(true);
      component.toggleExpand();
      expect(component.expanded()).toBe(false);
    });

    it('should emit markRead on expand when unread', () => {
      const spy = vi.spyOn(component.markRead, 'emit');
      component.toggleExpand();
      expect(spy).toHaveBeenCalledWith('notif-001');
    });

    it('should not emit markRead when already read', () => {
      const fixture = TestBed.createComponent(NotificationCard);
      fixture.componentRef.setInput('notification', makeNotification({ read_at: '2026-03-01T00:00:00Z' }));
      const c = fixture.componentInstance;
      const spy = vi.spyOn(c.markRead, 'emit');
      c.toggleExpand();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('should emit dismiss with id', () => {
      const spy = vi.spyOn(component.dismiss, 'emit');
      const event = new Event('click');
      vi.spyOn(event, 'stopPropagation');
      component.onDismiss(event);
      expect(spy).toHaveBeenCalledWith('notif-001');
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should emit navigate with notification', () => {
      const spy = vi.spyOn(component.navigate, 'emit');
      const event = new Event('click');
      component.onNavigate(event);
      expect(spy).toHaveBeenCalledWith(component.notification());
    });
  });

  describe('relative time', () => {
    it('should return a time string', () => {
      expect(component.relativeTime()).toBeTruthy();
    });
  });
});
