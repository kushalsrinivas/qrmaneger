import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure, 
  publicProcedure 
} from "@/server/api/trpc";
import { templates } from "@/server/db/schema";
import { eq, and, desc, asc, count, sql, like, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  category: z.enum([
    "business", "personal", "event", "marketing", "restaurant", "retail", "education", "healthcare"
  ]),
  type: z.enum([
    "url", "vcard", "wifi", "text", "sms", "email", "phone", "location", 
    "event", "app_download", "multi_url", "menu", "payment", "pdf", "image", "video"
  ]),
  data: z.any(), // Template data structure
  style: z.object({
    foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
    cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
    patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
    logoUrl: z.string().url("Invalid logo URL").optional(),
    logoSize: z.number().min(5).max(50).optional(),
    logoPosition: z.enum(["center", "top", "bottom"]).optional(),
  }).optional(),
  settings: z.object({
    size: z.number().min(64).max(2048).default(512),
    format: z.enum(["png", "svg", "jpeg", "pdf"]).default("png"),
    errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
  }).optional(),
  variables: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "phone", "url", "number", "date", "select"]),
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
    options: z.array(z.string()).optional(), // For select type
    validation: z.object({
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  organizationId: z.string().optional(),
});

const updateTemplateSchema = z.object({
  id: z.string().min(1, "Template ID is required"),
  name: z.string().min(1, "Template name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  category: z.enum([
    "business", "personal", "event", "marketing", "restaurant", "retail", "education", "healthcare"
  ]).optional(),
  data: z.any().optional(),
  style: z.object({
    foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
    cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
    patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
    logoUrl: z.string().url("Invalid logo URL").optional(),
    logoSize: z.number().min(5).max(50).optional(),
    logoPosition: z.enum(["center", "top", "bottom"]).optional(),
  }).optional(),
  settings: z.object({
    size: z.number().min(64).max(2048).optional(),
    format: z.enum(["png", "svg", "jpeg", "pdf"]).optional(),
    errorCorrection: z.enum(["L", "M", "Q", "H"]).optional(),
  }).optional(),
  variables: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "phone", "url", "number", "date", "select"]),
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
    options: z.array(z.string()).optional(),
    validation: z.object({
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

const listTemplatesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum([
    "business", "personal", "event", "marketing", "restaurant", "retail", "education", "healthcare"
  ]).optional(),
  type: z.enum([
    "url", "vcard", "wifi", "text", "sms", "email", "phone", "location", 
    "event", "app_download", "multi_url", "menu", "payment", "pdf", "image", "video"
  ]).optional(),
  sortBy: z.enum(["name", "created", "updated", "uses"]).default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  tags: z.array(z.string()).optional(),
  includePublic: z.boolean().default(true),
});

const duplicateTemplateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  name: z.string().min(1, "New template name is required").max(255, "Name too long").optional(),
});

// ================================
// TEMPLATES ROUTER
// ================================

