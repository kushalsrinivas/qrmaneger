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

const recentCodes = [
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
    location: "London, United Kingdom",
    created: "Jan 20, 16:20",
    status: "mobile",
    device: "mobile",
  },
  {
    id: 4,
    name: "Unknown QR Code",
    type: "URL",
    scans: 0,
    location: "Toronto, Canada",
    created: "Jan 20, 15:45",
    status: "desktop",
    device: "desktop",
  },
  {
    id: 5,
    name: "Unknown QR Code",
    type: "Event",
    scans: 0,
    location: "New York, United States",
    created: "Jan 15, 14:30",
    status: "mobile",
    device: "mobile",
  },
  {
    id: 6,
    name: "Unknown QR Code",
    type: "PDF",
    scans: 0,
    location: "London, United Kingdom",
    created: "Jan 15, 14:45",
    status: "desktop",
    device: "desktop",
  },
  {
    id: 7,
    name: "Unknown QR Code",
    type: "URL",
    scans: 0,
    location: "Toronto, Canada",
    created: "Jan 15, 13:50",
    status: "mobile",
    device: "mobile",
  },
];

const getDeviceIcon = (device: string) => {
  switch (device) {
    case "mobile":
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    case "tablet":
      return <Tablet className="h-4 w-4 text-green-500" />;
    case "desktop":
      return <Monitor className="h-4 w-4 text-purple-500" />;
    default:
      return <QrCode className="h-4 w-4 text-gray-500" />;
  }
};

const getDeviceBadgeColor = (device: string) => {
  switch (device) {
    case "mobile":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "tablet":
      return "bg-green-50 text-green-700 border-green-200";
    case "desktop":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export function RecentQRCodes() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest QR code interactions and scans
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recentCodes.map((code) => (
            <div
              key={code.id}
              className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 transition-colors hover:bg-gray-100/50"
            >
              <div className="flex items-center space-x-4">
                <div className="rounded-lg border bg-white p-2 shadow-sm">
                  {getDeviceIcon(code.device)}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{code.name}</p>
                    <Badge
                      variant="secondary"
                      className={`px-2 py-0.5 text-xs ${getDeviceBadgeColor(code.device)}`}
                    >
                      {code.device}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                    <span>{code.location}</span>
                    <span>•</span>
                    <span>{code.created}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                    <Eye className="h-3 w-3" />
                    <span>{code.scans}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    >
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
