import { NextRequest, NextResponse } from "next/server";
import { shortUrlService } from "@/lib/short-url-service";
import { convertDataToQRString } from "@/lib/qr-handlers";
import { db } from "@/server/db";
import { analyticsEvents } from "@/server/db/schema";
import { nanoid } from "nanoid";

/**
 * Handles QR code redirect requests
 * GET /q/[shortCode]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const { shortCode } = params;
  
  try {
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
    
    // Extract analytics data from request
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";
    const ipAddress = getClientIP(request);
    
    // Parse device information
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location information (simplified - in production, use a GeoIP service)
    const locationInfo = await getLocationFromIP(ipAddress);
    
    // Record analytics event
    await recordAnalyticsEvent({
      qrCodeId: result.qrCode.id,
      eventType: "scan",
      userAgent,
      referer,
      ipAddress,
      deviceInfo,
      locationInfo,
    });
    
    // Increment scan count
    await shortUrlService.incrementScanCount(result.qrCode.id);
    
    // Handle different QR code types
    const redirectUrl = await getRedirectUrl(result.qrCode.type, result.originalData);
    
    if (redirectUrl) {
      // Redirect to the target URL
      return NextResponse.redirect(redirectUrl, { status: 302 });
    } else {
      // For complex types, render a landing page
      return renderLandingPage(result.qrCode.type, result.originalData);
    }
    
  } catch (error) {
    console.error("QR code redirect failed:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

/**
 * Records an analytics event
 */
async function recordAnalyticsEvent(data: {
  qrCodeId: string;
  eventType: string;
  userAgent: string;
  referer: string;
  ipAddress: string;
  deviceInfo: any;
  locationInfo: any;
}) {
  try {
    await db.insert(analyticsEvents).values({
      qrCodeId: data.qrCodeId,
      eventType: data.eventType as any,
      data: {
        userAgent: data.userAgent,
        device: data.deviceInfo,
        location: data.locationInfo,
        ip: data.ipAddress,
        referrer: data.referer,
      },
      sessionId: nanoid(),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to record analytics event:", error);
  }
}

/**
 * Gets the redirect URL for simple QR code types
 */
async function getRedirectUrl(type: string, data: any): Promise<string | null> {
  switch (type) {
    case "url":
      return data.url;
    
    case "phone":
      return `tel:${data.phone}`;
    
    case "email":
      const emailParts = [`mailto:${data.email.to}`];
      const queryParams = [];
      if (data.email.subject) {
        queryParams.push(`subject=${encodeURIComponent(data.email.subject)}`);
      }
      if (data.email.body) {
        queryParams.push(`body=${encodeURIComponent(data.email.body)}`);
      }
      if (queryParams.length > 0) {
        emailParts.push(`?${queryParams.join("&")}`);
      }
      return emailParts.join("");
    
    case "sms":
      return `sms:${data.sms.phone}?body=${encodeURIComponent(data.sms.message)}`;
    
    case "location":
      return `https://maps.google.com/maps?q=${data.location.latitude},${data.location.longitude}`;
    
    case "pdf":
      return data.pdf.fileUrl;
    
    case "image":
      return data.image.imageUrl;
    
    case "video":
      return data.video.videoUrl;
    
    default:
      return null; // Complex types need landing pages
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

/**
 * Extracts client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || "";
}

/**
 * Parses user agent string to extract device information
 */
function parseUserAgent(userAgent: string): {
  type: "mobile" | "tablet" | "desktop";
  os?: string;
  browser?: string;
  version?: string;
} {
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  
  let type: "mobile" | "tablet" | "desktop" = "desktop";
  if (isTablet) {
    type = "tablet";
  } else if (isMobile) {
    type = "mobile";
  }
  
  // Extract OS
  let os = "";
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Mac/i.test(userAgent)) os = "macOS";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad/i.test(userAgent)) os = "iOS";
  else if (/Linux/i.test(userAgent)) os = "Linux";
  
  // Extract browser
  let browser = "";
  if (/Chrome/i.test(userAgent)) browser = "Chrome";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";
  else if (/Safari/i.test(userAgent)) browser = "Safari";
  else if (/Edge/i.test(userAgent)) browser = "Edge";
  
  return { type, os, browser };
}

/**
 * Gets location information from IP address
 */
async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}> {
  // In production, you would use a GeoIP service like MaxMind or ipapi.co
  // For now, return empty object
  return {};
} 