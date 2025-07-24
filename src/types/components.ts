import type { ReactNode } from "react";
import type { QRCodeData, QRCodeType, QRCodeGenerationOptions } from "./qr-codes";
import type { MultiUrlData, MultiUrlTheme } from "./multi-url";
import type { SocialLink, CustomField } from "./social-media";

// ================================
// COMMON COMPONENT PROPS
// ================================

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface LoadingProps {
  isLoading?: boolean;
  loadingText?: string;
  loadingComponent?: ReactNode;
}

export interface ErrorProps {
  error?: string | null;
  onRetry?: () => void;
  errorComponent?: ReactNode;
}

// ================================
// QR CODE GENERATOR PROPS
// ================================

export interface QRCodeGeneratorProps {
  data: QRCodeData;
  type: QRCodeType;
  mode?: "static" | "dynamic";
  shouldGenerate?: boolean;
  onGenerationComplete?: (result: any) => void;
  options?: Partial<QRCodeGenerationOptions>;
  metadata?: {
    name?: string;
    description?: string;
    folderId?: string;
    templateId?: string;
    tags?: string[];
    expiresAt?: Date;
  };
  className?: string;
}

// ================================
// BUSINESS CARD FORM PROPS
// ================================

export interface BusinessCardFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    title?: string;
    organization?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    profileImage?: string;
    bio?: string;
    socialLinks?: SocialLink[];
    customFields?: CustomField[];
  };
  onSave?: (data: any) => void;
  onPreview?: (data: any) => void;
  isLoading?: boolean;
  className?: string;
}

// ================================
// MULTI-URL GENERATOR PROPS
// ================================

export interface MultiUrlQRGeneratorProps {
  initialData?: {
    title?: string;
    description?: string;
    links?: any[];
    theme?: MultiUrlTheme;
  };
  onSave?: (data: MultiUrlData) => void;
  onGenerate?: (data: MultiUrlData) => void;
  className?: string;
}

export interface MultiUrlLandingPageProps {
  data: MultiUrlData;
  qrCodeId?: string;
  onLinkClick?: (linkId: string, url: string) => void;
  className?: string;
}

// ================================
// ANALYTICS CHART PROPS
// ================================

export interface AnalyticsChartProps {
  data: Array<{
    date: string;
    scans: number;
  }>;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export interface QRCodeStatsProps {
  qrCodeId: string;
  timeRange?: "24h" | "7d" | "30d" | "90d" | "1y";
  showDetails?: boolean;
  className?: string;
}

// ================================
// DASHBOARD COMPONENT PROPS
// ================================

export interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
  stats: {
    totalQRCodes: number;
    totalScans: number;
  };
  className?: string;
}

export interface RecentQRCodesProps {
  limit?: number;
  showActions?: boolean;
  onQRCodeClick?: (qrCodeId: string) => void;
  className?: string;
}

export interface TopPerformersProps {
  limit?: number;
  timeRange?: "24h" | "7d" | "30d";
  className?: string;
}

// ================================
// QR CODE UPDATE MODAL PROPS
// ================================

export interface QRCodeUpdateModalProps {
  qrCodeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  className?: string;
}

// ================================
// SIDEBAR PROPS
// ================================

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  isActive?: boolean;
  children?: NavigationItem[];
}

// ================================
// QUICK ACTIONS PROPS
// ================================

export interface QuickActionsProps {
  onCreateQR?: () => void;
  onCreateFolder?: () => void;
  onCreateTemplate?: () => void;
  onBulkImport?: () => void;
  className?: string;
}

// ================================
// QR CODE CUSTOMIZER PROPS
// ================================

export interface QRCodeCustomizerProps {
  initialStyle?: {
    foregroundColor?: string;
    backgroundColor?: string;
    cornerStyle?: "square" | "rounded" | "circle";
    patternStyle?: "square" | "rounded" | "circle";
    logoUrl?: string;
    logoSize?: number;
    logoPosition?: "center" | "top" | "bottom";
  };
  onStyleChange?: (style: any) => void;
  showPreview?: boolean;
  className?: string;
}

// ================================
// ORGANIZATION SECTION PROPS
// ================================

export interface OrganizationSectionProps {
  organization?: {
    id: string;
    name: string;
    logo?: string;
    memberCount: number;
  };
  onCreateOrganization?: () => void;
  onJoinOrganization?: () => void;
  className?: string;
}

// ================================
// PRO TIPS PROPS
// ================================

export interface ProTipsProps {
  tips?: Array<{
    id: string;
    title: string;
    description: string;
    icon?: ReactNode;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  showDismiss?: boolean;
  onDismiss?: (tipId: string) => void;
  className?: string;
}

// ================================
// SESSION PROVIDER PROPS
// ================================

export interface SessionProviderProps {
  children: ReactNode;
  session?: any;
  basePath?: string;
  refetchInterval?: number;
}

// ================================
// TOP RIGHT NAVIGATION PROPS
// ================================

export interface TopRightNavigationProps {
  user?: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    type: "info" | "success" | "warning" | "error";
  }>;
  onNotificationClick?: (notificationId: string) => void;
  className?: string;
}

// ================================
// FORM COMPONENT PROPS
// ================================

export interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  className?: string;
}

export interface FormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

// ================================
// TABLE COMPONENT PROPS
// ================================

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index: number) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
    className?: string;
  };
  className?: string;
}

// ================================
// MODAL COMPONENT PROPS
// ================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  maskClosable?: boolean;
  footer?: ReactNode;
  className?: string;
}

// ================================
// UPLOAD COMPONENT PROPS
// ================================

export interface UploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  onProgress?: (progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showProgress?: boolean;
  dragAndDrop?: boolean;
  className?: string;
}

// ================================
// SEARCH COMPONENT PROPS
// ================================

export interface SearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  debounceMs?: number;
  className?: string;
} 