import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure, 
  publicProcedure 
} from "@/server/api/trpc";
import { qrCodes, analyticsEvents } from "@/server/db/schema";
import { 
  QRCodeGenerationRequest, 
  QRCodeData, 
  QRCodeType, 
  ErrorCorrectionLevel,
  QRCodeFormat,
  QRCodeMode
} from "@/server/db/types";
import { qrCodeService, batchQRService } from "@/lib/qr-generation";
import { shortUrlService } from "@/lib/short-url-service";
import { validateQRCodeData } from "@/lib/qr-validation";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const qrCodeGenerationSchema = z.object({
  type: z.enum([
    "url", "vcard", "wifi", "text", "sms", "email", "phone", "location", 
    "event", "app_download", "multi_url", "menu", "payment", "pdf", "image", "video"
  ]),
  mode: z.enum(["static", "dynamic"]),
  data: z.any(), // This will be validated by the service layer
  options: z.object({
    errorCorrection: z.enum(["L", "M", "Q", "H"]),
    size: z.number().min(64).max(2048).default(512),
    format: z.enum(["png", "svg", "jpeg", "pdf"]).default("png"),
    customization: z.object({
      foregroundColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      cornerStyle: z.string().optional(),
      patternStyle: z.string().optional(),
      logoUrl: z.string().optional(),
      logoSize: z.number().optional(),
      logoPosition: z.string().optional(),
    }).optional(),
  }),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    folderId: z.string().optional(),
    templateId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    expiresAt: z.date().optional(),
  }).optional(),
});

const batchGenerationSchema = z.object({
  requests: z.array(qrCodeGenerationSchema),
  options: z.object({
    maxConcurrency: z.number().min(1).max(20).default(10),
    timeout: z.number().min(1000).max(60000).default(30000),
  }).optional(),
});

const updateDynamicQRSchema = z.object({
  qrCodeId: z.string(),
  data: z.any(),
});

const qrCodeAnalyticsSchema = z.object({
  qrCodeId: z.string(),
  days: z.number().min(1).max(365).default(30),
});

// ================================
// QR CODE ROUTER
// ================================

