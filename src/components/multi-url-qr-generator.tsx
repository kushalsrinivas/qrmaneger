"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiUrlLandingPage } from "@/components/multi-url-landing-page";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { SocialMediaService } from "@/lib/social-media-service";
import {
  type MultiUrlLink,
  type MultiUrlTheme,
  type MultiUrlThemeName,
  type SocialMediaPlatform,
  type ContactFormField,
  MULTI_URL_THEMES,
} from "@/server/db/types";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Move,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Palette,
  Type,
  Layout,
  Code,
  Globe,
  Share2,
  Settings,
  Image,
  Link,
  ExternalLink,
  Mail,
  Phone,
  Download,
  MessageCircle,
  Smartphone,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Save,
  Wand2,
} from "lucide-react";

// ================================
// INTERFACES
// ================================

interface MultiUrlQRGeneratorProps {
  initialData?: {
    title?: string;
    description?: string;
    links?: MultiUrlLink[];
    theme?: MultiUrlTheme;
  };
  onSave?: (data: any) => void;
  onGenerate?: (data: any) => void;
}

interface LinkFormData {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  iconType?: "emoji" | "image" | "platform";
  platform?: string;
  linkType?:
    | "standard"
    | "social"
    | "email"
    | "phone"
    | "app"
    | "file"
    | "contact";
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  isActive?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
  metadata?: {
    subject?: string;
    body?: string;
    downloadFilename?: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
  };
}

// ================================
// CONSTANTS
// ================================

const DEVICE_PREVIEWS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
};

const LINK_TYPES = [
  { value: "standard", label: "Standard Link", icon: ExternalLink },
  { value: "social", label: "Social Media", icon: Share2 },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "app", label: "App Download", icon: Smartphone },
  { value: "file", label: "File Download", icon: Download },
  { value: "contact", label: "Contact Form", icon: MessageCircle },
];

const THEME_NAMES: MultiUrlThemeName[] = [
  "professional",
  "creative",
  "minimalist",
  "dark",
  "neon",
  "vintage",
  "gradient",
];

// ================================
// MAIN COMPONENT
// ================================

