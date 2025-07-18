import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure 
} from "@/server/api/trpc";
import { analyticsEvents, qrCodes } from "@/server/db/schema";
import { eq, and, desc, asc, count, sum, sql, gte, lte, between } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const analyticsFilterSchema = z.object({
  qrCodeId: z.string().optional(),
  eventType: z.enum(["scan", "view", "click", "download", "share", "error"]).optional(),
  dateRange: dateRangeSchema.optional(),
  groupBy: z.enum(["day", "week", "month", "year"]).default("day"),
  limit: z.number().min(1).max(1000).default(100),
});

const overviewSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  compareWith: dateRangeSchema.optional(),
});

const deviceAnalyticsSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  qrCodeId: z.string().optional(),
});

const locationAnalyticsSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  qrCodeId: z.string().optional(),
  groupBy: z.enum(["country", "city", "region"]).default("country"),
});

const performanceSchema = z.object({
  qrCodeIds: z.array(z.string()).optional(),
  dateRange: dateRangeSchema.optional(),
  sortBy: z.enum(["scans", "uniqueScans", "conversionRate", "name"]).default("scans"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().min(1).max(100).default(20),
});

const realTimeSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  eventTypes: z.array(z.enum(["scan", "view", "click", "download", "share", "error"])).optional(),
});

// ================================
// ANALYTICS ROUTER
// ================================

