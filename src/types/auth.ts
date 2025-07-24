import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT, DefaultJWT } from "next-auth/jwt";
import type { User, Organization, OrganizationMember } from "./database";

// ================================
// EXTENDED SESSION TYPES
// ================================

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      role?: string;
      organizationId?: string;
      organizationRole?: string;
      plan?: string;
      planExpiresAt?: Date | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
    organizationId?: string;
    organizationRole?: string;
    plan?: string;
    planExpiresAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role?: string;
    organizationId?: string;
    organizationRole?: string;
    plan?: string;
    planExpiresAt?: Date | null;
  }
}

// ================================
// AUTH PROVIDER TYPES
// ================================

export interface AuthProvider {
  id: string;
  name: string;
  type: "oauth" | "email" | "credentials";
  signinUrl: string;
  callbackUrl: string;
}

export interface OAuthProvider extends AuthProvider {
  type: "oauth";
  clientId: string;
  clientSecret: string;
  scope?: string;
  params?: Record<string, string>;
  profileUrl?: string;
  tokenUrl?: string;
  authorizationUrl?: string;
}

export interface EmailProvider extends AuthProvider {
  type: "email";
  server: {
    host: string;
    port: number;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
}

// ================================
// SESSION MANAGEMENT TYPES
// ================================

export interface SessionData {
  user: User;
  organization?: Organization;
  organizationMember?: OrganizationMember;
  permissions?: string[];
  expires: string;
}

export interface SessionOptions {
  maxAge: number; // seconds
  updateAge: number; // seconds
  generateSessionToken: () => string;
}

// ================================
// LOGIN/SIGNUP TYPES
// ================================

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ================================
// EMAIL VERIFICATION TYPES
// ================================

export interface EmailVerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface EmailVerificationRequest {
  email: string;
  callbackUrl?: string;
}

// ================================
// TWO-FACTOR AUTHENTICATION TYPES
// ================================

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}

export interface TwoFactorSettings {
  enabled: boolean;
  backupCodesUsed: number;
  lastUsed?: Date;
}

// ================================
// API KEY TYPES
// ================================

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  organizationId?: string;
  permissions: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
  expiresAt?: Date;
}

// ================================
// ROLE & PERMISSION TYPES
// ================================

export type Permission = 
  | "qr:create"
  | "qr:read"
  | "qr:update"
  | "qr:delete"
  | "analytics:read"
  | "templates:create"
  | "templates:read"
  | "templates:update"
  | "templates:delete"
  | "folders:create"
  | "folders:read"
  | "folders:update"
  | "folders:delete"
  | "organization:read"
  | "organization:update"
  | "members:read"
  | "members:invite"
  | "members:remove"
  | "members:update"
  | "settings:read"
  | "settings:update"
  | "billing:read"
  | "billing:update";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    "qr:create", "qr:read", "qr:update", "qr:delete",
    "analytics:read",
    "templates:create", "templates:read", "templates:update", "templates:delete",
    "folders:create", "folders:read", "folders:update", "folders:delete",
    "organization:read", "organization:update",
    "members:read", "members:invite", "members:remove", "members:update",
    "settings:read", "settings:update",
    "billing:read", "billing:update",
  ],
  team_lead: [
    "qr:create", "qr:read", "qr:update", "qr:delete",
    "analytics:read",
    "templates:create", "templates:read", "templates:update", "templates:delete",
    "folders:create", "folders:read", "folders:update", "folders:delete",
    "organization:read",
    "members:read", "members:invite",
    "settings:read",
  ],
  member: [
    "qr:create", "qr:read", "qr:update", "qr:delete",
    "analytics:read",
    "templates:read",
    "folders:create", "folders:read", "folders:update", "folders:delete",
    "organization:read",
    "settings:read",
  ],
  viewer: [
    "qr:read",
    "analytics:read",
    "templates:read",
    "folders:read",
    "organization:read",
    "settings:read",
  ],
};

// ================================
// SUBSCRIPTION & BILLING TYPES
// ================================

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  limits: {
    qrCodes: number;
    users: number;
    templates: number;
    analytics: boolean;
    customDomains: boolean;
    apiAccess: boolean;
  };
  isPopular?: boolean;
  stripePriceId?: string;
}

// ================================
// AUDIT LOG TYPES
// ================================

export interface AuditLog {
  id: string;
  userId: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface CreateAuditLogData {
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
} 