export const MultiUrlQRGenerator: React.FC<MultiUrlQRGeneratorProps> = ({
  initialData,
  onSave,
  onGenerate,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState("content");
  const [previewDevice, setPreviewDevice] = useState<
    "mobile" | "tablet" | "desktop"
  >("mobile");
  const [showPreview, setShowPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    title: initialData?.title || "",
    description: initialData?.description || "",
    bio: "",

    // Profile Information
    profileImage: "",
    profileName: "",
    profileTitle: "",

    // Links
    links: initialData?.links || [],

    // Theme
    theme: initialData?.theme || MULTI_URL_THEMES.professional,

    // SEO
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
    },

    // Social Media
    socialMedia: {
      platforms: [],
      showSocialProof: false,
      socialProofText: "",
    },

    // Features
    features: {
      contactFormEnabled: false,
      contactFormFields: [],
      pwaEnabled: false,
      trackingEnabled: false,
    },
  });

  // Link management
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [linkFormData, setLinkFormData] = useState<LinkFormData>({
    id: "",
    title: "",
    url: "",
    description: "",
    icon: "",
    iconType: "emoji",
    linkType: "standard",
    isActive: true,
  });

  // Auto-detect social media platforms
  useEffect(() => {
    const autoDetectedLinks = SocialMediaService.autoDetectAndFormat(
      formData.links.map((link) => ({
        title: link.title,
        url: link.url,
        icon: link.icon,
      })),
    );

    // Update links with auto-detected data
    setFormData((prev) => ({
      ...prev,
      links: prev.links.map((link) => {
        const detected = autoDetectedLinks.find((d) => d.url === link.url);
        if (detected?.autoDetected) {
          return {
            ...link,
            platform: detected.platform,
            iconType: "platform" as const,
            icon: detected.icon,
            linkType: "social" as const,
          };
        }
        return link;
      }),
    }));
  }, [formData.links.length]);

  // ================================
  // LINK MANAGEMENT
  // ================================

  const addLink = () => {
    const newLink: MultiUrlLink = {
      id: nanoid(),
      title: "New Link",
      url: "https://example.com",
      description: "",
      icon: "🔗",
      iconType: "emoji",
      linkType: "standard",
      isActive: true,
      clickCount: 0,
    };

    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));

    setEditingLink(newLink.id);
    setLinkFormData(newLink);
  };

  const updateLink = (id: string, updates: Partial<MultiUrlLink>) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      ),
    }));
  };

  const deleteLink = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link.id !== id),
    }));

    if (editingLink === id) {
      setEditingLink(null);
    }
  };

  const moveLink = (id: string, direction: "up" | "down") => {
    setFormData((prev) => {
      const links = [...prev.links];
      const index = links.findIndex((link) => link.id === id);

      if (direction === "up" && index > 0) {
        [links[index], links[index - 1]] = [links[index - 1], links[index]];
      } else if (direction === "down" && index < links.length - 1) {
        [links[index], links[index + 1]] = [links[index + 1], links[index]];
      }

      return { ...prev, links };
    });
  };

  const saveLinkEdit = () => {
    if (editingLink) {
      updateLink(editingLink, linkFormData);
      setEditingLink(null);
    }
  };

  const cancelLinkEdit = () => {
    setEditingLink(null);
  };

  // ================================
  // THEME MANAGEMENT
  // ================================

  const applyTheme = (themeName: MultiUrlThemeName) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...MULTI_URL_THEMES[themeName],
      },
    }));
  };

  const updateTheme = (updates: Partial<MultiUrlTheme>) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...updates,
      },
    }));
  };

  // ================================
  // FORM HANDLERS
  // ================================

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(formData);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const qrData = {
        multiUrl: formData,
      };
      await onGenerate?.(qrData);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ================================
  // RENDER FUNCTIONS
  // ================================

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="My Links"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Check out my links"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell people about yourself"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profileImage">Profile Image URL</Label>
            <Input
              id="profileImage"
              value={formData.profileImage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  profileImage: e.target.value,
                }))
              }
              placeholder="https://example.com/profile.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                value={formData.profileName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profileName: e.target.value,
                  }))
                }
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="profileTitle">Profile Title</Label>
              <Input
                id="profileTitle"
                value={formData.profileTitle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profileTitle: e.target.value,
                  }))
                }
                placeholder="Creator & Entrepreneur"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.links.map((link, index) => (
              <div
                key={link.id}
                className={cn(
                  "rounded-lg border p-4",
                  editingLink === link.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200",
                )}
              >
                {editingLink === link.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="linkTitle">Title</Label>
                        <Input
                          id="linkTitle"
                          value={linkFormData.title}
                          onChange={(e) =>
                            setLinkFormData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Link title"
                        />
                      </div>

                      <div>
                        <Label htmlFor="linkUrl">URL</Label>
                        <Input
                          id="linkUrl"
                          value={linkFormData.url}
                          onChange={(e) =>
                            setLinkFormData((prev) => ({
                              ...prev,
                              url: e.target.value,
                            }))
                          }
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="linkDescription">
                        Description (optional)
                      </Label>
                      <Input
                        id="linkDescription"
                        value={linkFormData.description || ""}
                        onChange={(e) =>
                          setLinkFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Link description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="linkType">Link Type</Label>
                        <Select
                          value={linkFormData.linkType}
                          onValueChange={(value) =>
                            setLinkFormData((prev) => ({
                              ...prev,
                              linkType: value as any,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LINK_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="linkIcon">Icon</Label>
                        <Input
                          id="linkIcon"
                          value={linkFormData.icon || ""}
                          onChange={(e) =>
                            setLinkFormData((prev) => ({
                              ...prev,
                              icon: e.target.value,
                            }))
                          }
                          placeholder="🔗"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="linkActive"
                        checked={linkFormData.isActive !== false}
                        onCheckedChange={(checked) =>
                          setLinkFormData((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                      <Label htmlFor="linkActive">Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={saveLinkEdit} size="sm">
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        onClick={cancelLinkEdit}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{link.icon}</span>
                      <div>
                        <div className="font-medium">{link.title}</div>
                        <div className="text-sm text-gray-500">{link.url}</div>
                      </div>
                      {!link.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => moveLink(link.id, "up")}
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => moveLink(link.id, "down")}
                        variant="ghost"
                        size="sm"
                        disabled={index === formData.links.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingLink(link.id);
                          setLinkFormData(link);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deleteLink(link.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button onClick={addLink} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderThemeTab = () => (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {THEME_NAMES.map((themeName) => (
              <Button
                key={themeName}
                onClick={() => applyTheme(themeName)}
                variant={
                  formData.theme?.themeName === themeName
                    ? "default"
                    : "outline"
                }
                className="flex h-auto flex-col items-center gap-2 p-4"
              >
                <div
                  className="h-8 w-8 rounded-full"
                  style={{
                    backgroundColor:
                      MULTI_URL_THEMES[themeName].branding?.primaryColor ||
                      "#000",
                  }}
                />
                <span className="capitalize">{themeName}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Custom Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={formData.theme?.branding?.primaryColor || "#000000"}
              onChange={(e) =>
                updateTheme({
                  branding: {
                    ...formData.theme?.branding,
                    primaryColor: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <Input
              id="backgroundColor"
              type="color"
              value={formData.theme?.branding?.backgroundColor || "#ffffff"}
              onChange={(e) =>
                updateTheme({
                  branding: {
                    ...formData.theme?.branding,
                    backgroundColor: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="textColor">Text Color</Label>
            <Input
              id="textColor"
              type="color"
              value={formData.theme?.branding?.textColor || "#000000"}
              onChange={(e) =>
                updateTheme({
                  branding: {
                    ...formData.theme?.branding,
                    textColor: e.target.value,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select
              value={
                formData.theme?.typography?.fontFamily ||
                "system-ui, sans-serif"
              }
              onValueChange={(value) =>
                updateTheme({
                  typography: {
                    ...formData.theme?.typography,
                    fontFamily: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                <SelectItem value="Inter, system-ui, sans-serif">
                  Inter
                </SelectItem>
                <SelectItem value="Poppins, system-ui, sans-serif">
                  Poppins
                </SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="Orbitron, monospace">Orbitron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="textAlign">Text Alignment</Label>
            <Select
              value={formData.theme?.typography?.textAlign || "center"}
              onValueChange={(value) =>
                updateTheme({
                  typography: {
                    ...formData.theme?.typography,
                    textAlign: value as any,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      {/* Device Selection */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => setPreviewDevice("mobile")}
            variant={previewDevice === "mobile" ? "default" : "outline"}
            size="sm"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile
          </Button>
          <Button
            onClick={() => setPreviewDevice("tablet")}
            variant={previewDevice === "tablet" ? "default" : "outline"}
            size="sm"
          >
            <Tablet className="mr-2 h-4 w-4" />
            Tablet
          </Button>
          <Button
            onClick={() => setPreviewDevice("desktop")}
            variant={previewDevice === "desktop" ? "default" : "outline"}
            size="sm"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Desktop
          </Button>
        </div>

        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="outline"
          size="sm"
        >
          {showPreview ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Preview Container */}
      {showPreview && (
        <div className="overflow-hidden rounded-lg border">
          <div
            className="mx-auto bg-white"
            style={{
              width: DEVICE_PREVIEWS[previewDevice].width,
              height: DEVICE_PREVIEWS[previewDevice].height,
              maxWidth: "100%",
            }}
          >
            <MultiUrlLandingPage
              data={formData}
              isPreview={true}
              onLinkClick={() => {}}
              onContactFormSubmit={() => {}}
              onShare={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Multi-URL QR Code Generator</h1>
        <p className="text-gray-600">
          Create a beautiful Linktree-style landing page for your QR code
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
            </TabsList>

            <TabsContent value="content">{renderContentTab()}</TabsContent>

            <TabsContent value="theme">{renderThemeTab()}</TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={handleSave} variant="outline" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || formData.links.length === 0}
            >
              {isGenerating ? "Generating..." : "Generate QR Code"}
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:sticky lg:top-6">{renderPreview()}</div>
      </div>
    </div>
  );
};

export default MultiUrlQRGenerator;
