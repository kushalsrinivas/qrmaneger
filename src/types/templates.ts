import type { QRCodeType, TemplateCategory, QRCodeStyle } from "./database";

// ================================
// TEMPLATE CONFIGURATION TYPES
// ================================

export interface TemplateConfig {
  // Visual customization
  style?: QRCodeStyle;
  
  // Size and format
  size?: number;
  format?: string;
  errorCorrection?: string;
  
  // Content template with variables
  contentTemplate?: Record<string, any>;
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "email" | "url" | "select" | "checkbox" | "date";
  label: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ================================
// TEMPLATE TYPES
// ================================

export interface TemplateWithUsage {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  qrCodeType: QRCodeType;
  config: TemplateConfig;
  isPublic: boolean;
  isSystem: boolean;
  tags?: string[];
  usageCount: number;
  userId?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // Usage statistics
  recentUsage: number; // Usage in last 30 days
  popularityScore: number; // Calculated score based on usage
  
  // Relations
  creator?: {
    id: string;
    name?: string;
    email: string;
  };
  qrCodes?: Array<{
    id: string;
    name: string;
    createdAt: Date;
  }>;
}

// ================================
// TEMPLATE CREATION TYPES
// ================================

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: TemplateCategory;
  qrCodeType: QRCodeType;
  config: TemplateConfig;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

export interface DuplicateTemplateInput {
  templateId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

// ================================
// TEMPLATE FILTERING & SEARCH
// ================================

export interface TemplateFilter {
  category?: TemplateCategory[];
  qrCodeType?: QRCodeType[];
  isPublic?: boolean;
  tags?: string[];
  userId?: string;
  organizationId?: string;
  search?: string;
}

export interface TemplateSortOptions {
  field: "name" | "createdAt" | "usageCount" | "popularityScore";
  order: "asc" | "desc";
}

// ================================
// TEMPLATE MARKETPLACE TYPES
// ================================

export interface TemplateMarketplaceItem extends TemplateWithUsage {
  rating: number;
  reviewCount: number;
  downloadCount: number;
  price?: number; // 0 for free templates
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  screenshots?: string[];
  features: string[];
  compatibility: {
    minVersion: string;
    platforms: string[];
  };
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  helpful: number; // Number of users who found this helpful
  createdAt: Date;
  
  // Relations
  user: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

// ================================
// BULK TEMPLATE OPERATIONS
// ================================

export interface BulkTemplateOperation {
  action: "delete" | "duplicate" | "export" | "update";
  templateIds: string[];
  options?: Record<string, any>;
}

export interface BulkTemplateResult {
  success: boolean;
  results: Array<{
    templateId: string;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ================================
// TEMPLATE IMPORT/EXPORT
// ================================

export interface TemplateExportData {
  template: TemplateWithUsage;
  qrCodes?: Array<{
    id: string;
    name: string;
    data: Record<string, any>;
    createdAt: Date;
  }>;
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    version: string;
  };
}

export interface TemplateImportOptions {
  overwriteExisting?: boolean;
  preserveIds?: boolean;
  assignToUser?: string;
  assignToOrganization?: string;
  makePublic?: boolean;
}

export interface TemplateImportResult {
  success: boolean;
  template?: TemplateWithUsage;
  warnings: string[];
  errors: string[];
}

// ================================
// TEMPLATE ANALYTICS
// ================================

export interface TemplateAnalytics {
  templateId: string;
  usageStats: {
    totalUsage: number;
    uniqueUsers: number;
    usageByMonth: Array<{
      month: string;
      usage: number;
    }>;
    usageByType: Array<{
      type: string;
      count: number;
    }>;
  };
  
  performance: {
    averageGenerationTime: number;
    successRate: number;
    errorRate: number;
    commonErrors: Array<{
      error: string;
      count: number;
    }>;
  };
  
  userFeedback: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    recentReviews: TemplateReview[];
  };
}

// ================================
// TEMPLATE CATEGORIES & TAGS
// ================================

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
  popularTemplates: TemplateWithUsage[];
}

export interface TemplateTag {
  name: string;
  count: number;
  category?: TemplateCategory;
  color?: string;
}

// ================================
// TEMPLATE VALIDATION
// ================================

export interface TemplateValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: "error" | "warning";
  }>;
  suggestions: Array<{
    field: string;
    suggestion: string;
    impact: "low" | "medium" | "high";
  }>;
}

export interface TemplateCompatibilityCheck {
  compatible: boolean;
  requiredUpdates: Array<{
    field: string;
    currentValue: any;
    suggestedValue: any;
    reason: string;
  }>;
  breakingChanges: Array<{
    field: string;
    description: string;
    migration: string;
  }>;
}

// ================================
// CONSTANTS
// ================================

export const TEMPLATE_CATEGORIES_INFO: Record<TemplateCategory, TemplateCategoryInfo> = {
  business: {
    id: "business",
    name: "Business",
    description: "Professional business templates for corporate use",
    icon: "briefcase",
    color: "#3b82f6",
    templateCount: 0,
    popularTemplates: [],
  },
  personal: {
    id: "personal",
    name: "Personal",
    description: "Personal templates for individual use",
    icon: "user",
    color: "#10b981",
    templateCount: 0,
    popularTemplates: [],
  },
  event: {
    id: "event",
    name: "Event",
    description: "Templates for events, conferences, and gatherings",
    icon: "calendar",
    color: "#f59e0b",
    templateCount: 0,
    popularTemplates: [],
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    description: "Marketing and promotional templates",
    icon: "megaphone",
    color: "#ef4444",
    templateCount: 0,
    popularTemplates: [],
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    description: "Templates for restaurants and food service",
    icon: "utensils",
    color: "#f97316",
    templateCount: 0,
    popularTemplates: [],
  },
  retail: {
    id: "retail",
    name: "Retail",
    description: "Templates for retail and e-commerce",
    icon: "shopping-cart",
    color: "#8b5cf6",
    templateCount: 0,
    popularTemplates: [],
  },
  education: {
    id: "education",
    name: "Education",
    description: "Templates for educational institutions",
    icon: "graduation-cap",
    color: "#06b6d4",
    templateCount: 0,
    popularTemplates: [],
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare",
    description: "Templates for healthcare and medical use",
    icon: "heart",
    color: "#ec4899",
    templateCount: 0,
    popularTemplates: [],
  },
};

export const COMMON_TEMPLATE_TAGS = [
  "professional",
  "minimal",
  "colorful",
  "corporate",
  "creative",
  "simple",
  "elegant",
  "modern",
  "classic",
  "bold",
  "social-media",
  "contact-info",
  "wifi",
  "menu",
  "event",
  "business-card",
  "landing-page",
  "promotional",
  "informational",
  "interactive",
] as const;

export type CommonTemplateTag = typeof COMMON_TEMPLATE_TAGS[number]; 