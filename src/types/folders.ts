import type { QRCode, User } from "./database";

// ================================
// FOLDER TYPES
// ================================

export interface FolderWithContents {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  userId: string;
  organizationId?: string;
  
  // Hierarchy and ordering
  path?: string;
  level: number;
  sortOrder: number;
  
  // Metadata
  isSystem: boolean;
  createdAt: Date;
  updatedAt?: Date;
  
  // Contents
  children: FolderWithContents[];
  qrCodes: QRCode[];
  
  // Statistics
  totalQRCodes: number;
  totalScans: number;
  
  // Relations
  parent?: FolderWithContents;
  user: User;
}

// ================================
// FOLDER CREATION TYPES
// ================================

export interface CreateFolderInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateFolderInput extends Partial<CreateFolderInput> {
  id: string;
}

export interface MoveFolderInput {
  folderId: string;
  newParentId?: string;
  newPosition?: number;
}

export interface DuplicateFolderInput {
  folderId: string;
  name: string;
  includeQRCodes?: boolean;
  includeSubfolders?: boolean;
}

// ================================
// FOLDER OPERATIONS
// ================================

export interface BulkFolderOperation {
  action: "delete" | "move" | "duplicate" | "export";
  folderIds: string[];
  options?: {
    targetParentId?: string;
    includeQRCodes?: boolean;
    includeSubfolders?: boolean;
    newNames?: string[];
  };
}

export interface BulkFolderResult {
  success: boolean;
  results: Array<{
    folderId: string;
    success: boolean;
    error?: string;
    newId?: string; // For duplicate operations
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ================================
// FOLDER TREE TYPES
// ================================

export interface FolderTreeNode {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  level: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  isSystem: boolean;
  
  // Counts
  qrCodeCount: number;
  childCount: number;
  
  // Relations
  children: FolderTreeNode[];
  parent?: FolderTreeNode;
}

export interface FolderTreeOptions {
  includeQRCounts?: boolean;
  includeSystemFolders?: boolean;
  maxDepth?: number;
  expandedIds?: string[];
  selectedId?: string;
}

// ================================
// FOLDER SEARCH & FILTERING
// ================================

export interface FolderFilter {
  search?: string;
  parentId?: string;
  userId?: string;
  organizationId?: string;
  isSystem?: boolean;
  hasQRCodes?: boolean;
  colors?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface FolderSortOptions {
  field: "name" | "createdAt" | "updatedAt" | "qrCodeCount" | "sortOrder";
  order: "asc" | "desc";
}

// ================================
// FOLDER STATISTICS
// ================================

export interface FolderStats {
  folderId: string;
  totalQRCodes: number;
  totalScans: number;
  totalSubfolders: number;
  
  // Time-based stats
  qrCodesCreatedThisMonth: number;
  scansThisMonth: number;
  
  // Activity
  lastActivity?: Date;
  mostActiveQRCode?: {
    id: string;
    name: string;
    scanCount: number;
  };
  
  // Growth
  qrCodeGrowthRate: number; // percentage
  scanGrowthRate: number; // percentage
}

// ================================
// FOLDER SHARING & PERMISSIONS
// ================================

export interface FolderPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreateQR: boolean;
  canManageSubfolders: boolean;
  canShare: boolean;
}

export interface FolderShare {
  id: string;
  folderId: string;
  sharedBy: string;
  sharedWith?: string; // User ID, null for public shares
  shareType: "user" | "organization" | "public" | "link";
  permissions: FolderPermissions;
  token?: string; // For link-based sharing
  expiresAt?: Date;
  createdAt: Date;
  
  // Relations
  folder: FolderWithContents;
  sharer: User;
  recipient?: User;
}

export interface CreateFolderShareInput {
  folderId: string;
  shareType: "user" | "organization" | "public" | "link";
  sharedWith?: string;
  permissions: FolderPermissions;
  expiresAt?: Date;
}

// ================================
// FOLDER TEMPLATES
// ================================

export interface FolderTemplate {
  id: string;
  name: string;
  description?: string;
  structure: FolderTemplateNode[];
  category: "business" | "personal" | "project" | "marketing" | "other";
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  
  // Relations
  creator: User;
}

export interface FolderTemplateNode {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  children?: FolderTemplateNode[];
  qrCodeTemplates?: Array<{
    name: string;
    type: string;
    templateId?: string;
  }>;
}

export interface ApplyFolderTemplateInput {
  templateId: string;
  parentId?: string;
  namePrefix?: string;
}

// ================================
// FOLDER IMPORT/EXPORT
// ================================

export interface FolderExportData {
  folder: FolderWithContents;
  includeQRCodes: boolean;
  includeSubfolders: boolean;
  qrCodes?: Array<{
    id: string;
    name: string;
    type: string;
    data: Record<string, any>;
    createdAt: Date;
  }>;
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    version: string;
  };
}

export interface FolderImportOptions {
  parentId?: string;
  preserveStructure?: boolean;
  includeQRCodes?: boolean;
  nameConflictResolution: "rename" | "skip" | "overwrite";
  assignToUser?: string;
  assignToOrganization?: string;
}

export interface FolderImportResult {
  success: boolean;
  folder?: FolderWithContents;
  importedFolders: number;
  importedQRCodes: number;
  skippedItems: number;
  errors: Array<{
    item: string;
    error: string;
  }>;
  warnings: string[];
}

// ================================
// FOLDER ACTIVITY & HISTORY
// ================================

export interface FolderActivity {
  id: string;
  folderId: string;
  userId: string;
  action: "created" | "updated" | "deleted" | "moved" | "shared" | "qr_added" | "qr_removed";
  details?: Record<string, any>;
  timestamp: Date;
  
  // Relations
  folder: FolderWithContents;
  user: User;
}

export interface FolderActivityFilter {
  folderId?: string;
  userId?: string;
  actions?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// ================================
// FOLDER VALIDATION
// ================================

export interface FolderValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
}

export interface FolderIntegrityCheck {
  folderId: string;
  issues: Array<{
    type: "orphaned_qr" | "broken_hierarchy" | "missing_parent" | "circular_reference";
    description: string;
    severity: "low" | "medium" | "high";
    fixable: boolean;
    fix?: () => Promise<void>;
  }>;
  summary: {
    totalIssues: number;
    fixableIssues: number;
    criticalIssues: number;
  };
}

// ================================
// CONSTANTS
// ================================

export const FOLDER_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#6b7280", // gray
] as const;

export const FOLDER_ICONS = [
  "folder",
  "folder-open",
  "briefcase",
  "archive",
  "bookmark",
  "star",
  "heart",
  "tag",
  "flag",
  "home",
  "building",
  "users",
  "user",
  "calendar",
  "clock",
  "globe",
  "map",
  "camera",
  "image",
  "file",
  "database",
  "server",
  "settings",
  "tool",
  "shield",
  "lock",
  "key",
  "gift",
  "trophy",
  "target",
] as const;

export type FolderColor = typeof FOLDER_COLORS[number];
export type FolderIcon = typeof FOLDER_ICONS[number];

export const DEFAULT_FOLDER_SETTINGS = {
  color: "#6b7280",
  icon: "folder",
  sortOrder: 0,
  level: 0,
} as const;

export const SYSTEM_FOLDERS = {
  UNCATEGORIZED: "uncategorized",
  TEMPLATES: "templates",
  SHARED: "shared",
  ARCHIVE: "archive",
  TRASH: "trash",
} as const; 