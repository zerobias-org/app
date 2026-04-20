// ── Notification types — mirrors ZB Card model for future migration ──

/** Notification types — maps to business events */
export type NotificationType =
  | 'bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'task_assigned'
  | 'task_status_changed'
  | 'document_shared'
  | 'note_shared'
  | 'engagement_created'
  | 'rfp_published';

/** Maps to ZB Card.cardType */
export type NotificationCardType = 'notification' | 'alert' | 'task';

/** Maps to ZB Card severity levels */
export type NotificationSeverity = 'none' | 'info' | 'low' | 'medium' | 'high' | 'critical';

/** Resource types for cross-component navigation */
export type NotificationResourceType = 'engagement' | 'bid' | 'task' | 'document' | 'note' | 'rfp';

/** Core notification — mirrors ZB Card model fields for migration path */
export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  card_type: NotificationCardType;
  severity: NotificationSeverity;
  title: string;
  description: string | null;
  image_url: string | null;
  resource_id: string | null;
  resource_type: NotificationResourceType | null;
  source: string[];
  payload: Record<string, unknown>;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Data needed to create a notification */
export interface CreateNotificationRequest {
  recipient_id: string;
  type: NotificationType;
  card_type?: NotificationCardType;
  severity?: NotificationSeverity;
  title: string;
  description?: string;
  image_url?: string;
  resource_id?: string;
  resource_type?: NotificationResourceType;
  source?: string[];
  payload?: Record<string, unknown>;
}

/** Event types for cross-component notification events */
export type NotificationEventType =
  | 'notification_created'
  | 'notification_read'
  | 'notification_dismissed'
  | 'notifications_all_read'
  | 'notifications_all_dismissed'
  | 'navigate_to_resource';

/** Event payload for notification system events */
export interface NotificationEvent {
  type: NotificationEventType;
  notification?: Notification;
  resourceType?: NotificationResourceType;
  resourceId?: string;
}
