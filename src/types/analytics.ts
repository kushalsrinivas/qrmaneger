import type { AnalyticsEventType, QRCode } from './database';

// ================================
// ANALYTICS EVENT DATA
// ================================

export interface DeviceInfo {
  type: string; // mobile, tablet, desktop
  os: string;
  browser: string;
  version: string;
  model?: string;
  vendor?: string;
}

export interface LocationInfo {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  postalCode?: string;
  isp?: string;
}

export interface UTMParameters {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface ClickData {
  timestamp: string;
  sessionId: string;
  isUniqueVisitor: boolean;
  isReturn: boolean;
  timeOnPage?: number;
}

export interface AnalyticsEventData {
  // Device information
  userAgent?: string;
  device?: DeviceInfo;
  
  // Location information (IP-based geolocation)
  location?: LocationInfo;
  
  // Network information
  ip?: string;
  ipVersion?: string; // IPv4 or IPv6
  isp?: string;
  
  // Referrer information
  referrer?: string;
  referrerDomain?: string;
  utm?: UTMParameters;
  
  // Tracking specific data
  clickData?: ClickData;
  
  // Custom event data
  customData?: Record<string, any>;
}

// ================================
// QR CODE SCAN EVENT
// ================================

export interface QRCodeScanEvent {
  qrCodeId: string;
  sessionId: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
  location?: LocationInfo;
  device?: DeviceInfo;
}

// ================================
// ANALYTICS AGGREGATION TYPES
// ================================

export interface QRCodeStats {
  totalScans: number;
  uniqueScans: number;
  scansByDate: Array<{
    date: string;
    scans: number;
  }>;
  scansByCountry: Array<{
    country: string;
    scans: number;
  }>;
  scansByDevice: Array<{
    device: string;
    scans: number;
  }>;
  scansByBrowser: Array<{
    browser: string;
    scans: number;
  }>;
  scansByReferrer: Array<{
    referrer: string;
    scans: number;
  }>;
}

export interface OrganizationStats {
  totalQRCodes: number;
  totalScans: number;
  activeUsers: number;
  popularTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
  }>;
  topPerformingQRCodes: Array<{
    qrCode: QRCode;
    scanCount: number;
  }>;
}

export interface UserStats {
  totalQRCodes: number;
  totalScans: number;
  totalFolders: number;
  totalTemplates: number;
  memberSince: Date;
  accountAge: number; // in days
  storageUsed?: number; // in MB
  storageLimit?: number; // in MB
}

// ================================
// DASHBOARD DATA TYPES
// ================================

export interface DashboardData {
  userStats: UserStats;
  recentQRCodes: QRCode[];
  scanTrends: Array<{
    date: string;
    scans: number;
  }>;
  topPerformers: Array<{
    qrCode: QRCode;
    scanCount: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  locationBreakdown: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
}

// ================================
// ANALYTICS FILTERS
// ================================

export interface AnalyticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  qrCodeIds?: string[];
  eventTypes?: AnalyticsEventType[];
  countries?: string[];
  devices?: string[];
  browsers?: string[];
}

// ================================
// ANALYTICS QUERY TYPES
// ================================

export interface AnalyticsQuery {
  qrCodeId?: string;
  userId?: string;
  organizationId?: string;
  filter: AnalyticsFilter;
  groupBy?: "date" | "country" | "device" | "browser" | "referrer";
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResult {
  data: Array<{
    label: string;
    value: number;
    percentage?: number;
  }>;
  total: number;
  period: {
    start: Date;
    end: Date;
  };
}

// ================================
// REAL-TIME ANALYTICS
// ================================

export interface RealTimeStats {
  activeScans: number;
  scansInLastHour: number;
  scansInLastDay: number;
  topActiveQRCodes: Array<{
    qrCodeId: string;
    qrCodeName: string;
    recentScans: number;
  }>;
  recentEvents: Array<{
    timestamp: Date;
    qrCodeId: string;
    qrCodeName: string;
    eventType: AnalyticsEventType;
    location?: string;
    device?: string;
  }>;
}

// ================================
// ANALYTICS EXPORT TYPES
// ================================

export interface AnalyticsExportOptions {
  format: "csv" | "json" | "xlsx";
  dateRange: {
    start: Date;
    end: Date;
  };
  includeFields: Array<
    | "timestamp"
    | "qrCodeName"
    | "eventType"
    | "location"
    | "device"
    | "browser"
    | "referrer"
    | "userAgent"
  >;
  qrCodeIds?: string[];
}

export interface AnalyticsExportResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  expiresAt: Date;
} 