export const analyticsRouter = createTRPCRouter({
  /**
   * Get analytics overview with key metrics
   */
  getOverview: protectedProcedure
    .input(overviewSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Default to last 30 days if no date range provided
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        
        const startDate = input.dateRange?.startDate || defaultStartDate;
        const endDate = input.dateRange?.endDate || defaultEndDate;
        
        // Get user's QR codes
        const userQRCodes = await ctx.db.query.qrCodes.findMany({
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
        const currentMetrics = await ctx.db.select({
          totalScans: count(),
          uniqueScans: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
        })
        .from(analyticsEvents)
        .where(and(
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          eq(analyticsEvents.eventType, "scan"),
          between(analyticsEvents.timestamp, startDate, endDate)
        ));
        
        // Get QR codes statistics
        const qrStats = await ctx.db.select({
          totalQRCodes: count(),
          activeQRCodes: sql<number>`COUNT(CASE WHEN ${qrCodes.status} = 'active' THEN 1 END)`,
          totalScansFromQR: sum(qrCodes.scanCount),
        })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId));
        
        // Get top performer
        const topPerformer = await ctx.db.select({
          id: qrCodes.id,
          name: qrCodes.name,
          scanCount: qrCodes.scanCount,
        })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId))
        .orderBy(desc(qrCodes.scanCount))
        .limit(1);
        
        // Calculate comparison metrics if compareWith is provided
        let growthRate = 0;
        if (input.compareWith) {
          const compareMetrics = await ctx.db.select({
            totalScans: count(),
          })
          .from(analyticsEvents)
          .where(and(
            sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
            eq(analyticsEvents.eventType, "scan"),
            between(analyticsEvents.timestamp, input.compareWith.startDate, input.compareWith.endDate)
          ));
          
          const currentScans = currentMetrics[0]?.totalScans || 0;
          const previousScans = compareMetrics[0]?.totalScans || 0;
          
          if (previousScans > 0) {
            growthRate = ((currentScans - previousScans) / previousScans) * 100;
          }
        }
        
        const currentData = currentMetrics[0] || { totalScans: 0, uniqueScans: 0 };
        const qrData = qrStats[0] || { totalQRCodes: 0, activeQRCodes: 0, totalScansFromQR: 0 };
        
        return {
          totalScans: currentData.totalScans,
          uniqueScans: currentData.uniqueScans,
          totalQRCodes: qrData.totalQRCodes,
          activeQRCodes: qrData.activeQRCodes,
          averageScansPerQR: qrData.totalQRCodes > 0 
            ? Math.round((qrData.totalScansFromQR || 0) / qrData.totalQRCodes) 
            : 0,
          topPerformer: topPerformer[0] || null,
          growthRate: Math.round(growthRate * 100) / 100,
          conversionRate: 0, // TODO: Calculate based on conversion tracking
        };
        
      } catch (error) {
        console.error("Analytics overview failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics overview",
        });
      }
    }),

  /**
   * Get time-series analytics data
   */
  getTimeSeries: protectedProcedure
    .input(analyticsFilterSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Default to last 30 days if no date range provided
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        
        const startDate = input.dateRange?.startDate || defaultStartDate;
        const endDate = input.dateRange?.endDate || defaultEndDate;
        
        // Get user's QR codes or specific QR code
        let qrCodeIds: string[];
        if (input.qrCodeId) {
          // Verify ownership
          const qrCode = await ctx.db.query.qrCodes.findFirst({
            where: and(
              eq(qrCodes.id, input.qrCodeId),
              eq(qrCodes.userId, userId)
            ),
          });
          
          if (!qrCode) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "QR code not found or access denied",
            });
          }
          
          qrCodeIds = [input.qrCodeId];
        } else {
          const userQRCodes = await ctx.db.query.qrCodes.findMany({
            where: eq(qrCodes.userId, userId),
            columns: { id: true },
          });
          qrCodeIds = userQRCodes.map(qr => qr.id);
        }
        
        if (qrCodeIds.length === 0) {
          return [];
        }
        
        // Build date grouping based on groupBy parameter
        const dateFormat = input.groupBy === "day" ? "YYYY-MM-DD"
          : input.groupBy === "week" ? "YYYY-WW"
          : input.groupBy === "month" ? "YYYY-MM"
          : "YYYY";
        
        const dateGrouping = sql`DATE_TRUNC(${input.groupBy}, ${analyticsEvents.timestamp})`;
        
        // Build where conditions
        const whereConditions = [
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          between(analyticsEvents.timestamp, startDate, endDate),
        ];
        
        if (input.eventType) {
          whereConditions.push(eq(analyticsEvents.eventType, input.eventType));
        }
        
        // Get time-series data
        const timeSeriesData = await ctx.db.select({
          date: dateGrouping,
          totalEvents: count(),
          uniqueEvents: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
          eventType: analyticsEvents.eventType,
        })
        .from(analyticsEvents)
        .where(and(...whereConditions))
        .groupBy(dateGrouping, analyticsEvents.eventType)
        .orderBy(asc(dateGrouping))
        .limit(input.limit);
        
        return timeSeriesData;
        
      } catch (error) {
        console.error("Time series analytics failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch time series data",
        });
      }
    }),

  /**
   * Get device and browser analytics
   */
  getDeviceAnalytics: protectedProcedure
    .input(deviceAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Default to last 30 days if no date range provided
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        
        const startDate = input.dateRange?.startDate || defaultStartDate;
        const endDate = input.dateRange?.endDate || defaultEndDate;
        
        // Get user's QR codes or specific QR code
        let qrCodeIds: string[];
        if (input.qrCodeId) {
          const qrCode = await ctx.db.query.qrCodes.findFirst({
            where: and(
              eq(qrCodes.id, input.qrCodeId),
              eq(qrCodes.userId, userId)
            ),
          });
          
          if (!qrCode) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "QR code not found or access denied",
            });
          }
          
          qrCodeIds = [input.qrCodeId];
        } else {
          const userQRCodes = await ctx.db.query.qrCodes.findMany({
            where: eq(qrCodes.userId, userId),
            columns: { id: true },
          });
          qrCodeIds = userQRCodes.map(qr => qr.id);
        }
        
        if (qrCodeIds.length === 0) {
          return { devices: [], browsers: [], operatingSystems: [] };
        }
        
        // Get device analytics
        const deviceData = await ctx.db.select({
          device: sql<string>`${analyticsEvents.metadata}->>'device'`,
          count: count(),
        })
        .from(analyticsEvents)
        .where(and(
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          eq(analyticsEvents.eventType, "scan"),
          between(analyticsEvents.timestamp, startDate, endDate),
          sql`${analyticsEvents.metadata}->>'device' IS NOT NULL`
        ))
        .groupBy(sql`${analyticsEvents.metadata}->>'device'`)
        .orderBy(desc(count()));
        
        // Get browser analytics
        const browserData = await ctx.db.select({
          browser: sql<string>`${analyticsEvents.metadata}->>'browser'`,
          count: count(),
        })
        .from(analyticsEvents)
        .where(and(
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          eq(analyticsEvents.eventType, "scan"),
          between(analyticsEvents.timestamp, startDate, endDate),
          sql`${analyticsEvents.metadata}->>'browser' IS NOT NULL`
        ))
        .groupBy(sql`${analyticsEvents.metadata}->>'browser'`)
        .orderBy(desc(count()));
        
        // Get OS analytics
        const osData = await ctx.db.select({
          os: sql<string>`${analyticsEvents.metadata}->>'os'`,
          count: count(),
        })
        .from(analyticsEvents)
        .where(and(
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          eq(analyticsEvents.eventType, "scan"),
          between(analyticsEvents.timestamp, startDate, endDate),
          sql`${analyticsEvents.metadata}->>'os' IS NOT NULL`
        ))
        .groupBy(sql`${analyticsEvents.metadata}->>'os'`)
        .orderBy(desc(count()));
        
        return {
          devices: deviceData,
          browsers: browserData,
          operatingSystems: osData,
        };
        
      } catch (error) {
        console.error("Device analytics failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch device analytics",
        });
      }
    }),

  /**
   * Get location analytics
   */
  getLocationAnalytics: protectedProcedure
    .input(locationAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Default to last 30 days if no date range provided
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        
        const startDate = input.dateRange?.startDate || defaultStartDate;
        const endDate = input.dateRange?.endDate || defaultEndDate;
        
        // Get user's QR codes or specific QR code
        let qrCodeIds: string[];
        if (input.qrCodeId) {
          const qrCode = await ctx.db.query.qrCodes.findFirst({
            where: and(
              eq(qrCodes.id, input.qrCodeId),
              eq(qrCodes.userId, userId)
            ),
          });
          
          if (!qrCode) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "QR code not found or access denied",
            });
          }
          
          qrCodeIds = [input.qrCodeId];
        } else {
          const userQRCodes = await ctx.db.query.qrCodes.findMany({
            where: eq(qrCodes.userId, userId),
            columns: { id: true },
          });
          qrCodeIds = userQRCodes.map(qr => qr.id);
        }
        
        if (qrCodeIds.length === 0) {
          return [];
        }
        
        // Build location field based on groupBy
        const locationField = input.groupBy === "country" 
          ? sql<string>`${analyticsEvents.metadata}->>'country'`
          : input.groupBy === "city"
          ? sql<string>`${analyticsEvents.metadata}->>'city'`
          : sql<string>`${analyticsEvents.metadata}->>'region'`;
        
        // Get location analytics
        const locationData = await ctx.db.select({
          location: locationField,
          count: count(),
          uniqueCount: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
        })
        .from(analyticsEvents)
        .where(and(
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          eq(analyticsEvents.eventType, "scan"),
          between(analyticsEvents.timestamp, startDate, endDate),
          sql`${locationField} IS NOT NULL`
        ))
        .groupBy(locationField)
        .orderBy(desc(count()))
        .limit(50);
        
        return locationData;
        
      } catch (error) {
        console.error("Location analytics failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch location analytics",
        });
      }
    }),

  /**
   * Get QR code performance comparison
   */
  getPerformance: protectedProcedure
    .input(performanceSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Default to last 30 days if no date range provided
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        
        const startDate = input.dateRange?.startDate || defaultStartDate;
        const endDate = input.dateRange?.endDate || defaultEndDate;
        
        // Get QR codes to analyze
        let whereConditions = [eq(qrCodes.userId, userId)];
        
        if (input.qrCodeIds && input.qrCodeIds.length > 0) {
          whereConditions.push(sql`${qrCodes.id} = ANY(${input.qrCodeIds})`);
        }
        
        // Get QR codes with analytics
        const qrPerformance = await ctx.db.select({
          id: qrCodes.id,
          name: qrCodes.name,
          type: qrCodes.type,
          status: qrCodes.status,
          totalScans: qrCodes.scanCount,
          createdAt: qrCodes.createdAt,
          scansInPeriod: sql<number>`(
            SELECT COUNT(*)
            FROM ${analyticsEvents}
            WHERE ${analyticsEvents.qrCodeId} = ${qrCodes.id}
            AND ${analyticsEvents.eventType} = 'scan'
            AND ${analyticsEvents.timestamp} BETWEEN ${startDate} AND ${endDate}
          )`,
          uniqueScansInPeriod: sql<number>`(
            SELECT COUNT(DISTINCT ${analyticsEvents.sessionId})
            FROM ${analyticsEvents}
            WHERE ${analyticsEvents.qrCodeId} = ${qrCodes.id}
            AND ${analyticsEvents.eventType} = 'scan'
            AND ${analyticsEvents.timestamp} BETWEEN ${startDate} AND ${endDate}
          )`,
          clicksInPeriod: sql<number>`(
            SELECT COUNT(*)
            FROM ${analyticsEvents}
            WHERE ${analyticsEvents.qrCodeId} = ${qrCodes.id}
            AND ${analyticsEvents.eventType} = 'click'
            AND ${analyticsEvents.timestamp} BETWEEN ${startDate} AND ${endDate}
          )`,
        })
        .from(qrCodes)
        .where(and(...whereConditions));
        
        // Calculate conversion rates and sort
        const performanceWithMetrics = qrPerformance.map(qr => ({
          ...qr,
          conversionRate: qr.scansInPeriod > 0 
            ? (qr.clicksInPeriod / qr.scansInPeriod) * 100 
            : 0,
          uniqueRate: qr.scansInPeriod > 0 
            ? (qr.uniqueScansInPeriod / qr.scansInPeriod) * 100 
            : 0,
        }));
        
        // Sort by specified criteria
        performanceWithMetrics.sort((a, b) => {
          const aValue = input.sortBy === "scans" ? a.scansInPeriod
            : input.sortBy === "uniqueScans" ? a.uniqueScansInPeriod
            : input.sortBy === "conversionRate" ? a.conversionRate
            : a.name.localeCompare(b.name);
          
          const bValue = input.sortBy === "scans" ? b.scansInPeriod
            : input.sortBy === "uniqueScans" ? b.uniqueScansInPeriod
            : input.sortBy === "conversionRate" ? b.conversionRate
            : b.name.localeCompare(a.name);
          
          if (input.sortBy === "name") {
            return input.sortOrder === "asc" ? aValue : -aValue;
          }
          
          return input.sortOrder === "asc" 
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        });
        
        return performanceWithMetrics.slice(0, input.limit);
        
      } catch (error) {
        console.error("Performance analytics failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch performance analytics",
        });
      }
    }),

  /**
   * Get real-time analytics (recent events)
   */
  getRealTime: protectedProcedure
    .input(realTimeSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get user's QR codes
        const userQRCodes = await ctx.db.query.qrCodes.findMany({
          where: eq(qrCodes.userId, userId),
          columns: { id: true },
        });
        
        const qrCodeIds = userQRCodes.map(qr => qr.id);
        
        if (qrCodeIds.length === 0) {
          return [];
        }
        
        // Build where conditions
        const whereConditions = [
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
        ];
        
        if (input.eventTypes && input.eventTypes.length > 0) {
          whereConditions.push(sql`${analyticsEvents.eventType} = ANY(${input.eventTypes})`);
        }
        
        // Get recent events
        const recentEvents = await ctx.db.select({
          id: analyticsEvents.id,
          eventType: analyticsEvents.eventType,
          timestamp: analyticsEvents.timestamp,
          qrCodeId: analyticsEvents.qrCodeId,
          qrCodeName: qrCodes.name,
          metadata: analyticsEvents.metadata,
        })
        .from(analyticsEvents)
        .innerJoin(qrCodes, eq(analyticsEvents.qrCodeId, qrCodes.id))
        .where(and(...whereConditions))
        .orderBy(desc(analyticsEvents.timestamp))
        .limit(input.limit);
        
        return recentEvents;
        
      } catch (error) {
        console.error("Real-time analytics failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch real-time analytics",
        });
      }
    }),

  /**
   * Export analytics data
   */
  exportData: protectedProcedure
    .input(z.object({
      format: z.enum(["csv", "json"]),
      dateRange: dateRangeSchema,
      qrCodeIds: z.array(z.string()).optional(),
      eventTypes: z.array(z.enum(["scan", "view", "click", "download", "share", "error"])).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get user's QR codes or specific QR codes
        let qrCodeIds: string[];
        if (input.qrCodeIds && input.qrCodeIds.length > 0) {
          // Verify ownership
          const userQRCodes = await ctx.db.query.qrCodes.findMany({
            where: and(
              eq(qrCodes.userId, userId),
              sql`${qrCodes.id} = ANY(${input.qrCodeIds})`
            ),
            columns: { id: true },
          });
          qrCodeIds = userQRCodes.map(qr => qr.id);
        } else {
          const userQRCodes = await ctx.db.query.qrCodes.findMany({
            where: eq(qrCodes.userId, userId),
            columns: { id: true },
          });
          qrCodeIds = userQRCodes.map(qr => qr.id);
        }
        
        if (qrCodeIds.length === 0) {
          return { data: [], format: input.format };
        }
        
        // Build where conditions
        const whereConditions = [
          sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
          between(analyticsEvents.timestamp, input.dateRange.startDate, input.dateRange.endDate),
        ];
        
        if (input.eventTypes && input.eventTypes.length > 0) {
          whereConditions.push(sql`${analyticsEvents.eventType} = ANY(${input.eventTypes})`);
        }
        
        // Get analytics data
        const analyticsData = await ctx.db.select({
          id: analyticsEvents.id,
          qrCodeId: analyticsEvents.qrCodeId,
          qrCodeName: qrCodes.name,
          eventType: analyticsEvents.eventType,
          timestamp: analyticsEvents.timestamp,
          sessionId: analyticsEvents.sessionId,
          userAgent: analyticsEvents.userAgent,
          ipAddress: analyticsEvents.ipAddress,
          metadata: analyticsEvents.metadata,
        })
        .from(analyticsEvents)
        .innerJoin(qrCodes, eq(analyticsEvents.qrCodeId, qrCodes.id))
        .where(and(...whereConditions))
        .orderBy(desc(analyticsEvents.timestamp))
        .limit(10000); // Limit to prevent memory issues
        
        return {
          data: analyticsData,
          format: input.format,
          count: analyticsData.length,
        };
        
      } catch (error) {
        console.error("Analytics export failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export analytics data",
        });
      }
    }),
}); 