ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "approved_by" text;