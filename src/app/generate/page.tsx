"use client";

import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { QRCodeCustomizer } from "@/components/qr-code-customizer";
import { BusinessCardForm } from "@/components/business-card-form";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  User,
  Wifi,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Calendar,
  Download,
  MapPin,
  CreditCard,
  Image,
  Video,
  Menu,
  Link2,
  Palette,
  Eye,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

// ===== TYPE DEFINITIONS =====
interface QRLink {
  title: string;
  url: string;
}

interface BaseFormData {
  // Common fields
  name?: string;
  title?: string;
  description?: string;
}

interface UrlFormData extends BaseFormData {
  url: string;
}

interface TextFormData extends BaseFormData {
  text: string;
}

interface VCardFormData extends BaseFormData {
  firstName: string;
  lastName: string;
  organization?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface WifiFormData extends BaseFormData {
  ssid: string;
  security: "WPA2" | "WPA3" | "WEP" | "nopass";
  password?: string;
  hidden?: boolean;
}

interface SmsFormData extends BaseFormData {
  phone: string;
  message: string;
}

interface EmailFormData extends BaseFormData {
  to: string;
  subject?: string;
  body?: string;
}

interface PhoneFormData extends BaseFormData {
  phone: string;
}

interface LocationFormData extends BaseFormData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface EventFormData extends BaseFormData {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
}

interface AppDownloadFormData extends BaseFormData {
  appName: string;
  androidUrl?: string;
  iosUrl?: string;
  fallbackUrl?: string;
}

interface PaymentFormData extends BaseFormData {
  type: "upi" | "paypal" | "crypto" | "bank";
  address: string;
  amount?: number;
  currency?: string;
  note?: string;
}

interface MenuFormData extends BaseFormData {
  restaurantName: string;
  menuUrl: string;
  description?: string;
}

interface FileFormData extends BaseFormData {
  fileUrl: string;
  title?: string;
  description?: string;
}

interface ImageFormData extends BaseFormData {
  imageUrl: string;
  title?: string;
  description?: string;
}

interface VideoFormData extends BaseFormData {
  videoUrl: string;
  title?: string;
  description?: string;
}

interface MultiUrlFormData extends BaseFormData {
  title: string;
  description?: string;
  links: QRLink[];
}

type FormData =
  | UrlFormData
  | TextFormData
  | VCardFormData
  | WifiFormData
  | SmsFormData
  | EmailFormData
  | PhoneFormData
  | LocationFormData
  | EventFormData
  | AppDownloadFormData
  | PaymentFormData
  | MenuFormData
  | FileFormData
  | ImageFormData
  | VideoFormData
  | MultiUrlFormData;

interface QRCustomization {
  size: number;
  errorCorrection: "L" | "M" | "Q" | "H";
  foregroundColor: string;
  backgroundColor: string;
  cornerStyle: string;
  logoUrl: string;
  logoSize: number;
}

interface QRType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
  category: string;
}

interface FormStep {
  id: number;
  name: string;
  description: string;
  isValid: boolean;
}

// ===== FORM CONTEXT =====
interface FormContextType {
  currentStep: number;
  selectedType: string;
  isDynamic: boolean;
  formData: Partial<FormData>;
  customization: QRCustomization;
  errors: string[];
  isEditMode: boolean;
  editQRCodeId: string | null;

  // Actions
  setCurrentStep: (step: number) => void;
  setSelectedType: (type: string) => void;
  setIsDynamic: (dynamic: boolean) => void;
  updateFormData: (data: Partial<FormData>) => void;
  updateCustomization: (customization: Partial<QRCustomization>) => void;
  validateStep: (step: number) => boolean;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | null>(null);

const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within FormProvider");
  }
  return context;
};

