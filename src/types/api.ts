// ================================
// API RESPONSE TYPES
// ================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ================================
// API REQUEST TYPES
// ================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  orderBy?: string;
}

export interface FilterParams {
  search?: string;
  filter?: Record<string, any>;
  where?: Record<string, any>;
}

export interface APIRequestParams extends PaginationParams, SortParams, FilterParams {
  include?: string[];
  fields?: string[];
}

// ================================
// UPLOAD TYPES
// ================================

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadId: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  generateThumbnail?: boolean;
  resize?: {
    width: number;
    height: number;
    quality?: number;
  };
}

// ================================
// WEBHOOK TYPES
// ================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookEndpointId: string;
  eventId: string;
  status: "pending" | "success" | "failed" | "retrying";
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// RATE LIMITING TYPES
// ================================

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // seconds
}

export interface RateLimitConfig {
  windowMs: number; // time window in milliseconds
  maxRequests: number; // max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

// ================================
// API KEY TYPES
// ================================

export interface APIKeyValidation {
  isValid: boolean;
  key?: {
    id: string;
    name: string;
    userId: string;
    organizationId?: string;
    permissions: string[];
    rateLimit?: RateLimitConfig;
  };
  error?: string;
}

// ================================
// CACHE TYPES
// ================================

export interface CacheOptions {
  ttl?: number; // time to live in seconds
  tags?: string[];
  revalidate?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

// ================================
// VALIDATION TYPES
// ================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

// ================================
// SEARCH TYPES
// ================================

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  pagination?: PaginationParams;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
  suggestions?: string[];
  took: number; // search time in ms
}

// ================================
// BATCH OPERATION TYPES
// ================================

export interface BatchOperation<T = any> {
  operation: "create" | "update" | "delete";
  data: T;
  id?: string;
}

export interface BatchRequest<T = any> {
  operations: BatchOperation<T>[];
  options?: {
    continueOnError?: boolean;
    validateOnly?: boolean;
  };
}

export interface BatchResult<T = any> {
  success: boolean;
  results: Array<{
    success: boolean;
    data?: T;
    error?: string;
    operation: BatchOperation<T>;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ================================
// EXPORT/IMPORT TYPES
// ================================

export interface ExportRequest {
  format: "json" | "csv" | "xlsx";
  filters?: Record<string, any>;
  fields?: string[];
  options?: Record<string, any>;
}

export interface ExportResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  format: string;
  expiresAt: Date;
}

export interface ImportRequest {
  fileUrl: string;
  format: "json" | "csv" | "xlsx";
  mapping?: Record<string, string>;
  options?: {
    skipHeader?: boolean;
    validateOnly?: boolean;
    continueOnError?: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

// ================================
// HEALTH CHECK TYPES
// ================================

export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  uptime: number; // seconds
  version: string;
  environment: string;
  checks: Record<string, {
    status: "up" | "down";
    responseTime?: number;
    error?: string;
  }>;
}

// ================================
// METRICS TYPES
// ================================

export interface APIMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
  endpoints: Record<string, {
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  errors: Array<{
    code: string;
    count: number;
    percentage: number;
  }>;
  period: {
    start: Date;
    end: Date;
  };
} 