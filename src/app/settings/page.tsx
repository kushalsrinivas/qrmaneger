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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Download,
  Trash2,
  Upload,
  Settings,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Webhook,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    image: "",
    bio: "",
    website: "",
    location: "",
    timezone: "",
  });

  const [preferencesForm, setPreferencesForm] = useState({
    notifications: {
      email: true,
      push: true,
      marketing: false,
      analytics: true,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showStats: true,
    },
    appearance: {
      theme: "system",
      language: "en",
      dateFormat: "MM/DD/YYYY",
    },
    qrDefaults: {
      errorCorrection: "M",
      size: 300,
      format: "PNG",
      includeMargin: true,
    },
    dashboard: {
      defaultView: "grid",
      itemsPerPage: 20,
      showPreview: true,
    },
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    sessionTimeout: 30,
    apiAccess: true,
  });

  const [integrationsForm, setIntegrationsForm] = useState({
    googleAnalytics: {
      enabled: false,
      trackingId: "",
    },
    zapier: {
      enabled: false,
      webhookUrl: "",
    },
    slack: {
      enabled: false,
      webhookUrl: "",
    },
    customWebhooks: [] as Array<{
      id: string;
      name: string;
      url: string;
      events: string[];
      enabled: boolean;
    }>,
  });

  // tRPC queries and mutations
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = api.settings.getProfile.useQuery();
  const {
    data: preferences,
    isLoading: preferencesLoading,
    refetch: refetchPreferences,
  } = api.settings.getPreferences.useQuery();
  const {
    data: security,
    isLoading: securityLoading,
    refetch: refetchSecurity,
  } = api.settings.getSecurity.useQuery();
  const {
    data: integrations,
    isLoading: integrationsLoading,
    refetch: refetchIntegrations,
  } = api.settings.getIntegrations.useQuery();
  const { data: accountStats } = api.settings.getAccountStats.useQuery();

  const updateProfileMutation = api.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetchProfile();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePreferencesMutation = api.settings.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences updated successfully");
      refetchPreferences();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateSecurityMutation = api.settings.updateSecurity.useMutation({
    onSuccess: () => {
      toast.success("Security settings updated successfully");
      refetchSecurity();
      setSecurityForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateIntegrationsMutation =
    api.settings.updateIntegrations.useMutation({
      onSuccess: () => {
        toast.success("Integrations updated successfully");
        refetchIntegrations();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const exportDataMutation = api.settings.exportData.useMutation({
    onSuccess: (data) => {
      toast.success(`Data exported successfully (${data.count} records)`);
      // In a real app, you'd trigger a download here
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAccountMutation = api.settings.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully");
      // In a real app, you'd redirect to login or landing page
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Load data into forms when available
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        image: profile.image || "",
        bio: profile.bio || "",
        website: profile.website || "",
        location: profile.location || "",
        timezone: profile.timezone || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setPreferencesForm(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (security) {
      setSecurityForm((prev) => ({
        ...prev,
        twoFactorEnabled: security.twoFactorEnabled || false,
        sessionTimeout: security.sessionTimeout || 30,
        apiAccess: security.apiAccess || true,
      }));
    }
  }, [security]);

  useEffect(() => {
    if (integrations) {
      setIntegrationsForm(integrations);
    }
  }, [integrations]);

  const handleProfileSubmit = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handlePreferencesSubmit = () => {
    updatePreferencesMutation.mutate(preferencesForm);
  };

  const handleSecuritySubmit = () => {
    if (
      securityForm.newPassword &&
      securityForm.newPassword !== securityForm.confirmPassword
    ) {
      toast.error("New passwords don't match");
      return;
    }

    updateSecurityMutation.mutate({
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
      twoFactorEnabled: securityForm.twoFactorEnabled,
      sessionTimeout: securityForm.sessionTimeout,
      apiAccess: securityForm.apiAccess,
    });
  };

  const handleIntegrationsSubmit = () => {
    updateIntegrationsMutation.mutate(integrationsForm);
  };

  const handleExportData = () => {
    exportDataMutation.mutate({
      format: "json",
      includeQRCodes: true,
      includeAnalytics: true,
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    deleteAccountMutation.mutate({
      confirmation: deleteConfirmation,
    });
  };

  const addCustomWebhook = () => {
    const newWebhook = {
      id: Date.now().toString(),
      name: "New Webhook",
      url: "",
      events: ["qr_scan"],
      enabled: true,
    };

    setIntegrationsForm((prev) => ({
      ...prev,
      customWebhooks: [...prev.customWebhooks, newWebhook],
    }));
  };

  const removeCustomWebhook = (id: string) => {
    setIntegrationsForm((prev) => ({
      ...prev,
      customWebhooks: prev.customWebhooks.filter(
        (webhook) => webhook.id !== id,
      ),
    }));
  };

  const updateCustomWebhook = (
    id: string,
    updates: Partial<(typeof integrationsForm.customWebhooks)[0]>,
  ) => {
    setIntegrationsForm((prev) => ({
      ...prev,
      customWebhooks: prev.customWebhooks.map((webhook) =>
        webhook.id === id ? { ...webhook, ...updates } : webhook,
      ),
    }));
  };

  const isLoading =
    profileLoading ||
    preferencesLoading ||
    securityLoading ||
    integrationsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="bg-muted h-4 w-3/4 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-8 w-1/2 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportData}
          disabled={exportDataMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportDataMutation.isPending ? "Exporting..." : "Export Data"}
        </Button>
      </div>

      {/* Account Stats */}
      {accountStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Account Age</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountStats.accountAge} days
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountStats.totalQRCodes}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountStats.totalScans}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Storage Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountStats.storageUsed}MB
              </div>
              <Progress
                value={
                  (accountStats.storageUsed / accountStats.storageLimit) * 100
                }
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and public details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileForm.image} alt={profileForm.name} />
                  <AvatarFallback>
                    {profileForm.name?.charAt(0).toUpperCase() ||
                      profileForm.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <p className="text-muted-foreground text-sm">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profileForm.website}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileForm.location}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileForm.timezone}
                    onValueChange={(value) =>
                      setProfileForm({ ...profileForm, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleProfileSubmit}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending
                  ? "Updating..."
                  : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferencesForm.notifications.email}
                    onCheckedChange={(checked) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        notifications: {
                          ...preferencesForm.notifications,
                          email: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">
                      Push Notifications
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferencesForm.notifications.push}
                    onCheckedChange={(checked) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        notifications: {
                          ...preferencesForm.notifications,
                          push: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive marketing and promotional emails
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={preferencesForm.notifications.marketing}
                    onCheckedChange={(checked) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        notifications: {
                          ...preferencesForm.notifications,
                          marketing: checked,
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Control your privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="profile-visible">Profile Visible</Label>
                    <p className="text-muted-foreground text-sm">
                      Make your profile visible to others
                    </p>
                  </div>
                  <Switch
                    id="profile-visible"
                    checked={preferencesForm.privacy.profileVisible}
                    onCheckedChange={(checked) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        privacy: {
                          ...preferencesForm.privacy,
                          profileVisible: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-email">Show Email</Label>
                    <p className="text-muted-foreground text-sm">
                      Display email address on profile
                    </p>
                  </div>
                  <Switch
                    id="show-email"
                    checked={preferencesForm.privacy.showEmail}
                    onCheckedChange={(checked) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        privacy: {
                          ...preferencesForm.privacy,
                          showEmail: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-stats">Show Statistics</Label>
                    <p className="text-muted-foreground text-sm">
                      Display QR code statistics publicly
                    </p>
                  </div>
                  <Switch
                    id="show-stats"
                    checked={preferencesForm.privacy.showStats}
                    onCheckedChange={(checked) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        privacy: {
                          ...preferencesForm.privacy,
                          showStats: checked,
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={preferencesForm.appearance.theme}
                    onValueChange={(value) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        appearance: {
                          ...preferencesForm.appearance,
                          theme: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferencesForm.appearance.language}
                    onValueChange={(value) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        appearance: {
                          ...preferencesForm.appearance,
                          language: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={preferencesForm.appearance.dateFormat}
                    onValueChange={(value) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        appearance: {
                          ...preferencesForm.appearance,
                          dateFormat: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QR Code Defaults</CardTitle>
                <CardDescription>
                  Set default settings for new QR codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="error-correction">Error Correction</Label>
                  <Select
                    value={preferencesForm.qrDefaults.errorCorrection}
                    onValueChange={(value) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        qrDefaults: {
                          ...preferencesForm.qrDefaults,
                          errorCorrection: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-size">Default Size</Label>
                  <Input
                    id="default-size"
                    type="number"
                    value={preferencesForm.qrDefaults.size}
                    onChange={(e) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        qrDefaults: {
                          ...preferencesForm.qrDefaults,
                          size: parseInt(e.target.value),
                        },
                      })
                    }
                    min="100"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-format">Default Format</Label>
                  <Select
                    value={preferencesForm.qrDefaults.format}
                    onValueChange={(value) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        qrDefaults: {
                          ...preferencesForm.qrDefaults,
                          format: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="JPG">JPG</SelectItem>
                      <SelectItem value="SVG">SVG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handlePreferencesSubmit}
            disabled={updatePreferencesMutation.isPending}
          >
            {updatePreferencesMutation.isPending
              ? "Updating..."
              : "Update Preferences"}
          </Button>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure additional security options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">
                      Two-Factor Authentication
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    id="two-factor"
                    checked={securityForm.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      setSecurityForm({
                        ...securityForm,
                        twoFactorEnabled: checked,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securityForm.sessionTimeout}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                    min="5"
                    max="1440"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="api-access">API Access</Label>
                    <p className="text-muted-foreground text-sm">
                      Allow API access to your account
                    </p>
                  </div>
                  <Switch
                    id="api-access"
                    checked={securityForm.apiAccess}
                    onCheckedChange={(checked) =>
                      setSecurityForm({ ...securityForm, apiAccess: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value="sk_live_1234567890abcdef"
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Key className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Keep your API key secure and don't share it with others.
              </p>
            </CardContent>
          </Card>

          <Button
            onClick={handleSecuritySubmit}
            disabled={updateSecurityMutation.isPending}
          >
            {updateSecurityMutation.isPending
              ? "Updating..."
              : "Update Security Settings"}
          </Button>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Google Analytics</CardTitle>
                <CardDescription>
                  Track QR code scans in Google Analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ga-enabled">Enable Google Analytics</Label>
                  <Switch
                    id="ga-enabled"
                    checked={integrationsForm.googleAnalytics.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrationsForm({
                        ...integrationsForm,
                        googleAnalytics: {
                          ...integrationsForm.googleAnalytics,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>
                {integrationsForm.googleAnalytics.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="ga-tracking-id">Tracking ID</Label>
                    <Input
                      id="ga-tracking-id"
                      value={integrationsForm.googleAnalytics.trackingId}
                      onChange={(e) =>
                        setIntegrationsForm({
                          ...integrationsForm,
                          googleAnalytics: {
                            ...integrationsForm.googleAnalytics,
                            trackingId: e.target.value,
                          },
                        })
                      }
                      placeholder="GA-XXXXXXXXX-X"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zapier</CardTitle>
                <CardDescription>
                  Connect with thousands of apps via Zapier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zapier-enabled">Enable Zapier</Label>
                  <Switch
                    id="zapier-enabled"
                    checked={integrationsForm.zapier.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrationsForm({
                        ...integrationsForm,
                        zapier: {
                          ...integrationsForm.zapier,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>
                {integrationsForm.zapier.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="zapier-webhook">Webhook URL</Label>
                    <Input
                      id="zapier-webhook"
                      value={integrationsForm.zapier.webhookUrl}
                      onChange={(e) =>
                        setIntegrationsForm({
                          ...integrationsForm,
                          zapier: {
                            ...integrationsForm.zapier,
                            webhookUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://hooks.zapier.com/..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slack</CardTitle>
                <CardDescription>
                  Get notifications in your Slack workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-enabled">Enable Slack</Label>
                  <Switch
                    id="slack-enabled"
                    checked={integrationsForm.slack.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrationsForm({
                        ...integrationsForm,
                        slack: { ...integrationsForm.slack, enabled: checked },
                      })
                    }
                  />
                </div>
                {integrationsForm.slack.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="slack-webhook">Webhook URL</Label>
                    <Input
                      id="slack-webhook"
                      value={integrationsForm.slack.webhookUrl}
                      onChange={(e) =>
                        setIntegrationsForm({
                          ...integrationsForm,
                          slack: {
                            ...integrationsForm.slack,
                            webhookUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://hooks.slack.com/..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Webhooks</CardTitle>
                <CardDescription>
                  Send data to your own endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrationsForm.customWebhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <Input
                        value={webhook.name}
                        onChange={(e) =>
                          updateCustomWebhook(webhook.id, {
                            name: e.target.value,
                          })
                        }
                        placeholder="Webhook name"
                        className="mr-2 flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={webhook.url}
                      onChange={(e) =>
                        updateCustomWebhook(webhook.id, { url: e.target.value })
                      }
                      placeholder="https://your-endpoint.com/webhook"
                    />
                    <div className="flex items-center justify-between">
                      <Label>Enabled</Label>
                      <Switch
                        checked={webhook.enabled}
                        onCheckedChange={(checked) =>
                          updateCustomWebhook(webhook.id, { enabled: checked })
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addCustomWebhook}>
                  <Webhook className="mr-2 h-4 w-4" />
                  Add Custom Webhook
                </Button>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handleIntegrationsSubmit}
            disabled={updateIntegrationsMutation.isPending}
          >
            {updateIntegrationsMutation.isPending
              ? "Updating..."
              : "Update Integrations"}
          </Button>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                Manage your account settings and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-muted-foreground text-sm">
                  Download a copy of all your QR codes and analytics data
                </p>
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={exportDataMutation.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportDataMutation.isPending
                    ? "Exporting..."
                    : "Export Data"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-destructive font-medium">Danger Zone</h4>
                <p className="text-muted-foreground text-sm">
                  These actions are irreversible. Please be careful.
                </p>
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and all associated data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-destructive/10 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="text-destructive h-5 w-5" />
                          <p className="text-sm font-medium">
                            This will delete:
                          </p>
                        </div>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                          <li>All your QR codes and data</li>
                          <li>All analytics and scan history</li>
                          <li>Your account and profile information</li>
                          <li>All integrations and settings</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation">
                          Type <strong>DELETE</strong> to confirm
                        </Label>
                        <Input
                          id="delete-confirmation"
                          value={deleteConfirmation}
                          onChange={(e) =>
                            setDeleteConfirmation(e.target.value)
                          }
                          placeholder="DELETE"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={
                          deleteAccountMutation.isPending ||
                          deleteConfirmation !== "DELETE"
                        }
                      >
                        {deleteAccountMutation.isPending
                          ? "Deleting..."
                          : "Delete Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
