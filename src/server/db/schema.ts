import { relations, sql } from "drizzle-orm";
import { 
  index, 
  pgTableCreator, 
  primaryKey, 
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  decimal,
  pgEnum
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `mojoqr_${name}`);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "team_lead", "member", "viewer"]);
export const qrCodeTypeEnum = pgEnum("qr_code_type", [
  "url", "vcard"
]);
export const qrCodeStatusEnum = pgEnum("qr_code_status", ["active", "inactive", "expired", "archived"]);
export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "scan", "view", "click", "download", "share", "error"
]);
export const templateCategoryEnum = pgEnum("template_category", [
  "business", "personal", "event", "marketing", "restaurant", "retail", "education", "healthcare"
]);

// ================================
// ORGANIZATIONS & TEAMS
// ================================

export const organizations = createTable(
  "organization",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    logo: d.varchar({ length: 500 }),
    website: d.varchar({ length: 500 }),
    settings: d.jsonb().$type<{
      branding?: {
        primaryColor?: string;
        secondaryColor?: string;
        logo?: string;
      };
      limits?: {
        maxQRCodes?: number;
        maxUsers?: number;
        maxTemplates?: number;
      };
      features?: {
        analytics?: boolean;
        customDomains?: boolean;
        apiAccess?: boolean;
      };
    }>(),
    isActive: d.boolean().default(true).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("organization_name_idx").on(t.name),
    index("organization_active_idx").on(t.isActive),
  ]
);

