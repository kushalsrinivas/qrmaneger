import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/server/db";
import { qrCodes, analyticsEvents } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { BusinessCardLanding } from "@/components/business-card-landing";
import { headers } from "next/headers";
import crypto from "crypto";

interface PageProps {
  params: Promise<{
    shortCode: string;
  }>;
}

// ================================
// METADATA GENERATION
// ================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { shortCode } = resolvedParams;

  // Get QR code data
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(
      qrCodes.dynamicUrl,
      `${process.env.NEXT_PUBLIC_BASE_URL}/q/${shortCode}`,
    ),
  });

  if (!qrCode || qrCode.type !== "vcard" || !qrCode.data?.vcard) {
    return {
      title: "Not Found",
      description: "The requested business card could not be found.",
    };
  }

  const vcard = qrCode.data.vcard;
  const fullName = [vcard.firstName, vcard.middleName, vcard.lastName]
    .filter(Boolean)
    .join(" ");

  const title = `${fullName} - Digital Business Card`;
  const description = vcard.bio || `Contact information for ${fullName}`;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/card/${shortCode}`;

  return {
    title,
    description,

    // Open Graph
    openGraph: {
      title,
      description,
      url,
      siteName: "MojoQR",
      type: "profile",
      images: vcard.profileImage
        ? [
            {
              url: vcard.profileImage,
              width: 400,
              height: 400,
              alt: fullName,
            },
          ]
        : [],
    },

    // Twitter Card
    twitter: {
      card: "summary",
      title,
      description,
      images: vcard.profileImage ? [vcard.profileImage] : [],
    },

    // Additional meta tags
    other: {
      "theme-color": "#2563eb", // Blue theme for business cards
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

async function trackPageView(qrCodeId: string) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? "";
    const referer = headersList.get("referer") ?? "";
    const ipAddress =
      headersList.get("x-forwarded-for") ??
      headersList.get("x-real-ip") ??
      "unknown";

    // Generate session ID
    const sessionId = generateSessionId(ipAddress, userAgent);

    // Parse device information
    const deviceInfo = parseUserAgent(userAgent);

    // Record analytics event
    await db.insert(analyticsEvents).values({
      qrCodeId,
      eventType: "view",
      sessionId,
      data: {
        userAgent,
        device: deviceInfo,
        ip: ipAddress,
        referrer: referer,
        referrerDomain: referer ? new URL(referer).hostname : undefined,
        customData: {
          pageType: "business_card",
          viewType: "page_view",
        },
      },
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
  const hash = crypto
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
    type: isDesktop ? "desktop" : isTablet ? "tablet" : "mobile",
    os,
    browser,
    version: "Unknown",
  };
}

// ================================
// MAIN PAGE COMPONENT
// ================================

export default async function BusinessCardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { shortCode } = resolvedParams;

  try {
    // Get QR code data
    const qrCode = await db.query.qrCodes.findFirst({
      where: eq(
        qrCodes.dynamicUrl,
        `${process.env.NEXT_PUBLIC_BASE_URL}/q/${shortCode}`,
      ),
      with: {
        user: true,
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
              Business Card Unavailable
            </h1>
            <p className="text-gray-600">
              This business card is currently inactive.
            </p>
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
              Business Card Expired
            </h1>
            <p className="text-gray-600">
              This business card has expired and is no longer available.
            </p>
          </div>
        </div>
      );
    }

    // Check if it's a vCard QR code
    if (qrCode.type !== "vcard" || !qrCode.data?.vcard) {
      notFound();
    }

    const vcard = qrCode.data.vcard;

    // Track page view
    await trackPageView(qrCode.id);

    return (
      <BusinessCardLanding
        vcard={vcard}
        qrCodeUrl={qrCode.imageUrl || undefined}
      />
    );
  } catch (error) {
    console.error("Business card page error:", error);

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
