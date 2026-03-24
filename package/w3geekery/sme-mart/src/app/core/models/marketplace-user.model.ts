export interface MarketplaceUser {
  id: string;
  zerobias_user_id: string;
  zerobias_org_id: string | null;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
