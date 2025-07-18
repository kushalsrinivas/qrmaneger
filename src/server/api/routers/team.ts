import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure 
} from "@/server/api/trpc";
import { organizations, organizationMembers, users } from "@/server/db/schema";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  logo: z.string().url("Invalid logo URL").optional(),
  website: z.string().url("Invalid website URL").optional(),
  settings: z.object({
    branding: z.object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      logo: z.string().url("Invalid logo URL").optional(),
    }).optional(),
    limits: z.object({
      maxQRCodes: z.number().min(1).optional(),
      maxUsers: z.number().min(1).optional(),
      maxTemplates: z.number().min(1).optional(),
    }).optional(),
    features: z.object({
      analytics: z.boolean().optional(),
      customDomains: z.boolean().optional(),
      apiAccess: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const updateOrganizationSchema = z.object({
  id: z.string().min(1, "Organization ID is required"),
  name: z.string().min(1, "Organization name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  logo: z.string().url("Invalid logo URL").optional(),
  website: z.string().url("Invalid website URL").optional(),
  settings: z.object({
    branding: z.object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      logo: z.string().url("Invalid logo URL").optional(),
    }).optional(),
    limits: z.object({
      maxQRCodes: z.number().min(1).optional(),
      maxUsers: z.number().min(1).optional(),
      maxTemplates: z.number().min(1).optional(),
    }).optional(),
    features: z.object({
      analytics: z.boolean().optional(),
      customDomains: z.boolean().optional(),
      apiAccess: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const inviteMemberSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "team_lead", "member", "viewer"]).default("member"),
  permissions: z.object({
    canCreateQR: z.boolean().default(true),
    canEditQR: z.boolean().default(true),
    canDeleteQR: z.boolean().default(false),
    canViewAnalytics: z.boolean().default(true),
    canManageUsers: z.boolean().default(false),
    canManageSettings: z.boolean().default(false),
  }).optional(),
});

const updateMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  role: z.enum(["admin", "team_lead", "member", "viewer"]).optional(),
  permissions: z.object({
    canCreateQR: z.boolean().optional(),
    canEditQR: z.boolean().optional(),
    canDeleteQR: z.boolean().optional(),
    canViewAnalytics: z.boolean().optional(),
    canManageUsers: z.boolean().optional(),
    canManageSettings: z.boolean().optional(),
  }).optional(),
});

const listMembersSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["admin", "team_lead", "member", "viewer"]).optional(),
  sortBy: z.enum(["name", "email", "role", "joined"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ================================
// TEAM ROUTER
// ================================

export const teamRouter = createTRPCRouter({
  /**
   * Create a new organization
   */
  createOrganization: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Check if organization name already exists
        const existingOrg = await ctx.db.query.organizations.findFirst({
          where: eq(organizations.name, input.name),
        });
        
        if (existingOrg) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An organization with this name already exists",
          });
        }
        
        // Create the organization
        const organization = await ctx.db.insert(organizations).values({
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          logo: input.logo,
          website: input.website,
          settings: input.settings,
        }).returning();
        
        // Add the creator as an admin
        await ctx.db.insert(organizationMembers).values({
          id: crypto.randomUUID(),
          organizationId: organization[0]!.id,
          userId,
          role: "admin",
          permissions: {
            canCreateQR: true,
            canEditQR: true,
            canDeleteQR: true,
            canViewAnalytics: true,
            canManageUsers: true,
            canManageSettings: true,
          },
        });
        
        return organization[0];
        
      } catch (error) {
        console.error("Organization creation failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        });
      }
    }),

  /**
   * Get user's organizations
   */
  getUserOrganizations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const userOrganizations = await ctx.db.select({
          id: organizations.id,
          name: organizations.name,
          description: organizations.description,
          logo: organizations.logo,
          website: organizations.website,
          settings: organizations.settings,
          isActive: organizations.isActive,
          createdAt: organizations.createdAt,
          role: organizationMembers.role,
          permissions: organizationMembers.permissions,
          joinedAt: organizationMembers.joinedAt,
        })
        .from(organizations)
        .innerJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
        .where(eq(organizationMembers.userId, userId))
        .orderBy(asc(organizations.name));
        
        return userOrganizations;
        
      } catch (error) {
        console.error("User organizations fetch failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organizations",
        });
      }
    }),

  /**
   * Get organization by ID
   */
  getOrganization: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify user is a member of the organization
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.id),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found or access denied",
          });
        }
        
        // Get organization details
        const organization = await ctx.db.query.organizations.findFirst({
          where: eq(organizations.id, input.id),
        });
        
        if (!organization) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }
        
        // Get member count
        const memberCount = await ctx.db.select({ count: count() })
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, input.id));
        
        return {
          ...organization,
          memberCount: memberCount[0]?.count || 0,
          userRole: membership.role,
          userPermissions: membership.permissions,
        };
        
      } catch (error) {
        console.error("Organization fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organization",
        });
      }
    }),

  /**
   * Update organization
   */
  updateOrganization: protectedProcedure
    .input(updateOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify user has admin permissions
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.id),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership || membership.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin permissions required",
          });
        }
        
        // Check for name conflicts if name is being updated
        if (input.name) {
          const existingOrg = await ctx.db.query.organizations.findFirst({
            where: and(
              eq(organizations.name, input.name),
              sql`${organizations.id} != ${input.id}`
            ),
          });
          
          if (existingOrg) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An organization with this name already exists",
            });
          }
        }
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.name !== undefined) updateFields.name = input.name;
        if (input.description !== undefined) updateFields.description = input.description;
        if (input.logo !== undefined) updateFields.logo = input.logo;
        if (input.website !== undefined) updateFields.website = input.website;
        if (input.settings !== undefined) updateFields.settings = input.settings;
        
        // Add updated timestamp
        updateFields.updatedAt = new Date();
        
        // Update the organization
        const updatedOrganization = await ctx.db.update(organizations)
          .set(updateFields)
          .where(eq(organizations.id, input.id))
          .returning();
        
        return updatedOrganization[0];
        
      } catch (error) {
        console.error("Organization update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update organization",
        });
      }
    }),

  /**
   * Delete organization
   */
  deleteOrganization: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify user has admin permissions
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.id),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership || membership.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin permissions required",
          });
        }
        
        // Delete the organization (cascade will handle members)
        await ctx.db.delete(organizations).where(eq(organizations.id, input.id));
        
        return { success: true };
        
      } catch (error) {
        console.error("Organization deletion failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete organization",
        });
      }
    }),

  /**
   * List organization members
   */
  listMembers: protectedProcedure
    .input(listMembersSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const offset = (input.page - 1) * input.limit;
      
      try {
        // Verify user is a member of the organization
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found or access denied",
          });
        }
        
        // Build where conditions
        const whereConditions = [eq(organizationMembers.organizationId, input.organizationId)];
        
        // Search filter
        if (input.search) {
          whereConditions.push(
            sql`(${users.name} ILIKE ${'%' + input.search + '%'} OR ${users.email} ILIKE ${'%' + input.search + '%'})`
          );
        }
        
        // Role filter
        if (input.role) {
          whereConditions.push(eq(organizationMembers.role, input.role));
        }
        
        // Build order by
        const orderBy = input.sortBy === "name" 
          ? input.sortOrder === "asc" ? asc(users.name) : desc(users.name)
          : input.sortBy === "email"
          ? input.sortOrder === "asc" ? asc(users.email) : desc(users.email)
          : input.sortBy === "role"
          ? input.sortOrder === "asc" ? asc(organizationMembers.role) : desc(organizationMembers.role)
          : input.sortOrder === "asc" ? asc(organizationMembers.joinedAt) : desc(organizationMembers.joinedAt);
        
        // Get members
        const membersQuery = ctx.db.select({
          id: organizationMembers.id,
          userId: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: organizationMembers.role,
          permissions: organizationMembers.permissions,
          joinedAt: organizationMembers.joinedAt,
          updatedAt: organizationMembers.updatedAt,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(offset);
        
        // Get total count
        const totalQuery = ctx.db.select({ count: count() })
          .from(organizationMembers)
          .innerJoin(users, eq(organizationMembers.userId, users.id))
          .where(and(...whereConditions));
        
        const [membersResult, totalResult] = await Promise.all([
          membersQuery,
          totalQuery,
        ]);
        
        const total = totalResult[0]?.count ?? 0;
        
        return {
          members: membersResult,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
          },
        };
        
      } catch (error) {
        console.error("Members list failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch members",
        });
      }
    }),

  /**
   * Invite a member to organization
   */
  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify user has admin or team_lead permissions
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership || !["admin", "team_lead"].includes(membership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin or team lead permissions required",
          });
        }
        
        // Check if user exists
        const invitedUser = await ctx.db.query.users.findFirst({
          where: eq(users.email, input.email),
        });
        
        if (!invitedUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found. They need to create an account first.",
          });
        }
        
        // Check if user is already a member
        const existingMembership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, invitedUser.id)
          ),
        });
        
        if (existingMembership) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this organization",
          });
        }
        
        // Add the member
        const newMember = await ctx.db.insert(organizationMembers).values({
          id: crypto.randomUUID(),
          organizationId: input.organizationId,
          userId: invitedUser.id,
          role: input.role,
          permissions: input.permissions || {
            canCreateQR: true,
            canEditQR: true,
            canDeleteQR: false,
            canViewAnalytics: true,
            canManageUsers: false,
            canManageSettings: false,
          },
        }).returning();
        
        return {
          ...newMember[0],
          user: {
            id: invitedUser.id,
            name: invitedUser.name,
            email: invitedUser.email,
            image: invitedUser.image,
          },
        };
        
      } catch (error) {
        console.error("Member invitation failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to invite member",
        });
      }
    }),

  /**
   * Update member role and permissions
   */
  updateMember: protectedProcedure
    .input(updateMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get the member to update
        const memberToUpdate = await ctx.db.query.organizationMembers.findFirst({
          where: eq(organizationMembers.id, input.memberId),
        });
        
        if (!memberToUpdate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        }
        
        // Verify user has admin or team_lead permissions
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, memberToUpdate.organizationId),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership || !["admin", "team_lead"].includes(membership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin or team lead permissions required",
          });
        }
        
        // Prevent demoting the last admin
        if (input.role && input.role !== "admin" && memberToUpdate.role === "admin") {
          const adminCount = await ctx.db.select({ count: count() })
            .from(organizationMembers)
            .where(and(
              eq(organizationMembers.organizationId, memberToUpdate.organizationId),
              eq(organizationMembers.role, "admin")
            ));
          
          if (adminCount[0]?.count === 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot remove the last admin from the organization",
            });
          }
        }
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.role !== undefined) updateFields.role = input.role;
        if (input.permissions !== undefined) updateFields.permissions = input.permissions;
        
        // Add updated timestamp
        updateFields.updatedAt = new Date();
        
        // Update the member
        const updatedMember = await ctx.db.update(organizationMembers)
          .set(updateFields)
          .where(eq(organizationMembers.id, input.memberId))
          .returning();
        
        return updatedMember[0];
        
      } catch (error) {
        console.error("Member update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update member",
        });
      }
    }),

  /**
   * Remove member from organization
   */
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get the member to remove
        const memberToRemove = await ctx.db.query.organizationMembers.findFirst({
          where: eq(organizationMembers.id, input.memberId),
        });
        
        if (!memberToRemove) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        }
        
        // Verify user has admin or team_lead permissions
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, memberToRemove.organizationId),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership || !["admin", "team_lead"].includes(membership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin or team lead permissions required",
          });
        }
        
        // Prevent removing the last admin
        if (memberToRemove.role === "admin") {
          const adminCount = await ctx.db.select({ count: count() })
            .from(organizationMembers)
            .where(and(
              eq(organizationMembers.organizationId, memberToRemove.organizationId),
              eq(organizationMembers.role, "admin")
            ));
          
          if (adminCount[0]?.count === 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot remove the last admin from the organization",
            });
          }
        }
        
        // Remove the member
        await ctx.db.delete(organizationMembers).where(eq(organizationMembers.id, input.memberId));
        
        return { success: true };
        
      } catch (error) {
        console.error("Member removal failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove member",
        });
      }
    }),

  /**
   * Leave organization
   */
  leaveOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get user's membership
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "You are not a member of this organization",
          });
        }
        
        // Prevent the last admin from leaving
        if (membership.role === "admin") {
          const adminCount = await ctx.db.select({ count: count() })
            .from(organizationMembers)
            .where(and(
              eq(organizationMembers.organizationId, input.organizationId),
              eq(organizationMembers.role, "admin")
            ));
          
          if (adminCount[0]?.count === 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot leave organization as the last admin. Transfer admin role first.",
            });
          }
        }
        
        // Remove the membership
        await ctx.db.delete(organizationMembers).where(eq(organizationMembers.id, membership.id));
        
        return { success: true };
        
      } catch (error) {
        console.error("Leave organization failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to leave organization",
        });
      }
    }),

  /**
   * Get organization statistics
   */
  getOrganizationStats: protectedProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify user is a member of the organization
        const membership = await ctx.db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, userId)
          ),
        });
        
        if (!membership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found or access denied",
          });
        }
        
        // Get member count by role
        const membersByRole = await ctx.db.select({
          role: organizationMembers.role,
          count: count(),
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, input.organizationId))
        .groupBy(organizationMembers.role);
        
        // Get total member count
        const totalMembers = await ctx.db.select({ count: count() })
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, input.organizationId));
        
        return {
          totalMembers: totalMembers[0]?.count || 0,
          membersByRole: membersByRole.reduce((acc, item) => {
            acc[item.role] = item.count;
            return acc;
          }, {} as Record<string, number>),
        };
        
      } catch (error) {
        console.error("Organization stats fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organization statistics",
        });
      }
    }),
}); 