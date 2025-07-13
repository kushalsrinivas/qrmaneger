import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  organizations,
  organizationMembers,
  folders,
  templates,
  qrCodes,
  analyticsEvents,
  accounts,
  sessions,
  posts,
  verificationTokens,
} from "./schema";

// ================================
// TYPE DEFINITIONS
// ================================

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserRole = "admin" | "team_lead" | "member" | "viewer";

// Organization types
export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;
export type OrganizationMember = InferSelectModel<typeof organizationMembers>;
export type NewOrganizationMember = InferInsertModel<typeof organizationMembers>;

// Folder types
export type Folder = InferSelectModel<typeof folders>;
export type NewFolder = InferInsertModel<typeof folders>;

// Template types
export type Template = InferSelectModel<typeof templates>;
export type NewTemplate = InferInsertModel<typeof templates>;
export type TemplateCategory = "business" | "personal" | "event" | "marketing" | "restaurant" | "retail" | "education" | "healthcare";

// QR Code types
export type QRCode = InferSelectModel<typeof qrCodes>;
export type NewQRCode = InferInsertModel<typeof qrCodes>;
export type QRCodeType = "url" | "vcard" | "wifi" | "text" | "sms" | "email" | "phone" | "location" | "event" | "app_download" | "multi_url" | "menu" | "payment" | "pdf" | "image" | "video";
export type QRCodeStatus = "active" | "inactive" | "expired" | "archived";

// Analytics types
export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;
export type AnalyticsEventType = "scan" | "view" | "click" | "download" | "share" | "error";

// NextAuth types
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;

// ================================
// STRUCTURED DATA TYPES
// ================================

// User Settings
export interface UserSettings {
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
}

// Organization Settings
export interface OrganizationSettings {
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
}

// Organization Member Permissions
export interface OrganizationMemberPermissions {
  canCreateQR?: boolean;
  canEditQR?: boolean;
  canDeleteQR?: boolean;
  canViewAnalytics?: boolean;
  canManageUsers?: boolean;
  canManageSettings?: boolean;
}

// QR Code Data Types
export interface QRCodeData {
  // URL type
  url?: string;
  
  // vCard type
  vcard?: {
    firstName?: string;
    lastName?: string;
    organization?: string;
    title?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  
  // WiFi type
  wifi?: {
    ssid: string;
    password: string;
    security: string;
    hidden?: boolean;
  };
  
  // Text/SMS type
  text?: string;
  sms?: {
    phone: string;
    message: string;
  };
  
  // Email type
  email?: {
    to: string;
    subject?: string;
    body?: string;
  };
  
  // Location type
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  // Event type
  event?: {
    title: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    allDay?: boolean;
  };
  
  // Multi-URL type
  multiUrl?: {
    title?: string;
    description?: string;
    links: Array<{
      title: string;
      url: string;
      icon?: string;
    }>;
  };
  
  // Menu type
  menu?: {
    restaurantName: string;
    categories: Array<{
      name: string;
      items: Array<{
        name: string;
        description?: string;
        price?: number;
        allergens?: string[];
        available?: boolean;
      }>;
    }>;
  };
  
  // Payment type
  payment?: {
    type: string; // upi, paypal, crypto
    address: string;
    amount?: number;
    currency?: string;
    note?: string;
  };
}

// QR Code Style
export interface QRCodeStyle {
  foregroundColor?: string;
  backgroundColor?: string;
  cornerStyle?: string;
  patternStyle?: string;
  logoUrl?: string;
  logoSize?: number;
  logoPosition?: string;
}

// Template Configuration
export interface TemplateConfig {
  // Visual customization
  style?: QRCodeStyle;
  
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
}

// Analytics Event Data
export interface AnalyticsEventData {
  // Device information
  userAgent?: string;
  device?: {
    type: string; // mobile, tablet, desktop
    os: string;
    browser: string;
    version: string;
  };
  
  // Location information
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  
  // Network information
  ip?: string;
  isp?: string;
  
