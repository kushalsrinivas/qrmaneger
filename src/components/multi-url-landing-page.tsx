"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialMediaService } from "@/lib/social-media-service";
import {
  type MultiUrlLink,
  type MultiUrlTheme,
  type MultiUrlSeo,
  type SocialMediaPlatform,
  type ContactFormField,
  MULTI_URL_THEMES,
} from "@/server/db/types";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Mail,
  Phone,
  Download,
  MessageCircle,
  Calendar,
  MapPin,
  Star,
  Eye,
  TrendingUp,
  Clock,
  Users,
  Share2,
  Heart,
  Bookmark,
  Copy,
  Check,
} from "lucide-react";

// ================================
// INTERFACES
// ================================

interface MultiUrlLandingPageProps {
  data: {
    title?: string;
    description?: string;
    bio?: string;
    profileImage?: string;
    profileName?: string;
    profileTitle?: string;
    links: MultiUrlLink[];
    theme?: MultiUrlTheme;
    seo?: MultiUrlSeo;
    socialMedia?: {
      platforms: SocialMediaPlatform[];
      showSocialProof?: boolean;
      socialProofText?: string;
    };
    features?: {
      pwaEnabled?: boolean;
      contactFormEnabled?: boolean;
      contactFormFields?: ContactFormField[];
      passwordProtected?: boolean;
      trackingEnabled?: boolean;
    };
    analytics?: {
      totalViews?: number;
      uniqueViews?: number;
      totalClicks?: number;
      lastViewed?: string;
    };
  };
  isPreview?: boolean;
  onLinkClick?: (linkId: string) => void;
  onContactFormSubmit?: (formData: Record<string, any>) => void;
  onShare?: () => void;
}

interface LinkComponentProps {
  link: MultiUrlLink;
  theme: MultiUrlTheme;
  isActive: boolean;
  onClick: () => void;
}

// ================================
// UTILITY FUNCTIONS
// ================================

const isLinkActive = (link: MultiUrlLink): boolean => {
  if (link.isActive === false) return false;

  const now = new Date();

  if (link.scheduledStart) {
    const startTime = new Date(link.scheduledStart);
    if (now < startTime) return false;
  }

  if (link.scheduledEnd) {
    const endTime = new Date(link.scheduledEnd);
    if (now > endTime) return false;
  }

  return true;
};

const getLinkIcon = (link: MultiUrlLink) => {
  if (link.icon) return link.icon;

  switch (link.linkType) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "phone":
      return <Phone className="h-4 w-4" />;
    case "file":
      return <Download className="h-4 w-4" />;
    case "social":
      return <MessageCircle className="h-4 w-4" />;
    case "app":
      return <ExternalLink className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
};

const formatLinkUrl = (link: MultiUrlLink): string => {
  switch (link.linkType) {
    case "email":
      const emailParts = [`mailto:${link.url}`];
      if (link.metadata?.subject) {
        emailParts.push(
          `?subject=${encodeURIComponent(link.metadata.subject)}`,
        );
      }
      if (link.metadata?.body) {
        const separator = link.metadata.subject ? "&" : "?";
        emailParts.push(
          `${separator}body=${encodeURIComponent(link.metadata.body)}`,
        );
      }
      return emailParts.join("");

    case "phone":
      return `tel:${link.url}`;

    case "app":
      // Device detection for app links
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);

      if (isIOS && link.metadata?.appStoreUrl) {
        return link.metadata.appStoreUrl;
      } else if (isAndroid && link.metadata?.playStoreUrl) {
        return link.metadata.playStoreUrl;
      }
      return link.url; // Fallback

    default:
      return link.url;
  }
};

// ================================
// LINK COMPONENT
// ================================

