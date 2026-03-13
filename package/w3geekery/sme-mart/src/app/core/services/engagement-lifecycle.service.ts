import { Injectable, inject } from '@angular/core';
import { BidsService } from './bids.service';
import { WorkRequestsService } from './work-requests.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { NotificationService } from './notification.service';
import type { Bid, WorkRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class EngagementLifecycleService {
  private readonly tagService = inject(SmeMartTagService);
  private readonly bids = inject(BidsService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly notifications = inject(NotificationService);

  /**
   * Generate a BIP39-style engagement tag: sme-mart.eng.word-word
   */
  generateEngagementTag(): string {
    return this.tagService.generateEngagementTag();
  }

  /**
   * Generate a unique tag not in the existing set.
   */
  generateUniqueEngagementTag(existingTags: string[]): string {
    return this.tagService.generateUniqueTag('eng', existingTags);
  }

  /** Check if an engagement tag indicates RFP phase (no tag yet). */
  isRfpPhase(engagementTag: string | null | undefined): boolean {
    return this.tagService.isRfpPhase(engagementTag);
  }

  /** Check if an engagement tag indicates active engagement phase. */
  isEngagementPhase(engagementTag: string | null | undefined): boolean {
    return this.tagService.isEngagementPhase(engagementTag);
  }

  /**
   * Orchestrated bid acceptance workflow:
   * 1. Generate engagement tag (sme-mart.eng.word-word)
   * 2. Create ZeroBias Tag via danaOld.Tag.createTag (direct — no admin approval)
   * 3. Accept the bid
   * 4. Graduate the work request to engagement
   */
  async acceptBid(bidId: string, requestId: string): Promise<{
    bid: Bid;
    workRequest: WorkRequest;
    engagementTag: string;
    zerobiasTagId?: string;
  }> {
    const engagementTag = this.generateEngagementTag();

    // Create ZeroBias platform tag for tracking (direct creation)
    let zerobiasTagId: string | undefined;
    try {
      const tag = await this.tagService.createTag(
        engagementTag,
        `SME Mart engagement: ${engagementTag}`,
      );
      zerobiasTagId = tag?.id?.toString();
    } catch (err) {
      console.warn('[EngagementLifecycle] Failed to create ZB tag, continuing without:', err);
    }

    // Accept bid and graduate work request in parallel
    const [bid, workRequest] = await Promise.all([
      this.bids.acceptBid(bidId),
      this.workRequests.graduateToEngagement(requestId, engagementTag, zerobiasTagId),
    ]);

    // Fire-and-forget notifications for the provider
    if (!bid.provider_id) return { bid, workRequest, engagementTag, zerobiasTagId };

    this.notifications.create({
      recipient_id: bid.provider_id,
      type: 'bid_accepted',
      severity: 'high',
      title: 'Your bid was accepted',
      description: `Your bid on "${workRequest.title}" has been accepted. An engagement has been created.`,
      resource_id: requestId,
      resource_type: 'engagement',
      payload: { parent_id: requestId },
    }).catch(() => {});

    this.notifications.create({
      recipient_id: bid.provider_id,
      type: 'engagement_created',
      severity: 'high',
      title: 'New engagement created',
      description: `Engagement "${engagementTag}" is now active.`,
      resource_id: requestId,
      resource_type: 'engagement',
    }).catch(() => {});

    return { bid, workRequest, engagementTag, zerobiasTagId };
  }
}
