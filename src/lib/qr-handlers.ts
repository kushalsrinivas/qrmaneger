import { db } from "@/server/db";
import { qrCodes, analyticsEvents, folders } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { QRCodeData, QRCodeType } from "@/server/db/types";

// ================================
// QR CODE DATA HANDLERS
// ================================

/**
 * Converts QR code data to string format for QR generation
 * Only supports URL QR codes
 */
export function convertDataToQRString(type: QRCodeType, data: QRCodeData): string {
  if (type !== "url") {
    throw new Error(`Unsupported QR code type: ${type}. Only URL QR codes are supported.`);
  }
  
  return handleUrlData(data);
}

// ================================
// URL HANDLER
// ================================

/**
 * Handles URL QR code data
 */
function handleUrlData(data: QRCodeData): string {
  if (!data.url) {
    throw new Error("URL is required");
  }
  
  // Sanitize and validate URL
  const sanitizedUrl = sanitizeUrl(data.url);
  
  // Additional security checks
  if (!isSafeUrl(sanitizedUrl)) {
    throw new Error("URL contains potentially dangerous content");
  }
  
  // Check length limit for QR codes
  if (sanitizedUrl.length > 2953) {
    throw new Error("URL exceeds QR code character limit (2,953 characters)");
  }
  
  return sanitizedUrl;
}

/**
 * Checks if a URL is safe for QR code generation
 */
function isSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Block dangerous protocols
    const blockedProtocols = ["javascript:", "data:", "file:", "ftp:", "about:", "chrome:", "chrome-extension:"];
    if (blockedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // Block suspicious domains (expandable blacklist)
    const suspiciousDomains = [
      "malware.com", "phishing.com", "scam.com", "spam.com",
      "bit.ly/malware", "tinyurl.com/malware", "suspicious.site"
    ];
    
    if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
      return false;
    }
    
    // Block localhost and private IPs for security
    if (urlObj.hostname === "localhost" || 
        urlObj.hostname.startsWith("127.") || 
        urlObj.hostname.startsWith("192.168.") ||
        urlObj.hostname.startsWith("10.") ||
        urlObj.hostname.startsWith("172.")) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Escapes special characters for QR code data
 */
export function escapeQRData(data: string): string {
  return data
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Validates and sanitizes URL
 */
export function sanitizeUrl(url: string): string {
  try {
    // Trim whitespace
    let cleanUrl = url.trim();
    
    // Add protocol if missing
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    const urlObj = new URL(cleanUrl);
    
    // Only allow HTTP and HTTPS protocols
    const allowedProtocols = ["http:", "https:"];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new Error("Invalid URL protocol. Only HTTP and HTTPS are allowed.");
    }
    
    // Normalize URL format
    const normalizedUrl = urlObj.toString();
    
    // XSS prevention - check for dangerous patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(normalizedUrl))) {
      throw new Error("URL contains potentially dangerous content");
    }
    
    return normalizedUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Invalid URL format");
  }
}

 

/**
 * Syncs analytics and folder data when a QR code is updated
 */
export async function syncQRCodeUpdateAnalytics(
  qrCodeId: string,
  userId: string,
  updateData: {
    folderId?: string | null;
    name?: string;
    type?: QRCodeType;
    data?: QRCodeData;
    previousFolderId?: string | null;
  }
): Promise<void> {
  try {
    // Record update event in analytics
    await db.insert(analyticsEvents).values({
      qrCodeId,
      eventType: "view", // Using 'view' as the closest available event type
      data: {
        customData: {
          updateFields: Object.keys(updateData).filter(key => 
            updateData[key as keyof typeof updateData] !== undefined
          ),
          previousFolderId: updateData.previousFolderId,
          newFolderId: updateData.folderId,
          nameChanged: updateData.name !== undefined,
          dataChanged: updateData.data !== undefined,
          timestamp: new Date().toISOString(),
          userId,
        }
      },
      sessionId: `update-${qrCodeId}-${Date.now()}`,
      userId,
      timestamp: new Date(),
      datePartition: new Date().toISOString().split('T')[0]
    });

    // Update folder timestamps if folder changed
    if (updateData.folderId !== updateData.previousFolderId) {
      // Update previous folder timestamp
      if (updateData.previousFolderId) {
        await db.update(folders)
          .set({ updatedAt: new Date() })
          .where(eq(folders.id, updateData.previousFolderId));
      }

      // Update new folder timestamp
      if (updateData.folderId) {
        await db.update(folders)
          .set({ updatedAt: new Date() })
          .where(eq(folders.id, updateData.folderId));
      }
    }

    // Update QR code last_updated timestamp for analytics
    await db.update(qrCodes)
      .set({ 
        updatedAt: new Date()
      })
      .where(and(
        eq(qrCodes.id, qrCodeId),
        eq(qrCodes.userId, userId)
      ));

  } catch (error) {
    console.error("Failed to sync QR code update analytics:", error);
    // Don't throw error to prevent update operation from failing
  }
}

/**
 * Validates folder ownership and existence
 */
export async function validateFolderAccess(
  folderId: string | null,
  userId: string
): Promise<{ isValid: boolean; folder?: typeof folders.$inferSelect }> {
  if (!folderId) {
    return { isValid: true }; // null folder is valid (root level)
  }

  try {
    const folder = await db.query.folders.findFirst({
      where: and(
        eq(folders.id, folderId),
        eq(folders.userId, userId)
      )
    });

    return {
      isValid: !!folder,
      folder
    };
  } catch (error) {
    console.error("Failed to validate folder access:", error);
    return { isValid: false };
  }
}

/**
 * Records QR code access event for analytics
 */
export async function recordQRCodeAccess(
  qrCodeId: string,
  eventType: "view" | "scan" | "update" | "delete",
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Only use supported event types from the enum
    const supportedEventType = eventType === "update" || eventType === "delete" ? "view" : eventType;
    
    await db.insert(analyticsEvents).values({
      qrCodeId,
      eventType: supportedEventType,
      data: {
        customData: {
          source: "qr_management",
          action: eventType,
          timestamp: new Date().toISOString(),
          metadata: metadata ?? {},
        }
      },
      sessionId: `${eventType}-${qrCodeId}-${Date.now()}`,
      timestamp: new Date(),
      datePartition: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error("Failed to record QR code access:", error);
    // Don't throw error to prevent main operation from failing
  }
} 