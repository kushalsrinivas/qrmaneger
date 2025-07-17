import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { qrCodes } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { QRCodeData, QRCodeType, ShortUrlData } from "@/server/db/types";

// ================================
// SHORT URL SERVICE
// ================================

/**
 * Service for managing short URLs for dynamic QR codes
 */
export class ShortUrlService {
  private static instance: ShortUrlService;
  private static readonly SHORT_CODE_LENGTH = 8;
  private static readonly MAX_COLLISION_ATTEMPTS = 10;
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  private constructor() {}
  
  public static getInstance(): ShortUrlService {
    if (!ShortUrlService.instance) {
      ShortUrlService.instance = new ShortUrlService();
    }
    return ShortUrlService.instance;
  }
  
  /**
   * Generates a unique short code
   */
  public async generateShortCode(): Promise<string> {
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    
    for (let attempt = 0; attempt < ShortUrlService.MAX_COLLISION_ATTEMPTS; attempt++) {
      const shortCode = nanoid(ShortUrlService.SHORT_CODE_LENGTH);
      
      // Check for collision in database
      const exists = await this.checkShortCodeExists(shortCode);
      if (!exists) {
        return shortCode;
      }
    }
    
    throw new Error("Failed to generate unique short code after maximum attempts");
  }
  
  /**
   * Creates a short URL for dynamic QR code
   */
  public async createShortUrl(
    qrCodeId: string,
    originalData: QRCodeData,
    qrType: QRCodeType,
    userId: string,
    expiresAt?: Date
  ): Promise<string> {
    const shortCode = await this.generateShortCode();
    
    // Update the QR code record with the short URL
    await db
      .update(qrCodes)
      .set({
        dynamicUrl: `${ShortUrlService.BASE_URL}/q/${shortCode}`,
        isDynamic: true,
        updatedAt: new Date(),
      })
      .where(eq(qrCodes.id, qrCodeId));
    
    return shortCode;
  }
  
  /**
   * Resolves a short code to its original data
   */
  public async resolveShortCode(shortCode: string): Promise<{
    qrCode: any;
    originalData: QRCodeData;
    isExpired: boolean;
    isActive: boolean;
  } | null> {
    const qrCode = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.dynamicUrl, `${ShortUrlService.BASE_URL}/q/${shortCode}`),
      with: {
        user: true,
        organization: true,
      },
    });
    
    if (!qrCode) {
      return null;
    }
    
    const now = new Date();
    const isExpired = qrCode.expiresAt ? now > qrCode.expiresAt : false;
    const isActive = qrCode.status === "active";
    
    return {
      qrCode,
      originalData: qrCode.data as QRCodeData,
      isExpired,
      isActive,
    };
  }
  
  /**
   * Updates the destination of a dynamic QR code
   */
  public async updateDynamicQRCode(
    qrCodeId: string,
    newData: QRCodeData,
    userId: string
  ): Promise<void> {
    await db
      .update(qrCodes)
      .set({
        data: newData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(qrCodes.id, qrCodeId),
        eq(qrCodes.userId, userId),
        eq(qrCodes.isDynamic, true)
      ));
  }
  
  /**
   * Deactivates a dynamic QR code
   */
  public async deactivateQRCode(qrCodeId: string, userId: string): Promise<void> {
    await db
      .update(qrCodes)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(and(
        eq(qrCodes.id, qrCodeId),
        eq(qrCodes.userId, userId)
      ));
  }
  
  /**
   * Sets expiration for a dynamic QR code
   */
  public async setExpiration(
    qrCodeId: string,
    expiresAt: Date,
    userId: string
  ): Promise<void> {
    await db
      .update(qrCodes)
      .set({
        expiresAt,
        updatedAt: new Date(),
      })
      .where(and(
        eq(qrCodes.id, qrCodeId),
        eq(qrCodes.userId, userId)
      ));
  }
  
  /**
   * Increments scan count for a QR code
   */
  public async incrementScanCount(qrCodeId: string): Promise<void> {
    await db
      .update(qrCodes)
      .set({
        scanCount: sql`${qrCodes.scanCount} + 1`,
        lastScannedAt: new Date(),
      })
      .where(eq(qrCodes.id, qrCodeId));
  }
  
  /**
   * Checks if a short code already exists
   */
  private async checkShortCodeExists(shortCode: string): Promise<boolean> {
    const result = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.dynamicUrl, `${ShortUrlService.BASE_URL}/q/${shortCode}`),
      columns: { id: true },
    });
    
    return !!result;
  }
  
  /**
   * Gets analytics for a dynamic QR code
   */
  public async getQRCodeAnalytics(qrCodeId: string, days: number = 30): Promise<{
    totalScans: number;
    uniqueScans: number;
    scansByDate: Array<{ date: string; scans: number }>;
    topCountries: Array<{ country: string; scans: number }>;
    topDevices: Array<{ device: string; scans: number }>;
  }> {
    // This would be implemented with the analytics events table
    // For now, return mock data
    return {
      totalScans: 0,
      uniqueScans: 0,
      scansByDate: [],
      topCountries: [],
      topDevices: [],
    };
  }
}

