import { PricingType } from './enums';

export interface ServiceOffering {
  id: string;
  provider_id: string | null;
  provider_display_name?: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  pricing_type: PricingType;
  price: string | null;
  delivery_time: string | null;
  includes: string[] | null;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
}
