import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QrCode,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const stats = [
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
];

export function QRCodeStats() {
  return (
    <>
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="relative overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${stat.lightColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="mt-1 flex items-center text-xs">
              {stat.trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span
                className={
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground ml-1">
                from last month
              </span>
            </div>
          </CardContent>
          {/* Decorative gradient line */}
          <div
            className={`absolute right-0 bottom-0 left-0 h-1 ${stat.color}`}
          ></div>
        </Card>
      ))}
    </>
  );
}
