import { Redis } from "ioredis";
import { db } from "@/server/db";
import { analyticsCache, qrCodes, analyticsEvents } from "@/server/db/schema";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { count, sum, sql } from "drizzle-orm";
import { between } from "drizzle-orm";

// ================================
// TYPES
// ================================

export interface CacheKey {
  userId: string;
  type: "overview" | "timeSeries" | "deviceAnalytics" | "locationAnalytics" | "performance" | "realTime";
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: Record<string, any>;
}

export interface CachedAnalyticsData {
  overview?: any;
  timeSeries?: any;
  deviceAnalytics?: any;
  locationAnalytics?: any;
  performance?: any;
  realTime?: any;
}

export interface CacheEntry {
  id: string;
  userId: string;
  cacheKey: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: CachedAnalyticsData;
  lastUpdated: Date;
  expiresAt: Date;
  isStale: boolean;
  updateInProgress: boolean;
}

// ================================
// ANALYTICS CACHE SERVICE
// ================================

export class AnalyticsCacheService {
  private redis: Redis | null = null;
  private static instance: AnalyticsCacheService;

  constructor() {
    // Initialize Redis if available
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
      }
    } catch (error) {
      console.warn("Redis not available for analytics caching:", error);
    }
  }

  public static getInstance(): AnalyticsCacheService {
    if (!AnalyticsCacheService.instance) {
      AnalyticsCacheService.instance = new AnalyticsCacheService();
    }
    return AnalyticsCacheService.instance;
  }

  /**
   * Generate a cache key from the cache key object
   */
  private generateCacheKey(key: CacheKey): string {
    const filters = key.filters ? JSON.stringify(key.filters) : "";
    return `analytics:${key.userId}:${key.type}:${key.dateRange.startDate.toISOString()}:${key.dateRange.endDate.toISOString()}:${filters}`;
  }

  /**
   * Get cached analytics data (Redis first, then database)
   */
  public async getCachedData(key: CacheKey): Promise<{
    data: CachedAnalyticsData | null;
    lastUpdated: Date | null;
    isStale: boolean;
  }> {
    const cacheKey = this.generateCacheKey(key);

    // Try Redis first
    if (this.redis) {
      try {
        const redisData = await this.redis.get(cacheKey);
        if (redisData) {
          const parsed = JSON.parse(redisData);
          return {
            data: parsed.data,
            lastUpdated: new Date(parsed.lastUpdated),
            isStale: parsed.isStale || false,
          };
        }
      } catch (error) {
        console.warn("Redis cache read failed:", error);
      }
    }

    // Fallback to database cache
    try {
      const dbCache = await db.query.analyticsCache.findFirst({
        where: and(
          eq(analyticsCache.userId, key.userId),
          eq(analyticsCache.cacheKey, cacheKey)
        ),
      });

      if (dbCache && dbCache.expiresAt > new Date()) {
        return {
          data: dbCache.data,
          lastUpdated: dbCache.lastUpdated,
          isStale: dbCache.isStale,
        };
      }
    } catch (error) {
      console.error("Database cache read failed:", error);
    }

    return {
      data: null,
      lastUpdated: null,
      isStale: true,
    };
  }

  /**
   * Set cached analytics data (both Redis and database)
   */
  public async setCachedData(
    key: CacheKey,
    data: CachedAnalyticsData,
    ttlMinutes: number = 60
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const cacheData = {
      data,
      lastUpdated: now.toISOString(),
      isStale: false,
    };

    // Store in Redis
    if (this.redis) {
      try {
        await this.redis.setex(
          cacheKey,
          ttlMinutes * 60,
          JSON.stringify(cacheData)
        );
      } catch (error) {
        console.warn("Redis cache write failed:", error);
      }
    }

    // Store in database (upsert)
    try {
      await db
        .insert(analyticsCache)
        .values({
          userId: key.userId,
          cacheKey,
          dateRange: {
            startDate: key.dateRange.startDate.toISOString(),
            endDate: key.dateRange.endDate.toISOString(),
          },
          data,
          lastUpdated: now,
          expiresAt,
          isStale: false,
          updateInProgress: false,
        })
        .onConflictDoUpdate({
          target: [analyticsCache.userId, analyticsCache.cacheKey],
          set: {
            data,
            lastUpdated: now,
            expiresAt,
            isStale: false,
            updateInProgress: false,
          },
        });
    } catch (error) {
      console.error("Database cache write failed:", error);
    }
  }

  /**
   * Mark cache as stale (for background refresh)
   */
  public async markAsStale(key: CacheKey): Promise<void> {
    const cacheKey = this.generateCacheKey(key);

    // Update Redis
    if (this.redis) {
      try {
        const redisData = await this.redis.get(cacheKey);
        if (redisData) {
          const parsed = JSON.parse(redisData);
          parsed.isStale = true;
          await this.redis.setex(cacheKey, 3600, JSON.stringify(parsed)); // Keep for 1 hour
        }
      } catch (error) {
        console.warn("Redis stale marking failed:", error);
      }
    }

    // Update database
    try {
      await db
        .update(analyticsCache)
        .set({ isStale: true })
        .where(
          and(
            eq(analyticsCache.userId, key.userId),
            eq(analyticsCache.cacheKey, cacheKey)
          )
        );
    } catch (error) {
      console.error("Database stale marking failed:", error);
    }
  }

  /**
   * Mark cache as update in progress
   */
  public async markUpdateInProgress(key: CacheKey, inProgress: boolean): Promise<void> {
    const cacheKey = this.generateCacheKey(key);

    try {
      await db
        .update(analyticsCache)
        .set({ updateInProgress: inProgress })
        .where(
          and(
            eq(analyticsCache.userId, key.userId),
            eq(analyticsCache.cacheKey, cacheKey)
          )
        );
    } catch (error) {
      console.error("Database update progress marking failed:", error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  public async cleanupExpiredCache(): Promise<void> {
    const now = new Date();

    // Clean up database cache
    try {
      await db
        .delete(analyticsCache)
        .where(lte(analyticsCache.expiresAt, now));
    } catch (error) {
      console.error("Database cache cleanup failed:", error);
    }

    // Redis entries expire automatically
  }

  /**
   * Get all stale cache entries for background refresh
   */
  public async getStaleEntries(): Promise<CacheEntry[]> {
    try {
      const staleEntries = await db.query.analyticsCache.findMany({
        where: and(
          eq(analyticsCache.isStale, true),
          eq(analyticsCache.updateInProgress, false),
          gte(analyticsCache.expiresAt, new Date()) // Not expired yet
        ),
        limit: 50, // Process in batches
      });

      return staleEntries;
    } catch (error) {
      console.error("Failed to get stale entries:", error);
      return [];
    }
  }

  /**
   * Invalidate cache for a user (when QR codes are updated)
   */
  public async invalidateUserCache(userId: string): Promise<void> {
    // Remove from Redis (pattern matching)
    if (this.redis) {
      try {
        const pattern = `analytics:${userId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn("Redis cache invalidation failed:", error);
      }
    }

    // Mark database entries as stale
    try {
      await db
        .update(analyticsCache)
        .set({ isStale: true })
        .where(eq(analyticsCache.userId, userId));
    } catch (error) {
      console.error("Database cache invalidation failed:", error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalEntries: number;
    staleEntries: number;
    inProgressEntries: number;
    expiredEntries: number;
  }> {
    try {
      const now = new Date();

      const [total, stale, inProgress, expired] = await Promise.all([
        db.select().from(analyticsCache).then(r => r.length),
        db.select().from(analyticsCache).where(eq(analyticsCache.isStale, true)).then(r => r.length),
        db.select().from(analyticsCache).where(eq(analyticsCache.updateInProgress, true)).then(r => r.length),
        db.select().from(analyticsCache).where(lte(analyticsCache.expiresAt, now)).then(r => r.length),
      ]);

      return {
        totalEntries: total,
        staleEntries: stale,
        inProgressEntries: inProgress,
        expiredEntries: expired,
      };
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {
        totalEntries: 0,
        staleEntries: 0,
        inProgressEntries: 0,
        expiredEntries: 0,
      };
    }
  }
}

// ================================
// ANALYTICS DATA FETCHER
// ================================

export class AnalyticsDataFetcher {
  /**
   * Fetch fresh analytics data (calls the original analytics functions)
   */
  public static async fetchOverviewData(
    userId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<any> {
    // Default to last 7 days if no date range provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);
    
    const startDate = dateRange?.startDate ?? defaultStartDate;
    const endDate = dateRange?.endDate ?? defaultEndDate;
    
    // Calculate previous period for growth comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);
    
    // Get user's QR codes
    const userQRCodes = await db.query.qrCodes.findMany({
      where: eq(qrCodes.userId, userId),
      columns: { id: true },
    });
    
    const qrCodeIds = userQRCodes.map(qr => qr.id);
    
    if (qrCodeIds.length === 0) {
      return {
        totalScans: 0,
        uniqueScans: 0,
        totalQRCodes: 0,
        activeQRCodes: 0,
        averageScansPerQR: 0,
        topPerformer: null,
        growthRate: 0,
        conversionRate: 0,
      };
    }
    
    // Get current period metrics
    const currentMetrics = await db.select({
      totalScans: count(),
      uniqueScans: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      inArray(analyticsEvents.qrCodeId, qrCodeIds),
      eq(analyticsEvents.eventType, "scan"),
      between(analyticsEvents.timestamp, startDate, endDate)
    ));
    
    // Get previous period metrics for growth calculation
    const previousMetrics = await db.select({
      totalScans: count(),
      uniqueScans: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      inArray(analyticsEvents.qrCodeId, qrCodeIds),
      eq(analyticsEvents.eventType, "scan"),
      between(analyticsEvents.timestamp, previousStartDate, previousEndDate)
    ));
    
    // Get QR codes statistics
    const qrStats = await db.select({
      totalQRCodes: count(),
      activeQRCodes: sql<number>`COUNT(CASE WHEN ${qrCodes.status} = 'active' THEN 1 END)`,
      totalScansFromQR: sum(qrCodes.scanCount),
    })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId));
    
    // Get top performer
    const topPerformer = await db.select({
      id: qrCodes.id,
      name: qrCodes.name,
      scanCount: qrCodes.scanCount,
    })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId))
    .orderBy(desc(qrCodes.scanCount))
    .limit(1);
    
    // Calculate growth rate
    const currentScans = currentMetrics[0]?.totalScans ?? 0;
    const previousScans = previousMetrics[0]?.totalScans ?? 0;
    let growthRate = 0;
    
    if (previousScans > 0) {
      growthRate = ((currentScans - previousScans) / previousScans) * 100;
    } else if (currentScans > 0) {
      growthRate = 100; // 100% growth if we had 0 before and now have some
    }
    
    const currentData = currentMetrics[0] ?? { totalScans: 0, uniqueScans: 0 };
    const qrData = qrStats[0] ?? { totalQRCodes: 0, activeQRCodes: 0, totalScansFromQR: 0 };
    
    return {
      totalScans: currentData.totalScans,
      uniqueScans: currentData.uniqueScans,
      totalQRCodes: qrData.totalQRCodes,
      activeQRCodes: qrData.activeQRCodes,
      averageScansPerQR: qrData.totalQRCodes > 0 
        ? Math.round(((qrData.totalScansFromQR as number) ?? 0) / qrData.totalQRCodes) 
        : 0,
      topPerformer: topPerformer[0] ?? null,
      growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal place
      conversionRate: 0, // TODO: Calculate based on conversion tracking
    };
  }

  // Add more fetch methods for other analytics types as needed...
}

// Export singleton instance
export const analyticsCacheService = AnalyticsCacheService.getInstance(); 