import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure 
} from "@/server/api/trpc";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ================================
// INPUT VALIDATION SCHEMAS
// ================================

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  image: z.string().url("Invalid image URL").optional(),
});

const updatePreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    marketing: z.boolean().optional(),
    security: z.boolean().optional(),
    scanAlerts: z.boolean().optional(),
    weeklyReports: z.boolean().optional(),
    monthlyReports: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    analytics: z.boolean().optional(),
    publicProfile: z.boolean().optional(),
    dataSharing: z.boolean().optional(),
    trackingConsent: z.boolean().optional(),
  }).optional(),
  appearance: z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
    timeFormat: z.enum(["12h", "24h"]).optional(),
  }).optional(),
  qrDefaults: z.object({
    defaultSize: z.number().min(64).max(2048).optional(),
    defaultFormat: z.enum(["png", "svg", "jpeg", "pdf"]).optional(),
    defaultErrorCorrection: z.enum(["L", "M", "Q", "H"]).optional(),
    defaultStyle: z.object({
      foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").optional(),
      cornerStyle: z.enum(["square", "rounded", "circle"]).optional(),
      patternStyle: z.enum(["square", "rounded", "circle"]).optional(),
    }).optional(),
  }).optional(),
  dashboard: z.object({
    defaultView: z.enum(["grid", "list", "table"]).optional(),
    itemsPerPage: z.number().min(10).max(100).optional(),
    showPreview: z.boolean().optional(),
    autoRefresh: z.boolean().optional(),
    refreshInterval: z.number().min(30).max(300).optional(), // seconds
  }).optional(),
});

const updateSecuritySchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().min(15).max(1440).optional(), // minutes
  loginNotifications: z.boolean().optional(),
  apiAccess: z.boolean().optional(),
  dataRetention: z.number().min(30).max(2555).optional(), // days
});

const updateIntegrationsSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean().optional(),
    trackingId: z.string().optional(),
    customDimensions: z.record(z.string()).optional(),
  }).optional(),
  zapier: z.object({
    enabled: z.boolean().optional(),
    webhookUrl: z.string().url().optional(),
    events: z.array(z.enum(["scan", "create", "update", "delete"])).optional(),
  }).optional(),
  slack: z.object({
    enabled: z.boolean().optional(),
    webhookUrl: z.string().url().optional(),
    channels: z.array(z.string()).optional(),
  }).optional(),
  customWebhooks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    events: z.array(z.enum(["scan", "create", "update", "delete"])),
    headers: z.record(z.string()).optional(),
    isActive: z.boolean().default(true),
  })).optional(),
});

const exportDataSchema = z.object({
  format: z.enum(["json", "csv", "xml"]),
  includeQRCodes: z.boolean().default(true),
  includeAnalytics: z.boolean().default(true),
  includeTemplates: z.boolean().default(true),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
});

// ================================
// SETTINGS ROUTER
// ================================

