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
    // Required fields
    firstName?: string;
    lastName?: string;
    
    // Standard vCard fields
    organization?: string;
    title?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    
    // Extended fields (vCard Plus)
    // Social Media
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    
    // Additional Contact Methods
    whatsapp?: string;
    skype?: string;
    telegram?: string;
    
    // Professional Info
    department?: string;
    assistant?: string;
    assistantPhone?: string;
    companyLogo?: string;
    
    // Additional fields
    middleName?: string;
    nickname?: string;
    birthday?: string;
    anniversary?: string;
    note?: string;
    
    // Address components (structured)
    addressComponents?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    
    // Custom fields
    customFields?: Array<{
      label: string;
      value: string;
      type: "text" | "email" | "phone" | "url";
    }>;
  };
  
  // WiFi type
  wifi?: {
    ssid: string;
    password: string;
    security: string;
    hidden?: boolean;
    // Enterprise WiFi settings
    eap?: string;
    identity?: string;
    anonymousIdentity?: string;
    phase2?: string;
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
  
  // Multi-URL type - Enhanced Linktree-style landing pages
  multiUrl?: {
    // Basic Information
    title?: string;
    description?: string;
    bio?: string;
    
    // Profile Information
    profileImage?: string;
    profileName?: string;
    profileTitle?: string;
    
    // Links with advanced features
    links: Array<{
      id: string;
      title: string;
      url: string;
      description?: string;
      icon?: string;
      iconType?: "emoji" | "image" | "platform"; // Type of icon
      platform?: string; // For social media auto-detection
      
      // Link Styling
      backgroundColor?: string;
      textColor?: string;
      borderColor?: string;
      borderRadius?: number;
      
      // Link Scheduling
      isActive?: boolean;
      scheduledStart?: string; // ISO date string
      scheduledEnd?: string; // ISO date string
      timezone?: string;
      
      // Link Analytics
      clickCount?: number;
      lastClicked?: string;
      
      // Link Type
      linkType?: "standard" | "social" | "email" | "phone" | "app" | "file" | "contact";
      
      // Additional metadata
      metadata?: {
        subject?: string; // For email links
        body?: string; // For email/SMS links
        downloadFilename?: string; // For file links
        appStoreUrl?: string; // For app links
        playStoreUrl?: string; // For app links
      };
    }>;
    
    // Theme and Branding
    theme?: {
      // Pre-built theme selection
      templateId?: string;
      themeName?: "professional" | "creative" | "minimalist" | "dark" | "neon" | "vintage" | "gradient";
      
      // Custom Branding
      branding?: {
        logo?: string;
        logoPosition?: "top" | "center" | "floating";
        logoSize?: number;
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
        textColor?: string;
        backgroundColor?: string;
        
        // Background Options
        backgroundType?: "solid" | "gradient" | "image" | "video" | "animated";
        backgroundGradient?: {
          type: "linear" | "radial";
          colors: string[];
          direction?: string;
        };
        backgroundImage?: string;
        backgroundVideo?: string;
        backgroundOverlay?: {
          color: string;
          opacity: number;
        };
      };
      
      // Typography
      typography?: {
        fontFamily?: string;
        fontSize?: {
          title?: number;
          description?: number;
          links?: number;
        };
        fontWeight?: {
          title?: number;
          description?: number;
          links?: number;
        };
        textAlign?: "left" | "center" | "right";
        lineHeight?: number;
      };
      
      // Layout
      layout?: {
        containerWidth?: number;
        linkSpacing?: number;
        padding?: number;
        borderRadius?: number;
        
        // Link Layout
        linkLayout?: "list" | "grid" | "masonry";
        linkColumns?: number;
        linkButtonStyle?: "rounded" | "square" | "pill" | "custom";
        
        // Animations
        animations?: {
          entrance?: string;
          hover?: string;
          click?: string;
        };
      };
      
      // Custom CSS
      customCss?: string;
    };
    
    // SEO and Social Media
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      
      // Open Graph
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      ogType?: string;
      
      // Twitter Card
      twitterCard?: "summary" | "summary_large_image";
      twitterTitle?: string;
      twitterDescription?: string;
      twitterImage?: string;
      twitterSite?: string;
      twitterCreator?: string;
    };
    
    // Social Media Integration
    socialMedia?: {
      platforms: Array<{
        platform: string;
        username?: string;
        url: string;
        displayFollowerCount?: boolean;
        followerCount?: number;
        isVerified?: boolean;
        autoDetected?: boolean;
      }>;
      
      // Social proof
      showSocialProof?: boolean;
      socialProofText?: string;
    };
    
    // Advanced Features
    features?: {
      // PWA Settings
      pwaEnabled?: boolean;
      pwaName?: string;
      pwaShortName?: string;
      pwaDescription?: string;
      pwaIcon?: string;
      
      // Analytics
      trackingEnabled?: boolean;
      trackingCode?: string; // Google Analytics, etc.
      
      // Contact Form
      contactFormEnabled?: boolean;
      contactFormFields?: Array<{
        name: string;
        type: "text" | "email" | "phone" | "textarea" | "select";
        label: string;
        required?: boolean;
        options?: string[]; // For select fields
      }>;
      
      // Custom Domain
      customDomain?: string;
      
      // Password Protection
      passwordProtected?: boolean;
      password?: string;
      
      // Geographic Restrictions
      geoRestrictions?: {
        allowedCountries?: string[];
        blockedCountries?: string[];
      };
      
      // Time-based Access
      accessSchedule?: {
        timezone?: string;
        schedule?: Array<{
          day: number; // 0-6 (Sunday-Saturday)
          startTime: string; // HH:MM
          endTime: string; // HH:MM
        }>;
      };
    };
    
    // Analytics and Tracking
    analytics?: {
      totalViews?: number;
      uniqueViews?: number;
      totalClicks?: number;
      lastViewed?: string;
      
      // Detailed Analytics
      viewsByCountry?: Record<string, number>;
      viewsByDevice?: Record<string, number>;
      viewsByReferrer?: Record<string, number>;
      clicksByLink?: Record<string, number>;
      
      // Conversion Tracking
      conversionGoals?: Array<{
        id: string;
        name: string;
        linkId?: string;
        targetUrl?: string;
        conversionCount?: number;
      }>;
    };
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

// ================================
// MULTI-URL LANDING PAGE TYPES
// ================================

// Theme types
export type MultiUrlThemeName = "professional" | "creative" | "minimalist" | "dark" | "neon" | "vintage" | "gradient";
export type LinkLayoutType = "list" | "grid" | "masonry";
export type LinkButtonStyle = "rounded" | "square" | "pill" | "custom";
export type BackgroundType = "solid" | "gradient" | "image" | "video" | "animated";
export type LogoPosition = "top" | "center" | "floating";
export type TextAlign = "left" | "center" | "right";
export type LinkType = "standard" | "social" | "email" | "phone" | "app" | "file" | "contact";
export type IconType = "emoji" | "image" | "platform";

// Social media platforms
export const SOCIAL_PLATFORMS = [
  "facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube", "snapchat",
  "whatsapp", "telegram", "discord", "github", "behance", "dribbble", "medium",
  "spotify", "apple-music", "soundcloud", "twitch", "vimeo", "pinterest",
  "reddit", "tumblr", "mastodon", "threads", "bluesky"
] as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

// Link metadata interface
export interface LinkMetadata {
  subject?: string; // For email links
  body?: string; // For email/SMS links
  downloadFilename?: string; // For file links
  appStoreUrl?: string; // For app links
  playStoreUrl?: string; // For app links
}

// Multi-URL link interface
export interface MultiUrlLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  iconType?: IconType;
  platform?: string;
  
  // Link Styling
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  
  // Link Scheduling
  isActive?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
  timezone?: string;
  
  // Link Analytics
  clickCount?: number;
  lastClicked?: string;
  
  // Link Type
  linkType?: LinkType;
  
  // Additional metadata
  metadata?: LinkMetadata;
}

