CREATE TYPE "public"."analytics_event_type" AS ENUM('scan', 'view', 'click', 'download', 'share', 'error');--> statement-breakpoint
CREATE TYPE "public"."qr_code_status" AS ENUM('active', 'inactive', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."qr_code_type" AS ENUM('url', 'vcard', 'wifi', 'text', 'sms', 'email', 'phone', 'location', 'event', 'app_download', 'multi_url', 'menu', 'payment', 'pdf', 'image', 'video');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('business', 'personal', 'event', 'marketing', 'restaurant', 'retail', 'education', 'healthcare');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'team_lead', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "mojoqr_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "mojoqr_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "mojoqr_analytics_event" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"qrCodeId" varchar(255) NOT NULL,
	"eventType" "analytics_event_type" NOT NULL,
	"data" jsonb,
	"sessionId" varchar(255),
	"userId" varchar(255),
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"datePartition" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mojoqr_folder" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7),
	"icon" varchar(50),
	"parentId" varchar(255),
	"userId" varchar(255) NOT NULL,
	"organizationId" varchar(255),
	"path" varchar(1000),
	"level" integer DEFAULT 0 NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_organization_member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organizationId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"permissions" jsonb,
	"joinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_organization" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"logo" varchar(500),
	"website" varchar(500),
	"settings" jsonb,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_post" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "mojoqr_post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(256),
	"createdById" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_qr_code" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "qr_code_type" NOT NULL,
	"status" "qr_code_status" DEFAULT 'active' NOT NULL,
	"isDynamic" boolean DEFAULT false NOT NULL,
	"staticContent" text,
	"dynamicUrl" varchar(500),
	"originalUrl" varchar(2000),
	"data" jsonb,
	"style" jsonb,
	"size" integer DEFAULT 512 NOT NULL,
	"format" varchar(10) DEFAULT 'png' NOT NULL,
	"errorCorrection" varchar(1) DEFAULT 'M' NOT NULL,
	"imageUrl" varchar(500),
	"imageSize" integer,
	"folderId" varchar(255),
	"templateId" varchar(255),
	"tags" jsonb,
	"userId" varchar(255) NOT NULL,
	"organizationId" varchar(255),
	"expiresAt" timestamp with time zone,
	"scanCount" integer DEFAULT 0 NOT NULL,
	"lastScannedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mojoqr_template" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "template_category" NOT NULL,
	"qrCodeType" "qr_code_type" NOT NULL,
	"config" jsonb,
	"isPublic" boolean DEFAULT false NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"tags" jsonb,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"userId" varchar(255),
	"organizationId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"firstName" varchar(255),
	"lastName" varchar(255),
	"company" varchar(255),
	"jobTitle" varchar(255),
	"phone" varchar(50),
	"timezone" varchar(50) DEFAULT 'UTC',
	"language" varchar(10) DEFAULT 'en',
	"settings" jsonb,
	"plan" varchar(50) DEFAULT 'free',
	"planExpiresAt" timestamp with time zone,
	"lastLoginAt" timestamp with time zone,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mojoqr_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "mojoqr_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "mojoqr_account" ADD CONSTRAINT "mojoqr_account_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_analytics_event" ADD CONSTRAINT "mojoqr_analytics_event_qrCodeId_mojoqr_qr_code_id_fk" FOREIGN KEY ("qrCodeId") REFERENCES "public"."mojoqr_qr_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_analytics_event" ADD CONSTRAINT "mojoqr_analytics_event_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_folder" ADD CONSTRAINT "mojoqr_folder_parentId_mojoqr_folder_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."mojoqr_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_folder" ADD CONSTRAINT "mojoqr_folder_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_folder" ADD CONSTRAINT "mojoqr_folder_organizationId_mojoqr_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."mojoqr_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_organization_member" ADD CONSTRAINT "mojoqr_organization_member_organizationId_mojoqr_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."mojoqr_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_organization_member" ADD CONSTRAINT "mojoqr_organization_member_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_post" ADD CONSTRAINT "mojoqr_post_createdById_mojoqr_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."mojoqr_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_qr_code" ADD CONSTRAINT "mojoqr_qr_code_folderId_mojoqr_folder_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."mojoqr_folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_qr_code" ADD CONSTRAINT "mojoqr_qr_code_templateId_mojoqr_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."mojoqr_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_qr_code" ADD CONSTRAINT "mojoqr_qr_code_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_qr_code" ADD CONSTRAINT "mojoqr_qr_code_organizationId_mojoqr_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."mojoqr_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_session" ADD CONSTRAINT "mojoqr_session_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_template" ADD CONSTRAINT "mojoqr_template_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_template" ADD CONSTRAINT "mojoqr_template_organizationId_mojoqr_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."mojoqr_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "mojoqr_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_qr_code_idx" ON "mojoqr_analytics_event" USING btree ("qrCodeId");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "mojoqr_analytics_event" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "analytics_timestamp_idx" ON "mojoqr_analytics_event" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "analytics_date_partition_idx" ON "mojoqr_analytics_event" USING btree ("datePartition");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "mojoqr_analytics_event" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "analytics_user_idx" ON "mojoqr_analytics_event" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_qr_timestamp_idx" ON "mojoqr_analytics_event" USING btree ("qrCodeId","timestamp");--> statement-breakpoint
CREATE INDEX "analytics_qr_type_idx" ON "mojoqr_analytics_event" USING btree ("qrCodeId","eventType");--> statement-breakpoint
CREATE INDEX "folder_user_idx" ON "mojoqr_folder" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "folder_org_idx" ON "mojoqr_folder" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "folder_parent_idx" ON "mojoqr_folder" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "folder_path_idx" ON "mojoqr_folder" USING btree ("path");--> statement-breakpoint
CREATE INDEX "folder_level_idx" ON "mojoqr_folder" USING btree ("level");--> statement-breakpoint
CREATE INDEX "org_member_org_idx" ON "mojoqr_organization_member" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "org_member_user_idx" ON "mojoqr_organization_member" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "org_member_role_idx" ON "mojoqr_organization_member" USING btree ("role");--> statement-breakpoint
CREATE INDEX "organization_name_idx" ON "mojoqr_organization" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organization_active_idx" ON "mojoqr_organization" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "created_by_idx" ON "mojoqr_post" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "name_idx" ON "mojoqr_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX "qr_code_user_idx" ON "mojoqr_qr_code" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "qr_code_org_idx" ON "mojoqr_qr_code" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "qr_code_folder_idx" ON "mojoqr_qr_code" USING btree ("folderId");--> statement-breakpoint
CREATE INDEX "qr_code_template_idx" ON "mojoqr_qr_code" USING btree ("templateId");--> statement-breakpoint
CREATE INDEX "qr_code_type_idx" ON "mojoqr_qr_code" USING btree ("type");--> statement-breakpoint
CREATE INDEX "qr_code_status_idx" ON "mojoqr_qr_code" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qr_code_dynamic_idx" ON "mojoqr_qr_code" USING btree ("isDynamic");--> statement-breakpoint
CREATE INDEX "qr_code_dynamic_url_idx" ON "mojoqr_qr_code" USING btree ("dynamicUrl");--> statement-breakpoint
CREATE INDEX "qr_code_expires_idx" ON "mojoqr_qr_code" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "qr_code_scan_count_idx" ON "mojoqr_qr_code" USING btree ("scanCount");--> statement-breakpoint
CREATE INDEX "qr_code_created_idx" ON "mojoqr_qr_code" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "mojoqr_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "template_category_idx" ON "mojoqr_template" USING btree ("category");--> statement-breakpoint
CREATE INDEX "template_type_idx" ON "mojoqr_template" USING btree ("qrCodeType");--> statement-breakpoint
CREATE INDEX "template_user_idx" ON "mojoqr_template" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "template_org_idx" ON "mojoqr_template" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "template_public_idx" ON "mojoqr_template" USING btree ("isPublic");--> statement-breakpoint
CREATE INDEX "template_usage_idx" ON "mojoqr_template" USING btree ("usageCount");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "mojoqr_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_active_idx" ON "mojoqr_user" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "user_plan_idx" ON "mojoqr_user" USING btree ("plan");