const LinkComponent: React.FC<LinkComponentProps> = ({
  link,
  theme,
  isActive,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (!isActive) return;

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);

    const url = formatLinkUrl(link);

    // Track click
    onClick();

    // Open link
    if (link.linkType === "file") {
      // Handle file downloads
      const a = document.createElement("a");
      a.href = url;
      a.download = link.metadata?.downloadFilename || link.title;
      a.click();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const linkStyles = {
    backgroundColor:
      link.backgroundColor || theme.branding?.primaryColor || "#000000",
    color: link.textColor || theme.branding?.textColor || "#ffffff",
    borderColor: link.borderColor || "transparent",
    borderRadius: link.borderRadius || theme.layout?.borderRadius || 8,
    borderWidth: link.borderColor ? 2 : 0,
    borderStyle: "solid",
    opacity: isActive ? 1 : 0.5,
    transform: isHovered ? "translateY(-2px)" : "translateY(0px)",
    boxShadow: isHovered
      ? `0 8px 25px -8px ${link.backgroundColor || theme.branding?.primaryColor || "#000000"}40`
      : "0 2px 4px -2px rgba(0,0,0,0.1)",
  };

  const platformInfo = link.platform
    ? SocialMediaService.getPlatformStyling(link.platform)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        className={cn(
          "relative h-auto w-full justify-start overflow-hidden p-4 text-left",
          !isActive && "cursor-not-allowed",
        )}
        style={linkStyles}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={!isActive}
      >
        {/* Background animation */}
        <motion.div
          className="absolute inset-0 bg-white/10"
          initial={{ x: "-100%" }}
          animate={{ x: isClicked ? "100%" : "-100%" }}
          transition={{ duration: 0.6 }}
        />

        <div className="z-10 flex w-full items-center gap-3">
          {/* Icon */}
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
            {link.iconType === "emoji" && link.icon ? (
              <span className="text-lg">{link.icon}</span>
            ) : link.iconType === "image" && link.icon ? (
              <img src={link.icon} alt="" className="h-6 w-6 rounded" />
            ) : platformInfo ? (
              <span className="text-lg">{platformInfo.icon}</span>
            ) : (
              getLinkIcon(link)
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{link.title}</div>
            {link.description && (
              <div className="truncate text-sm opacity-75">
                {link.description}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {link.clickCount && link.clickCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {link.clickCount} clicks
              </Badge>
            )}

            {!isActive && (
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                Scheduled
              </Badge>
            )}

            <ExternalLink className="h-4 w-4 opacity-50" />
          </div>
        </div>
      </Button>
    </motion.div>
  );
};

// ================================
// CONTACT FORM COMPONENT
// ================================

const ContactForm: React.FC<{
  fields: ContactFormField[];
  onSubmit: (data: Record<string, any>) => void;
  theme: MultiUrlTheme;
}> = ({ fields, onSubmit, theme }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg border border-green-200 bg-green-50 p-6 text-center"
      >
        <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
        <h3 className="font-medium text-green-800">Thank you!</h3>
        <p className="text-sm text-green-600">
          Your message has been sent successfully.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>

          {field.type === "textarea" ? (
            <Textarea
              value={formData[field.name] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
              className="w-full"
              rows={4}
            />
          ) : field.type === "select" ? (
            <select
              value={formData[field.name] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
              className="w-full rounded-md border p-2"
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <Input
              type={field.type}
              value={formData[field.name] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
              className="w-full"
            />
          )}
        </div>
      ))}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        style={{
          backgroundColor: theme.branding?.primaryColor || "#000000",
          color: theme.branding?.textColor || "#ffffff",
        }}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </motion.form>
  );
};

// ================================
// MAIN COMPONENT
// ================================

export const MultiUrlLandingPage: React.FC<MultiUrlLandingPageProps> = ({
  data,
  isPreview = false,
  onLinkClick,
  onContactFormSubmit,
  onShare,
}) => {
  const [activeLinks, setActiveLinks] = useState<MultiUrlLink[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = data.theme || MULTI_URL_THEMES.professional;

  // Filter active links
  useEffect(() => {
    const filtered = data.links.filter(isLinkActive);
    setActiveLinks(filtered);
  }, [data.links]);

  // Handle link click
  const handleLinkClick = (linkId: string) => {
    onLinkClick?.(linkId);
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title || data.profileName || "Check out my links",
          text: data.description || data.bio || "My personal link collection",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Share failed:", error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
    onShare?.();
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // Apply theme styles
  const containerStyles = {
    backgroundColor: theme.branding?.backgroundColor || "#ffffff",
    color: theme.branding?.textColor || "#000000",
    fontFamily: theme.typography?.fontFamily || "system-ui, sans-serif",
    minHeight: "100vh",
  };

  const backgroundStyles =
    theme.branding?.backgroundType === "gradient" &&
    theme.branding?.backgroundGradient
      ? {
          background: `${theme.branding.backgroundGradient.type}-gradient(${theme.branding.backgroundGradient.direction || "135deg"}, ${theme.branding.backgroundGradient.colors.join(", ")})`,
        }
      : theme.branding?.backgroundType === "image" &&
          theme.branding?.backgroundImage
        ? {
            backgroundImage: `url(${theme.branding.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }
        : {};

  return (
    <div
      style={{ ...containerStyles, ...backgroundStyles }}
      className="relative"
    >
      {/* Background overlay */}
      {theme.branding?.backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: theme.branding.backgroundOverlay.color,
            opacity: theme.branding.backgroundOverlay.opacity,
          }}
        />
      )}

      {/* Main content */}
      <div
        className="relative z-10 mx-auto max-w-md p-6"
        style={{ maxWidth: theme.layout?.containerWidth || 400 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          {/* Profile Image */}
          {data.profileImage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <Avatar className="mx-auto h-24 w-24">
                <AvatarImage src={data.profileImage} alt={data.profileName} />
                <AvatarFallback>
                  {data.profileName?.charAt(0) || data.title?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          )}

          {/* Logo */}
          {theme.branding?.logo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <img
                src={theme.branding.logo}
                alt="Logo"
                className="mx-auto"
                style={{
                  height: theme.branding.logoSize || 48,
                  width: "auto",
                }}
              />
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-2 font-bold"
            style={{
              fontSize: theme.typography?.fontSize?.title || 28,
              fontWeight: theme.typography?.fontWeight?.title || 600,
              textAlign: theme.typography?.textAlign || "center",
            }}
          >
            {data.title || data.profileName || "My Links"}
          </motion.h1>

          {/* Subtitle */}
          {data.profileTitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-2 text-sm opacity-75"
            >
              {data.profileTitle}
            </motion.p>
          )}

          {/* Description */}
          {(data.description || data.bio) && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-4"
              style={{
                fontSize: theme.typography?.fontSize?.description || 16,
                fontWeight: theme.typography?.fontWeight?.description || 400,
                textAlign: theme.typography?.textAlign || "center",
              }}
            >
              {data.description || data.bio}
            </motion.p>
          )}

          {/* Social Proof */}
          {data.socialMedia?.showSocialProof &&
            data.socialMedia.socialProofText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-4 flex items-center justify-center gap-2"
              >
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm opacity-75">
                  {data.socialMedia.socialProofText}
                </span>
              </motion.div>
            )}

          {/* Analytics (if enabled) */}
          {data.analytics && !isPreview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-4 flex items-center justify-center gap-4 text-xs opacity-60"
            >
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {data.analytics.totalViews || 0} views
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {data.analytics.totalClicks || 0} clicks
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Links */}
        <div
          className="mb-8 space-y-3"
          style={{ gap: theme.layout?.linkSpacing || 12 }}
        >
          <AnimatePresence>
            {activeLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <LinkComponent
                  link={link}
                  theme={theme}
                  isActive={true}
                  onClick={() => handleLinkClick(link.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Social Media Links */}
        {data.socialMedia?.platforms &&
          data.socialMedia.platforms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-8"
            >
              <h3 className="mb-3 text-center text-sm font-medium opacity-75">
                Follow me
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {data.socialMedia.platforms.map((platform) => (
                  <Button
                    key={platform.platform}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(platform.url, "_blank")}
                  >
                    <span>
                      {
                        SocialMediaService.getPlatformStyling(platform.platform)
                          .icon
                      }
                    </span>
                    {platform.username && (
                      <span className="text-xs">@{platform.username}</span>
                    )}
                    {platform.displayFollowerCount &&
                      platform.followerCount && (
                        <Badge variant="secondary" className="text-xs">
                          {platform.followerCount}
                        </Badge>
                      )}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

        {/* Contact Form */}
        {data.features?.contactFormEnabled &&
          data.features.contactFormFields && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h3 className="mb-4 font-medium">Get in touch</h3>
                <ContactForm
                  fields={data.features.contactFormFields}
                  onSubmit={onContactFormSubmit || (() => {})}
                  theme={theme}
                />
              </Card>
            </motion.div>
          )}

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex justify-center gap-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              /* Handle bookmark */
            }}
            className="flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Save
          </Button>
        </motion.div>

        {/* Branding */}
        {!isPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-center text-xs opacity-40"
          >
            <p>Powered by MojoQR</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MultiUrlLandingPage;