// Theme configuration interface
export interface MultiUrlTheme {
  templateId?: string;
  themeName?: MultiUrlThemeName;
  
  branding?: {
    logo?: string;
    logoPosition?: LogoPosition;
    logoSize?: number;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    textColor?: string;
    backgroundColor?: string;
    
    backgroundType?: BackgroundType;
    backgroundGradient?: {
      type: "linear" | "radial";
      colors: string[];
      direction?: string;
    };
    backgroundImage?: string;
    backgroundVideo?: string;
    backgroundOverlay?: {
      color: string;
      opacity: number;
    };
  };
  
  typography?: {
    fontFamily?: string;
    fontSize?: {
      title?: number;
      description?: number;
      links?: number;
    };
    fontWeight?: {
      title?: number;
      description?: number;
      links?: number;
    };
    textAlign?: TextAlign;
    lineHeight?: number;
  };
  
  layout?: {
    containerWidth?: number;
    linkSpacing?: number;
    padding?: number;
    borderRadius?: number;
    
    linkLayout?: LinkLayoutType;
    linkColumns?: number;
    linkButtonStyle?: LinkButtonStyle;
    
    animations?: {
      entrance?: string;
      hover?: string;
      click?: string;
    };
  };
  
  customCss?: string;
}

// SEO configuration interface
export interface MultiUrlSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  
  // Twitter Card
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
}

