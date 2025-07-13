import { eq, and, or, desc, asc, count, sql, gte, lte, like, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  organizations,
  organizationMembers,
  folders,
  templates,
  qrCodes,
  analyticsEvents,
} from "./schema";
import type {
  User,
  Organization,
  OrganizationMember,
  Folder,
  Template,
  QRCode,
  AnalyticsEvent,
  UserRole,
  QRCodeType,
  QRCodeStatus,
  TemplateCategory,
  QRCodeStats,
  OrganizationStats,
  DashboardData,
} from "./types";

// ================================
// USER UTILITIES
// ================================

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserWithOrganizations(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      organizationMembers: {
        with: {
          organization: true,
        },
      },
    },
  });
  return user;
}

export async function updateUserLastLogin(userId: string) {
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

// ================================
// ORGANIZATION UTILITIES
// ================================

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0] || null;
}

export async function getOrganizationWithMembers(organizationId: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });
  return organization;
}

export async function getUserRole(userId: string, organizationId: string): Promise<UserRole | null> {
  const result = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);
  
  return result[0]?.role || null;
}

export async function checkUserPermission(
  userId: string,
  organizationId: string,
  permission: keyof NonNullable<OrganizationMember["permissions"]>
): Promise<boolean> {
  const result = await db
    .select({ 
      role: organizationMembers.role,
      permissions: organizationMembers.permissions 
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!result[0]) return false;

  const { role, permissions } = result[0];

  // Admin has all permissions
  if (role === "admin") return true;

  // Check specific permission
  return permissions?.[permission] === true;
}

// ================================
// FOLDER UTILITIES
// ================================

export async function getFoldersByUser(userId: string): Promise<Folder[]> {
  return await db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(asc(folders.level), asc(folders.sortOrder));
}

export async function getFolderTree(userId: string, organizationId?: string) {
  const whereClause = organizationId
    ? and(eq(folders.userId, userId), eq(folders.organizationId, organizationId))
    : eq(folders.userId, userId);

  const folderData = await db.query.folders.findMany({
    where: whereClause,
    with: {
      children: true,
      qrCodes: {
        orderBy: [desc(qrCodes.createdAt)],
        limit: 5, // Only get recent QR codes for preview
      },
    },
    orderBy: [asc(folders.level), asc(folders.sortOrder)],
  });

  return folderData;
}

export async function createFolder(
  userId: string,
  data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
    organizationId?: string;
  }
) {
  let level = 0;
  let path = data.name;

  if (data.parentId) {
    const parent = await db
      .select({ level: folders.level, path: folders.path })
      .from(folders)
      .where(eq(folders.id, data.parentId))
      .limit(1);

    if (parent[0]) {
      level = parent[0].level + 1;
      path = `${parent[0].path}/${data.name}`;
    }
  }

  const result = await db
    .insert(folders)
    .values({
      ...data,
      userId,
      level,
      path,
    })
    .returning();

  return result[0];
}

// ================================
// TEMPLATE UTILITIES
// ================================

export async function getTemplatesByUser(userId: string): Promise<Template[]> {
  return await db
    .select()
    .from(templates)
    .where(eq(templates.userId, userId))
    .orderBy(desc(templates.usageCount), desc(templates.createdAt));
}

export async function getPublicTemplates(category?: TemplateCategory): Promise<Template[]> {
  const whereClause = category
    ? and(eq(templates.isPublic, true), eq(templates.category, category))
    : eq(templates.isPublic, true);

  return await db
    .select()
    .from(templates)
    .where(whereClause)
    .orderBy(desc(templates.usageCount), desc(templates.createdAt));
}

export async function incrementTemplateUsage(templateId: string) {
  await db
    .update(templates)
    .set({ usageCount: sql`${templates.usageCount} + 1` })
    .where(eq(templates.id, templateId));
}

// ================================
// QR CODE UTILITIES
// ================================

