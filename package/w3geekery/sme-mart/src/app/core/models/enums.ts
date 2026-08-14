// PostgreSQL enum types — must match Neon schema exactly

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';

export type PricingType = 'fixed' | 'hourly' | 'subscription' | 'custom';

export type BudgetType = 'fixed' | 'hourly' | 'negotiable';

export type RequestStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export type BidStatus = 'draft' | 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'expert';

// Application-level type (not a DB enum)
export type UserRole = 'buyer' | 'vendor' | 'both';

// Renamed 'provider' -> 'vendor' 2026-08-13. This value is PERSISTED to PKV, so prefs
// written before the rename still carry 'provider'. Read paths must migrate it rather
// than cast blindly — see normalizeUserRole in user-preferences.service.ts.
export type PersistedUserRole = UserRole | 'provider';

// ZeroBias platform resource types (D-29, D-30)
// Used for discriminating linked resources and hierarchical navigation
export enum ResourceType {
  engagement = 'engagement',
  vendor = 'vendor',
  project = 'project',      // D-29: platform.Project workspace
  board = 'board',          // D-30: platform.Board vetting/kanban
  task = 'task',
  document = 'document',
}