// Social media platform interface
export interface SocialMediaPlatform {
  platform: string;
  username?: string;
  url: string;
  displayFollowerCount?: boolean;
  followerCount?: number;
  isVerified?: boolean;
  autoDetected?: boolean;
}

// Contact form field interface
export interface ContactFormField {
  name: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  label: string;
  required?: boolean;
  options?: string[];
}

// Conversion goal interface
export interface ConversionGoal {
  id: string;
  name: string;
  linkId?: string;
  targetUrl?: string;
  conversionCount?: number;
}

// Multi-URL analytics interface
export interface MultiUrlAnalytics {
  totalViews?: number;
  uniqueViews?: number;
  totalClicks?: number;
  lastViewed?: string;
  
  // Detailed Analytics
  viewsByCountry?: Record<string, number>;
  viewsByDevice?: Record<string, number>;
  viewsByReferrer?: Record<string, number>;
  clicksByLink?: Record<string, number>;
  
  // Conversion Tracking
  conversionGoals?: ConversionGoal[];
}

// Pre-built theme templates
export const MULTI_URL_THEMES: Record<MultiUrlThemeName, Partial<MultiUrlTheme>> = {
  professional: {
    themeName: "professional",
    branding: {
      primaryColor: "#1f2937",
      secondaryColor: "#6b7280",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      backgroundType: "solid",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      textAlign: "center",
      fontSize: { title: 28, description: 16, links: 16 },
      fontWeight: { title: 600, description: 400, links: 500 },
    },
    layout: {
      containerWidth: 400,
      linkSpacing: 12,
      padding: 24,
      borderRadius: 12,
      linkLayout: "list",
      linkButtonStyle: "rounded",
    },
  },
  creative: {
    themeName: "creative",
    branding: {
      primaryColor: "#7c3aed",
      secondaryColor: "#a855f7",
      backgroundColor: "#faf5ff",
      textColor: "#581c87",
      backgroundType: "gradient",
      backgroundGradient: {
        type: "linear",
        colors: ["#faf5ff", "#f3e8ff"],
        direction: "135deg",
      },
    },
    typography: {
      fontFamily: "Poppins, system-ui, sans-serif",
      textAlign: "center",
      fontSize: { title: 32, description: 18, links: 16 },
      fontWeight: { title: 700, description: 400, links: 600 },
    },
    layout: {
      containerWidth: 420,
      linkSpacing: 16,
      padding: 32,
      borderRadius: 20,
      linkLayout: "list",
      linkButtonStyle: "pill",
    },
  },
  minimalist: {
    themeName: "minimalist",
    branding: {
      primaryColor: "#000000",
      secondaryColor: "#666666",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      backgroundType: "solid",
    },
    typography: {
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      fontSize: { title: 24, description: 14, links: 14 },
      fontWeight: { title: 400, description: 400, links: 400 },
    },
    layout: {
      containerWidth: 360,
      linkSpacing: 8,
      padding: 16,
      borderRadius: 0,
      linkLayout: "list",
      linkButtonStyle: "square",
    },
  },
  dark: {
    themeName: "dark",
    branding: {
      primaryColor: "#ffffff",
      secondaryColor: "#d1d5db",
      backgroundColor: "#111827",
      textColor: "#ffffff",
      backgroundType: "solid",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      textAlign: "center",
      fontSize: { title: 28, description: 16, links: 16 },
      fontWeight: { title: 600, description: 400, links: 500 },
    },
    layout: {
      containerWidth: 400,
      linkSpacing: 12,
      padding: 24,
      borderRadius: 12,
      linkLayout: "list",
      linkButtonStyle: "rounded",
    },
  },
  neon: {
    themeName: "neon",
    branding: {
      primaryColor: "#00ffff",
      secondaryColor: "#ff00ff",
      backgroundColor: "#000000",
      textColor: "#00ffff",
      backgroundType: "solid",
    },
    typography: {
      fontFamily: "Orbitron, monospace",
      textAlign: "center",
      fontSize: { title: 30, description: 16, links: 16 },
      fontWeight: { title: 700, description: 400, links: 600 },
    },
    layout: {
      containerWidth: 400,
      linkSpacing: 16,
      padding: 24,
      borderRadius: 8,
      linkLayout: "list",
      linkButtonStyle: "rounded",
    },
  },
  vintage: {
    themeName: "vintage",
    branding: {
      primaryColor: "#8b4513",
      secondaryColor: "#deb887",
      backgroundColor: "#faf0e6",
      textColor: "#8b4513",
      backgroundType: "solid",
    },
    typography: {
      fontFamily: "Georgia, serif",
      textAlign: "center",
      fontSize: { title: 32, description: 18, links: 16 },
      fontWeight: { title: 700, description: 400, links: 500 },
    },
    layout: {
      containerWidth: 420,
      linkSpacing: 14,
      padding: 28,
      borderRadius: 16,
      linkLayout: "list",
      linkButtonStyle: "rounded",
    },
  },
  gradient: {
    themeName: "gradient",
    branding: {
      primaryColor: "#ffffff",
      secondaryColor: "#f8fafc",
      backgroundColor: "#ffffff",
      textColor: "#1e293b",
      backgroundType: "gradient",
      backgroundGradient: {
        type: "linear",
        colors: ["#667eea", "#764ba2"],
        direction: "135deg",
      },
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      textAlign: "center",
      fontSize: { title: 28, description: 16, links: 16 },
      fontWeight: { title: 600, description: 400, links: 500 },
    },
    layout: {
      containerWidth: 400,
      linkSpacing: 12,
      padding: 24,
      borderRadius: 16,
      linkLayout: "list",
      linkButtonStyle: "pill",
    },
  },
};

