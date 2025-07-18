import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure 
} from "@/server/api/trpc";
import { qrCodes, templates, folders } from "@/server/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { batchQRService } from "@/lib/qr-generation";
import { validateQRCodeData } from "@/lib/qr-validation";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const bulkQRDataSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  type: z.enum([
    "url", "vcard", "wifi", "text", "sms", "email", "phone", "location", 
    "event", "app_download", "multi_url", "menu", "payment", "pdf", "image", "video"
  ]),
  data: z.any(), // Will be validated by service layer
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const bulkCreateSchema = z.object({
  qrCodes: z.array(bulkQRDataSchema).min(1, "At least one QR code is required").max(100, "Maximum 100 QR codes per batch"),
  options: z.object({
    errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
    size: z.number().min(64).max(2048).default(512),
    format: z.enum(["png", "svg", "jpeg", "pdf"]).default("png"),
    customization: z.object({
      foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
      patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
      logoUrl: z.string().url("Invalid logo URL").optional(),
      logoSize: z.number().min(5).max(50).optional(),
      logoPosition: z.enum(["center", "top", "bottom"]).optional(),
    }).optional(),
  }),
  templateId: z.string().optional(),
  isDynamic: z.boolean().default(false),
});

const csvImportSchema = z.object({
  csvData: z.string().min(1, "CSV data is required"),
  templateId: z.string().optional(),
  options: z.object({
    errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
    size: z.number().min(64).max(2048).default(512),
    format: z.enum(["png", "svg", "jpeg", "pdf"]).default("png"),
    customization: z.object({
      foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
      patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
      logoUrl: z.string().url("Invalid logo URL").optional(),
      logoSize: z.number().min(5).max(50).optional(),
      logoPosition: z.enum(["center", "top", "bottom"]).optional(),
    }).optional(),
  }),
  isDynamic: z.boolean().default(false),
  folderId: z.string().optional(),
});

const bulkUpdateSchema = z.object({
  qrCodeIds: z.array(z.string().min(1)).min(1, "At least one QR code ID is required").max(100, "Maximum 100 QR codes per batch"),
  updates: z.object({
    folderId: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    style: z.object({
      foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
      patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
      logoUrl: z.string().url("Invalid logo URL").optional(),
      logoSize: z.number().min(5).max(50).optional(),
      logoPosition: z.enum(["center", "top", "bottom"]).optional(),
    }).optional(),
    expiresAt: z.date().nullable().optional(),
  }),
  regenerateImages: z.boolean().default(false),
});

const bulkDeleteSchema = z.object({
  qrCodeIds: z.array(z.string().min(1)).min(1, "At least one QR code ID is required").max(100, "Maximum 100 QR codes per batch"),
  confirmation: z.literal("DELETE_SELECTED_QR_CODES"),
});

const bulkExportSchema = z.object({
  qrCodeIds: z.array(z.string().min(1)).optional(),
  format: z.enum(["csv", "json", "zip"]).default("csv"),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
  folderId: z.string().optional(),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
});

// ================================
// BULK OPERATIONS ROUTER
// ================================

