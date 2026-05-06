/**
 * RfpInvitationService — Wave 1: Invitation Controls (Phase 14 Plan 01)
 *
 * Manages invitations sent by buyers to vendors for RFP bidding.
 * Handles CRUD operations, status transitions, and invitation request workflow.
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { RFP_INVITATION_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { RfpInvitation, CreateRfpInvitationRequest, RequestInvitationRequest } from '../models';
import type { GqlRfpInvitationResponse } from '../gql-types';

@Injectable({ providedIn: 'root' })
export class RfpInvitationService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly snackBar = inject(MatSnackBar);

  /** Scalar fields for standard queries (no link fields) */
  private readonly scalarFields = [
    'id',
    'projectId',
    'vendorOrgId',
    'status',
    'invitedAt',
    'respondedAt',
    'invitationMessage',
    'requestReason',
    'createdAt',
    'updatedAt',
    'tag',
  ];

  // ---------------------------------------------------------------------------
  // Query operations
  // ---------------------------------------------------------------------------

  /**
   * List all invitations for a given project (RFP).
   */
  async listByProject(projectId: string): Promise<RfpInvitation[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: { projectId: `.eq.${projectId}` },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlRfpInvitationResponse>(
      'RfpInvitation',
      this.scalarFields,
      gqlOptions,
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(
      result.items as (GqlRfpInvitationResponse & { tag?: Array<{ value: string }> | null })[],
    );

    return filteredGql.map(gql => mapGqlToNeon<RfpInvitation>(gql, RFP_INVITATION_FIELD_MAPPING.gqlToNeon));
  }

  /**
   * List all invitations for a given vendor org.
   */
  async listByVendorOrg(vendorOrgId: string): Promise<RfpInvitation[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: { vendorOrgId: `.eq.${vendorOrgId}` },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlRfpInvitationResponse>(
      'RfpInvitation',
      this.scalarFields,
      gqlOptions,
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(
      result.items as (GqlRfpInvitationResponse & { tag?: Array<{ value: string }> | null })[],
    );

    return filteredGql.map(gql => mapGqlToNeon<RfpInvitation>(gql, RFP_INVITATION_FIELD_MAPPING.gqlToNeon));
  }

  /**
   * Find invitation by project and vendor org.
   * Returns null if no invitation exists.
   */
  async findByProjectAndVendor(projectId: string, vendorOrgId: string): Promise<RfpInvitation | null> {
    const gqlOptions: GqlQueryOptions = {
      filters: {
        projectId: `.eq.${projectId}`,
        vendorOrgId: `.eq.${vendorOrgId}`,
      },
      pageSize: 1,
    };

    const result = await this.graphqlRead.query<GqlRfpInvitationResponse>(
      'RfpInvitation',
      this.scalarFields,
      gqlOptions,
    );

    if (!result.items.length) return null;
    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility(
      [result.items[0] as GqlRfpInvitationResponse & { tag?: Array<{ value: string }> | null }],
    )[0] ?? null;
    if (!filtered) return null;
    return mapGqlToNeon<RfpInvitation>(filtered, RFP_INVITATION_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * Fetch a single invitation by ID.
   */
  async getInvitation(id: string): Promise<RfpInvitation | null> {
    // Check write-through cache first
    const cached = this.pipelineWrite.getCached('RfpInvitation', id);
    if (cached) {
      return mapGqlToNeon<RfpInvitation>(cached, RFP_INVITATION_FIELD_MAPPING.gqlToNeon);
    }

    const invitation = await this.graphqlRead.getById<GqlRfpInvitationResponse>(
      'RfpInvitation',
      id,
      this.scalarFields,
    );
    if (!invitation) return null;

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility(
      [invitation as GqlRfpInvitationResponse & { tag?: Array<{ value: string }> | null }],
    )[0] ?? null;
    if (!filtered) return null;

    this.pipelineWrite.seedCache('RfpInvitation', id, filtered as unknown as Record<string, unknown>);
    return mapGqlToNeon<RfpInvitation>(filtered, RFP_INVITATION_FIELD_MAPPING.gqlToNeon);
  }

  // ---------------------------------------------------------------------------
  // Create operations
  // ---------------------------------------------------------------------------

  /**
   * Create and send an invitation to a vendor for an RFP.
   */
  async createInvitation(request: CreateRfpInvitationRequest): Promise<RfpInvitation> {
    const id = `rfp-inv-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const invitation: RfpInvitation = {
      id,
      projectId: request.projectId,
      vendorOrgId: request.vendorOrgId,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      invitationMessage: request.invitationMessage || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(invitation);
    return invitation;
  }

  /**
   * Create a vendor request for invitation (vendor self-nominates for RFP).
   */
  async requestInvitation(request: RequestInvitationRequest): Promise<RfpInvitation> {
    const id = `rfp-inv-req-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const invitation: RfpInvitation = {
      id,
      projectId: request.projectId,
      vendorOrgId: request.vendorOrgId,
      status: 'requested',
      requestReason: request.requestReason,
      invitedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(invitation);
    return invitation;
  }

  // ---------------------------------------------------------------------------
  // Status transitions
  // ---------------------------------------------------------------------------

  /**
   * Vendor accepts invitation (can now bid).
   */
  async acceptInvitation(id: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(id);
    if (!current) throw new Error(`RfpInvitation ${id} not found`);

    if (current.status !== 'pending' && current.status !== 'requested') {
      throw new Error(`Cannot accept invitation with status '${current.status}'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(updated);
    return updated;
  }

  /**
   * Vendor declines invitation (cannot bid).
   */
  async declineInvitation(id: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(id);
    if (!current) throw new Error(`RfpInvitation ${id} not found`);

    if (current.status !== 'pending' && current.status !== 'requested') {
      throw new Error(`Cannot decline invitation with status '${current.status}'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'declined',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(updated);
    return updated;
  }

  /**
   * Buyer revokes invitation (before vendor responds).
   */
  async revokeInvitation(id: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(id);
    if (!current) throw new Error(`RfpInvitation ${id} not found`);

    if (current.status !== 'pending' && current.status !== 'requested') {
      throw new Error(`Cannot revoke invitation with status '${current.status}'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(updated);
    return updated;
  }

  /**
   * Buyer approves a vendor request for invitation.
   */
  async approveRequest(id: string, invitationMessage?: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(id);
    if (!current) throw new Error(`RfpInvitation ${id} not found`);

    if (current.status !== 'requested') {
      throw new Error(`Cannot approve invitation with status '${current.status}'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'pending',
      invitationMessage: invitationMessage || current.invitationMessage,
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(updated);
    return updated;
  }

  /**
   * Buyer declines a vendor request for invitation.
   */
  async declineRequest(id: string): Promise<RfpInvitation> {
    const current = await this.getInvitation(id);
    if (!current) throw new Error(`RfpInvitation ${id} not found`);

    if (current.status !== 'requested') {
      throw new Error(`Cannot decline request with status '${current.status}'`);
    }

    const updated: RfpInvitation = {
      ...current,
      status: 'declined',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.pushInvitation(updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async pushInvitation(invitation: RfpInvitation): Promise<void> {
    const gqlData = mapNeonToGql<Record<string, unknown>>(invitation, RFP_INVITATION_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('RfpInvitation', gqlData, [], 'rfp-invitation.service:286');
    } catch (err) {
      this.snackBar.open(
        `Failed to save invitation: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }
}