// ================================
// QR CODE GENERATION TYPES
// ================================

// Error correction levels
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

// QR code formats
export type QRCodeFormat = "png" | "svg" | "jpeg" | "pdf";

// QR code generation mode
export type QRCodeMode = "static" | "dynamic";

// QR code generation request
export interface QRCodeGenerationRequest {
  type: QRCodeType;
  mode: QRCodeMode;
  data: QRCodeData;
  options: {
    errorCorrection: ErrorCorrectionLevel;
    size: number;
    format: QRCodeFormat;
    customization?: QRCodeStyle;
  };
  metadata?: {
    name?: string;
    description?: string;
    folderId?: string;
    templateId?: string;
    tags?: string[];
    expiresAt?: Date;
  };
}

// QR code generation response
export interface QRCodeGenerationResponse {
  id: string;
  qrCodeUrl: string;
  shortUrl?: string; // For dynamic QR codes
  metadata: {
    type: QRCodeType;
    mode: QRCodeMode;
    size: number;
    format: QRCodeFormat;
    errorCorrection: ErrorCorrectionLevel;
    fileSize: number;
    version: number; // QR code version (1-40)
    modules: number; // Number of modules per side
  };
  createdAt: Date;
}

// Short URL generation
export interface ShortUrlData {
  shortCode: string;
  originalData: string;
  qrType: QRCodeType;
  qrCodeId: string;
  userId: string;
  expiresAt?: Date;
}

// QR code validation result
export interface QRCodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSize: number;
  recommendedErrorCorrection: ErrorCorrectionLevel;
}