export const qrRouter = createTRPCRouter({
  /**
   * Generate a single QR code
   */
  generate: protectedProcedure
    .input(qrCodeGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Validate the QR code data
        const validation = validateQRCodeData(input.type, input.data);
        if (!validation.isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Validation failed: ${validation.errors.join(", ")}`,
          });
        }
        
        // Generate the QR code
        const result = await qrCodeService.generateQRCode(input, userId);
        
        // Store in database
        const qrCodeRecord = await ctx.db.insert(qrCodes).values({
          id: result.id,
          name: input.metadata?.name || `QR Code - ${input.type}`,
          description: input.metadata?.description,
          type: input.type,
          isDynamic: input.mode === "dynamic",
          data: input.data,
          style: input.options.customization,
          size: input.options.size,
          format: input.options.format,
          errorCorrection: input.options.errorCorrection,
          imageUrl: result.qrCodeUrl,
          imageSize: result.metadata.fileSize,
          folderId: input.metadata?.folderId,
          templateId: input.metadata?.templateId,
          tags: input.metadata?.tags,
          userId,
          expiresAt: input.metadata?.expiresAt,
          dynamicUrl: result.shortUrl,
        }).returning();
        
        return {
          ...result,
          qrCode: qrCodeRecord[0],
        };
        
      } catch (error) {
        console.error("QR code generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "QR code generation failed",
        });
      }
    }),

  /**
   * Generate multiple QR codes in batch
   */
  generateBatch: protectedProcedure
    .input(batchGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        const result = await batchQRService.generateBatch(
          input.requests,
          userId,
          input.options
        );
        
        // Store successful QR codes in database
        const qrCodeRecords = await Promise.all(
          result.successful.map(async (qrResult) => {
            const originalRequest = input.requests.find(req => 
              // Find matching request (this is a simplified match)
              req.type === qrResult.metadata.type
            );
            
            if (!originalRequest) return null;
            
            return await ctx.db.insert(qrCodes).values({
              id: qrResult.id,
              name: originalRequest.metadata?.name || `QR Code - ${qrResult.metadata.type}`,
              description: originalRequest.metadata?.description,
              type: qrResult.metadata.type,
              isDynamic: qrResult.metadata.mode === "dynamic",
              data: originalRequest.data,
              style: originalRequest.options.customization,
              size: qrResult.metadata.size,
              format: qrResult.metadata.format,
              errorCorrection: qrResult.metadata.errorCorrection,
              imageUrl: qrResult.qrCodeUrl,
              imageSize: qrResult.metadata.fileSize,
              folderId: originalRequest.metadata?.folderId,
              templateId: originalRequest.metadata?.templateId,
              tags: originalRequest.metadata?.tags,
              userId,
              expiresAt: originalRequest.metadata?.expiresAt,
              dynamicUrl: qrResult.shortUrl,
            }).returning();
          })
        );
        
        return {
          successful: result.successful.map((qrResult, index) => ({
            ...qrResult,
            qrCode: qrCodeRecords[index]?.[0],
          })),
          failed: result.failed,
        };
        
      } catch (error) {
        console.error("Batch QR code generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Batch generation failed",
        });
      }
    }),

  /**
   * Update a dynamic QR code's destination
   */
  updateDynamic: protectedProcedure
    .input(updateDynamicQRSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership and that it's a dynamic QR code
        const qrCode = await ctx.db.query.qrCodes.findFirst({
          where: and(
            eq(qrCodes.id, input.qrCodeId),
            eq(qrCodes.userId, userId),
            eq(qrCodes.isDynamic, true)
          ),
        });
        
        if (!qrCode) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dynamic QR code not found or access denied",
          });
        }
        
        // Validate the new data
        const validation = validateQRCodeData(qrCode.type, input.data);
        if (!validation.isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Validation failed: ${validation.errors.join(", ")}`,
          });
        }
        
        // Update the QR code
        await shortUrlService.updateDynamicQRCode(input.qrCodeId, input.data, userId);
        
        return { success: true };
        
      } catch (error) {
        console.error("Dynamic QR code update failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Update failed",
        });
      }
    }),

  /**
   * Get QR codes for the current user
   */
  getMyQRCodes: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      type: z.enum([
        "url", "vcard", "wifi", "text", "sms", "email", "phone", "location", 
        "event", "app_download", "multi_url", "menu", "payment", "pdf", "image", "video"
      ]).optional(),
      folderId: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      let whereClause = eq(qrCodes.userId, userId);
      
      if (input.type) {
        whereClause = and(whereClause, eq(qrCodes.type, input.type));
      }
      
      if (input.folderId) {
        whereClause = and(whereClause, eq(qrCodes.folderId, input.folderId));
      }
      
      const qrCodeList = await ctx.db.query.qrCodes.findMany({
        where: whereClause,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(qrCodes.createdAt)],
        with: {
          folder: true,
          template: true,
        },
      });
      
      return qrCodeList;
    }),

  /**
   * Get QR code by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const qrCode = await ctx.db.query.qrCodes.findFirst({
        where: and(
          eq(qrCodes.id, input.id),
          eq(qrCodes.userId, userId)
        ),
        with: {
          folder: true,
          template: true,
          analyticsEvents: {
            orderBy: [desc(analyticsEvents.timestamp)],
            limit: 10,
          },
        },
      });
      
      if (!qrCode) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "QR code not found",
        });
      }
      
      return qrCode;
    }),

  /**
   * Get QR code analytics
   */
  getAnalytics: protectedProcedure
    .input(qrCodeAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
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
          message: "QR code not found",
        });
      }
      
      const analytics = await shortUrlService.getQRCodeAnalytics(
        input.qrCodeId,
        input.days
      );
      
      return analytics;
    }),

  /**
   * Delete QR code
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const result = await ctx.db.delete(qrCodes)
        .where(and(
          eq(qrCodes.id, input.id),
          eq(qrCodes.userId, userId)
        ))
        .returning();
      
      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "QR code not found",
        });
      }
      
      return { success: true };
    }),

  /**
   * Toggle QR code status (activate/deactivate)
   */
  toggleStatus: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      status: z.enum(["active", "inactive"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const result = await ctx.db.update(qrCodes)
        .set({ 
          status: input.status,
          updatedAt: new Date(),
        })
        .where(and(
          eq(qrCodes.id, input.id),
          eq(qrCodes.userId, userId)
        ))
        .returning();
      
      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "QR code not found",
        });
      }
      
      return { success: true };
    }),

  /**
   * Get QR code statistics for dashboard
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      // Get total QR codes
      const totalQRCodes = await ctx.db
        .select({ count: count() })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId));
      
      // Get total scans
      const totalScans = await ctx.db
        .select({ totalScans: sql<number>`SUM(${qrCodes.scanCount})` })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId));
      
      // Get QR codes by type
      const qrCodesByType = await ctx.db
        .select({
          type: qrCodes.type,
          count: count(),
        })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId))
        .groupBy(qrCodes.type);
      
      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentActivity = await ctx.db
        .select({
          date: sql<string>`DATE(${qrCodes.createdAt})`,
          count: count(),
        })
        .from(qrCodes)
        .where(and(
          eq(qrCodes.userId, userId),
          gte(qrCodes.createdAt, thirtyDaysAgo)
        ))
        .groupBy(sql`DATE(${qrCodes.createdAt})`)
        .orderBy(sql`DATE(${qrCodes.createdAt})`);
      
      return {
        totalQRCodes: totalQRCodes[0]?.count || 0,
        totalScans: totalScans[0]?.totalScans || 0,
        qrCodesByType: qrCodesByType,
        recentActivity: recentActivity,
      };
    }),
});

// ================================
// PUBLIC RESOLVER FOR SHORT URLs
// ================================

export const publicQrRouter = createTRPCRouter({
  /**
   * Resolve short URL for redirection
   */
  resolveShortUrl: publicProcedure
    .input(z.object({ shortCode: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await shortUrlService.resolveShortCode(input.shortCode);
        
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Short URL not found",
          });
        }
        
        if (result.isExpired) {
          throw new TRPCError({
            code: "GONE",
            message: "QR code has expired",
          });
        }
        
        if (!result.isActive) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "QR code is inactive",
          });
        }
        
        // Increment scan count
        await shortUrlService.incrementScanCount(result.qrCode.id);
        
        return {
          qrCode: result.qrCode,
          originalData: result.originalData,
        };
        
      } catch (error) {
        console.error("Short URL resolution failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Resolution failed",
        });
      }
    }),
}); 