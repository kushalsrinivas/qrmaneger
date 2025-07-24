"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Globe,
  User,
  Wifi,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Link2,
  Menu,
  CreditCard,
  Image,
  Video,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface QRCodeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: any;
  onUpdate: () => void;
}

interface VCardData {
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface WifiData {
  ssid?: string;
  security?: "WPA2" | "WPA3" | "WEP" | "nopass";
  password?: string;
  hidden?: boolean;
}

interface SmsData {
  phone?: string;
  message?: string;
}

interface EmailData {
  to?: string;
  subject?: string;
  body?: string;
}

interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface EventData {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

interface AppDownloadData {
  appName?: string;
  androidUrl?: string;
  iosUrl?: string;
  fallbackUrl?: string;
}

interface PaymentData {
  type?: "upi" | "paypal" | "crypto" | "bank";
  address?: string;
  amount?: number;
  currency?: string;
  note?: string;
}

interface MenuData {
  restaurantName?: string;
  menuUrl?: string;
  description?: string;
}

interface FileData {
  fileUrl?: string;
  title?: string;
  description?: string;
}

interface MultiUrlData {
  title?: string;
  description?: string;
  links?: Array<{ title: string; url: string }>;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "url":
      return Globe;
    case "vcard":
      return User;
    case "wifi":
      return Wifi;
    case "text":
      return FileText;
    case "sms":
      return MessageSquare;
    case "email":
      return Mail;
    case "phone":
      return Phone;
    case "location":
      return MapPin;
    case "event":
      return Calendar;
    case "app_download":
      return Download;
    case "multi_url":
      return Link2;
    case "menu":
      return Menu;
    case "payment":
      return CreditCard;
    case "pdf":
      return FileText;
    case "image":
      return Image;
    case "video":
      return Video;
    default:
      return Globe;
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case "url":
      return "Website URL";
    case "vcard":
      return "Contact Card";
    case "wifi":
      return "WiFi Network";
    case "text":
      return "Plain Text";
    case "sms":
      return "SMS Message";
    case "email":
      return "Email";
    case "phone":
      return "Phone Number";
    case "location":
      return "Location";
    case "event":
      return "Calendar Event";
    case "app_download":
      return "App Store";
    case "multi_url":
      return "Multi-URL Landing";
    case "menu":
      return "Digital Menu";
    case "payment":
      return "Payment";
    case "pdf":
      return "PDF Document";
    case "image":
      return "Image Gallery";
    case "video":
      return "Video";
    default:
      return "QR Code";
  }
};

export function QRCodeUpdateModal({
  isOpen,
  onClose,
  qrCode,
  onUpdate,
}: QRCodeUpdateModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<string[]>([]);

  const updateDynamicQRMutation = api.qr.updateDynamic.useMutation({
    onSuccess: () => {
      toast.success("QR code updated successfully!");
      onUpdate();
      onClose();
    },
    onError: (error) => {
      if (error.message.includes("not found")) {
        toast.error(
          "QR code not found or you don't have permission to edit it",
        );
      } else if (error.message.includes("not dynamic")) {
        toast.error("Only dynamic QR codes can be updated in-place");
      } else {
        toast.error(error.message || "Failed to update QR code");
      }
    },
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && qrCode) {
      setFormData(qrCode.data || {});
      setErrors([]);
    }
  }, [isOpen, qrCode]);

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!qrCode) return newErrors;

    switch (qrCode.type) {
      case "url":
        if (!formData.url || formData.url.trim() === "") {
          newErrors.push("URL is required");
        }
        break;
      case "text":
        if (!formData.text || formData.text.trim() === "") {
          newErrors.push("Text content is required");
        }
        break;
      case "vcard":
        const vcard = formData as VCardData;
        if (!vcard.firstName || !vcard.lastName) {
          newErrors.push("First name and last name are required");
        }
        break;
      case "wifi":
        const wifi = formData as WifiData;
        if (!wifi.ssid) {
          newErrors.push("Network name is required");
        }
        if (wifi.security !== "nopass" && !wifi.password) {
          newErrors.push("Password is required for secured networks");
        }
        break;
      case "sms":
        const sms = formData as SmsData;
        if (!sms.phone || !sms.message) {
          newErrors.push("Phone number and message are required");
        }
        break;
      case "email":
        const email = formData as EmailData;
        if (!email.to) {
          newErrors.push("Email address is required");
        }
        break;
      case "phone":
        if (!formData.phone) {
          newErrors.push("Phone number is required");
        }
        break;
      case "location":
        const location = formData as LocationData;
        if (!location.latitude || !location.longitude) {
          newErrors.push("Latitude and longitude are required");
        }
        break;
      case "event":
        const event = formData as EventData;
        if (!event.title || !event.startDate) {
          newErrors.push("Event title and start date are required");
        }
        break;
      case "app_download":
        const app = formData as AppDownloadData;
        if (!app.appName) {
          newErrors.push("App name is required");
        }
        break;
      case "payment":
        const payment = formData as PaymentData;
        if (!payment.type || !payment.address) {
          newErrors.push("Payment type and address are required");
        }
        break;
      case "menu":
        const menu = formData as MenuData;
        if (!menu.restaurantName || !menu.menuUrl) {
          newErrors.push("Restaurant name and menu URL are required");
        }
        break;
      case "pdf":
      case "image":
      case "video":
        const file = formData as FileData;
        if (!file.fileUrl) {
          newErrors.push("File URL is required");
        }
        break;
      case "multi_url":
        const multiUrl = formData as MultiUrlData;
        if (!multiUrl.title) {
          newErrors.push("Landing page title is required");
        }
        break;
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      toast.error("Please fix the validation errors before updating");
      return;
    }

    updateDynamicQRMutation.mutate({
      qrCodeId: qrCode.id,
      data: formData,
    });
  };

  const updateFormData = (updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const renderFormFields = () => {
    if (!qrCode) return null;

    switch (qrCode.type) {
      case "url":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={formData.url || ""}
                onChange={(e) => updateFormData({ url: e.target.value })}
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Text Content *</Label>
              <Textarea
                id="text"
                placeholder="Enter your text message..."
                value={formData.text || ""}
                onChange={(e) => updateFormData({ text: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "vcard":
        const vcard = formData as VCardData;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={vcard.firstName || ""}
                  onChange={(e) =>
                    updateFormData({ firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={vcard.lastName || ""}
                  onChange={(e) => updateFormData({ lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="Company Name"
                value={vcard.organization || ""}
                onChange={(e) =>
                  updateFormData({ organization: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Job Title"
                value={vcard.title || ""}
                onChange={(e) => updateFormData({ title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={vcard.phone || ""}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={vcard.email || ""}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={vcard.website || ""}
                onChange={(e) => updateFormData({ website: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Update form for {qrCode.type} type is coming soon...
            </p>
          </div>
        );
    }
  };

  if (!qrCode) return null;

  // Only show modal for dynamic QR codes
  if (!qrCode.isDynamic) {
    return null;
  }

  const Icon = getTypeIcon(qrCode.type);
  const typeName = getTypeName(qrCode.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Update {typeName}
          </DialogTitle>
          <DialogDescription>
            Update the destination URL and content for "{qrCode.name}". The QR
            code image and short link will remain unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Info */}
          <div className="bg-muted flex items-center justify-between rounded-lg p-3">
            <div>
              <p className="font-medium">{qrCode.name}</p>
              <p className="text-muted-foreground text-sm">
                Short URL: {qrCode.dynamicUrl}
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Dynamic
            </Badge>
          </div>

          {/* Form Fields */}
          <div className="max-h-96 overflow-y-auto">{renderFormFields()}</div>

          {/* Errors */}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateDynamicQRMutation.isPending}
          >
            {updateDynamicQRMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
