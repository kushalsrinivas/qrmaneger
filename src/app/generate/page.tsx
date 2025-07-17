"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { QRCodeCustomizer } from "@/components/qr-code-customizer";

export default function GeneratePage() {
  const [qrType, setQrType] = useState("url");
  const [isDynamic, setIsDynamic] = useState(true);
  const [qrData, setQrData] = useState("");
  const [shouldGenerate, setShouldGenerate] = useState(false);

  // Customization state
  const [customization, setCustomization] = useState({
    size: 512,
    errorCorrection: "M" as "L" | "M" | "Q" | "H",
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    cornerStyle: "square",
    logoUrl: "",
    logoSize: 20,
  });

  const handleGenerateClick = () => {
    if (qrData.trim()) {
      setShouldGenerate(true);
    }
  };

  const handleCustomizationChange = (
    newCustomization: Partial<typeof customization>,
  ) => {
    setCustomization((prev) => ({ ...prev, ...newCustomization }));
    // Re-generate QR code with new customization if data exists
    if (qrData.trim()) {
      setShouldGenerate(true);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Generate QR Code</h1>
        <p className="text-muted-foreground">
          Create and customize QR codes for various purposes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Configuration</CardTitle>
              <CardDescription>
                Select the type and enter the data for your QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-type">QR Code Type</Label>
                <Select value={qrType} onValueChange={setQrType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select QR code type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL / Website</SelectItem>
                    <SelectItem value="vcard">vCard (Business Card)</SelectItem>
                    <SelectItem value="wifi">WiFi Network</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="menu">Restaurant Menu</SelectItem>
                    <SelectItem value="event">Calendar Event</SelectItem>
                    <SelectItem value="payment">Payment (UPI)</SelectItem>
                    <SelectItem value="multiurl">Multi-URL Landing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="dynamic-mode"
                  checked={isDynamic}
                  onCheckedChange={setIsDynamic}
                />
                <Label htmlFor="dynamic-mode">Dynamic QR Code</Label>
              </div>
              {isDynamic && (
                <p className="text-muted-foreground text-xs">
                  Dynamic QR codes can be edited after creation and provide
                  analytics
                </p>
              )}

              <Tabs value={qrType} className="w-full">
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="vcard" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Acme Inc" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 234 567 8900" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="john@example.com" />
                  </div>
                </TabsContent>

                <TabsContent value="wifi" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssid">Network Name (SSID)</Label>
                    <Input id="ssid" placeholder="MyWiFiNetwork" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="password123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="security">Security Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select security type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WPA">WPA/WPA2</SelectItem>
                        <SelectItem value="WEP">WEP</SelectItem>
                        <SelectItem value="nopass">No Password</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-content">Text Content</Label>
                    <Textarea
                      id="text-content"
                      placeholder="Enter your text here..."
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                className="w-full"
                onClick={handleGenerateClick}
                disabled={!qrData.trim()}
              >
                Generate QR Code
              </Button>
            </CardContent>
          </Card>

          <QRCodeCustomizer
            size={customization.size}
            errorCorrection={customization.errorCorrection}
            foregroundColor={customization.foregroundColor}
            backgroundColor={customization.backgroundColor}
            cornerStyle={customization.cornerStyle}
            logoUrl={customization.logoUrl}
            logoSize={customization.logoSize}
            onCustomizationChange={handleCustomizationChange}
          />
        </div>

        <div className="space-y-6">
          <QRCodeGenerator
            data={qrData}
            type={qrType}
            mode={isDynamic ? "dynamic" : "static"}
            shouldGenerate={shouldGenerate}
            onGenerationComplete={() => setShouldGenerate(false)}
            options={{
              errorCorrection: customization.errorCorrection,
              size: customization.size,
              format: "png",
              customization: {
                foregroundColor: customization.foregroundColor,
                backgroundColor: customization.backgroundColor,
                cornerStyle: customization.cornerStyle,
                logoUrl: customization.logoUrl,
                logoSize: customization.logoSize,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
