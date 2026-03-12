export interface AppSetting {
  id: string;
  key: string;
  value: string; // JSON stringified — deserialize before use
  description: string | null;
  category: string | null;
  updated_at: string;
  updated_by: string | null;
}

// VIEW model — v_admin_stats
export interface AdminStats {
  total_users: number;
  total_providers: number;
  total_requests: number;
  open_requests: number;
  total_engagements: number;
  total_bids: number;
  total_reviews: number;
  pending_reviews: number;
  active_services: number;
}
