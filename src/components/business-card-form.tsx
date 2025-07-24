"use client";

import { useState, useCallback, useRef } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Trash2,
} from "lucide-react";
import {
  SOCIAL_PLATFORMS,
  PLATFORM_CATEGORIES,
  getPlatformById,
  generatePlatformUrl,
} from "@/lib/social-platforms";
import type { SocialPlatform } from "@/lib/social-platforms";

interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
  type: "text" | "email" | "phone" | "url";
  order: number;
}

interface BusinessCardData {
  // Basic information
  firstName: string;
  lastName: string;
  middleName?: string;
  title?: string;
  organization?: string;
  department?: string;

  // Contact information
  email?: string;
  phone?: string;
  website?: string;

  // Profile
  profileImage?: string;
  bio?: string;

  // Address
  address?: string;

  // Social links and custom fields
  socialLinks?: SocialLink[];
  customFields?: CustomField[];
}

interface BusinessCardFormProps {
  value?: BusinessCardData;
  onChange?: (data: BusinessCardData) => void;
}

export function BusinessCardForm({ value, onChange }: BusinessCardFormProps) {
  const [formData, setFormData] = useState<BusinessCardData>(
    value || {
      firstName: "",
      lastName: "",
      socialLinks: [],
      customFields: [],
    },
  );

  const [isUploading, setIsUploading] = useState(false);
  const [showSocialPlatforms, setShowSocialPlatforms] = useState(false);
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFormData = useCallback(
    (updates: Partial<BusinessCardData>) => {
      const newData = { ...formData, ...updates };
      setFormData(newData);
      onChange?.(newData);
    },
    [formData, onChange],
  );

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        updateFormData({ profileImage: result.url });
      } else {
        console.error("Upload failed:", result.error);
        // Handle error - show toast or alert
      }
    } catch (error) {
      console.error("Upload error:", error);

    } finally {
      setIsUploading(false);
    }
  };

  const addSocialLink = (platform: SocialPlatform) => {
    const newLink: SocialLink = {
      id: crypto.randomUUID(),
      platform: platform.id,
      label: platform.label,
      url: "",
      icon: platform.icon,
      order: (formData.socialLinks?.length || 0) + 1,
    };

    updateFormData({
      socialLinks: [...(formData.socialLinks || []), newLink],
    });
    setShowSocialPlatforms(false);
  };

  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    const updatedLinks =
      formData.socialLinks?.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      ) || [];

    updateFormData({ socialLinks: updatedLinks });
  };

  const removeSocialLink = (id: string) => {
    const updatedLinks =
      formData.socialLinks?.filter((link) => link.id !== id) || [];
    updateFormData({ socialLinks: updatedLinks });
  };

  const addCustomField = (type: CustomField["type"] = "text") => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: "",
      value: "",
      type,
      order: (formData.customFields?.length || 0) + 1,
    };

    updateFormData({
      customFields: [...(formData.customFields || []), newField],
    });
    setShowCustomFieldForm(false);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    const updatedFields =
      formData.customFields?.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ) || [];

    updateFormData({ customFields: updatedFields });
  };

  const removeCustomField = (id: string) => {
    const updatedFields =
      formData.customFields?.filter((field) => field.id !== id) || [];
    updateFormData({ customFields: updatedFields });
  };

  const moveSocialLink = (id: string, direction: "up" | "down") => {
    if (!formData.socialLinks) return;

    const links = [...formData.socialLinks];
    const index = links.findIndex((link) => link.id === id);

    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === links.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    [links[index], links[newIndex]] = [links[newIndex], links[index]];

    // Update order values
    links.forEach((link, idx) => {
      link.order = idx + 1;
    });

    updateFormData({ socialLinks: links });
  };

  const moveCustomField = (id: string, direction: "up" | "down") => {
    if (!formData.customFields) return;

    const fields = [...formData.customFields];
    const index = fields.findIndex((field) => field.id === id);

    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];

    // Update order values
    fields.forEach((field, idx) => {
      field.order = idx + 1;
    });

    updateFormData({ customFields: fields });
  };

  return (
    <div className="space-y-6">
      {/* Profile Image Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Profile Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {formData.profileImage ? (
              <div className="relative">
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => updateFormData({ profileImage: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
              <p className="text-muted-foreground mt-1 text-xs">
                Maximum 5MB. Supports JPEG, PNG, WebP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => updateFormData({ firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              placeholder="Michael"
              value={formData.middleName || ""}
              onChange={(e) => updateFormData({ middleName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="Software Engineer"
                value={formData.title || ""}
                onChange={(e) => updateFormData({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="Company Name"
                value={formData.organization || ""}
                onChange={(e) =>
                  updateFormData({ organization: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="Engineering"
              value={formData.department || ""}
              onChange={(e) => updateFormData({ department: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Brief description about yourself..."
              rows={3}
              value={formData.bio || ""}
              onChange={(e) => updateFormData({ bio: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email || ""}
                onChange={(e) => updateFormData({ email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone || ""}
                onChange={(e) => updateFormData({ phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://yourwebsite.com"
              value={formData.website || ""}
              onChange={(e) => updateFormData({ website: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="123 Main St, City, State 12345"
              rows={2}
              value={formData.address || ""}
              onChange={(e) => updateFormData({ address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Social Media & Professional Links
            <Button
              size="sm"
              onClick={() => setShowSocialPlatforms(!showSocialPlatforms)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSocialPlatforms && (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Choose Platform</h4>
              {Object.entries(PLATFORM_CATEGORIES).map(
                ([category, categoryName]) => (
                  <div key={category}>
                    <h5 className="text-muted-foreground mb-2 text-sm font-medium">
                      {categoryName}
                    </h5>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {SOCIAL_PLATFORMS.filter(
                        (platform) => platform.category === category,
                      ).map((platform) => (
                        <Button
                          key={platform.id}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => addSocialLink(platform)}
                        >
                          <span className="mr-2">{platform.icon}</span>
                          {platform.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ),
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSocialPlatforms(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {formData.socialLinks && formData.socialLinks.length > 0 && (
            <div className="space-y-3">
              {formData.socialLinks
                .sort((a, b) => a.order - b.order)
                .map((link, index) => {
                  const platform = getPlatformById(link.platform);
                  return (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => moveSocialLink(link.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => moveSocialLink(link.id, "down")}
                          disabled={index === formData.socialLinks!.length - 1}
                        >
                          ↓
                        </Button>
                      </div>

                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-lg">{link.icon}</span>
                        <Badge variant="secondary">{platform?.name}</Badge>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <Input
                          placeholder="Label"
                          value={link.label}
                          onChange={(e) =>
                            updateSocialLink(link.id, { label: e.target.value })
                          }
                        />
                        <Input
                          placeholder={platform?.placeholder || "URL"}
                          value={link.url}
                          onChange={(e) => {
                            let url = e.target.value;
                            if (platform && url && !url.startsWith("http")) {
                              url = generatePlatformUrl(platform, url);
                            }
                            updateSocialLink(link.id, { url });
                          }}
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSocialLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Custom Fields
            <Button
              size="sm"
              onClick={() => setShowCustomFieldForm(!showCustomFieldForm)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCustomFieldForm && (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Add Custom Field</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => addCustomField("text")}
                >
                  Text Field
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addCustomField("email")}
                >
                  Email Field
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addCustomField("phone")}
                >
                  Phone Field
                </Button>
                <Button variant="outline" onClick={() => addCustomField("url")}>
                  URL Field
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomFieldForm(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {formData.customFields && formData.customFields.length > 0 && (
            <div className="space-y-3">
              {formData.customFields
                .sort((a, b) => a.order - b.order)
                .map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => moveCustomField(field.id, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => moveCustomField(field.id, "down")}
                        disabled={index === formData.customFields!.length - 1}
                      >
                        ↓
                      </Button>
                    </div>

                    <Badge variant="outline" className="min-w-fit">
                      {field.type.toUpperCase()}
                    </Badge>

                    <div className="grid flex-1 grid-cols-2 gap-2">
                      <Input
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) =>
                          updateCustomField(field.id, { label: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Value"
                        type={
                          field.type === "email"
                            ? "email"
                            : field.type === "phone"
                              ? "tel"
                              : field.type === "url"
                                ? "url"
                                : "text"
                        }
                        value={field.value}
                        onChange={(e) =>
                          updateCustomField(field.id, { value: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCustomField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