export const templatesRouter = createTRPCRouter({
  /**
   * Create a new template
   */
  create: protectedProcedure
    .input(createTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Check if template name already exists for this user
        const existingTemplate = await ctx.db.query.templates.findFirst({
          where: and(
            eq(templates.name, input.name),
            eq(templates.userId, userId),
            input.organizationId 
              ? eq(templates.organizationId, input.organizationId)
              : sql`${templates.organizationId} IS NULL`
          ),
        });
        
        if (existingTemplate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A template with this name already exists",
          });
        }
        
        // Create the template
        const template = await ctx.db.insert(templates).values({
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          category: input.category,
          type: input.type,
          data: input.data,
          style: input.style,
          settings: input.settings,
          variables: input.variables,
          tags: input.tags,
          isPublic: input.isPublic,
          userId,
          organizationId: input.organizationId,
        }).returning();
        
        return template[0];
        
      } catch (error) {
        console.error("Template creation failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  /**
   * Get all templates with filtering and pagination
   */
  list: protectedProcedure
    .input(listTemplatesSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const offset = (input.page - 1) * input.limit;
      
      try {
        // Build where conditions
        const whereConditions = [];
        
        // User's own templates or public templates
        if (input.includePublic) {
          whereConditions.push(
            sql`(${templates.userId} = ${userId} OR ${templates.isPublic} = true)`
          );
        } else {
          whereConditions.push(eq(templates.userId, userId));
        }
        
        // Search filter
        if (input.search) {
          whereConditions.push(
            sql`(${templates.name} ILIKE ${'%' + input.search + '%'} OR ${templates.description} ILIKE ${'%' + input.search + '%'})`
          );
        }
        
        // Category filter
        if (input.category) {
          whereConditions.push(eq(templates.category, input.category));
        }
        
        // Type filter
        if (input.type) {
          whereConditions.push(eq(templates.type, input.type));
        }
        
        // Tags filter
        if (input.tags && input.tags.length > 0) {
          whereConditions.push(
            sql`${templates.tags} && ${input.tags}`
          );
        }
        
        // Combine conditions
        const whereClause = whereConditions.length > 0 
          ? sql`${whereConditions.reduce((acc, condition) => 
              acc ? sql`${acc} AND ${condition}` : condition
            )}`
          : undefined;
        
        // Build order by
        const orderBy = input.sortBy === "name" 
          ? input.sortOrder === "asc" ? asc(templates.name) : desc(templates.name)
          : input.sortBy === "updated"
          ? input.sortOrder === "asc" ? asc(templates.updatedAt) : desc(templates.updatedAt)
          : input.sortBy === "uses"
          ? input.sortOrder === "asc" ? asc(templates.usageCount) : desc(templates.usageCount)
          : input.sortOrder === "asc" ? asc(templates.createdAt) : desc(templates.createdAt);
        
        // Get templates
        const templatesQuery = ctx.db.query.templates.findMany({
          where: whereClause,
          orderBy,
          limit: input.limit,
          offset,
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });
        
        // Get total count
        const totalQuery = ctx.db.select({ count: count() }).from(templates).where(whereClause);
        
        const [templatesResult, totalResult] = await Promise.all([
          templatesQuery,
          totalQuery,
        ]);
        
        const total = totalResult[0]?.count ?? 0;
        
        return {
          templates: templatesResult,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
          },
        };
        
      } catch (error) {
        console.error("Templates list failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch templates",
        });
      }
    }),

  /**
   * Get a single template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        const template = await ctx.db.query.templates.findFirst({
          where: and(
            eq(templates.id, input.id),
            sql`(${templates.userId} = ${userId} OR ${templates.isPublic} = true)`
          ),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
            organization: {
              columns: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        });
        
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found or access denied",
          });
        }
        
        return template;
        
      } catch (error) {
        console.error("Template fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch template",
        });
      }
    }),

  /**
   * Update a template
   */
  update: protectedProcedure
    .input(updateTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership
        const template = await ctx.db.query.templates.findFirst({
          where: and(
            eq(templates.id, input.id),
            eq(templates.userId, userId)
          ),
        });
        
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found or access denied",
          });
        }
        
        // Check for name conflicts if name is being updated
        if (input.name && input.name !== template.name) {
          const existingTemplate = await ctx.db.query.templates.findFirst({
            where: and(
              eq(templates.name, input.name),
              eq(templates.userId, userId),
              template.organizationId 
                ? eq(templates.organizationId, template.organizationId)
                : sql`${templates.organizationId} IS NULL`
            ),
          });
          
          if (existingTemplate) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A template with this name already exists",
            });
          }
        }
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.name !== undefined) updateFields.name = input.name;
        if (input.description !== undefined) updateFields.description = input.description;
        if (input.category !== undefined) updateFields.category = input.category;
        if (input.data !== undefined) updateFields.data = input.data;
        if (input.style !== undefined) updateFields.style = input.style;
        if (input.settings !== undefined) updateFields.settings = input.settings;
        if (input.variables !== undefined) updateFields.variables = input.variables;
        if (input.tags !== undefined) updateFields.tags = input.tags;
        if (input.isPublic !== undefined) updateFields.isPublic = input.isPublic;
        
        // Add updated timestamp
        updateFields.updatedAt = new Date();
        
        // Update the template
        const updatedTemplate = await ctx.db.update(templates)
          .set(updateFields)
          .where(eq(templates.id, input.id))
          .returning();
        
        return updatedTemplate[0];
        
      } catch (error) {
        console.error("Template update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update template",
        });
      }
    }),

  /**
   * Delete a template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership
        const template = await ctx.db.query.templates.findFirst({
          where: and(
            eq(templates.id, input.id),
            eq(templates.userId, userId)
          ),
        });
        
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found or access denied",
          });
        }
        
        // Delete the template
        await ctx.db.delete(templates).where(eq(templates.id, input.id));
        
        return { success: true };
        
      } catch (error) {
        console.error("Template deletion failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }
    }),

  /**
   * Duplicate a template
   */
  duplicate: protectedProcedure
    .input(duplicateTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get the original template
        const originalTemplate = await ctx.db.query.templates.findFirst({
          where: and(
            eq(templates.id, input.templateId),
            sql`(${templates.userId} = ${userId} OR ${templates.isPublic} = true)`
          ),
        });
        
        if (!originalTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found or access denied",
          });
        }
        
        // Generate new name if not provided
        const newName = input.name || `${originalTemplate.name} (Copy)`;
        
        // Check for name conflicts
        const existingTemplate = await ctx.db.query.templates.findFirst({
          where: and(
            eq(templates.name, newName),
            eq(templates.userId, userId)
          ),
        });
        
        if (existingTemplate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A template with this name already exists",
          });
        }
        
        // Create the duplicate
        const duplicateTemplate = await ctx.db.insert(templates).values({
          id: crypto.randomUUID(),
          name: newName,
          description: originalTemplate.description,
          category: originalTemplate.category,
          type: originalTemplate.type,
          data: originalTemplate.data,
          style: originalTemplate.style,
          settings: originalTemplate.settings,
          variables: originalTemplate.variables,
          tags: originalTemplate.tags,
          isPublic: false, // Duplicates are private by default
          userId,
          organizationId: originalTemplate.organizationId,
        }).returning();
        
        return duplicateTemplate[0];
        
      } catch (error) {
        console.error("Template duplication failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to duplicate template",
        });
      }
    }),

  /**
   * Get template categories with counts
   */
  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const categories = await ctx.db.select({
          category: templates.category,
          count: count(),
        })
        .from(templates)
        .where(sql`(${templates.userId} = ${userId} OR ${templates.isPublic} = true)`)
        .groupBy(templates.category);
        
        return categories;
        
      } catch (error) {
        console.error("Categories fetch failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch categories",
        });
      }
    }),

  /**
   * Get popular templates
   */
  getPopular: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        const popularTemplates = await ctx.db.query.templates.findMany({
          where: sql`(${templates.userId} = ${userId} OR ${templates.isPublic} = true)`,
          orderBy: [desc(templates.usageCount), desc(templates.createdAt)],
          limit: input.limit,
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });
        
        return popularTemplates;
        
      } catch (error) {
        console.error("Popular templates fetch failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch popular templates",
        });
      }
    }),
}); 