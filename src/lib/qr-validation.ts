import { z } from "zod";
import { 
  type QRCodeData, 
  type QRCodeType, 
  type QRCodeValidationResult, 
  type ErrorCorrectionLevel,
  QR_CODE_LIMITS
} from "@/server/db/types";

// ================================
// VALIDATION SCHEMAS
// ================================

// URL validation schema
const urlSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .max(2953, "URL exceeds QR code character limit (2,953 characters)")
    .refine((url) => {
      // Add protocol if missing for validation
      const urlWithProtocol = url.startsWith("http://") || url.startsWith("https://") 
        ? url 
        : `https://${url}`;
      
      try {
        const urlObj = new URL(urlWithProtocol);
        
        // Validate protocol
        if (!["http:", "https:"].includes(urlObj.protocol)) {
          return false;
        }
        
        // Validate domain (basic check)
        if (!urlObj.hostname || urlObj.hostname.length < 1) {
          return false;
        }
        
        // Check for dangerous domains (basic blacklist)
        const dangerousDomains = [
          "malware.com", "phishing.com", "scam.com", "spam.com",
          "bit.ly/malware", "tinyurl.com/malware"
        ];
        
        if (dangerousDomains.some(domain => urlObj.hostname.includes(domain))) {
          return false;
        }
        
        // Prevent javascript: and data: URLs
        if (urlObj.protocol === "javascript:" || urlObj.protocol === "data:") {
          return false;
        }
        
        return true;
      } catch {
        return false;
      }
    }, "Invalid URL format or contains dangerous content"),
});

// vCard validation schema
const vcardSchema = z.object({
  vcard: z.object({
    // Required fields (FN)
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    
    // Standard vCard fields
    organization: z.string().max(100, "Organization name too long").optional(),
    title: z.string().max(100, "Title too long").optional(),
    email: z.string().email("Invalid email format").max(100, "Email too long").optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format").optional(),
    website: z.string().url("Invalid website URL").max(200, "Website URL too long").optional(),
    address: z.string().max(200, "Address too long").optional(),
    
    // Extended fields (vCard Plus)
    // Social Media
    linkedin: z.string().url("Invalid LinkedIn URL").max(200, "LinkedIn URL too long").optional(),
    twitter: z.string().max(50, "Twitter handle too long").optional(),
    instagram: z.string().max(50, "Instagram username too long").optional(),
    facebook: z.string().url("Invalid Facebook URL").max(200, "Facebook URL too long").optional(),
    
    // Additional Contact Methods
    whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp number format").optional(),
    skype: z.string().max(50, "Skype username too long").optional(),
    telegram: z.string().max(50, "Telegram handle too long").optional(),
    
    // Professional Info
    department: z.string().max(100, "Department name too long").optional(),
    assistant: z.string().max(100, "Assistant name too long").optional(),
    assistantPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid assistant phone format").optional(),
    companyLogo: z.string().url("Invalid company logo URL").max(500, "Company logo URL too long").optional(),
    
    // Additional fields
    middleName: z.string().max(50, "Middle name too long").optional(),
    nickname: z.string().max(50, "Nickname too long").optional(),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid birthday format (YYYY-MM-DD)").optional(),
    anniversary: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid anniversary format (YYYY-MM-DD)").optional(),
    note: z.string().max(500, "Note too long").optional(),
    
    // Address components (structured)
    addressComponents: z.object({
      street: z.string().max(100, "Street too long").optional(),
      city: z.string().max(50, "City too long").optional(),
      state: z.string().max(50, "State too long").optional(),
      postalCode: z.string().max(20, "Postal code too long").optional(),
      country: z.string().max(50, "Country too long").optional(),
    }).optional(),
    
    // Custom fields
    customFields: z.array(z.object({
      label: z.string().max(50, "Custom field label too long"),
      value: z.string().max(200, "Custom field value too long"),
      type: z.enum(["text", "email", "phone", "url"]).default("text"),
    })).max(5, "Too many custom fields").optional(),
  }),
});