// ===== CONSTANTS =====
const QR_TYPES: QRType[] = [
  {
    id: "url",
    name: "Website URL",
    description: "Link to any website or webpage",
    icon: Globe,
    popular: true,
    category: "basic",
  },
  {
    id: "vcard",
    name: "Contact Card",
    description: "Share contact information",
    icon: User,
    popular: true,
    category: "basic",
  },
  {
    id: "wifi",
    name: "WiFi Network",
    description: "Connect to WiFi automatically",
    icon: Wifi,
    popular: true,
    category: "basic",
  },
  {
    id: "text",
    name: "Plain Text",
    description: "Display custom text message",
    icon: FileText,
    popular: false,
    category: "basic",
  },
  {
    id: "sms",
    name: "SMS Message",
    description: "Send a text message",
    icon: MessageSquare,
    popular: false,
    category: "communication",
  },
  {
    id: "email",
    name: "Email",
    description: "Compose an email",
    icon: Mail,
    popular: false,
    category: "communication",
  },
  {
    id: "phone",
    name: "Phone Number",
    description: "Make a phone call",
    icon: Phone,
    popular: false,
    category: "communication",
  },
  {
    id: "location",
    name: "Location",
    description: "Share GPS coordinates",
    icon: MapPin,
    popular: false,
    category: "advanced",
  },
  {
    id: "event",
    name: "Calendar Event",
    description: "Add event to calendar",
    icon: Calendar,
    popular: false,
    category: "advanced",
  },
  {
    id: "app_download",
    name: "App Store",
    description: "Download mobile app",
    icon: Download,
    popular: false,
    category: "advanced",
  },
  {
    id: "multi_url",
    name: "Multi-URL Landing",
    description: "Linktree-style landing page",
    icon: Link2,
    popular: false,
    category: "advanced",
  },
  {
    id: "menu",
    name: "Digital Menu",
    description: "Restaurant menu",
    icon: Menu,
    popular: false,
    category: "business",
  },
  {
    id: "payment",
    name: "Payment",
    description: "Accept payments",
    icon: CreditCard,
    popular: false,
    category: "business",
  },
  {
    id: "pdf",
    name: "PDF Document",
    description: "Share PDF files",
    icon: FileText,
    popular: false,
    category: "media",
  },
  {
    id: "image",
    name: "Image Gallery",
    description: "Display images",
    icon: Image,
    popular: false,
    category: "media",
  },
  {
    id: "video",
    name: "Video",
    description: "Share video content",
    icon: Video,
    popular: false,
    category: "media",
  },
];

// ===== VALIDATION FUNCTIONS =====
const validateFormData = (type: string, data: Partial<FormData>): string[] => {
  const errors: string[] = [];

  switch (type) {
    case "url":
      const urlData = data as Partial<UrlFormData>;
      if (
        !urlData.url ||
        (typeof urlData.url === "string" && urlData.url.trim() === "")
      ) {
        errors.push("URL is required");
      }
      break;
    case "text":
      const textData = data as Partial<TextFormData>;
      if (
        !textData.text ||
        (typeof textData.text === "string" && textData.text.trim() === "")
      ) {
        errors.push("Text content is required");
      }
      break;
    case "vcard":
      const vcard = data as VCardFormData;
      if (!vcard.firstName || !vcard.lastName) {
        errors.push("First name and last name are required");
      }
      break;


      
    case "email":
      const email = data as EmailFormData;
      if (!email.to) {
        errors.push("Email address is required");
      }
      break;
    case "phone":
      const phone = data as PhoneFormData;
      if (!phone.phone) {
        errors.push("Phone number is required");
      }
      break;
    case "location":
      const location = data as LocationFormData;
      if (!location.latitude || !location.longitude) {
        errors.push("Latitude and longitude are required");
      }
      break;
    case "event":
      const event = data as EventFormData;
      if (!event.title || !event.startDate) {
        errors.push("Event title and start date are required");
      }
      break;
    case "app_download":
      const app = data as AppDownloadFormData;
      if (!app.appName) {
        errors.push("App name is required");
      }
      break;
    case "payment":
      const payment = data as PaymentFormData;
      if (!payment.type || !payment.address) {
        errors.push("Payment type and address are required");
      }
      break;
    case "menu":
      const menu = data as MenuFormData;
      if (!menu.restaurantName || !menu.menuUrl) {
        errors.push("Restaurant name and menu URL are required");
      }
      break;
    case "pdf":
      const pdf = data as FileFormData;
      if (!pdf.fileUrl) {
        errors.push("PDF file URL is required");
      }
      break;
    case "image":
      const image = data as ImageFormData;
      if (!image.imageUrl) {
        errors.push("Image URL is required");
      }
      break;
    case "video":
      const video = data as VideoFormData;
      if (!video.videoUrl) {
        errors.push("Video URL is required");
      }
      break;
    case "multi_url":
      const multiUrl = data as MultiUrlFormData;
      if (!multiUrl.title) {
        errors.push("Landing page title is required");
      }
      break;
  }

  return errors;
};

