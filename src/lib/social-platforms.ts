export interface SocialPlatform {
  id: string;
  name: string;
  label: string;
  icon: string;
  placeholder: string;
  urlPattern?: RegExp;
  urlTemplate?: string;
  category: "social" | "professional" | "messaging" | "other";
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  // Professional
  {
    id: "linkedin",
    name: "LinkedIn",
    label: "LinkedIn Profile",
    icon: "🔗",
    placeholder: "https://linkedin.com/in/username",
    urlPattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
    urlTemplate: "https://linkedin.com/in/{username}",
    category: "professional",
  },
  {
    id: "github",
    name: "GitHub",
    label: "GitHub Profile",
    icon: "💻",
    placeholder: "https://github.com/username",
    urlPattern: /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
    urlTemplate: "https://github.com/{username}",
    category: "professional",
  },
  {
    id: "behance",
    name: "Behance",
    label: "Behance Portfolio",
    icon: "🎨",
    placeholder: "https://behance.net/username",
    urlPattern: /^https?:\/\/(www\.)?behance\.net\/[\w-]+\/?$/,
    urlTemplate: "https://behance.net/{username}",
    category: "professional",
  },
  {
    id: "dribbble",
    name: "Dribbble",
    label: "Dribbble Profile",
    icon: "🏀",
    placeholder: "https://dribbble.com/username",
    urlPattern: /^https?:\/\/(www\.)?dribbble\.com\/[\w-]+\/?$/,
    urlTemplate: "https://dribbble.com/{username}",
    category: "professional",
  },
  
  // Social Media
  {
    id: "twitter",
    name: "Twitter/X",
    label: "Twitter Profile",
    icon: "🐦",
    placeholder: "https://twitter.com/username",
    urlPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w-]+\/?$/,
    urlTemplate: "https://twitter.com/{username}",
    category: "social",
  },
  {
    id: "instagram",
    name: "Instagram",
    label: "Instagram Profile",
    icon: "📷",
    placeholder: "https://instagram.com/username",
    urlPattern: /^https?:\/\/(www\.)?instagram\.com\/[\w.-]+\/?$/,
    urlTemplate: "https://instagram.com/{username}",
    category: "social",
  },
  {
    id: "facebook",
    name: "Facebook",
    label: "Facebook Profile",
    icon: "👥",
    placeholder: "https://facebook.com/username",
    urlPattern: /^https?:\/\/(www\.)?facebook\.com\/[\w.-]+\/?$/,
    urlTemplate: "https://facebook.com/{username}",
    category: "social",
  },
  {
    id: "tiktok",
    name: "TikTok",
    label: "TikTok Profile",
    icon: "🎵",
    placeholder: "https://tiktok.com/@username",
    urlPattern: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/?$/,
    urlTemplate: "https://tiktok.com/@{username}",
    category: "social",
  },
  {
    id: "youtube",
    name: "YouTube",
    label: "YouTube Channel",
    icon: "📺",
    placeholder: "https://youtube.com/@username",
    urlPattern: /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|@)[\w-]+\/?$/,
    urlTemplate: "https://youtube.com/@{username}",
    category: "social",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    label: "Snapchat Profile",
    icon: "👻",
    placeholder: "https://snapchat.com/add/username",
    urlPattern: /^https?:\/\/(www\.)?snapchat\.com\/add\/[\w.-]+\/?$/,
    urlTemplate: "https://snapchat.com/add/{username}",
    category: "social",
  },
  
  // Messaging
  {
    id: "whatsapp",
    name: "WhatsApp",
    label: "WhatsApp Number",
    icon: "💬",
    placeholder: "+1234567890",
    urlTemplate: "https://wa.me/{phone}",
    category: "messaging",
  },
  {
    id: "telegram",
    name: "Telegram",
    label: "Telegram Username",
    icon: "✈️",
    placeholder: "@username",
    urlTemplate: "https://t.me/{username}",
    category: "messaging",
  },
  {
    id: "discord",
    name: "Discord",
    label: "Discord Username",
    icon: "🎮",
    placeholder: "username#1234",
    category: "messaging",
  },
  {
    id: "skype",
    name: "Skype",
    label: "Skype Username",
    icon: "📞",
    placeholder: "live:username",
    urlTemplate: "skype:{username}?call",
    category: "messaging",
  },
  
  // Other
  {
    id: "medium",
    name: "Medium",
    label: "Medium Profile",
    icon: "📝",
    placeholder: "https://medium.com/@username",
    urlPattern: /^https?:\/\/(www\.)?medium\.com\/@[\w.-]+\/?$/,
    urlTemplate: "https://medium.com/@{username}",
    category: "other",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    label: "Pinterest Profile",
    icon: "📌",
    placeholder: "https://pinterest.com/username",
    urlPattern: /^https?:\/\/(www\.)?pinterest\.com\/[\w.-]+\/?$/,
    urlTemplate: "https://pinterest.com/{username}",
    category: "other",
  },
  {
    id: "spotify",
    name: "Spotify",
    label: "Spotify Profile",
    icon: "🎧",
    placeholder: "https://open.spotify.com/user/username",
    urlPattern: /^https?:\/\/open\.spotify\.com\/user\/[\w.-]+\/?$/,
    urlTemplate: "https://open.spotify.com/user/{username}",
    category: "other",
  },
  {
    id: "twitch",
    name: "Twitch",
    label: "Twitch Channel",
    icon: "🎮",
    placeholder: "https://twitch.tv/username",
    urlPattern: /^https?:\/\/(www\.)?twitch\.tv\/[\w.-]+\/?$/,
    urlTemplate: "https://twitch.tv/{username}",
    category: "other",
  },
  {
    id: "website",
    name: "Website",
    label: "Personal Website",
    icon: "🌐",
    placeholder: "https://yourwebsite.com",
    category: "other",
  },
  {
    id: "blog",
    name: "Blog",
    label: "Personal Blog",
    icon: "📖",
    placeholder: "https://yourblog.com",
    category: "other",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    label: "Portfolio Website",
    icon: "💼",
    placeholder: "https://yourportfolio.com",
    category: "other",
  },
];

export const PLATFORM_CATEGORIES = {
  professional: "Professional",
  social: "Social Media",
  messaging: "Messaging",
  other: "Other",
} as const;

export function getPlatformById(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find(platform => platform.id === id);
}

export function getPlatformsByCategory(category: SocialPlatform['category']): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(platform => platform.category === category);
}

export function validatePlatformUrl(platform: SocialPlatform, url: string): boolean {
  if (!platform.urlPattern) return true; // No pattern means any URL is valid
  return platform.urlPattern.test(url);
}

export function generatePlatformUrl(platform: SocialPlatform, input: string): string {
  if (!platform.urlTemplate) return input;
  
  // Handle different input formats
  let processedInput = input;
  
  // Remove @ symbol for username-based platforms
  if (processedInput.startsWith('@')) {
    processedInput = processedInput.slice(1);
  }
  
  // For WhatsApp, clean phone number
  if (platform.id === 'whatsapp') {
    processedInput = processedInput.replace(/[^\d+]/g, '');
  }
  
  return platform.urlTemplate
    .replace('{username}', processedInput)
    .replace('{phone}', processedInput);
} 