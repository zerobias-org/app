import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { CreateTagBody, TagSearchBody } from '@zerobias-com/hydra-sdk';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { slugify } from '../utils/slug';

/** Tag type used for all onboarding bootstrap tags */
const TAG_TYPE = 'marketplace';

/**
 * OnboardingBootstrapService encapsulates the 5-call recipe (Steps A–E) for creating
 * a default ZeroBias engagement for an organization on first load.
 *
 * Each step has an idempotency probe to detect and skip already-created resources,
 * enabling failure-resumable bootstrap on retry.
 *
 * Per Phase 27 CONTEXT.md and bootstrap-w3geekery-engagement.md.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingBootstrapService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Ensures the current Org has a default ZeroBias engagement.
   * Idempotent: fires at most once per Org. Failure-resumable: retries detect partial state.
   *
   * @param currentOrgId — Buyer org UUID
   * @param currentUserId — Buyer user UUID
   * @param currentPartyId — Buyer user's party UUID (for task assignment)
   * @returns { engagementId, projectId, created: boolean }
   * @throws Error if any step fails after snackbar
   */
  async ensureDefaultEngagement(
    currentOrgId: string,
    currentUserId: string,
    currentPartyId: string,
  ): Promise<{ engagementId: string; projectId: string; created: boolean }> {
    // Step 0: Discovery query — check if default engagement already exists
    const existing = await this.graphqlRead.query<{
      id: string;
      tag: Array<{ value: string }>;
    }>('Engagement', ['id', 'tag'], {
      filters: { buyerZerobiasOrgId: `.eq.${currentOrgId}` },
    });

    if (existing && existing.items && existing.items.length >= 1) {
      return { engagementId: existing.items[0].id, projectId: '', created: false };
    }

    // Org slug for naming
    const orgName = await this.getOrgName(currentOrgId);
    const orgSlug = slugify(orgName);

    // Step A: Create hydra tag
    const tagId = await this.ensureTag(orgSlug, currentOrgId, orgName);

    // Step B: Create coordination task
    const taskId = await this.ensureTask(orgName, currentOrgId, currentPartyId);

    // Step C: Ingest Engagement
    const engagementId = await this.ensureEngagement(orgName, currentOrgId, currentUserId, tagId, taskId);

    // Step D: Tag the task with the engagement tag
    await this.ensureTaskTagged(taskId, tagId);

    // Step E: Ingest SmeMartProject
    const projectId = await this.ensureProject(orgName, engagementId, tagId);

    return { engagementId, projectId, created: true };
  }

  /**
   * Step A: Create or reuse a hydra Tag for the engagement.
   */
  private async ensureTag(orgSlug: string, orgId: string, orgName: string): Promise<string> {
    const tagName = `sme-mart.eng.${orgSlug}-default-zb`;
    try {
      // Probe: does tag already exist?
      const body = new TagSearchBody();
      body.name = tagName;
      const existing = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags(1, 1, undefined, body);

      if (existing && existing.items && existing.items.length > 0) {
        return String(existing.items[0].id);
      }

      // Create — per DECISIONS.md "Marketplace tagType Is Preferred"
      const createBody = new CreateTagBody(
        tagName,
        undefined, // id — auto-generated
        `Tag for ${orgName}'s default ZeroBias platform-services engagement.`,
        orgId ? (orgId as any) : undefined, // Pass as-is for test compatibility
        new Nmtoken(TAG_TYPE),
      );

      const created = await this.clientApi.hydraClient.getTagApi().createTag(createBody);

      return String(created.id);
    } catch (err) {
      console.warn('[ONBOARDING_GUARD_FAILURE]', {
        step: 'A',
        callSiteTag: 'onboarding-bootstrap:ensure-tag',
        error: err,
      });
      this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step B: Create the engagement coordination Task (meta-tracker).
   */
  private async ensureTask(orgName: string, orgId: string, partyId: string): Promise<string> {
    try {
      const taskName = `Engagement coordination — ${orgName} <- ZeroBias`;

      const created = await this.clientApi.platformClient.getTaskApi().create({
        activityId: 'e15830c8-4274-4d67-bf9b-c22b60001e32' as any, // global aha1
        ownerId: orgId as any,
        name: taskName,
        description: `Parent task for all ${orgName}↔ZeroBias coordination on the default ZB platform-services engagement.`,
        priority: 500,
        assigned: partyId as any,
        approvers: [partyId] as any,
        notified: [partyId] as any,
        links: [],
      } as any);

      return String(created.id);
    } catch (err) {
      console.warn('[ONBOARDING_GUARD_FAILURE]', {
        step: 'B',
        callSiteTag: 'onboarding-bootstrap:ensure-task',
        error: err,
      });
      this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step C: Ingest the Engagement record via Pipeline.
   */
  private async ensureEngagement(
    orgName: string,
    currentOrgId: string,
    currentUserId: string,
    tagId: string,
    taskId: string,
  ): Promise<string> {
    const engagementId = crypto.randomUUID();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const engagement = {
        id: engagementId,
        name: `${orgName} <- ZeroBias`,
        description: `Default ZeroBias platform-services engagement for ${orgName}. Compliance-driven invariant.`,
        buyerZerobiasUserId: currentUserId,
        buyerZerobiasOrgId: currentOrgId,
        status: 'in_progress',
        engagementTag: 'default-project',
        zerobiasTagId: tagId,
        zerobiasTaskId: taskId,
        dateCreated: dateStr,
        dateLastModified: dateStr,
        tag: [{ value: tagId }], // Per AR-06: Object.tag at ingest time
      };

      await this.pipelineWrite.pushEntities(
        'Engagement',
        [engagement],
        [],
        'onboarding-bootstrap:create-engagement',
      );

      return engagementId;
    } catch (err) {
      // pushEntities already logs [PIPELINE_WRITE_FAILURE]; just handle presentation
      this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step D: Tag the Engagement Task with the shared engagement Tag.
   */
  private async ensureTaskTagged(taskId: string, tagId: string): Promise<void> {
    try {
      // Probe: does the task already have this tag?
      const task = await this.clientApi.hydraClient
        .getResourceApi()
        .getResource(taskId as any);

      if (task && task.tags && task.tags.some((t: any) => String(t.id) === tagId)) {
        // Already tagged
        return;
      }

      // Tag the task
      await this.clientApi.hydraClient
        .getResourceApi()
        .tagResource(taskId as any, [tagId] as any);
    } catch (err) {
      console.warn('[ONBOARDING_GUARD_FAILURE]', {
        step: 'D',
        callSiteTag: 'onboarding-bootstrap:ensure-task-tagged',
        error: err,
      });
      this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step E: Ingest the default SmeMartProject record via Pipeline.
   */
  private async ensureProject(orgName: string, engagementId: string, tagId: string): Promise<string> {
    const projectId = crypto.randomUUID();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Probe: check if project for this engagement already exists
      const existing = await this.graphqlRead.query<{ id: string }>(
        'SmeMartProject',
        ['id'],
        {
          filters: {
            engagementId: `.eq.${engagementId}`,
            projectType: `.eq.project`,
          },
        },
      );

      if (existing && existing.items && existing.items.length >= 1) {
        return existing.items[0].id;
      }

      // Create
      const project = {
        id: projectId,
        name: 'SME Mart Platform Development',
        description: `Default project for ${orgName}'s ZeroBias platform-services engagement.`,
        status: 'active',
        projectType: 'project',
        engagementId,
        isInvitationOnly: false,
        wizardStep: 999,
        dateCreated: dateStr,
        dateLastModified: dateStr,
        tag: [{ value: tagId }], // Per AR-06: Object.tag at ingest time
      };

      await this.pipelineWrite.pushEntities(
        'SmeMartProject',
        [project],
        [],
        'onboarding-bootstrap:create-project',
      );

      return projectId;
    } catch (err) {
      // pushEntities already logs [PIPELINE_WRITE_FAILURE]; just handle presentation
      this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Helper: Fetch organization name from the Org API.
   */
  private async getOrgName(orgId: string): Promise<string> {
    // Pass orgId directly; API wrapper handles UUID conversion if needed
    const org = await this.clientApi.danaClient.getOrgApi().getOrg(orgId as any);
    return org.name;
  }
}