export async function getQRCodesByUser(
  userId: string,
  options: {
    folderId?: string;
    type?: QRCodeType;
    status?: QRCodeStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<QRCode[]> {
  const { folderId, type, status, limit = 50, offset = 0 } = options;

  let whereClause = eq(qrCodes.userId, userId);

  if (folderId) {
    whereClause = and(whereClause, eq(qrCodes.folderId, folderId));
  }

  if (type) {
    whereClause = and(whereClause, eq(qrCodes.type, type));
  }

  if (status) {
    whereClause = and(whereClause, eq(qrCodes.status, status));
  }

  return await db
    .select()
    .from(qrCodes)
    .where(whereClause)
    .orderBy(desc(qrCodes.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getQRCodeWithRelations(qrCodeId: string) {
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, qrCodeId),
    with: {
      user: true,
      organization: true,
      folder: true,
      template: true,
      analyticsEvents: {
        orderBy: [desc(analyticsEvents.timestamp)],
        limit: 100,
      },
    },
  });

  return qrCode;
}

export async function incrementQRCodeScanCount(qrCodeId: string) {
  await db
    .update(qrCodes)
    .set({ 
      scanCount: sql`${qrCodes.scanCount} + 1`,
      lastScannedAt: new Date()
    })
    .where(eq(qrCodes.id, qrCodeId));
}

export async function searchQRCodes(
  userId: string,
  query: string,
  options: {
    organizationId?: string;
    type?: QRCodeType;
    limit?: number;
  } = {}
) {
  const { organizationId, type, limit = 20 } = options;

  let whereClause = and(
    eq(qrCodes.userId, userId),
    or(
      like(qrCodes.name, `%${query}%`),
      like(qrCodes.description, `%${query}%`)
    )
  );

  if (organizationId) {
    whereClause = and(whereClause, eq(qrCodes.organizationId, organizationId));
  }

  if (type) {
    whereClause = and(whereClause, eq(qrCodes.type, type));
  }

  return await db
    .select()
    .from(qrCodes)
    .where(whereClause)
    .orderBy(desc(qrCodes.scanCount), desc(qrCodes.createdAt))
    .limit(limit);
}

// ================================
// ANALYTICS UTILITIES
// ================================

export async function recordAnalyticsEvent(
  qrCodeId: string,
  eventType: AnalyticsEvent["eventType"],
  data: AnalyticsEvent["data"],
  userId?: string
) {
  await db.insert(analyticsEvents).values({
    qrCodeId,
    eventType,
    data,
    userId,
    sessionId: crypto.randomUUID(), // Generate session ID
  });
}

export async function getQRCodeStats(qrCodeId: string, days: number = 30): Promise<QRCodeStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get total scans
  const totalScansResult = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.qrCodeId, qrCodeId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, startDate)
      )
    );

  // Get unique scans (by session)
  const uniqueScansResult = await db
    .selectDistinct({ sessionId: analyticsEvents.sessionId })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.qrCodeId, qrCodeId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, startDate)
      )
    );

  // Get scans by date
  const scansByDate = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`,
      scans: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.qrCodeId, qrCodeId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, startDate)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

  // Get scans by country
  const scansByCountry = await db
    .select({
      country: sql<string>`${analyticsEvents.data}->>'location'->>'country'`,
      scans: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.qrCodeId, qrCodeId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, startDate),
        sql`${analyticsEvents.data}->>'location'->>'country' IS NOT NULL`
      )
    )
    .groupBy(sql`${analyticsEvents.data}->>'location'->>'country'`)
    .orderBy(desc(count()))
    .limit(10);

  // Get scans by device
  const scansByDevice = await db
    .select({
      device: sql<string>`${analyticsEvents.data}->>'device'->>'type'`,
      scans: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.qrCodeId, qrCodeId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, startDate),
        sql`${analyticsEvents.data}->>'device'->>'type' IS NOT NULL`
      )
    )
    .groupBy(sql`${analyticsEvents.data}->>'device'->>'type'`)
    .orderBy(desc(count()));

  return {
    totalScans: totalScansResult[0]?.count || 0,
    uniqueScans: uniqueScansResult.length,
    scansByDate: scansByDate.map(row => ({
      date: row.date,
      scans: row.scans,
    })),
    scansByCountry: scansByCountry.map(row => ({
      country: row.country || "Unknown",
      scans: row.scans,
    })),
    scansByDevice: scansByDevice.map(row => ({
      device: row.device || "Unknown",
      scans: row.scans,
    })),
  };
}

export async function getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
  // Get total QR codes
  const totalQRCodesResult = await db
    .select({ count: count() })
    .from(qrCodes)
    .where(eq(qrCodes.organizationId, organizationId));

  // Get total scans
  const totalScansResult = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .innerJoin(qrCodes, eq(analyticsEvents.qrCodeId, qrCodes.id))
    .where(
      and(
        eq(qrCodes.organizationId, organizationId),
        eq(analyticsEvents.eventType, "scan")
      )
    );

  // Get active users (users who have scanned in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsersResult = await db
    .selectDistinct({ userId: analyticsEvents.userId })
    .from(analyticsEvents)
    .innerJoin(qrCodes, eq(analyticsEvents.qrCodeId, qrCodes.id))
    .where(
      and(
        eq(qrCodes.organizationId, organizationId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, thirtyDaysAgo),
        sql`${analyticsEvents.userId} IS NOT NULL`
      )
    );

  // Get popular templates
  const popularTemplatesResult = await db
    .select({
      template: templates,
      usageCount: count(),
    })
    .from(templates)
    .innerJoin(qrCodes, eq(templates.id, qrCodes.templateId))
    .where(eq(templates.organizationId, organizationId))
    .groupBy(templates.id)
    .orderBy(desc(count()))
    .limit(5);

  return {
    totalQRCodes: totalQRCodesResult[0]?.count || 0,
    totalScans: totalScansResult[0]?.count || 0,
    activeUsers: activeUsersResult.length,
    popularTemplates: popularTemplatesResult.map(row => ({
      template: row.template,
      usageCount: row.usageCount,
    })),
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Get user with organization
  const userWithOrg = await getUserWithOrganizations(userId);
  if (!userWithOrg) {
    throw new Error("User not found");
  }

  const organization = userWithOrg.organizationMembers[0]?.organization;

  // Get recent QR codes
  const recentQRCodes = await getQRCodesByUser(userId, { limit: 10 });

  // Get total scans for user's QR codes
  const totalScansResult = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .innerJoin(qrCodes, eq(analyticsEvents.qrCodeId, qrCodes.id))
    .where(
      and(
        eq(qrCodes.userId, userId),
        eq(analyticsEvents.eventType, "scan")
      )
    );

  // Get total QR codes count
  const totalQRCodesResult = await db
    .select({ count: count() })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId));

  // Get scan trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const scanTrends = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`,
      scans: count(),
    })
    .from(analyticsEvents)
    .innerJoin(qrCodes, eq(analyticsEvents.qrCodeId, qrCodes.id))
    .where(
      and(
        eq(qrCodes.userId, userId),
        eq(analyticsEvents.eventType, "scan"),
        gte(analyticsEvents.timestamp, thirtyDaysAgo)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

  return {
    user: userWithOrg,
    organization,
    recentQRCodes,
    totalScans: totalScansResult[0]?.count || 0,
    totalQRCodes: totalQRCodesResult[0]?.count || 0,
    scanTrends: scanTrends.map(row => ({
      date: row.date,
      scans: row.scans,
    })),
  };
}

// ================================
// BATCH OPERATIONS
// ================================

export async function bulkUpdateQRCodeStatus(
  qrCodeIds: string[],
  status: QRCodeStatus,
  userId: string
) {
  await db
    .update(qrCodes)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        inArray(qrCodes.id, qrCodeIds),
        eq(qrCodes.userId, userId)
      )
    );
}

