import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Notification, NotificationType, NotificationSeverity } from '../../../core/models';

const TYPE_ICONS: Record<NotificationType, string> = {
  bid_received: 'gavel',
  bid_accepted: 'check_circle',
  bid_rejected: 'cancel',
  task_assigned: 'assignment_ind',
  task_status_changed: 'sync',
  document_shared: 'attach_file',
  note_shared: 'note',
  engagement_created: 'handshake',
  rfp_published: 'campaign',
};

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  none: 'transparent',
  info: '#2196f3',
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCard {
  readonly notification = input.required<Notification>();

  readonly dismiss = output<string>();
  readonly navigate = output<Notification>();
  readonly markRead = output<string>();

  readonly expanded = signal(false);

  readonly isUnread = computed(() => !this.notification().read_at);
  readonly typeIcon = computed(() => TYPE_ICONS[this.notification().type] ?? 'notifications');
  readonly severityColor = computed(() => SEVERITY_COLORS[this.notification().severity] ?? 'transparent');
  readonly hasResource = computed(() => !!this.notification().resource_id && !!this.notification().resource_type);

  readonly relativeTime = computed(() => {
    const created = new Date(this.notification().created_at);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString();
  });

  toggleExpand(): void {
    this.expanded.update(v => !v);
    if (this.isUnread()) {
      this.markRead.emit(this.notification().id);
    }
  }

  onDismiss(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(this.notification().id);
  }

  onNavigate(event: Event): void {
    event.stopPropagation();
    this.navigate.emit(this.notification());
  }
}
