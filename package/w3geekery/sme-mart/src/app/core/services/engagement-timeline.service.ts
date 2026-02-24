import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { NewTaskComment, TaskComment, TaskAttachment } from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';
import type { TimelineEvent, EngagementDetailRow } from '../models';

interface ParsedProposal {
  id: string;
  provider_id: string | null;
  provider_display_name?: string;
  cover_letter?: string | null;
  proposed_price?: string | null;
  proposed_timeline?: string | null;
  status: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class EngagementTimelineService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /**
   * Fetch and merge all timeline events for an engagement.
   * Returns events sorted newest-first.
   */
  async getTimelineEvents(engagement: EngagementDetailRow): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // Task comments + attachments (if engagement has a ZB task)
    if (engagement.zerobias_task_id) {
      try {
        const taskUUID = new UUID(engagement.zerobias_task_id);
        const [comments, attachmentMap] = await Promise.all([
          this.fetchComments(taskUUID),
          this.fetchAttachmentMap(taskUUID),
        ]);
        events.push(...this.mapCommentEvents(comments, attachmentMap, engagement.zerobias_task_id));
      } catch (err) {
        console.warn('[EngagementTimeline] Failed to fetch task comments:', err);
      }
    }

    // Proposal events (from JSON already on engagement)
    events.push(...this.mapProposalEvents(engagement));

    // Sort newest first
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return events;
  }

  /**
   * Post a new comment to the engagement's master task.
   * Returns the created comment mapped as a TimelineEvent for immediate prepend.
   */
  async postComment(taskId: string, markdown: string): Promise<TimelineEvent> {
    const taskUUID = new UUID(taskId);
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    const comment = await taskApi.addComment(taskUUID, new NewTaskComment(undefined, markdown));

    return {
      id: `comment-${comment.id.toString()}`,
      type: 'comment',
      timestamp: comment.created instanceof Date ? comment.created : new Date(comment.created),
      actor: {
        name: comment.person?.name || 'You',
        imageUrl: comment.person?.imageUrl?.toString(),
        userId: comment.personId.toString(),
      },
      source: { taskId },
      payload: {
        type: 'comment',
        commentId: comment.id.toString(),
        markdown: comment.commentMarkdown,
        plainText: comment.commentTxt,
        attachments: [],
      },
    };
  }

  /**
   * Delete a comment from the engagement's master task.
   */
  async deleteComment(taskId: string, commentId: string): Promise<void> {
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    await taskApi.deleteComment(new UUID(taskId), new UUID(commentId));
  }

  // ---- Private helpers ----

  private async fetchComments(taskUUID: UUID): Promise<TaskComment[]> {
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    const result = await taskApi.listComments(taskUUID, 1, 100);
    return result.items || [];
  }

  private async fetchAttachmentMap(taskUUID: UUID): Promise<Map<string, TaskAttachment[]>> {
    const taskApi = this.clientApi.auditmationPlatform.getTaskApi();
    const result = await taskApi.listAttachments(taskUUID, 1, 200);
    const map = new Map<string, TaskAttachment[]>();
    for (const att of (result.items || [])) {
      const key = att.commentId.toString();
      const arr = map.get(key) || [];
      arr.push(att);
      map.set(key, arr);
    }
    return map;
  }

  private mapCommentEvents(
    comments: TaskComment[],
    attachmentMap: Map<string, TaskAttachment[]>,
    taskId: string,
  ): TimelineEvent[] {
    return comments
      .filter(c => !c.deleted)
      .map(c => {
        const commentId = c.id.toString();
        const attachments = attachmentMap.get(commentId) || [];
        const timestamp = c.created instanceof Date ? c.created : new Date(c.created);
        return {
          id: `comment-${commentId}`,
          type: 'comment' as const,
          timestamp,
          actor: {
            name: c.person?.name || 'Unknown',
            imageUrl: c.person?.imageUrl?.toString(),
            userId: c.personId.toString(),
          },
          source: { taskId },
          payload: {
            type: 'comment' as const,
            commentId,
            markdown: c.commentMarkdown,
            plainText: c.commentTxt,
            attachments,
          },
        };
      });
  }

  private mapProposalEvents(engagement: EngagementDetailRow): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    let proposals: ParsedProposal[] = [];
    try {
      proposals = typeof engagement.proposals === 'string'
        ? JSON.parse(engagement.proposals)
        : (engagement.proposals as any) || [];
    } catch { /* empty */ }

    for (const p of proposals) {
      // Every proposal gets a 'proposal_submitted' event
      events.push({
        id: `proposal-submitted-${p.id}`,
        type: 'proposal_submitted',
        timestamp: new Date(p.created_at),
        actor: {
          name: p.provider_display_name || 'Provider',
          userId: p.provider_id || undefined,
        },
        source: {},
        payload: {
          type: 'proposal_submitted',
          proposalId: p.id,
          providerName: p.provider_display_name || 'Provider',
          proposedPrice: p.proposed_price || undefined,
          coverLetterPreview: p.cover_letter?.slice(0, 120) || undefined,
        },
      });

      // Accepted proposals also get a 'proposal_accepted' event
      if (p.status === 'accepted') {
        events.push({
          id: `proposal-accepted-${p.id}`,
          type: 'proposal_accepted',
          // Use created_at + 1ms to sort after the submitted event
          timestamp: new Date(new Date(p.created_at).getTime() + 1),
          actor: {
            name: p.provider_display_name || 'Provider',
            userId: p.provider_id || undefined,
          },
          source: {},
          payload: {
            type: 'proposal_accepted',
            proposalId: p.id,
            providerName: p.provider_display_name || 'Provider',
          },
        });
      }
    }

    return events;
  }
}
