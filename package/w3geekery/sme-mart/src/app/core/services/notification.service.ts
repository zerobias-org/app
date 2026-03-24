import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { SmeMartDbService } from './sme-mart-db.service';
import { ImpersonationService } from './impersonation.service';
import type {
  Notification,
  CreateNotificationRequest,
  NotificationType,
  NotificationEvent,
} from '../models';

const TABLE = 'notifications';
const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly db = inject(SmeMartDbService);
  private readonly impersonation = inject(ImpersonationService);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // ── State ──
  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(false);
  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.read_at && !n.dismissed_at).length,
  );

  // ── Events (cross-component communication) ──
  readonly events = new Subject<NotificationEvent>();

  // ── Polling ──

  startPolling(): void {
    if (this.pollTimer) return;
    this.loadNotifications();
    this.pollTimer = setInterval(() => this.loadNotifications(), POLL_INTERVAL_MS);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // ── Read ──

  async loadNotifications(): Promise<void> {
    const recipientId = this.impersonation.effectiveUserId();
    if (!recipientId) return;

    this.loading.set(true);
    try {
      const result = await this.db.searchRows<Notification>(
        TABLE,
        `(&(recipient_id=${recipientId})(dismissed_at=))`,
        { pageSize: 100, sortBy: 'created_at', sortDirection: 'desc' },
      );
      this.notifications.set(result.items || []);
    } finally {
      this.loading.set(false);
    }
  }

  async loadByType(type: NotificationType): Promise<Notification[]> {
    const recipientId = this.impersonation.effectiveUserId();
    if (!recipientId) return [];

    const result = await this.db.searchRows<Notification>(
      TABLE,
      `(&(recipient_id=${recipientId})(type=${type})(dismissed_at=))`,
      { pageSize: 100, sortBy: 'created_at', sortDirection: 'desc' },
    );
    return result.items || [];
  }

  // ── Create ──

  async create(data: CreateNotificationRequest): Promise<Notification> {
    const notification = await this.db.createRow<Notification>(TABLE, {
      recipient_id: data.recipient_id,
      type: data.type,
      card_type: data.card_type ?? 'notification',
      severity: data.severity ?? 'info',
      title: data.title,
      description: data.description ?? null,
      image_url: data.image_url ?? null,
      resource_id: data.resource_id ?? null,
      resource_type: data.resource_type ?? null,
      source: JSON.stringify(data.source ?? []),
      payload: JSON.stringify(data.payload ?? {}),
    });

    // Immutable update
    this.notifications.update(list => [notification, ...list]);
    this.events.next({ type: 'notification_created', notification });
    return notification;
  }

  // ── Mark Read ──

  async markAsRead(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.updateRow<Notification>(TABLE, id, { read_at: now });

    this.notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read_at: now, updated_at: now } : n)),
    );

    const notification = this.notifications().find(n => n.id === id);
    this.events.next({ type: 'notification_read', notification });
  }

  async markAllAsRead(): Promise<void> {
    const unread = this.notifications().filter(n => !n.read_at);
    if (unread.length === 0) return;

    const now = new Date().toISOString();
    await Promise.all(
      unread.map(n => this.db.updateRow<Notification>(TABLE, n.id, { read_at: now })),
    );

    this.notifications.update(list =>
      list.map(n => (!n.read_at ? { ...n, read_at: now, updated_at: now } : n)),
    );
    this.events.next({ type: 'notifications_all_read' });
  }

  // ── Dismiss ──

  async dismiss(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.updateRow<Notification>(TABLE, id, { dismissed_at: now });

    this.notifications.update(list => list.filter(n => n.id !== id));

    this.events.next({ type: 'notification_dismissed' });
  }

  async dismissAll(): Promise<void> {
    const active = this.notifications();
    if (active.length === 0) return;

    const now = new Date().toISOString();
    await Promise.all(
      active.map(n => this.db.updateRow<Notification>(TABLE, n.id, { dismissed_at: now })),
    );

    this.notifications.set([]);
    this.events.next({ type: 'notifications_all_dismissed' });
  }
}
