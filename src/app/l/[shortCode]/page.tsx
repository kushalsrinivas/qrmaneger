import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db";
import { qrCodes, analyticsEvents } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { MultiUrlLandingPage } from "@/components/multi-url-landing-page";
import { SocialMediaService } from "@/lib/social-media-service";
import { rateLimitingService } from "@/lib/rate-limiting";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

interface PageProps {
  params: {
    shortCode: string;
  };
}

// ================================
// METADATA GENERATION
// ================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shortCode } = params;

  // Get QR code data
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(
      qrCodes.dynamicUrl,
      `${process.env.NEXT_PUBLIC_BASE_URL}/q/${shortCode}`,
    ),
  });

  if (!qrCode || qrCode.type !== "multi_url" || !qrCode.data?.multiUrl) {
    return {
      title: "Not Found",
      description: "The requested page could not be found.",
    };
  }

  const multiUrlData = qrCode.data.multiUrl;
  const seo = multiUrlData.seo;

  // Default metadata
  const title =
    seo?.metaTitle ||
    multiUrlData.title ||
    multiUrlData.profileName ||
    "My Links";
  const description =
    seo?.metaDescription ||
    multiUrlData.description ||
    multiUrlData.bio ||
    "Check out my links";
  const siteName = "MojoQR";
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/l/${shortCode}`;

  return {
    title,
    description,
    keywords: seo?.keywords?.join(", "),

    // Open Graph
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url,
      siteName,
      type: (seo?.ogType as any) || "website",
      images: seo?.ogImage
        ? [
            {
              url: seo.ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : multiUrlData.profileImage
          ? [
              {
                url: multiUrlData.profileImage,
                width: 400,
                height: 400,
                alt: title,
              },
            ]
          : [],
    },

    // Twitter Card
    twitter: {
      card: seo?.twitterCard || "summary",
      title: seo?.twitterTitle || title,
      description: seo?.twitterDescription || description,
      images: seo?.twitterImage
        ? [seo.twitterImage]
        : multiUrlData.profileImage
          ? [multiUrlData.profileImage]
          : [],
      site: seo?.twitterSite,
      creator: seo?.twitterCreator,
    },

    // Additional meta tags
    other: {
      "theme-color": multiUrlData.theme?.branding?.primaryColor || "#000000",
    },

    // Viewport
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    },
  };
}

// ================================
// ANALYTICS TRACKING
// ================================

async function trackPageView(qrCodeId: string, request: Request) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Generate session ID
    const sessionId = generateSessionId(ipAddress, userAgent);

    // Parse device information
    const deviceInfo = parseUserAgent(userAgent);

    // Get location information (simplified)
    const locationInfo = await getLocationFromIP(ipAddress);

    // Record analytics event
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      qrCodeId,
      eventType: "view",
      timestamp: new Date(),
      userAgent,
      referer,
      ipAddress,
      sessionId,
      deviceInfo: JSON.stringify(deviceInfo),
      locationInfo: JSON.stringify(locationInfo),
      metadata: JSON.stringify({
        pageType: "multi_url_landing",
        viewType: "page_view",
      }),
    });

    // Update QR code view count
    await db
      .update(qrCodes)
      .set({
        scanCount: sql`${qrCodes.scanCount} + 1`,
        lastScannedAt: new Date(),
      })
      .where(eq(qrCodes.id, qrCodeId));
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function generateSessionId(ipAddress: string, userAgent: string): string {
  const hash = require("crypto")
    .createHash("sha256")
    .update(ipAddress + userAgent + new Date().toDateString())
    .digest("hex");
  return hash.substring(0, 16);
}

function parseUserAgent(userAgent: string) {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  let os = "Unknown";
  if (/Windows/.test(userAgent)) os = "Windows";
  else if (/Mac/.test(userAgent)) os = "macOS";
  else if (/Linux/.test(userAgent)) os = "Linux";
  else if (/Android/.test(userAgent)) os = "Android";
  else if (/iPhone|iPad/.test(userAgent)) os = "iOS";

  let browser = "Unknown";
  if (/Chrome/.test(userAgent)) browser = "Chrome";
  else if (/Firefox/.test(userAgent)) browser = "Firefox";
  else if (/Safari/.test(userAgent)) browser = "Safari";
  else if (/Edge/.test(userAgent)) browser = "Edge";

  return {
    isMobile,
    isTablet,
    isDesktop,
    os,
    browser,
    userAgent,
  };
}

async function getLocationFromIP(ipAddress: string) {
  // Simplified location detection
  // In production, you'd use a proper IP geolocation service
  return {
    country: "Unknown",
    city: "Unknown",
    region: "Unknown",
    ipAddress,
  };
}

// ================================
// MAIN PAGE COMPONENT
// ================================

export default async function MultiUrlLandingPageRoute({ params }: PageProps) {
  const { shortCode } = params;

  try {
    // Get QR code data
    const qrCode = await db.query.qrCodes.findFirst({
      where: eq(
        qrCodes.dynamicUrl,
        `${process.env.NEXT_PUBLIC_BASE_URL}/q/${shortCode}`,
      ),
      with: {
        user: true,
        organization: true,
      },
    });

    if (!qrCode) {
      notFound();
    }

    // Check if QR code is active
    if (qrCode.status !== "active") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Link Unavailable
            </h1>
            <p className="text-gray-600">This link is currently inactive.</p>
          </div>
        </div>
      );
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Link Expired
            </h1>
            <p className="text-gray-600">
              This link has expired and is no longer available.
            </p>
          </div>
        </div>
      );
    }

    // Check if it's a multi-URL QR code
    if (qrCode.type !== "multi_url" || !qrCode.data?.multiUrl) {
      notFound();
    }

    const multiUrlData = qrCode.data.multiUrl;

    // Check for password protection
    if (multiUrlData.features?.passwordProtected) {
      // In a real implementation, you'd handle password verification here
      // For now, we'll skip this feature
    }

    // Check geographic restrictions
    if (multiUrlData.features?.geoRestrictions) {
      // In a real implementation, you'd check user's location here
      // For now, we'll skip this feature
    }

    // Check time-based access
    if (multiUrlData.features?.accessSchedule) {
      // In a real implementation, you'd check current time against schedule
      // For now, we'll skip this feature
    }

    // Track page view
    await trackPageView(qrCode.id, new Request(""));

    // Auto-detect social media platforms in links
    const processedLinks = SocialMediaService.autoDetectAndFormat(
      multiUrlData.links.map((link) => ({
        title: link.title,
        url: link.url,
        icon: link.icon,
      })),
    );

    // Merge auto-detected data with existing link data
    const enhancedLinks = multiUrlData.links.map((link) => {
      const detected = processedLinks.find((p) => p.url === link.url);
      return {
        ...link,
        platform: detected?.platform || link.platform,
        iconType:
          link.iconType || (detected?.autoDetected ? "platform" : "emoji"),
        icon: link.icon || detected?.icon,
      };
    });

    // Prepare data for the component
    const landingPageData = {
      title: multiUrlData.title,
      description: multiUrlData.description,
      bio: multiUrlData.bio,
      profileImage: multiUrlData.profileImage,
      profileName: multiUrlData.profileName,
      profileTitle: multiUrlData.profileTitle,
      links: enhancedLinks,
      theme: multiUrlData.theme,
      seo: multiUrlData.seo,
      socialMedia: multiUrlData.socialMedia,
      features: multiUrlData.features,
      analytics: multiUrlData.analytics,
    };

    // Handle link clicks
    const handleLinkClick = async (linkId: string) => {
      "use server";

      try {
        // Track link click
        await db.insert(analyticsEvents).values({
          id: nanoid(),
          qrCodeId: qrCode.id,
          eventType: "click",
          timestamp: new Date(),
          metadata: JSON.stringify({
            linkId,
            pageType: "multi_url_landing",
            actionType: "link_click",
          }),
        });

        // Update link click count in QR code data
        const updatedData = { ...qrCode.data };
        if (updatedData.multiUrl?.links) {
          const linkIndex = updatedData.multiUrl.links.findIndex(
            (l) => l.id === linkId,
          );
          if (linkIndex !== -1) {
            updatedData.multiUrl.links[linkIndex].clickCount =
              (updatedData.multiUrl.links[linkIndex].clickCount || 0) + 1;
            updatedData.multiUrl.links[linkIndex].lastClicked =
              new Date().toISOString();
          }
        }

        await db
          .update(qrCodes)
          .set({ data: updatedData })
          .where(eq(qrCodes.id, qrCode.id));
      } catch (error) {
        console.error("Link click tracking error:", error);
      }
    };

    // Handle contact form submission
    const handleContactFormSubmit = async (formData: Record<string, any>) => {
      "use server";

      try {
        // Track form submission
        await db.insert(analyticsEvents).values({
          id: nanoid(),
          qrCodeId: qrCode.id,
          eventType: "click",
          timestamp: new Date(),
          metadata: JSON.stringify({
            pageType: "multi_url_landing",
            actionType: "contact_form_submit",
            formData,
          }),
        });

        // In a real implementation, you'd send the form data via email or save to database
        console.log("Contact form submitted:", formData);
      } catch (error) {
        console.error("Contact form submission error:", error);
      }
    };

    // Handle share action
    const handleShare = async () => {
      "use server";

      try {
        // Track share action
        await db.insert(analyticsEvents).values({
          id: nanoid(),
          qrCodeId: qrCode.id,
          eventType: "share",
          timestamp: new Date(),
          metadata: JSON.stringify({
            pageType: "multi_url_landing",
            actionType: "share",
          }),
        });
      } catch (error) {
        console.error("Share tracking error:", error);
      }
    };

    // Generate PWA manifest if enabled
    if (multiUrlData.features?.pwaEnabled) {
      // In a real implementation, you'd generate a manifest.json file
      // For now, we'll skip this feature
    }

    return (
      <MultiUrlLandingPage
        data={landingPageData}
        isPreview={false}
        onLinkClick={handleLinkClick}
        onContactFormSubmit={handleContactFormSubmit}
        onShare={handleShare}
      />
    );
  } catch (error) {
    console.error("Landing page error:", error);

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
}
