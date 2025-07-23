import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QrCode,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const QRCodeStats = React.memo(function QRCodeStats() {
  const stats = useMemo(
    () => [
      {
        title: "Total QR Codes",
        value: "10",
        change: "+12%",
        trend: "up",
        icon: QrCode,
        color: "bg-blue-500",
        lightColor: "bg-blue-50",
        textColor: "text-blue-600",
      },
      {
        title: "Total Scans",
        value: "663",
        change: "+8.2%",
        trend: "up",
        icon: Eye,
        color: "bg-green-500",
        lightColor: "bg-green-50",
        textColor: "text-green-600",
      },
      {
        title: "Active QR Codes",
        value: "10",
        change: "+5.4%",
        trend: "up",
        icon: TrendingUp,
        color: "bg-orange-500",
        lightColor: "bg-orange-50",
        textColor: "text-orange-600",
      },
      {
        title: "Recent Scans",
        value: "0",
        change: "+15.3%",
        trend: "up",
        icon: MousePointer,
        color: "bg-purple-500",
        lightColor: "bg-purple-50",
        textColor: "text-purple-600",
      },
    ],
    [],
  );

  return (
    <>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

        return (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.lightColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <TrendIcon
                  className={`mr-1 h-3 w-3 ${
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
});
