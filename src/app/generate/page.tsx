"use client";

import { useState, useEffect } from "react";
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

// QR Code Types Configuration
const QR_TYPES = [
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

const STEPS = [
  { id: 1, name: "Choose Type", description: "Select QR code type" },
  { id: 2, name: "Add Content", description: "Enter your information" },
  { id: 3, name: "Customize Design", description: "Style your QR code" },
  { id: 4, name: "Preview & Generate", description: "Review and save" },
];

export default function GeneratePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [qrData, setQrData] = useState<any>({});
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Customization state
  const [customization, setCustomization] = useState({
    size: 512,
    errorCorrection: "M" as "L" | "M" | "Q" | "H",
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    cornerStyle: "square",
    logoUrl: "",
    logoSize: 20,
  });

  const progress = (currentStep / STEPS.length) * 100;

  // Navigation functions
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedType !== "";
      case 2:
        return validateCurrentStepData();
      case 3:
        return true;
      default:
        return true;
    }
  };

  const validateCurrentStepData = () => {
    const errors: string[] = [];

    switch (selectedType) {
      case "url":
        if (!qrData.url || qrData.url.trim() === "") {
          errors.push("URL is required");
        }
        break;
      case "text":
        if (!qrData.text || qrData.text.trim() === "") {
          errors.push("Text content is required");
        }
        break;
      case "vcard":
        if (!qrData.firstName || !qrData.lastName) {
          errors.push("First name and last name are required");
        }
        break;
      case "wifi":
        if (!qrData.ssid || !qrData.security) {
          errors.push("Network name and security type are required");
        }
        if (qrData.security !== "nopass" && !qrData.password) {
          errors.push("Password is required for secured networks");
        }
        break;
      case "sms":
        if (!qrData.phone || !qrData.message) {
          errors.push("Phone number and message are required");
        }
        break;
      case "email":
        if (!qrData.to) {
          errors.push("Email address is required");
        }
        break;
      case "phone":
        if (!qrData.phone) {
          errors.push("Phone number is required");
        }
        break;
      case "location":
        if (!qrData.latitude || !qrData.longitude) {
          errors.push("Latitude and longitude are required");
        }
        break;
      case "event":
        if (!qrData.title || !qrData.startDate) {
          errors.push("Event title and start date are required");
        }
        break;
      case "app_download":
        if (!qrData.appName) {
          errors.push("App name is required");
        }
        break;
      case "payment":
        if (!qrData.type || !qrData.address) {
          errors.push("Payment type and address are required");
        }
        break;
      case "menu":
        if (!qrData.restaurantName || !qrData.menuUrl) {
          errors.push("Restaurant name and menu URL are required");
        }
        break;
      case "pdf":
        if (!qrData.fileUrl) {
          errors.push("PDF file URL is required");
        }
        break;
      case "image":
        if (!qrData.imageUrl) {
          errors.push("Image URL is required");
        }
        break;
      case "video":
        if (!qrData.videoUrl) {
          errors.push("Video URL is required");
        }
        break;
      case "multi_url":
        if (!qrData.title) {
          errors.push("Landing page title is required");
        }
        break;
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleGenerate = () => {
    if (validateCurrentStepData()) {
      setShouldGenerate(true);
    }
  };

  const handleCustomizationChange = (
    newCustomization: Partial<typeof customization>,
  ) => {
    setCustomization((prev) => ({ ...prev, ...newCustomization }));
    if (shouldGenerate) {
      setShouldGenerate(true);
    }
  };

  // Step 1: Type Selection
  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
          <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">QR Code Type</h2>
        <p className="text-muted-foreground">Select QR code type</p>
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
            Popular
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QR_TYPES.filter((type) => type.popular).map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedType === type.id
                    ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950"
                    : "hover:bg-muted",
                )}
                onClick={() => setSelectedType(type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {type.description}
                      </p>
                    </div>
                    {selectedType === type.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* All Types by Category */}
      {["basic", "communication", "advanced", "business", "media"].map(
        (category) => {
          const categoryTypes = QR_TYPES.filter(
            (type) => type.category === category && !type.popular,
          );

          if (categoryTypes.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="mb-4 font-semibold capitalize">{category}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {categoryTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedType === type.id
                          ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950"
                          : "hover:bg-muted",
                      )}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="rounded bg-gray-100 p-1.5 dark:bg-gray-800">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium">{type.name}</h4>
                            <p className="text-muted-foreground truncate text-xs">
                              {type.description}
                            </p>
                          </div>
                          {selectedType === type.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        },
      )}
    </div>
  );

  // Step 2: Content Input
  const renderContentInput = () => {
    const selectedTypeInfo = QR_TYPES.find((type) => type.id === selectedType);
    const Icon = selectedTypeInfo?.icon || Globe;

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
            {renderTypeSpecificForm()}

            {formErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">
                  Please fix the following errors:
                </h4>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  {formErrors.map((error, index) => (
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

  // Type-specific form rendering
  const renderTypeSpecificForm = () => {
    switch (selectedType) {
      case "url":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={qrData.url || ""}
                onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
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
                value={qrData.text || ""}
                onChange={(e) => setQrData({ ...qrData, text: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "vcard":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={qrData.firstName || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={qrData.lastName || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="Company Name"
                value={qrData.organization || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, organization: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Job Title"
                value={qrData.title || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={qrData.phone || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={qrData.email || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={qrData.website || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, website: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "wifi":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ssid">Network Name (SSID) *</Label>
              <Input
                id="ssid"
                placeholder="MyWiFiNetwork"
                value={qrData.ssid || ""}
                onChange={(e) => setQrData({ ...qrData, ssid: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="security">Security Type *</Label>
              <Select
                value={qrData.security || ""}
                onValueChange={(value) =>
                  setQrData({ ...qrData, security: value })
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
            {qrData.security !== "nopass" && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter WiFi password"
                  value={qrData.password || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, password: e.target.value })
                  }
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="hidden"
                checked={qrData.hidden || false}
                onCheckedChange={(checked) =>
                  setQrData({ ...qrData, hidden: checked })
                }
              />
              <Label htmlFor="hidden">Hidden Network</Label>
            </div>
          </div>
        );

      case "sms":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={qrData.phone || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={qrData.message || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, message: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">Email Address *</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={qrData.to || ""}
                onChange={(e) => setQrData({ ...qrData, to: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={qrData.subject || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, subject: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Email message..."
                value={qrData.body || ""}
                onChange={(e) => setQrData({ ...qrData, body: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "phone":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={qrData.phone || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, phone: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="40.7128"
                  value={qrData.latitude || ""}
                  onChange={(e) =>
                    setQrData({
                      ...qrData,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-74.0060"
                  value={qrData.longitude || ""}
                  onChange={(e) =>
                    setQrData({
                      ...qrData,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                value={qrData.address || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, address: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "event":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="My Event"
                value={qrData.title || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event description..."
                value={qrData.description || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Event venue"
                value={qrData.location || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, location: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={qrData.startDate || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={qrData.endDate || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "app_download":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="appName">App Name *</Label>
              <Input
                id="appName"
                placeholder="My Awesome App"
                value={qrData.appName || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, appName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="androidUrl">Android App URL</Label>
              <Input
                id="androidUrl"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={qrData.androidUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, androidUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="iosUrl">iOS App URL</Label>
              <Input
                id="iosUrl"
                placeholder="https://apps.apple.com/app/..."
                value={qrData.iosUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, iosUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="fallbackUrl">Fallback URL</Label>
              <Input
                id="fallbackUrl"
                placeholder="https://example.com"
                value={qrData.fallbackUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, fallbackUrl: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentType">Payment Type *</Label>
              <Select
                value={qrData.type || ""}
                onValueChange={(value) => setQrData({ ...qrData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI (India)</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Payment Address *</Label>
              <Input
                id="address"
                placeholder="Payment address or ID"
                value={qrData.address || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={qrData.amount || ""}
                  onChange={(e) =>
                    setQrData({ ...qrData, amount: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={qrData.currency || ""}
                  onValueChange={(value) =>
                    setQrData({ ...qrData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                placeholder="Payment description"
                value={qrData.note || ""}
                onChange={(e) => setQrData({ ...qrData, note: e.target.value })}
              />
            </div>
          </div>
        );

      case "menu":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="restaurantName">Restaurant Name *</Label>
              <Input
                id="restaurantName"
                placeholder="My Restaurant"
                value={qrData.restaurantName || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, restaurantName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="menuUrl">Menu URL *</Label>
              <Input
                id="menuUrl"
                placeholder="https://example.com/menu"
                value={qrData.menuUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, menuUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Restaurant description..."
                value={qrData.description || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileUrl">PDF File URL *</Label>
              <Input
                id="fileUrl"
                placeholder="https://example.com/document.pdf"
                value={qrData.fileUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, fileUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="Document title"
                value={qrData.title || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Document description..."
                value={qrData.description || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={qrData.imageUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, imageUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="title">Image Title</Label>
              <Input
                id="title"
                placeholder="Image title"
                value={qrData.title || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Image description..."
                value={qrData.description || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/watch?v=..."
                value={qrData.videoUrl || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, videoUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                placeholder="Video title"
                value={qrData.title || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Video description..."
                value={qrData.description || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        );

      case "multi_url":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Landing Page Title *</Label>
              <Input
                id="title"
                placeholder="My Links"
                value={qrData.title || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description of your landing page..."
                value={qrData.description || ""}
                onChange={(e) =>
                  setQrData({ ...qrData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label>Links</Label>
              <div className="space-y-2">
                {(qrData.links || []).map((link: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Link title"
                      value={link.title || ""}
                      onChange={(e) => {
                        const newLinks = [...(qrData.links || [])];
                        newLinks[index] = { ...link, title: e.target.value };
                        setQrData({ ...qrData, links: newLinks });
                      }}
                    />
                    <Input
                      placeholder="https://example.com"
                      value={link.url || ""}
                      onChange={(e) => {
                        const newLinks = [...(qrData.links || [])];
                        newLinks[index] = { ...link, url: e.target.value };
                        setQrData({ ...qrData, links: newLinks });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newLinks = (qrData.links || []).filter(
                          (_: any, i: number) => i !== index,
                        );
                        setQrData({ ...qrData, links: newLinks });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newLinks = [
                      ...(qrData.links || []),
                      { title: "", url: "" },
                    ];
                    setQrData({ ...qrData, links: newLinks });
                  }}
                >
                  Add Link
                </Button>
              </div>
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

  // Step 3: Customization
  const renderCustomization = () => (
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
        onCustomizationChange={handleCustomizationChange}
      />
    </div>
  );

  // Step 4: Preview & Generate
  const renderPreviewGenerate = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
          <Eye className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Preview & Generate</h2>
        <p className="text-muted-foreground">Review and save</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">
                {QR_TYPES.find((t) => t.id === selectedType)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode:</span>
              <Badge variant={isDynamic ? "default" : "secondary"}>
                {isDynamic ? "Dynamic" : "Static"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{customization.size}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error Correction:</span>
              <span className="font-medium">
                {customization.errorCorrection}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Preview */}
        <QRCodeGenerator
          data={transformQRData()}
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
        />
      </div>
    </div>
  );

  // Transform QR data based on type
  const transformQRData = () => {
    switch (selectedType) {
      case "url":
        return { url: qrData.url };
      case "text":
        return { text: qrData.text };
      case "vcard":
        return { vcard: qrData };
      case "wifi":
        return { wifi: qrData };
      case "sms":
        return { sms: qrData };
      case "email":
        return { email: qrData };
      case "phone":
        return qrData.phone;
      case "location":
        return { location: qrData };
      case "event":
        return { event: qrData };
      case "app_download":
        return { appDownload: qrData };
      case "payment":
        return { payment: qrData };
      case "menu":
        return { menu: qrData };
      case "pdf":
        return { pdf: qrData };
      case "image":
        return { image: qrData };
      case "video":
        return { video: qrData };
      case "multi_url":
        return { multiUrl: qrData };
      default:
        return qrData;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <ArrowLeft className="text-muted-foreground hover:text-foreground h-5 w-5 cursor-pointer" />
          <h1 className="text-3xl font-bold">Create QR Code</h1>
        </div>
        <p className="text-muted-foreground">
          Follow the steps to create your QR code
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {STEPS.map((step, index) => (
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
              {index < STEPS.length - 1 && (
                <div className="bg-muted mx-4 h-px flex-1" />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && renderTypeSelection()}
        {currentStep === 2 && renderContentInput()}
        {currentStep === 3 && renderCustomization()}
        {currentStep === 4 && renderPreviewGenerate()}
      </div>

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
          {currentStep === STEPS.length ? (
            <Button onClick={handleGenerate} disabled={!canProceedToNextStep()}>
              Generate QR Code
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceedToNextStep()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
