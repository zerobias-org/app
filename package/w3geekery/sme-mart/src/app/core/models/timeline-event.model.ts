import type { TaskAttachment } from '@zerobias-com/platform-sdk';

/** Phase 1 event types — Phase 2 adds: status_change, task_created, task_completed */
export type TimelineEventType =
  | 'comment'
  | 'attachment'
  | 'bid_submitted'
  | 'bid_accepted';

export interface TimelineActor {
  name: string;
  imageUrl?: string;
  userId?: string;
}

export interface TimelineSource {
  taskId?: string;
  label?: string;
}

export interface CommentPayload {
  type: 'comment';
  commentId: string;
  markdown?: string;
  plainText?: string;
  attachments: TaskAttachment[];
}

export interface AttachmentPayload {
  type: 'attachment';
  commentId: string;
  attachment: TaskAttachment;
}

export interface BidSubmittedPayload {
  type: 'bid_submitted';
  bidId: string;
  providerName: string;
  proposedPrice?: string;
  coverLetterPreview?: string;
}

export interface BidAcceptedPayload {
  type: 'bid_accepted';
  bidId: string;
  providerName: string;
}

export type TimelinePayload =
  | CommentPayload
  | AttachmentPayload
  | BidSubmittedPayload
  | BidAcceptedPayload;

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  actor: TimelineActor;
  source: TimelineSource;
  payload: TimelinePayload;
}
