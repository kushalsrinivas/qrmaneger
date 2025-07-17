"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";

interface QRCodeCustomizerProps {
  size?: number;
  errorCorrection?: "L" | "M" | "Q" | "H";
  foregroundColor?: string;
  backgroundColor?: string;
  cornerStyle?: string;
  logoUrl?: string;
  logoSize?: number;
  onCustomizationChange?: (customization: {
    size?: number;
    errorCorrection?: "L" | "M" | "Q" | "H";
    foregroundColor?: string;
    backgroundColor?: string;
    cornerStyle?: string;
    logoUrl?: string;
    logoSize?: number;
  }) => void;
}

export function QRCodeCustomizer({
  size = 300,
  errorCorrection = "M",
  foregroundColor = "#000000",
  backgroundColor = "#ffffff",
  cornerStyle = "square",
  logoUrl = "",
  logoSize = 20,
  onCustomizationChange,
}: QRCodeCustomizerProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSizeChange = (newSize: number[]) => {
    const sizeValue = newSize[0];
    onCustomizationChange?.({
      size: sizeValue,
      errorCorrection,
      foregroundColor,
      backgroundColor,
      cornerStyle,
      logoUrl,
      logoSize,
    });
  };

  const handleErrorCorrectionChange = (
    newErrorCorrection: "L" | "M" | "Q" | "H",
  ) => {
    onCustomizationChange?.({
      size,
      errorCorrection: newErrorCorrection,
      foregroundColor,
      backgroundColor,
      cornerStyle,
      logoUrl,
      logoSize,
    });
  };

  const handleForegroundColorChange = (newColor: string) => {
    onCustomizationChange?.({
      size,
      errorCorrection,
      foregroundColor: newColor,
      backgroundColor,
      cornerStyle,
      logoUrl,
      logoSize,
    });
  };

  const handleBackgroundColorChange = (newColor: string) => {
    onCustomizationChange?.({
      size,
      errorCorrection,
      foregroundColor,
      backgroundColor: newColor,
      cornerStyle,
      logoUrl,
      logoSize,
    });
  };

  const handleCornerStyleChange = (newCornerStyle: string) => {
    onCustomizationChange?.({
      size,
      errorCorrection,
      foregroundColor,
      backgroundColor,
      cornerStyle: newCornerStyle,
      logoUrl,
      logoSize,
    });
  };

  const handleLogoSizeChange = (newLogoSize: number[]) => {
    const logoSizeValue = newLogoSize[0];
    onCustomizationChange?.({
      size,
      errorCorrection,
      foregroundColor,
      backgroundColor,
      cornerStyle,
      logoUrl,
      logoSize: logoSizeValue,
    });
  };

  const handleLogoUpload = () => {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLogoFile(file);
        // Create a URL for the file to use as logoUrl
        const logoUrl = URL.createObjectURL(file);
        onCustomizationChange?.({
          size,
          errorCorrection,
          foregroundColor,
          backgroundColor,
          cornerStyle,
          logoUrl,
          logoSize,
        });
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customization</CardTitle>
        <CardDescription>
          Customize the appearance of your QR code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-4">
            <div className="space-y-2">
              <Label>Size: {size}px</Label>
              <Slider
                value={[size]}
                onValueChange={handleSizeChange}
                max={800}
                min={100}
                step={50}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fg-color">Foreground Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="fg-color"
                    type="color"
                    value={foregroundColor}
                    onChange={(e) =>
                      handleForegroundColorChange(e.target.value)
                    }
                    className="h-10 w-12 p-1"
                  />
                  <Input
                    value={foregroundColor}
                    onChange={(e) =>
                      handleForegroundColorChange(e.target.value)
                    }
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) =>
                      handleBackgroundColorChange(e.target.value)
                    }
                    className="h-10 w-12 p-1"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) =>
                      handleBackgroundColorChange(e.target.value)
                    }
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Corner Style</Label>
              <Select
                value={cornerStyle}
                onValueChange={handleCornerStyleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select corner style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="logo" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Logo</Label>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleLogoUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                {logoFile ? logoFile.name : "Choose Image"}
              </Button>
              <p className="text-muted-foreground text-xs">
                Recommended: PNG or SVG, max 2MB
              </p>
            </div>

            <div className="space-y-2">
              <Label>Logo Size (%)</Label>
              <Slider
                value={[logoSize]}
                onValueChange={handleLogoSizeChange}
                max={40}
                min={10}
                step={5}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Error Correction Level</Label>
              <Select
                value={errorCorrection}
                onValueChange={handleErrorCorrectionChange}
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
              <Label>QR Code Version</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="1">Version 1 (21x21)</SelectItem>
                  <SelectItem value="2">Version 2 (25x25)</SelectItem>
                  <SelectItem value="3">Version 3 (29x29)</SelectItem>
                  <SelectItem value="4">Version 4 (33x33)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
