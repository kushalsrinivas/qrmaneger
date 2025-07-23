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
  ArrowRight,
} from "lucide-react";

const quickActions = [
  {
    name: "Create QR Code",
    icon: QrCode,
    description: "Generate a new QR code",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    name: "Browse Templates",
    icon: FileText,
    description: "Use pre-made templates",
    color: "bg-green-500",
    lightColor: "bg-green-50",
    textColor: "text-green-600",
  },
  {
    name: "View Analytics",
    icon: Calendar,
    description: "Check performance data",
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    name: "Manage Library",
    icon: CreditCard,
    description: "Organize your QR codes",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
];

export function QuickActions() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              <span className="mr-2">⚡</span>
              Quick Actions
            </CardTitle>
            <CardDescription>Jump to common tasks and features</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.name}
              variant="ghost"
              className="h-auto justify-between rounded-lg border-0 bg-gray-50/50 p-4 transition-colors hover:bg-gray-100/50"
            >
              <div className="flex items-center">
                <div className={`mr-4 rounded-lg p-2 ${action.lightColor}`}>
                  <action.icon className={`h-5 w-5 ${action.textColor}`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{action.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {action.description}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
