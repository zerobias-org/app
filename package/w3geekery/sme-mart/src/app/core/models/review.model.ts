export interface Review {
  id: string;
  provider_id: string | null;
  reviewer_zerobias_user_id: string;
  request_id: string | null;
  rating: number;
  review_text: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

// VIEW model — v_admin_reviews
export interface AdminReviewRow extends Review {
  provider_name: string;
  provider_avatar: string | null;
  request_title: string | null;
}
