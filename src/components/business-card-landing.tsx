"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Mail,
  Phone,
  Globe,
  MapPin,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { getPlatformById } from "@/lib/social-platforms";

interface VCardData {
  firstName: string;
  lastName: string;
  middleName?: string;
  title?: string;
  organization?: string;
  department?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  profileImage?: string;
  bio?: string;
  socialLinks?: Array<{
    id: string;
    platform: string;
    label: string;
    url: string;
    icon?: string;
    order: number;
  }>;
  customFields?: Array<{
    id: string;
    label: string;
    value: string;
    type: "text" | "email" | "phone" | "url";
    order: number;
  }>;
}

interface BusinessCardLandingProps {
  vcard: VCardData;
  qrCodeUrl?: string;
}

export function BusinessCardLanding({
  vcard,
  qrCodeUrl,
}: BusinessCardLandingProps) {
  const [copied, setCopied] = useState(false);

  const fullName = [vcard.firstName, vcard.middleName, vcard.lastName]
    .filter(Boolean)
    .join(" ");

  const handleCopyContact = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - Business Card`,
          text: `Check out ${fullName}'s digital business card`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Failed to share:", error);
        handleCopyContact();
      }
    } else {
      handleCopyContact();
    }
  };

  const downloadVCard = () => {
    const vcardString = generateVCardString(vcard);
    const blob = new Blob([vcardString], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${vcard.firstName}_${vcard.lastName}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContactAction = (type: string, value: string) => {
    switch (type) {
      case "email":
        window.location.href = `mailto:${value}`;
        break;
      case "phone":
        window.location.href = `tel:${value}`;
        break;
      case "url":
      case "website":
        window.open(
          value.startsWith("http") ? value : `https://${value}`,
          "_blank",
        );
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-md p-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Digital Business Card
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Scan or save contact information
          </p>
        </div>

        {/* Main Business Card */}
        <Card className="mb-6 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Header Section with Profile */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
              <div className="flex flex-col items-center text-center">
                {vcard.profileImage ? (
                  <img
                    src={vcard.profileImage}
                    alt={fullName}
                    className="mb-4 h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white/20 text-3xl font-bold">
                    {vcard.firstName.charAt(0)}
                    {vcard.lastName.charAt(0)}
                  </div>
                )}

                <h2 className="mb-1 text-2xl font-bold">{fullName}</h2>

                {vcard.title && (
                  <p className="mb-2 text-lg font-medium text-blue-100">
                    {vcard.title}
                  </p>
                )}

                {vcard.organization && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white"
                    >
                      {vcard.organization}
                    </Badge>
                    {vcard.department && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white"
                      >
                        {vcard.department}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {vcard.bio && (
              <div className="border-b px-6 py-4">
                <p className="text-center text-gray-700 dark:text-gray-300">
                  {vcard.bio}
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-3 px-6 py-4">
              {vcard.email && (
                <button
                  onClick={() => handleContactAction("email", vcard.email!)}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Email
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {vcard.email}
                    </p>
                  </div>
                </button>
              )}

              {vcard.phone && (
                <button
                  onClick={() => handleContactAction("phone", vcard.phone!)}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Phone
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {vcard.phone}
                    </p>
                  </div>
                </button>
              )}

              {vcard.website && (
                <button
                  onClick={() => handleContactAction("website", vcard.website!)}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Globe className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Website
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {vcard.website}
                    </p>
                  </div>
                </button>
              )}

              {vcard.address && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Address
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {vcard.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            {vcard.socialLinks && vcard.socialLinks.length > 0 && (
              <div className="border-t px-6 py-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Connect with me
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {vcard.socialLinks
                    .sort((a, b) => a.order - b.order)
                    .map((link) => {
                      const platform = getPlatformById(link.platform);
                      return (
                        <button
                          key={link.id}
                          onClick={() => handleContactAction("url", link.url)}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <span className="text-lg">{link.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {link.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {platform?.name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {vcard.customFields && vcard.customFields.length > 0 && (
              <div className="border-t px-6 py-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Additional Information
                </h3>
                <div className="space-y-2">
                  {vcard.customFields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {field.label}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {field.value}
                          </p>
                        </div>
                        {(field.type === "email" ||
                          field.type === "phone" ||
                          field.type === "url") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleContactAction(field.type, field.value)
                            }
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={downloadVCard}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Save to Contacts
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleShare} variant="outline" size="lg">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            <Button onClick={handleCopyContact} variant="outline" size="lg">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* QR Code */}
        {qrCodeUrl && (
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <h3 className="mb-4 text-lg font-semibold">Share this QR Code</h3>
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="mx-auto mb-4 h-32 w-32 rounded-lg border"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Others can scan this code to view your business card
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by MojoQR - Digital Business Cards
          </p>
        </div>
      </div>
    </div>
  );
}

function generateVCardString(vcard: VCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${[vcard.firstName, vcard.middleName, vcard.lastName].filter(Boolean).join(" ")}`,
    `N:${vcard.lastName};${vcard.firstName};${vcard.middleName || ""};;`,
  ];

  if (vcard.title) lines.push(`TITLE:${vcard.title}`);
  if (vcard.organization) lines.push(`ORG:${vcard.organization}`);
  if (vcard.email) lines.push(`EMAIL:${vcard.email}`);
  if (vcard.phone) lines.push(`TEL:${vcard.phone}`);
  if (vcard.website) lines.push(`URL:${vcard.website}`);
  if (vcard.address) lines.push(`ADR:;;${vcard.address};;;;`);
  if (vcard.bio) lines.push(`NOTE:${vcard.bio}`);

  // Add social links as URLs
  if (vcard.socialLinks) {
    vcard.socialLinks.forEach((link) => {
      lines.push(`URL:${link.url}`);
    });
  }

  lines.push("END:VCARD");
  return lines.join("\n");
}
