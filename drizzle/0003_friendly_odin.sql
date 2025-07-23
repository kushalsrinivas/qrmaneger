DROP TABLE "mojoqr_analytics_cache" CASCADE;--> statement-breakpoint
ALTER TABLE "public"."mojoqr_qr_code" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."mojoqr_template" ALTER COLUMN "qrCodeType" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."qr_code_type";--> statement-breakpoint
CREATE TYPE "public"."qr_code_type" AS ENUM('url');--> statement-breakpoint
ALTER TABLE "public"."mojoqr_qr_code" ALTER COLUMN "type" SET DATA TYPE "public"."qr_code_type" USING "type"::"public"."qr_code_type";--> statement-breakpoint
ALTER TABLE "public"."mojoqr_template" ALTER COLUMN "qrCodeType" SET DATA TYPE "public"."qr_code_type" USING "qrCodeType"::"public"."qr_code_type";