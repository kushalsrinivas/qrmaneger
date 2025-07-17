import { z } from "zod";
import { 
  QRCodeData, 
  QRCodeType, 
  QRCodeValidationResult, 
  QR_CODE_LIMITS, 
  ErrorCorrectionLevel 
} from "@/server/db/types";

// ================================
// VALIDATION SCHEMAS
// ================================

// URL validation schema
const urlSchema = z.object({
  url: z.string().url("Invalid URL format").max(2000, "URL too long"),
});

// vCard validation schema
const vcardSchema = z.object({
  vcard: z.object({
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    organization: z.string().max(100, "Organization name too long").optional(),
    title: z.string().max(100, "Title too long").optional(),
    email: z.string().email("Invalid email format").max(100, "Email too long").optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format").optional(),
    website: z.string().url("Invalid website URL").max(200, "Website URL too long").optional(),
    address: z.string().max(200, "Address too long").optional(),
  }),
});

// WiFi validation schema
const wifiSchema = z.object({
  wifi: z.object({
    ssid: z.string().min(1, "SSID is required").max(32, "SSID too long"),
    password: z.string().max(63, "Password too long"),
    security: z.enum(["WPA", "WPA2", "WEP", "nopass"], {
      errorMap: () => ({ message: "Invalid security type" }),
    }),
    hidden: z.boolean().optional(),
  }),
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

// Multi-URL validation schema
const multiUrlSchema = z.object({
  multiUrl: z.object({
    title: z.string().max(100, "Title too long").optional(),
    description: z.string().max(200, "Description too long").optional(),
    links: z.array(z.object({
      title: z.string().min(1, "Link title is required").max(50, "Link title too long"),
      url: z.string().url("Invalid URL format"),
      icon: z.string().max(100, "Icon path too long").optional(),
    })).min(1, "At least one link is required").max(10, "Too many links"),
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
        phoneSchema.parse({ phone: data.phone });
        break;
      case "location":
        locationSchema.parse(data);
        break;
      case "event":
        eventSchema.parse(data);
        break;
      case "app_download":
        appDownloadSchema.parse({ appDownload: data.appDownload });
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
        errors.push(`Unsupported QR code type: ${type}`);
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
  hasLogo: boolean = false
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
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
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
  
  for (let i = 0; i < capacities.length; i++) {
    if (dataLength <= capacities[i]) {
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