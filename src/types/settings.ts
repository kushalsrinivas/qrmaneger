// ================================
// USER SETTINGS TYPES
// ================================

export interface UserSettings {
  notifications?: NotificationSettings;
  preferences?: UserPreferences;
  privacy?: PrivacySettings;
  qrDefaults?: QRDefaultSettings;
  dashboard?: DashboardSettings;
  appearance?: AppearanceSettings;
}

export interface NotificationSettings {
  email?: boolean;
  push?: boolean;
  marketing?: boolean;
  security?: boolean;
  scanAlerts?: boolean;
  weeklyReports?: boolean;
  monthlyReports?: boolean;
}

export interface UserPreferences {
  defaultQRSize?: number;
  defaultErrorCorrection?: "L" | "M" | "Q" | "H";
  defaultFormat?: "png" | "svg" | "jpeg" | "pdf";
  timezone?: string;
  language?: string;
  dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat?: "12h" | "24h";
}

export interface PrivacySettings {
  analytics?: boolean;
  publicProfile?: boolean;
  dataSharing?: boolean;
  trackingConsent?: boolean;
  profileVisible?: boolean;
  showEmail?: boolean;
  showStats?: boolean;
}

export interface QRDefaultSettings {
  defaultSize?: number;
  defaultFormat?: "png" | "svg" | "jpeg" | "pdf";
  defaultErrorCorrection?: "L" | "M" | "Q" | "H";
  defaultStyle?: {
    foregroundColor?: string;
    backgroundColor?: string;
    cornerStyle?: "square" | "rounded" | "circle";
    patternStyle?: "square" | "rounded" | "circle";
  };
}

export interface DashboardSettings {
  defaultView?: "grid" | "list" | "table";
  itemsPerPage?: number;
  showPreview?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export interface AppearanceSettings {
  theme?: "light" | "dark" | "system";
  language?: string;
  dateFormat?: string;
}

// ================================
// SECURITY SETTINGS TYPES
// ================================

export interface SecuritySettings {
  twoFactorEnabled?: boolean;
  sessionTimeout?: number; // minutes
  loginNotifications?: boolean;
  apiAccess?: boolean;
  dataRetention?: number; // days
}

// ================================
// INTEGRATION SETTINGS TYPES
// ================================

export interface IntegrationSettings {
  googleAnalytics?: GoogleAnalyticsIntegration;
  zapier?: ZapierIntegration;
  slack?: SlackIntegration;
  customWebhooks?: CustomWebhook[];
}

export interface GoogleAnalyticsIntegration {
  enabled?: boolean;
  trackingId?: string;
  customDimensions?: Record<string, string>;
}

export interface ZapierIntegration {
  enabled?: boolean;
  webhookUrl?: string;
  events?: ("scan" | "create" | "update" | "delete")[];
}

export interface SlackIntegration {
  enabled?: boolean;
  webhookUrl?: string;
  channels?: string[];
}

export interface CustomWebhook {
  id: string;
  name: string;
  url: string;
  events: ("scan" | "create" | "update" | "delete")[];
  headers?: Record<string, string>;
  isActive?: boolean;
  enabled?: boolean; // For backward compatibility
}

// ================================
// ORGANIZATION SETTINGS TYPES
// ================================

export interface OrganizationSettings {
  branding?: OrganizationBranding;
  limits?: OrganizationLimits;
  features?: OrganizationFeatures;
}

export interface OrganizationBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
}

export interface OrganizationLimits {
  maxQRCodes?: number;
  maxUsers?: number;
  maxTemplates?: number;
}

export interface OrganizationFeatures {
  analytics?: boolean;
  customDomains?: boolean;
  apiAccess?: boolean;
}

// ================================
// ORGANIZATION MEMBER PERMISSIONS
// ================================

export interface OrganizationMemberPermissions {
  canCreateQR?: boolean;
  canEditQR?: boolean;
  canDeleteQR?: boolean;
  canViewAnalytics?: boolean;
  canManageUsers?: boolean;
  canManageSettings?: boolean;
}

// ================================
// EXPORT DATA TYPES
// ================================

export interface DataExportOptions {
  format: "json" | "csv" | "xml";
  includeQRCodes?: boolean;
  includeAnalytics?: boolean;
  includeTemplates?: boolean;
  includeFolders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DataExportResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  expiresAt: Date;
}

// ================================
// ACCOUNT DELETION TYPES
// ================================

export interface AccountDeletionRequest {
  confirmation: "DELETE_MY_ACCOUNT";
  reason?: string;
  feedback?: string;
}

// ================================
// ACCOUNT STATS TYPES
// ================================

export interface AccountStats {
  qrCodesCount: number;
  templatesCount: number;
  foldersCount: number;
  totalQRCodes: number;
  totalScans: number;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  memberSince: Date;
  accountAge: number; // in days
}

// ================================
// DEFAULT SETTINGS
// ================================

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    scanAlerts: true,
    weeklyReports: false,
    marketing: false,
    security: true,
    monthlyReports: false,
  },
  preferences: {
    defaultQRSize: 512,
    defaultErrorCorrection: "M",
    defaultFormat: "png",
    timezone: "UTC",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
  privacy: {
    analytics: true,
    publicProfile: true,
    dataSharing: false,
    trackingConsent: true,
    profileVisible: true,
    showEmail: false,
    showStats: true,
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
  },
  dashboard: {
    defaultView: "grid",
    itemsPerPage: 20,
    showPreview: true,
    autoRefresh: false,
    refreshInterval: 60,
  },
  appearance: {
    theme: "system",
    language: "en",
    dateFormat: "MM/DD/YYYY",
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