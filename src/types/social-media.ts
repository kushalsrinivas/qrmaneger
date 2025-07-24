// ================================
// SOCIAL MEDIA PLATFORM TYPES
// ================================

// Social media platforms
export const SOCIAL_PLATFORMS = [
  "facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube", "snapchat",
  "whatsapp", "telegram", "discord", "github", "behance", "dribbble", "medium",
  "spotify", "apple-music", "soundcloud", "twitch", "vimeo", "pinterest",
  "reddit", "tumblr", "mastodon", "threads", "bluesky"
] as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

// Social media platform information
export interface SocialMediaPlatformInfo {
  platform: SocialPlatform;
  name: string;
  color: string;
  icon: string;
  urlPatterns: RegExp[];
  usernameExtractor?: (url: string) => string | null;
  apiEndpoint?: string;
  supportsFollowerCount?: boolean;
}

// Social link interface for business cards and multi-URL pages
export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
}

// Custom field interface for business cards
export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: "text" | "email" | "phone" | "url";
  order: number;
}

// Platform styling information
export interface PlatformStyling {
  backgroundColor: string;
  textColor: string;
  hoverColor: string;
  icon: string;
  name: string;
}

// Auto-detection result
export interface AutoDetectedPlatform {
  url: string;
  platform?: string;
  icon?: string;
  autoDetected: boolean;
  title: string;
}

// Social media service configuration
export interface SocialMediaServiceConfig {
  enableAutoDetection: boolean;
  enableFollowerCounts: boolean;
  apiKeys?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

// Platform categories for organization
export const PLATFORM_CATEGORIES = {
  social: ["facebook", "instagram", "twitter", "linkedin", "tiktok", "snapchat", "threads", "bluesky"],
  messaging: ["whatsapp", "telegram", "discord"],
  professional: ["linkedin", "github", "behance", "dribbble", "medium"],
  entertainment: ["youtube", "spotify", "apple-music", "soundcloud", "twitch", "vimeo"],
  community: ["reddit", "tumblr", "mastodon", "pinterest"],
} as const;

export type PlatformCategory = keyof typeof PLATFORM_CATEGORIES; 