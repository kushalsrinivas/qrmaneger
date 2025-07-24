import { NextRequest, NextResponse } from "next/server";
import { shortUrlService } from "@/lib/short-url-service";
import { convertDataToQRString } from "@/lib/qr-handlers";
import { rateLimitingService } from "@/lib/rate-limiting";
import { db } from "@/server/db";
import { analyticsEvents, redirects } from "@/server/db/schema";
import type { QRCodeType } from "@/server/db/types";
import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * Handles QR code redirect requests with comprehensive tracking
 * GET /q/[shortCode]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const resolvedParams = await params;
  const { shortCode } = resolvedParams;
  
  try {
    // Extract client information
    const userAgent = request.headers.get("user-agent") ?? "";
    const referer = request.headers.get("referer") ?? "";
    const ipAddress = getClientIP(request);
    
    // Rate limiting check
    const rateLimitResult = await rateLimitingService.checkRedirectLimit(shortCode, ipAddress);
    if (rateLimitResult.limited) {
      return new NextResponse("Rate limit exceeded", { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      });
    }
    
    // Resolve the short code
    const result = await shortUrlService.resolveShortCode(shortCode);
    
    if (!result) {
      return new NextResponse("QR code not found", { status: 404 });
    }
    
    if (result.isExpired) {
      return new NextResponse("QR code has expired", { status: 410 });
    }
    
    if (!result.isActive) {
      return new NextResponse("QR code is inactive", { status: 403 });
    }
    
    // Parse device information
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location information (IP-based geolocation)
    const locationInfo = await getLocationFromIP(ipAddress);
    
    // Generate session ID for tracking
    const sessionId = generateSessionId(ipAddress, userAgent);
    
    // Check if this is a unique visitor
    const isUniqueVisitor = await checkUniqueVisitor(result.qrCode.id as string, sessionId);
    
    // Record comprehensive analytics event
    await recordAnalyticsEvent({
      qrCodeId: result.qrCode.id as string,
      eventType: "scan",
      userAgent,
      referer,
      ipAddress,
      deviceInfo,
      locationInfo,
      sessionId,
      isUniqueVisitor,
    });
    
    // Update redirect record with tracking data
    await updateRedirectTracking(shortCode, {
      lastAccessedAt: new Date(),
      clickCount: sql`${redirects.clickCount} + 1`,
    });
    
    // Increment scan count on QR code
    await shortUrlService.incrementScanCount(result.qrCode.id as string);
    
    // Handle different QR code types
    if ((result.qrCode.type as string) === "multi_url") {
      // For multi-URL QR codes, redirect to the landing page
      const landingPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/l/${shortCode}`;
      return NextResponse.redirect(landingPageUrl, { status: 302 });
    } else {
      // For other QR code types, use the existing redirect logic
      const redirectUrl = await getRedirectUrl(result.qrCode.type as QRCodeType, result.originalData as any, shortCode);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }
    
  } catch (error) {
    console.error("Redirect error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1";
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to localhost
  return "127.0.0.1";
}

/**
 * Parse user agent string to extract device information
 */
function parseUserAgent(userAgent: string): {
  type: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  version: string;
  model?: string;
  vendor?: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Determine device type
  let type: "mobile" | "tablet" | "desktop" = "desktop";
  if (ua.includes("mobile")) {
    type = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    type = "tablet";
  }
  
  // Determine OS
  let os = "Unknown";
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  }
  
  // Determine browser
  let browser = "Unknown";
  let version = "Unknown";
  
  if (ua.includes("chrome")) {
    browser = "Chrome";
    const match = /chrome\/([0-9.]+)/.exec(ua) ?? [];
    version = match?.[1] ?? "Unknown";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
    const match = /firefox\/([0-9.]+)/.exec(ua) ?? [];
    version = match?.[1] ?? "Unknown";
  } else if (ua.includes("safari")) {
    browser = "Safari";
    const match = /version\/([0-9.]+)/.exec(ua) ?? [];
    version = match?.[1] ?? "Unknown";
  } else if (ua.includes("edge")) {
    browser = "Edge";
    const match = /edge\/([0-9.]+)/.exec(ua) ?? [];
    version = match?.[1] ?? "Unknown";
  }
  
  return { type, os, browser, version };
}

/**
 * Get location information from IP address
 * In production, use a real GeoIP service like MaxMind, IPinfo, or similar
 */
async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  postalCode?: string;
  isp?: string;
}> {
  try {
    // For development, return mock data
    if (ipAddress === "127.0.0.1" || ipAddress.startsWith("192.168.")) {
      return {
        country: "United States",
        countryCode: "US",
        region: "California",
        city: "San Francisco",
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: "America/Los_Angeles",
        postalCode: "94102",
        isp: "Local Network",
      };
    }
    
    // In production, use a real GeoIP service
    // Example with ipinfo.io (requires API key):
    // const response = await fetch(`https://ipinfo.io/${ipAddress}?token=${process.env.IPINFO_TOKEN}`);
    // const data = await response.json();
    // return {
    //   country: data.country,
    //   region: data.region,
    //   city: data.city,
    //   latitude: data.loc ? parseFloat(data.loc.split(',')[0]) : undefined,
    //   longitude: data.loc ? parseFloat(data.loc.split(',')[1]) : undefined,
    //   timezone: data.timezone,
    //   postalCode: data.postal,
    //   isp: data.org,
    // };
    
    return {};
  } catch (error) {
    console.error("Failed to get location from IP:", error);
    return {};
  }
}