const validateStep4 = (data: Partial<FormData>): string[] => {
  const errors: string[] = [];

  if (!data.name || data.name.trim() === "") {
    errors.push("QR Code name is required");
  }

  return errors;
};

// ===== FORM PROVIDER =====
const FormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const searchParams = useSearchParams();
  const editQRCodeId = searchParams.get("edit");

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [customization, setCustomization] = useState<QRCustomization>({
    size: 512,
    errorCorrection: "M",
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    cornerStyle: "square",
    logoUrl: "",
    logoSize: 20,
  });

  // Fetch QR code data for editing
  const { data: editQRCode, isLoading: isLoadingEdit } =
    api.qr.getById.useQuery({ id: editQRCodeId! }, { enabled: !!editQRCodeId });

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const updateCustomization = useCallback(
    (newCustomization: Partial<QRCustomization>) => {
      setCustomization((prev) => ({ ...prev, ...newCustomization }));
    },
    [],
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return selectedType !== "";
        case 2:
          return validateFormData(selectedType, formData).length === 0;
        case 3:
          return true;
        case 4:
          return validateStep4(formData).length === 0;
        default:
          return false;
      }
    },
    [selectedType, formData],
  );

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setSelectedType("");
    setFormData({});
    setCustomization({
      size: 512,
      errorCorrection: "M",
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      cornerStyle: "square",
      logoUrl: "",
      logoSize: 20,
    });
  }, []);

  // Load QR code data for editing
  useEffect(() => {
    if (editQRCode && !isLoadingEdit) {
      setSelectedType(editQRCode.type);
      setIsDynamic(editQRCode.isDynamic);

      // Set form data based on QR code type and data
      if (editQRCode.type === "url" && editQRCode.data?.url) {
        setFormData({ url: editQRCode.data.url, name: editQRCode.name });
      }

      // Set customization
      if (editQRCode.style) {
        setCustomization({
          size: editQRCode.size ?? 512,
          errorCorrection:
            (editQRCode.errorCorrection as "L" | "M" | "Q" | "H") ?? "M",
          foregroundColor: editQRCode.style.foregroundColor ?? "#000000",
          backgroundColor: editQRCode.style.backgroundColor ?? "#ffffff",
          cornerStyle: editQRCode.style.cornerStyle ?? "square",
          logoUrl: editQRCode.style.logoUrl ?? "",
          logoSize: editQRCode.style.logoSize ?? 20,
        });
      }

      // Skip to step 2 since type is already selected
      setCurrentStep(2);
    }
  }, [editQRCode, isLoadingEdit]);

  const errors = useMemo(() => {
    return validateFormData(selectedType, formData);
  }, [selectedType, formData]);

  const contextValue: FormContextType = {
    currentStep,
    selectedType,
    isDynamic,
    formData,
    customization,
    errors,
    isEditMode: !!editQRCodeId,
    editQRCodeId,
    setCurrentStep,
    setSelectedType: useCallback(
      (type: string) => {
        setSelectedType(type);
        if (!editQRCodeId) {
          setFormData({}); // Reset form data when type changes (but not in edit mode)
        }
      },
      [editQRCodeId],
    ),
    setIsDynamic,
    updateFormData,
    updateCustomization,
    validateStep,
    resetForm,
  };

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};

