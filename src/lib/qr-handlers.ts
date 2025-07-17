import { QRCodeData, QRCodeType } from "@/server/db/types";

// ================================
// QR CODE DATA HANDLERS
// ================================

/**
 * Converts QR code data to string format for QR generation
 */
export function convertDataToQRString(type: QRCodeType, data: QRCodeData): string {
  switch (type) {
    case "url":
      return handleUrlData(data);
    case "vcard":
      return handleVCardData(data);
    case "wifi":
      return handleWifiData(data);
    case "text":
      return handleTextData(data);
    case "sms":
      return handleSmsData(data);
    case "email":
      return handleEmailData(data);
    case "phone":
      return handlePhoneData(data);
    case "location":
      return handleLocationData(data);
    case "event":
      return handleEventData(data);
    case "app_download":
      return handleAppDownloadData(data);
    case "multi_url":
      return handleMultiUrlData(data);
    case "menu":
      return handleMenuData(data);
    case "payment":
      return handlePaymentData(data);
    case "pdf":
      return handlePdfData(data);
    case "image":
      return handleImageData(data);
    case "video":
      return handleVideoData(data);
    default:
      throw new Error(`Unsupported QR code type: ${type}`);
  }
}

// ================================
// TYPE-SPECIFIC HANDLERS
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

/**
 * Handles vCard QR code data with vCard 3.0/4.0 compliance
 */
function handleVCardData(data: QRCodeData): string {
  if (!data.vcard) {
    throw new Error("vCard data is required");
  }
  
  const { vcard } = data;
  const lines: string[] = [];
  
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");
  
  // Full name (FN) - Required field
  if (vcard.firstName || vcard.lastName) {
    const fullName = [vcard.firstName, vcard.middleName, vcard.lastName].filter(Boolean).join(" ");
    lines.push(`FN:${escapeVCardValue(fullName)}`);
    
    // Structured name (N) - Last;First;Middle;Prefix;Suffix
    lines.push(`N:${escapeVCardValue(vcard.lastName || "")};${escapeVCardValue(vcard.firstName || "")};${escapeVCardValue(vcard.middleName || "")};;`);
  }
  
  // Nickname
  if (vcard.nickname) {
    lines.push(`NICKNAME:${escapeVCardValue(vcard.nickname)}`);
  }
  
  // Organization and title
  if (vcard.organization) {
    lines.push(`ORG:${escapeVCardValue(vcard.organization)}`);
  }
  if (vcard.title) {
    lines.push(`TITLE:${escapeVCardValue(vcard.title)}`);
  }
  if (vcard.department) {
    lines.push(`X-DEPARTMENT:${escapeVCardValue(vcard.department)}`);
  }
  
  // Contact information
  if (vcard.phone) {
    lines.push(`TEL;TYPE=VOICE:${vcard.phone}`);
  }
  if (vcard.whatsapp) {
    lines.push(`TEL;TYPE=CELL;X-SERVICE=WhatsApp:${vcard.whatsapp}`);
  }
  if (vcard.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${vcard.email}`);
  }
  if (vcard.website) {
    lines.push(`URL:${vcard.website}`);
  }
  
  // Social media (using X- extensions for compatibility)
  if (vcard.linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${vcard.linkedin}`);
  }
  if (vcard.twitter) {
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${vcard.twitter.startsWith("@") ? vcard.twitter : `@${vcard.twitter}`}`);
  }
  if (vcard.instagram) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${vcard.instagram}`);
  }
  if (vcard.facebook) {
    lines.push(`X-SOCIALPROFILE;TYPE=facebook:${vcard.facebook}`);
  }
  
  // Additional contact methods
  if (vcard.skype) {
    lines.push(`X-SKYPE:${escapeVCardValue(vcard.skype)}`);
  }
  if (vcard.telegram) {
    lines.push(`X-TELEGRAM:${escapeVCardValue(vcard.telegram)}`);
  }
  
  // Address
  if (vcard.address) {
    lines.push(`ADR:;;${escapeVCardValue(vcard.address)};;;;`);
  } else if (vcard.addressComponents) {
    const addr = vcard.addressComponents;
    lines.push(`ADR:;${escapeVCardValue(addr.street || "")};${escapeVCardValue(addr.city || "")};${escapeVCardValue(addr.state || "")};${escapeVCardValue(addr.postalCode || "")};${escapeVCardValue(addr.country || "")}`);
  }
  
  // Professional info
  if (vcard.assistant) {
    lines.push(`X-ASSISTANT:${escapeVCardValue(vcard.assistant)}`);
  }
  if (vcard.assistantPhone) {
    lines.push(`X-ASSISTANT-TEL:${vcard.assistantPhone}`);
  }
  
  // Dates
  if (vcard.birthday) {
    lines.push(`BDAY:${vcard.birthday}`);
  }
  if (vcard.anniversary) {
    lines.push(`ANNIVERSARY:${vcard.anniversary}`);
  }
  
  // Note
  if (vcard.note) {
    lines.push(`NOTE:${escapeVCardValue(vcard.note)}`);
  }
  
  // Custom fields
  if (vcard.customFields) {
    vcard.customFields.forEach(field => {
      const label = escapeVCardValue(field.label);
      const value = escapeVCardValue(field.value);
      
      switch (field.type) {
        case "email":
          lines.push(`EMAIL;X-LABEL=${label}:${value}`);
          break;
        case "phone":
          lines.push(`TEL;X-LABEL=${label}:${value}`);
          break;
        case "url":
          lines.push(`URL;X-LABEL=${label}:${value}`);
          break;
        default:
          lines.push(`X-${label.toUpperCase()}:${value}`);
      }
    });
  }
  
  // Company logo (using LOGO field)
  if (vcard.companyLogo) {
    lines.push(`LOGO:${vcard.companyLogo}`);
  }
  
  lines.push("END:VCARD");
  
  return lines.join("\r\n"); // Use CRLF for better compatibility
}

