import type { QRCodeType, QRCodeData } from "./qr-codes";
import type { MultiUrlLink } from "./multi-url";
import type { SocialLink, CustomField } from "./social-media";

// ================================
// FORM VALIDATION TYPES
// ================================

export interface FormValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "tel" | "url" | "textarea" | "select" | "checkbox" | "radio" | "file" | "date" | "datetime-local";
  placeholder?: string;
  defaultValue?: any;
  options?: Array<{
    value: string;
    label: string;
  }>;
  validation?: FormValidationRule;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
}

export interface FormErrors {
  [fieldName: string]: string;
}

export interface FormTouched {
  [fieldName: string]: boolean;
}

export interface FormState<T = any> {
  values: T;
  errors: FormErrors;
  touched: FormTouched;
  isSubmitting: boolean;
  isValid: boolean;
}

// ================================
// QR CODE FORM TYPES
// ================================

export interface BaseFormData {
  name: string;
  description?: string;
  folderId?: string;
  templateId?: string;
  tags?: string[];
  expiresAt?: Date;
  isDynamic?: boolean;
}

export interface URLFormData extends BaseFormData {
  url: string;
}

export interface VCardFormData extends BaseFormData {
  firstName: string;
  lastName: string;
  middleName?: string;
  nickname?: string;
  title?: string;
  organization?: string;
  department?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  profileImage?: string;
  bio?: string;
  birthday?: string;
  anniversary?: string;
  note?: string;
  socialLinks?: SocialLink[];
  customFields?: CustomField[];
  assistant?: string;
  assistantPhone?: string;
  companyLogo?: string;
}

export interface WiFiFormData extends BaseFormData {
  ssid: string;
  password?: string;
  security: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface TextFormData extends BaseFormData {
  text: string;
}

export interface SMSFormData extends BaseFormData {
  phone: string;
  message?: string;
}

export interface EmailFormData extends BaseFormData {
  email: string;
  subject?: string;
  body?: string;
}

export interface PhoneFormData extends BaseFormData {
  phone: string;
}

export interface LocationFormData extends BaseFormData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface EventFormData extends BaseFormData {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  timezone?: string;
  url?: string;
}

export interface AppDownloadFormData extends BaseFormData {
  appName: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  fallbackUrl?: string;
}

export interface MultiUrlFormData extends BaseFormData {
  title: string;
  description?: string;
  links: QRLink[];
}

export interface QRLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  platform?: string;
}

// ================================
// FOLDER FORM TYPES
// ================================

export interface CreateFolderFormData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateFolderFormData extends Partial<CreateFolderFormData> {
  id: string;
}

// ================================
// TEMPLATE FORM TYPES
// ================================

export interface CreateTemplateFormData {
  name: string;
  description?: string;
  category: string;
  qrCodeType: QRCodeType;
  config: {
    style?: {
      foregroundColor?: string;
      backgroundColor?: string;
      cornerStyle?: string;
      patternStyle?: string;
      logoUrl?: string;
      logoSize?: number;
      logoPosition?: string;
    };
    size?: number;
    format?: string;
    errorCorrection?: string;
    contentTemplate?: Record<string, any>;
    variables?: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      defaultValue?: string;
      options?: string[];
    }>;
  };
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateTemplateFormData extends Partial<CreateTemplateFormData> {
  id: string;
}

// ================================
// ORGANIZATION FORM TYPES
// ================================

export interface CreateOrganizationFormData {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  settings?: {
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logo?: string;
    };
    limits?: {
      maxQRCodes?: number;
      maxUsers?: number;
      maxTemplates?: number;
    };
    features?: {
      analytics?: boolean;
      customDomains?: boolean;
      apiAccess?: boolean;
    };
  };
}

export interface UpdateOrganizationFormData extends Partial<CreateOrganizationFormData> {
  id: string;
}

