import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { qrCodes } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { convertDataToQRString } from "@/lib/qr-handlers";
import QRCode from "qrcode";

/**
 * Serves QR code images
 * GET /api/qr/image/[qrCodeId].[format]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  try {
    // Extract qrCodeId and format from the filename
    const filename = params.qrCodeId;
    const parts = filename.split('.');
    const qrCodeId = parts[0];
    const format = parts[1] || 'png';

    if (!qrCodeId) {
      return new NextResponse("QR Code ID is required", { status: 400 });
    }

    // Get the QR code from database
    const qrCode = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, qrCodeId),
      with: {
        user: true,
      },
    });

    if (!qrCode) {
      return new NextResponse("QR code not found", { status: 404 });
    }

    // Check if QR code is active
    if (qrCode.status !== "active") {
      return new NextResponse("QR code is inactive", { status: 403 });
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return new NextResponse("QR code has expired", { status: 410 });
    }

    // Get session to check access permissions
    const session = await auth();
    
    // For now, allow public access to QR code images
    // In the future, you might want to implement privacy controls
    
    // Generate the QR code image buffer by recreating it
    const buffer = await regenerateQRCodeBuffer(qrCode);

    if (!buffer) {
      return new NextResponse("Failed to generate QR code image", { status: 500 });
    }

    // Set appropriate headers based on format
    const mimeType = getMimeType(format);
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': `"${qrCodeId}-${qrCode.updatedAt?.getTime() || qrCode.createdAt.getTime()}"`,
      },
    });

  } catch (error) {
    console.error("Error serving QR code image:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

/**
 * Regenerates QR code buffer from database record
 */
async function regenerateQRCodeBuffer(qrCode: any): Promise<Buffer | null> {
  try {
    // Determine content to encode
    let contentToEncode: string;
    
    if (qrCode.isDynamic && qrCode.dynamicUrl) {
      contentToEncode = qrCode.dynamicUrl;
    } else {
      contentToEncode = convertDataToQRString(qrCode.type, qrCode.data);
    }

    // Generate QR code based on format
    if (qrCode.format === 'svg') {
      const svg = await QRCode.toString(contentToEncode, {
        type: 'svg',
        width: qrCode.size || 512,
        margin: 2,
        color: {
          dark: qrCode.style?.foregroundColor || '#000000',
          light: qrCode.style?.backgroundColor || '#ffffff',
        },
        errorCorrectionLevel: qrCode.errorCorrection || 'M',
      });
      return Buffer.from(svg, 'utf8');
    } else {
      const buffer = await QRCode.toBuffer(contentToEncode, {
        type: 'png',
        width: qrCode.size || 512,
        margin: 2,
        color: {
          dark: qrCode.style?.foregroundColor || '#000000',
          light: qrCode.style?.backgroundColor || '#ffffff',
        },
        errorCorrectionLevel: qrCode.errorCorrection || 'M',
      });
      return buffer;
    }
  } catch (error) {
    console.error('Error regenerating QR code buffer:', error);
    return null;
  }
}

/**
 * Gets the MIME type for a given format
 */
function getMimeType(format: string): string {
  switch (format.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'image/png';
  }
} 