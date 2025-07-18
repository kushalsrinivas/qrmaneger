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
import { syncQRCodeUpdateAnalytics, validateFolderAccess } from "@/lib/qr-handlers";
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

// New comprehensive QR code update schema
const updateQRCodeSchema = z.object({
  id: z.string().min(1, "QR code ID is required"),
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  data: z.any().optional(), // Will be validated by service layer based on QR type
  style: z.object({
    foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid foreground color").optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid background color").optional(),
    cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
    patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
    logoUrl: z.string().url("Invalid logo URL").optional(),
    logoSize: z.number().min(5).max(50, "Logo size must be between 5% and 50%").optional(),
    logoPosition: z.enum(["center", "top", "bottom"]).optional(),
  }).optional(),
  size: z.number().min(64).max(2048).optional(),
  format: z.enum(["png", "svg", "jpeg", "pdf"]).optional(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).optional(),
  folderId: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  expiresAt: z.date().nullable().optional(),
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
   * Update a comprehensive QR code
   */
  update: protectedProcedure
    .input(updateQRCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership and get current QR code
        const qrCode = await ctx.db.query.qrCodes.findFirst({
          where: and(
            eq(qrCodes.id, input.id),
            eq(qrCodes.userId, userId)
          ),
          with: {
            folder: true,
            template: true,
          },
        });
        
        if (!qrCode) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "QR code not found or access denied",
          });
        }
        
        // Validate the new data if provided
        if (input.data !== undefined) {
          const validation = validateQRCodeData(qrCode.type, input.data);
          if (!validation.isValid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Data validation failed: ${validation.errors.join(", ")}`,
            });
          }
        }
        
        // Validate required fields for name
        if (input.name !== undefined && input.name.trim().length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "QR code name cannot be empty",
          });
        }
        
        // Validate folder access if folder is being changed
        if (input.folderId !== undefined) {
          const folderValidation = await validateFolderAccess(input.folderId, userId);
          if (!folderValidation.isValid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid folder or access denied",
            });
          }
        }
        
        // Determine if QR code image needs regeneration
        const needsRegeneration = 
          input.data !== undefined ||
          input.style !== undefined ||
          input.size !== undefined ||
          input.format !== undefined ||
          input.errorCorrection !== undefined;
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.name !== undefined) updateFields.name = input.name;
        if (input.description !== undefined) updateFields.description = input.description;
        if (input.data !== undefined) updateFields.data = input.data;
        if (input.style !== undefined) updateFields.style = input.style;
        if (input.size !== undefined) updateFields.size = input.size;
        if (input.format !== undefined) updateFields.format = input.format;
        if (input.errorCorrection !== undefined) updateFields.errorCorrection = input.errorCorrection;
        if (input.folderId !== undefined) updateFields.folderId = input.folderId;
        if (input.templateId !== undefined) updateFields.templateId = input.templateId;
        if (input.tags !== undefined) updateFields.tags = input.tags;
        if (input.status !== undefined) updateFields.status = input.status;
        if (input.expiresAt !== undefined) updateFields.expiresAt = input.expiresAt;
        
        // Add updatedAt field
        updateFields.updatedAt = new Date();
        
        // Regenerate QR code image if needed
        if (needsRegeneration) {
          try {
            // Create updated QR code data for regeneration
            const updatedQRData = {
              ...qrCode,
              ...updateFields,
              data: input.data !== undefined ? input.data : qrCode.data,
              style: input.style !== undefined ? input.style : qrCode.style,
              size: input.size !== undefined ? input.size : qrCode.size,
              format: input.format !== undefined ? input.format : qrCode.format,
              errorCorrection: input.errorCorrection !== undefined ? input.errorCorrection : qrCode.errorCorrection,
            };
            
            // Generate new QR code image
            const buffer = await qrCodeService.generateQRCodeBuffer(updatedQRData);
            const imageUrl = await qrCodeService.storeQRCodeImage(buffer, qrCode.id, updatedQRData.format);
            
            // Update image URL and size
            updateFields.imageUrl = imageUrl;
            updateFields.imageSize = buffer.length;
            
            // For dynamic QR codes, update the destination if data changed
            if (qrCode.isDynamic && input.data !== undefined) {
              await shortUrlService.updateDynamicQRCode(qrCode.id, input.data, userId);
            }
            
          } catch (regenerationError) {
            console.error("QR code regeneration failed:", regenerationError);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to regenerate QR code image",
            });
          }
        }

        // Perform update
        const updatedQrCode = await ctx.db.update(qrCodes)
          .set(updateFields)
          .where(and(
            eq(qrCodes.id, input.id),
            eq(qrCodes.userId, userId)
          ))
          .returning();
        
        if (updatedQrCode.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update QR code",
          });
        }
        
        // Sync analytics and folder data (non-blocking)
        try {
          await syncQRCodeUpdateAnalytics(input.id, userId, {
            folderId: input.folderId,
            name: input.name,
            type: qrCode.type,
            data: input.data,
            previousFolderId: qrCode.folderId,
          });
        } catch (analyticsError) {
          // Log the error but don't fail the update operation
          console.error("Analytics sync failed:", analyticsError);
        }
        
        // Get the updated QR code with relations for return
        const finalQrCode = await ctx.db.query.qrCodes.findFirst({
          where: eq(qrCodes.id, input.id),
          with: {
            folder: true,
            template: true,
            analyticsEvents: {
              orderBy: [desc(analyticsEvents.timestamp)],
              limit: 5,
            },
          },
        });
        
        if (!finalQrCode) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve updated QR code",
          });
        }
        
        return { 
          success: true, 
          qrCode: finalQrCode,
          regenerated: needsRegeneration,
          message: needsRegeneration ? "QR code updated and regenerated successfully" : "QR code updated successfully"
        };
        
      } catch (error) {
        console.error("QR code update failed:", error);
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