export const organizationMembers = createTable(
  "organization_member",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: d.varchar({ length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: d.varchar({ length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum().default("member").notNull(),
    permissions: d.jsonb().$type<{
      canCreateQR?: boolean;
      canEditQR?: boolean;
      canDeleteQR?: boolean;
      canViewAnalytics?: boolean;
      canManageUsers?: boolean;
      canManageSettings?: boolean;
    }>(),
    joinedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("org_member_org_idx").on(t.organizationId),
    index("org_member_user_idx").on(t.userId),
    index("org_member_role_idx").on(t.role),
  ]
);

// ================================
// USERS (Extended)
// ================================

export const users = createTable(
  "user",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }),
    email: d.varchar({ length: 255 }).notNull(),
    emailVerified: d.timestamp({ mode: "date", withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
    image: d.varchar({ length: 255 }),
    // Extended profile fields
    firstName: d.varchar({ length: 255 }),
    lastName: d.varchar({ length: 255 }),
    company: d.varchar({ length: 255 }),
    jobTitle: d.varchar({ length: 255 }),
    phone: d.varchar({ length: 50 }),
    timezone: d.varchar({ length: 50 }).default("UTC"),
    language: d.varchar({ length: 10 }).default("en"),
    // Settings
    settings: d.jsonb().$type<{
      notifications?: {
        email?: boolean;
        push?: boolean;
        scanAlerts?: boolean;
        weeklyReports?: boolean;
      };
      preferences?: {
        defaultQRSize?: number;
        defaultErrorCorrection?: string;
        defaultFormat?: string;
      };
      privacy?: {
        profileVisible?: boolean;
        analyticsOptIn?: boolean;
      };
    }>(),
    // Subscription info
    plan: d.varchar({ length: 50 }).default("free"),
    planExpiresAt: d.timestamp({ withTimezone: true }),
    // Metadata
    lastLoginAt: d.timestamp({ withTimezone: true }),
    isActive: d.boolean().default(true).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("user_email_idx").on(t.email),
    index("user_active_idx").on(t.isActive),
    index("user_plan_idx").on(t.plan),
  ]
);

// ================================
// FOLDERS & CATEGORIES
// ================================

export const folders = createTable(
  "folder",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    color: d.varchar({ length: 7 }), // Hex color code
    icon: d.varchar({ length: 50 }),
    parentId: d.varchar({ length: 255 }).references(() => folders.id, { onDelete: "cascade" }),
    userId: d.varchar({ length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: d.varchar({ length: 255 }).references(() => organizations.id, { onDelete: "cascade" }),
    // Hierarchy and ordering
    path: d.varchar({ length: 1000 }), // Materialized path for efficient queries
    level: d.integer().default(0).notNull(),
    sortOrder: d.integer().default(0).notNull(),
    // Metadata
    isSystem: d.boolean().default(false).notNull(), // For default folders like "Uncategorized"
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("folder_user_idx").on(t.userId),
    index("folder_org_idx").on(t.organizationId),
    index("folder_parent_idx").on(t.parentId),
    index("folder_path_idx").on(t.path),
    index("folder_level_idx").on(t.level),
  ]
);

// ================================
// TEMPLATES
// ================================

export const templates = createTable(
  "template",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    category: templateCategoryEnum().notNull(),
    qrCodeType: qrCodeTypeEnum().notNull(),
    // Template configuration
    config: d.jsonb().$type<{
      // Visual customization
      style?: {
        foregroundColor?: string;
        backgroundColor?: string;
        cornerStyle?: string;
        patternStyle?: string;
        logoUrl?: string;
        logoSize?: number;
        logoPosition?: string;
      };
      // Size and format
      size?: number;
      format?: string;
      errorCorrection?: string;
      // Content template with variables
      contentTemplate?: Record<string, any>;
      variables?: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        defaultValue?: string;
        options?: string[];
      }>;
    }>(),
    // Template metadata
    isPublic: d.boolean().default(false).notNull(),
    isSystem: d.boolean().default(false).notNull(), // For built-in templates
    tags: d.jsonb().$type<string[]>(),
    // Usage stats
    usageCount: d.integer().default(0).notNull(),
    // Ownership
    userId: d.varchar({ length: 255 }).references(() => users.id, { onDelete: "cascade" }),
    organizationId: d.varchar({ length: 255 }).references(() => organizations.id, { onDelete: "cascade" }),
    // Timestamps
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("template_category_idx").on(t.category),
    index("template_type_idx").on(t.qrCodeType),
    index("template_user_idx").on(t.userId),
    index("template_org_idx").on(t.organizationId),
    index("template_public_idx").on(t.isPublic),
    index("template_usage_idx").on(t.usageCount),
  ]
);

// ================================
// QR CODES
// ================================

export const qrCodes = createTable(
  "qr_code",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    type: qrCodeTypeEnum().notNull(),
    status: qrCodeStatusEnum().default("active").notNull(),
    // QR Code content
    isDynamic: d.boolean().default(false).notNull(),
    staticContent: d.text(), // For static QR codes
    dynamicUrl: d.varchar({ length: 500 }), // Short URL for dynamic QR codes
    originalUrl: d.varchar({ length: 2000 }), // Original URL for dynamic QR codes
    // QR Code data - URL and vCard types supported
    data: d.jsonb().$type<{
      // URL type
      url?: string;
      // vCard type - comprehensive business card data
      vcard?: {
        // Basic information
        firstName: string;
        lastName: string;
        middleName?: string;
        nickname?: string;
        title?: string;
        organization?: string;
        department?: string;
        
        // Contact information
        email?: string;
        phone?: string;
        website?: string;
        
        // Address
        address?: string;
        addressComponents?: {
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
        
        // Profile
        profileImage?: string;
        bio?: string;
        birthday?: string;
        anniversary?: string;
        note?: string;
        
        // Social media and professional links
        socialLinks?: Array<{
          id: string;
          platform: string;
          label: string;
          url: string;
          icon?: string;
          order: number;
        }>;
        
        // Custom fields
        customFields?: Array<{
          id: string;
          label: string;
          value: string;
          type: "text" | "email" | "phone" | "url";
          order: number;
        }>;
        
        // Additional professional info
        assistant?: string;
        assistantPhone?: string;
        companyLogo?: string;
      };
    }>(),
    // Visual customization
    style: d.jsonb().$type<{
      foregroundColor?: string;
      backgroundColor?: string;
      cornerStyle?: string;
      patternStyle?: string;
      logoUrl?: string;
      logoSize?: number;
      logoPosition?: string;
    }>(),
    // QR Code properties
    size: d.integer().default(512).notNull(),
    format: d.varchar({ length: 10 }).default("png").notNull(),
    errorCorrection: d.varchar({ length: 1 }).default("M").notNull(),
    // File storage
    imageUrl: d.varchar({ length: 500 }),
    imageSize: d.integer(), // File size in bytes
    // Organization
    folderId: d.varchar({ length: 255 }).references(() => folders.id, { onDelete: "set null" }),
    templateId: d.varchar({ length: 255 }).references(() => templates.id, { onDelete: "set null" }),
    tags: d.jsonb().$type<string[]>(),
    // Ownership
    userId: d.varchar({ length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: d.varchar({ length: 255 }).references(() => organizations.id, { onDelete: "cascade" }),
    // Scheduling
    expiresAt: d.timestamp({ withTimezone: true }),
    // Stats (denormalized for performance)
    scanCount: d.integer().default(0).notNull(),
    lastScannedAt: d.timestamp({ withTimezone: true }),
    // Timestamps
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("qr_code_user_idx").on(t.userId),
    index("qr_code_org_idx").on(t.organizationId),
    index("qr_code_folder_idx").on(t.folderId),
    index("qr_code_template_idx").on(t.templateId),
    index("qr_code_type_idx").on(t.type),
    index("qr_code_status_idx").on(t.status),
    index("qr_code_dynamic_idx").on(t.isDynamic),
    index("qr_code_dynamic_url_idx").on(t.dynamicUrl),
    index("qr_code_expires_idx").on(t.expiresAt),
    index("qr_code_scan_count_idx").on(t.scanCount),
    index("qr_code_created_idx").on(t.createdAt),
  ]
);

// ================================
// REDIRECTS (for dynamic URL tracking)
// ================================

export const redirects = createTable(
  "redirect",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    originalUrl: d.text().notNull(),
    shortCode: d.varchar({ length: 255 }).notNull().unique(),
    clickCount: d.integer().default(0).notNull(),
    userId: d.varchar({ length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    qrCodeId: d.varchar({ length: 255 }).notNull().references(() => qrCodes.id, { onDelete: "cascade" }),
    // Tracking data
    lastAccessedAt: d.timestamp({ withTimezone: true }),
    // Metadata
    isActive: d.boolean().default(true).notNull(),
    expiresAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("redirect_short_code_idx").on(t.shortCode),
    index("redirect_qr_code_idx").on(t.qrCodeId),
    index("redirect_user_idx").on(t.userId),
    index("redirect_active_idx").on(t.isActive),
    index("redirect_expires_idx").on(t.expiresAt),
    index("redirect_click_count_idx").on(t.clickCount),
  ]
);

// ================================
// ANALYTICS EVENTS
// ================================

export const analyticsEvents = createTable(
  "analytics_event",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    qrCodeId: d.varchar({ length: 255 }).notNull().references(() => qrCodes.id, { onDelete: "cascade" }),
    eventType: analyticsEventTypeEnum().notNull(),
    // Event data
    data: d.jsonb().$type<{
      // Device information
      userAgent?: string;
      device?: {
        type: string; // mobile, tablet, desktop
        os: string;
        browser: string;
        version: string;
        model?: string;
        vendor?: string;
      };
      // Location information (IP-based geolocation)
      location?: {
        country?: string;
        countryCode?: string;
        region?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
        timezone?: string;
        postalCode?: string;
        isp?: string;
      };
      // Network information
      ip?: string;
      ipVersion?: string; // IPv4 or IPv6
      isp?: string;
      // Referrer information
      referrer?: string;
      referrerDomain?: string;
      utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
      };
      // Tracking specific data
      clickData?: {
        timestamp: string;
        sessionId: string;
        isUniqueVisitor: boolean;
        isReturn: boolean;
        timeOnPage?: number;
      };
      // Custom event data
      customData?: Record<string, any>;
    }>(),
    // Session information
    sessionId: d.varchar({ length: 255 }),
    userId: d.varchar({ length: 255 }).references(() => users.id, { onDelete: "set null" }),
    // Timestamps
    timestamp: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    // Partitioning helper (for time-series optimization)
    datePartition: d.varchar({ length: 10 }).notNull().$defaultFn(() => new Date().toISOString().slice(0, 10)),
  }),
  (t) => [
    index("analytics_qr_code_idx").on(t.qrCodeId),
    index("analytics_event_type_idx").on(t.eventType),
    index("analytics_timestamp_idx").on(t.timestamp),
    index("analytics_date_partition_idx").on(t.datePartition),
    index("analytics_session_idx").on(t.sessionId),
    index("analytics_user_idx").on(t.userId),
    // Composite indexes for common queries
    index("analytics_qr_timestamp_idx").on(t.qrCodeId, t.timestamp),
    index("analytics_qr_type_idx").on(t.qrCodeId, t.eventType),
  ]
);

// ================================
// LEGACY TABLES (NextAuth)
// ================================

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d.varchar({ length: 255 }).notNull().references(() => users.id),
    createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ]
);

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d.varchar({ length: 255 }).notNull().references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ]
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d.varchar({ length: 255 }).notNull().references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)]
);

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ================================
// RELATIONS
// ================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  posts: many(posts),
  qrCodes: many(qrCodes),
  folders: many(folders),
  templates: many(templates),
  organizationMembers: many(organizationMembers),
  analyticsEvents: many(analyticsEvents),
  redirects: many(redirects),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  qrCodes: many(qrCodes),
  folders: many(folders),
  templates: many(templates),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, { 
    fields: [organizationMembers.organizationId], 
    references: [organizations.id] 
  }),
  user: one(users, { 
    fields: [organizationMembers.userId], 
    references: [users.id] 
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, { 
    fields: [folders.parentId], 
    references: [folders.id] 
  }),
  children: many(folders),
  user: one(users, { 
    fields: [folders.userId], 
    references: [users.id] 
  }),
  organization: one(organizations, { 
    fields: [folders.organizationId], 
    references: [organizations.id] 
  }),
  qrCodes: many(qrCodes),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  user: one(users, { 
    fields: [templates.userId], 
    references: [users.id] 
  }),
  organization: one(organizations, { 
    fields: [templates.organizationId], 
    references: [organizations.id] 
  }),
  qrCodes: many(qrCodes),
}));

export const qrCodesRelations = relations(qrCodes, ({ one, many }) => ({
  user: one(users, { 
    fields: [qrCodes.userId], 
    references: [users.id] 
  }),
  organization: one(organizations, { 
    fields: [qrCodes.organizationId], 
    references: [organizations.id] 
  }),
  folder: one(folders, { 
    fields: [qrCodes.folderId], 
    references: [folders.id] 
  }),
  template: one(templates, { 
    fields: [qrCodes.templateId], 
    references: [templates.id] 
  }),
  analyticsEvents: many(analyticsEvents),
  redirects: many(redirects),
}));

export const redirectsRelations = relations(redirects, ({ one }) => ({
  user: one(users, { 
    fields: [redirects.userId], 
    references: [users.id] 
  }),
  qrCode: one(qrCodes, { 
    fields: [redirects.qrCodeId], 
    references: [qrCodes.id] 
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  qrCode: one(qrCodes, { 
    fields: [analyticsEvents.qrCodeId], 
    references: [qrCodes.id] 
  }),
  user: one(users, { 
    fields: [analyticsEvents.userId], 
    references: [users.id] 
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  createdBy: one(users, { fields: [posts.createdById], references: [users.id] }),
}));