// Analytics event for QR code scanning
export interface QRCodeScanEvent {
  qrCodeId: string;
  sessionId: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  device?: {
    type: "mobile" | "tablet" | "desktop";
    os?: string;
    browser?: string;
    version?: string;
  };
}

// QR code data limits by type
export interface QRCodeLimits {
  maxLength: number;
  recommendedErrorCorrection: ErrorCorrectionLevel;
  requiredFields: string[];
  optionalFields: string[];
}

// QR code type configuration
export type QRCodeTypeConfig = {
  [key in QRCodeType]: QRCodeLimits;
}

// ================================
// QR CODE CONSTANTS
// ================================

export const QR_CODE_LIMITS: QRCodeTypeConfig = {
  url: {
    maxLength: 2953, // QR code alphanumeric limit
    recommendedErrorCorrection: "M",
    requiredFields: ["url"],
    optionalFields: [],
  },
  vcard: {
    maxLength: 1000,
    recommendedErrorCorrection: "M",
    requiredFields: ["firstName", "lastName"],
    optionalFields: ["organization", "title", "email", "phone", "website", "address"],
  },
  wifi: {
    maxLength: 500,
    recommendedErrorCorrection: "H",
    requiredFields: ["ssid", "password", "security"],
    optionalFields: ["hidden"],
  },
  text: {
    maxLength: 2000,
    recommendedErrorCorrection: "M",
    requiredFields: ["text"],
    optionalFields: [],
  },
  sms: {
    maxLength: 500,
    recommendedErrorCorrection: "M",
    requiredFields: ["phone", "message"],
    optionalFields: [],
  },
  email: {
    maxLength: 1000,
    recommendedErrorCorrection: "M",
    requiredFields: ["to"],
    optionalFields: ["subject", "body"],
  },
  phone: {
    maxLength: 50,
    recommendedErrorCorrection: "H",
    requiredFields: ["phone"],
    optionalFields: [],
  },
  location: {
    maxLength: 200,
    recommendedErrorCorrection: "M",
    requiredFields: ["latitude", "longitude"],
    optionalFields: ["address"],
  },
  event: {
    maxLength: 1500,
    recommendedErrorCorrection: "M",
    requiredFields: ["title", "startDate"],
    optionalFields: ["description", "location", "endDate", "allDay"],
  },
  app_download: {
    maxLength: 500,
    recommendedErrorCorrection: "M",
    requiredFields: ["appName", "androidUrl", "iosUrl"],
    optionalFields: ["fallbackUrl"],
  },
  multi_url: {
    maxLength: 2000,
    recommendedErrorCorrection: "M",
    requiredFields: ["links"],
    optionalFields: ["title", "description"],
  },
  menu: {
    maxLength: 3000,
    recommendedErrorCorrection: "M",
    requiredFields: ["restaurantName", "categories"],
    optionalFields: [],
  },
  payment: {
    maxLength: 500,
    recommendedErrorCorrection: "H",
    requiredFields: ["type", "address"],
    optionalFields: ["amount", "currency", "note"],
  },
  pdf: {
    maxLength: 1000,
    recommendedErrorCorrection: "M",
    requiredFields: ["fileUrl"],
    optionalFields: ["title", "description"],
  },
  image: {
    maxLength: 1000,
    recommendedErrorCorrection: "M",
    requiredFields: ["imageUrl"],
    optionalFields: ["title", "description"],
  },
  video: {
    maxLength: 1000,
    recommendedErrorCorrection: "M",
    requiredFields: ["videoUrl"],
    optionalFields: ["title", "description"],
  },
};

// Error correction level details
export const ERROR_CORRECTION_LEVELS = {
  L: { name: "Low", recovery: "~7%", description: "Suitable for clean environments" },
  M: { name: "Medium", recovery: "~15%", description: "Balanced option for most use cases" },
  Q: { name: "Quartile", recovery: "~25%", description: "Good for environments with some damage" },
  H: { name: "High", recovery: "~30%", description: "Best for harsh environments or logo embedding" },
} as const;

// QR code size recommendations
export const QR_CODE_SIZES = {
  small: 256,
  medium: 512,
  large: 1024,
  xlarge: 2048,
} as const; 