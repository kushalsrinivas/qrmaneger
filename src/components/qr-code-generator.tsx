"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QRCodeGeneratorProps {
  data: any;
  type: string;
  mode?: "static" | "dynamic";
  shouldGenerate?: boolean;
  onGenerationComplete?: () => void;
  options?: {
    errorCorrection?: "L" | "M" | "Q" | "H";
    size?: number;
    format?: "png" | "svg" | "jpeg" | "pdf";
    customization?: {
      foregroundColor?: string;
      backgroundColor?: string;
      cornerStyle?: string;
      patternStyle?: string;
      logoUrl?: string;
      logoSize?: number;
      logoPosition?: string;
    };
  };
  metadata?: {
    name?: string;
    description?: string;
    folderId?: string;
    templateId?: string;
    tags?: string[];
    expiresAt?: Date;
  };
}

export function QRCodeGenerator({
  data,
  type,
  mode = "static",
  shouldGenerate = true,
  onGenerationComplete,
  options = {},
  metadata = {},
}: QRCodeGeneratorProps) {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [shortUrl, setShortUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<any>(null);

  const generateQRMutation = api.qr.create.useMutation({
    onSuccess: (result) => {
      setQrCodeUrl(result.qrCodeUrl);
      setShortUrl(result.shortUrl || "");
      setGeneratedQRCode(result);
      setIsGenerating(false);
      toast.success("QR code created successfully!");
      onGenerationComplete?.();

      // Redirect to codes page after successful generation
      setTimeout(() => {
        router.push("/codes");
      }, 1500);
    },
    onError: (error) => {
      console.error("QR generation failed:", error);
      setIsGenerating(false);
      toast.error(error.message || "Failed to create QR code");
    },
  });

  const updateDynamicQRMutation = api.qr.updateDynamic.useMutation({
    onSuccess: () => {
      toast.success("Dynamic QR code updated successfully!");
      onGenerationComplete?.();
    },
    onError: (error) => {
      console.error("Dynamic QR update failed:", error);
      toast.error(error.message || "Failed to update dynamic QR code");
    },
  });

  // Transform raw data into proper QR code data structure
  const transformDataForQRType = (rawData: any, qrType: string) => {
    if (!rawData) return {};

    switch (qrType) {
      case "url":
        return typeof rawData === "string" ? { url: rawData } : rawData;
      case "text":
        return typeof rawData === "string" ? { text: rawData } : rawData;
      case "phone":
        return typeof rawData === "string" ? { phone: rawData } : rawData;
      case "vcard":
        return rawData.vcard ? rawData : { vcard: rawData };
      case "wifi":
        return rawData.wifi ? rawData : { wifi: rawData };
      case "sms":
        return rawData.sms ? rawData : { sms: rawData };
      case "email":
        return rawData.email ? rawData : { email: rawData };
      case "location":
        return rawData.location ? rawData : { location: rawData };
      case "event":
        return rawData.event ? rawData : { event: rawData };
      case "app_download":
        return rawData.appDownload ? rawData : { appDownload: rawData };
      case "multi_url":
        return rawData.multiUrl ? rawData : { multiUrl: rawData };
      case "menu":
        return rawData.menu ? rawData : { menu: rawData };
      case "payment":
        return rawData.payment ? rawData : { payment: rawData };
      case "pdf":
        return rawData.pdf ? rawData : { pdf: rawData };
      case "image":
        return rawData.image ? rawData : { image: rawData };
      case "video":
        return rawData.video ? rawData : { video: rawData };
      default:
        return rawData;
    }
  };

  const generateQRCode = async () => {
    if (!data || !type) return;

    setIsGenerating(true);

    try {
      // Transform the data into the proper structure
      const transformedData = transformDataForQRType(data, type);

      await generateQRMutation.mutateAsync({
        type: type as any,
        mode,
        data: transformedData,
        options: {
          errorCorrection: options.errorCorrection || "M",
          size: options.size || 512,
          format: options.format || "png",
          customization: options.customization,
        },
        metadata,
      });
    } catch (error) {
      console.error("QR generation error:", error);
    }
  };

  // Auto-generate when data changes
  useEffect(() => {
    if (data && type && shouldGenerate) {
      generateQRCode();
    }
  }, [data, type, mode, shouldGenerate]);

  const downloadQR = (format: string = "png") => {
    if (qrCodeUrl) {
      try {
        const link = document.createElement("a");
        link.download = `qr-code-${type}.${format}`;
        link.href = qrCodeUrl;
        link.click();
        toast.success(`QR code downloaded as ${format.toUpperCase()}!`);
      } catch (error) {
        toast.error(`Failed to download QR code`);
      }
    } else {
      toast.error("QR code not ready for download");
    }
  };

  const copyToClipboard = async (text: string, type: string = "text") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(`Failed to copy ${type.toLowerCase()} to clipboard`);
    }
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        await navigator.share({
          title: `QR Code - ${type}`,
          text: `Check out this QR code`,
          url: shortUrl || qrCodeUrl,
        });
      } catch (error) {
        console.error("Failed to share:", error);
        copyToClipboard(shortUrl || qrCodeUrl, "QR code URL");
      }
    } else {
      copyToClipboard(shortUrl || qrCodeUrl, "QR code URL");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Preview</CardTitle>
        <CardDescription>
          {isGenerating
            ? "Generating your QR code..."
            : "Your generated QR code is ready for download"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {isGenerating ? (
            <div className="bg-muted flex h-[300px] w-[300px] items-center justify-center rounded-lg border">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${type}`}
              className="max-h-[300px] max-w-[300px] rounded-lg border"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-[300px] w-[300px] items-center justify-center rounded-lg border">
              No QR code generated
            </div>
          )}
        </div>

        {qrCodeUrl && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR("png")}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR("svg")}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR("pdf")}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={shareQRCode}
                disabled={isGenerating}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(shortUrl || qrCodeUrl)}
                disabled={isGenerating}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>

            {shortUrl && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium">Short URL:</p>
                <p className="text-muted-foreground text-sm break-all">
                  {shortUrl}
                </p>
              </div>
            )}

            {generatedQRCode && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium">QR Code Details:</p>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>Type: {generatedQRCode.metadata.type}</p>
                  <p>Mode: {generatedQRCode.metadata.mode}</p>
                  <p>Size: {generatedQRCode.metadata.size}px</p>
                  <p>Format: {generatedQRCode.metadata.format}</p>
                  <p>
                    Error Correction: {generatedQRCode.metadata.errorCorrection}
                  </p>
                  <p>Version: {generatedQRCode.metadata.version}</p>
                  <p>
                    File Size:{" "}
                    {Math.round(generatedQRCode.metadata.fileSize / 1024)}KB
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {data && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm font-medium">Content:</p>
            <p className="text-muted-foreground text-sm break-all">
              {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
