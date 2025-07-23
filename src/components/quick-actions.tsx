import React, { useMemo } from "react";
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

export const QuickActions = React.memo(function QuickActions() {
  const quickActions = useMemo(
    () => [
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
    ],
    [],
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <ArrowRight className="mr-2 h-5 w-5 text-blue-500" />
          Quick Actions
        </CardTitle>
        <CardDescription>Get started with common tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.name}
              variant="ghost"
              className="h-auto w-full justify-start p-4 hover:bg-gray-50"
            >
              <div className="flex w-full items-center space-x-3">
                <div className={`rounded-lg p-2 ${action.lightColor}`}>
                  <IconComponent className={`h-5 w-5 ${action.textColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{action.name}</div>
                  <div className="text-sm text-gray-500">
                    {action.description}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
});
