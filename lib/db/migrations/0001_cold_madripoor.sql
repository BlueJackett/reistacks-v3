CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role" "role" DEFAULT 'member' NOT NULL;