/**
 * Escapes special characters in vCard values
 */
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

/**
 * Handles WiFi QR code data with proper WiFi QR standard format
 */
function handleWifiData(data: QRCodeData): string {
  if (!data.wifi) {
    throw new Error("WiFi data is required");
  }
  
  const { wifi } = data;
  
  // WiFi QR format: WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>;;
  const parts: string[] = ["WIFI:"];
  
  // Security type (T)
  parts.push(`T:${wifi.security}`);
  
  // SSID (S) - escape special characters
  parts.push(`S:${escapeWifiValue(wifi.ssid)}`);
  
  // Password (P) - escape special characters, only if not open network
  if (wifi.security !== "nopass" && wifi.password) {
    parts.push(`P:${escapeWifiValue(wifi.password)}`);
  } else if (wifi.security !== "nopass") {
    parts.push("P:");
  }
  
  // Hidden network (H)
  if (wifi.hidden) {
    parts.push("H:true");
  }
  
  // Enterprise WiFi settings (if applicable)
  if (wifi.eap) {
    parts.push(`E:${wifi.eap}`);
  }
  if (wifi.identity) {
    parts.push(`I:${escapeWifiValue(wifi.identity)}`);
  }
  if (wifi.anonymousIdentity) {
    parts.push(`A:${escapeWifiValue(wifi.anonymousIdentity)}`);
  }
  if (wifi.phase2) {
    parts.push(`PH2:${wifi.phase2}`);
  }
  
  // Double semicolon at the end is required by the standard
  return parts.join(";") + ";;";
}

/**
 * Escapes special characters in WiFi QR code values
 */
function escapeWifiValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")  // Escape backslashes
    .replace(/;/g, "\\;")    // Escape semicolons
    .replace(/,/g, "\\,")    // Escape commas
    .replace(/"/g, '\\"')    // Escape quotes
    .replace(/\n/g, "\\n")   // Escape newlines
    .replace(/\r/g, "\\r")   // Escape carriage returns
    .replace(/\t/g, "\\t");  // Escape tabs
}

/**
 * Handles text QR code data
 */
function handleTextData(data: QRCodeData): string {
  if (!data.text) {
    throw new Error("Text content is required");
  }
  
  return data.text;
}

/**
 * Handles SMS QR code data
 */
function handleSmsData(data: QRCodeData): string {
  if (!data.sms) {
    throw new Error("SMS data is required");
  }
  
  const { sms } = data;
  return `SMSTO:${sms.phone}:${sms.message}`;
}

/**
 * Handles email QR code data
 */
function handleEmailData(data: QRCodeData): string {
  if (!data.email) {
    throw new Error("Email data is required");
  }
  
  const { email } = data;
  const parts: string[] = [`mailto:${email.to}`];
  
  const queryParams: string[] = [];
  if (email.subject) {
    queryParams.push(`subject=${encodeURIComponent(email.subject)}`);
  }
  if (email.body) {
    queryParams.push(`body=${encodeURIComponent(email.body)}`);
  }
  
  if (queryParams.length > 0) {
    parts.push(`?${queryParams.join("&")}`);
  }
  
  return parts.join("");
}

/**
 * Handles phone QR code data
 */
function handlePhoneData(data: QRCodeData): string {
  if (!data.phone) {
    throw new Error("Phone number is required");
  }
  
  return `tel:${data.phone}`;
}

/**
 * Handles location QR code data
 */
function handleLocationData(data: QRCodeData): string {
  if (!data.location) {
    throw new Error("Location data is required");
  }
  
  const { location } = data;
  return `geo:${location.latitude},${location.longitude}`;
}

/**
 * Handles event QR code data
 */
function handleEventData(data: QRCodeData): string {
  if (!data.event) {
    throw new Error("Event data is required");
  }
  
  const { event } = data;
  const lines: string[] = [];
  
  lines.push("BEGIN:VEVENT");
  lines.push(`SUMMARY:${event.title}`);
  
  if (event.description) {
    lines.push(`DESCRIPTION:${event.description}`);
  }
  
  if (event.location) {
    lines.push(`LOCATION:${event.location}`);
  }
  
  // Convert dates to iCal format
  const startDate = new Date(event.startDate);
  lines.push(`DTSTART:${formatICalDate(startDate)}`);
  
  if (event.endDate) {
    const endDate = new Date(event.endDate);
    lines.push(`DTEND:${formatICalDate(endDate)}`);
  }
  
  lines.push("END:VEVENT");
  
  return lines.join("\n");
}

