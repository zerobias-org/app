import { BidStatus } from './enums';

export interface Bid {
  id: string;
  request_id: string | null;
  provider_id: string | null;
  cover_letter: string | null;
  proposed_price: string | null;
  proposed_timeline: string | null;
  status: BidStatus;
  created_at: string;
  updated_at: string;

  // Extended fields (Plan 033 Phase 1)
  executive_summary?: string | null;
  team_description?: string | null;
  total_estimated_hours?: number | null;
  pricing_breakdown?: TaskTypePricing[] | null;
  wizard_data?: Record<string, unknown> | null;
  wizard_step?: number | null;
}

export interface TaskTypePricing {
  taskType: string;
  estimatedHours: number;
  estimatedCost: number;
  notes?: string;
}

/** VIEW model — v_bid_summary (bid + compliance rollups from bid_responses) */
export interface BidSummaryRow extends Bid {
  rfp_title: string | null;
  category: string | null;
  budget_type: string | null;
  budget_min: string | null;
  budget_max: string | null;
  total_responses: number;
  met_count: number;
  partial_count: number;
  not_met_count: number;
  na_count: number;
  planned_count: number;
  sum_estimated_hours: number;
  sum_estimated_cost: number;
  // Provider profile fields (LEFT JOIN provider_profiles)
  provider_display_name: string | null;
  provider_headline: string | null;
  provider_rating: number | null;
}

/** Wizard step data for draft persistence */
export interface BidWizardData {
  approach?: {
    executive_summary?: string;
    cover_letter?: string;
  };
  team?: {
    team_description?: string;
  };
  pricing?: {
    proposed_price?: string;
    proposed_timeline?: string;
    total_estimated_hours?: number;
    pricing_breakdown?: TaskTypePricing[];
  };
}