// ===== STEP COMPONENTS =====

// Step 1: Type Selection
const TypeSelectionStep: React.FC = () => {
  const { selectedType, setSelectedType, isDynamic, setIsDynamic } =
    useFormContext();

  const popularTypes = useMemo(
    () => QR_TYPES.filter((type) => type.popular),
    [],
  );

  const categorizedTypes = useMemo(
    () =>
      ["basic", "communication", "advanced", "business", "media"].reduce(
        (acc, category) => {
          const categoryTypes = QR_TYPES.filter(
            (type) => type.category === category && !type.popular,
          );
          if (categoryTypes.length > 0) {
            acc[category] = categoryTypes;
          }
          return acc;
        },
        {} as Record<string, QRType[]>,
      ),
    [],
  );

  const QRTypeCard: React.FC<{
    type: QRType;
    isSelected: boolean;
    onSelect: (typeId: string) => void;
    variant?: "popular" | "regular";
  }> = ({ type, isSelected, onSelect, variant = "regular" }) => {
    const Icon = type.icon;

    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected
            ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950"
            : "hover:bg-muted",
        )}
        onClick={() => onSelect(type.id)}
      >
        <CardContent className={variant === "popular" ? "p-4" : "p-3"}>
          <div
            className={cn(
              "flex items-start space-x-3",
              variant === "regular" && "items-center space-x-2",
            )}
          >
            <div
              className={cn(
                "rounded-lg p-2",
                variant === "popular"
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "rounded bg-gray-100 p-1.5 dark:bg-gray-800",
              )}
            >
              <Icon
                className={cn(
                  variant === "popular"
                    ? "h-5 w-5 text-blue-600 dark:text-blue-400"
                    : "h-4 w-4",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className={cn(
                  "font-medium",
                  variant === "regular" && "text-sm",
                )}
              >
                {type.name}
              </h4>
              <p
                className={cn(
                  "text-muted-foreground",
                  variant === "popular" ? "text-sm" : "truncate text-xs",
                )}
              >
                {type.description}
              </p>
            </div>
            {isSelected && (
              <Check
                className={cn(
                  "text-blue-600",
                  variant === "popular" ? "h-5 w-5" : "h-4 w-4",
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
          <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Choose QR Code Type</h2>
        <p className="text-muted-foreground">
          Select the type of QR code you want to create
        </p>
      </div>

      {/* Dynamic QR Toggle */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Dynamic QR Code
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Dynamic QR codes can be edited after creation without changing
                the image
              </p>
            </div>
            <Switch checked={isDynamic} onCheckedChange={setIsDynamic} />
          </div>
        </CardContent>
      </Card>

      {/* Popular Types */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold">Popular</h3>
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
          >
            Most Used
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popularTypes.map((type) => (
            <QRTypeCard
              key={type.id}
              type={type}
              isSelected={selectedType === type.id}
              onSelect={setSelectedType}
              variant="popular"
            />
          ))}
        </div>
      </div>

      {/* Categorized Types */}
      {Object.entries(categorizedTypes).map(([category, types]) => (
        <div key={category}>
          <h3 className="mb-4 font-semibold capitalize">{category}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {types.map((type) => (
              <QRTypeCard
                key={type.id}
                type={type}
                isSelected={selectedType === type.id}
                onSelect={setSelectedType}
                variant="regular"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Step 2: Content Input
const ContentInputStep: React.FC = () => {
  const { selectedType, formData, updateFormData, errors } = useFormContext();

  const selectedTypeInfo = useMemo(
    () => QR_TYPES.find((type) => type.id === selectedType),
    [selectedType],
  );

  const Icon = selectedTypeInfo?.icon ?? Globe;

  const renderFormFields = () => {
    switch (selectedType) {
      case "url":
        return (
          <div>
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={(formData as UrlFormData).url || ""}
              onChange={(e) => updateFormData({ url: e.target.value })}
            />
          </div>
        );

      case "text":
        return (
          <div>
            <Label htmlFor="text">Text Content *</Label>
            <Textarea
              id="text"
              placeholder="Enter your text message..."
              value={(formData as TextFormData).text || ""}
              onChange={(e) => updateFormData({ text: e.target.value })}
              rows={4}
            />
          </div>
        );

      case "vcard":
        return (
          <BusinessCardForm
            value={formData as any}
            onChange={(data) => updateFormData(data)}
          />
        );

      case "wifi":
        const wifi = formData as WifiFormData;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ssid">Network Name (SSID) *</Label>
              <Input
                id="ssid"
                placeholder="MyWiFiNetwork"
                value={wifi.ssid ?? ""}
                onChange={(e) => updateFormData({ ssid: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="security">Security Type *</Label>
              <Select
                value={wifi.security ?? ""}
                onValueChange={(value) =>
                  updateFormData({
                    security: value as WifiFormData["security"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select security type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA2">WPA/WPA2</SelectItem>
                  <SelectItem value="WPA3">WPA3</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">No Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {wifi.security !== "nopass" && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter WiFi password"
                  value={wifi.password ?? ""}
                  onChange={(e) => updateFormData({ password: e.target.value })}
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="hidden"
                checked={wifi.hidden ?? false}
                onCheckedChange={(checked) =>
                  updateFormData({ hidden: checked })
                }
              />
              <Label htmlFor="hidden">Hidden Network</Label>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Form for {selectedType} type is coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950">
          <Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Add Content</h2>
        <p className="text-muted-foreground">Enter your information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {selectedTypeInfo?.name}
          </CardTitle>
          <CardDescription>{selectedTypeInfo?.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderFormFields()}

          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">
                Please fix the following errors:
              </h4>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Step 3: Customization
const CustomizationStep: React.FC = () => {
  const { customization, updateCustomization } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950">
          <Palette className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Customize Design</h2>
        <p className="text-muted-foreground">Style your QR code</p>
      </div>

      <QRCodeCustomizer
        size={customization.size}
        errorCorrection={customization.errorCorrection}
        foregroundColor={customization.foregroundColor}
        backgroundColor={customization.backgroundColor}
        cornerStyle={customization.cornerStyle}
        logoUrl={customization.logoUrl}
        logoSize={customization.logoSize}
        onCustomizationChange={updateCustomization}
      />
    </div>
  );
};

// Step 4: Preview & Generate
const PreviewStep: React.FC = () => {
  const {
    selectedType,
    isDynamic,
    formData,
    customization,
    updateFormData,
    isEditMode,
    editQRCodeId,
  } = useFormContext();
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [tags, setTags] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");

  const step4Errors = useMemo(() => validateStep4(formData), [formData]);

  const selectedTypeInfo = useMemo(
    () => QR_TYPES.find((type) => type.id === selectedType),
    [selectedType],
  );

  const transformedData = useMemo(() => {
    switch (selectedType) {
      case "url":
        return { url: (formData as UrlFormData).url };
      case "text":
        return { text: (formData as TextFormData).text };
      case "vcard":
        return { vcard: formData };
      case "wifi":
        return { wifi: formData };
      default:
        return formData;
    }
  }, [selectedType, formData]);

  const handleGenerate = () => {
    setShouldGenerate(true);
  };

  const handleDownload = (format: string) => {
    // This will be handled by the QRCodeGenerator component
    console.log(`Download ${format}`);
  };

  // Mock folders data - in real app this would come from tRPC
  const folders = [
    { id: "1", name: "Marketing" },
    { id: "2", name: "Business Cards" },
    { id: "3", name: "Events" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
          <Eye className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Preview & Generate</h2>
        <p className="text-muted-foreground">Review and save your QR code</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - QR Code Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              QR Code Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRCodeGenerator
              data={transformedData}
              type={selectedType}
              mode={isDynamic ? "dynamic" : "static"}
              shouldGenerate={shouldGenerate}
              onGenerationComplete={() => setShouldGenerate(false)}
              options={{
                errorCorrection: customization.errorCorrection,
                size: customization.size,
                format: "png",
                customization: {
                  foregroundColor: customization.foregroundColor,
                  backgroundColor: customization.backgroundColor,
                  cornerStyle: customization.cornerStyle,
                  logoUrl: customization.logoUrl,
                  logoSize: customization.logoSize,
                },
              }}
              metadata={{
                name: formData.name,
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }}
            />

            {/* URL Display */}
            <div className="mt-4 text-center">
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                URL
              </p>
              <p className="text-sm break-all">
                {selectedType === "url"
                  ? (formData as UrlFormData).url
                  : "https://www.cmd64.com"}
              </p>
            </div>

            {/* QR Code Details */}
            <div className="mt-6 space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Settings className="h-4 w-4" />
                QR Code Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{customization.size}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Error Correction
                  </span>
                  <span className="font-medium">
                    {customization.errorCorrection}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style</span>
                  <span className="font-medium">Square</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Colors</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="h-3 w-3 rounded border border-gray-300"
                      style={{ backgroundColor: customization.foregroundColor }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - QR Code Information */}
        <div className="space-y-6">
          {/* QR Code Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                QR Code Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-name">QR Code Name *</Label>
                <Input
                  id="qr-name"
                  placeholder="Enter a name for your QR code"
                  value={formData.name ?? ""}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                />
                {step4Errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                    <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                      {step4Errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="marketing, website, campaign"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Add tags to organize and find your QR codes easily
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder">Folder (Optional)</Label>
                <Select
                  value={selectedFolder}
                  onValueChange={setSelectedFolder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-folder">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save & Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Save & Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerate}
                className="w-full"
                disabled={step4Errors.length > 0}
                size="lg"
              >
                <Check className="mr-2 h-4 w-4" />
                {isEditMode ? "Update QR Code" : "Save QR Code"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("png")}
                  disabled={!shouldGenerate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("svg")}
                  disabled={!shouldGenerate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download SVG
                </Button>
              </div>

              <p className="text-muted-foreground text-center text-xs">
                Your QR code will be saved to your library and can be downloaded
                in multiple formats
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const MultiStepForm: React.FC = () => {
  const { currentStep, setCurrentStep, validateStep, isEditMode } =
    useFormContext();

  const steps: FormStep[] = [
    {
      id: 1,
      name: "Choose Type",
      description: "Select QR code type",
      isValid: validateStep(1),
    },
    {
      id: 2,
      name: "Add Content",
      description: "Enter your information",
      isValid: validateStep(2),
    },
    {
      id: 3,
      name: "Customize Design",
      description: "Style your QR code",
      isValid: validateStep(3),
    },
    {
      id: 4,
      name: "Preview & Generate",
      description: "Review and save",
      isValid: validateStep(4),
    },
  ];

  const progress = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = validateStep(currentStep);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <TypeSelectionStep />;
      case 2:
        return <ContentInputStep />;
      case 3:
        return <CustomizationStep />;
      case 4:
        return <PreviewStep />;
      default:
        return <TypeSelectionStep />;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <ArrowLeft className="text-muted-foreground hover:text-foreground h-5 w-5 cursor-pointer" />
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Edit QR Code" : "Create QR Code"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Update your QR code settings and design"
            : "Follow the steps to create your perfect QR code"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                  currentStep === step.id
                    ? "bg-blue-600 text-white"
                    : currentStep > step.id
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="font-medium">{step.name}</p>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="bg-muted mx-4 h-px flex-1" />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderCurrentStep()}</div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep === steps.length ? (
            <div /> // No next button on last step
          ) : (
            <Button onClick={nextStep} disabled={!canProceed}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== EXPORT =====
export default function GeneratePage() {
  return (
    <FormProvider>
      <MultiStepForm />
    </FormProvider>
  );
}