// WiFi validation schema
const wifiSchema = z.object({
  wifi: z.object({
    ssid: z.string()
      .min(1, "SSID is required")
      .max(32, "SSID exceeds maximum length (32 characters)")
      .refine((ssid) => {
        // Check for valid characters (printable ASCII)
        const validChars = /^[\x20-\x7E]*$/;
        return validChars.test(ssid);
      }, "SSID contains invalid characters"),
    
    password: z.string()
      .max(63, "Password exceeds maximum length (63 characters)")
      .min(8, "Password must be at least 8 characters long")
      .optional(),
    
    security: z.enum(["WPA", "WPA2", "WPA3", "WEP", "nopass"], {
      errorMap: () => ({ message: "Invalid security type. Must be WPA, WPA2, WPA3, WEP, or nopass" }),
    }),
    
    hidden: z.boolean().default(false).optional(),
    
    // Additional WiFi configuration options
    eap: z.enum(["NONE", "PEAP", "TLS", "TTLS", "PWD", "SIM", "AKA", "AKA_PRIME"]).optional(),
    identity: z.string().max(100, "Identity too long").optional(),
    anonymousIdentity: z.string().max(100, "Anonymous identity too long").optional(),
    phase2: z.enum(["NONE", "PAP", "MSCHAP", "MSCHAPV2", "GTC"]).optional(),
  }).refine((data) => {
    // Validate password requirement based on security type
    if (data.security !== "nopass" && !data.password) {
      return false;
    }
    return true;
  }, "Password is required for secured networks"),
});

// Text validation schema
const textSchema = z.object({
  text: z.string().min(1, "Text content is required").max(2000, "Text too long"),
});

// SMS validation schema
const smsSchema = z.object({
  sms: z.object({
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
    message: z.string().min(1, "Message is required").max(160, "Message too long"),
  }),
});

// Email validation schema
const emailSchema = z.object({
  email: z.object({
    to: z.string().email("Invalid email format"),
    subject: z.string().max(100, "Subject too long").optional(),
    body: z.string().max(500, "Body too long").optional(),
  }),
});

// Phone validation schema
const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
});

// Location validation schema
const locationSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
    longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
    address: z.string().max(200, "Address too long").optional(),
  }),
});

// Event validation schema
const eventSchema = z.object({
  event: z.object({
    title: z.string().min(1, "Event title is required").max(100, "Title too long"),
    description: z.string().max(500, "Description too long").optional(),
    location: z.string().max(200, "Location too long").optional(),
    startDate: z.string().datetime("Invalid start date format"),
    endDate: z.string().datetime("Invalid end date format").optional(),
    allDay: z.boolean().optional(),
  }),
});

// App download validation schema
const appDownloadSchema = z.object({
  appDownload: z.object({
    appName: z.string().min(1, "App name is required").max(100, "App name too long"),
    androidUrl: z.string().url("Invalid Android URL").optional(),
    iosUrl: z.string().url("Invalid iOS URL").optional(),
    fallbackUrl: z.string().url("Invalid fallback URL").optional(),
  }),
});

