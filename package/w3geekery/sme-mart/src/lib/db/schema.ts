import { pgTable, uuid, text, decimal, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

export const availabilityStatusEnum = pgEnum('availability_status', ['available', 'busy', 'unavailable']);
export const pricingTypeEnum = pgEnum('pricing_type', ['fixed', 'hourly', 'subscription', 'custom']);
export const budgetTypeEnum = pgEnum('budget_type', ['fixed', 'hourly', 'negotiable']);
export const requestStatusEnum = pgEnum('request_status', ['draft', 'open', 'in_progress', 'completed', 'cancelled']);
export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected', 'withdrawn']);
export const proficiencyLevelEnum = pgEnum('proficiency_level', ['beginner', 'intermediate', 'expert']);

// =============================================================================
// MARKETPLACE USERS — Central identity for all SME Mart account holders
// Links to ZeroBias Dana user. A user can be a provider, buyer, or both.
// =============================================================================

export const marketplaceUsers = pgTable('marketplace_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  zerobiasUserId: text('zerobias_user_id').notNull().unique(),
  zerobiasOrgId: text('zerobias_org_id'),
  displayName: text('display_name').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================================================
// PROVIDER PROFILES
// Extends marketplace user with provider-specific data
// =============================================================================

export const providerProfiles = pgTable('provider_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => marketplaceUsers.id),
  slug: text('slug').notNull().unique(),
  zerobiasUserId: text('zerobias_user_id').notNull().unique(), // TODO: migrate to userId, then drop
  zerobiasOrgId: text('zerobias_org_id'), // TODO: migrate to marketplace_users.zerobias_org_id
  displayName: text('display_name').notNull(),
  headline: text('headline'),
  about: text('about'),
  avatarUrl: text('avatar_url'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  availabilityStatus: availabilityStatusEnum('availability_status').default('available'),
  responseTime: text('response_time'),
  totalJobsCompleted: integer('total_jobs_completed').default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0'),
  ratingAverage: decimal('rating_average', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// =============================================================================
// PROVIDER SKILLS (References ZeroBias NICE Skills)
//
// ZeroBias Source: GET /platform/catalog/roleQualifications?qualificationType=skill
// 556 NICE skills available (S0001-S0365 codes)
//
// Store only the ZeroBias skill ID - fetch name/description from ZeroBias API
// =============================================================================

export const providerSkills = pgTable('provider_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),

  // ZeroBias NICE Skill reference (e.g., "S0001", "S0073")
  zerobiasSkillId: text('zerobias_skill_id').notNull(),
  // Cached skill name for display (denormalized from ZeroBias catalog)
  skillName: text('skill_name').notNull(),

  // SME Mart-specific metadata (not in ZeroBias)
  proficiencyLevel: proficiencyLevelEnum('proficiency_level'),
  yearsExperience: integer('years_experience'),
  verified: boolean('verified').default(false),

  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// PROVIDER ROLES (References ZeroBias NICE Work Roles)
//
// ZeroBias Source: GET /platform/catalog/roles
// 95 NICE Work Roles across 7 Role Categories
//
// Store only the ZeroBias role ID - fetch name/description from ZeroBias API
// =============================================================================

export const providerRoles = pgTable('provider_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),

  // ZeroBias NICE Work Role reference (UUID)
  // Fetch role details from ZeroBias API: GET /platform/catalog/roles/{id}
  zerobiasRoleId: text('zerobias_role_id').notNull(),

  // SME Mart-specific metadata
  isPrimary: boolean('is_primary').default(false), // Primary role for this provider
  yearsInRole: integer('years_in_role'),

  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// PROVIDER PRODUCTS (References ZeroBias Product Catalog)
//
// ZeroBias Source: POST /portal/productSearch
// 663 products from 438 vendors (AWS, Azure, GCP, security tools, etc.)
//
// Store only the ZeroBias product ID - fetch name/vendor from ZeroBias API
// =============================================================================

export const providerProducts = pgTable('provider_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),

  // ZeroBias Product reference (UUID)
  // Fetch product details from ZeroBias API: GET /portal/products/{id}
  zerobiasProductId: text('zerobias_product_id').notNull(),

  // SME Mart-specific metadata
  proficiencyLevel: proficiencyLevelEnum('proficiency_level'),
  yearsExperience: integer('years_experience'),
  certified: boolean('certified').default(false), // Has vendor certification
  certificationDetails: text('certification_details'),

  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// PROVIDER FRAMEWORKS (References ZeroBias Framework Catalog)
//
// ZeroBias Source: GET /platform/catalog/frameworks
// 12 frameworks (NIST-800-53, ISO-27001, SOC2, FedRAMP, CMMC, etc.)
//
// Store only the ZeroBias framework ID - fetch name/description from ZeroBias API
// =============================================================================

export const providerFrameworks = pgTable('provider_frameworks', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),

  // ZeroBias Framework reference (UUID)
  // Fetch framework details from ZeroBias API: GET /platform/catalog/frameworks/{id}
  zerobiasFrameworkId: text('zerobias_framework_id').notNull(),

  // SME Mart-specific metadata
  proficiencyLevel: proficiencyLevelEnum('proficiency_level'),
  yearsExperience: integer('years_experience'),
  assessorCertified: boolean('assessor_certified').default(false), // Certified to assess this framework
  implementationExperience: boolean('implementation_experience').default(false),
  auditExperience: boolean('audit_experience').default(false),

  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// PROVIDER SEGMENTS (References ZeroBias Segment Catalog)
//
// ZeroBias Source: GET /platform/catalog/segments
// 128 segments (SIEM, EDR, CSPM, IAM, API Security, etc.)
//
// Store only the ZeroBias segment ID - fetch name/description from ZeroBias API
// =============================================================================

export const providerSegments = pgTable('provider_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),

  // ZeroBias Segment reference (UUID)
  // Fetch segment details from ZeroBias API: GET /platform/catalog/segments/{id}
  zerobiasSegmentId: text('zerobias_segment_id').notNull(),

  // SME Mart-specific metadata
  isPrimary: boolean('is_primary').default(false), // Primary specialty

  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// PROVIDER SERVICE SEGMENTS (References ZeroBias Service Segment Tags)
//
// ZeroBias Source: GET /platform/tags?tagTypes=service-segment
// 9 professional service categories (soc, pentesting, compliance, risk, training, etc.)
//
// These are the primary categories for the SME Mart marketplace.
// Store the ZeroBias tag ID - fetch name/description from ZeroBias API
// =============================================================================

export const providerServiceSegments = pgTable('provider_service_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),

  // ZeroBias Service Segment Tag reference (UUID)
  // Fetch tag details from ZeroBias API: GET /platform/tags?tagTypes=service-segment
  zerobiasServiceSegmentId: text('zerobias_service_segment_id').notNull(),

  // SME Mart-specific metadata
  isPrimary: boolean('is_primary').default(false), // Primary service category

  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// SERVICE OFFERINGS (SME Mart-specific - Upwork Project Catalog pattern)
// =============================================================================

export const serviceOfferings = pgTable('service_offerings', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(), // References local categories table (slug)
  subcategory: text('subcategory'),
  pricingType: pricingTypeEnum('pricing_type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  deliveryTime: text('delivery_time'),
  includes: text('includes').array(),
  requirements: text('requirements'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// WORK REQUESTS (SME Mart-specific - Upwork job posting pattern)
// =============================================================================

export const workRequests = pgTable('work_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerUserId: uuid('buyer_user_id').references(() => marketplaceUsers.id),
  buyerZerobiasUserId: text('buyer_zerobias_user_id').notNull(), // TODO: migrate to buyerUserId, then drop
  buyerZerobiasOrgId: text('buyer_zerobias_org_id'), // TODO: migrate to marketplace_users.zerobias_org_id
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(), // References local categories table (slug)
  budgetType: budgetTypeEnum('budget_type'),
  budgetMin: decimal('budget_min', { precision: 10, scale: 2 }),
  budgetMax: decimal('budget_max', { precision: 10, scale: 2 }),
  timeline: text('timeline'),
  status: requestStatusEnum('status').default('open'),
  engagementTag: text('engagement_tag'),         // BIP39-style tag: ENG-word-word
  zerobiasTagId: text('zerobias_tag_id'),         // ZeroBias Dana tag UUID
  zerobiasBoundaryId: text('zerobias_boundary_id'),
  zerobiasTaskId: text('zerobias_task_id'),
  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// PROPOSALS (SME Mart-specific - Upwork proposal pattern)
// =============================================================================

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => workRequests.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  coverLetter: text('cover_letter'),
  proposedPrice: decimal('proposed_price', { precision: 10, scale: 2 }),
  proposedTimeline: text('proposed_timeline'),
  status: proposalStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// REVIEWS (SME Mart-specific - requires approval before display)
// =============================================================================

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  reviewerZerobiasUserId: text('reviewer_zerobias_user_id').notNull(),
  requestId: uuid('request_id').references(() => workRequests.id),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  // Approval workflow - reviews must be approved before display
  approved: boolean('approved').default(false),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'), // ZeroBias user ID of approver (provider or admin)
  createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// CATEGORIES (SME Mart-specific marketplace taxonomy)
// NOT the same as ZeroBias segments - these are marketplace service categories
// (Assessors, Advisors, Agentic, SecOps, DevSecOps, etc.)
// =============================================================================

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id'), // Self-reference for hierarchy
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0)
});

// =============================================================================
// APP SETTINGS (SME Mart app-wide configuration)
// Key-value store for admin-configurable settings
// =============================================================================

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON stringified value
  description: text('description'),
  category: text('category'), // Group settings by category (e.g., 'marketplace', 'registration')
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by') // ZeroBias user ID of admin who changed it
});

// =============================================================================
// RELATIONS
// =============================================================================

export const marketplaceUsersRelations = relations(marketplaceUsers, ({ one, many }) => ({
  providerProfile: one(providerProfiles, {
    fields: [marketplaceUsers.id],
    references: [providerProfiles.userId],
  }),
  workRequests: many(workRequests),
}));

export const providerProfilesRelations = relations(providerProfiles, ({ one, many }) => ({
  user: one(marketplaceUsers, {
    fields: [providerProfiles.userId],
    references: [marketplaceUsers.id],
  }),
  skills: many(providerSkills),
  roles: many(providerRoles),
  products: many(providerProducts),
  frameworks: many(providerFrameworks),
  segments: many(providerSegments),
  serviceSegments: many(providerServiceSegments),
  serviceOfferings: many(serviceOfferings),
  proposals: many(proposals),
  reviews: many(reviews)
}));

export const providerSkillsRelations = relations(providerSkills, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerSkills.providerId],
    references: [providerProfiles.id]
  })
}));

export const providerRolesRelations = relations(providerRoles, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerRoles.providerId],
    references: [providerProfiles.id]
  })
}));

