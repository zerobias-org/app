import { BudgetType, RequestStatus } from './enums';

export interface Engagement {
  id: string;
  buyer_user_id: string | null;
  buyer_zerobias_user_id: string;
  buyer_zerobias_org_id: string | null;
  title: string;
  description: string | null;
  category: string;
  budget_type: BudgetType | null;
  budget_min: string | null;
  budget_max: string | null;
  timeline: string | null;
  status: RequestStatus;
  engagement_tag: string | null;
  zerobias_tag_id: string | null;
  zerobias_boundary_id: string | null;
  zerobias_task_id: string | null;
  created_at: string;
  updated_at: string;
}

// VIEW model — v_engagement_summary
export interface EngagementSummaryRow extends Engagement {
  buyer_display_name: string | null;
  buyer_avatar_url: string | null;
  bid_count: number;
  pending_bid_count: number;
  accepted_provider_name: string | null;
  accepted_provider_id: string | null;
}

// VIEW model — v_engagement_detail
export interface EngagementDetailRow extends Engagement {
  buyer_display_name: string | null;
  buyer_email: string | null;
  bids: string; // JSON array string
  bid_count: number;
}

/**
 * @deprecated Use Engagement instead
 * Backward compatibility alias for code that still imports WorkRequest type
 */
export type WorkRequest = Engagement;
