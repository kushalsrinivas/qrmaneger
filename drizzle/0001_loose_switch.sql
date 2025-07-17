CREATE TABLE "mojoqr_redirect" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"originalUrl" text NOT NULL,
	"shortCode" varchar(255) NOT NULL,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"userId" varchar(255) NOT NULL,
	"qrCodeId" varchar(255) NOT NULL,
	"lastAccessedAt" timestamp with time zone,
	"isActive" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "mojoqr_redirect_shortCode_unique" UNIQUE("shortCode")
);
--> statement-breakpoint
ALTER TABLE "mojoqr_redirect" ADD CONSTRAINT "mojoqr_redirect_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mojoqr_redirect" ADD CONSTRAINT "mojoqr_redirect_qrCodeId_mojoqr_qr_code_id_fk" FOREIGN KEY ("qrCodeId") REFERENCES "public"."mojoqr_qr_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "redirect_short_code_idx" ON "mojoqr_redirect" USING btree ("shortCode");--> statement-breakpoint
CREATE INDEX "redirect_qr_code_idx" ON "mojoqr_redirect" USING btree ("qrCodeId");--> statement-breakpoint
CREATE INDEX "redirect_user_idx" ON "mojoqr_redirect" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "redirect_active_idx" ON "mojoqr_redirect" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "redirect_expires_idx" ON "mojoqr_redirect" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "redirect_click_count_idx" ON "mojoqr_redirect" USING btree ("clickCount");