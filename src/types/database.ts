import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  organizations,
  organizationMembers,
  folders,
  templates,
  qrCodes,
  redirects,
  analyticsEvents,
  accounts,
  sessions,
  posts,
  verificationTokens,
} from "@/server/db/schema";

// ================================
// DATABASE TABLE TYPES
// ================================

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

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

// QR Code types
export type QRCode = InferSelectModel<typeof qrCodes>;
export type NewQRCode = InferInsertModel<typeof qrCodes>;

// Redirect types
export type Redirect = InferSelectModel<typeof redirects>;
export type NewRedirect = InferInsertModel<typeof redirects>;

// Analytics types
export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;

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
// ENUM TYPES
// ================================

export type UserRole = "admin" | "team_lead" | "member" | "viewer";
export type QRCodeType = 
  | "url" 
  | "vcard" 
  | "wifi" 
  | "text" 
  | "sms" 
  | "email" 
  | "phone" 
  | "location" 
  | "event" 
  | "app_download" 
  | "multi_url" 
  | "menu" 
  | "payment" 
  | "pdf" 
  | "image" 
  | "video";
export type QRCodeStatus = "active" | "inactive" | "expired" | "archived";
export type AnalyticsEventType = "scan" | "view" | "click" | "download" | "share" | "error";
export type TemplateCategory = 
  | "business" 
  | "personal" 
  | "event" 
  | "marketing" 
  | "restaurant" 
  | "retail" 
  | "education" 
  | "healthcare";

// ================================
// EXTENDED TYPES WITH RELATIONS
// ================================

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
  redirects?: Redirect[];
}

export interface FolderWithChildren extends Folder {
  children: Folder[];
  qrCodes: QRCode[];
}

export interface TemplateWithUsage extends Template {
  qrCodes: QRCode[];
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