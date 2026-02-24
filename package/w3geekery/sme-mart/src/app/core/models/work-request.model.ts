import { BudgetType, RequestStatus } from './enums';

export interface WorkRequest {
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
}

// VIEW model — v_engagement_summary
export interface EngagementSummaryRow extends WorkRequest {
  buyer_display_name: string | null;
  buyer_avatar_url: string | null;
  proposal_count: number;
  pending_proposal_count: number;
  accepted_provider_name: string | null;
  accepted_provider_id: string | null;
}

// VIEW model — v_engagement_detail
export interface EngagementDetailRow extends WorkRequest {
  buyer_display_name: string | null;
  buyer_email: string | null;
  proposals: string; // JSON array string
  proposal_count: number;
}
