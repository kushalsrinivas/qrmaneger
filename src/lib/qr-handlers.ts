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
  
  // Ensure URL has protocol
  let url = data.url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  
  return url;
}

/**
 * Handles vCard QR code data
 */
function handleVCardData(data: QRCodeData): string {
  if (!data.vcard) {
    throw new Error("vCard data is required");
  }
  
  const { vcard } = data;
  const lines: string[] = [];
  
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");
  
  // Full name
  if (vcard.firstName || vcard.lastName) {
    lines.push(`FN:${[vcard.firstName, vcard.lastName].filter(Boolean).join(" ")}`);
    lines.push(`N:${vcard.lastName || ""};${vcard.firstName || ""};;;`);
  }
  
  // Organization and title
  if (vcard.organization) {
    lines.push(`ORG:${vcard.organization}`);
  }
  if (vcard.title) {
    lines.push(`TITLE:${vcard.title}`);
  }
  
  // Contact information
  if (vcard.phone) {
    lines.push(`TEL:${vcard.phone}`);
  }
  if (vcard.email) {
    lines.push(`EMAIL:${vcard.email}`);
  }
  if (vcard.website) {
    lines.push(`URL:${vcard.website}`);
  }
  
  // Address
  if (vcard.address) {
    lines.push(`ADR:;;${vcard.address};;;;`);
  }
  
  lines.push("END:VCARD");
  
  return lines.join("\n");
}

/**
 * Handles WiFi QR code data
 */
function handleWifiData(data: QRCodeData): string {
  if (!data.wifi) {
    throw new Error("WiFi data is required");
  }
  
  const { wifi } = data;
  const parts: string[] = [];
  
  parts.push(`WIFI:T:${wifi.security}`);
  parts.push(`S:${wifi.ssid}`);
  parts.push(`P:${wifi.password}`);
  
  if (wifi.hidden) {
    parts.push("H:true");
  }
  
  parts.push(";");
  
  return parts.join(";");
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
    const urlObj = new URL(url);
    
    // Remove potentially dangerous protocols
    const allowedProtocols = ["http:", "https:", "ftp:", "ftps:"];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new Error("Invalid URL protocol");
    }
    
    return urlObj.toString();
  } catch (error) {
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