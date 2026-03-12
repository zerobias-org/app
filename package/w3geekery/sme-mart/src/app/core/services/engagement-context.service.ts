import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import type { EngagementDetailRow, Bid, RequestStatus } from '../models';
import type { BidCardData } from '../../shared/components/bid-card/bid-card.component';

interface ParsedBid extends Bid {
  provider_display_name?: string;
  provider_headline?: string;
  provider_rating?: number;
}

/**
 * Shared context for the engagement detail layout and its child route tabs.
 *
 * The parent (EngagementDetail) loads engagement data and pushes it here.
 * Child tab components inject this service and read signals.
 */
@Injectable({ providedIn: 'root' })
export class EngagementContextService {
  // --- writable state (set by parent) ---
  private readonly _engagement = signal<EngagementDetailRow | null>(null);
  private readonly _currentUserId = signal<string | null>(null);
  private readonly _currentProviderId = signal<string | null>(null);

  // --- public readonly signals (read by children) ---
  readonly engagement = this._engagement.asReadonly();
  readonly currentUserId = this._currentUserId.asReadonly();
  readonly currentProviderId = this._currentProviderId.asReadonly();

  readonly isRfp = computed(() => !this.engagement()?.engagement_tag);
  readonly engagementTag = computed(() => this.engagement()?.engagement_tag || null);
  readonly status = computed<RequestStatus>(() => this.engagement()?.status || 'draft');

  readonly isOwner = computed(() => {
    const uid = this.currentUserId();
    const eng = this.engagement();
    return uid && eng ? eng.buyer_zerobias_user_id === uid : false;
  });

  readonly parsedBids = computed<BidCardData[]>(() => {
    const eng = this.engagement();
    if (!eng?.bids) return [];
    try {
      const raw: ParsedBid[] = typeof eng.bids === 'string'
        ? JSON.parse(eng.bids)
        : eng.bids as any;
      return raw.map(p => ({
        id: p.id,
        provider_id: p.provider_id,
        provider_display_name: p.provider_display_name,
        provider_headline: p.provider_headline,
        provider_rating: p.provider_rating,
        cover_letter: p.cover_letter,
        proposed_price: p.proposed_price,
        proposed_timeline: p.proposed_timeline,
        status: p.status,
        created_at: p.created_at,
      }));
    } catch {
      return [];
    }
  });

  readonly hasAlreadyBid = computed(() => {
    const pid = this.currentProviderId();
    if (!pid) return false;
    return this.parsedBids().some(p => p.provider_id === pid);
  });

  readonly acceptedBid = computed(() =>
    this.parsedBids().find(p => p.status === 'accepted') || null,
  );

  readonly statusColor = computed(() => {
    const colorMap: Record<RequestStatus, string> = {
      draft: 'default',
      open: 'primary',
      in_progress: 'accent',
      completed: 'primary',
      cancelled: 'warn',
    };
    return colorMap[this.status()] || 'default';
  });

  // --- refresh notification (child → parent → all children) ---
  private readonly _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

  // --- setters (called by parent) ---

  setEngagement(eng: EngagementDetailRow | null): void {
    this._engagement.set(eng);
  }

  setCurrentUserId(userId: string | null): void {
    this._currentUserId.set(userId);
  }

  setCurrentProviderId(providerId: string | null): void {
    this._currentProviderId.set(providerId);
  }

  /** Child components call this to request a data refresh from the parent. */
  requestRefresh(): void {
    this._refresh$.next();
  }

  /** Reset all state (called when parent destroys). */
  clear(): void {
    this._engagement.set(null);
    this._currentUserId.set(null);
    this._currentProviderId.set(null);
  }
}