// ================================
// URL SHORTENING UTILITIES
// ================================

/**
 * Utilities for URL shortening and validation
 */
export class UrlShorteningUtils {
  /**
   * Validates a URL for shortening
   */
  public static validateUrl(url: string): {
    isValid: boolean;
    normalizedUrl: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let normalizedUrl = url;
    
    try {
      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        normalizedUrl = `https://${url}`;
      }
      
      const urlObj = new URL(normalizedUrl);
      
      // Check for dangerous protocols
      const allowedProtocols = ["http:", "https:"];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        errors.push("Invalid protocol. Only HTTP and HTTPS are allowed.");
      }
      
      // Check for localhost/private IPs (optional security measure)
      if (urlObj.hostname === "localhost" || 
          urlObj.hostname.startsWith("127.") || 
          urlObj.hostname.startsWith("192.168.") ||
          urlObj.hostname.startsWith("10.") ||
          urlObj.hostname.startsWith("172.")) {
        errors.push("Private/local URLs are not allowed.");
      }
      
      // Check URL length
      if (normalizedUrl.length > 2000) {
        errors.push("URL is too long (maximum 2000 characters).");
      }
      
      normalizedUrl = urlObj.toString();
      
    } catch (error) {
      errors.push("Invalid URL format.");
    }
    
    return {
      isValid: errors.length === 0,
      normalizedUrl,
      errors,
    };
  }
  
  /**
   * Generates custom short codes with specific patterns
   */
  public static generateCustomShortCode(
    pattern: "numeric" | "alpha" | "alphanumeric" | "custom",
    length: number = 6,
    customChars?: string
  ): string {
    let charset: string;
    
    switch (pattern) {
      case "numeric":
        charset = "0123456789";
        break;
      case "alpha":
        charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;
      case "alphanumeric":
        charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;
      case "custom":
        charset = customChars || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;
      default:
        charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    }
    
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return result;
  }
  
  /**
   * Checks if a URL is safe to redirect to
   */
  public static isSafeUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Block dangerous protocols
      const blockedProtocols = ["javascript:", "data:", "file:", "ftp:"];
      if (blockedProtocols.includes(urlObj.protocol)) {
        return false;
      }
      
      // Block suspicious domains (this would be expanded with a real blocklist)
      const suspiciousDomains = ["malware.com", "phishing.com"];
      if (suspiciousDomains.includes(urlObj.hostname)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
}

// ================================
// BULK SHORT URL SERVICE
// ================================

/**
 * Service for bulk short URL operations
 */
export class BulkShortUrlService {
  private shortUrlService: ShortUrlService;
  
  constructor() {
    this.shortUrlService = ShortUrlService.getInstance();
  }
  
  /**
   * Creates multiple short URLs in batch
   */
  public async createBulkShortUrls(
    requests: Array<{
      qrCodeId: string;
      originalData: QRCodeData;
      qrType: QRCodeType;
      userId: string;
      expiresAt?: Date;
    }>,
    options: {
      maxConcurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<{
    successful: Array<{ qrCodeId: string; shortCode: string }>;
    failed: Array<{ qrCodeId: string; error: string }>;
  }> {
    const { maxConcurrency = 5, timeout = 10000 } = options;
    
    const successful: Array<{ qrCodeId: string; shortCode: string }> = [];
    const failed: Array<{ qrCodeId: string; error: string }> = [];
    
    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const shortCode = await Promise.race([
            this.shortUrlService.createShortUrl(
              request.qrCodeId,
              request.originalData,
              request.qrType,
              request.userId,
              request.expiresAt
            ),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("Timeout")), timeout)
            )
          ]);
          
          return { success: true, qrCodeId: request.qrCodeId, shortCode };
        } catch (error) {
          return {
            success: false,
            qrCodeId: request.qrCodeId,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result.success) {
          successful.push({ qrCodeId: result.qrCodeId, shortCode: result.shortCode });
        } else {
          failed.push({ qrCodeId: result.qrCodeId, error: result.error });
        }
      }
    }
    
    return { successful, failed };
  }
}

// ================================
// EXPORT SINGLETON INSTANCES
// ================================

export const shortUrlService = ShortUrlService.getInstance();
export const urlShorteningUtils = UrlShorteningUtils;
export const bulkShortUrlService = new BulkShortUrlService(); 