  // Referrer information
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  
  // Custom event data
  customData?: Record<string, any>;
}

// ================================
// UTILITY TYPES
// ================================

// Extended types with relations
export interface UserWithOrganizations extends User {
  organizationMembers: (OrganizationMember & {
    organization: Organization;
  })[];
}

export interface OrganizationWithMembers extends Organization {
  members: (OrganizationMember & {
    user: User;
  })[];
}

export interface QRCodeWithRelations extends QRCode {
  user: User;
  organization?: Organization;
  folder?: Folder;
  template?: Template;
  analyticsEvents?: AnalyticsEvent[];
}

export interface FolderWithChildren extends Folder {
  children: Folder[];
  qrCodes: QRCode[];
}

export interface TemplateWithUsage extends Template {
  qrCodes: QRCode[];
}

// ================================
// QUERY RESULT TYPES
// ================================

// Analytics aggregation types
export interface QRCodeStats {
  totalScans: number;
  uniqueScans: number;
  scansByDate: Array<{
    date: string;
    scans: number;
  }>;
  scansByCountry: Array<{
    country: string;
    scans: number;
  }>;
  scansByDevice: Array<{
    device: string;
    scans: number;
  }>;
}

export interface OrganizationStats {
  totalQRCodes: number;
  totalScans: number;
  activeUsers: number;
  popularTemplates: Array<{
    template: Template;
    usageCount: number;
  }>;
}

// Dashboard data types
export interface DashboardData {
  user: User;
  organization?: Organization;
  recentQRCodes: QRCode[];
  totalScans: number;
  totalQRCodes: number;
  scanTrends: Array<{
    date: string;
    scans: number;
  }>;
}

// ================================
// VALIDATION TYPES
// ================================

// Form validation schemas (to be used with zod or similar)
export interface CreateQRCodeInput {
  name: string;
  description?: string;
  type: QRCodeType;
  data: QRCodeData;
  style?: QRCodeStyle;
  folderId?: string;
  templateId?: string;
  tags?: string[];
  expiresAt?: Date;
}

export interface UpdateQRCodeInput extends Partial<CreateQRCodeInput> {
  id: string;
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: TemplateCategory;
  qrCodeType: QRCodeType;
  config: TemplateConfig;
  isPublic?: boolean;
  tags?: string[];
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  settings?: OrganizationSettings;
}

export interface InviteUserInput {
  email: string;
  role: UserRole;
  permissions?: OrganizationMemberPermissions;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ================================
// CONSTANTS
// ================================

export const QR_CODE_TYPES: QRCodeType[] = [
  "url", "vcard", "wifi", "text", "sms", "email", "phone", "location", 
  "event", "app_download", "multi_url", "menu", "payment", "pdf", "image", "video"
];

export const QR_CODE_STATUSES: QRCodeStatus[] = [
  "active", "inactive", "expired", "archived"
];

export const USER_ROLES: UserRole[] = [
  "admin", "team_lead", "member", "viewer"
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "business", "personal", "event", "marketing", "restaurant", "retail", "education", "healthcare"
];

export const ANALYTICS_EVENT_TYPES: AnalyticsEventType[] = [
  "scan", "view", "click", "download", "share", "error"
];

export const DEFAULT_QR_CODE_SETTINGS = {
  size: 512,
  format: "png",
  errorCorrection: "M",
  style: {
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
  },
} as const;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    scanAlerts: true,
    weeklyReports: false,
  },
  preferences: {
    defaultQRSize: 512,
    defaultErrorCorrection: "M",
    defaultFormat: "png",
  },
  privacy: {
    profileVisible: true,
    analyticsOptIn: true,
  },
} as const;

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  branding: {
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
  },
  limits: {
    maxQRCodes: 1000,
    maxUsers: 10,
    maxTemplates: 50,
  },
  features: {
    analytics: true,
    customDomains: false,
    apiAccess: false,
  },
} as const;

export const DEFAULT_MEMBER_PERMISSIONS: OrganizationMemberPermissions = {
  canCreateQR: true,
  canEditQR: true,
  canDeleteQR: false,
  canViewAnalytics: true,
  canManageUsers: false,
  canManageSettings: false,
} as const; 