/**
 * Generate session ID for tracking
 */
function generateSessionId(ipAddress: string, userAgent: string): string {

  const data = `${ipAddress}-${userAgent}-${Date.now()}`;
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 32);
}

/**
 * Check if this is a unique visitor
 */
async function checkUniqueVisitor(qrCodeId: string, sessionId: string): Promise<boolean> {
  try {
    const existingEvent = await db.query.analyticsEvents.findFirst({
      where: (events, { eq, and }) => and(
        eq(events.qrCodeId, qrCodeId),
        eq(events.sessionId, sessionId)
      ),
    });
    
    return !existingEvent;
  } catch (error) {
    console.error("Error checking unique visitor:", error);
    return false;
  }
}

/**
 * Record analytics event with comprehensive tracking
 */
async function recordAnalyticsEvent({
  qrCodeId,
  eventType,
  userAgent,
  referer,
  ipAddress,
  deviceInfo,
  locationInfo,
  sessionId,
  isUniqueVisitor,
}: {
  qrCodeId: string;
  eventType: "scan" | "view" | "click" | "download" | "share" | "error";
  userAgent: string;
  referer: string;
  ipAddress: string;
  deviceInfo: any;
  locationInfo: any;
  sessionId: string;
  isUniqueVisitor: boolean;
}): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      qrCodeId,
      eventType,
      sessionId,
      data: {
        userAgent,
        device: deviceInfo,
        location: locationInfo,
        ip: ipAddress,
        referrer: referer,
        referrerDomain: referer ? new URL(referer).hostname : undefined,
        clickData: {
          timestamp: new Date().toISOString(),
          sessionId,
          isUniqueVisitor,
          isReturn: !isUniqueVisitor,
        },
      },
    });
  } catch (error) {
    console.error("Failed to record analytics event:", error);
  }
}

/**
 * Update redirect tracking data
 */
async function updateRedirectTracking(shortCode: string, updates: any): Promise<void> {
  try {
    await db
      .update(redirects)
      .set(updates)
      .where(eq(redirects.shortCode, shortCode));
  } catch (error) {
    console.error("Failed to update redirect tracking:", error);
  }
}

/**
 * Get redirect URL based on QR code type
 */
async function getRedirectUrl(qrType: QRCodeType, originalData: any, shortCode: string): Promise<string> {
  switch (qrType) {
    case "url":
      return originalData.url || "https://example.com";
    case "vcard":
      // Redirect to business card landing page
      return `${process.env.NEXT_PUBLIC_BASE_URL}/card/${shortCode}`;
    default:
      // For other types, convert to appropriate format
      return `data:text/plain;charset=utf-8,${encodeURIComponent(convertDataToQRString(qrType, originalData))}`;
  }
}



/**
 * Renders a landing page for complex QR code types
 */
function renderLandingPage(type: string, data: any): NextResponse {
  const html = generateLandingPageHTML(type, data);
  
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
}

/**
 * Generates HTML for landing pages
 */
