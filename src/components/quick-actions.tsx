import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Link,
  CreditCard,
  Wifi,
  FileText,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

const quickActions = [
  { name: "URL", icon: Link, description: "Create a link QR code" },
  { name: "vCard", icon: CreditCard, description: "Digital business card" },
  { name: "WiFi", icon: Wifi, description: "Share WiFi credentials" },
  { name: "PDF", icon: FileText, description: "Link to PDF document" },
  { name: "Event", icon: Calendar, description: "Calendar event QR" },
  { name: "Email", icon: Mail, description: "Pre-filled email" },
  { name: "SMS", icon: Phone, description: "Pre-filled text message" },
  { name: "Menu", icon: QrCode, description: "Restaurant menu" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Generate popular QR code types instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.name}
            variant="ghost"
            className="h-auto justify-start p-3"
          >
            <action.icon className="mr-3 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">{action.name}</div>
              <div className="text-muted-foreground text-xs">
                {action.description}
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
