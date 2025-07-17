import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/server/db/types";

// ================================
// SOCIAL MEDIA PLATFORM SERVICE
// ================================

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

export const SOCIAL_MEDIA_PLATFORMS: Record<SocialPlatform, SocialMediaPlatformInfo> = {
  facebook: {
    platform: "facebook",
    name: "Facebook",
    color: "#1877F2",
    icon: "📘",
    urlPatterns: [
      /^https?:\/\/(www\.)?facebook\.com\/([a-zA-Z0-9.]+)/,
      /^https?:\/\/(www\.)?fb\.me\/([a-zA-Z0-9.]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/facebook\.com\/([a-zA-Z0-9.]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  instagram: {
    platform: "instagram",
    name: "Instagram",
    color: "#E4405F",
    icon: "📷",
    urlPatterns: [
      /^https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  twitter: {
    platform: "twitter",
    name: "Twitter",
    color: "#1DA1F2",
    icon: "🐦",
    urlPatterns: [
      /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)/,
      /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  linkedin: {
    platform: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    icon: "💼",
    urlPatterns: [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/,
      /^https?:\/\/(www\.)?linkedin\.com\/company\/([a-zA-Z0-9-]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  tiktok: {
    platform: "tiktok",
    name: "TikTok",
    color: "#000000",
    icon: "🎵",
    urlPatterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  youtube: {
    platform: "youtube",
    name: "YouTube",
    color: "#FF0000",
    icon: "📺",
    urlPatterns: [
      /^https?:\/\/(www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/youtube\.com\/(?:channel|c|@|user)\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  snapchat: {
    platform: "snapchat",
    name: "Snapchat",
    color: "#FFFC00",
    icon: "👻",
    urlPatterns: [
      /^https?:\/\/(www\.)?snapchat\.com\/add\/([a-zA-Z0-9_.]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/snapchat\.com\/add\/([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
  whatsapp: {
    platform: "whatsapp",
    name: "WhatsApp",
    color: "#25D366",
    icon: "💬",
    urlPatterns: [
      /^https?:\/\/(www\.)?wa\.me\/([0-9]+)/,
      /^https?:\/\/(www\.)?whatsapp\.com\/([0-9]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/(?:wa\.me|whatsapp\.com)\/([0-9]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
  telegram: {
    platform: "telegram",
    name: "Telegram",
    color: "#0088CC",
    icon: "✈️",
    urlPatterns: [
      /^https?:\/\/(www\.)?t\.me\/([a-zA-Z0-9_]+)/,
      /^https?:\/\/(www\.)?telegram\.me\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
  discord: {
    platform: "discord",
    name: "Discord",
    color: "#5865F2",
    icon: "🎮",
    urlPatterns: [
      /^https?:\/\/(www\.)?discord\.gg\/([a-zA-Z0-9]+)/,
      /^https?:\/\/(www\.)?discord\.com\/invite\/([a-zA-Z0-9]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
  github: {
    platform: "github",
    name: "GitHub",
    color: "#181717",
    icon: "💻",
    urlPatterns: [
      /^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9-]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/github\.com\/([a-zA-Z0-9-]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  behance: {
    platform: "behance",
    name: "Behance",
    color: "#1769FF",
    icon: "🎨",
    urlPatterns: [
      /^https?:\/\/(www\.)?behance\.net\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/behance\.net\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  dribbble: {
    platform: "dribbble",
    name: "Dribbble",
    color: "#EA4C89",
    icon: "🏀",
    urlPatterns: [
      /^https?:\/\/(www\.)?dribbble\.com\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/dribbble\.com\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  medium: {
    platform: "medium",
    name: "Medium",
    color: "#00AB6C",
    icon: "📝",
    urlPatterns: [
      /^https?:\/\/(www\.)?medium\.com\/@([a-zA-Z0-9_]+)/,
      /^https?:\/\/([a-zA-Z0-9-]+)\.medium\.com/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/medium\.com\/@([a-zA-Z0-9_]+)|([a-zA-Z0-9-]+)\.medium\.com/);
      return match ? (match[1] || match[2]) : null;
    },
    supportsFollowerCount: true,
  },
  spotify: {
    platform: "spotify",
    name: "Spotify",
    color: "#1DB954",
    icon: "🎵",
    urlPatterns: [
      /^https?:\/\/(www\.)?open\.spotify\.com\/user\/([a-zA-Z0-9_]+)/,
      /^https?:\/\/(www\.)?open\.spotify\.com\/artist\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/open\.spotify\.com\/(?:user|artist)\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  "apple-music": {
    platform: "apple-music",
    name: "Apple Music",
    color: "#FA243C",
    icon: "🍎",
    urlPatterns: [
      /^https?:\/\/(www\.)?music\.apple\.com\/([a-zA-Z0-9_/-]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/music\.apple\.com\/([a-zA-Z0-9_/-]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
  soundcloud: {
    platform: "soundcloud",
    name: "SoundCloud",
    color: "#FF3300",
    icon: "🎧",
    urlPatterns: [
      /^https?:\/\/(www\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/soundcloud\.com\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  twitch: {
    platform: "twitch",
    name: "Twitch",
    color: "#9146FF",
    icon: "🎮",
    urlPatterns: [
      /^https?:\/\/(www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  vimeo: {
    platform: "vimeo",
    name: "Vimeo",
    color: "#1AB7EA",
    icon: "🎬",
    urlPatterns: [
      /^https?:\/\/(www\.)?vimeo\.com\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/vimeo\.com\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  pinterest: {
    platform: "pinterest",
    name: "Pinterest",
    color: "#BD081C",
    icon: "📌",
    urlPatterns: [
      /^https?:\/\/(www\.)?pinterest\.com\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/pinterest\.com\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  reddit: {
    platform: "reddit",
    name: "Reddit",
    color: "#FF4500",
    icon: "🤖",
    urlPatterns: [
      /^https?:\/\/(www\.)?reddit\.com\/u\/([a-zA-Z0-9_]+)/,
      /^https?:\/\/(www\.)?reddit\.com\/user\/([a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/reddit\.com\/(?:u|user)\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  tumblr: {
    platform: "tumblr",
    name: "Tumblr",
    color: "#00CF35",
    icon: "📱",
    urlPatterns: [
      /^https?:\/\/([a-zA-Z0-9-]+)\.tumblr\.com/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/([a-zA-Z0-9-]+)\.tumblr\.com/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  mastodon: {
    platform: "mastodon",
    name: "Mastodon",
    color: "#563ACC",
    icon: "🐘",
    urlPatterns: [
      /^https?:\/\/([a-zA-Z0-9.-]+)\/(@[a-zA-Z0-9_]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/\/(@[a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
  threads: {
    platform: "threads",
    name: "Threads",
    color: "#000000",
    icon: "🧵",
    urlPatterns: [
      /^https?:\/\/(www\.)?threads\.net\/@([a-zA-Z0-9_.]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/threads\.net\/@([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: true,
  },
  bluesky: {
    platform: "bluesky",
    name: "Bluesky",
    color: "#00A8E8",
    icon: "🦋",
    urlPatterns: [
      /^https?:\/\/(www\.)?bsky\.app\/profile\/([a-zA-Z0-9_.]+)/,
    ],
    usernameExtractor: (url) => {
      const match = url.match(/bsky\.app\/profile\/([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
    supportsFollowerCount: false,
  },
};

export class SocialMediaService {
  /**
   * Detects the social media platform from a URL
   */
  static detectPlatform(url: string): SocialMediaPlatformInfo | null {
    for (const platform of Object.values(SOCIAL_MEDIA_PLATFORMS)) {
      for (const pattern of platform.urlPatterns) {
        if (pattern.test(url)) {
          return platform;
        }
      }
    }
    return null;
  }

  /**
   * Extracts username from a social media URL
   */
  static extractUsername(url: string): { platform: SocialPlatform; username: string } | null {
    const platformInfo = this.detectPlatform(url);
    if (!platformInfo || !platformInfo.usernameExtractor) {
      return null;
    }

    const username = platformInfo.usernameExtractor(url);
    if (!username) {
      return null;
    }

    return {
      platform: platformInfo.platform,
      username,
    };
  }

  /**
   * Gets platform-specific styling for a social media link
   */
  static getPlatformStyling(platform: SocialPlatform): {
    color: string;
    icon: string;
    name: string;
  } {
    const platformInfo = SOCIAL_MEDIA_PLATFORMS[platform];
    return {
      color: platformInfo.color,
      icon: platformInfo.icon,
      name: platformInfo.name,
    };
  }

  /**
   * Validates if a URL is a supported social media platform
   */
  static isValidSocialUrl(url: string): boolean {
    return this.detectPlatform(url) !== null;
  }

  /**
   * Gets all supported platforms
   */
  static getAllPlatforms(): SocialMediaPlatformInfo[] {
    return Object.values(SOCIAL_MEDIA_PLATFORMS);
  }

  /**
   * Auto-detects and formats social media links
   */
  static autoDetectAndFormat(links: Array<{ title: string; url: string; icon?: string }>): Array<{
    title: string;
    url: string;
    icon?: string;
    platform?: SocialPlatform;
    username?: string;
    color?: string;
    autoDetected?: boolean;
  }> {
    return links.map((link) => {
      const detection = this.extractUsername(link.url);
      if (detection) {
        const styling = this.getPlatformStyling(detection.platform);
        return {
          ...link,
          platform: detection.platform,
          username: detection.username,
          color: styling.color,
          icon: link.icon || styling.icon,
          autoDetected: true,
        };
      }
      return { ...link, autoDetected: false };
    });
  }
} 