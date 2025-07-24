import type { User, UserRole } from "./database";
import type { OrganizationSettings, OrganizationMemberPermissions } from "./settings";

// ================================
// ORGANIZATION TYPES
// ================================

export interface OrganizationWithDetails {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  settings?: OrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  
  // Computed fields
  memberCount: number;
  qrCodeCount: number;
  templateCount: number;
  totalScans: number;
  
  // Relations
  members?: OrganizationMemberWithUser[];
  owner?: User;
}

export interface OrganizationMemberWithUser {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  permissions?: OrganizationMemberPermissions;
  joinedAt: Date;
  updatedAt?: Date;
  
  // Relations
  user: User;
  organization?: OrganizationWithDetails;
}

// ================================
// ORGANIZATION CREATION TYPES
// ================================

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  settings?: OrganizationSettings;
}

export interface UpdateOrganizationInput extends Partial<CreateOrganizationInput> {
  id: string;
}

// ================================
// MEMBER MANAGEMENT TYPES
// ================================

export interface InviteUserInput {
  email: string;
  role: UserRole;
  permissions?: OrganizationMemberPermissions;
  message?: string;
}

export interface UpdateMemberInput {
  memberId: string;
  role?: UserRole;
  permissions?: OrganizationMemberPermissions;
}

export interface RemoveMemberInput {
  memberId: string;
  reason?: string;
}

// ================================
// ORGANIZATION INVITATION TYPES
// ================================

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  invitedBy: string;
  email: string;
  role: UserRole;
  permissions?: OrganizationMemberPermissions;
  token: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt?: Date;
  
  // Relations
  organization: OrganizationWithDetails;
  inviter: User;
}

export interface AcceptInvitationInput {
  token: string;
  userId?: string; // If user is already logged in
}

export interface DeclineInvitationInput {
  token: string;
  reason?: string;
}

// ================================
// ORGANIZATION STATISTICS TYPES
// ================================

export interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  totalQRCodes: number;
  totalScans: number;
  totalTemplates: number;
  totalFolders: number;
  
  // Time-based stats
  qrCodesCreatedThisMonth: number;
  scansThisMonth: number;
  newMembersThisMonth: number;
  
  // Growth metrics
  qrCodeGrowthRate: number; // percentage
  scanGrowthRate: number; // percentage
  memberGrowthRate: number; // percentage;
  
  // Top performers
  topPerformingQRCodes: Array<{
    id: string;
    name: string;
    scanCount: number;
    creator: User;
  }>;
  
  mostActiveMembers: Array<{
    user: User;
    qrCodeCount: number;
    totalScans: number;
    lastActivity: Date;
  }>;
  
  popularTemplates: Array<{
    id: string;
    name: string;
    usageCount: number;
    creator: User;
  }>;
}

// ================================
// ORGANIZATION ACTIVITY TYPES
// ================================

export interface OrganizationActivity {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  
  // Relations
  user: User;
  organization: OrganizationWithDetails;
}

export interface ActivityFilter {
  userId?: string;
  action?: string;
  resource?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// ================================
// ORGANIZATION BILLING TYPES
// ================================

export interface OrganizationBilling {
  id: string;
  organizationId: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  
  // Usage tracking
  usage: {
    qrCodes: number;
    scans: number;
    users: number;
    templates: number;
    storage: number; // in MB
  };
  
  // Limits based on plan
  limits: {
    qrCodes: number;
    scans: number;
    users: number;
    templates: number;
    storage: number; // in MB
    analytics: boolean;
    customDomains: boolean;
    apiAccess: boolean;
  };
  
  // Billing details
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  nextBillingDate?: Date;
  billingEmail?: string;
  
  createdAt: Date;
  updatedAt?: Date;
}

// ================================
// ORGANIZATION SETTINGS TYPES
// ================================

export interface OrganizationBrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
  
  // Email branding
  emailLogo?: string;
  emailHeaderColor?: string;
  emailFooterText?: string;
  
  // QR code defaults
  defaultQRStyle?: {
    foregroundColor: string;
    backgroundColor: string;
    cornerStyle: string;
    patternStyle: string;
    logoUrl?: string;
  };
}

export interface OrganizationSecuritySettings {
  requireTwoFactor: boolean;
  allowedDomains?: string[]; // Email domain restrictions
  sessionTimeout: number; // in minutes
  ipWhitelist?: string[];
  
  // API security
  apiRateLimit: number; // requests per minute
  webhookSecrets: boolean;
  
  // Data retention
  dataRetentionDays: number;
  autoDeleteInactiveQRCodes: boolean;
  inactiveQRCodeDays: number;
}

export interface OrganizationIntegrationSettings {
  allowedIntegrations: string[];
  webhookEndpoints: Array<{
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    secret?: string;
  }>;
  
  // Third-party integrations
  googleAnalytics?: {
    enabled: boolean;
    trackingId?: string;
    customDimensions?: Record<string, string>;
  };
  
  zapier?: {
    enabled: boolean;
    apiKey?: string;
  };
  
  slack?: {
    enabled: boolean;
    webhookUrl?: string;
    channels?: string[];
  };
}

// ================================
// ORGANIZATION ROLES & PERMISSIONS
// ================================

export interface OrganizationRole {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // Cannot be deleted
  isDefault: boolean; // Assigned to new members
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  permissions: string[];
  isDefault?: boolean;
}

export interface UpdateRoleInput extends Partial<CreateRoleInput> {
  id: string;
}

// ================================
// ORGANIZATION TEMPLATES
// ================================

export interface OrganizationTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: string;
  qrCodeType: string;
  config: Record<string, any>;
  isPublic: boolean;
  isRequired: boolean; // Must be used by all members
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // Relations
  creator: User;
  organization: OrganizationWithDetails;
}

// ================================
// CONSTANTS
// ================================

export const ORGANIZATION_PLANS = {
  FREE: {
    name: "Free",
    limits: {
      qrCodes: 100,
      scans: 1000,
      users: 3,
      templates: 10,
      storage: 100, // MB
      analytics: false,
      customDomains: false,
      apiAccess: false,
    },
  },
  STARTER: {
    name: "Starter",
    limits: {
      qrCodes: 1000,
      scans: 10000,
      users: 10,
      templates: 50,
      storage: 1000, // MB
      analytics: true,
      customDomains: false,
      apiAccess: false,
    },
  },
  PROFESSIONAL: {
    name: "Professional",
    limits: {
      qrCodes: 10000,
      scans: 100000,
      users: 50,
      templates: 200,
      storage: 10000, // MB
      analytics: true,
      customDomains: true,
      apiAccess: true,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    limits: {
      qrCodes: -1, // Unlimited
      scans: -1, // Unlimited
      users: -1, // Unlimited
      templates: -1, // Unlimited
      storage: -1, // Unlimited
      analytics: true,
      customDomains: true,
      apiAccess: true,
    },
  },
} as const;

export const DEFAULT_ORGANIZATION_PERMISSIONS = [
  "qr:create",
  "qr:read",
  "qr:update",
  "qr:delete",
  "analytics:read",
  "templates:read",
  "folders:create",
  "folders:read",
  "folders:update",
  "folders:delete",
] as const; 