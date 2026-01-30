-- Add slug column as nullable first
ALTER TABLE "provider_profiles" ADD COLUMN "slug" text;

-- Backfill slugs from display_name (lowercase, replace spaces/special chars with hyphens)
UPDATE "provider_profiles"
SET "slug" = lower(regexp_replace(regexp_replace("display_name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE "slug" IS NULL;

-- Set NOT NULL constraint
ALTER TABLE "provider_profiles" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_slug_unique" UNIQUE("slug");
