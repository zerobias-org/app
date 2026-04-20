import { AvailabilityStatus, ProficiencyLevel } from './enums';

export interface ProviderProfile {
  id: string;
  user_id: string | null;
  slug: string;
  zerobias_user_id: string;
  zerobias_org_id: string | null;
  display_name: string;
  headline: string | null;
  about: string | null;
  avatar_url: string | null;
  hourly_rate: string | null;
  availability_status: AvailabilityStatus;
  response_time: string | null;
  total_jobs_completed: number;
  total_earnings: string;
  rating_average: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderSkill {
  id: string;
  provider_id: string | null;
  zerobias_skill_id: string;
  skill_name: string;
  proficiency_level: ProficiencyLevel | null;
  years_experience: number | null;
  verified: boolean;
  created_at: string;
}

export interface ProviderRole {
  id: string;
  provider_id: string | null;
  zerobias_role_id: string;
  role_name: string | null;
  is_primary: boolean;
  years_in_role: number | null;
  created_at: string;
}

export interface ProviderProduct {
  id: string;
  provider_id: string | null;
  zerobias_product_id: string;
  product_name: string | null;
  proficiency_level: ProficiencyLevel | null;
  years_experience: number | null;
  certified: boolean;
  certification_details: string | null;
  created_at: string;
}

export interface ProviderFramework {
  id: string;
  provider_id: string | null;
  zerobias_framework_id: string;
  framework_name: string | null;
  proficiency_level: ProficiencyLevel | null;
  years_experience: number | null;
  assessor_certified: boolean;
  implementation_experience: boolean;
  audit_experience: boolean;
  created_at: string;
}

export interface ProviderSegment {
  id: string;
  provider_id: string | null;
  zerobias_segment_id: string;
  segment_name: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ProviderServiceSegment {
  id: string;
  provider_id: string | null;
  zerobias_service_segment_id: string;
  service_segment_name: string | null;
  is_primary: boolean;
  created_at: string;
}

// VIEW model — v_provider_directory (consolidated read)
export interface ProviderDirectoryRow extends ProviderProfile {
  skills: string; // JSON array string — parse with JSON.parse()
  roles: string;
  products: string;
  frameworks: string;
  segments: string;
  service_segments: string;
  skill_count: number;
  role_count: number;
  service_count: number;
  review_count: number;
}

// VIEW model — v_provider_detail (full profile)
export interface ProviderDetailRow extends ProviderProfile {
  user_email: string | null;
  user_org_id: string | null;
  skills: string;
  roles: string;
  products: string;
  frameworks: string;
  segments: string;
  service_segments: string;
  service_offerings: string;
  reviews: string;
  review_count: number;
}