export const settingsRouter = createTRPCRouter({
  // Get security settings
  getSecurity: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        twoFactorEnabled: false, // TODO: Implement 2FA
        sessionTimeout: 30,
        loginNotifications: true,
        apiAccess: false,
        dataRetention: 90,
      };
    }),

  // Update security settings
  updateSecurity: protectedProcedure
    .input(updateSecuritySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // TODO: Implement security settings update logic
      console.log("Security settings update for user:", userId, input);
      
      return {
        success: true,
        message: "Security settings updated successfully",
      };
    }),
  /**
   * Get user profile
   */
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        return user;
        
      } catch (error) {
        console.error("Profile fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch profile",
        });
      }
    }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Check if email is being changed and if it's already taken
        if (input.email) {
          const existingUser = await ctx.db.query.users.findFirst({
            where: eq(users.email, input.email),
          });
          
          if (existingUser && existingUser.id !== userId) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email address is already in use",
            });
          }
        }
        
        // Prepare update fields
        const updateFields: any = {};
        if (input.name !== undefined) updateFields.name = input.name;
        if (input.email !== undefined) updateFields.email = input.email;
        if (input.image !== undefined) updateFields.image = input.image;
        
        // Add updated timestamp
        updateFields.updatedAt = new Date();
        
        // Update the user
        const updatedUser = await ctx.db.update(users)
          .set(updateFields)
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            updatedAt: users.updatedAt,
          });
        
        return updatedUser[0];
        
      } catch (error) {
        console.error("Profile update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            preferences: true,
          },
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Return preferences with defaults
        return {
          notifications: {
            email: true,
            push: false,
            marketing: true,
            security: true,
            scanAlerts: true,
            weeklyReports: true,
            monthlyReports: false,
            ...user.preferences?.notifications,
          },
          privacy: {
            analytics: true,
            publicProfile: false,
            dataSharing: false,
            trackingConsent: true,
            ...user.preferences?.privacy,
          },
          appearance: {
            theme: "system",
            language: "en",
            timezone: "UTC",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h",
            ...user.preferences?.appearance,
          },
          qrDefaults: {
            defaultSize: 512,
            defaultFormat: "png",
            defaultErrorCorrection: "M",
            defaultStyle: {
              foregroundColor: "#000000",
              backgroundColor: "#ffffff",
              cornerStyle: "square",
              patternStyle: "square",
            },
            ...user.preferences?.qrDefaults,
          },
          dashboard: {
            defaultView: "grid",
            itemsPerPage: 20,
            showPreview: true,
            autoRefresh: false,
            refreshInterval: 60,
            ...user.preferences?.dashboard,
          },
        };
        
      } catch (error) {
        console.error("Preferences fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch preferences",
        });
      }
    }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get current preferences
        const currentUser = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { preferences: true },
        });
        
        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Merge with existing preferences
        const updatedPreferences = {
          ...currentUser.preferences,
          ...input,
          notifications: {
            ...currentUser.preferences?.notifications,
            ...input.notifications,
          },
          privacy: {
            ...currentUser.preferences?.privacy,
            ...input.privacy,
          },
          appearance: {
            ...currentUser.preferences?.appearance,
            ...input.appearance,
          },
          qrDefaults: {
            ...currentUser.preferences?.qrDefaults,
            ...input.qrDefaults,
          },
          dashboard: {
            ...currentUser.preferences?.dashboard,
            ...input.dashboard,
          },
        };
        
        // Update the user preferences
        const updatedUser = await ctx.db.update(users)
          .set({
            preferences: updatedPreferences,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            preferences: users.preferences,
          });
        
        return updatedUser[0]?.preferences;
        
      } catch (error) {
        console.error("Preferences update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update preferences",
        });
      }
    }),

  /**
   * Get security settings
   */
  getSecuritySettings: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            securitySettings: true,
          },
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Return security settings with defaults
        return {
          twoFactorEnabled: false,
          sessionTimeout: 60, // minutes
          loginNotifications: true,
          apiAccess: false,
          dataRetention: 365, // days
          ...user.securitySettings,
        };
        
      } catch (error) {
        console.error("Security settings fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch security settings",
        });
      }
    }),

  /**
   * Update security settings
   */
  updateSecuritySettings: protectedProcedure
    .input(updateSecuritySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get current security settings
        const currentUser = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { securitySettings: true },
        });
        
        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Merge with existing settings
        const updatedSecuritySettings = {
          ...currentUser.securitySettings,
          ...input,
        };
        
        // Update the user security settings
        const updatedUser = await ctx.db.update(users)
          .set({
            securitySettings: updatedSecuritySettings,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            securitySettings: users.securitySettings,
          });
        
        return updatedUser[0]?.securitySettings;
        
      } catch (error) {
        console.error("Security settings update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update security settings",
        });
      }
    }),

  /**
   * Get integration settings
   */
  getIntegrations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            integrations: true,
          },
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Return integrations with defaults
        return {
          googleAnalytics: {
            enabled: false,
            trackingId: "",
            customDimensions: {},
          },
          zapier: {
            enabled: false,
            webhookUrl: "",
            events: [],
          },
          slack: {
            enabled: false,
            webhookUrl: "",
            channels: [],
          },
          customWebhooks: [],
          ...user.integrations,
        };
        
      } catch (error) {
        console.error("Integrations fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch integrations",
        });
      }
    }),

  /**
   * Update integration settings
   */
  updateIntegrations: protectedProcedure
    .input(updateIntegrationsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get current integrations
        const currentUser = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { integrations: true },
        });
        
        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Merge with existing integrations
        const updatedIntegrations = {
          ...currentUser.integrations,
          ...input,
          googleAnalytics: {
            ...currentUser.integrations?.googleAnalytics,
            ...input.googleAnalytics,
          },
          zapier: {
            ...currentUser.integrations?.zapier,
            ...input.zapier,
          },
          slack: {
            ...currentUser.integrations?.slack,
            ...input.slack,
          },
          customWebhooks: input.customWebhooks || currentUser.integrations?.customWebhooks || [],
        };
        
        // Update the user integrations
        const updatedUser = await ctx.db.update(users)
          .set({
            integrations: updatedIntegrations,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            integrations: users.integrations,
          });
        
        return updatedUser[0]?.integrations;
        
      } catch (error) {
        console.error("Integrations update failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update integrations",
        });
      }
    }),

  /**
   * Get account statistics
   */
  getAccountStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get user account creation date
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            createdAt: true,
          },
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        // Calculate account age
        const accountAge = Math.floor(
          (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Get QR codes count
        const qrCodesCount = await ctx.db.query.qrCodes.count({
          where: eq(users.id, userId),
        });
        
        // Get templates count
        const templatesCount = await ctx.db.query.templates.count({
          where: eq(users.id, userId),
        });
        
        // Get folders count
        const foldersCount = await ctx.db.query.folders.count({
          where: eq(users.id, userId),
        });
        
        return {
          accountAge,
          qrCodesCount,
          templatesCount,
          foldersCount,
          memberSince: user.createdAt,
        };
        
      } catch (error) {
        console.error("Account stats fetch failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch account statistics",
        });
      }
    }),

  /**
   * Export user data
   */
  exportData: protectedProcedure
    .input(exportDataSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        const exportData: any = {
          user: {},
          qrCodes: [],
          analytics: [],
          templates: [],
          exportedAt: new Date().toISOString(),
          format: input.format,
        };
        
        // Get user profile
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            preferences: true,
            securitySettings: true,
            integrations: true,
          },
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        exportData.user = user;
        
        // Get QR codes if requested
        if (input.includeQRCodes) {
          exportData.qrCodes = await ctx.db.query.qrCodes.findMany({
            where: eq(users.id, userId),
          });
        }
        
        // Get analytics if requested
        if (input.includeAnalytics) {
          const userQRCodes = await ctx.db.query.qrCodes.findMany({
            where: eq(users.id, userId),
            columns: { id: true },
          });
          
          const qrCodeIds = userQRCodes.map(qr => qr.id);
          
          if (qrCodeIds.length > 0) {
            let analyticsQuery = ctx.db.query.analyticsEvents.findMany({
              where: sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
            });
            
            // Apply date range filter if provided
            if (input.dateRange) {
              analyticsQuery = ctx.db.query.analyticsEvents.findMany({
                where: and(
                  sql`${analyticsEvents.qrCodeId} = ANY(${qrCodeIds})`,
                  between(analyticsEvents.timestamp, input.dateRange.startDate, input.dateRange.endDate)
                ),
              });
            }
            
            exportData.analytics = await analyticsQuery;
          }
        }
        
        // Get templates if requested
        if (input.includeTemplates) {
          exportData.templates = await ctx.db.query.templates.findMany({
            where: eq(users.id, userId),
          });
        }
        
        return exportData;
        
      } catch (error) {
        console.error("Data export failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export data",
        });
      }
    }),

  /**
   * Delete user account
   */
  deleteAccount: protectedProcedure
    .input(z.object({
      confirmation: z.literal("DELETE_MY_ACCOUNT"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // This is a destructive operation, so we require explicit confirmation
        if (input.confirmation !== "DELETE_MY_ACCOUNT") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid confirmation",
          });
        }
        
        // Delete user account (cascade will handle related data)
        await ctx.db.delete(users).where(eq(users.id, userId));
        
        return { success: true };
        
      } catch (error) {
        console.error("Account deletion failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete account",
        });
      }
    }),
}); 