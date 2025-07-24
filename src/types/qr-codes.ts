import type { QRCodeType, QRCodeStatus } from './database';
import type { MultiUrlData } from './multi-url';

// ================================
// QR CODE DATA TYPES
// ================================

// Basic QR Code data structure
export interface QRCodeData {
  // URL type
  url?: string;
  
  // Text type
  text?: string;
  
  // Phone type
  phone?: string;
  
  // vCard type - comprehensive business card data
  vcard?: VCardData;
  
  // WiFi type
  wifi?: WiFiData;
  
  // SMS type
  sms?: SMSData;
  
  // Email type
  email?: EmailData;
  
  // Location type
  location?: LocationData;
  
  // Event type
  event?: EventData;
  
  // App download type
  appDownload?: AppDownloadData;
  
  // Multi-URL type
  multiUrl?: MultiUrlData;
  
  // Menu type
  menu?: MenuData;
  
  // Payment type
  payment?: PaymentData;
  
  // PDF type
  pdf?: PDFData;
  
  // Image type
  image?: ImageData;
  
  // Video type
  video?: VideoData;
}

// ================================
// SPECIFIC QR CODE DATA TYPES
// ================================

export interface VCardData {
  // Basic information
  firstName: string;
  lastName: string;
  middleName?: string;
  nickname?: string;
  title?: string;
  organization?: string;
  department?: string;
  
  // Contact information
  email?: string;
  phone?: string;
  website?: string;
  
  // Address
  address?: string;
  addressComponents?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // Profile
  profileImage?: string;
  bio?: string;
  birthday?: string;
  anniversary?: string;
  note?: string;
  
  // Social media and professional links
  socialLinks?: Array<{
    id: string;
    platform: string;
    label: string;
    url: string;
    icon?: string;
    order: number;
  }>;
  
  // Custom fields
  customFields?: Array<{
    id: string;
    label: string;
    value: string;
    type: "text" | "email" | "phone" | "url";
    order: number;
  }>;
  
  // Additional professional info
  assistant?: string;
  assistantPhone?: string;
  companyLogo?: string;
}

export interface WiFiData {
  ssid: string;
  password?: string;
  security: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface SMSData {
  phone: string;
  message?: string;
}

export interface EmailData {
  email: string;
  subject?: string;
  body?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface EventData {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  timezone?: string;
  url?: string;
}

export interface AppDownloadData {
  appName: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  fallbackUrl?: string;
}

export interface MenuData {
  restaurantName: string;
  description?: string;
  logo?: string;
  categories: Array<{
    id: string;
    name: string;
    description?: string;
    items: Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      currency: string;
      image?: string;
      allergens?: string[];
      dietary?: string[];
      available?: boolean;
    }>;
  }>;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
}

export interface PaymentData {
  recipient: string;
  amount?: number;
  currency?: string;
  description?: string;
  paymentMethods: Array<{
    type: "paypal" | "venmo" | "cashapp" | "bitcoin" | "ethereum" | "bank";
    identifier: string;
    qrCode?: string;
  }>;
}

export interface PDFData {
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  thumbnail?: string;
}

export interface ImageData {
  title?: string;
  description?: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnail?: string;
}

export interface VideoData {
  title?: string;
  description?: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  thumbnail?: string;
  platform?: "youtube" | "vimeo" | "direct";
}

// ================================
// QR CODE STYLING
// ================================

export interface QRCodeStyle {
  foregroundColor?: string;
  backgroundColor?: string;
  cornerStyle?: "square" | "rounded" | "circle";
  patternStyle?: "square" | "rounded" | "circle";
  logoUrl?: string;
  logoSize?: number;
  logoPosition?: "center" | "top" | "bottom";
}

// ================================
// QR CODE GENERATION
// ================================

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QRCodeFormat = "png" | "svg" | "jpeg" | "pdf";
export type QRCodeMode = "static" | "dynamic";

export interface QRCodeGenerationOptions {
  errorCorrection: ErrorCorrectionLevel;
  size: number;
  format: QRCodeFormat;
  customization?: QRCodeStyle;
}

export interface QRCodeGenerationRequest {
  type: QRCodeType;
  mode: QRCodeMode;
  data: QRCodeData;
  options: QRCodeGenerationOptions;
  metadata?: {
    name?: string;
    description?: string;
    folderId?: string;
    templateId?: string;
    tags?: string[];
    expiresAt?: Date;
  };
}

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

// ================================
// QR CODE VALIDATION
// ================================

export interface QRCodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSize: number;
  recommendedErrorCorrection: ErrorCorrectionLevel;
}