function generateLandingPageHTML(type: string, data: any): string {
  const baseHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QR Code - ${type}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .content {
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 5px;
        }
        .button:hover {
          background: #0056b3;
        }
        .vcard-field {
          margin: 10px 0;
        }
        .wifi-info {
          background: #e9ecef;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .menu-category {
          margin: 20px 0;
        }
        .menu-item {
          border-bottom: 1px solid #eee;
          padding: 10px 0;
        }
        .links-container {
          margin: 20px 0;
        }
        .link-item {
          display: block;
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-radius: 6px;
          text-decoration: none;
          color: #333;
        }
        .link-item:hover {
          background: #e9ecef;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${generateContentHTML(type, data)}
      </div>
    </body>
    </html>
  `;
  
  return baseHTML;
}

/**
 * Generates content HTML based on QR code type
 */
function generateContentHTML(type: string, data: any): string {
  switch (type) {
    case "vcard":
      return `
        <div class="header">
          <h1>Contact Information</h1>
        </div>
        <div class="content">
          <div class="vcard-field"><strong>Name:</strong> ${data.vcard.firstName} ${data.vcard.lastName}</div>
          ${data.vcard.organization ? `<div class="vcard-field"><strong>Organization:</strong> ${data.vcard.organization}</div>` : ""}
          ${data.vcard.title ? `<div class="vcard-field"><strong>Title:</strong> ${data.vcard.title}</div>` : ""}
          ${data.vcard.email ? `<div class="vcard-field"><strong>Email:</strong> <a href="mailto:${data.vcard.email}">${data.vcard.email}</a></div>` : ""}
          ${data.vcard.phone ? `<div class="vcard-field"><strong>Phone:</strong> <a href="tel:${data.vcard.phone}">${data.vcard.phone}</a></div>` : ""}
          ${data.vcard.website ? `<div class="vcard-field"><strong>Website:</strong> <a href="${data.vcard.website}" target="_blank">${data.vcard.website}</a></div>` : ""}
          ${data.vcard.address ? `<div class="vcard-field"><strong>Address:</strong> ${data.vcard.address}</div>` : ""}
          <div style="margin-top: 20px;">
            <button onclick="downloadVCard()" class="button">Save Contact</button>
          </div>
        </div>
        <script>
          function downloadVCard() {
            const vcard = \`BEGIN:VCARD
VERSION:3.0
FN:${data.vcard.firstName} ${data.vcard.lastName}
N:${data.vcard.lastName};${data.vcard.firstName};;;
${data.vcard.organization ? `ORG:${data.vcard.organization}` : ""}
${data.vcard.title ? `TITLE:${data.vcard.title}` : ""}
${data.vcard.email ? `EMAIL:${data.vcard.email}` : ""}
${data.vcard.phone ? `TEL:${data.vcard.phone}` : ""}
${data.vcard.website ? `URL:${data.vcard.website}` : ""}
${data.vcard.address ? `ADR:;;${data.vcard.address};;;;` : ""}
END:VCARD\`;
            
            const blob = new Blob([vcard], { type: 'text/vcard' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${data.vcard.firstName}_${data.vcard.lastName}.vcf';
            a.click();
            URL.revokeObjectURL(url);
          }
        </script>
      `;
    
    case "wifi":
      return `
        <div class="header">
          <h1>WiFi Network</h1>
        </div>
        <div class="content">
          <div class="wifi-info">
            <div><strong>Network Name:</strong> ${data.wifi.ssid}</div>
            <div><strong>Password:</strong> ${data.wifi.password}</div>
            <div><strong>Security:</strong> ${data.wifi.security}</div>
            ${data.wifi.hidden ? "<div><strong>Hidden Network:</strong> Yes</div>" : ""}
          </div>
          <p>Connect to this network using the credentials above.</p>
        </div>
      `;
    
    case "text":
      return `
        <div class="header">
          <h1>Text Message</h1>
        </div>
        <div class="content">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; white-space: pre-wrap;">${data.text}</div>
        </div>
      `;
    
    case "multi_url":
      return `
        <div class="header">
          <h1>${data.multiUrl.title || "Links"}</h1>
          ${data.multiUrl.description ? `<p>${data.multiUrl.description}</p>` : ""}
        </div>
        <div class="content">
          <div class="links-container">
            ${data.multiUrl.links.map((link: any) => `
              <a href="${link.url}" class="link-item" target="_blank">
                ${link.icon ? `<span style="margin-right: 10px;">${link.icon}</span>` : ""}
                ${link.title}
              </a>
            `).join("")}
          </div>
        </div>
      `;
    
    case "menu":
      return `
        <div class="header">
          <h1>${data.menu.restaurantName}</h1>
        </div>
        <div class="content">
          ${data.menu.categories.map((category: any) => `
            <div class="menu-category">
              <h2>${category.name}</h2>
              ${category.items.map((item: any) => `
                <div class="menu-item">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                      <strong>${item.name}</strong>
                      ${item.description ? `<div style="color: #666; font-size: 0.9em;">${item.description}</div>` : ""}
                      ${item.allergens ? `<div style="color: #999; font-size: 0.8em;">Allergens: ${item.allergens.join(", ")}</div>` : ""}
                    </div>
                    <div>
                      ${item.price ? `<span style="font-weight: bold;">$${item.price}</span>` : ""}
                      ${item.available === false ? `<span style="color: red; font-size: 0.8em;">Unavailable</span>` : ""}
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      `;
    
    case "event":
      return `
        <div class="header">
          <h1>${data.event.title}</h1>
        </div>
        <div class="content">
          ${data.event.description ? `<p>${data.event.description}</p>` : ""}
          <div><strong>Start:</strong> ${new Date(data.event.startDate).toLocaleString()}</div>
          ${data.event.endDate ? `<div><strong>End:</strong> ${new Date(data.event.endDate).toLocaleString()}</div>` : ""}
          ${data.event.location ? `<div><strong>Location:</strong> ${data.event.location}</div>` : ""}
          <div style="margin-top: 20px;">
            <button onclick="addToCalendar()" class="button">Add to Calendar</button>
          </div>
        </div>
        <script>
          function addToCalendar() {
            const event = {
              title: "${data.event.title}",
              start: "${data.event.startDate}",
              end: "${data.event.endDate || data.event.startDate}",
              location: "${data.event.location || ""}",
              description: "${data.event.description || ""}"
            };
            
            const googleCalendarUrl = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent(event.title)}&dates=\${event.start.replace(/[-:]/g, '').replace(/\\.\\d{3}/, '')}/\${event.end.replace(/[-:]/g, '').replace(/\\.\\d{3}/, '')}&details=\${encodeURIComponent(event.description)}&location=\${encodeURIComponent(event.location)}\`;
            
            window.open(googleCalendarUrl, '_blank');
          }
        </script>
      `;
    
    case "app_download":
      return `
        <div class="header">
          <h1>Download ${data.appDownload.appName}</h1>
        </div>
        <div class="content">
          <p>Choose your platform to download the app:</p>
          <div style="text-align: center;">
            ${data.appDownload.iosUrl ? `<a href="${data.appDownload.iosUrl}" class="button">Download for iOS</a>` : ""}
            ${data.appDownload.androidUrl ? `<a href="${data.appDownload.androidUrl}" class="button">Download for Android</a>` : ""}
            ${data.appDownload.fallbackUrl ? `<a href="${data.appDownload.fallbackUrl}" class="button">Visit Website</a>` : ""}
          </div>
        </div>
        <script>
          // Auto-detect platform and redirect
          const userAgent = navigator.userAgent || navigator.vendor || window.opera;
          
          if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream && "${data.appDownload.iosUrl}") {
            window.location.href = "${data.appDownload.iosUrl}";
          } else if (/android/i.test(userAgent) && "${data.appDownload.androidUrl}") {
            window.location.href = "${data.appDownload.androidUrl}";
          }
        </script>
      `;
    
    case "payment":
      return `
        <div class="header">
          <h1>Payment</h1>
        </div>
        <div class="content">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px;">
            <div><strong>Payment Type:</strong> ${data.payment.type.toUpperCase()}</div>
            <div><strong>Address:</strong> ${data.payment.address}</div>
            ${data.payment.amount ? `<div><strong>Amount:</strong> ${data.payment.amount} ${data.payment.currency || ""}</div>` : ""}
            ${data.payment.note ? `<div><strong>Note:</strong> ${data.payment.note}</div>` : ""}
          </div>
          <p style="color: #666; font-size: 0.9em;">Please verify all payment details before proceeding.</p>
        </div>
      `;
    
    default:
      return `
        <div class="header">
          <h1>QR Code Content</h1>
        </div>
        <div class="content">
          <p>This QR code contains ${type} data.</p>
        </div>
      `;
  }
}

