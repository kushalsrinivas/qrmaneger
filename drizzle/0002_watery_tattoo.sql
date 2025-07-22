CREATE TABLE "mojoqr_analytics_cache" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"cacheKey" varchar(255) NOT NULL,
	"dateRange" jsonb NOT NULL,
	"data" jsonb NOT NULL,
	"lastUpdated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"isStale" boolean DEFAULT false NOT NULL,
	"updateInProgress" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mojoqr_analytics_cache" ADD CONSTRAINT "mojoqr_analytics_cache_userId_mojoqr_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mojoqr_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_cache_user_idx" ON "mojoqr_analytics_cache" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_cache_key_idx" ON "mojoqr_analytics_cache" USING btree ("cacheKey");--> statement-breakpoint
CREATE INDEX "analytics_cache_user_key_idx" ON "mojoqr_analytics_cache" USING btree ("userId","cacheKey");--> statement-breakpoint
CREATE INDEX "analytics_cache_expires_idx" ON "mojoqr_analytics_cache" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "analytics_cache_stale_idx" ON "mojoqr_analytics_cache" USING btree ("isStale");--> statement-breakpoint
CREATE INDEX "analytics_cache_update_progress_idx" ON "mojoqr_analytics_cache" USING btree ("updateInProgress");