import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationCard } from '../notification-card/notification-card.component';
import type { Notification, NotificationType } from '../../../core/models';

interface TypeFilterOption {
  value: NotificationType | 'all';
  label: string;
}

const TYPE_FILTERS: TypeFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'bid_received', label: 'Bids Received' },
  { value: 'bid_accepted', label: 'Bids Accepted' },
  { value: 'bid_rejected', label: 'Bids Rejected' },
  { value: 'task_assigned', label: 'Tasks Assigned' },
  { value: 'task_status_changed', label: 'Task Updates' },
  { value: 'document_shared', label: 'Documents' },
  { value: 'engagement_created', label: 'Engagements' },
  { value: 'rfp_published', label: 'RFPs' },
];

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatSelectModule,
    NotificationCard,
  ],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanel implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly typeFilters = TYPE_FILTERS;
  readonly selectedFilter = signal<NotificationType | 'all'>('all');

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly loading = this.notificationService.loading;

  readonly filteredNotifications = computed(() => {
    const filter = this.selectedFilter();
    const all = this.notifications();
    if (filter === 'all') return all;
    return all.filter(n => n.type === filter);
  });

  readonly hasNotifications = computed(() => this.filteredNotifications().length > 0);
  readonly badgeHidden = computed(() => this.unreadCount() === 0);

  ngOnInit(): void {
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  onFilterChange(value: NotificationType | 'all'): void {
    this.selectedFilter.set(value);
  }

  onDismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  onNavigate(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    this.navigateToResource(notification);
  }

  onMarkRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  dismissAll(): void {
    this.notificationService.dismissAll();
  }

  private navigateToResource(notification: Notification): void {
    const { resource_type, resource_id } = notification;
    if (!resource_type || !resource_id) return;

    const parentId = (notification.payload as Record<string, string>)?.['parent_id'];

    switch (resource_type) {
      case 'engagement':
        this.router.navigate(['/engagements', resource_id]);
        break;
      case 'bid':
      case 'rfp':
        this.router.navigate(['/rfps', parentId || resource_id]);
        break;
      case 'task':
        if (parentId) {
          this.router.navigate(['/engagements', parentId], { fragment: 'tasks' });
        }
        break;
      case 'document':
        if (parentId) {
          this.router.navigate(['/engagements', parentId], { fragment: 'documents' });
        }
        break;
      case 'note':
        if (parentId) {
          this.router.navigate(['/engagements', parentId], { fragment: 'notes' });
        }
        break;
    }

    this.notificationService.events.next({
      type: 'navigate_to_resource',
      notification,
      resourceType: resource_type,
      resourceId: resource_id,
    });
  }
}
