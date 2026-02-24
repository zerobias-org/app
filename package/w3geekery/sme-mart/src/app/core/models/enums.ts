// PostgreSQL enum types — must match Neon schema exactly

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';

export type PricingType = 'fixed' | 'hourly' | 'subscription' | 'custom';

export type BudgetType = 'fixed' | 'hourly' | 'negotiable';

export type RequestStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'expert';

// Application-level type (not a DB enum)
export type UserRole = 'buyer' | 'provider' | 'both';
