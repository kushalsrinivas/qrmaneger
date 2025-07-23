import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  MoreHorizontal,
  QrCode,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const RecentQRCodes = React.memo(function RecentQRCodes() {
  const recentCodes = useMemo(
    () => [
      {
        id: 1,
        name: "Unknown QR Code",
        type: "URL",
        scans: 0,
        location: "Berlin, Germany",
        created: "Jan 20, 18:30",
        status: "tablet",
        device: "tablet",
      },
      {
        id: 2,
        name: "Unknown QR Code",
        type: "vCard",
        scans: 0,
        location: "Sydney, Australia",
        created: "Jan 20, 17:10",
        status: "desktop",
        device: "desktop",
      },
      {
        id: 3,
        name: "Unknown QR Code",
        type: "WiFi",
        scans: 0,
        location: "Tokyo, Japan",
        created: "Jan 20, 16:45",
        status: "mobile",
        device: "mobile",
      },
      {
        id: 4,
        name: "Unknown QR Code",
        type: "Email",
        scans: 0,
        location: "New York, USA",
        created: "Jan 20, 15:20",
        status: "desktop",
        device: "desktop",
      },
      {
        id: 5,
        name: "Unknown QR Code",
        type: "SMS",
        scans: 0,
        location: "London, UK",
        created: "Jan 20, 14:30",
        status: "mobile",
        device: "mobile",
      },
    ],
    [],
  );

  const getDeviceIcon = useMemo(() => {
    function DeviceIcon(device: string) {
      switch (device) {
        case "mobile":
          return <Smartphone className="h-4 w-4" />;
        case "tablet":
          return <Tablet className="h-4 w-4" />;
        case "desktop":
          return <Monitor className="h-4 w-4" />;
        default:
          return <Monitor className="h-4 w-4" />;
      }
    }
    return DeviceIcon;
  }, []);

  const getTypeBadgeColor = useMemo(() => {
    function TypeBadgeColor(type: string) {
      switch (type.toLowerCase()) {
        case "url":
          return "bg-blue-100 text-blue-800";
        case "vcard":
          return "bg-green-100 text-green-800";
        case "wifi":
          return "bg-purple-100 text-purple-800";
        case "email":
          return "bg-orange-100 text-orange-800";
        case "sms":
          return "bg-pink-100 text-pink-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
    return TypeBadgeColor;
  }, []);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              <QrCode className="mr-2 h-5 w-5 text-green-500" />
              Recent QR Codes
            </CardTitle>
            <CardDescription>Your latest QR code activity</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {recentCodes.map((code, index) => (
            <div
              key={code.id}
              className={`flex items-center justify-between p-4 ${
                index !== recentCodes.length - 1
                  ? "border-b border-gray-100"
                  : ""
              } transition-colors hover:bg-gray-50`}
            >
              <div className="flex items-center space-x-4">
                {/* QR Code Placeholder */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <QrCode className="h-6 w-6 text-gray-400" />
                </div>

                {/* QR Code Info */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{code.name}</h4>
                    <Badge className={getTypeBadgeColor(code.type)}>
                      {code.type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{code.scans} scans</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getDeviceIcon(code.device)}
                      <span>{code.location}</span>
                    </div>
                    <span>{code.created}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Download</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="border-t border-gray-100 p-4">
          <Button variant="ghost" className="w-full">
            View All QR Codes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