export const providerProductsRelations = relations(providerProducts, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerProducts.providerId],
    references: [providerProfiles.id]
  })
}));

export const providerFrameworksRelations = relations(providerFrameworks, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerFrameworks.providerId],
    references: [providerProfiles.id]
  })
}));

export const providerSegmentsRelations = relations(providerSegments, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerSegments.providerId],
    references: [providerProfiles.id]
  })
}));

export const providerServiceSegmentsRelations = relations(providerServiceSegments, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerServiceSegments.providerId],
    references: [providerProfiles.id]
  })
}));

export const serviceOfferingsRelations = relations(serviceOfferings, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [serviceOfferings.providerId],
    references: [providerProfiles.id]
  })
}));

export const workRequestsRelations = relations(workRequests, ({ one, many }) => ({
  buyer: one(marketplaceUsers, {
    fields: [workRequests.buyerUserId],
    references: [marketplaceUsers.id],
  }),
  proposals: many(proposals),
  reviews: many(reviews),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  request: one(workRequests, {
    fields: [proposals.requestId],
    references: [workRequests.id]
  }),
  provider: one(providerProfiles, {
    fields: [proposals.providerId],
    references: [providerProfiles.id]
  })
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [reviews.providerId],
    references: [providerProfiles.id]
  }),
  request: one(workRequests, {
    fields: [reviews.requestId],
    references: [workRequests.id]
  })
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild'
  }),
  children: many(categories, { relationName: 'parentChild' })
}));