export async function bulkMoveQRCodes(
  qrCodeIds: string[],
  folderId: string | null,
  userId: string
) {
  await db
    .update(qrCodes)
    .set({ folderId, updatedAt: new Date() })
    .where(
      and(
        inArray(qrCodes.id, qrCodeIds),
        eq(qrCodes.userId, userId)
      )
    );
}

export async function bulkDeleteQRCodes(qrCodeIds: string[], userId: string) {
  await db
    .delete(qrCodes)
    .where(
      and(
        inArray(qrCodes.id, qrCodeIds),
        eq(qrCodes.userId, userId)
      )
    );
}

// ================================
// CLEANUP UTILITIES
// ================================

export async function cleanupExpiredQRCodes() {
  const now = new Date();
  
  // Update status to expired for QR codes past their expiration date
  await db
    .update(qrCodes)
    .set({ status: "expired" })
    .where(
      and(
        lte(qrCodes.expiresAt, now),
        eq(qrCodes.status, "active")
      )
    );
}

export async function cleanupOldAnalyticsEvents(daysToKeep: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  await db
    .delete(analyticsEvents)
    .where(lte(analyticsEvents.timestamp, cutoffDate));
}

// ================================
// EXPORT UTILITIES
// ================================

export async function exportUserData(userId: string) {
  const userData = await getUserWithOrganizations(userId);
  const userQRCodes = await getQRCodesByUser(userId, { limit: 1000 });
  const userFolders = await getFoldersByUser(userId);
  const userTemplates = await getTemplatesByUser(userId);

  return {
    user: userData,
    qrCodes: userQRCodes,
    folders: userFolders,
    templates: userTemplates,
  };
} 