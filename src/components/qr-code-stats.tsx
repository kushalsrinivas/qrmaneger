import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Eye, MousePointer, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total QR Codes",
    value: "2,847",
    change: "+12%",
    icon: QrCode,
  },
  {
    title: "Total Scans",
    value: "45,231",
    change: "+23%",
    icon: Eye,
  },
  {
    title: "Unique Scans",
    value: "32,891",
    change: "+18%",
    icon: MousePointer,
  },
  {
    title: "Scan Rate",
    value: "72.7%",
    change: "+5.2%",
    icon: TrendingUp,
  },
];

export function QRCodeStats() {
  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-muted-foreground text-xs">
              <span className="text-green-600">{stat.change}</span> from last
              month
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