export const bulkRouter = createTRPCRouter({
  /**
   * Create multiple QR codes in batch
   */
  createBatch: protectedProcedure
    .input(bulkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Validate each QR code data
        const validationResults = input.qrCodes.map((qrData, index) => {
          const validation = validateQRCodeData(qrData.type, qrData.data);
          return {
            index,
            isValid: validation.isValid,
            errors: validation.errors,
            qrData,
          };
        });
        
        // Check for validation errors
        const invalidQRCodes = validationResults.filter(result => !result.isValid);
        if (invalidQRCodes.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Validation failed for ${invalidQRCodes.length} QR codes`,
            cause: invalidQRCodes.map(invalid => ({
              index: invalid.index,
              errors: invalid.errors,
            })),
          });
        }
        
        // Verify template exists if specified
        if (input.templateId) {
          const template = await ctx.db.query.templates.findFirst({
            where: and(
              eq(templates.id, input.templateId),
              eq(templates.userId, userId)
            ),
          });
          
          if (!template) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Template not found or access denied",
            });
          }
        }
        
        // Verify folders exist if specified
        const folderIds = input.qrCodes
          .map(qr => qr.folderId)
          .filter(Boolean) as string[];
        
        if (folderIds.length > 0) {
          const folders = await ctx.db.query.folders.findMany({
            where: and(
              inArray(folders.id, folderIds),
              eq(folders.userId, userId)
            ),
          });
          
          if (folders.length !== new Set(folderIds).size) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Some folders not found or access denied",
            });
          }
        }
        
        // Prepare batch generation requests
        const batchRequests = input.qrCodes.map(qrData => ({
          type: qrData.type,
          mode: input.isDynamic ? "dynamic" : "static",
          data: qrData.data,
          options: input.options,
          metadata: {
            name: qrData.name,
            folderId: qrData.folderId,
            templateId: input.templateId,
            tags: qrData.tags,
          },
        }));
        
        // Generate QR codes in batch
        const batchResult = await batchQRService.generateBatch(
          batchRequests,
          userId,
          { maxConcurrency: 10, timeout: 30000 }
        );
        
        // Store successful QR codes in database
        const qrCodeRecords = await Promise.all(
          batchResult.successful.map(async (qrResult, index) => {
            const originalRequest = input.qrCodes[index];
            if (!originalRequest) return null;
            
            return await ctx.db.insert(qrCodes).values({
              id: qrResult.id,
              name: originalRequest.name,
              type: qrResult.metadata.type,
              isDynamic: input.isDynamic,
              data: originalRequest.data,
              style: input.options.customization,
              size: qrResult.metadata.size,
              format: qrResult.metadata.format,
              errorCorrection: qrResult.metadata.errorCorrection,
              imageUrl: qrResult.qrCodeUrl,
              imageSize: qrResult.metadata.fileSize,
              folderId: originalRequest.folderId,
              templateId: input.templateId,
              tags: originalRequest.tags,
              userId,
              dynamicUrl: qrResult.shortUrl,
            }).returning();
          })
        );
        
        return {
          successful: batchResult.successful.map((qrResult, index) => ({
            ...qrResult,
            qrCode: qrCodeRecords[index]?.[0],
          })),
          failed: batchResult.failed,
          summary: {
            total: input.qrCodes.length,
            successful: batchResult.successful.length,
            failed: batchResult.failed.length,
          },
        };
        
      } catch (error) {
        console.error("Bulk create failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create QR codes in batch",
        });
      }
    }),

  /**
   * Import QR codes from CSV
   */
  importFromCSV: protectedProcedure
    .input(csvImportSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Parse CSV data
        const csvLines = input.csvData.trim().split('\n');
        if (csvLines.length < 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CSV must contain at least a header row and one data row",
          });
        }
        
        const headers = csvLines[0]!.split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'type', 'data'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Missing required CSV headers: ${missingHeaders.join(', ')}`,
          });
        }
        
        // Parse data rows
        const qrCodesData = csvLines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const rowData: any = {};
          
          headers.forEach((header, i) => {
            rowData[header] = values[i] || '';
          });
          
          // Parse JSON data field
          try {
            if (rowData.data) {
              rowData.data = JSON.parse(rowData.data);
            }
          } catch (e) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid JSON in data field at row ${index + 2}`,
            });
          }
          
          // Parse tags if present
          if (rowData.tags) {
            rowData.tags = rowData.tags.split(';').map((tag: string) => tag.trim());
          }
          
          return {
            name: rowData.name,
            type: rowData.type,
            data: rowData.data,
            folderId: rowData.folderId || input.folderId,
            tags: rowData.tags,
          };
        });
        
        if (qrCodesData.length > 100) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Maximum 100 QR codes per CSV import",
          });
        }
        
        // Use the bulk create functionality
        const bulkCreateInput = {
          qrCodes: qrCodesData,
          options: input.options,
          templateId: input.templateId,
          isDynamic: input.isDynamic,
        };
        
        return await ctx.procedure.bulkRouter.createBatch({ input: bulkCreateInput });
        
      } catch (error) {
        console.error("CSV import failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import QR codes from CSV",
        });
      }
    }),

  /**
   * Update multiple QR codes in batch
   */
  updateBatch: protectedProcedure
    .input(bulkUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership of all QR codes
        const qrCodesList = await ctx.db.query.qrCodes.findMany({
          where: and(
            inArray(qrCodes.id, input.qrCodeIds),
            eq(qrCodes.userId, userId)
          ),
        });
        
        if (qrCodesList.length !== input.qrCodeIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Some QR codes not found or access denied",
          });
        }
        
        // Verify folder exists if specified
        if (input.updates.folderId) {
          const folder = await ctx.db.query.folders.findFirst({
            where: and(
              eq(folders.id, input.updates.folderId),
              eq(folders.userId, userId)
            ),
          });
          
          if (!folder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Target folder not found or access denied",
            });
          }
        }
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.updates.folderId !== undefined) updateFields.folderId = input.updates.folderId;
        if (input.updates.tags !== undefined) updateFields.tags = input.updates.tags;
        if (input.updates.status !== undefined) updateFields.status = input.updates.status;
        if (input.updates.style !== undefined) updateFields.style = input.updates.style;
        if (input.updates.expiresAt !== undefined) updateFields.expiresAt = input.updates.expiresAt;
        
        // Add updated timestamp
        updateFields.updatedAt = new Date();
        
        // Handle image regeneration if needed
        if (input.regenerateImages && input.updates.style) {
          // TODO: Implement bulk image regeneration
          // This would require updating the QR code generation service
          // For now, we'll just update the style and set a flag for regeneration
          updateFields.needsRegeneration = true;
        }
        
        // Perform bulk update
        const updatedQRCodes = await ctx.db.update(qrCodes)
          .set(updateFields)
          .where(inArray(qrCodes.id, input.qrCodeIds))
          .returning();
        
        return {
          updatedCount: updatedQRCodes.length,
          qrCodes: updatedQRCodes,
        };
        
      } catch (error) {
        console.error("Bulk update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update QR codes in batch",
        });
      }
    }),

  /**
   * Delete multiple QR codes in batch
   */
  deleteBatch: protectedProcedure
    .input(bulkDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify confirmation
        if (input.confirmation !== "DELETE_SELECTED_QR_CODES") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid confirmation",
          });
        }
        
        // Verify ownership of all QR codes
        const qrCodesList = await ctx.db.query.qrCodes.findMany({
          where: and(
            inArray(qrCodes.id, input.qrCodeIds),
            eq(qrCodes.userId, userId)
          ),
        });
        
        if (qrCodesList.length !== input.qrCodeIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Some QR codes not found or access denied",
          });
        }
        
        // Delete the QR codes
        await ctx.db.delete(qrCodes)
          .where(inArray(qrCodes.id, input.qrCodeIds));
        
        return {
          deletedCount: input.qrCodeIds.length,
          success: true,
        };
        
      } catch (error) {
        console.error("Bulk delete failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete QR codes in batch",
        });
      }
    }),

  /**
   * Export QR codes in batch
   */
  exportBatch: protectedProcedure
    .input(bulkExportSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Build where conditions
        const whereConditions = [eq(qrCodes.userId, userId)];
        
        // Filter by specific QR codes if provided
        if (input.qrCodeIds && input.qrCodeIds.length > 0) {
          whereConditions.push(inArray(qrCodes.id, input.qrCodeIds));
        }
        
        // Filter by folder if provided
        if (input.folderId) {
          whereConditions.push(eq(qrCodes.folderId, input.folderId));
        }
        
        // Filter by date range if provided
        if (input.dateRange) {
          whereConditions.push(
            sql`${qrCodes.createdAt} BETWEEN ${input.dateRange.startDate} AND ${input.dateRange.endDate}`
          );
        }
        
        // Get QR codes to export
        const qrCodesToExport = await ctx.db.query.qrCodes.findMany({
          where: and(...whereConditions),
          with: {
            folder: {
              columns: {
                name: true,
              },
            },
            template: {
              columns: {
                name: true,
              },
            },
          },
        });
        
        if (qrCodesToExport.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No QR codes found matching the criteria",
          });
        }
        
        // Get analytics data if requested
        let analyticsData: any[] = [];
        if (input.includeAnalytics) {
          const qrCodeIds = qrCodesToExport.map(qr => qr.id);
          analyticsData = await ctx.db.query.analyticsEvents.findMany({
            where: inArray(analyticsEvents.qrCodeId, qrCodeIds),
            with: {
              qrCode: {
                columns: {
                  name: true,
                },
              },
            },
          });
        }
        
        // Format data based on export format
        let exportData: any;
        
        if (input.format === "csv") {
          // CSV format
          const csvHeaders = [
            "ID", "Name", "Type", "Status", "Scans", "Created", "Updated",
            "Folder", "Template", "Image URL", "Dynamic URL"
          ];
          
          const csvRows = qrCodesToExport.map(qr => [
            qr.id,
            qr.name,
            qr.type,
            qr.status,
            qr.scanCount,
            qr.createdAt.toISOString(),
            qr.updatedAt?.toISOString() || '',
            qr.folder?.name || '',
            qr.template?.name || '',
            qr.imageUrl || '',
            qr.dynamicUrl || '',
          ]);
          
          exportData = {
            format: "csv",
            headers: csvHeaders,
            data: csvRows,
            filename: `qr_codes_export_${new Date().toISOString().split('T')[0]}.csv`,
          };
          
        } else if (input.format === "json") {
          // JSON format
          exportData = {
            format: "json",
            data: {
              qrCodes: qrCodesToExport,
              analytics: input.includeAnalytics ? analyticsData : undefined,
              exportedAt: new Date().toISOString(),
              totalCount: qrCodesToExport.length,
            },
            filename: `qr_codes_export_${new Date().toISOString().split('T')[0]}.json`,
          };
          
        } else {
          // ZIP format (for images)
          exportData = {
            format: "zip",
            data: {
              qrCodes: qrCodesToExport.map(qr => ({
                id: qr.id,
                name: qr.name,
                imageUrl: qr.imageUrl,
                metadata: {
                  type: qr.type,
                  status: qr.status,
                  scans: qr.scanCount,
                  created: qr.createdAt,
                },
              })),
              includeImages: input.includeImages,
            },
            filename: `qr_codes_export_${new Date().toISOString().split('T')[0]}.zip`,
          };
        }
        
        return {
          ...exportData,
          count: qrCodesToExport.length,
        };
        
      } catch (error) {
        console.error("Bulk export failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export QR codes",
        });
      }
    }),

  /**
   * Get bulk operation status
   */
  getOperationStatus: protectedProcedure
    .input(z.object({ operationId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // TODO: Implement operation status tracking
      // This would require a separate table to track long-running operations
      // For now, return a placeholder
      return {
        operationId: input.operationId,
        status: "completed",
        progress: 100,
        result: null,
      };
    }),

  /**
   * Get bulk operation statistics
   */
  getBulkStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get total QR codes count
        const totalQRCodes = await ctx.db.select({ count: count() })
          .from(qrCodes)
          .where(eq(qrCodes.userId, userId));
        
        // Get QR codes by type
        const qrCodesByType = await ctx.db.select({
          type: qrCodes.type,
          count: count(),
        })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId))
        .groupBy(qrCodes.type);
        
        // Get QR codes by status
        const qrCodesByStatus = await ctx.db.select({
          status: qrCodes.status,
          count: count(),
        })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId))
        .groupBy(qrCodes.status);
        
        // Get recent bulk operations (placeholder)
        const recentOperations = []; // TODO: Implement from operations table
        
        return {
          totalQRCodes: totalQRCodes[0]?.count || 0,
          qrCodesByType: qrCodesByType.reduce((acc, item) => {
            acc[item.type] = item.count;
            return acc;
          }, {} as Record<string, number>),
          qrCodesByStatus: qrCodesByStatus.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {} as Record<string, number>),
          recentOperations,
        };
        
      } catch (error) {
        console.error("Bulk stats fetch failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch bulk operation statistics",
        });
      }
    }),
}); 