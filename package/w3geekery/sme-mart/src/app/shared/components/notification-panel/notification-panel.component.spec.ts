import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { NotificationPanel } from './notification-panel.component';
import { NotificationService } from '../../../core/services/notification.service';
import { fakeNotificationService } from '../../../test-helpers/angular';
import { makeNotification } from '../../../test-helpers/factories';

describe('NotificationPanel', () => {
  let component: NotificationPanel;
  let mockService: ReturnType<typeof fakeNotificationService>;

  beforeEach(() => {
    mockService = fakeNotificationService();

    TestBed.configureTestingModule({
      imports: [NotificationPanel],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: NotificationService, useValue: mockService },
      ],
    });
    const fixture = TestBed.createComponent(NotificationPanel);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('lifecycle', () => {
    it('should not start polling on init (TODO: re-enable after GQL migration)', () => {
      component.ngOnInit();
      // startPolling is commented out in component (line 69)
      expect(mockService.startPolling).not.toHaveBeenCalled();
    });

    it('should stop polling on destroy', () => {
      component.ngOnDestroy();
      expect(mockService.stopPolling).toHaveBeenCalled();
    });
  });

  describe('filtering', () => {
    it('should default to all filter', () => {
      expect(component.selectedFilter()).toBe('all');
    });

    it('should update filter', () => {
      component.onFilterChange('bid_received');
      expect(component.selectedFilter()).toBe('bid_received');
    });

    it('should filter notifications by type', () => {
      const bid = makeNotification({ id: 'n1', type: 'bid_received' });
      const task = makeNotification({ id: 'n2', type: 'task_assigned' });
      mockService.notifications.mockReturnValue([bid, task]);

      component.onFilterChange('bid_received');
      expect(component.filteredNotifications()).toHaveLength(1);
      expect(component.filteredNotifications()[0].id).toBe('n1');
    });

    it('should show all when filter is all', () => {
      const bid = makeNotification({ id: 'n1', type: 'bid_received' });
      const task = makeNotification({ id: 'n2', type: 'task_assigned' });
      mockService.notifications.mockReturnValue([bid, task]);

      expect(component.filteredNotifications()).toHaveLength(2);
    });
  });

  describe('badge', () => {
    it('should hide badge when no unread', () => {
      mockService.unreadCount.mockReturnValue(0);
      expect(component.badgeHidden()).toBe(true);
    });

    it('should show badge when unread exist', () => {
      mockService.unreadCount.mockReturnValue(3);
      expect(component.badgeHidden()).toBe(false);
    });
  });

  describe('actions', () => {
    it('should delegate dismiss to service', () => {
      component.onDismiss('n1');
      expect(mockService.dismiss).toHaveBeenCalledWith('n1');
    });

    it('should mark read and navigate on Go', () => {
      const notification = makeNotification({ resource_type: 'engagement', resource_id: 'eng-1' });
      component.onNavigate(notification);
      expect(mockService.markAsRead).toHaveBeenCalledWith('notif-001');
    });

    it('should delegate markRead', () => {
      component.onMarkRead('n1');
      expect(mockService.markAsRead).toHaveBeenCalledWith('n1');
    });

    it('should delegate markAllRead', () => {
      component.markAllRead();
      expect(mockService.markAllAsRead).toHaveBeenCalled();
    });

    it('should delegate dismissAll', () => {
      component.dismissAll();
      expect(mockService.dismissAll).toHaveBeenCalled();
    });
  });

  describe('hasNotifications', () => {
    it('should be false when empty', () => {
      mockService.notifications.mockReturnValue([]);
      expect(component.hasNotifications()).toBe(false);
    });

    it('should be true when notifications exist', () => {
      mockService.notifications.mockReturnValue([makeNotification()]);
      expect(component.hasNotifications()).toBe(true);
    });
  });
});