export interface InviteUserFormData {
  email: string;
  role: "admin" | "team_lead" | "member" | "viewer";
  permissions?: {
    canCreateQR?: boolean;
    canEditQR?: boolean;
    canDeleteQR?: boolean;
    canViewAnalytics?: boolean;
    canManageUsers?: boolean;
    canManageSettings?: boolean;
  };
  message?: string;
}

// ================================
// USER PROFILE FORM TYPES
// ================================

export interface UpdateProfileFormData {
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone?: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ================================
// SETTINGS FORM TYPES
// ================================

export interface NotificationSettingsFormData {
  email: boolean;
  push: boolean;
  marketing: boolean;
  analytics: boolean;
}

export interface PrivacySettingsFormData {
  profileVisible: boolean;
  showEmail: boolean;
  showStats: boolean;
}

export interface AppearanceSettingsFormData {
  theme: string;
  language: string;
  dateFormat: string;
}

export interface QRDefaultsFormData {
  defaultSize: number;
  defaultFormat: string;
  defaultErrorCorrection: string;
  defaultStyle: {
    foregroundColor: string;
    backgroundColor: string;
    cornerStyle: string;
    patternStyle: string;
  };
}

export interface DashboardSettingsFormData {
  defaultView: string;
  itemsPerPage: number;
  showPreview: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

// ================================
// INTEGRATION FORM TYPES
// ================================

export interface GoogleAnalyticsFormData {
  enabled: boolean;
  trackingId: string;
}

export interface ZapierFormData {
  enabled: boolean;
  webhookUrl: string;
}

export interface SlackFormData {
  enabled: boolean;
  webhookUrl: string;
}

export interface CustomWebhookFormData {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

// ================================
// BULK OPERATIONS FORM TYPES
// ================================

export interface BulkCreateQRFormData {
  qrCodes: Array<{
    name: string;
    type: QRCodeType;
    data: QRCodeData;
    folderId?: string;
    tags?: string[];
  }>;
  options: {
    errorCorrection: string;
    size: number;
    format: string;
    customization?: {
      foregroundColor?: string;
      backgroundColor?: string;
      cornerStyle?: string;
      patternStyle?: string;
      logoUrl?: string;
      logoSize?: number;
      logoPosition?: string;
    };
  };
  templateId?: string;
  isDynamic?: boolean;
}

export interface BulkUpdateQRFormData {
  qrCodeIds: string[];
  updates: {
    folderId?: string;
    tags?: string[];
    status?: string;
    expiresAt?: Date;
  };
}

export interface BulkDeleteQRFormData {
  qrCodeIds: string[];
  confirmation: boolean;
}

// ================================
// SEARCH FORM TYPES
// ================================

export interface SearchFormData {
  query: string;
  filters: {
    type?: QRCodeType[];
    status?: string[];
    folderId?: string;
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  sort: {
    field: string;
    order: "asc" | "desc";
  };
}

// ================================
// EXPORT FORM TYPES
// ================================

export interface ExportFormData {
  format: "json" | "csv" | "xlsx";
  includeQRCodes: boolean;
  includeAnalytics: boolean;
  includeTemplates: boolean;
  includeFolders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    qrCodeIds?: string[];
    folderIds?: string[];
    templateIds?: string[];
  };
}

// ================================
// FORM HELPERS
// ================================

export type FormDataByType<T extends QRCodeType> = 
  T extends "url" ? URLFormData :
  T extends "vcard" ? VCardFormData :
  T extends "wifi" ? WiFiFormData :
  T extends "text" ? TextFormData :
  T extends "sms" ? SMSFormData :
  T extends "email" ? EmailFormData :
  T extends "phone" ? PhoneFormData :
  T extends "location" ? LocationFormData :
  T extends "event" ? EventFormData :
  T extends "app_download" ? AppDownloadFormData :
  T extends "multi_url" ? MultiUrlFormData :
  BaseFormData;

export interface FormConfig<T = any> {
  fields: FormField[];
  validation?: {
    [K in keyof T]?: FormValidationRule;
  };
  onSubmit: (data: T) => void | Promise<void>;
  initialValues?: Partial<T>;
  enableReinitialize?: boolean;
} 