// Multi-URL validation schema - Enhanced for comprehensive landing pages
const multiUrlSchema = z.object({
  multiUrl: z.object({
    // Basic Information
    title: z.string().max(100, "Title too long").optional(),
    description: z.string().max(500, "Description too long").optional(),
    bio: z.string().max(500, "Bio too long").optional(),
    
    // Profile Information
    profileImage: z.string().url("Invalid profile image URL").optional(),
    profileName: z.string().max(100, "Profile name too long").optional(),
    profileTitle: z.string().max(100, "Profile title too long").optional(),
    
    // Links with enhanced validation
    links: z.array(z.object({
      id: z.string().min(1, "Link ID is required"),
      title: z.string().min(1, "Link title is required").max(100, "Link title too long"),
      url: z.string().url("Invalid URL format"),
      description: z.string().max(200, "Link description too long").optional(),
      icon: z.string().max(200, "Icon path too long").optional(),
      iconType: z.enum(["emoji", "image", "platform"]).optional(),
      platform: z.string().max(50, "Platform name too long").optional(),
      
      // Link Styling
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid background color").optional(),
      textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid text color").optional(),
      borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid border color").optional(),
      borderRadius: z.number().min(0).max(50, "Border radius too large").optional(),
      
      // Link Scheduling
      isActive: z.boolean().optional(),
      scheduledStart: z.string().datetime().optional(),
      scheduledEnd: z.string().datetime().optional(),
      timezone: z.string().max(50, "Timezone too long").optional(),
      
      // Link Analytics
      clickCount: z.number().min(0).optional(),
      lastClicked: z.string().datetime().optional(),
      
      // Link Type
      linkType: z.enum(["standard", "social", "email", "phone", "app", "file", "contact"]).optional(),
      
      // Additional metadata
      metadata: z.object({
        subject: z.string().max(200, "Subject too long").optional(),
        body: z.string().max(1000, "Body too long").optional(),
        downloadFilename: z.string().max(100, "Filename too long").optional(),
        appStoreUrl: z.string().url("Invalid App Store URL").optional(),
        playStoreUrl: z.string().url("Invalid Play Store URL").optional(),
      }).optional(),
    })).min(1, "At least one link is required").max(50, "Too many links"),
    
    // Theme and Branding (optional, extensive validation)
    theme: z.object({
      templateId: z.string().max(50, "Template ID too long").optional(),
      themeName: z.enum(["professional", "creative", "minimalist", "dark", "neon", "vintage", "gradient"]).optional(),
      
      branding: z.object({
        logo: z.string().url("Invalid logo URL").optional(),
        logoPosition: z.enum(["top", "center", "floating"]).optional(),
        logoSize: z.number().min(16).max(200, "Logo size too large").optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid primary color").optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid secondary color").optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid accent color").optional(),
        textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid text color").optional(),
        backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid background color").optional(),
        
        backgroundType: z.enum(["solid", "gradient", "image", "video", "animated"]).optional(),
        backgroundGradient: z.object({
          type: z.enum(["linear", "radial"]),
          colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid gradient color")).min(2).max(5),
          direction: z.string().max(20, "Direction too long").optional(),
        }).optional(),
        backgroundImage: z.string().url("Invalid background image URL").optional(),
        backgroundVideo: z.string().url("Invalid background video URL").optional(),
        backgroundOverlay: z.object({
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid overlay color"),
          opacity: z.number().min(0).max(1, "Opacity must be between 0 and 1"),
        }).optional(),
      }).optional(),
      
      typography: z.object({
        fontFamily: z.string().max(100, "Font family too long").optional(),
        fontSize: z.object({
          title: z.number().min(12).max(72, "Title font size too large").optional(),
          description: z.number().min(10).max(32, "Description font size too large").optional(),
          links: z.number().min(10).max(24, "Link font size too large").optional(),
        }).optional(),
        fontWeight: z.object({
          title: z.number().min(100).max(900, "Invalid title font weight").optional(),
          description: z.number().min(100).max(900, "Invalid description font weight").optional(),
          links: z.number().min(100).max(900, "Invalid link font weight").optional(),
        }).optional(),
        textAlign: z.enum(["left", "center", "right"]).optional(),
        lineHeight: z.number().min(1).max(3, "Line height too large").optional(),
      }).optional(),
      
      layout: z.object({
        containerWidth: z.number().min(280).max(800, "Container width too large").optional(),
        linkSpacing: z.number().min(4).max(40, "Link spacing too large").optional(),
        padding: z.number().min(8).max(80, "Padding too large").optional(),
        borderRadius: z.number().min(0).max(50, "Border radius too large").optional(),
        
        linkLayout: z.enum(["list", "grid", "masonry"]).optional(),
        linkColumns: z.number().min(1).max(4, "Too many columns").optional(),
        linkButtonStyle: z.enum(["rounded", "square", "pill", "custom"]).optional(),
        
        animations: z.object({
          entrance: z.string().max(50, "Animation name too long").optional(),
          hover: z.string().max(50, "Animation name too long").optional(),
          click: z.string().max(50, "Animation name too long").optional(),
        }).optional(),
      }).optional(),
      
      customCss: z.string().max(10000, "Custom CSS too long").optional(),
    }).optional(),
    
    // SEO and Social Media (optional)
    seo: z.object({
      metaTitle: z.string().max(60, "Meta title too long").optional(),
      metaDescription: z.string().max(160, "Meta description too long").optional(),
      keywords: z.array(z.string().max(50, "Keyword too long")).max(10, "Too many keywords").optional(),
      
      ogTitle: z.string().max(60, "OG title too long").optional(),
      ogDescription: z.string().max(160, "OG description too long").optional(),
      ogImage: z.string().url("Invalid OG image URL").optional(),
      ogType: z.string().max(20, "OG type too long").optional(),
      
      twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
      twitterTitle: z.string().max(60, "Twitter title too long").optional(),
      twitterDescription: z.string().max(160, "Twitter description too long").optional(),
      twitterImage: z.string().url("Invalid Twitter image URL").optional(),
      twitterSite: z.string().max(50, "Twitter site too long").optional(),
      twitterCreator: z.string().max(50, "Twitter creator too long").optional(),
    }).optional(),
    
    // Social Media Integration (optional)
    socialMedia: z.object({
      platforms: z.array(z.object({
        platform: z.string().max(30, "Platform name too long"),
        username: z.string().max(50, "Username too long").optional(),
        url: z.string().url("Invalid social media URL"),
        displayFollowerCount: z.boolean().optional(),
        followerCount: z.number().min(0).optional(),
        isVerified: z.boolean().optional(),
        autoDetected: z.boolean().optional(),
      })).max(20, "Too many social media platforms"),
      
      showSocialProof: z.boolean().optional(),
      socialProofText: z.string().max(100, "Social proof text too long").optional(),
    }).optional(),
    
    // Advanced Features (optional)
    features: z.object({
      pwaEnabled: z.boolean().optional(),
      pwaName: z.string().max(30, "PWA name too long").optional(),
      pwaShortName: z.string().max(12, "PWA short name too long").optional(),
      pwaDescription: z.string().max(200, "PWA description too long").optional(),
      pwaIcon: z.string().url("Invalid PWA icon URL").optional(),
      
      trackingEnabled: z.boolean().optional(),
      trackingCode: z.string().max(100, "Tracking code too long").optional(),
      
      contactFormEnabled: z.boolean().optional(),
      contactFormFields: z.array(z.object({
        name: z.string().max(50, "Field name too long"),
        type: z.enum(["text", "email", "phone", "textarea", "select"]),
        label: z.string().max(100, "Field label too long"),
        required: z.boolean().optional(),
        options: z.array(z.string().max(50, "Option too long")).optional(),
      })).max(10, "Too many form fields").optional(),
      
      customDomain: z.string().max(100, "Custom domain too long").optional(),
      
      passwordProtected: z.boolean().optional(),
      password: z.string().max(100, "Password too long").optional(),
      
      geoRestrictions: z.object({
        allowedCountries: z.array(z.string().length(2, "Invalid country code")).optional(),
        blockedCountries: z.array(z.string().length(2, "Invalid country code")).optional(),
      }).optional(),
      
      accessSchedule: z.object({
        timezone: z.string().max(50, "Timezone too long").optional(),
        schedule: z.array(z.object({
          day: z.number().min(0).max(6, "Invalid day"),
          startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
          endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        })).max(7, "Too many schedule entries").optional(),
      }).optional(),
    }).optional(),
    
    // Analytics and Tracking (optional, read-only)
    analytics: z.object({
      totalViews: z.number().min(0).optional(),
      uniqueViews: z.number().min(0).optional(),
      totalClicks: z.number().min(0).optional(),
      lastViewed: z.string().datetime().optional(),
      
      viewsByCountry: z.record(z.number().min(0)).optional(),
      viewsByDevice: z.record(z.number().min(0)).optional(),
      viewsByReferrer: z.record(z.number().min(0)).optional(),
      clicksByLink: z.record(z.number().min(0)).optional(),
      
      conversionGoals: z.array(z.object({
        id: z.string().max(50, "Goal ID too long"),
        name: z.string().max(100, "Goal name too long"),
        linkId: z.string().max(50, "Link ID too long").optional(),
        targetUrl: z.string().url("Invalid target URL").optional(),
        conversionCount: z.number().min(0).optional(),
      })).max(10, "Too many conversion goals").optional(),
    }).optional(),
  }),
});

