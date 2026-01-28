CREATE TYPE "public"."availability_status" AS ENUM('available', 'busy', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."budget_type" AS ENUM('fixed', 'hourly', 'negotiable');--> statement-breakpoint
CREATE TYPE "public"."pricing_type" AS ENUM('fixed', 'hourly', 'subscription', 'custom');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('beginner', 'intermediate', 'expert');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"provider_id" uuid,
	"cover_letter" text,
	"proposed_price" numeric(10, 2),
	"proposed_timeline" text,
	"status" "proposal_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zerobias_user_id" text NOT NULL,
	"zerobias_org_id" text,
	"display_name" text NOT NULL,
	"headline" text,
	"about" text,
	"avatar_url" text,
	"hourly_rate" numeric(10, 2),
	"availability_status" "availability_status" DEFAULT 'available',
	"response_time" text,
	"total_jobs_completed" integer DEFAULT 0,
	"total_earnings" numeric(12, 2) DEFAULT '0',
	"rating_average" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "provider_profiles_zerobias_user_id_unique" UNIQUE("zerobias_user_id")
);
--> statement-breakpoint
CREATE TABLE "provider_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid,
	"skill_name" text NOT NULL,
	"skill_category" text,
	"proficiency_level" "proficiency_level",
	"years_experience" integer,
	"verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid,
	"reviewer_zerobias_user_id" text NOT NULL,
	"request_id" uuid,
	"rating" integer NOT NULL,
	"review_text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"subcategory" text,
	"pricing_type" "pricing_type" NOT NULL,
	"price" numeric(10, 2),
	"delivery_time" text,
	"includes" text[],
	"requirements" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_zerobias_user_id" text NOT NULL,
	"buyer_zerobias_org_id" text,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"budget_type" "budget_type",
	"budget_min" numeric(10, 2),
	"budget_max" numeric(10, 2),
	"timeline" text,
	"status" "request_status" DEFAULT 'open',
	"zerobias_boundary_id" text,
	"zerobias_task_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_request_id_work_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."work_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_skills" ADD CONSTRAINT "provider_skills_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_request_id_work_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."work_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_offerings" ADD CONSTRAINT "service_offerings_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;