export interface QRCodeLimits {
  maxLength: number;
  recommendedErrorCorrection: ErrorCorrectionLevel;
  requiredFields: string[];
  optionalFields: string[];
}

export type QRCodeTypeConfig = {
  [key in QRCodeType]: QRCodeLimits;
};

// ================================
// SHORT URL DATA
// ================================

export interface ShortUrlData {
  shortCode: string;
  originalData: string;
  qrType: QRCodeType;
  qrCodeId: string;
  userId: string;
  expiresAt?: Date;
}

// ================================
// CONSTANTS
// ================================

export const QR_CODE_LIMITS: QRCodeTypeConfig = {
  url: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["url"],
    optionalFields: [],
  },
  vcard: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["firstName", "lastName"],
    optionalFields: ["title", "organization", "email", "phone", "website", "address", "profileImage", "bio", "socialLinks", "customFields"],
  },
  wifi: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["ssid", "security"],
    optionalFields: ["password", "hidden"],
  },
  text: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["text"],
    optionalFields: [],
  },
  sms: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["phone"],
    optionalFields: ["message"],
  },
  email: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["email"],
    optionalFields: ["subject", "body"],
  },
  phone: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["phone"],
    optionalFields: [],
  },
  location: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["latitude", "longitude"],
    optionalFields: ["name", "address"],
  },
  event: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["title", "startDate"],
    optionalFields: ["description", "location", "endDate", "allDay", "timezone", "url"],
  },
  app_download: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["appName"],
    optionalFields: ["appStoreUrl", "playStoreUrl", "fallbackUrl"],
  },
  multi_url: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["links"],
    optionalFields: ["title", "description", "theme", "seo", "socialMedia", "features"],
  },
  menu: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["restaurantName", "categories"],
    optionalFields: ["description", "logo", "contact"],
  },
  payment: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["recipient", "paymentMethods"],
    optionalFields: ["amount", "currency", "description"],
  },
  pdf: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["title", "fileUrl", "fileName"],
    optionalFields: ["description", "fileSize", "pageCount", "thumbnail"],
  },
  image: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["imageUrl", "fileName"],
    optionalFields: ["title", "description", "fileSize", "dimensions", "thumbnail"],
  },
  video: {
    maxLength: 2953,
    recommendedErrorCorrection: "M",
    requiredFields: ["videoUrl", "fileName"],
    optionalFields: ["title", "description", "fileSize", "duration", "thumbnail", "platform"],
  },
};

export const DEFAULT_QR_CODE_SETTINGS = {
  size: 512,
  format: "png" as QRCodeFormat,
  errorCorrection: "M" as ErrorCorrectionLevel,
  style: {
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
  },
} as const;

export const ERROR_CORRECTION_LEVELS = {
  L: { name: "Low", recovery: "~7%", description: "Suitable for clean environments" },
  M: { name: "Medium", recovery: "~15%", description: "Balanced option for most use cases" },
  Q: { name: "Quartile", recovery: "~25%", description: "Good for environments with some damage" },
  H: { name: "High", recovery: "~30%", description: "Best for harsh environments or logo embedding" },
} as const;

export const QR_CODE_SIZES = {
  small: 256,
  medium: 512,
  large: 1024,
  xlarge: 2048,
} as const; 