/**
 * Handles app download QR code data
 */
function handleAppDownloadData(data: QRCodeData): string {
  if (!data.appDownload) {
    throw new Error("App download data is required");
  }
  
  // For app download, we'll create a landing page URL
  // This would typically be handled by the dynamic QR system
  const { appDownload } = data;
  
  // Create a JSON payload that the landing page can parse
  const payload = {
    type: "app_download",
    appName: appDownload.appName,
    androidUrl: appDownload.androidUrl,
    iosUrl: appDownload.iosUrl,
    fallbackUrl: appDownload.fallbackUrl,
  };
  
  return JSON.stringify(payload);
}

/**
 * Handles multi-URL QR code data
 */
function handleMultiUrlData(data: QRCodeData): string {
  if (!data.multiUrl) {
    throw new Error("Multi-URL data is required");
  }
  
  // For multi-URL, we'll create a landing page URL
  // This would typically be handled by the dynamic QR system
  const { multiUrl } = data;
  
  const payload = {
    type: "multi_url",
    title: multiUrl.title,
    description: multiUrl.description,
    links: multiUrl.links,
  };
  
  return JSON.stringify(payload);
}

/**
 * Handles menu QR code data
 */
function handleMenuData(data: QRCodeData): string {
  if (!data.menu) {
    throw new Error("Menu data is required");
  }
  
  // For menu, we'll create a landing page URL
  // This would typically be handled by the dynamic QR system
  const { menu } = data;
  
  const payload = {
    type: "menu",
    restaurantName: menu.restaurantName,
    categories: menu.categories,
  };
  
  return JSON.stringify(payload);
}

/**
 * Handles payment QR code data
 */
function handlePaymentData(data: QRCodeData): string {
  if (!data.payment) {
    throw new Error("Payment data is required");
  }
  
  const { payment } = data;
  
  switch (payment.type) {
    case "upi":
      return handleUpiPayment(payment);
    case "paypal":
      return handlePaypalPayment(payment);
    case "crypto":
      return handleCryptoPayment(payment);
    case "bank":
      return handleBankPayment(payment);
    default:
      throw new Error(`Unsupported payment type: ${payment.type}`);
  }
}

/**
 * Handles PDF QR code data
 */
function handlePdfData(data: QRCodeData): string {
  if (!data.pdf) {
    throw new Error("PDF data is required");
  }
  
  return data.pdf.fileUrl;
}

/**
 * Handles image QR code data
 */
function handleImageData(data: QRCodeData): string {
  if (!data.image) {
    throw new Error("Image data is required");
  }
  
  return data.image.imageUrl;
}

/**
 * Handles video QR code data
 */
function handleVideoData(data: QRCodeData): string {
  if (!data.video) {
    throw new Error("Video data is required");
  }
  
  return data.video.videoUrl;
}

// ================================
// PAYMENT HANDLERS
// ================================

/**
 * Handles UPI payment data
 */
function handleUpiPayment(payment: any): string {
  const parts: string[] = [`upi://pay?pa=${payment.address}`];
  
  if (payment.amount) {
    parts.push(`am=${payment.amount}`);
  }
  
  if (payment.currency) {
    parts.push(`cu=${payment.currency}`);
  }
  
  if (payment.note) {
    parts.push(`tn=${encodeURIComponent(payment.note)}`);
  }
  
  return parts.join("&");
}

/**
 * Handles PayPal payment data
 */
function handlePaypalPayment(payment: any): string {
  const baseUrl = "https://paypal.me/";
  let url = `${baseUrl}${payment.address}`;
  
  if (payment.amount) {
    url += `/${payment.amount}`;
    if (payment.currency) {
      url += `${payment.currency}`;
    }
  }
  
  return url;
}

/**
 * Handles cryptocurrency payment data
 */
function handleCryptoPayment(payment: any): string {
  let url = payment.address;
  
  // Add amount if specified
  if (payment.amount) {
    url += `?amount=${payment.amount}`;
  }
  
  // Add label if note is provided
  if (payment.note) {
    const separator = payment.amount ? "&" : "?";
    url += `${separator}label=${encodeURIComponent(payment.note)}`;
  }
  
  return url;
}

/**
 * Handles bank payment data
 */
function handleBankPayment(payment: any): string {
  // For bank payments, we'll return the account details as structured data
  const payload = {
    type: "bank_payment",
    account: payment.address,
    amount: payment.amount,
    currency: payment.currency,
    note: payment.note,
  };
  
  return JSON.stringify(payload);
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Formats date for iCal format
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

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
 * Formats phone number for international use
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Validates and formats email address
 */
export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  
  return email.toLowerCase();
} 