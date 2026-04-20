import { Injectable, inject } from '@angular/core';
import { BidsService } from './bids.service';
import { EngagementsService } from './engagements.service';
import { SmeMartProjectService } from './sme-mart-project.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { NotificationService } from './notification.service';
import { ImpersonationService } from './impersonation.service';
import type { Bid, Engagement, SmeMartProject } from '../models';

/**
 * EngagementLifecycleService — Plan 075 Phase 2 rewrite
 *
 * Orchestrates the bid acceptance → engagement creation → project activation flow.
 *
 * New lifecycle (Plan 075):
 * 1. Buyer publishes RFP (SmeMartProject, status: published)
 * 2. Provider submits bid (Bid, project link to SmeMartProject)
 * 3. Buyer accepts bid →
 *    a. Mark bid as accepted
 *    b. Create Engagement (corp-to-corp agreement, buyer org ↔ provider org)
 *    c. Link SmeMartProject to Engagement (sme_resource_links relates_to)
 *    d. Set SmeMartProject status → active
 */
@Injectable({ providedIn: 'root' })
export class EngagementLifecycleService {
  private readonly tagService = inject(SmeMartTagService);
  private readonly bids = inject(BidsService);
  private readonly engagements = inject(EngagementsService);
  private readonly projects = inject(SmeMartProjectService);
  private readonly notifications = inject(NotificationService);
  private readonly impersonation = inject(ImpersonationService);

  // ---------------------------------------------------------------------------
  // Tag utilities (unchanged)
  // ---------------------------------------------------------------------------

  generateEngagementTag(): string {
    return this.tagService.generateEngagementTag();
  }

  generateUniqueEngagementTag(existingTags: string[]): string {
    return this.tagService.generateUniqueTag('eng', existingTags);
  }

  isRfpPhase(engagementTag: string | null | undefined): boolean {
    return this.tagService.isRfpPhase(engagementTag);
  }

  isEngagementPhase(engagementTag: string | null | undefined): boolean {
    return this.tagService.isEngagementPhase(engagementTag);
  }

  // ---------------------------------------------------------------------------
  // Bid acceptance → Engagement creation (Plan 075)
  // ---------------------------------------------------------------------------

  /**
   * Accept a bid and create the engagement link.
   *
   * Flow:
   * 1. Generate engagement tag (sme-mart.eng.word-word)
   * 2. Create ZeroBias Tag via hydra.Tag.createTag
   * 3. Accept the bid
   * 4. Create Engagement (buyer ↔ provider corp-to-corp agreement)
   * 5. Link SmeMartProject to Engagement
   * 6. Set SmeMartProject status to active
   */
  async acceptBidAndLink(
    bidId: string,
    projectId: string,
  ): Promise<{
    bid: Bid;
    engagement: Engagement;
    project: SmeMartProject;
    engagementTag: string;
    zerobiasTagId?: string;
  }> {
    // Load the project to get buyer info
    const existingProject = await this.projects.getProject(projectId);
    if (!existingProject) throw new Error(`Project ${projectId} not found`);

    // Load the bid to get provider info
    const existingBid = await this.bids.getBid(bidId);
    if (!existingBid) throw new Error(`Bid ${bidId} not found`);

    const engagementTag = this.generateEngagementTag();

    // Create ZeroBias platform tag for tracking
    let zerobiasTagId: string | undefined;
    try {
      const tag = await this.tagService.createTag(
        engagementTag,
        `SME Mart engagement: ${existingProject.name}`,
      );
      zerobiasTagId = tag?.id?.toString();
    } catch (err) {
      console.warn('[EngagementLifecycle] Failed to create ZB tag, continuing:', err);
    }

    // Step 1: Accept the bid
    const bid = await this.bids.acceptBid(bidId);

    // Step 2: Create the engagement (corp-to-corp agreement)
    const engagement = await this.engagements.createEngagement({
      buyer_zerobias_user_id: this.impersonation.effectiveUserId(),
      buyer_zerobias_org_id: this.impersonation.effectiveOrgId() || undefined,
      title: existingProject.name,
      description: `Engagement for: ${existingProject.name}`,
      engagement_tag: engagementTag,
      zerobias_tag_id: zerobiasTagId,
    });

    // Step 3: Link project to engagement (bidirectional)
    await this.projects.linkToEngagement(projectId, engagement.id);

    // Step 4: Activate the project
    const project = await this.projects.updateProject(projectId, {
      status: 'active',
    });

    // Fire-and-forget notifications
    if (existingBid.provider_id) {
      this.notifications.create({
        recipient_id: existingBid.provider_id,
        type: 'bid_accepted',
        severity: 'high',
        title: 'Your bid was accepted',
        description: `Your bid on "${existingProject.name}" has been accepted. An engagement has been created.`,
        resource_id: projectId,
        resource_type: 'rfp',
        payload: { parent_id: projectId, engagement_id: engagement.id },
      }).catch(() => {});

      this.notifications.create({
        recipient_id: existingBid.provider_id,
        type: 'engagement_created',
        severity: 'high',
        title: 'New engagement created',
        description: `Engagement "${engagementTag}" is now active.`,
        resource_id: engagement.id,
        resource_type: 'engagement',
      }).catch(() => {});
    }

    return { bid, engagement, project, engagementTag, zerobiasTagId };
  }

  /**
   * @deprecated Use acceptBidAndLink() instead.
   * Legacy method kept for components not yet migrated to Plan 075 flow.
   */
  async acceptBid(bidId: string, requestId: string): Promise<{
    bid: Bid;
    workRequest: Engagement;
    engagementTag: string;
    zerobiasTagId?: string;
  }> {
    // Delegate to new flow — requestId is now projectId
    const result = await this.acceptBidAndLink(bidId, requestId);
    return {
      bid: result.bid,
      workRequest: result.engagement,
      engagementTag: result.engagementTag,
      zerobiasTagId: result.zerobiasTagId,
    };
  }
}