// Menu validation schema
const menuSchema = z.object({
  menu: z.object({
    restaurantName: z.string().min(1, "Restaurant name is required").max(100, "Restaurant name too long"),
    categories: z.array(z.object({
      name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
      items: z.array(z.object({
        name: z.string().min(1, "Item name is required").max(100, "Item name too long"),
        description: z.string().max(200, "Description too long").optional(),
        price: z.number().min(0, "Price must be positive").optional(),
        allergens: z.array(z.string().max(20, "Allergen name too long")).optional(),
        available: z.boolean().optional(),
      })).min(1, "At least one item is required"),
    })).min(1, "At least one category is required"),
  }),
});

// Payment validation schema
const paymentSchema = z.object({
  payment: z.object({
    type: z.enum(["upi", "paypal", "crypto", "bank"], {
      errorMap: () => ({ message: "Invalid payment type" }),
    }),
    address: z.string().min(1, "Payment address is required").max(200, "Address too long"),
    amount: z.number().min(0, "Amount must be positive").optional(),
    currency: z.string().length(3, "Invalid currency code").optional(),
    note: z.string().max(100, "Note too long").optional(),
  }),
});

// PDF validation schema
const pdfSchema = z.object({
  pdf: z.object({
    fileUrl: z.string().url("Invalid PDF URL"),
    title: z.string().max(100, "Title too long").optional(),
    description: z.string().max(200, "Description too long").optional(),
  }),
});

