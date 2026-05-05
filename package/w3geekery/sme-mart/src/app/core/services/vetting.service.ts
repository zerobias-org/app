/**
 * VettingService — CRUD for engagement corporate vetting items.
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Plan 063: Corporate Vetting Flow
 */

import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ImpersonationService } from './impersonation.service';
import { VETTING_ITEM_FIELD_MAPPING, mapGqlToNeon, mapNeonToGql } from '../field-mappings';
import type { GqlVettingItemResponse } from '../gql-types/vetting-item.types';
import type {
  EngagementVettingItem,
  CreateVettingItemRequest,
  UpdateVettingItemRequest,
  VettingSummary,
  VettingStatus,
  VettingGateStatus,
} from '../models';
import {
  DEFAULT_VETTING_TEMPLATES,
  VETTING_STATUS_TRANSITIONS,
} from '../models';

/**
 * Pilot completion suggestion signal payload.
 * Non-blocking suggestion that appears in vetting panel when pilot is marked complete.
 */
export interface PilotCompletionSuggestion {
  pilotId: string;
  pilotName: string;
  completionDate: string; // ISO datetime
  completionNotes?: string;
  engagementId: string;
  summary: string;
}

@Injectable({ providedIn: 'root' })
export class VettingService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly snackBar = inject(MatSnackBar);

  // ── Pilot Completion Suggestion Signal (Plan 077 Task 1) ──

  private readonly _pilotCompletionSuggestion = signal<PilotCompletionSuggestion | null>(null);
  readonly pilotCompletionSuggestion = this._pilotCompletionSuggestion.asReadonly();

  // ── Query ──

  /**
   * List all vetting items for an engagement.
   * Returns items sorted by category (always first) then name.
   */
  async listVettingItems(engagementId: string): Promise<EngagementVettingItem[]> {
    const result = await this.graphqlRead.query<GqlVettingItemResponse>(
      'EngagementVettingItem',
      this.getFields(),
      {
        filters: {
          engagementId: `.eq.${engagementId}`,
        },
        pageSize: 200,
      },
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(
      result.items as (GqlVettingItemResponse & { tag?: Array<{ value: string }> | null })[],
    );

    const items = filteredGql
      .filter(gql => !(gql as unknown as Record<string, unknown>)['dateDeleted'])
      .map(gql => this.fromGql(gql));

    // Sort: always → conditional → nice_to_have, then alphabetical
    const categoryOrder: Record<string, number> = { always: 0, conditional: 1, nice_to_have: 2 };
    items.sort((a, b) => {
      const catDiff = (categoryOrder[a.category] ?? 9) - (categoryOrder[b.category] ?? 9);
      return catDiff !== 0 ? catDiff : a.name.localeCompare(b.name);
    });

    return items;
  }

  /**
   * Get a single vetting item by ID.
   */
  async getVettingItem(id: string): Promise<EngagementVettingItem | null> {
    // Check cache first
    const cached = this.pipelineWrite.getCached('EngagementVettingItem', id);
    if (cached) return this.fromGql(cached as unknown as GqlVettingItemResponse);

    const gql = await this.graphqlRead.getById<GqlVettingItemResponse>(
      'EngagementVettingItem',
      id,
      this.getFields(),
    );
    if (!gql) return null;

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility(
      [gql as GqlVettingItemResponse & { tag?: Array<{ value: string }> | null }],
    )[0] ?? null;
    if (!filtered) return null;

    this.pipelineWrite.seedCache('EngagementVettingItem', id, filtered as unknown as Record<string, unknown>);
    return this.fromGql(filtered);
  }

  /**
   * Get summary counts for tab badge display.
   */
  async getVettingSummary(engagementId: string): Promise<VettingSummary> {
    const items = await this.listVettingItems(engagementId);

    const summary: VettingSummary = {
      total: items.length,
      verified: 0,
      waived: 0,
      pending: 0,
      rejected: 0,
      expired: 0,
      requiredRemaining: 0,
      gateStatus: 'not_started',
    };

    let requiredTotal = 0;
    for (const item of items) {
      switch (item.status) {
        case 'verified':     summary.verified++; break;
        case 'waived':       summary.waived++; break;
        case 'rejected':     summary.rejected++; break;
        case 'expired':      summary.expired++; break;
        default:             summary.pending++; break;
      }

      // Count required items not yet resolved
      if (item.category === 'always') {
        requiredTotal++;
        if (item.status !== 'verified' && item.status !== 'waived') {
          summary.requiredRemaining++;
        }
      }
    }

    // Compute gate status
    summary.gateStatus = this.computeGateStatus(summary, requiredTotal);

    return summary;
  }

  // ── Initialization ──

  /**
   * Seed default vetting items for an engagement if none exist.
   * Called lazily on first visit to the vetting tab.
   * Returns the full list (seeded or existing).
   */
  async initializeVetting(engagementId: string): Promise<EngagementVettingItem[]> {
    const existing = await this.listVettingItems(engagementId);
    if (existing.length > 0) return existing;

    // Seed from default templates
    const now = new Date().toISOString();
    const items: EngagementVettingItem[] = DEFAULT_VETTING_TEMPLATES.map(template => ({
      id: crypto.randomUUID(),
      engagement_id: engagementId,
      name: template.name,
      description: template.description,
      category: template.category,
      vetting_type: template.vetting_type,
      evidence_type: template.evidence_type,
      status: 'not_started' as VettingStatus,
      direction: template.direction,
      condition_trigger: null,
      document_ids: [],
      submitted_at: null,
      verified_at: null,
      verified_by: null,
      expires_at: null,
      rejection_reason: null,
      waived_reason: null,
      notes: null,
      created_at: now,
      updated_at: now,
    }));

    // Push all items to pipeline in one batch
    const gqlItems = items.map(item => this.toGql(item));
    try {
      await this.pipelineWrite.pushEntities('EngagementVettingItem', gqlItems, [], 'vetting.service:184');
    } catch (err) {
      this.snackBar.open(
        `Failed to initialize vetting items: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return items;
  }

  // ── Create ──

  /**
   * Add a custom vetting item to an engagement.
   */
  async addVettingItem(
    engagementId: string,
    data: CreateVettingItemRequest,
  ): Promise<EngagementVettingItem> {
    const now = new Date().toISOString();

    const item: EngagementVettingItem = {
      id: crypto.randomUUID(),
      engagement_id: engagementId,
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      vetting_type: data.vetting_type,
      evidence_type: data.evidence_type,
      status: 'not_started',
      direction: data.direction,
      condition_trigger: data.condition_trigger ?? null,
      document_ids: [],
      submitted_at: null,
      verified_at: null,
      verified_by: null,
      expires_at: null,
      rejection_reason: null,
      waived_reason: null,
      notes: null,
      created_at: now,
      updated_at: now,
    };

    const gqlData = this.toGql(item);
    try {
      await this.pipelineWrite.pushEntity('EngagementVettingItem', gqlData, [], 'vetting.service:226');
    } catch (err) {
      this.snackBar.open(
        `Failed to add vetting item: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return item;
  }

  // ── Update ──

  /**
   * Update a vetting item. Validates status transitions.
   */
  async updateVettingItem(
    id: string,
    data: UpdateVettingItemRequest,
  ): Promise<EngagementVettingItem> {
    // Fetch current (cache-aware)
    const cached = this.pipelineWrite.getCached('EngagementVettingItem', id);
    let current: EngagementVettingItem | null;
    if (cached) {
      current = this.fromGql(cached as unknown as GqlVettingItemResponse);
    } else {
      const gql = await this.graphqlRead.getById<GqlVettingItemResponse>(
        'EngagementVettingItem',
        id,
        this.getFields(),
      );
      if (!gql) throw new Error(`Vetting item ${id} not found`);
      current = this.fromGql(gql);
    }
    if (!current) throw new Error(`Vetting item ${id} not found`);

    // Validate status transition if status is changing
    if (data.status && data.status !== current.status) {
      const allowed = VETTING_STATUS_TRANSITIONS[current.status];
      if (!allowed.includes(data.status)) {
        throw new Error(`Invalid status transition: ${current.status} → ${data.status}`);
      }
    }

    const now = new Date().toISOString();
    const updated: EngagementVettingItem = {
      ...current,
      ...this.applyUpdates(data),
      updated_at: now,
    };

    // Auto-set timestamps on status changes
    if (data.status === 'submitted' && !updated.submitted_at) {
      updated.submitted_at = now;
    }
    if (data.status === 'verified') {
      updated.verified_at = now;
      updated.verified_by = data.verified_by ?? this.impersonation.effectiveUserId();
    }

    const gqlData = this.toGql(updated);
    try {
      await this.pipelineWrite.pushEntity('EngagementVettingItem', gqlData, [], 'vetting.service:295');
    } catch (err) {
      this.snackBar.open(
        `Failed to update vetting item: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return updated;
  }

  // ── Delete ──

  /**
   * Soft-delete a vetting item.
   */
  async deleteVettingItem(id: string): Promise<void> {
    const cached = this.pipelineWrite.getCached('EngagementVettingItem', id);
    const current = cached ?? await this.graphqlRead.getById<GqlVettingItemResponse>(
      'EngagementVettingItem',
      id,
      this.getFields(),
    );

    const today = new Date().toISOString().split('T')[0];
    const gqlData: Record<string, unknown> = {
      ...(current ?? { id }),
      dateDeleted: today,
    };

    try {
      await this.pipelineWrite.pushEntity('EngagementVettingItem', gqlData, [], 'vetting.service:321');
    } catch (err) {
      this.snackBar.open(
        `Failed to delete vetting item: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  // ── Reference Counting (D-12, D-13) ──

  /**
   * Get count of vetting items referencing a profile item (D-13)
   *
   * Queries all EngagementVettingItem records where profileItemId matches.
   * Used by vendor-profile-tab delete handler to block deletion (D-12).
   *
   * @param profileItemId UUID of the profile item to check
   * @returns Number of vetting items that reference this profile item
   */
  async getProfileItemReferenceCount(profileItemId: string): Promise<number> {
    try {
      const result = await this.graphqlRead.query<{
        items: Array<{ id: string }>;
      }>(
        'EngagementVettingItem',
        ['id'],  // Minimal fields for counting
        {
          filters: {
            profileItemId: `.eq.${profileItemId}`,
          },
          pageSize: 200,
        },
      );
      // Filter out soft-deleted items (dateDeleted present)
      const activeItems = result.items.filter(
        item => !(item as unknown as Record<string, unknown>)['dateDeleted'],
      );
      return activeItems.length;
    } catch (err) {
      console.error('[VettingService] getProfileItemReferenceCount failed:', err);
      return 0;
    }
  }

  /**
   * Get engagement IDs that reference a profile item (D-13)
   *
   * Returns list of engagement IDs (with minimal data) for showing engagement names
   * in the delete-blocked error message (D-12).
   *
   * @param profileItemId UUID of the profile item to check
   * @returns Array of engagement IDs (deduped) that reference this profile item
   */
  async getProfileItemReferences(
    profileItemId: string,
  ): Promise<{ engagementId: string; itemId: string }[]> {
    try {
      const result = await this.graphqlRead.query<{
        items: Array<{ id: string; engagementId: string }>;
      }>(
        'EngagementVettingItem',
        ['id', 'engagementId'],
        {
          filters: {
            profileItemId: `.eq.${profileItemId}`,
          },
          pageSize: 200,
        },
      );
      // Filter out soft-deleted items
      const activeItems = (result.items as unknown as Array<
        Record<string, unknown>
      >).filter(item => !item['dateDeleted']);
      return activeItems
        .filter(item => item['engagementId'] as string)  // Only items with engagement
        .map(item => ({
          engagementId: item['engagementId'] as string,
          itemId: item['id'] as string,
        }));
    } catch (err) {
      console.error('[VettingService] getProfileItemReferences failed:', err);
      return [];
    }
  }

  // ── Private helpers ──

  /**
   * Convert UpdateVettingItemRequest to partial EngagementVettingItem.
   * Maps snake_case request keys to snake_case model keys.
   */
  private applyUpdates(data: UpdateVettingItemRequest): Partial<EngagementVettingItem> {
    const partial: Partial<EngagementVettingItem> = {};
    if (data.name !== undefined) partial.name = data.name;
    if (data.description !== undefined) partial.description = data.description;
    if (data.status !== undefined) partial.status = data.status;
    if (data.document_ids !== undefined) partial.document_ids = data.document_ids;
    if (data.notes !== undefined) partial.notes = data.notes;
    if (data.verified_by !== undefined) partial.verified_by = data.verified_by;
    if (data.expires_at !== undefined) partial.expires_at = data.expires_at;
    if (data.rejection_reason !== undefined) partial.rejection_reason = data.rejection_reason;
    if (data.waived_reason !== undefined) partial.waived_reason = data.waived_reason;
    if (data.profile_item_id !== undefined) partial.profile_item_id = data.profile_item_id;
    return partial;
  }

  /**
   * Transform GQL response → Neon model.
   * Special handling: documentIds is a JSON string in GQL, parsed to string[] in model.
   */
  private fromGql(gql: GqlVettingItemResponse): EngagementVettingItem {
    const mapped = mapGqlToNeon<EngagementVettingItem>(gql, VETTING_ITEM_FIELD_MAPPING.gqlToNeon);

    // Parse documentIds from JSON string → string[]
    const rawDocIds = (gql as unknown as Record<string, unknown>)['documentIds'];
    if (typeof rawDocIds === 'string' && rawDocIds) {
      try { mapped.document_ids = JSON.parse(rawDocIds); } catch { mapped.document_ids = []; }
    } else {
      mapped.document_ids = Array.isArray(mapped.document_ids) ? mapped.document_ids : [];
    }

    return mapped;
  }

  /**
   * Transform Neon model → GQL data for pipeline push.
   * Special handling: document_ids array → JSON string for GQL.
   */
  private toGql(item: EngagementVettingItem): Record<string, unknown> {
    const gql = mapNeonToGql<GqlVettingItemResponse>(
      item,
      VETTING_ITEM_FIELD_MAPPING.neonToGql,
    ) as unknown as Record<string, unknown>;

    // Serialize document_ids array → JSON string for GQL
    gql['documentIds'] = JSON.stringify(item.document_ids ?? []);

    return gql;
  }

  /**
   * Derive overall vetting gate status from summary counts.
   * - not_started: no items have any activity
   * - in_progress: some items resolved, some remaining
   * - blocked: any required item is rejected or expired
   * - verified: all required (always) items are verified or waived
   */
  private computeGateStatus(summary: VettingSummary, requiredTotal: number): VettingGateStatus {
    if (requiredTotal === 0) return 'verified'; // no required items = pass
    if (summary.requiredRemaining === 0) return 'verified';
    if (summary.rejected > 0 || summary.expired > 0) return 'blocked';
    if (summary.verified > 0 || summary.waived > 0 || summary.pending < summary.total) return 'in_progress';
    return 'not_started';
  }

  // ── Pilot Completion Suggestion Methods (Plan 077) ──

  /**
   * Set the pilot completion suggestion signal.
   * Called from project-detail.component when pilot is marked complete.
   */
  setPilotCompletionSuggestion(suggestion: PilotCompletionSuggestion): void {
    this._pilotCompletionSuggestion.set(suggestion);
  }

  /**
   * Clear the pilot completion suggestion (when buyer dismisses).
   */
  clearPilotCompletionSuggestion(): void {
    this._pilotCompletionSuggestion.set(null);
  }

  private getFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'engagementId',
      'category',
      'vettingType',
      'evidenceType',
      'status',
      'direction',
      'conditionTrigger',
      'documentIds',
      'submittedAt',
      'verifiedAt',
      'verifiedBy',
      'expiresAt',
      'rejectionReason',
      'waivedReason',
      'notes',
      'profileItemId',
      'dateCreated',
      'dateLastModified',
      'dateDeleted',
      'tag',
    ];
  }
}
