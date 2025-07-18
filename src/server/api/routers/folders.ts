import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure 
} from "@/server/api/trpc";
import { folders, qrCodes } from "@/server/db/schema";
import { eq, and, desc, asc, count, sql, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
  organizationId: z.string().optional(),
});

const updateFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  name: z.string().min(1, "Folder name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
});

const moveFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  parentId: z.string().nullable(),
});

const moveQRCodesSchema = z.object({
  qrCodeIds: z.array(z.string().min(1)),
  targetFolderId: z.string().nullable(),
});

const listFoldersSchema = z.object({
  parentId: z.string().nullable().optional(),
  includeQRCodes: z.boolean().default(false),
  sortBy: z.enum(["name", "created", "updated", "qrCount"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ================================
// FOLDERS ROUTER
// ================================

export const foldersRouter = createTRPCRouter({
  /**
   * Create a new folder
   */
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify parent folder exists and belongs to user (if specified)
        if (input.parentId) {
          const parentFolder = await ctx.db.query.folders.findFirst({
            where: and(
              eq(folders.id, input.parentId),
              eq(folders.userId, userId)
            ),
          });
          
          if (!parentFolder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Parent folder not found or access denied",
            });
          }
        }
        
        // Check if folder name already exists in the same parent
        const existingFolder = await ctx.db.query.folders.findFirst({
          where: and(
            eq(folders.name, input.name),
            eq(folders.userId, userId),
            input.parentId 
              ? eq(folders.parentId, input.parentId)
              : isNull(folders.parentId)
          ),
        });
        
        if (existingFolder) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A folder with this name already exists in this location",
          });
        }
        
        // Create the folder
        const folder = await ctx.db.insert(folders).values({
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          parentId: input.parentId,
          color: input.color,
          userId,
          organizationId: input.organizationId,
        }).returning();
        
        return folder[0];
        
      } catch (error) {
        console.error("Folder creation failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create folder",
        });
      }
    }),

  /**
   * Get all folders with optional hierarchy
   */
  list: protectedProcedure
    .input(listFoldersSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Build where conditions
        const whereConditions = [eq(folders.userId, userId)];
        
        // Filter by parent
        if (input.parentId) {
          whereConditions.push(eq(folders.parentId, input.parentId));
        } else if (input.parentId === null) {
          whereConditions.push(isNull(folders.parentId));
        }
        
        // Build order by
        const orderBy = input.sortBy === "name" 
          ? input.sortOrder === "asc" ? asc(folders.name) : desc(folders.name)
          : input.sortBy === "updated"
          ? input.sortOrder === "asc" ? asc(folders.updatedAt) : desc(folders.updatedAt)
          : input.sortBy === "qrCount"
          ? input.sortOrder === "asc" ? asc(folders.qrCodeCount) : desc(folders.qrCodeCount)
          : input.sortOrder === "asc" ? asc(folders.createdAt) : desc(folders.createdAt);
        
        // Get folders with QR code counts
        const foldersWithCounts = await ctx.db.select({
          id: folders.id,
          name: folders.name,
          description: folders.description,
          parentId: folders.parentId,
          color: folders.color,
          qrCodeCount: folders.qrCodeCount,
          createdAt: folders.createdAt,
          updatedAt: folders.updatedAt,
          qrCodesCount: count(qrCodes.id),
        })
        .from(folders)
        .leftJoin(qrCodes, eq(folders.id, qrCodes.folderId))
        .where(and(...whereConditions))
        .groupBy(folders.id)
        .orderBy(orderBy);
        
        // If including QR codes, fetch them separately
        let foldersWithQRCodes = foldersWithCounts;
        
        if (input.includeQRCodes) {
          foldersWithQRCodes = await Promise.all(
            foldersWithCounts.map(async (folder) => {
              const qrCodesInFolder = await ctx.db.query.qrCodes.findMany({
                where: eq(qrCodes.folderId, folder.id),
                orderBy: desc(qrCodes.createdAt),
                limit: 10, // Limit to prevent large payloads
                columns: {
                  id: true,
                  name: true,
                  type: true,
                  status: true,
                  scanCount: true,
                  createdAt: true,
                  imageUrl: true,
                },
              });
              
              return {
                ...folder,
                qrCodes: qrCodesInFolder,
              };
            })
          );
        }
        
        return foldersWithQRCodes;
        
      } catch (error) {
        console.error("Folders list failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch folders",
        });
      }
    }),

  /**
   * Get folder tree structure
   */
  getTree: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get all folders for the user
        const allFolders = await ctx.db.select({
          id: folders.id,
          name: folders.name,
          description: folders.description,
          parentId: folders.parentId,
          color: folders.color,
          qrCodeCount: folders.qrCodeCount,
          createdAt: folders.createdAt,
          updatedAt: folders.updatedAt,
        })
        .from(folders)
        .where(eq(folders.userId, userId))
        .orderBy(asc(folders.name));
        
        // Build tree structure
        const buildTree = (parentId: string | null): any[] => {
          return allFolders
            .filter(folder => folder.parentId === parentId)
            .map(folder => ({
              ...folder,
              children: buildTree(folder.id),
            }));
        };
        
        const tree = buildTree(null);
        
        return tree;
        
      } catch (error) {
        console.error("Folder tree fetch failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch folder tree",
        });
      }
    }),

  /**
   * Get a single folder by ID
   */
  getById: protectedProcedure
    .input(z.object({ 
      id: z.string().min(1),
      includeQRCodes: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        const folder = await ctx.db.query.folders.findFirst({
          where: and(
            eq(folders.id, input.id),
            eq(folders.userId, userId)
          ),
          with: {
            parent: {
              columns: {
                id: true,
                name: true,
              },
            },
            children: {
              columns: {
                id: true,
                name: true,
                qrCodeCount: true,
              },
            },
          },
        });
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found or access denied",
          });
        }
        
        // Include QR codes if requested
        if (input.includeQRCodes) {
          const qrCodesInFolder = await ctx.db.query.qrCodes.findMany({
            where: eq(qrCodes.folderId, input.id),
            orderBy: desc(qrCodes.createdAt),
            columns: {
              id: true,
              name: true,
              type: true,
              status: true,
              scanCount: true,
              createdAt: true,
              imageUrl: true,
            },
          });
          
          return {
            ...folder,
            qrCodes: qrCodesInFolder,
          };
        }
        
        return folder;
        
      } catch (error) {
        console.error("Folder fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch folder",
        });
      }
    }),

  /**
   * Update a folder
   */
  update: protectedProcedure
    .input(updateFolderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership
        const folder = await ctx.db.query.folders.findFirst({
          where: and(
            eq(folders.id, input.id),
            eq(folders.userId, userId)
          ),
        });
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found or access denied",
          });
        }
        
        // Check for name conflicts if name is being updated
        if (input.name && input.name !== folder.name) {
          const existingFolder = await ctx.db.query.folders.findFirst({
            where: and(
              eq(folders.name, input.name),
              eq(folders.userId, userId),
              folder.parentId 
                ? eq(folders.parentId, folder.parentId)
                : isNull(folders.parentId)
            ),
          });
          
          if (existingFolder) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A folder with this name already exists in this location",
            });
          }
        }
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.name !== undefined) updateFields.name = input.name;
        if (input.description !== undefined) updateFields.description = input.description;
        if (input.color !== undefined) updateFields.color = input.color;
        
        // Add updated timestamp
        updateFields.updatedAt = new Date();
        
        // Update the folder
        const updatedFolder = await ctx.db.update(folders)
          .set(updateFields)
          .where(eq(folders.id, input.id))
          .returning();
        
        return updatedFolder[0];
        
      } catch (error) {
        console.error("Folder update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update folder",
        });
      }
    }),

  /**
   * Move a folder to a different parent
   */
  move: protectedProcedure
    .input(moveFolderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership of the folder being moved
        const folder = await ctx.db.query.folders.findFirst({
          where: and(
            eq(folders.id, input.id),
            eq(folders.userId, userId)
          ),
        });
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found or access denied",
          });
        }
        
        // Verify parent folder exists and belongs to user (if specified)
        if (input.parentId) {
          const parentFolder = await ctx.db.query.folders.findFirst({
            where: and(
              eq(folders.id, input.parentId),
              eq(folders.userId, userId)
            ),
          });
          
          if (!parentFolder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Parent folder not found or access denied",
            });
          }
          
          // Check for circular reference
          const isCircular = await checkCircularReference(ctx.db, input.id, input.parentId);
          if (isCircular) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot move folder: would create circular reference",
            });
          }
        }
        
        // Check for name conflicts in the new location
        const existingFolder = await ctx.db.query.folders.findFirst({
          where: and(
            eq(folders.name, folder.name),
            eq(folders.userId, userId),
            input.parentId 
              ? eq(folders.parentId, input.parentId)
              : isNull(folders.parentId)
          ),
        });
        
        if (existingFolder && existingFolder.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A folder with this name already exists in the target location",
          });
        }
        
        // Move the folder
        const movedFolder = await ctx.db.update(folders)
          .set({
            parentId: input.parentId,
            updatedAt: new Date(),
          })
          .where(eq(folders.id, input.id))
          .returning();
        
        return movedFolder[0];
        
      } catch (error) {
        console.error("Folder move failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to move folder",
        });
      }
    }),

  /**
   * Delete a folder
   */
  delete: protectedProcedure
    .input(z.object({ 
      id: z.string().min(1),
      moveQRCodesToParent: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership
        const folder = await ctx.db.query.folders.findFirst({
          where: and(
            eq(folders.id, input.id),
            eq(folders.userId, userId)
          ),
        });
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found or access denied",
          });
        }
        
        // Check if folder has children
        const childFolders = await ctx.db.query.folders.findMany({
          where: eq(folders.parentId, input.id),
        });
        
        if (childFolders.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot delete folder with subfolders. Please delete or move subfolders first.",
          });
        }
        
        // Handle QR codes in the folder
        if (input.moveQRCodesToParent) {
          // Move QR codes to parent folder
          await ctx.db.update(qrCodes)
            .set({ folderId: folder.parentId })
            .where(eq(qrCodes.folderId, input.id));
        } else {
          // Move QR codes to root (no folder)
          await ctx.db.update(qrCodes)
            .set({ folderId: null })
            .where(eq(qrCodes.folderId, input.id));
        }
        
        // Delete the folder
        await ctx.db.delete(folders).where(eq(folders.id, input.id));
        
        return { success: true };
        
      } catch (error) {
        console.error("Folder deletion failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete folder",
        });
      }
    }),

  /**
   * Move QR codes between folders
   */
  moveQRCodes: protectedProcedure
    .input(moveQRCodesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership of all QR codes
        const qrCodesList = await ctx.db.query.qrCodes.findMany({
          where: and(
            sql`${qrCodes.id} = ANY(${input.qrCodeIds})`,
            eq(qrCodes.userId, userId)
          ),
        });
        
        if (qrCodesList.length !== input.qrCodeIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Some QR codes not found or access denied",
          });
        }
        
        // Verify target folder exists and belongs to user (if specified)
        if (input.targetFolderId) {
          const targetFolder = await ctx.db.query.folders.findFirst({
            where: and(
              eq(folders.id, input.targetFolderId),
              eq(folders.userId, userId)
            ),
          });
          
          if (!targetFolder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Target folder not found or access denied",
            });
          }
        }
        
        // Move the QR codes
        await ctx.db.update(qrCodes)
          .set({ 
            folderId: input.targetFolderId,
            updatedAt: new Date(),
          })
          .where(sql`${qrCodes.id} = ANY(${input.qrCodeIds})`);
        
        return { success: true, movedCount: input.qrCodeIds.length };
        
      } catch (error) {
        console.error("QR codes move failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to move QR codes",
        });
      }
    }),

  /**
   * Get folder statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get total folders count
        const totalFolders = await ctx.db.select({ count: count() })
          .from(folders)
          .where(eq(folders.userId, userId));
        
        // Get root folders count
        const rootFolders = await ctx.db.select({ count: count() })
          .from(folders)
          .where(and(
            eq(folders.userId, userId),
            isNull(folders.parentId)
          ));
        
        // Get deepest folder level
        const deepestLevel = await ctx.db.select({
          maxLevel: sql<number>`MAX(CASE WHEN ${folders.parentId} IS NULL THEN 0 ELSE 1 END)`,
        })
        .from(folders)
        .where(eq(folders.userId, userId));
        
        return {
          totalFolders: totalFolders[0]?.count ?? 0,
          rootFolders: rootFolders[0]?.count ?? 0,
          deepestLevel: deepestLevel[0]?.maxLevel ?? 0,
        };
        
      } catch (error) {
        console.error("Folder stats fetch failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch folder statistics",
        });
      }
    }),
});

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Check if moving a folder would create a circular reference
 */
async function checkCircularReference(
  db: any,
  folderId: string,
  potentialParentId: string
): Promise<boolean> {
  // If trying to move to itself, it's circular
  if (folderId === potentialParentId) {
    return true;
  }
  
  // Check if the potential parent is a descendant of the folder
  let currentParentId = potentialParentId;
  const visitedIds = new Set<string>();
  
  while (currentParentId) {
    if (visitedIds.has(currentParentId)) {
      // Already visited, circular reference detected
      return true;
    }
    
    if (currentParentId === folderId) {
      // Found the folder in the parent chain, circular reference
      return true;
    }
    
    visitedIds.add(currentParentId);
    
    // Get the parent of the current folder
    const parentFolder = await db.query.folders.findFirst({
      where: eq(folders.id, currentParentId),
      columns: { parentId: true },
    });
    
    currentParentId = parentFolder?.parentId || null;
  }
  
  return false;
} 