// Image validation schema
const imageSchema = z.object({
  image: z.object({
    imageUrl: z.string().url("Invalid image URL"),
    title: z.string().max(100, "Title too long").optional(),
    description: z.string().max(200, "Description too long").optional(),
  }),
});

// Video validation schema
const videoSchema = z.object({
  video: z.object({
    videoUrl: z.string().url("Invalid video URL"),
    title: z.string().max(100, "Title too long").optional(),
    description: z.string().max(200, "Description too long").optional(),
  }),
});

// ================================
// VALIDATION FUNCTIONS
// ================================

/**
 * Validates QR code data based on type
 */
export function validateQRCodeData(type: QRCodeType, data: QRCodeData): QRCodeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate based on type
    switch (type) {
      case "url":
        urlSchema.parse(data);
        break;
      case "vcard":
        vcardSchema.parse(data);
        break;
      case "wifi":
        wifiSchema.parse(data);
        break;
      case "text":
        textSchema.parse(data);
        break;
      case "sms":
        smsSchema.parse(data);
        break;
      case "email":
        emailSchema.parse(data);
        break;
      case "phone":
        phoneSchema.parse({ phone: (data as { phone?: string }).phone });
        break;
      case "location":
        locationSchema.parse(data);
        break;
      case "event":
        eventSchema.parse(data);
        break;
      case "app_download":
        appDownloadSchema.parse({ appDownload: (data as { appDownload?: unknown }).appDownload });
        break;
      case "multi_url":
        multiUrlSchema.parse(data);
        break;
      case "menu":
        menuSchema.parse(data);
        break;
      case "payment":
        paymentSchema.parse(data);
        break;
      case "pdf":
        pdfSchema.parse(data);
        break;
      case "image":
        imageSchema.parse(data);
        break;
      case "video":
        videoSchema.parse(data);
        break;
      default:
        errors.push(`Unsupported QR code type: ${type as string}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message));
    } else {
      errors.push("Unknown validation error");
    }
  }

  // Estimate data size
  const dataString = JSON.stringify(data);
  const estimatedSize = dataString.length;

  // Check against limits
  const limits = QR_CODE_LIMITS[type];
  if (estimatedSize > limits.maxLength) {
    errors.push(`Data exceeds maximum length of ${limits.maxLength} characters`);
  }

  // Add warnings for size optimization
  if (estimatedSize > limits.maxLength * 0.8) {
    warnings.push("Data is close to maximum limit, consider reducing content");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    estimatedSize,
    recommendedErrorCorrection: limits.recommendedErrorCorrection,
  };
}

/**
 * Validates required fields for a QR code type
 */
export function validateRequiredFields(type: QRCodeType, data: QRCodeData): string[] {
  const errors: string[] = [];
  const limits = QR_CODE_LIMITS[type];

  // Check required fields based on type
  for (const field of limits.requiredFields) {
    const value = getNestedValue(data, field);
    if (!value || (typeof value === "string" && value.trim() === "")) {
      errors.push(`${field} is required for ${type} QR codes`);
    }
  }

  return errors;
}

/**
 * Validates character encoding for QR codes
 */
export function validateCharacterEncoding(data: string): {
  isValid: boolean;
  encoding: "UTF-8" | "ISO-8859-1" | "Shift_JIS";
  errors: string[];
} {
  const errors: string[] = [];
  let encoding: "UTF-8" | "ISO-8859-1" | "Shift_JIS" = "UTF-8";

  try {
    // Check for UTF-8 compatibility
    const utf8Encoded = new TextEncoder().encode(data);
    const utf8Decoded = new TextDecoder("utf-8").decode(utf8Encoded);
    
    if (utf8Decoded !== data) {
      errors.push("Data contains invalid UTF-8 characters");
    }

    // Check for special characters that might cause issues
    const problematicChars = /[\u0000-\u001F\u007F-\u009F]/g;
    if (problematicChars.test(data)) {
      errors.push("Data contains control characters that may cause scanning issues");
    }

    // Estimate encoding efficiency
    if (data.length > utf8Encoded.length) {
      encoding = "ISO-8859-1"; // More efficient for Latin characters
    }

  } catch (error) {
    errors.push("Character encoding validation failed");
  }

  return {
    isValid: errors.length === 0,
    encoding,
    errors,
  };
}

/**
 * Recommends error correction level based on use case
 */
export function recommendErrorCorrection(
  type: QRCodeType,
  useCase: "print" | "digital" | "harsh" = "digital",
  hasLogo = false
): ErrorCorrectionLevel {
  const baseLimits = QR_CODE_LIMITS[type];
  let recommended = baseLimits.recommendedErrorCorrection;

  // Adjust based on use case
  if (useCase === "print" || hasLogo) {
    recommended = "H"; // Higher error correction for print/logo
  } else if (useCase === "harsh") {
    recommended = "Q"; // Medium-high for harsh environments
  }

  // Special cases for critical data
  if (type === "wifi" || type === "payment") {
    recommended = "H"; // Critical data needs high error correction
  }

  return recommended;
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown> | QRCodeData, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Estimates QR code version based on data length and error correction
 */
export function estimateQRCodeVersion(
  dataLength: number,
  errorCorrection: ErrorCorrectionLevel
): number {
  // QR code capacity table (approximate)
  const capacityTable = {
    L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
    M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
    Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482, 509, 565, 611, 661, 715, 751, 805, 868, 908, 982, 1030, 1112, 1168, 1228, 1283, 1351, 1423, 1499, 1579, 1663],
    H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382, 403, 439, 461, 511, 535, 593, 625, 658, 698, 742, 790, 842, 898, 958, 983, 1051, 1093, 1139, 1219, 1273]
  };

      const capacities = capacityTable[errorCorrection];
    
    if (!capacities) {
      return 40; // Maximum QR version for unknown error correction
    }
    
    for (let i = 0; i < capacities.length; i++) {
      const capacity = capacities[i];
      if (capacity && dataLength <= capacity) {
        return i + 1; // QR versions are 1-indexed
      }
    }
  
  return 40; // Maximum QR version
}

/**
 * Calculates QR code modules (size) based on version
 */
export function calculateQRCodeModules(version: number): number {
  return 21 + (version - 1) * 4;
} 