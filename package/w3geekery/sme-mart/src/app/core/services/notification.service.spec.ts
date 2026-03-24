import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotificationService } from './notification.service';
import { SmeMartDbService } from './sme-mart-db.service';
import { ImpersonationService } from './impersonation.service';
import { fakeSmeMartDb, fakeImpersonation } from '../../test-helpers/angular';
import { makeNotification, makeListResult } from '../../test-helpers/factories';
import { TEST_USER_ID, TEST_NOTIFICATION_ID } from '../../test-helpers/constants';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockDb: ReturnType<typeof fakeSmeMartDb>;
  let mockImpersonation: ReturnType<typeof fakeImpersonation>;

  const notification1 = makeNotification();
  const notification2 = makeNotification({
    id: 'notif-002',
    type: 'task_assigned',
    title: 'Task assigned',
    read_at: '2026-03-01T00:00:00Z',
  });

  beforeEach(() => {
    mockDb = fakeSmeMartDb();
    mockImpersonation = fakeImpersonation(TEST_USER_ID);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: SmeMartDbService, useValue: mockDb },
        { provide: ImpersonationService, useValue: mockImpersonation },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.stopPolling();
  });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    it('should start with empty notifications', () => {
      expect(service.notifications()).toEqual([]);
    });

    it('should start with zero unread count', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('should start not loading', () => {
      expect(service.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // loadNotifications
  // ---------------------------------------------------------------------------

  describe('loadNotifications', () => {
    it('should fetch notifications for current user', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1, notification2]));

      await service.loadNotifications();

      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'notifications',
        `(&(recipient_id=${TEST_USER_ID})(dismissed_at=))`,
        { pageSize: 100, sortBy: 'created_at', sortDirection: 'desc' },
      );
      expect(service.notifications()).toHaveLength(2);
    });

    it('should toggle loading signal', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([]));

      const promise = service.loadNotifications();
      expect(service.loading()).toBe(true);
      await promise;
      expect(service.loading()).toBe(false);
    });

    it('should reset loading on error', async () => {
      mockDb.searchRows.mockRejectedValue(new Error('fail'));
      await service.loadNotifications().catch(() => {});
      expect(service.loading()).toBe(false);
    });

    it('should not fetch if no user id', async () => {
      mockImpersonation.effectiveUserId.mockReturnValue(null);
      await service.loadNotifications();
      expect(mockDb.searchRows).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // unreadCount
  // ---------------------------------------------------------------------------

  describe('unreadCount', () => {
    it('should count only unread, non-dismissed notifications', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1, notification2]));
      await service.loadNotifications();

      // notification1 has read_at=null, notification2 has read_at set
      expect(service.unreadCount()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // loadByType
  // ---------------------------------------------------------------------------

  describe('loadByType', () => {
    it('should filter by type', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1]));
      const result = await service.loadByType('bid_received');

      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'notifications',
        `(&(recipient_id=${TEST_USER_ID})(type=bid_received)(dismissed_at=))`,
        { pageSize: 100, sortBy: 'created_at', sortDirection: 'desc' },
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty if no user', async () => {
      mockImpersonation.effectiveUserId.mockReturnValue(null);
      const result = await service.loadByType('bid_received');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create notification and prepend to list', async () => {
      const created = makeNotification({ id: 'notif-new' });
      mockDb.createRow.mockResolvedValue(created);

      const result = await service.create({
        recipient_id: TEST_USER_ID,
        type: 'bid_received',
        title: 'New bid received',
      });

      expect(mockDb.createRow).toHaveBeenCalledWith('notifications', expect.objectContaining({
        recipient_id: TEST_USER_ID,
        type: 'bid_received',
        title: 'New bid received',
        card_type: 'notification',
        severity: 'info',
      }));
      expect(result.id).toBe('notif-new');
      expect(service.notifications()[0].id).toBe('notif-new');
    });

    it('should emit notification_created event', async () => {
      const created = makeNotification();
      mockDb.createRow.mockResolvedValue(created);
      const spy = vi.fn();
      service.events.subscribe(spy);

      await service.create({
        recipient_id: TEST_USER_ID,
        type: 'bid_received',
        title: 'Test',
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'notification_created', notification: created }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // markAsRead
  // ---------------------------------------------------------------------------

  describe('markAsRead', () => {
    beforeEach(async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1]));
      await service.loadNotifications();
    });

    it('should update read_at in DB', async () => {
      mockDb.updateRow.mockResolvedValue({});
      await service.markAsRead(TEST_NOTIFICATION_ID);

      expect(mockDb.updateRow).toHaveBeenCalledWith(
        'notifications',
        TEST_NOTIFICATION_ID,
        expect.objectContaining({ read_at: expect.any(String) }),
      );
    });

    it('should update notification in signal', async () => {
      mockDb.updateRow.mockResolvedValue({});
      await service.markAsRead(TEST_NOTIFICATION_ID);

      const updated = service.notifications().find(n => n.id === TEST_NOTIFICATION_ID);
      expect(updated?.read_at).not.toBeNull();
    });

    it('should emit notification_read event', async () => {
      mockDb.updateRow.mockResolvedValue({});
      const spy = vi.fn();
      service.events.subscribe(spy);

      await service.markAsRead(TEST_NOTIFICATION_ID);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'notification_read' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // markAllAsRead
  // ---------------------------------------------------------------------------

  describe('markAllAsRead', () => {
    it('should mark all unread notifications', async () => {
      const unread1 = makeNotification({ id: 'n1' });
      const unread2 = makeNotification({ id: 'n2' });
      mockDb.searchRows.mockResolvedValue(makeListResult([unread1, unread2]));
      await service.loadNotifications();

      mockDb.updateRow.mockResolvedValue({});
      await service.markAllAsRead();

      expect(mockDb.updateRow).toHaveBeenCalledTimes(2);
      expect(service.notifications().every(n => n.read_at !== null)).toBe(true);
    });

    it('should not call DB if all already read', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification2])); // already read
      await service.loadNotifications();

      await service.markAllAsRead();
      expect(mockDb.updateRow).not.toHaveBeenCalled();
    });

    it('should emit notifications_all_read event', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1]));
      await service.loadNotifications();
      mockDb.updateRow.mockResolvedValue({});

      const spy = vi.fn();
      service.events.subscribe(spy);
      await service.markAllAsRead();

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications_all_read' }));
    });
  });

  // ---------------------------------------------------------------------------
  // dismiss
  // ---------------------------------------------------------------------------

  describe('dismiss', () => {
    beforeEach(async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1, notification2]));
      await service.loadNotifications();
    });

    it('should remove notification from list', async () => {
      mockDb.updateRow.mockResolvedValue({});
      await service.dismiss(TEST_NOTIFICATION_ID);

      expect(service.notifications()).toHaveLength(1);
      expect(service.notifications().find(n => n.id === TEST_NOTIFICATION_ID)).toBeUndefined();
    });

    it('should emit notification_dismissed event', async () => {
      mockDb.updateRow.mockResolvedValue({});
      const spy = vi.fn();
      service.events.subscribe(spy);

      await service.dismiss(TEST_NOTIFICATION_ID);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'notification_dismissed' }));
    });
  });

  // ---------------------------------------------------------------------------
  // dismissAll
  // ---------------------------------------------------------------------------

  describe('dismissAll', () => {
    it('should clear all notifications', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1, notification2]));
      await service.loadNotifications();

      mockDb.updateRow.mockResolvedValue({});
      await service.dismissAll();

      expect(mockDb.updateRow).toHaveBeenCalledTimes(2);
      expect(service.notifications()).toEqual([]);
    });

    it('should not call DB if empty', async () => {
      await service.dismissAll();
      expect(mockDb.updateRow).not.toHaveBeenCalled();
    });

    it('should emit notifications_all_dismissed event', async () => {
      mockDb.searchRows.mockResolvedValue(makeListResult([notification1]));
      await service.loadNotifications();
      mockDb.updateRow.mockResolvedValue({});

      const spy = vi.fn();
      service.events.subscribe(spy);
      await service.dismissAll();

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications_all_dismissed' }));
    });
  });

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------

  describe('polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockDb.searchRows.mockResolvedValue(makeListResult([]));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should load immediately on startPolling', () => {
      service.startPolling();
      expect(mockDb.searchRows).toHaveBeenCalledTimes(1);
    });

    it('should not start duplicate timers', () => {
      service.startPolling();
      service.startPolling();
      expect(mockDb.searchRows).toHaveBeenCalledTimes(1);
    });

    it('should stop polling on stopPolling', () => {
      service.startPolling();
      service.stopPolling();
      vi.advanceTimersByTime(60_000);
      // Only the initial call from startPolling
      expect(mockDb.searchRows).toHaveBeenCalledTimes(1);
    });
  });
});
