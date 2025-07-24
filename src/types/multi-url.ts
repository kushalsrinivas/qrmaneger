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

// Multi-URL features interface
export interface MultiUrlFeatures {
  pwaEnabled?: boolean;
  pwaName?: string;
  pwaShortName?: string;
  pwaDescription?: string;
  pwaIcon?: string;
  
  trackingEnabled?: boolean;
  trackingCode?: string;
  
  contactFormEnabled?: boolean;
  contactFormFields?: ContactFormField[];
  
  customDomain?: string;
  
  passwordProtected?: boolean;
  password?: string;
  
  geoRestrictions?: {
    allowedCountries?: string[];
    blockedCountries?: string[];
  };
  
  accessSchedule?: {
    timezone?: string;
    schedule?: Array<{
      day: number;
      startTime: string;
      endTime: string;
    }>;
  };
}

// Social media integration interface
export interface MultiUrlSocialMedia {
  platforms?: SocialMediaPlatform[];
  showSocialProof?: boolean;
  socialProofText?: string;
}

// Complete multi-URL data interface
export interface MultiUrlData {
  // Basic Information
  title?: string;
  description?: string;
  bio?: string;
  
  // Profile Information
  profileImage?: string;
  profileName?: string;
  profileTitle?: string;
  
  // Links
  links: MultiUrlLink[];
  
  // Theme and Branding
  theme?: MultiUrlTheme;
  
  // SEO and Social Media
  seo?: MultiUrlSeo;
  socialMedia?: MultiUrlSocialMedia;
  
  // Advanced Features
  features?: MultiUrlFeatures;
  
  // Analytics
  analytics?: MultiUrlAnalytics;
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